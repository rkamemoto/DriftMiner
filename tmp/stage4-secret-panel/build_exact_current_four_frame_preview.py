from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
ASSET = ROOT / "assets" / "stage4" / "level4-bathroom"
OUT = ROOT / "tmp" / "stage4-secret-panel" / "secret-panel-current-exact-four-frames.png"


def open_rgba(name):
    return Image.open(ASSET / name).convert("RGBA")


def add_faucets(canvas):
    layouts = (
        ("faucet-left-original-sprite-v2.png", 240, 203.125, 33.125, 31.25),
        ("faucet-middle-original-sprite-v2.png", 331.875, 192.5, 33.125, 33.125),
        ("faucet-right-original-sprite-v3.png", 421.875, 178.75, 35, 36.25),
    )
    for name, x, y, w, h in layouts:
        sprite = open_rgba(name).resize((round(w), round(h)), Image.Resampling.LANCZOS)
        canvas.alpha_composite(sprite, (round(x), round(y)))
    return canvas


closed = "bathroom-background-faucets-clean-v1.png"
states = (
    ("FRAME 1 — CURRENT 0–50%", closed),
    ("FRAME 2 — CURRENT 0–50% (IDENTICAL)", closed),
    ("FRAME 3 — CURRENT 50–75%", "bathroom-secret-panel-transition-frame3-artgen-v1.png"),
    ("FRAME 4 — CURRENT 75–100% / OPEN", "bathroom-secret-panel-open-user-reference-v1.png"),
)

tile_w, tile_h = 720, 480
label_h = 44
gap = 12
sheet = Image.new("RGB", (tile_w * 2 + gap, (tile_h + label_h) * 2 + gap), "#10151c")
draw = ImageDraw.Draw(sheet)
font_path = Path("C:/Windows/Fonts/arialbd.ttf")
font = ImageFont.truetype(str(font_path), 23) if font_path.exists() else ImageFont.load_default()

for index, (label, source) in enumerate(states):
    frame = add_faucets(open_rgba(source))
    frame = frame.resize((tile_w, tile_h), Image.Resampling.LANCZOS).convert("RGB")
    col, row = index % 2, index // 2
    x = col * (tile_w + gap)
    y = row * (tile_h + label_h + gap)
    draw.rectangle((x, y, x + tile_w - 1, y + label_h - 1), fill="#172331")
    draw.text((x + 14, y + 9), label, fill="#f4e9c6", font=font)
    sheet.paste(frame, (x, y + label_h))

OUT.parent.mkdir(parents=True, exist_ok=True)
sheet.save(OUT)
print(OUT)
