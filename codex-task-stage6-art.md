# Codex art task: Stage 6 "Landfall" — replace all placeholder art

Save every file in **`driftminer/stage6/assets/`** using the exact filenames below. When you're done, tell Claude "dropped". Claude will wire the files into the code; **do not edit any code.**

---

## What the game is

**Drift Miner** is a browser game in which each stage is a different genre. Across the stages the hero:
- mines an alien artifact (Stage 1),
- defends a base (Stages 2–3),
- explores a derelict ship (Stage 4),
- flies a shoot-'em-up run to the alien homeworld (Stage 5).

**Stage 6 "Landfall"** is a **turn-based roguelike deckbuilder** in the style of *Slay the Spire* / *Monster Train*. The hero has landed on the hostile alien planet and fights on foot toward the alien **Home Base**.

A run has three screens:
- **Dig Map:** a fogged top-down grid of rock. You tunnel through it tile by tile, uncovering battles, ore veins, camps and shops, and head for the boss lair at the bottom.
- **Battle screen:** side view. The hero stands on the left and 1–3 alien enemies stand on the right. You play cards from a hand along the bottom of the screen.
- **Between battles:** you pick new cards, spend ore at a Workbench to fuse two cards into one, and shop at a Salvage Trader.

Canvas is 960×640 (3:2). All art is drawn scaled into that canvas, so art at 2× resolution is ideal.

## Global style rules

The game mixes three existing looks on purpose. Match the reference for each category:

| Category | Match this existing art | Look |
|---|---|---|
| Hero and companions | `stage4/assets/level1-airlock/player-sheet-aligned-v1.png` | Chunky, cute cartoon astronaut with thick dark outlines and soft shading. Cream-white suit, gold trim, purple gloves/boots/backpack, teal glass bubble helmet, pink antenna bulb, magenta and cyan suit lights. |
| Enemies and bosses | `stage1/assets/monsters/alien-monster-samples.png` | Detailed painted-pixel biomechanical aliens: dark gunmetal carapace plates, purple flesh, bone-white claws and spikes, glowing amber or cyan eyes and pores. Menacing but readable. |
| Backgrounds and map tiles | `stage5/assets/canyon-5-2.webp` | Painted alien terrain: rust-brown and charcoal rock, dark soil, violet and cyan crystal veins glowing inside cracks. |
| Icons and card art | Mix of the above | Bold silhouettes that read at small size, strong rim light, dark backgrounds where noted. |

- **Transparent PNG backgrounds** for characters, enemies, icons and relics. Backgrounds and card art are opaque.
- **No text, letters, numbers, UI frames or borders** in any image. The game draws all text and frames itself.
- No baked-in drop shadows under characters (the game adds its own).
- For sheets: art centered in each cell, consistent scale across cells, at least 8 px of empty padding inside each cell edge.

---

## 1. Hero

### `miner-sheet.png` — 1536×512, 4 cells of 384×512, transparent
The Stage 4 astronaut kid, same character design and colors, now armed for battle. Shown in 3/4 side view **facing RIGHT** toward the enemies, full body, with feet at the bottom of each cell (about 20 px padding).

Equipment, added to the existing suit:
- **Hand-drill** on the right arm: a chunky gold-and-gunmetal drill bit with cyan energy coils.
- **Holstered blaster** pistol on the hip.
- **Wrist gauntlet** with a small screen glowing cyan.

| Cell | Pose |
|---|---|
| 1 | **Idle:** braced fighting stance, drill raised, determined smile. |
| 2 | **Attack:** lunging forward, drill thrust out, sparks and motion at the drill tip. |
| 3 | **Skill:** standing tall, gauntlet raised, a cyan hexagon shield shimmer in front. |
| 4 | **Hurt:** recoiling backward, eyes squeezed shut, helmet glass cracked slightly. |

## 2. Companions

