$root = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$root\.venv\Scripts\pio.exe" device monitor -d "$root\firmware" -b 115200
