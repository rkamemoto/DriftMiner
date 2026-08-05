Add-Type -AssemblyName System.Drawing
$sourcePath = Join-Path $PSScriptRoot '..\assets\stage4\level3-utility-closet\utility-closet-background-v2.png'
$outputPath = Join-Path $PSScriptRoot 'lower-shelf-source-crop.png'
$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath))
$cropRect = New-Object System.Drawing.Rectangle(980, 280, 556, 550)
$output = New-Object System.Drawing.Bitmap(778, 770)
$g = [System.Drawing.Graphics]::FromImage($output)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($source, (New-Object System.Drawing.Rectangle(0,0,778,770)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$output.Save($outputPath,[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $output.Dispose(); $source.Dispose()