### `companions-sheet.png` — 1024×256, 4 cells of 256×256, transparent
Stage 1's Dog and Mouse helpers, re-imagined as small cute mining robots in the hero's suit palette (cream plating, gold trim, purple joints, cyan eye-lights). Side view **facing RIGHT**, standing on the bottom edge.

| Cell | Content |
|---|---|
| 1 | **Dog bot, idle:** a scrappy robot terrier with a small drill-bit tail, a headlamp on its forehead, ears made of folding metal flaps, sitting alert. |
| 2 | **Dog bot, attacking:** leaping forward, jaws open, small sparks. |
| 3 | **Mouse bot, idle:** a tiny round robot mouse with big dish ears, a cargo pouch on its back, and a whisker-antenna. |
| 4 | **Mouse bot, shielding:** standing on its hind legs and projecting a small cyan hexagon shield. |

## 3. Enemies

**Every enemy faces LEFT** (toward the hero) in side or 3/4 side view, standing on the bottom edge of its canvas. Transparent background. Each is a single image.

- Normal enemies: **512×512**.
- Bosses: **1024×1024**.

### Zone 1: Landing Zone (rust-orange dusty terrain)

| File | Enemy | Description |
|---|---|---|
| `enemy-crawler.png` | Spore Crawler | Small squat blob-bug, knee-high. Lumpy olive-green and purple flesh sack on six short bone legs. Pale-yellow spore pustules on its back leak glowing dust. Two wide glossy eyes and a round mouth ring of tiny teeth. Weak, swarming fodder. |
| `enemy-spitter.png` | Acid Spitter | Hunched spiky alien. Spine-covered gunmetal carapace and a long neck ending in a swollen acid sac throat glowing sickly yellow-green, mouth dripping acid. Stands on four jointed bone legs. |
| `enemy-worm.png` | Burrow Worm | Thick segmented armored worm bursting up out of a mound of rust rock and dirt; the lower half is hidden in the ground. Rust-brown plated segments, a circular mouth of inward bone teeth, amber glow deep in its throat. |
| `enemy-drone.png` | Shield Drone | Floating alien bio-drone with **no legs**, hovering about 20% above the bottom edge. Spherical gunmetal shell with bone ribs, a single large cyan eye, two small antenna fins, and a faint cyan energy ring orbiting it (it shields allies). |
| `enemy-sentinel.png` (1024) | **Boss: Landing Sentinel** | Huge four-legged biomech guardian about three times the hero's height. Heavy rust-orange and gunmetal armor plates over purple muscle. One arm is a massive glowing orange cannon, the other a sweeping bone blade. A scanning head with a vertical slit eye glows amber. Hive tendrils connect its spine to the ground. |

### Zone 2: Spore Wilds (sickly green fungal jungle)

| File | Enemy | Description |
|---|---|---|
| `enemy-sporeMother.png` | Spore Mother | Bloated fungal brood-sack on stubby legs, covered in pulsing green egg pods, some cracking open to show baby crawlers. Drooping tendrils. |
| `enemy-stalker.png` | Stalker | Lean, crouched predator. Purple skin, bone mask face with no eyes, long scythe forelimbs, tail raised. Looks ready to pounce. |
| `enemy-leech.png` | Leech | Fat glistening slug-leech rearing up, with a circular sucker mouth with teeth and translucent body showing red fluid inside. |
| `enemy-broodKnight.png` | Elite: Brood Knight | Armored alien knight with a shell shield on one arm and a bone cleaver on the other. Green fungal growths in the joints of its armor; egg pods on its back. |
| `enemy-thornback.png` (1024) | **Boss: Thornback** | Enormous armadillo-like beast whose back is covered in long bone thorns. A green spore cloud leaks from vents in its shell, and it has a crushing tusked jaw. |

### Zone 3: Hive Gate (purple bioluminescent hive architecture)

