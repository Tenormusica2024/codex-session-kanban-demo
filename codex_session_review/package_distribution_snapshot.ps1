param(
  [string]$RepoRoot = "",
  [string]$OutputDir = "codex_session_review\distribution_snapshot",
  [string]$PackageDir = "codex_session_review\distribution_package",
  [string]$PackageName = "codex-session-kanban-demo.zip"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = if ($RepoRoot) { $RepoRoot } else { Split-Path -Parent $scriptDir }
Set-Location $repoRoot

powershell -ExecutionPolicy Bypass -File .\codex_session_review\deploy_distribution_snapshot.ps1 `
  -RepoRoot $repoRoot `
  -OutputDir $OutputDir

$absoluteOutputDir = Resolve-Path $OutputDir
$absolutePackageDir = Join-Path $repoRoot $PackageDir
New-Item -ItemType Directory -Force -Path $absolutePackageDir | Out-Null

$readmePath = Join-Path $absoluteOutputDir "README_LOCAL_DEMO.txt"
@"
Codex Session Kanban Demo

Open index.html in a browser.

This package is generated from sample fixture data only.
It must not contain real Codex sessions, local user paths, Vercel bypass tokens, or private project data.

Language:
- Default UI: Japanese
- Toggle: Japanese / EN

Storage:
- Manual board changes are saved in browser localStorage.
- They do not sync across browsers unless exported/imported.
"@ | Set-Content -Path $readmePath -Encoding UTF8

$packagePath = Join-Path $absolutePackageDir $PackageName
if (Test-Path $packagePath) {
  Remove-Item -LiteralPath $packagePath -Force
}

$items = @(
  (Join-Path $absoluteOutputDir "index.html"),
  (Join-Path $absoluteOutputDir "README_LOCAL_DEMO.txt")
)
$docsPath = Join-Path $absoluteOutputDir "docs"
if (Test-Path $docsPath) {
  $items += $docsPath
}

Compress-Archive -Path $items -DestinationPath $packagePath -Force

Write-Host "distribution package ready:" $packagePath
