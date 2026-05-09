# Export compose images to one tar (requires: docker compose build)
#   .\scripts\docker-export.ps1
#   .\scripts\docker-export.ps1 -OutFile D:\backup\factory-stack.tar
# Runtime messages are English so pnpm/npm child-process capture does not mojibake on Windows PS 5.1.

param(
    [string] $OutFile = (Join-Path (Split-Path $PSScriptRoot) "factory-stack.tar")
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot)

$images = @(docker compose config --images 2>$null | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($images.Count -eq 0) {
    Write-Error "No image names from 'docker compose config --images'. Run 'docker compose build' in repo root first."
    exit 1
}

Write-Host "Writing: $OutFile"
Write-Host "Images: $($images -join ', ')"
docker save -o $OutFile @images
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Done. On target: docker load -i <path-to-this-tar>"
