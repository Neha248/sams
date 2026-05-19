$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker is not running. Start Docker Desktop, then run this script again."
  Write-Host "Or install MongoDB Community Server and start the 'MongoDB Server' Windows service."
  exit 1
}

Write-Host "Starting MongoDB container on port 27017..."
docker compose -f docker-compose.mongo.yml up -d
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "MongoDB ready at mongodb://127.0.0.1:27017/attendance_system"
Write-Host "Local backend: PORT=5001 in backend/.env (Vite proxies /api to 5001)"
Write-Host "Docker full-stack backend stays on port 5000 — no need to kill it for npm dev."
Write-Host "Seed (optional): cd backend; npm run seed"
