$ErrorActionPreference = "Stop"
$statusPath = Join-Path $PSScriptRoot "FINAL_STATUS.json"
if (-not (Test-Path $statusPath)) { Write-Error "Missing FINAL_STATUS.json"; exit 2 }
$status = Get-Content $statusPath -Raw | ConvertFrom-Json
$failures = @()
$passes = @()
$exempt = @()
foreach ($prop in $status.gates.PSObject.Properties) {
  $name = $prop.Name
  $gate = $prop.Value
  $s = [string]$gate.status
  $evidence = [string]$gate.evidence
  if ($s -eq "PHYSICAL_REQUIRED" -or $s -eq "OPTIONAL") {
    $exempt += [pscustomobject]@{ Gate=$name; Status=$s; Evidence=$evidence }
    continue
  }
  if ($s -ne "PASS") {
    $failures += [pscustomobject]@{ Gate=$name; Status=$s; Evidence=$evidence }
    continue
  }
  if ([string]::IsNullOrWhiteSpace($evidence)) {
    $failures += [pscustomobject]@{ Gate=$name; Status="PASS_WITHOUT_EVIDENCE"; Evidence="" }
    continue
  }
  $passes += [pscustomobject]@{ Gate=$name; Status=$s; Evidence=$evidence }
}
Write-Host ""
Write-Host "ColdLoop completion status" -ForegroundColor Cyan
Write-Host ("PASS: {0}" -f $passes.Count)
Write-Host ("EXEMPT/PHYSICAL: {0}" -f $exempt.Count)
Write-Host ("NOT COMPLETE: {0}" -f $failures.Count)
if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Blocking gates:" -ForegroundColor Yellow
  $failures | Format-Table -AutoSize
  exit 1
}
Write-Host ""
Write-Host "All non-physical/required gates are PASS with evidence." -ForegroundColor Green
exit 0
