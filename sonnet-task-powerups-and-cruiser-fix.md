# Sonnet task: Stage 5 fixes — cruiser death flash + rotating weapon powerups

**File to edit:** `stage5.js` (in the driftminer folder). Everything lives in one IIFE. Search for the quoted snippets below (line numbers drift, so don't rely on them).
**After editing:** bump the cache-buster in `stage5.html` (`stage5.js?v=...` → any new value) so the browser reloads it.
**Keep:** English-only UI, no new on-screen text beyond what's specified, controls unchanged.

---

## Task 1 — Remove the flashing rectangle when the Blockade Cruiser (5-3 boss) dies

**Cause.** In `function drawCruiser(b)`, the last line draws a flashing box over the whole ship while it's dying. It was made for the old code-drawn hull. Now that the cruiser uses painted art, it shows as a rectangle:

```js
if (b.state === "dying") { ctx.fillStyle = `rgba(255,240,200,${.15 + .15 * Math.sin(b.dieT * 30)})`; ctx.fillRect(b.x - 310, b.y - 95, 620, 227); }
```

**Fix.**
1. Delete that line.
2. In `function drawCruiserArt(b)`, add a sprite-shaped flicker while dying. Redraw the cruiser image additively so only the ship's pixels glow. Put it right after the existing `if (b.flash > 0) {...}` overlay:
   ```js
   if (b.state === "dying") {
     ctx.save(); ctx.globalCompositeOperation = "lighter";
     ctx.globalAlpha = .25 + .2 * Math.sin(b.dieT * 30);
     ctx.drawImage(ART.cruiser, x - 384, y - 160, 768, 320);
     ctx.restore();
   }
   ```
3. **Same bug in the Hive Warden (5-5).** At the end of `function drawHive(b)` there's the same kind of line: `ctx.fillRect(b.x - 330, b.y - 130, 660, 300)`.
   - Delete it.
   - In the painted branch (`if (art) { ... }`), add the same additive redraw of `ART.hive` using that branch's `x - w / 2, y - h / 2, w, h` when `b.state === "dying"`.

**Test.** Open `stage5.html?level=3&debug=boss` and kill the cruiser (it's quicker if you temporarily lower its HP). The ship should flicker and explode with no box around it. Do the same with `?level=5&debug=boss`.

---

## Task 2 — Weapon powerups cycle through types every second (player chooses)

### Behavior
- Every weapon capsule a carrier drops cycles through the weapons, switching type once per second. Touching it grants whatever type is showing at that moment.
- **Cycle order:** `WEAPONS = ["spread", "homing", "flak", "wingmen"]`. The capsule starts on the carrier's assigned type (`e.drop`), then advances.
- **Skip maxed weapons:** leave out any weapon already at `MAX_LV` (check `G.player.lv[type] >= MAX_LV`). If every weapon is maxed, the capsule stays static on its original type, and picking it up gives the existing max-level bonus.
- **Don't cycle:**
  - `shield` drops (used in the side-scroll levels).
  - "Lost level" capsules, which have `d.lost === true` (the capsule that pops out when you get hit). It must stay the weapon you lost.
- The carrier's small preview icon above it (`drawPowerIcon(e.drop, e.x, e.y - 42, ...)` in the enemy draw code) can stay as-is.

### Data
Drops are created in `killEnemy`:
```js
if (e.drop) G.drops.push({ type: e.drop, x: e.x, y: e.y, age: 0, x0: e.x, y0: e.y });
```
Change it to add cycling fields when the drop is a weapon:
```js
if (e.drop) {
  const cyc = WEAPONS.includes(e.drop);
  G.drops.push({ type: e.drop, x: e.x, y: e.y, age: 0, x0: e.x, y0: e.y, cycle: cyc, cycleT: 1.0, swapFx: 0 });
}
```

### Update — in `function updatePickups(dt)`, inside `for (const d of G.drops)`
Put this after `d.age += dt;` and after the `if (d.lost) { ... continue; }` block, so it only runs for normal drops:
```js
if (d.cycle) {
  d.cycleT -= dt;
  if (d.cycleT <= 0) { d.cycleT += 1.0; nextCycleType(d); }
  d.swapFx = Math.max(0, d.swapFx - dt);
}
```
Add a helper near `applyPowerup`:
```js
const PU_CYCLE_SEC = 1.0;
function nextCycleType(d) {
  const p = G.player, open = WEAPONS.filter(w => p.lv[w] < MAX_LV);
  if (!open.length) { d.cycle = false; return; }          // everything maxed: freeze
  let i = WEAPONS.indexOf(d.type);
  for (let k = 0; k < WEAPONS.length; k++) { i = (i + 1) % WEAPONS.length; if (open.includes(WEAPONS[i])) break; }
  d.type = WEAPONS[i]; d.swapFx = .18; sfx("select");  // quiet tick; use a softer sound if "select" is too loud
}
```
When a drop spawns, run the maxed-skip once: if `d.type` is already maxed, call `nextCycleType(d)` right away so the capsule never *opens* on a useless weapon. Nothing changes in pickup itself: the existing code calls `applyPowerup(d.type, ...)` with whatever type is current.

### Draw — in `function drawPickups()`, inside `for (const d of G.drops)`
The current code is:
```js
ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = PU_COLOR[d.type];
drawPowerIcon(d.type, d.x, d.y, 1 + .08 * Math.sin(d.age * 6), d.type === "flak" || d.type === "spread" ? 0 : d.age * 1.5);
ctx.restore();
```
Add these visuals for `d.cycle` drops:
1. **Swap pop.** Scale the icon by `1 + d.swapFx * 1.6` so it "flips" in when the type changes.
2. **Countdown ring.** Draw a thin arc around the capsule showing time left until the next swap, in the current type's colour:
   ```js
   ctx.strokeStyle = PU_COLOR[d.type]; ctx.lineWidth = 3; ctx.globalAlpha = .85;
   ctx.beginPath(); ctx.arc(d.x, d.y, 26, -Math.PI / 2, -Math.PI / 2 + TAU * (d.cycleT / PU_CYCLE_SEC)); ctx.stroke();
   ```
3. **Next-type preview.** Draw the upcoming type at small size (`drawPowerIcon(next, d.x + 24, d.y - 22, .35, 0, false)`) at 50% alpha, so the player can plan. Work out `next` with the same skip-maxed logic as `nextCycleType`, without changing the drop (a small `peekNextType(d)` helper that returns the type).
4. Keep `lost` capsules drawn exactly as now: no ring, no preview.

### Balance notes
- Capsules drift in the scroll direction the same way as before (down in top-down levels, left in side-scroll levels), so the player gets roughly 3–6 cycles to pick a type. If that feels too short, lower the drift speed from 52 to about 40 in `updatePickups` (non-lost branch only).
- The lower-right weapon HUD already shows each weapon's level pips, so the player can see which weapon they want.

### Test checklist
- `stage5.html?level=1`: the first carrier (around 11s) drops a capsule that visibly cycles Spread → Homing → Flak → Wingmen once a second, with the ring and the next-type preview. Grabbing it on Flak gives Flak +1 and makes Flak the primary weapon.
- Set a weapon to Lv5 (Weapon Forge, or `localStorage` `driftMinerStage5` → `lv`): that weapon never appears in the cycle.
- All four weapons at Lv5: the capsule doesn't cycle, and pickup gives the bonus.
- Get hit: the lost-level capsule keeps its weapon type and doesn't cycle.
- 5-2 shield capsules don't cycle.
- No console errors. Check 5-2 and 5-4 too, since the side-scroll levels use the same pickup code.
