# Sonnet task: Stage 6 "Landfall" — Zone 2 (Spore Wilds)

Stage 6 currently ends when the Landing Sentinel (Zone 1 boss) dies. This task makes the run continue into **Zone 2 — Spore Wilds**, with its own enemies, elite and boss, a **spore spread** mechanic on the Dig Map, a unique **Spore Antidote** tile, and a one-time **ship rest** in Zone 1. Beating the Zone 2 boss (Thornback) ends the run in victory. Zone 3 is a later task, but write the zone code so a Zone 3 can be added by adding data.

All work is in `stage6/stage6.js` (one `"use strict"` IIFE). Bump `stage6.js?v=40` in `stage6/stage6.html` to `v=41`. English-only UI. Match the file's existing style: dense one-line helpers, short comments only where the reason isn't obvious, data in plain object tables.

Read these first: `genDigMap`, `digTile`, `drawMap`, `mapHud`, `chooseEncounter`, `ENEMIES` / `ENC`, `execMove`, `refreshIntents`, `afterAction`, `onWin`, `endRun`, `drawReward`, `drawRunEnd`, `statusRow`, `strike`, `takeDamage`.

---

## 1. Zone progression

### 1.1 Zone 1 boss no longer ends the run
In `onWin`, when `kind === "boss"`:
- **If `run.zone < 2`:** gain 1 Gold (already happens) and 75 Scrap, grant 1 random unowned relic (if any), and set `run.pending = { screen: "reward", scrap: 75, cards: rollCards("boss", save.forge.survey ? 4 : 3), relic, ore: oreG, nextZone: true }`. Show the reward screen as for an elite.
- **If `run.zone === 2`:** `run.scrap += 75; endRun(true)` (the run victory).
- Remove the `run.zone = 1` line before `endRun`. It currently overwrites the zone and breaks the `bestZone` stat.

### 1.2 Leaving the reward screen
In `drawReward`, every path that calls `completeNode()` (pick a card, Skip) must instead call `enterZone(run.zone + 1)` when `run.pending.nextZone` is true. Change the Skip button label to **"Descend"** in that case.

### 1.3 `enterZone(z)`
New function:
```
run.zone = z; heal ceil(30% of maxhp) (capped at maxhp);
run.map = genDigMap(z); run.cur = null; run.pending = null;
run.alert = 0; run.ambushDue = 0; run.antidote = false;
S.toast = { text: `${ZONES[z - 1]} — healed ${h} HP`, t: 3 };
S.screen = "map"; S.face = null; S.walk = null; saveRun();
```

### 1.4 Run end
- `drawRunEnd`: the win line becomes `"Victory! Zone 3 coming soon."` (it currently says Zone 2).
- `endRun` already records `bestZone = run.zone`, which is now correct.

### 1.5 Debug param
`?zone=2`: after `newRun()` builds the run, call `enterZone(2)` (keep any Relic Locker pending choice; show it first, then the Zone 2 map). It's for testing, so the heal and toast are fine.

---

## 2. Encounters per zone

Make `chooseEncounter` read `ENC["z" + run.zone]` instead of the hard-coded `ENC.z1`. The ambush in `digTile` keeps calling `chooseEncounter("battle", 9)`, which picks from that zone's `normal` pool.

### 2.1 Zone 2 enemies (add to `ENEMIES`)
Art files already exist and are registered (`e_sporeMother`, `e_stalker`, `e_leech`, `e_broodKnight`, `e_thornback`). Pick `w`/`h`/`artScale` so they read at a similar size to Zone 1 (bosses use `boss: 1`). For the shape fallback use existing shapes (`blob`, `spiky`, `worm`, `boss`).

