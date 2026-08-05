from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
SOURCE = ROOT / "player-disgust-gag-alpha-raw-v1.png"
OUT = PROJECT / "assets" / "stage4" / "level4-bathroom" / "player-disgust-gag-sheet-v1.png"

source = Image.open(SOURCE).convert("RGBA")
cell_w = source.width // 4
crop_top = 90
crop_height = 600
sheet = Image.new("RGBA", (cell_w * 4, crop_height), (0, 0, 0, 0))

for frame in range(4):
    cell = source.crop((frame * cell_w, crop_top, (frame + 1) * cell_w, crop_top + crop_height))
    sheet.alpha_composite(cell, (frame * cell_w, 0))

sheet.save(OUT)
print(OUT)
