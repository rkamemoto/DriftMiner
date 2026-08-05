from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

root = Path(__file__).resolve().parent.parent
assets = root / "assets/stage4/level3-utility-closet"
room = Image.open(assets / "utility-closet-background-v4.png").convert("RGBA")

SCALE = 1.6
wire_rect = (608, 123, 67, 34)

def scaled_rect(rect):
    x, y, w, h = rect
    return tuple(round(v * SCALE) for v in (x, y, w, h))

def paste_prop(name, rect, outline=False):
    prop = Image.open(assets / name).convert("RGBA")
    x, y, w, h = scaled_rect(rect)
    prop = prop.resize((w, h), Image.Resampling.LANCZOS)
    if outline:
        alpha = prop.getchannel("A")
        halo = alpha.filter(ImageFilter.MaxFilter(19))
        solid = Image.new("RGBA", prop.size, (255, 220, 44, 255))
        border = Image.new("RGBA", prop.size, (0, 0, 0, 0))
        border.alpha_composite(solid)
        border.putalpha(halo)
        room.alpha_composite(border, (x, y))
    room.alpha_composite(prop, (x, y))

paste_prop("hose-sprite-v1.png", (82, 238, 110, 72))
paste_prop("clean-rag-sprite-v1.png", (228, 244, 80, 54))
paste_prop("toolbox-closed-in-room-v1.png", (805, 299, 125, 114))
paste_prop("stuck-cable-end-v3.png", wire_rect, outline=True)

draw = ImageDraw.Draw(room)
x, y, w, h = scaled_rect(wire_rect)
draw.rounded_rectangle((x - 8, y - 8, x + w + 8, y + h + 8), radius=10, outline=(255, 220, 44, 255), width=5)
draw.line((x + w // 2, y + h + 8, x + w // 2, y + h + 54), fill=(255, 220, 44, 255), width=4)
draw.ellipse((x + w // 2 - 7, y + h + 48, x + w // 2 + 7, y + h + 62), fill=(255, 220, 44, 255))

out = root / "tmp/utility-wire-door-shelf-preview.png"
room.convert("RGB").save(out)
print(out)
