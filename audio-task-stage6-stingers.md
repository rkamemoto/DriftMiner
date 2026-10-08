# Audio task: Stage 6 "Landfall" — four short music stingers

Generate these four clips with an AI audio tool. ElevenLabs **Sound Effects** handles short stingers well; for the Run Won piece, a music generator such as ElevenLabs Music or Suno may sound fuller. Check that your plan allows commercial use of what you generate.

Save each clip in **`driftminer/stage6/assets/audio/`** with the exact filename below (`.mp3` or `.wav` are both fine). Then tell Claude "dropped", and Claude will wire the clips into the game. **Do not edit any code.**

---

## The game

Drift Miner: Landfall is a turn-based sci-fi deckbuilder. A small space miner in a bubble-helmet suit has landed on a hostile alien planet: orange dust, spore jungles, and an alien hive. The art is bright and cartoon-painterly, and the tone is adventurous, not grim.

The other sound effects are real recorded foley: card slides, punches, metal clanks and alien slime. The stingers are the only music-like sounds in the stage.

## Shared style (use for all four)

- Retro-futuristic sci-fi adventure: warm analog synth lead and pads, with a light orchestral layer (brass or strings) and soft electronic percussion.
- Short and punchy. It starts on the first beat with no silence before it, and its echo fades out within about 1 second.
- No vocals, no voices, no speech.
- All four should feel like one set: the same instruments and the same key family.
- Mono or stereo, at normal loudness (not clipped).

If a tool asks for a single prompt, paste the **Prompt** line. Generate 3–4 versions of each and keep the best.

---

### 1. Battle won — `stinger-victory.mp3`
Plays when the last enemy in a normal fight falls, just before the card-reward screen. You'll hear it often, so it should be pleasant, not tiring.
- **Length:** 1.5–2.5 seconds
- **Prompt:** `Short triumphant sci-fi video game victory jingle, bright analog synth lead with brass stab, quick rising three-note motif ending on a major chord, light electronic percussion hit, upbeat and adventurous, 2 seconds, no vocals`

### 2. Defeat — `stinger-defeat.mp3`
Plays when the player's HP reaches 0 and the run ends.
- **Length:** 2.5–4 seconds
- **Prompt:** `Short sci-fi video game defeat jingle, slow descending synth melody in a minor key, low strings, a soft fading power-down tone at the end, somber but not scary, 3 seconds, no vocals`

### 3. Relic found — `stinger-relic.mp3`
Plays when the player gains a relic: an elite or boss reward, a relic bought at the trader, or one found in a crashed probe. It should feel rare and magical.
- **Length:** 1–2 seconds
- **Prompt:** `Short magical sci-fi item discovery sound, shimmering ascending synth arpeggio with crystal chimes and a soft glowing pad swell, mysterious and rewarding, 1.5 seconds, no vocals`

### 4. Run won — `stinger-runwin.mp3`
Plays on the final victory screen after the last boss of the run. This is the big payoff, so it can be grander and longer than the others.
- **Length:** 5–8 seconds
- **Prompt:** `Triumphant sci-fi adventure victory fanfare, heroic synth and orchestral brass melody building to a big final major chord, timpani roll and cymbal swell, warm analog pads, celebratory and epic, 7 seconds, no vocals`

---

## When you're done

The folder should contain:
- `stinger-victory.mp3`
- `stinger-defeat.mp3`
- `stinger-relic.mp3`
- `stinger-runwin.mp3`

A different extension is fine (for example `.wav`); Claude will match it. If a clip has a long silent or echoing ending, leave it: Claude can trim it in code.
