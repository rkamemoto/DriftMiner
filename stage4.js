"use strict";

document.documentElement.classList.add("stage-four-document");

const canvas = document.querySelector("#stageFourCanvas");
const ctx = canvas.getContext("2d");
const generatedArt = {
  usePreview: true,
  background: new Image(),
  playerSheet: new Image(),
  coughSheet: new Image(),
  ngSheet: new Image(),
  disgustSheet: new Image(),
  cart: new Image(),
  alienToy: new Image(),
  alienToyHugSheet: new Image(),
  helmet: new Image(),
  maintenanceTag: new Image(),
  sealedHelmet: new Image(),
  maintenanceDrawer: new Image(),
  lever: new Image(),
  buttonSheet: new Image(),
  gasSheet: new Image(),
  highlightOuterHatch: new Image(),
  highlightLocker: new Image(),
  highlightLadder: new Image(),
  highlightLeak: new Image(),
  objectOuterHatch: new Image(),
  outerHatchClosed: new Image(),
  objectLocker: new Image(),
  objectLadder: new Image(),
  objectLeak: new Image(),
  objectScanner: new Image(),
  objectInnerDoor: new Image(),
  hallwayBackground: new Image(),
  hallwayUtilityOpenBackground: new Image(),
  hallwayBothOpenBackground: new Image(),
  hallwayProps: new Image(),
  hallwayPaperArt: new Image(),
  hallwayRag: new Image(),
  hallwayDirt: new Image(),
  hallwayRope: new Image(),
  utilityBackground: new Image(),
  utilityBackgroundDoorOpen: new Image(),
  utilityHose: new Image(),
  utilityCleanRag: new Image(),
  utilityToolkit: new Image(),
  utilityToolkitOpen: new Image(),
  utilityWrench: new Image(),
  utilitySlimeBox: new Image(),
  utilitySlimeReaction: new Image(),
  utilityWire: new Image(),
  utilityWirePull: new Image(),
  utilityWirePullPlayer: new Image(),
  utilityWirePullHands: new Image(),
  utilityRoutedCable: new Image(),
  utilityDoorOpenOverlay: new Image(),
  utilityVentPaw: new Image(),
  utilityVentPlayer: new Image(),
  utilityDoorButton: new Image(),
  utilityEmptyBox: new Image(),
  bathroomBackground: new Image(),
  bathroomClosedBackground: new Image(),
  bathroomTrashSprite: new Image(),
  bathroomJanitorCart: new Image(),
  bathroomDoorLeft: new Image(),
  bathroomDoorRight: new Image(),
  bathroomExitHighlightMask: new Image(),
  bathroomTrashHighlightMask: new Image(),
  bathroomBowl: new Image(),
  bathroomMud: new Image(),
  bathroomFaucetLeft: new Image(),
  bathroomFaucetMiddle: new Image(),
  bathroomFaucetRight: new Image(),
  bathroomFaucetWaterLeft: new Image(),
  bathroomFaucetWaterMiddle: new Image(),
  bathroomFaucetWaterRight: new Image(),
  bathroomSecretPanelOpenReference: new Image(),
  bathroomSteamMirrorSheet: new Image(),
  backgroundReady: false,
  playerReady: false,
  spritesReady: false
};
generatedArt.background.onload = () => generatedArt.backgroundReady = true;
const updateStageFourPlayerReadiness = () => generatedArt.playerReady =
  generatedArt.playerSheet.complete && generatedArt.playerSheet.naturalWidth > 0 &&
  generatedArt.coughSheet.complete && generatedArt.coughSheet.naturalWidth > 0 &&
  generatedArt.ngSheet.complete && generatedArt.ngSheet.naturalWidth > 0 &&
  generatedArt.disgustSheet.complete && generatedArt.disgustSheet.naturalWidth > 0;
generatedArt.playerSheet.onload = updateStageFourPlayerReadiness;
generatedArt.coughSheet.onload = updateStageFourPlayerReadiness;
generatedArt.ngSheet.onload = updateStageFourPlayerReadiness;
generatedArt.disgustSheet.onload = updateStageFourPlayerReadiness;
const stageFourSpriteImages = [
  generatedArt.cart, generatedArt.alienToy, generatedArt.alienToyHugSheet, generatedArt.helmet, generatedArt.maintenanceTag, generatedArt.sealedHelmet, generatedArt.maintenanceDrawer, generatedArt.lever, generatedArt.buttonSheet, generatedArt.gasSheet,
  generatedArt.highlightOuterHatch, generatedArt.highlightLocker, generatedArt.highlightLadder, generatedArt.highlightLeak,
  generatedArt.objectOuterHatch, generatedArt.outerHatchClosed, generatedArt.objectLocker, generatedArt.objectLadder,
  generatedArt.objectLeak, generatedArt.objectScanner, generatedArt.objectInnerDoor,
  generatedArt.hallwayBackground, generatedArt.hallwayUtilityOpenBackground, generatedArt.hallwayBothOpenBackground,
  generatedArt.hallwayProps, generatedArt.hallwayPaperArt,
  generatedArt.hallwayRag, generatedArt.hallwayDirt, generatedArt.hallwayRope,
  generatedArt.utilityBackground, generatedArt.utilityBackgroundDoorOpen, generatedArt.utilityHose, generatedArt.utilityCleanRag,
  generatedArt.utilityToolkit, generatedArt.utilityToolkitOpen, generatedArt.utilityWrench, generatedArt.utilitySlimeBox, generatedArt.utilitySlimeReaction,
  generatedArt.utilityWire, generatedArt.utilityWirePull, generatedArt.utilityWirePullPlayer, generatedArt.utilityWirePullHands, generatedArt.utilityRoutedCable, generatedArt.utilityDoorOpenOverlay,
  generatedArt.utilityVentPaw, generatedArt.utilityVentPlayer, generatedArt.utilityDoorButton, generatedArt.utilityEmptyBox,
  generatedArt.bathroomBackground, generatedArt.bathroomClosedBackground, generatedArt.bathroomTrashSprite, generatedArt.bathroomJanitorCart, generatedArt.bathroomDoorLeft, generatedArt.bathroomDoorRight,
  generatedArt.bathroomExitHighlightMask, generatedArt.bathroomTrashHighlightMask, generatedArt.bathroomBowl, generatedArt.bathroomMud,
  generatedArt.bathroomFaucetLeft, generatedArt.bathroomFaucetMiddle, generatedArt.bathroomFaucetRight,
  generatedArt.bathroomFaucetWaterLeft, generatedArt.bathroomFaucetWaterMiddle, generatedArt.bathroomFaucetWaterRight,
  generatedArt.bathroomSecretPanelOpenReference,
  generatedArt.bathroomSteamMirrorSheet
];
const updateStageFourSpriteReadiness = () => generatedArt.spritesReady = stageFourSpriteImages.every(image => image.complete && image.naturalWidth > 0);
stageFourSpriteImages.forEach(image => image.onload = updateStageFourSpriteReadiness);
generatedArt.background.src = "assets/stage4/level1-airlock/airlock-background-toy-clean-v2.png?v=stage4-alien-toy-2";
generatedArt.playerSheet.src = "assets/stage4/level1-airlock/player-sheet-cells-v8.png?v=stage4-all-direction-size-match-1";
generatedArt.coughSheet.src = "assets/stage4/level1-airlock/player-cough-cells-v1.png?v=stage4-painted-cough-1";
generatedArt.ngSheet.src = "assets/stage4/level1-airlock/player-ng-reaction-cells-v2.png?v=stage4-player-size-match-1";
generatedArt.disgustSheet.src = "assets/stage4/level4-bathroom/player-disgust-gag-sheet-v1.png?v=stage4-disgust-gag-1";
generatedArt.cart.src = "assets/stage4/level1-airlock/cart-sprite-v1.png?v=stage4-level1-folder-1";
generatedArt.alienToy.src = "assets/stage4/level1-airlock/alien-toy-sprite-v1.png?v=stage4-alien-toy-1";
generatedArt.alienToyHugSheet.src = "assets/stage4/level1-airlock/alien-toy-hug-sheet-v1.png?v=stage4-alien-toy-hug-1";
generatedArt.helmet.src = "assets/stage4/level1-airlock/helmet-sprite-v1.png?v=stage4-level1-folder-1";
generatedArt.maintenanceTag.src = "assets/stage4/level1-airlock/maintenance-tag-world-v1.png?v=stage4-item-sprites-1";
generatedArt.sealedHelmet.src = "assets/stage4/level1-airlock/sealed-helmet-installed-world-v1.png?v=stage4-sealed-helmet-1";
generatedArt.maintenanceDrawer.src = "assets/stage4/level1-airlock/maintenance-drawer-open-world-v1.png?v=stage4-tag-drop-1";
generatedArt.lever.src = "assets/stage4/level1-airlock/lever-sheet-v1.png?v=stage4-lever-two-state-1";
generatedArt.buttonSheet.src = "assets/stage4/level1-airlock/alien-button-sheet-v1.png?v=stage4-level1-folder-1";
generatedArt.gasSheet.src = "assets/stage4/level1-airlock/leak-gas-sheet-v1.png?v=stage4-level1-folder-1";
generatedArt.highlightOuterHatch.src = "assets/stage4/level1-airlock/hover-outer-hatch-solid-v1.png?v=stage4-level1-folder-1";
generatedArt.highlightLocker.src = "assets/stage4/level1-airlock/hover-locker-solid-v1.png?v=stage4-level1-folder-1";
generatedArt.highlightLadder.src = "assets/stage4/level1-airlock/highlight-ladder-v4.png?v=stage4-ladder-outline-4";
generatedArt.highlightLeak.src = "assets/stage4/level1-airlock/object-leak-v5.png?v=stage4-level1-folder-1";
generatedArt.objectOuterHatch.src = "assets/stage4/level1-airlock/object-outer-hatch-v1.png?v=stage4-level1-folder-1";
generatedArt.outerHatchClosed.src = "assets/stage4/level1-airlock/outer-hatch-closed-v1.png?v=stage4-outer-hatch-close-1";
generatedArt.objectLocker.src = "assets/stage4/level1-airlock/locker-sprite-full-v3.png?v=stage4-locker-clean-interior-2";
generatedArt.objectLadder.src = "assets/stage4/level1-airlock/object-ladder-clean-v5.png?v=stage4-plush-overlay-fix-1";
generatedArt.objectLeak.src = "assets/stage4/level1-airlock/object-leak-v2.png?v=stage4-level1-folder-1";
generatedArt.objectScanner.src = "assets/stage4/level1-airlock/object-scanner-display-v5.png?v=stage4-level1-folder-1";
generatedArt.objectInnerDoor.src = "assets/stage4/level1-airlock/object-inner-door-v3.png?v=stage4-level1-folder-1";
generatedArt.hallwayBackground.src = "assets/stage4/level2-hallway/hallway-background-three-tone-buttons-v1.png?v=stage4-hallway-three-tones-1";
generatedArt.hallwayUtilityOpenBackground.src = "assets/stage4/level2-hallway/hallway-background-utility-open-v1.png?v=stage4-hallway-open-doors-1";
generatedArt.hallwayBothOpenBackground.src = "assets/stage4/level2-hallway/hallway-background-both-open-v1.png?v=stage4-hallway-open-doors-1";
generatedArt.hallwayProps.src = "assets/stage4/level2-hallway/hallway-props-v1.png?v=stage4-hallway-1";
generatedArt.hallwayPaperArt.src = "assets/stage4/level2-hallway/paper-art-v1.png?v=stage4-hallway-paper-1";
generatedArt.hallwayRag.src = "assets/stage4/level2-hallway/rag-sprite-v1.png?v=stage4-hallway-items-1";
generatedArt.hallwayDirt.src = "assets/stage4/level2-hallway/dirt-sprite-v1.png?v=stage4-hallway-items-1";
generatedArt.hallwayRope.src = "assets/stage4/level2-hallway/makeshift-rag-rope-v1.png?v=stage4-rag-rope-1";
generatedArt.utilityBackground.src = "assets/stage4/level3-utility-closet/utility-closet-background-v5.png?v=stage4-utility-button-sprite-1";
generatedArt.utilityBackgroundDoorOpen.src = "assets/stage4/level3-utility-closet/utility-closet-background-door-open-v1.png?v=stage4-utility-door-open-art-1";
generatedArt.utilityHose.src = "assets/stage4/level3-utility-closet/hose-sprite-v1.png?v=stage4-utility-props-1";
generatedArt.utilityCleanRag.src = "assets/stage4/level3-utility-closet/clean-rag-sprite-v1.png?v=stage4-clean-rag-full-sprite-1";
generatedArt.utilityToolkit.src = "assets/stage4/level3-utility-closet/toolbox-closed-in-room-v1.png?v=stage4-toolbox-in-room-1";
generatedArt.utilityToolkitOpen.src = "assets/stage4/level3-utility-closet/toolbox-sheet-v2.png?v=stage4-toolbox-rendered-2";
generatedArt.utilityWrench.src = "assets/stage4/level3-utility-closet/wrench-sprite-v1.png?v=stage4-utility-props-1";
generatedArt.utilitySlimeBox.src = "assets/stage4/level3-utility-closet/slime-box-sprite-v1.png?v=stage4-utility-props-1";
generatedArt.utilitySlimeReaction.src = "assets/stage4/level3-utility-closet/player-slime-reaction-v3.png?v=stage4-slime-painted-2";
generatedArt.utilityWire.src = "assets/stage4/level3-utility-closet/stuck-cable-end-v3.png?v=stage4-cable-fade-1";
generatedArt.utilityWirePull.src = "assets/stage4/level3-utility-closet/stuck-cable-pull-v2.png?v=stage4-cable-pull-2";
generatedArt.utilityWirePullPlayer.src = "assets/stage4/level3-utility-closet/player-wire-pull-v1.png?v=stage4-wire-pull-1";
generatedArt.utilityWirePullHands.src = "assets/stage4/level3-utility-closet/player-wire-hands-overlay-v1.png?v=stage4-wire-hands-overlay-1";
generatedArt.utilityRoutedCable.src = "assets/stage4/level3-utility-closet/routed-cable-to-panel-v2.png?v=stage4-routed-cable-hose-tie-1";
generatedArt.utilityDoorOpenOverlay.src = "assets/stage4/level3-utility-closet/utility-center-door-open-overlay-v2.png?v=stage4-utility-door-open-clean-1";
generatedArt.utilityVentPaw.src = "assets/stage4/level3-utility-closet/alien-vent-paw-green-concept-v1.png?v=stage4-vent-paw-green-1";
generatedArt.utilityVentPlayer.src = "assets/stage4/level3-utility-closet/player-vent-swipe-reaction-v1.png?v=stage4-vent-player-art-1";
generatedArt.utilityDoorButton.src = "assets/stage4/level3-utility-closet/door-blue-button-sprite-v1.png?v=stage4-utility-button-sprite-1";
generatedArt.utilityEmptyBox.src = "assets/stage4/level3-utility-closet/light-parts-box-sprite-v1.png?v=stage4-light-parts-crate-1";
generatedArt.bathroomBackground.src = "assets/stage4/level4-bathroom/bathroom-background-open-clean-v3.png?v=stage4-bathroom-filthy-toilet-1";
generatedArt.bathroomClosedBackground.src = "assets/stage4/level4-bathroom/bathroom-background-faucets-interactable-v3.png?v=stage4-room-sprites-3";
generatedArt.bathroomTrashSprite.src = "assets/stage4/level4-bathroom/bathroom-trash-sprite-v1.png?v=stage4-room-sprites-1";
generatedArt.bathroomJanitorCart.src = "assets/stage4/level4-bathroom/bathroom-janitor-cart-sprite-v1.png?v=stage4-room-sprites-1";
generatedArt.bathroomDoorLeft.src = "assets/stage4/level4-bathroom/stall-door-left-v1.png?v=stage4-bathroom-1";
generatedArt.bathroomDoorRight.src = "assets/stage4/level4-bathroom/stall-door-right-v1.png?v=stage4-bathroom-1";
generatedArt.bathroomExitHighlightMask.src = "assets/stage4/level4-bathroom/bathroom-exit-highlight-mask-v1.png?v=stage4-bathroom-alpha-highlights-1";
generatedArt.bathroomTrashHighlightMask.src = "assets/stage4/level4-bathroom/bathroom-trash-highlight-mask-v1.png?v=stage4-bathroom-alpha-highlights-1";
generatedArt.bathroomBowl.src = "assets/stage4/level4-bathroom/alien-bowl-shelf-mask-v1.png?v=stage4-real-shelf-bowl-mask-1";
generatedArt.bathroomMud.src = "assets/stage4/level4-bathroom/muddy-filth-v1.png?v=stage4-bathroom-1";
generatedArt.bathroomFaucetLeft.src = "assets/stage4/level4-bathroom/faucet-left-original-sprite-v2.png?v=stage4-original-faucet-sprites-1";
generatedArt.bathroomFaucetMiddle.src = "assets/stage4/level4-bathroom/faucet-middle-original-sprite-v2.png?v=stage4-original-faucet-sprites-1";
generatedArt.bathroomFaucetRight.src = "assets/stage4/level4-bathroom/faucet-right-original-sprite-v3.png?v=stage4-right-faucet-outline-1";
generatedArt.bathroomFaucetWaterLeft.src = "assets/stage4/level4-bathroom/faucet-water-left-art-v1.png?v=stage4-rendered-faucet-water-1";
generatedArt.bathroomFaucetWaterMiddle.src = "assets/stage4/level4-bathroom/faucet-water-middle-art-v1.png?v=stage4-rendered-faucet-water-1";
generatedArt.bathroomFaucetWaterRight.src = "assets/stage4/level4-bathroom/faucet-water-right-art-v1.png?v=stage4-rendered-faucet-water-1";
generatedArt.bathroomSecretPanelOpenReference.src = "assets/stage4/level4-bathroom/bathroom-secret-panel-open-user-reference-v1.png?v=stage4-secret-panel-user-reference-3";
generatedArt.bathroomSteamMirrorSheet.src = "assets/stage4/level4-bathroom/bathroom-steam-mirror-sheet-v1.png?v=stage4-steam-code-1";

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
  helmet: { name: "Cracked Helmet", sprite: "assets/stage4/level1-airlock/inventory-helmet-v1.png", description: "A damaged alien helmet. Big enough to cover the vent." },
  sealant: { name: "Sealant Patch", sprite: "assets/stage4/level1-airlock/inventory-sealant-v1.png", description: "Emergency hull sealant. Sticky, cold, and probably alive." },
  patchedHelmet: { name: "Patched Helmet", sprite: "assets/stage4/level1-airlock/inventory-patched-helmet-v1.png", description: "A cracked helmet sealed with emergency patching gel." },
  tag: { name: "Maintenance Tag", sprite: "assets/stage4/level1-airlock/inventory-maintenance-tag-v1.png", description: "A twitchy access tag coughed up by the repair bot." },
  rag: { name: "Grimy Rag", sprite: "assets/stage4/level2-hallway/rag-sprite-v1.png", description: "A surprisingly soft rag with several mysterious stains." },
  dirt: { name: "Alien Dirt", sprite: "assets/stage4/level2-hallway/dirt-sprite-v1.png", description: "Purple soil with tiny cyan mineral sparks." },
  ragShreds: { name: "Rag Shreds", sprite: "assets/stage4/level2-hallway/rag-sprite-v1.png", description: "Tough fabric strips torn into useful lengths." },
  hose: { name: "Maintenance Hose", sprite: "assets/stage4/level3-utility-closet/hose-sprite-v1.png", description: "A flexible alien hose with two incompatible-looking couplings." },
  cleanRag: { name: "Clean Rag", sprite: "assets/stage4/level3-utility-closet/clean-rag-shelf-inplace-v3.png", description: "A surprisingly pristine maintenance cloth." },
  wrench: { name: "Alien Wrench", sprite: "assets/stage4/level3-utility-closet/wrench-sprite-v1.png", description: "A heavy double-ended wrench from the utility toolkit." },
  bowl: { name: "Alien Bowl", sprite: "assets/stage4/level4-bathroom/alien-bowl-shelf-mask-v1.png", description: "A shallow bowl recovered from the alien washroom shelf." }
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
let lastCoughCycle = -1;
let lastCoughBeat = 0;
let outerDoorCloseTimer = 0;
const combineTwinkleSfx = new Audio("assets/stage4/audio/combine-twinkle-sample-v1.wav?v=stage4-combine-twinkle-1");
combineTwinkleSfx.preload = "auto";
const CART_LEFT_X = 350;
const CART_RIGHT_X = 462;
const OUTER_HATCH_CLOSE_MS = 900;
const state = {
  room: "airlock",
  inventory: [],
  selected: null,
  hover: null,
  lockerOpen: false,
  ventSealed: false,
  leverPulled: false,
  outerDoorClosed: false,
  outerDoorCloseStart: 0,
  pressureEqualized: false,
  tagAvailable: false,
  tagReleaseStart: 0,
  scannerSpoofed: false,
  complete: false,
  innerDoorOpenStart: 0,
  innerDoorRejectUntil: 0,
  // Future art pass: interactables should get two-state overlays/animations
  // so picked-up/opened objects differ from the baked background painting.
  reactionUntil: 0,
  reactionKind: null,
  decoyButtonBroken: false,
  decoyButtonSparkUntil: 0,
  onLadder: false,
  cartLeft: false,
  cartX: CART_RIGHT_X,
  cartTargetX: CART_RIGHT_X,
  cartWobbleUntil: 0,
  toyExamining: false,
  toyInspectStart: 0,
  toyInspectUntil: 0,
  hallwayEffect: null,
  hallwayEffectUntil: 0,
  hallwayTonePulse: null,
  hallwayTonePulseUntil: 0,
  hallwayDoorToneProgress: 0,
  hallDoorAOpen: false,
  hallDoorAOpenStart: 0,
  hallwayCleanerX: 780,
  hallwayCleanerTargetX: 780,
  hallwayRagCollected: false,
  hallwayDirtCollected: false,
  hallwayDirtSpilled: false,
  hallwayDirtX: 600,
  hallwayCleanerMode: "idle",
  hallwayCleanerActionStart: 0,
  hallwayRagShredsAvailable: false,
  hallwayRagShredsCollected: false,
  hallwayRagShredsX: 600,
  hallwayRopeInstalled: false,
  hallwayRopeTying: false,
  hallwayRopeTieStart: 0,
  hallwayVentClimbing: false,
  utilityEntryAnimating: false,
  utilityEntryStart: 0,
  utilityHoseCollected: false,
  utilityCleanRagCollected: false,
  utilityToolkitOpen: false,
  utilityWrenchCollected: false,
  utilityDoorPanelOpen: false,
  utilityCableRouted: false,
  utilityPowerStart: 0,
  utilityDoorOpen: false,
  utilitySlimeBoxFallen: false,
  utilitySlimed: false,
  utilityAction: null,
  bathroomLeftDoorOpen: false,
  bathroomRightDoorOpen: false,
  bathroomBowlCollected: false,
  bathroomFaucets: [false, false, false],
  bathroomSecretPanelOpen: false,
  bathroomSecretPanelStart: 0,
  bathroomAllFaucetsStart: 0,
  bathroomSteamRevealStart: 0,
  bathroomMirrorCodeRevealed: false,
  hallwayPickup: null,
  keypadOpen: false,
  keypadEntry: "",
  keypadUnlocked: false,
  keypadFeedbackUntil: 0,
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
  } else if (kind === "water") {
    playNoise(.34, .032, 0, 1850);
    playNoise(.2, .018, .08, 3600);
    playTone(720, .08, "sine", .012, .04, 980);
  }
}

