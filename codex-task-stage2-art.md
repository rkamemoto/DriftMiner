# Codex art task: Stage 2 "Hold the Base", replacing all placeholder art

Save every file in **`driftminer/stage2/assets/`** using the exact filenames below. When you're done, tell Claude "dropped". Claude will wire the files into the code. **Do not edit any code.**

---

## What the game is

**Drift Miner** is a browser game where each stage is a different genre. In **Stage 2 "Hold the Base"**, the hero has dug up an alien artifact, and it's locked inside a small mining base on the surface of a barren moon. Alien ships dive out of the sky in waves (20 waves, then endless) and drop bombs on the base.

The player controls a **defense cannon** that slides left/right along the top of the base and aims 360° up into the sky. It's a fixed-screen **Missile Command / Space Invaders-style** defense game.
- Shot-down ships drop **debris** (currency) and sometimes a **relic pickup** that unlocks a special weapon: homing missiles, flak, EMP, railgun, gravity well, drones or seeker rounds.
- Every 5th wave is a **boss**. The bosses alternate between the **Carrier** (a wide mothership that strafes sideways and releases small ships) and the **Dreadnought** (a heavy bomber that drops big bombs).

**View:** side-on, looking at the sky with the ground strip along the bottom. **Canvas is 960×640.** Everything is drawn at 1× into that canvas, so **draw art at 2× the listed in-game size**.

Right now every graphic is a flat placeholder polygon or rectangle (cyan triangle ships, a rectangle base, a stick cannon). See "What's there now" below.

## Global style rules

Match the rest of the game:

