param(
  [string]$OutputDir = ".\codex_session_review\fixture_snapshot",
  [switch]$Distribution
)

$ErrorActionPreference = "Stop"

$outputPath = Join-Path $OutputDir "index.html"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$args = @(
  ".\codex_session_review\build_review_surface.py",
  "--input-json", ".\codex_session_review\sample_data\recent_sessions.sample.json",
  "--output", $outputPath
)
if ($Distribution) {
  $args += "--distribution"
}
python @args
if ($LASTEXITCODE -ne 0) {
  throw "build_review_surface.py failed with exit code $LASTEXITCODE"
}


$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$docsSource = Join-Path $repoRoot "docs"
$docsTarget = Join-Path $OutputDir "docs"
if (Test-Path $docsSource) {
  if (Test-Path $docsTarget) { Remove-Item -LiteralPath $docsTarget -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $docsTarget | Out-Null
  Copy-Item -Path (Join-Path $docsSource "*") -Destination $docsTarget -Recurse -Force
}

Write-Host "fixture snapshot ready:" $outputPath
