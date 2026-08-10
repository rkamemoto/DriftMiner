const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const monsterSpriteSheet = new Image();
monsterSpriteSheet.src = "assets/monsters/alien-monster-samples.png";
const monsterWalkSheets = Array.from({ length: 6 }, (_, index) => {
  const image = new Image();
  image.src = `assets/monsters/level-${index + 1}-walk-4-direction-aligned.png`;
  return image;
});
const levelEightMonsterWalkSheet = new Image();
levelEightMonsterWalkSheet.src = "assets/monsters/level-8-walk-4-direction-aligned.png";
const minerTravelSheet = new Image();
minerTravelSheet.src = "assets/miner-travel-aligned.png";
const minerDrillSheet = new Image();
minerDrillSheet.src = "assets/miner-drill-aligned.png";

const WORLD_SIZE_PRESETS = {
  small: { label: "Small", cols: 30, rows: 80, relics: 8, upgrades: 12 },
  medium: { label: "Medium", cols: 42, rows: 130, relics: 12, upgrades: 16 },
  large: { label: "Large", cols: 80, rows: 300, relics: 16, upgrades: 20 },
};
const selectedWorldSize = localStorage.getItem("driftMinerWorldSize") ?? "large";
const activeWorldSize = WORLD_SIZE_PRESETS[selectedWorldSize] ? selectedWorldSize : "large";
const worldSize = WORLD_SIZE_PRESETS[activeWorldSize];
const TILE = 32;
const COLS = worldSize.cols;
const ROWS = worldSize.rows;
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const CAMERA_ZOOM_LEVELS = [16, 24, 40, COLS];
const SURFACE_ROWS = 4;
const MIN_RELIC_DEPTH = 8;
const BASE_CENTER_TILE_X = Math.floor(COLS / 2);
const BASE_TILE_Y = SURFACE_ROWS - 1;
const BASE_MIN_TILE_X = BASE_CENTER_TILE_X - 4;
const BASE_MAX_TILE_X = BASE_CENTER_TILE_X + 3;
const BASE_MAX_TILE_Y = SURFACE_ROWS - 1;
const LEVEL_ONE_SPEED = 56;
const LEVEL_ONE_DRILL_DAMAGE = 0.75;
const DRILL_MONSTER_HULL_DAMAGE = 5;
const TREASURE_CARRY_SPEED_MULTIPLIER = 0.25;
const HULL_MAX_PER_UPGRADE = 2;
const HULL_REPAIR_PER_UPGRADE = 15;
const HULL_HARDENING_DAMAGE_MULTIPLIERS = [1, 0.9, 0.85, 0.81, 0.78, 0.75, 0.73, 0.71, 0.69, 0.67, 0.65, 0.63, 0.61, 0.59, 0.57, 0.55, 0.53, 0.51, 0.49, 0.47, 0.45];

const keys = new Set();
const GAMEPAD_DEADZONE = 0.22;
const GAMEPAD_CURSOR_DEADZONE = 0.34;
const GAMEPAD_CURSOR_PINNED_AXIS_THRESHOLD = 0.95;
const GAMEPAD_CURSOR_SPEED = 620;
const GAMEPAD_NAV_AXIS_THRESHOLD = 0.65;
const GAMEPAD_INPUT_STATUS_INTERVAL = 0.35;
const GAMEPAD_SCAN_STATUS_INTERVAL = 1;
const gamepadState = {
  index: null,
  connected: false,
  previousButtons: [],
  axes: { x: 0, y: 0 },
  cursor: { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false, initialized: false, centerX: 0, centerY: 0 },
  hoveredElement: null,
  selectedElement: null,
  selectedIndex: 0,
  openSelect: null,
  navCooldown: 0,
  previousNavDirection: 0,
  inputStatusCooldown: 0,
  scanStatusCooldown: 0,
  blasterHeld: false,
};
canvas.tabIndex = 0;
const resources = {
  copper: 0,
  silver: 0,
  gold: 0,
  diamond: 0,
  alienCarapace: 0,
};

const cargo = {
  copper: 0,
  silver: 0,
  gold: 0,
  diamond: 0,
  alienCarapace: 0,
};

const pickups = [];
const flares = [];
const blasts = [];
const explosions = [];
const feedbackEffects = [];
const radiationBursts = [];
const swordArcs = [];
const monsters = [];
const specialRooms = [];
const revealedTiles = new Set();
const treasureChest = {
  x: 0,
  y: 0,
  tileX: 0,
  tileY: 0,
  placed: false,
  carried: false,
  delivered: false,
  hover: false,
  instructionsShown: false,
  instructionsDismissed: false,
  foundAt: null,
};
const base = {
  health: 200,
  maxHealth: 200,
};
const idolStatue = {
  carried: false,
  delivered: false,
};

const OPEN_VISIBILITY_RADIUS = 1;
const FLARE_VISIBILITY_RADIUS = 4;
const MAX_UPGRADE_LEVEL = worldSize.upgrades;
const MAX_RELIC_LEVEL = 4;
const MONSTER_SPAWN_INTERVAL = 100;
const MIN_MONSTER_SPAWN_INTERVAL = 90;
const MONSTER_SPAWN_INTERVAL_STEP = 2;
const MAX_MONSTERS = 4;
const MONSTER_ATTACK_COOLDOWN = 1.15;
const BASE_ATTACK_ALERT_DURATION = 1.35;
const MONSTER_HIT_FLASH_INTERVAL = 0.9;
const MONSTER_HIT_FLASH_DURATION = 0.2;
const MONSTER_REPATH_INTERVAL = 0.45;
const MONSTER_MAX_PROGRESS_LEVEL = 6;
const MONSTER_LEVEL_DEPTH_THRESHOLDS = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
const LEVEL_EIGHT_MONSTER_SPAWN_TIME_BY_WORLD = {
  small: 20 * 60,
  medium: 30 * 60,
  large: 45 * 60,
};
const LEVEL_EIGHT_MONSTER_HP_MULTIPLIER = 12;
const LEVEL_EIGHT_MONSTER_DAMAGE_MULTIPLIER = 4;
const LEVEL_EIGHT_MONSTER_SPEED_MULTIPLIER = 0.45;
const LEVEL_EIGHT_MONSTER_WARNING_TIME = 60;
const MONSTER_LEVEL_6_TIME_BY_WORLD = {
  small: 30 * 60,
  medium: 45 * 60,
  large: 60 * 60,
};
const MONSTER_BASE_HP = 14;
const MONSTER_HP_PER_LEVEL = 11;
const MONSTER_BASE_ATTACK_DAMAGE = 5;
const MONSTER_ATTACK_DAMAGE_PER_LEVEL = 2;
const HIGH_LEVEL_MONSTER_HP_MULTIPLIERS = [1, 1, 1, 1, 1.3, 1.45, 1.6, 1.75];
const HIGH_LEVEL_MONSTER_DAMAGE_MULTIPLIERS = [1, 1, 1, 1, 1.2, 1.32, 1.45, 1.6];
const HIGH_LEVEL_MONSTER_SPEED_MULTIPLIERS = [1, 1, 1, 1, 1.14, 1.2, 1.26, 1.32];
const BASE_MONSTER_DAMAGE_REFERENCE_LEVEL = 6;
const BASE_MONSTER_REFERENCE_DESTROY_TIME = 60;
const BASE_MONSTER_DAMAGE_LEVEL_SCALE = 0.16;
const MONSTER_COMPANION_AGGRO_RADIUS = TILE * 6;
const HELPER_RADIUS = 10;
const HELPER_SPEED_MULTIPLIER = 0.25;
const MONSTER_SPRITE_CELL_SIZE = 512;
const MONSTER_WALK_COLUMNS = 3;
const MONSTER_WALK_ROWS = 4;
const MONSTER_WALK_SEQUENCE = [0, 1, 2, 1];
const MONSTER_WALK_FRAME_TIMES = [0.17, 0.2, 0.19, 0.21, 0.25, 0.28];
const MONSTER_WALK_SCALES = [1.55, 1.45, 1.55, 1.55, 1.7, 1.75];
const MINER_ANIMATION_COLUMNS = 3;
const MINER_ANIMATION_ROWS = 4;
const MINER_TRAVEL_FRAME_TIME = 0.16;
const MINER_DRILL_FRAME_TIME = 0.09;
const MINER_ANIMATION_SEQUENCE = [0, 1, 2, 1];
const MONSTER_SPRITES_BY_LEVEL = [
  { col: 2, row: 1, name: "Clawed scavenger", scale: 1.15 },
  { col: 0, row: 1, name: "Spore drifter", scale: 1.25 },
  { col: 0, row: 0, name: "Armored hunter", scale: 1.3 },
  { col: 1, row: 0, name: "Tunnel stalker", scale: 1.35 },
  { col: 2, row: 0, name: "Plated burrower", scale: 1.45 },
  { col: 1, row: 1, name: "Siege alien", scale: 1.55 },
];
const HELPER_FEAR_RADIUS = TILE * 7;
const HELPER_FLEE_SPEED_MULTIPLIER = 0.55;
const BLASTER_MONSTER_DAMAGE_MULTIPLIER = 1.4;
const BLASTER_BLOCK_DAMAGE_MULTIPLIER = 0.1;
const RADIATION_TICK_INTERVAL = 0.1;
const RADIATION_RADIUS = TILE * 3.2;
const RADIATION_BURST_LIFE = 0.7;
const HULL_BREACH_COOLDOWN = 10;
const ROCKET_DAMAGE = LEVEL_ONE_DRILL_DAMAGE * 18;
const ROCKET_MONSTER_DAMAGE = LEVEL_ONE_DRILL_DAMAGE * 45;
const MAGNET_RADIUS = TILE * 5;
const MAGNET_PULL_SPEED = 72;
const SEGMENT_SPAWN_CHANCE = 0.009;
const HULL_UPGRADE_ROOM_BONUS_PERCENT = 0.1;
const HULL_UPGRADE_ROOM_MIN_BONUS = 10;
const BASE_HEAL_RATE = 0.02;
const BASE_REPAIR_CARAPACE_COST = 1;
const BASE_REPAIR_AMOUNT = 75;
const GRENADE_BASE_COUNT = 2;
const GRENADE_RADIUS = 2;
const GRENADE_DAMAGE_MULTIPLIER = 4;
const GRENADE_RECHARGE_TIME = 35;
const RELIC_SEEKER_COOLDOWN = 120;
const HEALING_SPRING_RATE = BASE_HEAL_RATE;
const POISON_ROOM_TICK_INTERVAL = 10;
const POISON_ROOM_HULL_DAMAGE = 1;
const POISON_ROOM_MONSTER_TICK_INTERVAL = RADIATION_TICK_INTERVAL;
const POISON_ROOM_MONSTER_DAMAGE = LEVEL_ONE_DRILL_DAMAGE;
const VEIN_ROOM_SPAWN_INTERVAL = 50;
const IDOL_BOULDER_DAMAGE = 70;
const LOW_HULL_WARNING_THRESHOLD = 0.25;
const LOW_HULL_WARNING_INTERVAL = 1.35;
const LOW_HULL_WARNING_DURATION = 0.34;
const HULL_HIT_FLASH_DURATION = 0.24;
const LASER_SWORD_RECHARGE_TIME = 35;
const LASER_SWORD_BLOCK_DAMAGE_MULTIPLIER = 0.35;
const ROOM_DEFS = {
  A: {
    minWorld: "small",
    minY: SURFACE_ROWS + 40,
    maxY: SURFACE_ROWS + 80,
    width: 3,
    height: 3,
    kind: "monster",
    contents: "quick monster",
    description: "Something fast and vicious is waiting in this cramped passage.",
  },
  B: {
    minWorld: "small",
    width: 3,
    height: 3,
    kind: "spring",
    title: "Healing Spring",
    contents: "healing spring",
    description: "Clear mineral water glows from below, humming softly against the hull.",
  },
  C: {
    minWorld: "small",
    width: 3,
    height: 3,
    kind: "hullUpgrade",
    title: "Hull Reinforcement",
    contents: "hull upgrade",
    description: "You find a slick alien gel and apply it to the drill housing. Maximum hull integrity increases by 10%.",
  },
  D: { minWorld: "small", width: 3, height: 3, kind: "vein", resource: "gold", title: "Gold Vein", contents: "gold vein", description: "Gold seeps from the walls in slow, glittering beads." },
  E: { minWorld: "medium", width: 3, height: 3, kind: "vein", resource: "diamond", title: "Diamond Vein", contents: "diamond vein", description: "Cold blue crystal growths crackle in the stone." },
  F: { minWorld: "medium", width: 3, height: 3, kind: "monsterSpawner", title: "Monster Spawn", contents: "monster spawn", description: "The floor pulses like a heartbeat. Monsters will appear here with the regular monster timer." },
  G: { minWorld: "medium", minY: SURFACE_ROWS + 80, width: 3, height: 3, kind: "teleporter", title: "Teleporter", contents: "teleporter", description: "A humming field folds around the miner and snaps you back to base." },
  H: { minWorld: "large", width: 3, height: 3, kind: "loot", contents: "rare pile", description: "A hidden cache of rare resources is tucked into this open pocket." },
  I: { minWorld: "large", width: 3, height: 3, kind: "loot", contents: "rare pile", description: "A hidden cache of rare resources is tucked into this open pocket." },
  J: { minWorld: "large", width: 3, height: 3, kind: "loot", contents: "rare pile", description: "A hidden cache of rare resources is tucked into this open pocket." },
  K: { minWorld: "small", minY: SURFACE_ROWS + 40, width: 3, height: 3, kind: "alarm", title: "Warning System", contents: "alarm", description: "An ancient alarm shrieks through the mine. Five stronger monsters answer from somewhere in the dark." },
  L: { minWorld: "small", minY: SURFACE_ROWS + 40, width: 3, height: 3, kind: "idol", title: "Idol Room", contents: "idol statue", description: "A statue in the middle of the room looks exactly like you. It might be extremely valuable, but taking it may trigger something. Bring it to base for 5 Gold and 5 Diamond." },
  M: { minWorld: "small", minY: SURFACE_ROWS + 40, width: 3, height: 3, kind: "vein", resource: "copper", title: "Copper Vein", contents: "copper vein", description: "Copper knots push through the room's walls." },
  N: { minWorld: "small", minY: SURFACE_ROWS + 40, width: 3, height: 3, kind: "vein", resource: "silver", title: "Silver Vein", contents: "silver vein", description: "Silver threads shimmer across the stone." },
  O: {
    minWorld: "small",
    minY: Math.floor(ROWS * 0.5),
    width: 3,
    height: 3,
    kind: "monster",
    contents: "level 7 monsters",
    description: "This long chamber feels dangerous. Heavy movement echoes nearby.",
  },
  P: {
    minWorld: "small",
    minY: SURFACE_ROWS + 25,
    width: 3,
    height: 3,
    kind: "poison",
    title: "Poison Gas",
    contents: "poison gas",
    description: "Poison gas hangs over alien remains. Exposure causes lingering hull damage, and monsters passing through it sizzle under radiation-like burns.",
  },
  Z: {
    minWorld: "small",
    minY: Math.floor(ROWS * 0.75),
    width: 3,
    height: 3,
    kind: "treasure",
    title: "Treasure Room",
    contents: "treasure chest",
    description: "The ancient treasure rests here. Bring it back to base.",
  },
};

const resourceColors = {
  copper: "#cf7a43",
  silver: "#cad4da",
  gold: "#f2c45b",
  diamond: "#86f0ff",
  alienCarapace: "#b7ff6d",
};

const resourceNames = {
  copper: "Copper",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
  alienCarapace: "Alien Carapace",
};

const blockDefs = [
  { biome: "Topsoil", color: "#6c5640", hp: 2, depth: 0 },
  { biome: "Claystone", color: "#845f48", hp: 5, depth: 14 },
  { biome: "Basalt", color: "#4b4e57", hp: 9, depth: 30 },
  { biome: "Crystal Vein", color: "#334d65", hp: 15, depth: 52 },
];

const oreDefs = [
  { type: "copper", color: "#cf7a43", minDepth: 5, veinChance: 0.02, minVein: 3, maxVein: 7 },
  { type: "silver", color: "#cad4da", minDepth: 14, veinChance: 0.01, minVein: 1, maxVein: 4 },
  { type: "gold", color: "#f2c45b", minDepth: 22, veinChance: 0.008, minVein: 1, maxVein: 3 },
  { type: "diamond", color: "#86f0ff", minDepth: 36, veinChance: 0.005, minVein: 1, maxVein: 3 },
];
const DEEP_BIOME_COPPER_CHANCE_MULTIPLIER = 0.8;
const DEEP_BIOME_SILVER_CHANCE_MULTIPLIER = 1.2;

const relicDefs = {
  impact: {
    label: "Impact Drill",
    color: "#ffdf74",
    duration: 15,
    cooldown: 120,
  },
  speed: {
    label: "Speed Burst",
    color: "#82f5ff",
    duration: 30,
    cooldown: 120,
  },
  flare: {
    label: "Flare",
    color: "#ff6a48",
    duration: 30,
    cooldown: 120,
  },
  blaster: {
    label: "Blaster",
    color: "#b7ff6d",
  },
  bomb: {
    label: "Bomb",
    color: "#ff8a3d",
    duration: 0,
    cooldown: 120,
  },
  mouse: {
    label: "Mouse",
    color: "#d8c6a4",
  },
  dog: {
    label: "Dog",
    color: "#c98b5c",
  },
  radiation: {
    label: "Radiation",
    color: "#9dff5b",
    duration: 6,
    cooldown: 120,
  },
  rocket: {
    label: "Rocket Launcher",
    color: "#ff5f45",
    duration: 0,
    cooldown: 120,
  },
  magnet: {
    label: "Magnet",
    color: "#b474ff",
    duration: 20,
    cooldown: 120,
  },
  thirdEye: {
    label: "3rd Eye",
    color: "#c8a8ff",
  },
  laserSword: {
    label: "Laser Sword",
    color: "#ff7de9",
  },
  converter: {
    label: "Resource Converter",
    color: "#68d6c7",
    cooldown: 120,
  },
  ansible: {
    label: "Ansible",
    color: "#f7e1a5",
  },
  grenades: {
    label: "Grenades",
    color: "#c7f26a",
  },
  soundDistorter: {
    label: "Sound Distorter",
    color: "#78a8ff",
  },
  alienCarapaceIntegrator: {
    label: "Alien Carapace Integrator",
    color: "#8ee0a0",
  },
  alienGelRegenerator: {
    label: "Alien Gel Regenerator",
    color: "#70f0d0",
  },
  godVisage: {
    label: "God Visage",
    color: "#ffd0f2",
    duration: 8,
    cooldown: 120,
  },
  relicSeeker: {
    label: "Relic Seeker",
    color: "#fff58a",
    duration: 10,
    cooldown: RELIC_SEEKER_COOLDOWN,
  },
};

const upgradeDefs = {
  power: {
    label: "Drill Power",
    description: "Increases the power of the drill to dig blocks faster.",
    recipe: (level) => ({
      copper: incrementalCopperCost(level, 0.4, 3),
      silver: upgradeSilverCost(level),
      gold: upgradeGoldCost(level, 5),
      diamond: upgradeDiamondCost(level, 8, 3),
    }),
  },
  speed: {
    label: "Thruster Speed",
    description: "Increases your movement speed while mining and hauling resources.",
    recipe: (level) => ({
      copper: incrementalCopperCost(level, 0.4, 3),
      silver: upgradeSilverCost(level),
      gold: upgradeGoldCost(level, 5),
      diamond: upgradeDiamondCost(level, 8, 3),
    }),
  },
  capacity: {
    label: "Cargo Bay",
    description: "Increases how many resources you can carry before returning to base.",
    recipe: (level) => ({
      copper: incrementalCopperCost(level, 0.6, 4),
      silver: upgradeSilverCost(level),
      gold: upgradeGoldCost(level, 5),
      diamond: upgradeDiamondCost(level, 9, 3),
    }),
  },
  hardening: {
    label: "Hull Hardening",
    description: "Reduces damage taken from monster attacks.",
    recipe: (level) => ({
      copper: incrementalCopperCost(level, 0.45, 3),
      silver: level < 3 ? 0 : Math.ceil((level - 1) / 2),
      gold: upgradeGoldCost(level, 7),
      diamond: upgradeDiamondCost(level, 10, 4),
    }),
  },
};
const baseRepairDescription = "Spends 1 Alien Carapace to restore base HP.";

const relicDescriptions = {
  impact: "Provides extra power for your drill for a period of time. Cooldown after use.",
  speed: "Temporarily boosts your movement speed. Cooldown after use.",
  flare: "Creates a portable light that follows the miner and reveals nearby dark tiles for a period of time.",
  blaster: "Fires energy shots that damage monsters and chip away at blocks.",
  bomb: "Detonates a stronger short-range blast that clears nearby blocks and scales sharply with upgrades.",
  mouse: "Summons a helper that prioritizes digging paths toward visible resource blocks.",
  dog: "Summons a helper that gathers dropped resources and brings them back to base.",
  radiation: "Creates a damaging radiation field around you for a short time.",
  rocket: "Launches a rocket that explodes on impact.",
  magnet: "Creates a resonating field around you that pulls nearby dropped resources toward the miner.",
  thirdEye: "Permanently improves how much open space is revealed around you.",
  laserSword: "Swings a sweeping blade that damages monsters and blocks it overlaps.",
  converter: "Converts stored resources into rarer materials while you are at base.",
  ansible: "Lets you upgrade miner upgrades and relics anywhere instead of only at base.",
  grenades: "Throws compact explosives that clear nearby blocks and damage monsters. Regenerates one grenade every 35 seconds.",
  soundDistorter: "Delays incoming monster waves.",
  alienCarapaceIntegrator: "Permanently increases maximum hull integrity.",
  alienGelRegenerator: "Heals hull when you damage monsters.",
  godVisage: "Repels nearby monsters when activated.",
  relicSeeker: "Briefly flashes buried relics on screen.",
};

let relicToastTimer = 0;
let roomToastTimer = 0;
let audioContext = null;
let digSoundBuffer = null;
let digSoundLoading = null;
let digSoundOffsets = [];
let lastDigSoundAt = 0;
let lastMonsterScreamAt = 0;
let lastMonsterDeathScreamAt = 0;

function incrementalCopperCost(level, earlyLevelMultiplier, startingCost) {
  const levelThreeCost = startingCost + Math.ceil(2 * earlyLevelMultiplier);
  if (level <= 3) {
    return startingCost + Math.ceil(Math.max(0, level - 1) * earlyLevelMultiplier);
  }
  return levelThreeCost + level - 3;
}

function steppedResourceCost(level, startLevel, everyLevels = 3) {
  if (level < startLevel) return 0;
  return 1 + Math.floor((level - startLevel) / everyLevels);
}

function tieredResourceCost(level, startLevel, levelsPerTier) {
  if (level < startLevel) return 0;
  return 1 + Math.floor((level - startLevel) / levelsPerTier);
}

function upgradeSilverCost(level) {
  return level < 2 ? 0 : Math.ceil(level / 2);
}

function upgradeGoldCost(level, startLevel) {
  return level < startLevel ? 0 : Math.ceil((level - (startLevel - 1)) / 2);
}

function upgradeDiamondCost(level, startLevel, levelsPerTier) {
  if (level < startLevel) return 0;
  return 1 + Math.floor((level - startLevel) / levelsPerTier);
}

let carried = 0;
let messageTimer = 0;
let elapsedTime = 0;
let deepestMinerDepth = 0;
let healingFeedbackTimer = 0;
let lowHullWarningTimer = 0;
let lowHullFlashTimer = 0;
let hullHitFlashTimer = 0;
let monsterSpawnTimer = MONSTER_SPAWN_INTERVAL;
let monsterSpawnInterval = MONSTER_SPAWN_INTERVAL;
let levelEightMonsterSpawned = false;
let levelEightMonsterWarningShown = false;
let debugMode = false;
let gameStarted = false;
let gamePaused = false;
let gameOver = false;
let finalGameOver = false;
let gameWon = false;
let gameOverTimer = 0;
let baseAttackWarningActive = false;
let baseAttackAlertTimer = 0;
let cameraZoomIndex = 0;
let lastTime = performance.now();
const camera = { x: 0, y: 0 };
const relics = {
  impact: { unlocked: false, active: 0, cooldown: 0 },
  speed: { unlocked: false, active: 0, cooldown: 0 },
  flare: { unlocked: false, active: 0, cooldown: 0 },
  blaster: { unlocked: false, charge: 100, shotCooldown: 0, overheat: 0 },
  bomb: { unlocked: false, active: 0, cooldown: 0 },
  mouse: { unlocked: false },
  dog: { unlocked: false },
  radiation: { unlocked: false, active: 0, cooldown: 0, tick: 0 },
  rocket: { unlocked: false, active: 0, cooldown: 0 },
  magnet: { unlocked: false, active: 0, cooldown: 0 },
  thirdEye: { unlocked: false },
  laserSword: { unlocked: false, recharge: 0, swings: 5 },
  converter: { unlocked: false, cooldown: 0 },
  ansible: { unlocked: false },
  grenades: { unlocked: false, charges: GRENADE_BASE_COUNT, recharge: 0 },
  soundDistorter: { unlocked: false },
  alienCarapaceIntegrator: { unlocked: false },
  alienGelRegenerator: { unlocked: false },
  godVisage: { unlocked: false, active: 0, cooldown: 0 },
  relicSeeker: { unlocked: false, active: 0, cooldown: 0 },
};
for (const relic of Object.values(relics)) relic.level = 1;
const mouseHelper = {
  x: BASE_CENTER_TILE_X * TILE - 24,
  y: 64,
  target: null,
  path: [],
  mode: "idle",
  drillCooldown: 0,
  searchCooldown: 0,
  stuckTimer: 0,
  lastX: BASE_CENTER_TILE_X * TILE - 24,
  lastY: 64,
  health: 25,
  maxHealth: 25,
  initialized: false,
};
const dogHelper = {
  x: BASE_CENTER_TILE_X * TILE + 24,
  y: 64,
  target: null,
  path: [],
  mode: "idle",
  cargo: {
    copper: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
    alienCarapace: 0,
  },
  carried: 0,
  maxCarry: 5,
  health: 25,
  maxHealth: 25,
  initialized: false,
};

const miner = {
  x: BASE_CENTER_TILE_X * TILE,
  y: 64,
  radius: 9,
  vx: 0,
  vy: 0,
  speed: LEVEL_ONE_SPEED,
  power: LEVEL_ONE_DRILL_DAMAGE,
  drillCooldown: 0,
  facingX: 1,
  facingY: 0,
  capacity: 3,
  health: 100,
  maxHealth: 100,
  repairs: 0,
  poisoned: false,
  poisonTimer: 0,
  isMoving: false,
  animationTime: 0,
  upgrades: {
    power: 0,
    speed: 0,
    capacity: 0,
    hardening: 0,
  },
};
const lastKnownMinerPosition = {
  x: miner.x,
  y: (SURFACE_ROWS + 0.5) * TILE,
  radius: miner.radius,
  valid: false,
};

const world = Array.from({ length: ROWS }, (_, y) =>
  Array.from({ length: COLS }, (_, x) => createTile(x, y)),
);
generateOreVeins();
generateWorldSegments();
generateRelics();
revealAround(BASE_CENTER_TILE_X, BASE_TILE_Y, getOpenRevealRadius());

function createTile(x, y) {
  if (y < SURFACE_ROWS) {
    if (isBaseTile(x, y)) return null;
    return createUndiggableSurfaceTile();
  }
  const definition = [...blockDefs].reverse().find((block) => y >= block.depth) ?? blockDefs[0];
  const tile = {
    hp: definition.hp + Math.floor(Math.random() * 2),
    maxHp: definition.hp,
    color: definition.color,
    biome: definition.biome,
    ore: null,
    relic: null,
    unbreakable: false,
  };

  if (x < 2 || x > COLS - 3) tile.hp *= 2;
  return tile;
}

function createUndiggableSurfaceTile() {
  return {
    hp: Infinity,
    maxHp: Infinity,
    color: "#1d2227",
    biome: "Sealed Surface",
    ore: null,
    relic: null,
    unbreakable: true,
  };
}

function generateRelics() {
  const relicCount = worldSize.relics ?? 8;
  for (let i = 0; i < relicCount; i++) {
    const zoneIndex = i % blockDefs.length;
    const zone = blockDefs[zoneIndex];
    const minY = Math.max(SURFACE_ROWS + MIN_RELIC_DEPTH, zone.depth);
    const maxY = (blockDefs[zoneIndex + 1]?.depth ?? ROWS) - 1;
    placeRelicInZone(minY, maxY);
  }
}

function placeRelicInZone(minY, maxY) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const x = 2 + Math.floor(Math.random() * (COLS - 4));
    const y = minY + Math.floor(Math.random() * Math.max(1, maxY - minY + 1));
    const tile = world[y]?.[x];
    if (!tile || tile.unbreakable || tile.ore || tile.relic) continue;
    tile.relic = true;
    tile.hp = tile.maxHp * 10;
    tile.maxHp = tile.hp;
    return;
  }
}

function generateOreVeins() {
  for (let y = SURFACE_ROWS; y < ROWS; y++) {
    for (let x = 2; x < COLS - 2; x++) {
      const ore = chooseOreForVein(y);
      if (!ore) continue;
      growOreVein(x, y, ore, getVeinSize(ore));
    }
  }
}

function chooseOreForVein(y) {
  for (const ore of [...oreDefs].reverse()) {
    if (y >= ore.minDepth && Math.random() < getOreVeinChance(ore, y)) return ore;
  }
  return null;
}

function getOreVeinChance(ore, y) {
  const depthPastStart = Math.max(0, y - ore.minDepth);
  const deepProgress = clamp(depthPastStart / 90, 0, 1);
  const nearSurfaceProgress = clamp((y - SURFACE_ROWS) / 20, 0, 1);
  let biomeMultiplier = 1;
  if (y >= blockDefs[2].depth) {
    if (ore.type === "copper") biomeMultiplier = DEEP_BIOME_COPPER_CHANCE_MULTIPLIER;
    if (ore.type === "silver") biomeMultiplier = DEEP_BIOME_SILVER_CHANCE_MULTIPLIER;
  }
  const nearSurfaceCommonMultiplier = {
    copper: 2.25 - nearSurfaceProgress * 0.9,
    silver: 1.45 - nearSurfaceProgress * 0.25,
    gold: 1.12,
    diamond: 1,
  };
  const multipliers = {
    copper: Math.max(0.18, 1 - deepProgress * 0.82),
    silver: 1 + deepProgress * 0.75,
    gold: 1 + deepProgress * 1.15,
    diamond: 1 + deepProgress * 1.6,
  };
  return ore.veinChance
    * (multipliers[ore.type] ?? 1)
    * (nearSurfaceCommonMultiplier[ore.type] ?? 1)
    * biomeMultiplier;
}

function getVeinSize(ore) {
  return ore.minVein + Math.floor(Math.random() * (ore.maxVein - ore.minVein + 1));
}

function growOreVein(startX, startY, ore, size) {
  const frontier = [{ x: startX, y: startY }];
  const placed = new Set();

  while (frontier.length > 0 && placed.size < size) {
    const index = Math.floor(Math.random() * frontier.length);
    const current = frontier.splice(index, 1)[0];
    const key = `${current.x},${current.y}`;
    if (placed.has(key)) continue;

    const tile = world[current.y]?.[current.x];
    if (!tile || tile.ore || current.y < ore.minDepth) continue;
    if (touchesMatchingOre(current.x, current.y, ore.type, placed)) continue;

    tile.ore = { ...ore, yield: 1 + Math.floor(Math.random() * 2) };
    tile.hp = Math.round(tile.hp * 1.22);
    placed.add(key);

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].sort(() => Math.random() - 0.5);

    frontier.push(...neighbors);
  }
}

function touchesMatchingOre(x, y, oreType, placed) {
  const neighbors = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];

  return neighbors.some((neighbor) => {
    const key = `${neighbor.x},${neighbor.y}`;
    if (placed.has(key)) return false;
    return world[neighbor.y]?.[neighbor.x]?.ore?.type === oreType;
  });
}

function generateWorldSegments() {
  const segmentCount = Math.max(3, Math.floor(((COLS * ROWS * SEGMENT_SPAWN_CHANCE) / 10) * 1.35));
  const openCount = Math.max(3, Math.floor(segmentCount * 0.64));
  const unbreakableCount = Math.max(2, Math.floor((segmentCount - openCount) * 1.25));
  const roomLabels = getSpecialRoomLabels();

  for (let i = 0; i < unbreakableCount; i++) {
    growWorldSegment(12, 38, placeUnbreakableTile);
  }
  for (let i = 0; i < openCount; i++) {
    growWorldSegment(4, 14, clearSegmentTile);
  }
  for (const label of roomLabels) {
    placeSpecialRoom(label);
  }
  placeEndgameRoom();
}

function getSpecialRoomLabels() {
  return Object.entries(ROOM_DEFS)
    .filter(([label]) => label !== "Z")
    .filter(([, roomDef]) => isWorldAtLeast(roomDef.minWorld))
    .map(([label]) => label);
}

function isWorldAtLeast(sizeName) {
  const order = ["small", "medium", "large"];
  return order.indexOf(activeWorldSize) >= order.indexOf(sizeName);
}

