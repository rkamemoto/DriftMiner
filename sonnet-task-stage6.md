# Sonnet task: Stage 6 "Landfall" — deckbuilder (Slay the Spire style)

> **Update:** `sonnet-task-stage6-phase1_5.md` replaces §6 (the node map) and the Field Camp with a Dig Map, Ore and a Workbench for card fusion. Files now live in `stage6/`.

The miner has landed on the alien planet and fights on foot toward the alien **Home Base**. Stage 6 is a turn-based deckbuilder roguelike: branching map → card battles → pick 1 of 3 card rewards after every battle → bosses. Between runs, banked Scrap buys permanent upgrades at the **Forge** (same idea as Stage 5).

**Build in two phases. Do Phase 1 only unless told otherwise.** Phase 2 is specified here so the Phase 1 architecture supports it.

| Phase | Scope |
|---|---|
| **1** | New files + menu wiring, Forge hub, map, full combat engine (all keywords), all cards, all relics, rewards, Field Camp, Salvage Trader, Relic Cache, 3 events, save/resume. **Zone 1 only** — beating the Landing Sentinel ends the run in a victory screen that says "Zone 2 coming soon". |
| 2 | Zones 2–3 enemies, elites, bosses (incl. Home Base Core), Spore status card, remaining events, full-run victory. |
| Later | Generated art pass (not Sonnet). |

---

## 1. Files and wiring

- **New:** `stage6.html`, `stage6.js`, `Play Stage 6 Chrome.bat`.
  - Copy the shell of `stage5.html`: same 3:2 `.s5-shell` layout (rename classes to `s6-`), canvas `id="stageSixCanvas"` 960×640, the home-icon link to `index.html`, title `Drift Miner: Landfall`, script tag `stage6.js?v=1`.
  - Copy `Play Stage 5 Chrome.bat` and change the URL to `stage6.html`.
- **`index.html`:** add `<option value="stage6">Stage 6 - Landfall</option>` after the Stage 5 option. Bump the `game.js?v=` cache-buster.
- **`game.js`** (search `updateStartButtonLabel` and the `button.addEventListener("click"` block below it): label `"Make Landfall"` for stage6; navigate to `stage6.html`.
- **`stage6.js`:** one `"use strict"` IIFE like `stage5.js`. Reuse its helper idioms (`clamp`, `rand`, `lerp`, `ease`, `params = new URLSearchParams(location.search)`, `loadArt`/`ART` pattern).
- Bump `stage6.js?v=` in `stage6.html` on every edit.
- English-only UI.

## 2. Architecture requirements

- **Data-driven.** `CARDS`, `RELICS`, `ENEMIES`, `ENCOUNTERS`, `EVENTS` are plain object tables. Card effects are composed from a small set of action primitives (below), not bespoke code per card where avoidable.
- **Action queue.** All effects push actions onto a queue that resolves one at a time with short tweens (≈150–250 ms) so damage numbers, block gains and deaths read clearly. Input is blocked while the queue is busy, except hover.
- **Seeded RNG.** Use a small seeded PRNG (mulberry32) for the run: map generation, rewards, shuffles, enemy picks. Show the seed on the run-end screen. `?seed=123` forces it.
- **Screens / state machine:** `hub` (Forge) → `map` → `combat` → `reward` → `map` … plus `camp`, `trader`, `event`, `cache`, `runEnd`.
- **Placeholder art only.** Everything drawn with canvas shapes + text. Still route every sprite through an `ART` table with `loadArt()` and draw functions that fall back to shapes when the image is missing — the art pass will drop files in `assets/stage6/` later.

### Action primitives (minimum set)

`damage(target, n, hits=1)`, `damageAll(n, hits=1)`, `damageRandom(n, hits)`, `selfDamage(n)`, `block(n)`, `apply(target|all|self, status, n)`, `draw(n)`, `energy(n)`, `energyNextTurn(n)`, `heal(n)`, `charge(n)`, `release(perCharge)` (returns bonus and zeroes Charge), `heat(n)`, `summon(companion, value)`, `addCardToHand/Discard(id)`, `chooseFromHand(n, then)`, `chooseFromPile(pile, n, then)`, `exhaustSelf`.

