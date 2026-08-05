from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent
ROOM = ROOT.parent.parent / "assets" / "stage4" / "level4-bathroom" / "bathroom-background-closed-v2.png"
SPRITE = ROOT / "generated-faucet-room-style-alpha-v2.png"
OUTPUT = ROOT / "generated-faucet-full-room-preview-v3.png"

room = Image.open(ROOM).convert("RGBA")
sprite_source = Image.open(SPRITE).convert("RGBA")
bbox = sprite_source.getchannel("A").getbbox()
sprite_source = sprite_source.crop(bbox)

# Preview only: center generated faucet over the middle sink's existing faucet.
target_h = 58
target_w = round(sprite_source.width * target_h / sprite_source.height)
sprite = sprite_source.resize((target_w, target_h), Image.Resampling.LANCZOS)
x = 560 - target_w // 2
y = 312


def composite(highlight=False):
    image = room.copy()
    if highlight:
        alpha = sprite.getchannel("A")
        expanded = alpha.filter(ImageFilter.MaxFilter(9))
        ring = ImageChops.subtract(expanded, alpha)
        glow = ring.filter(ImageFilter.GaussianBlur(4))
        glow_layer = Image.new("RGBA", room.size, (255, 211, 101, 0))
        glow_patch = Image.new("RGBA", sprite.size, (255, 211, 101, 0))
        glow_patch.putalpha(glow.point(lambda p: round(p * .7)))
        glow_layer.alpha_composite(glow_patch, (x, y))
        image = Image.alpha_composite(image, glow_layer)
        ring_patch = Image.new("RGBA", sprite.size, (255, 211, 101, 0))
        ring_patch.putalpha(ring)
        image.alpha_composite(ring_patch, (x, y))
    image.alpha_composite(sprite, (x, y))
    return image.resize((768, 512), Image.Resampling.LANCZOS)


normal = composite(False)
hover = composite(True)
header = 52
sheet = Image.new("RGBA", (1536, 512 + header), (15, 19, 27, 255))
sheet.alpha_composite(normal, (0, header))
sheet.alpha_composite(hover, (768, header))
draw = ImageDraw.Draw(sheet)
draw.text((24, 18), "NORMAL SPRITE ON FULL ROOM ART", fill=(238, 242, 248, 255))
draw.text((792, 18), "SAME ALPHA SPRITE WITH GAME-STYLE HOVER", fill=(255, 211, 101, 255))
sheet.save(OUTPUT)
print(OUTPUT)
