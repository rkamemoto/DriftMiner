# Sonnet task: Stage 6 "Landfall" — Zone 3 (Hive Gate)

Zone 2 (Spore Wilds) is built: beating Thornback currently ends the run. This task adds **Zone 3 — Hive Gate**, the last zone, ending at the **Home Base Core**. Zone 3 brings:

- **Psionic fog:** you can't see what's in the ground beyond your own tunnels, except around Beacons you dig.
- **Patrols:** Hive Guard squads that walk the tunnels toward you.
- **Two unique tiles:** the **Override Key** and the **Hive Map**.
- The original Zone 3 enemies plus **11 new hive monsters** (placeholder art).
- The multi-phase **Home Base Core** final boss.

Work on the `stage6-zone2` branch (or a branch made from it). All code is in `stage6/stage6.js`; bump `stage6.js?v=41` in `stage6/stage6.html` to `v=42`. English-only UI. Match the file's style: data tables, dense one-line helpers, short comments only where the reason isn't obvious.

Read these first: `enterZone`, `genDigMap`, `isRevealed`, `canReach`, `canDig`, `digTile`, `clickTile`, `moveDir`, `confirmMap`, `drawMap`, `mapHud`, `drawTileIcon`, `ENEMIES` / `ENC`, `SLOTS`, `summonEnemies`, `execMove`, `refreshIntents`, `afterAction`, `onWin`, `endRun`, `drawRunEnd`, `takeDamage`, `strike`, `intentInfo`, `describeMove`, `drawEnemyBody`, `endTurn`, `startPlayerTurn`, `playCard`.

---

## 1. Zone progression

- `onWin`: the "last zone's boss ends the run" check becomes `run.zone >= 3`. So Thornback now gives the boss reward screen (rare cards + relic + 75 Scrap + Gold) and **Descend** goes to `enterZone(3)`, exactly like Zone 1 → 2.
- `enterZone(z)` also resets the new Zone 3 run fields: `run.overrideKey = false`, `run.hiveMap = false`.
- `ZONE_GOAL[2] = "Dig toward the Home Base Core"`.
- `drawRunEnd`: the win line becomes **"Victory! The Home Base has fallen."** (it currently says "Zone 3 coming soon").
- The Zone 3 start tile (4,0) uses the same tunnel mouth as Zone 2. Tooltip: **"Tunnel" / "The shaft you came down from the Spore Wilds."**
- Debug: `?zone=3` works like `?zone=2` (enter Zone 3 directly, keeping any Relic Locker choice first). Generalise the existing `params.get("zone") === "2"` line to any zone 2–3.

---

## 2. Psionic fog (Zone 3 only)

In Zone 3 the ground beyond your tunnels is hidden. You can still dig next to your tunnels, but you don't know what's there until you do.

### 2.1 What is revealed
`isRevealed(x, y)` in Zone 3 returns true only when **any** of these holds:
- the tile is dug, or it's the lair (as now);
- `t.felt` is set (bedrock you bumped into, see §2.3);
- `run.hiveMap` is true (the Hive Map reveals everything, §5);
- the tile is within **2** tiles (square radius, like today) of a **dug Beacon** tile;
- the player has the **3rd Eye** relic and the tile is within **1** of a dug tile (the relic still helps, just less).

`?reveal=1` keeps overriding everything. Zones 1–2 are unchanged.

### 2.2 Digging into the fog
In Zone 3, `canReach` no longer requires `isRevealed`: an un-dug tile orthogonally next to a dug tile is reachable even if hidden. **Fog frontier** tiles (reachable but not revealed) are drawn as fog with a thin dashed light outline (instead of the gold "reachable" outline), and show **no content icon**. Hover tooltip: **"Unknown" / "The psionic fog hides what's here. Dig to find out."**

### 2.3 Hidden bedrock
Because bedrock is hidden too, a fog frontier tile may be bedrock. Digging it does **not** dig: set `t.felt = true` (now revealed as bedrock), float `"Solid rock"` on it, and don't move the player. It costs nothing (no Hive Alert, no patrol step). `canReach` stays false for revealed bedrock as now.