## 3. Rules

### Player
- Max HP **70** (+ Forge). HP carries between fights. **3 Energy** per turn, draw **5** per turn, hand cap **10** (extra draws are skipped).
- Turn order: start of turn (Block clears, statuses tick, relic/power triggers, draw 5, refill energy) → play cards → End Turn (discard hand, companions act, end-of-turn triggers) → each enemy acts in order left→right → repeat.
- Reshuffle discard into draw pile when draw pile is empty.

### Damage formula
`base + Strength` → ×0.75 if attacker is **Weak** → ×1.5 if target is **Vulnerable** → floor → Block absorbs first. Self-damage and Radiation ignore Strength/Weak/Vulnerable; Radiation also ignores Block.

### Keywords (show tooltip on hover over card or status icon)

| Keyword | Rule |
|---|---|
| **Block** | Absorbs damage. Clears at the start of its owner's turn. |
| **Weak** | Deals 25% less attack damage. −1 stack at end of the owner's turn. |
| **Vulnerable** | Takes 50% more attack damage. −1 stack at end of the owner's turn. |
| **Strength** | +N damage per hit. Permanent for the combat. |
| **Exhaust** | Removed from the deck for the rest of the combat. |
| **Charge** | Player counter, persists through the combat. Cards with **Release** spend all Charge for bonus damage. |
| **Heat** | Player counter. Blaster cards add Heat. When Heat reaches **5**, reset Heat to 0 and add an **Overheat** card to hand. |
| **Overheat** (status card) | Unplayable. At end of turn, if in hand: take 3 damage and Exhaust it. |
| **Radiation** | At the start of the afflicted unit's turn, lose HP equal to stacks (ignores Block), then −1 stack. |
| **Companion** | Dog or Mouse joins the field for the combat. Max one of each. Summoning one that is already out adds the new value to it. They can't be targeted (Phase 1). **Dog:** at end of your turn, deal its value to a random enemy. **Mouse:** at end of your turn, give you its value as Block. |
| **Power** (card type) | Stays in effect for the combat once played; goes to neither pile. |

Card types: **Attack**, **Skill**, **Power**, **Status** (Overheat, Spore).

## 4. Cards

Starter deck (10): 5× Strike, 4× Guard, 1× Pilot Bore. Starters are not in the reward pool except Pilot Bore.
Each card upgrades once (`+` suffix, name in green). Upgrade values in brackets.
"If Sword this turn" = if you already played another Sword-family card this turn.

### Basic
| Card | Cost | Type | Text |
|---|---|---|---|
| Strike | 1 | Attack | Deal 6 [9]. |
| Guard | 1 | Skill | Gain 5 [8] Block. |

### Drill — orange (Charge)
| Card | Rarity | Cost | Type | Text |
|---|---|---|---|---|
| Pilot Bore | C | 1 | Attack | Deal 6 [9]. Gain 1 Charge. |
| Wind Up | C | 1 | Skill | Gain 5 Block. Gain 2 [3] Charge. |
| Rock Breaker | C | 2 | Attack | Deal 10 [14]. Release: +3 damage per Charge. |
| Impact Drill | U | 2 | Attack | Release: deal 8 + 5 [6] per Charge. |
| Bore Shield | U | 1 | Skill | Gain 3 [5] Block + 2 per Charge (does not spend Charge). |
| Overclock | U | 0 | Skill | Gain 1 [2] Charge. Draw 1. |
| Deep Core | R | 3 [2] | Attack | Deal 20 to ALL enemies. Release: +4 per Charge to all. Exhaust. |
| Perpetual Motion | R | 2 [1] | Power | At the start of your turn, gain 1 Charge. |

### Blaster — cyan (Heat)
| Card | Rarity | Cost | Type | Text |
|---|---|---|---|---|
| Snap Shot | C | 0 | Attack | Deal 3 [5]. +1 Heat. |
| Double Tap | C | 1 | Attack | Deal 4 [5] twice. +1 Heat. |
| Suppressing Fire | C | 1 | Attack | Deal 5. Apply 1 [2] Weak. +1 Heat. |
| Rapid Fire | U | 1 | Attack | Deal 3 three [four] times. +2 Heat. |
| Vent Heat | U | 1 | Skill | Lose all Heat. Gain 3 [4] Block per Heat lost. |
| Heat Sink | U | 1 [0] | Power | Whenever you gain an Overheat, draw 2. |
| Meltdown | R | 2 | Attack | Deal 6 [8] per Heat. Lose all Heat. |
| Red Line | R | 2 [1] | Power | Blaster cards deal +3 damage and add +1 extra Heat. |

