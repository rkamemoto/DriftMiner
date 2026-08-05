from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
bg = Image.open(root / "assets/stage4/level3-utility-closet/utility-closet-background-v4.png").convert("RGBA").resize((960, 640), Image.LANCZOS)
sheet = Image.open(root / "assets/stage4/level3-utility-closet/player-vent-swipe-reaction-v1.png").convert("RGBA")


def draw_frame(base, frame, x, y, dw=158, dh=238, anchor=.43, label=""):
    sw = sheet.width // 4
    sh = sheet.height
    cell = sheet.crop((frame * sw, 0, (frame + 1) * sw, sh)).resize((dw, dh), Image.LANCZOS)
    px = int(x - dw / 2)
    py = int(y - anchor * dh - dh / 2)
    base.alpha_composite(cell, (px, py))
    d = ImageDraw.Draw(base)
    d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(255, 255, 0, 255))
    if label:
        d.text((x + 6, y - 10), label, fill=(255, 255, 0, 255))


current = bg.copy()
draw_frame(current, 0, 748, 410, 184, 268, .43, "current 1")
draw_frame(current, 1, 806, 315, 184, 268, .43, "current 2")

proposed = bg.copy()
d = ImageDraw.Draw(proposed)
shelf_edge = [(650, 265), (729, 270), (821, 307), (917, 348)]
d.line(shelf_edge, fill=(255, 230, 0, 255), width=3)
for p in shelf_edge:
    d.ellipse((p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4), fill=(255, 230, 0, 255))
draw_frame(proposed, 0, 726, 432, 158, 238, .43, "new 1")
draw_frame(proposed, 1, 784, 365, 158, 238, .43, "new 2")
draw_frame(proposed, 2, 760, 430, 158, 238, .43, "fall")
draw_frame(proposed, 3, 724, 500, 158, 238, .43, "shock")

combo = Image.new("RGBA", (1920, 640), (0, 0, 0, 255))
combo.alpha_composite(current, (0, 0))
combo.alpha_composite(proposed, (960, 0))
draw = ImageDraw.Draw(combo)
draw.text((20, 20), "Current: too large / floating", fill=(255, 255, 255, 255))
draw.text((980, 20), "Proposed: smaller / hands toward shelf edge", fill=(255, 255, 255, 255))
out = root / "tmp/utility-vent-climb-size-contact-preview.png"
combo.save(out)
print(out)
