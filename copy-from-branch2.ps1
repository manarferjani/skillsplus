Get-Content files-to-copy.txt | ForEach-Object {
    $source = Join-Path -Path "." -ChildPath $_
    $destination = Join-Path -Path "..\tmp_files" -ChildPath $_

    if (Test-Path $source) {
        $destDir = Split-Path $destination
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }
        Copy-Item -Path $source -Destination $destination -Recurse -Force
        Write-Host "✅ Copied: $_"
    } else {
        Write-Host "❌ Not found: $_"
    }
}