### Bomb — red (area damage, self-damage)
| Card | Rarity | Cost | Type | Text |
|---|---|---|---|---|
| Grenade | C | 1 | Attack | Deal 6 [9] to ALL enemies. Take 2. |
| Shaped Charge | C | 1 | Attack | Deal 12 [16]. Take 3. |
| Cluster Bomb | U | 2 | Attack | Deal 5 to ALL enemies twice [3 times]. Take 3. |
| Rocket | U | 2 | Attack | Deal 14 [18] to target and 4 [6] to other enemies. Take 3. |
| Blast Shield | R | 2 [1] | Power | You no longer take self-damage from cards. |
| Carpet Bomb | R | 3 | Attack | Deal 10 to ALL enemies 3 times. Take 8 [4]. Exhaust. |

### Radiation — green
| Card | Rarity | Cost | Type | Text |
|---|---|---|---|---|
| Hot Rock | C | 1 | Attack | Deal 4. Apply 3 [5] Radiation. |
| Contaminate | C | 1 | Skill | Apply 3 [5] Radiation to ALL enemies. |
| Half-Life | U | 1 | Skill | Double target's Radiation. Exhaust [no Exhaust]. |
| Rad Pulse | U | 2 | Skill | Apply 5 [7] Radiation to ALL enemies. Apply 2 Radiation to yourself. |
| Fallout | R | 2 | Power | At end of your turn, apply 2 [3] Radiation to ALL enemies. |

### Laser Sword — violet (combos)
| Card | Rarity | Cost | Type | Text |
|---|---|---|---|---|
| Slash | C | 1 | Attack | Deal 7 [10]. If Sword this turn, draw 1. |
| Parry | C | 1 | Skill | Gain 6 [9] Block. If Sword this turn, deal 6 [9]. |
| Arc Sweep | U | 1 | Attack | Deal 6 [8] to ALL enemies. Apply 1 Weak to ALL. |
| Flurry | U | 2 | Attack | Deal 4 [5] five times. |
| Saber Dance | R | 1 | Power | Whenever you play a Sword card, gain 3 [5] Block. |

### Companion — tan
| Card | Rarity | Cost | Type | Text |
|---|---|---|---|---|
| Good Boy | C | 1 | Skill | Summon Dog (3 [5]). |
| Mouse Helper | C | 1 | Skill | Summon Mouse (3 [5]). |
| Fetch! | U | 0 | Skill | If Dog is out, it attacks twice now; otherwise summon Dog (3). [Also draw 1.] |
| Burrow | U | 1 | Skill | Gain 6 [8] Block. If Mouse is out, gain 6 [8] more. |
| Pack Leader | R | 2 [1] | Power | Companions act twice each turn. |

### Ship Uplink — blue (Stage 5 weapons, called down from orbit)
| Card | Rarity | Cost | Type | Text |
|---|---|---|---|---|
| Spread Volley | U | 2 | Attack | Deal 6 [8] to ALL enemies twice. |
| Homing Swarm | U | 1 | Attack | Deal 3 to a random enemy 4 [5] times. |
| Flak Screen | U | 2 | Skill | Gain 12 [16] Block. Deal 4 [6] to ALL enemies. |
| Wingmen | R | 2 [1] | Power | At the start of your turn, deal 4 to a random enemy twice. |

### Utility — grey
| Card | Rarity | Cost | Type | Text |
|---|---|---|---|---|
| Dig In | C | 1 | Skill | Gain 8 [11] Block. |
| Flare | C | 1 [0] | Skill | Draw 2. Apply 1 Vulnerable to ALL enemies. |
| Speed Burst | C | 0 | Skill | Gain 1 Energy. [Draw 1.] Exhaust. |
| Magnet | U | 1 [0] | Skill | Put a card from your discard pile into your hand. |
| Survey | U | 1 | Skill | Draw 3 [4]. Discard 1. |
| Converter | U | 1 | Skill | Next turn, gain 2 Energy. Exhaust [no Exhaust]. |
| Field Repairs | R | 1 | Skill | Heal 8 [12]. Exhaust. |

