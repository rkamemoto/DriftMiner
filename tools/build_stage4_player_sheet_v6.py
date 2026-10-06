from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
BASE = Image.open(ASSETS / "player-sheet-cells-v4.png").convert("RGBA")
LEGS = Image.open(ASSETS / "player-third-frame-legs-alpha-v1.png").convert("RGBA")

CELL = 420
SOURCE_CELL = LEGS.height
if BASE.size != (CELL * 3, CELL * 4):
    raise RuntimeError(f"Unexpected base sheet size: {BASE.size}")
if LEGS.width != SOURCE_CELL * 2:
    raise RuntimeError(f"Unexpected two-frame leg source size: {LEGS.size}")

output = BASE.copy()


def replace_lower_legs(source_column, target_row):
    generated = LEGS.crop((
        source_column * SOURCE_CELL,
        0,
        (source_column + 1) * SOURCE_CELL,
        SOURCE_CELL,
    )).resize((CELL, CELL), Image.Resampling.LANCZOS)

    target_x = CELL * 2  # Third animation column only.
    target_y = CELL * target_row
    original = output.crop((target_x, target_y, target_x + CELL, target_y + CELL))

    # Preserve the original frame pixel-for-pixel through the belt and hips.
    # Blend across a narrow upper-leg band, then replace the old legs fully.
    blend_start = 276
    replace_start = 310
    original_pixels = original.load()
    for y in range(replace_start, CELL):
        for x in range(CELL):
            original_pixels[x, y] = (0, 0, 0, 0)

    alpha = generated.getchannel("A")
    alpha_pixels = alpha.load()
    for y in range(CELL):
        if y < blend_start:
            factor = 0
        elif y < replace_start:
            factor = (y - blend_start) / (replace_start - blend_start)
        else:
            factor = 1
        if factor != 1:
            for x in range(CELL):
                alpha_pixels[x, y] = round(alpha_pixels[x, y] * factor)
    generated.putalpha(alpha)
    original.alpha_composite(generated)
    output.paste(original, (target_x, target_y))


# Generated source order: right-facing, then left-facing.
replace_lower_legs(source_column=0, target_row=1)
replace_lower_legs(source_column=1, target_row=3)

destination = ASSETS / "player-sheet-cells-v6.png"
output.save(destination, optimize=True)
print(destination)
print(output.size)