function growWorldSegment(minSize, maxSize, applyTile) {
  const start = getRandomSegmentStart();
  if (!start) return;

  const targetSize = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
  const frontier = [start];
  const placed = new Set();

  while (frontier.length > 0 && placed.size < targetSize) {
    const index = Math.floor(Math.random() * frontier.length);
    const current = frontier.splice(index, 1)[0];
    const key = `${current.x},${current.y}`;
    if (placed.has(key) || !canModifySegmentTile(current.x, current.y)) continue;

    applyTile(current.x, current.y);
    placed.add(key);

    [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].forEach((neighbor) => {
      if (canModifySegmentTile(neighbor.x, neighbor.y)) frontier.push(neighbor);
    });
  }
}

function getRandomSegmentStart() {
  for (let attempt = 0; attempt < 120; attempt++) {
    const x = 3 + Math.floor(Math.random() * Math.max(1, COLS - 6));
    const y = SURFACE_ROWS + 6 + Math.floor(Math.random() * Math.max(1, ROWS - SURFACE_ROWS - 8));
    if (canModifySegmentTile(x, y)) return { x, y };
  }

  return null;
}

function canModifySegmentTile(x, y) {
  if (x < 2 || x >= COLS - 2 || y < SURFACE_ROWS + 3 || y >= ROWS - 1) return false;
  if (isBaseTile(x, y)) return false;
  const tile = world[y]?.[x];
  return !!tile && !tile.relic;
}

function placeUnbreakableTile(x, y) {
  const tile = world[y]?.[x];
  if (!tile) return;
  tile.ore = null;
  tile.relic = null;
  tile.unbreakable = true;
  tile.hp = Infinity;
  tile.maxHp = Infinity;
  tile.color = "#202329";
}

function clearSegmentTile(x, y) {
  world[y][x] = null;
}

function placeSpecialRoom(label, options = {}) {
  const definition = options.definition ?? ROOM_DEFS[label] ?? {};
  const width = options.width ?? definition.width ?? 3;
  const height = options.height ?? definition.height ?? 3;
  const minRoomY = options.minY ?? definition.minY ?? SURFACE_ROWS + 8;
  const maxRoomY = options.maxY ?? definition.maxY ?? ROWS - 4;
  for (let attempt = 0; attempt < 500; attempt++) {
    const x = attempt === 0 && typeof options.preferredX === "number" ? options.preferredX : getRoomStartX(width);
    const y = getRoomStartY(height, minRoomY, maxRoomY);
    if (!canPlaceSpecialRoom(x, y, width, height)) continue;

    for (let yy = y; yy < y + height; yy++) {
      for (let xx = x; xx < x + width; xx++) {
        world[yy][xx] = null;
      }
    }

    const room = {
      x: x + Math.floor(width / 2),
      y: y + Math.floor(height / 2),
      startX: x,
      startY: y,
      width,
      height,
      label,
      kind: options.kind ?? definition.kind ?? "loot",
      title: options.title ?? definition.title ?? "",
      contents: options.contents ?? definition.contents ?? "",
      description: options.description ?? definition.description ?? "",
      resource: options.resource ?? definition.resource ?? null,
      used: false,
      described: false,
      poisonTimer: 0,
      spawnTimer: 0,
    };
    specialRooms.push(room);
    populateSpecialRoom(room, options);
    return room;
  }

  return null;
}

function getRoomStartX(width) {
  return 2 + Math.floor(Math.random() * Math.max(1, COLS - width - 3));
}

function getRoomStartY(height, minY, maxY) {
  const minStartY = clamp(minY, SURFACE_ROWS + 3, ROWS - height - 1);
  const maxStartY = clamp(maxY - height + 1, minStartY, ROWS - height - 1);
  return minStartY + Math.floor(Math.random() * Math.max(1, maxStartY - minStartY + 1));
}

function populateSpecialRoom(room, options = {}) {
  if (options.treasure || room.kind === "treasure") {
    placeTreasureChest(room.x, room.y);
    return;
  }

  if (room.kind === "loot") {
    dropRareRoomPile(room.x, room.y);
    return;
  }

  if (room.label === "A") {
    createMonster({ x: room.x, y: room.y }, {
      level: 2,
      hp: 12,
      speedMultiplier: 1.75,
      damageMultiplier: 3,
      radius: 9,
      name: "Quick monster",
      color: "#ffcf5f",
      loot: "alienCarapace",
      quiet: true,
      dormant: true,
      roomLabel: room.label,
    });
    return;
  }

  if (room.label === "O") {
    createMonster({ x: room.startX, y: room.y }, { level: 7, name: "Level 7 room monster", loot: "alienCarapace", quiet: true, dormant: true, roomLabel: room.label });
    createMonster({ x: room.startX + room.width - 1, y: room.y }, { level: 7, name: "Level 7 room monster", loot: "alienCarapace", quiet: true, dormant: true, roomLabel: room.label });
    return;
  }

  if (room.kind === "poison") {
    addRoomResourcePile("alienCarapace", room.x, room.y, 5, room.label);
    return;
  }

  if (room.kind === "vein") {
    addRoomResourcePile(room.resource ?? "gold", room.x, room.y, 4, room.label);
    return;
  }

  if (room.kind === "idol") {
    addRoomResourcePile("idol", room.x, room.y, 1, room.label);
  }
}

function addRoomResourcePile(type, tileX, tileY, amount, roomLabel = null) {
  for (let i = 0; i < amount; i++) {
    const offset = getPileOffset(i, amount);
    pickups.push({
      type,
      x: tileX * TILE + TILE / 2 + offset.x,
      y: tileY * TILE + TILE - 7 + offset.y,
      rotation: Math.random() * 0.28 - 0.14,
      roomLabel,
    });
  }
}

function dropRoomResource(type, tileX, tileY) {
  pickups.push({
    type,
    x: tileX * TILE + TILE / 2,
    y: tileY * TILE + TILE - 7,
    rotation: Math.random() * 0.28 - 0.14,
  });
}

function spawnRoomMonsterIn(room, level) {
  const openTiles = [];
  for (let y = room.startY; y < room.startY + room.height; y++) {
    for (let x = room.startX; x < room.startX + room.width; x++) {
      if (isMonsterOpenTile(x, y)) openTiles.push({ x, y });
    }
  }
  const tile = openTiles[Math.floor(Math.random() * openTiles.length)] ?? { x: room.x, y: room.y };
  createMonster(tile, { level });
}

function placeEndgameRoom() {
  const minY = Math.max(SURFACE_ROWS + 8, Math.floor(ROWS * 0.75));
  const room = placeSpecialRoom("Z", {
    minY,
    maxY: ROWS - 4,
    treasure: true,
  });
  if (room) return;

  const fallback = findTreasureFallbackLocation(minY);
  if (!fallback) return;
  const fallbackX = fallback.x;
  const fallbackY = fallback.y;
  for (let yy = fallbackY - 1; yy <= fallbackY + 1; yy++) {
    for (let xx = fallbackX - 1; xx <= fallbackX + 1; xx++) {
      world[yy][xx] = null;
    }
  }
  specialRooms.push({
    x: fallbackX,
    y: fallbackY,
    startX: fallbackX - 1,
    startY: fallbackY - 1,
    width: 3,
    height: 3,
    label: "Z",
    kind: "treasure",
    contents: "treasure chest",
    description: "The ancient treasure rests here. Bring it back to base.",
    used: false,
    described: false,
    poisonTimer: 0,
  });
  placeTreasureChest(fallbackX, fallbackY);
}

function findTreasureFallbackLocation(minY) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const centerX = 3 + Math.floor(Math.random() * Math.max(1, COLS - 6));
    const centerY = minY + 1 + Math.floor(Math.random() * Math.max(1, ROWS - minY - 3));
    const startX = centerX - 1;
    const startY = centerY - 1;
    if (doesRoomAreaOverlap(startX, startY, 3, 3, 1)) continue;

    let safe = true;
    for (let y = startY; y < startY + 3 && safe; y++) {
      for (let x = startX; x < startX + 3; x++) {
        const tile = world[y]?.[x];
        if (tile?.relic || tile?.unbreakable || isBaseTile(x, y)) {
          safe = false;
          break;
        }
      }
    }
    if (safe) return { x: centerX, y: centerY };
  }
  return null;
}

function placeTreasureChest(tileX, tileY) {
  treasureChest.tileX = tileX;
  treasureChest.tileY = tileY;
  treasureChest.x = tileX * TILE + TILE / 2;
  treasureChest.y = tileY * TILE + TILE - 10;
  treasureChest.placed = true;
  treasureChest.carried = false;
  treasureChest.delivered = false;
  treasureChest.hover = false;
  treasureChest.instructionsShown = false;
  treasureChest.instructionsDismissed = false;
  treasureChest.foundAt = null;
}

function canPlaceSpecialRoom(startX, startY, width = 3, height = 3) {
  if (doesRoomAreaOverlap(startX, startY, width, height, 1)) return false;

  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (!canModifySegmentTile(x, y)) return false;
    }
  }

  return true;
}

function doesRoomAreaOverlap(startX, startY, width, height, padding = 0) {
  const left = startX - padding;
  const right = startX + width - 1 + padding;
  const top = startY - padding;
  const bottom = startY + height - 1 + padding;

  return specialRooms.some((room) => {
    const roomRight = room.startX + room.width - 1;
    const roomBottom = room.startY + room.height - 1;
    return left <= roomRight && right >= room.startX && top <= roomBottom && bottom >= room.startY;
  });
}

function dropRareRoomPile(tileX, tileY) {
  const rareTypes = ["gold", "gold", "diamond"];
  for (let i = 0; i < 8; i++) {
    const type = rareTypes[i % rareTypes.length];
    const offset = getPileOffset(i, 8);
    pickups.push({
      type,
      x: tileX * TILE + TILE / 2 + offset.x,
      y: tileY * TILE + TILE - 7 + offset.y,
      rotation: Math.random() * 0.28 - 0.14,
    });
  }
}

function update(dt) {
  updateGamepadInput(dt);

  if (!gameStarted) {
    updateCamera();
    updateHud();
    return;
  }

  if (gamePaused) {
    updateCamera();
    updateHud();
    return;
  }

  if (gameWon) {
    updateTreasureChest(dt);
    updateCamera();
    return;
  }

  if (gameOver) {
    elapsedTime += dt;
    gameOverTimer += dt;
    baseAttackAlertTimer = Math.max(0, baseAttackAlertTimer - dt);
    if (!finalGameOver) updateMonsters(dt);
    updateExplosions(dt);
    updateTileEffects(dt);
    if (!finalGameOver) updateHullBreachCooldown();
    updateHud();
    return;
  }

  messageTimer = Math.max(0, messageTimer - dt);
  baseAttackAlertTimer = Math.max(0, baseAttackAlertTimer - dt);
  elapsedTime += dt;
  deepestMinerDepth = Math.max(deepestMinerDepth, getMinerDepthTiles());
  miner.drillCooldown = Math.max(0, miner.drillCooldown - dt);
  updateRelics(dt);
  updateFlares(dt);
  updateBlaster(dt);
  updateRadiation(dt);
  updateExplosions(dt);
  updateMonsters(dt);
  updateMouse(dt);
  updateDog(dt);
  updateTileEffects(dt);
  updateFeedbackEffects(dt);
  updateSpecialRoomEffects(dt);
  updatePoisonEffect(dt);
  updateLowHullWarning(dt);
  const { x: inputX, y: inputY } = getMovementInput();
  const length = Math.hypot(inputX, inputY) || 1;
  if (inputX !== 0 || inputY !== 0) {
    miner.facingX = inputX / length;
    miner.facingY = inputY / length;
  }

  const currentSpeed = miner.speed * getSpeedMultiplier() * (treasureChest.carried ? TREASURE_CARRY_SPEED_MULTIPLIER : 1);
  miner.isMoving = inputX !== 0 || inputY !== 0;
  if (miner.isMoving || miner.drillCooldown > 0) miner.animationTime += dt;
  miner.vx = (inputX / length) * currentSpeed;
  miner.vy = (inputY / length) * currentSpeed;

  moveMiner(miner.vx * dt, miner.vy * dt, dt);
  if (miner.health <= 0) {
    triggerGameOver();
    updateCamera();
    updateHud();
    return;
  }
  updateMagnets(dt);
  collectPickups();
  handleBase(dt);
  updateTreasureChest(dt);
  updateCamera();
  updateMonsterSightingSounds();
  updateHud();
}

function updateMonsters(dt) {
  trySpawnLevelEightBaseAttacker();
  monsterSpawnTimer -= dt;
  if (monsterSpawnTimer <= 0) {
    const level = getMonsterSpawnLevel();
    spawnMonsterWave(level);
    monsterSpawnTimer = getNextMonsterWaveDelay();
  }

  for (const monster of monsters) {
    if (monster.dormant) continue;
    const previousX = monster.x;
    const previousY = monster.y;
    monster.isMoving = false;
    monster.hitFlash = Math.max(0, monster.hitFlash - dt);
    monster.hitFlashCooldown = Math.max(0, (monster.hitFlashCooldown ?? 0) - dt);
    monster.attackFlash = Math.max(0, monster.attackFlash - dt);
    monster.attackCooldown = Math.max(0, monster.attackCooldown - dt);
    monster.repathTimer = Math.max(0, monster.repathTimer - dt);
    if (isMonsterRepelledByGodVisage(monster)) {
      repelMonsterFromMiner(monster, dt);
      updateMonsterWalkAnimation(monster, previousX, previousY, dt);
      continue;
    }
    const target = getMonsterTarget(monster);
    if (monster.targetKind !== target.kind) {
      monster.path = [];
      monster.repathTimer = 0;
      monster.targetKind = target.kind;
    }
    followMonsterPath(monster, dt, target);
    updateMonsterWalkAnimation(monster, previousX, previousY, dt);
    const dx = target.x - monster.x;
    const dy = target.y - monster.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= monster.radius + target.radius + 3) {
      attackMonsterTarget(monster, target, dx, dy, distance);
    }
  }
}

function trySpawnLevelEightBaseAttacker() {
  const spawnTime = LEVEL_EIGHT_MONSTER_SPAWN_TIME_BY_WORLD[activeWorldSize]
    ?? LEVEL_EIGHT_MONSTER_SPAWN_TIME_BY_WORLD.large;
  if (!levelEightMonsterWarningShown && elapsedTime >= spawnTime - LEVEL_EIGHT_MONSTER_WARNING_TIME) {
    levelEightMonsterWarningShown = true;
    showLevelEightMonsterWarning();
  }
  if (levelEightMonsterSpawned || elapsedTime < spawnTime) return;
  const spawned = spawnMonster(8, {
    targetMode: "base",
    ignoreLimit: true,
    skipCooldownReduction: true,
  });
  if (!spawned) return;

  levelEightMonsterSpawned = true;
  setMessage("Warning: an Abyss Tyrant is advancing on the base.");
}

function showLevelEightMonsterWarning() {
  const toast = document.querySelector("#roomToast");
  if (!toast) return;
  hideRelicToast();

  document.querySelector("#roomToastKicker").textContent = "Something approaches";
  document.querySelector("#roomToastTitle").textContent = "A deep rumbling shakes through the cavern";
  document.querySelector("#roomToastDescription").textContent = "The vibrations are growing stronger. Something immense is approaching. Its arrival is imminent.";

  toast.hidden = false;
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");

  window.clearTimeout(roomToastTimer);
  roomToastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove("is-visible");
  }, 5000);
  setMessage("A deep rumbling shakes through the cavern. Something immense is approaching.");
}

function spawnMonsterWave(level) {
  let spawned = 0;
  if (spawnMonster(level, { targetMode: "miner" })) spawned += 1;
  if (level >= 6 && spawnMonster(level, { targetMode: "base", ignoreLimit: true })) spawned += 1;
  return spawned;
}

function reduceMonsterSpawnInterval(spawnedCount) {
  if (spawnedCount <= 0) return;
  monsterSpawnInterval = Math.max(MIN_MONSTER_SPAWN_INTERVAL, monsterSpawnInterval - MONSTER_SPAWN_INTERVAL_STEP * spawnedCount);
}

function spawnMonster(level = getMonsterSpawnLevel(), options = {}) {
  if (!options.ignoreLimit && getActiveMonsterLimitCount() >= MAX_MONSTERS) return false;

  const openTiles = getMonsterSpawnTiles();
  if (openTiles.length === 0) return false;

  const spawnTile = openTiles[Math.floor(Math.random() * openTiles.length)];
  createMonster(spawnTile, { level, targetMode: options.targetMode });
  if (!options.skipCooldownReduction) reduceMonsterSpawnInterval(1);
  return true;
}

function getActiveMonsterLimitCount() {
  return monsters.filter((monster) => !monster.dormant && !isBaseAttackMonster(monster)).length;
}

function updateMonsterWalkAnimation(monster, previousX, previousY, dt) {
  const dx = monster.x - previousX;
  const dy = monster.y - previousY;
  if (Math.hypot(dx, dy) < 0.05) return;

  monster.isMoving = true;
  monster.walkAnimationTime += dt;
  if (Math.abs(dx) > Math.abs(dy)) {
    monster.facing = dx > 0 ? "right" : "left";
  } else {
    monster.facing = dy > 0 ? "down" : "up";
  }
}

function getMonsterSpawnLevel() {
  return Math.max(getDepthBasedMonsterLevel(), getTimeBasedMonsterLevel());
}

function getMinerDepthProgress() {
  const mineDepth = Math.max(1, ROWS - SURFACE_ROWS);
  return clamp(deepestMinerDepth / mineDepth, 0, 1);
}

function getDepthBasedMonsterLevel() {
  const progress = getMinerDepthProgress();
  let level = 1;
  for (let i = 0; i < MONSTER_LEVEL_DEPTH_THRESHOLDS.length; i++) {
    if (progress >= MONSTER_LEVEL_DEPTH_THRESHOLDS[i]) level = i + 1;
  }
  return clamp(level, 1, MONSTER_MAX_PROGRESS_LEVEL);
}

function getTimeBasedMonsterLevel() {
  const levelSixTime = MONSTER_LEVEL_6_TIME_BY_WORLD[activeWorldSize] ?? MONSTER_LEVEL_6_TIME_BY_WORLD.large;
  const progress = clamp(elapsedTime / levelSixTime, 0, 1);
  return clamp(1 + Math.floor(progress * (MONSTER_MAX_PROGRESS_LEVEL - 1)), 1, MONSTER_MAX_PROGRESS_LEVEL);
}

function getMinerDepthTiles() {
  return Math.max(0, miner.y / TILE - SURFACE_ROWS);
}

function createMonster(spawnTile, options = {}) {
  const level = options.level ?? getMonsterLevel(spawnTile.y);
  const maxHp = options.hp ?? getMonsterMaxHp(level);
  monsters.push({
    x: spawnTile.x * TILE + TILE / 2,
    y: spawnTile.y * TILE + TILE / 2,
    radius: options.radius ?? (level >= 8 ? 14 : 11),
    level,
    hp: maxHp,
    maxHp,
    speedMultiplier: options.speedMultiplier ?? (level >= 8 ? LEVEL_EIGHT_MONSTER_SPEED_MULTIPLIER : 1),
    damageMultiplier: options.damageMultiplier ?? (level >= 8 ? LEVEL_EIGHT_MONSTER_DAMAGE_MULTIPLIER : 1),
    name: options.name ?? (level >= 8 ? "Level 8 Abyss Tyrant" : `Level ${level} monster`),
    color: options.color ?? null,
    loot: options.loot ?? "alienCarapace",
    lootAmount: options.lootAmount ?? (level >= 8 ? 3 : 1),
    dormant: Boolean(options.dormant),
    roomLabel: options.roomLabel ?? null,
    targetMode: options.targetMode ?? "auto",
    hitFlash: 0,
    hitFlashCooldown: 0,
    attackFlash: 0,
    attackCooldown: 1,
    path: [],
    pathTarget: null,
    targetKind: "miner",
    repathTimer: 0,
    screamedOnScreen: false,
    facing: "down",
    isMoving: false,
    walkAnimationTime: Math.random() * getMonsterWalkFrameTime(level) * MONSTER_WALK_SEQUENCE.length,
  });
  if (!options.quiet) setMessage(`${options.name ?? `Level ${level} monster`} detected.`);
}

function isBaseAttackMonster(monster) {
  return monster.targetMode === "base";
}

function getMonsterSpawnTiles() {
  const minerTile = { x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) };
  const start = getNearestMonsterOpenTile(minerTile, 12);
  if (!start) return [];

  const reachable = getMonsterReachableOpenTiles(start);
  const deepestDugY = getDeepestReachableDugY(reachable);
  const minY = Math.max(SURFACE_ROWS, deepestDugY - 2);
  const openTiles = [];

  for (let y = deepestDugY; y >= minY; y--) {
    for (let x = 0; x < COLS; x++) {
      if (!isMonsterOpenTile(x, y)) continue;
      if (!reachable.has(`${x},${y}`)) continue;
      if (Math.hypot(x - minerTile.x, y - minerTile.y) < 8) continue;
      openTiles.push({ x, y });
    }
  }

  return openTiles;
}

function getDeepestReachableDugY(reachable) {
  let deepest = SURFACE_ROWS - 1;
  for (const key of reachable.keys()) {
    const [, yText] = key.split(",");
    const y = Number(yText);
    if (y > deepest) deepest = y;
  }
  return deepest;
}

function getDeepestDugY() {
  let deepest = SURFACE_ROWS - 1;
  for (let y = SURFACE_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (isOpenTile(x, y)) deepest = y;
    }
  }
  return deepest;
}

function getMonsterLevel(tileY) {
  let level = 1;
  for (let i = 0; i < blockDefs.length; i++) {
    if (tileY >= blockDefs[i].depth) level = i + 1;
  }
  return level;
}

function getMonsterMaxHp(level) {
  const baseHp = MONSTER_BASE_HP + level * MONSTER_HP_PER_LEVEL;
  if (level >= 8) return Math.round(baseHp * LEVEL_EIGHT_MONSTER_HP_MULTIPLIER);
  return Math.round(baseHp * getHighLevelMonsterMultiplier(level, HIGH_LEVEL_MONSTER_HP_MULTIPLIERS));
}

function getMonsterTarget(monster) {
  if (monster.targetMode === "base" && canMonsterReachBase(monster)) return getBaseMonsterTarget();

  const start = getNearestMonsterOpenTile(getMonsterTile(monster), 3);
  const reachable = start ? getMonsterReachableOpenTiles(start) : null;
  const minerSheltered = isMinerAtBase();
  if (!minerSheltered) rememberMinerPosition();
  const minerPosition = minerSheltered ? getLastKnownMinerTarget() : {
    kind: "miner",
    x: miner.x,
    y: miner.y,
    radius: miner.radius,
  };
  if (monster.targetMode === "miner") {
    const minerTarget = getReachableMonsterTarget(reachable, minerPosition);
    if (minerTarget) return minerTarget;
    return getMonsterIdleTarget(monster);
  }

  const targets = [
    getReachableMonsterTarget(reachable, minerPosition),
  ].filter(Boolean);

  if (targets.length === 0) return getMonsterIdleTarget(monster);

  return targets.reduce((best, target) => {
    const bestDistance = Math.hypot(best.x - monster.x, best.y - monster.y);
    const targetDistance = Math.hypot(target.x - monster.x, target.y - monster.y);
    return targetDistance < bestDistance ? target : best;
  });
}

function rememberMinerPosition() {
  lastKnownMinerPosition.x = miner.x;
  lastKnownMinerPosition.y = miner.y;
  lastKnownMinerPosition.radius = miner.radius;
  lastKnownMinerPosition.valid = true;
}

function getLastKnownMinerTarget() {
  return {
    kind: "lastKnownMiner",
    x: lastKnownMinerPosition.x,
    y: lastKnownMinerPosition.y,
    radius: lastKnownMinerPosition.radius,
  };
}

function getReachableMonsterTarget(reachable, target) {
  if (!reachable) return null;
  const targetTile = getNearestReachableTileFromMap(reachable, getTargetTile(target), 2);
  if (!targetTile) return null;
  return {
    ...target,
    pathTile: targetTile,
    x: targetTile.x * TILE + TILE / 2,
    y: targetTile.y * TILE + TILE / 2,
  };
}

function getMonsterIdleTarget(monster) {
  const tile = getNearestMonsterOpenTile(getMonsterTile(monster), 3) ?? getMonsterTile(monster);
  return {
    kind: "idle",
    x: tile.x * TILE + TILE / 2,
    y: tile.y * TILE + TILE / 2,
    radius: monster.radius,
    pathTile: tile,
  };
}

function getBaseMonsterTarget() {
  return {
    kind: "base",
    x: BASE_CENTER_TILE_X * TILE,
    y: (BASE_MAX_TILE_Y + 1) * TILE + TILE / 2,
    radius: TILE * 0.8,
  };
}

function getBaseAttackTile() {
  return {
    x: BASE_CENTER_TILE_X,
    y: BASE_MAX_TILE_Y + 1,
  };
}

function canMonsterReachBase(monster) {
  if (monster.dormant) return false;
  if (!isBaseAttackMonster(monster)) return false;
  const attackTile = getBaseAttackTile();
  if (!isMonsterOpenTile(attackTile.x, attackTile.y)) return false;
  const start = getNearestMonsterOpenTile(getMonsterTile(monster), 3);
  if (!start) return false;
  return getMonsterReachableOpenTiles(start).has(`${attackTile.x},${attackTile.y}`);
}

function isReachableTarget(reachable, target) {
  if (!reachable) return false;
  const targetTile = {
    x: Math.floor(target.x / TILE),
    y: Math.floor(target.y / TILE),
  };
  return !!getNearestReachableTileFromMap(reachable, targetTile, 2);
}

function isHelperTargetable(helper) {
  const tileX = Math.floor(helper.x / TILE);
  const tileY = Math.floor(helper.y / TILE);
  return isOpenTile(tileX, tileY) && !isBaseTile(tileX, tileY);
}

function attackMonsterTarget(monster, target, dx, dy, distance) {
  if (target.kind === "idle" || target.kind === "lastKnownMiner") return;
  if (target.kind === "miner") {
    attackMiner(monster, dx, dy, distance);
    return;
  }
  if (target.kind === "base") {
    attackBase(monster);
    return;
  }

  attackHelper(monster, target.kind, dx, dy, distance);
}

function attackBase(monster) {
  if (!isBaseAttackMonster(monster)) return;
  if (monster.attackCooldown > 0 || base.health <= 0) return;

  monster.attackCooldown = MONSTER_ATTACK_COOLDOWN;
  monster.attackFlash = 0.18;
  base.health = Math.max(0, base.health - getMonsterBaseDamage(monster));
  baseAttackAlertTimer = BASE_ATTACK_ALERT_DURATION;
  setMessage(base.health <= 0 ? "Base breached." : "Monster damaged the base.");
  if (base.health <= 0) triggerGameOver("base");
}

function attackMiner(monster, dx, dy, distance) {
  if (gameOver) return;
  if (monster.attackCooldown > 0) return;
  if (isMinerAtBase()) return;

  monster.attackCooldown = MONSTER_ATTACK_COOLDOWN;
  monster.attackFlash = 0.18;
  miner.health = Math.max(0, miner.health - getMonsterDamage(monster) * getHullDamageTakenMultiplier());

  const force = distance || 1;
  const knockback = 12 + monster.level * 2;
  moveMinerWithSweptCollision(
    (dx / force) * knockback,
    (dy / force) * knockback,
  );
  pushMinerOutOfMonster(monster);
  bounceMonsterFromMiner(monster, dx, dy, force);

  setMessage(miner.health <= 0 ? "Hull breached. Return to base." : "Monster damaged the hull.");
  if (miner.health <= 0) triggerGameOver();
}

function attackHelper(monster, type, dx, dy, distance) {
  if (monster.attackCooldown > 0 || !relics[type].unlocked) return;

  monster.attackCooldown = MONSTER_ATTACK_COOLDOWN;
  monster.attackFlash = 0.18;
  damageHelper(type, getMonsterDamage(monster), "monster");
  if (!relics[type].unlocked) return;

  const helper = type === "mouse" ? mouseHelper : dogHelper;
  const force = distance || 1;
  const knockback = 10 + monster.level * 2;
  const nextX = clamp(helper.x + (dx / force) * knockback, HELPER_RADIUS, COLS * TILE - HELPER_RADIUS);
  const nextY = clamp(helper.y + (dy / force) * knockback, HELPER_RADIUS, ROWS * TILE - HELPER_RADIUS);
  if (!isMonsterBlockedAt({ radius: HELPER_RADIUS }, nextX, nextY)) {
    helper.x = nextX;
    helper.y = nextY;
  }
  bounceMonsterFromMiner(monster, dx, dy, force);

  if (relics[type].unlocked) {
    setMessage(`Monster damaged the ${type}.`);
  }
}

function getMonsterDamage(monster) {
  return (MONSTER_BASE_ATTACK_DAMAGE + monster.level * MONSTER_ATTACK_DAMAGE_PER_LEVEL)
    * getHighLevelMonsterMultiplier(monster.level, HIGH_LEVEL_MONSTER_DAMAGE_MULTIPLIERS)
    * (monster.damageMultiplier ?? 1);
}

function getHullDamageTakenMultiplier() {
  const level = clamp(miner.upgrades.hardening, 0, HULL_HARDENING_DAMAGE_MULTIPLIERS.length - 1);
  return HULL_HARDENING_DAMAGE_MULTIPLIERS[level];
}

function getMonsterBaseDamage(monster) {
  const referenceDamage = (base.maxHealth * MONSTER_ATTACK_COOLDOWN) / BASE_MONSTER_REFERENCE_DESTROY_TIME;
  const levelBonus = Math.max(0, monster.level - BASE_MONSTER_DAMAGE_REFERENCE_LEVEL) * BASE_MONSTER_DAMAGE_LEVEL_SCALE;
  return referenceDamage
    * (1 + levelBonus)
    * getHighLevelMonsterMultiplier(monster.level, HIGH_LEVEL_MONSTER_DAMAGE_MULTIPLIERS)
    * (monster.damageMultiplier ?? 1);
}

function getHighLevelMonsterMultiplier(level, multipliers) {
  if (level >= 8) return 1;
  return multipliers[clamp(level, 0, multipliers.length - 1)] ?? 1;
}

function bounceMonsterFromMiner(monster, dx, dy, force) {
  const bounce = 22 + monster.level * 3;
  const nextX = clamp(monster.x - (dx / force) * bounce, monster.radius, COLS * TILE - monster.radius);
  const nextY = clamp(monster.y - (dy / force) * bounce, monster.radius, ROWS * TILE - monster.radius);

  if (!isMonsterBlockedAt(monster, nextX, nextY)) {
    monster.x = nextX;
    monster.y = nextY;
  } else if (!isMonsterBlockedAt(monster, nextX, monster.y)) {
    monster.x = nextX;
  } else if (!isMonsterBlockedAt(monster, monster.x, nextY)) {
    monster.y = nextY;
  }

  monster.path = [];
  monster.repathTimer = 0;
}

function followMonsterPath(monster, dt, chaseTarget) {
  const start = getNearestMonsterOpenTile(getMonsterTile(monster), 3);
  if (!start) return;

  const currentTile = getMonsterTile(monster);
  if (!isMonsterOpenTile(currentTile.x, currentTile.y)) {
    monster.x = start.x * TILE + TILE / 2;
    monster.y = start.y * TILE + TILE / 2;
    monster.path = [];
    return;
  }

  const reachable = getMonsterReachableOpenTiles(start);
  const targetTile = chaseTarget.pathTile ?? getNearestReachableTileFromMap(reachable, getTargetTile(chaseTarget), 2);
  if (!targetTile) {
    monster.path = [];
    return;
  }

  const path = reconstructPathFromMap(reachable, start, targetTile);
  const next = path[0];
  monster.path = path;
  monster.pathTarget = targetTile;
  if (!next) {
    if (chaseTarget.kind !== "idle" && !isMonsterBlockedAt(monster, chaseTarget.x, chaseTarget.y)) {
      moveMonsterToward(monster, chaseTarget.x, chaseTarget.y, dt);
    }
    return;
  }

  moveMonsterToward(monster, next.x * TILE + TILE / 2, next.y * TILE + TILE / 2, dt);
}

function getTargetTile(target) {
  return {
    x: Math.floor(target.x / TILE),
    y: Math.floor(target.y / TILE),
  };
}

function moveMonsterToward(monster, x, y, dt) {
  const dx = x - monster.x;
  const dy = y - monster.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;

  const speed = (32 + monster.level * 2.5)
    * getHighLevelMonsterMultiplier(monster.level, HIGH_LEVEL_MONSTER_SPEED_MULTIPLIERS)
    * (monster.speedMultiplier ?? 1);
  const step = Math.min(distance, speed * dt);
  const nextX = monster.x + (dx / distance) * step;
  const nextY = monster.y + (dy / distance) * step;

  if (!isMonsterBlockedAt(monster, nextX, nextY)) {
    monster.x = nextX;
    monster.y = nextY;
    return true;
  } else if (Math.abs(dx) > Math.abs(dy) && !isMonsterBlockedAt(monster, nextX, monster.y)) {
    monster.x = nextX;
    return true;
  } else if (!isMonsterBlockedAt(monster, monster.x, nextY)) {
    monster.y = nextY;
    return true;
  } else {
    centerMonsterInOpenTile(monster);
    monster.path = [];
    monster.repathTimer = 0;
    return false;
  }
}