| id | Name | HP | Moves (cycle in order) |
|---|---|---|---|
| `sporeMother` | Spore Mother | 40–44 | **Spawn** `{ summon: ["crawler"] }` → **Lash** `{ dmg: 10 }` |
| `stalker` | Stalker | 36–40 | **Stalk** `{ str: 3, block: 6 }` → **Pounce** `{ dmg: 8 }` |
| `leech` | Leech | 26–30 | **Drain** `{ dmg: 7, drain: 1 }` → **Latch** `{ apply: { weak: 2 } }` |
| `broodKnight` | Brood Knight (elite) | 90 | **Shield Bash** `{ dmg: 12, block: 8 }` → **Rally** `{ str: 2 }` → **Cleave** `{ dmg: 20 }`. Once at ≤50% HP: `overdrive: { n: "Call the Brood", summon: ["crawler", "crawler"], banner: "The Brood answers!" }` |
| `thornback` | Thornback (boss) | 220 | Passive **Thorns 3**. **Spike Volley** `{ dmg: 5, hits: 4 }` → **Spore Cloud** `{ addDisc: { spore: 2 } }` → **Curl** `{ block: 30, thornsTemp: 2 }` → **Crush** `{ dmg: 28 }` |

### 2.2 New Zone 2 monsters (placeholder art)
Four new spore-themed monsters. **No art files exist for these.** Register their ART keys anyway (add the ids to the `for (const id of [...]) ART_FILES["e_" + id]` list) so art can be dropped into `assets/enemy-<id>.png` later. Until then they draw with the new canvas shapes in §2.3.

| id | Name | HP | Moves (cycle in order) | Notes |
|---|---|---|---|---|
| `puffcap` | Puffcap | 16–20 | **Spore Puff** `{ addDisc: { spore: 1 } }` → **Headbutt** `{ dmg: 6 }` | `onDeath: { n: "Burst", addDisc: { spore: 1 } }`: when it dies it bursts and puts 1 more Spore in your discard pile. Small (`w: 70, h: 60`). |
| `bloomshade` | Bloomshade | 26–30 | **Pollen** `{ apply: { vuln: 2 } }` → **Choke** `{ dmg: 4, perSpore: 2 }` | Flyer (`fly: 1`). Choke deals 4 **+2 per Spore card** you hold across hand, draw and discard piles, which makes spore build-up dangerous. |
| `rotHound` | Rot Hound | 30–34 | **Maul** `{ dmg: 7, hits: 2 }` → **Lick Wounds** `{ heal: 8, block: 5 }` | A plain bruiser that rewards burst damage. |
| `rotHulk` | Rot Hulk (elite) | 100 | **Fungal Slam** `{ dmg: 18 }` → **Rot Spray** `{ addDisc: { spore: 2 }, apply: { weak: 2 } }` → **Regrow** `{ heal: 15, block: 10 }` | A second elite option alongside the Brood Knight. |

### 2.3 Placeholder shapes
Add these `shape` values to `drawEnemyBody`'s canvas fallback, in the same style as the existing shapes (3px dark outline, flat fills, two cartoon eyes, a little idle motion from `S.time`):

| Shape | Used by | Look |
|---|---|---|
| `mushroom` | Puffcap | Short cream stalk, wide domed cap in teal (`#4fb3a0`) with pale spots, eyes on the stalk; the cap bobs slightly. |
| `bloom` | Bloomshade | A hovering flower: 6 magenta petals (`#d05aa8`) around a yellow centre with eyes, two drooping leaves below; the petals sway. |
| `hound` | Rot Hound | A low four-legged body in mossy green-brown (`#6f7a3a`), a blocky head with a jaw, green fungus tufts along the back. |
| `hulk` | Rot Hulk | A big hunched mound (`#5a6a3a`) with two thick arms, glowing green pustules that pulse, small eyes. Larger than normals (`w: 150, h: 140`). |

### 2.4 `ENC.z2`
```
easy:   [["stalker"], ["leech", "crawler"], ["puffcap", "puffcap"], ["bloomshade"]]
normal: [["sporeMother"], ["stalker", "leech"], ["leech", "leech"], ["stalker", "crawler", "crawler"], ["sporeMother", "crawler"],
         ["rotHound", "puffcap"], ["bloomshade", "puffcap", "puffcap"], ["rotHound", "bloomshade"]]
elite:  [["broodKnight"], ["rotHulk"]]
boss:   [["thornback"]]
```

---

## 3. Combat engine additions

All new move fields are handled in `execMove`, shown by `intentInfo` / `describeMove`, and cost nothing when absent (Zone 1 behaves exactly as now).

