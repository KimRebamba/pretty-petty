Set-Location 'C:\Users\Kim\Desktop\pretty-petty\public\js'
$files = @('admin-dashboard.js','admin-products.js','admin-categories.js','admin-users.js','admin-reviews.js','admin-orders.js')
foreach ($f in $files) {
    $content = Get-Content $f -Raw
    $lines = $content -split "`n"
    $filtered = $lines | Where-Object { $_ -notmatch '^\s*//' }
    $filtered -join "`n" | Set-Content $f -NoNewline
    Write-Host "$f done"
}
