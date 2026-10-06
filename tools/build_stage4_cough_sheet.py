from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
source = Image.open(ASSETS / "player-cough-alpha-raw-v1.png").convert("RGBA")

cell_size = 420
target_height = 254
target_baseline = 398
source_cell_width = source.width // 2
output = Image.new("RGBA", (cell_size * 2, cell_size), (0, 0, 0, 0))

for index in range(2):
    cell = source.crop((index * source_cell_width, 0, (index + 1) * source_cell_width, source.height))
    bbox = cell.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError(f"Cough cell {index} has no visible pixels")
    subject = cell.crop(bbox)
    scale = target_height / subject.height
    resized = subject.resize(
        (round(subject.width * scale), target_height),
        Image.Resampling.LANCZOS,
    )
    x = index * cell_size + (cell_size - resized.width) // 2
    y = target_baseline - resized.height
    output.alpha_composite(resized, (x, y))

destination = ASSETS / "player-cough-cells-v1.png"
output.save(destination, optimize=True)
print(destination)
