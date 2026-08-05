from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets" / "stage4" / "level4-bathroom"
OUTPUT = ROOT / "tmp" / "stage4-secret-panel" / "secret-panel-current-frame3-frame4-contact-v1.png"
FRAME3_OUTPUT = ROOT / "tmp" / "stage4-secret-panel" / "secret-panel-current-frame3-v1.png"

base = Image.open(ASSETS / "bathroom-background-faucets-clean-v1.png").convert("RGBA").resize((960, 640), Image.Resampling.LANCZOS)
sheet = Image.open(ASSETS / "bathroom-secret-panel-animation-artgen-clean-v1.png").convert("RGBA")
trash = Image.open(ASSETS / "bathroom-secret-panel-trash-foreground-v2.png").convert("RGBA")
frame4 = Image.open(ASSETS / "bathroom-secret-panel-open-user-reference-v1.png").convert("RGBA")

frame_width = 75
frame_height = 180
frame3_index = 9
frame3_patch = sheet.crop((frame3_index * frame_width, 0, (frame3_index + 1) * frame_width, frame_height))
frame3 = base.copy()
frame3.alpha_composite(frame3_patch, (580, 70))
frame3 = Image.alpha_composite(frame3, trash)
frame3.save(FRAME3_OUTPUT)

contact = Image.new("RGBA", (1920, 640), (255, 255, 255, 255))
contact.paste(frame3, (0, 0))
contact.paste(frame4, (960, 0))
contact.save(OUTPUT)
print(OUTPUT)
print(FRAME3_OUTPUT)
