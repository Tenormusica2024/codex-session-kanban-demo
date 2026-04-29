param(
    [string]$RepoRoot = "",
    [string]$CodexHome = "",
    [string]$OutputDir = ".\codex_session_review\local_private_review",
    [int]$Days = 7,
    [int]$MaxSessions = 40,
    [int]$MinUserMessages = 4,
    [switch]$Open,
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

$ResolvedCodexHome = if ($CodexHome) {
    Resolve-Path $CodexHome
} else {
    Resolve-Path (Join-Path $HOME ".codex")
}

$ResolvedOutputDir = $OutputDir
if (-not [System.IO.Path]::IsPathRooted($ResolvedOutputDir)) {
    $ResolvedOutputDir = Join-Path $ResolvedRepoRoot $ResolvedOutputDir
}
New-Item -ItemType Directory -Force -Path $ResolvedOutputDir | Out-Null

$IndexPath = Join-Path $ResolvedOutputDir "index.html"
$JsonPath = Join-Path $ResolvedOutputDir "review.bundle.json"
$MarkdownPath = Join-Path $ResolvedOutputDir "review-pack.md"

Invoke-Step "Build private local review from Codex sessions" {
    python .\codex_session_review\build_review_surface.py `
        --codex-home $ResolvedCodexHome `
        --days $Days `
        --max-sessions $MaxSessions `
        --min-user-messages $MinUserMessages `
        --output $IndexPath `
        --json-output $JsonPath `
        --markdown-output $MarkdownPath
}

Invoke-Step "Static private snapshot smoke" {
    python .\codex_session_review\smoke_public_build.py $IndexPath
}

if (-not $SkipBrowserSmoke) {
    if (-not (Test-Path ".\node_modules\playwright")) {
        Invoke-Step "Install npm dependencies" {
            npm install
        }
    }
    Invoke-Step "Browser smoke against private local snapshot" {
        node .\codex_session_review\smoke_browser_surface.mjs --file $IndexPath
    }
    if ($MobileSmoke) {
        Invoke-Step "Mobile browser smoke against private local snapshot" {
            node .\codex_session_review\smoke_browser_surface.mjs --file $IndexPath --mobile
        }
    }
}

if ($Open) {
    $ResolvedIndexPath = Resolve-Path $IndexPath
    Write-Host ""
    Write-Host "Opening private local review snapshot: $ResolvedIndexPath" -ForegroundColor Green
    Start-Process $ResolvedIndexPath
}

Write-Host ""
Write-Host "Private local review snapshot updated." -ForegroundColor Green
Write-Host "index:    $IndexPath"
Write-Host "json:     $JsonPath"
Write-Host "markdown: $MarkdownPath"
Write-Host ""
Write-Host "Task Scheduler action example:" -ForegroundColor DarkCyan
Write-Host "powershell -NoProfile -ExecutionPolicy Bypass -File `"$ResolvedRepoRoot\codex_session_review\update_private_review.ps1`" -SkipBrowserSmoke"
