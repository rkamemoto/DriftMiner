from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parent.parent
asset_dir = root / "assets/stage4/level3-utility-closet"
generated = Image.open(
    Path.home() / ".codex/generated_images/019f55d9-5ed2-77c1-bf66-3d0a3cebfacc/exec-33034840-81a3-4a2c-ab39-37b1fc0963fe.png"
).convert("RGBA")
old_clean = Image.open(asset_dir / "utility-closet-background-v3.png").convert("RGBA")

# The toolbox was rendered directly onto the shelf for correct perspective.
# Cut its outside silhouette as a sprite, then restore the shelf beneath it so
# the interactive closed/open states remain independent of the background.
toolbox_contour = [
    (1304, 485), (1407, 484), (1429, 491), (1447, 506),
    (1459, 527), (1467, 553), (1476, 580), (1481, 606),
    (1478, 626), (1468, 642), (1451, 651), (1338, 651),
    (1321, 645), (1310, 633), (1303, 616), (1298, 594),
    (1294, 570), (1295, 542), (1298, 515),
]
mask = Image.new("L", generated.size, 0)
ImageDraw.Draw(mask).polygon(toolbox_contour, fill=255)

crop_box = (1288, 478, 1488, 660)
toolbox = generated.crop(crop_box)
toolbox.putalpha(mask.crop(crop_box))
toolbox.save(asset_dir / "toolbox-closed-in-room-v1.png")

# Feather a slightly expanded restoration mask so the old clean tabletop
# replaces the baked toolbox without a visible rectangular seam.
restore_mask = mask.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(10))
background = Image.composite(old_clean, generated, restore_mask)
background.save(asset_dir / "utility-closet-background-v4.png")

# The first pull frame contains the purple endpoint and a short cable lead.
# Crop only that endpoint; the old mounting plate and coil are intentionally
# outside this asset.
sheet = Image.open(asset_dir / "wire-stretch-sheet-v1.png").convert("RGBA")
endpoint = sheet.crop((176, 318, 390, 486))
alpha_box = endpoint.getchannel("A").getbbox()
if alpha_box:
    endpoint = endpoint.crop(alpha_box)
endpoint.save(asset_dir / "stuck-cable-end-v2.png")

# A long painted lead for the interaction pose. It retains the purple plug and
# braided cable but ends before the obsolete mounting plate begins.
pull_lead = sheet.crop((680, 290, 1110, 480))
pull_alpha_box = pull_lead.getchannel("A").getbbox()
if pull_alpha_box:
    pull_lead = pull_lead.crop(pull_alpha_box)
pull_lead.save(asset_dir / "stuck-cable-pull-v2.png")

print("wrote", asset_dir / "utility-closet-background-v4.png")
print("wrote", asset_dir / "toolbox-closed-in-room-v1.png", toolbox.size)
print("wrote", asset_dir / "stuck-cable-end-v2.png", endpoint.size)
print("wrote", asset_dir / "stuck-cable-pull-v2.png", pull_lead.size)