### 2.4 Beacons
- **3 Beacon tiles** (`c = "beacon"`), rows 2–8, on dirt with no other content, at least 3 tiles apart from each other (Manhattan distance).
- Digging one lights it: `t.used = true`, float `"Beacon lit"`, and its radius-2 area is revealed from then on (per §2.1). Tiles revealed this way show their content as normal.
- `NODE_INFO.beacon = { n: "Psionic Beacon", l: "*", col: "#9a7aff" }`. Tooltip: **"Lights up the fog around it once dug."**
- Placeholder icon: a small glowing crystal pylon (violet diamond on a dark base, soft pulsing glow). Lit beacons glow brighter.

---

## 3. Patrols (Zone 3 only)

### 3.1 Hive tunnels
`genDigMap(3)` carves **2 hive tunnels**: random walks of 4–6 tiles, rows 2–8, through `dirt` tiles only (never bedrock, the lair, protected tiles, or content tiles), not touching the start tile's neighbours. Hive tunnel tiles get `t.hive = true` and keep `dug = false`, so for the **player** they behave like ordinary undug dirt (hidden by fog, dug normally).

### 3.2 Patrol data
`run.map.patrols = [{ x, y, id, lastX, lastY }]`, one patrol on a random tile of each hive tunnel at zone start. A patrol is a Hive Guard squad.

### 3.3 Movement
Patrols take **one step each time the player digs a tile** (not when walking or bumping bedrock). Walkable for a patrol = `t.hive || t.dug` (not the lair).
1. **Hunting:** if a walkable path from the patrol to the player exists with length ≤ 6, step one tile along the shortest path.
2. **Wandering:** otherwise step to a random walkable neighbour, avoiding the tile it just came from when another option exists. If it has no walkable neighbour, it stays.
3. Two patrols never share a tile (the second one waits).

### 3.4 Contact
If a patrol steps onto the player's tile, or the player walks or digs onto a patrol's tile, a **patrol fight** starts: `run.pending = { screen: "combat", kind: "patrol", enc: pick(ENC.z3.patrol), patrolId }`, banner **"PATROL!"** (like the ambush banner). Any walk in progress stops. When the fight is won, remove that patrol. A patrol fight gives normal battle rewards (scrap + card choice, like `"battle"`). If the dig that triggered contact also uncovered tile content, resolve the patrol fight first, then the tile's content.

### 3.5 Reinforcements
In Zone 3, each time Hive Alert reaches a multiple of 8, besides the usual ambush, spawn a new patrol on a random hive-tunnel tile at least 4 steps from the player, up to **3 patrols alive**.

### 3.6 Drawing
- A patrol is drawn only if its tile is revealed (fog hides it). Draw the existing `e_hiveGuard` art scaled to fit the tile (~44px tall), with a red glow under it. Fallback: a red-eyed dark helmet shape.
- Hunting patrols get a small red **"!"** above them.
- Revealed hive tunnel tiles show faint resin-purple veins over the dirt, so the player can see their routes.
- Hover a patrol: **"Hive Patrol" / "Moves one tile each time you dig. Hunts you within 6 tiles. Touching it starts a fight."**
- `mapHud` in Zone 3 adds a line under the Hive Alert bar: **"Patrols: N (hunting: M)"** in red, counting only patrols you can see, or **"Patrols: ?"** when none are visible and the Hive Map isn't held.

---

## 4. Override Key (Zone 3 only)

- One tile with `c = "overrideKey"`, in the **bottom third** (rows 8–10), on empty dirt, not protected, not a hive tunnel, and **reachable** (reuse the `seen` set as the Antidote does). Never place a Beacon next to it.
- When dug: `run.overrideKey = true`, `t.used = true`, float `"Override Key"`, toast **"Override Key! The Core's turrets will be offline."**
- Effect: the Home Base Core fight starts **without its Turrets** (§7), so Phase 1 has no damage shield. The fight opens with the banner **"Turrets offline"**.
- `NODE_INFO.overrideKey = { n: "Override Key", l: "K", col: "#ffcf4a" }`. Tooltip: **"Shuts down the Home Base Core's turrets for the final fight."**
- Placeholder icon: a gold key-card with a small green light. Register `ART_FILES.mapOverrideKey = "assets/map-override-key.png"` (missing for now; draw the fallback).

---

## 5. Hive Map (Zone 3 only)