| Category | Match this existing art | Look |
|---|---|---|
| Alien ships, bombs, bosses | `stage5/assets/enemy-ships-sheet-v2.png`, `stage5/assets/hive-warden.png`, `stage1/assets/monsters/alien-monster-samples.png` | Painted biomechanical aliens: dark gunmetal carapace plates, purple flesh, bone-white spikes, glowing amber/cyan/violet pores and eyes. Menacing but readable at small size. |
| Base, cannon, drones, mines (human tech) | `stage5/assets/player-ship-sheet.png` and the Stage 4 airlock art (`stage4/assets/level1-airlock/`) | Chunky industrial mining tech: cream-white and gunmetal panels, gold/amber trim, teal (#68d6c7) indicator lights, hazard stripes, rivets. Friendly and sturdy, not military-sleek. |
| Background | `stage5/assets/canyon-5-2.webp` | Painted alien terrain: rust-brown and charcoal rock, violet and cyan crystal veins in the cracks. |

- **Transparent PNG backgrounds** for every sprite. The background is opaque.
- **No text, letters, numbers, UI frames or health bars** in any image. The game draws HP bars and text itself.
- No baked-in drop shadows.
- For sheets: art centered in each cell, consistent scale across cells, and **at least 8 px of empty padding** inside each cell edge.
- **Strong silhouettes and rim light.** The sky is dark navy (#101923), so sprites must pop against it.
- Keep the game's color language, because gameplay depends on it:
  - Normal enemies = cool cyan-steel
  - Elite = violet with gold eyes
  - Dreadnought boss = crimson with green core
  - Carrier boss = purple with amber engine strip
  - Enemy bombs = red, plasma bombs = violet
  - Player tech = teal and gold

---

## 1. `sky-background.png`, 1920×1280, opaque

The full play field at 2×.
- **Top 70%: sky.** A deep navy-to-black alien sky with faint stars and a thin violet/teal nebula wisp. Add a **large ringed gas planet** low on one side (dim, so it doesn't compete with enemies) and a few distant asteroid specks. Keep the middle of the sky dark and empty: that's where enemies fly.
- **Bottom ~12% (the bottom 156 px at 2×): moon surface.** Rocky charcoal/rust ground with small craters and violet crystal shards, flat along its top edge.
- **Don't paint the base** in this image; it's a separate sprite. Leave the bottom-center of the ground plain so the base can sit on it.
- Low contrast overall: it's a backdrop behind fast action.

## 2. `sky-background-danger.png`, 1920×1280, opaque

The same composition as #1, recolored for **boss waves**: a red-orange atmospheric glow on the horizon, the planet in shadow, and faint smoke columns rising from the ground. Every element must stay in the same position as #1 so the game can crossfade between them.

## 3. `base-sheet.png`, 1536×512, transparent, 3 columns × 1 row, each cell 512×512

The fortified mining base that holds the artifact. In game it's **340 px wide × about 70 px tall** (680×140 at 2×), sitting on the ground at the bottom-center of the screen. Draw it side-on, anchored to the bottom of the cell.
- A low, wide armored bunker with angled armor plates, a reinforced dome or hatch in the center, antennae, floodlights and cargo crates on the sides.
- A small **window or glow slot showing the cyan-violet artifact** inside.
- The center of its roof is a **flat rail/track** that the cannon slides along. Keep the top edge clear and flat across the middle 80%.

Cells:
1. Intact
2. Damaged (below 50% integrity): scorch marks, a broken floodlight, sparks, a small fire
3. Critical (below 20%): heavy damage, plates torn open, smoke, the artifact glow flickering red

## 4. `turret-sheet.png`, 1024×512, transparent, 4 columns × 2 rows, each cell 256×256

The player's defense cannon. In game the **base/carriage is about 70 px wide**, and the barrel is **about 52 px long** and rotates around a pivot.

**Row 1: the carriage** (does not rotate). Draw it centered horizontally, with its **pivot point exactly at the center of the cell**. Treads/wheels on a rail mount, a domed housing with a teal light.
1. Normal
2. Overheated (vents glowing orange, heat shimmer)
3. Shield up (translucent teal energy bubble over it)
4. Hit flash (nearly white)

**Row 2: barrels** (the game rotates them). Draw them **pointing straight UP**, with the breech end at the **center of the cell (the pivot)**. One barrel per primary weapon:
1. Cannon (default): a sturdy single barrel with a muzzle brake, gold trim
2. Scatter: a stubby triple-barrel cluster
3. Rail: a long, thin twin-rail with cyan coils
4. Shocker / Bomb: a short, fat barrel with a glowing electric tip. If you can only fit one, make it look like an arc emitter.

## 5. `enemies-sheet.png`, 1536×768, transparent, 6 columns × 3 rows, each cell 256×256

Alien diving attack ships, seen **side-on from slightly below, nose pointing DOWN** (they dive toward the base).
- In game, normal ships are about 35–55 px wide and elites about 50–70 px wide, so they must read at that size.
- Leave a little empty space below each ship: the game draws an HP bar under it.

| Row | Ship | Look |
|---|---|---|
| 1 | **Diver** (normal) | Sleek arrowhead bio-ship, cyan-steel plates, one amber eye |
| 2 | **Elite Diver** | Bigger, spikier, violet carapace, gold glowing eyes, bomb pods under the wings |
| 3 | **Swarmling** (the small ship the Carrier releases) | Tiny wasp-like drone, about 60% the size of a Diver |

Columns for every row:
1. Base frame
2. Engine/wing-flap animation frame
3. Third animation frame (loops 1 → 2 → 3)
4. Hit flash (whole silhouette nearly white)
5. Damaged (cracked, leaking light)
6. Bomb-release pose (bomb bay open, glow)

## 6. `boss-carrier.png`, 1024×512, transparent, plus `boss-carrier-sheet.png`, 1536×512, 3 columns × 1 row, each cell 512×512

**Carrier mothership.** In game it's about **150 px wide × 60 px tall**. It's wide and flat, and it slides side to side across the top of the screen.
- A purple organic hull shaped like a manta/hammerhead, a **glowing amber engine/launch strip across its belly**, hangar mouths that release Swarmlings, and bone ridges on top.
- `boss-carrier.png`: the main art, large and detailed.
- Sheet cells:
  1. Normal
  2. Hangars open (launching, amber glow brighter)
  3. Hit flash (nearly white)

## 7. `boss-dreadnought.png`, 1024×1024, transparent, plus `boss-dreadnought-sheet.png`, 1536×512, 3 columns × 1 row, each cell 512×512

**Dreadnought heavy bomber.** In game it's about **100 px wide × 90 px tall**. It's bulky and descends slowly, nose down.
- A crimson armored carapace, a **green glowing reactor core** in the center, a heavy bomb bay underneath, and twin spike prongs at the front.
- Sheet cells:
  1. Normal
  2. Bomb bay open (dropping)
  3. Hit flash

## 8. `projectiles-sheet.png`, 1536×512, transparent, 6 columns × 2 rows, each cell 256×256

The game draws these at about **12–36 px**, so they need bold, simple shapes. Draw **vertical pieces pointing DOWN** for enemy items and **pointing UP** for player items.

**Row 1, enemy:**
1. **Heavy bomb**: a red bio-bomb pod with an amber fuse glow on top, about 22–30 px in game
2. Heavy bomb hit flash
3. **Plasma bomb**: a violet glowing orb with a white-hot center, about 16 px in game
4. Plasma bomb hit flash
5. Bomb fragment (small red shard)
6. Enemy shot (small amber bolt)

**Row 2, player:**
1. Cannon shell (teal-white bolt with a short trail)
2. Seeker round (cyan, with a tiny fin)
3. Homing missile (gold body, red exhaust flame)
4. Flak shell (orange, ribbed)
5. Drone shot (mint-green pellet)
6. Scatter pellet (small teal-white)

## 9. `pickups-sheet.png`, 1280×512, transparent, 5 columns × 2 rows, each cell 256×256

Collectibles that fall slowly and spin. In game they're **about 24–36 px across**. Draw each one as a **floating relic capsule or crystal with a colored halo**. Every icon must be readable at small size and in its own color:

**Row 1:**
1. **Debris, common**: a chunk of gray-blue scrap metal with a teal glint
2. **Debris, rare**: a gold-trimmed chunk of alien alloy
3. **Carapace**: a mint-green alien shell plate (the upgrade currency)
4. **Homing relic**: violet (#a97cff), with an arrowhead/missile motif
5. **Flak relic**: orange (#ffb44a), with a starburst motif

**Row 2:**
1. **EMP relic**: cyan (#63e6ff), with a lightning-in-a-ring motif
2. **Railgun relic**: salmon-red (#ff8f70), with a crosshair motif
3. **Gravity relic**: blue (#6da9ff), with a black-hole swirl motif
4. **Drones relic**: green (#7ee3a1), with a little winged drone motif
5. **Weapon Core**: salmon-red and gold, more ornate than the others (it's the rare "change your main gun" pickup), with a zig-zag energy glyph. Make it feel special.

Also add **Seeker relic** (light cyan #8ce6ff, a comet/arc-arrow motif) as a sixth icon. Put it in its own file, `pickup-seeker.png`, 256×256.

## 10. `support-sheet.png`, 1024×512, transparent, 4 columns × 2 rows, each cell 256×256

Player-deployed gadgets:
1. **Defense drone**, frame 1: a small hovering mint-green/white drone with twin rotors, about 18 px wide in game
2. Defense drone, frame 2 (rotor blur)
3. **Mine, unarmed**: a gray disc mine, about 18 px in game
4. **Mine, armed**: the same mine with a pulsing red-orange light ring
5. **Gravity well core**: a swirling blue vortex. It must tile/scale well, since the game scales it to a 60–120 px radius
6. **EMP ring**: a thin cyan electric ring on transparency (it gets scaled up from small to huge)
7. **Flak burst ring**: an orange shockwave ring
8. **Railgun beam segment**: a vertical, seamless tile, white-hot core with a pale-cyan glow, 64 px wide. Draw it centered in the cell.

## 11. `explosions-sheet.png`, 2048×512, transparent, 8 columns × 2 rows, each cell 256×256

**Row 1:** an 8-frame **ship explosion** (flash, then fireball, then violet-tinged smoke with bone fragments, then fade).

**Row 2:** an 8-frame **bomb impact on the base** (orange flash, a dirt/debris plume, smoke). Draw it anchored to the bottom of the cell, because it plays on top of the base.

## 12. `artifact-icon.png`, 256×256, transparent

The alien artifact the base protects: a floating cyan-violet crystal relic in a bone-and-metal cradle. The game uses it for the base-integrity HUD and the game-over screen.

---

## What's there now (for reference only, so don't copy it)

- Enemies: cyan arrowhead triangles with a dark slit eye
- Base: two stacked gray rectangles with a teal stripe
- Cannon: a teal block with a salmon stick barrel
- Pickups: small colored stars, circles and arrows

## Deliverables checklist

```
stage2/assets/
  sky-background.png
  sky-background-danger.png
  base-sheet.png
  turret-sheet.png
  enemies-sheet.png
  boss-carrier.png
  boss-carrier-sheet.png
  boss-dreadnought.png
  boss-dreadnought-sheet.png
  projectiles-sheet.png
  pickups-sheet.png
  pickup-seeker.png
  support-sheet.png
  explosions-sheet.png
  artifact-icon.png
```

Before you say "dropped", check that:
1. Every file exists with the exact name and pixel size listed above.
2. The sheets line up with their grids, and nothing crosses a cell edge.
3. Sprite backgrounds are truly transparent (no white or checkerboard pixels).
4. Barrels point up and their pivots are at the cell center.
5. Diving ships point down.
