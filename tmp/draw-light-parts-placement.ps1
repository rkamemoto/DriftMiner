Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot 'utility-layout-perspective-v4.png'
$outputPath = Join-Path $PSScriptRoot 'light-parts-box-placement-preview.png'
$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath))

# Enlarge the right-side shelves so the proposed sprite location is unambiguous.
$cropRect = New-Object System.Drawing.Rectangle(590, 44, 370, 350)
$output = New-Object System.Drawing.Bitmap(740, 700)
$g = [System.Drawing.Graphics]::FromImage($output)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.DrawImage($source, (New-Object System.Drawing.Rectangle(0, 0, 740, 700)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)

$yellow = [System.Drawing.Color]::FromArgb(255, 255, 221, 52)
$shade = [System.Drawing.Color]::FromArgb(130, 20, 15, 5)
$halo = New-Object System.Drawing.Pen($shade, 12)
$pen = New-Object System.Drawing.Pen($yellow, 5)
$pen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$brush = New-Object System.Drawing.SolidBrush($yellow)

# Existing compact crate on the upper shelf, proposed as the light-parts-box sprite.
$points = @(
  (New-Object System.Drawing.PointF(238, 138)),
  (New-Object System.Drawing.PointF(365, 170)),
  (New-Object System.Drawing.PointF(358, 266)),
  (New-Object System.Drawing.PointF(229, 231))
)
$g.DrawPolygon($halo, $points)
$g.DrawPolygon($pen, $points)
foreach ($p in $points) {
  $g.FillEllipse($brush, $p.X - 7, $p.Y - 7, 14, 14)
}

$output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$brush.Dispose(); $pen.Dispose(); $halo.Dispose(); $g.Dispose(); $output.Dispose(); $source.Dispose()
