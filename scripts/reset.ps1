<#
.SYNOPSIS
Resets and reseeds only the local Renewi demonstration database.
#>

[CmdletBinding()]
param(
    [switch]$ConfirmDemoReset
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmDemoReset) {
    throw "Reset is destructive for the local demo schema. Re-run with -ConfirmDemoReset."
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repositoryRoot
try {
    docker compose up -d postgres redis

    $environmentMarker = (docker compose exec -T postgres sh -lc 'printf "%s" "$RENEWI_ENV"').Trim()
    if ($LASTEXITCODE -ne 0 -or $environmentMarker -ne "local") {
        throw "Refusing reset because the target database is not marked as the local demo environment."
    }

    docker compose exec -T postgres sh -lc 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /workspace/database/reset/reset_demo.sql'
    if ($LASTEXITCODE -ne 0) {
        throw "The local demo schema reset failed."
    }

    & (Join-Path $PSScriptRoot "migrate.ps1")
    & (Join-Path $PSScriptRoot "seed.ps1")

    Write-Host "Local demo database reset and deterministic reseed completed."
}
finally {
    Pop-Location
}
