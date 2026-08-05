Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$backgroundPath = Join-Path $root 'assets\stage4\level3-utility-closet\utility-closet-background-v3.png'
$wirePath = Join-Path $root 'assets\stage4\level3-utility-closet\wire-stretch-sheet-v1.png'
$cratePath = Join-Path $root 'assets\stage4\level3-utility-closet\light-parts-box-sprite-v1.png'
$outputPath = Join-Path $PSScriptRoot 'current-shelf-vs-plate-angles.png'

$background = [System.Drawing.Bitmap]::FromFile($backgroundPath)
$wire = [System.Drawing.Bitmap]::FromFile($wirePath)
$crate = [System.Drawing.Bitmap]::FromFile($cratePath)
$scene = New-Object System.Drawing.Bitmap(960, 640)
$g = [System.Drawing.Graphics]::FromImage($scene)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.DrawImage($background, (New-Object System.Drawing.RectangleF(0,0,960,640)))
$g.DrawImage($crate, (New-Object System.Drawing.RectangleF(711,103,93,96)))

$saved = $g.Save()
$matrix = New-Object System.Drawing.Drawing2D.Matrix
$matrix.RotateAt(37.0, (New-Object System.Drawing.PointF(855,225)))
$g.Transform = $matrix
$cellWidth = $wire.Width / 3.0
$g.DrawImage($wire,
  (New-Object System.Drawing.RectangleF(715,155,190,170)),
  (New-Object System.Drawing.RectangleF(2,2,($cellWidth-4),($wire.Height-4))),
  [System.Drawing.GraphicsUnit]::Pixel)
$g.Restore($saved)
$matrix.Dispose()

$output = New-Object System.Drawing.Bitmap(640, 640)
$og = [System.Drawing.Graphics]::FromImage($output)
$og.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$og.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$og.DrawImage($scene, (New-Object System.Drawing.RectangleF(0,0,640,640)), (New-Object System.Drawing.RectangleF(640,0,320,320)), [System.Drawing.GraphicsUnit]::Pixel)

$yellow = [System.Drawing.Color]::FromArgb(255,255,221,52)
$cyan = [System.Drawing.Color]::FromArgb(255,75,235,255)
$dark = [System.Drawing.Color]::FromArgb(225,20,15,8)
$halo = New-Object System.Drawing.Pen($dark, 11)
$shelfPen = New-Object System.Drawing.Pen($yellow, 5)
$platePen = New-Object System.Drawing.Pen($cyan, 5)
$yellowBrush = New-Object System.Drawing.SolidBrush($yellow)
$cyanBrush = New-Object System.Drawing.SolidBrush($cyan)
$dotBorder = New-Object System.Drawing.Pen($dark, 4)

function Draw-Guide([System.Drawing.PointF]$a, [System.Drawing.PointF]$b, [System.Drawing.Pen]$pen, [System.Drawing.Brush]$brush) {
  $og.DrawLine($halo,$a,$b); $og.DrawLine($pen,$a,$b)
  foreach($p in @($a,$b)) {
    $og.FillEllipse($brush,$p.X-8,$p.Y-8,16,16)
    $og.DrawEllipse($dotBorder,$p.X-8,$p.Y-8,16,16)
  }
}

# Local right-hand shelf rail directly beneath the wall plate: about 32 degrees.
Draw-Guide (New-Object System.Drawing.PointF(231,388)) (New-Object System.Drawing.PointF(369,473)) $shelfPen $yellowBrush
# The actual upper edge of the currently rendered wall plate: about 38 degrees.
Draw-Guide (New-Object System.Drawing.PointF(405,426)) (New-Object System.Drawing.PointF(475,481)) $platePen $cyanBrush

$font = New-Object System.Drawing.Font('Arial',18,[System.Drawing.FontStyle]::Bold)
$labelBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(205,13,18,24))
$og.FillRectangle($labelBg,12,12,270,72)
$og.DrawString('SHELF  32 degrees',$font,$yellowBrush,24,18)
$og.DrawString('PLATE  38 degrees',$font,$cyanBrush,24,48)

$output.Save($outputPath,[System.Drawing.Imaging.ImageFormat]::Png)

$labelBg.Dispose(); $font.Dispose(); $dotBorder.Dispose(); $cyanBrush.Dispose(); $yellowBrush.Dispose()
$platePen.Dispose(); $shelfPen.Dispose(); $halo.Dispose(); $og.Dispose(); $output.Dispose()
$g.Dispose(); $scene.Dispose(); $crate.Dispose(); $wire.Dispose(); $background.Dispose()