function playCoughSfx(beat) {
  // A bright consonant burst followed by a breathy throat release reads as a
  // cough. Avoid pitched low tones here; they sound like tool impacts.
  const second = beat === 2;
  playNoise(.052, second ? .045 : .052, 0, second ? 2350 : 2100);
  playNoise(second ? .125 : .145, second ? .048 : .055, .026, second ? 900 : 760);
  playNoise(second ? .07 : .085, second ? .024 : .029, .082, second ? 1550 : 1380);
}

const NOPE_REACTION_MS = 950;
const DISGUST_REACTION_MS = 1320;

function playerIsReacting() {
  return performance.now() < state.reactionUntil;
}

function reactNope() {
  state.reactionKind = "nope";
  state.reactionUntil = performance.now() + NOPE_REACTION_MS;
  playSfx("NOPE!");
}

function reactDisgust() {
  state.reactionKind = "disgust";
  state.reactionUntil = performance.now() + DISGUST_REACTION_MS;
}

function popComic(text, x, y, color = "#fff3c5") {
  playSfx(text);
}

function playCombineTwinkle() {
  combineTwinkleSfx.pause();
  combineTwinkleSfx.currentTime = 0;
  combineTwinkleSfx.volume = .72;
  combineTwinkleSfx.play().catch(() => {});
}

function playHallwayTone(tone) {
  const tones = {
    low: { frequency: 293.66, id: "hallToneLeft" },
    middle: { frequency: 440, id: "hallToneMiddle" },
    high: { frequency: 659.25, id: "hallToneRight" }
  };
  const note = tones[tone];
  if (!note) return;
  state.player.facing = "up";
  state.hallwayTonePulse = note.id;
  state.hallwayTonePulseUntil = performance.now() + 820;
  playTone(note.frequency, .64, "sine", .055);
  playTone(note.frequency * 2, .46, "triangle", .016, .025);
  registerHallwayDoorTone(tone);
}

const HALLWAY_DOOR_TONE_CODE = ["low", "low", "high", "middle"];

function registerHallwayDoorTone(tone) {
  if (!state.utilityCableRouted || state.hallDoorAOpen) return;
  const expected = HALLWAY_DOOR_TONE_CODE[state.hallwayDoorToneProgress];
  if (tone === expected) {
    state.hallwayDoorToneProgress += 1;
  } else {
    // A wrong note clears the attempt, but a low tone can immediately begin a
    // fresh sequence because the valid code itself starts on the left.
    state.hallwayDoorToneProgress = tone === HALLWAY_DOOR_TONE_CODE[0] ? 1 : 0;
    playSfx("kzzt");
  }
  if (state.hallwayDoorToneProgress < HALLWAY_DOOR_TONE_CODE.length) return;
  state.hallwayDoorToneProgress = 0;
  state.hallDoorAOpen = true;
  state.hallDoorAOpenStart = performance.now();
  playCombineTwinkle();
  setLog("The repeated tones wake the battered crew door. It retracts into the wall.");
}

function tryCombine(a, b) {
  const pair = [a, b].sort().join("+");
  if (pair === "helmet+sealant") {
    removeItem("helmet");
    removeItem("sealant");
    state.inventory.push("patchedHelmet");
    state.selected = "patchedHelmet";
    playCombineTwinkle();
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

  if (target === "utilityDoorButton" && selected === "wrench" && state.room === "utility") {
    state.utilityDoorPanelOpen = true;
    state.selected = null;
    state.player.facing = "up";
    playCombineTwinkle();
    setLog("The wrench pops the blue door panel loose. Something inside is waiting for a pull.");
    updateUI();
    return true;
  }

  if (target === "utilityDoorButton" && state.room === "utility") {
    reactNope();
    setLog("The blue panel is screwed shut. It needs a tool before it can help.");
    return true;
  }

  if (target === "utilityWire" && selected === "hose" && state.room === "utility") {
    if (!state.utilityDoorPanelOpen) {
      reactNope();
      setLog("The hose gives you a better grip, but there is nowhere useful to route the cable yet.");
      return true;
    }
    removeItem("hose");
    state.selected = null;
    beginUtilityAction("hoseWire", 2400);
    playSfx("kzzt");
    setLog("You hook the hose around the stuck cable and brace for a proper pull.");
    updateUI();
    return true;
  }

  reactNope();
  setLog(`${items[selected].name} does not help with that.`);
  return false;
}

function hotspotList() {
  if (state.keypadOpen) return keypadHotspotList();
  if (state.room === "bathroom") return bathroomHotspotList();
  if (state.room === "hallway") return hallwayHotspotList();
  if (state.room === "utility") return [
    { id: "utilityVent", label: "Vent Back to Hallway", x: 846, y: 48, w: 114, h: 176, action: returnToHallwayVent },
    { id: "utilityHose", label: "Coiled Hose", x: 82, y: 238, w: 110, h: 72, visible: () => !state.utilityHoseCollected, action: () => beginUtilityPickup("hose") },
    { id: "utilityCleanRag", label: "Clean Rag", x: 130, y: 166, w: 60, h: 40, visible: () => !state.utilityCleanRagCollected, action: () => beginUtilityPickup("cleanRag") },
    { id: "utilityToolkit", label: state.utilityToolkitOpen ? "Open Toolkit" : "Toolkit", x: 780, y: 325, w: 125, h: 114, action: interactUtilityToolkit },
    { id: "utilitySlimeBox", label: "Unsteady Box", x: 246, y: 66, w: 92, h: 70, visible: () => !state.utilitySlimeBoxFallen, action: triggerUtilitySlimeBox },
    { id: "utilityWire", label: state.utilityCableRouted ? "Tied Hose" : "Stuck Cable", x: 608, y: 123, w: 67, h: 34, action: pullUtilityWire },
    { id: "utilityDoorButton", label: state.utilityDoorOpen ? "Door Control" : state.utilityCableRouted ? "Powered Door Panel" : state.utilityDoorPanelOpen ? "Opened Door Panel" : "Blue Door Panel", x: 548, y: 79, w: 44, h: 52, action: interactUtilityDoorButton },
    { id: "utilityCenterDoor", label: "Open Utility Door", x: 398, y: 118, w: 110, h: 122, visible: () => state.utilityDoorOpen, action: returnFromUtilityToHallway },
    { id: "utilityEmptyBox", label: "Light Parts Box", x: 711, y: 103, w: 93, h: 96, action: shakeUtilityEmptyBox }
  ].filter(h => !h.visible || h.visible());
  const g = generatedArt.usePreview && generatedArt.backgroundReady;
  return [
    { id: "outerDoor", label: state.outerDoorClosed ? "Closed Outer Hatch" : "Outer Hatch", x: g ? 32 : 34, y: g ? 150 : 270, w: g ? 112 : 122, h: g ? 205 : 245, action: () => setLog(state.outerDoorClosed ? "The outer hatch is sealed tight." : "The open outer hatch waits for the pressure controls.") },
    { id: "locker", label: state.lockerOpen ? "Emergency Locker" : "Jammed Emergency Locker", x: g ? 268 : 170, y: g ? 215 : 300, w: g ? 96 : 126, h: g ? 168 : 194, action: openLocker },
    { id: "helmetSpot", label: "Cracked Helmet", x: g ? 230 : 318, y: g ? 398 : 404, w: g ? 128 : 118, h: g ? 88 : 92, visible: () => !hasItem("helmet") && !hasItem("patchedHelmet") && !state.ventSealed, action: collectHelmet },
    { id: "vent", label: state.ventSealed ? "Sealed Vent" : "Screaming Pressure Leak", x: g ? 370 : 506, y: g ? 48 : 112, w: g ? 205 : 124, h: g ? 94 : 92, action: inspectVent },
    { id: "lever", label: "Pressure Lever", x: g ? 560 : 675, y: g ? 250 : 395, w: g ? 94 : 82, h: g ? 126 : 116, action: pullLever },
    { id: "ladder", label: state.onLadder ? "Climb Down" : "Service Ladder", x: g ? 456 : 542, y: g ? 150 : 226, w: g ? 64 : 52, h: g ? 300 : 292, action: useLadder },
    { id: "decoyButton", label: state.decoyButtonBroken ? "Broken Alien Button" : "Suspicious Alien Button", x: g ? 615 : 704, y: g ? 397 : 300, w: g ? 126 : 58, h: g ? 84 : 70, action: pressDecoyButton },
    { id: "cargoCart", label: "Loose Cargo Cart", x: state.cartX - 90, y: 400, w: 180, h: 82, action: pushCargoCart },
    { id: "alienToy", label: "Alien Plush", x: 389, y: 340, w: 49, h: 70, action: inspectAlienToy },
    { id: "tag", label: "Maintenance Tag", x: 515, y: 407, w: 60, h: 64, visible: () => tagIsCollectible() && !hasItem("tag") && !state.scannerSpoofed, action: () => addItem("tag") },
    { id: "scanner", label: state.scannerSpoofed ? "Spoofed Scanner" : "Alien ID Scanner", x: g ? 689 : 772, y: g ? 246 : 238, w: g ? 64 : 70, h: g ? 80 : 120, action: inspectScanner },
    { id: "innerDoor", label: state.complete ? "Open Inner Hatch" : "Inner Airlock Hatch", x: g ? 829 : 842, y: g ? 182 : 178, w: g ? 120 : 86, h: g ? 235 : 292, action: openInnerDoor }
  ]
    .filter(h => !h.visible || h.visible())
    .filter(h => !state.onLadder || h.id === "vent" || h.id === "ladder");
}

function returnToHallwayVent() {
  state.player.facing = "up";
  beginUtilityAction("ventSwipe", 2350, { startX: state.player.x, startY: state.player.y });
  playSfx("kzzt");
}

function beginUtilityAction(type, duration, extra = {}) {
  if (state.utilityAction) return;
  state.player.path = [];
  state.player.currentDone = null;
  state.player.tx = state.player.x;
  state.player.ty = state.player.y;
  state.utilityAction = { type, start: performance.now(), duration, ...extra };
  state.hover = null;
}

function beginUtilityPickup(item) {
  beginUtilityAction("pickup", 900, { item });
  state.player.facing = item === "hose" || item === "cleanRag" ? "left" : "right";
  playSfx("pop");
}

function interactUtilityToolkit() {
  if (!state.utilityToolkitOpen) {
    state.utilityToolkitOpen = true;
    state.player.facing = "right";
    playSfx("clank");
    return;
  }
  if (!state.utilityWrenchCollected) {
    beginUtilityPickup("wrench");
    return;
  }
  reactNope();
}

function triggerUtilitySlimeBox() {
  if (state.utilitySlimeBoxFallen) return;
  state.utilitySlimeBoxFallen = true;
  state.player.facing = "up";
  beginUtilityAction("slime", 2700);
  playSfx("clank");
}

function pullUtilityWire() {
  if (state.selected) {
    if (useSelectedOn("utilityWire")) return;
  }
  if (state.utilityCableRouted) {
    playSfx("ding");
    setLog("The tied hose holds the cable steady inside the opened blue panel.");
    return;
  }
  state.player.facing = "right";
  beginUtilityAction("wire", 1750);
  playSfx("kzzt");
}

function interactUtilityDoorButton() {
  if (state.selected) {
    if (useSelectedOn("utilityDoorButton")) return;
  }
  if (state.utilityCableRouted && !state.utilityDoorOpen) {
    state.player.facing = "up";
    beginUtilityAction("utilityDoorOpen", 1200);
    playSfx("ding");
    setLog("The tied hose holds. The blue panel wakes up and the center door opens.");
    return;
  }
  if (state.utilityDoorOpen) {
    playSfx("ding");
    setLog("The center utility door is open.");
    return;
  }
  if (state.utilityDoorPanelOpen) {
    playSfx("kzzt");
    setLog("The opened blue panel hums faintly. It needs the cable rerouted into it.");
    return;
  }
  reactNope();
  setLog("The blue panel will not budge by hand.");
}

function shakeUtilityEmptyBox() {
  state.player.facing = "down";
  beginUtilityAction("emptyBox", 1900);
  playSfx("clank");
}

function hallwayHotspotList() {
  return [
    { id: "hallToneLeft", label: "Low Tone Button", x: 240, y: 298, w: 36, h: 38, action: () => playHallwayTone("low") },
    { id: "hallToneMiddle", label: "Middle Tone Button", x: 397, y: 268, w: 42, h: 43, action: () => playHallwayTone("middle") },
    { id: "hallToneRight", label: "High Tone Button", x: 777, y: 224, w: 42, h: 43, action: () => playHallwayTone("high") },
    { id: "hallLeftDoor", label: "Airlock Door", x: 0, y: 118, w: 105, h: 330, action: returnToAirlock },
    { id: "hallDoorA", label: state.hallDoorAOpen ? "Open Washroom Door" : "Battered Crew Door", x: 264, y: 176, w: 126, h: 246, action: () => state.hallDoorAOpen ? enterBathroomFromHallway() : inspectHallwayProp("doorA") },
    { id: "hallDoorB", label: state.utilityDoorOpen ? "Open Utility Door" : "Pristine Utility Door", x: 608, y: 176, w: 126, h: 246, action: () => state.utilityDoorOpen ? enterUtilityFromHallwayDoor() : inspectHallwayProp("doorB") },
    { id: "hallKeypad", label: "Door Keypad", x: 842, y: 274, w: 42, h: 72, action: openHallwayKeypad },
    { id: "hallRightDoor", label: state.keypadUnlocked ? "Unlocked Corridor Door" : "Secured Corridor Door", x: 852, y: 116, w: 108, h: 334, action: () => inspectHallwayProp("rightDoor") },
    { id: "hallTrash", label: "Alien Trash Can", x: 171, y: 340, w: 92, h: 150, action: () => state.hallwayRagCollected ? inspectHallwayProp("trash") : beginHallwayPickup("rag") },
    { id: "hallPaper", label: "Crooked Paper Art", x: 136, y: 184, w: 108, h: 140, action: () => inspectHallwayProp("paper") },
    { id: "hallCleaner", label: "Round Cleaning Gadget", x: state.hallwayCleanerX - 48, y: 362, w: 96, h: 118, action: interactHallwayCleaner },
    { id: "hallRagShreds", label: "Rag Shreds", x: state.hallwayRagShredsX - 42, y: 444, w: 84, h: 34, visible: () => state.hallwayRagShredsAvailable && !state.hallwayRagShredsCollected, action: () => beginHallwayPickup("ragShreds") },
    { id: "hallMirror", label: "Alien Mirror", x: 438, y: 164, w: 112, h: 206, action: () => inspectHallwayProp("mirror") },
    { id: "hallVase", label: "Table Vase", x: 528, y: 288, w: 62, h: 84, action: () => state.hallwayDirtCollected ? inspectHallwayProp("vase") : beginHallwayPickup("dirt") },
    { id: "hallVent", label: state.hallwayRopeInstalled ? "Makeshift Rope" : "High Wall Vent", x: 684, y: 28, w: 112, h: state.hallwayRopeInstalled ? 450 : 128, action: interactHallwayVent }
  ].filter(h => !h.visible || h.visible());
}

function bathroomHotspotList() {
  return [
    { id: "bathroomExit", label: "Crew Hallway", x: 0, y: 155, w: 132, h: 300, action: returnFromBathroomToHallway },
    { id: "bathroomFaucetLeft", label: state.bathroomFaucets[0] ? "Turn Off Left Faucet" : "Turn On Left Faucet", x: 241, y: 190, w: 34, h: 47, action: () => toggleBathroomFaucet(0) },
    { id: "bathroomFaucetMiddle", label: state.bathroomFaucets[1] ? "Turn Off Middle Faucet" : "Turn On Middle Faucet", x: 333, y: 188, w: 34, h: 47, action: () => toggleBathroomFaucet(1) },
    { id: "bathroomFaucetRight", label: state.bathroomFaucets[2] ? "Turn Off Right Faucet" : "Turn On Right Faucet", x: 426, y: 185, w: 34, h: 47, action: () => toggleBathroomFaucet(2) },
    { id: "bathroomBowl", label: "Alien Bowl", x: 709, y: 105, w: 61, h: 43, visible: () => state.bathroomLeftDoorOpen && !state.bathroomBowlCollected, action: collectBathroomBowl },
    { id: "bathroomMud", label: "Unknown Filth", x: 818, y: 292, w: 140, h: 82, visible: () => state.bathroomRightDoorOpen, action: reactDisgust },
    { id: "bathroomLeftStall", label: state.bathroomLeftDoorOpen ? "Open Left Stall" : "Left Stall", x: 661, y: 23, w: 160, h: 322, action: () => toggleBathroomStall("left") },
    { id: "bathroomRightStall", label: state.bathroomRightDoorOpen ? "Open Right Stall" : "Right Stall", x: 824, y: 35, w: 136, h: 325, action: () => toggleBathroomStall("right") },
    { id: "bathroomJanitorCart", label: "Janitor Cart", x: 735, y: 340, w: 115, h: 233, action: inspectBathroomJanitorCart },
    { id: "bathroomTrash", label: "Purple Trash Can", x: 862, y: 472, w: 86, h: 108, action: inspectBathroomTrash }
  ].filter(h => !h.visible || h.visible());
}

function inspectBathroomJanitorCart() {
  playSfx("clank");
  popComic("squeak!", 790, 468, "#f2c45b");
  setLog("The janitor cart squeaks on four stubborn wheels. Its bright colors feel almost aggressively cheerful in here.");
}

function inspectBathroomTrash() {
  playSfx("clank");
  popComic("clang!", 904, 500, "#b89cff");
  setLog("The purple trash can rings like a tiny spaceship hull. Whatever is inside refuses to explain itself.");
}

function enterBathroomFromHallway() {
  state.room = "bathroom";
  state.hover = null;
  Object.assign(state.player, { x: 105, y: 480, tx: 105, ty: 480, facing: "right", forcedFacing: null, currentDone: null, path: [] });
  playSfx("ding");
  updateUI();
}

function returnFromBathroomToHallway() {
  state.room = "hallway";
  state.hover = null;
  Object.assign(state.player, { x: 326, y: 472, tx: 326, ty: 472, facing: "down", forcedFacing: null, currentDone: null, path: [] });
  playSfx("ding");
  updateUI();
}

function toggleBathroomStall(side) {
  const key = side === "left" ? "bathroomLeftDoorOpen" : "bathroomRightDoorOpen";
  state[key] = !state[key];
  playSfx(state[key] ? "ding" : "clank");
}

function toggleBathroomFaucet(index) {
  state.bathroomFaucets[index] = !state.bathroomFaucets[index];
  playSfx(state.bathroomFaucets[index] ? "water" : "boop");
  const allOn = state.bathroomFaucets.every(Boolean);
  if (allOn && !state.bathroomMirrorCodeRevealed && !state.bathroomAllFaucetsStart) {
    state.bathroomAllFaucetsStart = performance.now();
  } else if (!allOn && !state.bathroomMirrorCodeRevealed) {
    // The three-second heat-up must be uninterrupted.
    state.bathroomAllFaucetsStart = 0;
    state.bathroomSteamRevealStart = 0;
  }
}

function collectBathroomBowl() {
  if (state.bathroomBowlCollected) return;
  state.bathroomBowlCollected = true;
  state.player.facing = "down";
  addItem("bowl");
  playSfx("pop");
}

const BATHROOM_SECRET_PANEL_MS = 1600;

function openBathroomSecretPanel() {
  if (state.bathroomSecretPanelOpen || state.bathroomSecretPanelStart) return;
  state.bathroomSecretPanelStart = performance.now();
  state.hover = null;
  state.player.forcedFacing = "up";
  state.player.path = [];
  state.player.tx = state.player.x;
  state.player.ty = state.player.y;
  playSfx("clank");
  window.setTimeout(() => {
    if (state.bathroomSecretPanelStart) playSfx("whoosh");
  }, 280);
}

const HALLWAY_KEYPAD_CODE = "314";

function keypadHotspotList() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"];
  const startX = 338;
  const startY = 214;
  const w = 78;
  const h = 62;
  const gapX = 22;
  const gapY = 16;
  const hotspots = keys.map((key, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      id: `keypad-${key}`,
      label: key === "clear" ? "Clear" : key === "enter" ? "Enter" : key,
      x: startX + col * (w + gapX),
      y: startY + row * (h + gapY),
      w,
      h,
      action: () => pressKeypadKey(key)
    };
  });
  hotspots.push({ id: "keypad-close", label: "Close", x: 614, y: 128, w: 32, h: 32, action: closeHallwayKeypad });
  return hotspots;
}

