# Codex art prompts: 5-5 homeworld, Hive Warden parts, boss beams

Save every file in: driftminer/assets/stage5/ (exact names). Then tell Claude "dropped".

**Style for all:** same painted biomechanical alien look as the existing Stage 5 art (dark gunmetal plates, purple flesh, bone spikes, cyan and violet glow). Transparent PNG backgrounds. No text, no borders, no drop shadows baked in.

---

## 1. homeworld-5-5.png  (1024x1024, transparent)

The alien homeworld, seen from space, top-down game backdrop. Replaces the flat dark disc.
- A huge dark planet, viewed as a full sphere, centered, filling about 90% of the canvas.
- Surface: black-purple crust with glowing violet cracks and veins, bone-white ridge spires, faint city-like clusters of cyan lights.
- Thick atmosphere haze on the top-right rim (violet-magenta glow), deep shadow on the lower-left.
- Soft alpha edge on the atmosphere. Nothing outside the sphere except the haze.
- Must look like a place worth fearing, not a flat blob: visible texture and depth.

## 2. hive-parts-sheet.png  (1536x1024, transparent, 6 columns x 4 rows, each cell 256x256, art centered in cell, top-down view)

Destructible parts for the Hive Warden boss. Every part is seen from above.

Row 1, pods (round glowing egg-pods that sit in bone sockets):
1. Pod intact, dim glow
2. Pod intact, bright glow (pulse peak)
3. Pod hit flash (nearly white)
4. Pod cracking, leaking violet light
5. Pod destroyed: burnt empty socket with smoking crater
6. Pod destroyed variant, slightly different shape

Row 2, cannon bases (round armored turret mounts, NO barrel):
1. Shielded (cyan energy film over it)
2. Unshielded, warm red-orange glow
3. Hit flash (white)
4. Damaged, cracked plates
5. Destroyed, scorched crater
6. Destroyed variant

Row 3, cannon barrels (twin-barrel, drawn pointing RIGHT, centered on the pivot point in the middle of the cell so it can rotate):
1. Normal
2. Hit flash
3. Firing (muzzle glow)
4 to 6: leave empty

Row 4, core:
1. Armored iris CLOSED (six overlapping bone-and-metal petals over a violet light)
2. Iris opening (petals half retracted)
3. Core OPEN: exposed pulsing violet crystal heart, bright
4. Core open, hit flash (white)
5. Core dying, cracked and overloaded
6. leave empty

## 3. beams-sheet.png  (1536x1024, transparent, three colour variants in rows)

For ALL boss beams. Row A = purple/magenta (Hive Warden, Leviathan). Row B = red-orange (Hangar Warden, Blockade Cruiser). Row C = cyan-white (Nebula Stalker). Each row has 6 cells, each 256x256:

1. Beam body, VERTICAL, seamless tile top to bottom, bright white-hot core fading to a colored glow at the edges, slight energy ripples
2. Beam body wide variant (same, thicker, for the peak of the shot)
3. Telegraph lane: faint warning stripe, VERTICAL, seamless tile, dashed edge lines, low opacity, same colour
4. Telegraph lane, "locked" state: brighter, tighter lines
5. Muzzle flare: where the beam starts (round bloom with sparks)
6. Impact splash: where the beam hits the bottom edge or the player (radial burst, sparks)

The game rotates these for sideways beams, so keep them symmetrical left to right.

## Optional 4. eye-beam-charge.png  (512x512, transparent)
Charging glow for the eye-beam bosses: a swirling ball of energy with tiny arcs, red-orange, white center.