### Status cards
- **Overheat** — see keywords.
- **Spore** (Phase 2) — Unplayable. Exhausts at end of turn if in hand. (Clogs the hand.)

## 5. Relics (Stage 1 relic callbacks)

| Relic | Effect |
|---|---|
| Impact Drill | Start each combat with 2 Charge. |
| Blaster | Overheat triggers at 7 Heat instead of 5. |
| Bomb | At the start of each combat, deal 5 to ALL enemies. |
| Dog | Start each combat with Dog (3). |
| Mouse | Start each combat with Mouse (3). |
| Radiation | At the start of each combat, apply 2 Radiation to ALL enemies. |
| Rocket Launcher | Every 3rd Attack you play deals double damage (show a counter). |
| Magnet | +25% Scrap from all sources. |
| 3rd Eye | Draw 2 extra cards on your first turn. |
| Flare | On your first turn, apply 1 Vulnerable to ALL enemies. |
| Laser Sword | The first Sword card you play each turn costs 0. |
| Converter | Heal 5 at the end of each combat. |
| Speed Burst | Gain 1 extra Energy on your first turn. |

Show relics as a row of icons (placeholder circles + initials) top-left under the HP bar, with hover tooltips. Each relic can only appear once per run.

## 6. Map

- 3 zones (Phase 1: Zone 1 only). Each zone = **5 floors + a boss floor**. Zone names: **Landing Zone**, **Spore Wilds**, **Hive Gate**.
- Each floor has 3–4 nodes. Each node connects to 1–2 nodes in the next floor (neighboring indices). Every node must be reachable, and every node must have an outgoing edge. All floor-5 nodes connect to the boss.
- Node types per floor:
  - Floor 1: all **Battle**.
  - Floors 2–4: weighted — Battle 50, Event 20, Field Camp 12, Elite 10 (floors 3–4 only), Salvage Trader 8. Guarantee at least one Elite and one Trader somewhere in floors 2–4.
  - Floor 5: all **Field Camp**.
  - Floor 6: **Boss**.
  - **Relic Cache:** one guaranteed on floor 3 (replace one node).
- Draw the map vertically, bottom→top, with lines for edges. Visited path is highlighted; reachable next nodes pulse. Distinct placeholder icon shape + letter per type. Hover shows type name.
- Map screen HUD: HP, Scrap, relics, deck count (click → deck viewer overlay listing all cards, sorted by family).
- Moving to Zone 2 (Phase 2): heal 30% of max HP, generate the new zone's map.

## 7. Node screens

**Battle / Elite / Boss** → combat → reward screen.

**Reward screen**
- Scrap: Battle 15–25, Elite 30–40, Boss 75.
- Card: pick **1 of 3** (4 with the Forge upgrade) or **Skip**. Rarity odds — Battle 65% C / 30% U / 5% R; Elite 50/40/10; Boss: all Rare. No duplicate card in one offer.
- Elite: also one random unowned relic. Boss: choose 1 of 3 relics.

**Field Camp:** choose one — **Rest** (heal 30% of max HP) or **Upgrade** (pick a card in the deck to upgrade; show before/after).

**Salvage Trader:** 5 cards (3 C, 1 U, 1 R), 2 relics, card removal.
| Item | Price |
|---|---|
| Common / Uncommon / Rare card | 50 / 75 / 150 |
| Relic | 150–250 |
| Remove a card | 75, +25 each time used this run |

**Relic Cache:** gain 1 random unowned relic.

**Events (Phase 1: these 3).** Text panel with 2 choice buttons.
| Event | Choice A | Choice B |
|---|---|---|
| Crashed Probe | Take a random relic. | Strip it for 60 Scrap. |
| Spore Pool | Drink: heal 15. | Wade through: take 6 damage, remove a card. |
| Stranded Mouse | Take it along: add Mouse Helper to the deck. | Leave it: nothing happens. |

