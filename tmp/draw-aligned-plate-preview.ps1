Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$backgroundPath = Join-Path $root 'assets\stage4\level3-utility-closet\utility-closet-background-v2.png'
$wirePath = Join-Path $root 'assets\stage4\level3-utility-closet\wire-stretch-sheet-v1.png'
$outputPath = Join-Path $PSScriptRoot 'plate-aligned-to-grate-preview.png'

$background = [System.Drawing.Bitmap]::FromFile($backgroundPath)
$wire = [System.Drawing.Bitmap]::FromFile($wirePath)
$scene = New-Object System.Drawing.Bitmap(960, 640)
$g = [System.Drawing.Graphics]::FromImage($scene)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.DrawImage($background, (New-Object System.Drawing.RectangleF(0, 0, 960, 640)))

# Match the two traced grate rails: approximately 44 degrees clockwise.
$saved = $g.Save()
$matrix = New-Object System.Drawing.Drawing2D.Matrix
$matrix.RotateAt(44.0, (New-Object System.Drawing.PointF(855, 225)))
$g.Transform = $matrix
$dest = New-Object System.Drawing.RectangleF(715, 155, 190, 170)
$src = New-Object System.Drawing.RectangleF(2, 2, (($wire.Width / 3.0) - 4), ($wire.Height - 4))
$g.DrawImage($wire, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
$g.Restore($saved)
$matrix.Dispose()

# Crop and enlarge the comparison area.
$crop = New-Object System.Drawing.Bitmap(640, 640)
$cg = [System.Drawing.Graphics]::FromImage($crop)
$cg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$cg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$cg.DrawImage($scene, (New-Object System.Drawing.RectangleF(0, 0, 640, 640)), (New-Object System.Drawing.RectangleF(640, 0, 320, 320)), [System.Drawing.GraphicsUnit]::Pixel)

$yellow = [System.Drawing.Color]::FromArgb(255, 255, 221, 52)
$dark = [System.Drawing.Color]::FromArgb(225, 35, 27, 12)
$halo = New-Object System.Drawing.Pen($dark, 10)
$line = New-Object System.Drawing.Pen($yellow, 5)
$dot = New-Object System.Drawing.SolidBrush($yellow)
$dotBorder = New-Object System.Drawing.Pen($dark, 4)

function Draw-Guide([System.Drawing.PointF]$a, [System.Drawing.PointF]$b) {
    $cg.DrawLine($halo, $a, $b)
    $cg.DrawLine($line, $a, $b)
    foreach ($p in @($a, $b)) {
        $cg.FillEllipse($dot, $p.X - 8, $p.Y - 8, 16, 16)
        $cg.DrawEllipse($dotBorder, $p.X - 8, $p.Y - 8, 16, 16)
    }
}

# Coordinates below are in the enlarged crop. Both guides use the same 44-degree direction.
Draw-Guide (New-Object System.Drawing.PointF(460, 96)) (New-Object System.Drawing.PointF(616, 246))
Draw-Guide (New-Object System.Drawing.PointF(430, 408)) (New-Object System.Drawing.PointF(488, 464))

$crop.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$dotBorder.Dispose(); $dot.Dispose(); $line.Dispose(); $halo.Dispose()
$cg.Dispose(); $crop.Dispose(); $g.Dispose(); $scene.Dispose(); $wire.Dispose(); $background.Dispose()
