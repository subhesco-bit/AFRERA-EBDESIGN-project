# PowerShell script to analyze module service files
$modulesPath = "backend\src\modules"
$results = @()

for ($i = 1; $i -le 150; $i++) {
    $modulePath = Join-Path $modulesPath "M$i"
    if (Test-Path $modulePath) {
        $servicePath = Join-Path $modulePath "service.js"
        if (Test-Path $servicePath) {
            $lines = (Get-Content $servicePath | Measure-Object -Line).Lines
            $status = if ($lines -lt 10) { "SKELETON" } elseif ($lines -lt 50) { "PARTIAL" } else { "COMPLETE" }
            $results += [PSCustomObject]@{
                Module = "M$i"
                Lines = $lines
                Status = $status
            }
        } else {
            $results += [PSCustomObject]@{
                Module = "M$i"
                Lines = 0
                Status = "NO_SERVICE"
            }
        }
    }
}

# Display results
$results | Format-Table -AutoSize

# Count by status
$statusCounts = $results | Group-Object Status | Select-Object Name, Count
Write-Host "`nModule Status Summary:"
$statusCounts | Format-Table -AutoSize

# Export to CSV
$results | Export-Csv -Path "module_analysis.csv" -NoTypeInformation
Write-Host "`nResults exported to module_analysis.csv"