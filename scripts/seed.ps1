<#
.SYNOPSIS
Seeds deterministic credential-free configuration for the Renewi local demo stack.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot

& (Join-Path $PSScriptRoot "migrate.ps1")

Push-Location $repositoryRoot
try {
    docker compose exec -T postgres sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /workspace/database/seed/001_deterministic_demo.sql'
    if ($LASTEXITCODE -ne 0) {
        throw "The deterministic local demo seed failed."
    }

    docker compose exec -T postgres sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /workspace/database/seed/002_fastapi_demo.sql'
    if ($LASTEXITCODE -ne 0) {
        throw "The deterministic FastAPI domain seed failed."
    }

    Write-Host "Deterministic local demo seed completed."
}
finally {
    Pop-Location
}