## 8. Enemies

Intent icons above each enemy: **sword + number** (attack, show final damage after modifiers and hit count like `6×3`), **shield** (block), **down arrow** (debuff), **up arrow** (buff), **spawn star** (summon). Patterns cycle in order unless noted; HP ranges are rolled per fight.

### Zone 1 — Landing Zone (Phase 1)
| Enemy | HP | Pattern |
|---|---|---|
| Spore Crawler | 12–16 | Bite 5 → Bite 5 → Spores (apply 1 Weak) |
| Acid Spitter | 20–24 | Spit 8 → Corrode (3 damage + apply 2 Vulnerable) |
| Burrow Worm | 30–34 | Burrow (10 Block) → Lunge 12 |
| **Elite: Shield Drones** (2) | 35 each | A: Shield Ally (other drone +10 Block) → Zap 9. B: Zap 7×2 → Shield Ally. |
| **Boss: Landing Sentinel** | 140 | Scan (apply 2 Vulnerable) → Cannon 22 → Sweep 6×3 → Fortify (20 Block, +2 Strength). Once, at ≤50% HP: Overdrive (+3 Strength) in place of its next move. |

Zone 1 encounters: floors 1–2 draw from *easy* = {2× Crawler, Spitter, Crawler+Spitter}. Floors 3–4 draw from *normal* = {3× Crawler, Worm+Crawler, 2× Spitter, Worm+Spitter}.

### Zone 2 — Spore Wilds (Phase 2)
| Enemy | HP | Pattern |
|---|---|---|
| Spore Mother | 40 | Spawn (summon a Spore Crawler, max 4 enemies on field) → Lash 10 |
| Stalker | 38 | Stalk (+3 Strength, 6 Block) → Pounce 8 |
| Leech | 28 | Drain 7 (heals for unblocked damage) → Latch (apply 2 Weak) |
| **Elite: Brood Knight** | 90 | Shield Bash 12 + 8 Block → Rally (+2 Strength) → Cleave 20. Once at ≤50%: summon 2 Spore Crawlers. |
| **Boss: Thornback** | 220 | Passive Thorns 3 (attacker takes 3 per hit). Spike Volley 5×4 → Spore Cloud (add 2 Spore to your discard) → Curl (30 Block, Thorns +2 this round) → Crush 28 |

### Zone 3 — Hive Gate (Phase 2)
| Enemy | HP | Pattern |
|---|---|---|
| Hive Guard | 50 | Guard (12 Block to all allies) → Spear 14 |
| Psionic Drone | 32 | Static (apply 2 Weak + 2 Vulnerable) → Spike 10 |
| Mimic | 45 | Reflect (gain Block equal to damage you dealt it last turn, max 20) → Bite 13 |
| **Elite: Twin Wardens** | 70 each | Hammer 15 → Ward (15 Block to both). When one dies, the other gains 5 Strength and heals 20. |
| **Final Boss: Home Base Core** | 300 | **Phase 1 (300–201):** two Turrets (40 HP, Laser 8 every turn) flank it; Core takes 50% damage while any Turret lives. Core: Charging (no attack) → Beam 30. **Phase 2 (200–101):** summons 2 Hive Guards once; Pulse 6 + apply 3 Radiation to you, every turn. **Phase 3 (≤100):** gains 2 Strength each turn; Hammer 15 → Barrage 5×2. Phase change interrupts the current intent and is announced with a banner. |

## 9. Forge hub (between runs)

Hub screen: banked Scrap, Forge items, stats (runs, wins, best zone), **Make Landfall** button.
- **All unspent Scrap is banked when a run ends** (win or die). Winning (Phase 1: beating the Landing Sentinel) adds +200.

| Upgrade | Max | Cost | Effect |
|---|---|---|---|
| Reinforced Suit | 10 | 200 + 60×n | +5 max HP |
| Relic Locker | 1 | 400 | At run start, choose 1 of 3 random relics |
| Trim the Deck | 3 | 300 / 450 / 600 | Start with one fewer Strike |
| Wider Survey | 1 | 800 | Card rewards offer 4 choices |
| Supply Drop | 4 | 150 | +50 starting Scrap |

