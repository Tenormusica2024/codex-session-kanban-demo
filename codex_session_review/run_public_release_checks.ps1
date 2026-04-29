param(
    [switch]$SkipBrowserSmoke,
    [switch]$PagesSmoke,
    [string]$PagesUrl = "https://tenormusica2024.github.io/codex-session-kanban-demo/"
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Command
    )
    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Command
}

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

Invoke-Step "Validate public fixture JSON" {
    python .\codex_session_review\validate_session_data.py .\codex_session_review\sample_data\recent_sessions.sample.json --distribution
}

Invoke-Step "Build distribution fixture snapshot" {
    powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 -Distribution
}

Invoke-Step "Static artifact smoke" {
    python .\codex_session_review\smoke_public_build.py .\codex_session_review\fixture_snapshot\index.html --docs-dir .\codex_session_review\fixture_snapshot\docs --distribution
}

Invoke-Step "Python compile check" {
    python -m py_compile `
        .\codex_session_review\build_review_surface.py `
        .\codex_session_review\validate_session_data.py `
        .\codex_session_review\smoke_public_build.py `
        .\codex_session_review\smoke_distribution_package.py
}

Invoke-Step "Provider import normalization smoke" {
    python .\codex_session_review\build_review_surface.py `
        --input-json .\codex_session_review\sample_data\provider_imports.sample.json `
        --output .\codex_session_review\fixture_snapshot\provider-import.html `
        --json-output .\codex_session_review\fixture_snapshot\provider-import.normalized.json `
        --distribution
    python .\codex_session_review\smoke_public_build.py .\codex_session_review\fixture_snapshot\provider-import.html --distribution
}

Invoke-Step "Package downloadable distribution" {
    powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\package_distribution_snapshot.ps1
}

Invoke-Step "Distribution package smoke" {
    python .\codex_session_review\smoke_distribution_package.py .\codex_session_review\distribution_package\codex-session-kanban-demo.zip --distribution
}

if (-not $SkipBrowserSmoke) {
    if (-not (Test-Path ".\node_modules\playwright")) {
        Invoke-Step "Install npm dependencies" {
            npm install
        }
    }
    Invoke-Step "Browser smoke against local fixture" {
        npm run smoke:browser:local
    }
    Invoke-Step "Mobile browser smoke against local fixture" {
        npm run smoke:browser:mobile:local
    }
    Invoke-Step "Narrow browser smoke against local fixture" {
        npm run smoke:browser:narrow:local
    }
}

if ($PagesSmoke) {
    Invoke-Step "Static smoke against Pages URL" {
        $TempHtml = Join-Path $env:TEMP "codex-session-kanban-pages-index.html"
        Invoke-WebRequest -Uri $PagesUrl -UseBasicParsing -TimeoutSec 30 -OutFile $TempHtml
        python .\codex_session_review\smoke_public_build.py $TempHtml --distribution
    }
    if (-not $SkipBrowserSmoke) {
        Invoke-Step "Browser smoke against Pages URL" {
            npm run smoke:browser -- --url $PagesUrl
        }
        Invoke-Step "Mobile browser smoke against Pages URL" {
            npm run smoke:browser:mobile -- --url $PagesUrl
        }
        Invoke-Step "Narrow browser smoke against Pages URL" {
            npm run smoke:browser:narrow -- --url $PagesUrl
        }
    }
}

Write-Host ""
Write-Host "All public release checks passed." -ForegroundColor Green