| File | Enemy | Description |
|---|---|---|
| `enemy-hiveGuard.png` | Hive Guard | Upright alien soldier with a long bone spear and a carapace tower-shield. Violet glowing seams in its armor. |
| `enemy-psionicDrone.png` | Psionic Drone | Floating brain-like organism with tendrils and a glowing violet psychic aura, three small eyes. No legs; hovers off the ground. |
| `enemy-mimic.png` | Mimic | Looks like an ore-crystal relic chest, but split open into a fanged maw with a long tongue; small legs underneath. |
| `enemy-warden.png` | Elite: Twin Warden | Tall armored hive warden with a hammer-arm and a halo of floating bone plates. Used for both twins; the game tints the second one. |
| `enemy-homeCore.png` (1024) | **Final boss: Home Base Core** | A colossal living hive heart fused into alien architecture: a giant violet crystal core behind six armored bone-and-metal iris petals. Veins and cables spread across the whole image. It should feel like the heart of the enemy base and echo the Stage 5 Hive Warden core (`stage5/assets/hive-parts-sheet.png`, row 4). |
| `enemy-turret.png` | Core Turret | Organic turret on a fleshy stalk, with a bulbous eye-lens barrel pointing left. Pairs with the Core. |

## 4. Battle backgrounds

**1920×1280, opaque, `.webp`.** Side-view alien landscape. The **ground line sits at about 63% of the height**, and units stand on it: the hero at about 21% from the left, enemies between about 54% and 85%. Keep the band from 55% to 100% of the height fairly dark and low-contrast, because cards and UI are drawn over it. Put the detail in the sky and the far distance.

| File | Scene |
|---|---|
| `bg-zone1.webp` | **Landing Zone:** rust-orange dusty plain under a hazy amber sky with two pale moons. The hero's crashed landing pod is smoking in the far left distance, and jagged canyon rock rises on both sides. Violet crystal veins run through the rocks. |
| `bg-zone2.webp` | **Spore Wilds:** dense alien fungal jungle with giant mushroom trees, floating glowing green spores, a misty teal sky, and bioluminescent ground moss. |
| `bg-zone3.webp` | **Hive Gate:** the outer wall of the alien Home Base, made of organic purple chitin towers, glowing violet windows and veins, and a huge hive gate in the distance under a dark magenta sky. |

## 5. Dig Map tiles

### `tiles-sheet.png` — 1024×256, 8 cells of 128×128, opaque, seamless edges
Top-down view, painted in the canyon style. Each tile must tile seamlessly with copies of itself.

| Cell | Tile |
|---|---|
| 1 | **Unrevealed rock A:** very dark, nearly black-brown rock with faint texture (fog of war). |
| 2 | **Unrevealed rock B:** a variant of cell 1. |
| 3 | **Undug dirt A:** visible but not yet dug; rust-brown packed soil with pebbles. |
| 4 | **Undug dirt B:** a variant of cell 3. |
| 5 | **Dug tunnel A:** darker carved-out floor with a raised rim of loose dirt and faint drill-scratch marks. |
| 6 | **Dug tunnel B:** a variant of cell 5. |
| 7 | **Bedrock A:** hard blue-grey slab with crystalline cracks; clearly impassable. |
| 8 | **Bedrock B:** a variant of cell 7. |

### `map-icons-sheet.png` — 768×256, 6×2 cells of 128×128, transparent
Bold icons drawn on top of tiles; they must read clearly at 40 px.

| Cell | Icon |
|---|---|
| 1 | **Battle:** an alien claw slash mark with red glow. |
| 2 | **Elite:** a horned alien skull with orange glow. |
| 3 | **Event:** a glowing blue alien glyph or obelisk shard. |
| 4 | **Camp:** a small tent beside a glowing cyan heater lamp. |
| 5 | **Salvage Trader:** a scrap-metal cart stacked with junk and a gold coin glint. |
| 6 | **Relic Cache:** a half-buried purple crystal-sealed capsule. |
| 7 | **Copper vein:** orange metallic ore chunks embedded in rock. |
| 8 | **Silver vein:** bright silver-white ore crystals. |
| 9 | **Gold vein:** gleaming gold nuggets with sparkle. |
| 10 | **Landing pod:** top-down view of the hero's small round drop-pod. |
| 11 | **Boss lair:** a glowing hive mouth opening in the ground, ringed with teeth and violet light. |
| 12 | Leave empty. |

