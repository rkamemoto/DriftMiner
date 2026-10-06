# Codex task: Stage 6 "Landfall" — Zone 2 extra art (10 monsters + 1 map icon)

Eleven Zone 2 items still draw with canvas placeholders. This task makes the art for them. No code changes are needed: each file is picked up automatically when it exists at the path below (the game loads `assets/<file>` lazily and keeps the placeholder if the file is missing).

Drop all files into `stage6/assets/`. Do not touch any existing file.

## Style (match the existing Zone 2 art)

The other Zone 2 enemies already exist (`enemy-sporeMother.png`, `enemy-stalker.png`, `enemy-leech.png`, `enemy-broodKnight.png`, `enemy-thornback.png`). **Open them first and match their rendering, outline weight, shading and colour feel.** Same rules as the first art pass (`codex-task-stage6-art.md`):

- Detailed painted-pixel biomechanical / fungal aliens: dark gunmetal carapace plates, purple flesh, bone-white claws and spikes, glowing eyes and pores. Menacing but readable at small size.
- Zone 2 is a **sickly green fungal jungle**: glowing green and teal spores, magenta flowers, mossy brown-green rot, violet shadows. Keep every monster inside this palette so the zone feels coherent.
- Strong rim light, dark outlines, a clear silhouette that reads at about 100 px tall on a 960x640 screen.
- No text, no ground shadow plate, no background.

## Technical rules (all enemies)

- **512x512 PNG, transparent background**, one single image per file (not a sheet).
- **Faces LEFT** (toward the hero) in side or 3/4 side view.
- **Stands on the bottom edge** of the canvas, about 20 px of padding. The game trims transparent borders and scales by the visible height, so fill the canvas well: the creature should span roughly 80 to 95% of the height (or the width, for wide creatures).
- **Flyers** (Bloomshade, Spore Bat) have no legs touching the ground. Draw them as if hovering, but still centred in the canvas with the lowest part about 20 px from the bottom edge; the game lifts them itself.
- Keep the creature as one connected shape. Loose particles are fine, but they must stay within the canvas.
- Relative size: normals are about the size of the existing `enemy-crawler.png` or a bit larger. Elites (Rot Hulk, Bloom Matriarch) should look clearly bigger and heavier than normals and fill more of the canvas.

## Monsters

Gameplay notes are included so the pose and details communicate the creature's role.