function isMonsterRepelledByGodVisage(monster) {
  if (!relics.godVisage.unlocked) return false;
  if (relics.godVisage.active > 0) return true;
  return relics.godVisage.level >= 4 && hasLineOfSight(miner.x, miner.y, monster.x, monster.y);
}

function repelMonsterFromMiner(monster, dt) {
  const dx = monster.x - miner.x;
  const dy = monster.y - miner.y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = (54 + monster.level * 3)
    * getHighLevelMonsterMultiplier(monster.level, HIGH_LEVEL_MONSTER_SPEED_MULTIPLIERS)
    * (monster.speedMultiplier ?? 1);
  const nextX = clamp(monster.x + (dx / distance) * speed * dt, monster.radius, COLS * TILE - monster.radius);
  const nextY = clamp(monster.y + (dy / distance) * speed * dt, monster.radius, ROWS * TILE - monster.radius);
  if (!isMonsterBlockedAt(monster, nextX, nextY)) {
    monster.x = nextX;
    monster.y = nextY;
  } else if (!isMonsterBlockedAt(monster, nextX, monster.y)) {
    monster.x = nextX;
  } else if (!isMonsterBlockedAt(monster, monster.x, nextY)) {
    monster.y = nextY;
  }
  monster.path = [];
  monster.repathTimer = 0;
}

function centerMonsterInOpenTile(monster) {
  const tile = getNearestMonsterOpenTile(getMonsterTile(monster), 2);
  if (!tile) return;
  monster.x = tile.x * TILE + TILE / 2;
  monster.y = tile.y * TILE + TILE / 2;
}

function isMonsterBlockedAt(monster, x, y) {
  const checks = [
    [x - monster.radius, y - monster.radius],
    [x + monster.radius, y - monster.radius],
    [x - monster.radius, y + monster.radius],
    [x + monster.radius, y + monster.radius],
  ];

  return checks.some(([px, py]) => {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    return isSolidTile(tx, ty) || isBaseTile(tx, ty);
  });
}

function getMonsterTile(monster) {
  return {
    x: Math.floor(monster.x / TILE),
    y: Math.floor(monster.y / TILE),
  };
}

function isMonsterOpenTile(x, y) {
  return isOpenTile(x, y) && !isBaseTile(x, y);
}

function isBaseTile(x, y) {
  return x >= BASE_MIN_TILE_X && x <= BASE_MAX_TILE_X && y >= 0 && y <= BASE_MAX_TILE_Y;
}

function getNearestMonsterOpenTile(origin, maxRadius = 12) {
  if (isMonsterOpenTile(origin.x, origin.y)) return origin;

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (Math.max(Math.abs(origin.x - x), Math.abs(origin.y - y)) !== radius) continue;
        if (isMonsterOpenTile(x, y)) return { x, y };
      }
    }
  }

  return null;
}

function getMonsterReachableOpenTiles(start) {
  const queue = [start];
  const cameFrom = new Map([[`${start.x},${start.y}`, null]]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (cameFrom.has(key) || !isMonsterOpenTile(next.x, next.y)) continue;
      cameFrom.set(key, current);
      queue.push(next);
    }
  }

  return cameFrom;
}

function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].life -= dt;
    if (explosions[i].life <= 0) explosions.splice(i, 1);
  }

  for (let i = radiationBursts.length - 1; i >= 0; i--) {
    radiationBursts[i].life -= dt;
    if (radiationBursts[i].life <= 0) radiationBursts.splice(i, 1);
  }

  for (let i = swordArcs.length - 1; i >= 0; i--) {
    updateSwordArcHit(swordArcs[i], dt);
    if (swordArcs[i].life <= 0) swordArcs.splice(i, 1);
  }
}

function updateRelics(dt) {
  for (const relic of Object.values(relics)) {
    if ("active" in relic) relic.active = Math.max(0, relic.active - dt);
    if ("cooldown" in relic) relic.cooldown = Math.max(0, relic.cooldown - dt);
  }
  updateLaserSwordRecharge(dt);
  updateGrenadeRecharge(dt);
}

function updateLaserSwordRecharge(dt) {
  const sword = relics.laserSword;
  if (!sword.unlocked) return;
  const maxSwings = getLaserSwordMaxSwings();
  if (sword.swings >= maxSwings) {
    sword.recharge = 0;
    return;
  }

  sword.recharge = Math.max(0, sword.recharge - dt);
  while (sword.recharge <= 0 && sword.swings < maxSwings) {
    sword.swings += 1;
    sword.recharge += LASER_SWORD_RECHARGE_TIME;
  }

  if (sword.swings >= maxSwings) sword.recharge = 0;
}

function updateGrenadeRecharge(dt) {
  const grenades = relics.grenades;
  if (!grenades.unlocked) return;
  const maxCharges = getGrenadeMaxCharges();
  if (grenades.charges >= maxCharges) {
    grenades.recharge = 0;
    return;
  }

  grenades.recharge = Math.max(0, grenades.recharge - dt);
  while (grenades.recharge <= 0 && grenades.charges < maxCharges) {
    grenades.charges += 1;
    grenades.recharge += GRENADE_RECHARGE_TIME;
  }

  if (grenades.charges >= maxCharges) grenades.recharge = 0;
}

function updateBlaster(dt) {
  const blaster = relics.blaster;
  blaster.shotCooldown = Math.max(0, blaster.shotCooldown - dt);
  if (blaster.overheat > 0) {
    blaster.overheat = Math.max(0, blaster.overheat - dt);
    if (blaster.overheat === 0) blaster.charge = 100;
  } else {
    blaster.charge = Math.min(100, blaster.charge + 0.5 * dt);
  }
  for (let i = blasts.length - 1; i >= 0; i--) {
    const blast = blasts[i];
    blast.life -= dt;
    if (blast.life <= 0) {
      if (blast.kind === "rocket") {
        detonateAt(
          clamp(Math.floor(blast.x / TILE), 0, COLS - 1),
          clamp(Math.floor(blast.y / TILE), 0, ROWS - 1),
          blast.radius ?? getRocketRadius(),
          blast.damage ?? getRocketDamage(),
          { damageMiner: true, monsterDamage: blast.monsterDamage ?? getRocketMonsterDamage() },
        );
      }
      blasts.splice(i, 1);
      continue;
    }
    blast.x += blast.vx * dt;
    blast.y += blast.vy * dt;
    if (updateBlastHit(blast)) blasts.splice(i, 1);
  }

  if ((keys.has(" ") || gamepadState.blasterHeld) && blaster.unlocked) fireBlaster();
}

function getMovementInput() {
  const keyboardX = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
  const keyboardY = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
  const x = keyboardX || gamepadState.axes.x;
  const y = keyboardY || gamepadState.axes.y;
  const length = Math.hypot(x, y);
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

function updateRadiation(dt) {
  const radiation = relics.radiation;
  if (!radiation.unlocked || radiation.active <= 0) return;

  radiation.tick -= dt;
  while (radiation.tick <= 0 && radiation.active > 0) {
    radiation.tick += RADIATION_TICK_INTERVAL;
    pulseRadiation();
  }
}

function pulseRadiation() {
  const damage = getRadiationDamage();
  radiationBursts.push({
    x: miner.x,
    y: miner.y,
    radius: RADIATION_RADIUS,
    life: RADIATION_BURST_LIFE,
    maxLife: RADIATION_BURST_LIFE,
  });

  for (const monster of [...monsters]) {
    if (Math.hypot(monster.x - miner.x, monster.y - miner.y) <= RADIATION_RADIUS + monster.radius) {
      damageMonster(monster, damage);
    }
  }

  if (relics.radiation.level < 4) {
    if (relics.mouse.unlocked && isHelperInRadiation(mouseHelper)) {
      damageHelper("mouse", damage, "radiation");
    }
    if (relics.dog.unlocked && isHelperInRadiation(dogHelper)) {
      damageHelper("dog", damage, "radiation");
    }
  }
}

function isHelperInRadiation(helper) {
  return Math.hypot(helper.x - miner.x, helper.y - miner.y) <= RADIATION_RADIUS + 10;
}

function damageHelper(type, amount, source = "damage") {
  const helper = type === "mouse" ? mouseHelper : dogHelper;
  helper.health = Math.max(0, helper.health - amount);
  if (helper.health > 0) return;

  killHelper(type, source);
}

function killHelper(type, source = "damage") {
  relics[type].unlocked = false;
  if (type === "dog") {
    dropDogCargo();
    resetDogHelper();
    if (source === "monster") {
      setMessage("The dog was eaten.");
    } else if (source === "blast") {
      setMessage("Dog was caught in the blast.");
    } else {
      setMessage("Dog was lost to radiation.");
    }
    return;
  }

  resetMouseHelper();
  if (source === "monster") {
    setMessage("The mouse was eaten.");
  } else if (source === "blast") {
    setMessage("Mouse was caught in the blast.");
  } else {
    setMessage("Mouse was lost to radiation.");
  }
}

function resetMouseHelper() {
  mouseHelper.x = miner.x - 22;
  mouseHelper.y = miner.y + 18;
  mouseHelper.target = null;
  mouseHelper.path = [];
  mouseHelper.mode = "idle";
  mouseHelper.drillCooldown = 0;
  mouseHelper.searchCooldown = 0;
  mouseHelper.stuckTimer = 0;
  mouseHelper.lastX = mouseHelper.x;
  mouseHelper.lastY = mouseHelper.y;
  mouseHelper.health = mouseHelper.maxHealth;
  mouseHelper.initialized = false;
}

function resetDogHelper() {
  dogHelper.x = miner.x + 22;
  dogHelper.y = miner.y + 18;
  dogHelper.target = null;
  dogHelper.path = [];
  dogHelper.mode = "idle";
  for (const type of Object.keys(dogHelper.cargo)) dogHelper.cargo[type] = 0;
  dogHelper.carried = 0;
  dogHelper.health = dogHelper.maxHealth;
  dogHelper.initialized = false;
}

function updateMagnets(dt) {
  if (relics.magnet.active <= 0) return;
  pullPickupsToMagnet({
    x: miner.x,
    y: miner.y,
    radius: getMagnetRadius(),
    speed: Math.hypot(miner.vx, miner.vy),
  }, dt);
}

function pullPickupsToMagnet(magnet, dt) {
  const radius = magnet.radius ?? MAGNET_RADIUS;
  const magnetSpeed = MAGNET_PULL_SPEED + (magnet.speed ?? 0) * 1.65;
  for (const pickup of pickups) {
    if (!isPickupVisible(pickup)) continue;
    const dx = magnet.x - pickup.x;
    const dy = magnet.y - pickup.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1 || distance > radius) continue;

    const pullFalloff = 0.45 + (1 - distance / radius) * 0.75;
    const pullStrength = magnetSpeed * pullFalloff;
    const step = Math.min(distance, Math.max(36, pullStrength) * dt);
    const nextX = pickup.x + (dx / distance) * step;
    const nextY = pickup.y + (dy / distance) * step;
    movePickupToward(pickup, nextX, nextY, dx, dy);
  }
}

function movePickupToward(pickup, nextX, nextY, dx, dy) {
  if (isPickupSpaceOpen(nextX, nextY)) {
    pickup.x = nextX;
    pickup.y = nextY;
    return;
  }

  const tryX = isPickupSpaceOpen(nextX, pickup.y);
  const tryY = isPickupSpaceOpen(pickup.x, nextY);
  if (tryX && (!tryY || Math.abs(dx) >= Math.abs(dy))) {
    pickup.x = nextX;
  } else if (tryY) {
    pickup.y = nextY;
  } else {
    const slide = getMagnetSlideStep(pickup, dx, dy);
    if (slide) {
      pickup.x = slide.x;
      pickup.y = slide.y;
    }
  }
}

function getMagnetSlideStep(pickup, dx, dy) {
  const slideDistance = 1.8;
  const candidates = Math.abs(dx) > Math.abs(dy)
    ? [
        { x: pickup.x, y: pickup.y + Math.sign(dy || 1) * slideDistance },
        { x: pickup.x, y: pickup.y - Math.sign(dy || 1) * slideDistance },
      ]
    : [
        { x: pickup.x + Math.sign(dx || 1) * slideDistance, y: pickup.y },
        { x: pickup.x - Math.sign(dx || 1) * slideDistance, y: pickup.y },
      ];

  return candidates.find((candidate) => isPickupSpaceOpen(candidate.x, candidate.y)) ?? null;
}

function isPickupSpaceOpen(x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  return isOpenTile(tx, ty);
}

function fireBlaster() {
  const blaster = relics.blaster;
  if (blaster.overheat > 0 || blaster.charge <= 0 || blaster.shotCooldown > 0) return;

  blaster.charge = Math.max(0, blaster.charge - 1);
  blaster.shotCooldown = 0.4;
  if (blaster.charge === 0) blaster.overheat = 30;
  blasts.push({
    x: miner.x + miner.facingX * 14,
    y: miner.y + miner.facingY * 14,
    vx: miner.facingX * 420,
    vy: miner.facingY * 420,
    life: 0.7,
    monsterDamageBonus: getBlasterDamageBonus(),
    blockDamageBonus: getBlasterBlockDamageBonus(),
  });
}

function swingLaserSword() {
  const sword = relics.laserSword;
  if (!sword.unlocked) return false;
  if (sword.swings <= 0) {
    setMessage(`Laser Sword recharging. Next swing in ${formatTime(sword.recharge || LASER_SWORD_RECHARGE_TIME)}.`);
    return false;
  }

  const damage = getLaserSwordDamage();
  const range = TILE * 2.4;
  const facingLength = Math.hypot(miner.facingX, miner.facingY) || 1;
  const fx = miner.facingX / facingLength;
  const fy = miner.facingY / facingLength;

  sword.swings -= 1;
  if (sword.swings < getLaserSwordMaxSwings() && sword.recharge <= 0) sword.recharge = LASER_SWORD_RECHARGE_TIME;
  playLaserSwordSound();
  swordArcs.push({
    x: miner.x,
    y: miner.y,
    facingX: fx,
    facingY: fy,
    range,
    damage,
    life: 0.34,
    maxLife: 0.34,
    hitMonsters: new Set(),
    hitTiles: new Set(),
  });

  setMessage(sword.swings > 0 ? `Laser Sword swings left: ${sword.swings}.` : `Laser Sword depleted. Next swing in ${formatTime(sword.recharge)}.`);
  updateHud();
  return true;
}

function updateSwordArcHit(arc, dt) {
  arc.life = Math.max(0, arc.life - dt);
  const blade = getSwordBlade(arc);

  for (const monster of [...monsters]) {
    if (arc.hitMonsters.has(monster)) continue;
    const hit = getPointToSegmentHit(monster.x, monster.y, blade.startX, blade.startY, blade.endX, blade.endY);
    if (!hit || hit.distance > monster.radius + 7) continue;
    arc.hitMonsters.add(monster);
    damageMonster(monster, arc.damage);
    const pushX = monster.x - arc.x;
    const pushY = monster.y - arc.y;
    const pushLength = Math.hypot(pushX, pushY) || 1;
    monster.x += (pushX / pushLength) * 18;
    monster.y += (pushY / pushLength) * 18;
  }

  const samples = Math.ceil(arc.range / 8);
  for (let i = 2; i <= samples; i++) {
    const t = i / samples;
    const x = blade.startX + (blade.endX - blade.startX) * t;
    const y = blade.startY + (blade.endY - blade.startY) * t;
    const tileX = Math.floor(x / TILE);
    const tileY = Math.floor(y / TILE);
    const key = `${tileX},${tileY}`;
    if (arc.hitTiles.has(key)) continue;
    if (!world[tileY]?.[tileX]) continue;
    arc.hitTiles.add(key);
    damageTile(tileX, tileY, arc.damage * LASER_SWORD_BLOCK_DAMAGE_MULTIPLIER, 0.16, true);
  }
}

function getSwordBlade(arc) {
  const progress = 1 - arc.life / arc.maxLife;
  const baseAngle = Math.atan2(arc.facingY, arc.facingX);
  const sweepAngle = baseAngle + (-0.95 + progress * 1.9);
  const dirX = Math.cos(sweepAngle);
  const dirY = Math.sin(sweepAngle);
  const startDistance = 12;
  return {
    angle: sweepAngle,
    progress,
    startX: arc.x + dirX * startDistance,
    startY: arc.y + dirY * startDistance,
    endX: arc.x + dirX * arc.range,
    endY: arc.y + dirY * arc.range,
  };
}

function getPointToSegmentHit(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const lengthSq = vx * vx + vy * vy;
  if (lengthSq <= 0) return null;
  const projection = clamp(((px - ax) * vx + (py - ay) * vy) / lengthSq, 0, 1);
  const closestX = ax + vx * projection;
  const closestY = ay + vy * projection;
  return {
    projection,
    distance: Math.hypot(px - closestX, py - closestY),
  };
}

function activateConverter() {
  const converter = relics.converter;
  if (!converter.unlocked) return false;
  if (!isMinerAtBase()) {
    setMessage("Return to base to run the converter.");
    return false;
  }
  if (converter.cooldown > 0) {
    setMessage("Resource Converter is cooling down.");
    return false;
  }

  const gains = getConverterGains();
  for (const [type, amount] of Object.entries(gains)) resources[type] += amount;
  converter.cooldown = getRelicCooldown("converter");
  setMessage(`Converter produced ${formatRecipe(gains)}.`);
  updateHud();
  return true;
}

function getConverterGains() {
  const amount = relics.converter.level * 2;
  return {
    copper: amount,
    silver: relics.converter.level >= 2 ? amount : 0,
    gold: relics.converter.level >= 3 ? amount : 0,
  };
}

function updateBlastHit(blast) {
  if (blast.kind === "rocket" && isBlastOutOfBounds(blast)) {
    detonateAt(
      clamp(Math.floor(blast.x / TILE), 0, COLS - 1),
      clamp(Math.floor(blast.y / TILE), 0, ROWS - 1),
      blast.radius ?? getRocketRadius(),
      blast.damage ?? getRocketDamage(),
      { damageMiner: true, monsterDamage: blast.monsterDamage ?? getRocketMonsterDamage() },
    );
    return true;
  }

  const monster = findMonsterAt(blast.x, blast.y);
  if (monster) {
    if (blast.kind === "rocket") {
      detonateAt(Math.floor(monster.x / TILE), Math.floor(monster.y / TILE), blast.radius ?? getRocketRadius(), blast.damage ?? getRocketDamage(), {
        damageMiner: true,
        monsterDamage: blast.monsterDamage ?? getRocketMonsterDamage(),
      });
    } else {
      damageMonster(monster, blast.monsterDamage ?? blast.damage ?? LEVEL_ONE_DRILL_DAMAGE * BLASTER_MONSTER_DAMAGE_MULTIPLIER + (blast.monsterDamageBonus ?? 0));
    }
    return true;
  }

  const x = Math.floor(blast.x / TILE);
  const y = Math.floor(blast.y / TILE);
  const tile = world[y]?.[x];
  if (!tile) return false;

  if (blast.kind === "rocket") {
    detonateAt(x, y, blast.radius ?? getRocketRadius(), blast.damage ?? getRocketDamage(), {
      damageMiner: true,
      monsterDamage: blast.monsterDamage ?? getRocketMonsterDamage(),
    });
  } else {
    damageTile(x, y, blast.damage ?? miner.power * getDamageMultiplier() * BLASTER_BLOCK_DAMAGE_MULTIPLIER + (blast.blockDamageBonus ?? 0), 0.12);
  }
  return true;
}

function isBlastOutOfBounds(blast) {
  return blast.x < 0 || blast.y < 0 || blast.x >= COLS * TILE || blast.y >= ROWS * TILE;
}

function updateMouse(dt) {
  if (!relics.mouse.unlocked) return;
  if (!mouseHelper.initialized) {
    mouseHelper.x = miner.x - 22;
    mouseHelper.y = miner.y + 18;
    mouseHelper.lastX = mouseHelper.x;
    mouseHelper.lastY = mouseHelper.y;
    mouseHelper.initialized = true;
  }
  ensureMouseInOpenTile();
  updateMouseStuckState(dt);

  const threat = getVisibleMonsterThreat(mouseHelper);
  if (threat) {
    fleeMouseFromMonster(threat, dt);
    return;
  }
  if (mouseHelper.mode === "flee") {
    mouseHelper.mode = "idle";
    mouseHelper.path = [];
  }

  mouseHelper.drillCooldown = Math.max(0, mouseHelper.drillCooldown - dt);
  mouseHelper.searchCooldown = Math.max(0, mouseHelper.searchCooldown - dt);
  if (!mouseHelper.target || !world[mouseHelper.target.y]?.[mouseHelper.target.x]) {
    mouseHelper.target = findMouseTarget();
  }
  if (mouseHelper.target && mouseHelper.mode === "relocate") {
    mouseHelper.mode = "idle";
    mouseHelper.path = [];
  }

  if (!mouseHelper.target) {
    if (mouseHelper.searchCooldown <= 0 || mouseHelper.mode !== "relocate" || mouseHelper.path.length === 0) {
      setMouseRelocationPath();
      mouseHelper.searchCooldown = 0.75;
    }
    if (mouseHelper.path.length > 0) {
      followMousePath(dt, Math.max(0.35, getHelperSpeedMultiplier("mouse")));
      return;
    }
    moveMouseToward(miner.x - 22, miner.y + 18, dt, Math.max(0.35, getHelperSpeedMultiplier("mouse")));
    return;
  }

  const approach = mouseHelper.target.approach;
  if (approach && !isMouseAtTile(approach.x, approach.y)) {
    if (mouseHelper.path.length === 0 || mouseHelper.mode !== "dig") {
      setMousePathToTile(approach.x, approach.y, "dig");
    }
    if (mouseHelper.path.length === 0) {
      mouseHelper.target = null;
      mouseHelper.mode = "idle";
      return;
    }
    followMousePath(dt);
    return;
  }

  mouseDrill(mouseHelper.target.x, mouseHelper.target.y);
}

function setMouseRelocationPath() {
  const start = getNearestOpenTile(getMouseTile());
  if (!start) {
    mouseHelper.path = [];
    mouseHelper.mode = "relocate";
    return;
  }

  const destination = getMouseRelocationDestination(start);
  mouseHelper.path = destination ? findOpenPath(start, destination) : [];
  mouseHelper.mode = "relocate";
}

function ensureMouseInOpenTile() {
  const tile = getMouseTile();
  if (isOpenTile(tile.x, tile.y)) return;

  const open = getNearestOpenTile(tile, 18) ?? getNearestOpenTile({ x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) }, 18);
  if (!open) return;
  mouseHelper.x = open.x * TILE + TILE / 2;
  mouseHelper.y = open.y * TILE + TILE / 2;
  resetMouseNavigation("relocate");
}

function updateMouseStuckState(dt) {
  const moved = Math.hypot(mouseHelper.x - mouseHelper.lastX, mouseHelper.y - mouseHelper.lastY);
  const hasWork = !!mouseHelper.target || mouseHelper.mode === "relocate" || mouseHelper.mode === "flee";
  if (hasWork && moved < 0.2) {
    mouseHelper.stuckTimer += dt;
  } else {
    mouseHelper.stuckTimer = 0;
  }

  mouseHelper.lastX = mouseHelper.x;
  mouseHelper.lastY = mouseHelper.y;

  if (mouseHelper.stuckTimer < 1.6) return;
  const fallback = getNearestOpenTile(getMouseTile(), 18) ?? getNearestOpenTile({ x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) }, 18);
  if (fallback) {
    mouseHelper.x = fallback.x * TILE + TILE / 2;
    mouseHelper.y = fallback.y * TILE + TILE / 2;
  }
  resetMouseNavigation("relocate");
}

function resetMouseNavigation(mode = "idle") {
  mouseHelper.target = null;
  mouseHelper.path = [];
  mouseHelper.mode = mode;
  mouseHelper.searchCooldown = 0;
  mouseHelper.stuckTimer = 0;
  mouseHelper.lastX = mouseHelper.x;
  mouseHelper.lastY = mouseHelper.y;
}

function getMouseRelocationDestination(start) {
  const reachable = getReachableOpenTiles(start);
  let best = null;
  let bestScore = -Infinity;
  for (const key of reachable.keys()) {
    const [xText, yText] = key.split(",");
    const tile = { x: Number(xText), y: Number(yText) };
    if (isBaseTile(tile.x, tile.y)) continue;
    const visibleSolidNeighbors = countVisibleSolidNeighbors(tile.x, tile.y);
    const distanceFromMouse = Math.hypot(tile.x - start.x, tile.y - start.y);
    const distanceFromMiner = Math.hypot(tile.x - Math.floor(miner.x / TILE), tile.y - Math.floor(miner.y / TILE));
    const score = visibleSolidNeighbors * 8 + Math.min(distanceFromMouse, 18) - distanceFromMiner * 0.12 + Math.random() * 2;
    if (score > bestScore) {
      best = tile;
      bestScore = score;
    }
  }

  return best;
}

function countVisibleSolidNeighbors(x, y) {
  let count = 0;
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  for (const direction of directions) {
    const tx = x + direction.x;
    const ty = y + direction.y;
    if (world[ty]?.[tx] && isTileVisible(tx, ty)) count += 1;
  }
  return count;
}

function fleeMouseFromMonster(threat, dt) {
  mouseHelper.target = null;
  mouseHelper.drillCooldown = 0;
  const fleeTile = getFleeDestination(getMouseTile(), threat);
  setMousePathToTile(fleeTile.x, fleeTile.y, "flee");
  if (mouseHelper.path.length === 0) {
    nudgeMouseAwayFromThreat(threat, dt);
    return;
  }
  followMousePath(dt, Math.max(HELPER_FLEE_SPEED_MULTIPLIER, getHelperSpeedMultiplier("mouse")));
}

function findMouseTarget() {
  const start = getNearestOpenTile(getMouseTile());
  if (!start) return null;

  const resourceTarget = findMouseResourceTarget(start);
  if (resourceTarget) return resourceTarget;

  const reachable = getReachableOpenTiles(start);
  const minerTile = { x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) };
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  let best = null;
  let bestScore = Infinity;

  for (const key of reachable.keys()) {
    const [openXText, openYText] = key.split(",");
    const openTile = { x: Number(openXText), y: Number(openYText) };
    if (isBaseTile(openTile.x, openTile.y)) continue;

    for (const direction of directions) {
      const x = openTile.x + direction.x;
      const y = openTile.y + direction.y;
      const tile = world[y]?.[x];
      if (!tile || tile.unbreakable || !isTileVisible(x, y)) continue;

      const distanceFromMouse = Math.hypot(openTile.x - start.x, openTile.y - start.y);
      const distanceFromMiner = Math.hypot(openTile.x - minerTile.x, openTile.y - minerTile.y);
      const score = distanceFromMouse + distanceFromMiner * 0.18 + Math.random() * 0.5;
      if (score < bestScore) {
        best = { x, y, approach: openTile };
        bestScore = score;
      }
    }
  }

  return best;
}

function findMouseResourceTarget(start) {
  const frontier = [{ x: start.x, y: start.y, cost: 0 }];
  const costs = new Map([[`${start.x},${start.y}`, 0]]);
  const previous = new Map();
  let bestGoal = null;
  let bestGoalScore = Infinity;

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost);
    const current = frontier.shift();
    const currentKey = `${current.x},${current.y}`;
    if (current.cost !== costs.get(currentKey) || current.cost >= bestGoalScore) continue;

    const tile = world[current.y]?.[current.x];
    if (tile?.ore || tile?.relic) {
      const resourceBonus = tile.relic ? 8 : 4;
      const score = current.cost - resourceBonus;
      if (score < bestGoalScore) {
        bestGoal = current;
        bestGoalScore = score;
      }
    }

    for (const neighbor of [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ]) {
      if (neighbor.x < 2 || neighbor.x >= COLS - 2 || neighbor.y < SURFACE_ROWS || neighbor.y >= ROWS) continue;
      const neighborTile = world[neighbor.y]?.[neighbor.x];
      if (neighborTile?.unbreakable) continue;
      if (neighborTile && !isTileVisible(neighbor.x, neighbor.y)) continue;

      const digCost = neighborTile
        ? 3 + clamp(neighborTile.hp / Math.max(1, getMouseDrillDamage()), 0, 12)
        : 1;
      const nextCost = current.cost + digCost;
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (nextCost >= (costs.get(neighborKey) ?? Infinity)) continue;

      costs.set(neighborKey, nextCost);
      previous.set(neighborKey, currentKey);
      frontier.push({ x: neighbor.x, y: neighbor.y, cost: nextCost });
    }
  }

  if (!bestGoal) return null;
  const route = reconstructMouseResourceRoute(previous, start, bestGoal);
  const firstSolidIndex = route.findIndex((step) => !!world[step.y]?.[step.x]);
  if (firstSolidIndex < 0) return null;

  const target = route[firstSolidIndex];
  const approach = firstSolidIndex > 0 ? route[firstSolidIndex - 1] : start;
  return {
    x: target.x,
    y: target.y,
    approach,
    resourceGoal: { x: bestGoal.x, y: bestGoal.y },
  };
}

function reconstructMouseResourceRoute(previous, start, goal) {
  const route = [];
  let key = `${goal.x},${goal.y}`;
  const startKey = `${start.x},${start.y}`;

  while (key !== startKey) {
    const [xText, yText] = key.split(",");
    route.push({ x: Number(xText), y: Number(yText) });
    key = previous.get(key);
    if (!key) return [];
  }

  route.reverse();
  return route;
}

function setMousePathToTile(x, y, mode) {
  if (mouseHelper.mode === mode && mouseHelper.path.length > 0) return;
  const start = getNearestOpenTile(getMouseTile());
  const end = start ? getNearestReachableTile(start, { x, y }) : null;
  mouseHelper.path = start && end ? findOpenPath(start, end) : [];
  mouseHelper.mode = mode;
}

function followMousePath(dt, speedMultiplier = getHelperSpeedMultiplier("mouse")) {
  if (mouseHelper.path.length === 0) return;

  const next = mouseHelper.path[0];
  const x = next.x * TILE + TILE / 2;
  const y = next.y * TILE + TILE / 2;
  moveMouseToward(x, y, dt, speedMultiplier);
  if (Math.hypot(mouseHelper.x - x, mouseHelper.y - y) < 3) mouseHelper.path.shift();
}

function isMouseAtTile(x, y) {
  return Math.floor(mouseHelper.x / TILE) === x && Math.floor(mouseHelper.y / TILE) === y;
}

function getMouseTile() {
  return {
    x: Math.floor(mouseHelper.x / TILE),
    y: Math.floor(mouseHelper.y / TILE),
  };
}

function moveMouseToward(x, y, dt, speedMultiplier = getHelperSpeedMultiplier("mouse")) {
  const dx = x - mouseHelper.x;
  const dy = y - mouseHelper.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const speed = LEVEL_ONE_SPEED * speedMultiplier;
  const step = Math.min(distance, speed * dt);
  mouseHelper.x = clamp(mouseHelper.x + (dx / distance) * step, HELPER_RADIUS, COLS * TILE - HELPER_RADIUS);
  mouseHelper.y = clamp(mouseHelper.y + (dy / distance) * step, HELPER_RADIUS, ROWS * TILE - HELPER_RADIUS);
}

function mouseDrill(x, y) {
  if (mouseHelper.drillCooldown > 0) return;
  const tile = world[y]?.[x];
  if (!tile) {
    mouseHelper.target = null;
    return;
  }
  if (tile.unbreakable) {
    mouseHelper.target = null;
    return;
  }

  mouseHelper.drillCooldown = 0.42;
  tile.hp -= getMouseDrillDamage();
  tile.hitFlash = 0.12;
  if (tile.hp <= 0) {
    breakTile(x, y, tile, true);
    mouseHelper.target = null;
  }
}

function getVisibleMonsterThreat(helper) {
  return monsters.find((monster) => {
    if (monster.dormant) return false;
    const distance = Math.hypot(monster.x - helper.x, monster.y - helper.y);
    return distance <= HELPER_FEAR_RADIUS && hasLineOfSight(helper.x, helper.y, monster.x, monster.y);
  });
}

function hasLineOfSight(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (TILE / 4)));

  for (let i = 1; i < steps; i++) {
    const x = startX + (dx * i) / steps;
    const y = startY + (dy * i) / steps;
    const tileX = Math.floor(x / TILE);
    const tileY = Math.floor(y / TILE);
    if (isSolidTile(tileX, tileY)) return false;
  }

  return true;
}

function getFleeDestination(start, threat) {
  const openStart = getNearestOpenTile(start) ?? start;
  const reachable = getReachableOpenTiles(openStart);
  const threatTile = {
    x: Math.floor(threat.x / TILE),
    y: Math.floor(threat.y / TILE),
  };
  const awayX = openStart.x - threatTile.x;
  const awayY = openStart.y - threatTile.y;
  const awayLength = Math.hypot(awayX, awayY) || 1;
  let best = openStart;
  let bestScore = -Infinity;
  for (const key of reachable.keys()) {
    const [xText, yText] = key.split(",");
    const tile = { x: Number(xText), y: Number(yText) };
    if (isBaseTile(tile.x, tile.y)) continue;
    const path = reconstructPathFromMap(reachable, openStart, tile);
    if (doesPathApproachThreat(path, openStart, threat)) continue;

    const distanceFromThreat = Math.hypot(tile.x * TILE + TILE / 2 - threat.x, tile.y * TILE + TILE / 2 - threat.y);
    const distanceFromStart = Math.hypot(tile.x - openStart.x, tile.y - openStart.y);
    const tileAwayX = tile.x - openStart.x;
    const tileAwayY = tile.y - openStart.y;
    const awayScore = (tileAwayX * awayX + tileAwayY * awayY) / awayLength;
    const score = distanceFromThreat + awayScore * TILE * 2 - distanceFromStart * 2;
    if (score > bestScore) {
      best = tile;
      bestScore = score;
    }
  }

  return best;
}

