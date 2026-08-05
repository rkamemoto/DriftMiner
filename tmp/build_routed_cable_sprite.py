from pathlib import Path
from PIL import Image
import math

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "assets/stage4/level3-utility-closet/stuck-cable-pull-v2.png").convert("RGBA")
hose_source = Image.open(root / "assets/stage4/level3-utility-closet/hose-sprite-v1.png").convert("RGBA")
out = root / "assets/stage4/level3-utility-closet/routed-cable-to-panel-v2.png"
preview = root / "tmp/routed-cable-to-panel-preview-v2.png"

# Full-canvas transparent sprite so the in-game placement cannot drift.
canvas = Image.new("RGBA", (960, 640), (0, 0, 0, 0))

# The cable connector should sit a little higher on the opened blue panel, and
# the cable should tuck into the dark shelf recess instead of sagging low.
panel_anchor = (572, 94)
shelf_anchor = (668, 84)
dx = shelf_anchor[0] - panel_anchor[0]
dy = shelf_anchor[1] - panel_anchor[1]
angle = math.degrees(math.atan2(dy, dx))
length = math.hypot(dx, dy) + 34

# Scale the existing painted cable art instead of redrawing a line.
scaled_w = int(length)
scaled_h = int(source.height * scaled_w / source.width)
cable = source.resize((scaled_w, scaled_h), Image.LANCZOS)

# Slightly desaturate/darken so it sits in the grey utility closet art and no
# longer reads like a bright purple marker stroke.
r, g, b, a = cable.split()
cable = Image.merge("RGBA", (
    r.point(lambda v: int(v * 0.82)),
    g.point(lambda v: int(v * 0.86)),
    b.point(lambda v: min(255, int(v * 0.94))),
    a,
))

# Source connector center after scaling. This is the point that should touch
# the panel anchor after rotation.
connector_anchor = (int(54 * scaled_w / source.width), int(58 * scaled_h / source.height))
rotated = cable.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)

# Compute where the connector anchor ended up after PIL's expand+rotate.
theta = math.radians(angle)
cx, cy = cable.width / 2, cable.height / 2
ax, ay = connector_anchor
rx = (ax - cx) * math.cos(theta) - (ay - cy) * math.sin(theta)
ry = (ax - cx) * math.sin(theta) + (ay - cy) * math.cos(theta)
rot_anchor = (rotated.width / 2 + rx, rotated.height / 2 + ry)
paste = (round(panel_anchor[0] - rot_anchor[0]), round(panel_anchor[1] - rot_anchor[1]))
canvas.alpha_composite(rotated, paste)

# Add a small painted hose wrap/loop around the cable near the panel end. This
# is intentionally made from the existing hose art, not a hand-drawn stroke.
hose_bbox = hose_source.getbbox()
hose = hose_source.crop(hose_bbox)
# Crop the purple coupling and a short attached hose segment; it reads like the
# hose has been looped/tied onto the cable.
hw, hh = hose.size
hose_tie = hose.crop((int(hw * .54), int(hh * .52), int(hw * .98), int(hh * .92)))
hose_tie = hose_tie.resize((58, 34), Image.LANCZOS)
hose_tie = hose_tie.rotate(angle - 4, resample=Image.Resampling.BICUBIC, expand=True)
canvas.alpha_composite(hose_tie, (548, 91))
canvas.save(out)

bg = Image.open(root / "assets/stage4/level3-utility-closet/utility-closet-background-v5.png").convert("RGBA").resize((960, 640), Image.LANCZOS)
bg.alpha_composite(canvas)
bg.save(preview)
print(out)
print(preview)
