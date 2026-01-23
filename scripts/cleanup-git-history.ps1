<#
cleanup-git-history.ps1

Safe helper script to prepare a mirror clone and run git-filter-repo to remove
tracked secret files and optionally replace exact secret strings.

This script DOES NOT push rewritten history. It creates a mirror clone, runs
filter operations, verifies the results, and produces a short report. After
you inspect the mirror repo, you may push the rewritten history manually.

USAGE (PowerShell):
  1) Open PowerShell with Git and Python available in PATH.
  2) Optionally install git-filter-repo: `pip install git-filter-repo`.
  3) Run this script from the project root or supply repo path.

Examples:
  # Basic remove tracked files (.env, server/.env, dist)
  .\scripts\cleanup-git-history.ps1

  # Provide a replace-text file to scrub exact tokens
  .\scripts\cleanup-git-history.ps1 -ReplaceFile "C:\temp\replace-secrets.txt"

NOTES:
  - Back up your repository before running.
  - This script works on a mirror clone so your working repo will not be modified.
  - After reviewing the mirror repo, push with force only when ready.
#>
param(
  [string]$RepoPath = ".",
  [string]$MirrorPath = "..\world-facts-mirror.git",
  [string]$ReportPath = "..\git-filter-repo-report.txt",
  [string]$ReplaceFile = "",
  [string[]]$PathsToRemove = @('.env','server/.env','dist')
)

function Abort($msg){ Write-Error $msg; exit 1 }

Write-Host "Starting git-history cleanup helper"
Write-Host "Repo: $RepoPath"
Write-Host "Mirror will be created at: $MirrorPath"
Write-Host "Report: $ReportPath"
if ($ReplaceFile) { Write-Host "Replace-text file (optional): $ReplaceFile" }

# 1) Basic checks
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Abort 'git not found in PATH. Install Git for Windows and retry.' }

# Check for git-filter-repo availability
$filterRepoAvailable = $false
try { 
  $py = Get-Command python -ErrorAction SilentlyContinue
  if ($py) {
    $out = & python -m pip show git-filter-repo 2>$null
    if ($LASTEXITCODE -eq 0) { $filterRepoAvailable = $true }
  }
} catch {}

if (-not $filterRepoAvailable) {
  Write-Host 'git-filter-repo not found in Python environment. Install with: pip install git-filter-repo'
  Write-Host 'You can still download git-filter-repo from https://github.com/newren/git-filter-repo'
  Read-Host 'Press Enter to continue or Ctrl+C to cancel'
}

# 2) Create a mirror clone
if (Test-Path $MirrorPath) {
  Write-Host "Mirror path already exists. Removing existing mirror: $MirrorPath"
  Remove-Item -Recurse -Force $MirrorPath
}

Write-Host "Creating mirror clone..."
$cloneCmd = "git clone --mirror `"$RepoPath`" `"$MirrorPath`""
Write-Host $cloneCmd
$cloneProc = cmd /c $cloneCmd
if ($LASTEXITCODE -ne 0) { Abort 'mirror clone failed' }

Set-Location $MirrorPath

# 3) Run git-filter-repo to remove paths
$pathsArgs = ($PathsToRemove | ForEach-Object { "--path `"$_`"" }) -join ' '
$cmd = "python -m git_filter_repo --invert-paths $pathsArgs --force"
Write-Host "Running: $cmd"
cmd /c $cmd
if ($LASTEXITCODE -ne 0) { Abort 'git-filter-repo remove paths failed' }

# 4) Optional: run replace-text if provided
if ($ReplaceFile -and (Test-Path $ReplaceFile)) {
  Write-Host "Running replace-text with file: $ReplaceFile"
  $replaceCmd = "python -m git_filter_repo --replace-text `"$ReplaceFile`" --force"
  cmd /c $replaceCmd
  if ($LASTEXITCODE -ne 0) { Abort 'git-filter-repo replace-text failed' }
}

# 5) Cleanup and garbage collect
Write-Host "Expiring reflog and running gc..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6) Verification: search for common patterns and files
Write-Host "Verifying results and producing report..."
$report = @()
$report += "Git-filter-repo report for mirror: $(Get-Location)"
$report += "Paths removed: $($PathsToRemove -join ', ')"
$report += "Replace-text file: $ReplaceFile"
$report += ""

# Search for filenames still present in history
foreach ($p in $PathsToRemove) {
  $found = git rev-list --all -- $p 2>$null
  if ($found) { $report += "FOUND PATH IN HISTORY: $p" } else { $report += "CLEAN: $p" }
}

# Search for token patterns (adjust as needed)
$patterns = @('AIzaSy','SUPABASE_SERVICE_KEY','resend','GOCSPX-','3a959c7595184f72880155133252011')
foreach ($pat in $patterns) {
  $matches = git grep -n --break --heading -I $pat 2>$null
  if ($matches) { $report += "FOUND PATTERN '$pat' -> sample lines:"; $report += $matches[0..([math]::Min($matches.Count-1,10))] } else { $report += "CLEAN: pattern $pat" }
}

$report | Out-File -FilePath $ReportPath -Encoding utf8
Write-Host "Report written to $ReportPath"

Write-Host "Mirror rewrite completed. Inspect the mirror repo at: $MirrorPath"
Write-Host "When ready to publish rewritten history, run these commands from the mirror repo directory:" -ForegroundColor Yellow
Write-Host "  git push origin --force --all" -ForegroundColor Yellow
Write-Host "  git push origin --force --tags" -ForegroundColor Yellow
Write-Host "IMPORTANT: Force-pushing rewritten history requires collaborators to re-clone the repository."

Write-Host "Done. Review $ReportPath and open the mirror repo to verify commits and branches."