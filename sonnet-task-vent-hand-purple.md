# Task: Re-skin the Stage 4 Room 3 vent hand to match Stage 1 alien #1

## Background
Stage 4, room 3 (utility closet). When the player clicks the vent to climb back
to the hallway, `returnToHallwayVent()` starts the `ventSwipe` action and
`drawUtilityVentSwipeAction()` draws an alien hand swiping out of the vent.
The current hand art (`alien-vent-paw-green-concept-v1.png`) is an olive-green
claw that matches no alien in the game. It must now belong to **Stage 1 alien #1,
the purple spiky crawler** (see `Claude outputs/stage1-aliens.png`, cell 1, and
`assets/monsters/alien-monster-samples.png`, bottom-right).

---

## STEP 1 — RK generates the art (ChatGPT / Codex)

Attach as references: `Claude outputs/stage1-aliens.png` (crop cell 1) and the old
`assets/stage4/level3-utility-closet/alien-vent-paw-green-concept-v1.png` (for pose/framing).

Prompt:
> Painted 2D game sprite of a single alien forearm and clawed hand reaching out
> horizontally to the LEFT, same pose and framing as the attached green claw
> reference: three hooked fingers spread forward, forearm extending off to the
> right edge, slight downward curl. Restyle it as the attached purple spiky
> crawler alien: muted violet/plum hide with darker purple ridged, segmented
> muscle bands; a row of short bone-ivory spines along the top of the forearm;
> thick, curved bone-ivory / pale tan talons (not grey). Faint warm rim light,
> darker underside. Same painted, glossy cartoon style as the reference claw,
> clean dark outline. No body, no vent, no background. Transparent background
> PNG (or flat pure #00FF00 chroma green if transparency isn't possible).
> Wide landscape canvas, about 1300 x 500 px, hand filling the frame.

Save it as:
`assets/stage4/level3-utility-closet/alien-vent-paw-purple-v1.png`

---

## STEP 2 — Sonnet codes it

Work only in `stage4.js` (plus the asset file noted below). Make a backup first:
copy `stage4.js` to the next free `stage4.js.bakN`.

### 2a. Make sure the new PNG is transparent
If `alien-vent-paw-purple-v1.png` has a green background (no alpha), key it out
with a small Python/Pillow script: pixels where G is high and R,B are low
(e.g. `g > 150 and r < 120 and b < 120`) become alpha 0; soften a 1–2 px edge
and de-spill green on edge pixels (clamp G to max(R,B)). Overwrite the same file.
Check the four corners are alpha 0.

### 2b. Swap the image source
Around line 241, change:
```js
generatedArt.utilityVentPaw.src = "assets/stage4/level3-utility-closet/alien-vent-paw-green-concept-v1.png?v=stage4-vent-paw-green-1";
```
to:
```js
generatedArt.utilityVentPaw.src = "assets/stage4/level3-utility-closet/alien-vent-paw-purple-v1.png?v=stage4-vent-paw-purple-1";
```
Do NOT delete the old green PNG.

### 2c. Keep the hand's proportions
`drawUtilityVentSwipeAction()` (~line 6716) hard-codes pawW/pawH
(104x68 → 174x108, lunge 176x106). If the new PNG's aspect ratio
(naturalWidth / naturalHeight) differs from ~2.6, update
`drawUtilityVentPawArt()` so height is derived from width:
`height = width * (img.naturalHeight / img.naturalWidth)`, keeping the
same vertical center (`y + passedHeight/2`). Do not change the timing,
positions, the motion-blur ghost copies, or the vent shadow ellipse.

### 2d. Remove the old grey claw baked into the player sheet
`assets/stage4/level3-utility-closet/player-vent-swipe-reaction-v1.png`
(1040x320, 4 frames) has leftover grey claw tips from the old hand in
frame 3, top-right of the helmet. Clear them:
- Back up the file as `player-vent-swipe-reaction-v1.bak.png`.
- Set alpha to 0 for the box **x 688–766, y 76–136** only. Do not touch
  anything left of x 688 (that's the helmet) or below y 136 (the glove).
- Bump the cache-buster on line ~242:
  `?v=stage4-vent-player-art-1` → `?v=stage4-vent-player-art-2`.

### 2e. Test
Open stage4, go to room 3, click the vent. Confirm: purple spiky hand with
ivory claws swipes out, no green fringe, no stretching, no grey claw tips on
the falling astronaut frame.

### Report back
List every line changed, the new PNG's dimensions, and whether 2a/2c were needed.