function nudgeMouseAwayFromThreat(threat, dt) {
  const dx = mouseHelper.x - threat.x;
  const dy = mouseHelper.y - threat.y;
  const distance = Math.hypot(dx, dy) || 1;
  const step = LEVEL_ONE_SPEED * Math.max(HELPER_FLEE_SPEED_MULTIPLIER, getHelperSpeedMultiplier("mouse")) * dt;
  const candidates = [
    {
      x: mouseHelper.x + (dx / distance) * step,
      y: mouseHelper.y + (dy / distance) * step,
    },
    {
      x: mouseHelper.x + (dy / distance) * step,
      y: mouseHelper.y - (dx / distance) * step,
    },
    {
      x: mouseHelper.x - (dy / distance) * step,
      y: mouseHelper.y + (dx / distance) * step,
    },
  ];

  const next = candidates.find((candidate) => !isHelperBlockedAt(candidate.x, candidate.y));
  if (!next) return;
  mouseHelper.x = clamp(next.x, HELPER_RADIUS, COLS * TILE - HELPER_RADIUS);
  mouseHelper.y = clamp(next.y, HELPER_RADIUS, ROWS * TILE - HELPER_RADIUS);
}

function isHelperBlockedAt(x, y) {
  const checks = [
    [x - HELPER_RADIUS, y - HELPER_RADIUS],
    [x + HELPER_RADIUS, y - HELPER_RADIUS],
    [x - HELPER_RADIUS, y + HELPER_RADIUS],
    [x + HELPER_RADIUS, y + HELPER_RADIUS],
  ];

  return checks.some(([px, py]) => {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    return isSolidTile(tx, ty);
  });
}

function doesPathApproachThreat(path, start, threat) {
  if (path.length === 0) return false;
  const currentDistance = Math.hypot(start.x * TILE + TILE / 2 - threat.x, start.y * TILE + TILE / 2 - threat.y);
  const firstSteps = path.slice(0, Math.min(4, path.length));
  return firstSteps.some((tile, index) => {
    const distance = Math.hypot(tile.x * TILE + TILE / 2 - threat.x, tile.y * TILE + TILE / 2 - threat.y);
    return index < 2 && distance < currentDistance - TILE * 0.35;
  });
}

function updateDog(dt) {
  if (!relics.dog.unlocked) return;
  if (!dogHelper.initialized) {
    dogHelper.x = miner.x + 22;
    dogHelper.y = miner.y + 18;
    dogHelper.initialized = true;
  }
  ensureDogInOpenTile();

  const threat = getVisibleMonsterThreat(dogHelper);
  if (threat) {
    dogHelper.target = null;
    const fleeTile = getFleeDestination(getDogTile(), threat);
    setDogPathToTile(fleeTile.x, fleeTile.y, "flee", true);
    followDogPath(dt, Math.max(HELPER_FLEE_SPEED_MULTIPLIER, getHelperSpeedMultiplier("dog")));
    if (dogHelper.carried > 0 && Math.hypot(dogHelper.x - BASE_CENTER_TILE_X * TILE, dogHelper.y - BASE_TILE_Y * TILE) < TILE * 0.75) {
      depositDogCargo();
    }
    return;
  }

  const baseX = BASE_CENTER_TILE_X * TILE;
  const baseY = BASE_TILE_Y * TILE;
  const shouldDeposit = dogHelper.carried >= dogHelper.maxCarry || (dogHelper.carried > 0 && pickups.length === 0);

  if (shouldDeposit) {
    setDogPathToTile(BASE_CENTER_TILE_X, BASE_TILE_Y, "base", true);
    followDogPath(dt);
    if (Math.hypot(dogHelper.x - baseX, dogHelper.y - baseY) < TILE * 0.75) depositDogCargo();
    return;
  }

  if (!dogHelper.target || !pickups.includes(dogHelper.target) || dogHelper.mode !== "pickup") {
    const target = findDogPickup();
    dogHelper.target = target?.pickup ?? null;
    dogHelper.path = target?.path ?? [];
    dogHelper.mode = dogHelper.target ? "pickup" : "idle";
  }

  if (!dogHelper.target) {
    const followTile = getNearestReachableTile(getDogTile(), { x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) });
    if (followTile) setDogPathToTile(followTile.x, followTile.y, "idle");
    followDogPath(dt);
    return;
  }

  followDogPath(dt);
  if (canDogReachPickup(dogHelper.target)) {
    collectDogPickup(dogHelper.target);
    dogHelper.target = null;
    dogHelper.path = [];
    dogHelper.mode = "idle";
  } else if (dogHelper.path.length === 0) {
    dogHelper.target = null;
    dogHelper.mode = "idle";
  }
}

function canDogReachPickup(pickup) {
  const distance = Math.hypot(dogHelper.x - pickup.x, dogHelper.y - pickup.y);
  if (distance < TILE * 0.7) return true;

  const dogTile = getDogTile();
  const pickupTile = { x: Math.floor(pickup.x / TILE), y: Math.floor(pickup.y / TILE) };
  return dogTile.x === pickupTile.x && dogTile.y === pickupTile.y;
}

function findDogPickup() {
  let best = null;
  let bestPath = [];
  let bestLength = Infinity;
  const start = getNearestOpenTile(getDogTile());
  if (!start) return null;
  const reachable = getReachableOpenTiles(start);

  for (const pickup of pickups) {
    if (pickup.type === "idol") continue;
    if (!isPickupVisible(pickup)) continue;
    const end = getNearestReachableTileFromMap(reachable, {
      x: Math.floor(pickup.x / TILE),
      y: Math.floor(pickup.y / TILE),
    });
    if (!end) continue;
    const path = reconstructPathFromMap(reachable, start, end);
    if (path.length > 0 && path.length < bestLength) {
      best = pickup;
      bestPath = path;
      bestLength = path.length;
    }
  }

  return best ? { pickup: best, path: bestPath } : null;
}

function setDogPathToTile(x, y, mode, force = false) {
  if (dogHelper.mode === mode && dogHelper.path.length > 0) return;
  const start = getNearestOpenTile(getDogTile());
  const end = start ? getNearestReachableTile(start, { x, y }) : null;
  dogHelper.path = start && end ? findOpenPath(start, end) : [];
  dogHelper.mode = mode;
  if (force && dogHelper.path.length === 0 && start) {
    dogHelper.x = start.x * TILE + TILE / 2;
    dogHelper.y = start.y * TILE + TILE / 2;
  }
}

function followDogPath(dt, speedMultiplier = getHelperSpeedMultiplier("dog")) {
  if (dogHelper.path.length === 0) return;
  const next = dogHelper.path[0];
  const x = next.x * TILE + TILE / 2;
  const y = next.y * TILE + TILE / 2;
  moveDogToward(x, y, dt, speedMultiplier);
  if (Math.hypot(dogHelper.x - x, dogHelper.y - y) < 3) dogHelper.path.shift();
}

function moveDogToward(x, y, dt, speedMultiplier = getHelperSpeedMultiplier("dog")) {
  const dx = x - dogHelper.x;
  const dy = y - dogHelper.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const speed = LEVEL_ONE_SPEED * speedMultiplier;
  const step = Math.min(distance, speed * dt);
  dogHelper.x += (dx / distance) * step;
  dogHelper.y += (dy / distance) * step;
}

function getDogTile() {
  return {
    x: Math.floor(dogHelper.x / TILE),
    y: Math.floor(dogHelper.y / TILE),
  };
}

function ensureDogInOpenTile() {
  const tile = getDogTile();
  if (isOpenTile(tile.x, tile.y)) return;

  const open = getNearestOpenTile(tile);
  if (!open) return;
  dogHelper.x = open.x * TILE + TILE / 2;
  dogHelper.y = open.y * TILE + TILE / 2;
  dogHelper.path = [];
  dogHelper.mode = "idle";
}

function getNearestOpenTile(origin, maxRadius = 12, predicate = null) {
  if (isOpenTile(origin.x, origin.y) && (!predicate || predicate(origin))) return origin;

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (Math.max(Math.abs(origin.x - x), Math.abs(origin.y - y)) !== radius) continue;
        if (isOpenTile(x, y) && (!predicate || predicate({ x, y }))) return { x, y };
      }
    }
  }

  return null;
}

function getReachableOpenTiles(start) {
  const queue = [start];
  const cameFrom = new Map([[`${start.x},${start.y}`, null]]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (cameFrom.has(key) || !isOpenTile(next.x, next.y)) continue;
      cameFrom.set(key, current);
      queue.push(next);
    }
  }

  return cameFrom;
}

function getNearestReachableTile(start, target, maxRadius = 12) {
  const reachable = getReachableOpenTiles(start);
  return getNearestReachableTileFromMap(reachable, target, maxRadius);
}

function getNearestReachableTileFromMap(reachable, target, maxRadius = 12) {
  const directKey = `${target.x},${target.y}`;
  if (reachable.has(directKey)) return target;

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let y = target.y - radius; y <= target.y + radius; y++) {
      for (let x = target.x - radius; x <= target.x + radius; x++) {
        if (Math.max(Math.abs(target.x - x), Math.abs(target.y - y)) !== radius) continue;
        if (reachable.has(`${x},${y}`)) return { x, y };
      }
    }
  }

  return null;
}

function reconstructPathFromMap(reachable, start, end) {
  const path = [];
  let current = end;
  while (current && !(current.x === start.x && current.y === start.y)) {
    path.unshift(current);
    current = reachable.get(`${current.x},${current.y}`);
  }
  return path;
}

function findOpenPath(start, end) {
  if (!isOpenTile(start.x, start.y) || !isOpenTile(end.x, end.y)) return [];

  const queue = [start];
  const cameFrom = new Map([[`${start.x},${start.y}`, null]]);
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.x === end.x && current.y === end.y) break;

    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = `${next.x},${next.y}`;
      if (cameFrom.has(key) || !isOpenTile(next.x, next.y)) continue;
      cameFrom.set(key, current);
      queue.push(next);
    }
  }

  const endKey = `${end.x},${end.y}`;
  if (!cameFrom.has(endKey)) return [];

  const path = [];
  let current = end;
  while (current && !(current.x === start.x && current.y === start.y)) {
    path.unshift(current);
    current = cameFrom.get(`${current.x},${current.y}`);
  }
  return path;
}

function isOpenTile(x, y) {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS && !isSolidTile(x, y);
}

function isSolidTile(x, y) {
  return x < 0 || y < 0 || x >= COLS || y >= ROWS || !!world[y]?.[x];
}

function collectDogPickup(pickup) {
  if (pickup.type === "idol") return;
  if (dogHelper.carried >= dogHelper.maxCarry) return;
  const index = pickups.indexOf(pickup);
  if (index < 0) return;

  dogHelper.cargo[pickup.type] += 1;
  dogHelper.carried += 1;
  pickups.splice(index, 1);
}

function dropDogCargo() {
  if (dogHelper.carried <= 0) return;

  const dogTile = getDogTile();
  const dropTile = getNearestOpenTile(dogTile) ?? dogTile;
  const tileX = dropTile.x;
  const tileY = dropTile.y;
  let dropped = 0;
  for (const [type, amount] of Object.entries(dogHelper.cargo)) {
    for (let i = 0; i < amount; i++) {
      const offset = getPileOffset(dropped, dogHelper.carried);
      pickups.push({
        type,
        x: tileX * TILE + TILE / 2 + offset.x,
        y: tileY * TILE + TILE - 7 + offset.y,
        rotation: Math.random() * 0.28 - 0.14,
      });
      dropped += 1;
    }
    dogHelper.cargo[type] = 0;
  }
  dogHelper.carried = 0;
}

function depositDogCargo() {
  if (dogHelper.carried <= 0) return;
  for (const [type, amount] of Object.entries(dogHelper.cargo)) {
    resources[type] += amount;
    dogHelper.cargo[type] = 0;
  }
  dogHelper.carried = 0;
  dogHelper.path = [];
  dogHelper.mode = "idle";
  setMessage("Dog delivered resources.");
}

function updateFlares(dt) {
  for (let i = flares.length - 1; i >= 0; i--) {
    const flare = flares[i];
    flare.timeLeft -= dt;
    flare.x = Math.floor(miner.x / TILE);
    flare.y = Math.floor(miner.y / TILE);
    flare.worldX = miner.x;
    flare.worldY = miner.y;
    if (flare.timeLeft <= 0) flares.splice(i, 1);
  }
}

function updateTileEffects(dt) {
  for (const row of world) {
    for (const tile of row) {
      if (tile?.hitFlash) tile.hitFlash = Math.max(0, tile.hitFlash - dt);
    }
  }
}

function updateFeedbackEffects(dt) {
  for (let i = feedbackEffects.length - 1; i >= 0; i--) {
    const effect = feedbackEffects[i];
    effect.life -= dt;
    effect.x += effect.vx * dt;
    effect.y += effect.vy * dt;
    if (effect.life <= 0) feedbackEffects.splice(i, 1);
  }
}

function updateSpecialRoomEffects(dt) {
  for (const room of specialRooms) {
    if (room.kind === "vein" && room.described) updateVeinRoom(room, dt);
    if (room.kind === "monsterSpawner" && room.described) updateMonsterSpawnerRoom(room, dt);
    if (room.kind === "poison") updatePoisonRoomMonsterDamage(room, dt);

    if (!isMinerInRoom(room)) continue;
    describeSpecialRoom(room);
    wakeRoomMonsters(room);

    if (room.kind === "spring") {
      healAtSpring(dt);
    } else if (room.kind === "hullUpgrade") {
      collectHullUpgrade(room);
    } else if (room.kind === "poison") {
      updatePoisonRoom(room);
    } else if (room.kind === "alarm") {
      triggerAlarmRoom(room);
    } else if (room.kind === "teleporter") {
      if (treasureChest.carried) {
        setMessage("The teleporter cannot carry the treasure chest.");
      } else {
        teleportMinerToBase();
      }
    }
  }
}

function describeSpecialRoom(room) {
  if (room.described) return;
  room.described = true;
  if (room.kind === "treasure") markTreasureFound();
  if (!room.description) return;
  showRoomToast(room);
  setMessage(room.kind === "treasure"
    ? `Treasure found at ${formatElapsedTime(treasureChest.foundAt)}.`
    : room.description);
}

function showRoomToast(room) {
  const toast = document.querySelector("#roomToast");
  if (!toast) return;
  hideRelicToast();

  document.querySelector("#roomToastKicker").textContent = "Special room";
  document.querySelector("#roomToastTitle").textContent = room.title ?? getRoomTitle(room);
  const foundTime = room.kind === "treasure" ? ` Found at ${formatElapsedTime(treasureChest.foundAt)}.` : "";
  document.querySelector("#roomToastDescription").textContent = `${room.description}${foundTime}`;

  toast.hidden = false;
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");

  window.clearTimeout(roomToastTimer);
  roomToastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove("is-visible");
  }, 4200);
}

function hideRoomToast() {
  const toast = document.querySelector("#roomToast");
  if (!toast) return;
  window.clearTimeout(roomToastTimer);
  toast.hidden = true;
  toast.classList.remove("is-visible");
}

function getRoomTitle(room) {
  if (room.kind === "spring") return "Healing Spring";
  if (room.kind === "hullUpgrade") return "Hull Reinforcement";
  if (room.kind === "poison") return "Poison Gas";
  if (room.kind === "vein") return room.title || "Resource Vein";
  if (room.kind === "monsterSpawner") return "Monster Spawn";
  if (room.kind === "alarm") return "Warning System";
  if (room.kind === "idol") return "Idol Room";
  if (room.kind === "teleporter") return "Teleporter";
  if (room.kind === "monster") return "Monster Room";
  if (room.kind === "treasure") return "Treasure Room";
  return "Hidden Room";
}

function updateVeinRoom(room, dt) {
  room.spawnTimer += dt;
  if (room.spawnTimer < VEIN_ROOM_SPAWN_INTERVAL) return;

  room.spawnTimer = 0;
  dropRoomResource(room.resource ?? "gold", room.x, room.y);
  setMessage(`${getResourceName(room.resource ?? "gold")} formed in the vein room.`);
}

function updateMonsterSpawnerRoom(room, dt) {
  room.spawnTimer += dt;
  if (room.spawnTimer < monsterSpawnInterval) return;

  room.spawnTimer = 0;
  spawnRoomMonsterIn(room, getMonsterSpawnLevel());
  setMessage("The spawn room called another monster.");
}

function triggerAlarmRoom(room) {
  if (room.used) return;
  room.used = true;
  for (let i = 0; i < 5; i++) spawnMonster(Math.min(7, getMonsterSpawnLevel() + 1), { ignoreLimit: true });
  setMessage("Alarm triggered. Stronger monsters heard the call.");
}

function updatePoisonRoomMonsterDamage(room, dt) {
  room.poisonTimer += dt;
  if (room.poisonTimer < POISON_ROOM_MONSTER_TICK_INTERVAL) return;

  room.poisonTimer = 0;
  for (const monster of [...monsters]) {
    if (monster.dormant || !isMonsterInRoom(monster, room)) continue;
    damageMonster(monster, POISON_ROOM_MONSTER_DAMAGE);
  }
}

function isMonsterInRoom(monster, room) {
  const tileX = Math.floor(monster.x / TILE);
  const tileY = Math.floor(monster.y / TILE);
  return tileX >= room.startX && tileX < room.startX + room.width && tileY >= room.startY && tileY < room.startY + room.height;
}

function teleportMinerToBase() {
  miner.x = BASE_CENTER_TILE_X * TILE;
  miner.y = BASE_TILE_Y * TILE;
  miner.vx = 0;
  miner.vy = 0;
  showTeleportActivationToast();
  setMessage("Teleporter snapped you back to base.");
  updateCamera();
}

function showTeleportActivationToast() {
  const toast = document.querySelector("#roomToast");
  if (!toast) return;
  hideRelicToast();

  document.querySelector("#roomToastKicker").textContent = "Teleporter activated";
  document.querySelector("#roomToastTitle").textContent = "Returned to Base";
  document.querySelector("#roomToastDescription").textContent = "The ancient teleporter snapped you safely back to the landing pad.";

  toast.hidden = false;
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");

  window.clearTimeout(roomToastTimer);
  roomToastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove("is-visible");
  }, 3200);
}

function wakeRoomMonsters(room) {
  const waking = monsters.filter((monster) => monster.dormant && monster.roomLabel === room.label);
  if (waking.length === 0) return;

  for (const monster of waking) {
    monster.dormant = false;
    monster.repathTimer = 0;
    monster.attackCooldown = 0.35;
  }
  setMessage(`${room.contents || "Room"} awakened.`);
}

function isMinerInRoom(room) {
  const tileX = Math.floor(miner.x / TILE);
  const tileY = Math.floor(miner.y / TILE);
  return tileX >= room.startX && tileX < room.startX + room.width && tileY >= room.startY && tileY < room.startY + room.height;
}

function healAtSpring(dt) {
  if (miner.health >= miner.maxHealth) return;
  const previousHealth = miner.health;
  miner.health = Math.min(miner.maxHealth, miner.health + miner.maxHealth * HEALING_SPRING_RATE * dt);
  if (miner.health > previousHealth) spawnHealingFeedback(dt);
}

function collectHullUpgrade(room) {
  if (room.used) return;

  const previousMaxHealth = miner.maxHealth;
  const roomBonus = Math.max(HULL_UPGRADE_ROOM_MIN_BONUS, Math.ceil(previousMaxHealth * HULL_UPGRADE_ROOM_BONUS_PERCENT));
  miner.maxHealth += roomBonus;
  miner.health = Math.min(miner.maxHealth, miner.health + roomBonus);
  room.used = true;
  setMessage(`The alien gel hardened the hull. Maximum integrity increased by ${Math.round(miner.maxHealth - previousMaxHealth)}.`);
  updateHud();
}

function updatePoisonRoom(room) {
  if (miner.poisoned) return;
  miner.poisoned = true;
  miner.poisonTimer = 0;
  setMessage("Poison exposure: lose 1 hull every 10 seconds.");
}

function updatePoisonEffect(dt) {
  if (!miner.poisoned) return;
  miner.poisonTimer += dt;
  if (miner.poisonTimer < POISON_ROOM_TICK_INTERVAL) return;

  miner.poisonTimer -= POISON_ROOM_TICK_INTERVAL;
  miner.health = Math.max(0, miner.health - POISON_ROOM_HULL_DAMAGE);
  spawnPoisonStrike();
  playPoisonDamageSound();
  if (miner.health <= 0) {
    setMessage("Poison breached the hull.");
    triggerGameOver();
    return;
  }
  setMessage("Poison dealt 1 hull damage.");
}

function updateLowHullWarning(dt) {
  hullHitFlashTimer = Math.max(0, hullHitFlashTimer - dt);
  lowHullFlashTimer = Math.max(0, lowHullFlashTimer - dt);
  if (!gameStarted || gameOver || gameWon || miner.health <= 0) {
    lowHullWarningTimer = 0;
    return;
  }

  const hullRatio = miner.health / miner.maxHealth;
  if (hullRatio > LOW_HULL_WARNING_THRESHOLD) {
    lowHullWarningTimer = 0;
    lowHullFlashTimer = 0;
    return;
  }

  lowHullWarningTimer -= dt;
  if (lowHullWarningTimer > 0) return;

  lowHullWarningTimer = LOW_HULL_WARNING_INTERVAL;
  lowHullFlashTimer = LOW_HULL_WARNING_DURATION;
}

function triggerHullHitFlash() {
  hullHitFlashTimer = HULL_HIT_FLASH_DURATION;
}

function moveMiner(dx, dy, dt) {
  const nextX = clamp(miner.x + dx, miner.radius, COLS * TILE - miner.radius);
  const nextY = clamp(miner.y + dy, miner.radius, ROWS * TILE - miner.radius);
  const currentMonster = findMonsterAt(miner.x, miner.y, miner.radius);
  const monster = findMonsterAt(nextX, nextY, miner.radius);
  if (monster) {
    if (isDrillingTowardMonster(monster, dx, dy)) {
      drillMonster(monster);
      applyDrillBounce(dx, dy);
    } else if (monster === currentMonster && isMovingAwayFromMonster(monster, dx, dy) && !findCollision(nextX, nextY)) {
      miner.x = nextX;
      miner.y = nextY;
      separateMinerFromMonster(monster);
    } else if (trySlideAroundMonster(monster, nextX, nextY, dx, dy)) {
      separateMinerFromMonster(monster);
    } else {
      separateMinerFromMonster(monster);
    }
    return;
  }
  const hit = findCollision(nextX, nextY);

  if (!hit) {
    miner.x = nextX;
    miner.y = nextY;
    return;
  }

  const drillResult = drill(hit.x, hit.y);
  if (drillResult === "broke") {
    moveIfOpen(nextX, nextY);
    return;
  }
  if (drillResult === "hit") {
    miner.health = Math.max(0, miner.health - 0.35);
    applyDrillBounce(dx, dy);
  }
  if (drillResult === "blocked") {
    slideAlongBlock(nextX, nextY, dx, dy);
    return;
  }
  slideAlongBlock(nextX, nextY, dx, dy);
}

function applyDrillBounce(dx, dy) {
  const force = Math.hypot(dx, dy);
  if (force <= 0) return;

  const bounce = 6;
  const bounceX = clamp(miner.x - (dx / force) * bounce, miner.radius, COLS * TILE - miner.radius);
  const bounceY = clamp(miner.y - (dy / force) * bounce, miner.radius, ROWS * TILE - miner.radius);
  moveIfOpen(bounceX, bounceY) || moveIfOpen(bounceX, miner.y) || moveIfOpen(miner.x, bounceY);
}

function slideAlongBlock(nextX, nextY, dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    moveIfOpen(miner.x, nextY);
  } else {
    moveIfOpen(nextX, miner.y);
  }
}

function moveIfOpen(x, y) {
  if (findCollision(x, y)) return false;
  miner.x = x;
  miner.y = y;
  return true;
}

function moveMinerWithSweptCollision(dx, dy) {
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) return false;

  const steps = Math.max(1, Math.ceil(distance / 2));
  const stepX = dx / steps;
  const stepY = dy / steps;
  let moved = false;

  for (let i = 0; i < steps; i++) {
    const nextX = clamp(miner.x + stepX, miner.radius, COLS * TILE - miner.radius);
    const nextY = clamp(miner.y + stepY, miner.radius, ROWS * TILE - miner.radius);
    if (moveIfOpen(nextX, nextY)) {
      moved = true;
      continue;
    }

    const movedX = stepX !== 0 && moveIfOpen(nextX, miner.y);
    const movedY = stepY !== 0 && moveIfOpen(miner.x, nextY);
    if (!movedX && !movedY) break;
    moved = true;
  }

  return moved;
}

function trySlideAroundMonster(monster, nextX, nextY, dx, dy) {
  if (findCollision(nextX, nextY)) return false;

  const candidates = [
    { x: nextX, y: miner.y },
    { x: miner.x, y: nextY },
  ];

  for (const candidate of candidates) {
    if (findCollision(candidate.x, candidate.y)) continue;
    const candidateMonster = findMonsterAt(candidate.x, candidate.y, miner.radius);
    if (candidateMonster && candidateMonster !== monster) continue;
    if (candidateMonster === monster && !isMovingAwayFromMonster(monster, candidate.x - miner.x, candidate.y - miner.y)) continue;
    miner.x = candidate.x;
    miner.y = candidate.y;
    return true;
  }

  const force = Math.hypot(dx, dy) || 1;
  const perpX = -dy / force;
  const perpY = dx / force;
  const slideDistance = Math.max(8, Math.min(16, force));
  return (
    moveIfOpen(miner.x + perpX * slideDistance, miner.y + perpY * slideDistance) ||
    moveIfOpen(miner.x - perpX * slideDistance, miner.y - perpY * slideDistance)
  );
}

function drillMonster(monster) {
  if (miner.drillCooldown > 0 || miner.health <= 0) return;
  miner.drillCooldown = 0.42;
  miner.health = Math.max(0, miner.health - DRILL_MONSTER_HULL_DAMAGE);
  damageMonster(monster, miner.power * getDamageMultiplier(), { source: "drill" });
  if (miner.health <= 0) triggerGameOver();
}

function isDrillingTowardMonster(monster, dx, dy) {
  const inputForce = Math.hypot(dx, dy);
  if (inputForce <= 0) return false;

  const toMonsterX = monster.x - miner.x;
  const toMonsterY = monster.y - miner.y;
  const monsterDistance = Math.hypot(toMonsterX, toMonsterY);
  if (monsterDistance <= 0) return false;

  const moveX = dx / inputForce;
  const moveY = dy / inputForce;
  const targetX = toMonsterX / monsterDistance;
  const targetY = toMonsterY / monsterDistance;
  return moveX * targetX + moveY * targetY > 0.72;
}

function isMovingAwayFromMonster(monster, dx, dy) {
  const inputForce = Math.hypot(dx, dy);
  if (inputForce <= 0) return false;

  const awayX = miner.x - monster.x;
  const awayY = miner.y - monster.y;
  const awayLength = Math.hypot(awayX, awayY) || 1;
  return (dx / inputForce) * (awayX / awayLength) + (dy / inputForce) * (awayY / awayLength) > 0.12;
}

function separateMinerFromMonster(monster) {
  return pushMinerOutOfMonster(monster) || relocateMinerOutOfMonster(monster);
}

function pushMinerOutOfMonster(monster) {
  const dx = miner.x - monster.x;
  const dy = miner.y - monster.y;
  const distance = Math.hypot(dx, dy) || 1;
  const targetDistance = miner.radius + monster.radius + 2;
  if (distance >= targetDistance) return true;

  const push = targetDistance - distance;
  return moveMinerWithSweptCollision(
    (dx / distance) * push,
    (dy / distance) * push,
  );
}

function relocateMinerOutOfMonster(monster) {
  const monsterTile = getMonsterTile(monster);
  const escapeTile = getNearestOpenTile({ x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) }, 3, (tile) => {
    return Math.hypot(tile.x - monsterTile.x, tile.y - monsterTile.y) >= 1.5;
  });
  if (!escapeTile) return false;

  miner.x = escapeTile.x * TILE + TILE / 2;
  miner.y = escapeTile.y * TILE + TILE / 2;
  return true;
}

function findMonsterAt(x, y, radius = 0) {
  return monsters.find((monster) => !monster.dormant && Math.hypot(monster.x - x, monster.y - y) <= monster.radius + radius);
}

function damageTile(x, y, amount, flash = 0.18, quiet = false) {
  const tile = world[y]?.[x];
  if (!tile) return false;
  if (tile.unbreakable) {
    tile.hitFlash = flash;
    if (!quiet) setMessage("Unbreakable formation.");
    return false;
  }

  tile.hp -= amount;
  tile.hitFlash = flash;
  if (tile.hp <= 0) {
    breakTile(x, y, tile, quiet);
    return true;
  }
  return false;
}

function damageMonster(monster, amount, options = {}) {
  monster.hp -= amount;
  if ((monster.hitFlashCooldown ?? 0) <= 0) {
    monster.hitFlash = MONSTER_HIT_FLASH_DURATION;
    monster.hitFlashCooldown = MONSTER_HIT_FLASH_INTERVAL;
  }
  healFromAlienGel();
  if (monster.hp <= 0) {
    playMonsterDeathScreamSound(monster);
    const index = monsters.indexOf(monster);
    if (index >= 0) monsters.splice(index, 1);
    dropMonsterLoot(monster);
    setMessage(monster.level >= 8
      ? "Abyss Tyrant defeated. 3 Alien Carapaces dropped."
      : "Monster defeated.");
    return true;
  }
  return false;
}

function healFromAlienGel() {
  if (!relics.alienGelRegenerator.unlocked) return;
  miner.health = Math.min(miner.maxHealth, miner.health + getAlienGelHealAmount());
}

function dropMonsterLoot(monster) {
  if (monster.loot === "none") return;
  const tileX = Math.floor(monster.x / TILE);
  const tileY = Math.floor(monster.y / TILE);
  dropResource(monster.loot ?? "alienCarapace", tileX, tileY, monster.lootAmount ?? 1);
}

function findCollision(x, y) {
  const checks = [
    [x - miner.radius, y - miner.radius],
    [x + miner.radius, y - miner.radius],
    [x - miner.radius, y + miner.radius],
    [x + miner.radius, y + miner.radius],
  ];

  for (const [px, py] of checks) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (world[ty]?.[tx]) return { x: tx, y: ty };
  }
  return null;
}

function drill(x, y) {
  const tile = world[y]?.[x];
  if (!tile) return false;
  if (miner.drillCooldown > 0) return false;
  if (miner.health <= 0) {
    setMessage("Hull is fully damaged. Return to base for repairs.");
    return false;
  }
  if (tile.unbreakable) {
    tile.hitFlash = 0.2;
    playClinkSound();
    return "blocked";
  }

  miner.drillCooldown = 0.42;
  tile.hp -= miner.power * getDamageMultiplier();
  tile.hitFlash = 0.2;
  if (tile.hp > 0) {
    playDigSound("hit");
    return "hit";
  }

  breakTile(x, y, tile);
  playDigSound("break");
  return "broke";
}

function breakTile(x, y, tile, quiet = false) {
  world[y][x] = null;
  revealAround(x, y, getOpenRevealRadius());
  if (tile.relic) {
    unlockRandomRelic();
  } else if (tile.ore) {
    dropResource(tile.ore.type, x, y, tile.ore.yield);
  } else if (!quiet) {
    setMessage("Dirt cleared.");
  }
}

function unlockRandomRelic() {
  const relicTypes = Object.keys(relicDefs).filter((type) => !relics[type].unlocked);
  if (relicTypes.length === 0) {
    setMessage("Relic cache empty.");
    return;
  }
  const type = relicTypes[Math.floor(Math.random() * relicTypes.length)];
  unlockRelic(type);
}

function unlockRelic(type) {
  const relic = relics[type];
  relic.unlocked = true;
  relic.cooldown = 0;
  if (type === "mouse") resetMouseHelper();
  if (type === "dog") {
    dogHelper.maxHealth = getHelperMaxHealth("dog");
    dogHelper.maxCarry = getDogCarryCapacity();
    resetDogHelper();
  }
  if (type === "thirdEye") expandExistingReveals();
  if (type === "laserSword") {
    relic.swings = getLaserSwordMaxSwings();
    relic.recharge = 0;
  }
  if (type === "grenades") {
    relic.charges = getGrenadeMaxCharges();
    relic.recharge = 0;
  }
  if (type === "soundDistorter") delayMonsterWave(getSoundDistorterDelay());
  if (type === "alienCarapaceIntegrator") applyCarapaceIntegratorDelta(0, relic.level);
  setMessage(`Ancient Relic "${relicDefs[type].label}" found!`);
  showRelicToast(type);
}

