# Sonnet task: Stage 6 Phase 1.5 — Dig Map, Ore, Fusion

Phase 1 (`sonnet-task-stage6.md`) is built and playable, but it feels too much like Slay the Spire. This pass gives it a Drift Miner identity with three changes:

1. **Dig Map** replaces the node map. You tunnel through a fogged grid toward the boss lair.
2. **Ore** (Copper / Silver / Gold) is a run resource. You get it from digging and combat, and spend it in combat and at the Workbench.
3. **Fusion** at the Workbench: combine two deck cards plus ore into one stronger hybrid card.

**Files:** `stage6/stage6.js` and `stage6/stage6.html` (bump `stage6.js?v=`). Everything else in the Phase 1 spec still applies unless a section below replaces it.
**Keep:** combat engine, cards, enemies, Forge, debug params, and the data-driven style. English-only UI.

---

## 1. Ore

- Three ore types, matching Stage 1: **Copper** (common), **Silver** (uncommon), **Gold** (rare).
- `run.ore = { cu, ag, au }`. It persists through the run and is shown on every HUD (map, combat, camp, trader) as three small colored chips with counts (copper `#d9822b`, silver `#c8ccd2`, gold `#ffcc4a`).
- **Sources:**
  | Source | Ore |
  |---|---|
  | Copper vein tile | 2–3 Copper |
  | Silver vein tile | 1–2 Silver |
  | Gold vein tile | 1 Gold |
  | Any enemy killed | +1 Copper |
  | Elite won | +1 Silver |
  | Boss won | +1 Gold |
  | **Mine N** (new card keyword) | +N Copper |
- **Run end:** leftover ore converts to banked Scrap (Copper 3, Silver 10, Gold 30 each). Show this on the run-end screen.
- Add a keyword tooltip: **Mine** — "Gain N Copper."

### Ore costs on cards
- A card may have an ore cost in addition to its Energy cost. Draw it as small ore pips under the energy circle.
- A card is playable only if you have the Energy **and** the ore. Otherwise it shakes, like the existing too-expensive handling in `playCard`.
- Ore is spent when the card is played.
- `costOf` / `playCard` need an `ore: { cu, ag, au }` field on the card def.

### Card changes (existing cards)
| Card | Change |
|---|---|
| Pilot Bore | Add: "If this kills, Mine 1." |
| Wind Up | Add: "Mine 1." |
| Rock Breaker | Add: "Mine 1." |
| Deep Core | Cost becomes 2⚡ + 1 Silver [upgraded: 1⚡ + 1 Silver] |
| Carpet Bomb | Cost becomes 2⚡ + 1 Silver |

### New cards (add to the reward pool)
| Card | Family | Rarity | Cost | Type | Text |
|---|---|---|---|---|---|
| Copper Slug | blaster | C | 0⚡ + 1 Cu | Attack | Deal 9 [12]. +1 Heat. |
| Ore Cannon | uplink | U | 2⚡ | Attack | Deal 4 [5] per Copper you hold (does not spend it). |
| Silver Lining | utility | U | 1⚡ + 1 Ag | Skill | Gain 15 [20] Block. Draw 2. |
| Smelter | drill | U | 1⚡ [0⚡] | Power | Whenever you Mine, gain 3 Block. |
| Gold Rush | utility | R | 0⚡ + 1 Au | Skill | Gain 3 Energy. Draw 3 [4]. Exhaust. |

### Relic changes
| Relic | New effect |
|---|---|
| Magnet | Ore veins give +1 ore (replaces +25% Scrap). |
| 3rd Eye | Keep the first-turn draw, and also: Dig Map reveal radius is 2 instead of 1. |

## 2. Dig Map (replaces Phase 1 §6 node map)

### Layout
- Each zone has a grid of **9 columns × 11 rows**, with tiles of about 52 px, drawn in the left/center of the screen. A right-side panel shows the zone name, HP, Scrap, ore, Hive Alert, deck button, relics and a legend.
- **Landing pod:** column 4, row 0. It starts dug, and the player token stands on it.
- **Boss lair:** column 4, row 10. It is always visible, drawn as a large glowing hive mouth labeled with the boss name, so the player always knows where they are heading.
- The tile directly above the lair (column 4, row 9) is always a **Camp**.

