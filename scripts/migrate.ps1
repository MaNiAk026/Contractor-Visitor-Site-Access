<#
.SYNOPSIS
Applies local database migrations for the credential-free Renewi demo stack.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repositoryRoot
try {
    docker compose up -d postgres redis

    $databaseReady = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        docker compose exec -T postgres sh -lc 'pg_isready -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
        if ($LASTEXITCODE -eq 0) {
            $databaseReady = $true
            break
        }

        Start-Sleep -Seconds 2
    }

    if (-not $databaseReady) {
        throw "Local PostgreSQL did not become ready within 60 seconds."
    }

    docker compose exec -T postgres sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /workspace/database/migrations/001_platform_foundation.sql'
    if ($LASTEXITCODE -ne 0) {
        throw "The local platform foundation migration failed."
    }

    docker compose exec -T postgres sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /workspace/database/migrations/002_fastapi_domain.sql'
    if ($LASTEXITCODE -ne 0) {
        throw "The FastAPI domain migration failed."
    }
    docker compose exec -T postgres sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /workspace/database/migrations/003_step07_hardening.sql'
    if ($LASTEXITCODE -ne 0) {
        throw "The step-07 hardening migration failed."
    }

    Write-Host "Local database migration completed."
}
finally {
    Pop-Location
}