function openHallwayKeypad() {
  state.keypadOpen = true;
  state.keypadEntry = "";
  state.hover = null;
  state.player.facing = "right";
  playSfx("boop");
}

function closeHallwayKeypad() {
  state.keypadOpen = false;
  state.keypadEntry = "";
  state.hover = null;
}

function pressKeypadKey(key) {
  if (key === "clear") {
    state.keypadEntry = "";
    playSfx("kzzt");
    return;
  }
  if (key === "enter") {
    if (state.keypadEntry === HALLWAY_KEYPAD_CODE) {
      state.keypadUnlocked = true;
      playCombineTwinkle();
      state.keypadFeedbackUntil = performance.now() + 850;
      setTimeout(closeHallwayKeypad, 700);
    } else {
      state.keypadEntry = "";
      state.keypadFeedbackUntil = performance.now() + 600;
      playSfx("nope");
    }
    return;
  }
  if (state.keypadEntry.length < 3) {
    state.keypadEntry += key;
    playSfx("boop");
  }
}

function switchToHallway() {
  state.room = "hallway";
  state.onLadder = false;
  state.hover = null;
  state.player.path = [];
  state.player.currentDone = null;
  state.player.forcedFacing = null;
  state.player.x = 72;
  state.player.y = 472;
  state.player.tx = 72;
  state.player.ty = 472;
  state.player.facing = "right";
  setLog("The airlock opens into a long crew corridor.");
  updateUI();
}

function enterHallway() {
  setPlayerPath([{ x: 930, y: 448, facing: "right", done: switchToHallway }]);
}

function returnToAirlock() {
  setPlayerPath([{
    x: 28,
    y: 472,
    facing: "left",
    done: () => {
      state.room = "airlock";
      state.hover = null;
      state.player.x = 884;
      state.player.y = 448;
      state.player.tx = 884;
      state.player.ty = 448;
      state.player.facing = "left";
      updateUI();
    }
  }]);
}

function spillHallwayDirt(x) {
  removeItem("dirt");
  state.selected = null;
  state.hallwayDirtSpilled = true;
  state.hallwayDirtX = Math.max(320, Math.min(690, x));
  state.hallwayCleanerMode = "approaching";
  state.hallwayCleanerTargetX = state.hallwayDirtX;
  playSfx("squish");
  setLog("The dirt scatters across the deck. The cleaning machine notices immediately.");
  updateUI();
}

function interactHallwayCleaner() {
  if (state.selected === "rag") {
    if (state.hallwayCleanerMode !== "wiping") {
      reactNope();
      setLog("The cleaner zips away from the rag. It needs to be distracted first.");
      return;
    }
    removeItem("rag");
    state.selected = null;
    state.hallwayCleanerMode = "jamming";
    state.hallwayCleanerActionStart = performance.now();
    playSfx("clank");
    setTimeout(() => playSfx("squish"), 260);
    setLog("The rag catches in the spinning brushes. The cleaner shudders and tears it apart.");
    updateUI();
    return;
  }
  if (state.hallwayCleanerMode === "wiping" || state.hallwayCleanerMode === "approaching" || state.hallwayCleanerMode === "jamming") {
    reactNope();
    return;
  }
  inspectHallwayProp("cleaner");
}

function interactHallwayVent() {
  if (state.selected === "ragShreds" && !state.hallwayRopeInstalled) {
    removeItem("ragShreds");
    state.selected = null;
    state.hallwayRopeTying = true;
    state.hallwayRopeTieStart = performance.now();
    state.player.facing = "down";
    state.player.forcedFacing = "down";
    state.player.path = [];
    state.player.currentDone = null;
    state.player.tx = state.player.x;
    state.player.ty = state.player.y;
    playSfx("squish");
    setLog("You begin knotting the torn strips together.");
    updateUI();
    return;
  }
  if (state.hallwayRopeInstalled) {
    state.hallwayVentClimbing = true;
    state.player.forcedFacing = "up";
    setPlayerPath([
      { x: 738, y: 472, facing: "up" },
      { x: 738, y: 128, facing: "up", done: switchToUtilityCloset }
    ]);
    playSfx("clank");
    return;
  }
  reactNope();
}

function switchToUtilityCloset() {
  state.room = "utility";
  state.hallwayVentClimbing = false;
  state.utilityEntryAnimating = true;
  state.utilityEntryStart = performance.now();
  state.hover = null;
  Object.assign(state.player, { x: 902, y: 172, tx: 902, ty: 172, facing: "down", forcedFacing: "down", currentDone: null, path: [] });
  setLog("You squeeze through the vent and drop into the utility closet.");
  updateUI();
}

function enterUtilityFromHallwayDoor() {
  if (!state.utilityDoorOpen) {
    reactNope();
    return;
  }
  state.room = "utility";
  state.hover = null;
  state.utilityEntryAnimating = false;
  Object.assign(state.player, {
    x: 456,
    y: 372,
    tx: 456,
    ty: 372,
    facing: "up",
    forcedFacing: null,
    currentDone: null,
    path: []
  });
  playSfx("ding");
  updateUI();
}

function returnFromUtilityToHallway() {
  setPlayerPath([
    {
      x: 456,
      y: 238,
      facing: "up",
      done: () => {
        state.room = "hallway";
        state.hover = null;
        Object.assign(state.player, {
          x: 670,
          y: 472,
          tx: 670,
          ty: 472,
          facing: "down",
          forcedFacing: null,
          currentDone: null,
          path: []
        });
        setLog("You step back through the utility door into the crew hallway.");
        updateUI();
      }
    }
  ]);
}

function inspectHallwayProp(id) {
  state.hallwayEffect = id;
  state.hallwayEffectUntil = performance.now() + (id === "cleaner" ? 900 : 650);
  if (id === "cleaner") {
    state.hallwayCleanerTargetX = state.hallwayCleanerX > 740 ? 710 : 780;
    playSfx("boop");
    return;
  }
  if (id === "mirror") state.player.facing = "up";
  if (id === "trash") playSfx("clank");
  else if (id === "paper" || id === "vase") playSfx("squish");
  else if (id === "mirror") playSfx("ding");
  else if (id === "hallVent") reactNope();
  else reactNope();
}

function beginHallwayPickup(id) {
  if (state.hallwayPickup) return;
  // Floor pickups beside bulky props should keep the side-facing pose chosen
  // by the approach path. This prevents the trash can or cleaner from hiding
  // the astronaut at the moment the interaction begins.
  if (id !== "rag" && id !== "ragShreds") state.player.facing = "down";
  state.player.path = [];
  state.player.currentDone = null;
  state.player.tx = state.player.x;
  state.player.ty = state.player.y;
  state.hallwayPickup = {
    id,
    start: performance.now(),
    duration: 1050,
    from: id === "rag" ? { x: 214, y: 357 } : id === "ragShreds" ? { x: state.hallwayRagShredsX, y: 456 } : { x: 560, y: 284 }
  };
  playSfx(id === "rag" || id === "ragShreds" ? "squish" : "clank");
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
  state.player.facing = state.player.x < state.cartX ? "right" : "left";
  state.cartLeft = !state.cartLeft;
  state.cartTargetX = state.cartLeft ? CART_LEFT_X : CART_RIGHT_X;
  state.cartWobbleUntil = performance.now() + 650;
  popComic("clank!", state.cartTargetX, 414, "#f2c45b");
  setLog("The cargo cart rattles along its track and stops with a hollow clank.");
}

function inspectAlienToy() {
  if (state.toyExamining) return;
  // Keep the pickup strictly arrival-driven even if another input path calls
  // the action directly. The plush must remain on the floor until the
  // astronaut has actually walked into reach.
  const toyHotspot = hotspotList().find(hotspot => hotspot.id === "alienToy");
  const approach = generatedApproachPoint(toyHotspot);
  if (Math.hypot(state.player.x - approach.x, state.player.y - approach.y) > 4) {
    movePlayerNear(toyHotspot, inspectAlienToy);
    return;
  }
  const now = performance.now();
  state.player.facing = state.player.x < 413 ? "right" : "left";
  state.player.path = [];
  state.player.currentDone = null;
  state.player.tx = state.player.x;
  state.player.ty = state.player.y;
  state.toyExamining = true;
  state.toyInspectStart = now;
  state.toyInspectUntil = now + 2300;
  state.hover = null;
  playSfx("squish");
  setTimeout(() => {
    if (state.toyExamining) playSfx("ding");
  }, 920);
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
  if (state.pressureEqualized || state.leverPulled) {
    reactNope();
    setLog("The pressure needle is steady. The lever refuses to do anything dramatic twice.");
    return;
  }
  if (!state.ventSealed) {
    reactNope();
    setLog("You pull the lever. The room screams louder. You shove it back before your boots leave the floor.");
    return;
  }
  state.leverPulled = true;
  state.outerDoorCloseStart = performance.now();
  playSfx("whoosh");
  clearTimeout(outerDoorCloseTimer);
  outerDoorCloseTimer = setTimeout(() => {
    outerDoorCloseTimer = 0;
    state.outerDoorClosed = true;
    state.pressureEqualized = true;
    state.tagAvailable = true;
    state.tagReleaseStart = performance.now();
    playSfx("clank");
    setTimeout(() => playSfx("pop"), 1080);
    setLog("The outer hatch seals. Pressure returns, and the maintenance drawer releases its tag.");
    updateUI();
  }, OUTER_HATCH_CLOSE_MS);
  setLog("The lever drops and the outer hatch begins to close.");
}

function inspectScanner() {
  if (useSelectedOn("scanner")) return;
  setLog(state.scannerSpoofed ? "The scanner glows green. It now believes you are a very tall maintenance bot." : "The scanner wants alien credentials. Or something that looks credential-ish.");
}

function openInnerDoor() {
  if (state.complete) {
    enterHallway();
    return;
  }
  if (!state.scannerSpoofed) {
    state.innerDoorRejectUntil = performance.now() + 420;
    reactNope();
    setLog("The inner hatch stays locked. A scanner beside it blinks in judgment.");
    return;
  }
  state.complete = true;
  state.innerDoorOpenStart = performance.now();
  playSfx("whoosh");
  setLog("The inner hatch exhales open. The ship accepts your lie and invites you deeper.");
  updateUI();
}

