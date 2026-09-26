$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$root\.venv\Scripts\pio.exe" run -d "$root\firmware" -e hardware -t upload
