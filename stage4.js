"use strict";

document.documentElement.classList.add("stage-four-document");

const canvas = document.querySelector("#stageFourCanvas");
const ctx = canvas.getContext("2d");
const generatedArt = {
  usePreview: true,
  background: new Image(),
  playerSheet: new Image(),
  ngSheet: new Image(),
  cart: new Image(),
  helmet: new Image(),
  lever: new Image(),
  buttonSheet: new Image(),
  gasSheet: new Image(),
  highlightOuterHatch: new Image(),
  highlightLocker: new Image(),
  highlightLadder: new Image(),
  highlightLeak: new Image(),
  objectOuterHatch: new Image(),
  objectLocker: new Image(),
  objectLadder: new Image(),
  objectLeak: new Image(),
  objectScanner: new Image(),
  objectInnerDoor: new Image(),
  backgroundReady: false,
  playerReady: false,
  spritesReady: false
};
generatedArt.background.onload = () => generatedArt.backgroundReady = true;
const updateStageFourPlayerReadiness = () => generatedArt.playerReady =
  generatedArt.playerSheet.complete && generatedArt.playerSheet.naturalWidth > 0 &&
  generatedArt.ngSheet.complete && generatedArt.ngSheet.naturalWidth > 0;
generatedArt.playerSheet.onload = updateStageFourPlayerReadiness;
generatedArt.ngSheet.onload = updateStageFourPlayerReadiness;
const stageFourSpriteImages = [
  generatedArt.cart, generatedArt.helmet, generatedArt.lever, generatedArt.buttonSheet, generatedArt.gasSheet,
  generatedArt.highlightOuterHatch, generatedArt.highlightLocker, generatedArt.highlightLadder, generatedArt.highlightLeak,
  generatedArt.objectOuterHatch, generatedArt.objectLocker, generatedArt.objectLadder,
  generatedArt.objectLeak, generatedArt.objectScanner, generatedArt.objectInnerDoor
];
const updateStageFourSpriteReadiness = () => generatedArt.spritesReady = stageFourSpriteImages.every(image => image.complete && image.naturalWidth > 0);
stageFourSpriteImages.forEach(image => image.onload = updateStageFourSpriteReadiness);
generatedArt.background.src = "assets/stage4/level1-airlock/airlock-background-sprites-v3.png?v=stage4-level1-folder-1";
generatedArt.playerSheet.src = "assets/stage4/level1-airlock/player-sheet-cells-v8.png?v=stage4-all-direction-size-match-1";
generatedArt.ngSheet.src = "assets/stage4/level1-airlock/player-ng-reaction-cells-v2.png?v=stage4-player-size-match-1";
generatedArt.cart.src = "assets/stage4/level1-airlock/cart-sprite-v1.png?v=stage4-level1-folder-1";
generatedArt.helmet.src = "assets/stage4/level1-airlock/helmet-sprite-v1.png?v=stage4-level1-folder-1";
generatedArt.lever.src = "assets/stage4/level1-airlock/lever-sheet-v1.png?v=stage4-lever-two-state-1";
generatedArt.buttonSheet.src = "assets/stage4/level1-airlock/alien-button-sheet-v1.png?v=stage4-level1-folder-1";
generatedArt.gasSheet.src = "assets/stage4/level1-airlock/leak-gas-sheet-v1.png?v=stage4-level1-folder-1";
generatedArt.highlightOuterHatch.src = "assets/stage4/level1-airlock/hover-outer-hatch-solid-v1.png?v=stage4-level1-folder-1";
generatedArt.highlightLocker.src = "assets/stage4/level1-airlock/hover-locker-solid-v1.png?v=stage4-level1-folder-1";
generatedArt.highlightLadder.src = "assets/stage4/level1-airlock/highlight-ladder-v4.png?v=stage4-ladder-outline-4";
generatedArt.highlightLeak.src = "assets/stage4/level1-airlock/object-leak-v5.png?v=stage4-level1-folder-1";
generatedArt.objectOuterHatch.src = "assets/stage4/level1-airlock/object-outer-hatch-v1.png?v=stage4-level1-folder-1";
generatedArt.objectLocker.src = "assets/stage4/level1-airlock/locker-sprite-original-v1.png?v=stage4-locker-original-restored-1";
generatedArt.objectLadder.src = "assets/stage4/level1-airlock/ladder-markup-source.png?v=stage4-level1-folder-1";
generatedArt.objectLeak.src = "assets/stage4/level1-airlock/object-leak-v2.png?v=stage4-level1-folder-1";
generatedArt.objectScanner.src = "assets/stage4/level1-airlock/object-scanner-display-v5.png?v=stage4-level1-folder-1";
generatedArt.objectInnerDoor.src = "assets/stage4/level1-airlock/object-inner-door-v3.png?v=stage4-level1-folder-1";

const ui = {
  inventory: document.querySelector("#s4Inventory"),
  clear: document.querySelector("#s4ClearItem"),
  log: document.querySelector("#s4Log"),
  objective: document.querySelector("#s4Objective"),
  steps: document.querySelector("#s4Steps"),
  toast: document.querySelector("#s4Toast"),
  controller: document.querySelector("#s4ControllerStatus")
};

const items = {
  helmet: { name: "Cracked Helmet", icon: "◖", description: "A damaged alien helmet. Big enough to cover the vent." },
  sealant: { name: "Sealant Patch", icon: "▣", description: "Emergency hull sealant. Sticky, cold, and probably alive." },
  patchedHelmet: { name: "Patched Helmet", icon: "◉", description: "A cracked helmet sealed with emergency patching gel." },
  tag: { name: "Maintenance Tag", icon: "◆", description: "A twitchy access tag coughed up by the repair bot." }
};

const art = {
  ink: "#12182b",
  space0: "#080b1d",
  space1: "#17133f",
  space2: "#06273b",
  wall0: "#17324c",
  wall1: "#254d67",
  wall2: "#102034",
  floor0: "#243e58",
  floor1: "#14263c",
  cyan: "#75f5ee",
  cyanSoft: "#91fff4",
  pink: "#ff73bf",
  pinkSoft: "#ffaddf",
  gold: "#ffd365",
  lavender: "#c595ff",
  mint: "#80f4d4",
  cream: "#fff4cf",
  parchment: "#f5d879",
  ochre: "#b98742",
  moss: "#a8b85a",
  bark: "#7b573f",
  cocoa: "#4d382f",
  warmShadow: "#2b2535",
  glass: "rgba(129,255,240,.22)",
  shade: "rgba(5,8,22,.5)"
};

let toastTimer = 0;
let last = 0;
let audioContext = null;
const state = {
  inventory: [],
  selected: null,
  hover: null,
  lockerOpen: false,
  ventSealed: false,
  pressureEqualized: false,
  tagAvailable: false,
  scannerSpoofed: false,
  complete: false,
  // Future art pass: interactables should get two-state overlays/animations
  // so picked-up/opened objects differ from the baked background painting.
  reactionUntil: 0,
  decoyButtonBroken: false,
  decoyButtonSparkUntil: 0,
  onLadder: false,
  cartLeft: true,
  cartX: 462,
  cartTargetX: 462,
  cartWobbleUntil: 0,
  comicEffects: [],
  player: { x: 160, y: 458, tx: 160, ty: 458, path: [], currentDone: null, facing: "down", forcedFacing: null },
  stars: Array.from({ length: 70 }, () => ({ x: Math.random() * 960, y: Math.random() * 640, r: Math.random() * 1.6 + .3, a: Math.random() * .45 + .25 }))
};

const controller = {
  connected: false,
  initialized: false,
  buttons: [],
  screenX: 0,
  screenY: 0,
  onCanvas: false,
  x: 480,
  y: 320,
  inventoryIndex: 0
};

const steps = [
  ["Seal the pressure leak", () => state.ventSealed],
  ["Restore airlock pressure", () => state.pressureEqualized],
  ["Spoof the alien scanner", () => state.scannerSpoofed],
  ["Open the inner hatch", () => state.complete]
];

function hasItem(id) {
  return state.inventory.includes(id);
}

function addItem(id) {
  if (!hasItem(id)) state.inventory.push(id);
  state.selected = id;
  popComic("yoink!", state.player.x + 18, state.player.y - 76, "#f2c45b");
  setLog(`${items[id].name} added to inventory.`);
  updateUI();
}

function removeItem(id) {
  state.inventory = state.inventory.filter(item => item !== id);
  if (state.selected === id) state.selected = null;
}

function setLog(text) {
  if (ui.log) ui.log.textContent = text;
}

function toast(text) {
  clearTimeout(toastTimer);
  ui.toast.textContent = text;
  ui.toast.hidden = false;
  toastTimer = setTimeout(() => ui.toast.hidden = true, 1800);
}

function getAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, duration = .12, type = "sine", gain = .06, delay = 0, slideTo = null) {
  const audio = getAudioContext();
  if (!audio) return;
  const when = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), when + duration);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(gain, when + .015);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start(when);
  osc.stop(when + duration + .03);
}