function dropResource(type, tileX, tileY, amount = 1) {
  for (let i = 0; i < amount; i++) {
    const offset = getPileOffset(i, amount);
    pickups.push({
      type,
      x: tileX * TILE + TILE / 2 + offset.x,
      y: tileY * TILE + TILE - 7 + offset.y,
      rotation: Math.random() * 0.28 - 0.14,
    });
  }
  setMessage(`${amount} ${type} dropped.`);
}

function getPileOffset(index, amount) {
  if (amount <= 1) return { x: 0, y: 0 };
  const spacing = 7;
  const centeredIndex = index - (amount - 1) / 2;
  return {
    x: centeredIndex * spacing,
    y: Math.abs(centeredIndex) % 2 === 0 ? 0 : 2,
  };
}

function collectPickups() {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];
    if (!isPickupVisible(pickup)) continue;
    const distance = Math.hypot(miner.x - pickup.x, miner.y - pickup.y);
    if (distance > miner.radius + 12) continue;

    if (pickup.type === "idol") {
      collectIdolStatue(pickup, i);
      continue;
    }

    if (carried >= miner.capacity) {
      setMessage("Cargo full. Resources will wait here.");
      continue;
    }

    cargo[pickup.type] += 1;
    carried += 1;
    pickups.splice(i, 1);
    setMessage(`Picked up ${getResourceName(pickup.type)}.`);
  }
}

function collectIdolStatue(pickup, index) {
  if (idolStatue.carried || idolStatue.delivered) return;
  pickups.splice(index, 1);
  idolStatue.carried = true;
  miner.health = Math.max(0, miner.health - IDOL_BOULDER_DAMAGE);
  triggerHullHitFlash();
  setMessage("You took the idol. A boulder rushed toward the pedestal and slammed the hull.");
  if (miner.health <= 0) triggerGameOver();
}

function updateTreasureChest(dt) {
  maybeShowTreasureInstructions();
  if (!treasureChest.placed || treasureChest.delivered || !treasureChest.carried) return;

  const facingLength = Math.hypot(miner.facingX, miner.facingY) || 1;
  const behindX = miner.x - (miner.facingX / facingLength) * 30;
  const behindY = miner.y - (miner.facingY / facingLength) * 30 + 6;
  const dx = behindX - treasureChest.x;
  const dy = behindY - treasureChest.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const step = Math.min(distance, Math.max(90, miner.speed * 1.15) * dt);
  treasureChest.x += (dx / distance) * step;
  treasureChest.y += (dy / distance) * step;
}

function maybeShowTreasureInstructions() {
  if (
    !treasureChest.placed ||
    treasureChest.delivered ||
    treasureChest.instructionsShown ||
    treasureChest.instructionsDismissed ||
    !isTreasureRoomDiscovered() ||
    !isTileVisible(treasureChest.tileX, treasureChest.tileY)
  ) {
    return;
  }

  const minerTileX = Math.floor(miner.x / TILE);
  const minerTileY = Math.floor(miner.y / TILE);
  const inRoomZ = Math.abs(minerTileX - treasureChest.tileX) <= 2 && Math.abs(minerTileY - treasureChest.tileY) <= 2;
  if (!inRoomZ) return;

  markTreasureFound();
  treasureChest.instructionsShown = true;
  const foundTime = document.querySelector("#treasureFoundTime");
  if (foundTime) foundTime.textContent = `Treasure found at ${formatElapsedTime(treasureChest.foundAt)}.`;
  document.querySelector("#treasureBubble").hidden = false;
}

function markTreasureFound() {
  if (treasureChest.foundAt === null) treasureChest.foundAt = elapsedTime;
}

function hideTreasureInstructions(dismiss = false) {
  const bubble = document.querySelector("#treasureBubble");
  if (bubble) bubble.hidden = true;
  if (dismiss) treasureChest.instructionsDismissed = true;
}

function tryPickupTreasure() {
  if (!canPickupTreasure()) return false;
  treasureChest.carried = true;
  treasureChest.hover = false;
  hideTreasureInstructions();
  setMessage("Treasure chest secured. Drag it back to base!");
  return true;
}

function dropTreasure() {
  if (!treasureChest.carried || treasureChest.delivered) return false;
  releaseTreasureAt(miner.x - miner.facingX * 22, miner.y - miner.facingY * 22 + 8);
  setMessage("Treasure chest dropped.");
  return true;
}

function releaseTreasureAt(x, y) {
  treasureChest.carried = false;
  treasureChest.x = clamp(x, 0, COLS * TILE - 1);
  treasureChest.y = clamp(y, 0, ROWS * TILE - 1);
  treasureChest.tileX = clamp(Math.floor(treasureChest.x / TILE), 0, COLS - 1);
  treasureChest.tileY = clamp(Math.floor(treasureChest.y / TILE), 0, ROWS - 1);
  treasureChest.hover = false;
}

function toggleTreasureCarry() {
  return treasureChest.carried ? dropTreasure() : tryPickupTreasure();
}

function canPickupTreasure() {
  if (!treasureChest.placed || treasureChest.carried || treasureChest.delivered) return false;
  if (!isTreasureRoomDiscovered()) return false;
  if (!isTileVisible(treasureChest.tileX, treasureChest.tileY)) return false;
  return Math.hypot(miner.x - treasureChest.x, miner.y - treasureChest.y) <= TILE * 1.25;
}

function updateTreasureHover(event) {
  if (!treasureChest.placed || treasureChest.carried || treasureChest.delivered) {
    treasureChest.hover = false;
    canvas.style.cursor = "";
    return;
  }

  const point = getCanvasWorldPoint(event);
  treasureChest.hover = isTreasurePoint(point.x, point.y) && canPickupTreasure();
  canvas.style.cursor = treasureChest.hover ? "pointer" : "";
}

function isTreasurePoint(x, y) {
  return Math.abs(x - treasureChest.x) <= 15 && Math.abs(y - treasureChest.y) <= 12;
}

function getCanvasWorldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = getCameraScale();
  return {
    x: (event.clientX - rect.left) / scale + camera.x,
    y: (event.clientY - rect.top) / scale + camera.y,
  };
}

function handleBase(dt) {
  if (!isMinerAtBase()) return;

  if (treasureChest.carried && !treasureChest.delivered) {
    triggerWin();
    return;
  }

  if (idolStatue.carried && !idolStatue.delivered) {
    idolStatue.carried = false;
    idolStatue.delivered = true;
    resources.gold += 5;
    resources.diamond += 5;
    setMessage("Idol secured. Gained 5 Gold and 5 Diamond.");
  }

  if (carried > 0) {
    const secured = carried;
    for (const [type, amount] of Object.entries(cargo)) {
      resources[type] += amount;
      cargo[type] = 0;
    }
    carried = 0;
    setMessage(`Secured ${secured} resources in storage.`);
  }

  if (miner.health < miner.maxHealth) {
    miner.health = Math.min(miner.maxHealth, miner.health + miner.maxHealth * 0.02 * dt);
  }
}

function isMinerAtBase() {
  return miner.y < SURFACE_ROWS * TILE && miner.x > BASE_MIN_TILE_X * TILE && miner.x < (BASE_MAX_TILE_X + 1) * TILE;
}

function buyUpgrade(type) {
  if (!canInstallUpgrades()) {
    setMessage("Return to base to install upgrades.");
    return;
  }
  if (miner.upgrades[type] >= MAX_UPGRADE_LEVEL) {
    setMessage(`${upgradeDefs[type].label} is already max level.`);
    return;
  }

  const recipe = getUpgradeRecipe(type);
  if (!canAfford(recipe)) {
    setMessage(`Need ${formatRecipe(recipe)} for ${upgradeDefs[type].label}.`);
    return;
  }

  spendResources(recipe);
  applyUpgrade(type);
  increaseMaxHullFromUpgrade();
  setMessage(`${upgradeDefs[type].label} upgraded.`);
  updateHud();
}

function canInstallUpgrades() {
  return isMinerAtBase() || relics.ansible.unlocked;
}

function applyUpgrade(type) {
  if (miner.upgrades[type] >= MAX_UPGRADE_LEVEL) return;
  const nextLevel = miner.upgrades[type] + 1;
  miner.upgrades[type] = nextLevel;
  if (type === "power") miner.power += getDrillPowerUpgradeAmount(nextLevel);
  if (type === "speed") miner.speed += getThrusterSpeedUpgradeAmount(nextLevel);
  if (type === "capacity") miner.capacity += 3;
}

function getDrillPowerUpgradeAmount(level) {
  return level >= 10 ? 2 : 1;
}

function getThrusterSpeedUpgradeAmount(level) {
  if (level === 1) return 24;
  if (level <= 4) return 8;
  if (level <= 8) return 6;
  if (level <= 12) return 4;
  return 3;
}

function increaseMaxHullFromUpgrade() {
  miner.maxHealth += HULL_MAX_PER_UPGRADE;
  miner.health = Math.min(miner.maxHealth, miner.health + HULL_REPAIR_PER_UPGRADE);
}

function activateRelic(type) {
  const relic = relics[type];
  const definition = relicDefs[type];
  const duration = getRelicDuration(type);
  const cooldown = getRelicCooldown(type);
  if (!relic.unlocked) {
    setMessage(`${definition.label} is still buried.`);
    return;
  }
  if (type === "blaster") {
    setMessage("Hold Space to fire the blaster.");
    return;
  }
  if (type === "mouse") {
    setMessage("Mouse is already digging on its own.");
    return;
  }
  if (type === "dog") {
    setMessage("Dog is already gathering resources.");
    return;
  }
  if (type === "thirdEye") {
    setMessage("3rd Eye permanently improves open-area reveal.");
    return;
  }
  if (type === "laserSword") {
    swingLaserSword();
    return;
  }
  if (type === "converter") {
    activateConverter();
    return;
  }
  if (type === "grenades") {
    throwGrenade();
    return;
  }
  if (type === "soundDistorter") {
    setMessage(`Sound Distorter delays waves by ${getSoundDistorterDelay()} seconds.`);
    return;
  }
  if (type === "alienCarapaceIntegrator") {
    setMessage(`Alien Carapace Integrator adds ${getCarapaceIntegratorHullBonus()} max hull.`);
    return;
  }
  if (type === "alienGelRegenerator") {
    setMessage(`Alien Gel Regenerator heals ${getAlienGelHealAmount()} HP when damaging monsters.`);
    return;
  }
  if (relic.active > 0) {
    setMessage(`${definition.label} is already active.`);
    return;
  }
  if (relic.cooldown > 0) {
    setMessage(`${definition.label} is cooling down.`);
    return;
  }

  if (type === "flare" && !canPlaceRelicFlare()) return;

  if (type === "bomb") {
    detonateBomb();
  } else if (type === "rocket") {
    fireRocket();
  } else {
    relic.active = duration;
  }
  relic.cooldown = cooldown;
  if (type === "flare") placeRelicFlare(duration, getFlareRadius());
  if (type === "radiation") relic.tick = 0;
  setMessage(`${definition.label} activated.`);
}

function upgradeRelic(type) {
  const relic = relics[type];
  if (!relic.unlocked) {
    setMessage(`${relicDefs[type].label} is still buried.`);
    return;
  }
  const maxLevel = getRelicMaxLevel(type);
  if (relic.level >= maxLevel) {
    setMessage(`${relicDefs[type].label} is already max level.`);
    return;
  }
  if (!isMinerAtBase() && !relics.ansible.unlocked) {
    setMessage("Return to base to upgrade relics.");
    return;
  }

  const cost = getRelicUpgradeCost(type);
  if (resources.alienCarapace < cost.alienCarapace) {
    setMessage(`Need ${formatRecipe(cost)} to upgrade ${relicDefs[type].label}.`);
    return;
  }

  resources.alienCarapace -= cost.alienCarapace;
  const previousMaxHealth = getHelperMaxHealth(type);
  const previousLevel = relic.level;
  relic.level += 1;
  applyRelicUpgradeEffects(type, previousMaxHealth, previousLevel);
  setMessage(`${relicDefs[type].label} relic upgraded to Lv ${relic.level}.`);
  updateHud();
}

function getRelicUpgradeCost(type) {
  if (relics[type].level >= getRelicMaxLevel(type)) return {};
  return {
    alienCarapace: Math.min(4, relics[type].level),
  };
}

const relicUpgradeDescriptions = {
  impact: ["Lasts +15s", "Damage x6", "Cooldown -30s"],
  speed: ["Lasts +15s", "Speed x3", "Cooldown -30s"],
  flare: ["Radius +2 tiles", "Radius +1 tile, lasts +20s", "Radius +2 tiles, cooldown -30s"],
  blaster: ["Monster damage +2, block damage +1", "Monster damage +3, block damage +1", "Monster damage +5, block damage +1"],
  bomb: ["Damage scales harder", "Radius +3 tiles, more damage", "Cooldown -30s, strongest damage scaling"],
  mouse: ["Dig 1.13, speed 0.3x, HP 33", "Dig 1.88, speed 0.4x, HP 43", "Dig 3.38, speed 0.7x, HP 58"],
  dog: ["Cargo 10, speed 0.7x, HP 45", "Cargo 16, speed 1x, HP 70", "Cargo 25, speed 1.35x, HP 100"],
  radiation: ["Lasts +10s", "Damage up", "Damage up, +10s, safe companions, cooldown -30s"],
  rocket: ["Damage x2", "Radius +3 tiles", "Cooldown -30s"],
  magnet: ["Radius +2 tiles", "Lasts +25s", "Cooldown -30s"],
  thirdEye: ["3x3 reveal radius", "4x4 reveal radius", "5x5 reveal radius"],
  laserSword: ["Damage +4", "Capacity +5 swings", "Recharge keeps filling one swing every 35s"],
  converter: ["Output +2 per unlocked resource, adds Silver", "Output +2 per unlocked resource, adds Gold", "Output +2 per unlocked resource, cooldown -30s"],
  ansible: ["No upgrade", "No upgrade", "No upgrade"],
  grenades: ["+1 grenade, damage 4.5x", "+1 grenade, damage 5x", "Capacity 8, damage 5.5x, larger blast radius"],
  soundDistorter: ["Delays wave by 10 more seconds", "Delays wave by 10 more seconds", "Delays wave by 20 seconds"],
  alienCarapaceIntegrator: ["Add 20 more", "Add 20 more", "Add 25 more"],
  alienGelRegenerator: ["Heal +2 HP more", "Heal +2 HP more", "Heal +4 HP more"],
  godVisage: ["Repelled for 3 more sec", "Repelled for 3 more sec", "Monsters actively run when in your line of sight"],
  relicSeeker: ["+10s duration", "+10s duration", "Permanently flashes relics onscreen"],
};

function getRelicUpgradeDescription(type) {
  if (getRelicMaxLevel(type) <= 1 || relics[type].level >= getRelicMaxLevel(type)) return "Max level";
  return relicUpgradeDescriptions[type]?.[relics[type].level - 1] ?? "Upgrade";
}

function getRelicMaxLevel(type) {
  return type === "ansible" ? 1 : MAX_RELIC_LEVEL;
}

function getDamageMultiplier() {
  if (relics.impact.active <= 0) return 1;
  return relics.impact.level >= 3 ? 6 : 3;
}

function getSpeedMultiplier() {
  if (relics.speed.active <= 0) return 1;
  return relics.speed.level >= 3 ? 3 : 2;
}

function getRelicDuration(type) {
  const level = relics[type].level;
  if (type === "impact") return relicDefs.impact.duration + (level >= 2 ? 15 : 0);
  if (type === "speed") return relicDefs.speed.duration + (level >= 2 ? 15 : 0);
  if (type === "flare") return relicDefs.flare.duration + (level >= 3 ? 20 : 0);
  if (type === "radiation") return relicDefs.radiation.duration + (level >= 2 ? 10 : 0) + (level >= 4 ? 10 : 0);
  if (type === "magnet") return relicDefs.magnet.duration + (level >= 3 ? 25 : 0);
  if (type === "godVisage") return relicDefs.godVisage.duration + (level >= 2 ? 3 : 0) + (level >= 3 ? 3 : 0);
  if (type === "relicSeeker") return relicDefs.relicSeeker.duration + (level >= 2 ? 10 : 0) + (level >= 3 ? 10 : 0);
  return relicDefs[type].duration ?? 0;
}

function getRelicCooldown(type) {
  const base = relicDefs[type].cooldown ?? 0;
  if (!base) return 0;
  const level = relics[type].level;
  return level >= 4 ? Math.max(0, base - 30) : base;
}

function getOpenRevealRadius() {
  if (!relics.thirdEye.unlocked) return OPEN_VISIBILITY_RADIUS;
  return OPEN_VISIBILITY_RADIUS + relics.thirdEye.level;
}

function getFlareRadius() {
  return FLARE_VISIBILITY_RADIUS + (relics.flare.level >= 2 ? 2 : 0) + (relics.flare.level >= 3 ? 1 : 0) + (relics.flare.level >= 4 ? 2 : 0);
}

function getBlasterDamageBonus() {
  if (relics.blaster.level >= 4) return 10;
  if (relics.blaster.level >= 3) return 5;
  if (relics.blaster.level >= 2) return 2;
  return 0;
}

function getBlasterBlockDamageBonus() {
  if (relics.blaster.level >= 4) return 3;
  if (relics.blaster.level >= 3) return 2;
  if (relics.blaster.level >= 2) return 1;
  return 0;
}

function getBombRadius() {
  return 3 + (relics.bomb.level >= 3 ? 3 : 0);
}

function getBombDamage() {
  const level = relics.bomb.level;
  const powerScale = 7 + level;
  const flatBonus = Math.max(0, level - 1) * 6;
  return miner.power * powerScale + flatBonus;
}

function getRadiationDamage() {
  if (relics.radiation.level >= 4) return LEVEL_ONE_DRILL_DAMAGE * 3;
  if (relics.radiation.level >= 3) return LEVEL_ONE_DRILL_DAMAGE * 2;
  return LEVEL_ONE_DRILL_DAMAGE;
}

function getRocketRadius() {
  return 3 + (relics.rocket.level >= 3 ? 3 : 0);
}

function getRocketDamage() {
  return ROCKET_DAMAGE * (relics.rocket.level >= 2 ? 2 : 1);
}

function getRocketMonsterDamage() {
  return ROCKET_MONSTER_DAMAGE * (relics.rocket.level >= 2 ? 2 : 1);
}

function getMagnetRadius() {
  return MAGNET_RADIUS + (relics.magnet.level >= 2 ? TILE * 2 : 0) + (relics.magnet.level >= 3 ? TILE : 0) + (relics.magnet.level >= 4 ? TILE : 0);
}

function getLaserSwordMaxSwings() {
  return 5 + (relics.laserSword.level >= 3 ? 5 : 0);
}

function getLaserSwordDamage() {
  const level = relics.laserSword.level;
  return 12 + Math.max(0, level - 1) * 4;
}

function getHelperSpeedMultiplier(type) {
  const relic = relics[type];
  if (type === "mouse") return [0, 0.25, 0.3, 0.4, 0.7][relic.level] ?? 0.7;
  if (type === "dog") return [0, 0.4, 0.7, 1, 1.35][relic.level] ?? 1.35;
  return HELPER_SPEED_MULTIPLIER;
}

function getMouseDrillDamage() {
  return [0, 0.375, 1.125, 1.875, 3.375][relics.mouse.level] ?? 3.375;
}

function getDogCarryCapacity() {
  return [0, 6, 10, 16, 25][relics.dog.level] ?? 25;
}

function getHelperMaxHealth(type) {
  if (type === "mouse") {
    return 25 + (relics.mouse.level >= 2 ? 8 : 0) + (relics.mouse.level >= 3 ? 10 : 0) + (relics.mouse.level >= 4 ? 15 : 0);
  }
  if (type === "dog") {
    return [0, 25, 45, 70, 100][relics.dog.level] ?? 100;
  }
  return null;
}

function getCarapaceIntegratorHullBonus(level = relics.alienCarapaceIntegrator.level) {
  return (level >= 1 ? 25 : 0) + (level >= 2 ? 20 : 0) + (level >= 3 ? 20 : 0) + (level >= 4 ? 25 : 0);
}

function getAlienGelHealAmount() {
  if (!relics.alienGelRegenerator.unlocked) return 0;
  return 2
    + (relics.alienGelRegenerator.level >= 2 ? 2 : 0)
    + (relics.alienGelRegenerator.level >= 3 ? 2 : 0)
    + (relics.alienGelRegenerator.level >= 4 ? 4 : 0);
}

function getGrenadeMaxCharges() {
  if (relics.grenades.level >= 4) return 8;
  return GRENADE_BASE_COUNT + Math.max(0, relics.grenades.level - 1);
}

function getGrenadeRadius() {
  return GRENADE_RADIUS + (relics.grenades.level >= 4 ? 1 : 0);
}

function getGrenadeDamage() {
  const levelBonus = Math.max(0, relics.grenades.level - 1) * 0.5;
  return miner.power * (GRENADE_DAMAGE_MULTIPLIER + levelBonus);
}

function getSoundDistorterDelay(level = relics.soundDistorter.level) {
  return 30 + (level >= 2 ? 10 : 0) + (level >= 3 ? 10 : 0) + (level >= 4 ? 20 : 0);
}

function delayMonsterWave(seconds) {
  monsterSpawnTimer += seconds;
}

function getNextMonsterWaveDelay() {
  return monsterSpawnInterval + (relics.soundDistorter.unlocked ? getSoundDistorterDelay() : 0);
}

function applyCarapaceIntegratorDelta(previousLevel, nextLevel) {
  const delta = getCarapaceIntegratorHullBonus(nextLevel) - getCarapaceIntegratorHullBonus(previousLevel);
  if (delta <= 0) return;
  miner.maxHealth += delta;
  miner.health = Math.min(miner.maxHealth, miner.health + delta);
}

function applyRelicUpgradeEffects(type, previousMaxHealth, previousLevel) {
  if (type === "bomb" && relics.bomb.level === 4) {
    miner.power += 1;
    miner.speed += 22;
  }
  if (type === "mouse") {
    const nextMax = getHelperMaxHealth("mouse");
    mouseHelper.maxHealth = nextMax;
    mouseHelper.health = Math.min(nextMax, mouseHelper.health + Math.max(0, nextMax - previousMaxHealth));
  }
  if (type === "dog") {
    const nextMax = getHelperMaxHealth("dog");
    dogHelper.maxHealth = nextMax;
    dogHelper.maxCarry = getDogCarryCapacity();
    dogHelper.health = Math.min(nextMax, dogHelper.health + Math.max(0, nextMax - previousMaxHealth));
  }
  if (type === "thirdEye") {
    expandExistingReveals();
  }
  if (type === "laserSword") {
    relics.laserSword.swings = Math.min(getLaserSwordMaxSwings(), relics.laserSword.swings + 5);
    if (relics.laserSword.swings >= getLaserSwordMaxSwings()) relics.laserSword.recharge = 0;
  }
  if (type === "grenades") {
    relics.grenades.charges = getGrenadeMaxCharges();
    relics.grenades.recharge = 0;
  }
  if (type === "soundDistorter") {
    delayMonsterWave(getSoundDistorterDelay(relics.soundDistorter.level) - getSoundDistorterDelay(previousLevel));
  }
  if (type === "alienCarapaceIntegrator") {
    applyCarapaceIntegratorDelta(previousLevel, relics.alienCarapaceIntegrator.level);
  }
}

function repairBase() {
  if (!isMinerAtBase()) {
    setMessage("Return to base to repair the base.");
    return;
  }
  if (base.health >= base.maxHealth) {
    setMessage("Base is already fully repaired.");
    return;
  }
  if (resources.alienCarapace < BASE_REPAIR_CARAPACE_COST) {
    setMessage(`Need ${BASE_REPAIR_CARAPACE_COST} Alien Carapace to repair the base.`);
    return;
  }

  resources.alienCarapace -= BASE_REPAIR_CARAPACE_COST;
  base.health = Math.min(base.maxHealth, base.health + BASE_REPAIR_AMOUNT);
  setMessage(`Base repaired by ${BASE_REPAIR_AMOUNT} HP.`);
  updateHud();
}

function canPlaceRelicFlare() {
  const x = Math.floor(miner.x / TILE);
  const y = Math.floor(miner.y / TILE);
  if (world[y]?.[x]) {
    setMessage("Flare can only be used in open space.");
    return false;
  }

  if (flares.some((flare) => flare.x === x && flare.y === y)) {
    setMessage("There is already a flare here.");
    return false;
  }

  return true;
}

function placeRelicFlare(duration, radius) {
  flares.push({
    x: Math.floor(miner.x / TILE),
    y: Math.floor(miner.y / TILE),
    worldX: miner.x,
    worldY: miner.y,
    timeLeft: duration,
    radius,
  });
}

function fireRocket() {
  blasts.push({
    x: miner.x + miner.facingX * 16,
    y: miner.y + miner.facingY * 16,
    vx: miner.facingX * 520,
    vy: miner.facingY * 520,
    life: 1.15,
    damage: getRocketDamage(),
    monsterDamage: getRocketMonsterDamage(),
    radius: getRocketRadius(),
    kind: "rocket",
  });
}

function detonateBomb() {
  const centerX = Math.floor(miner.x / TILE);
  const centerY = Math.floor(miner.y / TILE);
  detonateAt(centerX, centerY, getBombRadius(), getBombDamage());
}

function throwGrenade() {
  const grenades = relics.grenades;
  if (grenades.charges <= 0) {
    setMessage("No grenades left.");
    return;
  }

  grenades.charges -= 1;
  if (grenades.recharge <= 0) grenades.recharge = GRENADE_RECHARGE_TIME;
  const throwDistance = TILE * 3;
  const targetX = clamp(Math.floor((miner.x + miner.facingX * throwDistance) / TILE), 0, COLS - 1);
  const targetY = clamp(Math.floor((miner.y + miner.facingY * throwDistance) / TILE), 0, ROWS - 1);
  detonateAt(targetX, targetY, getGrenadeRadius(), getGrenadeDamage(), { monsterDamage: getGrenadeDamage() });
  setMessage(`Grenade thrown. ${grenades.charges} left.`);
}

function detonateAt(centerX, centerY, radius, damage, options = {}) {
  explosions.push({
    x: centerX * TILE + TILE / 2,
    y: centerY * TILE + TILE / 2,
    radius,
    life: 0.42,
    maxLife: 0.42,
  });
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (Math.abs(centerX - x) + Math.abs(centerY - y) > radius) continue;
      revealAround(x, y, getOpenRevealRadius());
      const tile = world[y]?.[x];
      if (!tile) continue;
      if (tile.unbreakable) {
        tile.hitFlash = 0.25;
        continue;
      }
      tile.hp -= damage;
      tile.hitFlash = 0.25;
      if (tile.hp <= 0) breakTile(x, y, tile);
    }
  }

  for (const monster of [...monsters]) {
    const monsterX = Math.floor(monster.x / TILE);
    const monsterY = Math.floor(monster.y / TILE);
    if (Math.abs(centerX - monsterX) + Math.abs(centerY - monsterY) <= radius) {
      damageMonster(monster, options.monsterDamage ?? damage);
    }
  }

  damageBlastCompanions(centerX, centerY, radius, damage);
  if (options.damageMiner && isEntityInBlast(centerX, centerY, miner, radius)) {
    miner.health = Math.max(0, miner.health - damage);
    setMessage(miner.health <= 0 ? "Rocket blast breached the hull." : "Rocket blast damaged the hull.");
    if (miner.health <= 0) triggerGameOver();
  }
}

function damageBlastCompanions(centerX, centerY, radius, damage) {
  if (relics.mouse.unlocked && isEntityInBlast(centerX, centerY, mouseHelper, radius)) {
      damageHelper("mouse", damage, "blast");
  }
  if (relics.dog.unlocked && isEntityInBlast(centerX, centerY, dogHelper, radius)) {
      damageHelper("dog", damage, "blast");
  }
}

function isEntityInBlast(centerX, centerY, entity, radius) {
  const entityX = Math.floor(entity.x / TILE);
  const entityY = Math.floor(entity.y / TILE);
  return Math.abs(centerX - entityX) + Math.abs(centerY - entityY) <= radius;
}

function revealAround(centerX, centerY, radius) {
  const newlyRevealed = [];
  addRevealAround(centerX, centerY, radius, newlyRevealed);
  for (const tile of newlyRevealed) {
    revealOpenAreaFrom(tile.x, tile.y);
  }
}

function expandExistingReveals() {
  const openReveals = [...revealedTiles]
    .map((key) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y };
    })
    .filter((tile) => !world[tile.y]?.[tile.x]);

  for (const tile of openReveals) {
    addRevealAround(tile.x, tile.y, getOpenRevealRadius());
  }
}

function addRevealAround(centerX, centerY, radius, newlyRevealed = null) {
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
      const key = `${x},${y}`;
      if (!revealedTiles.has(key) && newlyRevealed) newlyRevealed.push({ x, y });
      revealedTiles.add(key);
    }
  }
}

function revealOpenAreaFrom(startX, startY) {
  if (world[startY]?.[startX]) return;

  const queue = [{ x: startX, y: startY }];
  const visited = new Set();
  while (queue.length > 0 && visited.size < 180) {
    const current = queue.shift();
    const key = `${current.x},${current.y}`;
    if (visited.has(key) || world[current.y]?.[current.x]) continue;
    visited.add(key);
    addRevealAround(current.x, current.y, getOpenRevealRadius());
    [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].forEach((neighbor) => {
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= COLS || neighbor.y >= ROWS) return;
      if (!visited.has(`${neighbor.x},${neighbor.y}`) && !world[neighbor.y]?.[neighbor.x]) queue.push(neighbor);
    });
  }
}

function getUpgradeRecipe(type) {
  if (miner.upgrades[type] >= MAX_UPGRADE_LEVEL) return {};
  const nextLevel = miner.upgrades[type] + 1;
  return upgradeDefs[type].recipe(nextLevel);
}

function canAfford(recipe) {
  return Object.entries(recipe).every(([type, amount]) => resources[type] >= amount);
}

function spendResources(recipe) {
  for (const [type, amount] of Object.entries(recipe)) {
    resources[type] -= amount;
  }
}

function formatRecipe(recipe) {
  return Object.entries(recipe)
    .filter(([, amount]) => amount > 0)
    .map(([type, amount]) => `${amount} ${getResourceName(type)}`)
    .join(", ");
}

function getResourceName(type) {
  return resourceNames[type] ?? type;
}

function updateCamera() {
  const viewWidth = getCameraViewWidth();
  const viewHeight = getCameraViewHeight();
  camera.x = clamp(miner.x - viewWidth / 2, 0, Math.max(0, COLS * TILE - viewWidth));
  camera.y = clamp(miner.y - viewHeight / 2, 0, Math.max(0, ROWS * TILE - viewHeight));
}

function getCameraScale() {
  return VIEW_W / (CAMERA_ZOOM_LEVELS[cameraZoomIndex] * TILE);
}

function getCameraViewWidth() {
  return VIEW_W / getCameraScale();
}

function getCameraViewHeight() {
  return VIEW_H / getCameraScale();
}

function updateMonsterSightingSounds() {
  for (const monster of monsters) {
    if (monster.dormant || monster.screamedOnScreen) continue;
    if (!isMonsterVisibleOnScreen(monster)) continue;
    monster.screamedOnScreen = true;
    playMonsterScreamSound(monster);
  }
}

function isMonsterVisibleOnScreen(monster) {
  const tileX = Math.floor(monster.x / TILE);
  const tileY = Math.floor(monster.y / TILE);
  if (!isTileVisible(tileX, tileY)) return false;
  const margin = monster.radius + 4;
  return (
    monster.x >= camera.x - margin &&
    monster.x <= camera.x + getCameraViewWidth() + margin &&
    monster.y >= camera.y - margin &&
    monster.y <= camera.y + getCameraViewHeight() + margin
  );
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.scale(getCameraScale(), getCameraScale());
  drawSky();
  drawTiles();
  drawSpecialRooms();
  drawFlares();
  drawMagnets();
  drawExplosions();
  drawRadiationBursts();
  drawSwordArcs();
  drawBlasts();
  drawPickups();
  drawTreasureChest();
  drawBase();
  drawMonsters();
  drawDog();
  drawMouse();
  drawMiner();
  drawFeedbackEffects();
  drawVignette();
  ctx.restore();
  drawHullHitFlash();
  drawLowHullWarning();
}

function drawHullHitFlash() {
  if (hullHitFlashTimer <= 0) return;

  const progress = 1 - hullHitFlashTimer / HULL_HIT_FLASH_DURATION;
  const alpha = Math.max(0, 0.36 * (1 - progress));

  ctx.save();
  ctx.fillStyle = `rgba(255, 25, 12, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

function drawLowHullWarning() {
  if (lowHullFlashTimer <= 0) return;

  const progress = 1 - lowHullFlashTimer / LOW_HULL_WARNING_DURATION;
  const pulse = Math.sin(progress * Math.PI);
  const alpha = 0.12 + pulse * 0.2;

  ctx.save();
  ctx.fillStyle = `rgba(255, 40, 24, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = `rgba(255, 74, 56, ${0.55 + pulse * 0.35})`;
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, VIEW_W - 16, VIEW_H - 16);
  ctx.restore();
}

