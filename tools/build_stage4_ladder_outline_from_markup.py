from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
SOURCE = Image.open(ASSETS / "ladder-markup-source.png").convert("RGBA")
MARKUP = Image.open(ASSETS / "ladder-markup-highlightv2.PNG").convert("RGB")

if MARKUP.size != SOURCE.size:
    raise RuntimeError(f"Markup {MARKUP.size} does not match source {SOURCE.size}")

pixels = np.asarray(MARKUP).astype(np.int16)
red, green, blue = pixels[..., 0], pixels[..., 1], pixels[..., 2]
# Select the editor's exact #FED430 marker color. Broad "yellow" thresholds
# also catch the naturally golden deck at the bottom of this scene.
yellow = (abs(red - 254) <= 4) & (abs(green - 212) <= 5) & (abs(blue - 48) <= 6)

# Preserve the user's outline as a stroke. A light median/blur pass removes
# brush jitter without expanding it into the ladder interior.
alpha = Image.fromarray(np.where(yellow, 255, 0).astype(np.uint8), "L")
alpha = alpha.filter(ImageFilter.MedianFilter(3))
alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))

highlight = Image.new("RGBA", SOURCE.size, (255, 211, 101, 0))
highlight.putalpha(alpha)
output = ASSETS / "highlight-ladder-v4.png"
highlight.save(output, optimize=True)

preview = SOURCE.copy()
preview_overlay = Image.new("RGBA", SOURCE.size, (255, 211, 101, 0))
preview_overlay.putalpha(alpha.point(lambda value: int(value * 0.94)))
preview.alpha_composite(preview_overlay)
preview_output = ASSETS / "highlight-ladder-v4-preview.png"
preview.save(preview_output, optimize=True)

print(output)
print(preview_output)
print("size", SOURCE.size, "highlight pixels", int((np.asarray(alpha) > 32).sum()))
