param([string]$BrowserCli, [string]$BaseUrl = 'http://localhost:3004')
$routes = @(@{name='landing';path='/'})
foreach ($id in @('forge','ledger','stillwater')) {
  foreach ($page in @('home','services','about','contact','privacy')) {
    $suffix = if ($page -eq 'home') { '' } else { "/$page" }
    $name = if ($page -eq 'home') { $id } else { "$id-$page" }
    $routes += @{name=$name;path="/templates/$id$suffix"}
  }
}
$results=@()
$contrast=@()
foreach ($size in @(@('desktop',1440,1000),@('mobile',390,844))) {
  node $BrowserCli --session rs-branding set viewport $size[1] $size[2]
  foreach ($route in $routes) {
    node $BrowserCli --session rs-branding open "$BaseUrl$($route.path)"
    $audit=Get-Content "$PSScriptRoot/audit.js" -Raw | node $BrowserCli --session rs-branding eval --stdin
    $results+=($audit | ConvertFrom-Json)
    $check=Get-Content "$PSScriptRoot/contrast.js" -Raw | node $BrowserCli --session rs-branding eval --stdin
    $contrast+=($check | ConvertFrom-Json)
    node $BrowserCli --session rs-branding screenshot "$PSScriptRoot/$($route.name)-$($size[0]).png" --full
  }
}
$results | ConvertTo-Json -Depth 8 | Out-File "$PSScriptRoot/audit-results.json" -Encoding utf8
$contrast | ConvertTo-Json -Depth 8 | Out-File "$PSScriptRoot/contrast-results.json" -Encoding utf8
$results | Select-Object path,viewport,overflow,correctFavicon,faviconStatus,headerLogo,footerLogo | Format-Table
$contrast | Where-Object {$_.failures.Count -gt 0} | ConvertTo-Json -Depth 8
