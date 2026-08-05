from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
ASSET_DIR = PROJECT / "assets" / "stage4" / "level4-bathroom"
ORIGINAL_PATH = ASSET_DIR / "bathroom-background-closed-v2.png"
BACKGROUND_OUT = ASSET_DIR / "bathroom-background-faucets-clean-v1.png"
PREVIEW_OUT = ROOT / "all-original-faucets-implemented-preview-v1.png"

CONFIGS = {
    "left": {
        "clean": ROOT / "bathroom-left-faucet-removed-preview-v1.png",
        "roi": (360, 280, 470, 390),
        "limit": [(12, 16), (84, 16), (96, 31), (96, 78), (83, 89), (14, 89), (5, 73), (5, 31)],
    },
    "middle": {
        "clean": ROOT / "bathroom-middle-faucet-removed-preview-v1.png",
        "roi": (525, 285, 615, 372),
        "limit": [(12, 18), (68, 18), (76, 30), (76, 71), (65, 79), (12, 79), (6, 68), (6, 31)],
    },
    "right": {
        "clean": ROOT / "bathroom-right-faucet-removed-preview-v1.png",
        "roi": (650, 260, 770, 380),
        "limit": [(13, 15), (91, 15), (102, 30), (102, 82), (89, 94), (15, 94), (6, 77), (6, 30)],
    },
}


def largest_component(mask):
    pixels = mask.load()
    width, height = mask.size
    seen = set()
    components = []
    for yy in range(height):
        for xx in range(width):
            if pixels[xx, yy] == 0 or (xx, yy) in seen:
                continue
            stack = [(xx, yy)]
            seen.add((xx, yy))
            component = []
            while stack:
                cx, cy = stack.pop()
                component.append((cx, cy))
                for ny in range(max(0, cy - 1), min(height, cy + 2)):
                    for nx in range(max(0, cx - 1), min(width, cx + 2)):
                        if pixels[nx, ny] and (nx, ny) not in seen:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
            components.append(component)
    result = Image.new("L", mask.size, 0)
    output = result.load()
    for xx, yy in (max(components, key=len) if components else []):
        output[xx, yy] = 255
    return result


original = Image.open(ORIGINAL_PATH).convert("RGBA")
clean_background = original.copy()
sprites = {}

for name, config in CONFIGS.items():
    roi = config["roi"]
    source = original.crop(roi)
    clean_full = Image.open(config["clean"]).convert("RGBA")
    clean_source = clean_full.crop(roi)
    diff = ImageChops.difference(source.convert("RGB"), clean_source.convert("RGB"))
    mask = ImageOps.grayscale(diff).point(lambda p: 255 if p >= 26 else 0)
    mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
    limit = Image.new("L", source.size, 0)
    ImageDraw.Draw(limit).polygon(config["limit"], fill=255)
    mask = largest_component(ImageChops.multiply(mask, limit))
    mask = mask.filter(ImageFilter.GaussianBlur(.55))

    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError(f"No faucet pixels found for {name}")
    padded = (max(0, bbox[0] - 3), max(0, bbox[1] - 3),
              min(source.width, bbox[2] + 3), min(source.height, bbox[3] + 3))
    sprite = source.crop(padded)
    sprite.putalpha(mask.crop(padded))
    sprite_path = ASSET_DIR / f"faucet-{name}-original-sprite-v2.png"
    sprite.save(sprite_path)
    offset = (roi[0] + padded[0], roi[1] + padded[1])
    sprites[name] = {"image": sprite, "offset": offset, "path": sprite_path}

    # Replace only the faucet silhouette and a narrow antialiased edge with the
    # locally inpainted clean plate. Preserve all other original room pixels.
    removal_mask = mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(.7))
    clean_background.paste(clean_source, (roi[0], roi[1]), removal_mask)

clean_background.save(BACKGROUND_OUT)


def composite(highlight_name=None):
    image = clean_background.copy()
    for name, data in sprites.items():
        sprite = data["image"]
        offset = data["offset"]
        if name == highlight_name:
            alpha = sprite.getchannel("A")
            expanded = alpha.filter(ImageFilter.MaxFilter(11))
            ring = ImageChops.subtract(expanded, alpha)
            glow = ring.filter(ImageFilter.GaussianBlur(4))
            glow_patch = Image.new("RGBA", sprite.size, (255, 211, 101, 0))
            glow_patch.putalpha(glow.point(lambda p: round(p * .72)))
            image.alpha_composite(glow_patch, offset)
            ring_patch = Image.new("RGBA", sprite.size, (255, 211, 101, 0))
            ring_patch.putalpha(ring)
            image.alpha_composite(ring_patch, offset)
        image.alpha_composite(sprite, offset)
    return image.resize((768, 512), Image.Resampling.LANCZOS)


normal = composite()
highlight = composite("middle")
header = 52
preview = Image.new("RGBA", (1536, 512 + header), (15, 19, 27, 255))
preview.alpha_composite(normal, (0, header))
preview.alpha_composite(highlight, (768, header))
labels = ImageDraw.Draw(preview)
labels.text((24, 18), "THREE ORIGINAL-PIXEL FAUCET SPRITES", fill=(238, 242, 248, 255))
labels.text((792, 18), "MIDDLE FAUCET HOVER", fill=(255, 211, 101, 255))
preview.save(PREVIEW_OUT)

for name, data in sprites.items():
    image = data["image"]
    x, y = data["offset"]
    print(f"{name}: {data['path']} source=({x},{y},{image.width},{image.height}) canvas=({x*0.625:.3f},{y*0.625:.3f},{image.width*0.625:.3f},{image.height*0.625:.3f})")
print(f"background: {BACKGROUND_OUT}")
print(f"preview: {PREVIEW_OUT}")
