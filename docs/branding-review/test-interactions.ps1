param([string]$BrowserCli, [string]$BaseUrl = 'http://localhost:3002')
$results = @()
foreach ($id in @('forge', 'ledger', 'stillwater')) {
  node $BrowserCli --session rs-interactions set viewport 390 844
  node $BrowserCli --session rs-interactions open "$BaseUrl/templates/$id"
  node $BrowserCli --session rs-interactions focus '.tp-mobile-nav summary'
  node $BrowserCli --session rs-interactions press Enter
  $menu = 'document.querySelector(".tp-mobile-nav").open' | node $BrowserCli --session rs-interactions eval --stdin
  node $BrowserCli --session rs-interactions click '.tp-mobile-nav a[href$="/services"]'
  node $BrowserCli --session rs-interactions focus '.tp-faq details:first-child summary'
  node $BrowserCli --session rs-interactions press Enter
  $faq = Get-Content "$PSScriptRoot/interaction-state.js" -Raw | node $BrowserCli --session rs-interactions eval --stdin
  node $BrowserCli --session rs-interactions open "$BaseUrl/templates/$id/contact"
  $empty = Get-Content "$PSScriptRoot/interaction-state.js" -Raw | node $BrowserCli --session rs-interactions eval --stdin
  node $BrowserCli --session rs-interactions fill '[name="name"]' 'Preview Test'
  node $BrowserCli --session rs-interactions fill '[name="email"]' 'preview@example.invalid'
  node $BrowserCli --session rs-interactions fill '[name="phone"]' '0000000000'
  node $BrowserCli --session rs-interactions fill '[name="service"]' 'Design test only'
  node $BrowserCli --session rs-interactions fill '[name="message"]' 'Testing disabled delivery. Not a real enquiry.'
  $noConsent = Get-Content "$PSScriptRoot/interaction-state.js" -Raw | node $BrowserCli --session rs-interactions eval --stdin
  node $BrowserCli --session rs-interactions check '[name="consent"]'
  node $BrowserCli --session rs-interactions focus 'form button'
  node $BrowserCli --session rs-interactions press Enter
  node $BrowserCli --session rs-interactions wait '[role="alert"]'
  $submitted = Get-Content "$PSScriptRoot/interaction-state.js" -Raw | node $BrowserCli --session rs-interactions eval --stdin
  node $BrowserCli --session rs-interactions screenshot "$PSScriptRoot/$id-form-disabled-mobile.png" --full
  $results += @{template=$id; menuOpen=($menu | ConvertFrom-Json); faq=($faq | ConvertFrom-Json); empty=($empty | ConvertFrom-Json); withoutConsent=($noConsent | ConvertFrom-Json); submitted=($submitted | ConvertFrom-Json)}
}
$results | ConvertTo-Json -Depth 8 | Out-File "$PSScriptRoot/interaction-results.json" -Encoding utf8
$results | ConvertTo-Json -Depth 8