- One tile with `c = "hiveMap"`, rows **3–6**, empty dirt, reachable, not a hive tunnel.
- When dug: `run.hiveMap = true`, `t.used = true`, toast **"Hive Map! The whole Gate is revealed, patrols included."** From then on every tile is revealed (§2.1), all patrols are visible, and each patrol shows a faint arrow to its next step (the hunting step, or "?" while wandering).
- `NODE_INFO.hiveMap = { n: "Hive Map", l: "M", col: "#5ad0ff" }`. Tooltip: **"Reveals the entire map and all patrols."**
- Placeholder icon: a cyan holographic grid square with a glowing dot. Register `ART_FILES.mapHiveMap = "assets/map-hive-map.png"`.
- Register `ART_FILES.mapBeacon = "assets/map-beacon.png"` too.

### Map legend (Zone 3)
Zone 3 adds Beacon, Override Key, Hive Map, Hive Patrol and Hive tunnel to the legend: 15 entries. Lay the legend out in **3 columns** in Zone 3 (12–13px text), kept inside x 540–930 and y 290–460, so the three help lines below stay clear.

---

## 6. Enemies

Art already exists and is registered for `hiveGuard`, `psionicDrone`, `mimic`, `warden`, `homeCore`, `turret`. The 11 new monsters have **no art**: add their ids to the `ART_FILES["e_" + id]` registration list anyway and give each a canvas placeholder shape (§6.3).

### 6.1 Original Zone 3 roster

