from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets" / "stage4" / "level4-bathroom"
BASE = ASSETS / "bathroom-background-faucets-clean-v1.png"
SOURCE = ASSETS / "bathroom-secret-panel-transition-frame3-artgen-source-v1.png"
TRASH = ASSETS / "bathroom-secret-panel-trash-foreground-v2.png"
OUTPUT = ASSETS / "bathroom-secret-panel-transition-frame3-artgen-v1.png"

SIZE = (960, 640)
# This is the established native panel animation rectangle, not a newly
# inferred shape. Keeping the edit inside it preserves every other room pixel.
PANEL_BOX = (580, 70, 655, 250)

base = Image.open(BASE).convert("RGBA").resize(SIZE, Image.Resampling.LANCZOS)
source = Image.open(SOURCE).convert("RGBA").resize(SIZE, Image.Resampling.LANCZOS)
trash = Image.open(TRASH).convert("RGBA")

mask = Image.new("L", SIZE, 0)
draw = ImageDraw.Draw(mask)
draw.rectangle(PANEL_BOX, fill=255)
# A one-pixel inward feather prevents a rectangular resampling seam while
# retaining the straight panel-aligned top and right boundaries.
mask = mask.filter(ImageFilter.GaussianBlur(.45))

frame = Image.composite(source, base, mask)
frame = Image.alpha_composite(frame, trash)
frame.save(OUTPUT)
print(OUTPUT)
