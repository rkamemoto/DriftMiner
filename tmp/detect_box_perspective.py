from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
source = Image.open(root / "utility-shelf-source-crop.png").convert("RGB")
gray = np.asarray(source.convert("L"), dtype=np.float32)

# Isolate the unobstructed top-right perspective edge of the small crate beside
# the wall plate.
x0, y0, x1, y1 = 520, 285, 600, 370
roi = gray[y0:y1, x0:x1]
gx = np.zeros_like(roi)
gy = np.zeros_like(roi)
gx[:, 1:-1] = roi[:, 2:] - roi[:, :-2]
gy[1:-1, :] = roi[2:, :] - roi[:-2, :]
mag = np.hypot(gx, gy)
threshold = np.percentile(mag, 78)
ys, xs = np.nonzero(mag >= threshold)
weights = mag[ys, xs]
xs = xs.astype(np.float32) + x0
ys = ys.astype(np.float32) + y0

peaks = []
for angle in np.arange(34.0, 56.01, 0.1):
    normal = math.radians(angle + 90.0)
    rho = xs * math.cos(normal) + ys * math.sin(normal)
    bins = np.rint(rho).astype(np.int32)
    offset = -bins.min()
    hist = np.bincount(bins + offset, weights=weights)
    idx = int(hist.argmax())
    peaks.append((float(hist[idx]), float(angle), float(idx-offset)))

peaks.sort(reverse=True)
for peak in peaks[:10]:
    print(f"score={peak[0]:.1f} angle={peak[1]:.1f} rho={peak[2]:.1f}")

score, angle, rho = peaks[0]
normal = math.radians(angle + 90.0)
c, s = math.cos(normal), math.sin(normal)
xa, xb = 547.0, 582.0
ya = (rho - xa*c)/s
yb = (rho - xb*c)/s

draw = ImageDraw.Draw(source)
dark=(20,15,8); cyan=(55,235,255)
draw.line((xa,ya,xb,yb),fill=dark,width=11)
draw.line((xa,ya,xb,yb),fill=cyan,width=5)
for x,y in ((xa,ya),(xb,yb)):
    draw.ellipse((x-9,y-9,x+9,y+9),fill=cyan,outline=dark,width=4)
draw.rectangle((14,14,420,72),fill=(13,18,24))
draw.text((28,28),f"PIXEL-DETECTED BOX EDGE  {angle:.1f} deg",fill=cyan,stroke_fill=dark,stroke_width=2)
source.save(root / "pixel-detected-box-angle.png")