### Tile kinds
| Kind | Notes |
|---|---|
| Dirt | Plain tile; diggable. |
| Bedrock | Not diggable. Generate as small clusters covering about 15% of tiles. Regenerate the map if a breadth-first search finds no dirt path from the pod to the lair. |
| Content tiles | Dirt with something inside, placed randomly on non-bedrock tiles (not the pod, lair or forced camp). |

**Content per zone:**
| Content | Count | Row limits |
|---|---|---|
| Battle | 9 | rows 1–9 |
| Elite | 2 | rows ≥ 5 |
| Event | 3 | any |
| Camp | 1 extra (+ the forced one) | rows 4–7 |
| Salvage Trader | 1 | rows 3–7 |
| Relic Cache | 1 | rows ≥ 3 |
| Copper vein | 10 | any |
| Silver vein | 4 | rows ≥ 4 |
| Gold vein | 2 | rows ≥ 7 |

### Fog and digging
- A tile is **revealed** if it is within 1 tile (all 8 directions) of any dug tile, or within 2 tiles with 3rd Eye. Revealed tiles show their content icon.
- Unrevealed tiles are dark rock with subtle per-tile noise (use the `hash` helper idea from stage5).
- **To dig:** click a revealed, non-bedrock, undug tile that is directly up/down/left/right of any dug tile. The tile becomes dug and the token slides there (≈0.2 s tween). Each dig adds **+1 Hive Alert**, then the tile's content resolves.
- Dug tiles are open tunnel. Clicking an already-dug **Trader** tile reopens the shop (its stock is kept in `run`). Camps, caches and events are single-use; show them greyed out once used.
- Hover tooltip on any revealed tile: its type, plus "Click to dig" when it can be dug.

### What each tile does
| Tile | Result |
|---|---|
| Dirt | Nothing. |
| Ore vein | Ore added, with a float text like "+3 Copper". |
| Battle / Elite / Event / Camp / Trader / Cache | Same screens as Phase 1, through the existing `pending` system. |
| Boss lair | Only diggable from column 4, row 9. Starts the boss fight. |

Battle difficulty by row: rows 1–3 use the *easy* pool, rows 4+ the *normal* pool.

### Hive Alert (pacing)
- `run.alert` goes up by 1 per dig. Show it as a meter "Hive Alert 5 / 8" in the right panel, filling red.
- Each time it reaches a multiple of **8**, an **Ambush** is due. It triggers on the next dig that lands on Dirt or an ore vein (never on top of another content tile): play a short "AMBUSH!" banner, then a normal-pool battle.
- **Ambush reward:** Scrap and ore only, with no card pick. This makes over-digging for ore cost HP.

### Save data
- `run.map` becomes `{ w, h, tiles: [{ k, c, dug, used }], px, py }`, plus `run.alert` and `run.ore`.
- If a saved run has the old node-map format, discard the run (keep the bank and Forge) and show the toast "Old run discarded after update".

## 3. Rewards (changes to Phase 1 §7)

- **Battle:** Scrap + 1 Copper per enemy killed + pick 1 of 3 cards (or Skip), same as now.
- **Elite:** as now, plus the Silver.
- **Ambush:** Scrap + Copper only.
- Show the ore gained on the reward screen.

## 4. Camp → Rest or Workbench (replaces Phase 1 Camp)

The camp offers two choices:
- **Rest:** heal 30% of max HP. This ends the camp.
- **Workbench:** opens the Workbench screen. You can do as many actions as your ore allows, then press **Done**. Choosing Workbench uses up the camp's Rest.

### Workbench screen
- Your deck is shown as a scrollable grid on the left. The right panel holds two **Fuse slots**, a result preview, the action buttons and your ore.

| Action | Cost | Effect |
|---|---|---|
| **Upgrade** a card | 3 Copper | Same as the Phase 1 upgrade. Upgrading a fused card upgrades both halves. |
| **Fuse** two cards | see below | Remove both cards from the deck; add one fused card. |