function drawSky() {
  const viewHeight = getCameraViewHeight();
  const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
  gradient.addColorStop(0, "#17272d");
  gradient.addColorStop(0.4, "#111417");
  gradient.addColorStop(1, "#08090a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, getCameraViewWidth(), viewHeight);
}

function drawTiles() {
  const viewWidth = getCameraViewWidth();
  const viewHeight = getCameraViewHeight();
  const startX = Math.floor(camera.x / TILE);
  const endX = Math.ceil((camera.x + viewWidth) / TILE);
  const startY = Math.floor(camera.y / TILE);
  const endY = Math.ceil((camera.y + viewHeight) / TILE);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world[y]?.[x];
      if (!isTileVisible(x, y)) {
        drawFogTile(x, y);
        if (tile?.relic && shouldFlashRelicSeeker()) drawRelicSeekerMarker(x * TILE - camera.x, y * TILE - camera.y);
        continue;
      }
      const sx = x * TILE - camera.x;
      const sy = y * TILE - camera.y;
      if (!tile) {
        drawOpenTunnelTile(sx, sy, x, y);
        continue;
      }
      ctx.fillStyle = tile.color;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.24)";
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
      drawBlockSurfaceTexture(sx, sy, x, y, tile);

      if (tile.unbreakable) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.moveTo(sx + 7, sy + 16);
        ctx.lineTo(sx + 16, sy + 7);
        ctx.lineTo(sx + 25, sy + 16);
        ctx.lineTo(sx + 16, sy + 25);
        ctx.closePath();
        ctx.fill();
      }

      if (!tile.unbreakable && tile.hp < tile.maxHp) {
        drawBlockDamagePixels(sx, sy, 1 - tile.hp / tile.maxHp);
      }

      if (tile.ore) {
        ctx.fillStyle = tile.ore.color;
        ctx.beginPath();
        ctx.arc(sx + 10, sy + 11, 3.5, 0, Math.PI * 2);
        ctx.arc(sx + 22, sy + 21, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tile.relic) {
        drawRelicBlock(sx, sy, tile.relic);
      }

      if (tile.hitFlash > 0) {
        ctx.fillStyle = `rgba(255, 245, 198, ${tile.hitFlash * 2.8})`;
        ctx.fillRect(sx, sy, TILE, TILE);
      }
    }
  }
}

function drawBlockSurfaceTexture(screenX, screenY, tileX, tileY, tile) {
  if (tile.unbreakable || !blockDefs.some((definition) => definition.biome === tile.biome)) return;

  const seed = tileX * 131 + tileY * 197;
  const biomeIndex = blockDefs.findIndex((definition) => definition.biome === tile.biome);
  const variant = Math.min(3, Math.floor(getBlockTextureNoise(tileX, tileY, biomeIndex + 11) * 4));

  if (biomeIndex === 0) {
    drawTopsoilMixedTexture(screenX, screenY, tile.color, seed, variant);
  } else if (biomeIndex === 1) {
    drawBlockStrata(screenX, screenY, tile.color, seed, variant);
  } else {
    drawBlockFractures(screenX, screenY, tile.color, seed, variant);
  }

  if (biomeIndex === 1) {
    const clayChips = [
      [[7, 12, 3, 2], [23, 6, 2, 3]],
      [[4, 21, 4, 2], [20, 10, 3, 2]],
      [[10, 5, 2, 3], [25, 20, 3, 2]],
      [[5, 9, 3, 2], [17, 24, 4, 2]],
    ][variant];
    ctx.fillStyle = shadeBlockColor(tile.color, 18);
    for (const [x, y, width, height] of clayChips) {
      ctx.fillRect(screenX + x, screenY + y, width, height);
    }
  } else if (biomeIndex === 2) {
    const basaltChunks = [
      [[3, 25, 5, 3], [25, 4, 3, 4]],
      [[4, 4, 4, 3], [22, 24, 6, 3]],
      [[2, 16, 4, 4], [25, 8, 4, 3]],
      [[8, 25, 6, 3], [24, 15, 5, 4]],
    ][variant];
    ctx.fillStyle = shadeBlockColor(tile.color, -26);
    for (const [x, y, width, height] of basaltChunks) {
      ctx.fillRect(screenX + x, screenY + y, width, height);
    }
  } else if (biomeIndex === 3) {
    const crystalFacets = [
      [[7, 22], [11, 14], [14, 23], [23, 6, 2, 8]],
      [[4, 12], [8, 5], [11, 14], [22, 20, 3, 8]],
      [[17, 24], [21, 14], [25, 23], [6, 7, 2, 7]],
      [[9, 26], [14, 17], [17, 27], [25, 5, 2, 10]],
    ][variant];
    ctx.fillStyle = "rgba(134, 240, 255, 0.22)";
    ctx.beginPath();
    ctx.moveTo(screenX + crystalFacets[0][0], screenY + crystalFacets[0][1]);
    ctx.lineTo(screenX + crystalFacets[1][0], screenY + crystalFacets[1][1]);
    ctx.lineTo(screenX + crystalFacets[2][0], screenY + crystalFacets[2][1]);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(
      screenX + crystalFacets[3][0],
      screenY + crystalFacets[3][1],
      crystalFacets[3][2],
      crystalFacets[3][3],
    );
  }
}

function drawTopsoilMixedTexture(screenX, screenY, color, seed, variant) {
  if (variant === 0) {
    drawTopsoilBrokenSediment(screenX, screenY, color, seed);
  } else if (variant === 1) {
    drawTopsoilMottling(screenX, screenY, color, seed);
  } else if (variant === 2) {
    drawTopsoilDiagonalFragments(screenX, screenY, color, seed);
  } else {
    drawTopsoilBroadPatches(screenX, screenY, color, seed);
  }
}

function drawTopsoilBrokenSediment(screenX, screenY, color, seed) {
  ctx.fillStyle = shadeBlockColor(color, -21);
  const count = 4 + Math.floor(getBlockTextureNoise(seed, 1, 8) * 3);
  for (let i = 0; i < count; i++) {
    const x = 2 + Math.floor(getBlockTextureNoise(i, seed, 9) * 23);
    const y = 4 + Math.floor(getBlockTextureNoise(i, seed, 10) * 24);
    const width = 3 + Math.floor(getBlockTextureNoise(i, seed, 11) * 7);
    ctx.fillRect(screenX + x, screenY + y, Math.min(width, 30 - x), 1);
  }
  drawTopsoilPebbles(screenX, screenY, color, seed, 7);
}

function drawTopsoilMottling(screenX, screenY, color, seed) {
  ctx.fillStyle = shadeBlockColor(color, -23);
  for (let i = 0; i < 7; i++) {
    const x = 3 + Math.floor(getBlockTextureNoise(i, seed, 12) * 25);
    const y = 3 + Math.floor(getBlockTextureNoise(i, seed, 13) * 25);
    const width = 1 + Math.floor(getBlockTextureNoise(i, seed, 14) * 3);
    const height = 1 + Math.floor(getBlockTextureNoise(i, seed, 15) * 2);
    ctx.fillRect(screenX + x, screenY + y, width, height);
  }
  drawTopsoilPebbles(screenX, screenY, color, seed, 9);
}

function drawTopsoilDiagonalFragments(screenX, screenY, color, seed) {
  ctx.strokeStyle = shadeBlockColor(color, -21);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const x = 3 + Math.floor(getBlockTextureNoise(i, seed, 16) * 19);
    const y = 5 + Math.floor(getBlockTextureNoise(i, seed, 17) * 20);
    const direction = getBlockTextureNoise(i, seed, 18) > 0.5 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(screenX + x, screenY + y);
    ctx.lineTo(screenX + x + 5, screenY + y + direction * 2);
    ctx.lineTo(screenX + x + 9, screenY + y + direction);
    ctx.stroke();
  }
  drawTopsoilPebbles(screenX, screenY, color, seed, 6);
}

function drawTopsoilBroadPatches(screenX, screenY, color, seed) {
  ctx.fillStyle = shadeBlockColor(color, -18);
  for (let i = 0; i < 3; i++) {
    const x = 3 + Math.floor(getBlockTextureNoise(i, seed, 19) * 20);
    const y = 4 + Math.floor(getBlockTextureNoise(i, seed, 20) * 22);
    const width = 5 + Math.floor(getBlockTextureNoise(i, seed, 21) * 6);
    ctx.fillRect(screenX + x, screenY + y, Math.min(width, 29 - x), 2);
    if (i % 2 === 0) {
      ctx.fillRect(screenX + x + 2, screenY + y + 2, Math.max(2, width - 4), 1);
    }
  }
  drawTopsoilPebbles(screenX, screenY, color, seed, 5);
}

function drawTopsoilPebbles(screenX, screenY, color, seed, count) {
  ctx.fillStyle = shadeBlockColor(color, 18);
  for (let i = 0; i < count; i++) {
    const x = 3 + Math.floor(getBlockTextureNoise(i, seed, 4) * 26);
    const y = 3 + Math.floor(getBlockTextureNoise(i, seed, 5) * 26);
    ctx.fillRect(screenX + x, screenY + y, i % 4 === 0 ? 2 : 1, 1);
  }
}

function drawBlockStrata(screenX, screenY, color, seed, variant) {
  const strataPatterns = [
    [[3, 7, 11], [16, 8, 13], [3, 17, 9], [15, 18, 14], [4, 26, 12], [18, 27, 10]],
    [[2, 6, 8], [12, 7, 16], [5, 15, 16], [23, 16, 7], [2, 25, 9], [14, 24, 15]],
    [[4, 8, 15], [22, 7, 8], [2, 18, 11], [16, 16, 13], [6, 27, 8], [17, 26, 12]],
    [[2, 5, 13], [18, 6, 11], [6, 14, 8], [17, 15, 13], [3, 24, 17], [22, 25, 8]],
  ][variant];

  ctx.fillStyle = shadeBlockColor(color, -12);
  for (const [x, y, width] of strataPatterns) {
    ctx.fillRect(screenX + x, screenY + y, width, 1);
  }

  ctx.fillStyle = shadeBlockColor(color, 16);
  for (let i = 0; i < 7; i++) {
    const px = 3 + Math.floor(getBlockTextureNoise(i, seed, 4) * 26);
    const py = 3 + Math.floor(getBlockTextureNoise(i, seed, 5) * 26);
    ctx.fillRect(screenX + px, screenY + py, i % 3 === 0 ? 2 : 1, 1);
  }
}

function drawBlockFractures(screenX, screenY, color, seed, variant) {
  const fracturePatterns = [
    [[[4, 9], [12, 12], [15, 20], [26, 24]], [[23, 3], [20, 10], [25, 15]]],
    [[[3, 23], [10, 18], [9, 10], [18, 6]], [[16, 27], [22, 20], [29, 18]]],
    [[[4, 5], [11, 9], [18, 8], [25, 14]], [[13, 10], [15, 18], [10, 26]]],
    [[[28, 6], [21, 10], [18, 17], [8, 21]], [[6, 4], [10, 11], [5, 16]]],
  ][variant];

  ctx.strokeStyle = shadeBlockColor(color, -20);
  ctx.lineWidth = 1;
  for (const fracture of fracturePatterns) {
    ctx.beginPath();
    ctx.moveTo(screenX + fracture[0][0], screenY + fracture[0][1]);
    for (let i = 1; i < fracture.length; i++) {
      ctx.lineTo(screenX + fracture[i][0], screenY + fracture[i][1]);
    }
    ctx.stroke();
  }

  ctx.fillStyle = shadeBlockColor(color, 13);
  for (let i = 0; i < 5; i++) {
    const px = 4 + Math.floor(getBlockTextureNoise(i, seed, 7) * 23);
    const py = 4 + Math.floor(getBlockTextureNoise(i, seed, 8) * 23);
    ctx.fillRect(screenX + px, screenY + py, 2, 2);
  }
}