## 6. Card illustrations

These fill the art window on each card. **Every cell is 320×140, opaque,** with a dark moody background tinted toward the family color and one clear subject in the center. **No text.** Each sheet has 4 columns; leave unused cells transparent or empty.

Family tint colors:

| Family | Tint |
|---|---|
| Basic | grey `#7d8a99` |
| Drill | orange `#d9822b` |
| Blaster | cyan `#2fb7cc` |
| Bomb | red `#c94242` |
| Radiation | green `#58b447` |
| Laser Sword | violet `#9262d8` |
| Companion | tan `#b8946a` |
| Ship Uplink | blue `#4a7fd6` |
| Utility | grey `#8b8d94` |
| Status | dark `#4a4350` |

When the hero appears, use the Stage 4 astronaut kid.

### `cards-basic.png` — 1280×140 (4 cells)
1. **Strike:** the hero swinging the hand-drill in a simple hit, with an impact flash.
2. **Guard:** the hero crouched behind a raised forearm with a cyan hex shield.
3. **Overheat** (status card): a red-hot blaster spewing smoke and warning sparks.
4. **Spore** (status card): a gross cloud of green spores clogging the frame.

### `cards-drill.png` — 1280×420 (4×3)
1. **Pilot Bore:** the drill tip just piercing a rock face, with orange sparks.
2. **Wind Up:** the drill spinning up, with orange energy coiling around it.
3. **Rock Breaker:** a boulder shattering under the drill.
4. **Impact Drill:** the drill releasing a huge orange shockwave burst.
5. **Bore Shield:** drill-ground rock debris forming a curved barrier.
6. **Overclock:** the drill gauge needle in the red, steam venting.
7. **Deep Core:** a vertical shaft blasted deep into glowing magma below.
8. **Perpetual Motion:** gears and a drill bit spinning in an endless loop of light.
9. **Smelter:** a small portable furnace melting ore into glowing ingots.

### `cards-blaster.png` — 1280×420 (4×3)
1. **Snap Shot:** a quick cyan bolt fired from the hip.
2. **Double Tap:** two cyan bolts in tight sequence.
3. **Suppressing Fire:** a spray of bolts pinning an alien behind a rock.
4. **Rapid Fire:** a blur of many bolts with a glowing hot barrel.
5. **Vent Heat:** blaster cooling fins opening and releasing white steam.
6. **Heat Sink:** a cyan coolant canister frosting over.
7. **Meltdown:** the blaster barrel glowing white-hot, firing a massive beam.
8. **Red Line:** a heat gauge maxed out in red with sparks.
9. **Copper Slug:** a copper ore chunk loaded into the blaster's chamber.

### `cards-bomb.png` — 1280×280 (4×2)
1. **Grenade:** a round gunmetal grenade mid-throw, pin flying.
2. **Shaped Charge:** a cone charge stuck to an alien carapace, beeping.
3. **Cluster Bomb:** many mini bomblets scattering in the air.
4. **Rocket:** a shoulder rocket streaking with a fire trail.
5. **Blast Shield:** the hero behind a riot shield as an explosion washes past.
6. **Carpet Bomb:** a line of explosions marching across the alien ground.

### `cards-radiation.png` — 1280×280 (4×2), 5 used
1. **Hot Rock:** a glowing green radioactive rock with heat shimmer.
2. **Contaminate:** a green toxic mist spreading over enemies.
3. **Half-Life:** a split green atom with a decay glow.
4. **Rad Pulse:** a green radial shockwave ring.
5. **Fallout:** green ash falling from a dark sky.

