param(
  [Parameter(Mandatory = $true)]
  [string]$EnterpriseRepoUrl,

  [string]$PersonalRepoUrl = "https://github.com/subhesco-bit/AFRERA-EBDESIGN-project.git",

  [string]$BranchName = "codex/unified-enterprise-main"
)

$ErrorActionPreference = "Stop"

function Assert-InProjectRoot {
  if (-not (Test-Path ".git")) {
    throw "Run this script from the EBDESIGN git repository root."
  }
}

function Set-RemoteUrl {
  param(
    [string]$Name,
    [string]$Url
  )

  $existing = git remote
  if ($existing -contains $Name) {
    git remote set-url $Name $Url
  } else {
    git remote add $Name $Url
  }
}

Assert-InProjectRoot

Set-RemoteUrl -Name "origin" -Url $PersonalRepoUrl
Set-RemoteUrl -Name "enterprise" -Url $EnterpriseRepoUrl

git checkout -B $BranchName

Write-Output "Configured remotes:"
git remote -v
Write-Output ""
Write-Output "Active branch:"
git branch --show-current
Write-Output ""
Write-Output "Next after final tests:"
Write-Output "  git push enterprise $BranchName"
Write-Output "  git push origin $BranchName"
