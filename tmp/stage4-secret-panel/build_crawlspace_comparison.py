from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
CLOSED = PROJECT / "assets" / "stage4" / "level4-bathroom" / "bathroom-background-closed-v2.png"
OPEN = Path(r"C:\Users\RyanKamemoto\.codex\generated_images\019f55d9-5ed2-77c1-bf66-3d0a3cebfacc\exec-2e7c1225-808c-4a94-a68e-cdfb3f99b75a.png")
OUT = ROOT / "crawlspace-before-after-v1.png"

ROOT.mkdir(parents=True, exist_ok=True)
closed = Image.open(CLOSED).convert("RGBA").resize((768, 512), Image.Resampling.LANCZOS)
opened = Image.open(OPEN).convert("RGBA").resize((768, 512), Image.Resampling.LANCZOS)
header = 52
sheet = Image.new("RGBA", (1536, 512 + header), (16, 20, 29, 255))
sheet.alpha_composite(closed, (0, header))
sheet.alpha_composite(opened, (768, header))
draw = ImageDraw.Draw(sheet)
draw.text((24, 18), "BEFORE — CLOSED SECRET PANEL", fill=(238, 242, 248, 255))
draw.text((792, 18), "AFTER — OPEN CRAWLSPACE", fill=(255, 211, 101, 255))
sheet.save(OUT)
print(OUT)
