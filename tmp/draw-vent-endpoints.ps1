Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot '..\assets\stage4\level3-utility-closet\utility-closet-background-v2.png'
$outputPath = Join-Path $PSScriptRoot 'vent-grate-endpoints.png'

$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath))
$cropRect = New-Object System.Drawing.Rectangle(1280, 24, 256, 430)
$output = New-Object System.Drawing.Bitmap($cropRect.Width, $cropRect.Height)
$graphics = [System.Drawing.Graphics]::FromImage($output)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.DrawImage($source, (New-Object System.Drawing.Rectangle(0, 0, $cropRect.Width, $cropRect.Height)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)

$yellow = [System.Drawing.Color]::FromArgb(255, 255, 221, 52)
$dark = [System.Drawing.Color]::FromArgb(220, 35, 27, 12)
$haloPen = New-Object System.Drawing.Pen($dark, 10)
$linePen = New-Object System.Drawing.Pen($yellow, 5)
$dotBrush = New-Object System.Drawing.SolidBrush($yellow)
$dotOutline = New-Object System.Drawing.Pen($dark, 4)

function Draw-EndpointLine([System.Drawing.PointF]$a, [System.Drawing.PointF]$b) {
    $graphics.DrawLine($haloPen, $a, $b)
    $graphics.DrawLine($linePen, $a, $b)
    foreach ($point in @($a, $b)) {
        $graphics.FillEllipse($dotBrush, $point.X - 8, $point.Y - 8, 16, 16)
        $graphics.DrawEllipse($dotOutline, $point.X - 8, $point.Y - 8, 16, 16)
    }
}

# Exact endpoints of the long upper and lower diagonal rails of the grate frame.
Draw-EndpointLine (New-Object System.Drawing.PointF(112, 54)) (New-Object System.Drawing.PointF(234, 171))
Draw-EndpointLine (New-Object System.Drawing.PointF(82, 294)) (New-Object System.Drawing.PointF(157, 369))

$output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$dotOutline.Dispose()
$dotBrush.Dispose()
$linePen.Dispose()
$haloPen.Dispose()
$graphics.Dispose()
$output.Dispose()
$source.Dispose()
