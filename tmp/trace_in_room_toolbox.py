from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
painted = Image.open(root / "toolbox-in-room-preview.png").convert("RGB")

# Exterior contour of the toolbox painted into the room. These points follow
# the visible outside metal edge only; shelf lighting and internal lid details
# are deliberately excluded.
contour = [
    (1234, 453), (1335, 453), (1353, 460), (1368, 474),
    (1380, 493), (1387, 515), (1397, 541), (1407, 570),
    (1413, 591), (1411, 607), (1401, 620), (1387, 627),
    (1283, 627), (1267, 621), (1256, 610), (1248, 594),
    (1242, 575), (1234, 552), (1227, 530), (1223, 508),
    (1224, 485), (1228, 466),
]

overlay = painted.copy()
draw = ImageDraw.Draw(overlay)
draw.line(contour + [contour[0]], fill=(255, 221, 52), width=4, joint="curve")

overlay.save(root / "toolbox-in-room-traced.png")

# A closer approval view, with enough surrounding shelf to judge perspective
# and placement without shrinking the outline to browser-preview size.
zoom = overlay.crop((1140, 370, 1480, 700)).resize((1020, 990), Image.Resampling.LANCZOS)
zoom.save(root / "toolbox-in-room-traced-closeup.png")

print("toolbox contour bbox", (1223, 453, 1413, 627))
