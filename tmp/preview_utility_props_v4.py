from pathlib import Path
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parent.parent
assets = root / "assets/stage4/level3-utility-closet"
room = Image.open(assets / "utility-closet-background-v4.png").convert("RGBA")

def place(name, rect, outline=False):
    prop = Image.open(assets / name).convert("RGBA")
    x, y, w, h = rect
    target = (round(x * 1.6), round(y * 1.6), round(w * 1.6), round(h * 1.6))
    prop = prop.resize((target[2], target[3]), Image.Resampling.LANCZOS)
    if outline:
        alpha = prop.getchannel("A")
        halo = alpha.filter(ImageFilter.MaxFilter(17))
        border = Image.new("RGBA", prop.size, (255, 216, 58, 0))
        border.putalpha(Image.eval(Image.fromarray(__import__('numpy').maximum(
            __import__('numpy').asarray(halo, dtype='uint8'),
            __import__('numpy').asarray(alpha, dtype='uint8')
        )), lambda value: value))
        room.alpha_composite(border, (target[0], target[1]))
    room.alpha_composite(prop, (target[0], target[1]))

place("hose-sprite-v1.png", (78, 168, 110, 80), outline=True)
place("clean-rag-sprite-v1.png", (228, 244, 80, 54))
place("stuck-cable-end-v2.png", (625, 118, 96, 48))
place("toolbox-closed-in-room-v1.png", (805, 299, 125, 114))
room.convert("RGB").save(root / "tmp/utility-props-v4-preview.png")