function updateUI() {
  ui.inventory.innerHTML = "";
  let selectedButton = null;
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
    if (state.selected === id) selectedButton = button;
    button.innerHTML = `<span class="s4-item-art"><img src="${items[id].sprite}?v=stage4-item-sprites-1" alt=""></span><strong>${items[id].name}</strong><small>${items[id].description}</small>`;
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
  if (selectedButton) requestAnimationFrame(() => selectedButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
  ui.clear.hidden = !state.selected;
  const roomLevel = document.querySelector("#s4RoomLevel");
  const roomName = document.querySelector("#s4RoomName");
  if (roomLevel) roomLevel.textContent = state.room === "bathroom" ? "Level 4" : state.room === "utility" ? "Level 3" : state.room === "hallway" ? "Level 2" : "Level 1";
  if (roomName) roomName.textContent = state.room === "bathroom" ? "Alien Washroom" : state.room === "utility" ? "Utility Closet" : state.room === "hallway" ? "Crew Hallway" : "Breached Airlock";
  document.querySelector("#s4DebugAirlock")?.classList.toggle("is-active", state.room === "airlock");
  document.querySelector("#s4DebugHallway")?.classList.toggle("is-active", state.room === "hallway");
  document.querySelector("#s4DebugUtility")?.classList.toggle("is-active", state.room === "utility");
  document.querySelector("#s4DebugBathroom")?.classList.toggle("is-active", state.room === "bathroom");
  canvas.setAttribute("aria-label", state.room === "bathroom" ? "Alien ship washroom" : state.room === "utility" ? "Alien ship utility closet" : state.room === "hallway" ? "Alien ship crew hallway" : "Alien airlock point and click puzzle");
  if (ui.objective) ui.objective.textContent = state.room === "bathroom" ? "Explore the alien washroom." : state.room === "utility" ? "Explore the utility closet." : state.room === "hallway" ? "Explore the crew hallway." : state.complete ? "Airlock cleared. Enter the open hatch." : "Get through the inner airlock door.";
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
  if (controller.onCanvas && !state.toyExamining) {
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
  if (state.room === "hallway" || state.room === "bathroom") {
    state.player.tx = Math.max(42, Math.min(918, point.x));
    // Room 2 is intentionally a side-scrolling corridor. Free movement only
    // changes X; interaction paths may step slightly off this line.
    state.player.ty = state.room === "bathroom" ? Math.max(390, Math.min(555, point.y)) : 472;
  } else if (state.room === "utility") {
    state.player.tx = point.x;
    state.player.ty = point.y;
  } else {
    state.player.tx = Math.max(72, Math.min(890, point.x));
    state.player.ty = isGeneratedMode() ? Math.max(414, Math.min(474, point.y)) : Math.max(520, Math.min(570, point.y));
  }
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
  if (playerIsReacting() || state.toyExamining || state.hallwayPickup || state.hallwayRopeTying || state.hallwayVentClimbing || state.utilityEntryAnimating || state.utilityAction || state.bathroomSecretPanelStart) return;
  const hit = hitTest(point);
  if (state.keypadOpen) {
    if (hit) hit.action();
    return;
  }
  if (state.onLadder && (!hit || (hit.id !== "vent" && hit.id !== "ladder"))) {
    reactNope();
    return;
  }
  if (!hit) {
    if (state.room === "hallway" && state.selected === "dirt" && isGroundTile(point)) {
      const dirtX = point.x;
      if (movePlayerToPoint(point)) state.player.currentDone = () => spillHallwayDirt(dirtX);
      return;
    }
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
  if (state.hallwayRopeTying || state.hallwayVentClimbing || state.utilityEntryAnimating || state.utilityAction || state.bathroomSecretPanelStart) return;
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
  const button = target?.closest?.(".s4-item, #s4ClearItem, .s4-debug-button, .stage-link");
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
    if (state.keypadOpen) {
      closeHallwayKeypad();
      controller.buttons = pad.buttons.map((_, i) => held(i));
      return;
    }
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
  },
  hallToneLeft: {
    hit: point => pointInEllipse(point, 258, 317, 18, 19, 0),
    draw: () => ctx.ellipse(258, 317, 18, 19, 0, 0, Math.PI * 2)
  },
  hallToneMiddle: {
    hit: point => pointInEllipse(point, 418, 289, 21, 22, 0),
    draw: () => ctx.ellipse(418, 289, 21, 22, 0, 0, Math.PI * 2)
  },
  hallToneRight: {
    hit: point => pointInEllipse(point, 798, 245, 21, 22, 0),
    draw: () => ctx.ellipse(798, 245, 21, 22, 0, 0, Math.PI * 2)
  },
  utilityCenterDoor: {
    hit: point => pointInPolygon(point, [[408, 88], [490, 88], [508, 110], [508, 232], [494, 248], [404, 248], [389, 232], [389, 112]]),
    draw: () => tracePolygon([[408, 88], [490, 88], [508, 110], [508, 232], [494, 248], [404, 248], [389, 232], [389, 112]])
  },
  bathroomLeftStall: {
    hit: point => pointInPolygon(point, [[694,43],[799,43],[814,53],[820,72],[820,323],[814,341],[801,351],[690,344],[679,334],[674,315],[674,69],[680,52]]),
    draw: () => tracePolygon([[694,43],[799,43],[814,53],[820,72],[820,323],[814,341],[801,351],[690,344],[679,334],[674,315],[674,69],[680,52]])
  },
  bathroomRightStall: {
    hit: point => pointInPolygon(point, [[852,49],[943,49],[955,59],[960,77],[960,351],[954,366],[943,376],[851,365],[841,355],[836,337],[836,70],[842,57]]),
    draw: () => tracePolygon([[852,49],[943,49],[955,59],[960,77],[960,351],[954,366],[943,376],[851,365],[841,355],[836,337],[836,70],[842,57]])
  },
  bathroomBowl: {
    hit: point => pointInPolygon(point, [[711,114],[720,107],[740,104],[759,108],[769,115],[768,124],[763,128],[759,141],[752,147],[729,147],[719,141],[715,127],[709,122]]),
    draw: traceBathroomBowl
  },
  bathroomFaucetLeft: {
    hit: point => pointInPolygon(point, [[249,192],[263,192],[264,207],[273,210],[273,219],[261,218],[259,233],[250,233],[250,216],[242,213],[243,203],[249,205]]),
    draw: () => tracePolygon([[249,192],[263,192],[264,207],[273,210],[273,219],[261,218],[259,233],[250,233],[250,216],[242,213],[243,203],[249,205]])
  },
  bathroomFaucetMiddle: {
    hit: point => pointInPolygon(point, [[341,190],[356,190],[357,205],[365,208],[365,217],[354,216],[352,231],[343,231],[343,214],[335,211],[336,201],[342,203]]),
    draw: () => tracePolygon([[341,190],[356,190],[357,205],[365,208],[365,217],[354,216],[352,231],[343,231],[343,214],[335,211],[336,201],[342,203]])
  },
  bathroomFaucetRight: {
    hit: point => pointInPolygon(point, [[434,187],[449,187],[450,202],[458,205],[458,214],[447,213],[445,228],[436,228],[436,211],[428,208],[429,198],[435,200]]),
    draw: () => tracePolygon([[434,187],[449,187],[450,202],[458,205],[458,214],[447,213],[445,228],[436,228],[436,211],[428,208],[429,198],[435,200]])
  }
};

function traceBathroomBowl() {
  // Trace the painted bowl's outer silhouette: wide oval rim, tapered body,
  // and narrow foot. This deliberately excludes the shelf behind it.
  ctx.moveTo(740, 105);
  ctx.bezierCurveTo(755, 105, 767, 109, 769, 116);
  ctx.bezierCurveTo(770, 121, 767, 125, 763, 127);
  ctx.lineTo(759, 140);
  ctx.bezierCurveTo(757, 145, 752, 147, 744, 147);
  ctx.lineTo(732, 147);
  ctx.bezierCurveTo(724, 147, 720, 144, 718, 140);
  ctx.lineTo(714, 127);
  ctx.bezierCurveTo(710, 125, 708, 121, 710, 116);
  ctx.bezierCurveTo(712, 109, 724, 105, 740, 105);
  ctx.closePath();
}

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
      return pointInRect(point, state.cartX - 90, 400, 180, 82);
    case "alienToy":
      return pointInEllipse(point, 413, 375, 26, 38, 0);
    case "tag":
      return pointInEllipse(point, 545, 439, 30, 32, -.18);
    case "scanner":
      return pointInPolygon(point, [[721,246],[740,253],[753,274],[751,305],[735,326],[708,326],[691,307],[689,277],[700,254]]);
    case "innerDoor":
      return pointInPolygon(point, [[837,183],[921,183],[948,208],[949,390],[933,413],[846,413],[829,390],[829,208]]);
    case "hallKeypad":
      return pointInEllipse(point, 862, 309, 19, 29, 0);
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
    if (state.room === "hallway") return point.x >= 32 && point.x <= 928 && point.y >= 414 && point.y <= 522;
    if (state.room === "bathroom") return pointInPolygon(point, [[48,390],[912,362],[940,390],[930,570],[52,570],[28,520]]);
    if (state.room === "utility") return pointInPolygon(point, [
      [360, 188], [600, 188], [708, 585], [250, 585]
    ]);
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
  const target = generatedArt.usePreview && generatedArt.backgroundReady ? generatedApproachPoint(hotspot) : { x: Math.max(90, Math.min(850, hotspot.x + hotspot.w / 2)), y: 535 };
  state.player.currentDone = () => {
    if (target.facing) state.player.facing = target.facing;
    if (onArrival) onArrival();
  };
  state.player.tx = target.x;
  state.player.ty = target.y;
}

function nearestHallwaySideApproach(centerX, clearance, y = 472) {
  const leftX = Math.max(42, centerX - clearance);
  const rightX = Math.min(918, centerX + clearance);
  const useLeft = Math.abs(state.player.x - leftX) <= Math.abs(state.player.x - rightX);
  return useLeft
    ? { x: leftX, y, facing: "right" }
    : { x: rightX, y, facing: "left" };
}

function generatedApproachPoint(hotspot) {
  if (state.room === "bathroom") {
    const bathroomPoints = {
      bathroomExit: { x: 92, y: 472, facing: "left" },
      bathroomLeftStall: { x: 742, y: 405, facing: "up" },
      bathroomRightStall: { x: 876, y: 405, facing: "up" },
      bathroomBowl: { x: 780, y: 405, facing: "up" },
      bathroomMud: { x: 862, y: 405, facing: "up" },
      bathroomJanitorCart: { x: 706, y: 450, facing: "right" },
      bathroomTrash: { x: 834, y: 450, facing: "right" },
      bathroomFaucetLeft: { x: 205, y: 390, facing: "right" },
      bathroomFaucetMiddle: { x: 400, y: 390, facing: "left" },
      bathroomFaucetRight: { x: 500, y: 390, facing: "left" }
    };
    return bathroomPoints[hotspot.id] || { x: hotspot.x + hotspot.w / 2, y: 430 };
  }
  if (state.room === "utility") {
    const utilityPoints = {
      utilityVent: { x: 650, y: 500 },
      utilityHose: { x: 294, y: 372 },
      utilityCleanRag: { x: 315, y: 372 },
      utilityToolkit: { x: 650, y: 470 },
      utilitySlimeBox: { x: 350, y: 340 },
      utilityWire: { x: 570, y: 372 },
      utilityDoorButton: { x: 570, y: 372 },
      utilityCenterDoor: { x: 456, y: 372 },
      utilityEmptyBox: { x: 642, y: 450 }
    };
    return utilityPoints[hotspot.id] || { x: hotspot.x + hotspot.w / 2, y: hotspot.y + hotspot.h / 2 };
  }
  if (state.room === "hallway") {
    // Bulky floor props are always approached from their nearest clear side.
    // Wall controls and doorways retain their intentionally centered targets.
    if (hotspot.id === "hallTrash") return nearestHallwaySideApproach(217, 112);
    if (hotspot.id === "hallCleaner") return nearestHallwaySideApproach(state.hallwayCleanerX, 106);
    if (hotspot.id === "hallRagShreds") return nearestHallwaySideApproach(state.hallwayRagShredsX, 76);
    const hallwayPoints = {
      hallLeftDoor: { x: 80, y: 472 },
      hallDoorA: { x: 326, y: 472 },
      hallDoorB: { x: 670, y: 472 },
      hallRightDoor: { x: 882, y: 472 },
      hallKeypad: { x: 834, y: 472 },
      hallPaper: { x: 190, y: 472 },
      hallMirror: { x: 492, y: 472 },
      hallVase: { x: 558, y: 472 },
      hallToneLeft: { x: 258, y: 472 },
      hallToneMiddle: { x: 418, y: 472 },
      hallToneRight: { x: 798, y: 472 },
      hallVent: { x: 738, y: 472 }
    };
    return hallwayPoints[hotspot.id] || { x: hotspot.x + hotspot.w / 2, y: 472 };
  }
  if (hotspot.id === "cargoCart") {
    // Stand at the nearer end of the cart and low on the deck so the
    // astronaut's forward hand meets the cart instead of its body overlapping
    // the middle of the sprite.
    const nextCartX = state.cartLeft ? CART_RIGHT_X : CART_LEFT_X;
    const pushingFromLeft = nextCartX > state.cartX;
    return { x: state.cartX + (pushingFromLeft ? -112 : 112), y: 470 };
  }
  if (hotspot.id === "alienToy") {
    const approachFromLeft = state.player.x <= 413;
    return { x: approachFromLeft ? 350 : 476, y: 456 };
  }
  const points = {
    outerDoor: { x: 150, y: 452 },
    locker: { x: 320, y: 448 },
    helmetSpot: { x: 288, y: 456 },
    lever: { x: 610, y: 448 },
    decoyButton: { x: 670, y: 456 },
    tag: { x: 545, y: 456 },
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
  if (state.room === "bathroom") {
    drawGeneratedBathroom(time);
    return;
  }
  if (state.room === "hallway") {
    drawGeneratedHallway(time);
    return;
  }
  if (state.room === "utility") {
    drawGeneratedUtilityCloset(time);
    return;
  }
  ctx.drawImage(generatedArt.background, 0, 0, 960, 640);
  drawAirlockPowerSignal();

  drawGeneratedObjectSprites(time);
  if (state.hover && state.hover.id !== "cargoCart") drawGeneratedSpriteHighlight(state.hover.id);
  drawGeneratedGasSprites(time);

  // Depth-sort the movable cart against the astronaut's boot position. On the
  // back half of the deck the astronaut passes behind it; on the front half
  // the astronaut correctly covers it.
  const cartInFront = state.player.y < 464;
  if (!cartInFront) {
    drawGeneratedCart(time);
    if (state.hover?.id === "cargoCart") drawGeneratedSpriteHighlight("cargoCart");
  }
  if (state.toyExamining) drawAlienToyHugAnimation(time);
  else drawPlayer(time);
  if (cartInFront) {
    drawGeneratedCart(time);
    if (state.hover?.id === "cargoCart") drawGeneratedSpriteHighlight("cargoCart");
  }
  drawHover();
}

function drawGeneratedBathroom(time) {
  // The generated closed-room painting is the base, so both doors inherit the
  // room's exact perspective and lighting. Opening a stall reveals the matching
  // region from the original open-stall painting without any detached overlay.
  const panelElapsed = state.bathroomSecretPanelStart
    ? Math.max(0, performance.now() - state.bathroomSecretPanelStart)
    : 0;
  const panelOpenProgress = state.bathroomSecretPanelOpen
    ? 1
    : state.bathroomSecretPanelStart
      ? Math.min(1, panelElapsed / BATHROOM_SECRET_PANEL_MS)
      : 0;
  ctx.drawImage(generatedArt.bathroomClosedBackground, 0, 0, 960, 640);
  drawBathroomSecretPanelReveal(panelOpenProgress);
  if (state.bathroomLeftDoorOpen) drawBathroomBackgroundRegion(generatedArt.bathroomBackground, 655, 18, 172, 350);
  if (state.bathroomRightDoorOpen) drawBathroomBackgroundRegion(generatedArt.bathroomBackground, 820, 24, 140, 360);
  drawBathroomFaucetSprites();
  // The interactive bowl is its own transparent sprite. Do not repaint the
  // obsolete bowl from the full-room artwork beneath it.
  if (state.bathroomLeftDoorOpen && !state.bathroomBowlCollected) {
    ctx.drawImage(generatedArt.bathroomBowl, 716, 109, 48, 36);
  }
  // Reduced to 60% of its previous size and kept completely inside the right stall.
  if (state.bathroomRightDoorOpen) ctx.drawImage(generatedArt.bathroomMud, 852, 305, 89, 48);
  drawBathroomFaucetWater(time);
  drawBathroomSteamMirror();
  drawBathroomCleaningSprites();
  if (state.hover) drawGeneratedSpriteHighlight(state.hover.id);
  drawPlayer(time);
  drawHover();
}

const bathroomCleaningSpriteLayout = {
  bathroomJanitorCart: { image: generatedArt.bathroomJanitorCart, x: 735, y: 340, w: 115, h: 233 },
  bathroomTrash: { image: generatedArt.bathroomTrashSprite, x: 862, y: 472, w: 86, h: 108 }
};

function drawBathroomCleaningSprites() {
  for (const sprite of Object.values(bathroomCleaningSpriteLayout)) {
    if (!sprite.image.complete || !sprite.image.naturalWidth) continue;
    ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h);
  }
}

// Panel outline measured directly off the open-reference art's own pixels
// (per-row/column luminance-transition + gradient scans, not hand-traced):
// top edge sits on the true wall/panel seam above the rivet trim, and the
// left/right edges were nudged a couple px per visual review. A parallelogram
// following the wall's isometric lean, not an axis-aligned rectangle.
const BATHROOM_SECRET_PANEL_QUAD = [[587, 71.4], [650, 82.36], [650, 240.2], [585.2, 229.8]];
let bathroomSecretPanelPlateSprite = null;
let bathroomSecretPanelOpenSprite = null;
let bathroomSecretPanelWallPatch = null;

function clipToBathroomSecretPanelQuad(c) {
  const q = BATHROOM_SECRET_PANEL_QUAD;
  c.beginPath();
  c.moveTo(q[0][0], q[0][1]);
  c.lineTo(q[1][0], q[1][1]);
  c.lineTo(q[2][0], q[2][1]);
  c.lineTo(q[3][0], q[3][1]);
  c.closePath();
  c.clip();
}

// Scanline fill of the quad into a boolean mask, for the pixel-level cleanup
// passes below (canvas clip() alone can't be queried per-pixel).
function bathroomSecretPanelQuadMask() {
  const q = BATHROOM_SECRET_PANEL_QUAD;
  const w = 960, h = 640;
  const mask = new Uint8Array(w * h);
  const ys = q.map(p => p[1]);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(h - 1, Math.ceil(Math.max(...ys)));
  for (let y = minY; y <= maxY; y++) {
    const yc = y + 0.5;
    const xs = [];
    for (let i = 0; i < q.length; i++) {
      const [x1, y1] = q[i];
      const [x2, y2] = q[(i + 1) % q.length];
      if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) xs.push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length; i += 2) {
      const xStart = Math.max(0, Math.round(xs[i]));
      const xEnd = Math.min(w - 1, Math.round(xs[i + 1]));
      for (let x = xStart; x <= xEnd; x++) mask[y * w + x] = 1;
    }
  }
  return mask;
}

// Pixels within `radius` of a mask-boundary crossing, on the requested side.
function bathroomSecretPanelBorderBand(mask, w, h, wantInside, radius) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const here = !!mask[i];
      if (here !== wantInside) continue;
      let nearOpposite = false;
      for (let dy = -radius; dy <= radius && !nearOpposite; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          if (!!mask[ny * w + nx] !== here) { nearOpposite = true; break; }
        }
      }
      if (nearOpposite) out[i] = 1;
    }
  }
  return out;
}

// The plate is cut directly from the clean, un-animated background art (not
// the old sprite sheet, which had a matte border baked into every frame) so
// it has zero seams. Built once and cached.
function getBathroomSecretPanelPlateSprite() {
  if (bathroomSecretPanelPlateSprite) return bathroomSecretPanelPlateSprite;
  const bg = generatedArt.bathroomClosedBackground;
  if (!bg.complete || !bg.naturalWidth) return null;
  const plate = document.createElement("canvas");
  plate.width = 960;
  plate.height = 640;
  const pctx = plate.getContext("2d");
  pctx.save();
  clipToBathroomSecretPanelQuad(pctx);
  pctx.drawImage(bg, 0, 0, 960, 640);
  pctx.restore();
  bathroomSecretPanelPlateSprite = plate;
  return plate;
}

