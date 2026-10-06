from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
SOURCE = Image.open(ASSETS / "ladder-markup-source.png").convert("RGBA")
MARKUP = Image.open(ASSETS / "ladder-markup-highlight.PNG").convert("RGB")

pixels = np.asarray(MARKUP).astype(np.int16)
red, green, blue = pixels[..., 0], pixels[..., 1], pixels[..., 2]

# The user's marker is the solid (254, 212, 48) yellow. Select only that
# paint—not similarly warm gold pixels from the ladder or floor artwork.
paint = (red >= 245) & (green >= 195) & (green <= 225) & (blue >= 35) & (blue <= 65)
marked_alpha = Image.fromarray(np.where(paint, 255, 0).astype(np.uint8), "L")

# The saved markup was cropped after painting. Matching its unchanged artwork
# against the source locates that crop at x=2, y=45 with no scaling.
alpha = Image.new("L", SOURCE.size, 0)
alpha.paste(marked_alpha, (2, 45))

# Smooth brush wobble without filling the deliberately open rung spaces.
alpha = alpha.filter(ImageFilter.MaxFilter(3))
alpha = alpha.filter(ImageFilter.MedianFilter(5))
alpha = alpha.filter(ImageFilter.GaussianBlur(1.0))
alpha = alpha.point(lambda value: 255 if value >= 112 else 0)
alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))

bbox = alpha.getbbox()
if not bbox:
    raise RuntimeError("No yellow ladder markup was found")

# Restore the complete ladder artwork—including every rung—from the untouched
# source. This is the visible object sprite, independent of the yellow overlay.
object_sprite = Image.new("RGBA", SOURCE.size, (0, 0, 0, 0))
object_sprite.paste(SOURCE, (0, 0), alpha)
object_sprite = object_sprite.crop(bbox)
object_output = ASSETS / "object-ladder-v4.png"
object_sprite.save(object_output, optimize=True)

# Pull the hover fill inward so it sits inside the painted rails and rungs.
highlight_alpha = alpha.filter(ImageFilter.MinFilter(9))
highlight_bbox = highlight_alpha.getbbox()
highlight = Image.new("RGBA", SOURCE.size, (254, 212, 48, 0))
highlight.putalpha(highlight_alpha)
highlight = highlight.crop(highlight_bbox)

output = ASSETS / "highlight-ladder-v3.png"
highlight.save(output, optimize=True)

preview = SOURCE.copy()
preview_overlay = Image.new("RGBA", SOURCE.size, (254, 212, 48, 0))
preview_overlay.putalpha(highlight_alpha.point(lambda value: int(value * 0.88)))
preview.alpha_composite(preview_overlay)
preview_output = ASSETS / "highlight-ladder-v3-preview.png"
preview.save(preview_output, optimize=True)
print(object_output)
print(output)
print(preview_output)
print("source", SOURCE.size, "object", object_sprite.size, "bbox", bbox)
print("highlight", highlight.size, "bbox", highlight_bbox)
