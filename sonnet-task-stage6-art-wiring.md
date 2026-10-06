# Sonnet task: Stage 6 — wire in the Codex art

Codex has dropped the art described in `codex-task-stage6-art.md` into `stage6/assets/`. Hook every file into `stage6/stage6.js`. **Don't change gameplay.**

**Files:** `stage6/stage6.js`, plus bump `stage6.js?v=` in `stage6/stage6.html`.
**Before starting:** list `stage6/assets/` and compare it with the checklist at the bottom of `codex-task-stage6-art.md`. Some files may be missing or misnamed. Wire what exists; report anything missing at the end instead of guessing.
**Golden rule:** every draw keeps its current placeholder shape as a fallback when `artReady(key)` returns null. The game must still run with an empty `assets/` folder.

---

## 1. Loader

- Today, art only loads with `?art=1` (search `ART_FILES`). Change it so **art loads by default**, and `?art=0` forces placeholders, which is handy for debugging.
- Replace `ART_FILES` with the full list from the art task (§2–§9 below). Fix the paths: the current entries (`assets/miner.png`, etc.) don't match the new names.
- Add a sheet helper:
  ```js
  // draws cell (col,row) of a sheet with cell size cw x ch into dx,dy,dw,dh; returns false if the sheet isn't loaded
  function drawCell(key, col, row, cw, ch, dx, dy, dw, dh) { ... }
  ```
- Missing files must fail silently: no thrown errors, and fall back to the placeholder.

## 2. Hero — `miner-sheet.png` (4 cells, 384×512)

In `drawPlayer()`:

| Cell | When to show it |
|---|---|
| 1 Idle | default |
| 2 Attack | for 0.3 s after the player plays an Attack |
| 3 Skill | for 0.3 s after a Skill or Power |
| 4 Hurt | while `P.hitT > 0` |

- Add `P.poseT` and `P.pose`, set them in `playCard`, and tick them down in `updateCombat`.
- Draw height is about 170 px, with feet on the existing `y`. Keep the existing red hit flash, but clip it to the sprite (redraw the sprite using `"lighter"` blending, as stage5 does with `drawCruiserArt`), not a rectangle.

## 3. Companions — `companions-sheet.png` (4 cells, 256×256)

In `drawPlayer()`, replace the dog and mouse shapes:

| Companion | Normal | Acting |
|---|---|---|
| Dog | cell 1 | cell 2 for 0.3 s when `dogAttack()` fires |
| Mouse | cell 3 | cell 4 for 0.3 s when the mouse gives Block |

Draw them about 70 px tall at their current positions. Keep the value number and tooltip above them.

## 4. Enemies — `enemy-<id>.png`

- `drawEnemyBody()` already looks up `artReady(id)`. Map ids to ART keys:
  - `droneA` and `droneB` → `drone`
  - the twin wardens → `warden` (tint the second one with `ctx.filter = "hue-rotate(40deg)"` or similar)
  - turrets → `turret`
- Size: draw height = `def.h * 1.25` for normal enemies and `* 1.1` for bosses, keeping the aspect ratio, with feet on `y`. Tune per enemy if one looks off; add an optional `artScale` to the ENEMIES def.
- Floating enemies (`drone`, `psionicDrone`) get a gentle bob: `sin(t*2)*6`.
- **Hit flash:** while `e.hitT > 0`, redraw the sprite once with `"lighter"` at alpha 0.5. **Death:** existing fade.
- Zone 2/3 enemies don't exist in data yet. Just register their ART keys so Phase 2 picks them up.

## 5. Battle backgrounds — `bg-zone1/2/3.webp`

In `drawCombat()`, use the image for `run.zone` (search `artReady("bg1")`) and draw it cover-fit over the full 960×640. Then add a dark gradient over the bottom 40% (alpha 0 → 0.55) so the hand stays readable.

## 6. Dig Map — `tiles-sheet.png`, `map-icons-sheet.png`

In `drawMap()`:

| Tile state | Sheet cell |
|---|---|
| Unrevealed | 1 or 2 |
| Revealed, undug | 3 or 4 |
| Dug | 5 or 6 |
| Bedrock | 7 or 8 |

