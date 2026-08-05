Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot 'utility-shelf-source-crop.png'
$outputPath = Join-Path $PSScriptRoot 'light-parts-box-outline-precise.png'
$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath))
$output = New-Object System.Drawing.Bitmap($source.Width, $source.Height)
$g = [System.Drawing.Graphics]::FromImage($output)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.DrawImage($source, 0, 0)

$yellow = [System.Drawing.Color]::FromArgb(255, 255, 221, 52)
$dark = [System.Drawing.Color]::FromArgb(225, 35, 27, 12)
$halo = New-Object System.Drawing.Pen($dark, 11)
$line = New-Object System.Drawing.Pen($yellow, 5)
$line.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

# Trace the visible silhouette of the approved rear crate, including the notch
# where the smaller foreground crate naturally occludes it.
$points = [System.Drawing.PointF[]]@(
  (New-Object System.Drawing.PointF(306, 158)),
  (New-Object System.Drawing.PointF(331, 153)),
  (New-Object System.Drawing.PointF(447, 156)),
  (New-Object System.Drawing.PointF(469, 166)),
  (New-Object System.Drawing.PointF(486, 188)),
  (New-Object System.Drawing.PointF(516, 200)),
  (New-Object System.Drawing.PointF(538, 230)),
  (New-Object System.Drawing.PointF(540, 266)),
  (New-Object System.Drawing.PointF(528, 286)),
  (New-Object System.Drawing.PointF(490, 302)),
  (New-Object System.Drawing.PointF(459, 304)),
  (New-Object System.Drawing.PointF(442, 322)),
  (New-Object System.Drawing.PointF(426, 344)),
  (New-Object System.Drawing.PointF(419, 381)),
  (New-Object System.Drawing.PointF(415, 404)),
  (New-Object System.Drawing.PointF(338, 410)),
  (New-Object System.Drawing.PointF(315, 394)),
  (New-Object System.Drawing.PointF(301, 360)),
  (New-Object System.Drawing.PointF(297, 184))
)
$g.DrawPolygon($halo, $points)
$g.DrawPolygon($line, $points)

$output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$line.Dispose(); $halo.Dispose(); $g.Dispose(); $output.Dispose(); $source.Dispose()
