from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stage4" / "level1-airlock"
BACKGROUND = Image.open(ASSETS / "airlock-background-clean-v2.png").convert("RGBA")
SCALE = BACKGROUND.width / 960


def points(values):
    return [(round(x * SCALE), round(y * SCALE)) for x, y in values]


def save_mask(name, painter):
    mask = Image.new("L", BACKGROUND.size, 0)
    painter(ImageDraw.Draw(mask))
    cutout = Image.new("RGBA", BACKGROUND.size, (0, 0, 0, 0))
    cutout.paste(BACKGROUND, (0, 0), mask)
    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError(f"Empty highlight mask: {name}")
    cutout.crop(bbox).save(ASSETS / f"highlight-{name}-v1.png", optimize=True)
    print(name, bbox)


def save_object(name, painter):
    mask = Image.new("L", BACKGROUND.size, 0)
    painter(ImageDraw.Draw(mask), mask)
    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError(f"Empty object mask: {name}")
    sprite = Image.new("RGBA", BACKGROUND.size, (0, 0, 0, 0))
    sprite.paste(BACKGROUND, (0, 0), mask)
    sprite.crop(bbox).save(ASSETS / f"object-{name}-v1.png", optimize=True)
    print(f"object-{name}", bbox)


def save_solid_hover(name, painter):
    mask = Image.new("L", BACKGROUND.size, 0)
    painter(ImageDraw.Draw(mask), mask)
    flooded = mask.copy()
    ImageDraw.floodfill(flooded, (BACKGROUND.width - 1, 0), 255)
    enclosed_holes = ImageChops.invert(flooded)
    solid = ImageChops.lighter(mask, enclosed_holes)
    bbox = solid.getbbox()
    if not bbox:
        raise RuntimeError(f"Empty solid hover mask: {name}")
    sprite = Image.new("RGBA", BACKGROUND.size, (0, 0, 0, 0))
    sprite.paste(BACKGROUND, (0, 0), solid)
    sprite.crop(bbox).save(ASSETS / f"hover-{name}-solid-v1.png", optimize=True)
    print(f"hover-{name}-solid", bbox)


def save_hover_shape(name, painter):
    mask = Image.new("L", BACKGROUND.size, 0)
    painter(ImageDraw.Draw(mask), mask)
    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError(f"Empty hover shape: {name}")
    sprite = Image.new("RGBA", BACKGROUND.size, (0, 0, 0, 0))
    sprite.paste(BACKGROUND, (0, 0), mask)
    sprite.crop(bbox).save(ASSETS / f"hover-{name}-shape-v1.png", optimize=True)
    print(f"hover-{name}-shape", bbox)


outer = points([(28,188),(51,159),(83,145),(118,140),(149,156),(176,204),(187,264),(173,329),(138,372),(89,389),(41,368),(14,319),(14,249)])
save_mask("outer-hatch", lambda draw: draw.line(outer + [outer[0]], fill=255, width=round(3 * SCALE), joint="curve"))

locker = points([(275,235),(294,218),(332,218),(353,241),(353,391),(266,391),(263,259)])
save_mask("locker", lambda draw: draw.line(locker + [locker[0]], fill=255, width=round(3 * SCALE), joint="curve"))

ladder_segments = [
    [(453,137),(449,410)], [(515,135),(517,410)],
    [(454,188),(515,188)], [(453,221),(515,221)],
    [(453,256),(516,256)], [(453,291),(516,291)],
    [(453,327),(516,327)], [(453,364),(517,364)],
    [(451,397),(517,397)],
]
save_mask("ladder", lambda draw: [draw.line(points(segment), fill=255, width=round(4 * SCALE)) for segment in ladder_segments])

leak = points([(464,83),(493,75),(524,78),(536,94),(527,111),(498,119),(467,111),(453,96)])
save_mask("leak", lambda draw: draw.line(leak + [leak[0]], fill=255, width=round(3 * SCALE), joint="curve"))

# The aqua oval machine is scenery, not the ID scanner. Keep its screen as a
# static restoration sprite because the clean background plate removed it.
scanner_display = points([(699,255),(733,258),(752,284),(749,322),(729,350),(698,349),(680,322),(681,289)])

# The actual ID scanner is the small three-light console high on the right
# wall. This polygon hugs only that console and excludes its wall mounting.
scanner = points([(821,36),(894,32),(906,44),(906,74),(896,83),(827,84),(817,75),(817,47)])
save_mask("scanner", lambda draw: draw.line(scanner + [scanner[0]], fill=255, width=round(3 * SCALE), joint="curve"))

# Trace the inset door leaf, not the surrounding frame. The previous nine
# point mask included frame/background chunks and visibly missed the top-left
# and lower edges of the painted hatch.
inner = points([(837,183),(921,183),(948,208),(949,390),(933,413),(846,413),(829,390),(829,208)])
save_mask("inner-door", lambda draw: draw.line(inner + [inner[0]], fill=255, width=round(3 * SCALE), joint="curve"))


def paint_outer_hatch(draw, mask):
    draw.line(outer + [outer[0]], fill=255, width=round(34 * SCALE), joint="curve")
save_object("outer-hatch", paint_outer_hatch)
save_solid_hover("outer-hatch", paint_outer_hatch)

locker_inner = points([(286,251),(299,231),(329,231),(341,249),(341,378),(277,378),(277,263)])
locker_leaf = points([(350,230),(378,237),(382,392),(360,405),(350,392)])
def paint_locker(draw, mask):
    draw.polygon(locker, fill=255)
    draw.polygon(locker_inner, fill=0)
    draw.polygon(locker_leaf, fill=255)
save_object("locker", paint_locker)
save_solid_hover("locker", paint_locker)

save_object("ladder", lambda draw, mask: draw.rectangle((round(440*SCALE), round(132*SCALE), round(525*SCALE), round(420*SCALE)), fill=255))
leak_object_box = (round(370*SCALE), round(48*SCALE), round(575*SCALE), round(142*SCALE))
save_object("leak", lambda draw, mask: draw.ellipse(leak_object_box, fill=255))
save_object("scanner-display", lambda draw, mask: draw.polygon(scanner_display, fill=255))
save_object("scanner", lambda draw, mask: draw.polygon(scanner, fill=255))
save_object("inner-door", lambda draw, mask: draw.polygon(inner, fill=255))

def paint_ladder_hover(draw, mask):
    for segment in ladder_segments:
        draw.line(points(segment), fill=255, width=round(13 * SCALE))
save_hover_shape("ladder", paint_ladder_hover)
save_solid_hover("leak", lambda draw, mask: draw.ellipse(leak_object_box, fill=255))
save_solid_hover("scanner", lambda draw, mask: draw.polygon(scanner, fill=255))
save_solid_hover("inner-door", lambda draw, mask: draw.polygon(inner, fill=255))