### `cards-sword.png` — 1280×280 (4×2), 5 used
1. **Slash:** a violet laser blade arc.
2. **Parry:** a violet blade blocking an alien claw, with sparks.
3. **Arc Sweep:** a wide violet crescent sweep.
4. **Flurry:** five overlapping violet blade streaks.
5. **Saber Dance:** the hero spinning with the blade, leaving a violet ribbon trail.

### `cards-companion.png` — 1280×280 (4×2), 5 used
1. **Good Boy:** the dog bot sitting proudly beside the hero's boot.
2. **Mouse Helper:** the mouse bot popping out of a cargo crate.
3. **Fetch!:** the dog bot leaping with a scrap part in its jaws.
4. **Burrow:** the mouse bot digging a little foxhole with dirt flying.
5. **Pack Leader:** the dog and mouse bots charging side by side.

### `cards-uplink.png` — 1280×280 (4×2), 5 used
Use the Stage 5 player ship (`stage5/assets/player-ship-sheet.png`: white hull, cyan dome, gold engines, drill nose) firing down from orbit.
1. **Spread Volley:** a fan of shots raining down from the sky.
2. **Homing Swarm:** curving missile trails converging on a target.
3. **Flak Screen:** bursts of flak forming a defensive ceiling.
4. **Wingmen:** two small escort fighters diving in formation.
5. **Ore Cannon:** the ship's cannon loaded with copper ore, firing.

### `cards-utility.png` — 1280×420 (4×3), 9 used
1. **Dig In:** the hero hunkered in a shallow trench.
2. **Flare:** a bright flare arcing up and lighting dark terrain.
3. **Speed Burst:** the hero's boots with jet thrust and motion streaks.
4. **Magnet:** a horseshoe magnet pulling ore chunks through the air.
5. **Survey:** a holographic scanner map projected from the gauntlet.
6. **Converter:** a compact machine turning raw ore into glowing energy cells.
7. **Field Repairs:** a repair tool sealing a crack in the suit with a green glow.
8. **Silver Lining:** a silver ore shard glowing and forming a shield.
9. **Gold Rush:** an exploding pile of gold nuggets with golden light.

## 7. Relic icons

### `relics-sheet.png` — 640×384, 5×3 cells of 128×128, transparent
Collectible artifacts recovered from the hero's past. Each is a single object with a soft glow, readable at 32 px. Painted-pixel style with dark outlines.

| Cell | Relic | Icon |
|---|---|---|
| 1 | Impact Drill | A heavy orange drill bit crackling with energy. |
| 2 | Blaster | A compact cyan pistol. |
| 3 | Bomb | A round black bomb with a lit fuse. |
| 4 | Dog | The dog bot's head (headlamp, folding ears). |
| 5 | Mouse | The mouse bot's head (big dish ears). |
| 6 | Radiation | A green glowing rock inside a cracked glass vial. |
| 7 | Rocket Launcher | A small tube launcher with a red-tipped rocket. |
| 8 | Magnet | A red and silver horseshoe magnet. |
| 9 | 3rd Eye | A violet glowing third eye in a gold setting. |
| 10 | Flare | A lit flare stick with pink-white flame. |
| 11 | Laser Sword | A violet laser sword hilt with a short ignited blade. |
| 12 | Converter | A small cube machine with an ore input and an energy output glow. |
| 13 | Speed Burst | A winged boot with jet flame. |
| 14–15 | — | Leave empty. |

## 8. UI icons

### `ui-icons-sheet.png` — 768×384, 8×4 cells of 96×96, transparent
Must read clearly at 20–28 px. Bold, simple, glowing.

