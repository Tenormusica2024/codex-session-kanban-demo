param(
  [string]$RepoRoot = "",
  [string]$OutputDir = "codex_session_review\distribution_snapshot",
  [switch]$DeployToVercel,
  [string]$VercelAlias = "",
  [string]$VercelProjectName = "codex-session-kanban",
  [switch]$AllowFixtureProductionAlias
)

$ErrorActionPreference = "Stop"

if ($DeployToVercel -and $VercelAlias -and -not $AllowFixtureProductionAlias) {
  $aliasLower = $VercelAlias.ToLowerInvariant()
  if ($aliasLower -notmatch "demo|sample|fixture") {
    throw "Refusing to deploy sample fixture distribution to production-like alias '$VercelAlias'. Use -AllowFixtureProductionAlias only when intentionally publishing a clearly marked sample/demo page."
  }
}

function Invoke-LoggedProcess {
  param(
    [string]$FilePath,
    [string]$Arguments,
    [string]$WorkingDirectory,
    [string]$LogPath
  )
  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $FilePath
  $psi.Arguments = $Arguments
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $psi
  [void]$process.Start()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($stdout) { $stdout | Out-File -FilePath $LogPath -Encoding UTF8 -Append }
  if ($stderr) { $stderr | Out-File -FilePath $LogPath -Encoding UTF8 -Append }
  return [pscustomobject]@{ ExitCode = $process.ExitCode; Output = "$stdout`n$stderr" }
}

$reviewDir = Join-Path $RepoRoot "codex_session_review"
$distDir = Join-Path $RepoRoot $OutputDir
$logDir = Join-Path $distDir "logs"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logPath = Join-Path $logDir "distribution_deploy_$timestamp.log"

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Push-Location $RepoRoot
try {
  "start: $(Get-Date -Format o)" | Out-File -FilePath $logPath -Encoding UTF8
  & powershell -ExecutionPolicy Bypass -File (Join-Path $reviewDir "build_fixture_snapshot.ps1") -OutputDir $distDir -Distribution 2>&1 | ForEach-Object {
    $_ | Out-File -FilePath $logPath -Encoding UTF8 -Append
  }
  if ($LASTEXITCODE -ne 0) {
    throw "fixture distribution build failed with exit code $LASTEXITCODE"
  }

  $vercelConfig = @'
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow, noarchive" },
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
'@
  [System.IO.File]::WriteAllText(
    (Join-Path $distDir "vercel.json"),
    $vercelConfig,
    [System.Text.UTF8Encoding]::new($false)
  )

  if ($DeployToVercel) {
    $vercelProjectDir = Join-Path $distDir ".vercel"
    New-Item -ItemType Directory -Force -Path $vercelProjectDir | Out-Null
    $vercelProjectFile = Join-Path $vercelProjectDir "project.json"
    if (Test-Path $vercelProjectFile) {
      try {
        $projectMeta = Get-Content -LiteralPath $vercelProjectFile -Raw | ConvertFrom-Json
        $projectMeta.projectName = $VercelProjectName
        [System.IO.File]::WriteAllText($vercelProjectFile, ($projectMeta | ConvertTo-Json -Depth 8), [System.Text.UTF8Encoding]::new($false))
      }
      catch {
        "warning: failed to normalize .vercel/project.json projectName: $($_.Exception.Message)" | Out-File -FilePath $logPath -Encoding UTF8 -Append
      }
    }

    $vercelCmd = (Get-Command vercel.cmd -ErrorAction SilentlyContinue).Source
    if (-not $vercelCmd) { $vercelCmd = Join-Path $env:USERPROFILE ".npm-global\vercel.cmd" }
    if (-not (Test-Path $vercelCmd)) { throw "vercel.cmd not found. Expected PATH command or $vercelCmd" }

    "deploy: $vercelCmd deploy --prod --yes" | Out-File -FilePath $logPath -Encoding UTF8 -Append
    $deployResult = Invoke-LoggedProcess -FilePath $vercelCmd -Arguments "deploy --prod --yes" -WorkingDirectory $distDir -LogPath $logPath
    if ($deployResult.ExitCode -ne 0) { throw "vercel deploy failed with exit code $($deployResult.ExitCode)" }

    $deploymentUrl = $null
    $jsonUrlMatch = [regex]::Match($deployResult.Output, '"url"\s*:\s*"https://([^"]+)"')
    if ($jsonUrlMatch.Success) { $deploymentUrl = $jsonUrlMatch.Groups[1].Value }
    if (-not $deploymentUrl) {
      $prodUrlMatch = [regex]::Match($deployResult.Output, 'Production:\s+https://([^\s]+)')
      if ($prodUrlMatch.Success) { $deploymentUrl = $prodUrlMatch.Groups[1].Value }
    }
    if ($VercelAlias -and $deploymentUrl) {
      "alias: $deploymentUrl -> $VercelAlias" | Out-File -FilePath $logPath -Encoding UTF8 -Append
      $aliasResult = Invoke-LoggedProcess -FilePath $vercelCmd -Arguments "alias set $deploymentUrl $VercelAlias --non-interactive" -WorkingDirectory $distDir -LogPath $logPath
      if ($aliasResult.ExitCode -ne 0) { throw "vercel alias failed with exit code $($aliasResult.ExitCode)" }
    }
  }

  "done: $(Get-Date -Format o)" | Out-File -FilePath $logPath -Encoding UTF8 -Append
  Write-Host "distribution snapshot ready:" (Join-Path $distDir "index.html")
  Write-Host "log:" $logPath
}
finally {
  Pop-Location
}
