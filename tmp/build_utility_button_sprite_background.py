from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
src = root / "assets/stage4/level3-utility-closet/utility-closet-background-v4.png"
sprite_out = root / "assets/stage4/level3-utility-closet/door-blue-button-sprite-v1.png"
clean_out = root / "assets/stage4/level3-utility-closet/utility-closet-background-v5.png"
preview_out = root / "tmp/utility-door-button-sprite-implemented-preview.png"

im = Image.open(src).convert("RGBA")
clean = im.copy()

# Original-art coordinates for the small wall-mounted cyan panel beside the
# center/back door. These are intentionally tight around the object plus cable.
box = (852, 110, 970, 282)
crop = im.crop(box)

mask = Image.new("L", crop.size, 0)
d = ImageDraw.Draw(mask)
d.rounded_rectangle((24, 16, 94, 98), radius=18, fill=255)
d.polygon([(34, 91), (80, 91), (69, 142), (43, 142)], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(0.65))

sprite = Image.new("RGBA", crop.size, (0, 0, 0, 0))
sprite.alpha_composite(crop)
sprite.putalpha(mask)
trim = sprite.getbbox()
sprite = sprite.crop(trim)
sprite_out.parent.mkdir(parents=True, exist_ok=True)
sprite.save(sprite_out)

# Remove the panel from the background with a local wall patch sampled to the
# immediate left. This keeps the door art stable and avoids painting new shapes.
paste_box = (box[0] + trim[0], box[1] + trim[1], box[0] + trim[2], box[1] + trim[3])
patch_src = (paste_box[0] - 126, paste_box[1], paste_box[2] - 126, paste_box[3])
patch = im.crop(patch_src)
patch = patch.filter(ImageFilter.GaussianBlur(0.45))
patch_mask = Image.new("L", patch.size, 0)
pd = ImageDraw.Draw(patch_mask)
pd.rounded_rectangle((0, 0, patch.width, patch.height), radius=16, fill=255)
patch_mask = patch_mask.filter(ImageFilter.GaussianBlur(2.2))
clean.paste(patch, paste_box[:2], patch_mask)
clean.save(clean_out)

# Canvas-space preview: clean background + sprite + only square button outline.
canvas = clean.resize((960, 640), Image.LANCZOS)
sprite_canvas = sprite.resize((round(sprite.width * 0.625), round(sprite.height * 0.625)), Image.LANCZOS)
draw_x = round((box[0] + trim[0]) * 0.625)
draw_y = round((box[1] + trim[1]) * 0.625)
canvas.alpha_composite(sprite_canvas, (draw_x, draw_y))
d = ImageDraw.Draw(canvas)
# Button housing highlight, not the dangling cable.
d.rounded_rectangle((548, 79, 592, 131), radius=10, outline=(255, 214, 72, 255), width=3)
d.text((520, 48), "sprite overlay + square-only highlight", fill=(255, 235, 120, 255))
canvas.save(preview_out)

print(sprite_out)
print(clean_out)
print(preview_out)
