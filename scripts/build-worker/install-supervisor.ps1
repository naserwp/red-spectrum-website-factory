param([switch]$Install)
$ErrorActionPreference = 'Stop'
$workerCheckout = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$workerNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$workerEnvironment = Join-Path $workerCheckout '.env.worker.local'
if (!(Test-Path -LiteralPath $workerNode) -or !(Test-Path -LiteralPath $workerEnvironment)) {
    throw 'Node 24 and the private worker environment must be configured first.'
}
& $workerNode --env-file=$workerEnvironment (Join-Path $PSScriptRoot 'run.mjs') --check
if ($LASTEXITCODE -ne 0) { throw 'Worker configuration check failed.' }
$workerTaskName = 'RS WebFactory Build Worker'
if (!$Install) {
    Write-Output 'Configuration checked. Use -Install after the control-plane release and queue scope are approved.'
    return
}
if (Get-ScheduledTask -TaskName $workerTaskName -ErrorAction SilentlyContinue) {
    throw 'Existing task found; inspect it rather than silently replacing its configuration.'
}
$workerAccount = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$workerAction = New-ScheduledTaskAction -Execute $workerNode -Argument ('--env-file="' + $workerEnvironment + '" "' + (Join-Path $PSScriptRoot 'supervisor.mjs') + '"') -WorkingDirectory $workerCheckout
$workerTrigger = New-ScheduledTaskTrigger -AtLogOn -User $workerAccount
$workerPrincipal = New-ScheduledTaskPrincipal -UserId $workerAccount -LogonType Interactive -RunLevel Limited
$workerSettings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable -RunOnlyIfNetworkAvailable
Register-ScheduledTask -TaskName $workerTaskName -Action $workerAction -Trigger $workerTrigger -Principal $workerPrincipal -Settings $workerSettings -Description 'Poll approved website jobs; preserve separate production and customer approval gates.' | Out-Null
Write-Output 'Supervisor installed. It starts at the next sign-in; use Start-ScheduledTask for a separately reviewed immediate start.'
