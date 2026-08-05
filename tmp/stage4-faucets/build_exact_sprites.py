from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / "tmp" / "stage4-faucets"
OUT = ROOT / "assets" / "stage4" / "level4-bathroom"

SPECS = {
    "left": ((15, 35, 70, 104), "faucet-left-mask-v1.png"),
    "middle": ((21, 31, 66, 99), "faucet-middle-mask-v1.png"),
    "right": ((20, 28, 67, 98), "faucet-right-mask-v1.png"),
}

for name, (target_box, mask_name) in SPECS.items():
    crop = Image.open(TMP / f"faucet-{name}-crop.png").convert("RGBA")
    mask = Image.open(OUT / mask_name).convert("RGBA")
    alpha = mask.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        raise RuntimeError(f"Empty mask for {name}")
    alpha = alpha.crop(bounds).resize(
        (target_box[2] - target_box[0], target_box[3] - target_box[1]),
        Image.Resampling.LANCZOS,
    )
    fitted = Image.new("L", crop.size, 0)
    fitted.paste(alpha, target_box[:2])
    crop.putalpha(fitted)
    crop.save(OUT / f"faucet-{name}-sprite-v1.png")
