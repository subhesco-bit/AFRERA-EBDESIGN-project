# EBDESIGN: Broken Links Analysis
# Analyze external API links and references

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$sourceRoot = "C:/Users/DIYA GOEL/Downloads/EBDESIGN/backend/src"
$reportFile = "C:/Users/DIYA GOEL/Downloads/EBDESIGN/backend/scripts/BROKEN_LINKS_REPORT.csv"
$logFile = "C:/Users/DIYA GOEL/Downloads/EBDESIGN/backend/scripts/broken_links.log"

Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting EBDESIGN broken links analysis..." | Out-File -FilePath $logFile -Encoding UTF8

# CSV header
$header = "IssueID,File,Line,Type,Link,Status,Recommendation"
$header | Out-File -FilePath $reportFile -Encoding UTF8

$issueId = 0

# Scan source files for external links
Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Scanning source files for external links..." | Out-File -FilePath $logFile -Append -Encoding UTF8
$sourceFiles = Get-ChildItem -Path $sourceRoot -Recurse -Include "*.js","*.ts" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "worktrees" }

foreach ($file in $sourceFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        $lines = $content -split "`n"
        $lineNum = 0
        
        foreach ($line in $lines) {
            $lineNum++
            
            # Check for HTTP/HTTPS URLs using simple string matching
            if ($line -match "https://") {
                $url = $line.Substring($line.IndexOf("https://"))
                $endIndex = $url.IndexOfAny(@(" ", "'", '"', ")", ";"))
                if ($endIndex -gt 0) {
                    $url = $url.Substring(0, $endIndex)
                }
                
                $issueId++
                $status = "UNKNOWN"
                $recommendation = "MANUAL_VERIFICATION"
                
                # Check for known working endpoints
                if ($url -like "*api.anthropic.com*" -or $url -like "*api.openai.com*" -or $url -like "*googleapis.com*" -or $url -like "*huggingface.co*") {
                    $status = "KNOWN_WORKING"
                    $recommendation = "NO_ACTION"
                }
                # Check for potentially broken endpoints
                elseif ($url -like "*api.data.gov.in*" -or $url -like "*afrera.com*" -or $url -like "*myscheme.gov.in*" -or $url -like "*opensubsidies.org*") {
                    $status = "POTENTIALLY_BROKEN"
                    $recommendation = "VERIFY_ENDPOINT"
                }
                # Check for placeholders
                elseif ($url -like "*example.com*") {
                    $status = "PLACEHOLDER"
                    $recommendation = "REPLACE_WITH_REAL_URL"
                }
                
                $csvLine = "$issueId,`"$($file.Name)`",$lineNum,EXTERNAL_URL,`"$url`",$status,`"$recommendation`""
                $csvLine | Out-File -FilePath $reportFile -Append -Encoding UTF8
            }
        }
    } catch {
        # Skip files that can't be processed
    }
}

Write-Output "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Complete. Found $issueId issues." | Out-File -FilePath $logFile -Append -Encoding UTF8
Write-Output "Broken links report saved to: $reportFile"
