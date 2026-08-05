Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$assetDir = Join-Path $root 'assets\stage4\level3-utility-closet'
$originalPath = Join-Path $assetDir 'utility-closet-background-v2.png'
$cleanFillPath = 'C:\Users\RyanKamemoto\.codex\generated_images\019f55d9-5ed2-77c1-bf66-3d0a3cebfacc\exec-95ff01a4-912c-47a4-a189-853e421d4b7e.png'
$backgroundOut = Join-Path $assetDir 'utility-closet-background-v3.png'
$spriteOut = Join-Path $assetDir 'light-parts-box-sprite-v1.png'

$original = [System.Drawing.Bitmap]::FromFile($originalPath)
$cleanFill = [System.Drawing.Bitmap]::FromFile($cleanFillPath)

# Exact visible silhouette approved in the shelf preview, converted back to
# coordinates in the 1536x1024 source artwork.
$points = [System.Drawing.PointF[]]@(
  (New-Object System.Drawing.PointF(1153.0, 179.0)),
  (New-Object System.Drawing.PointF(1165.5, 176.5)),
  (New-Object System.Drawing.PointF(1223.5, 178.0)),
  (New-Object System.Drawing.PointF(1234.5, 183.0)),
  (New-Object System.Drawing.PointF(1243.0, 194.0)),
  (New-Object System.Drawing.PointF(1258.0, 200.0)),
  (New-Object System.Drawing.PointF(1269.0, 215.0)),
  (New-Object System.Drawing.PointF(1270.0, 233.0)),
  (New-Object System.Drawing.PointF(1264.0, 243.0)),
  (New-Object System.Drawing.PointF(1245.0, 251.0)),
  (New-Object System.Drawing.PointF(1229.5, 252.0)),
  (New-Object System.Drawing.PointF(1221.0, 261.0)),
  (New-Object System.Drawing.PointF(1213.0, 272.0)),
  (New-Object System.Drawing.PointF(1209.5, 290.5)),
  (New-Object System.Drawing.PointF(1207.5, 302.0)),
  (New-Object System.Drawing.PointF(1169.0, 305.0)),
  (New-Object System.Drawing.PointF(1157.5, 297.0)),
  (New-Object System.Drawing.PointF(1150.5, 280.0)),
  (New-Object System.Drawing.PointF(1148.5, 192.0))
)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddPolygon($points)

# Preserve the original background pixel-for-pixel outside the crate mask.
$background = New-Object System.Drawing.Bitmap($original.Width, $original.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bg = [System.Drawing.Graphics]::FromImage($background)
$bg.DrawImageUnscaled($original, 0, 0)
$bg.SetClip($path)
$bg.DrawImage($cleanFill, (New-Object System.Drawing.Rectangle(0, 0, $original.Width, $original.Height)))
$bg.ResetClip()
$background.Save($backgroundOut, [System.Drawing.Imaging.ImageFormat]::Png)

# Extract those exact original pixels as a tightly padded transparent sprite.
$cropX = 1138; $cropY = 165; $cropW = 148; $cropH = 154
$sprite = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sg = [System.Drawing.Graphics]::FromImage($sprite)
$sg.Clear([System.Drawing.Color]::Transparent)
$shiftedPoints = [System.Drawing.PointF[]]($points | ForEach-Object {
  New-Object System.Drawing.PointF(($_.X - $cropX), ($_.Y - $cropY))
})
$spritePath = New-Object System.Drawing.Drawing2D.GraphicsPath
$spritePath.AddPolygon($shiftedPoints)
$sg.SetClip($spritePath)
$sg.DrawImage($original, (New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)), (New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)), [System.Drawing.GraphicsUnit]::Pixel)
$sg.ResetClip()
$sprite.Save($spriteOut, [System.Drawing.Imaging.ImageFormat]::Png)

$spritePath.Dispose(); $sg.Dispose(); $sprite.Dispose()
$bg.Dispose(); $background.Dispose(); $path.Dispose(); $cleanFill.Dispose(); $original.Dispose()
