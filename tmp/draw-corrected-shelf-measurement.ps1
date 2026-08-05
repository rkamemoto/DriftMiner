Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot 'utility-shelf-source-crop.png'
$outputPath = Join-Path $PSScriptRoot 'corrected-shelf-angle-measurement.png'
$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $sourcePath))
$output = New-Object System.Drawing.Bitmap($source.Width, $source.Height)
$g = [System.Drawing.Graphics]::FromImage($output)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.DrawImageUnscaled($source,0,0)

$start = New-Object System.Drawing.PointF(244,294)
$end = New-Object System.Drawing.PointF(301,332)
$dx = $end.X - $start.X
$dy = $end.Y - $start.Y
$angle = [Math]::Atan2($dy,$dx) * 180 / [Math]::PI

$yellow = [System.Drawing.Color]::FromArgb(255,255,221,52)
$dark = [System.Drawing.Color]::FromArgb(225,20,15,8)
$halo = New-Object System.Drawing.Pen($dark,11)
$line = New-Object System.Drawing.Pen($yellow,5)
$brush = New-Object System.Drawing.SolidBrush($yellow)
$border = New-Object System.Drawing.Pen($dark,4)
$g.DrawLine($halo,$start,$end)
$g.DrawLine($line,$start,$end)
foreach($p in @($start,$end)) {
  $g.FillEllipse($brush,$p.X-9,$p.Y-9,18,18)
  $g.DrawEllipse($border,$p.X-9,$p.Y-9,18,18)
}

$font = New-Object System.Drawing.Font('Arial',22,[System.Drawing.FontStyle]::Bold)
$labelBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210,13,18,24))
$g.FillRectangle($labelBg,18,18,360,56)
$g.DrawString(('SHELF RAIL  {0:N1} degrees' -f $angle),$font,$brush,30,29)

$output.Save($outputPath,[System.Drawing.Imaging.ImageFormat]::Png)
$labelBg.Dispose(); $font.Dispose(); $border.Dispose(); $brush.Dispose(); $line.Dispose(); $halo.Dispose()
$g.Dispose(); $output.Dispose(); $source.Dispose()
