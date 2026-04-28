param(
    [string]$RepoRoot = "",
    [string]$OutputDir = ".\codex_session_review\fixture_snapshot",
    [switch]$Open,
    [switch]$Package,
    [switch]$SkipBrowserSmoke,
    [switch]$MobileSmoke
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

$ResolvedRepoRoot = if ($RepoRoot) {
    Resolve-Path $RepoRoot
} else {
    Resolve-Path (Join-Path $PSScriptRoot "..")
}
Set-Location $ResolvedRepoRoot

$ResolvedOutputDir = $OutputDir
if (-not [System.IO.Path]::IsPathRooted($ResolvedOutputDir)) {
    $ResolvedOutputDir = Join-Path $ResolvedRepoRoot $ResolvedOutputDir
}

Invoke-Step "Validate fixture data" {
    python .\codex_session_review\validate_session_data.py .\codex_session_review\sample_data\recent_sessions.sample.json --distribution
}

Invoke-Step "Build local review snapshot" {
    powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\build_fixture_snapshot.ps1 `
        -OutputDir $ResolvedOutputDir `
        -Distribution
}

$IndexPath = Join-Path $ResolvedOutputDir "index.html"
$DocsDir = Join-Path $ResolvedOutputDir "docs"
Invoke-Step "Static local snapshot smoke" {
    python .\codex_session_review\smoke_public_build.py $IndexPath --docs-dir $DocsDir --distribution
}

if (-not $SkipBrowserSmoke) {
    if (-not (Test-Path ".\node_modules\playwright")) {
        Invoke-Step "Install npm dependencies" {
            npm install
        }
    }
    Invoke-Step "Browser smoke against local snapshot" {
        node .\codex_session_review\smoke_browser_surface.mjs --file $IndexPath
    }
    if ($MobileSmoke) {
        Invoke-Step "Mobile browser smoke against local snapshot" {
            node .\codex_session_review\smoke_browser_surface.mjs --file $IndexPath --mobile
        }
    }
}

if ($Package) {
    Invoke-Step "Package distribution snapshot" {
        powershell -NoProfile -ExecutionPolicy Bypass -File .\codex_session_review\package_distribution_snapshot.ps1
    }
    Invoke-Step "Distribution package smoke" {
        python .\codex_session_review\smoke_distribution_package.py .\codex_session_review\distribution_package\codex-session-kanban-demo.zip --distribution
    }
}

if ($Open) {
    $ResolvedIndexPath = Resolve-Path $IndexPath
    Write-Host ""
    Write-Host "Opening local review snapshot: $ResolvedIndexPath" -ForegroundColor Green
    Start-Process $ResolvedIndexPath
}

Write-Host ""
Write-Host "Local review snapshot updated." -ForegroundColor Green
Write-Host "index: $IndexPath"
Write-Host "docs:  $DocsDir"
Write-Host ""
Write-Host "Task Scheduler example:" -ForegroundColor DarkCyan
Write-Host "powershell -NoProfile -ExecutionPolicy Bypass -File `"$ResolvedRepoRoot\codex_session_review\update_local_review.ps1`" -SkipBrowserSmoke"