| Field | Behaviour | Intent icon | `describeMove` text |
|---|---|---|---|
| `summon: [ids]` | For each id, if fewer than 4 living enemies: add a new enemy (rolled HP, `summoned: true`, its own move cycle from move 0, fades in). If the field is full: float "No room" and do nothing. | `summon` (already in `drawIntentIcon`) | `Summons a Spore Crawler.` / `Summons 2 Spore Crawlers.` |
| `drain: 1` | The enemy heals by the HP the player actually lost from this attack (use `takeDamage`'s return value), capped at its max HP. Float `+N` in green on the enemy. | (attack) | append `Heals for unblocked damage.` |
| `addDisc: { spore: n }` | Push n new `spore` cards into `C.disc` (with fresh `uid`, `appear: 1`). Float `+n Spore` on the player. | `debuff` | `Shuffles 2 Spore into your discard pile.` |
| `thornsTemp: n` | Adds n to the enemy's `e.thornsTemp` until the start of its next turn (clear it where `e.block = 0` is reset). | `buff` | `Gains n Thorns this round.` |
| `perSpore: n` | Attack damage gets `+n` per `spore` card in `C.hand + C.draw + C.disc`, added to the base before Strength/Weak/Vulnerable. The intent number must show the final value (compute it in `intentInfo` too). | (attack) | append `+n per Spore card you hold.` |
| `heal: n` | The enemy heals n (capped at max HP), with a green `+N` float. | `buff` | `Heals n.` |
| `def.onDeath` | A move-shaped object run once when the enemy dies (in `afterAction`, where `e.dead` is set). Support at least `addDisc`. Float its `n` ("Burst") on the enemy. Runs for summoned enemies too. | — | Shown in the enemy's name tooltip: `On death: …` |

### 3.1 Enemy layout with summons
`startCombat` places 1–3 enemies at fixed x. Add a 4-slot layout `[450, 580, 710, 840]`. Whenever the number of living enemies changes because of a summon, assign each living enemy its slot x for the new count (1–3 use the existing layouts) and ease `e.x` toward it over ~0.25 s (store a target `e.tx` and lerp in `updateCombat`). Dead enemies keep their x while fading. Hit regions follow `e.x` automatically.

### 3.2 Summoned enemies drop nothing
In `afterAction`, the "+1 Copper per defeated enemy" must skip enemies with `summoned: true`, so a Spore Mother can't be farmed.

### 3.3 Thorns
- `def.thorns` (passive) plus `e.thornsTemp` = current Thorns.
- In `strike()` (player card hits only, not `raw` hits, so Dog damage never triggers it): after the hit resolves on a living-or-just-killed enemy with Thorns > 0, queue `takeDamage(C.P, thorns, false)` (goes through Block). Each hit of a multi-hit card triggers Thorns separately.
- Show Thorns in the enemy's `statusRow` as a status chip: add `thorns: { l: "T", col: "#7fbf5a", n: "Thorns", d: "Whenever you hit this enemy with an attack, take N damage." }` to `STATUS` **without an `ico`**, and make `statusRow` draw the letter when `st.ico` is missing (today `uiIcon` is called unconditionally). `statusRow` reads `u[k]`, so expose Thorns as a computed value. For example, set `e.thorns = (def.thorns || 0) + (e.thornsTemp || 0)` wherever enemy state updates, and add `"thorns"` to the key list.

### 3.4 Half-HP override generalised
`refreshIntents` already swaps in `def.overdrive` once at ≤50% HP. Use `def.overdrive.banner` for the banner text when present (keep "Overdrive!" as the default), so the Brood Knight's "Call the Brood" reuses this path.

---

## 4. Dig Map per zone

`genDigMap(zone)` takes the zone. Grid size, the start tile (4,0), the camp at (4,9) and the lair at (4,10) are unchanged. Content counts are the same as Zone 1. Zone 2 adds the spore seeds (§5) and the Antidote (§6).

- **Text:** `mapHud` subtitle "Dig toward the Sentinel's lair" becomes zone-specific: Zone 1 "Dig toward the Sentinel's lair", Zone 2 "Dig toward the Thornback's den". The lair label in `drawMap` and its hover name use the zone's boss name (`ENEMIES[ENC["z"+run.zone].boss[0][0]].n`), not `ENEMIES.sentinel.n`.
- **Start tile:** in Zone 1 the start tile shows the player's ship (already drawn in `drawMap`). In Zone 2 there is **no ship**: draw a tunnel mouth instead (canvas: dark ellipse with a ring of rock-coloured stones) with the hover tooltip **"Tunnel" / "The shaft you came down from the Landing Zone."**

---

## 5. Spore spread (Zone 2 only)

Tile field `t.spore` (boolean). Map field `run.map.sporeIn` (digs until the next spread).

**Spores never remove or replace what's on a tile.** `t.spore` is an overlay flag only: a spored tile keeps its content (`t.c`: ore, battle, event, camp, trader, cache, …), which still shows under the spore overlay and resolves normally when dug. Seeding, spreading and the Antidote only set or clear `t.spore`.

### 5.1 Seeding
In Zone 2, after content is placed, mark **3** random tiles as spored: un-dug, `k === "dirt"`, rows 2–8, not protected, `c !== "antidote"`. Set `sporeIn = 3`.

### 5.2 Spreading
In `digTile`, when `run.zone === 2 && !run.antidote`: decrement `sporeIn`. At 0, spread and reset to 3.

A spread: take a snapshot of current spore tiles. For each, with 50% chance, infect one random **eligible** orthogonal neighbour. If that produced no new tile and any eligible neighbour exists, infect one anyway (every spread does something). **Eligible** = in map, not dug, `k === "dirt"`, not already spored, `c !== "antidote"`, not protected. Cap the total at 25 spore tiles. Toast `"The spores spread"` and float `"Spores!"` on each newly infected tile that is revealed.

### 5.3 Digging a spored tile
Before resolving the tile's content: `addCard("spore")`, clear `t.spore`, float `"+1 Spore"` in green on the tile. Then the tile's content (battle, ore, event, …) resolves normally. The `spore` status card already exists in `CARDS`. Don't change its rules.

### 5.4 Drawing
- Revealed spored tiles get a green spore overlay drawn after the tile art and before the content icon: a translucent green wash plus 5–7 small pale-green puffs placed with `hash()` per tile, gently pulsing with `S.time`. Under fog, spored tiles show nothing.
- `mapHud` in Zone 2 adds a line under the Hive Alert bar: **"Spores spread in N digs"** (green). After the antidote it reads **"Antidote active: spores are harmless"** (cyan).
- Hovering a revealed spored tile adds a line to its tooltip: **"Spored: digging here adds a Spore card to your deck."**
- Legend: in Zone 2 add **"Spored tile"** (a small swatch of the overlay) and **"Spore Antidote"** (its icon). The legend now has 12 entries, so tighten the row spacing from 34 to 28 so the three help lines below stay clear.

---

## 6. Spore Antidote tile (Zone 2 only)

This is separate from the existing Spore Pool **event**, which stays as it is.

- **Placement:** exactly one tile with `c = "antidote"`, in the **bottom third** of the map (rows 8–10), on a `dirt` tile with no other content, not protected, and **reachable** from the start through non-bedrock tiles without passing the lair (reuse the `seen` set from the reachability check in `genDigMap`; if no candidate exists, retry the generation attempt).
- **Never spored:** spores can't be seeded onto it or spread onto it.
- **When dug** (`makePending` / `digTile` path, no screen opens):
  1. `run.antidote = true`.
  2. Remove **every** `spore` card from `run.deck`.
  3. Spreading stops for the rest of the zone.
  4. Existing spore tiles **stay on the map** (the antidote does not clear them remotely).
  5. Mark the tile `used`. Toast: **"Spore Antidote! Removed N Spore cards. Spores no longer affect you."** (use "No Spore cards to remove." when N = 0).
- **After the antidote, spore tiles are cleared only when touched:** digging a spored tile while `run.antidote` is true clears `t.spore`, adds **no** Spore card, and floats `"Cleansed"` in cyan. The tile's content then resolves normally (§5.3 otherwise).
- The spored-tile tooltip line becomes **"Spored: harmless now. Digging here cleanses it."** once the antidote is held.
- **Name / tooltip:** `NODE_INFO.antidote = { n: "Spore Antidote", l: "+", col: "#7affc0" }`. Hover description: **"Removes all Spore cards from your deck, stops the spread, and makes spored tiles harmless to dig."**
- **Icon:** no art yet. Register `ART_FILES.mapAntidote = "assets/map-antidote.png"` (the file doesn't exist; `artReady` returns null). In `drawTileIcon`, for `"antidote"`, draw the art if present, otherwise a canvas vial: a rounded flask in pale cyan with a green liquid fill and a white `+`, sized to match the other icons.
- **Save:** `run.antidote` resets to `false` in `enterZone`.

---

## 7. Ship rest (Zone 1 only)

The ship on the Zone 1 start tile offers **one free full heal per run**.

- Field `run.shipRest` (false until used; old saves read `undefined` as false).
- When the player stands on (4,0) in Zone 1, `mapHud` shows a button in the right panel: **"Rest in Ship: full heal"**. It's disabled with the label **"Already at full HP"** when `run.hp === run.maxhp`, and hidden once `run.shipRest` is true. Clicking sets `run.hp = run.maxhp`, sets `run.shipRest = true`, toasts **"Rested aboard the ship: +N HP"**, and saves.
- `confirmMap()` (A / Enter on the map) triggers the same rest when standing on the ship with no tile faced.
- Ship hover tooltip: **"Your Ship"** / **"Rest here once per run for a full heal."** After use: **"Already rested this run."**
- Controller: the button must be a normal `btn` so it joins the focus targets.

---

## 8. Save compatibility

- New run fields (`shipRest`, `antidote`) and tile/map fields (`spore`, `sporeIn`) are read as falsy/absent on old saves. Don't discard old runs.
- An in-progress Zone 1 run from before this change continues normally and now proceeds to Zone 2 after the Sentinel.

---

## 9. Out of scope

- Zone 3 (Hive Gate) content, the Home Base Core, new events, new cards or relics.
- Changing the Spore card's rules, card balance, or Forge items.
- Any art files. Art comes later. Everything new must look acceptable with the canvas fallbacks.

---

## 10. Verify before handing back

Use `?seed=`, `?reveal=1`, `?zone=2` and `?ore=` to test quickly. Check each in the browser with no console errors:

1. Zone 1: rest at the ship once (button disabled at full HP, gone after use); the tooltip text changes.
2. Kill the Landing Sentinel → reward screen with rare cards and a relic → "Descend" → Zone 2 map with heal toast, tunnel start tile, no ship.
3. Zone 2 map: 3 spored tiles visible when revealed; the counter counts down; a spread happens every 3 digs; digging a spored tile adds a Spore card (check the deck viewer).
4. Antidote is in rows 8–10, never spored, and reachable. Digging it removes all Spore cards and stops the spread; existing spore tiles stay visible, and digging one afterwards cleanses it with no Spore card added. The HUD line reads "Antidote active: spores are harmless".
5. Each Zone 2 enemy: Spore Mother summons (4-enemy cap, slots re-space, summoned crawlers give no Copper); Leech heals only for unblocked damage; Brood Knight calls 2 crawlers once at half HP; Thornback's Thorns hurt per hit (not from Dog), Curl adds 2 Thorns until its next turn, Spore Cloud puts 2 Spore cards in the discard pile.
6. New monsters draw with their placeholder shapes (no missing-image gaps): Puffcap adds a Spore on Spore Puff and another when it dies; Bloomshade's Choke intent number rises as Spore cards pile up; Rot Hound heals and blocks on Lick Wounds; Rot Hulk appears as an elite and its Rot Spray adds 2 Spore + 2 Weak.
7. Kill Thornback → "Victory! Zone 3 coming soon." The run banks Scrap plus the win bonus, and Best zone shows 2.
8. Zone 1 plays exactly as before apart from the ship rest and the boss reward.