- Pick the variant with the existing `hash(x*31+y*17) < .5`.
- Keep the existing selection, reach and hover outlines drawn on top.
- `drawTileIcon(c, ...)`: map content to icon cells in this order: battle, elite, event, camp, trader, cache, cu, ag, au, pod, boss. Draw the icon at about `r*2` size. This also updates the map legend, which uses the same function.
- Draw the landing pod icon (cell 10) on the pod tile and the lair icon (cell 11, drawn bigger, about 1.6× the tile) at the boss lair.
- Used camps, caches and events stay greyed out (globalAlpha 0.4).

## 7. Card art — `cards-<family>.png` (cells 320×140, 4 columns)

- Add `artCell` to each CARDS entry, e.g. `artCell: ["drill", 2]` meaning sheet `cards-drill`, index 2 (`col = i % 4`, `row = i / 4 | 0`). The indices follow the order listed in `codex-task-stage6-art.md` §6. Overheat and Spore use `cards-basic` cells 2 and 3.
- In `drawCard()`, the art box is `rp(-50, -37, 100, 44)`. Clip to that rounded rect and draw the cell cover-fit. Remove the big family-letter placeholder when the art draws.
- **Fused cards:** draw half A's art in the left half of the box and half B's in the right half, with a thin bright diagonal seam line between them.

## 8. Relics — `relics-sheet.png` (5×3, 128)

`drawRelic(id, x, y, r)`: add `icon: n` to each RELICS entry (order as in art task §7). Draw the cell at `2r` size inside the existing circle. Keep the circle as a subtle backing ring.

## 9. UI icons — `ui-icons-sheet.png` (8×4, 96)

| Where | Cells |
|---|---|
| `statusRow()` / STATUS | weak → (0,0), vuln → (1,0), str → (2,0), rad → (3,0). Combat HUD Charge → (4,0), Heat → (5,0). Block badge → (6,0). Energy orb → (7,0), drawn behind the existing energy number. |
| `drawIntentIcon(kind)` | attack → (0,1), block → (1,1), debuff → (2,1), buff → (3,1), summon → (4,1), charging → (5,1), unknown → (6,1) |
| `oreHud()` and card ore pips | Copper, Silver, Gold → (0,2), (1,2), (2,2). Scrap counter → (3,2). Hive Alert label → (4,2). |
| Combat buttons | Deck → (5,2), Draw → (6,2), Discard → (7,2) |

- Draw icons at their current placeholder sizes. Keep every number and label drawn by code on top.

## 10. Screen backdrops

Cover-fit each backdrop, then put a dark overlay on top (about 0.35–0.5 alpha) so panels and text stay readable.

| Screen | Image |
|---|---|
| `drawHub()` | `bg-hub` |
| `drawCamp()` | `bg-camp` |
| `drawBench()` | `bg-workbench` |
| `drawTrader()` | `bg-trader` |
| `drawEvent()` | `bg-event` |
| `drawCache()` | `bg-event` |
| `drawReward()` | the current zone's battle background, darker |

**Events:** add `img: "probe" | "sporePool" | "mouse"` to each EVENTS entry. In `drawEvent()`, draw the 960×400 illustration at the top, scaled to about 720×300 with rounded corners, and push the existing text and choices below it. Check that the longest event text still fits.

## 11. Acceptance checklist

- [ ] Every file in the art checklist is loaded and visible where specified. Missing files are listed in your final report.
- [ ] `?art=0` and a renamed `assets/` folder both still fall back to placeholders with no console errors.
- [ ] Hero poses switch on attack, skill and hurt. The Dog and Mouse animate when they act.
- [ ] Enemies stand on the ground line at a sensible size next to the hero. Hit flash is sprite-shaped.
- [ ] Dig map tiles read clearly: fog vs. dirt vs. tunnel vs. bedrock are obvious at a glance.
- [ ] Card art shows in hand, reward, trader, deck viewer and workbench. Fused cards show the split art.
- [ ] Text on every screen is still readable over the backdrops.
- [ ] Screenshots of combat, the map, a card reward and the workbench are saved to the scratchpad and shown to the user.