function playNoise(duration = .18, gain = .05, delay = 0, filterFrequency = 1200) {
  const audio = getAudioContext();
  if (!audio) return;
  const when = audio.currentTime + delay;
  const buffer = audio.createBuffer(1, Math.max(1, Math.floor(audio.sampleRate * duration)), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const amp = audio.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = filterFrequency;
  filter.Q.value = .9;
  amp.gain.setValueAtTime(gain, when);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  source.connect(filter).connect(amp).connect(audio.destination);
  source.start(when);
  source.stop(when + duration + .03);
}

function soundKind(label) {
  return String(label).toLowerCase().replace(/[^a-z]/g, "");
}

function playSfx(label) {
  const kind = soundKind(label);
  if (kind === "nope") {
    playTone(180, .13, "square", .045, 0, 120);
    playTone(105, .16, "sawtooth", .035, .08, 80);
  } else if (kind === "clank") {
    playTone(145, .08, "triangle", .06);
    playTone(92, .11, "square", .035, .045);
    playNoise(.08, .045, 0, 3600);
  } else if (kind === "squish") {
    playTone(220, .18, "sine", .05, 0, 90);
    playNoise(.14, .035, .02, 420);
  } else if (kind === "psshh") {
    playNoise(.42, .055, 0, 2600);
    playNoise(.28, .025, .12, 5200);
  } else if (kind === "ding") {
    playTone(784, .18, "sine", .045);
    playTone(1175, .24, "sine", .025, .08);
  } else if (kind === "boop") {
    playTone(320, .09, "sine", .045, 0, 540);
  } else if (kind === "kzzt") {
    playNoise(.2, .055, 0, 4700);
    playTone(75, .08, "sawtooth", .025);
  } else if (kind === "pop" || kind === "yoink") {
    playTone(kind === "yoink" ? 520 : 360, .08, "triangle", .045, 0, kind === "yoink" ? 960 : 620);
  } else if (kind === "whoomp") {
    playTone(92, .22, "sine", .055, 0, 55);
    playNoise(.18, .025, .02, 300);
  } else if (kind === "whoosh") {
    playNoise(.28, .045, 0, 1800);
    playTone(260, .16, "sine", .025, 0, 520);
  }
}

const NOPE_REACTION_MS = 950;

function playerIsReacting() {
  return performance.now() < state.reactionUntil;
}

function reactNope() {
  state.reactionUntil = performance.now() + NOPE_REACTION_MS;
  playSfx("NOPE!");
}

function popComic(text, x, y, color = "#fff3c5") {
  playSfx(text);
}

function tryCombine(a, b) {
  const pair = [a, b].sort().join("+");
  if (pair === "helmet+sealant") {
    removeItem("helmet");
    removeItem("sealant");
    state.inventory.push("patchedHelmet");
    state.selected = "patchedHelmet";
    popComic("squish!", state.player.x + 10, state.player.y - 92, "#7cf5de");
    setLog("You press the sealant over the helmet crack. It wriggles once, then hardens into a perfect airlock plug.");
    updateUI();
    return true;
  }
  reactNope();
  setLog(`${items[a].name} and ${items[b].name} do not seem useful together.`);
  return false;
}

function useSelectedOn(target) {
  const selected = state.selected;
  if (!selected) return false;

  if (target === "vent" && selected === "patchedHelmet" && !state.ventSealed) {
    if (!state.onLadder) {
      const floor = ladderFloorPoint();
      reactNope();
      state.player.tx = floor.x;
      state.player.ty = floor.y;
      setLog("The pressure leak is too high to reach from the floor.");
      return true;
    }
    removeItem("patchedHelmet");
    state.ventSealed = true;
    state.selected = null;
    popComic("PSSSHH!", 610, 130, "#7cf5de");
    setLog("You wedge the patched helmet into the vent. The screaming leak drops to a nervous hiss, then silence.");
    updateUI();
    return true;
  }

  if (target === "vent" && selected === "helmet") {
    if (!state.onLadder) {
      const floor = ladderFloorPoint();
      reactNope();
      state.player.tx = floor.x;
      state.player.ty = floor.y;
      setLog("The pressure leak is too high to reach from the floor.");
      return true;
    }
    reactNope();
    setLog("The helmet covers the leak, but air keeps screaming through the crack. It needs a sealant patch first.");
    return true;
  }

  if (target === "scanner" && selected === "tag" && state.pressureEqualized && !state.scannerSpoofed) {
    state.scannerSpoofed = true;
    state.selected = null;
    popComic("ding!", 716, 244, "#6df2d6");
    setLog("The scanner chirps at the maintenance tag, thinks very hard, and decides you are probably authorized machinery.");
    updateUI();
    return true;
  }

  if (target === "scanner" && selected === "tag") {
    reactNope();
    setLog("The tag sparks weakly, but the scanner will not wake until the airlock pressure is stable.");
    return true;
  }

  reactNope();
  setLog(`${items[selected].name} does not help with that.`);
  return false;
}

function hotspotList() {
  const g = generatedArt.usePreview && generatedArt.backgroundReady;
  return [
    { id: "outerDoor", label: "Outer Hatch", x: g ? 32 : 34, y: g ? 150 : 270, w: g ? 112 : 122, h: g ? 205 : 245, action: () => setLog("The outer hatch is sealed behind you. No going back until the ship gives up its secret.") },
    { id: "locker", label: state.lockerOpen ? "Emergency Locker" : "Jammed Emergency Locker", x: g ? 268 : 170, y: g ? 215 : 300, w: g ? 96 : 126, h: g ? 168 : 194, action: openLocker },
    { id: "helmetSpot", label: "Cracked Helmet", x: g ? 230 : 318, y: g ? 398 : 404, w: g ? 128 : 118, h: g ? 88 : 92, visible: () => !hasItem("helmet") && !hasItem("patchedHelmet") && !state.ventSealed, action: collectHelmet },
    { id: "vent", label: state.ventSealed ? "Sealed Vent" : "Screaming Pressure Leak", x: g ? 370 : 506, y: g ? 48 : 112, w: g ? 205 : 124, h: g ? 94 : 92, action: inspectVent },
    { id: "lever", label: "Pressure Lever", x: g ? 560 : 675, y: g ? 250 : 395, w: g ? 94 : 82, h: g ? 126 : 116, action: pullLever },
    { id: "ladder", label: state.onLadder ? "Climb Down" : "Service Ladder", x: g ? 456 : 542, y: g ? 150 : 226, w: g ? 64 : 52, h: g ? 300 : 292, action: useLadder },
    { id: "decoyButton", label: state.decoyButtonBroken ? "Broken Alien Button" : "Suspicious Alien Button", x: g ? 615 : 704, y: g ? 397 : 300, w: g ? 126 : 58, h: g ? 84 : 70, action: pressDecoyButton },
    { id: "cargoCart", label: "Loose Cargo Cart", x: state.cartX - 48, y: 412, w: 96, h: 58, action: pushCargoCart },
    { id: "tag", label: "Maintenance Tag", x: 598, y: 463, w: 76, h: 55, visible: () => state.tagAvailable && !hasItem("tag") && !state.scannerSpoofed, action: () => addItem("tag") },
    { id: "scanner", label: state.scannerSpoofed ? "Spoofed Scanner" : "Alien ID Scanner", x: g ? 689 : 772, y: g ? 246 : 238, w: g ? 64 : 70, h: g ? 80 : 120, action: inspectScanner },
    { id: "innerDoor", label: state.complete ? "Open Inner Hatch" : "Inner Airlock Hatch", x: g ? 829 : 842, y: g ? 182 : 178, w: g ? 120 : 86, h: g ? 235 : 292, action: openInnerDoor }
  ]
    .filter(h => !h.visible || h.visible())
    .filter(h => !state.onLadder || h.id === "vent" || h.id === "ladder");
}

function pressDecoyButton() {
  if (state.decoyButtonBroken) {
    reactNope();
    setLog("The broken button hangs from two little wires.");
    return;
  }
  state.decoyButtonBroken = true;
  state.decoyButtonSparkUntil = performance.now() + 900;
  popComic("BOOP?", 733, 290, "#ff7abf");
  setTimeout(() => popComic("KZZT!", 742, 312, "#f2c45b"), 180);
  setLog("The button gives one heroic beep, snaps inward, and dies.");
}

function useLadder() {
  const floor = ladderFloorPoint();
  const top = ladderTopPoint();
  if (state.onLadder) {
    setPlayerPath([{
      x: floor.x,
      y: floor.y,
      facing: "up",
      done: () => {
        state.onLadder = false;
        state.hover = null;
      }
    }]);
    popComic("clank!", floor.x, floor.y - 25, "#f2c45b");
    setLog("You climb back down to the deck.");
    return;
  }
  state.onLadder = false;
  setPlayerPath([
    { x: floor.x, y: floor.y },
    {
      x: top.x,
      y: top.y,
      facing: "up",
      done: () => {
        state.onLadder = true;
        state.hover = null;
      }
    }
  ]);
  popComic("yoink!", top.x, top.y + 84, "#f2c45b");
  setLog("You walk to the ladder, then climb straight up under the leak.");
}

function pushCargoCart() {
  state.cartLeft = !state.cartLeft;
  state.cartTargetX = state.cartLeft ? 462 : 586;
  state.cartWobbleUntil = performance.now() + 650;
  popComic("clank!", state.cartTargetX, 414, "#f2c45b");
  setLog("The cargo cart rattles along its track and stops with a hollow clank.");
}

function openLocker() {
  if (state.lockerOpen) {
    setLog(hasItem("sealant") ? "The locker is empty except for a warning label shaped like a screaming moon." : "The locker hangs open.");
    return;
  }
  state.lockerOpen = true;
  popComic("pop!", 236, 304, "#f2c45b");
  setLog("The emergency locker pops open with a wet metallic thunk. A sealant patch droops inside.");
  addItem("sealant");
}

function collectHelmet() {
  if (hasItem("helmet") || hasItem("patchedHelmet")) {
    setLog("You already salvaged the cracked helmet shell.");
    return;
  }
  if (state.ventSealed) {
    setLog("The patched helmet is already sealing the leak.");
    return;
  }
  addItem("helmet");
}

function inspectVent() {
  if (!state.onLadder) {
    const floor = ladderFloorPoint();
    reactNope();
    state.player.tx = floor.x;
    state.player.ty = floor.y;
    setLog("The pressure leak is too high to reach from the floor.");
    return;
  }
  if (useSelectedOn("vent")) return;
  setLog(state.ventSealed ? "The patched helmet holds. The airlock finally sounds like a room instead of a catastrophe." : "Air is venting through a torn intake. Something broad and sealed could plug it.");
}

function pullLever() {
  if (state.pressureEqualized) {
    reactNope();
    setLog("The pressure needle is steady. The lever refuses to do anything dramatic twice.");
    return;
  }
  if (!state.ventSealed) {
    reactNope();
    setLog("You pull the lever. The room screams louder. You shove it back before your boots leave the floor.");
    return;
  }
  state.pressureEqualized = true;
  state.tagAvailable = true;
  popComic("whoomp!", 712, 345, "#6df2d6");
  setLog("Pressure rolls through the chamber. A tiny maintenance bot tumbles from a wall socket and coughs up an access tag.");
  updateUI();
}

function inspectScanner() {
  if (useSelectedOn("scanner")) return;
  setLog(state.scannerSpoofed ? "The scanner glows green. It now believes you are a very tall maintenance bot." : "The scanner wants alien credentials. Or something that looks credential-ish.");
}

function openInnerDoor() {
  if (state.complete) {
    setLog("Beyond the hatch, the ship descends into a quiet cargo spine. That will be the next room.");
    return;
  }
  if (!state.scannerSpoofed) {
    reactNope();
    setLog("The inner hatch stays locked. A scanner beside it blinks in judgment.");
    return;
  }
  state.complete = true;
  popComic("WHOOSH!", 848, 172, "#7cf5de");
  setLog("The inner hatch exhales open. The ship accepts your lie and invites you deeper.");
  updateUI();
}

function updateUI() {
  ui.inventory.innerHTML = "";
  if (!state.inventory.length) {
    const empty = document.createElement("p");
    empty.className = "s4-empty";
    empty.textContent = "No items yet.";
    ui.inventory.append(empty);
  }
  for (const id of state.inventory) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "s4-item";
    button.classList.toggle("is-selected", state.selected === id);
    button.innerHTML = `<span>${items[id].icon}</span><strong>${items[id].name}</strong><small>${items[id].description}</small>`;
    button.addEventListener("click", () => {
      if (state.selected && state.selected !== id) {
        tryCombine(state.selected, id);
        return;
      }
      state.selected = state.selected === id ? null : id;
      setLog(state.selected ? `Selected ${items[id].name}. Click something in the airlock to use it.` : "Item put away.");
      updateUI();
    });
    ui.inventory.append(button);
  }
  ui.clear.hidden = !state.selected;
  if (ui.objective) ui.objective.textContent = state.complete ? "Airlock cleared. Next: the cargo spine." : "Get through the inner airlock door.";
  if (ui.steps) {
    ui.steps.innerHTML = "";
    for (const [label, done] of steps) {
      const li = document.createElement("li");
      li.className = done() ? "is-done" : "";
      li.textContent = label;
      ui.steps.append(li);
    }
  }
}

