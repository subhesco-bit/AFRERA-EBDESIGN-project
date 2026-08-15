# EBDESIGN: Comprehensive Link Scanner
# Scans entire project for broken imports, missing files, and corrupted links

$ErrorActionPreference = "Stop"

$backendDir = "C:/Users/DIYA GOEL/Downloads/EBDESIGN/backend/src"
$frontendDir = "C:/Users/DIYA GOEL/Downloads/EBDESIGN/frontend/src"
$reportFile = "C:/Users/DIYA GOEL/Downloads/EBDESIGN/backend/scripts/COMPREHENSIVE_LINK_REPORT.csv"

Write-Output "EBDESIGN Comprehensive Link Scanner"
Write-Output "=================================="
Write-Output ""

# Initialize report
$report = @("Type,File,Line,Issue,Severity")

# Function to check if a file exists
function Test-ImportPath {
    param($basePath, $importPath, $currentFile)
    
    # Handle different import patterns
    if ($importPath -match "^\.\./") {
        # Relative path
        $relativePath = $importPath -replace "^\.\./", ""
        $targetPath = Join-Path (Split-Path $currentFile) $relativePath
    } elseif ($importPath -match "^\./") {
        # Current directory
        $relativePath = $importPath -replace "^\./", ""
        $targetPath = Join-Path (Split-Path $currentFile) $relativePath
    } else {
        # Module or absolute path - skip for now
        return $true
    }
    
    # Try to find the file
    if (Test-Path $targetPath) {
        return $true
    }
    
    # Try with .js extension
    if (-not $targetPath.EndsWith(".js")) {
        if (Test-Path "$targetPath.js") {
            return $true
        }
    }
    
    return $false
}

# Scan backend for broken requires
Write-Output "Scanning backend for broken requires..."
$backendFiles = Get-ChildItem -Path $backendDir -Recurse -Include "*.js" -ErrorAction SilentlyContinue

foreach ($file in $backendFiles) {
    $content = Get-Content $file.FullName -Raw
    $lines = $content -split "`n"
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Match require patterns (simplified - no complex regex)
        if ($line -like "*require(*") {
            # Extract the path from require
            $startIdx = $line.IndexOf("require(") + 8
            $endIdx = $line.IndexOf(")", $startIdx)
            if ($startIdx -gt 7 -and $endIdx -gt $startIdx) {
                $importPath = $line.Substring($startIdx, $endIdx - $startIdx).Trim("'").Trim('"')
                
                # Skip node_modules and built-in modules
                if ($importPath -like "*node_modules*" -or $importPath -notlike "./*" -and $importPath -notlike "../*") {
                    continue
                }
                
                # Check if the import path exists
                $exists = Test-ImportPath -basePath $backendDir -importPath $importPath -currentFile $file.FullName
                
                if (-not $exists) {
                    $report += "BROKEN_REQUIRE,$($file.Name),$($i+1),$importPath,HIGH"
                }
            }
        }
    }
}

# Scan frontend for broken imports
Write-Output "Scanning frontend for broken imports..."
$frontendFiles = Get-ChildItem -Path $frontendDir -Recurse -Include "*.js","*.jsx","*.ts","*.tsx" -ErrorAction SilentlyContinue

foreach ($file in $frontendFiles) {
    $content = Get-Content $file.FullName -Raw
    $lines = $content -split "`n"
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Match import patterns (simplified - no complex regex)
        if ($line -like "*from *") {
            # Extract the path from import
            $startIdx = $line.IndexOf("from ") + 5
            $endIdx = $line.IndexOf("'", $startIdx)
            if ($endIdx -eq -1) {
                $endIdx = $line.IndexOf('"', $startIdx)
            }
            if ($startIdx -gt 4 -and $endIdx -gt $startIdx) {
                $importPath = $line.Substring($startIdx, $endIdx - $startIdx).Trim("'").Trim('"')
                
                # Skip node_modules and absolute imports
                if ($importPath -like "*node_modules*" -or $importPath -notlike "./*" -and $importPath -notlike "../*") {
                    continue
                }
                
                # Check if the import path exists
                $exists = Test-ImportPath -basePath $frontendDir -importPath $importPath -currentFile $file.FullName
                
                if (-not $exists) {
                    $report += "BROKEN_IMPORT,$($file.Name),$($i+1),$importPath,HIGH"
                }
            }
        }
    }
}

# Scan for broken URLs in backend
Write-Output "Scanning backend for broken URLs..."
foreach ($file in $backendFiles) {
    $content = Get-Content $file.FullName -Raw
    $lines = $content -split "`n"
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Match URL patterns (simplified - no complex regex)
        if ($line -like "*http*") {
            # Check for common broken patterns
            if ($line -like "*example.com*" -or $line -like "*localhost:*" -or $line -like "*afrera.com*") {
                $report += "POTENTIALLY_BROKEN_URL,$($file.Name),$($i+1),$line,MEDIUM"
            }
        }
    }
}

# Scan for broken URLs in frontend
Write-Output "Scanning frontend for broken URLs..."
foreach ($file in $frontendFiles) {
    $content = Get-Content $file.FullName -Raw
    $lines = $content -split "`n"
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Match URL patterns (simplified - no complex regex)
        if ($line -like "*http*") {
            # Check for common broken patterns
            if ($line -like "*example.com*" -or $line -like "*localhost:*" -or $line -like "*afrera.com*") {
                $report += "POTENTIALLY_BROKEN_URL,$($file.Name),$($i+1),$line,MEDIUM"
            }
        }
    }
}

# Write report
Write-Output "Writing report to $reportFile..."
$report | Out-File -FilePath $reportFile -Encoding UTF8

Write-Output ""
Write-Output "Scan complete."
Write-Output "Total issues found: $($report.Count - 1)"
Write-Output "Report saved to: $reportFile"
