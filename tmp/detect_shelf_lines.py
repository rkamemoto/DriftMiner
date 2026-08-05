from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
image = Image.open(root / "utility-shelf-source-crop.png").convert("L")
arr = np.asarray(image, dtype=np.float32)

# Shelf-only analysis window: excludes the vent and most of the upper rack.
x0, y0, x1, y1 = 210, 260, 690, 640
roi = arr[y0:y1, x0:x1]

gx = np.zeros_like(roi)
gy = np.zeros_like(roi)
gx[:, 1:-1] = roi[:, 2:] - roi[:, :-2]
gy[1:-1, :] = roi[2:, :] - roi[:-2, :]
mag = np.hypot(gx, gy)

threshold = np.percentile(mag, 90)
ys, xs = np.nonzero(mag >= threshold)
weights = mag[ys, xs]
xs = xs.astype(np.float32) + x0
ys = ys.astype(np.float32) + y0

candidates = []
for line_angle in np.arange(20.0, 46.01, 0.25):
    normal = math.radians(line_angle + 90.0)
    rho = xs * math.cos(normal) + ys * math.sin(normal)
    bins = np.rint(rho).astype(np.int32)
    offset = -bins.min()
    hist = np.bincount(bins + offset, weights=weights)
    for idx in np.argpartition(hist, -8)[-8:]:
        candidates.append((float(hist[idx]), float(line_angle), float(idx - offset)))

candidates.sort(reverse=True)
selected = []
for score, angle, rho in candidates:
    if any(abs(angle - a) < 1.0 and abs(rho - r) < 10 for _, a, r in selected):
        continue
    selected.append((score, angle, rho))
    if len(selected) == 20:
        break

for score, angle, rho in selected:
    print(f"score={score:9.1f} angle={angle:5.2f} rho={rho:7.1f}")

# Render the strongest shelf-like candidates so the selected pixels can be
# checked against the painted rail instead of trusting the numeric peak alone.
color_image = Image.open(root / "utility-shelf-source-crop.png").convert("RGB")
draw = ImageDraw.Draw(color_image)
test_lines = [
    (28.0, 159.0, (255, 221, 52), "A 28.0"),
    (29.5, 144.0, (55, 235, 255), "B 29.5"),
]
for angle, rho, color, label in test_lines:
    normal = math.radians(angle + 90.0)
    c, s = math.cos(normal), math.sin(normal)
    xa, xb = 210.0, 690.0
    ya = (rho - xa * c) / s
    yb = (rho - xb * c) / s
    draw.line((xa, ya, xb, yb), fill=(20, 15, 8), width=11)
    draw.line((xa, ya, xb, yb), fill=color, width=5)
    for x, y in ((xa, ya), (xb, yb)):
        draw.ellipse((x - 8, y - 8, x + 8, y + 8), fill=color, outline=(20, 15, 8), width=4)
    draw.text((xa + 8, ya - 30), label, fill=color, stroke_fill=(20, 15, 8), stroke_width=3)

    # Report contiguous x ranges where the painted pixels actually support the
    # candidate line within a narrow three-pixel band.
    supported = []
    for x in range(int(xa), int(xb) + 1):
        y = int(round((rho - x * c) / s))
        local_x = x - x0
        local_y = y - y0
        if 0 <= local_x < mag.shape[1] and 2 <= local_y < mag.shape[0] - 2:
            supported.append(bool(mag[local_y - 2:local_y + 3, local_x].max() >= threshold))
        else:
            supported.append(False)
    runs = []
    run_start = None
    for i, ok in enumerate(supported + [False]):
        if ok and run_start is None:
            run_start = i
        elif not ok and run_start is not None:
            if i - run_start >= 5:
                runs.append((int(xa) + run_start, int(xa) + i - 1))
            run_start = None
    print(label, "supported runs", runs)

color_image.save(root / "pixel-detected-shelf-candidates.png")