// The quad's top edge sits above the dark cavity (to include the rivet-trim
// header as part of the panel), but the open-reference art was never drawn
// with that header actually removed -- it's still plain wall art up there.
// With no "header gone" art to fall back on, blend that strip into the
// interior's own dark tone, tracked per-column against the diagonal top edge
// (a flat cutoff leaves a wedge where the diagonal crosses it). Also flattens
// the thin light sliver the nudged-out right edge pulled in from the door
// frame trim, in a border band along the whole inside edge. Built once and cached.
function getBathroomSecretPanelOpenSprite() {
  if (bathroomSecretPanelOpenSprite) return bathroomSecretPanelOpenSprite;
  const openImg = generatedArt.bathroomSecretPanelOpenReference;
  if (!openImg.complete || !openImg.naturalWidth) return null;

  const layer = document.createElement("canvas");
  layer.width = 960;
  layer.height = 640;
  const lctx = layer.getContext("2d");
  lctx.save();
  clipToBathroomSecretPanelQuad(lctx);
  lctx.drawImage(openImg, 0, 0, 960, 640);
  lctx.restore();

  const mask = bathroomSecretPanelQuadMask();
  const imageData = lctx.getImageData(0, 0, 960, 640);
  const data = imageData.data;

  let sr = 0, sg = 0, sb = 0, sn = 0;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (!mask[i]) continue;
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    if (lum < 50) { sr += data[p]; sg += data[p + 1]; sb += data[p + 2]; sn++; }
  }
  const dark = sn ? [sr / sn, sg / sn, sb / sn] : [18, 18, 22];

  const w = 960, h = 640, bandHeight = 20;
  for (let x = 0; x < w; x++) {
    let topY = -1;
    for (let y = 0; y < h; y++) { if (mask[y * w + x]) { topY = y; break; } }
    if (topY < 0) continue;
    for (let y = topY; y < topY + bandHeight && y < h; y++) {
      const i = y * w + x, p = i * 4;
      if (!mask[i]) continue;
      data[p] = dark[0]; data[p + 1] = dark[1]; data[p + 2] = dark[2];
    }
  }

  const insideBand = bathroomSecretPanelBorderBand(mask, w, h, true, 3);
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (!insideBand[i]) continue;
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    if (lum > 90) { data[p] = dark[0]; data[p + 1] = dark[1]; data[p + 2] = dark[2]; }
  }

  lctx.putImageData(imageData, 0, 0);
  bathroomSecretPanelOpenSprite = layer;
  return layer;
}

// The nudged-out left edge exposed a couple of dark seam/rivet marks on the
// wall just outside the quad. Rather than mutate the shared background image,
// build a small transparent-everywhere-except-the-fix patch (sampled from the
// wall's own average tone nearby) and draw it as an overlay. Built once and cached.
function getBathroomSecretPanelWallPatch() {
  if (bathroomSecretPanelWallPatch) return bathroomSecretPanelWallPatch;
  const bg = generatedArt.bathroomClosedBackground;
  if (!bg.complete || !bg.naturalWidth) return null;

  const src = document.createElement("canvas");
  src.width = 960;
  src.height = 640;
  const sctx = src.getContext("2d");
  sctx.drawImage(bg, 0, 0, 960, 640);
  const imageData = sctx.getImageData(0, 0, 960, 640);
  const data = imageData.data;

  const w = 960, h = 640;
  const mask = bathroomSecretPanelQuadMask();
  const outsideBand = bathroomSecretPanelBorderBand(mask, w, h, false, 3);

  let wr = 0, wg = 0, wb = 0, wn = 0;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (mask[i] || outsideBand[i]) continue;
    wr += data[p]; wg += data[p + 1]; wb += data[p + 2]; wn++;
  }
  const wall = wn ? [wr / wn, wg / wn, wb / wn] : [190, 190, 195];

  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (!outsideBand[i]) { data[p + 3] = 0; continue; }
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    if (lum < 100) { data[p] = wall[0]; data[p + 1] = wall[1]; data[p + 2] = wall[2]; data[p + 3] = 255; }
    else data[p + 3] = 0;
  }
  sctx.putImageData(imageData, 0, 0);
  bathroomSecretPanelWallPatch = src;
  return src;
}

// The whole plate recedes straight back into the crawlspace in place --
// shrinking and fading toward the opening's darkness -- rather than sliding
// sideways across the wall. Every draw here stays clipped to the recess
// quad, so the motion can never spill onto neighboring props (trash can,
// janitor cart) regardless of where they sit.
function drawBathroomSecretPanelReveal(progress) {
  const wallPatch = getBathroomSecretPanelWallPatch();
  if (wallPatch) ctx.drawImage(wallPatch, 0, 0, 960, 640);

  const openSprite = getBathroomSecretPanelOpenSprite();
  if (openSprite) ctx.drawImage(openSprite, 0, 0, 960, 640);

  if (progress >= 1) return;
  const plate = getBathroomSecretPanelPlateSprite();
  if (!plate) return;

  const eased = 1 - Math.pow(1 - progress, 2);
  const q = BATHROOM_SECRET_PANEL_QUAD;
  const cx = (q[0][0] + q[2][0]) / 2;
  const cy = (q[0][1] + q[2][1]) / 2;
  const scale = 1 - eased * 0.55;
  const dy = -eased * 26;
  const alpha = Math.max(0, 1 - eased / 0.85);

  ctx.save();
  clipToBathroomSecretPanelQuad(ctx);
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy + dy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.drawImage(plate, 0, 0, 960, 640);
  ctx.restore();
}

const bathroomFaucetSpriteLayout = {
  bathroomFaucetLeft: { image: generatedArt.bathroomFaucetLeft, x: 240, y: 203.125, w: 33.125, h: 31.25 },
  bathroomFaucetMiddle: { image: generatedArt.bathroomFaucetMiddle, x: 331.875, y: 192.5, w: 33.125, h: 33.125 },
  bathroomFaucetRight: { image: generatedArt.bathroomFaucetRight, x: 421.875, y: 178.75, w: 35, h: 36.25 }
};

function drawBathroomFaucetSprites() {
  for (const faucet of Object.values(bathroomFaucetSpriteLayout)) {
    ctx.drawImage(faucet.image, faucet.x, faucet.y, faucet.w, faucet.h);
  }
}

const bathroomFaucetWaterSpriteLayout = [
  { image: generatedArt.bathroomFaucetWaterLeft, x: 228.125, y: 187.5, w: 65.625, h: 68.75 },
  { image: generatedArt.bathroomFaucetWaterMiddle, x: 325, y: 178.125, w: 62.5, h: 65.625 },
  { image: generatedArt.bathroomFaucetWaterRight, x: 409.375, y: 165.625, w: 71.875, h: 68.75 }
];

function drawBathroomFaucetWater() {
  bathroomFaucetWaterSpriteLayout.forEach((water, index) => {
    if (!state.bathroomFaucets[index]) return;
    ctx.drawImage(water.image, water.x, water.y, water.w, water.h);
  });
}

const BATHROOM_STEAM_DELAY_MS = 3000;
const BATHROOM_STEAM_REVEAL_MS = 2200;
const bathroomSteamMirrorLayout = { x: 140, y: 22.5, w: 415, h: 267.5 };

function drawBathroomSteamMirror() {
  if (!state.bathroomMirrorCodeRevealed && !state.bathroomSteamRevealStart) return;
  const progress = state.bathroomMirrorCodeRevealed
    ? 1
    : Math.max(0, Math.min(1, (performance.now() - state.bathroomSteamRevealStart) / BATHROOM_STEAM_REVEAL_MS));
  if (progress <= 0) return;

  const sheet = generatedArt.bathroomSteamMirrorSheet;
  const frameWidth = sheet.naturalWidth / 4;
  const frameHeight = sheet.naturalHeight;
  if (!frameWidth || !frameHeight) return;

  const framePosition = progress * 3;
  const firstFrame = Math.min(3, Math.floor(framePosition));
  const secondFrame = Math.min(3, firstFrame + 1);
  const mix = framePosition - firstFrame;
  const fadeIn = Math.min(1, progress * 8);
  // Once a faucet is turned off, retain the fogged clue but omit the bottom
  // faucet/water portion of the generated frame so no phantom water remains.
  const sourceHeight = state.bathroomFaucets.every(Boolean) ? frameHeight : Math.round(frameHeight * .72);
  const destinationHeight = bathroomSteamMirrorLayout.h * sourceHeight / frameHeight;

  const drawFrame = (frame, alpha) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha * fadeIn;
    ctx.drawImage(
      sheet,
      frame * frameWidth, 0, frameWidth, sourceHeight,
      bathroomSteamMirrorLayout.x, bathroomSteamMirrorLayout.y,
      bathroomSteamMirrorLayout.w, destinationHeight
    );
    ctx.restore();
  };
  drawFrame(firstFrame, 1 - mix);
  if (secondFrame !== firstFrame) drawFrame(secondFrame, mix);
}

function drawBathroomBackgroundRegion(image, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(image, 0, 0, 960, 640);
  ctx.restore();
}

function drawGeneratedUtilityCloset(time) {
  ctx.drawImage(generatedArt.utilityBackground, 0, 0, 960, 640);
  drawUtilityDoorOpenBackground();
  drawUtilityProps(time);
  if (state.hover) drawGeneratedSpriteHighlight(state.hover.id);
  if (!["slime", "wire", "hoseWire", "ventSwipe"].includes(state.utilityAction?.type)) {
    ctx.save();
    drawPlayer(time);
    ctx.restore();
  }
  drawUtilityActionOverlay(time);
  drawHover();
}