function getCanvasContentRect() {
  const box = canvas.getBoundingClientRect();
  const sourceRatio = canvas.width / canvas.height;
  const boxRatio = box.width / box.height;
  if (boxRatio > sourceRatio) {
    const height = box.height;
    const width = height * sourceRatio;
    return { left: box.left + (box.width - width) / 2, top: box.top, width, height, right: box.left + (box.width + width) / 2, bottom: box.bottom };
  }
  const width = box.width;
  const height = width / sourceRatio;
  return { left: box.left, top: box.top + (box.height - height) / 2, width, height, right: box.right, bottom: box.top + (box.height + height) / 2 };
}

function screenToCanvasPoint(x, y) {
  const r = getCanvasContentRect();
  return {
    x: (x - r.left) * canvas.width / r.width,
    y: (y - r.top) * canvas.height / r.height
  };
}

function ensureControllerCursor() {
  let cursor = document.querySelector("#s4GamepadCursor");
  if (!cursor) {
    cursor = document.createElement("div");
    cursor.id = "s4GamepadCursor";
    cursor.hidden = true;
    document.body.append(cursor);
  }
  return cursor;
}

function positionControllerCursor() {
  const cursor = ensureControllerCursor();
  cursor.hidden = !controller.connected;
  cursor.style.transform = `translate(${controller.screenX}px,${controller.screenY}px) translate(-50%,-50%)`;
  const r = getCanvasContentRect();
  controller.onCanvas = controller.screenX >= r.left && controller.screenX <= r.right && controller.screenY >= r.top && controller.screenY <= r.bottom;
  if (controller.onCanvas) {
    const p = screenToCanvasPoint(controller.screenX, controller.screenY);
    controller.x = p.x;
    controller.y = p.y;
    state.hover = hitTest(p) || null;
  } else {
    state.hover = null;
  }
}

function movePlayerToPoint(point) {
  // At the top of the ladder the astronaut is not on a walkable floor plane.
  // Empty-space clicks must never detach the character into midair.
  if (state.onLadder) {
    reactNope();
    return false;
  }
  if (!isGroundTile(point)) {
    reactNope();
    return false;
  }
  state.onLadder = false;
  state.player.path = [];
  state.player.currentDone = null;
  state.player.tx = Math.max(72, Math.min(890, point.x));
  state.player.ty = isGeneratedMode() ? Math.max(414, Math.min(474, point.y)) : Math.max(520, Math.min(570, point.y));
  return true;
}

function setPlayerPath(points) {
  const [first, ...rest] = points;
  if (!first) return;
  state.player.path = rest;
  state.player.currentDone = first.done || null;
  state.player.forcedFacing = first.facing || null;
  state.player.tx = first.x;
  state.player.ty = first.y;
}

function activatePoint(point) {
  // The shrug is a complete player reaction, not an overlay on movement.
  // Ignore new destinations and interactions until its final frame finishes.
  if (playerIsReacting()) return;
  const hit = hitTest(point);
  if (state.onLadder && (!hit || (hit.id !== "vent" && hit.id !== "ladder"))) {
    reactNope();
    return;
  }
  if (!hit) {
    if (movePlayerToPoint(point)) setLog(state.selected ? `${items[state.selected].name} stays ready while you move.` : "You move across the alien deck.");
    return;
  }
  movePlayerNear(hit, hit.action);
}

function autoScrollViewport(dt) {
  const margin = 74;
  const scroller = document.scrollingElement || document.documentElement;
  let dx = 0;
  let dy = 0;
  if (controller.screenX < margin) dx = -1;
  else if (controller.screenX > innerWidth - margin) dx = 1;
  if (controller.screenY < margin) dy = -1;
  else if (controller.screenY > innerHeight - margin) dy = 1;
  if (!dx && !dy) return;
  const speed = 520 * dt;
  const maxLeft = scroller.scrollWidth - scroller.clientWidth;
  const maxTop = scroller.scrollHeight - scroller.clientHeight;
  scroller.scrollLeft = Math.max(0, Math.min(maxLeft, scroller.scrollLeft + dx * speed));
  scroller.scrollTop = Math.max(0, Math.min(maxTop, scroller.scrollTop + dy * speed));
}

function cycleInventory(delta) {
  if (!state.inventory.length) {
    reactNope();
    setLog("No inventory items yet.");
    return;
  }
  controller.inventoryIndex = (controller.inventoryIndex + delta + state.inventory.length) % state.inventory.length;
  state.selected = state.inventory[controller.inventoryIndex];
  setLog(`Selected ${items[state.selected].name}. Move the cursor to something in the airlock and press A.`);
  updateUI();
}

function controllerClick() {
  const target = document.elementFromPoint(controller.screenX, controller.screenY);
  const button = target?.closest?.(".s4-item, #s4ClearItem, .stage-link");
  if (button && !button.disabled && !button.hidden) {
    button.click();
    return;
  }
  if (controller.onCanvas) activatePoint(screenToCanvasPoint(controller.screenX, controller.screenY));
}

function updateController(dt) {
  const pad = Array.from(navigator.getGamepads?.() || []).find(Boolean);
  if (!pad) {
    if (controller.connected && ui.controller) ui.controller.textContent = "Controller disconnected";
    controller.connected = false;
    controller.buttons = [];
    const cursor = document.querySelector("#s4GamepadCursor");
    if (cursor) cursor.hidden = true;
    return;
  }

  if (!controller.connected && ui.controller) ui.controller.textContent = `${pad.id} connected · A clicks · B puts item away · LB/RB cycles items`;
  controller.connected = true;
  if (!controller.initialized) {
    const r = getCanvasContentRect();
    controller.screenX = r.left + r.width / 2;
    controller.screenY = r.top + r.height / 2;
    controller.initialized = true;
  }

  const held = i => Boolean(pad.buttons[i]?.pressed || pad.buttons[i]?.value > .55);
  const edge = i => held(i) && !controller.buttons[i];
  const rawX = Math.abs(pad.axes[0] || 0) > .18 ? pad.axes[0] : 0;
  const rawY = Math.abs(pad.axes[1] || 0) > .18 ? pad.axes[1] : 0;
  const dpadX = held(15) ? 1 : held(14) ? -1 : 0;
  const dpadY = held(13) ? 1 : held(12) ? -1 : 0;
  const ax = rawX || dpadX * .7;
  const ay = rawY || dpadY * .7;
  controller.screenX = Math.max(4, Math.min(innerWidth - 18, controller.screenX + ax * 440 * dt));
  controller.screenY = Math.max(4, Math.min(innerHeight - 18, controller.screenY + ay * 440 * dt));
  autoScrollViewport(dt);
  positionControllerCursor();

  if (edge(0)) controllerClick();
  if (edge(1)) {
    state.selected = null;
    setLog("Item put away.");
    updateUI();
  }
  if (edge(4)) cycleInventory(-1);
  if (edge(5)) cycleInventory(1);
  controller.buttons = pad.buttons.map((_, i) => held(i));
}

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * canvas.width / box.width,
    y: (event.clientY - box.top) * canvas.height / box.height
  };
}

function isGeneratedMode() {
  return generatedArt.usePreview && generatedArt.backgroundReady;
}

function ladderFloorPoint() {
  return isGeneratedMode() ? { x: 490, y: 452 } : { x: 568, y: 535 };
}

function ladderTopPoint() {
  // Place the helmet just beneath the ceiling opening while leaving the hole
  // itself visible above the character.
  return isGeneratedMode() ? { x: 490, y: 292 } : { x: 568, y: 282 };
}

function pointInEllipse(point, cx, cy, rx, ry, rotation = 0) {
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const dx = point.x - cx;
  const dy = point.y - cy;
  const x = dx * cos - dy * sin;
  const y = dx * sin + dy * cos;
  return (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1;
}

function pointInRect(point, x, y, w, h) {
  return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
}

function pointNearSegment(point, x1, y1, x2, y2, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / lenSq));
  const x = x1 + dx * t;
  const y = y1 + dy * t;
  return Math.hypot(point.x - x, point.y - y) <= radius;
}

function pointInPolygon(point, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0], yi = vertices[i][1];
    const xj = vertices[j][0], yj = vertices[j][1];
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || .0001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointNearPolyline(point, vertices, radius) {
  for (let i = 0; i < vertices.length - 1; i++) {
    if (pointNearSegment(point, vertices[i][0], vertices[i][1], vertices[i + 1][0], vertices[i + 1][1], radius)) return true;
  }
  return false;
}

