$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$root\.venv\Scripts\pio.exe" run -d "$root\firmware" -e hardware
& "$root\.venv\Scripts\pio.exe" run -d "$root\firmware" -e wokwi
Push-Location "$root\app"
try { npm test } finally { Pop-Location }
Write-Host "ColdLoop builds/tests passed." -ForegroundColor Green