## 10. Save data

`localStorage["driftMinerStage6"]` = `{ bank, forge: { hp, relicLocker, trim, survey, supply }, stats: { runs, wins, bestZone }, run }`.
- `run` holds the full in-progress run (seed, RNG state, zone, map + position, HP, deck with upgrade flags, relics, Scrap, trader removal count). Save after every node is completed, **not mid-combat**: if the page reloads mid-combat, restart that combat from its beginning.
- Hub shows **Continue Run** when `run` exists. Defeat or victory clears `run`.
- Wrap all storage access in try/catch.

## 11. Combat layout (960×640 canvas)

- Background: dark alien ground gradient with a zone tint (Zone 1 rust/orange, Zone 2 sickly green, Zone 3 purple).
- **Player** on the left (~x 200, y 360): placeholder miner shape (helmet circle + body rect + drill triangle). HP bar + Block badge + status icons beneath. Companions stand beside the player (small dog/mouse shapes with their value shown).
- **Enemies** on the right, spaced evenly, each with HP bar, Block badge, status icons, and intent above. Placeholder shapes differ per enemy (blob, spiky, segmented, drone circle, big boss silhouette).
- **Hand** fanned along the bottom; the hovered card lifts and scales up. Cards are 120×170 rounded rects colored by family, with the cost circle top-left, name, type, wrapped rules text, and a rarity pip.
- Bottom-left: Energy orb (`2/3`), Draw pile count. Bottom-right: Discard count, Exhaust count (clicking a pile shows its contents). Right side: **End Turn** button.
- Top-left: HP, Scrap, relics, Charge and Heat counters (only shown when >0).
- **Playing a card:** click a card to select it. Targeted attacks then need an enemy click (highlight valid targets, draw an arrow from the card to the cursor). Non-targeted cards play when you click anywhere above the hand. Right-click or Esc cancels. Unplayable or too-expensive cards shake and don't play.
- Keyboard: `1`–`0` select hand cards, `E` ends the turn, `Esc` cancels.
- Floating damage/block numbers. Brief red flash on the player when hit. Enemy death fades out.

## 12. Debug URL params

`?seed=N`, `?bank=N` (sets banked Scrap), `?fight=landingSentinel` (jump straight into that encounter with a starter deck), `?deck=all` (start the run with one of every card), `?relics=all`, `?zone=2` (Phase 2).

## 13. Phase 1 acceptance checklist

- [ ] Menu → Stage 6 → "Make Landfall" opens `stage6.html`; the home icon returns.
- [ ] Hub shows Forge purchases; they persist across reloads and apply to new runs.
- [ ] Map generates per the rules above; only reachable nodes are clickable.
- [ ] Every card in §4 plays correctly, including upgraded versions (test with `?deck=all`).
- [ ] Charge, Heat/Overheat, Radiation, Companions, Weak/Vulnerable/Strength and Exhaust all behave as in §3, with tooltips.
- [ ] Enemy intents show correct final numbers.
- [ ] Reward screen offers 3 cards with rarity odds, plus Skip; elites drop a relic.
- [ ] Camp, Trader, Cache and all 3 events work.
- [ ] Defeat and victory bank Scrap and return to the hub. Reloading mid-run offers Continue.
- [ ] No console errors. Test via `Play Stage 6 Chrome.bat` (serves `http://127.0.0.1:8765/stage6.html`).

## 14. Art direction (for the later art pass — do not generate art now)

The art should tie back to earlier stages:
- **Miner:** match `assets/miner-travel.png` / `assets/miner-drill.png`.
- **Enemies:** the same creature family as `assets/monsters/level-*-walk-4-direction.png` (Stage 1 monsters), scaled up into battle portraits.
- **Card art and relic icons:** Stage 1 relic visuals.
- **Ship Uplink cards:** Stage 5 ship and powerup art (`assets/stage5/player-ship-sheet.png`, `powerups-sheet-v2.png`).
- **Backgrounds:** painted style of `assets/stage5/canyon-5-2.webp`.

New files go in `assets/stage6/`. Keep the placeholder fallbacks.