| File | Name | Role | Description |
|---|---|---|---|
| `enemy-puffcap.png` | Puffcap | Small fodder. Pumps Spore cards into your deck, then bursts when killed. | Knee-high walking mushroom. A wide domed teal cap (`#4fb3a0` range) with pale cream spots and a ragged glowing underside, on a short stubby cream stalk with two small bare feet. Two big glossy eyes on the stalk. Fine green spore puffs drift from the cap vents, and one side of the cap is swollen like it is about to pop. Cute but a little sinister. |
| `enemy-bloomshade.png` | Bloomshade | Flyer. Weakens you with pollen, then chokes harder the more Spore cards you hold. | A hovering carnivorous flower-creature. Six magenta petals (`#d05aa8` range) around a glowing yellow centre that has two eyes and a faint toothy mouth line. Two drooping leaf-tendrils hang below it like trailing arms, one curling as if reaching to strangle. Faint pollen haze around the petals. No legs. |
| `enemy-rotHound.png` | Rot Hound | Plain bruiser. Mauls twice, then licks its wounds. | A lean four-legged hound whose body is rotting and overgrown. Mossy green-brown hide (`#6f7a3a` range) with exposed ribs, bone plating on the skull, and glowing green fungus tufts growing along its spine and haunches. A blocky head with a heavy jaw, a few visible fangs, and glowing sickly eyes. Low, ready to pounce, tail raised. Drool and spores drip from the jaw. |
| `enemy-rotHulk.png` | **Elite: Rot Hulk** | Elite. Slams, sprays Spores and Weak, regrows. | A huge hunched fungal mound-brute, the biggest normal-sized creature of the zone. A mass of moss-green rotting flesh (`#5a6a3a` range) with two thick, oversized arms ending in heavy knuckled fists, and a small sunken head with tiny eyes set low between the shoulders. Glowing toxic-green pustules pulse all over its back and shoulders, some burst and venting spores. Roots and mushrooms sprout from its body. Looks slow, huge and tough. |
| `enemy-sporeBat.png` | Spore Bat | Small flyer, usually in pairs. | A small round, furry bat-like creature (`#6a5a8a` purple-grey) with two big leathery membrane wings spread mid-flap, big round glowing eyes, small ears and two tiny white fangs. Faint spore dust falls from its wings. Reads clearly at about 70 px wide. No legs on the ground. |
| `enemy-burrowGrub.png` | Burrow Grub | Armoured. Hardens, hurts anyone who hits it (Thorns). | A fat segmented larva in pale tan (`#c8b48a` range), crawling left, with darker overlapping armour plates on each segment and a few short bone spikes along its back (these are its Thorns, so make them visible). A round mouth ringed with tiny teeth at the front, small eyes above it. Dirt clings to its sides, as if it just burrowed out of the ground. |
| `enemy-mycelidWeaver.png` | Mycelid Weaver | Support. Shields its allies with webbing; players should want to kill it first. | A spindly spider-like creature (`#8a9a6a` pale olive-green) on six long thin jointed legs, with a small round head with several eyes, and a swollen spinneret abdomen. Fine pale fungal threads (mycelium) stream from its legs to the ground and between its legs, glowing faintly white-green, like it is knitting a web. Delicate and a little eerie. |
| `enemy-glowcap.png` | Glowcap Shaman | Support. Buffs allies' Strength and irradiates you. | A small hooded alien figure in a dark purple robe (`#4a3a5a` range) with a face hidden in shadow except for two glowing yellow-green eyes. On its head sits a large glowing yellow-green mushroom cap like a hat, giving off a radiant halo. It holds a gnarled wooden staff topped with a glowing spore orb in one hand and has a stray spark of green energy in the other. Mystic and a bit comic. |
| `enemy-mireLurker.png` | Mire Lurker | Heavy solo. Submerges for Block, then bites hard. | A wide, low swamp ambusher half-submerged in a mound of dark mud and weeds. Dark green-grey hide (`#3e5a4a` range). Two eyes on stalks poking above the mud, a long wide jaw line full of jagged pale teeth, and glistening algae draped over its back. Only the top half of the body is visible; the lower half is hidden in the mud. Wide and flat, so it fills the width of the canvas more than the height. |
| `enemy-bloomMatriarch.png` | **Elite: Bloom Matriarch** | Elite. Weakens and exposes you, strangles harder with Spore cards, seeds the wind with Bloomshades once at half HP. | A larger, regal version of the Bloomshade: a towering carnivorous flower queen. Deep crimson-magenta petals (`#b0306a` range) fanned like a crown around a golden centre with eyes and a stern mouth. A ring of smaller pulsing buds hovers around the head (the Bloomshades she seeds). Thick thorned vine-tendrils hang below like a skirt and trailing arms, some coiled to strangle. Pollen haze and glowing spores around her. It should fill more of the canvas than the Bloomshade and look noticeably more dangerous. Does not touch the ground (hovers). |

## Map icon: Spore Antidote

| File | Size | Description |
|---|---|---|
| `map-antidote.png` | **256x256 PNG, transparent**, single image | A small glass vial or flask of **Spore Antidote**: a rounded alembic flask with a cork stopper, filled with bright glowing green-teal liquid (`#3ed36a` to `#7affc0`), a soft cyan glow around it, a white or cyan cross / plus mark glowing on the glass, a few rising bubbles. Pale glass body, thick dark outline. Centred in the canvas with about 16 px padding on all sides. |

It is drawn on a dirt map tile at about 40 px, next to the existing icons in `map-icons-sheet.png`. **Match their style** (bold silhouette, thick dark outline, strong glow) and make sure it reads clearly at 40 px: no fine detail. Open `stage6/assets/map-icons-sheet.png` first for reference.

## Not needed

The spore overlay on dug tiles and the tunnel mouth on the Zone 2 map are drawn in code. Do not make art for those.

## Checklist

- [ ] 10 files `enemy-<id>.png`, 512x512, transparent, facing left, standing on the bottom edge (flyers hover about 20 px above it)
- [ ] 1 file `map-antidote.png`, 256x256, transparent, centred
- [ ] Style, outline and palette match the existing Zone 2 enemies; Zone 2 green/teal/magenta palette throughout
- [ ] Elites (Rot Hulk, Bloom Matriarch) read as bigger and tougher than normals
- [ ] No text, no backgrounds, no existing files overwritten
