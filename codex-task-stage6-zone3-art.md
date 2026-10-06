# Codex task: Stage 6 "Landfall" — Zone 3 extra art (11 monsters + 3 map icons)

Zone 3 (Hive Gate) adds 11 new monsters and 3 new map tiles that draw with canvas placeholders. This task makes the art for them. No code changes are needed: each file is picked up automatically when it exists at the path below (the game loads `assets/<file>` lazily and keeps the placeholder if the file is missing).

Drop all files into `stage6/assets/`. **Do not touch or overwrite any existing file.** When you're done, list the files you created.

## The zone

**Hive Gate** is the last zone: the outer defences of the alien **Home Base**, a living hive city of organic architecture. The battle background (`stage6/assets/bg-zone3.webp`) shows purple chitin towers, glowing violet windows and veins, and a huge hive gate under a dark magenta sky. The creatures here are the hive's **workers, soldiers and psionic servants**: more organised, armoured and insect-like than the fungal Zone 2 wildlife.

## Style (match the existing Zone 3 art)

The original Zone 3 enemies already exist: `enemy-hiveGuard.png`, `enemy-psionicDrone.png`, `enemy-mimic.png`, `enemy-warden.png`, `enemy-turret.png`, `enemy-homeCore.png`. **Open them first and match their rendering, outline weight, shading and colour feel.** Same rules as the first art pass (`codex-task-stage6-art.md`):

- Detailed painted-pixel biomechanical aliens: dark gunmetal and chitin carapace plates, purple flesh, bone-white claws and spikes, glowing eyes and pores. Menacing but readable at small size.
- **Zone 3 palette:** deep chitin purples and violets (`#3a2a4a` to `#9a6ab0`), gunmetal greys, **glowing violet / magenta** seams and eyes (`#b070ff`, `#e040a0`), and **amber resin** accents (`#c88a3a` to `#ffb040`) for hive goo and wax. Use acid green only where a row says so (Acid Sprayer). Keep every monster inside this palette so the zone feels coherent and clearly different from the green Zone 2.
- Strong rim light, dark outlines, a clear silhouette that reads at about 100 px tall on a 960×640 screen.
- No text, no ground shadow plate, no background.

## Technical rules (all enemies)

- **512×512 PNG, transparent background**, one single image per file (not a sheet).
- **Faces LEFT** (toward the hero) in side or 3/4 side view.
- **Stands on the bottom edge** of the canvas with about 20 px of padding. The game trims transparent borders and scales by the visible height, so fill the canvas well: the creature should span roughly 80–95% of the height (or the width, for wide creatures).
- **Flyers** (Sentry Eye, Hive Swarmer) have nothing touching the ground. Draw them hovering, centred, with the lowest part about 20 px from the bottom edge; the game lifts them itself.
- Keep the creature as **one connected shape**. Loose particles are fine but must stay inside the canvas, at least 8 px from every edge.
- **Relative size:** normals are about the size of the existing `enemy-hiveGuard.png` or smaller (Hive Larva and Hive Swarmer are clearly small). Elites (Hive Overseer, Gate Juggernaut) should look clearly bigger and heavier than normals and fill more of the canvas.

## Monsters

Gameplay notes are included so the pose and details communicate the creature's role.

