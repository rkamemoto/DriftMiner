# Codex task: Stage 6 "Landfall" — Zone 3 (Hive Gate) extra art (11 monsters + 3 map icons)

Zone 3 is playable, but 11 hive monsters and 3 map icons still draw with canvas placeholders. This task makes the art for them. No code changes are needed: each file is picked up automatically when it exists at the path below (the game loads `assets/<file>` lazily and keeps the placeholder if the file is missing).

Drop all files into `stage6/assets/`. Do not touch or overwrite any existing file.

## Style (match the existing art)

Open these first and match their rendering, outline weight, shading and colour feel:

- **Zone 3 enemies that already exist:** `enemy-hiveGuard.png`, `enemy-psionicDrone.png`, `enemy-mimic.png`, `enemy-warden.png`, `enemy-turret.png`, `enemy-homeCore.png`. The new hive monsters must look like they belong to the same army.
- **Zone 2 art made in the last pass** (`enemy-puffcap.png`, `enemy-rotHulk.png`, `enemy-glowcap.png`, ...) for the exact painted-pixel rendering and detail level.

Look: detailed painted-pixel biomechanical aliens, thick dark outlines, strong rim light, a clear silhouette that reads at about 100–150 px tall on a 960x640 screen. No text, no ground shadow plate, no background.

**Hive palette (Zone 3 is the alien Hive Gate):** chitin purples and violets, dark gunmetal plates, bone-white spikes and claws, glowing **amber resin** and **magenta/violet psionic light**. Eyes and pores glow amber or magenta. Keep these colours consistent across every monster below so they read as one hive. Avoid the green fungal look of Zone 2.

## Technical rules (all monsters)

- **512x512 PNG, transparent background**, one single image per file (not a sheet).
- **Faces LEFT** (toward the hero) in side or 3/4 side view.
- **Stands on the bottom edge** of the canvas, about 20 px of padding. The game trims transparent borders and scales by visible height, so fill the canvas well: the creature should span roughly 80 to 95% of the height (or of the width, for wide creatures).
- **Flyers** (only the Sentry Eye) have nothing touching the ground. Draw it hovering, centred, with its lowest part about 20 px from the bottom edge; the game lifts it itself.
- Keep the creature as one connected shape. Loose particles are fine but must stay inside the canvas.
- Relative size (game scale): the Worker, Sprayer, Larva Cluster, Larva, Swarmer, Leech and Spitter are small-to-normal; the Lancer is tall; the **Overseer and Juggernaut are elites** and must look clearly bigger and heavier than the rest of the hive (the Juggernaut should fill the canvas width, the Overseer the canvas height).

## Monsters

Gameplay notes are included so the pose and details communicate the creature's role.