const tracedHotspots = {
  outerDoor: {
    hit: point => pointInPolygon(point, [[28,188],[51,159],[83,145],[118,140],[149,156],[176,204],[187,264],[173,329],[138,372],[89,389],[41,368],[14,319],[14,249]]),
    draw: () => tracePolygon([[28,188],[51,159],[83,145],[118,140],[149,156],[176,204],[187,264],[173,329],[138,372],[89,389],[41,368],[14,319],[14,249]])
  },
  locker: {
    hit: point => pointInPolygon(point, [[275,235],[294,218],[332,218],[353,241],[353,391],[266,391],[263,259]]),
    draw: () => tracePolygon([[275,235],[294,218],[332,218],[353,241],[353,391],[266,391],[263,259]])
  },
  helmetSpot: {
    hit: point => pointInPolygon(point, [[221, 432], [239, 410], [282, 399], [332, 411], [356, 439], [337, 464], [284, 472], [238, 462]]),
    draw: () => tracePolygon([[221, 432], [239, 410], [282, 399], [332, 411], [356, 439], [337, 464], [284, 472], [238, 462]])
  },
  vent: {
    hit: point => pointInEllipse(point, 472.5, 95, 102.5, 47, 0),
    draw: () => ctx.ellipse(472.5, 95, 102.5, 47, 0, 0, Math.PI * 2)
  },
  lever: {
    hit: point => pointInPolygon(point, [[585, 252], [613, 257], [635, 282], [651, 320], [646, 365], [612, 376], [574, 363], [562, 324], [568, 281]]),
    draw: () => tracePolygon([[585, 252], [613, 257], [635, 282], [651, 320], [646, 365], [612, 376], [574, 363], [562, 324], [568, 281]])
  },
  ladder: {
    hit: point => pointNearPolyline(point, [[453,137],[449,410]], 11) ||
      pointNearPolyline(point, [[515,135],[517,410]], 11) ||
      [[[454,188],[515,188]],[[453,221],[515,221]],[[453,256],[516,256]],[[453,291],[516,291]],[[453,327],[516,327]],[[453,364],[517,364]],[[451,397],[517,397]]]
        .some(rung => pointNearSegment(point, rung[0][0], rung[0][1], rung[1][0], rung[1][1], 10)),
    draw: () => {
      tracePolyline([[453,137],[449,410]]);
      tracePolyline([[515,135],[517,410]]);
      for (const rung of [[[454,188],[515,188]],[[453,221],[515,221]],[[453,256],[516,256]],[[453,291],[516,291]],[[453,327],[516,327]],[[453,364],[517,364]],[[451,397],[517,397]]]) tracePolyline(rung);
    }
  },
  decoyButton: {
    hit: point => pointInPolygon(point, [[630, 438], [650, 426], [695, 426], [723, 440], [718, 458], [688, 468], [648, 464], [626, 452]]),
    draw: () => tracePolygon([[630, 438], [650, 426], [695, 426], [723, 440], [718, 458], [688, 468], [648, 464], [626, 452]])
  },
  scanner: {
    hit: point => pointInPolygon(point, [[721,246],[740,253],[753,274],[751,305],[735,326],[708,326],[691,307],[689,277],[700,254]]),
    draw: () => tracePolygon([[721,248],[738,255],[747,276],[744,306],[730,324],[709,321],[698,305],[696,277],[704,256]])
  },
  innerDoor: {
    hit: point => pointInPolygon(point, [[837,183],[921,183],[948,208],[949,390],[933,413],[846,413],[829,390],[829,208]]),
    draw: () => tracePolygon([[837,183],[921,183],[948,208],[949,390],[933,413],[846,413],[829,390],[829,208]])
  }
};

function tracePolyline(vertices) {
  ctx.moveTo(vertices[0][0], vertices[0][1]);
  for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i][0], vertices[i][1]);
}

function tracePolygon(vertices) {
  tracePolyline(vertices);
  ctx.closePath();
}

function generatedShapeHit(hotspot, point) {
  if (tracedHotspots[hotspot.id]) return tracedHotspots[hotspot.id].hit(point);
  switch (hotspot.id) {
    case "outerDoor":
      return pointInEllipse(point, 88, 252, 56, 102, -.05);
    case "locker":
      return pointInRect(point, 268, 215, 96, 168);
    case "helmetSpot":
      return pointInEllipse(point, 288, 443, 78, 48, -.14);
    case "vent":
      return pointInEllipse(point, 486, 105, 70, 30, -.02);
    case "lever":
      return pointInEllipse(point, 552, 304, 15, 15) ||
        pointNearSegment(point, 552, 314, 586, 394, 14) ||
        pointInPolygon(point, [[558, 402], [584, 376], [626, 386], [646, 420], [637, 452], [608, 462], [574, 456], [555, 438], [552, 414]]);
    case "ladder":
      return pointInRect(point, 456, 150, 64, 300);
    case "decoyButton":
      return pointInEllipse(point, 626, 444, 48, 21, -.12);
    case "cargoCart":
      return pointInRect(point, state.cartX - 50, 410, 100, 62);
    case "tag":
      return pointInEllipse(point, 636, 488, 42, 30);
    case "scanner":
      return pointInPolygon(point, [[721,246],[740,253],[753,274],[751,305],[735,326],[708,326],[691,307],[689,277],[700,254]]);
    case "innerDoor":
      return pointInPolygon(point, [[837,183],[921,183],[948,208],[949,390],[933,413],[846,413],[829,390],[829,208]]);
    default:
      return pointInRect(point, hotspot.x, hotspot.y, hotspot.w, hotspot.h);
  }
}

function hitTest(point) {
  const hotspots = hotspotList();
  if (isGeneratedMode()) return hotspots.find(h => generatedShapeHit(h, point));
  return hotspots.find(h => point.x >= h.x && point.x <= h.x + h.w && point.y >= h.y && point.y <= h.y + h.h);
}

function isGroundTile(point) {
  if (isGeneratedMode()) {
    // The character's position is anchored at the boots.  This polygon follows
    // only the painted golden deck surface; the dark machinery below the front
    // lip and the open space beyond either end are deliberately excluded.
    return pointInPolygon(point, [
      [72, 414], [180, 405], [326, 407], [476, 397], [632, 407],
      [790, 407], [890, 414], [914, 439], [894, 474], [70, 474], [46, 447]
    ]);
  }
  if (point.y < 510 || point.y > 610) return false;
  const left = point.y < 520 ? 70 : 120 - (point.y - 520) * .42;
  const right = point.y < 520 ? 890 : 840 + (point.y - 520) * .42;
  return point.x >= left && point.x <= right;
}

function movePlayerNear(hotspot, onArrival = null) {
  // Every world interaction is queued and fires only after the character's
  // boots reach its approach point. The ladder then begins its separate climb
  // path from that reached position.
  if (state.onLadder && hotspot.id !== "vent" && hotspot.id !== "ladder") {
    reactNope();
    return;
  }
  if (hotspot.id === "ladder") {
    const ladderPoint = state.onLadder ? ladderTopPoint() : ladderFloorPoint();
    state.player.path = [];
    state.player.currentDone = onArrival;
    state.player.tx = ladderPoint.x;
    state.player.ty = ladderPoint.y;
    return;
  }
  if (hotspot.id === "vent" && state.onLadder) {
    const top = ladderTopPoint();
    state.player.path = [];
    state.player.currentDone = onArrival;
    state.player.tx = top.x;
    state.player.ty = top.y;
    return;
  }
  state.onLadder = false;
  state.player.path = [];
  state.player.currentDone = onArrival;
  const target = generatedArt.usePreview && generatedArt.backgroundReady ? generatedApproachPoint(hotspot) : { x: Math.max(90, Math.min(850, hotspot.x + hotspot.w / 2)), y: 535 };
  state.player.tx = target.x;
  state.player.ty = target.y;
}

function generatedApproachPoint(hotspot) {
  const points = {
    outerDoor: { x: 150, y: 452 },
    locker: { x: 320, y: 448 },
    helmetSpot: { x: 288, y: 456 },
    lever: { x: 610, y: 448 },
    decoyButton: { x: 670, y: 456 },
    cargoCart: { x: state.cartX, y: 456 },
    tag: { x: 620, y: 456 },
    scanner: { x: 725, y: 448 },
    innerDoor: { x: 850, y: 448 }
  };
  return points[hotspot.id] || { x: Math.max(90, Math.min(850, hotspot.x + hotspot.w / 2)), y: 452 };
}

function panelGradient(x, y, w, h, top = art.wall1, bottom = art.wall2) {
  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, top);
  gradient.addColorStop(.52, bottom);
  gradient.addColorStop(1, "#071527");
  return gradient;
}

function drawBolt(x, y, color = art.cyan) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.48)";
  ctx.beginPath();
  ctx.moveTo(-2.5, -1);
  ctx.lineTo(2.5, 1);
  ctx.stroke();
  ctx.restore();
}

function drawPanel(x, y, w, h, color = null) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(20,15,28,.42)";
  ctx.beginPath();
  ctx.roundRect(x + 7, y + 8, w, h, 18);
  ctx.fill();

  ctx.fillStyle = color || panelGradient(x, y, w, h);
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,244,207,.36)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 6, Math.max(4, w - 12), Math.max(4, h - 12), 12);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,244,207,.08)";
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 10, Math.max(4, w - 22), Math.max(4, h * .34), 12);
  ctx.fill();
  ctx.fillStyle = "rgba(18,13,29,.24)";
  ctx.beginPath();
  ctx.roundRect(x + 8, y + h * .63, Math.max(4, w - 16), Math.max(4, h * .26), 10);
  ctx.fill();
  if (w > 52 && h > 42) {
    drawBolt(x + 14, y + 14);
    drawBolt(x + w - 14, y + 14, art.lavender);
    drawBolt(x + 14, y + h - 14, art.gold);
    drawBolt(x + w - 14, y + h - 14);
  }
  ctx.restore();
}

function drawBlob(x, y, rx, ry, color, wobble = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2;
    const r = 1 + Math.sin(a * 3 + wobble) * .08 + Math.cos(a * 5 - wobble) * .05;
    const px = Math.cos(a) * rx * r;
    const py = Math.sin(a) * ry * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPanelLabel(text, x, y, color = art.cream) {
  ctx.save();
  ctx.font = "900 12px sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "1px";
  ctx.fillStyle = color;
  ctx.shadowBlur = 5;
  ctx.shadowColor = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawPaintedPlatform(points, topColor = art.parchment, bodyColor = art.cocoa) {
  ctx.save();
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point[0], point[1]);
    else ctx.lineTo(point[0], point[1]);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(20,15,28,.24)";
  ctx.beginPath();
  ctx.moveTo(116, 548);
  ctx.bezierCurveTo(238, 566, 748, 560, 842, 534);
  ctx.lineTo(840, 610);
  ctx.lineTo(120, 610);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.lineTo(points[1][0], points[1][1]);
  ctx.lineTo(points[1][0] - 34, points[1][1] + 26);
  ctx.bezierCurveTo(690, points[1][1] + 42, 270, points[0][1] + 34, points[0][0] + 18, points[0][1] + 20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0][0] + 18, points[0][1] + 9);
  ctx.bezierCurveTo(270, points[0][1] + 24, 680, points[1][1] + 8, points[1][0] - 24, points[1][1] + 10);
  ctx.stroke();
  ctx.strokeStyle = "rgba(77,56,47,.45)";
  ctx.lineWidth = 3;
  for (let x = 160; x < 815; x += 115) {
    ctx.beginPath();
    ctx.moveTo(x, 534);
    ctx.quadraticCurveTo(x + 10, 548, x - 2, 562);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPuffGrowth(x, y, scale = 1, color = "#f6c856", trunk = art.bark) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = trunk;
  ctx.fillStyle = trunk;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 45);
  ctx.quadraticCurveTo(-10, 18, -4, -12);
  ctx.moveTo(0, 45);
  ctx.quadraticCurveTo(11, 20, 8, -8);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(68,49,38,.35)";
  ctx.lineWidth = 2;
  for (const blob of [[-22, -22, 28], [2, -34, 32], [28, -18, 27], [-3, -8, 35], [-38, -2, 20], [40, 3, 18]]) {
    ctx.beginPath();
    ctx.arc(blob[0], blob[1], blob[2], 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,244,207,.35)";
  ctx.beginPath();
  ctx.arc(-10, -43, 8, 0, Math.PI * 2);
  ctx.arc(18, -28, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHangingLantern(x, y, time, color = art.pink) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,244,207,.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 34, y - 84);
  ctx.quadraticCurveTo(x - 8, y - 58, x, y - 24);
  ctx.stroke();
  ctx.translate(x, y + Math.sin(time * 2.7) * 3);
  ctx.fillStyle = color;
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.roundRect(-13, -20, 26, 32, 12);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.fillRect(-5, -14, 4, 20);
  ctx.restore();
}

function drawTinyCreature(x, y, time, color = "#a775ff") {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 4 + x) * 2);
  ctx.fillStyle = color;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = art.cream;
  ctx.beginPath();
  ctx.arc(-6, -4, 3, 0, Math.PI * 2);
  ctx.arc(7, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.lineTo(-20, 15);
  ctx.moveTo(12, 8);
  ctx.lineTo(19, 15);
  ctx.stroke();
  ctx.restore();
}

