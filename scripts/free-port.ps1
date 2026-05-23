param(
  # Local npm backend default (Docker full stack uses 5000 - do not free that port)
  [int]$Port = 5001,
  [switch]$Force
)

$dockerLike = @('docker', 'com.docker', 'wsl', 'wslrelay', 'vpnkit', 'vmwp', 'vmmem', 'limactl')

function Test-DockerLikeProcess([string]$processName) {
  foreach ($pattern in $dockerLike) {
    if ($processName -like "*$pattern*") { return $true }
  }
  return $false
}

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $connections) {
  Write-Host "Port $Port is free."
  exit 0
}

$pids = $connections.OwningProcess | Sort-Object -Unique
$stopped = 0
$skipped = 0

foreach ($procId in $pids) {
  $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
  $name = if ($proc) { $proc.ProcessName } else { "unknown" }

  if (Test-DockerLikeProcess $name) {
    Write-Host "Skipping PID $procId ($name) — Docker/WSL (left running)."
    $skipped++
    continue
  }

  if (-not $Force -and $name -notin @('node', 'nodejs')) {
    Write-Host "Skipping PID $procId ($name) — not Node (use -Force to stop anyway)."
    $skipped++
    continue
  }

  Write-Host "Stopping PID $procId ($name) on port $Port..."
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  $stopped++
}

Start-Sleep -Seconds 1
$still = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($still) {
  if ($skipped -gt 0) {
    Write-Host "Port $Port still in use (Docker or non-Node process). Local dev uses 5001; Docker backend uses 5000 - they can run together."
  } else {
    Write-Host "Port $Port is still in use. Close the app manually or run: .\scripts\free-port.ps1 -Port $Port -Force"
  }
  exit 1
}

Write-Host "Port $Port is now free. Stopped $stopped process(es)."
