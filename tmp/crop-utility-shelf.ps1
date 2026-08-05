Add-Type -AssemblyName System.Drawing
$sourcePath = Join-Path $PSScriptRoot '..\assets\stage4\level3-utility-closet\utility-closet-background-v2.png'
$outputPath = Join-Path $PSScriptRoot 'utility-shelf-source-crop.png'
$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath))
$cropRect = New-Object System.Drawing.Rectangle(1000, 100, 430, 360)
$output = New-Object System.Drawing.Bitmap(860, 720)
$g = [System.Drawing.Graphics]::FromImage($output)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.DrawImage($source, (New-Object System.Drawing.Rectangle(0,0,860,720)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $output.Dispose(); $source.Dispose()