| File | Name | Role | Description |
|---|---|---|---|
| `enemy-hiveWorker.png` | Hive Worker | Small support. Repairs its most wounded ally, then pinches. | A knee-high six-legged worker ant-creature in dusty violet chitin (`#8a6a9a` range), with a round head, short antennae and big mandibles holding a **glowing amber blob of resin** it uses to patch its allies. Small tool-like forelimbs. Busy and harmless-looking, but clearly part of the hive. |
| `enemy-acidSprayer.png` | Acid Sprayer | Strips your armour, then sprays. | A squat armoured beetle (`#5a6a5a` grey-green carapace with violet seams) with a **swollen translucent acid sac** on its back glowing **acid green** (`#7fe04a`), connected by tubes to a long nozzle-like snout pointed left. A drip of acid hangs from the nozzle. Four stubby legs. |
| `enemy-larvaCluster.png` | Larva Cluster | A timer: kill it within 3 turns or it hatches. | A pile of 5–6 large translucent **pale eggs** (`#d8c8a8`), glued together with amber resin on a small mound of hive wax. Dark curled larva shapes are visible inside, one egg already cracking with a tiny claw poking out. Faint violet glow from within. No eyes on the cluster itself. Wider than tall. |
| `enemy-hiveLarva.png` | Hive Larva | Tiny hatchling, comes in pairs. | A small pale segmented grub (`#e0d0b0`) wet from hatching, with a dark round mouth full of tiny teeth, stubby legs, and an egg-shell fragment stuck on its back. **Clearly small**: fill only about 45–55% of the canvas height. |
| `enemy-sentryEye.png` | Sentry Eye | Flyer. Punishes playing many cards in one turn. | A floating **eyeball sentinel**: a large pale-lilac eye (`#c8c0d8`) with a big **red iris looking left**, set in a ring of armoured chitin eyelids with small bone spikes. Short dangling tendrils and nerve cables hang below. A faint violet scanning glow comes from the iris. No legs. |
| `enemy-spineLancer.png` | Spine Lancer | Winds up, then impales for big damage. | An upright mantis-like hive soldier (`#6a4a7a` violet chitin) on two digitigrade legs. One arm is a **very long bone lance-spike pulled back to strike**, the other is a small claw. A narrow armoured head with violet slit eyes. Tense, coiled pose. |
| `enemy-swarmer.png` | Hive Swarmer | Small flyer in packs. Each death makes the others stronger. | A small winged hive insect (`#9a5a7a` mauve chitin) like a wasp crossed with a beetle, two pairs of **blurred buzzing wings**, a segmented body, a small stinger, and glowing magenta eyes. Aggressive. **Clearly small**: about 50–60% of the canvas height. No legs touching the ground. |
| `enemy-mindLeech.png` | Mind Leech | Drains your health, then clouds your mind (Weak). | A fat violet leech (`#7a4aa0`) rearing up, with a circular toothed sucker mouth pointed left and a **glowing brain-like bulb** on top of its head that pulses with psychic violet light. Translucent skin showing violet fluid inside. Matches the Zone 2 Leech's shape but clearly a hive variant. |
| `enemy-resinSpitter.png` | Resin Spitter | Gums you up (less Energy next turn), then spits. | A round bug with a **swollen glowing amber belly** (`#c88a3a` to `#ffb040`), a violet chitin back shell, and a wide jaw dripping thick strands of sticky amber resin. Six short legs. A blob of resin is stretched between its mandibles, ready to spit. |
| `enemy-hiveOverseer.png` | **Elite: Hive Overseer** | Commander. Summons Hive Workers, lashes with psionics, buffs its team. | A tall, regal robed insect figure (`#4a2a5a` dark purple), taller than the Hive Guard. A crested, ornate chitin head with violet eyes, and a **large glowing psionic gem** set in its forehead or held between two long hands. Ceremonial bone shoulder plates, a long ragged robe-like membrane, and faint violet psychic tendrils curling from its hands. Commanding pose, one arm raised as if giving orders. |
| `enemy-gateJuggernaut.png` | **Elite: Gate Juggernaut** | Living siege beetle. Stacks armour that doesn't expire, rams, grinds. | A massive armoured **siege beetle** (`#3a3a4a` gunmetal) covered in thick overlapping grey plates with violet seams glowing between them, like a living battering ram. A huge horned head-ram pointed left, short powerful legs, and hive resin cementing the armour plates. Very heavy and wide: it should fill most of the canvas width and look like the toughest normal-sized thing in the game. |

## Map icons

Drawn on a dirt map tile at about 40 px, next to the existing icons in `map-icons-sheet.png` and the Zone 2 `map-antidote.png`. **Open both first and match their style** (bold silhouette, thick dark outline, strong glow), and make sure each reads clearly at 40 px: no fine detail.

**256×256 PNG, transparent, one single image per file**, centred with about 16 px padding on all sides.

| File | Tile | Description |
|---|---|---|
| `map-beacon.png` | Psionic Beacon | A small **violet crystal pylon**: a tall faceted violet crystal (`#9a7aff`) on a dark carved hive-stone base, with a soft violet glow around the tip. It reveals the fog around it when dug, so it should look like a light source. (The game makes lit beacons glow brighter; draw one state.) |
| `map-override-key.png` | Override Key | An alien **key-card**: a gold and gunmetal card-shaped device (`#ffcf4a` gold trim) with carved hive circuitry, one bright green indicator light, and a small violet crystal chip set in it. It shuts down the Core's turrets, so it should feel like a high-tech access key. |
| `map-hive-map.png` | Hive Map | A **holographic map**: a small cyan (`#5ad0ff`) glowing grid square projected above a dark disc emitter, with a few bright dots and a faint hexagon pattern on the grid. It reveals the whole map, so it should read as "information / map". |

## Not needed

The patrol tokens on the map reuse `enemy-hiveGuard.png`. The fog frontier, hive tunnel veins and the tunnel mouth start tile are drawn in code. Do not make art for those.

## Checklist

- [ ] 11 files `enemy-<id>.png`, 512×512, transparent, facing left, standing on the bottom edge (flyers hover about 20 px above it): `hiveWorker`, `acidSprayer`, `larvaCluster`, `hiveLarva`, `sentryEye`, `spineLancer`, `swarmer`, `mindLeech`, `resinSpitter`, `hiveOverseer`, `gateJuggernaut`
- [ ] 3 files `map-beacon.png`, `map-override-key.png`, `map-hive-map.png`, 256×256, transparent, centred
- [ ] Style, outline and palette match the existing Zone 3 enemies; purple/violet chitin with amber resin throughout
- [ ] Hive Larva and Hive Swarmer read as small; Hive Overseer and Gate Juggernaut read as bigger and tougher than normals
- [ ] No text, no backgrounds, no sheets, no existing files overwritten