| id | Name | HP | Moves | Notes |
|---|---|---|---|---|
| `hiveGuard` | Hive Guard | 50 | **Guard** `{ allBlock: 12 }` → **Spear** `{ dmg: 14 }` | `allBlock` = Block to **all** living enemies including itself. |
| `psionicDrone` | Psionic Drone | 32 | **Static** `{ apply: { weak: 2, vuln: 2 } }` → **Spike** `{ dmg: 10 }` | Flyer. |
| `mimic` | Mimic | 45 | **Reflect** `{ reflect: 20 }` → **Bite** `{ dmg: 13 }` | Reflect: gains Block equal to the damage the player dealt it during the **previous player turn**, max 20. Track `e.dmgTaken` (reset when the player's turn starts, then read on the enemy turn). |
| `warden` | Warden (elite, ×2) | 70 | **Hammer** `{ dmg: 15 }` → **Ward** `{ allBlock: 15 }` | `def.bond: { str: 5, heal: 20, banner: "The Warden avenges its twin!" }`: when one warden dies, every other living enemy of the same id gains 5 Strength and heals 20. The second warden is already tinted (`hue-rotate`). |

### 6.2 New hive monsters (placeholder art)

| id | Name | HP | Moves (cycle) | Hook |
|---|---|---|---|---|
| `hiveWorker` | Hive Worker | 20–24 | **Repair** `{ healAlly: 8 }` → **Pinch** `{ dmg: 6 }` | Heals the lowest-HP **other** ally (itself if alone). Kill it first. |
| `acidSprayer` | Acid Sprayer | 28–32 | **Acid Jet** `{ dmg: 6, apply: { vuln: 1 } }` → **Melt Armor** `{ breakBlock: 1, dmg: 8 }` | Melt Armor removes all your Block before it hits. |
| `larvaCluster` | Larva Cluster | 20–22 | **Pulse** `{ block: 5 }` → **Pulse** `{ block: 5 }` → **Hatch** `{ summon: ["hiveLarva", "hiveLarva"], selfDestruct: 1 }` | A timer: kill it within 3 turns or it bursts into 2 larvae. `selfDestruct`: the enemy dies after the move (no Copper, `onDeath` does not run). |
| `hiveLarva` | Hive Larva | 8–10 | **Nibble** `{ dmg: 3, hits: 2 }` | Only appears from Larva Clusters (always `summoned`). |
| `sentryEye` | Sentry Eye | 30–34 | **Focus** `{ block: 8 }` → **Glare** `{ dmg: 9 }` | Flyer. Passive `def.watch: 3`: from your **4th card each turn** onward, every card you play makes it zap you for 3 (through Block). Show a status chip **"Watch 3"** with a tooltip. |
| `spineLancer` | Spine Lancer | 34–38 | **Wind Up** `{ charging: 1 }` → **Impale** `{ dmg: 24 }` | Wind Up does nothing but shows the existing `charging` intent icon: a telegraphed big hit. |
| `swarmer` | Hive Swarmer | 10–12 | **Bite** `{ dmg: 4 }` | Comes in packs. `onDeath: { n: "Frenzy", allyStr: 1 }`: when it dies, every other living enemy gains 1 Strength. |
| `mindLeech` | Mind Leech | 24–28 | **Siphon** `{ dmg: 6, drain: 1 }` → **Mind Fog** `{ apply: { weak: 2 }, block: 6 }` | Reuses Leech's drain. |
| `resinSpitter` | Resin Spitter | 26–30 | **Gum Up** `{ drainEnergy: 1 }` → **Spit** `{ dmg: 8 }` | Gum Up: you start your next turn with 1 less Energy (min 0). Float **"-1 Energy next turn"** on the player. |
| `hiveOverseer` | Hive Overseer (elite) | 110 | **Summon Workers** `{ summon: ["hiveWorker", "hiveWorker"] }` → **Psi Lash** `{ dmg: 10, apply: { weak: 2 } }` → **Command** `{ allyStr: 2, allBlock: 8 }` | A commander who keeps its team alive and buffed. |
| `gateJuggernaut` | Gate Juggernaut (elite) | 120 | **Plate Up** `{ block: 15 }` → **Ram** `{ dmg: 20 }` → **Grind** `{ dmg: 6, hits: 3 }` | Passive `def.keepBlock: 1`: its Block does **not** expire at the start of the enemy phase, so it stacks unless you break it. |

### 6.3 Placeholder shapes
Same style as the Zone 2 placeholder shapes (3px dark outline, flat fills, cartoon eyes, a little idle motion from `S.time`). The hive palette is chitin purples and resin ambers.

| Shape | Used by | Look |
|---|---|---|
| `worker` | Hive Worker | A small six-legged ant body (`#8a6a9a`) carrying a glowing amber resin blob in its mandibles. |
| `sprayer` | Acid Sprayer | A squat beetle (`#5a8a5a`) with a swollen green acid sac on its back that pulses, and a nozzle-like snout. |
| `larvaCluster` | Larva Cluster | A pile of 5–6 translucent pale eggs (`#d8c8a8`) with dark shapes inside that wriggle; it swells slightly each turn. |
| `larva` | Hive Larva | A tiny pale segmented grub (`#e0d0b0`) with a dark mouth. |
| `eye` | Sentry Eye | A floating eyeball (`#c8c0d8`) with a big red iris that tracks the player (shift the pupil toward x=200), and short tendrils below. |
| `lancer` | Spine Lancer | An upright mantis-like body (`#6a4a7a`) with one long spike arm that pulls back while it has the charging intent. |
| `swarmer` | Hive Swarmer | A small winged insect (`#9a5a7a`) with fast-flickering wings. |
| `mindLeech` | Mind Leech | A violet leech (`#7a4aa0`) with a glowing brain-like bulb on its head. |
| `resin` | Resin Spitter | A round amber-bellied bug (`#c88a3a`) with dripping resin strands from its jaw. |
| `overseer` | Hive Overseer | A tall robed insect figure (`#4a2a5a`) with a crested head and a glowing psionic gem; larger (`w: 140, h: 160`). |
| `juggernaut` | Gate Juggernaut | A massive armoured beetle (`#3a3a4a`) with overlapping grey plates; the plates brighten while it has Block. Larger (`w: 170, h: 140`). |

### 6.4 New move and passive fields
Handled in `execMove` / `afterAction` / the turn flow, shown by `intentInfo` and `describeMove`, and ignored when absent.

| Field | Behaviour | Intent icon | `describeMove` text |
|---|---|---|---|
| `allBlock: n` | Every living enemy **including itself** gains n Block. | `block` | `Gives n Block to all enemies.` |
| `reflect: max` | Gains Block = min(`e.dmgTaken`, max). | `block` | `Gains Block equal to the damage you dealt it last turn (max N).` |
| `healAlly: n` | Heals the lowest-HP other living enemy (itself if alone) by n. | `buff` | `Heals its most wounded ally for n.` |
| `breakBlock: 1` | Sets the player's Block to 0 (float "Armor melted") **before** the move's damage. | `debuff` | prepend `Removes all your Block.` |
| `selfDestruct: 1` | After the move, the enemy dies (no Copper, no `onDeath`). | — | append `Then it bursts.` |
| `charging: 1` | Does nothing; the intent shows the `charging` icon. | `charging` | `Winding up a big attack.` |
| `drainEnergy: n` | `C.nextEnergy -= n` (the turn start must clamp Energy at 0). | `debuff` | `You start your next turn with n less Energy.` |
| `def.watch: n` | Count cards played this turn (`C.played`, reset at turn start). When `C.played > 3` after a card is played, each living enemy with `watch` deals n to the player (through Block). | — | Status chip "Watch n" with tooltip `From your 4th card each turn, every card you play costs you n HP (blocked by Block).` |
| `def.keepBlock: 1` | Skips the "all enemy Block expires" reset in `endTurn` for this enemy. | — | Status chip "Plated" with tooltip `Its Block doesn't expire.` |
| `def.bond` | See Warden. | — | — |
| `onDeath.allyStr` | Extend `onDeath` handling to support `allyStr` (every other living enemy gains n Strength). | — | — |

### 6.5 `ENC.z3`
```
easy:   [["hiveGuard"], ["psionicDrone", "swarmer", "swarmer"], ["hiveWorker", "acidSprayer"], ["larvaCluster"], ["swarmer", "swarmer", "swarmer"]]
normal: [["hiveGuard", "psionicDrone"], ["mimic"], ["mimic", "hiveWorker"], ["spineLancer", "hiveWorker"], ["sentryEye", "acidSprayer"],
         ["resinSpitter", "hiveGuard"], ["mindLeech", "mindLeech"], ["larvaCluster", "larvaCluster"], ["hiveGuard", "swarmer", "swarmer"],
         ["sentryEye", "spineLancer"], ["psionicDrone", "resinSpitter"]]
elite:  [["warden", "warden"], ["hiveOverseer"], ["gateJuggernaut"]]
patrol: [["hiveGuard", "hiveGuard"], ["hiveGuard", "swarmer", "swarmer"], ["hiveGuard", "hiveWorker"]]
boss:   [["turret", "homeCore", "turret"]]
```
`bossName()` reads `ENC[...].boss[0][0]`, which would now be the turret. Make it find the first enemy with `boss: 1` in that list instead.

### 6.6 Randomised roster per map (Zones 2 and 3)
Not every monster should appear in every run. Each time a Zone 2 or Zone 3 map is generated, pick which monsters live there this time. Zone 1 is unchanged; it only has three regular monsters.

- **Regular monsters:** the zone's monster pool is every id in its `easy` + `normal` lists, minus the always-allowed fillers `ALWAYS = ["crawler", "hiveLarva"]` (summon / pack filler). Pick a random subset of `ROSTER_SIZE = { 2: 7, 3: 7 }` ids with the seeded `rng`.
- **Encounters:** keep only the `easy` and `normal` encounters whose ids are all in the subset or `ALWAYS`. The result must have at least **2 easy** and **3 normal** encounters; if not, re-pick the subset (up to 50 tries, then fall back to the full lists).
- **Elites:** keep a random **2 of the 3** elite encounters.
- **Unchanged:** `boss` and `patrol` lists (the boss is always the same; patrols are always Hive Guard squads). Summons still work for any id, even outside the roster (Spore Mother's Crawlers, Overseer's Workers, Larva hatchlings).
- **Storage:** save the filtered lists on the map: `run.map.enc = { easy, normal, elite }`. `chooseEncounter` uses `run.map.enc` when present and falls back to `ENC["z" + run.zone]` otherwise, so old saves still work. Ambushes draw from the filtered `normal` list too.
- **Feedback:** hovering the zone title in `mapHud` shows a tooltip **"Sightings"** listing the names of the monsters in this map's roster (regular + elites, alphabetical). Ids that come only from `ALWAYS` aren't listed.

---

## 7. Final boss: Home Base Core

### 7.1 Setup
- Encounter `["turret", "homeCore", "turret"]`; if `run.overrideKey`, start with just `["homeCore"]` and the banner **"Turrets offline"**.
- `turret`: Turret, 40 HP, **Laser** `{ dmg: 8 }` every turn (one-move cycle). It isn't `summoned`, but give **no Copper** for turrets (add `def.noLoot: 1`).
- `homeCore`: Home Base Core, 300 HP, `boss: 1`, large (`w: 220, h: 200`), centred. With 3 enemies use slots `[560, 720, 880]` so the Core has room; tune if it overlaps.

### 7.2 Turret shield
While any Turret is alive, the Core takes **50% damage** (round down) from all sources, applied in `takeDamage` before Block. Show a status chip **"Shielded"** on the Core while it applies, with tooltip **"Takes 50% damage while a Turret stands."**

### 7.3 Phases
Add `def.phases` to `homeCore` and handle them in `refreshIntents` (next to overdrive). Each phase has an HP threshold, a move list, and an on-enter effect. Entering a phase **replaces the move list and resets `e.mi` to 0**, interrupting the current intent, and shows the phase's banner. If one hit crosses two thresholds, run both on-enter effects in order.

| Phase | HP | Moves (cycle) | On enter |
|---|---|---|---|
| 1 | 300–201 | **Charging** `{ charging: 1 }` → **Beam** `{ dmg: 30 }` | — |
| 2 | 200–101 | **Pulse** `{ dmg: 6, apply: { rad: 3 } }` (every turn) | Banner **"Core breach: Phase 2"**; summon 2 Hive Guards once (respects the 4-enemy cap) |
| 3 | ≤100 | **Hammer** `{ dmg: 15 }` → **Barrage** `{ dmg: 5, hits: 2 }` | Banner **"Core critical: Phase 3"**; from now on the Core gains **2 Strength at the start of each enemy phase** (`turnStr: 2` on the phase) |

Store the current phase on the enemy (`e.phase`); `moveOf` reads the phase's move list when present.

### 7.4 Victory
Killing the Core wins the run (the remaining turrets and guards don't need to die: when `homeCore` dies, mark every other enemy dead with "Shut down" floats and no loot). This ends the run: `endRun(true)` with +75 Scrap as for other bosses, and the run-end line from §1.

---

## 8. Save compatibility
New fields (`overrideKey`, `hiveMap`, `t.hive`, `t.felt`, `map.patrols`, `map.enc`) are absent on old saves and read as falsy or empty. Runs in Zones 1–2 continue unchanged; a run sitting at Thornback now continues to Zone 3 after the win.

## 9. Out of scope
- New cards, relics, events, or Forge items.
- Real art (all new visuals use canvas fallbacks; art keys are registered for later).
- Balance passes beyond the numbers given here.

## 10. Verify before handing back
Use `?zone=3`, `?seed=`, `?reveal=1`, `?ore=` and `?deck=all` to test quickly. Check each in the browser with no console errors:

1. Beat Thornback → boss reward → Descend → Zone 3 with a heal toast and the tunnel start tile.
2. Fog: only dug tiles are visible; frontier tiles show dashed outlines and no icons; bumping hidden bedrock reveals it at no cost; the 3rd Eye shows radius 1; lighting a Beacon reveals radius 2 around it.
3. Patrols: two patrols start on hive tunnels; each dig moves them one step; they hunt within 6 tiles; contact starts a "PATROL!" fight and the patrol is gone after the win; a new patrol appears at each Hive Alert multiple of 8 (max 3); the HUD count matches what's visible.
4. Hive Map reveals the whole map, all patrols and their next steps. The Override Key appears in rows 8–10, is reachable, and removes the turrets from the Core fight with the "Turrets offline" banner.
5. Each new monster draws with its placeholder shape and does what its row says: Larva Cluster hatches on turn 3 and dies; Sentry Eye zaps from your 4th card; Resin Spitter cuts next turn's Energy; Juggernaut's Block persists; Swarmer deaths buff the others; Overseer summons Workers; Wardens enrage when one dies; Mimic reflects last turn's damage.
6. Core with turrets: the Core takes half damage while a turret lives; Phase 2 interrupts, summons 2 guards once and pulses Radiation each turn; Phase 3 adds 2 Strength per enemy turn; one big hit through two thresholds runs both phase starts; killing the Core shuts everything down and shows "Victory! The Home Base has fallen."
7. Randomised roster: two Zone 2 runs with different seeds have different "Sightings" lists; every fight on a map (battle, elite, ambush) uses only that map's roster; the same `?seed=` always gives the same roster; Zone 1 is unaffected.
8. Zones 1–2 otherwise play exactly as before.
