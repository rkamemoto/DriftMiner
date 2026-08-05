from pathlib import Path
from PIL import Image
import math

root = Path(__file__).resolve().parent.parent
assets = root / "assets/stage4/level3-utility-closet"
out = root / "tmp/wire-pull-alignment-preview.gif"
sheet = Image.open(assets / "player-wire-pull-v1.png").convert("RGBA")
cable = Image.open(assets / "stuck-cable-pull-v2.png").convert("RGBA")
wire = Image.open(assets / "stuck-cable-end-v3.png").convert("RGBA")
bg = Image.open(assets / "utility-closet-background-v4.png").convert("RGBA").resize((960, 640), Image.Resampling.LANCZOS)

scale = 1
player_x, player_y = 570, 372
wire_rect = (608, 123, 67, 34)
anchor_x, anchor_y = wire_rect[0] + wire_rect[2] - 6, wire_rect[1] + wire_rect[3] * .5
sprite_x, sprite_y = player_x - 88, player_y - 275
draw_w, draw_h = 176, 233
frame_w = sheet.width // 3

def paste_rotated(base, img, x, y, angle):
    rotated = img.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    base.alpha_composite(rotated, (round(x - rotated.width / 2), round(y - rotated.height / 2)))

frames = []
for i, t in enumerate([0.08, 0.32, 0.62, 0.86]):
    frame_index = 0 if t < .24 else 1 if t < .58 else 2
    recoil = math.sin(t * 28) * 1.5 if frame_index == 2 else 0
    hand_offsets = [(135, 143), (118, 164), (94, 169)]
    plug_x = sprite_x + recoil + hand_offsets[frame_index][0]
    plug_y = sprite_y + hand_offsets[frame_index][1]
    room = bg.copy()

    # Pull cable, matching stage4.js during utilityAction.type === "wire".
    # The static shelf connector is not drawn during the action.
    dx, dy = anchor_x - plug_x, anchor_y - plug_y
    length = math.hypot(dx, dy)
    angle = math.degrees(math.atan2(dy, dx))
    plug_full = (plug_x * scale, plug_y * scale)
    connector_w = 58
    connector_h = 36
    cable_start = 28
    cable_length = max(4, length - cable_start)
    strip_w = round(max(length + 16, connector_w + 32) * scale)
    strip_h = round(58 * scale)
    strip = Image.new("RGBA", (strip_w, strip_h), (0, 0, 0, 0))
    cable_body = cable.crop((145, 0, 383, 116)).resize((round(cable_length * scale), round(16 * scale)), Image.Resampling.LANCZOS)
    strip.alpha_composite(cable_body, (round(cable_start * scale), round((29 - 8) * scale)))
    connector = cable.crop((0, 0, 150, 116)).resize((round(connector_w * scale), round(connector_h * scale)), Image.Resampling.LANCZOS)
    strip.alpha_composite(connector, (round(-connector_w * .72 * scale), round((29 - connector_h * .5) * scale)))
    rotated = strip.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    room.alpha_composite(rotated, (round(plug_full[0]), round(plug_full[1] - rotated.height / 2)))

    # Player pull frame.
    crop = sheet.crop((frame_index * frame_w + 2, 2, (frame_index + 1) * frame_w - 2, sheet.height - 2))
    player = crop.resize((round(draw_w * scale), round(draw_h * scale)), Image.Resampling.LANCZOS)
    room.alpha_composite(player, (round((sprite_x + recoil) * scale), round(sprite_y * scale)))

    frames.append(room.convert("P", palette=Image.Palette.ADAPTIVE))

frames[0].save(out, save_all=True, append_images=frames[1:], duration=260, loop=0)
print(out)
