from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stage4" / "level1-airlock"


def alpha_crop(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if not bounds:
        raise ValueError("Sprite has no visible pixels")
    return image.crop(bounds)


def padded_sprite(source: Path, destination: Path, size: int, padding: int) -> None:
    sprite = alpha_crop(Image.open(source))
    available = size - padding * 2
    scale = min(available / sprite.width, available / sprite.height)
    resized = sprite.resize(
        (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))),
        Image.Resampling.LANCZOS,
    )
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.alpha_composite(
        resized,
        ((size - resized.width) // 2, (size - resized.height) // 2),
    )
    output.save(destination, optimize=True)


def main() -> None:
    # Recover the exact warm-gold ladder pixels from the approved source while
    # using the clean ladder extraction only as an alpha silhouette. The old
    # full rectangular source crop also contained the original plush and wall.
    ladder_source = Image.open(ASSETS / "ladder-markup-source.png").convert("RGBA")
    ladder_mask_source = Image.open(ASSETS / "object-ladder-v4.png").convert("RGBA")
    ladder_box = (86, 107, 199, 539)
    ladder_crop = ladder_source.crop(ladder_box)
    ladder_crop.putalpha(ladder_mask_source.getchannel("A"))
    clean_ladder = Image.new("RGBA", ladder_source.size, (0, 0, 0, 0))
    clean_ladder.alpha_composite(ladder_crop, ladder_box[:2])
    clean_ladder.save(ASSETS / "object-ladder-clean-v5.png", optimize=True)

    padded_sprite(
        ASSETS / "maintenance-tag-sprite-v1.png",
        ASSETS / "maintenance-tag-world-v1.png",
        256,
        12,
    )
    padded_sprite(
        ASSETS / "sealed-helmet-installed-sprite-v1.png",
        ASSETS / "sealed-helmet-installed-world-v1.png",
        384,
        10,
    )
    padded_sprite(
        ASSETS / "maintenance-drawer-open-sprite-v1.png",
        ASSETS / "maintenance-drawer-open-world-v1.png",
        320,
        8,
    )
    room = Image.open(ASSETS / "airlock-background-toy-clean-v2.png").convert("RGBA")
    room = room.resize((960, 640), Image.Resampling.LANCZOS)
    installed = Image.open(ASSETS / "sealed-helmet-installed-world-v1.png").convert("RGBA")
    installed = installed.resize((240, 240), Image.Resampling.LANCZOS)
    room.alpha_composite(installed, (365, -5))
    room.save(ASSETS / "sealed-helmet-placement-preview-v1.png", optimize=True)
    sources = {
        "helmet": "helmet-sprite-v1.png",
        "sealant": "sealant-patch-sprite-v3.png",
        "patched-helmet": "patched-helmet-sprite-v1.png",
        "maintenance-tag": "maintenance-tag-sprite-v1.png",
    }
    for name, source in sources.items():
        padded_sprite(
            ASSETS / source,
            ASSETS / f"inventory-{name}-v1.png",
            96,
            5,
        )


if __name__ == "__main__":
    main()
