$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$root\app"
python -m http.server 4173 --bind 0.0.0.0
