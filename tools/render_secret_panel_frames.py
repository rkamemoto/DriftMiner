from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level4-bathroom"
OUT = ROOT / "tmp" / "secret-panel-frames"
OUT.mkdir(parents=True, exist_ok=True)

CLOSED = Image.open(ASSETS / "bathroom-background-faucets-interactable-v3.png").convert("RGBA")
OPEN_REF = Image.open(ASSETS / "bathroom-secret-panel-open-user-reference-v1.png").convert("RGBA")

QUAD = [(585, 72), (653, 80), (651, 250), (585, 237)]
CANVAS_SIZE = (960, 640)


def quad_mask(size=CANVAS_SIZE):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(QUAD, fill=255)
    return mask


MASK = quad_mask()


def clipped(img):
    out = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    out.paste(img, (0, 0), MASK)
    return out


PLATE = clipped(CLOSED)
OPEN_CLIPPED = clipped(OPEN_REF)

cx = (QUAD[0][0] + QUAD[2][0]) / 2
cy = (QUAD[0][1] + QUAD[2][1]) / 2


def draw_reveal(progress):
    frame = CLOSED.copy()
    frame.alpha_composite(OPEN_CLIPPED)

    if progress >= 1:
        return frame

    eased = 1 - (1 - progress) ** 2
    scale = 1 - eased * 0.55
    dy = -eased * 26
    alpha = max(0.0, 1 - eased / 0.85)

    new_w = max(1, round(CANVAS_SIZE[0] * scale))
    new_h = max(1, round(CANVAS_SIZE[1] * scale))
    resized = PLATE.resize((new_w, new_h), Image.LANCZOS)

    paste_x = round(cx - cx * scale)
    paste_y = round((cy + dy) - cy * scale)

    layer = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    layer.paste(resized, (paste_x, paste_y), resized)

    r, g, b, a = layer.split()
    a = a.point(lambda v: int(v * alpha))
    layer = Image.merge("RGBA", (r, g, b, a))
    layer.putalpha(Image.composite(a, Image.new("L", CANVAS_SIZE, 0), MASK))

    frame.alpha_composite(layer)
    return frame


FRAMES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
CROP = (500, 10, 720, 300)  # zoomed on the panel + surrounding wall

try:
    font = ImageFont.truetype("arial.ttf", 16)
except OSError:
    font = ImageFont.load_default()

crops = []
for p in FRAMES:
    frame = draw_reveal(p)
    crop = frame.crop(CROP)
    frame.save(OUT / f"frame_{p:.1f}.png")
    crop.save(OUT / f"crop_{p:.1f}.png")
    crops.append((p, crop))

cols = 4
rows = (len(crops) + cols - 1) // cols
cw, ch = crops[0][1].size
label_h = 22
sheet = Image.new("RGB", (cw * cols, (ch + label_h) * rows), (20, 20, 20))
draw = ImageDraw.Draw(sheet)
for i, (p, crop) in enumerate(crops):
    col = i % cols
    row = i // cols
    x = col * cw
    y = row * (ch + label_h)
    sheet.paste(crop.convert("RGB"), (x, y))
    ms = round(p * 1600)
    draw.text((x + 6, y + ch + 2), f"p={p:.1f}  {ms}ms", fill=(150, 220, 255), font=font)

sheet_path = OUT / "contact_sheet.png"
sheet.save(sheet_path)
print(f"Wrote {len(crops)} frames + contact sheet to {OUT}")
print(sheet_path)
