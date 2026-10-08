# Sonnet task: Stage 6 "Landfall" — 20 new events

Stage 6 has only 3 events (Crashed Probe, Spore Pool, Stranded Mouse). Every zone map places 3 event tiles, so a run that reaches the end sees 9 events, and repeats are constant. This task adds **20 events** and **tiers every event by zone**: each event belongs to exactly one zone, and the stakes and rewards rise from Zone 1 to Zone 3. The 3 existing events are assigned to zones too:

| Zone | New events | Existing events | Total |
|---|---|---|---|
| 1. Landing Zone | 6 | Crashed Probe, Stranded Mouse | 8 |
| 2. Spore Wilds | 7 | Spore Pool | 8 |
| 3. Hive Gate | 7 | (none) | 7 |

Each map has 3 event tiles, so no event repeats within a zone. The task also adds the small shared systems the events need: zone tiers, no repeats, choice requirements, event fights and next-fight buffs.

### Tier rules
Use these ranges when tuning numbers. The events below already follow them.
| | Zone 1 | Zone 2 | Zone 3 |
|---|---|---|---|
| HP cost of a choice | up to 8 | 4–10 | 10–15 |
| Scrap reward | 35–60 | 50–80 | 80–120 |
| Cards offered | Common / Uncommon | Uncommon / elite-odds pick | Rare |
| Ore reward | Copper, up to 2 Silver | Silver, up to 1 Gold | Gold |
| Typical cost | small HP | Spore cards, Max HP | big HP, Alert, Max HP |
| Event fights | battle | battle | battle or elite |

All the work is in `stage6/stage6.js`. Bump `stage6.js?v=57` in `stage6/stage6.html` to `v=58`. The UI is English-only. Match the file's existing style: dense one-line helpers, short comments only where the reason isn't obvious, and data in plain object tables.

Read these first: `EVENTS`, `drawEvent`, `makePending`, `openPending`, `completeNode`, `openModal` and `drawGrid`, `startCombat`, `onWin`, `endRun`, `isRevealed`, `digTile` (the alert counter), `spawnPatrol`, `rollCards`, `REWARD_IDS`, `upgradeCard`, `unownedRelics`, `grantRelic`, `gainOre`, `sfx`.

**Balance anchors** (current numbers, for reference):
- Max HP starts at 70.
- Battles give 15–25 Scrap; elites give 30–40.
- At the trader, cards cost 50 / 75 / 150 (Common / Uncommon / Rare) and relics cost 150–250.
- A Workbench upgrade costs 20 Copper.
- Ore at the trader (`ORE`): it sells for Copper 8 / Silver 25 / Gold 70 Scrap and costs 20 / 60 / 150 to buy. Its end-of-run Scrap value (`ORE[k].scrap`) is 3 / 10 / 30.
- Camp rest heals 30% of max HP.

---

## 1. Shared groundwork

### 1.1 Event definition
Extend each `EVENTS` entry to:
```
id: { zone: 1, img: "id", title, text, choices: [{ label, req?, fn }] }
```
- **`zone`** (required): the one zone the event belongs to. Tag the existing events: `probe` is Zone 1, `mouse` is Zone 1, and `pool` is Zone 2. Spore Pool moves to the Spore Wilds, so change the end of its text from "at the edge of the landing zone" to "in a clearing of the Spore Wilds".
- **`req`** (optional): returns a short reason string when the choice can't be taken right now (for example `"Need 10 Copper"`), or `null` when it can. Draw that choice's button with `off: true` and the label `"<label> (<reason>)"`.
- **`fn`**: as now. Return the result text, or `null` when a modal or fight takes over (see 1.4 and 1.5).