**Fuse cost** (use the highest rarity of the two cards):
| Highest rarity | Cost |
|---|---|
| Basic or Common | 4 Copper |
| Uncommon | 2 Copper + 1 Silver |
| Rare | 2 Silver + 1 Gold |

- **Can't be fused:** Powers, Status cards, and cards that are already fused (a fused card holds at most 2 halves).
- Show the fused result card in the preview before confirming.

## 5. Fused cards

**Data:** a deck entry is either `{ id, up }` or `{ fuse: [{ id, up }, { id, up }] }`. Add a `def(card)` helper that returns a synthetic definition for fused cards. Then route `cardVals`, `baseCost`, `isExh`, `cardText`, `cardName`, `costOf`, `canUpgrade`, `drawCard` and `playCard` through it. Combat card objects carry the same shape.

**Rules for a fused card A + B:**
| Property | Rule |
|---|---|
| Energy cost | `max(0, costA + costB − 1)` |
| Ore cost | sum of both halves' ore costs |
| Type | Attack if either half is an Attack, otherwise Skill |
| Target | Needs a target if either half does; both halves use the same target |
| Effect | Play A's effect, then B's, each with its own upgrade values |
| Family triggers | Count per half: Sword count, Heat, Rocket Launcher attack count, Red Line bonus, Laser Sword relic (the 0 cost applies only if a half is Sword) |
| Exhaust | Exhausts if either half does |
| Text | A's text, a thin divider line, then B's text |
| Frame | Split diagonally between the two family colors |
| Rarity pip | The higher of the two rarities |

**Name:** "A + B" (e.g. "Strike + Guard"), unless the pair matches a recipe below. A recipe gives the fused card a name and one extra bonus line, applied after both effects.

| Families | Name | Bonus |
|---|---|---|
| drill + blaster | Plasma Bore | Gain 1 Charge. |
| drill + bomb | Seismic Charge | Deal 4 to ALL enemies. |
| blaster + sword | Arc Blade | Draw 1. |
| bomb + radiation | Dirty Bomb | Apply 2 Radiation to ALL enemies. |
| sword + companion | Hunting Party | Dog attacks once (summon Dog 2 if it isn't out). |
| radiation + utility | Isotope Kit | Mine 1. |
| uplink + any | Orbital *X* (X = the other half's name) | Gain 4 Block. |
| basic + basic | Field Kit | Gain 1 Charge. |
| same family (non-basic) | *Name*-Mk II (from the first half) | +3 damage on the first hit if it attacks, otherwise +3 Block. |

Family order doesn't matter when matching recipes. If more than one recipe matches, use the first row in the table.

## 6. Forge additions

| Upgrade | Max | Cost | Effect |
|---|---|---|---|
| Ore Satchel | 3 | 200 / 300 / 400 | Start each run with +2 Copper per level |

## 7. Trader additions

- **Buys ore:** Copper 8, Silver 25, Gold 70 Scrap each.
- **Sells ore:** Copper 20, Silver 60, Gold 150 Scrap each. Stock: 5 Copper, 2 Silver and 1 Gold per visit, persisting when you revisit the tile.

## 8. Debug params

- `?ore=20` gives 20 of each ore at run start.
- `?reveal=1` shows the whole dig map.
- `?bench=1` opens the Workbench right after the run starts.

## 9. Acceptance checklist

- [ ] The node map is gone. Runs start at the pod on a fogged 9×11 grid, and the lair is visible from the start.
- [ ] Digging follows the adjacency rules, reveals the radius-1 fog, and resolves every content type. The map always has a dirt path to the lair.
- [ ] Hive Alert ambushes fire every 8 digs, only on plain or ore tiles, and give no card pick.
- [ ] Ore shows on all HUDs; Mine, kill drops, veins and Magnet all add ore correctly.
- [ ] Cards with ore costs can't be played without the ore and spend it when played.
- [ ] Workbench Upgrade and Fuse charge the right ore. Fused cards play both halves in order with their family triggers, and recipes apply their names and bonuses.
- [ ] Fused cards save and load correctly, and are displayed correctly in the deck viewer, hand, trader and reward screens.
- [ ] Run end converts leftover ore to bank Scrap.
- [ ] Old node-map saves are discarded cleanly.
- [ ] No console errors.
