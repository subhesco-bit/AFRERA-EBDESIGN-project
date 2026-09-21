# Split Large CSV Files for Efficiency
# Splits files >25MB into multiple <25MB chunks while preserving header rows

param(
    [string]$RootPath = "C:\Users\DIYA GOEL\Downloads\EBDESIGN\_EBDESIGN_LIBRARY",
    [int]$MaxSizeMB = 20  # Target size for each chunk
)

function Split-CSVFile {
    param(
        [string]$FilePath,
        [int]$MaxSizeMB
    )

    $file = Get-Item $FilePath -ErrorAction SilentlyContinue
    if (-not $file -or $file.Length -lt (25 * 1MB)) {
        Write-Host "⊘ Skipping (< 25MB): $(Split-Path $file -Leaf)"
        return
    }

    $fileName = [io.path]::GetFileNameWithoutExtension($file.Name)
    $extension = $file.Extension
    $directory = $file.DirectoryName

    Write-Host "→ Splitting: $(Split-Path $file -Leaf) ($([math]::Round($file.Length/1MB))MB)"

    try {
        # Read first line as header
        $header = Get-Content $FilePath -Head 1

        # Count total lines
        $lineCount = @(Get-Content $FilePath).Count
        if ($lineCount -lt 2) {
            Write-Host "✗ File too small to split"
            return
        }

        # Calculate lines per chunk (accounting for header size ~100 bytes, data ~500 bytes per line avg)
        $linesPerChunk = [math]::Floor(($MaxSizeMB * 1MB - 100) / 500)
        $totalChunks = [math]::Ceiling(($lineCount - 1) / $linesPerChunk)

        if ($totalChunks -eq 1) {
            Write-Host "✓ No split needed (fits in 1 chunk)"
            return
        }

        # Split the file
        $lines = Get-Content $FilePath | Select-Object -Skip 1  # Skip header
        $chunk = 1
        $startIndex = 0

        while ($startIndex -lt $lines.Count) {
            $endIndex = [math]::Min($startIndex + $linesPerChunk, $lines.Count)
            $chunkLines = $lines[$startIndex..($endIndex - 1)]

            $chunkFileName = "$directory\$fileName-part$chunk$extension"

            # Write header + chunk data
            @($header) + @($chunkLines) | Set-Content -Path $chunkFileName -Encoding UTF8 -Force

            $chunkFile = Get-Item $chunkFileName
            $chunkSize = [math]::Round($chunkFile.Length / 1MB, 1)
            Write-Host "  ✓ Part $chunk: $chunkSize MB"

            $startIndex = $endIndex
            $chunk++
        }

        # Remove original
        Remove-Item $FilePath -Force
        Write-Host "  ✓ Original removed"

    } catch {
        Write-Host "  ✗ Error: $($_.Exception.Message)"
    }
}

# Find and split all large CSV files
Write-Host "Finding CSV files > 25MB..."
$csvFiles = Get-ChildItem -Path $RootPath -Recurse -Filter "*.csv" -File -ErrorAction SilentlyContinue |
    Where-Object {$_.Length -gt (25 * 1MB)}

Write-Host "Found $($csvFiles.Count) large CSV files`n"

foreach ($file in $csvFiles) {
    Split-CSVFile -FilePath $file.FullName -MaxSizeMB $MaxSizeMB
}

Write-Host "`n✓ Splitting complete"
