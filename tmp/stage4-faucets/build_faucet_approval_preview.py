from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "faucet-middle-crop.png"
OUTPUT = ROOT / "faucet-middle-approval-preview-v3.png"
CUTOUT = ROOT / "faucet-middle-proposed-cutout-v3.png"


def checker(size, cell=12):
    image = Image.new("RGBA", size, (41, 45, 52, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if ((x // cell) + (y // cell)) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(67, 72, 82, 255))
    return image


source = Image.open(SOURCE).convert("RGBA")
scale = 4
mask_large = Image.new("L", (source.width * scale, source.height * scale), 0)
draw = ImageDraw.Draw(mask_large)

# Trace the actual middle faucet in three parts: central spout/body and both handles.
# Coordinates are in the original 100x120 source crop and are expanded only for
# antialiasing; no generated replacement artwork is used.
parts = [
    [(18, 54), (18, 47), (20, 41), (24, 35), (29, 31), (36, 30),
     (41, 34), (46, 39), (50, 46), (50, 54), (47, 60), (44, 66),
     (42, 71), (37, 75), (31, 74), (27, 70), (24, 65), (22, 59)],
    [(47, 52), (53, 52), (56, 55), (62, 56), (65, 59), (65, 63),
     (62, 66), (55, 66), (50, 63), (45, 59)],
]
for polygon in parts:
    draw.polygon([(x * scale, y * scale) for x, y in polygon], fill=255)

mask = mask_large.resize(source.size, Image.Resampling.LANCZOS)
cutout = source.copy()
cutout.putalpha(mask)

bbox = mask.getbbox()
if bbox:
    cutout = cutout.crop((max(0, bbox[0] - 2), max(0, bbox[1] - 2),
                          min(source.width, bbox[2] + 2), min(source.height, bbox[3] + 2)))
cutout.save(CUTOUT)

display_scale = 4
source_big = source.resize((source.width * display_scale, source.height * display_scale), Image.Resampling.NEAREST)
mask_big = mask.resize(source_big.size, Image.Resampling.NEAREST)

expanded = mask_big.filter(ImageFilter.MaxFilter(17))
outline_alpha = Image.new("L", expanded.size, 0)
outline_alpha = Image.eval(expanded, lambda p: p)
outline_alpha = Image.frombytes(
    "L", expanded.size,
    bytes(max(0, a - b) for a, b in zip(expanded.tobytes(), mask_big.tobytes())),
)
outline = Image.new("RGBA", source_big.size, (255, 220, 63, 0))
outline.putalpha(outline_alpha)
outlined = Image.alpha_composite(source_big, outline)

cutout_big = cutout.resize((cutout.width * display_scale, cutout.height * display_scale), Image.Resampling.NEAREST)
cutout_panel = checker(source_big.size)
paste_x = (cutout_panel.width - cutout_big.width) // 2
paste_y = (cutout_panel.height - cutout_big.height) // 2
cutout_panel.alpha_composite(cutout_big, (paste_x, paste_y))

margin = 24
gap = 24
title_h = 58
sheet = Image.new("RGBA", (margin * 2 + source_big.width * 3 + gap * 2,
                            margin * 2 + title_h + source_big.height), (17, 21, 29, 255))
sheet.alpha_composite(source_big, (margin, margin + title_h))
sheet.alpha_composite(outlined, (margin + source_big.width + gap, margin + title_h))
sheet.alpha_composite(cutout_panel, (margin + (source_big.width + gap) * 2, margin + title_h))

labels = ImageDraw.Draw(sheet)
labels.text((margin, margin + 10), "1  ORIGINAL PIXELS", fill=(236, 240, 246, 255))
labels.text((margin + source_big.width + gap, margin + 10), "2  PROPOSED TRACE", fill=(255, 220, 63, 255))
labels.text((margin + (source_big.width + gap) * 2, margin + 10), "3  ACTUAL-PIXEL CUTOUT", fill=(236, 240, 246, 255))
sheet.save(OUTPUT)
print(OUTPUT)