function drawCartoonSetDressing(time) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(18,13,29,.72)";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(86, 238);
  ctx.bezierCurveTo(238, 182, 330, 248, 454, 202);
  ctx.bezierCurveTo(606, 148, 722, 210, 878, 174);
  ctx.stroke();
  ctx.strokeStyle = "#7d6b58";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,244,207,.22)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 231);
  ctx.bezierCurveTo(256, 188, 332, 238, 462, 198);
  ctx.bezierCurveTo(610, 158, 724, 204, 862, 174);
  ctx.stroke();

  for (let x = 126; x <= 826; x += 140) {
    ctx.fillStyle = "#2b2535";
    ctx.strokeStyle = art.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, 232 + Math.sin(time + x) * 4, 14, 9, .18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = art.gold;
    ctx.beginPath();
    ctx.arc(x - 4, 230 + Math.sin(time + x) * 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,244,207,.35)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const x = 228 + i * 118;
    ctx.beginPath();
    ctx.moveTo(x, 176);
    ctx.quadraticCurveTo(x + 18, 210 + Math.sin(time * 2 + i) * 6, x - 4, 244);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,244,207,.18)";
  ctx.strokeStyle = "rgba(18,13,29,.6)";
  ctx.lineWidth = 2;
  for (const chip of [[312, 328, 28, 12, -.2], [728, 322, 34, 13, .15], [484, 422, 24, 10, .3], [188, 418, 30, 11, -.32]]) {
    ctx.save();
    ctx.translate(chip[0], chip[1]);
    ctx.rotate(chip[4]);
    ctx.beginPath();
    ctx.roundRect(-chip[2] / 2, -chip[3] / 2, chip[2], chip[3], 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawForegroundCurtain(time) {
  ctx.save();
  ctx.globalAlpha = .92;
  drawBlob(-34, 622, 180, 72, "rgba(27,20,31,.92)", time * .12);
  drawBlob(1012, 624, 190, 76, "rgba(27,20,31,.92)", -time * .12);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,244,207,.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 610);
  ctx.bezierCurveTo(250, 626, 710, 624, 930, 606);
  ctx.stroke();
  ctx.restore();
}

function drawGasCloud(x, y, scale = 1, time = 0, alpha = .85) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#f4c84f";
  ctx.strokeStyle = "rgba(85,61,28,.26)";
  ctx.lineWidth = 2;
  const puffs = [
    [-18, 4, 15],
    [-6, -7, 18],
    [13, -5, 17],
    [24, 8, 13],
    [2, 12, 20],
    [-27, 14, 10]
  ];
  for (let i = 0; i < puffs.length; i++) {
    const [px, py, r] = puffs[i];
    const wobble = Math.sin(time * 3.2 + i * 1.7) * 2.5;
    ctx.beginPath();
    ctx.arc(px + wobble, py + Math.cos(time * 2.6 + i) * 1.5, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,244,207,.36)";
  ctx.beginPath();
  ctx.arc(-10, -13, 5, 0, Math.PI * 2);
  ctx.arc(12, -16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBrokenAlienButton(time) {
  ctx.save();
  drawGasCloud(45, 22, .72 + Math.sin(time * 2.3) * .04, time, .72);
  drawGasCloud(58, 44, .48 + Math.cos(time * 2.1) * .04, time + 1.8, .58);

  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(255,255,255,.5)";
  ctx.beginPath();
  for (let i = 0; i < 36; i++) {
    const t = i / 35;
    const x = -18 + t * 56;
    const y = 8 - t * 22 + Math.sin(t * Math.PI * 8 + time * 3) * (14 - t * 4);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#201f23";
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(44, -18, 26, 34, -.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.beginPath();
  ctx.ellipse(36, -30, 8, 18, .32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.52)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(43, -18, 14, Math.PI * .82, Math.PI * 1.95);
  ctx.moveTo(47, -40);
  ctx.lineTo(45, -26);
  ctx.stroke();

  ctx.fillStyle = "#201f23";
  ctx.strokeStyle = "rgba(255,255,255,.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-6, 8, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f33631";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#f33631";
  ctx.beginPath();
  ctx.arc(-7, 2, 8, Math.PI, 0);
  ctx.lineTo(1, 8);
  ctx.lineTo(-15, 8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.62)";
  ctx.beginPath();
  ctx.arc(-10, -1, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrackedHelmetPickup(time) {
  const bob = Math.sin(time * 3.4) * 2.5;
  const glow = .5 + Math.sin(time * 4.2) * .28;
  ctx.save();
  ctx.translate(374, 462 + bob);
  ctx.rotate(-.12 + Math.sin(time * 2.1) * .025);

  ctx.globalAlpha = .42;
  ctx.fillStyle = "#101022";
  ctx.beginPath();
  ctx.ellipse(0, 28 - bob, 48, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = art.gold;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-34, -11);
  ctx.quadraticCurveTo(-50, -32, -31, -44);
  ctx.moveTo(34, -12);
  ctx.quadraticCurveTo(50, -32, 31, -44);
  ctx.stroke();
  ctx.fillStyle = art.pink;
  ctx.beginPath();
  ctx.arc(-32, -44, 4.5, 0, Math.PI * 2);
  ctx.arc(31, -44, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 16 + glow * 10;
  ctx.shadowColor = "rgba(117,245,238,.55)";
  const shell = ctx.createLinearGradient(-38, -24, 40, 30);
  shell.addColorStop(0, "#e9fbff");
  shell.addColorStop(.32, "#8eefff");
  shell.addColorStop(.72, "#3b7da3");
  shell.addColorStop(1, "#233052");
  ctx.fillStyle = shell;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 43, 29, -.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = art.cyanSoft;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const visor = ctx.createLinearGradient(-28, -15, 22, 12);
  visor.addColorStop(0, "#102136");
  visor.addColorStop(.5, "#1c3f5e");
  visor.addColorStop(1, "#0d1727");
  ctx.fillStyle = visor;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(1, -1, 28, 17, -.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,.52)";
  ctx.beginPath();
  ctx.ellipse(-12, -11, 9, 4, -.55, 0, Math.PI * 2);
  ctx.ellipse(8, -14, 5, 2.5, -.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = art.pink;
  ctx.shadowBlur = 10;
  ctx.shadowColor = art.pink;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-17, -24);
  ctx.lineTo(-5, -7);
  ctx.lineTo(8, -14);
  ctx.lineTo(17, 4);
  ctx.lineTo(30, -2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-19, -25);
  ctx.lineTo(-5, -7);
  ctx.moveTo(8, -14);
  ctx.lineTo(17, 4);
  ctx.stroke();

  ctx.fillStyle = art.gold;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 2;
  for (const dot of [[-34, 10], [-24, 21], [29, 13], [35, -8]]) {
    ctx.beginPath();
    ctx.arc(dot[0], dot[1], 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = `rgba(255,244,207,${.35 + glow * .35})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const r = 48 + i * 7 + glow * 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * .56, -.08, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGeneratedAirlock(time) {
  ctx.drawImage(generatedArt.background, 0, 0, 960, 640);

  drawGeneratedObjectSprites(time);
  if (state.hover) drawGeneratedSpriteHighlight(state.hover.id);
  drawGeneratedGasSprites(time);

  drawPlayer(time);
  drawHover();
}

function drawGeneratedLeverSprite() {
  const frameWidth = generatedArt.lever.naturalWidth / 2;
  const frame = state.pressureEqualized ? 1 : 0;
  ctx.drawImage(
    generatedArt.lever,
    frame * frameWidth, 0, frameWidth, generatedArt.lever.naturalHeight,
    521, 230, 152, 152
  );
}

function drawGeneratedObjectSprites(time) {
  if (!generatedArt.spritesReady) return;

  // Structural interactables are genuine sprites too. These same image
  // objects are re-drawn by drawGeneratedSpriteHighlight() on hover.
  ctx.drawImage(generatedArt.objectOuterHatch, 0, 123.75, 204.375, 281.875);
  ctx.drawImage(generatedArt.objectLocker, 263.125, 218.125, 119.375, 187.5);
  ctx.drawImage(generatedArt.objectLadder, 400, 62.5, 168.75, 393.75);
  ctx.drawImage(generatedArt.objectLeak, 368.75, 46.875, 208.75, 97.5);
  ctx.drawImage(generatedArt.objectScanner, 696.25, 248.125, 51.25, 78.125);
  ctx.drawImage(generatedArt.objectInnerDoor, 829.375, 182.5, 119.375, 233.75);

  // Helmet pickup: it is an independent layer and vanishes as soon as it is
  // collected, combined, or installed over the leak.
  if (!hasItem("helmet") && !hasItem("patchedHelmet") && !state.ventSealed) {
    ctx.drawImage(generatedArt.helmet, 212, 368, 162, 108);
  }

  // Two painted states: raised before pressure is restored, pulled down after.
  drawGeneratedLeverSprite();

  // Two-state alien button sheet: intact is the left cell, broken/sprung is
  // the right cell. Both share the same floor anchor.
  const buttonFrameWidth = generatedArt.buttonSheet.naturalWidth / 2;
  const buttonFrame = state.decoyButtonBroken ? 1 : 0;
  ctx.drawImage(
    generatedArt.buttonSheet,
    buttonFrame * buttonFrameWidth, 0, buttonFrameWidth, generatedArt.buttonSheet.naturalHeight,
    615, 397, 126, 84
  );

  // The cart is a movable sprite, never part of the room painting.
  const cartWobble = performance.now() < state.cartWobbleUntil ? Math.sin(time * 42) * .045 : 0;
  ctx.save();
  ctx.translate(state.cartX, 443);
  ctx.rotate(cartWobble);
  ctx.drawImage(generatedArt.cart, -94, -64, 188, 125);
  ctx.restore();

}

function drawGeneratedGasSprites(time) {
  if (!generatedArt.spritesReady) return;
  // Gas renders after object highlights, so it always visibly rises above the
  // leak instead of being covered by the highlighted vent sprite.
  const gasFrameWidth = generatedArt.gasSheet.naturalWidth / 4;
  const gasFrame = Math.floor(time * 5) % 4;
  if (!state.ventSealed) {
    ctx.globalAlpha = .82;
    ctx.drawImage(generatedArt.gasSheet, gasFrame * gasFrameWidth, 0, gasFrameWidth, generatedArt.gasSheet.naturalHeight, 405, -2, 190, 108);
    ctx.globalAlpha = 1;
  }
  if (state.decoyButtonBroken) {
    const floorGasFrame = (gasFrame + 2) % 4;
    ctx.globalAlpha = .72;
    ctx.drawImage(generatedArt.gasSheet, floorGasFrame * gasFrameWidth, 0, gasFrameWidth, generatedArt.gasSheet.naturalHeight, 620, 360, 150, 92);
    ctx.globalAlpha = 1;
  }
}

function drawAirlock(time) {
  if (generatedArt.usePreview) {
    // Never expose the obsolete canvas placeholder while painted assets load.
    // Present one neutral loading plate, then reveal the complete room at once.
    if (!generatedArt.backgroundReady || !generatedArt.playerReady || !generatedArt.spritesReady) {
      ctx.fillStyle = "#090d18";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }
    drawGeneratedAirlock(time);
    return;
  }

  const pulse = (Math.sin(time * 3) + 1) / 2;
  const bg = ctx.createLinearGradient(0, 0, 960, 640);
  bg.addColorStop(0, "#120f22");
  bg.addColorStop(.46, "#2b244c");
  bg.addColorStop(1, "#143545");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 960, 640);

  drawBlob(128, 80, 220, 84, "rgba(255,201,102,.15)", time * .4);
  drawBlob(785, 112, 250, 96, "rgba(117,245,238,.12)", -time * .33);
  drawBlob(735, 502, 220, 88, "rgba(255,115,191,.09)", time * .25);

  state.stars.forEach(s => {
    ctx.globalAlpha = s.a * (.55 + pulse * .18);
    ctx.fillStyle = s.r > 1.4 ? art.parchment : "#dff9ff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = "rgba(255,211,101,.16)";
  const hullGradient = ctx.createLinearGradient(40, 126, 40, 520);
  hullGradient.addColorStop(0, "#74604d");
  hullGradient.addColorStop(.45, "#504038");
  hullGradient.addColorStop(1, "#2d2835");
  ctx.fillStyle = hullGradient;
  ctx.strokeStyle = "rgba(255,244,207,.26)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(34, 130, 892, 388, 44);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawBlob(198, 192, 178, 76, "rgba(175,157,89,.42)", time * .2);
  drawBlob(448, 194, 220, 78, "rgba(89,111,82,.32)", -time * .28);
  drawBlob(744, 206, 210, 82, "rgba(123,87,63,.36)", time * .18);
  drawBlob(260, 370, 210, 106, "rgba(79,63,48,.46)", -time * .22);
  drawBlob(678, 390, 238, 112, "rgba(49,58,64,.42)", time * .16);

  ctx.fillStyle = "rgba(255,244,207,.08)";
  ctx.beginPath();
  ctx.roundRect(62, 164, 836, 318, 36);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,244,207,.15)";
  ctx.lineWidth = 5;
  for (let x = 104; x < 882; x += 94) {
    ctx.beginPath();
    ctx.moveTo(x, 168);
    ctx.bezierCurveTo(x - 44, 255, x + 28, 360, x - 30, 498);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,211,101,.18)";
  ctx.lineWidth = 2;
  for (let y = 210; y < 472; y += 68) {
    ctx.beginPath();
    ctx.moveTo(72, y);
    ctx.bezierCurveTo(260, y + 28, 690, y - 24, 886, y + 12);
    ctx.stroke();
  }

  drawCartoonSetDressing(time);
  drawHangingLantern(456, 286, time, art.pink);
  drawPuffGrowth(116, 450, .72, "#f2c85d");
  drawPuffGrowth(810, 462, .66, "#eebf57");
  drawTinyCreature(642, 482, time, "#a775ff");

  ctx.fillStyle = "#1d1726";
  ctx.fillRect(0, 510, 960, 130);
  drawPaintedPlatform([[70, 510], [890, 510], [840, 610], [120, 610]], art.parchment, "#3f352e");
  ctx.strokeStyle = "rgba(255,244,207,.2)";
  ctx.lineWidth = 3;
  for (let x = 132; x < 820; x += 74) {
    ctx.beginPath();
    ctx.moveTo(x, 532);
    ctx.lineTo(x - 24, 598);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(28,22,31,.2)";
  ctx.lineWidth = 2;
  for (let y = 538; y <= 586; y += 24) {
    ctx.beginPath();
    ctx.moveTo(106, y);
    ctx.bezierCurveTo(280, y + 10, 680, y - 8, 848, y + 4);
    ctx.stroke();
  }

  drawPanel(34, 270, 122, 245, panelGradient(34, 270, 122, 245, "#172747", "#0b1429"));
  ctx.save();
  ctx.fillStyle = "#2d5274";
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(61, 306, 68, 174, 24);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = art.lavender;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "rgba(129,255,240,.28)";
  ctx.beginPath();
  ctx.roundRect(74, 330, 42, 94, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(82, 344);
  ctx.lineTo(108, 334);
  ctx.stroke();
  ctx.fillStyle = "rgba(18,13,29,.28)";
  ctx.beginPath();
  ctx.roundRect(82, 405, 26, 46, 12);
  ctx.fill();
  ctx.fillStyle = art.gold;
  ctx.beginPath();
  ctx.arc(117, 393, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawPanelLabel("OUTER", 95, 497, art.lavender);

  drawPanel(170, 300, 126, 194, state.lockerOpen ? panelGradient(170, 300, 126, 194, "#356e72", "#173547") : panelGradient(170, 300, 126, 194, "#203a58", "#101c31"));
  ctx.fillStyle = state.lockerOpen ? art.mint : "#446d86";
  ctx.beginPath();
  ctx.roundRect(202, 337, 62, 94, 10);
  ctx.fill();
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = state.lockerOpen ? art.cream : art.gold;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  if (!state.lockerOpen) {
    ctx.fillStyle = art.ink;
    ctx.beginPath();
    ctx.arc(222, 382, 3.5, 0, Math.PI * 2);
    ctx.arc(246, 382, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = art.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(234, 393, 11, Math.PI * .12, Math.PI * .88);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,244,207,.16)";
    ctx.beginPath();
    ctx.ellipse(218, 350, 10, 5, -.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255,255,255,.32)";
    ctx.beginPath();
    ctx.ellipse(226, 358, 13, 6, -.45, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!hasItem("helmet") && !hasItem("patchedHelmet") && !state.ventSealed) {
    drawCrackedHelmetPickup(time);
  }

  drawPanel(506, 112, 124, 92, panelGradient(506, 112, 124, 92, "#233656", "#10182d"));
  ctx.save();
  ctx.strokeStyle = "rgba(18,13,29,.55)";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(512, 132);
  ctx.quadraticCurveTo(480, 118, 454, 142);
  ctx.moveTo(624, 130);
  ctx.quadraticCurveTo(660, 110, 688, 137);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = state.ventSealed ? art.mint : art.pink;
  ctx.shadowBlur = state.ventSealed ? 8 : 18;
  ctx.shadowColor = ctx.fillStyle;
  ctx.beginPath();
  ctx.arc(568, 158, state.ventSealed ? 26 : 22 + pulse * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = art.ink;
  ctx.beginPath();
  ctx.arc(559, 153, 3, 0, Math.PI * 2);
  ctx.arc(577, 153, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = state.ventSealed ? art.ink : art.cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(568, 163, 8, state.ventSealed ? 0 : Math.PI, state.ventSealed ? Math.PI : Math.PI * 2);
  ctx.stroke();
  if (!state.ventSealed) {
    ctx.strokeStyle = `rgba(255,173,223,${.35 + pulse * .45})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(570, 158);
      ctx.lineTo(610 + i * 12, 128 + Math.sin(time * 6 + i) * 20);
      ctx.stroke();
    }
  }

  drawPanel(675, 395, 82, 116, panelGradient(675, 395, 82, 116, "#2f4e68", "#142239"));
  ctx.fillStyle = "rgba(255,255,255,.1)";
  ctx.beginPath();
  ctx.arc(716, 424, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = state.pressureEqualized ? art.mint : art.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(716, 424, 14, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = state.pressureEqualized ? "#6df2d6" : "#f2c45b";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(716, 488);
  ctx.lineTo(716, state.pressureEqualized ? 433 : 459);
  ctx.stroke();
  ctx.fillStyle = state.pressureEqualized ? "#6df2d6" : "#f2c45b";
  ctx.beginPath();
  ctx.arc(716, state.pressureEqualized ? 429 : 455, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = "rgba(18,13,29,.65)";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(545, 229);
  ctx.lineTo(545, 535);
  ctx.moveTo(591, 229);
  ctx.lineTo(591, 535);
  ctx.stroke();
  ctx.strokeStyle = art.gold;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.shadowBlur = state.onLadder ? 10 : 0;
  ctx.shadowColor = art.gold;
  ctx.beginPath();
  ctx.moveTo(550, 228);
  ctx.lineTo(550, 535);
  ctx.moveTo(586, 228);
  ctx.lineTo(586, 535);
  ctx.stroke();
  ctx.lineWidth = 4;
  for (let y = 252; y <= 514; y += 28) {
    ctx.beginPath();
    ctx.moveTo(550, y);
    ctx.quadraticCurveTo(568, y - 8, 586, y - 4);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,211,101,.18)";
  ctx.beginPath();
  ctx.roundRect(536, 220, 64, 18, 8);
  ctx.fill();
  ctx.restore();

  drawPanel(704, 300, 58, 70, panelGradient(704, 300, 58, 70, "#321d45", "#15182d"));
  ctx.save();
  ctx.translate(733, 334);
  if (state.decoyButtonBroken) {
    drawBrokenAlienButton(time);
    if (performance.now() < state.decoyButtonSparkUntil) {
      ctx.strokeStyle = art.gold;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = time * 9 + i * 1.25;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 6);
        ctx.lineTo(Math.cos(a) * 23, Math.sin(a) * 18);
        ctx.stroke();
      }
    }
  } else {
    ctx.shadowBlur = 14;
    ctx.shadowColor = art.pink;
    ctx.fillStyle = art.pink;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffd6ee";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#311829";
    ctx.beginPath();
    ctx.arc(-6, -5, 2.5, 0, Math.PI * 2);
    ctx.arc(7, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#311829";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(1, 5, 6, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  if (state.pressureEqualized) {
    ctx.save();
    ctx.translate(620, 490 + Math.sin(time * 5) * 2);
    ctx.shadowBlur = 12;
    ctx.shadowColor = art.mint;
    ctx.fillStyle = panelGradient(586, 470, 68, 40, "#224f63", "#111f35");
    ctx.strokeStyle = art.mint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-34, -20, 68, 40, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = art.pink;
    ctx.beginPath();
    ctx.arc(-12, -6, 5, 0, Math.PI * 2);
    ctx.arc(12, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = art.cream;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4, 11, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  if (state.tagAvailable && !hasItem("tag") && !state.scannerSpoofed) {
    ctx.save();
    ctx.translate(636, 488);
    ctx.rotate(Math.sin(time * 4) * .08);
    ctx.shadowBlur = 12;
    ctx.shadowColor = art.lavender;
    ctx.fillStyle = art.lavender;
    ctx.strokeStyle = "#fff0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(24, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-24, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  const cartWobble = performance.now() < state.cartWobbleUntil ? Math.sin(time * 42) * .08 : 0;
  ctx.translate(state.cartX, 442 + Math.abs(cartWobble) * 4);
  ctx.rotate(cartWobble);
  ctx.fillStyle = "rgba(18,13,29,.45)";
  ctx.beginPath();
  ctx.ellipse(0, 24, 54, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = panelGradient(state.cartX - 48, 418, 96, 38, "#264f6d", "#14243a");
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-48, -24, 96, 38, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = art.cyanSoft;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(197,149,255,.42)";
  ctx.beginPath();
  ctx.roundRect(-35, -17, 26, 23, 5);
  ctx.roundRect(-2, -19, 36, 25, 5);
  ctx.fill();
  ctx.fillStyle = art.mint;
  ctx.beginPath();
  ctx.arc(-17, -3, 3, 0, Math.PI * 2);
  ctx.arc(18, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = art.mint;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1, 4, 10, 0, Math.PI);
  ctx.stroke();
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(-28, 20, 8, 0, Math.PI * 2);
  ctx.arc(30, 20, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = art.gold;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  drawPanel(772, 238, 70, 120, panelGradient(772, 238, 70, 120, "#243856", "#11182b"));
  ctx.fillStyle = state.scannerSpoofed ? art.mint : art.pink;
  ctx.shadowBlur = 16;
  ctx.shadowColor = ctx.fillStyle;
  ctx.beginPath();
  ctx.arc(807, 292, 18 + pulse * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = art.ink;
  ctx.beginPath();
  ctx.arc(800, 287, 2.5, 0, Math.PI * 2);
  ctx.arc(814, 287, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,244,207,.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(807, 292, 27, Math.PI * .1, Math.PI * .55);
  ctx.stroke();
  ctx.strokeStyle = art.cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(807, 297, 7, state.scannerSpoofed ? 0 : Math.PI, state.scannerSpoofed ? Math.PI : Math.PI * 2);
  ctx.stroke();

  drawPanel(842, 178, 86, 292, state.complete ? panelGradient(842, 178, 86, 292, "#1b6b65", "#102f3c") : panelGradient(842, 178, 86, 292, "#172645", "#0a1022"));
  if (state.complete) {
    ctx.fillStyle = "#030812";
    ctx.beginPath();
    ctx.roundRect(862, 204, 46, 240, 18);
    ctx.fill();
    ctx.fillStyle = "rgba(128,244,212,.28)";
    ctx.beginPath();
    ctx.roundRect(872, 204, 18, 240, 9);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(18,13,29,.28)";
    ctx.beginPath();
    ctx.roundRect(856, 200, 58, 248, 22);
    ctx.fill();
    ctx.strokeStyle = art.ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(860, 205, 50, 238, 18);
    ctx.stroke();
    ctx.strokeStyle = "rgba(128,244,212,.58)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,115,191,.24)";
    ctx.beginPath();
    ctx.arc(886, 326, 8 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPlayer(time);
  drawForegroundCurtain(time);
  drawHover();
}

function drawGeneratedPlayerSprite(time) {
  const p = state.player;
  const reactionNow = performance.now();
  const reacting = reactionNow < state.reactionUntil;
  const dw = 270;
  const dh = 270;
  const footAnchor = dh * .448;

  if (reacting) {
    const reactionElapsed = NOPE_REACTION_MS - (state.reactionUntil - reactionNow);
    const reactionFrame = Math.min(3, Math.max(0, Math.floor(reactionElapsed / 190)));
    const reactionImage = generatedArt.ngSheet;
    const reactionWidth = reactionImage.naturalWidth / 4;
    const reactionHeight = reactionImage.naturalHeight;
    const inset = 2;
    ctx.save();
    ctx.translate(p.x, p.y - footAnchor);
    ctx.drawImage(
      reactionImage,
      reactionFrame * reactionWidth + inset,
      inset,
      reactionWidth - inset * 2,
      reactionHeight - inset * 2,
      -dw / 2,
      -dh / 2,
      dw,
      dh
    );
    ctx.restore();
    return;
  }

  const walking = Math.hypot(p.tx - p.x, p.ty - p.y) > 3;
  const coughCycle = time % 4.2;
  const coughing = !state.ventSealed && !walking && coughCycle > 3.35;
  const coughT = coughing ? Math.min(1, (coughCycle - 3.35) / .85) : 0;
  const coughPulse = coughing ? Math.sin(coughT * Math.PI) : 0;
  const rowMap = { down: 0, right: 1, up: 2, left: 3 };
  const row = rowMap[p.facing] ?? 0;
  const col = walking ? (Math.floor(time * 4.6) % 2 ? 1 : 2) : 0;
  const img = generatedArt.playerSheet;
  const sw = img.naturalWidth / 3;
  const sh = img.naturalHeight / 4;
  const sx = col * sw;
  const sy = row * sh;
  const inset = 2;
  const bob = walking ? Math.sin(time * 9.2) * .6 : Math.sin(time * 4) * .35;
  const lean = coughing ? .08 * coughPulse : 0;
  ctx.save();
  ctx.translate(p.x + coughPulse * 5, p.y - footAnchor + bob);
  ctx.rotate(lean);
  ctx.drawImage(img, sx + inset, sy + inset, sw - inset * 2, sh - inset * 2, -dw / 2, -dh / 2, dw, dh);
  if (coughing) {
    ctx.globalAlpha = .65 * coughPulse;
    drawGasCloud(42 + coughPulse * 10, -34 - coughPulse * 4, .18 + coughPulse * .12, time, .72);
  }
  ctx.restore();
}

function drawPlayer(time) {
  if (generatedArt.usePreview) {
    if (generatedArt.playerReady) drawGeneratedPlayerSprite(time);
    return;
  }

  const p = state.player;
  const reacting = performance.now() < state.reactionUntil;
  const walking = Math.hypot(p.tx - p.x, p.ty - p.y) > 3;
  const coughCycle = time % 4.2;
  const coughing = !state.ventSealed && !reacting && coughCycle > 3.35;
  const coughT = coughing ? Math.min(1, (coughCycle - 3.35) / .85) : 0;
  const coughPulse = coughing ? Math.sin(coughT * Math.PI) : 0;
  const shake = reacting ? Math.sin(time * 38) * 2.5 : 0;
  const squash = reacting ? 1 + Math.sin(time * 34) * .05 : coughing ? 1 + coughPulse * .09 : walking ? 1 + Math.sin(time * 16) * .035 : 1;
  ctx.save();
  ctx.translate(p.x + shake + coughPulse * 5, p.y + Math.sin(time * 8) * 1.5);
  ctx.rotate(coughPulse * .08);
  ctx.scale(1 / squash, squash);
  ctx.strokeStyle = art.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -70);
  ctx.quadraticCurveTo(4, -82, 14, -76);
  ctx.stroke();
  ctx.fillStyle = art.pink;
  ctx.beginPath();
  ctx.arc(15, -76, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2e4460";
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-28, -35, 19, 36, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = art.mint;
  ctx.beginPath();
  ctx.arc(-23, -25, 3, 0, Math.PI * 2);
  ctx.arc(-22, -12, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111a2f";
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 5;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "rgba(117,245,238,.24)";
  ctx.beginPath();
  ctx.roundRect(-13, -40, 26, 44, 10);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#ecfdff";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,211,101,.28)";
  ctx.beginPath();
  ctx.roundRect(-9, -30, 18, 16, 6);
  ctx.fill();
  ctx.strokeStyle = "#ecfdff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  if (reacting) {
    ctx.beginPath();
    ctx.moveTo(-13, -28);
    ctx.quadraticCurveTo(-34, -21, -43, -10);
    ctx.moveTo(13, -28);
    ctx.quadraticCurveTo(34, -21, 43, -10);
    ctx.stroke();
    ctx.fillStyle = art.gold;
    ctx.beginPath();
    ctx.ellipse(-45, -9, 7, 4, -.25, 0, Math.PI * 2);
    ctx.ellipse(45, -9, 7, 4, .25, 0, Math.PI * 2);
    ctx.fill();
  } else if (coughing) {
    ctx.beginPath();
    ctx.moveTo(-13, -28);
    ctx.quadraticCurveTo(-24, -45, -8, -51);
    ctx.moveTo(13, -28);
    ctx.quadraticCurveTo(24, -43, 15, -51);
    ctx.stroke();
    ctx.fillStyle = art.gold;
    ctx.beginPath();
    ctx.ellipse(-9, -51, 6, 4, -.35, 0, Math.PI * 2);
    ctx.ellipse(15, -51, 6, 4, .35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-13, -27);
    ctx.lineTo(-24, -9);
    ctx.moveTo(13, -27);
    ctx.lineTo(24, -9);
    ctx.stroke();
  }
  ctx.fillStyle = art.cyanSoft;
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, -52, 19, 18, -.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#ecfdff";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.beginPath();
  ctx.ellipse(-7, -60, 5, 3, -.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#102136";
  ctx.strokeStyle = "rgba(18,13,29,.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(4, -53, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = reacting || coughing ? art.gold : "#dffcff";
  ctx.beginPath();
  if (coughing) {
    ctx.ellipse(1, -56, 3, .9, 0, 0, Math.PI * 2);
    ctx.ellipse(9, -56, 3, .9, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(1, -56, 1.7, 0, Math.PI * 2);
    ctx.arc(9, -56, 1.7, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.fillStyle = "rgba(255,115,191,.55)";
  ctx.beginPath();
  ctx.arc(-5, -51, 2.5, 0, Math.PI * 2);
  ctx.arc(13, -51, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = reacting || coughing ? art.gold : art.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (reacting) {
    ctx.arc(5, -48, 5, Math.PI * 1.12, Math.PI * 1.88);
  } else if (coughing) {
    ctx.arc(8, -49, 4 + coughPulse * 2, 0, Math.PI * 2);
  } else {
    ctx.moveTo(0, -50);
    ctx.lineTo(11, -50);
  }
  ctx.stroke();
  if (coughing) {
    ctx.save();
    ctx.globalAlpha = .65 * coughPulse;
    drawGasCloud(34 + coughPulse * 12, -54 - coughPulse * 5, .22 + coughPulse * .18, time, .75);
    ctx.restore();
  }
  ctx.strokeStyle = art.gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-9, 5);
  ctx.lineTo(-15 + Math.sin(time * 16) * (walking ? 4 : 0), 23);
  ctx.moveTo(9, 5);
  ctx.lineTo(15 - Math.sin(time * 16) * (walking ? 4 : 0), 23);
  ctx.stroke();
  ctx.fillStyle = "#26314b";
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(-16 + Math.sin(time * 16) * (walking ? 4 : 0), 25, 9, 5, -.12, 0, Math.PI * 2);
  ctx.ellipse(16 - Math.sin(time * 16) * (walking ? 4 : 0), 25, 9, 5, .12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = art.gold;
  ctx.beginPath();
  ctx.arc(-16 + Math.sin(time * 16) * (walking ? 4 : 0), 25, 2, 0, Math.PI * 2);
  ctx.arc(16 - Math.sin(time * 16) * (walking ? 4 : 0), 25, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawComicEffects(time) {
  for (const effect of state.comicEffects) {
    const t = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, effect.life / effect.maxLife);
    const y = effect.y - t * 46;
    const scale = 1 + Math.sin(t * Math.PI) * .35;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(effect.x + Math.sin(time * 7 + effect.wobble) * 5, y);
    ctx.rotate(Math.sin(time * 8 + effect.wobble) * .08);
    ctx.scale(scale, scale);
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    ctx.lineWidth = 3;
    if (effect.kind === "psshh" || effect.kind === "whoosh") {
      for (let i = 0; i < 7; i++) {
        const yy = -18 + i * 6;
        ctx.beginPath();
        ctx.moveTo(-38 - t * 22, yy);
        ctx.quadraticCurveTo(-8, yy - 10 * Math.sin(time * 8 + i), 36 + t * 34, yy + 3);
        ctx.stroke();
      }
    } else if (effect.kind === "squish") {
      for (let i = 0; i < 5; i++) {
        const a = effect.wobble + i * Math.PI * .42;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 18, Math.sin(a) * 9, 12 - t * 5, 7 + t * 8, a, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (effect.kind === "ding" || effect.kind === "pop" || effect.kind === "yoink") {
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.arc(0, 0, 10 + r * 13 + t * 18, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + effect.wobble;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
        ctx.lineTo(Math.cos(a) * (28 + t * 12), Math.sin(a) * (28 + t * 12));
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 8; i++) {
        const a = effect.wobble + i * Math.PI * .25 + t * 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
        ctx.lineTo(Math.cos(a) * (38 + t * 20), Math.sin(a) * (24 + t * 20));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 12 + t * 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawGeneratedSpriteHighlight(id) {
  if (!generatedArt.spritesReady) return false;
  ctx.save();
  ctx.globalAlpha = .96;
  ctx.filter = "drop-shadow(3px 0 #ffd365) drop-shadow(-3px 0 #ffd365) drop-shadow(0 3px #ffd365) drop-shadow(0 -3px #ffd365)";
  switch (id) {
    case "outerDoor":
      ctx.drawImage(generatedArt.highlightOuterHatch, 0, 123.75, 204.375, 281.875);
      break;
    case "locker":
      ctx.drawImage(generatedArt.highlightLocker, 263.125, 218.125, 119.375, 187.5);
      break;
    case "ladder":
      ctx.drawImage(generatedArt.highlightLadder, 400, 62.5, 168.75, 393.75);
      break;
    case "vent":
      ctx.drawImage(generatedArt.highlightLeak, 384.375, 43.75, 197.5, 90);
      break;
    case "scanner":
      ctx.drawImage(generatedArt.objectScanner, 696.25, 248.125, 51.25, 78.125);
      break;
    case "innerDoor":
      ctx.drawImage(generatedArt.objectInnerDoor, 829.375, 182.5, 119.375, 233.75);
      break;
    case "helmetSpot":
      ctx.drawImage(generatedArt.helmet, 212, 368, 162, 108);
      break;
    case "lever":
      drawGeneratedLeverSprite();
      break;
    case "decoyButton": {
      const frameWidth = generatedArt.buttonSheet.naturalWidth / 2;
      const frame = state.decoyButtonBroken ? 1 : 0;
      ctx.drawImage(generatedArt.buttonSheet, frame * frameWidth, 0, frameWidth, generatedArt.buttonSheet.naturalHeight, 615, 397, 126, 84);
      break;
    }
    case "cargoCart":
      ctx.translate(state.cartX, 443);
      ctx.drawImage(generatedArt.cart, -94, -64, 188, 125);
      break;
    default:
      ctx.restore();
      return false;
  }
  ctx.restore();
  return true;
}

const generatedSpriteHighlightIds = new Set([
  "outerDoor", "locker", "ladder", "vent", "scanner", "innerDoor",
  "helmetSpot", "lever", "decoyButton", "cargoCart"
]);

function drawHover() {
  const h = state.hover;
  if (!h) return;
  ctx.save();
  if (generatedArt.usePreview && generatedArt.backgroundReady) {
    ctx.strokeStyle = "rgba(255,211,101,.98)";
    ctx.shadowBlur = 14;
    ctx.shadowColor = "rgba(255,211,101,.85)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
    const highlightedSprite = generatedArt.spritesReady && generatedSpriteHighlightIds.has(h.id);
    if (!highlightedSprite) {
      ctx.beginPath();
      if (tracedHotspots[h.id]) {
        tracedHotspots[h.id].draw();
      } else {
        switch (h.id) {
          case "tag":
            ctx.ellipse(636, 488, 42, 30, 0, 0, Math.PI * 2);
            break;
          default:
          ctx.roundRect(h.x, h.y, h.w, h.h, 14);
        }
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(43,37,53,.88)";
    ctx.strokeStyle = "rgba(255,211,101,.75)";
    ctx.lineWidth = 1.5;
    const labelWidth = Math.max(112, ctx.measureText(h.label).width + 28);
    const x = Math.min(930 - labelWidth, Math.max(20, h.x + h.w / 2 - labelWidth / 2));
    const y = Math.max(18, h.y - 38);
    ctx.beginPath();
    ctx.roundRect(x, y, labelWidth, 28, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff3c5";
    ctx.font = "700 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(h.label, x + labelWidth / 2, y + 18);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = "rgba(242,196,91,.92)";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(h.x, h.y, h.w, h.h);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(4,9,18,.88)";
  ctx.strokeStyle = "rgba(242,196,91,.8)";
  ctx.lineWidth = 1;
  const labelWidth = Math.max(112, ctx.measureText(h.label).width + 28);
  const x = Math.min(930 - labelWidth, Math.max(20, h.x + h.w / 2 - labelWidth / 2));
  const y = Math.max(18, h.y - 38);
  ctx.beginPath();
  ctx.roundRect(x, y, labelWidth, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff3c5";
  ctx.font = "700 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(h.label, x + labelWidth / 2, y + 18);
  ctx.restore();
}

function update(dt) {
  const cartDx = state.cartTargetX - state.cartX;
  if (Math.abs(cartDx) > .5) state.cartX += Math.sign(cartDx) * Math.min(Math.abs(cartDx), 360 * dt);
  // Freeze any existing walk/climb path during the shrug. The queued path may
  // resume only after the reaction's full duration has elapsed.
  if (playerIsReacting()) return;
  const p = state.player;
  const dx = p.tx - p.x;
  const dy = p.ty - p.y;
  const distance = Math.hypot(dx, dy);
  if (distance > 1) {
    if (p.forcedFacing) p.facing = p.forcedFacing;
    else if (Math.abs(dx) > Math.abs(dy)) p.facing = dx >= 0 ? "right" : "left";
    else if (Math.abs(dy) > 0.5) p.facing = dy >= 0 ? "down" : "up";
    const step = Math.min(distance, 285 * dt);
    p.x += dx / distance * step;
    p.y += dy / distance * step;
  } else {
    p.x = p.tx;
    p.y = p.ty;
    if (p.currentDone) {
      const done = p.currentDone;
      p.currentDone = null;
      done();
    }
    if (p.path.length) {
      const next = p.path.shift();
      p.forcedFacing = next.facing || null;
      p.tx = next.x;
      p.ty = next.y;
      p.currentDone = next.done || null;
    } else {
      p.forcedFacing = null;
    }
  }
}

function loop(time) {
  const dt = Math.min(.04, (time - last) / 1000 || 0);
  last = time;
  updateController(dt);
  update(dt);
  drawAirlock(time / 1000);
  requestAnimationFrame(loop);
}

canvas.addEventListener("mousemove", event => {
  const hit = hitTest(canvasPoint(event));
  state.hover = hit || null;
  canvas.style.cursor = hit ? "pointer" : "default";
});

canvas.addEventListener("mouseleave", () => {
  state.hover = null;
  canvas.style.cursor = "default";
});

canvas.addEventListener("click", event => {
  activatePoint(canvasPoint(event));
});

ui.clear.addEventListener("click", () => {
  state.selected = null;
  setLog("Item put away.");
  updateUI();
});

updateUI();
requestAnimationFrame(loop);