function getBlockTextureNoise(x, y, seed) {
  let value = Math.imul(x + seed * 17, 374761393) + Math.imul(y + seed * 29, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function shadeBlockColor(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = clamp((value >> 16) + amount, 0, 255);
  const green = clamp(((value >> 8) & 255) + amount, 0, 255);
  const blue = clamp((value & 255) + amount, 0, 255);
  return `rgb(${red}, ${green}, ${blue})`;
}

function drawBlockDamagePixels(x, y, damageRatio) {
  const stage = Math.min(4, Math.floor(clamp(damageRatio, 0, 0.999) * 5));
  paintBlockDamagePixels(ctx, x, y, stage);
}

function paintBlockDamagePixels(targetCtx, x, y, stage) {
  const spacing = [6, 4, 3, 2, 2][stage];
  const pixelSize = [1, 1, 1, 1, 2][stage];
  const alpha = [0.16, 0.2, 0.25, 0.3, 0.34][stage];

  targetCtx.fillStyle = `rgba(5, 5, 5, ${alpha})`;
  for (let py = 2; py < TILE - 2; py++) {
    for (let px = 2; px < TILE - 2; px++) {
      const chip = (px * 17 + py * 31 + px * py) % spacing === 0;
      const checker = stage >= 3 && (px + py) % 3 === 0;
      const heavy = stage >= 4 && (px * 3 + py * 5) % 5 === 0;
      if (!chip && !checker && !heavy) continue;
      targetCtx.fillRect(x + px, y + py, pixelSize, pixelSize);
    }
  }

  targetCtx.fillStyle = `rgba(255, 238, 184, ${alpha * 0.55})`;
  for (let py = 3; py < TILE - 3; py += spacing) {
    for (let px = 3; px < TILE - 3; px += spacing) {
      if ((px * 13 + py * 19) % 5 === 0) targetCtx.fillRect(x + px, y + py, 1, 1);
    }
  }
}

function drawSpecialRooms() {
  for (const room of specialRooms) {
    if (!isTileVisible(room.x, room.y)) continue;
    if (!room.described) continue;
    const left = room.startX * TILE - camera.x;
    const top = room.startY * TILE - camera.y;
    const width = room.width * TILE;
    const height = room.height * TILE;
    drawSpecialRoomContents(room, left, top, width, height);
  }
}

function drawSpecialRoomContents(room, left, top, width, height) {
  if (room.kind === "spring") {
    drawHealingSpring(left + width / 2, top + height / 2);
  } else if (room.kind === "hullUpgrade") {
    drawHullUpgradeSprite(left + width / 2, top + height / 2, room.used);
  } else if (room.kind === "poison") {
    drawPoisonRoom(left, top, width, height);
  } else if (room.kind === "vein") {
    drawVeinRoom(left, top, width, height, room.resource);
  } else if (room.kind === "monsterSpawner") {
    drawSpawnerRoom(left, top, width, height);
  } else if (room.kind === "alarm") {
    drawAlarmRoom(left, top, width, height, room.used);
  } else if (room.kind === "teleporter") {
    drawTeleporterRoom(left, top, width, height);
  }
}

function drawVeinRoom(left, top, width, height, resource) {
  const color = resourceColors[resource] ?? "#f2c45b";
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(left + width / 2, top + height / 2, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSpawnerRoom(left, top, width, height) {
  const pulse = 0.45 + Math.sin(performance.now() / 200) * 0.18;
  ctx.strokeStyle = `rgba(255, 122, 102, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(left + width / 2, top + height / 2, 14, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAlarmRoom(left, top, width, height, used) {
  ctx.fillStyle = used ? "rgba(255, 122, 102, 0.25)" : "rgba(242, 196, 91, 0.48)";
  ctx.beginPath();
  ctx.moveTo(left + width / 2, top + height / 2 - 14);
  ctx.lineTo(left + width / 2 + 12, top + height / 2 + 10);
  ctx.lineTo(left + width / 2 - 12, top + height / 2 + 10);
  ctx.closePath();
  ctx.fill();
}

function drawTeleporterRoom(left, top, width, height) {
  const pulse = 0.45 + Math.sin(performance.now() / 160) * 0.18;
  const x = left + width / 2;
  const y = top + height / 2;
  ctx.strokeStyle = `rgba(104, 214, 199, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHealingSpring(x, y) {
  const pulse = 0.7 + Math.sin(performance.now() / 220) * 0.18;
  ctx.fillStyle = `rgba(104, 214, 199, ${0.2 * pulse})`;
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#24343a";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#68d6c7";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#86f0ff";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHullUpgradeSprite(x, y, used) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = used ? 0.42 : 1;
  ctx.fillStyle = "#f2c45b";
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(16, -8);
  ctx.lineTo(12, 15);
  ctx.lineTo(0, 22);
  ctx.lineTo(-12, 15);
  ctx.lineTo(-16, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#24343a";
  ctx.fillRect(-4, -8, 8, 19);
  ctx.fillRect(-10, -2, 20, 7);
  ctx.restore();
}

function drawPoisonRoom(left, top, width, height) {
  const time = performance.now() / 500;
  ctx.fillStyle = "rgba(157, 255, 91, 0.08)";
  for (let i = 0; i < 8; i++) {
    const x = left + ((i * 29 + Math.sin(time + i) * 8) % width);
    const y = top + ((i * 17 + Math.cos(time * 0.8 + i) * 7 + height) % height);
    ctx.beginPath();
    ctx.arc(x, y, 10 + (i % 3) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#d8c6a4";
  drawAlienBones(left + width * 0.32, top + height * 0.68);
  drawAlienBones(left + width * 0.66, top + height * 0.38);
}

function drawAlienBones(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.35);
  ctx.fillRect(-12, -2, 24, 4);
  ctx.beginPath();
  ctx.arc(-14, 0, 5, 0, Math.PI * 2);
  ctx.arc(14, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRelicBlock(x, y) {
  const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.25;
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 5);
  ctx.lineTo(x + 20, y + 16);
  ctx.lineTo(x + 16, y + 27);
  ctx.lineTo(x + 12, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffdf74";
  ctx.beginPath();
  ctx.arc(x + 10, y + 9, 2, 0, Math.PI * 2);
  ctx.arc(x + 23, y + 12, 2.4, 0, Math.PI * 2);
  ctx.arc(x + 21, y + 24, 2, 0, Math.PI * 2);
  ctx.fill();
}

function shouldFlashRelicSeeker() {
  return relics.relicSeeker.unlocked && (relics.relicSeeker.active > 0 || relics.relicSeeker.level >= 4);
}

function drawRelicSeekerMarker(x, y) {
  const pulse = 0.45 + Math.sin(performance.now() / 120) * 0.28;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 245, 138, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 7, y + 7, TILE - 14, TILE - 14);
  ctx.fillStyle = `rgba(255, 245, 138, ${pulse * 0.6})`;
  ctx.beginPath();
  ctx.arc(x + TILE / 2, y + TILE / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function isTileVisible(x, y) {
  for (const flare of flares) {
    if (Math.max(Math.abs(flare.x - x), Math.abs(flare.y - y)) <= (flare.radius ?? FLARE_VISIBILITY_RADIUS)) {
      return true;
    }
  }

  return revealedTiles.has(`${x},${y}`);
}

function drawOpenTunnelTile(sx, sy, x, y) {
  ctx.fillStyle = "#101820";
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.fillStyle = ((x * 19 + y * 23) % 5 === 0) ? "rgba(104, 214, 199, 0.055)" : "rgba(255, 255, 255, 0.018)";
  ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
  ctx.strokeStyle = "rgba(104, 214, 199, 0.11)";
  ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
}

function drawFogTile(x, y) {
  const sx = x * TILE - camera.x;
  const sy = y * TILE - camera.y;
  ctx.fillStyle = "#030405";
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.018)";
  ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
}

function drawFlares() {
  for (const flare of flares) {
    if (!isTileVisible(flare.x, flare.y)) continue;
    const x = (flare.worldX ?? flare.x * TILE + TILE / 2) - camera.x;
    const y = (flare.worldY ?? flare.y * TILE + TILE / 2) - camera.y;
    const glowRadius = TILE * Math.max(2.5, (flare.radius ?? FLARE_VISIBILITY_RADIUS) * 0.8);
    const glow = ctx.createRadialGradient(x, y, 2, x, y, glowRadius);
    glow.addColorStop(0, "rgba(255, 106, 72, 0.58)");
    glow.addColorStop(1, "rgba(255, 204, 96, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
    ctx.fillStyle = "#ff6a48";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff4b0";
    ctx.font = "700 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.ceil(flare.timeLeft)}`, x, y - 10);
    ctx.textAlign = "start";
  }
}

function drawSwordArcs() {
  for (const arc of swordArcs) {
    const x = arc.x - camera.x;
    const y = arc.y - camera.y;
    const angle = Math.atan2(arc.facingY, arc.facingX);
    const alpha = Math.max(0, arc.life / arc.maxLife);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = `rgba(255, 125, 233, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, arc.range, -0.65, 0.65);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 244, 176, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, arc.range - 5, -0.58, 0.58);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBlasts() {
  for (const blast of blasts) {
    const x = blast.x - camera.x;
    const y = blast.y - camera.y;
    const isRocket = blast.kind === "rocket";
    ctx.fillStyle = isRocket ? "#ff5f45" : "#b7ff6d";
    ctx.beginPath();
    ctx.arc(x, y, isRocket ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isRocket ? "rgba(255, 95, 69, 0.45)" : "rgba(183, 255, 109, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x - blast.vx * (isRocket ? 0.04 : 0.025), y - blast.vy * (isRocket ? 0.04 : 0.025));
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawRadiationBursts() {
  for (const burst of radiationBursts) {
    const progress = 1 - burst.life / burst.maxLife;
    const x = burst.x - camera.x;
    const y = burst.y - camera.y;
    const radius = burst.radius * (0.35 + progress * 0.65);
    const alpha = Math.max(0, 1 - progress);

    ctx.strokeStyle = `rgba(157, 255, 91, ${0.55 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(157, 255, 91, ${0.08 * alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMagnets() {
  if (relics.magnet.active <= 0) return;
  const x = miner.x - camera.x;
  const y = miner.y - camera.y;
  const pulse = 0.45 + Math.sin(performance.now() / 180) * 0.18;
  const ringRadius = getMagnetRadius() * (0.88 + pulse * 0.08);

  ctx.strokeStyle = `rgba(180, 116, 255, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#d8c6ff";
  ctx.font = "700 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.ceil(relics.magnet.active)}s`, x, y - 22);
  ctx.textAlign = "start";
}

function drawMonsters() {
  for (const monster of monsters) {
    if (monster.dormant) continue;
    const tileX = Math.floor(monster.x / TILE);
    const tileY = Math.floor(monster.y / TILE);
    if (!isTileVisible(tileX, tileY)) continue;

    const x = monster.x - camera.x;
    const y = monster.y - camera.y;
    const flash = monster.hitFlash > 0;
    const baseAttacker = isBaseAttackMonster(monster);
    const bodyColor = baseAttacker ? "#9f4dff" : monster.color ?? "#c44d5c";
    const sprite = MONSTER_SPRITES_BY_LEVEL[
      clamp(monster.level, 1, MONSTER_SPRITES_BY_LEVEL.length) - 1
    ];
    const spriteFilter = getMonsterSpriteFilter(monster);

    const walkSheet = getMonsterWalkSheet(monster.level);
    if (walkSheet?.complete && walkSheet.naturalWidth > 0) {
      drawMonsterWalkSprite(monster, x, y, spriteFilter, walkSheet);
    } else if (monsterSpriteSheet.complete && monsterSpriteSheet.naturalWidth > 0) {
      const drawSize = TILE * sprite.scale;
      ctx.save();
      ctx.filter = spriteFilter;
      ctx.drawImage(
        monsterSpriteSheet,
        sprite.col * MONSTER_SPRITE_CELL_SIZE,
        sprite.row * MONSTER_SPRITE_CELL_SIZE,
        MONSTER_SPRITE_CELL_SIZE,
        MONSTER_SPRITE_CELL_SIZE,
        x - drawSize / 2,
        y - drawSize / 2,
        drawSize,
        drawSize,
      );
      ctx.restore();
    } else {
      ctx.fillStyle = monster.attackFlash > 0 ? "#ff9b4f" : flash ? "#fff0b8" : bodyColor;
      ctx.beginPath();
      ctx.arc(x, y, monster.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (baseAttacker) {
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, monster.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    const hpWidth = 24;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(x - hpWidth / 2, y - 19, hpWidth, 4);
    ctx.fillStyle = "#ff7a66";
    ctx.fillRect(x - hpWidth / 2, y - 19, hpWidth * Math.max(0, monster.hp / monster.maxHp), 4);
    ctx.fillStyle = "#f4f0e8";
    ctx.font = "700 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(baseAttacker ? `B${monster.level}` : `L${monster.level}`, x, y + 22);
    ctx.textAlign = "start";
  }
}

function getMonsterSpriteFilter(monster) {
  if (monster.attackFlash > 0) return "brightness(1.45) sepia(0.65) saturate(1.6) hue-rotate(330deg)";
  if (monster.hitFlash > 0) return "brightness(1.7) saturate(0.65) hue-rotate(145deg)";
  return "none";
}

function getMonsterWalkSheet(level) {
  if (level >= 8) return levelEightMonsterWalkSheet;
  return monsterWalkSheets[clamp(level, 1, monsterWalkSheets.length) - 1];
}

function getMonsterWalkFrameTime(level) {
  if (level >= 8) return 0.32;
  return MONSTER_WALK_FRAME_TIMES[clamp(level, 1, MONSTER_WALK_FRAME_TIMES.length) - 1];
}

function drawMonsterWalkSprite(monster, x, y, spriteFilter = "none", walkSheet = getMonsterWalkSheet(monster.level)) {
  const rowByFacing = { up: 0, right: 3, down: 2, left: 1 };
  const row = rowByFacing[monster.facing] ?? rowByFacing.down;
  const sequenceIndex = Math.floor(monster.walkAnimationTime / getMonsterWalkFrameTime(monster.level)) % MONSTER_WALK_SEQUENCE.length;
  const column = monster.isMoving ? MONSTER_WALK_SEQUENCE[sequenceIndex] : 1;
  const sourceWidth = walkSheet.naturalWidth / MONSTER_WALK_COLUMNS;
  const sourceHeight = walkSheet.naturalHeight / MONSTER_WALK_ROWS;
  const drawSize = TILE * (monster.level >= 8
    ? 2.15
    : MONSTER_WALK_SCALES[clamp(monster.level, 1, MONSTER_WALK_SCALES.length) - 1]);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.filter = spriteFilter;
  ctx.drawImage(
    walkSheet,
    column * sourceWidth,
    row * sourceHeight,
    sourceWidth,
    sourceHeight,
    x - drawSize / 2,
    y - drawSize / 2,
    drawSize,
    drawSize,
  );
  ctx.restore();
}

function drawExplosions() {
  for (const explosion of explosions) {
    const progress = 1 - explosion.life / explosion.maxLife;
    const x = explosion.x - camera.x;
    const y = explosion.y - camera.y;
    const size = TILE * (1 + explosion.radius * progress);
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = `rgba(255, 138, 61, ${0.38 * alpha})`;
    ctx.strokeStyle = `rgba(255, 232, 149, ${0.75 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 244, 176, ${0.7 * alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(4, size * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnHealingFeedback(dt) {
  healingFeedbackTimer -= dt;
  if (healingFeedbackTimer > 0) return;
  healingFeedbackTimer = 0.28;

  feedbackEffects.push({
    kind: "heal",
    x: miner.x + (Math.random() - 0.5) * 24,
    y: miner.y - 8 + (Math.random() - 0.5) * 14,
    vx: (Math.random() - 0.5) * 12,
    vy: -28 - Math.random() * 12,
    life: 0.85,
    maxLife: 0.85,
    size: 12 + Math.random() * 4,
  });
}

function spawnPoisonStrike() {
  feedbackEffects.push({
    kind: "poison",
    x: miner.x,
    y: miner.y - 6,
    vx: 0,
    vy: -10,
    life: 0.32,
    maxLife: 0.32,
    size: 34,
  });
}

function drawFeedbackEffects() {
  for (const effect of feedbackEffects) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, 1 - progress);
    const x = effect.x - camera.x;
    const y = effect.y - camera.y;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;

    if (effect.kind === "heal") {
      const size = effect.size;
      ctx.strokeStyle = "#7eea89";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-size / 2, 0);
      ctx.lineTo(size / 2, 0);
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(0, size / 2);
      ctx.stroke();
    } else if (effect.kind === "poison") {
      const size = effect.size;
      ctx.strokeStyle = "#8cff5f";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(140, 255, 95, 0.75)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 0.25);
      ctx.lineTo(size * 0.05, size * 0.06);
      ctx.lineTo(-size * 0.08, size * 0.06);
      ctx.lineTo(size * 0.35, size * 0.36);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawBase() {
  const x = BASE_MIN_TILE_X * TILE - camera.x;
  const y = 2 * TILE - camera.y;
  ctx.fillStyle = "#25343b";
  ctx.fillRect(x, y, 8 * TILE, TILE * 1.5);
  ctx.fillStyle = "#68d6c7";
  ctx.fillRect(x + 12, y + 10, 8 * TILE - 24, 8);
  ctx.fillStyle = "#f4f0e8";
  ctx.font = "700 14px system-ui";
  ctx.fillText("BASE", x + 100, y + 34);
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(x + 12, y + 44, 8 * TILE - 24, 5);
  ctx.fillStyle = base.health <= 50 ? "#ff7a66" : "#68d6c7";
  ctx.fillRect(x + 12, y + 44, (8 * TILE - 24) * Math.max(0, base.health / base.maxHealth), 5);
}

function drawPickups() {
  const groups = getVisiblePickupDrawGroups();
  for (const group of groups) {
    const x = group.x - camera.x;
    const y = group.y - camera.y;
    const stackCount = group.pickups.length;
    const shadowWidth = Math.min(18, 8 + stackCount * 3);
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, shadowWidth, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawPickupStack(x, y, group.type, stackCount, group.rotation);
  }
}

function getVisiblePickupDrawGroups() {
  const groups = new Map();
  for (const pickup of pickups) {
    if (!isPickupVisible(pickup)) continue;
    if (pickup.type === "idol") {
      groups.set(`idol:${pickup.x}:${pickup.y}`, {
        type: pickup.type,
        x: pickup.x,
        y: pickup.y,
        rotation: pickup.rotation,
        pickups: [pickup],
      });
      continue;
    }

    const tileX = Math.floor(pickup.x / TILE);
    const tileY = Math.floor(pickup.y / TILE);
    const key = `${pickup.type}:${tileX}:${tileY}:${pickup.roomLabel ?? ""}`;
    if (!groups.has(key)) {
      groups.set(key, {
        type: pickup.type,
        x: 0,
        y: 0,
        rotation: pickup.rotation,
        pickups: [],
      });
    }
    const group = groups.get(key);
    group.x += pickup.x;
    group.y += pickup.y;
    group.pickups.push(pickup);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    x: group.x / group.pickups.length,
    y: group.y / group.pickups.length,
  }));
}

function drawPickupStack(x, y, type, count, rotation = 0) {
  if (type === "idol") {
    drawIdolPickup(x, y, rotation);
    return;
  }

  const stackOffsets = getPickupStackOffsets(count);
  for (let i = 0; i < stackOffsets.length; i++) {
    const offset = stackOffsets[i];
    drawOrePickup(x + offset.x, y + offset.y, type, rotation + offset.rotation, offset.scale);
  }

  if (count > 3) drawStackPlusMarker(x + 9, y - 11);
}

function getPickupStackOffsets(count) {
  if (count <= 1) return [{ x: 0, y: 0, rotation: 0, scale: 1 }];
  if (count === 2) {
    return [
      { x: -5, y: 0, rotation: -0.16, scale: 0.9 },
      { x: 5, y: -1, rotation: 0.16, scale: 0.9 },
    ];
  }
  if (count === 3) {
    return [
      { x: -6, y: 2, rotation: -0.18, scale: 0.86 },
      { x: 6, y: 2, rotation: 0.2, scale: 0.86 },
      { x: 0, y: -6, rotation: 0.04, scale: 0.86 },
    ];
  }
  return [
    { x: -7, y: 3, rotation: -0.18, scale: 0.78 },
    { x: 7, y: 3, rotation: 0.19, scale: 0.78 },
    { x: -3, y: -5, rotation: 0.08, scale: 0.78 },
    { x: 5, y: -8, rotation: -0.05, scale: 0.78 },
  ];
}

function drawStackPlusMarker(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f4f0e8";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.moveTo(0, -4);
  ctx.lineTo(0, 4);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#f4f0e8";
  ctx.stroke();
  ctx.restore();
}

function drawTreasureChest() {
  if (!treasureChest.placed || treasureChest.delivered) return;
  if (!treasureChest.carried && !isTreasureRoomDiscovered()) return;
  if (!treasureChest.carried && !isTileVisible(treasureChest.tileX, treasureChest.tileY)) return;

  const x = treasureChest.x - camera.x;
  const y = treasureChest.y - camera.y;

  if (treasureChest.carried) {
    ctx.strokeStyle = "rgba(242, 196, 91, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(miner.x - camera.x, miner.y - camera.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(x, y);
  if (treasureChest.carried) ctx.rotate(Math.sin(performance.now() / 180) * 0.08);

  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(0, 11, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7b4a2d";
  ctx.fillRect(-14, -6, 28, 17);
  ctx.fillStyle = "#a96738";
  ctx.fillRect(-14, -10, 28, 7);
  ctx.fillStyle = "#4b2f24";
  ctx.fillRect(-14, -3, 28, 3);
  ctx.fillStyle = "#f2c45b";
  ctx.fillRect(-2, -5, 4, 8);
  ctx.fillRect(-13, -8, 26, 2);
  ctx.fillRect(-13, 7, 26, 2);

  if (treasureChest.hover) {
    ctx.strokeStyle = "#fff4b0";
    ctx.lineWidth = 2;
    ctx.strokeRect(-17, -13, 34, 27);
    ctx.fillStyle = "#fff4b0";
    ctx.font = "700 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Click / E", 0, -18);
    ctx.textAlign = "start";
  }

  ctx.restore();
}

function isTreasureRoomDiscovered() {
  return isRoomDescribed("Z") || treasureChest.carried || treasureChest.instructionsShown || treasureChest.delivered;
}

function isPickupVisible(pickup) {
  if (pickup.roomLabel && !isRoomDescribed(pickup.roomLabel)) return false;
  return isTileVisible(Math.floor(pickup.x / TILE), Math.floor(pickup.y / TILE));
}

function isRoomDescribed(label) {
  return !!specialRooms.find((room) => room.label === label)?.described;
}

function drawOrePickup(x, y, type, rotation = 0, scale = 1) {
  if (type === "idol") {
    drawIdolPickup(x, y, rotation);
    return;
  }

  const color = resourceColors[type] ?? "#ffffff";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#2a2522";
  ctx.beginPath();
  ctx.moveTo(-8, 1);
  ctx.lineTo(-4, -6);
  ctx.lineTo(5, -6);
  ctx.lineTo(9, 0);
  ctx.lineTo(5, 6);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-2, -4);
  ctx.lineTo(4, -4);
  ctx.lineTo(6, 0);
  ctx.lineTo(2, 4);
  ctx.lineTo(-5, 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
  ctx.beginPath();
  ctx.moveTo(-2, -4);
  ctx.lineTo(4, -4);
  ctx.lineTo(1, -1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, 4);
  ctx.lineTo(1, -1);
  ctx.lineTo(7, 1);
  ctx.stroke();
  ctx.restore();
}

function drawIdolPickup(x, y, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "#f2c45b";
  ctx.beginPath();
  ctx.arc(0, -6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-5, -1, 10, 13);
  ctx.fillStyle = "#24343a";
  ctx.fillRect(-2, 2, 4, 8);
  ctx.restore();
}

function drawMiner() {
  const x = miner.x - camera.x;
  const y = miner.y - camera.y;
  ctx.save();
  if (gameOver) {
    ctx.translate(x, y);
    drawBrokenMiner();
    ctx.restore();
    return;
  }
  if (minerTravelSheet.complete && minerTravelSheet.naturalWidth > 0) {
    drawAnimatedMiner(x, y);
    ctx.restore();
    return;
  }
  ctx.translate(x, y);
  ctx.scale(0.72, 0.72);
  ctx.rotate(Math.atan2(miner.facingY, miner.facingX));
  ctx.fillStyle = "#e9eef1";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#68d6c7";
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2c45b";
  ctx.fillRect(-17, -4, 7, 8);
  ctx.restore();
}

function drawAnimatedMiner(x, y) {
  const drilling = miner.drillCooldown > 0 && minerDrillSheet.complete && minerDrillSheet.naturalWidth > 0;
  const sheet = drilling ? minerDrillSheet : minerTravelSheet;
  const facing = getMinerCardinalFacing();
  const travelSide = !drilling && (facing === "left" || facing === "right");
  const drillingSide = drilling && (facing === "left" || facing === "right");
  const rowByFacing = drilling
    ? { up: 0, right: 1, down: 2, left: 1 }
    : { up: 0, right: 3, down: 2, left: 3 };
  const row = rowByFacing[facing];
  const frameTime = drilling ? MINER_DRILL_FRAME_TIME : MINER_TRAVEL_FRAME_TIME;
  const sequenceIndex = Math.floor(miner.animationTime / frameTime) % MINER_ANIMATION_SEQUENCE.length;
  const column = drilling || miner.isMoving ? MINER_ANIMATION_SEQUENCE[sequenceIndex] : 1;
  const sourceWidth = sheet.naturalWidth / MINER_ANIMATION_COLUMNS;
  const sourceHeight = sheet.naturalHeight / MINER_ANIMATION_ROWS;
  const drawSize = TILE * 1.55;

  ctx.save();
  ctx.translate(x, y);
  if (travelSide && facing === "right") ctx.scale(-1, 1);
  if (drillingSide && facing === "left") ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheet,
    column * sourceWidth,
    row * sourceHeight,
    sourceWidth,
    sourceHeight,
    -drawSize / 2,
    -drawSize / 2,
    drawSize,
    drawSize,
  );
  ctx.restore();
}

function getMinerCardinalFacing() {
  if (Math.abs(miner.facingX) > Math.abs(miner.facingY)) return miner.facingX > 0 ? "right" : "left";
  return miner.facingY > 0 ? "down" : "up";
}

function drawBrokenMiner() {
  const shake = Math.max(0, 1 - gameOverTimer / 1.2) * 4;
  ctx.translate(Math.sin(gameOverTimer * 48) * shake, Math.cos(gameOverTimer * 35) * shake);
  ctx.scale(0.72, 0.72);
  ctx.rotate(-0.7 + Math.sin(gameOverTimer * 18) * 0.08);

  ctx.fillStyle = "#8e979a";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-12, -10);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-12, 10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#1b2024";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -7);
  ctx.lineTo(4, 0);
  ctx.lineTo(-2, 7);
  ctx.stroke();

  ctx.fillStyle = "#ff7a66";
  ctx.beginPath();
  ctx.arc(3, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f2c45b";
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const angle = gameOverTimer * 8 + i * 1.7;
    const pulse = 12 + ((gameOverTimer * 90 + i * 9) % 18);
    const alpha = Math.max(0, 1 - gameOverTimer / 1.5) * (0.45 + (i % 2) * 0.25);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 9);
    ctx.lineTo(Math.cos(angle) * pulse, Math.sin(angle) * pulse);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#2d3438";
  ctx.fillRect(-20, -5, 8, 10);
}

function drawMouse() {
  if (!relics.mouse.unlocked) return;
  const x = mouseHelper.x - camera.x;
  const y = mouseHelper.y - camera.y;
  const angle = mouseHelper.target
    ? Math.atan2(mouseHelper.target.y * TILE + TILE / 2 - mouseHelper.y, mouseHelper.target.x * TILE + TILE / 2 - mouseHelper.x)
    : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#d8c6a4";
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1e6ce";
  ctx.beginPath();
  ctx.arc(7, -3, 2.5, 0, Math.PI * 2);
  ctx.arc(7, 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#b59a76";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-15, 4);
  ctx.stroke();
  ctx.restore();
}

function drawDog() {
  if (!relics.dog.unlocked) return;
  const x = dogHelper.x - camera.x;
  const y = dogHelper.y - camera.y;
  const angle = dogHelper.target
    ? Math.atan2(dogHelper.target.y - dogHelper.y, dogHelper.target.x - dogHelper.x)
    : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#c98b5c";
  ctx.beginPath();
  ctx.roundRect(-10, -6, 18, 12, 4);
  ctx.fill();
  ctx.fillStyle = "#e4b287";
  ctx.beginPath();
  ctx.arc(9, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6f3f2a";
  ctx.beginPath();
  ctx.arc(12, -2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#6f3f2a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, 2);
  ctx.lineTo(-15, -2);
  ctx.stroke();
  if (dogHelper.carried > 0) {
    ctx.fillStyle = "#68d6c7";
    ctx.fillRect(-5, -12, 10, 5);
  }
  ctx.restore();
}

function drawVignette() {
  const depth = Math.max(0, miner.y / TILE - SURFACE_ROWS);
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.48, depth / 115)})`;
  ctx.fillRect(0, 0, getCameraViewWidth(), getCameraViewHeight());
}

function updateHud() {
  const atBase = isMinerAtBase();
  const baseUnderAttack = isBaseUnderAttack();
  document.querySelector("#depthStat").textContent = `${Math.max(0, Math.floor((miner.y - SURFACE_ROWS * TILE) / TILE))}m`;
  document.querySelector("#cargoStat").textContent = `${carried} / ${miner.capacity}`;
  document.querySelector("#healthStat").textContent = `${Math.ceil(miner.health)} / ${Math.round(miner.maxHealth)}`;
  document.querySelector("#timeStat").textContent = formatElapsedTime(elapsedTime);
  document.querySelector("#baseStat").textContent = `${Math.ceil(base.health)} / ${base.maxHealth}`;
  document.querySelector("#baseWarning").hidden = !baseUnderAttack;
  document.querySelector("#baseWarning").parentElement.classList.toggle("is-warning", baseUnderAttack);
  document.body.classList.toggle("base-under-attack", baseUnderAttack);
  updateBaseAttackWarningMessage(baseUnderAttack);

  for (const type of Object.keys(upgradeDefs)) {
    const recipe = getUpgradeRecipe(type);
    const button = document.querySelector(`[data-upgrade="${type}"]`);
    const atMaxLevel = miner.upgrades[type] >= MAX_UPGRADE_LEVEL;
    const cost = atMaxLevel ? "Max level" : `Lv ${miner.upgrades[type] + 1}: ${formatRecipe(recipe)}`;
    document.querySelector(`#${type}Cost`).textContent = cost;
    button.disabled = atMaxLevel || !canInstallUpgrades() || !canAfford(recipe);
  }

  const baseRepairButton = document.querySelector("[data-repair-base]");
  document.querySelector("#baseRepairCost").textContent = `${BASE_REPAIR_CARAPACE_COST} carapace`;
  baseRepairButton.disabled = !atBase || base.health >= base.maxHealth || resources.alienCarapace < BASE_REPAIR_CARAPACE_COST;

  updateRelicHud("impact");
  updateRelicHud("speed");
  updateRelicHud("flare");
  updateRelicHud("blaster");
  updateRelicHud("bomb");
  updateRelicHud("mouse");
  updateRelicHud("dog");
  updateRelicHud("radiation");
  updateRelicHud("rocket");
  updateRelicHud("magnet");
  updateRelicHud("thirdEye");
  updateRelicHud("laserSword");
  updateRelicHud("converter");
  updateRelicHud("ansible");
  updateRelicHud("grenades");
  updateRelicHud("soundDistorter");
  updateRelicHud("alienCarapaceIntegrator");
  updateRelicHud("alienGelRegenerator");
  updateRelicHud("godVisage");
  updateRelicHud("relicSeeker");
  for (const type of Object.keys(relicDefs)) updateRelicUpgradeHud(type, atBase);
  const hasRelic = Object.values(relics).some((relic) => relic.unlocked);
  document.querySelector("#relicPanel").hidden = !hasRelic;

  document.querySelector("#resourceList").innerHTML = Object.entries(resources)
    .map(([type, amount]) => {
      const cargoAmount = cargo[type];
      const cargoText = cargoAmount > 0 ? ` <span>(+${cargoAmount})</span>` : "";
      return `<dt>${getResourceName(type)}</dt><dd>${amount}${cargoText}</dd>`;
    })
    .join("");
}

function isBaseUnderAttack() {
  return gameStarted && !finalGameOver && baseAttackAlertTimer > 0;
}

function updateBaseAttackWarningMessage(baseUnderAttack) {
  if (baseUnderAttack === baseAttackWarningActive) return;
  baseAttackWarningActive = baseUnderAttack;
  setMessage(baseUnderAttack ? "Warning: base is under attack." : "Base attack cleared.");
}

function setupWorldSizeSelect() {
  const select = document.querySelector("#worldSizeSelect");
  select.value = activeWorldSize;
  select.addEventListener("change", () => {
    localStorage.setItem("driftMinerWorldSize", select.value);
    window.location.reload();
  });
}

function setupStartOverlay() {
  const overlay = document.querySelector("#startOverlay");
  const select = document.querySelector("#startWorldSizeSelect");
  const modeSelect = document.querySelector("#startModeSelect");
  const button = document.querySelector("#startGameButton");
  if (!overlay || !select || !button) return;

  select.value = activeWorldSize;
  select.addEventListener("change", () => {
    localStorage.setItem("driftMinerWorldSize", select.value);
  });

  const updateStartButtonLabel = () => {
    button.textContent = modeSelect?.value === "stage4" ? "Board the Vessel" : modeSelect?.value === "stage3" ? "Defend Homeworld" : modeSelect?.value === "stage2" ? "Start Defense" : "Start Game";
  };
  modeSelect?.addEventListener("change", updateStartButtonLabel);
  updateStartButtonLabel();

  button.addEventListener("click", () => {
    if (modeSelect?.value === "stage3") {
      window.location.href = "stage3.html";
      return;
    }
    if (modeSelect?.value === "stage4") {
      window.location.href = "stage4.html";
      return;
    }
    if (modeSelect?.value === "stage2") {
      window.location.href = "stage2.html";
      return;
    }
    startGameWithSelectedWorldSize(select.value);
  });

  document.querySelector("#stageOneIntroContinue")?.addEventListener("click", beginStageOneGameplay);

  if (sessionStorage.getItem("driftMinerAutoStart") === "1") {
    sessionStorage.removeItem("driftMinerAutoStart");
    startGameWithSelectedWorldSize(activeWorldSize);
  }
}

function startGameWithSelectedWorldSize(selectedSize = activeWorldSize) {
  if (selectedSize !== activeWorldSize) {
    localStorage.setItem("driftMinerWorldSize", selectedSize);
    sessionStorage.setItem("driftMinerAutoStart", "1");
    window.location.reload();
    return;
  }

  const intro = document.querySelector("#stageOneIntroOverlay");
  if (!intro) {
    beginStageOneGameplay();
    return;
  }

  unlockAudio();
  gamepadState.openSelect = null;
  document.querySelector("#startOverlay").hidden = true;
  intro.hidden = false;
  selectControllerItem(0);
}

// Enter / gamepad A / Start should confirm whichever pre-game panel is showing.
function clickPrimaryStartAction() {
  const intro = document.querySelector("#stageOneIntroOverlay");
  if (intro && !intro.hidden) {
    document.querySelector("#stageOneIntroContinue")?.click();
    return;
  }
  clickPrimaryStartAction();
}

function beginStageOneGameplay() {
  unlockAudio();
  gameStarted = true;
  gamePaused = false;
  gamepadState.openSelect = null;
  document.querySelector("#startOverlay").hidden = true;
  const intro = document.querySelector("#stageOneIntroOverlay");
  if (intro) intro.hidden = true;
  document.querySelector("#pauseOverlay").hidden = true;
  initializeGameplayControllerSelection();
  lastTime = performance.now();
  setMessage("Launch from the pad and start digging.");
}

function initializeGameplayControllerSelection() {
  clearControllerSelection();
  const elements = getControllerSelectableElements();
  const firstUpgrade = document.querySelector('[data-upgrade="power"]');
  const firstUpgradeIndex = elements.indexOf(firstUpgrade);
  selectControllerItem(firstUpgradeIndex >= 0 ? firstUpgradeIndex : 0);
}

function setupPanelMinimizeControls() {
  document.querySelectorAll(".panel-section").forEach((section, index) => {
    const heading = section.querySelector(":scope > h2");
    if (!heading) return;

    const title = heading.textContent.trim() || `Panel ${index + 1}`;
    const header = document.createElement("div");
    header.className = "panel-section-header";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "panel-minimize";
    button.setAttribute("aria-label", `Minimize ${title}`);
    button.setAttribute("aria-expanded", "true");
    button.textContent = "-";

    section.insertBefore(header, heading);
    header.append(heading, button);

    button.addEventListener("click", () => {
      const minimized = section.classList.toggle("is-minimized");
      button.textContent = minimized ? "+" : "-";
      button.setAttribute("aria-expanded", String(!minimized));
      button.setAttribute("aria-label", `${minimized ? "Expand" : "Minimize"} ${title}`);
    });
  });
}

function setupItemTooltips() {
  for (const [type, definition] of Object.entries(upgradeDefs)) {
    const button = document.querySelector(`[data-upgrade="${type}"]`);
    if (button) setTooltip(button, definition.description);
  }

  const baseRepairButton = document.querySelector("[data-repair-base]");
  if (baseRepairButton) setTooltip(baseRepairButton, baseRepairDescription);

  for (const [type, definition] of Object.entries(relicDefs)) {
    const control = document.querySelector(`[data-relic="${type}"]`);
    const upgrade = document.querySelector(`[data-relic-upgrade="${type}"]`);
    const description = relicDescriptions[type] ?? definition.label;
    if (control) setTooltip(control, description);
    if (upgrade) setTooltip(upgrade, `Upgrade ${definition.label}: ${getRelicUpgradeDescription(type)}.`);
  }
}

function setTooltip(element, text) {
  element.querySelector(".upgrade-description")?.remove();
  element.title = text;
  element.dataset.tooltip = text;
  element.addEventListener("mouseenter", (event) => showTooltipForElement(element, event.clientX, event.clientY));
  element.addEventListener("mousemove", (event) => showTooltipForElement(element, event.clientX, event.clientY));
  element.addEventListener("mouseleave", hideCustomTooltip);
  element.addEventListener("focus", () => {
    const rect = element.getBoundingClientRect();
    showTooltipForElement(element, rect.left + rect.width / 2, rect.top);
  });
  element.addEventListener("blur", hideCustomTooltip);
}

function showTooltipForElement(element, x, y) {
  const text = element.dataset.tooltip || element.title;
  if (!text) return;

  const tooltip = getCustomTooltipElement();
  tooltip.textContent = text;
  tooltip.hidden = false;
  const rect = tooltip.getBoundingClientRect();
  const left = clamp(x + 14, 8, window.innerWidth - rect.width - 8);
  const top = clamp(y + 16, 8, window.innerHeight - rect.height - 8);
  tooltip.style.transform = `translate(${left}px, ${top}px)`;
}

function getCustomTooltipElement() {
  let tooltip = document.querySelector("#customTooltip");
  if (tooltip) return tooltip;

  tooltip = document.createElement("div");
  tooltip.id = "customTooltip";
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  return tooltip;
}

function hideCustomTooltip() {
  const tooltip = document.querySelector("#customTooltip");
  if (tooltip) tooltip.hidden = true;
}

function togglePause(force = null) {
  if (!gameStarted || gameOver || gameWon) return;
  gamePaused = force ?? !gamePaused;
  keys.clear();
  miner.vx = 0;
  miner.vy = 0;
  const overlay = document.querySelector("#pauseOverlay");
  const buttonStatus = document.querySelector("#pauseButton strong");
  if (overlay) overlay.hidden = !gamePaused;
  if (buttonStatus) buttonStatus.textContent = gamePaused ? "On" : "P";
  setMessage(gamePaused ? "Paused." : "Resumed.");
}

function showRelicToast(type) {
  const toast = document.querySelector("#relicToast");
  if (!toast) return;
  hideRoomToast();

  document.querySelector("#relicToastTitle").textContent = relicDefs[type].label;
  document.querySelector("#relicToastDescription").textContent = relicDescriptions[type] ?? "Ancient relic recovered.";
  toast.hidden = false;
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");

  window.clearTimeout(relicToastTimer);
  relicToastTimer = window.setTimeout(() => {
    toast.hidden = true;
    toast.classList.remove("is-visible");
  }, 3600);
}

function hideRelicToast() {
  const toast = document.querySelector("#relicToast");
  if (!toast) return;
  window.clearTimeout(relicToastTimer);
  toast.hidden = true;
  toast.classList.remove("is-visible");
}

function triggerGameOver(cause = "miner") {
  if (gameOver) return;
  const droppedTreasure = treasureChest.carried && !treasureChest.delivered;
  if (droppedTreasure) releaseTreasureAt(treasureChest.x, treasureChest.y);
  finalGameOver = cause === "base";
  gameOver = true;
  gamePaused = false;
  gameOverTimer = 0;
  miner.health = 0;
  miner.vx = 0;
  miner.vy = 0;
  miner.x = BASE_CENTER_TILE_X * TILE;
  miner.y = BASE_TILE_Y * TILE;
  miner.facingX = 1;
  miner.facingY = 0;
  loseCarriedCargo();
  updateCamera();
  document.querySelector("#pauseOverlay").hidden = true;
  showGameOverOverlay(cause);
  if (!finalGameOver) updateHullBreachCooldown();
  setMessage(cause === "base" ? "Base destroyed. Game over." : droppedTreasure ? "Hull breached. Cargo lost. Treasure dropped." : "Hull breached. Cargo lost.");
}

function showGameOverOverlay(cause) {
  const isBaseDestroyed = cause === "base";
  const overlay = document.querySelector("#gameOverOverlay");
  const restartButton = document.querySelector("#restartButton");
  const countdown = document.querySelector("#breachCountdown");
  overlay.hidden = false;
  overlay.querySelector("p").textContent = isBaseDestroyed ? "Base destroyed" : "Cargo lost";
  overlay.querySelector("h2").textContent = isBaseDestroyed ? "Game Over" : "Hull Breached!";
  restartButton.hidden = !isBaseDestroyed;
  restartButton.style.display = isBaseDestroyed ? "" : "none";
  countdown.hidden = isBaseDestroyed;
  countdown.style.display = isBaseDestroyed ? "none" : "";
}

function updateHullBreachCooldown() {
  const remaining = Math.max(0, HULL_BREACH_COOLDOWN - gameOverTimer);
  document.querySelector("#breachCountdown").textContent = `${Math.ceil(remaining)}s`;
  if (remaining > 0) return;

  gameOver = false;
  gameOverTimer = 0;
  miner.health = miner.maxHealth;
  finalGameOver = false;
  document.querySelector("#gameOverOverlay").hidden = true;
  document.querySelector("#restartButton").hidden = true;
  document.querySelector("#restartButton").style.display = "none";
  document.querySelector("#breachCountdown").hidden = false;
  document.querySelector("#breachCountdown").style.display = "";
  setMessage("Hull patched. Launch when ready.");
}

function triggerWin() {
  if (gameWon) return;
  gameWon = true;
  treasureChest.carried = false;
  treasureChest.delivered = true;
  hideTreasureInstructions(true);
  miner.vx = 0;
  miner.vy = 0;
  document.querySelector("#gameOverOverlay").hidden = false;
  const foundTime = treasureChest.foundAt === null ? elapsedTime : treasureChest.foundAt;
  document.querySelector("#gameOverOverlay p").textContent =
    `Treasure found at ${formatElapsedTime(foundTime)} - recovered at ${formatElapsedTime(elapsedTime)}`;
  document.querySelector("#gameOverOverlay h2").textContent = "You've found the Treasure!";
  document.querySelector("#breachCountdown").textContent = "Victory";
  document.querySelector("#breachCountdown").hidden = false;
  document.querySelector("#breachCountdown").style.display = "";
  document.querySelector("#restartButton").hidden = true;
  document.querySelector("#restartButton").style.display = "none";
  setMessage(`Treasure recovered at ${formatElapsedTime(elapsedTime)}.`);
}

function loseCarriedCargo() {
  for (const type of Object.keys(cargo)) cargo[type] = 0;
  carried = 0;
}

function updateRelicHud(type) {
  const relic = relics[type];
  const row = document.querySelector(`[data-relic-row="${type}"]`);
  const button = document.querySelector(`[data-relic="${type}"]`);
  const status = document.querySelector(`#${type}Status`);
  const upgradeButton = document.querySelector(`[data-relic-upgrade="${type}"]`);
  const levelText = `Lv ${relic.level}`;

  if (!relic.unlocked) {
    status.textContent = "Locked";
    button.disabled = true;
    button.hidden = true;
    if (upgradeButton) {
      upgradeButton.disabled = true;
      upgradeButton.hidden = true;
    }
    if (row) row.hidden = true;
    return;
  }

  if (row) row.hidden = false;
  button.hidden = false;
  if (upgradeButton) upgradeButton.hidden = false;

  if (type === "blaster") {
    status.textContent = relic.overheat > 0 ? `${levelText} ${formatTime(relic.overheat)}` : `${levelText} ${Math.floor(relic.charge)}%`;
    button.disabled = true;
    return;
  }

  if (type === "mouse") {
    status.textContent = `${levelText} ${Math.ceil(mouseHelper.health)} / ${mouseHelper.maxHealth} hp`;
    button.disabled = true;
    return;
  }

  if (type === "dog") {
    status.textContent = `${levelText} ${dogHelper.carried} / ${dogHelper.maxCarry}, ${Math.ceil(dogHelper.health)} hp`;
    button.disabled = true;
    return;
  }

  if (type === "thirdEye") {
    status.textContent = `${levelText} ${getOpenRevealRadius()}x${getOpenRevealRadius()} reveal`;
    button.disabled = true;
    return;
  }

  if (type === "laserSword") {
    const rechargeText = relic.swings < getLaserSwordMaxSwings() ? `, +1 in ${formatTime(relic.recharge || LASER_SWORD_RECHARGE_TIME)}` : "";
    status.textContent = `${levelText} - ${relic.swings} / ${getLaserSwordMaxSwings()} swings${rechargeText}`;
    button.disabled = relic.swings <= 0;
    return;
  }

  if (type === "converter") {
    if (relic.cooldown > 0) {
      status.textContent = `${levelText} ${formatTime(relic.cooldown)}`;
      button.disabled = true;
    } else {
      status.textContent = isMinerAtBase() ? `${levelText} Convert` : `${levelText} Base`;
      button.disabled = !isMinerAtBase();
    }
    return;
  }

  if (type === "ansible") {
    status.textContent = `${levelText} Upgrade anywhere`;
    button.disabled = true;
    return;
  }

  if (type === "grenades") {
    const rechargeText = relic.charges < getGrenadeMaxCharges() ? `, +1 in ${formatTime(relic.recharge || GRENADE_RECHARGE_TIME)}` : "";
    status.textContent = `${levelText} ${relic.charges} / ${getGrenadeMaxCharges()}${rechargeText}`;
    button.disabled = relic.charges <= 0;
    return;
  }

  if (type === "soundDistorter") {
    status.textContent = `${levelText} +${getSoundDistorterDelay()}s waves`;
    button.disabled = true;
    return;
  }

  if (type === "alienCarapaceIntegrator") {
    status.textContent = `${levelText} +${getCarapaceIntegratorHullBonus()} hull`;
    button.disabled = true;
    return;
  }

  if (type === "alienGelRegenerator") {
    status.textContent = `${levelText} +${getAlienGelHealAmount()} heal`;
    button.disabled = true;
    return;
  }

  if (relic.active > 0) {
    status.textContent = `${levelText} ${Math.ceil(relic.active)}s active`;
    button.disabled = true;
    return;
  }

  if (relic.cooldown > 0) {
    status.textContent = `${levelText} ${formatTime(relic.cooldown)}`;
    button.disabled = true;
    return;
  }

  status.textContent = `${levelText} Ready`;
  button.disabled = false;
}

function updateRelicUpgradeHud(type, atBase) {
  const relic = relics[type];
  const row = document.querySelector(`[data-relic-row="${type}"]`);
  const button = document.querySelector(`[data-relic-upgrade="${type}"]`);
  const status = document.querySelector(`#${type}UpgradeCost`);
  if (!button || !status) return;

  if (!relic.unlocked) {
    if (row) row.hidden = true;
    button.hidden = true;
    button.disabled = true;
    status.textContent = "Locked";
    button.title = "";
    return;
  }

  button.hidden = false;
  button.title = getRelicUpgradeDescription(type);
  if (relic.level >= getRelicMaxLevel(type)) {
    status.textContent = `Lv ${relic.level} Max`;
    button.disabled = true;
    return;
  }

  const cost = getRelicUpgradeCost(type);
  const costText = `Lv ${relic.level + 1}\n${formatRecipe(cost)}`;
  status.textContent = costText;
  button.disabled = (!atBase && !relics.ansible.unlocked) || !canAfford(cost);
}

function toggleDebugMode(force) {
  debugMode = typeof force === "boolean" ? force : !debugMode;
  document.querySelector("#debugPanel").hidden = !debugMode;
  document.querySelector("#debugToggle strong").textContent = debugMode ? "On" : "Off";
  setMessage(debugMode ? "Debug mode enabled." : "Debug mode disabled.");
}

function debugGrantResources() {
  for (const type of Object.keys(resources)) resources[type] += 50;
  setMessage("Debug resources added.");
  updateHud();
}

function debugUpgrade(type) {
  if (miner.upgrades[type] >= MAX_UPGRADE_LEVEL) {
    setMessage(`${upgradeDefs[type].label} is already max level.`);
    updateHud();
    return;
  }
  applyUpgrade(type);
  increaseMaxHullFromUpgrade();
  setMessage(`Debug upgraded ${upgradeDefs[type].label}.`);
  updateHud();
}

function debugUnlockRelic(type) {
  unlockRelic(type);
  updateHud();
}

function debugUnlockAllRelics() {
  for (const type of Object.keys(relicDefs)) unlockRelic(type);
  setMessage("All relics unlocked.");
  updateHud();
}

function debugRepairHull() {
  miner.health = miner.maxHealth;
  setMessage("Hull fully repaired.");
  updateHud();
}

function debugSpawnMonster() {
  if (getActiveMonsterLimitCount() >= MAX_MONSTERS) {
    setMessage("Monster limit reached.");
    return;
  }

  const tile = getDebugMonsterSpawnTile();
  if (!tile) {
    setMessage("No open tile for debug monster.");
    return;
  }

  createMonster(tile);
}

function debugRevealRooms() {
  if (specialRooms.length === 0) {
    setMessage("No special rooms generated.");
    return;
  }

  for (const room of specialRooms) {
    revealAround(room.x, room.y, 2);
  }
  setMessage(`${specialRooms.length} special rooms revealed.`);
}

function debugRevealMap() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      revealedTiles.add(`${x},${y}`);
    }
  }
  setMessage("Entire map revealed.");
}

function debugCycleZoom() {
  cameraZoomIndex = (cameraZoomIndex + 1) % CAMERA_ZOOM_LEVELS.length;
  updateCamera();
  updateDebugZoomStatus();
  setMessage(`Zoom set to ${CAMERA_ZOOM_LEVELS[cameraZoomIndex]} blocks wide.`);
}

function updateDebugZoomStatus() {
  document.querySelector("#debugZoomStatus").textContent = `${CAMERA_ZOOM_LEVELS[cameraZoomIndex]}x`;
}

function getDebugMonsterSpawnTile() {
  const origin = {
    x: Math.floor(miner.x / TILE),
    y: Math.floor(miner.y / TILE),
  };
  for (let radius = 2; radius <= 8; radius++) {
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (Math.max(Math.abs(origin.x - x), Math.abs(origin.y - y)) !== radius) continue;
        if (!isMonsterOpenTile(x, y)) continue;
        return { x, y };
      }
    }
  }

  return getNearestMonsterOpenTile(origin, 14);
}

function formatTime(seconds) {
  const whole = Math.ceil(seconds);
  if (whole < 60) return `${whole}s`;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function formatElapsedTime(seconds) {
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function setMessage(text) {
  if (messageTimer > 0 && text.startsWith("Need")) return;
  document.querySelector("#messageLog").textContent = text;
  messageTimer = 1.1;
}

function setControllerStatus(text, status = "") {
  const element = document.querySelector("#controllerStatus");
  if (!element) return;
  element.textContent = text;
  element.classList.toggle("connected", status === "connected");
  element.classList.toggle("warning", status === "warning");
}

function unlockAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume();
  loadDigSound(audioContext);
  return audioContext;
}

function loadDigSound(ctx) {
  if (digSoundBuffer || digSoundLoading) return;
  digSoundLoading = fetch("assets/digging-dirt.mp3")
    .then((response) => response.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      digSoundBuffer = buffer;
      digSoundOffsets = getLoudDigSoundOffsets(buffer);
    })
    .catch(() => {
      digSoundLoading = null;
    });
}

function playDigSound(type = "hit") {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastDigSoundAt < 0.045) return;
  lastDigSoundAt = now;

  if (digSoundBuffer) {
    playDirtDigSample(ctx, type, now);
    return;
  }

  playSyntheticDigSound(ctx, type, now);
}

function playClinkSound() {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastDigSoundAt < 0.045) return;
  lastDigSoundAt = now;

  const duration = 0.24;
  const ping = ctx.createOscillator();
  const ring = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  ping.type = "triangle";
  ping.frequency.setValueAtTime(1180, now);
  ping.frequency.exponentialRampToValueAtTime(760, now + duration);
  ring.type = "sine";
  ring.frequency.setValueAtTime(1850, now);
  ring.frequency.exponentialRampToValueAtTime(1420, now + duration * 0.75);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1450, now);
  filter.Q.setValueAtTime(6.2, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  ping.connect(filter);
  ring.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  ping.start(now);
  ring.start(now);
  ping.stop(now + duration);
  ring.stop(now + duration * 0.75);
}

function playDirtDigSample(ctx, type, now) {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const sliceDuration = type === "break" ? 0.2 : 0.14;
  const maxOffset = Math.max(0, digSoundBuffer.duration - sliceDuration - 0.02);
  const offset = chooseDigSoundOffset(maxOffset);

  source.buffer = digSoundBuffer;
  source.playbackRate.setValueAtTime(type === "blocked" ? 1.9 : 1.7, now);
  filter.type = "highpass";
  filter.frequency.setValueAtTime(type === "blocked" ? 140 : 70, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(type === "break" ? 1.35 : 1.05, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + sliceDuration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now, offset, sliceDuration);
}

function getLoudDigSoundOffsets(buffer) {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.16));
  const stepSize = Math.max(1, Math.floor(sampleRate * 0.05));
  const windows = [];

  for (let start = 0; start + windowSize < channel.length; start += stepSize) {
    let sum = 0;
    for (let i = start; i < start + windowSize; i++) sum += Math.abs(channel[i]);
    windows.push({ offset: start / sampleRate, level: sum / windowSize });
  }

  if (windows.length === 0) return [0];
  windows.sort((a, b) => b.level - a.level);
  const loudest = windows[0].level;
  return windows
    .filter((window) => window.level >= loudest * 0.45)
    .slice(0, 24)
    .map((window) => window.offset);
}

function chooseDigSoundOffset(maxOffset) {
  const usableOffsets = digSoundOffsets.filter((offset) => offset <= maxOffset);
  if (usableOffsets.length === 0) return maxOffset > 0 ? Math.random() * maxOffset : 0;
  return usableOffsets[Math.floor(Math.random() * usableOffsets.length)];
}

function playSyntheticDigSound(ctx, type, now) {
  const duration = type === "break" ? 0.18 : 0.11;
  const samples = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const noiseBuffer = ctx.createBuffer(1, samples, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const fade = 1 - i / samples;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }

  const noise = ctx.createBufferSource();
  const crunchFilter = ctx.createBiquadFilter();
  const crunchGain = ctx.createGain();
  noise.buffer = noiseBuffer;
  crunchFilter.type = "bandpass";
  crunchFilter.frequency.setValueAtTime(type === "blocked" ? 960 : 520, now);
  crunchFilter.Q.setValueAtTime(type === "blocked" ? 3.6 : 2.4, now);
  crunchGain.gain.setValueAtTime(0.0001, now);
  crunchGain.gain.exponentialRampToValueAtTime(type === "break" ? 0.55 : 0.42, now + 0.008);
  crunchGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(crunchFilter);
  crunchFilter.connect(crunchGain);
  crunchGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration);
}

function playPoisonDamageSound() {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.58;
  const groan = ctx.createOscillator();
  const groanGain = ctx.createGain();
  const groanFilter = ctx.createBiquadFilter();

  groan.type = "sawtooth";
  groan.frequency.setValueAtTime(138, now);
  groan.frequency.exponentialRampToValueAtTime(62, now + duration);
  groanFilter.type = "lowpass";
  groanFilter.frequency.setValueAtTime(520, now);
  groanFilter.frequency.exponentialRampToValueAtTime(210, now + duration);
  groanGain.gain.setValueAtTime(0.0001, now);
  groanGain.gain.exponentialRampToValueAtTime(0.24, now + 0.045);
  groanGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  groan.connect(groanFilter);
  groanFilter.connect(groanGain);
  groanGain.connect(ctx.destination);
  groan.start(now);
  groan.stop(now + duration);

  const raspDuration = 0.22;
  const samples = Math.max(1, Math.floor(ctx.sampleRate * raspDuration));
  const raspBuffer = ctx.createBuffer(1, samples, ctx.sampleRate);
  const data = raspBuffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const fade = 1 - i / samples;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }

  const rasp = ctx.createBufferSource();
  const raspFilter = ctx.createBiquadFilter();
  const raspGain = ctx.createGain();
  rasp.buffer = raspBuffer;
  raspFilter.type = "bandpass";
  raspFilter.frequency.setValueAtTime(280, now);
  raspFilter.Q.setValueAtTime(1.8, now);
  raspGain.gain.setValueAtTime(0.0001, now);
  raspGain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
  raspGain.gain.exponentialRampToValueAtTime(0.0001, now + raspDuration);

  rasp.connect(raspFilter);
  raspFilter.connect(raspGain);
  raspGain.connect(ctx.destination);
  rasp.start(now);
  rasp.stop(now + raspDuration);
}

function playLaserSwordSound() {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.36;
  const hum = ctx.createOscillator();
  const shimmer = ctx.createOscillator();
  const humGain = ctx.createGain();
  const shimmerGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  hum.type = "sawtooth";
  hum.frequency.setValueAtTime(92, now);
  hum.frequency.exponentialRampToValueAtTime(155, now + 0.08);
  hum.frequency.exponentialRampToValueAtTime(108, now + duration);

  shimmer.type = "triangle";
  shimmer.frequency.setValueAtTime(370, now);
  shimmer.frequency.exponentialRampToValueAtTime(690, now + 0.1);
  shimmer.frequency.exponentialRampToValueAtTime(420, now + duration);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(540, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.08);
  filter.frequency.exponentialRampToValueAtTime(420, now + duration);
  filter.Q.setValueAtTime(2.8, now);

  humGain.gain.setValueAtTime(0.0001, now);
  humGain.gain.exponentialRampToValueAtTime(0.2, now + 0.025);
  humGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  shimmerGain.gain.setValueAtTime(0.0001, now);
  shimmerGain.gain.exponentialRampToValueAtTime(0.12, now + 0.018);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.72);

  hum.connect(filter);
  filter.connect(humGain);
  humGain.connect(ctx.destination);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(ctx.destination);

  hum.start(now);
  shimmer.start(now);
  hum.stop(now + duration);
  shimmer.stop(now + duration * 0.72);
}

function playMonsterScreamSound(monster) {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastMonsterScreamAt < 1.2) return;
  lastMonsterScreamAt = now;

  const duration = 1.05;
  const levelPitch = Math.max(0, Math.min(5, monster.level - 1)) * 2;
  const throat = ctx.createOscillator();
  const growl = ctx.createOscillator();
  const wobble = ctx.createOscillator();
  const wobbleGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  throat.type = "triangle";
  throat.frequency.setValueAtTime(54 + levelPitch, now);
  throat.frequency.exponentialRampToValueAtTime(39 + levelPitch, now + duration);
  growl.type = "sawtooth";
  growl.frequency.setValueAtTime(31 + levelPitch * 0.25, now);
  growl.frequency.exponentialRampToValueAtTime(24 + levelPitch * 0.18, now + duration);
  wobble.type = "sine";
  wobble.frequency.setValueAtTime(13, now);
  wobbleGain.gain.setValueAtTime(8, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(360, now);
  filter.frequency.exponentialRampToValueAtTime(170, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.56, now + 0.08);
  gain.gain.setValueAtTime(0.44, now + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  wobble.connect(wobbleGain);
  wobbleGain.connect(throat.frequency);
  wobbleGain.connect(growl.frequency);
  throat.connect(filter);
  growl.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  wobble.start(now);
  throat.start(now);
  growl.start(now);
  wobble.stop(now + duration);
  throat.stop(now + duration);
  growl.stop(now + duration);

  const raspDuration = 0.96;
  const samples = Math.max(1, Math.floor(ctx.sampleRate * raspDuration));
  const raspBuffer = ctx.createBuffer(1, samples, ctx.sampleRate);
  const data = raspBuffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const progress = i / samples;
    const attack = Math.min(1, progress / 0.08);
    const release = Math.max(0, 1 - Math.max(0, progress - 0.48) / 0.52);
    data[i] = (Math.random() * 2 - 1) * attack * release;
  }

  const rasp = ctx.createBufferSource();
  const raspFilter = ctx.createBiquadFilter();
  const raspGain = ctx.createGain();
  rasp.buffer = raspBuffer;
  rasp.playbackRate.setValueAtTime(0.75, now);
  raspFilter.type = "lowpass";
  raspFilter.frequency.setValueAtTime(620, now);
  raspFilter.frequency.exponentialRampToValueAtTime(230, now + raspDuration);
  raspFilter.Q.setValueAtTime(0.8, now);
  raspGain.gain.setValueAtTime(0.0001, now);
  raspGain.gain.exponentialRampToValueAtTime(0.5, now + 0.08);
  raspGain.gain.exponentialRampToValueAtTime(0.0001, now + raspDuration);
  rasp.connect(raspFilter);
  raspFilter.connect(raspGain);
  raspGain.connect(ctx.destination);
  rasp.start(now + 0.05);
  rasp.stop(now + 0.05 + raspDuration);
}

function playMonsterDeathScreamSound(monster) {
  const ctx = unlockAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  if (now - lastMonsterDeathScreamAt < 0.35) return;
  lastMonsterDeathScreamAt = now;

  const duration = 1.05;
  const levelPitch = Math.max(0, Math.min(5, monster.level - 1)) * 12;
  const scream = ctx.createOscillator();
  const squeal = ctx.createOscillator();
  const throat = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const throatFilter = ctx.createBiquadFilter();
  const throatGain = ctx.createGain();

  scream.type = "sawtooth";
  scream.frequency.setValueAtTime(760 + levelPitch, now);
  scream.frequency.exponentialRampToValueAtTime(1180 + levelPitch, now + 0.11);
  scream.frequency.exponentialRampToValueAtTime(360 + levelPitch * 0.35, now + duration);
  squeal.type = "triangle";
  squeal.frequency.setValueAtTime(1180 + levelPitch, now);
  squeal.frequency.exponentialRampToValueAtTime(1640 + levelPitch, now + 0.08);
  squeal.frequency.exponentialRampToValueAtTime(620 + levelPitch * 0.4, now + duration * 0.7);
  throat.type = "sawtooth";
  throat.frequency.setValueAtTime(82 + levelPitch * 0.15, now);
  throat.frequency.exponentialRampToValueAtTime(38 + levelPitch * 0.08, now + duration);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1050, now);
  filter.frequency.exponentialRampToValueAtTime(620, now + duration);
  filter.Q.setValueAtTime(5.5, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  throatFilter.type = "lowpass";
  throatFilter.frequency.setValueAtTime(440, now);
  throatFilter.frequency.exponentialRampToValueAtTime(150, now + duration);
  throatFilter.Q.setValueAtTime(1.4, now);
  throatGain.gain.setValueAtTime(0.0001, now);
  throatGain.gain.exponentialRampToValueAtTime(0.24, now + 0.035);
  for (const [time, volume] of [
    [0.13, 0.09],
    [0.19, 0.25],
    [0.3, 0.07],
    [0.37, 0.22],
    [0.49, 0.08],
    [0.57, 0.18],
  ]) {
    throatGain.gain.linearRampToValueAtTime(volume, now + time);
  }
  throatGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  scream.connect(filter);
  squeal.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  throat.connect(throatFilter);
  throatFilter.connect(throatGain);
  throatGain.connect(ctx.destination);
  scream.start(now);
  squeal.start(now);
  throat.start(now);
  scream.stop(now + duration);
  squeal.stop(now + duration * 0.7);
  throat.stop(now + duration);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showDamageSampleOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "damageSampleOverlay";
  overlay.style.cssText = [
    "position:fixed",
    "right:18px",
    "top:18px",
    "z-index:20",
    "width:292px",
    "padding:10px",
    "border:1px solid #5a6b74",
    "border-radius:8px",
    "background:rgba(17,20,23,.96)",
    "box-shadow:0 12px 40px rgba(0,0,0,.35)",
    "color:#f4f0e8",
    "font:12px system-ui",
  ].join(";");
  overlay.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <strong>Block damage sample</strong>
      <button type="button" aria-label="Close damage sample" style="border:1px solid #40505b;border-radius:6px;background:#263037;color:#f4f0e8;cursor:pointer;">x</button>
    </div>
    <canvas width="272" height="74" style="width:272px;height:74px;image-rendering:pixelated;background:#08090a;border:1px solid #303a40;"></canvas>
  `;
  document.body.appendChild(overlay);

  const sampleCanvas = overlay.querySelector("canvas");
  const sampleCtx = sampleCanvas.getContext("2d");
  const closeButton = overlay.querySelector("button");
  let frame = 0;
  let animationId = 0;

  closeButton.addEventListener("click", () => {
    cancelAnimationFrame(animationId);
    overlay.remove();
  });

  function animateSample() {
    const activeStage = Math.floor(frame / 34) % 6;
    sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);

    for (let stage = 0; stage < 5; stage++) {
      const x = 12 + stage * 52;
      const y = 16;
      sampleCtx.fillStyle = "#6c5640";
      sampleCtx.fillRect(x, y, TILE, TILE);
      sampleCtx.strokeStyle = "rgba(0,0,0,.36)";
      sampleCtx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      paintBlockDamagePixels(sampleCtx, x, y, Math.min(stage, activeStage));
      sampleCtx.fillStyle = "#cf7a43";
      sampleCtx.beginPath();
      sampleCtx.arc(x + 10, y + 11, 3.5, 0, Math.PI * 2);
      sampleCtx.arc(x + 22, y + 21, 4.5, 0, Math.PI * 2);
      sampleCtx.fill();
      sampleCtx.fillStyle = "#b9c6c9";
      sampleCtx.font = "8px system-ui";
      sampleCtx.fillText(`stage ${stage + 1}`, x - 1, y + 46);
    }

    if (activeStage >= 5) {
      const x = 12 + 4 * 52;
      sampleCtx.fillStyle = "#08090a";
      sampleCtx.fillRect(x, 16, TILE, TILE);
      sampleCtx.fillStyle = "#ffdf74";
      sampleCtx.font = "9px system-ui";
      sampleCtx.fillText("destroyed", x - 4, 68);
    }

    frame += 1;
    animationId = requestAnimationFrame(animateSample);
  }

  animateSample();
}

function updateGamepadInput(dt = 1 / 60) {
  const gamepads = navigator.getGamepads?.() ?? [];
  const gamepadList = [...gamepads];
  let gamepad = gamepadState.index !== null ? gamepads[gamepadState.index] : null;
  if (!gamepad) {
    gamepad = gamepadList.find(Boolean) ?? null;
    if (gamepadState.index !== (gamepad?.index ?? null)) {
      gamepadState.previousButtons = [];
      gamepadState.previousNavDirection = 0;
    }
    gamepadState.index = gamepad?.index ?? null;
  }

  if (!gamepad) {
    updateControllerScanStatus(gamepadList, dt);
    if (gamepadState.connected) {
      setMessage("Controller disconnected.");
      setControllerStatus("Controller disconnected. Press A or D-pad after clicking the game.", "warning");
    }
    gamepadState.connected = false;
    gamepadState.axes.x = 0;
    gamepadState.axes.y = 0;
    hideGamepadCursor();
    gamepadState.blasterHeld = false;
    return;
  }

  if (!gamepadState.connected) {
    setMessage("Controller detected by browser.");
    setControllerStatus("Controller detected. Use D-pad to select, A to choose.", "connected");
  }
  gamepadState.connected = true;
  gamepadState.axes = getGamepadMoveAxes(gamepad);
  updateControllerInputStatus(gamepad, dt);
  updateGamepadCursor(gamepad, dt);
  updateControllerSelection(gamepad, dt);
  gamepadState.blasterHeld = isGamepadButtonHeld(gamepad, 2);

  gamepad.buttons.forEach((button, index) => {
    const pressed = button.pressed || button.value > 0.55;
    if (pressed && !gamepadState.previousButtons[index]) handleGamepadButtonPressed(index);
    gamepadState.previousButtons[index] = pressed;
  });
  gamepadState.previousButtons.length = gamepad.buttons.length;
}

function updateControllerScanStatus(gamepads, dt) {
  if (gameStarted) return;
  gamepadState.scanStatusCooldown = Math.max(0, gamepadState.scanStatusCooldown - dt);
  if (gamepadState.scanStatusCooldown > 0) return;

  const slots = gamepads.length;
  const occupied = gamepads.filter(Boolean).length;
  const apiStatus = typeof navigator.getGamepads === "function" ? `${occupied} / ${slots}` : "not available";
  setControllerStatus(`Waiting for controller input. Gamepad slots: ${apiStatus}.`, "warning");
  gamepadState.scanStatusCooldown = GAMEPAD_SCAN_STATUS_INTERVAL;
}

function focusGameSurface() {
  canvas.focus({ preventScroll: true });
}

function updateControllerInputStatus(gamepad, dt) {
  gamepadState.inputStatusCooldown = Math.max(0, gamepadState.inputStatusCooldown - dt);
  if (gamepadState.inputStatusCooldown > 0) return;

  const pressedIndex = gamepad.buttons.findIndex((button) => button.pressed || button.value > 0.55);
  if (pressedIndex >= 0) {
    setControllerStatus(`Controller input: button ${pressedIndex}.`, "connected");
    gamepadState.inputStatusCooldown = GAMEPAD_INPUT_STATUS_INTERVAL;
    return;
  }

  const activeAxisIndex = gamepad.axes.findIndex((axis) => Math.abs(axis) > GAMEPAD_NAV_AXIS_THRESHOLD);
  if (activeAxisIndex >= 0) {
    const value = gamepad.axes[activeAxisIndex];
    setControllerStatus(`Controller input: axis ${activeAxisIndex} ${value.toFixed(2)}.`, "connected");
    gamepadState.inputStatusCooldown = GAMEPAD_INPUT_STATUS_INTERVAL;
  }
}

function updateGamepadCursor(gamepad, dt) {
  if (!gamepadState.cursor.initialized) {
    const panel = document.querySelector(".panel");
    const rect = panel?.getBoundingClientRect();
    gamepadState.cursor.x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    gamepadState.cursor.y = rect ? rect.top + Math.min(140, rect.height / 2) : window.innerHeight / 2;
    gamepadState.cursor.centerX = gamepad.axes[2] ?? 0;
    gamepadState.cursor.centerY = gamepad.axes[3] ?? 0;
    gamepadState.cursor.initialized = true;
  }

  const rightStickX = getRightStickAxis(gamepad, "x");
  const rightStickY = getRightStickAxis(gamepad, "y");
  calibrateRestingGamepadCursorAxis(rightStickX, rightStickY);
  const moveX = applyGamepadDeadzone(rightStickX - gamepadState.cursor.centerX, GAMEPAD_CURSOR_DEADZONE);
  const moveY = applyGamepadDeadzone(rightStickY - gamepadState.cursor.centerY, GAMEPAD_CURSOR_DEADZONE);
  if (moveX === 0 && moveY === 0 && !gamepadState.cursor.active) return;

  gamepadState.cursor.active = true;
  gamepadState.cursor.x = clamp(gamepadState.cursor.x + moveX * GAMEPAD_CURSOR_SPEED * dt, 0, window.innerWidth - 1);
  gamepadState.cursor.y = clamp(gamepadState.cursor.y + moveY * GAMEPAD_CURSOR_SPEED * dt, 0, window.innerHeight - 1);

  const cursor = getGamepadCursorElement();
  cursor.hidden = false;
  cursor.style.transform = `translate(${gamepadState.cursor.x}px, ${gamepadState.cursor.y}px)`;
  updateVirtualHover();
}

function isGamepadPanelScrollContext(panel = document.querySelector(".panel")) {
  if (!panel) return false;
  if (gamepadState.cursor.active && isVirtualCursorOverElement(panel)) return true;
  return !!gamepadState.selectedElement?.closest(".panel");
}

function isVirtualCursorOverElement(element) {
  const rect = element.getBoundingClientRect();
  return gamepadState.cursor.x >= rect.left
    && gamepadState.cursor.x <= rect.right
    && gamepadState.cursor.y >= rect.top
    && gamepadState.cursor.y <= rect.bottom;
}

function calibrateRestingGamepadCursorAxis(rightStickX, rightStickY) {
  if (gamepadState.cursor.active) return;
  const deltaX = rightStickX - gamepadState.cursor.centerX;
  const deltaY = rightStickY - gamepadState.cursor.centerY;
  const looksLikePinnedY = Math.abs(deltaX) < 0.08 && Math.abs(rightStickY) >= GAMEPAD_CURSOR_PINNED_AXIS_THRESHOLD && Math.abs(deltaY) > 0.5;
  if (looksLikePinnedY) gamepadState.cursor.centerY = rightStickY;
}

function getRightStickAxis(gamepad, axis) {
  const primaryIndex = axis === "x" ? 2 : 3;
  const fallbackIndex = axis === "x" ? 4 : 5;
  const primary = gamepad.axes[primaryIndex];
  if (typeof primary === "number") return primary;
  return gamepad.axes[fallbackIndex] ?? 0;
}

function getGamepadCursorElement() {
  let cursor = document.querySelector("#gamepadCursor");
  if (cursor) return cursor;

  cursor = document.createElement("div");
  cursor.id = "gamepadCursor";
  cursor.hidden = true;
  document.body.appendChild(cursor);
  return cursor;
}

function hideGamepadCursor() {
  const cursor = document.querySelector("#gamepadCursor");
  if (cursor) cursor.hidden = true;
  gamepadState.cursor.active = false;
  clearVirtualHover();
}

function updateVirtualHover() {
  const cursor = document.querySelector("#gamepadCursor");
  if (cursor) cursor.style.pointerEvents = "none";
  const element = getVirtualCursorTarget();
  if (element === gamepadState.hoveredElement) {
    if (element) showTooltipForElement(element, gamepadState.cursor.x, gamepadState.cursor.y);
    return;
  }

  clearVirtualHover();
  if (!element) return;

  gamepadState.hoveredElement = element;
  element.classList.add("is-gamepad-hovered");
  showTooltipForElement(element, gamepadState.cursor.x, gamepadState.cursor.y);
}

function getVirtualCursorTarget() {
  const element = document
    .elementFromPoint(gamepadState.cursor.x, gamepadState.cursor.y)
    ?.closest("button, select, label, [data-tooltip], [title]");
  if (element?.tagName === "LABEL" && element.htmlFor) return document.getElementById(element.htmlFor) ?? element;
  return element;
}

function clearVirtualHover() {
  if (gamepadState.hoveredElement) gamepadState.hoveredElement.classList.remove("is-gamepad-hovered");
  gamepadState.hoveredElement = null;
  hideCustomTooltip();
}

function updateControllerSelection(gamepad, dt) {
  if (gameOver) return;

  gamepadState.navCooldown = Math.max(0, gamepadState.navCooldown - dt);
  const direction = getDpadNavigationDirection(gamepad);
  if (gamepadState.openSelect) {
    if (direction !== 0 && gamepadState.previousNavDirection === 0 && gamepadState.navCooldown <= 0) {
      moveOpenSelectOption(direction);
      gamepadState.navCooldown = 0.22;
    }
    gamepadState.previousNavDirection = direction;
    return;
  }

  if (!gamepadState.selectedElement) selectControllerItem(0);
  if (direction !== 0 && gamepadState.previousNavDirection === 0 && gamepadState.navCooldown <= 0) {
    moveControllerSelection(direction);
    gamepadState.navCooldown = 0.22;
  }
  gamepadState.previousNavDirection = direction;
}

function getDpadNavigationDirection(gamepad) {
  if (isGamepadButtonHeld(gamepad, 13)) return 1;
  if (isGamepadButtonHeld(gamepad, 12)) return -1;

  if (!gameStarted) {
    const leftStickY = gamepad.axes[1];
    if (typeof leftStickY === "number") {
      if (leftStickY > GAMEPAD_NAV_AXIS_THRESHOLD) return 1;
      if (leftStickY < -GAMEPAD_NAV_AXIS_THRESHOLD) return -1;
    }
  }

  const verticalHat = gamepad.axes[7];
  if (typeof verticalHat === "number") {
    if (verticalHat > GAMEPAD_NAV_AXIS_THRESHOLD) return 1;
    if (verticalHat < -GAMEPAD_NAV_AXIS_THRESHOLD) return -1;
  }

  const encodedHat = gamepad.axes[9];
  if (typeof encodedHat === "number") {
    if (encodedHat >= -0.25 && encodedHat <= 0.45) return 1;
    if (encodedHat <= -0.65 || encodedHat >= 0.95) return -1;
  }

  return 0;
}

function getControllerSelectableElements() {
  if (!gameStarted) {
    return ["#stageOneIntroContinue", "#startGameButton", "#startModeSelect", "#startWorldSizeSelect"]
      .map((selector) => document.querySelector(selector))
      .filter((element) => element && !element.hidden && !element.closest("[hidden]") && element.offsetParent !== null);
  }

  return [...document.querySelectorAll(".panel button, .panel select")]
    .filter((element) => !element.hidden && !element.closest("[hidden]") && element.offsetParent !== null);
}

function selectControllerItem(index) {
  const elements = getControllerSelectableElements();
  if (elements.length === 0) {
    clearControllerSelection();
    return;
  }

  const wrappedIndex = (index + elements.length) % elements.length;
  clearControllerSelection();
  const element = elements[wrappedIndex];
  gamepadState.selectedIndex = wrappedIndex;
  gamepadState.selectedElement = element;
  element.classList.add("is-controller-selected");
  scrollPanelToControllerSelection(element);
}

function scrollPanelToControllerSelection(element) {
  const panel = element.closest(".panel-scroll-content");
  if (!panel) return;

  const panelRect = panel.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const padding = 8;
  if (elementRect.top < panelRect.top + padding) {
    panel.scrollTop -= panelRect.top + padding - elementRect.top;
  } else if (elementRect.bottom > panelRect.bottom - padding) {
    panel.scrollTop += elementRect.bottom - (panelRect.bottom - padding);
  }
}

function moveControllerSelection(direction) {
  selectControllerItem(gamepadState.selectedIndex + direction);
}

function clearControllerSelection() {
  if (gamepadState.selectedElement) gamepadState.selectedElement.classList.remove("is-controller-selected");
  gamepadState.selectedElement = null;
  clearOpenSelect();
  hideCustomTooltip();
}

function activateControllerSelection() {
  const element = gamepadState.selectedElement;
  if (!element || element.disabled) return false;
  return activateControllerElement(element);
}

function activateVirtualCursorTarget() {
  if (!gamepadState.cursor.active) return false;
  const element = getVirtualCursorTarget();
  if (!element || element.disabled || !element.matches("button, select")) return false;
  return activateControllerElement(element);
}

function activateControllerElement(element) {
  if (element.tagName === "SELECT") {
    openControllerSelect(element);
    return true;
  }
  clearOpenSelect();
  element.click();
  return true;
}

function openControllerSelect(select) {
  clearOpenSelect();
  gamepadState.openSelect = select;
  select.classList.add("is-controller-open");
  select.focus({ preventScroll: true });
  setMessage(`Use D-pad to choose ${select.id === "startModeSelect" ? "a stage" : "area size"}, then move to Start and press A.`);
}

function clearOpenSelect() {
  if (gamepadState.openSelect) gamepadState.openSelect.classList.remove("is-controller-open");
  gamepadState.openSelect = null;
}

function moveOpenSelectOption(direction) {
  const select = gamepadState.openSelect;
  if (!select || select.disabled) {
    clearOpenSelect();
    return;
  }
  const options = [...select.options];
  if (options.length === 0) return;
  select.selectedIndex = (select.selectedIndex + direction + options.length) % options.length;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function getGamepadMoveAxes(gamepad) {
  let x = applyGamepadDeadzone(gamepad.axes[0] ?? 0);
  let y = applyGamepadDeadzone(gamepad.axes[1] ?? 0);
  const length = Math.hypot(x, y);
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

function applyGamepadDeadzone(value, deadzone = GAMEPAD_DEADZONE) {
  return Math.abs(value) < deadzone ? 0 : value;
}

function getGamepadButtonValue(gamepad, index) {
  return gamepad.buttons[index]?.value ?? 0;
}

function isGamepadButtonHeld(gamepad, index) {
  return !!gamepad.buttons[index]?.pressed || getGamepadButtonValue(gamepad, index) > 0.55;
}

function isAnyGamepadButtonHeld(gamepad, indexes) {
  return indexes.some((index) => isGamepadButtonHeld(gamepad, index));
}

function handleGamepadButtonPressed(index) {
  unlockAudio();
  if (!gameStarted) {
    if ([0, 1, 2, 3, 9].includes(index)) {
      if (index === 9) {
        clickPrimaryStartAction();
        return;
      }
      if (index === 0 && gamepadState.openSelect && !getVirtualCursorTarget()?.matches("button")) {
        clearOpenSelect();
        moveControllerSelection(1);
        return;
      }
      if (index === 0 && activateVirtualCursorTarget()) return;
      if (activateControllerSelection()) return;
      clickPrimaryStartAction();
    }
    return;
  }
  if (index === 9 && !gameOver && !gameWon) {
    togglePause();
    return;
  }
  if (gameOver && finalGameOver) {
    if (index === 0 || index === 9) document.querySelector("#restartButton")?.click();
    return;
  }
  if (gameOver) return;
  if (gamePaused) {
    if (index === 0) activateVirtualCursorTarget();
    return;
  }

  if ((index === 4 || index === 5) && isGamepadPanelScrollContext()) {
    moveControllerSelection(index === 4 ? -1 : 1);
    return;
  }
  if (index === 0) {
    if (activateVirtualCursorTarget()) return;
    if (activateControllerSelection()) return;
    toggleTreasureCarry();
  }
  if (index === 1) activateRelic("bomb");
  if (index === 3) swingLaserSword();
  if (index === 4) activateRelic("impact");
  if (index === 6) activateRelic("flare");
  if (index === 7) activateRelic("grenades");
  if (index === 8) activateRelic("magnet");
  if (index === 10) activateRelic("speed");
  if (index === 11) activateRelic("rocket");
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  focusGameSurface();
  unlockAudio();
  if (!gameStarted) {
    if (event.key === "Enter") clickPrimaryStartAction();
    return;
  }
  if (event.key === " ") event.preventDefault();
  if (event.key.toLowerCase() === "p" && !event.repeat) {
    togglePause();
    return;
  }
  if (gamePaused) return;
  keys.add(event.key.toLowerCase());
  if (event.key.toLowerCase() === "r" && !event.repeat) swingLaserSword();
  if (event.key.toLowerCase() === "e") toggleTreasureCarry();
  if (event.key === "`" || event.key === "F10") toggleDebugMode();
  if (event.key === "1") activateRelic("impact");
  if (event.key === "2") activateRelic("speed");
  if (event.key === "3") activateRelic("flare");
  if (event.key === "4") activateRelic("bomb");
  if (event.key === "5") activateRelic("radiation");
  if (event.key === "6") activateRelic("rocket");
  if (event.key === "7") activateRelic("magnet");
  if (event.key === "8") activateRelic("converter");
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("gamepadconnected", (event) => {
  gamepadState.index = event.gamepad.index;
  gamepadState.connected = true;
  gamepadState.previousButtons = [];
  gamepadState.cursor.initialized = false;
  gamepadState.cursor.active = false;
  gamepadState.previousNavDirection = 0;
  setControllerStatus("Controller detected. Use D-pad to select, A to choose.", "connected");
  setMessage("Controller connected.");
});

window.addEventListener("gamepaddisconnected", (event) => {
  if (gamepadState.index !== event.gamepad.index) return;
  gamepadState.index = null;
  gamepadState.connected = false;
  gamepadState.axes = { x: 0, y: 0 };
  gamepadState.blasterHeld = false;
  gamepadState.previousButtons = [];
  gamepadState.cursor.initialized = false;
  gamepadState.cursor.active = false;
  gamepadState.previousNavDirection = 0;
  clearControllerSelection();
  setControllerStatus("Controller disconnected. Press A or D-pad after clicking the game.", "warning");
  setMessage("Controller disconnected.");
});

canvas.addEventListener("mousemove", updateTreasureHover);
canvas.addEventListener("mouseleave", () => {
  treasureChest.hover = false;
  canvas.style.cursor = "";
});
canvas.addEventListener("click", (event) => {
  focusGameSurface();
  unlockAudio();
  updateTreasureHover(event);
  if (treasureChest.hover) tryPickupTreasure();
});
document.addEventListener(
  "pointerdown",
  (event) => {
    if (event.target instanceof Element && event.target.closest("input, select, textarea")) return;
    focusGameSurface();
  },
  { passive: true }
);

document.querySelector("#treasureBubbleClose").addEventListener("click", () => hideTreasureInstructions(true));
document.querySelector("#restartButton").addEventListener("click", () => window.location.reload());
document.querySelector("#resumeButton").addEventListener("click", () => togglePause(false));
document.querySelector("#pauseButton").addEventListener("click", () => togglePause());
document.querySelector("[data-repair-base]").addEventListener("click", repairBase);

document.querySelectorAll(".upgrade").forEach((button) => {
  if (button.dataset.upgrade) {
    button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade));
  }
});

document.querySelectorAll("[data-relic]").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (event.shiftKey) {
      upgradeRelic(button.dataset.relic);
    } else {
      activateRelic(button.dataset.relic);
    }
  });
});

document.querySelectorAll("[data-relic-upgrade]").forEach((button) => {
  button.addEventListener("click", () => upgradeRelic(button.dataset.relicUpgrade));
});

document.querySelector("#debugToggle").addEventListener("click", () => toggleDebugMode());

document.querySelectorAll("[data-debug]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.debug === "resources") debugGrantResources();
    if (button.dataset.debug === "repair") debugRepairHull();
    if (button.dataset.debug === "monster") debugSpawnMonster();
    if (button.dataset.debug === "allRelics") debugUnlockAllRelics();
    if (button.dataset.debug === "rooms") debugRevealRooms();
    if (button.dataset.debug === "map") debugRevealMap();
    if (button.dataset.debug === "zoom") debugCycleZoom();
  });
});

document.querySelectorAll("[data-debug-upgrade]").forEach((button) => {
  button.addEventListener("click", () => debugUpgrade(button.dataset.debugUpgrade));
});

document.querySelectorAll("[data-debug-relic]").forEach((button) => {
  button.addEventListener("click", () => debugUnlockRelic(button.dataset.debugRelic));
});

setupWorldSizeSelect();
setupStartOverlay();
setupPanelMinimizeControls();
setupItemTooltips();
updateDebugZoomStatus();
updateHud();
if (new URLSearchParams(window.location.search).has("damageSample") || window.location.hash.includes("damageSample")) {
  showDamageSampleOverlay();
}
requestAnimationFrame(loop);