### 1.2 Picking events: zone tier, no repeats
In `makePending`, for `"event"`:
- **Eligible** means `zone === run.zone`. An event never appears outside its zone.
- Prefer eligible events not in `run.seenEvents`. If every eligible event has been seen (which shouldn't happen, since each zone has at least 7 for 3 tiles), pick from all eligible events.
- Push the chosen id onto `run.seenEvents`.
- Initialise `run.seenEvents = []` in `newRun`, and treat a missing value on old saves as `[]`.

### 1.3 Helpers (add them to the events section)
- `hurt(n)`: `run.hp -= n`. If HP reaches 0 or below, set it to 0, call `endRun(false)`, and return `true`. Choices must do `if (hurt(n)) return null;`, the same pattern as the Spore Pool event. Play `sfx("hurt")`.
- `heal(n)`: heals, capped at max HP, and returns the amount actually healed. Play `sfx("heal")` when it's above 0.
- `changeMaxHp(n)`: `run.maxhp += n`, with max HP never below 10. A positive `n` also heals `n`; then cap HP at max HP.
- `randomCardId(rarity, family)`: picks from `REWARD_IDS` filtered by rarity and optionally by family, using the run's seeded `pick`.
- `offerCards(title, ids, onPick)`: opens the card grid (`openModal`) over fresh `{ id, up: false }` cards, `n: 1`, with a visible **Skip** button. If `drawGrid` has no Skip button for a cancellable modal, add one. Picking a card calls `addCard` and plays `sfx("cardAdd")`. Picking or skipping must both set `run.pending.res` to a result line (for example "You take Rapid Fire." or "You leave the cards."), then call `saveRun()`.
- `pickFromDeck(title, filter, n, onDone)`: the same grid over `run.deck` (filtered). It's used by remove, upgrade, transform and duplicate. Status cards (`f: "status"`) can always be removed, but never upgraded, transformed or duplicated.
- `upgradeRandom(n, filter)`: upgrades up to `n` random cards that aren't upgraded yet (skip status and Power cards only if `filter` says so). Returns the names for the result text and plays `sfx("upgrade")`.
- `transformCard(c)`: removes `c` and adds a random card of the same rarity. Basic cards turn into a random Common.
- `relicOrScrap()`: grants a random unowned relic (`sfx("relic")`). If none are left, gives +100 Scrap. Returns the result phrase.
- `raiseAlert(n)`: adds `n` to `run.alert` one step at a time, applying the same thresholds as digging. Every time `run.alert % 8 === 0`, it does `run.ambushDue++`, and in Zone 3 it also calls `spawnPatrol()`.
- `revealAround(x, y, r)`: sets `t.seen = true` on tiles within `r`. In `isRevealed`, return `true` for `t.seen` **before** the Zone 3 fog check.

Use the run's seeded randomness (`pick`, `rr`, `rng.next()`), never `Math.random`, so a seed replays the same outcomes.

### 1.4 Fights started by an event
`eventFight(enc, kind, bonus)`:
- Sets `run.pending = { screen: "combat", kind, enc, eventBonus: bonus }` and calls `openPending()`. `kind` is `"battle"` or `"elite"`, which decides the normal rewards.
- In `onWin`, if the fight's pending had an `eventBonus` (`{ scrap, ore: { ag: 2 } }` and so on), add it to the reward. Show it in the reward screen's ore and Scrap lines, so the player sees it was paid.
- After the reward, `completeNode()` marks the event tile used as normal (`run.cur` is still the event tile).
- The choice's `fn` returns `null`. No result text is shown, because the fight takes over.

### 1.5 Next-fight buffs
`run.nextFight` holds an object such as `{ block, str, energy, draw, weakAll, vulnAll, radAll }`.
- Merge new buffs into any existing one by adding the numbers together.
- `startCombat` applies it on turn 1, then clears it:
  - `block`: Block on the player.
  - `str`: Strength on the player.
  - `energy`: extra Energy on turn 1, added the same way `burstR` is.
  - `draw`: extra cards drawn on turn 1.
  - `weakAll` / `vulnAll` / `radAll`: that status on every enemy.
- Show a small line in the map HUD while a buff is waiting, for example `Next fight: +10 Block`. A line under the relic row is fine.
- When the buff applies, show a combat banner such as `Pollen cloud: enemies Weak`.

### 1.6 Sounds
Reuse the existing `sfx` names for outcomes:
- Healing: `heal`. Damage: `hurt`. Relic gained: `relic` (`relicOrScrap` already plays it).
- Card gained: `cardAdd`. Card upgraded: `upgrade`.
- Scrap gained: `buy`. Ore gained: `ore_cu` / `ore_ag` / `ore_au`.
- Spore card added: `spore`. Map revealed: `discover`.

### 1.7 Art
For each new event, register `ART_FILES["ev_" + id] = "assets/event-<id>.png"`. `drawEvent` already falls back to a text-only layout when the file is missing, so every event must read well without art. The art comes later in a separate Codex brief.

### 1.8 Debug hook
Add `?event=<id>`: it starts a run (like `?fight=`) and opens that event on a dummy event tile, so each event can be tested directly. Also add an **Event ▸** list to the debug panel if it fits.

---

## 2. The events

In the tables below, "random" always means seeded. HP loss uses `hurt` (it ignores Block; there's no Block outside combat).

### Zone 1: Landing Zone (orange dust, craters, your crash site)

**1. `wreckage` — Ship Wreckage**
*The tail section of your landing craft lies half-buried in the dust, still ticking as it cools.*
| Choice | Outcome |
|---|---|
| Strip the hull | +45 Scrap |
| Raid the med-bay | Heal 20 HP |
| Pull the reactor rod | Take 8 damage, add an upgraded **Hot Rock** |

**2. `crater` — Meteor Crater**
*A fresh crater smokes at the edge of your path. Something at the bottom glitters silver.*
| Choice | Outcome |
|---|---|
| Climb down and mine it | Take 6 damage, +2 Silver |
| Scan it from the rim | Upgrade 1 random card |
| Leave it | Nothing |

**3. `supplyDrop` — Stray Supply Drop**
*A crate from the orbital fleet hangs from a torn parachute, snagged on a rock spire.*
| Choice | Outcome |
|---|---|
| Open the crate | Choose 1 of 3 random Uncommon cards (Skip allowed) |
| Salvage the parachute rig | +5 Max HP |

**4. `crawlerNest` — Crawler Nest**
*Dozens of pale eggs pulse in a hollow under the rocks. Something larger skitters nearby.*
| Choice | Outcome |
|---|---|
| Clear the nest | Fight `["crawler", "crawler", "crawler"]` as a battle. Bonus on win: +2 Silver |
| Scrape the egg resin | +35 Scrap, add 1 Spore card to your deck |
| Sneak around it | Nothing |

**5. `tradeDrone` — Stranded Trade Drone**
*A merchant drone lies on its side, one rotor buzzing weakly. Its cargo hatch is sealed.*
| Choice | Outcome |
|---|---|
| Repair it (10 Copper) | `req`: 10 Copper. −10 Copper, then `relicOrScrap()` |
| Kick the hatch open | 40%: +60 Scrap. Otherwise: take 6 damage, +15 Scrap |
| Leave it | Nothing |

**6. `singingRocks` — Singing Rocks**
*Wind moans through hollow stone pillars in a slow, strange melody. Your thoughts sharpen.*
| Choice | Outcome |
|---|---|
| Sit and listen | Upgrade 1 card of your choice |
| Snap off a crystal | +2 Silver, −3 Max HP |
| Move on | Nothing |

### Zone 2: Spore Wilds (glowing fungus jungle; Spore cards, the Antidote)

**7. `fairyRing` — Mushroom Ring**
*A perfect circle of glowing caps. Inside it, the air shimmers like heat haze.*
| Choice | Outcome |
|---|---|
| Step inside | Transform up to 2 cards of your choice (picking 0 is allowed) |
| Eat a cap | Heal 15 HP, add 1 Spore card |
| Leave | Nothing |

**8. `overgrownCache` — Overgrown Cache**
*An old expedition crate, swallowed by fungus. You can see the latch through the growth.*
| Choice | Outcome |
|---|---|
| Hack through the fungus | Take 7 damage, +50 Scrap, then choose 1 of 3 cards (use `rollCards("elite", 3)`) |
| Burn the fungus away | Remove every Spore card from your deck; the crate burns too. `req`: you have at least 1 Spore card |

**9. `cocoon` — Silk Cocoon**
*A cocoon the size of a dog hangs from a fungal stalk. Something inside is moving.*
| Choice | Outcome |
|---|---|
| Cut it open | 50%: Spore Bats burst out: fight `["sporeBat", "sporeBat"]` as a battle. Otherwise a docile glowworm crawls out and follows you: add **Fetch!** and heal 5 |
| Leave it hanging | Nothing |

**10. `pollenGeyser` — Pollen Geyser**
*The ground hisses, then erupts in a towering plume of golden pollen.*
| Choice | Outcome |
|---|---|
| Ride the blast | Take 5 damage, reveal every tile within 3 of the lair (`revealAround(4, 10, 3)`), `sfx("discover")` |
| Bottle the pollen | Next fight: 2 Weak on all enemies (`nextFight.weakAll += 2`) |

**11. `mossPool` — Glowing Moss Pool**
*Warm water glows blue-green under a carpet of moss. It feels wonderful on your aching legs.*
| Choice | Outcome |
|---|---|
| Bathe | Heal to full, add 2 Spore cards |
| Harvest the moss | Upgrade 2 random Skill cards |
| Leave | Nothing |

**12. `lostPup` — Lost Pup**
*A Rot Hound pup whimpers under a root, one paw caught in a snare. It eyes you warily.*
| Choice | Outcome |
|---|---|
| Free its paw | It nips you: take 4 damage. If you don't have the Dog relic, gain it (`dogR`); otherwise add an upgraded **Good Boy** |
| Toss it scraps (20 Scrap) | `req`: 20 Scrap. −20 Scrap. It shadows you: next fight +10 Block |
| Leave it | Nothing |

**13. `swapMeet` — Junk Trader**
*A scrap-trading drone hovers over a blanket of salvage, fungus creeping up its legs. "Swap? Swap?" it chirps.*
| Choice | Outcome |
|---|---|
| Trade a relic | `req`: own a relic and at least 1 unowned relic remains. Lose a random relic, gain a random unowned relic, +50 Scrap |
| Trade 15 Copper for 1 Gold | `req`: 15 Copper |
| Sell all your Silver | `req`: 1 Silver. +30 Scrap per Silver (better than the trader's 25) |

### Zone 3: Hive Gate (psionic fog, alert, patrols)

**14. `hiveTerminal` — Hive Terminal**
*An organic console pulses in the wall, glyphs crawling across a membrane screen.*
| Choice | Outcome |
|---|---|
| Wipe the alarm log | Set Alert to 0, `ambushDue = 0`, and remove 1 random patrol (if any) |
| Download the gate layout | `run.hiveMap = true` (the whole map and its patrols are revealed), then `raiseAlert(4)` |

**15. `larvaNursery` — Larva Nursery**
*Rows of translucent sacs line the chamber walls. In the middle, a pool of glittering royal jelly.*
| Choice | Outcome |
|---|---|
| Purge the nursery | Fight `["larvaCluster", "larvaCluster"]` as an **elite** (elite rewards, including the relic) |
| Steal the royal jelly | +8 Max HP, then `raiseAlert(8)` (this always triggers an ambush and a patrol) |
| Back away | Nothing |

**16. `fallenMiner` — Fallen Miner**
*A miner from an earlier expedition, sealed in amber resin. Their pack is still on their back.*
| Choice | Outcome |
|---|---|
| Cut out their gear | Take 10 damage (the resin burns), then choose 1 of 3 random Rare cards |
| Take their tags | +100 Scrap |
| Bury them properly | Remove 1 card of your choice from your deck |

**17. `psionicEcho` — Psionic Echo**
*A voice that sounds like your own whispers from the fog, offering to help.*
| Choice | Outcome |
|---|---|
| Let it in | Duplicate 1 card of your choice (no status cards), −6 Max HP |
| Push it back | Take 10 damage. Next fight: +3 Strength |

**18. `acidMoat` — Acid Moat**
*A relic gleams on a ledge across a channel of hissing green acid.*
| Choice | Outcome |
|---|---|
| Wade across | Take 14 damage, then `relicOrScrap()` |
| Lay down a Silver stepping-stone | `req`: 1 Silver. −1 Silver, then `relicOrScrap()` |
| Leave it | Nothing |

**19. `obelisk` — Glyph Obelisk**
*A tall black stone carved with glowing hive glyphs stands in the fog. The glyphs rearrange themselves as you watch.*
| Choice | Outcome |
|---|---|
| Press your hand to the glyphs | Upgrade 3 random cards, take 12 damage |
| Trace a single glyph | Next fight: +1 Energy and draw 2 extra cards on turn 1 |
| Walk away | Nothing |

**20. `sealedChest` — Sealed Chest**
*An ornate chest sits alone in a hive tunnel, oddly clean, with no resin on it at all.*
| Choice | Outcome |
|---|---|
| Pry it open | One third: `relicOrScrap()`. One third: +120 Scrap. One third: **it's a Mimic!** Fight `["mimic"]` as a battle (bonus on win: +1 Gold) |
| Leave it alone | Nothing |

---

## 3. What not to change
- Don't change the 3 existing events beyond their `zone` tags and the one-line Spore Pool text change in 1.1.
- No new art files; that's a separate task.
- No new card or relic definitions. Every outcome uses existing cards, relics and statuses.

## 4. Test checklist
1. `?event=<id>` opens each of the 20 events. Each one reads well without art, and every choice works and shows a result line (or starts a fight).
2. Zone tiers work: across several maps of each zone, only that zone's events appear (Zone 1: 8 possible, Zone 2: 8, Zone 3: 7). Crashed Probe and Stranded Mouse only appear in Zone 1, and Spore Pool only in Zone 2.
3. No event repeats within a run.
4. Disabled choices show their reason and can't be clicked (also with a controller: they're skipped by focus or do nothing on A).
5. `hurt` that would kill the player ends the run as a loss, with no errors (try Wade across at low HP).
6. Event fights: Clear the nest gives normal battle rewards plus +2 Silver on the reward screen. Purge the nursery gives elite rewards including a relic. Afterwards the event tile shows as used.
7. Next-fight buffs show on the map HUD, apply on turn 1 of the next fight (Block, Strength, Energy, draws, enemy statuses), then clear. Two buffs before one fight add together.
8. Alert events in Zone 3: Steal the royal jelly triggers an ambush and spawns a patrol. Wipe the alarm log clears Alert and removes a patrol.
9. `revealAround` works in Zone 2 (Pollen Geyser). Zone 3's fog still hides everything else.
10. Card modals: Skip works for offered cards, removal works, and transform and duplicate never offer status cards.
11. The same seed with the same choices gives the same event outcomes.
12. Old saves without `seenEvents` or `nextFight` load without errors.
