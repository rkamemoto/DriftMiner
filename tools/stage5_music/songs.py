"""Arrangement data. Notes are MIDI numbers; progressions are semitone offsets."""

STAGE5_HOOK = [0, 7, 12, 11, 7, 4, 2, 4, 7, 9, 7, 4, 2, 0, -1, 2]

TRACKS = {
    "title": dict(file="bgm-title", bpm=140, key="E minor", root=40,
                  intro=4, loop=16, style="title",
                  prog=[0, -2, -3, -5], motif=STAGE5_HOOK),
    "5-1": dict(file="bgm-5-1", bpm=172, key="E minor / G major", root=40,
                intro=2, loop=48, style="heroic",
                prog=[0, -3, -5, -2, 3, 5, -2, 0], motif=STAGE5_HOOK),
    "5-2": dict(file="bgm-5-2", bpm=180, key="D Dorian", root=38,
                intro=4, loop=48, style="syncopated",
                prog=[0, 3, 5, 0, -2, 3, 5, 7],
                motif=[0, 3, 5, 7, 10, 7, 5, 3, 0, 5, 3, 7, 5, 3, 2, 0]),
    "5-3": dict(file="bgm-5-3", bpm=168, key="C minor", root=36,
                intro=4, loop=48, style="march",
                prog=[0, -2, -4, -5, 3, 5, -2, 0],
                motif=[0, 0, 7, 8, 7, 3, 5, 7, 12, 10, 8, 7, 5, 3, 2, 0]),
    "5-4": dict(file="bgm-5-4", bpm=196, key="F# minor / A major", root=42,
                intro=4, loop=48, style="gallop",
                prog=[0, -3, -5, -2, 3, 5, 7, 5],
                motif=[0, 4, 7, 9, 12, 11, 9, 7, 4, 7, 12, 16, 14, 12, 11, 9]),
    "5-5": dict(file="bgm-5-5", bpm=160, key="B Phrygian", root=35,
                intro=4, loop=48, style="heavy",
                prog=[0, 1, 6, 0, -1, 1, 6, 5],
                motif=[0, 1, 6, 7, 6, 1, 0, -1, 0, 6, 7, 13, 12, 7, 6, 1]),
    "boss": dict(file="bgm-boss", bpm=180, key="A minor", root=33,
                 intro=4, loop=32, style="boss",
                 prog=[0, 1, 6, 3, 0, -1, 1, 6],
                 motif=[x - 5 for x in STAGE5_HOOK]),
    "boss-final": dict(file="bgm-boss-final", bpm=184, key="B minor", root=35,
                       intro=8, loop=48, style="final",
                       prog=[0, 1, 6, 3, -2, 5, 1, 0],
                       motif=[x - 5 for x in STAGE5_HOOK]),
}

JINGLES = {
    "clear": dict(file="jingle-clear", bpm=172, key="E major", seconds=5.4),
    "gameover": dict(file="jingle-gameover", bpm=72, key="E minor", seconds=4.6),
}

