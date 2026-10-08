# Google Flow Music task: Stage 5 BGM (shmup rock soundtrack)

How this works: paste the **Global style** block, then **one track prompt at a time**, into Flow Music. Generate 2–4 takes of each track and keep the best one. Use chat follow-ups to fix anything (see "Fix-up phrases" below).

Download each keeper as **WAV** (or the highest-quality MP3 offered) and save it in **`driftminer/stage5/assets/music-flow/`** using the exact filenames below. That folder is separate from Codex's `music/` folder, so you can compare the two sets. Then tell Claude "dropped". Claude will trim the loops, convert the formats, and wire the music into the game.

---

## Global style (paste this first, or prepend it to every prompt)

> Instrumental video game soundtrack for a fast arcade space shooter. **No vocals, no lyrics, no choir words, no spoken voice.** Hard rock / speed metal with a 90s arcade and console shmup feel. Distorted lead electric guitar carries a catchy, hummable melody with vibrato, bends and fast shred runs. Double-tracked palm-muted rhythm guitar chugging power chords. Punchy bass locked to the kick. Live-sounding rock drums with crash cymbals on phrase starts, tom fills and double-kick bursts. Optional subtle synth pad or arpeggio for a space atmosphere, kept under the guitars. Energetic, frenetic, upbeat, heroic. Clean, punchy mix with no fade-out at the end. Steady tempo throughout, with no tempo changes and no long silences.

Notes:
- Don't name real bands or artists in the prompts. Generators often refuse them, and the style words above are enough.
- **Loops:** AI generators can't make a perfectly seamless loop. What matters is that each track keeps **one steady tempo and key**, and **ends on a full bar without fading out**. Claude will find the loop points afterwards.
- Aim for **1:30–2:30** per looping track.

---

## Track prompts

### 1. `bgm-title`: title screen / level select / shop
> 140 BPM, E minor. Mid-tempo rock anthem for a title screen. Opens with a clean-to-distorted guitar riff, then a full band. Confident and inviting rather than frantic. A memorable lead guitar hook that feels like the main theme of the game. About 1:30, ending on a full bar with no fade.

### 2. `bgm-5-1`: Level 5-1 "Vessel Outskirts" (first level, launch)
> 172 BPM, E minor lifting to G major in the chorus. A heroic launch into battle. Starts with a 2-bar drum fill, then a big anthemic open-string guitar riff. Soaring lead guitar melody, a triumphant chorus, and a short shred solo before returning to the main riff. The signature theme of the stage. About 2:00, ending on a full bar with no fade.

### 3. `bgm-5-2`: Level 5-2 "Debris Canyon" (dodging rocks in a tight canyon)
> 180 BPM, D Dorian. Twisty, syncopated, stop-start guitar riffs that feel like dodging and weaving. Call-and-response between the lead guitar and the rhythm guitar. Funky, driving bass. Tense but fun. About 2:00, ending on a full bar with no fade.

### 4. `bgm-5-3`: Level 5-3 "Fleet Blockade" (full-scale war against a fleet)
> 168 BPM, C minor. Militaristic battle rock. Marching snare rolls, guitar and bass playing heavy riffs in unison, and a relentless war-march chorus with a heroic lead guitar on top. Feels like charging through an armada. About 2:00, ending on a full bar with no fade.

### 5. `bgm-5-4`: Level 5-4 "Nebula Run" (fastest level, pure speed)
> 196 BPM, F# minor with a euphoric major-key chorus. The fastest track. A galloping speed-metal rhythm, a shimmering synth arpeggio over the guitars, and a lightning-fast lead guitar melody. Euphoric, exhilarating, flying at top speed through a glowing nebula. About 2:00, ending on a full bar with no fade.

### 6. `bgm-5-5`: Level 5-5 "Heart of Darkness" (final level, alien homeworld)
> 160 BPM, B Phrygian. The heaviest track. Low drop-tuned guitar chugs, dissonant half-step and tritone bends, and an eerie, ominous synth pad. Dark and menacing, but still fast and driving: the final push into the enemy homeworld. About 2:00, ending on a full bar with no fade.

### 7. `bgm-boss`: boss fights in levels 5-1 to 5-4
> 180 BPM, A minor. A tense boss-battle theme. A menacing chromatic guitar riff, a siren-like screaming lead guitar bend, pounding double-kick drums, and urgent, aggressive energy. Short 4-bar intro, then a relentless loop. About 1:30, ending on a full bar with no fade.

### 8. `bgm-boss-final`: final boss, "Hive Warden"
> 184 BPM, B minor. An epic final-boss battle. The heaviest, most intense track: blast-beat moments, double-kick drums, a huge wordless choir-like synth pad (no words), and a soaring, desperate lead guitar melody. Climactic and apocalyptic. 8-bar intro, then a relentless loop. About 2:00, ending on a full bar with no fade.

### 9. `jingle-clear`: level cleared (short, plays once)
> 172 BPM, E major. A 5-second victory jingle. A quick triumphant rock guitar fanfare with a drum fill, ending on a big ringing major chord. No vocals.

### 10. `jingle-gameover`: game over (short, plays once)
> Slow, E minor. A 4-second game-over sting. A descending, defeated distorted guitar phrase over a final crash cymbal, ending on a low ringing minor chord. No vocals.

---

## Fix-up phrases (use these as chat follow-ups if a take is off)

- "Remove all vocals and any voice-like sounds; instrumental only."
- "Make the lead electric guitar louder and more prominent."
- "More distortion on the guitars, heavier rhythm guitar."
- "Keep the tempo steady at ___ BPM the whole way through."
- "Don't fade out; end abruptly on the downbeat of a full bar."
- "Less synth, more guitar."
- "Make the melody catchier and repeat the main hook more."
- "Remove the slow intro; start at full energy." (for level tracks)

## Deliverables checklist

```
stage5/assets/music-flow/
  bgm-title.wav
  bgm-5-1.wav
  bgm-5-2.wav
  bgm-5-3.wav
  bgm-5-4.wav
  bgm-5-5.wav
  bgm-boss.wav
  bgm-boss-final.wav
  jingle-clear.wav
  jingle-gameover.wav
```

MP3 is fine if WAV isn't offered; just keep the same base names.

Before you say "dropped", listen to each track once and check:
1. There are no vocals.
2. The tempo stays steady.
3. It ends without a fade-out.
