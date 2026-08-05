from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
project = root.parent.parent
asset = project / "assets" / "stage4" / "level4-bathroom" / "faucet-right-original-sprite-v2.png"
im = Image.open(asset).convert("RGBA")
scale = 10
out = im.resize((im.width * scale, im.height * scale), Image.Resampling.NEAREST)
draw = ImageDraw.Draw(out, "RGBA")
for x in range(0, im.width + 1, 5):
    draw.line((x * scale, 0, x * scale, out.height), fill=(255, 55, 90, 125), width=1)
    draw.text((x * scale + 2, 2), str(x), fill=(255, 40, 70, 255))
for y in range(0, im.height + 1, 5):
    draw.line((0, y * scale, out.width, y * scale), fill=(255, 55, 90, 125), width=1)
    draw.text((2, y * scale + 2), str(y), fill=(255, 40, 70, 255))
path = root / "right-faucet-pixel-grid-v1.png"
out.save(path)
print(path)