| Row | Cells |
|---|---|
| **1: statuses** | (1) Weak: a cracked purple fist. (2) Vulnerable: a broken orange shield. (3) Strength: a red flexed claw. (4) Radiation: a green trefoil glow. (5) Charge: an orange spiral drill bolt. (6) Heat: a red-orange flame-thermometer. (7) Block: a solid blue-steel shield. (8) Energy: a glowing yellow energy orb. |
| **2: enemy intents** | (1) Attack: a red sword. (2) Block: a blue shield. (3) Debuff: a purple down-arrow with drips. (4) Buff: a gold up-arrow. (5) Summon: a green spawning star / egg. (6) Charging: a pulsing violet orb. (7) Unknown: a grey question-mark glyph — allowed as a shape, not a letter. (8) Leave empty. |
| **3: resources** | (1) Copper ore chip. (2) Silver ore chip. (3) Gold ore chip. (4) Scrap: a bolt-and-gear pile. (5) Hive Alert: a red alien eye. (6) Deck: a stack of cards. (7) Draw pile: a card with a down arrow. (8) Discard pile: a card with a curved arrow. |
| **4: companions in combat** | (1) Dog bot, small. (2) Mouse bot, small. (3–8) Leave empty. |

## 9. Screen backdrops

**1920×1280, opaque, `.webp`.** Keep the center fairly dark and calm, because panels and cards are drawn on top.

| File | Scene |
|---|---|
| `bg-hub.webp` | **The Forge:** inside the hero's landed ship cargo bay turned into a workshop. Anvil, glowing furnace, tool racks, upgrade parts, the cyan ship dome light overhead. Warm orange and teal lighting. |
| `bg-camp.webp` | **Field Camp:** a small night camp in a rock hollow. Tent, glowing cyan heater, the dog and mouse bots resting, stars and alien moons above. Quiet and safe. |
| `bg-workbench.webp` | **Workbench:** a portable field workbench with a vice, welding torch, ore bins (copper, silver, gold) and two card-shaped tech chips being fused with a spark. |
| `bg-trader.webp` | **Salvage Trader:** a ramshackle scrap stall built into a crashed alien hull. A friendly hooded alien scavenger with four arms and glowing goggles stands behind piles of junk, ore and relics. |
| `bg-event.webp` | A generic mysterious alien location: glowing blue glyphs on standing stones in fog. Used behind event text. |

### Event illustrations — 960×400, opaque, `.png`

| File | Scene |
|---|---|
| `event-probe.png` | A crashed human space probe half-buried in rust sand, sparking, with a hatch open and something glowing inside. |
| `event-sporePool.png` | A glowing green pool in a fungal grotto, bubbling, with spores floating above. |
| `event-mouse.png` | A lost little mouse bot (as in §2) hiding in a rock crevice, looking up hopefully. |

---

## Checklist

| Group | Files |
|---|---|
| Hero | `miner-sheet.png` |
| Companions | `companions-sheet.png` |
| Enemies, Zone 1 | `enemy-crawler`, `enemy-spitter`, `enemy-worm`, `enemy-drone`, `enemy-sentinel` |
| Enemies, Zone 2 | `enemy-sporeMother`, `enemy-stalker`, `enemy-leech`, `enemy-broodKnight`, `enemy-thornback` |
| Enemies, Zone 3 | `enemy-hiveGuard`, `enemy-psionicDrone`, `enemy-mimic`, `enemy-warden`, `enemy-homeCore`, `enemy-turret` |
| Battle backgrounds | `bg-zone1/2/3.webp` |
| Dig Map | `tiles-sheet.png`, `map-icons-sheet.png` |
| Card art | `cards-basic`, `cards-drill`, `cards-blaster`, `cards-bomb`, `cards-radiation`, `cards-sword`, `cards-companion`, `cards-uplink`, `cards-utility` (all `.png`) |
| Relics and UI | `relics-sheet.png`, `ui-icons-sheet.png` |
| Screen backdrops | `bg-hub`, `bg-camp`, `bg-workbench`, `bg-trader`, `bg-event` (all `.webp`) |
| Events | `event-probe`, `event-sporePool`, `event-mouse` (all `.png`) |

All enemy files are `.png`. Total: 42 files.