| File | Name | Role | Description |
|---|---|---|---|
| `enemy-hiveWorker.png` | Hive Worker | Small support. Heals its wounded allies; the player should want to kill it first. | A small six-legged ant-like drone in violet chitin (`#8a6a9a` range), carrying a glowing **amber resin blob** in its mandibles as if about to repair something. Slim, busy and slightly hunched, with little gunmetal plates on its back and glowing amber eyes. Looks weak but important. |
| `enemy-acidSprayer.png` | Acid Sprayer | Debuffer. Weakens your defence, then melts all your Block. | A squat armoured beetle in dull green-grey chitin (`#5a8a5a` range) with a **swollen, glowing acid-green sac** on its back, and a long nozzle-like snout aimed forward with acid dripping from the tip. Corroded, pitted plates around its mouth. Short sturdy legs. |
| `enemy-larvaCluster.png` | Larva Cluster | A timer. If it isn't killed within 3 turns it bursts into 2 larvae. | A lumpy pile of 5 to 6 translucent pale egg-sacs (`#d8c8a8` range) stuck together with resin, with **dark larvae shapes wriggling inside** and one or two sacs cracking open. Soft membranes, faint inner glow, a few resin strands. It should look ready to hatch. |
| `enemy-hiveLarva.png` | Hive Larva | Tiny hatchling summoned from the cluster. | A tiny pale segmented grub (`#e0d0b0` range) with a dark round mouth ringed with tiny teeth and two small bright eyes. Cute but nasty. Only about half the visual size of the other monsters. Keep it centred and stand it on the bottom edge. |
| `enemy-sentryEye.png` | Sentry Eye | Flyer. Zaps you for every card you play after your 3rd each turn. | A floating eyeball-creature: a large pale lilac sphere (`#c8c0d8` range) with fine red veins, a **big glowing red iris** with a slit pupil staring left, a few short bone fins, and a bundle of thin dangling tendrils below. Hovering, no legs. The stare should feel invasive. |
| `enemy-spineLancer.png` | Spine Lancer | Telegraphs a big hit: winds up, then impales for 24. | A tall upright mantis-like soldier in dark violet chitin (`#6a4a7a` range) with a small triangular head and glowing eyes. One arm ends in a **long bone spike lance**, drawn pulled back as if winding up to thrust. The other arm is a smaller blade. Slender and menacing. |
| `enemy-swarmer.png` | Hive Swarmer | Comes in packs. When one dies, the others get stronger (frenzy). | A small winged insect (`#9a5a7a` mauve-pink) with two translucent buzzing wings, a spiky mandible and glowing magenta eyes. Quick, aggressive, a little spiky. Smaller than the Worker. |
| `enemy-mindLeech.png` | Mind Leech | Drains your HP to heal itself, then fogs your mind (Weak). | A glistening violet leech (`#7a4aa0` range) reared up, with a circular toothed sucker mouth and a **glowing pink-violet brain-like bulb** on its head pulsing with psionic light. Slick translucent body with visible veins, curled tail. |
| `enemy-resinSpitter.png` | Resin Spitter | Gums you up (-1 Energy next turn), then spits. | A round, heavy bug with a swollen **amber resin belly** (`#c88a3a` range), a small dark head and a wide jaw with **thick strands of sticky resin dripping and stretching** from it. Stubby legs, glowing amber eyes. Glossy and messy. |
| `enemy-hiveOverseer.png` | **Elite: Hive Overseer** | Commander. Summons Workers, buffs and shields its team. | A tall, robed insectoid commander (`#4a2a5a` deep purple) with a **crested bone head**, glowing magenta eyes, and a large psionic gem on its chest radiating violet light. Long thin arms raised as if directing its troops. Regal, ornate, heavier than any Worker. Fills the canvas height. |
| `enemy-gateJuggernaut.png` | **Elite: Gate Juggernaut** | Elite tank. Builds armour that never expires, then rams and grinds. | A massive armoured beetle (`#3a3a4a` dark gunmetal) with **thick overlapping grey steel plates** over its whole back and a heavy horned head lowered like a battering ram. Scars, rivets and glowing amber vents between the plates, thick stubby legs. Fills the canvas width. |

## Map icons

All three are **256x256 PNG, transparent background, single image, centred with about 16 px padding**. They are drawn on a dirt map tile at about 40 px, next to the existing icons in `map-icons-sheet.png`. **Open that sheet first and match its style** (bold silhouette, thick dark outline, strong glow). Keep them simple so they read clearly at 40 px: no fine detail.

| File | Icon | Description |
|---|---|---|
| `map-beacon.png` | Psionic Beacon | A small glowing crystal pylon: a faceted **violet crystal diamond** floating above a dark stone or gunmetal base, with a soft violet glow and a few light sparks. This is the icon of the unlit beacon; the game adds its own glow when it is lit. |
| `map-override-key.png` | Override Key | A gold key-card: a rounded rectangle with a dark magnetic stripe, a small chip, and a **small bright green light** in the corner. Warm gold with a slight shine. |
| `map-hive-map.png` | Hive Map | A **cyan holographic grid square**: a translucent glowing cyan tile with a fine grid pattern, bright cyan edges and a glowing white dot. Slight glow around it. |

## Not needed

The patrol marker on the map reuses the existing `enemy-hiveGuard.png`, and the hive tunnel veins and fog are drawn in code. Do not make art for those.

## Checklist

- [ ] 11 files `enemy-<id>.png`, 512x512, transparent, facing left, standing on the bottom edge (the Sentry Eye hovers about 20 px above it)
- [ ] 3 files `map-beacon.png`, `map-override-key.png`, `map-hive-map.png`, 256x256, transparent, centred
- [ ] Style, outline and palette match the existing hive art (purple chitin, amber resin, magenta light)
- [ ] Overseer and Juggernaut read as bigger and tougher than the regular monsters; the Larva reads as the smallest
- [ ] No text, no backgrounds, no existing files overwritten