function drawUtilityDoorOpenBackground() {
  if (!generatedArt.utilityBackgroundDoorOpen.complete || !generatedArt.utilityBackgroundDoorOpen.naturalWidth) return;
  const openingAction = state.utilityAction?.type === "utilityDoorOpen" ? state.utilityAction : null;
  if (!state.utilityDoorOpen && !openingAction) return;
  let alpha = 1;
  if (openingAction) {
    const elapsed = performance.now() - openingAction.start;
    const t = Math.min(1, elapsed / openingAction.duration);
    alpha = t * t * (3 - 2 * t);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(generatedArt.utilityBackgroundDoorOpen, 0, 0, 960, 640);
  ctx.restore();
}

const utilityPropRects = {
  utilityHose: [82, 238, 110, 72],
  utilityCleanRag: [130, 166, 60, 40],
  utilityToolkit: [780, 325, 125, 114],
  utilitySlimeBox: [246, 66, 92, 70],
  utilityWire: [608, 123, 67, 34],
  utilityDoorButton: [546, 78, 47, 82],
  utilityEmptyBox: [711, 103, 93, 96]
};

function utilityWirePullPose(time) {
  const isHosePull = state.utilityAction?.type === "hoseWire";
  const elapsed = state.utilityAction?.type === "wire" || isHosePull ? performance.now() - state.utilityAction.start : 0;
  const t = Math.min(1, elapsed / (isHosePull ? 2400 : 1750));
  const frame = t < .24 ? 0 : t < .58 ? 1 : 2;
  const recoil = frame === 2 ? Math.sin(time * 28) * 1.5 : 0;
  const drawX = state.player.x - 88 + recoil;
  const drawY = state.player.y - 275;
  const handOffsets = [
    { x: 123, y: 142 },
    { x: 114, y: 162 },
    { x: 104, y: 142 }
  ];
  return {
    frame,
    recoil,
    drawX,
    drawY,
    handX: drawX + handOffsets[frame].x,
    handY: drawY + handOffsets[frame].y
  };
}

function drawUtilityProp(id, time) {
  const rect = utilityPropRects[id];
  if (!rect) return;
  const [x, y, w, h] = rect;
  ctx.save();
  if (id === "utilityHose") ctx.drawImage(generatedArt.utilityHose, x, y, w, h);
  if (id === "utilityCleanRag") {
    // Use the complete transparent cloth sprite. The previous 40x14 in-place
    // crop physically omitted its folded edges and looked visibly cut off.
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-.45);
    ctx.drawImage(generatedArt.utilityCleanRag, -30, -20, 60, 40);
  }
  if (id === "utilityToolkit") {
    if (state.utilityToolkitOpen) {
      ctx.drawImage(generatedArt.utilityToolkitOpen, 837, 178, 556, 616, 780, 312, 125, 132);
    } else {
      ctx.drawImage(generatedArt.utilityToolkit, 780, 325, 125, 114);
    }
  }
  if (id === "utilitySlimeBox") ctx.drawImage(generatedArt.utilitySlimeBox, x, y, w, h);
  if (id === "utilityDoorButton") {
    ctx.drawImage(generatedArt.utilityDoorButton, x, y, w, h);
    if (state.utilityDoorPanelOpen) {
      ctx.save();
      ctx.globalAlpha = .72 + Math.sin(time * 8) * .12;
      ctx.fillStyle = "rgba(92, 245, 255, .28)";
      ctx.beginPath();
      ctx.arc(571, 101, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  if (id === "utilityWire") {
    if (state.utilityAction?.type === "wire" || state.utilityAction?.type === "hoseWire") {
      // The cable drops from the shelf recess toward the astronaut's hands, so
      // the action reads as pulling it down instead of dragging it across air.
      const [wireX, wireY, wireW, wireH] = utilityPropRects.utilityWire;
      const anchorX = wireX + wireW - 6;
      const anchorY = wireY + wireH * .5;
      const pose = utilityWirePullPose(time);
      const plugX = pose.handX;
      const plugY = pose.handY;
      const dx = anchorX - plugX;
      const dy = anchorY - plugY;
      const length = Math.hypot(dx, dy);
      ctx.save();
      ctx.translate(plugX, plugY);
      ctx.rotate(Math.atan2(dy, dx));
      const cableStart = pose.frame === 2 ? 10 : 12;
      const cableLength = Math.max(4, length - cableStart);
      ctx.drawImage(generatedArt.utilityWirePull, 145, 0, 238, 116, cableStart, -8, cableLength, 16);
      if (state.utilityAction?.type === "hoseWire") {
        ctx.globalAlpha = .84;
        ctx.drawImage(generatedArt.utilityHose, cableStart + 4, -15, Math.max(32, cableLength * .52), 30);
      }
      ctx.restore();
    } else if (state.utilityCableRouted) {
      drawUtilityRoutedCable(time);
    } else {
      ctx.drawImage(generatedArt.utilityWire, x, y, w, h);
    }
  }
  if (id === "utilityEmptyBox") ctx.drawImage(generatedArt.utilityEmptyBox, x, y, w, h);
  ctx.restore();
}

function drawUtilityRoutedCable(time) {
  ctx.drawImage(generatedArt.utilityRoutedCable, 0, 0, 960, 640);
  ctx.save();
  ctx.fillStyle = `rgba(92, 245, 255, ${.18 + Math.sin(time * 8) * .06})`;
  ctx.beginPath();
  ctx.arc(571, 101, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawUtilityWireHandConnector(time) {
  const [wireX, wireY, wireW, wireH] = utilityPropRects.utilityWire;
  const anchorX = wireX + wireW - 6;
  const anchorY = wireY + wireH * .5;
  const pose = utilityWirePullPose(time);
  const dx = anchorX - pose.handX;
  const dy = anchorY - pose.handY;
  const connectorW = 52;
  const connectorH = 33;
  ctx.save();
  ctx.translate(pose.handX, pose.handY);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.drawImage(generatedArt.utilityWirePull, 0, 0, 150, 116, -connectorW * .5, -connectorH * .5, connectorW, connectorH);
  ctx.restore();
}

function drawUtilityWireHandsOverlay(time) {
  const handsSheet = generatedArt.utilityWirePullHands;
  if (!handsSheet.complete || !handsSheet.naturalWidth) return;
  const pose = utilityWirePullPose(time);
  const frameWidth = handsSheet.naturalWidth / 3;
  ctx.drawImage(
    handsSheet,
    pose.frame * frameWidth,
    0,
    frameWidth,
    handsSheet.naturalHeight,
    pose.drawX,
    pose.drawY,
    176,
    233
  );
}

function drawUtilityProps(time) {
  if (!state.utilityHoseCollected && state.utilityAction?.item !== "hose") drawUtilityProp("utilityHose", time);
  if (!state.utilityCleanRagCollected && state.utilityAction?.item !== "cleanRag") drawUtilityProp("utilityCleanRag", time);
  drawUtilityProp("utilityToolkit", time);
  if (!state.utilitySlimeBoxFallen) drawUtilityProp("utilitySlimeBox", time);
  drawUtilityProp("utilityWire", time);
  drawUtilityProp("utilityDoorButton", time);
  if (state.utilityAction?.type !== "emptyBox") drawUtilityProp("utilityEmptyBox", time);
  if (state.utilitySlimeBoxFallen && state.utilityAction?.type !== "slime") {
    ctx.save();
    ctx.translate(395, 294);
    ctx.rotate(.48);
    ctx.drawImage(generatedArt.utilitySlimeBox, -48, -35, 96, 70);
    ctx.restore();
  }
}

function drawUtilityPickupSprite(item, x, y, scale = 1) {
  const image = item === "hose" ? generatedArt.utilityHose : item === "cleanRag" ? generatedArt.utilityCleanRag : generatedArt.utilityWrench;
  const size = item === "hose" ? [86, 62] : item === "cleanRag" ? [70, 34] : [86, 48];
  ctx.drawImage(image, x - size[0] * scale / 2, y - size[1] * scale / 2, size[0] * scale, size[1] * scale);
}

function drawUtilityPlayerFrame(image, columns, col, row, x, y, angle = 0) {
  if (!image.complete || !image.naturalWidth) return;
  const sw = image.naturalWidth / columns;
  const sh = image.naturalHeight / (image === generatedArt.playerSheet ? 4 : 1);
  const sx = col * sw + 2;
  const sy = row * sh + 2;
  const dw = 176;
  const dh = 270;
  const footAnchor = dh * .448;
  ctx.save();
  ctx.translate(x, y - footAnchor);
  ctx.rotate(angle);
  ctx.drawImage(image, sx, sy, sw - 4, sh - 4, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawUtilityVentPlayerFrame(frame, x, y, scale = 1, angle = 0) {
  const image = generatedArt.utilityVentPlayer;
  if (!image.complete || !image.naturalWidth) return;
  const columns = 4;
  const sw = image.naturalWidth / columns;
  const sh = image.naturalHeight;
  // This generated sheet is tightly cropped compared with the regular player
  // sheet. Draw it smaller so the visible astronaut matches the normal sprite.
  const dw = 158 * scale;
  const dh = 238 * scale;
  const footAnchor = dh * .43;
  ctx.save();
  ctx.translate(x, y - footAnchor);
  ctx.rotate(angle);
  ctx.drawImage(image, frame * sw, 0, sw, sh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawUtilityVentPawArt(x, y, width, height, angle = 0, alpha = 1) {
  if (!generatedArt.utilityVentPaw.complete || !generatedArt.utilityVentPaw.naturalWidth) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle);
  ctx.drawImage(generatedArt.utilityVentPaw, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawUtilityVentSwipeAction(time, action, t) {
  const startX = action.startX ?? state.player.x;
  const startY = action.startY ?? state.player.y;
  const firstClimbT = Math.min(1, t / .26);
  const firstClimbEase = firstClimbT * firstClimbT * (3 - 2 * firstClimbT);
  const secondClimbT = Math.max(0, Math.min(1, (t - .26) / .30));
  const secondClimbEase = secondClimbT * secondClimbT * (3 - 2 * secondClimbT);
  // Climb toward the actual right shelf: first contact is the shelf front edge,
  // then the reach continues up toward the vent opening.
  const climbX = startX + (706 - startX) * firstClimbEase + (784 - 706) * secondClimbEase;
  const climbY = startY + (438 - startY) * firstClimbEase + (365 - 438) * secondClimbEase;
  const fallT = Math.max(0, Math.min(1, (t - .62) / .28));
  const fallEase = fallT * fallT * (3 - 2 * fallT);
  const fallX = 784 + (650 - 784) * fallEase;
  const fallY = 365 + (500 - 365) * fallEase - Math.sin(fallT * Math.PI) * 30;
  const pawT = Math.max(0, Math.min(1, (t - .40) / .20));
  const retreatT = Math.max(0, Math.min(1, (t - .78) / .22));

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, .52)";
  ctx.beginPath();
  ctx.ellipse(902, 147, 54, 82, .08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (t >= .40) {
    let pawX = 850 - pawT * 64 + retreatT * 52;
    let pawY = 102 + pawT * 20 - retreatT * 8;
    let pawW = 104 + pawT * 70 - retreatT * 42;
    let pawH = 68 + pawT * 40 - retreatT * 22;
    let pawAngle = -.04;
    if (t > .56 && t < .78) {
      pawX = 762 + Math.sin(time / 55) * 8;
      pawY = 128 + Math.cos(time / 70) * 5;
      pawW = 176;
      pawH = 106;
      pawAngle = -.10;
      drawUtilityVentPawArt(pawX + 26, pawY - 8, pawW * .90, pawH * .90, pawAngle, .24);
      drawUtilityVentPawArt(pawX + 12, pawY - 3, pawW * .95, pawH * .95, pawAngle, .34);
    }
    drawUtilityVentPawArt(pawX, pawY, pawW, pawH, pawAngle, 1);
  }

  if (t < .26) {
    drawUtilityVentPlayerFrame(0, climbX, climbY);
  } else if (t < .60) {
    drawUtilityVentPlayerFrame(1, climbX, climbY);
  } else if (t < .90) {
    drawUtilityVentPlayerFrame(2, fallX, fallY, 1, -.07 * fallT);
  } else {
    drawUtilityVentPlayerFrame(3, 650, 500);
  }
}

function drawUtilityActionOverlay(time) {
  const action = state.utilityAction;
  if (!action) return;
  const elapsed = performance.now() - action.start;
  const t = Math.min(1, elapsed / action.duration);
  const p = state.player;

  if (action.type === "pickup") {
    const origins = { hose: [137, 274], cleanRag: [160, 186], wrench: [801, 336] };
    const [ox, oy] = origins[action.item];
    const eased = 1 - Math.pow(1 - t, 3);
    drawUtilityPickupSprite(action.item, ox + (p.x - ox) * eased, oy + (p.y - 72 - oy) * eased, 1 - eased * .3);
  } else if (action.type === "slime") {
    const reactionImage = generatedArt.utilitySlimeReaction;
    const frameWidth = reactionImage.naturalWidth / 4;
    const frame = t < .27 ? 0 : t < .48 ? 1 : t < .79 ? 2 : 3;
    ctx.drawImage(
      reactionImage,
      frame * frameWidth + 2,
      2,
      frameWidth - 4,
      reactionImage.naturalHeight - 4,
      p.x - 76,
      p.y - 204,
      152,
      233
    );

    const fall = Math.max(0, Math.min(1, (t - .23) / .24));
    const settle = Math.max(0, Math.min(1, (t - .48) / .2));
    const headX = p.x;
    const headY = p.y - 153;
    const bx = 292 + (headX - 292) * fall + (395 - headX) * settle;
    const by = 101 + (headY - 101) * fall * fall + (294 - headY) * settle * settle;
    if (t < .68) {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(fall * 1.7 + settle * 1.2);
      ctx.drawImage(generatedArt.utilitySlimeBox, -48, -35, 96, 70);
      ctx.restore();
    }
  } else if (action.type === "wire" || action.type === "hoseWire") {
    const pullSheet = generatedArt.utilityWirePullPlayer;
    const frameWidth = pullSheet.naturalWidth / 3;
    const pose = utilityWirePullPose(time);
    ctx.drawImage(
      pullSheet,
      pose.frame * frameWidth + 2,
      2,
      frameWidth - 4,
      pullSheet.naturalHeight - 4,
      pose.drawX,
      pose.drawY,
      176,
      233
    );
    if (action.type === "hoseWire") {
      ctx.save();
      ctx.translate(pose.handX - 16, pose.handY + 8);
      ctx.rotate(-.18 + Math.sin(time * 18) * .04);
      ctx.drawImage(generatedArt.utilityHose, -42, -18, 84, 36);
      ctx.restore();
    }
    drawUtilityWireHandConnector(time);
    drawUtilityWireHandsOverlay(time);
  } else if (action.type === "emptyBox") {
    const boxX = p.x;
    const boxY = p.y - 175;
    ctx.save();
    ctx.translate(boxX + Math.sin(time * 24) * 3, boxY + Math.sin(time * 18) * 2);
    ctx.rotate(Math.PI + Math.sin(time * 22) * .2);
    ctx.drawImage(generatedArt.utilityEmptyBox, -42, -44, 84, 88);
    ctx.restore();
    ctx.fillStyle = "rgba(202,190,165,.72)";
    for (let i = 0; i < 9; i++) {
      const phase = (t * 1.8 + i * .13) % 1;
      ctx.beginPath();
      ctx.arc(boxX - 24 + (i % 5) * 12, boxY + 36 + phase * 72, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (action.type === "ventSwipe") {
    drawUtilityVentSwipeAction(time, action, t);
  }
}

function updateUtilityAction() {
  const action = state.utilityAction;
  if (!action || performance.now() - action.start < action.duration) return;

  state.utilityAction = null;
  if (action.type === "pickup") {
    if (action.item === "hose") state.utilityHoseCollected = true;
    if (action.item === "cleanRag") state.utilityCleanRagCollected = true;
    if (action.item === "wrench") {
      state.utilityWrenchCollected = true;
      state.utilityToolkitOpen = false;
    }
    addItem(action.item);
  } else if (action.type === "slime") {
    state.utilitySlimed = false;
    playSfx("squish");
  } else if (action.type === "wire") {
    playSfx("clank");
  } else if (action.type === "hoseWire") {
    state.utilityCableRouted = true;
    state.utilityPowerStart = performance.now();
    Object.assign(state.player, { x: 570, y: 372, tx: 570, ty: 372, facing: "right", forcedFacing: null, currentDone: null, path: [] });
    playSfx("ding");
  } else if (action.type === "utilityDoorOpen") {
    state.utilityDoorOpen = true;
    Object.assign(state.player, { x: 570, y: 372, tx: 570, ty: 372, facing: "up", forcedFacing: null, currentDone: null, path: [] });
    playSfx("clank");
  } else if (action.type === "emptyBox") {
    playSfx("pop");
  } else if (action.type === "ventSwipe") {
    Object.assign(state.player, { x: 650, y: 500, tx: 650, ty: 500, facing: "down", forcedFacing: null, currentDone: null, path: [] });
    playSfx("pop");
  }
  updateUI();
}

const hallwayPropCrops = {
  hallTrash: { source: [195, 37, 251, 403], target: [171, 330, 94, 151] },
  // Its brushes now rest on the painted deck, above the front lip and piping.
  hallCleaner: { source: [1203, 116, 243, 302], target: [0, 362, 95, 118] },
  hallMirror: { source: [199, 472, 224, 434], target: [438, 164, 112, 217] },
  hallVase: { source: [704, 587, 183, 250], target: [530, 290, 60, 82] },
  hallVent: { source: [1158, 541, 311, 354], target: [684, 28, 112, 128] }
};

function drawHallwayProp(id, time) {
  const active = state.hallwayEffect === id.replace("hall", "").replace(/^./, c => c.toLowerCase()) && performance.now() < state.hallwayEffectUntil;
  ctx.save();

  if (id === "hallPaper") {
    const wobble = state.hallwayEffect === "paper" && performance.now() < state.hallwayEffectUntil ? Math.sin(time * 20) * .025 : 0;
    ctx.translate(189, 254);
    ctx.rotate(wobble);
    ctx.drawImage(generatedArt.hallwayPaperArt, 295, 147, 704, 912, -54, -70, 108, 140);
    ctx.restore();
    return;
  }

  const crop = hallwayPropCrops[id];
  if (!crop) {
    ctx.restore();
    return;
  }
  const [sx, sy, sw, sh] = crop.source;
  let [x, y, w, h] = crop.target;
  if (id === "hallCleaner") {
    const working = state.hallwayCleanerMode === "wiping" || state.hallwayCleanerMode === "jamming";
    const shake = working ? Math.sin(time * (state.hallwayCleanerMode === "jamming" ? 42 : 24)) * (state.hallwayCleanerMode === "jamming" ? 5 : 2) : 0;
    x = state.hallwayCleanerX - w / 2 + shake;
  }
  const effectName = {
    hallTrash: "trash",
    hallCleaner: "cleaner",
    hallMirror: "mirror",
    hallVase: "vase",
    hallVent: "hallVent"
  }[id];
  const reacting = state.hallwayEffect === effectName && performance.now() < state.hallwayEffectUntil;
  const rotation = reacting && (id === "hallTrash" || id === "hallVase" || id === "hallVent") ? Math.sin(time * 28) * .035 : 0;
  const scale = reacting && id === "hallMirror" ? 1 + Math.sin(time * 14) * .025 : 1;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(generatedArt.hallwayProps, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawGeneratedHallway(time) {
  ctx.drawImage(generatedArt.hallwayBackground, 0, 0, 960, 640);
  drawHallwayOpenDoorStates();
  drawHallwayPowerSignal();
  drawHallwayLooseItems();
  // Wall-mounted and tabletop props sit behind the astronaut.
  for (const id of ["hallPaper", "hallMirror", "hallVase", "hallVent"]) drawHallwayProp(id, time);
  drawHallwayTonePulse();
  if (state.hallwayRopeInstalled) drawHallwayRope(time);
  const foregroundPropIds = new Set(["hallTrash", "hallCleaner"]);
  const hoveringForegroundProp = state.hover && foregroundPropIds.has(state.hover.id);
  if (state.hover && !hoveringForegroundProp) drawGeneratedSpriteHighlight(state.hover.id);
  drawPlayer(time);
  // These objects occupy the near edge of the deck. Repainting them after the
  // astronaut makes movement read as passing behind them instead of through
  // their artwork.
  drawHallwayProp("hallTrash", time);
  drawHallwayProp("hallCleaner", time);
  if (hoveringForegroundProp) drawGeneratedSpriteHighlight(state.hover.id);
  if (state.hallwayRopeTying) drawHallwayRopeTyingAnimation(time);
  drawHallwayPickup();
  if (state.keypadOpen) drawHallwayKeypad();
  else drawHover();
}

function drawHallwayBackgroundRegion(image, x, y, w, h, alpha = 1) {
  if (!image.complete || !image.naturalWidth || alpha <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, 0, 0, 960, 640);
  ctx.restore();
}

function drawHallwayOpenDoorStates() {
  // Repaint only the generated doorway regions, preserving the original
  // hallway painting pixel-for-pixel everywhere else.
  if (state.utilityDoorOpen) {
    drawHallwayBackgroundRegion(generatedArt.hallwayUtilityOpenBackground, 598, 164, 148, 266);
  }
  if (state.hallDoorAOpen) {
    const elapsed = performance.now() - state.hallDoorAOpenStart;
    const progress = Math.min(1, Math.max(0, elapsed / 850));
    const alpha = progress * progress * (3 - 2 * progress);
    drawHallwayBackgroundRegion(generatedArt.hallwayBothOpenBackground, 254, 164, 148, 266, alpha);
  }
}

function activeUtilityPowerSignal(now = performance.now()) {
  if (!state.utilityCableRouted) return null;
  const cycleMs = 3600;
  const elapsed = Math.max(0, now - (state.utilityPowerStart || now)) % cycleMs;
  const pulses = [
    { group: "left", start: 0, end: 300 },
    { group: "left", start: 520, end: 820 },
    { group: "right", start: 1160, end: 1510 },
    { group: "middle", start: 1850, end: 2200 }
  ];
  const pulse = pulses.find(candidate => elapsed >= candidate.start && elapsed < candidate.end);
  if (!pulse) return null;
  const progress = (elapsed - pulse.start) / (pulse.end - pulse.start);
  return { group: pulse.group, alpha: .42 + Math.sin(progress * Math.PI) * .58 };
}

function drawGreenPowerLight(x, y, radiusX, radiusY, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = `rgba(91,255,136,${alpha})`;
  ctx.shadowBlur = Math.max(radiusX, radiusY) * 1.7;
  const glow = ctx.createRadialGradient(x, y, 1, x, y, Math.max(radiusX, radiusY) * 1.55);
  glow.addColorStop(0, `rgba(210,255,202,${alpha})`);
  glow.addColorStop(.32, `rgba(77,255,119,${alpha * .96})`);
  glow.addColorStop(1, "rgba(34,185,84,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX * 1.55, radiusY * 1.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(116,255,139,${alpha * .78})`;
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHallwayPowerSignal() {
  const signal = activeUtilityPowerSignal();
  if (!signal) return;
  // Only the three indicator fixtures below the floor participate in the
  // power-code sequence. The cyan wall controls remain visually unchanged.
  const fixtures = {
    left: [[241, 576, 13, 13]],
    middle: [[486, 578, 14, 14]],
    right: [[712, 578, 22, 12]]
  };
  for (const fixture of fixtures[signal.group]) {
    drawGreenPowerLight(...fixture, signal.alpha);
  }
}

function drawAirlockPowerSignal() {
  const signal = activeUtilityPowerSignal();
  if (!signal) return;
  // Match the Airlock's three under-floor fixtures to the same repeating code.
  // No wall, scanner, hatch, or deck-lip lights are altered.
  const fixtures = {
    left: [[213, 580, 11, 11]],
    middle: [[525, 585, 13, 11]],
    right: [[753, 581, 17, 11]]
  };
  for (const fixture of fixtures[signal.group]) {
    drawGreenPowerLight(...fixture, signal.alpha);
  }
}

function drawHallwayTonePulse() {
  if (!state.hallwayTonePulse || performance.now() >= state.hallwayTonePulseUntil) return;
  const positions = {
    hallToneLeft: [258, 317, 14],
    hallToneMiddle: [418, 289, 17],
    hallToneRight: [798, 245, 16]
  };
  const position = positions[state.hallwayTonePulse];
  if (!position) return;
  const [x, y, radius] = position;
  const remaining = Math.max(0, state.hallwayTonePulseUntil - performance.now());
  const progress = 1 - remaining / 820;
  ctx.save();
  ctx.strokeStyle = `rgba(112,255,244,${.9 * (1 - progress)})`;
  ctx.lineWidth = 4 - progress * 2;
  ctx.shadowBlur = 18;
  ctx.shadowColor = "rgba(66,255,241,.95)";
  ctx.beginPath();
  ctx.arc(x, y, radius + progress * 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHallwayLooseItems() {
  const pickingRag = state.hallwayPickup?.id === "rag";
  const pickingDirt = state.hallwayPickup?.id === "dirt";
  if (!state.hallwayRagCollected && !pickingRag) {
    ctx.drawImage(generatedArt.hallwayRag, 192, 334, 46, 32);
  }
  if (!state.hallwayDirtCollected && !pickingDirt) {
    ctx.drawImage(generatedArt.hallwayDirt, 546, 273, 28, 17);
  }
  if (state.hallwayDirtSpilled) {
    ctx.drawImage(generatedArt.hallwayDirt, state.hallwayDirtX - 29, 449, 58, 30);
  }
  if (state.hallwayRagShredsAvailable && !state.hallwayRagShredsCollected && state.hallwayPickup?.id !== "ragShreds") {
    drawHallwayRagShreds(state.hallwayRagShredsX, 460);
  }
}

function drawHallwayRagShreds(x, y) {
  ctx.save();
  for (const [dx, dy, angle, w, h] of [[-22, 2, -.35, 34, 18], [8, -3, .22, 38, 19], [25, 6, -.12, 29, 16]]) {
    ctx.save();
    ctx.translate(x + dx, y + dy);
    ctx.rotate(angle);
    ctx.drawImage(generatedArt.hallwayRag, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  ctx.restore();
}

function drawHallwayRope(time) {
  ctx.save();
  // Paint the small loop first, then repaint the vent face over its middle.
  // The knot and hanging length are painted last, creating a real wrap around
  // one of the horizontal slats rather than a rope floating over the vent.
  ctx.drawImage(generatedArt.hallwayRope, 390, 24, 220, 230, 717, 55, 42, 52);
  drawHallwayProp("hallVent", time);
  ctx.drawImage(generatedArt.hallwayRope, 390, 188, 220, 210, 713, 84, 50, 48);

  const anchorX = 738;
  const anchorY = 119;
  const sway = Math.sin(time * 1.8) * .009;
  ctx.translate(anchorX, anchorY);
  ctx.rotate(sway);
  ctx.drawImage(generatedArt.hallwayRope, 390, 286, 220, 1228, -25, -2, 50, 364);
  ctx.restore();
}

function drawHallwayRopeTyingAnimation(time) {
  const elapsed = Math.min(1500, performance.now() - state.hallwayRopeTieStart);
  const progress = elapsed / 1500;
  const knotCycle = Math.sin(progress * Math.PI * 6);
  const handY = state.player.y - 64;
  const handSpread = 24 - Math.abs(knotCycle) * 12;

  ctx.save();
  ctx.translate(state.player.x, handY);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * handSpread, side * knotCycle * 3);
    ctx.rotate(side * (.42 - progress * .18) + knotCycle * .12);
    ctx.drawImage(generatedArt.hallwayRag, -22, -12, 44, 24);
    ctx.restore();
  }
  if (progress > .62) {
    const reveal = (progress - .62) / .38;
    ctx.globalAlpha = reveal;
    ctx.drawImage(generatedArt.hallwayRope, 390, 24, 220, 1490, -13, -42, 26, 96);
  }
  ctx.restore();
}

function drawHallwayPickup() {
  const pickup = state.hallwayPickup;
  if (!pickup) return;
  const elapsed = performance.now() - pickup.start;
  const lift = Math.min(1, elapsed / 620);
  const eased = 1 - Math.pow(1 - lift, 3);
  const holdBob = lift >= 1 ? Math.sin(elapsed * .012) * 2 : 0;
  const target = { x: state.player.x, y: state.player.y - 76 + holdBob };
  const x = pickup.from.x + (target.x - pickup.from.x) * eased;
  const y = pickup.from.y + (target.y - pickup.from.y) * eased - Math.sin(eased * Math.PI) * 24;
  const image = pickup.id === "rag" || pickup.id === "ragShreds" ? generatedArt.hallwayRag : generatedArt.hallwayDirt;
  const w = pickup.id === "rag" ? 64 : pickup.id === "ragShreds" ? 54 : 58;
  const h = pickup.id === "rag" ? 44 : pickup.id === "ragShreds" ? 30 : 34;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((1 - eased) * -.18);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawHallwayKeypad() {
  ctx.save();
  ctx.fillStyle = "rgba(8, 8, 18, .78)";
  ctx.fillRect(0, 0, 960, 640);
  const panel = ctx.createLinearGradient(0, 104, 0, 548);
  panel.addColorStop(0, "#4d3158");
  panel.addColorStop(.55, "#241c38");
  panel.addColorStop(1, "#10192b");
  ctx.fillStyle = panel;
  ctx.strokeStyle = "#b779c8";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(292, 102, 376, 448, 28);
  ctx.fill();
  ctx.stroke();

  const feedback = performance.now() < state.keypadFeedbackUntil;
  ctx.fillStyle = feedback ? (state.keypadUnlocked ? "#5ff0d4" : "#ff6aa8") : "#071a24";
  ctx.strokeStyle = "#5bded8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(334, 142, 292, 54, 14);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.keypadEntry.length ? "#ff75c5" : "rgba(91,222,216,.22)";
    ctx.beginPath();
    ctx.arc(430 + i * 50, 169, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  const keyHotspots = keypadHotspotList();
  for (const key of keyHotspots) {
    const hovered = state.hover?.id === key.id;
    ctx.fillStyle = hovered ? "#6c4776" : "#2c2744";
    ctx.strokeStyle = hovered ? "#ffd365" : "#6cded4";
    ctx.lineWidth = hovered ? 4 : 2;
    ctx.beginPath();
    ctx.roundRect(key.x, key.y, key.w, key.h, key.id === "keypad-close" ? 16 : 14);
    ctx.fill();
    ctx.stroke();
    let symbol = key.label;
    if (key.id === "keypad-clear") symbol = "↺";
    if (key.id === "keypad-enter") symbol = "✓";
    if (key.id === "keypad-close") symbol = "×";
    ctx.fillStyle = "#fff0c7";
    ctx.font = key.id === "keypad-close" ? "700 25px sans-serif" : "800 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol, key.x + key.w / 2, key.y + key.h / 2 + 1);
  }
  ctx.restore();
}

function drawGeneratedLeverSprite() {
  const frameWidth = generatedArt.lever.naturalWidth / 2;
  const frame = state.leverPulled ? 1 : 0;
  ctx.drawImage(
    generatedArt.lever,
    frame * frameWidth, 0, frameWidth, generatedArt.lever.naturalHeight,
    521, 230, 152, 152
  );
}

const TAG_DRAWER_OPEN_MS = 360;
const TAG_DROP_DELAY_MS = 300;
const TAG_DROP_DURATION_MS = 820;

function tagDropElapsed(now = performance.now()) {
  if (!state.tagReleaseStart) return Number.POSITIVE_INFINITY;
  return Math.max(0, now - state.tagReleaseStart);
}

function tagIsCollectible(now = performance.now()) {
  return state.tagAvailable && tagDropElapsed(now) >= TAG_DROP_DELAY_MS + TAG_DROP_DURATION_MS;
}

function drawGeneratedMaintenanceDrawer(now = performance.now()) {
  if (!state.pressureEqualized) return;
  const progress = Math.min(1, tagDropElapsed(now) / TAG_DRAWER_OPEN_MS);
  const eased = 1 - Math.pow(1 - progress, 3);
  ctx.save();
  // The drawer grows down and outward from the lower face of the lever console.
  ctx.translate(581, 349);
  ctx.scale(.72 + eased * .28, .16 + eased * .84);
  ctx.drawImage(generatedArt.maintenanceDrawer, -55, -8, 110, 78);
  ctx.restore();
}

function drawGeneratedMaintenanceTag(time = performance.now() / 1000) {
  if (!state.tagAvailable || hasItem("tag") || state.scannerSpoofed) return;
  const elapsed = tagDropElapsed();
  if (elapsed < TAG_DROP_DELAY_MS) return;
  const drop = Math.min(1, (elapsed - TAG_DROP_DELAY_MS) / TAG_DROP_DURATION_MS);
  const eased = drop * drop * (3 - 2 * drop);
  const x = 581 + (545 - 581) * eased;
  const y = 371 + (439 - 371) * (drop * drop);
  const bounce = drop < 1 ? Math.sin(drop * Math.PI) * 12 : 0;
  const rotation = drop < 1
    ? -.12 + drop * (Math.PI * 4 - .06)
    : -.18 + Math.sin(time * 4.2) * .025;
  ctx.save();
  ctx.translate(x, y - bounce);
  ctx.rotate(rotation);
  ctx.drawImage(generatedArt.maintenanceTag, -34, -34, 68, 68);
  ctx.restore();
}

function drawGeneratedSealedHelmet() {
  if (!state.ventSealed) return;
  // The transparent padding lets the helmet's upper rim tuck beneath the
  // painted ceiling opening while its repaired dome hangs into the room.
  ctx.drawImage(generatedArt.sealedHelmet, 365, -5, 240, 240);
}

function innerDoorOpenProgress() {
  if (!state.complete || !state.innerDoorOpenStart) return 0;
  const linear = Math.min(1, (performance.now() - state.innerDoorOpenStart) / 900);
  return 1 - Math.pow(1 - linear, 3);
}

function drawGeneratedInnerDoor(highlighted = false) {
  const x = 829.375;
  const y = 182.5;
  const w = 119.375;
  const h = 233.75;
  const progress = innerDoorOpenProgress();
  if (progress >= 1) return;

  const rejecting = performance.now() < state.innerDoorRejectUntil;
  const shake = rejecting ? Math.sin(performance.now() * .09) * 4 : 0;
  ctx.save();
  // Keep the rising door inside its painted frame so it reveals the dark
  // passage in the clean background instead of floating over the wall.
  ctx.beginPath();
  ctx.rect(x - 4, y - 4, w + 8, h + 8);
  ctx.clip();
  if (highlighted) {
    ctx.globalAlpha = .96;
    ctx.filter = "drop-shadow(3px 0 #ffd365) drop-shadow(-3px 0 #ffd365) drop-shadow(0 3px #ffd365) drop-shadow(0 -3px #ffd365)";
  }
  ctx.drawImage(generatedArt.objectInnerDoor, x + shake, y - progress * (h + 8), w, h);
  ctx.restore();
}

function outerHatchCloseProgress() {
  if (!state.outerDoorCloseStart) return 0;
  const linear = Math.min(1, (performance.now() - state.outerDoorCloseStart) / OUTER_HATCH_CLOSE_MS);
  return 1 - Math.pow(1 - linear, 3);
}

function drawGeneratedClosedOuterHatch(highlighted = false) {
  const progress = outerHatchCloseProgress();
  if (progress <= 0) return;
  const targetX = 14;
  const x = targetX - (1 - progress) * 225;
  const y = 134;
  const w = 176;
  const h = 268;
  ctx.save();
  // The door slides in from outside and remains clipped to the existing oval
  // hatch area. Source coordinates remove the transparent generation padding.
  ctx.beginPath();
  ctx.ellipse(102, 268, 96, 142, 0, 0, Math.PI * 2);
  ctx.clip();
  if (highlighted) {
    ctx.globalAlpha = .96;
    ctx.filter = "drop-shadow(3px 0 #ffd365) drop-shadow(-3px 0 #ffd365) drop-shadow(0 3px #ffd365) drop-shadow(0 -3px #ffd365)";
  }
  ctx.drawImage(generatedArt.outerHatchClosed, 79, 137, 858, 1200, x, y, w, h);
  ctx.restore();
}

function drawGeneratedObjectSprites(time) {
  if (!generatedArt.spritesReady) return;

  // Structural interactables are genuine sprites too. These same image
  // objects are re-drawn by drawGeneratedSpriteHighlight() on hover.
  ctx.drawImage(generatedArt.objectOuterHatch, 0, 123.75, 204.375, 281.875);
  drawGeneratedClosedOuterHatch();
  // Full original locker crop: source painting bounds (360, 240)-(625, 690)
  // scaled from the 1536x1024 artwork to the 960x640 game canvas.
  ctx.drawImage(generatedArt.objectLocker, 225, 150, 165.625, 281.25);
  // The approved locker cutout contains the exact inner rim/left edge that the
  // broad housing extraction trims. Composite it normally as a precision
  // detail layer so idle and highlighted locker silhouettes match perfectly.
  ctx.drawImage(generatedArt.highlightLocker, 263.125, 218.125, 119.375, 187.5);
  ctx.drawImage(generatedArt.objectLadder, 400, 62.5, 168.75, 393.75);
  ctx.drawImage(generatedArt.objectLeak, 368.75, 46.875, 208.75, 97.5);
  drawGeneratedSealedHelmet();
  ctx.drawImage(generatedArt.objectScanner, 696.25, 248.125, 51.25, 78.125);
  drawGeneratedInnerDoor();

  if (!state.toyExamining) drawGeneratedAlienToy(time, false);

  // Helmet pickup: it is an independent layer and vanishes as soon as it is
  // collected, combined, or installed over the leak.
  if (!hasItem("helmet") && !hasItem("patchedHelmet") && !state.ventSealed) {
    ctx.drawImage(generatedArt.helmet, 212, 368, 162, 108);
  }

  // Two painted states: raised before pressure is restored, pulled down after.
  drawGeneratedLeverSprite();
  drawGeneratedMaintenanceDrawer();
  drawGeneratedMaintenanceTag(time);

  // Two-state alien button sheet: intact is the left cell, broken/sprung is
  // the right cell. Both share the same floor anchor.
  const buttonFrameWidth = generatedArt.buttonSheet.naturalWidth / 2;
  const buttonFrame = state.decoyButtonBroken ? 1 : 0;
  ctx.drawImage(
    generatedArt.buttonSheet,
    buttonFrame * buttonFrameWidth, 0, buttonFrameWidth, generatedArt.buttonSheet.naturalHeight,
    615, 397, 126, 84
  );

}

function toyLiftAmount(now = performance.now()) {
  const elapsed = now - state.toyInspectStart;
  if (elapsed <= 320) {
    const t = Math.max(0, elapsed / 320);
    return 1 - Math.pow(1 - t, 3);
  }
  if (elapsed < 1460) return 1;
  const t = Math.min(1, Math.max(0, (elapsed - 1460) / 440));
  return 1 - (t * t * (3 - 2 * t));
}

function drawGeneratedAlienToy(time, examining = false) {
  if (!generatedArt.spritesReady) return;
  const groundX = 413;
  const groundY = 375;
  let x = groundX;
  let y = groundY;
  let scale = 1;
  let rotation = 0;

  if (examining) {
    const lift = toyLiftAmount();
    const side = state.player.facing === "left" ? -1 : 1;
    // Hold the plush beside the astronaut's torso, below the helmet viewport,
    // so the examination pose never covers the character's facial reaction.
    const heldX = state.player.x + side * 52;
    const heldY = state.player.y - 72;
    x += (heldX - groundX) * lift;
    y += (heldY - groundY) * lift;
    scale += lift * .08;
    rotation = side * lift * (.035 + Math.sin(time * 4.5) * .018);
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(generatedArt.alienToy, -25, -35, 50, 70);
  ctx.restore();
}

function drawAlienToyHugAnimation(time) {
  if (!generatedArt.alienToyHugSheet.complete || !generatedArt.alienToyHugSheet.naturalWidth) {
    drawPlayer(time);
    drawGeneratedAlienToy(time, true);
    return;
  }
  const elapsed = Math.max(0, performance.now() - state.toyInspectStart);
  let frame = 0;
  if (elapsed >= 1900) frame = 0;
  else if (elapsed >= 1500) frame = 1;
  else if (elapsed >= 900) frame = 2;
  else if (elapsed >= 400) frame = 1;

  const image = generatedArt.alienToyHugSheet;
  const sw = image.naturalWidth / 3;
  const sh = image.naturalHeight;
  // Match the normal standing sprite's visible height:
  // standing = 254/420 of its 270px draw box (~163px);
  // hug frames = ~526/724 of their cell, requiring a 225px draw box.
  const drawSize = 225;
  // Frame one includes the plush on the floor to the astronaut's right.
  // Offset only that composition so the astronaut's boots remain centered on
  // the same world position used by the held frames.
  const frameOffsetX = frame === 0 ? -40 : 0;
  const sourceBootY = frame === 0 ? .815 : frame === 1 ? .83 : .834;
  const drawX = state.player.x - drawSize / 2 + frameOffsetX;
  const drawY = state.player.y - drawSize * sourceBootY;

  ctx.save();
  ctx.drawImage(
    image,
    frame * sw,
    0,
    sw,
    sh,
    drawX,
    drawY,
    drawSize,
    drawSize
  );
  ctx.restore();
}

function drawGeneratedCart(time) {
  if (!generatedArt.spritesReady) return;
  // The cart is a movable sprite, never part of the room painting.
  const cartWobble = performance.now() < state.cartWobbleUntil ? Math.sin(time * 42) * .045 : 0;
  ctx.save();
  ctx.translate(state.cartX, 451);
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
  ctx.translate(state.cartX, 450 + Math.abs(cartWobble) * 4);
  ctx.rotate(cartWobble);
  ctx.fillStyle = "rgba(18,13,29,.45)";
  ctx.beginPath();
  ctx.ellipse(0, 24, 54, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = panelGradient(state.cartX - 48, 426, 96, 38, "#264f6d", "#14243a");
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
    const disgusted = state.reactionKind === "disgust";
    const reactionDuration = disgusted ? DISGUST_REACTION_MS : NOPE_REACTION_MS;
    const reactionElapsed = reactionDuration - (state.reactionUntil - reactionNow);
    const reactionFrame = Math.min(3, Math.max(0, Math.floor(reactionElapsed / (reactionDuration / 4))));
    const reactionImage = disgusted ? generatedArt.disgustSheet : generatedArt.ngSheet;
    const reactionWidth = reactionImage.naturalWidth / 4;
    const reactionHeight = reactionImage.naturalHeight;
    const inset = 2;
    if (disgusted) {
      const gagWidth = 200;
      const gagHeight = 230;
      // The generated cells share a fixed foot baseline. Anchor that baseline
      // to the player's ground position so the gag never floats or bounces.
      const gagFootY = gagHeight * (500 / 600);
      ctx.drawImage(
        reactionImage,
        reactionFrame * reactionWidth + inset,
        inset,
        reactionWidth - inset * 2,
        reactionHeight - inset * 2,
        p.x - gagWidth / 2,
        p.y - gagFootY,
        gagWidth,
        gagHeight
      );
      return;
    }
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
  const ladderPose = state.onLadder || p.forcedFacing === "up";
  const coughCycle = time % 4.2;
  const coughing = !state.ventSealed && !walking && !state.toyExamining && coughCycle > 3.2;
  const coughT = coughing ? Math.min(1, (coughCycle - 3.2) / 1) : 0;
  // Two compact jolts read as a cough without making the character bounce.
  const coughPulse = coughing ? Math.pow(Math.sin(coughT * Math.PI * 2), 2) : 0;
  const coughCycleId = Math.floor(time / 4.2);
  if (coughCycleId !== lastCoughCycle) {
    lastCoughCycle = coughCycleId;
    lastCoughBeat = 0;
  }
  const coughBeat = coughing ? (coughT >= .58 ? 2 : coughT >= .08 ? 1 : 0) : 0;
  if (coughBeat > lastCoughBeat) {
    lastCoughBeat = coughBeat;
    playCoughSfx(coughBeat);
  }
  const coughFacing = p.facing === "left" ? "left" : "right";
  const coughDirection = ladderPose ? 0 : coughFacing === "left" ? -1 : 1;
  const rowMap = { down: 0, right: 1, up: 2, left: 3 };
  const visualFacing = ladderPose ? "up" : coughing ? coughFacing : p.facing;
  const row = rowMap[visualFacing] ?? 0;
  const col = walking ? (Math.floor(time * 4.6) % 2 ? 1 : 2) : 0;
  const useCoughSprite = coughing && !ladderPose;
  const img = useCoughSprite ? generatedArt.coughSheet : generatedArt.playerSheet;
  const sw = img.naturalWidth / (useCoughSprite ? 2 : 3);
  const sh = img.naturalHeight / (useCoughSprite ? 1 : 4);
  const sx = (useCoughSprite ? (coughFacing === "left" ? 0 : 1) : col) * sw;
  const sy = useCoughSprite ? 0 : row * sh;
  const inset = 2;
  // The boots stay locked to the painted deck. The sprite frames supply the
  // walking motion; translating the whole body vertically made the astronaut
  // look as though it was hovering.
  const bob = 0;
  const lean = coughing && !ladderPose && !useCoughSprite ? coughDirection * .045 * coughPulse : 0;
  ctx.save();
  ctx.translate(p.x + coughDirection * coughPulse * 2.5, p.y + bob);
  ctx.rotate(lean);
  ctx.scale(1 + coughPulse * .012, 1 - coughPulse * .018);
  ctx.drawImage(img, sx + inset, sy + inset, sw - inset * 2, sh - inset * 2, -dw / 2, -footAnchor - dh / 2, dw, dh);
  if (coughing && !ladderPose) {
    // Keep the puff at the profile mouth, then let it drift outward and up.
    ctx.globalAlpha = .72 * coughPulse;
    drawGasCloud(
      coughDirection * (52 + coughPulse * 18),
      -footAnchor + 20 - coughPulse * 4,
      .09 + coughPulse * .075,
      time,
      .68
    );
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
  if (id === "bathroomExit") {
    drawSpriteOutlineOnly(generatedArt.bathroomExitHighlightMask, 0, 0, 960, 640);
    return true;
  }
  if (id === "bathroomTrash") {
    const sprite = bathroomCleaningSpriteLayout.bathroomTrash;
    drawSpriteOutlineOnly(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h);
    return true;
  }
  if (id === "bathroomJanitorCart") {
    const sprite = bathroomCleaningSpriteLayout.bathroomJanitorCart;
    drawSpriteOutlineOnly(sprite.image, sprite.x, sprite.y, sprite.w, sprite.h);
    return true;
  }
  if (id === "bathroomLeftStall") {
    // The extracted door sprite's alpha is the outline source; no hotspot box
    // or hand-drawn polygon participates in the hover effect.
    drawSpriteOutlineOnly(generatedArt.bathroomDoorLeft, 674, 31, 151, 319);
    return true;
  }
  if (id === "bathroomRightStall") {
    drawSpriteOutlineOnly(generatedArt.bathroomDoorRight, 836, 38, 142, 317);
    return true;
  }
  if (id === "bathroomMud") {
    drawSpriteOutlineOnly(generatedArt.bathroomMud, 852, 305, 89, 48);
    return true;
  }
  if (id === "bathroomBowl") {
    if (state.bathroomBowlCollected) return false;
    // Outline the same interactive sprite that is visible on the shelf.
    drawSpriteOutlineOnly(generatedArt.bathroomBowl, 716, 109, 48, 36);
    return true;
  }
  if (id === "bathroomFaucetLeft" || id === "bathroomFaucetMiddle" || id === "bathroomFaucetRight") {
    const faucet = bathroomFaucetSpriteLayout[id];
    drawSpriteOutlineOnly(faucet.image, faucet.x, faucet.y, faucet.w, faucet.h);
    return true;
  }
  ctx.save();
  ctx.globalAlpha = .96;
  ctx.filter = "drop-shadow(3px 0 #ffd365) drop-shadow(-3px 0 #ffd365) drop-shadow(0 3px #ffd365) drop-shadow(0 -3px #ffd365)";
  switch (id) {
    case "outerDoor":
      if (state.outerDoorCloseStart) drawGeneratedClosedOuterHatch(true);
      else ctx.drawImage(generatedArt.highlightOuterHatch, 0, 123.75, 204.375, 281.875);
      break;
    case "locker":
      ctx.drawImage(generatedArt.highlightLocker, 263.125, 218.125, 119.375, 187.5);
      break;
    case "ladder":
      ctx.drawImage(generatedArt.highlightLadder, 400, 62.5, 168.75, 393.75);
      break;
    case "vent":
      if (state.ventSealed) drawGeneratedSealedHelmet();
      else ctx.drawImage(generatedArt.highlightLeak, 384.375, 43.75, 197.5, 90);
      break;
    case "scanner":
      ctx.drawImage(generatedArt.objectScanner, 696.25, 248.125, 51.25, 78.125);
      break;
    case "innerDoor":
      drawGeneratedInnerDoor(true);
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
      ctx.translate(state.cartX, 451);
      ctx.drawImage(generatedArt.cart, -94, -64, 188, 125);
      break;
    case "alienToy":
      // The controller cursor can remain parked over the pickup position while
      // the toy is being examined. Never redraw its floor-state highlight
      // behind the held sprite during that animation.
      if (!state.toyExamining) drawGeneratedAlienToy(performance.now() / 1000, false);
      break;
    case "tag":
      drawGeneratedMaintenanceTag();
      break;
    case "hallTrash":
    case "hallPaper":
    case "hallCleaner":
    case "hallMirror":
    case "hallVase":
    case "hallVent":
      drawHallwayProp(id, performance.now() / 1000);
      if (id === "hallVent" && state.hallwayRopeInstalled) drawHallwayRope(performance.now() / 1000);
      break;
    case "hallRagShreds":
      drawHallwayRagShreds(state.hallwayRagShredsX, 460);
      break;
    case "utilityHose":
    case "utilityCleanRag":
    case "utilityToolkit":
    case "utilitySlimeBox":
    case "utilityWire":
    case "utilityDoorButton":
    case "utilityCenterDoor":
    case "utilityEmptyBox":
      if (id === "utilityDoorButton") {
        ctx.drawImage(generatedArt.utilityDoorButton, 3, 2, 70, 84, 548, 79, 44, 52);
      } else if (id === "utilityCenterDoor") {
        drawUtilityDoorOpenBackground();
      } else {
        drawUtilityProp(id, performance.now() / 1000);
      }
      break;
    default:
      ctx.restore();
      return false;
  }
  ctx.restore();
  return true;
}

const spriteOutlineCanvas = document.createElement("canvas");
spriteOutlineCanvas.width = canvas.width;
spriteOutlineCanvas.height = canvas.height;
const spriteOutlineCtx = spriteOutlineCanvas.getContext("2d");
function drawSpriteOutlineOnly(image, x, y, w, h, radius = 3) {
  spriteOutlineCtx.clearRect(0, 0, spriteOutlineCanvas.width, spriteOutlineCanvas.height);
  spriteOutlineCtx.save();
  spriteOutlineCtx.fillStyle = "#ffd365";
  // Build a solid expanded silhouette from the sprite's alpha channel.
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI * 2 / 16;
    spriteOutlineCtx.drawImage(image, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, w, h);
  }
  spriteOutlineCtx.globalCompositeOperation = "source-in";
  spriteOutlineCtx.fillRect(x - radius, y - radius, w + radius * 2, h + radius * 2);
  // Remove the original silhouette, leaving only the narrow exterior ring.
  spriteOutlineCtx.globalCompositeOperation = "destination-out";
  spriteOutlineCtx.drawImage(image, x, y, w, h);
  spriteOutlineCtx.restore();

  ctx.save();
  ctx.globalAlpha = .98;
  ctx.shadowBlur = 9;
  ctx.shadowColor = "rgba(255,211,101,.82)";
  ctx.drawImage(spriteOutlineCanvas, 0, 0);
  ctx.restore();
}

const generatedSpriteHighlightIds = new Set([
  "outerDoor", "locker", "ladder", "vent", "scanner", "innerDoor",
  "helmetSpot", "lever", "decoyButton", "cargoCart", "alienToy", "tag",
  "hallTrash", "hallPaper", "hallCleaner", "hallMirror", "hallVase", "hallVent", "hallRagShreds",
  "utilityHose", "utilityCleanRag", "utilityToolkit", "utilitySlimeBox", "utilityWire", "utilityDoorButton", "utilityCenterDoor", "utilityEmptyBox",
  "bathroomExit", "bathroomTrash", "bathroomJanitorCart", "bathroomLeftStall", "bathroomRightStall", "bathroomBowl", "bathroomMud",
  "bathroomFaucetLeft", "bathroomFaucetMiddle", "bathroomFaucetRight"
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
          case "hallKeypad":
            ctx.ellipse(862, 309, 19, 29, 0, 0, Math.PI * 2);
            break;
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
    ctx.font = "700 13px sans-serif";
    const labelWidth = Math.max(112, ctx.measureText(h.label).width + 28);
    const x = Math.min(930 - labelWidth, Math.max(20, h.x + h.w / 2 - labelWidth / 2));
    const y = Math.max(18, h.y - 38);
    ctx.beginPath();
    ctx.roundRect(x, y, labelWidth, 28, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff3c5";
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
  ctx.font = "700 13px sans-serif";
  const labelWidth = Math.max(112, ctx.measureText(h.label).width + 28);
  const x = Math.min(930 - labelWidth, Math.max(20, h.x + h.w / 2 - labelWidth / 2));
  const y = Math.max(18, h.y - 38);
  ctx.beginPath();
  ctx.roundRect(x, y, labelWidth, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff3c5";
  ctx.textAlign = "center";
  ctx.fillText(h.label, x + labelWidth / 2, y + 18);
  ctx.restore();
}

function resolveCartCollision(fromY, targetY, nextX, nextY) {
  // Use the cart's wheel-level footprint, expanded by the astronaut's boots.
  // The upper and lower edges remain valid routes behind/in front of the cart.
  const left = state.cartX - 98;
  const right = state.cartX + 98;
  const backEdge = 456;
  const frontEdge = 474;
  if (nextX <= left || nextX >= right || nextY <= backEdge || nextY >= frontEdge) {
    return { x: nextX, y: nextY };
  }
  const useBackEdge = fromY <= (backEdge + frontEdge) / 2 || targetY <= (backEdge + frontEdge) / 2;
  return { x: nextX, y: useBackEdge ? backEdge : frontEdge };
}

function updateUtilityEntryAnimation() {
  const elapsed = performance.now() - state.utilityEntryStart;
  const p = state.player;
  if (elapsed < 650) {
    // Drop straight from the elevated wall grate to the open shelf top.
    const t = Math.min(1, elapsed / 650);
    const eased = t * t;
    p.x = 902 + (730 - 902) * eased;
    p.y = 172 + (326 - 172) * eased;
    p.facing = "down";
  } else if (elapsed < 900) {
    p.x = 730;
    p.y = 326;
    p.facing = "left";
  } else if (elapsed < 1650) {
    // Leap from the shelf edge into the clear central aisle.
    const t = Math.min(1, (elapsed - 900) / 750);
    const eased = t * t * (3 - 2 * t);
    p.x = 730 + (666 - 730) * eased;
    p.y = 326 + (500 - 326) * eased - Math.sin(t * Math.PI) * 72;
    p.facing = "left";
  } else {
    state.utilityEntryAnimating = false;
    state.utilityEntryStart = 0;
    Object.assign(p, { x: 666, y: 500, tx: 666, ty: 500, facing: "left", forcedFacing: null, currentDone: null, path: [] });
  }
  p.tx = p.x;
  p.ty = p.y;
}

function update(dt) {
  if (state.room === "bathroom" && state.bathroomFaucets.every(Boolean) && !state.bathroomMirrorCodeRevealed) {
    const now = performance.now();
    if (state.bathroomAllFaucetsStart && !state.bathroomSteamRevealStart && now - state.bathroomAllFaucetsStart >= BATHROOM_STEAM_DELAY_MS) {
      state.bathroomSteamRevealStart = now;
      playSfx("psshh");
    }
    if (state.bathroomSteamRevealStart && now - state.bathroomSteamRevealStart >= BATHROOM_STEAM_REVEAL_MS) {
      state.bathroomMirrorCodeRevealed = true;
      state.bathroomSteamRevealStart = 0;
    }
  }
  if (state.bathroomSecretPanelStart) {
    if (performance.now() - state.bathroomSecretPanelStart >= BATHROOM_SECRET_PANEL_MS) {
      state.bathroomSecretPanelOpen = true;
      state.bathroomSecretPanelStart = 0;
      state.player.forcedFacing = null;
      playSfx("ding");
    } else {
      return;
    }
  }
  if (state.utilityEntryAnimating) {
    updateUtilityEntryAnimation();
    return;
  }
  if (state.utilityAction) {
    updateUtilityAction();
    return;
  }
  if (state.hallwayRopeTying && performance.now() - state.hallwayRopeTieStart >= 1500) {
    state.hallwayRopeTying = false;
    state.hallwayRopeInstalled = true;
    state.player.forcedFacing = null;
    playCombineTwinkle();
    setLog("The final knot holds. The completed rag rope hangs from the vent.");
    updateUI();
  }
  const cleanerDx = state.hallwayCleanerTargetX - state.hallwayCleanerX;
  if (Math.abs(cleanerDx) > .5) state.hallwayCleanerX += Math.sign(cleanerDx) * Math.min(Math.abs(cleanerDx), 150 * dt);
  if (state.hallwayCleanerMode === "approaching" && Math.abs(cleanerDx) <= 1) {
    state.hallwayCleanerMode = "wiping";
    state.hallwayCleanerActionStart = performance.now();
    playSfx("squish");
  } else if (state.hallwayCleanerMode === "wiping" && performance.now() - state.hallwayCleanerActionStart >= 3000) {
    state.hallwayDirtSpilled = false;
    state.hallwayDirtCollected = false;
    state.hallwayCleanerMode = "returning";
    state.hallwayCleanerTargetX = 780;
    playSfx("ding");
    setLog("The cleaner finishes the spill and returns to its post. More dirt is available in the vase.");
  } else if (state.hallwayCleanerMode === "jamming" && performance.now() - state.hallwayCleanerActionStart > 1250) {
    state.hallwayDirtSpilled = false;
    state.hallwayCleanerMode = "stuck";
    state.hallwayRagShredsAvailable = true;
    state.hallwayRagShredsX = state.hallwayCleanerX;
    playSfx("pop");
  } else if (state.hallwayCleanerMode === "returning" && Math.abs(state.hallwayCleanerX - 780) <= 1) {
    state.hallwayCleanerMode = "idle";
  }
  if (state.hallwayPickup) {
    const pickup = state.hallwayPickup;
    if (performance.now() - pickup.start >= pickup.duration) {
      state.hallwayPickup = null;
      if (pickup.id === "rag") state.hallwayRagCollected = true;
      if (pickup.id === "dirt") state.hallwayDirtCollected = true;
      if (pickup.id === "ragShreds") {
        state.hallwayRagShredsCollected = true;
        state.hallwayRagShredsAvailable = false;
      }
      addItem(pickup.id);
    }
    return;
  }
  const cartDx = state.cartTargetX - state.cartX;
  if (Math.abs(cartDx) > .5) state.cartX += Math.sign(cartDx) * Math.min(Math.abs(cartDx), 360 * dt);
  if (state.toyExamining) {
    if (performance.now() >= state.toyInspectUntil) {
      state.toyExamining = false;
      state.toyInspectStart = 0;
      state.toyInspectUntil = 0;
      playSfx("squish");
    }
    return;
  }
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
    const nextX = p.x + dx / distance * step;
    const nextY = p.y + dy / distance * step;
    const resolved = isGeneratedMode() && state.room === "airlock"
      ? resolveCartCollision(p.y, p.ty, nextX, nextY)
      : { x: nextX, y: nextY };
    p.x = resolved.x;
    p.y = resolved.y;
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

ui.inventory.addEventListener("wheel", event => {
  if (ui.inventory.scrollWidth <= ui.inventory.clientWidth) return;
  event.preventDefault();
  ui.inventory.scrollLeft += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
}, { passive: false });

function resetDebugState(room) {
  clearTimeout(outerDoorCloseTimer);
  outerDoorCloseTimer = 0;
  const hallway = room === "hallway";
  const utility = room === "utility";
  const bathroom = room === "bathroom";
  const progressed = hallway || utility || bathroom;
  const now = performance.now();

  state.room = room;
  state.inventory = bathroom ? ["tag", "cleanRag", "wrench"] : utility ? ["tag"] : hallway ? ["helmet", "sealant", "tag"] : [];
  state.selected = null;
  state.hover = null;
  state.lockerOpen = progressed;
  state.ventSealed = progressed;
  state.leverPulled = progressed;
  state.outerDoorClosed = progressed;
  state.outerDoorCloseStart = progressed ? now - OUTER_HATCH_CLOSE_MS : 0;
  state.pressureEqualized = progressed;
  state.tagAvailable = progressed;
  state.tagReleaseStart = 0;
  state.scannerSpoofed = progressed;
  state.complete = progressed;
  state.innerDoorOpenStart = progressed ? now - 1000 : 0;
  state.innerDoorRejectUntil = 0;
  state.reactionUntil = 0;
  state.decoyButtonBroken = false;
  state.decoyButtonSparkUntil = 0;
  state.onLadder = false;
  state.cartLeft = false;
  state.cartX = CART_RIGHT_X;
  state.cartTargetX = CART_RIGHT_X;
  state.cartWobbleUntil = 0;
  state.toyExamining = false;
  state.toyInspectStart = 0;
  state.toyInspectUntil = 0;
  state.hallwayEffect = null;
  state.hallwayEffectUntil = 0;
  state.hallwayTonePulse = null;
  state.hallwayTonePulseUntil = 0;
  state.hallwayDoorToneProgress = 0;
  state.hallDoorAOpen = bathroom;
  state.hallDoorAOpenStart = bathroom ? now - 1000 : 0;
  state.hallwayCleanerX = 780;
  state.hallwayCleanerTargetX = 780;
  state.hallwayRagCollected = utility;
  state.hallwayDirtCollected = utility;
  state.hallwayDirtSpilled = false;
  state.hallwayDirtX = 600;
  state.hallwayCleanerMode = utility ? "stuck" : "idle";
  state.hallwayCleanerActionStart = 0;
  state.hallwayRagShredsAvailable = false;
  state.hallwayRagShredsCollected = utility;
  state.hallwayRagShredsX = 600;
  state.hallwayRopeInstalled = utility;
  state.hallwayRopeTying = false;
  state.hallwayRopeTieStart = 0;
  state.hallwayVentClimbing = false;
  state.utilityEntryAnimating = false;
  state.utilityEntryStart = 0;
  state.hallwayPickup = null;
  state.utilityHoseCollected = false;
  state.utilityCleanRagCollected = false;
  state.utilityToolkitOpen = false;
  state.utilityWrenchCollected = false;
  state.utilityDoorPanelOpen = false;
  state.utilityCableRouted = false;
  state.utilityPowerStart = 0;
  state.utilityDoorOpen = false;
  state.utilitySlimeBoxFallen = false;
  state.utilitySlimed = false;
  state.utilityAction = null;
  state.bathroomLeftDoorOpen = false;
  state.bathroomRightDoorOpen = false;
  state.bathroomBowlCollected = false;
  state.bathroomFaucets = [false, false, false];
  state.bathroomSecretPanelOpen = false;
  state.bathroomSecretPanelStart = 0;
  state.bathroomAllFaucetsStart = 0;
  state.bathroomSteamRevealStart = 0;
  state.bathroomMirrorCodeRevealed = false;
  state.keypadOpen = false;
  state.keypadEntry = "";
  state.keypadUnlocked = false;
  state.keypadFeedbackUntil = 0;
  state.comicEffects = [];

  Object.assign(state.player, bathroom
    ? { x: 105, y: 480, tx: 105, ty: 480, facing: "right" }
    : utility
    ? { x: 666, y: 500, tx: 666, ty: 500, facing: "left" }
    : hallway
      ? { x: 72, y: 472, tx: 72, ty: 472, facing: "right" }
      : { x: 160, y: 458, tx: 160, ty: 458, facing: "down" });
  state.player.path = [];
  state.player.currentDone = null;
  state.player.forcedFacing = null;
  controller.inventoryIndex = 0;

  setLog(bathroom
    ? "Debug: Alien Washroom loaded with the utility route complete."
    : utility
    ? "Debug: Utility Closet loaded after the completed corridor route."
    : hallway
      ? "Debug: Crew Hallway loaded with every Room 1 inventory item."
      : "Debug: Breached Airlock reset to its fresh starting state.");
  updateUI();
}

document.querySelector("#s4DebugAirlock")?.addEventListener("click", () => resetDebugState("airlock"));
document.querySelector("#s4DebugHallway")?.addEventListener("click", () => resetDebugState("hallway"));
document.querySelector("#s4DebugUtility")?.addEventListener("click", () => resetDebugState("utility"));
document.querySelector("#s4DebugBathroom")?.addEventListener("click", () => resetDebugState("bathroom"));
document.querySelector("#s4DebugBathroomPanel")?.addEventListener("click", () => {
  if (state.room !== "bathroom") resetDebugState("bathroom");
  openBathroomSecretPanel();
});

updateUI();
requestAnimationFrame(loop);
