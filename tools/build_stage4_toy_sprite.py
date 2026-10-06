from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
source = Image.open(ASSETS / "alien-toy-alpha-raw-v1.png").convert("RGBA")
bbox = source.getchannel("A").getbbox()
if not bbox:
    raise RuntimeError("Alien toy source has no visible pixels")

padding = 8
left = max(0, bbox[0] - padding)
top = max(0, bbox[1] - padding)
right = min(source.width, bbox[2] + padding)
bottom = min(source.height, bbox[3] + padding)
sprite = source.crop((left, top, right, bottom))

destination = ASSETS / "alien-toy-sprite-v1.png"
sprite.save(destination, optimize=True)
print(destination)
