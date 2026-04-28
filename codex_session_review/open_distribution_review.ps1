param(
  [string]$RepoRoot = "",
  [string]$OutputDir = "codex_session_review\distribution_snapshot"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = if ($RepoRoot) { $RepoRoot } else { Split-Path -Parent $scriptDir }
Set-Location $repoRoot

powershell -ExecutionPolicy Bypass -File .\codex_session_review\deploy_distribution_snapshot.ps1 `
  -RepoRoot $repoRoot `
  -OutputDir $OutputDir

$htmlPath = Resolve-Path (Join-Path $OutputDir "index.html")
Write-Host "opening distribution fixture $htmlPath"
Start-Process $htmlPath
