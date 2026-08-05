from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
ASSETS = PROJECT / "assets" / "stage4" / "level4-bathroom"
OUT = ROOT / "right-faucet-highlight-water-alignment-v1.png"
SPRITE_OUT = ASSETS / "faucet-right-original-sprite-v3.png"

background = Image.open(ASSETS / "bathroom-background-faucets-clean-v1.png").convert("RGBA")
original = Image.open(ASSETS / "bathroom-background-closed-v2.png").convert("RGBA")

# Keep the original painted faucet pixels, but replace the overly broad
# difference-mask with a close silhouette around the faucet itself.
sprite = original.crop((675, 286, 731, 344))
mask = Image.new("L", sprite.size, 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.polygon(
    [
        (14, 12), (18, 9), (25, 9), (30, 12), (34, 17), (35, 21),
        (40, 22), (43, 25), (43, 33), (41, 37), (37, 38), (34, 35),
        (34, 29), (31, 27), (31, 43), (29, 48), (25, 51), (21, 49),
        (19, 45), (19, 25), (17, 20), (14, 17),
    ],
    fill=255,
)
mask = mask.filter(ImageFilter.GaussianBlur(0.65))
sprite.putalpha(mask)
sprite.save(SPRITE_OUT)

# Source-pixel coordinates used by the game (canvas coordinates are 0.625x).
sprite_x, sprite_y = 675, 286
current_origin = (round(443 / 0.625), round(213 / 0.625))
# The visible mouth of the right spout, measured on the extracted original art.
proposed_origin = (714, 322)
basin_y = round(237 / 0.625)


def add_outline(room: Image.Image) -> None:
    alpha = sprite.getchannel("A")
    expanded = alpha.filter(ImageFilter.MaxFilter(11))
    ring = ImageChops.subtract(expanded, alpha)
    glow = ring.filter(ImageFilter.GaussianBlur(4))
    glow_patch = Image.new("RGBA", sprite.size, (255, 211, 101, 0))
    glow_patch.putalpha(glow.point(lambda p: round(p * 0.72)))
    room.alpha_composite(glow_patch, (sprite_x, sprite_y))
    ring_patch = Image.new("RGBA", sprite.size, (255, 211, 101, 0))
    ring_patch.putalpha(ring)
    room.alpha_composite(ring_patch, (sprite_x, sprite_y))


def render(origin, color, label):
    room = background.copy()
    add_outline(room)
    room.alpha_composite(sprite, (sprite_x, sprite_y))
    draw = ImageDraw.Draw(room, "RGBA")
    x, y = origin
    draw.line((x, y, x, basin_y), fill=color + (230,), width=7)
    draw.ellipse((x - 8, y - 8, x + 8, y + 8), fill=color + (255,), outline=(20, 24, 32, 255), width=3)
    crop = room.crop((610, 245, 790, 420)).resize((630, 612), Image.Resampling.LANCZOS)
    panel = Image.new("RGBA", (630, 680), (18, 23, 33, 255))
    panel.alpha_composite(crop, (0, 68))
    ImageDraw.Draw(panel).text((22, 22), label, fill=color + (255,))
    return panel


current = render(current_origin, (255, 105, 105), "CURRENT WATER ORIGIN")
proposed = render(proposed_origin, (92, 235, 255), "PROPOSED: SPOUT OUTLET")
sheet = Image.new("RGBA", (1260, 680), (18, 23, 33, 255))
sheet.alpha_composite(current, (0, 0))
sheet.alpha_composite(proposed, (630, 0))
sheet.save(OUT)
print(OUT)
