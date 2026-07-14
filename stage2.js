"use strict";

const canvas = document.querySelector("#stageTwoCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  startOverlay: document.querySelector("#stageTwoStartOverlay"),
  pauseOverlay: document.querySelector("#stageTwoPauseOverlay"),
  gameOverOverlay: document.querySelector("#stageTwoGameOverOverlay"),
  startButton: document.querySelector("#stageTwoStartButton"),
  resumeButton: document.querySelector("#stageTwoResumeButton"),
  restartButton: document.querySelector("#stageTwoRestartButton"),
  endlessButton: document.querySelector("#stageTwoEndlessButton"),
  intermission: document.querySelector("#waveIntermission"),
  intermissionTitle: document.querySelector("#waveIntermissionTitle"),
  nextWaveButton: document.querySelector("#nextWaveButton"),
  controllerStatus: document.querySelector("#stageTwoControllerStatus"),
  debris: document.querySelector("#debrisStat"),
  carapaces: document.querySelector("#carapaceStat"),
  wave: document.querySelector("#waveStat"),
  baseHp: document.querySelector("#baseHpStat"),
  intermissionBaseHp: document.querySelector("#intermissionBaseHp"),
  intermissionDebris: document.querySelector("#intermissionDebris"),
  intermissionCarapaces: document.querySelector("#intermissionCarapaces"),
  intermissionUpgradeDescription: document.querySelector("#intermissionUpgradeDescription"),
  weapon: document.querySelector("#weaponStat"),
  damageLevel: document.querySelector("#damageLevelStat"),
  reloadLevel: document.querySelector("#reloadLevelStat"),
  coolingLevel: document.querySelector("#coolingLevelStat"),
  driveLevel: document.querySelector("#driveLevelStat"),
  targetingLevel: document.querySelector("#targetingLevelStat"),
  defenseLevel: document.querySelector("#defenseLevelStat"),
  damageCost: document.querySelector("#damageCost"),
  reloadCost: document.querySelector("#reloadCost"),
  coolingCost: document.querySelector("#coolingCost"),
  driveCost: document.querySelector("#driveCost"),
  targetingCost: document.querySelector("#targetingCost"),
  defenseCost: document.querySelector("#defenseCost"),
  repairCost: document.querySelector("#repairCost"),
  upgradeWindow: document.querySelector("#stageTwoUpgradeWindow"),
  activeRelics: document.querySelector("#stageTwoActiveRelics"),
  primaryWeaponBranchName: document.querySelector("#primaryWeaponBranchName"),
  primaryWeaponUpgradeButton: document.querySelector("#primaryWeaponUpgradeButton"),
  primaryWeaponUpgradeName: document.querySelector("#primaryWeaponUpgradeName"),
  primaryWeaponUpgradeCost: document.querySelector("#primaryWeaponUpgradeCost"),
  homingWeaponStatus: document.querySelector("#homingWeaponStatus"),
  flakWeaponStatus: document.querySelector("#flakWeaponStatus"),
  empWeaponStatus: document.querySelector("#empWeaponStatus"),
  railgunWeaponStatus: document.querySelector("#railgunWeaponStatus"),
  gravityWeaponStatus: document.querySelector("#gravityWeaponStatus"),
  dronesWeaponStatus: document.querySelector("#dronesWeaponStatus"),
  relicNotification: document.querySelector("#stageTwoRelicNotification"),
  relicNotificationName: document.querySelector("#stageTwoRelicNotificationName"),
  relicNotificationControl: document.querySelector("#stageTwoRelicNotificationControl"),
  relicPathOverlay: document.querySelector("#stageTwoRelicPathOverlay"),
  relicPathTitle: document.querySelector("#stageTwoRelicPathTitle"),
  relicPathAName: document.querySelector("#stageTwoRelicPathAName"),
  relicPathADescription: document.querySelector("#stageTwoRelicPathADescription"),
  relicPathBName: document.querySelector("#stageTwoRelicPathBName"),
  relicPathBDescription: document.querySelector("#stageTwoRelicPathBDescription"),
  message: document.querySelector("#stageTwoMessageLog"),
  endEyebrow: document.querySelector("#stageTwoEndEyebrow"),
  endTitle: document.querySelector("#stageTwoEndTitle"),
  finalWave: document.querySelector("#stageTwoFinalWave"),
};

ui.intermission.append(ui.upgradeWindow);

const keys = new Set();
const bullets = [];
const missiles = [];
const missileSalvoQueue = [];
const flakShells = [];
const flakSalvoQueue = [];
const flakBlasts = [];
const empPulses = [];
const railBeams = [];
const railPulseQueue = [];
const mines = [];
const gravityWells = [];
const lightningArcs = [];
const drones = [];
const droneShots = [];
const enemies = [];
const enemyBombs = [];
const debris = [];
const specialDrops = [];
const sparks = [];
let relicNotificationTimer = 0;

const state = {
  started: false,
  paused: false,
  over: false,
  victory: false,
  endlessMode: false,
  endSelectionIndex: 0,
  intermission: false,
  relicChoiceType: null,
  relicChoiceIndex: 0,
  relicChoiceQueue: [],
  lastTime: 0,
  wave: 1,
  waveRest: 2.5,
  spawnTimer: 0,
  enemiesQueued: 0,
  bossPending: false,
  debris: 0,
  carapaces: 0,
  relicPity: 0,
  messageTimer: 0,
  base: { x: canvas.width / 2, y: canvas.height - 58, width: 340, hp: 300, maxHp: 300 },
  turret: {
    x: canvas.width / 2,
    y: canvas.height - 92,
    aimX: 0,
    aimY: -1,
    heat: 0,
    cooldown: 0,
  },
  upgrades: { damage: 1, reload: 1, cooling: 1, drive: 1, targeting: 1, defense: 1 },
  defense: { repairTimer: 0, shieldReady: true, artifactShieldReady: true },
  homing: { unlocked: false, chosenPath: null, level: 1, pathA: 0, pathB: 0, cooldown: 0 },
  flak: { unlocked: false, chosenPath: null, level: 1, pathA: 0, pathB: 0, cooldown: 0 },
  emp: { unlocked: false, chosenPath: null, level: 1, pathA: 0, pathB: 0, cooldown: 0 },
  railgun: { unlocked: false, chosenPath: null, level: 1, pathA: 0, pathB: 0, cooldown: 0 },
  gravity: { unlocked: false, chosenPath: null, level: 1, pathA: 0, pathB: 0, cooldown: 0 },
  drones: { unlocked: false, chosenPath: null, level: 1, pathA: 0, pathB: 0, cooldown: 0, foundryTimer: 18, interceptTimer: 0 },
  spread: { unlocked: false, chosenPath: null, level: 1, pathA: 0, pathB: 0 },
  seeker: { unlocked: false, chosenPath: null, level: 1, pathA: 0, pathB: 0 },
  weaponCore: { unlocked: false },
  primaryWeapon: { type: "cannon", level: 0 },
  weaponChoiceOptions: [],
  upgradeSelectionActive: false,
  upgradeSelectionIndex: 0,
  aWasPressed: false,
  suppressAUntilRelease: false,
  bWasPressed: false,
  rtWasPressed: false,
  yWasPressed: false,
  xWasPressed: false,
  lbWasPressed: false,
  rbWasPressed: false,
  dpadPreviousWasPressed: false,
  dpadNextWasPressed: false,
  dpadUpWasPressed: false,
  dpadDownWasPressed: false,
  dpadLeftWasPressed: false,
  dpadRightWasPressed: false,
  upgradeScrollY: 0,
  relicChoiceDirectionWasPressed: false,
  stickClickWasPressed: false,
  leftStickClickWasPressed: false,
  ltWasPressed: false,
  pauseWasPressed: false,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setMessage(text, seconds = 3.2) {
  ui.message.textContent = text;
  state.messageTimer = seconds;
}

function applyWeaponDamage(enemy, amount) {
  const vulnerability = state.emp.pathB >= 2 && enemy.empTimer > 0 ? 1.15 : 1;
  enemy.hp -= amount * vulnerability;
}

function showRelicNotification(name, control) {
  window.clearTimeout(relicNotificationTimer);
  ui.relicNotificationName.textContent = name;
  ui.relicNotificationControl.textContent = control;
  ui.relicNotification.hidden = false;
  relicNotificationTimer = window.setTimeout(() => {
    ui.relicNotification.hidden = true;
  }, 3000);
}

function damageAtLevel(level) {
  const earlyLevels = Math.min(level - 1, 4);
  const lateLevels = Math.max(0, level - 5);
  return 18 + earlyLevels * 7 + lateLevels * 4;
}

function damageAmount() {
  return damageAtLevel(state.upgrades.damage);
}

function fireDelay() {
  return fireDelayAtLevel(state.upgrades.reload);
}

function heatPerShotAtLevel(level) {
  const earlyLevels = Math.min(level - 1, 4);
  const lateLevels = Math.max(0, level - 5);
  return Math.max(0.09, 0.25 - earlyLevels * 0.02 - lateLevels * 0.008);
}

function heatPerShot() {
  return heatPerShotAtLevel(state.upgrades.cooling);
}

function heatDrain() {
  const earlyLevels = Math.min(state.upgrades.cooling - 1, 4);
  const lateLevels = Math.max(0, state.upgrades.cooling - 5);
  return 0.42 + earlyLevels * 0.08 + lateLevels * 0.045;
}

function turretMoveSpeed() {
  return turretMoveSpeedAtLevel(state.upgrades.drive);
}

function fireDelayAtLevel(level) {
  const earlyLevels = Math.min(level - 1, 4);
  const lateLevels = Math.max(0, level - 5);
  return Math.max(0.1, 0.34 - earlyLevels * 0.045 - lateLevels * 0.012);
}

function turretMoveSpeedAtLevel(level) {
  if (level <= 1) return 190;
  const extraLevels = level - 2;
  return 250 + Math.min(extraLevels, 2) * 35 + Math.min(Math.max(0, extraLevels - 2), 1) * 75 +
    Math.max(0, level - 5) * 12;
}

function projectileSpeed() {
  return 620 + Math.max(0, state.upgrades.targeting - 4) * 24;
}

function baseDamageMultiplier() {
  if (state.upgrades.defense < 3) return 1;
  return Math.max(0.7, 0.85 - Math.max(0, state.upgrades.defense - 5) * 0.03);
}

function targetingDamageMultiplier(target) {
  let multiplier = 1;
  if (state.upgrades.targeting >= 6 && (target.elite || target.boss)) multiplier *= 1.15;
  if (state.upgrades.targeting >= 7 && enemyBombs.includes(target)) multiplier *= 1.35;
  if (state.upgrades.targeting >= 8) multiplier *= 1.08;
  return multiplier;
}

const BASE_UPGRADE_CONFIG = {
  damage: {
    max: 10,
    names: ["Cannon Damage I", "Cannon Damage II", "Cannon Damage III", "Cannon Damage IV", "Heavy Shells", "Dense Penetrators", "Overpressure Loads", "Tungsten Core", "Siege Rounds", "Artifact Ammunition"],
    costs: [8, 13, 18, 24, 34, 46, 60, 76, 94],
  },
  reload: {
    max: 10,
    names: ["Reload Drive I", "Reload Drive II", "Reload Drive III", "Reload Drive IV", "Auto Loader", "Dual Feed", "Magnetic Breech", "Phase Cycling", "Predictive Feed", "Continuous Loader"],
    costs: [10, 15, 20, 27, 38, 50, 64, 80, 98],
  },
  cooling: {
    max: 10,
    names: ["Cooling Banks I", "Cooling Banks II", "Cooling Banks III", "Cooling Banks IV", "Cryo Cooling", "Heat Sinks", "Liquid Loop", "Thermal Shunt", "Zero-Point Cooling", "Endless Barrage"],
    costs: [12, 17, 23, 30, 42, 55, 69, 85, 103],
  },
  drive: {
    max: 10,
    names: ["Turret Drive I", "Turret Drive II", "Turret Drive III", "Turret Drive IV", "Mag-Rail Drive", "Servo Boost", "Vector Bearings", "Frictionless Rail", "Reactive Drive", "Instant Traverse"],
    costs: [7, 12, 18, 25, 35, 47, 61, 77, 95],
  },
  targeting: {
    max: 9,
    names: ["Manual Aim", "Dotted Aim Guide", "Longer Dotted Line", "Predictive Aiming", "Accelerated Rounds", "Threat Analysis", "Payload Targeting", "Combat Computer", "Perfect Solution"],
    costs: [8, 14, 24, 36, 50, 66, 84, 104],
  },
  defense: {
    max: 10,
    names: ["Patch Base", "Repair Drones", "Carapace Plating", "Reflective Shield", "Artifact Shield", "Layered Bulkheads", "Impact Baffles", "Reactive Plating", "Fortress Core", "Artifact Citadel"],
    costs: [
      { amount: 16, currency: "debris" },
      { amount: 2, currency: "carapaces" },
      { amount: 4, currency: "carapaces" },
      { amount: 7, currency: "carapaces" },
      { amount: 36, currency: "debris" },
      { amount: 52, currency: "debris" },
      { amount: 70, currency: "debris" },
      { amount: 90, currency: "debris" },
      { amount: 112, currency: "debris" },
    ],
  },
};

const RELIC_UPGRADE_NAMES = {
  homing: ["Homing Missile x3", "Expanded Salvo", "Hunter Swarm", "Homing Cluster Bombs", "Custom Homing"],
  flak: ["Flak Cannon x3", "Shrapnel Payload", "Proximity Burst", "Flak Cluster Shrapnel", "Custom Flak"],
  emp: ["EMP Pulse", "EMP Amplifier", "System Overload", "Extended Freeze", "Custom EMP"],
  railgun: ["Minefield", "Extra Mine", "Proximity Sensors", "Cluster Mines", "Deadly Lattice"],
  gravity: ["Gravity Well", "Expanded Singularity", "Crushing Field", "Twin Wells", "Event Horizon"],
  drones: ["Drone Squadron", "Expanded Squadron", "Combat Drones", "Salvage Network", "Repair Wing"],
};

const RELIC_WEAPON_NAMES = {
  homing: "Homing Missile",
  flak: "Flak Cannon",
  emp: "EMP Pulse",
  railgun: "Minefield",
  gravity: "Gravity Well",
  drones: "Drone Squadron",
};

const CANNON_MUTATION_NAMES = {
  spread: ["Scatter Core", "Choke Pattern", "Volley Manifold", "Splinter Burst", "Saturation Chamber"],
  seeker: ["Seeking Matrix", "Vector Guidance", "Smart Reacquisition", "Piercing Guidance", "Hunter Rounds"],
};

const RELIC_PATH_CONFIG = {
  homing: {
    name: "Homing Missile",
    a: ["Swarm Doctrine", ["Expanded Racks", "Distributed Locks", "Rapid Reacquisition", "Cascade Launch", "Hunter Swarm"]],
    b: ["Siege Warheads", ["Dense Warheads", "Breach Guidance", "Cluster Charge", "Tandem Detonation", "Siege Breaker"]],
  },
  flak: {
    name: "Flak Cannon",
    a: ["Saturation Barrage", ["Expanded Battery", "Wide Pattern", "Proximity Fuses", "Chain Barrage", "Sky Saturation"]],
    b: ["Area Denial", ["Shrapnel Payload", "Payload Interceptor", "Burning Fragments", "Cluster Shrapnel", "No-Fly Zone"]],
  },
  emp: {
    name: "EMP Pulse",
    a: ["Lockdown Field", ["Field Amplifier", "Deep Suppression", "Payload Arrest", "Residual Charge", "Total Lockdown"]],
    b: ["System Sabotage", ["Sensor Blackout", "Shield Collapse", "Cascade Interference", "Boss Override", "System Failure"]],
  },
  railgun: {
    name: "Minefield",
    a: ["Deployment Grid", ["Extra Mine", "Wide Deployment", "Proximity Sensors", "Second Rack", "Deadly Lattice"]],
    b: ["Siege Ordnance", ["Dense Charges", "Expanded Blast", "Payload Breaker", "Cluster Mines", "Chain Reaction"]],
  },
  gravity: {
    name: "Gravity Well",
    a: ["Compression Field", ["Crushing Field", "Tidal Stress", "Payload Collapse", "Compression Burst", "Event Horizon"]],
    b: ["Orbital Control", ["Expanded Singularity", "Stable Orbit", "Vector Pull", "Twin Wells", "Orbital Prison"]],
  },
  drones: {
    name: "Drone Squadron",
    a: ["Interceptor Wing", ["Combat Drones", "Interceptor Logic", "Coordinated Fire", "Point Defense", "Guardian Wing"]],
    b: ["Support Network", ["Salvage Network", "Cargo Relay", "Repair Wing", "Emergency Patch", "Autonomous Foundry"]],
  },
  spread: {
    name: "Scatter Core",
    a: ["Volley Manifold", ["Tri-Burst Rack", "Fan Pattern", "Volley Manifold", "Outrider Barrels", "Saturation Chamber"]],
    b: ["Shatterworks", ["Choke Pattern", "Packed Shot", "Splinter Burst", "Rupture Shells", "Hull Ripper"]],
  },
  seeker: {
    name: "Seeking Matrix",
    a: ["Guidance Matrix", ["Vector Guidance", "Smart Reacquisition", "Distributed Guidance", "Predictive Pursuit", "Perfect Guidance"]],
    b: ["Hunter Matrix", ["Hunter Rounds", "Boss Lock", "Piercing Guidance", "Weak-Point Logic", "Execution Matrix"]],
  },
};

const RELIC_PATH_EFFECTS = {
  homing: {
    a: ["+2 missiles", "Improved target distribution", "Faster retargeting", "1 micro-missile per kill", "Second wave at 45% power"],
    b: ["+25% missile damage", "+35% elite/boss damage", "70 px blast, 35% splash", "Second blast at 50%", "3x central missile damage"],
  },
  flak: {
    a: ["+1 shell", "Wider target spread", "+28 px proximity trigger", "Second group at 45% power", "Maximum target coverage"],
    b: ["+20% damage and +15% radius", "+60% payload damage", "2.5 sec hazard field", "4 fragments per payload", "5 sec combined field"],
  },
  emp: {
    a: ["+1 sec duration", "Speed reduced to 4%", "1.5 sec payload freeze", "3 sec residual disruption", "2 sec full freeze"],
    b: ["Payload launch disabled", "+15% incoming damage", "100 px chain radius", "+50% boss disruption", "Special abilities disabled"],
  },
  railgun: {
    a: ["+1 mine", "Wider deployment area", "+25 px trigger radius", "+2 mines", "Second mine row"],
    b: ["+30% blast damage", "+30% blast radius", "2x payload damage", "3 cluster fragments", "Nearby mines chain-detonate"],
  },
  gravity: {
    a: ["+35 damage/sec", "Up to 2x center damage", "+75% payload damage", "180 final blast damage", "2 sec center trap"],
    b: ["+25% radius", "+2 sec duration", "+35% pull strength", "2 wells at 75% size", "Tracking 8 sec well"],
  },
  drones: {
    a: ["+25% drone damage", "Payload priority", "Shared target logic", "1 intercept per 5 sec", "+2 elite drones"],
    b: ["+50% collection radius", "+20% debris value", "+1.2 HP/sec", "Restore 20% of payload hit", "1 debris per 18 sec"],
  },
  spread: {
    a: ["3 projectiles", "+30% spread angle", "5 projectiles", "7 projectiles", "9 projectiles"],
    b: ["+12% pellet damage", "+40% payload damage", "45 px splash", "3 fragments from payloads", "+1 penetration"],
  },
  seeker: {
    a: ["+35% turn rate", "Instant retarget", "Target distribution", "Motion prediction", "One reversal"],
    b: ["+25% elite damage", "Boss priority", "+1 penetration", "Up to +35% tracking damage", "+80% below 20% HP"],
  },
};

const RELIC_PATH_SUMMARIES = {
  homing: {
    a: "Launches larger, smarter missile swarms that spread across targets and can cascade into follow-up attacks.",
    b: "Builds fewer concerns around raw impact: heavier warheads, boss damage, explosions, and a devastating central missile.",
  },
  flak: {
    a: "Fills the sky with more shells, broader coverage, proximity bursts, and repeated barrages.",
    b: "Turns each detonation into a dangerous area-control weapon that shreds payloads and leaves damaging hazards.",
  },
  emp: {
    a: "Focuses on longer and stronger lockdown, eventually freezing ships and payloads almost completely.",
    b: "Disables enemy weapons and systems while making affected targets easier to destroy.",
  },
  railgun: {
    a: "Covers more of the battlefield with additional mines, wider placement, stronger sensors, and a second defensive row.",
    b: "Builds heavier explosives with larger blasts, payload damage, cluster fragments, and chain reactions.",
  },
  gravity: {
    a: "Weaponizes the well with crushing damage, stronger center pressure, and a violent final collapse.",
    b: "Improves battlefield control with larger, longer, stronger, and eventually tracking gravity wells.",
  },
  drones: {
    a: "Creates a combat escort that prioritizes threats, intercepts payloads, and adds elite attack drones.",
    b: "Builds a support network for salvage collection, repairs, damage recovery, and passive debris production.",
  },
  spread: {
    a: "Expands the main cannon into increasingly large volleys, ending in a broad nine-shot barrage.",
    b: "Strengthens each pellet with payload damage, splash, fragments, and penetration.",
  },
  seeker: {
    a: "Improves each weapon's targeting behavior: stronger rail suction, smarter bomb and pellet guidance, and longer lightning chains.",
    b: "Adds elite hunting, penetration, tracking damage, and finishing power to the installed primary weapon.",
  },
};

const PRIMARY_WEAPONS = {
  rail: {
    name: "Siege Rail",
    description: "A permanent heavy rail cannon. Fires much slower than the standard cannon, but each shot hits extremely hard and penetrates targets.",
    upgrades: ["Dense Slug", "Double Penetration", "Accelerator Rails", "Boss Breaker", "Siege Driver"],
    effects: ["+30% damage", "+1 penetration", "+20% projectile speed", "+40% elite/boss damage", "Second rail echo at 55%"],
  },
  bomb: {
    name: "Bombard Launcher",
    description: "A permanent grenade-like cannon. Lobs slower explosive shells that damage clustered ships and incoming payloads.",
    upgrades: ["Heavy Charge", "Expanded Blast", "Payload Buster", "Cluster Bomb", "Siege Payload"],
    effects: ["+25% damage", "+25% blast radius", "+60% payload damage", "3 explosive fragments", "Second detonation at 55%"],
  },
  shocker: {
    name: "Arc Shocker",
    description: "A permanent lightning weapon. Each trigger automatically strikes the nearest enemy and chains through nearby targets.",
    upgrades: ["High Voltage", "Forked Arc", "Payload Conduction", "Storm Reach", "Thunderhead"],
    effects: ["+25% damage", "+1 chain target", "+70% payload damage", "+80 px chain range", "Rapid second arc at 60%"],
  },
  scatter: {
    name: "Scatter Cannon",
    description: "A permanent close-range volley cannon. Fires multiple shells in a broad pattern and grows into a dense screen-clearing barrage.",
    upgrades: ["Packed Shot", "Five-Gun Fan", "Splinter Shells", "Seven-Gun Fan", "Saturation Chamber"],
    effects: ["+15% pellet damage", "5 projectiles", "45 px impact splash", "7 projectiles", "9 projectiles"],
  },
};

function primaryWeaponConfig() {
  return PRIMARY_WEAPONS[state.primaryWeapon.type];
}

function showWeaponCoreChoice() {
  if (state.relicChoiceType) {
    state.relicChoiceQueue.push("weaponCore");
    return;
  }
  const types = Object.keys(PRIMARY_WEAPONS);
  for (let i = types.length - 1; i > 0; i -= 1) {
    const swap = Math.floor(Math.random() * (i + 1));
    [types[i], types[swap]] = [types[swap], types[i]];
  }
  state.weaponChoiceOptions = types.slice(0, 2);
  state.relicChoiceType = "weaponCore";
  state.relicChoiceIndex = 0;
  state.relicChoiceDirectionWasPressed = true;
  state.aWasPressed = true;
  ui.relicPathTitle.textContent = "Weapon Core: choose a primary weapon";
  const [first, second] = state.weaponChoiceOptions.map((type) => PRIMARY_WEAPONS[type]);
  ui.relicPathAName.textContent = first.name;
  ui.relicPathADescription.textContent = first.description;
  ui.relicPathBName.textContent = second.name;
  ui.relicPathBDescription.textContent = second.description;
  ui.relicPathOverlay.hidden = false;
  updateRelicChoiceSelection();
}

function relicPathLevel(type, path) {
  return state[type][path === "a" ? "pathA" : "pathB"];
}

function relicChosenPath(type) {
  if (state[type].chosenPath) return state[type].chosenPath;
  if (state[type].pathA > 0) return "a";
  if (state[type].pathB > 0) return "b";
  return null;
}

function summarizeRelicPath(type, path) {
  const cooldownNote = ["flak", "emp", "railgun", "gravity"].includes(type)
    ? " Both paths also reduce this weapon's cooldown at Tier 3."
    : "";
  return RELIC_PATH_SUMMARIES[type][path] + cooldownNote;
}

function showRelicPathChoice(type) {
  if (type === "weaponCore") {
    showWeaponCoreChoice();
    return;
  }
  if (state.relicChoiceType) {
    state.relicChoiceQueue.push(type);
    return;
  }
  state.relicChoiceType = type;
  state.relicChoiceIndex = 0;
  state.relicChoiceDirectionWasPressed = true;
  state.aWasPressed = true;
  const config = RELIC_PATH_CONFIG[type];
  ui.relicPathTitle.textContent = `${config.name}: choose a path`;
  ui.relicPathAName.textContent = config.a[0];
  ui.relicPathADescription.textContent = summarizeRelicPath(type, "a");
  ui.relicPathBName.textContent = config.b[0];
  ui.relicPathBDescription.textContent = summarizeRelicPath(type, "b");
  ui.relicPathOverlay.hidden = false;
  updateRelicChoiceSelection();
}

function updateRelicChoiceSelection() {
  document.querySelectorAll("[data-relic-choice]").forEach((button, index) => {
    button.classList.toggle("is-controller-selected", index === state.relicChoiceIndex);
  });
}

function chooseRelicPath(path) {
  const type = state.relicChoiceType;
  if (type === "weaponCore") {
    const choiceIndex = path === "a" ? 0 : 1;
    const weaponType = state.weaponChoiceOptions[choiceIndex];
    if (!weaponType) return;
    state.primaryWeapon.type = weaponType;
    state.primaryWeapon.level = 0;
    state.relicChoiceType = null;
    state.weaponChoiceOptions = [];
    ui.relicPathOverlay.hidden = true;
    setMessage(`${PRIMARY_WEAPONS[weaponType].name} installed as the permanent primary weapon.`);
    showRelicNotification("Primary Weapon Installed", PRIMARY_WEAPONS[weaponType].name);
    updateUi();
    const nextChoice = state.relicChoiceQueue.shift();
    if (nextChoice) showRelicPathChoice(nextChoice);
    return;
  }
  if (!type || !state[type].unlocked) return;
  state[type].chosenPath = path;
  state.relicChoiceType = null;
  ui.relicPathOverlay.hidden = true;
  const pathName = RELIC_PATH_CONFIG[type][path][0];
  setMessage(`${RELIC_PATH_CONFIG[type].name}: ${pathName} selected.`);
  showRelicNotification(RELIC_PATH_CONFIG[type].name, `${pathName} path locked in`);
  updateUi();
  const nextChoice = state.relicChoiceQueue.shift();
  if (nextChoice) showRelicPathChoice(nextChoice);
}

function relicPathLabel(type, path) {
  const config = RELIC_PATH_CONFIG[type][path];
  const level = relicPathLevel(type, path);
  const nextName = config[1][Math.min(level, 4)];
  return `${RELIC_PATH_CONFIG[type].name} - ${config[0]}: ${nextName}`;
}

function relicPathStatus(type, path) {
  if (!state[type].unlocked) return "Not recovered";
  const level = relicPathLevel(type, path);
  return level >= 5 ? "Tier 5 - Max" : `Tier ${level} - ${level + 1} carapace${level === 0 ? "" : "s"}`;
}

function syncRelicLevel(type) {
  state[type].level = Math.max(1, state[type].pathA, state[type].pathB);
}

function relicCooldown(type) {
  const cooldowns = {
    homing: [6, 6],
    flak: [9, 7],
    emp: [15, 11],
    railgun: [12, 9],
    gravity: [14, 10],
  };
  const values = cooldowns[type];
  if (!values) return 0;
  return values[state[type].level >= 3 ? 1 : 0];
}

function getUpgradeCost(type) {
  if (type === "repair") {
    return { amount: 6 + Math.floor((state.base.maxHp - state.base.hp) / 60) * 2, currency: "debris" };
  }
  const config = BASE_UPGRADE_CONFIG[type];
  const rawCost = config.costs[Math.max(0, state.upgrades[type] - 1)];
  return typeof rawCost === "number" ? { amount: rawCost, currency: "debris" } : rawCost;
}

function formatUpgradeCost(type) {
  if (type !== "repair" && state.upgrades[type] >= BASE_UPGRADE_CONFIG[type].max) return "Max";
  const cost = getUpgradeCost(type);
  return `${cost.amount} ${cost.currency === "carapaces" ? "carapace" : "debris"}${cost.amount === 1 ? "" : cost.currency === "carapaces" ? "s" : ""}`;
}

function canAffordUpgrade(type) {
  const cost = getUpgradeCost(type);
  return state[cost.currency] >= cost.amount;
}

function spendUpgradeCost(type) {
  const cost = getUpgradeCost(type);
  state[cost.currency] -= cost.amount;
}

function nextUpgradeName(type) {
  const config = BASE_UPGRADE_CONFIG[type];
  return config.names[Math.min(state.upgrades[type], config.names.length - 1)];
}

function hasTargetNearAimLine() {
  return enemies.some((enemy) => {
    const relativeX = enemy.x - state.turret.x;
    const relativeY = enemy.y - state.turret.y;
    const projection = relativeX * state.turret.aimX + relativeY * state.turret.aimY;
    if (projection <= 0) return false;
    const perpendicular = Math.abs(relativeX * state.turret.aimY - relativeY * state.turret.aimX);
    return perpendicular <= enemy.size * 0.6 + 24;
  });
}

function updateUi() {
  ui.upgradeWindow.hidden = !state.intermission;
  ui.debris.textContent = state.debris;
  ui.carapaces.textContent = state.carapaces;
  ui.wave.textContent = state.wave;
  ui.baseHp.textContent = `${Math.max(0, Math.ceil(state.base.hp))} / ${state.base.maxHp}`;
  ui.intermissionBaseHp.textContent = `${Math.max(0, Math.ceil(state.base.hp))} / ${state.base.maxHp}`;
  ui.intermissionDebris.textContent = state.debris;
  ui.intermissionCarapaces.textContent = state.carapaces;
  ui.weapon.textContent = state.primaryWeapon.type === "cannon"
    ? `Cannon Mk ${Math.max(state.upgrades.damage, state.upgrades.reload, state.upgrades.cooling)}`
    : `${primaryWeaponConfig().name} T${state.primaryWeapon.level}`;
  ui.damageLevel.textContent = state.upgrades.damage;
  ui.reloadLevel.textContent = state.upgrades.reload;
  ui.coolingLevel.textContent = state.upgrades.cooling;
  ui.driveLevel.textContent = state.upgrades.drive;
  ui.targetingLevel.textContent = state.upgrades.targeting;
  ui.defenseLevel.textContent = state.upgrades.defense;
  ui.damageCost.textContent = formatUpgradeCost("damage");
  ui.reloadCost.textContent = formatUpgradeCost("reload");
  ui.coolingCost.textContent = formatUpgradeCost("cooling");
  ui.driveCost.textContent = formatUpgradeCost("drive");
  ui.targetingCost.textContent = formatUpgradeCost("targeting");
  ui.defenseCost.textContent = formatUpgradeCost("defense");
  ui.repairCost.textContent = state.base.hp >= state.base.maxHp ? "Full" : formatUpgradeCost("repair");
  document.querySelectorAll("[data-stage2-upgrade]").forEach((button) => {
    const type = button.dataset.stage2Upgrade;
    const maxed = type !== "repair" && state.upgrades[type] >= BASE_UPGRADE_CONFIG[type].max;
    button.disabled = !state.intermission || maxed || (type === "repair" && state.base.hp >= state.base.maxHp) || !canAffordUpgrade(type);
    if (type !== "repair") {
      button.querySelector("span").textContent = maxed ? BASE_UPGRADE_CONFIG[type].names.at(-1) : nextUpgradeName(type);
    }
  });
  document.querySelectorAll("[data-stage2-relic-path]").forEach((button) => {
    const type = button.dataset.stage2RelicPath;
    const path = button.dataset.relicPath;
    const level = relicPathLevel(type, path);
    const cost = level + 1;
    const chosenPath = relicChosenPath(type);
    button.hidden = !state[type].unlocked || chosenPath !== path;
    button.classList.toggle("is-selected-path", chosenPath === path);
    button.disabled = !state.intermission || !state[type].unlocked || level >= 5 || state.carapaces < cost;
    button.querySelector("span").textContent = relicPathLabel(type, path);
    button.querySelector("strong").textContent = relicPathStatus(type, path);
  });
  const weaponInstalled = state.primaryWeapon.type !== "cannon";
  document.querySelector("#stageTwoCannonRelicPanel").hidden = !weaponInstalled && !state.seeker.unlocked;
  document.querySelector("#seekingModifierBranch").hidden = !state.seeker.unlocked;
  if (weaponInstalled) {
    const weapon = primaryWeaponConfig();
    const level = state.primaryWeapon.level;
    const maxed = level >= 5;
    ui.primaryWeaponBranchName.textContent = weapon.name;
    ui.primaryWeaponUpgradeButton.hidden = false;
    ui.primaryWeaponUpgradeButton.disabled = !state.intermission || maxed || state.carapaces < level + 1;
    ui.primaryWeaponUpgradeName.textContent = maxed ? weapon.upgrades[4] : weapon.upgrades[level];
    ui.primaryWeaponUpgradeCost.textContent = maxed ? "Tier 5 - Max" : `${level + 1} carapace${level === 0 ? "" : "s"}`;
    const tooltip = `${weapon.name} - ${weapon.upgrades[Math.min(level, 4)]}: ${weapon.effects[Math.min(level, 4)]}. Sequential cost: ${Math.min(level + 1, 5)} carapaces.`;
    ui.primaryWeaponUpgradeButton.dataset.tooltip = tooltip;
    ui.primaryWeaponUpgradeButton.title = tooltip;
  }
  const hasRelicWeapon =
    state.homing.unlocked || state.flak.unlocked || state.emp.unlocked || state.railgun.unlocked ||
    state.gravity.unlocked || state.drones.unlocked;
  document.querySelector("#stageTwoRelicPanel").hidden = !hasRelicWeapon;
  document.querySelector("#stageTwoPauseRelics").hidden = !hasRelicWeapon;
  document.querySelectorAll("[data-stage2-relic-control]").forEach((control) => {
    control.hidden = !state[control.dataset.stage2RelicControl].unlocked;
  });
  updateActiveRelics();
  updateUpgradeTooltips();
}

function updateActiveRelics() {
  const active = [
    ["homing", "Homing Missile"],
    ["flak", "Flak Cannon"],
    ["emp", "EMP Pulse"],
    ["railgun", "Minefield"],
    ["gravity", "Gravity Well"],
    ["drones", "Drone Squadron"],
    ["seeker", "Seeking Matrix"],
  ].filter(([type]) => state[type].unlocked);
  if (state.primaryWeapon.type !== "cannon") active.push(["primaryWeapon", primaryWeaponConfig().name]);

  ui.activeRelics.replaceChildren();
  if (active.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No relics recovered";
    ui.activeRelics.append(empty);
    return;
  }

  active.forEach(([type, name]) => {
    const item = document.createElement("div");
    const label = document.createElement("span");
    const level = document.createElement("small");
    const status = document.createElement("strong");
    const passive = type === "primaryWeapon" || type === "drones" || type === "seeker";
    const chosenPath = type === "primaryWeapon" ? null : relicChosenPath(type);
    label.textContent = name;
    level.textContent = type === "primaryWeapon"
      ? `Tier ${state.primaryWeapon.level}`
      : chosenPath
      ? `${RELIC_PATH_CONFIG[type][chosenPath][0]} T${relicPathLevel(type, chosenPath)}`
      : "Branch not chosen";
    if (passive) {
      item.classList.add("is-passive");
      status.textContent = "PASSIVE";
    } else if (state[type].cooldown <= 0) {
      item.classList.add("is-ready");
      status.textContent = "READY";
    } else {
      item.classList.add("is-cooling");
      status.textContent = `${state[type].cooldown.toFixed(1)}s`;
    }
    const identity = document.createElement("div");
    identity.className = "active-relic-identity";
    identity.append(label, level);
    item.append(identity, status);
    ui.activeRelics.append(item);
  });
}

function updateUpgradeTooltips() {
  const reloadCurrent = fireDelayAtLevel(state.upgrades.reload);
  const reloadNext = fireDelayAtLevel(state.upgrades.reload + 1);
  const tooltipText = {
    damage: `Cannon shells currently deal ${damageAmount()} damage. Next level: ${damageAtLevel(Math.min(10, state.upgrades.damage + 1))} damage.`,
    reload: `Reload Drive controls how quickly the cannon can fire. Current: ${reloadCurrent.toFixed(3)} seconds between shots (${(1 / reloadCurrent).toFixed(1)} shots/sec). Next: ${reloadNext.toFixed(3)} seconds (${(1 / reloadNext).toFixed(1)} shots/sec).`,
    cooling: `Cooling Banks reduce heat per shot and clear heat faster. Current heat: ${heatPerShot().toFixed(3)} per shot. Next level: ${heatPerShotAtLevel(Math.min(10, state.upgrades.cooling + 1)).toFixed(3)} per shot.`,
    drive: `Turret Drive controls horizontal movement speed. Current: ${turretMoveSpeedAtLevel(state.upgrades.drive)}. Next level: ${turretMoveSpeedAtLevel(state.upgrades.drive + 1)}.`,
    targeting: [
      "Manual aiming is active. Next: display a dotted aiming guide.",
      "Dotted Aim Guide shows the cannon path. Next: extend it farther into the sky.",
      "Longer Dotted Line improves long-range alignment. Next: add predictive lead markers.",
      "Predictive Aiming shows where moving aliens will intersect the shot. Next: faster projectiles.",
      "Accelerated Rounds increase projectile velocity. Next: bonus damage against elites and bosses.",
      "Threat Analysis adds 15% damage against elites and bosses. Next: anti-payload targeting.",
      "Payload Targeting adds 35% damage against alien bombs. Next: improved damage calculation.",
      "Combat Computer adds 8% damage to all main-cannon shots. Next: an additional penetrating hit.",
      "Perfect Solution lets main-cannon rounds penetrate one additional target.",
    ][Math.min(state.upgrades.targeting - 1, 8)],
    defense: [
      "Patch Base unlocks the manual hull-repair option.",
      "Repair Drones restore 20 Base Integrity after each cleared wave.",
      "Carapace Plating adds 100 maximum Base Integrity and reduces impact damage by 15%.",
      "Reflective Shield repels one incoming alien ship each wave.",
      "Artifact Shield prevents one otherwise lethal base hit each wave.",
      "Layered Bulkheads add 75 maximum Base Integrity, improve repairs, and reduce incoming damage.",
      "Impact Baffles improve wave-break repairs and reduce incoming damage further.",
      "Reactive Plating adds 75 maximum Base Integrity and strengthens damage reduction.",
      "Fortress Core improves repairs and reduces incoming damage further.",
      "Artifact Citadel adds 75 maximum Base Integrity and provides the strongest damage reduction.",
    ][Math.min(state.upgrades.defense, 9)],
    repair: `Consumes debris to restore 120 Base Integrity. Current integrity: ${Math.ceil(state.base.hp)} / ${state.base.maxHp}.`,
    homing: state.homing.unlocked
      ? `Homing Missile launches ${5 + state.homing.pathA * 2} tracking missiles dealing 170 base damage each. Current cooldown: ${relicCooldown("homing")} seconds.`
      : "A rare relic weapon dropped by alien ships. Automatically tracks an alien after launch.",
    flak: state.flak.unlocked
      ? `Flak Cannon launches ${4 + state.flak.pathA} shells dealing 165 base blast damage across a 125 px radius. Current cooldown: ${relicCooldown("flak")} seconds. Tier 3 reduces it from 9 to 7 seconds.`
      : "A rare relic weapon dropped by alien ships. Bursts among clustered aliens for area damage.",
    emp: state.emp.unlocked
      ? `EMP Pulse disrupts every alien and payload onscreen without dealing damage. Current cooldown: ${relicCooldown("emp")} seconds. Tier 3 reduces it from 15 to 11 seconds.`
      : "A rare relic weapon dropped by alien ships. Disrupts and damages every alien onscreen.",
    railgun: state.railgun.unlocked
      ? `Minefield deploys armed proximity mines across the upper battlefield. Current cooldown: ${relicCooldown("railgun")} seconds. Tier 3 reduces it from 12 to 9 seconds.`
      : "A rare relic weapon that deploys proximity mines across the battlefield.",
    gravity: state.gravity.unlocked
      ? `Gravity Well pulls aliens and payloads toward the aiming point. Current cooldown: ${relicCooldown("gravity")} seconds. Tier 3 reduces it from 14 to 10 seconds.`
      : "A rare relic weapon dropped by alien ships. Pulls and slows nearby alien formations.",
    drones: state.drones.unlocked
      ? `Drone Squadron permanently maintains ${3 + (state.drones.pathA >= 5 ? 2 : 0)} support drones. Standard shots deal 13 base damage before upgrades. Drones attack threats and collect salvage.`
      : "A rare passive relic. Permanently deploys combat and salvage drones.",
    spread: state.spread.unlocked
      ? [
          "Scatter Core converts the main cannon into a three-shot spread. Each shell deals 68% normal damage.",
          "Choke Pattern keeps three shells but narrows the spread and raises each shell to 72% normal damage.",
          "Volley Manifold fires five shells at 58% normal damage each.",
          "Splinter Burst makes five-shot impacts damage nearby aliens.",
          "Saturation Chamber fires seven shells at 50% normal damage each. If Seeking Matrix is owned, the full spread homes.",
        ][state.spread.level - 1]
      : "A rare cannon mutation. Converts the main cannon into an unguided multi-shot weapon.",
    seeker: state.seeker.unlocked
      ? [
          "Seeking Matrix gives the main cannon light target guidance. With Scatter Core, every pellet homes.",
          "Vector Guidance increases guided rounds' turning strength.",
          "Smart Reacquisition lets guided rounds continually select new nearest targets.",
          "Piercing Guidance lets guided rounds pass through one alien and strike a second.",
          "Hunter Rounds make guided rounds deal 60% extra damage to bosses.",
        ][state.seeker.level - 1]
      : "A cannon mutation that guides the main weapon and combines with Scatter Core to guide the full volley.",
  };

  document.querySelectorAll("[data-stage2-upgrade]").forEach((button) => {
    const text = tooltipText[button.dataset.stage2Upgrade];
    button.dataset.tooltip = text;
    button.title = text;
  });
  document.querySelectorAll("[data-stage2-relic-path]").forEach((button) => {
    const type = button.dataset.stage2RelicPath;
    const path = button.dataset.relicPath;
    const level = relicPathLevel(type, path);
    const effect = RELIC_PATH_EFFECTS[type][path][Math.min(level, 4)];
    const cooldownMilestone = ["flak", "emp", "railgun", "gravity"].includes(type) && level === 2
      ? " This Tier 3 purchase also reduces the weapon cooldown."
      : "";
    const text = `${relicPathLabel(type, path)}. ${effect}.${cooldownMilestone} Sequential cost: ${Math.min(level + 1, 5)} carapace${level === 0 ? "" : "s"}.`;
    button.dataset.tooltip = text;
    button.title = text;
  });
}

function getStageTwoTooltip() {
  let tooltip = document.querySelector("#customTooltip");
  if (tooltip) return tooltip;
  tooltip = document.createElement("div");
  tooltip.id = "customTooltip";
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  return tooltip;
}

function showUpgradeTooltip(button) {
  const text = button.dataset.tooltip;
  if (!text) return;
  if (state.intermission) {
    const floatingTooltip = document.querySelector("#customTooltip");
    if (floatingTooltip) floatingTooltip.hidden = true;
    ui.intermissionUpgradeDescription.textContent = text;
    ui.intermissionUpgradeDescription.hidden = false;
    fitIntermissionDescription();
    return;
  }
  const tooltip = getStageTwoTooltip();
  tooltip.textContent = text;
  tooltip.hidden = false;
  const tooltipRect = tooltip.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const padding = 14;
  const left = clamp(
    canvasRect.left + padding,
    8,
    window.innerWidth - tooltipRect.width - 8,
  );
  const top = clamp(
    canvasRect.top + padding,
    8,
    window.innerHeight - tooltipRect.height - 8,
  );
  tooltip.style.transform = `translate(${left}px, ${top}px)`;
}

function fitIntermissionDescription() {
  const description = ui.intermissionUpgradeDescription;
  description.style.fontSize = "0.72rem";
  description.style.lineHeight = "1.35";
  let fontSize = 11.52;
  while (description.scrollHeight > description.clientHeight && fontSize > 9.2) {
    fontSize -= 0.25;
    description.style.fontSize = `${fontSize}px`;
    description.style.lineHeight = "1.28";
  }
  description.classList.toggle("is-tight", description.scrollHeight > description.clientHeight);
}

function hideUpgradeTooltip() {
  ui.intermissionUpgradeDescription.hidden = true;
  const tooltip = document.querySelector("#customTooltip");
  if (tooltip) tooltip.hidden = true;
}

function setupUpgradeTooltips() {
  document.querySelectorAll(
    "[data-stage2-upgrade], [data-stage2-relic-path], [data-stage2-weapon-upgrade]",
  ).forEach((button) => {
    button.addEventListener("mouseenter", () => showUpgradeTooltip(button));
    button.addEventListener("mouseleave", hideUpgradeTooltip);
    button.addEventListener("focus", () => showUpgradeTooltip(button));
    button.addEventListener("blur", hideUpgradeTooltip);
  });
}

function startWave() {
  state.intermission = false;
  unlockUpgradeScreen();
  ui.intermission.hidden = true;
  ui.nextWaveButton.classList.remove("is-controller-selected");
  state.enemiesQueued =
    state.wave <= 3
      ? 2 + state.wave * 2
      : 8 + Math.floor((state.wave - 3) * 2.4);
  state.bossPending = state.wave % 5 === 0;
  state.defense.shieldReady = true;
  state.defense.artifactShieldReady = true;
  state.spawnTimer = state.wave <= 3 ? 1.2 : 0.7;
  setMessage(state.bossPending ? `Wave ${state.wave}: boss signal detected.` : `Wave ${state.wave} incoming.`);
}

function beginWaveIntermission() {
  if (state.intermission) return;
  if (state.wave >= 20 && !state.endlessMode) {
    endVictory();
    return;
  }
  state.intermission = true;
  lockUpgradeScreen();
  if (state.upgrades.defense >= 2) {
    const repairAmount = 20 + Math.max(0, state.upgrades.defense - 5) * 8;
    state.base.hp = Math.min(state.base.maxHp, state.base.hp + repairAmount);
  }
  ui.intermissionTitle.textContent = `Prepare for Wave ${state.wave + 1}`;
  ui.intermission.hidden = false;
  ui.nextWaveButton.classList.add("is-controller-selected");
  setMessage(`Wave ${state.wave} cleared. Upgrade before continuing.`);
  updateUi();
}

function startNextWave() {
  if (!state.intermission) return;
  clearUpgradeSelection();
  state.wave += 1;
  startWave();
  state.lastTime = performance.now();
}

function lockUpgradeScreen() {
  state.upgradeScrollY = window.scrollY;
  document.documentElement.classList.add("upgrade-screen-open");
  document.body.classList.add("upgrade-screen-open");
  document.body.style.top = `-${state.upgradeScrollY}px`;
}

function unlockUpgradeScreen() {
  if (!document.body.classList.contains("upgrade-screen-open")) return;
  const scrollY = state.upgradeScrollY;
  document.documentElement.classList.remove("upgrade-screen-open");
  document.body.classList.remove("upgrade-screen-open");
  document.body.style.top = "";
  window.scrollTo(0, scrollY);
}

function alienHealthScale() {
  const postFive = Math.max(0, state.wave - 5);
  const postTen = Math.max(0, state.wave - 10);
  const postFifteen = Math.max(0, state.wave - 15);
  return 1 + postFive * 0.08 + postTen * postTen * 0.012 - postFifteen * postFifteen * 0.006;
}

function alienDamageScale() {
  const postFive = Math.max(0, state.wave - 5);
  const postTen = Math.max(0, state.wave - 10);
  const postFifteen = Math.max(0, state.wave - 15);
  return 1 + postFive * 0.05 + postTen * 0.05 - postFifteen * 0.025;
}

function alienSpeedScale() {
  const postTen = Math.max(0, state.wave - 10);
  const postFifteen = Math.max(0, state.wave - 15);
  return Math.min(1.27, 1 + postTen * 0.025 - postFifteen * 0.016);
}

function spawnEnemy(isBoss = false) {
  const tier = Math.min(5, 1 + Math.floor((state.wave - 1) / 3));
  const elite = !isBoss && Math.random() < Math.min(0.1 + state.wave * 0.018, 0.45);
  const bossType = isBoss
    ? Math.floor(state.wave / 5) % 2 === 0 ? "carrier" : "dreadnought"
    : null;
  const size = isBoss ? 58 + tier * 3 : elite ? 30 + tier * 2 : 22 + tier * 2;
  const baseHp = 32 + tier * 18 + state.wave * 6;
  const healthScale = alienHealthScale();
  const damageScale = alienDamageScale();
  const speedScale = alienSpeedScale();
  const normalBombs = state.wave >= 12 ? 2 : 1;
  const eliteBombs = state.wave >= 15 ? 3 : 2;
  const enemy = {
    x: 70 + Math.random() * (canvas.width - 140),
    y: -36,
    vx: bossType === "carrier" ? (Math.random() < 0.5 ? -1 : 1) * (52 + state.wave * 1.5) : (Math.random() - 0.5) * (20 + tier * 5),
    speed: (26 + tier * 6 + (state.wave - 1) * 2.4) * (isBoss ? 0.48 : elite ? 0.8 : 1) * speedScale,
    hp: baseHp * (isBoss ? (bossType === "carrier" ? 11 : 9) : elite ? 1.8 : 1) * healthScale,
    maxHp: baseHp * (isBoss ? (bossType === "carrier" ? 11 : 9) : elite ? 1.8 : 1) * healthScale,
    damage: (12 + tier * 5 + state.wave * 1.5) * (isBoss ? 3 : 1) * damageScale,
    size,
    wobble: Math.random() * Math.PI * 2,
    elite,
    boss: isBoss,
    bossType,
    patrolY: 125 + Math.random() * 75,
    attackCooldown: 1.4,
    heavyBombCooldown: 4.5,
    bombCooldown: 1.8 + Math.random() * 2.8,
    bombsRemaining: state.wave >= 6
      ? isBoss && bossType !== "carrier" ? (state.wave >= 15 ? 6 : 4) : elite ? eliteBombs : normalBombs
      : 0,
    flash: 0,
  };
  enemies.push(enemy);
  if (isBoss) {
    setMessage(
      bossType === "carrier"
        ? "Boss incoming: Siege Carrier holding at range."
        : "Boss incoming: Dreadnought on collision course.",
      4.5,
    );
  }
}

function launchEnemyBomb(enemy, kind = "bomb") {
  const heavy = kind === "bomb";
  const carrierPayload = heavy && enemy.bossType === "carrier";
  const carrierPayloadHealthMultiplier =
    enemy.bossType === "carrier" && state.wave <= 10 ? 0.72 : 1;
  const payloadHealthScale = 1 + Math.max(0, state.wave - 8) * (carrierPayload ? 0.045 : 0.07);
  const payloadDamageScale = 1 + Math.max(0, state.wave - 10) * 0.06;
  const hp = ((heavy ? 28 + state.wave * 6 : 16 + state.wave * 3) +
    (enemy.elite ? 18 : 0) + (enemy.boss ? (heavy ? (carrierPayload ? 20 : 45) : 20) : 0)) *
    payloadHealthScale * carrierPayloadHealthMultiplier;
  enemyBombs.push({
    kind,
    carrierPayload,
    x: enemy.x,
    y: enemy.y + enemy.size * 0.45,
    vx: enemy.vx * (heavy ? 0.2 : 0.08),
    speed: heavy ? 34 + Math.min(26, (state.wave - 5) * 2) : 105 + state.wave * 3,
    hp,
    maxHp: hp,
    damage: ((heavy ? 18 + state.wave * 2.5 : 9 + state.wave * 1.35) +
      (enemy.elite ? 8 : 0) + (enemy.boss ? (heavy ? 16 : 7) : 0)) * payloadDamageScale,
    radius: heavy ? (enemy.boss ? 15 : enemy.elite ? 13 : 11) : 8,
    spin: Math.random() * Math.PI * 2,
    flash: 0,
  });
  if (enemy.bossType !== "carrier") {
    enemy.bombsRemaining -= 1;
    enemy.bombCooldown = Math.max(3.5, 8.5 - (state.wave - 6) * 0.22) + Math.random() * 2;
  }
}

function fire() {
  if (state.primaryWeapon.type === "rail") {
    firePrimaryRail();
    return;
  }
  if (state.primaryWeapon.type === "bomb") {
    firePrimaryBomb();
    return;
  }
  if (state.primaryWeapon.type === "shocker") {
    firePrimaryShocker();
    return;
  }
  if (state.primaryWeapon.type === "scatter") {
    firePrimaryScatter();
    return;
  }
  fireCannon();
}

function fireCannon() {
  if (state.turret.cooldown > 0 || state.turret.heat >= 0.96) return;
  const muzzleDistance = 34;
  const volleyLevel = state.spread.pathA;
  const pelletCount = !state.spread.unlocked ? 1 :
    volleyLevel >= 5 ? 9 :
    volleyLevel >= 4 ? 7 :
    volleyLevel >= 3 ? 5 : 3;
  const spreadStats = {
    count: pelletCount,
    step: 0.13 * (volleyLevel >= 2 ? 1.3 : 1),
    damageScale: pelletCount === 1 ? 1 : pelletCount <= 3 ? 0.68 : pelletCount <= 5 ? 0.56 : 0.46,
  };
  const fragmentationLevel = state.spread.pathB;
  const guidanceLevel = state.seeker.pathA;
  const hunterLevel = state.seeker.pathB;
  const baseAngle = Math.atan2(state.turret.aimY, state.turret.aimX);
  const shotSpeed = projectileSpeed();
  for (let i = 0; i < spreadStats.count; i += 1) {
    const offset = (i - (spreadStats.count - 1) / 2) * spreadStats.step;
    const angle = baseAngle + offset;
    const aimX = Math.cos(angle);
    const aimY = Math.sin(angle);
    bullets.push({
      x: state.turret.x + aimX * muzzleDistance,
      y: state.turret.y + aimY * muzzleDistance,
      vx: aimX * shotSpeed,
      vy: aimY * shotSpeed,
      damage: damageAmount() * spreadStats.damageScale * (fragmentationLevel >= 1 ? 1.12 : 1),
      radius: spreadStats.count >= 5 ? 4 : 4.5,
      seekingStrength: state.seeker.unlocked ? 1.7 * (guidanceLevel >= 1 ? 1.35 : 1) : 0,
      targetSlot: guidanceLevel >= 3 ? i : 0,
      predictiveGuidance: guidanceLevel >= 4,
      reversalReady: guidanceLevel >= 5,
      trackingTime: 0,
      remainingHits: 1 + (fragmentationLevel >= 5 ? 1 : 0) +
        (hunterLevel >= 3 ? 1 : 0) + (state.upgrades.targeting >= 9 ? 1 : 0),
      hitTargets: new Set(),
      fragmenting: fragmentationLevel >= 3,
      payloadMultiplier: fragmentationLevel >= 2 ? 1.4 : 1,
      payloadFragments: fragmentationLevel >= 4,
      eliteMultiplier: hunterLevel >= 1 ? 1.25 : 1,
      executeMultiplier: hunterLevel >= 5 ? 1.8 : 1,
      seekerRound: state.seeker.unlocked,
    });
  }
  state.turret.cooldown = fireDelay();
  state.turret.heat = clamp(state.turret.heat + heatPerShot(), 0, 1.25);
}

function firePrimaryRail() {
  if (state.turret.cooldown > 0 || state.turret.heat >= 0.96) return;
  const level = state.primaryWeapon.level;
  const speed = projectileSpeed() * (level >= 3 ? 1.2 : 1.05);
  railBeams.push({
    x: state.turret.x,
    y: state.turret.y,
    aimX: state.turret.aimX,
    aimY: state.turret.aimY,
    width: 14 + level * 2,
    life: 0.22,
    persistentDamage: 0,
    damageTick: 0,
    primaryRailVisual: true,
  });
  bullets.push({
    x: state.turret.x + state.turret.aimX * 38,
    y: state.turret.y + state.turret.aimY * 38,
    vx: state.turret.aimX * speed,
    vy: state.turret.aimY * speed,
    damage: damageAmount() * 3.2 * (level >= 1 ? 1.3 : 1),
    radius: 5.5,
    seekingStrength: 0,
    targetSlot: 0,
    predictiveGuidance: false,
    reversalReady: false,
    trackingTime: 0,
    remainingHits: 2 + (level >= 2 ? 1 : 0) + (state.seeker.pathB >= 3 ? 1 : 0) +
      (state.upgrades.targeting >= 9 ? 1 : 0),
    hitTargets: new Set(),
    fragmenting: false,
    payloadMultiplier: 1.8,
    payloadFragments: false,
    eliteMultiplier: (level >= 4 ? 1.4 : 1) * (state.seeker.pathB >= 1 ? 1.25 : 1),
    executeMultiplier: state.seeker.pathB >= 5 ? 1.8 : 1,
    seekerRound: state.seeker.unlocked,
    weaponType: "rail",
    echo: level >= 5,
    railWake: state.seeker.unlocked,
    wakeStrength: 130 + state.seeker.pathA * 25,
    wakeRadius: 80 + state.seeker.pathA * 12,
    originX: state.turret.x,
    originY: state.turret.y,
    directionX: state.turret.aimX,
    directionY: state.turret.aimY,
  });
  state.turret.cooldown = fireDelay() * 2.65;
  state.turret.heat = clamp(state.turret.heat + heatPerShot() * 1.8, 0, 1.25);
}

function firePrimaryBomb() {
  if (state.turret.cooldown > 0 || state.turret.heat >= 0.96) return;
  const level = state.primaryWeapon.level;
  const speed = projectileSpeed() * 0.68;
  bullets.push({
    x: state.turret.x + state.turret.aimX * 36,
    y: state.turret.y + state.turret.aimY * 36,
    vx: state.turret.aimX * speed,
    vy: state.turret.aimY * speed,
    damage: damageAmount() * 2.25 * (level >= 1 ? 1.25 : 1),
    radius: 8,
    seekingStrength: state.seeker.unlocked ? 1.35 * (state.seeker.pathA >= 1 ? 1.35 : 1) : 0,
    targetSlot: 0,
    predictiveGuidance: false,
    reversalReady: false,
    trackingTime: 0,
    remainingHits: 1,
    hitTargets: new Set(),
    fragmenting: false,
    payloadMultiplier: level >= 3 ? 1.7 : 1,
    payloadFragments: false,
    eliteMultiplier: state.seeker.pathB >= 1 ? 1.25 : 1,
    executeMultiplier: 1,
    seekerRound: state.seeker.unlocked,
    weaponType: "bomb",
    explosiveRadius: 78 * (level >= 2 ? 1.25 : 1),
    cluster: level >= 4,
    secondBlast: level >= 5,
  });
  state.turret.cooldown = fireDelay() * 2.25;
  state.turret.heat = clamp(state.turret.heat + heatPerShot() * 1.55, 0, 1.25);
}

function firePrimaryScatter() {
  if (state.turret.cooldown > 0 || state.turret.heat >= 0.96) return;
  const level = state.primaryWeapon.level;
  const count = level >= 5 ? 9 : level >= 4 ? 7 : level >= 2 ? 5 : 3;
  const step = count >= 7 ? 0.095 : 0.12;
  const baseAngle = Math.atan2(state.turret.aimY, state.turret.aimX);
  const speed = projectileSpeed();
  for (let i = 0; i < count; i += 1) {
    const angle = baseAngle + (i - (count - 1) / 2) * step;
    const aimX = Math.cos(angle);
    const aimY = Math.sin(angle);
    bullets.push({
      x: state.turret.x + aimX * 34,
      y: state.turret.y + aimY * 34,
      vx: aimX * speed,
      vy: aimY * speed,
      damage: damageAmount() * (count <= 3 ? 0.72 : count <= 5 ? 0.58 : 0.48) * (level >= 1 ? 1.15 : 1),
      radius: 4,
      seekingStrength: state.seeker.unlocked ? 1.6 * (state.seeker.pathA >= 1 ? 1.35 : 1) : 0,
      targetSlot: state.seeker.pathA >= 3 ? i : 0,
      predictiveGuidance: state.seeker.pathA >= 4,
      reversalReady: state.seeker.pathA >= 5,
      trackingTime: 0,
      remainingHits: 1 + (state.seeker.pathB >= 3 ? 1 : 0),
      hitTargets: new Set(),
      fragmenting: level >= 3,
      payloadMultiplier: 1,
      payloadFragments: false,
      eliteMultiplier: state.seeker.pathB >= 1 ? 1.25 : 1,
      executeMultiplier: state.seeker.pathB >= 5 ? 1.8 : 1,
      seekerRound: state.seeker.unlocked,
      weaponType: "scatter",
    });
  }
  state.turret.cooldown = fireDelay() * 1.12;
  state.turret.heat = clamp(state.turret.heat + heatPerShot() * 1.2, 0, 1.25);
}

function firePrimaryShocker() {
  if (state.turret.cooldown > 0 || state.turret.heat >= 0.96) return;
  const acquisitionRange = 440 + state.primaryWeapon.level * 18;
  const targets = enemies.concat(enemyBombs).filter((target) =>
    Math.hypot(target.x - state.turret.x, target.y - state.turret.y) <= acquisitionRange,
  );
  if (targets.length === 0) return;
  const level = state.primaryWeapon.level;
  const maxChains = 2 + (level >= 2 ? 1 : 0) + (level >= 5 ? 1 : 0) +
    (state.seeker.unlocked ? 1 : 0) + (state.seeker.pathA >= 3 ? 1 : 0);
  const chainRange = (180 + (level >= 4 ? 80 : 0)) *
    (state.seeker.unlocked ? 1.3 + state.seeker.pathA * 0.05 : 1);
  let currentX = state.turret.x;
  let currentY = state.turret.y - 24;
  const struck = new Set();
  for (let chain = 0; chain < maxChains; chain += 1) {
    const candidates = targets.filter((target) => !struck.has(target));
    if (candidates.length === 0) break;
    const target = candidates.reduce((nearest, candidate) => {
      const distance = Math.hypot(candidate.x - currentX, candidate.y - currentY);
      const nearestDistance = nearest ? Math.hypot(nearest.x - currentX, nearest.y - currentY) : Infinity;
      return distance < nearestDistance ? candidate : nearest;
    }, null);
    if (!target || (chain > 0 && Math.hypot(target.x - currentX, target.y - currentY) > chainRange)) break;
    const seekerDamage = state.seeker.pathB >= 1 ? 1.25 : 1;
    const damage = damageAmount() * 1.65 * (level >= 1 ? 1.25 : 1) *
      seekerDamage * (chain === 0 ? 1 : 0.72);
    if (enemyBombs.includes(target)) target.hp -= damage * (level >= 3 ? 1.7 : 1);
    else applyWeaponDamage(target, damage);
    target.flash = 0.14;
    lightningArcs.push({ x1: currentX, y1: currentY, x2: target.x, y2: target.y, life: 0.18 });
    struck.add(target);
    currentX = target.x;
    currentY = target.y;
  }
  if (level >= 5) {
    window.setTimeout(() => {
      if (!state.over && state.primaryWeapon.type === "shocker") fireShockerEcho();
    }, 180);
  }
  state.turret.cooldown = fireDelay() * 1.85;
  state.turret.heat = clamp(state.turret.heat + heatPerShot() * 1.3, 0, 1.25);
}

function fireShockerEcho() {
  if (state.paused || state.intermission || state.relicChoiceType) return;
  const acquisitionRange = 440 + state.primaryWeapon.level * 18;
  const target = enemies.concat(enemyBombs)
    .filter((candidate) =>
      Math.hypot(candidate.x - state.turret.x, candidate.y - state.turret.y) <= acquisitionRange,
    )
    .reduce((nearest, candidate) => {
    const distance = Math.hypot(candidate.x - state.turret.x, candidate.y - state.turret.y);
    const nearestDistance = nearest ? Math.hypot(nearest.x - state.turret.x, nearest.y - state.turret.y) : Infinity;
    return distance < nearestDistance ? candidate : nearest;
  }, null);
  if (!target) return;
  const damage = damageAmount() * 0.99;
  if (enemyBombs.includes(target)) target.hp -= damage;
  else applyWeaponDamage(target, damage);
  target.flash = 0.14;
  lightningArcs.push({ x1: state.turret.x, y1: state.turret.y - 24, x2: target.x, y2: target.y, life: 0.18 });
}

function detonatePrimaryBomb(bullet) {
  enemies.forEach((enemy) => {
    const distance = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
    if (distance <= bullet.explosiveRadius + enemy.size * 0.35) {
      const falloff = 1 - Math.min(0.45, distance / bullet.explosiveRadius * 0.45);
      const seekerMultiplier = state.seeker.pathB >= 1 && (enemy.elite || enemy.boss) ? 1.25 : 1;
      const executeMultiplier = state.seeker.pathB >= 5 && (enemy.elite || enemy.boss) &&
        enemy.hp / Math.max(1, enemy.maxHp) <= 0.2 ? 1.8 : 1;
      applyWeaponDamage(enemy, bullet.damage * falloff * seekerMultiplier * executeMultiplier);
      if (bullet.secondBlast) {
        applyWeaponDamage(enemy, bullet.damage * 0.55 * falloff * seekerMultiplier * executeMultiplier);
      }
      enemy.flash = 0.14;
    }
  });
  enemyBombs.forEach((bomb) => {
    const distance = Math.hypot(bomb.x - bullet.x, bomb.y - bullet.y);
    if (distance <= bullet.explosiveRadius + bomb.radius) {
      bomb.hp -= bullet.damage * bullet.payloadMultiplier;
      if (bullet.secondBlast) bomb.hp -= bullet.damage * 0.55 * bullet.payloadMultiplier;
      bomb.flash = 0.14;
    }
  });
  if (bullet.cluster) {
    enemies
      .filter((enemy) => Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) <= bullet.explosiveRadius * 1.6)
      .slice(0, 3)
      .forEach((enemy) => applyWeaponDamage(enemy, bullet.damage * 0.32));
  }
  flakBlasts.push({ x: bullet.x, y: bullet.y, radius: bullet.explosiveRadius, life: 0.32 });
  addSparks(bullet.x, bullet.y, "#ffb44a", 22);
}

function fireHomingMissile() {
  if (!state.homing.unlocked) {
    setMessage("No homing weapon recovered.");
    return;
  }
  if (state.homing.cooldown > 0) {
    setMessage(`Homing system recharging: ${state.homing.cooldown.toFixed(1)}s.`);
    return;
  }
  if (enemies.length === 0) {
    setMessage("No target lock.");
    return;
  }

  launchHomingSalvo(1);
  if (state.homing.pathA >= 5) missileSalvoQueue.push({ delay: 0.5, damageScale: 0.45 });
  state.homing.cooldown = relicCooldown("homing");
}

function launchHomingSalvo(damageScale = 1) {
  const missileCount = 5 + state.homing.pathA * 2;
  for (let i = 0; i < missileCount; i += 1) {
    const spread = (i - (missileCount - 1) / 2) * 42;
    const central = i === Math.floor(missileCount / 2);
    missiles.push({
      x: state.turret.x,
      y: state.turret.y - 24,
      vx: spread,
      vy: -300 - Math.abs(spread) * 0.25,
      speed: 470 + state.homing.pathA * 16,
      damage: 170 * (state.homing.pathB >= 1 ? 1.25 : 1) *
        (central && state.homing.pathB >= 5 ? 3 : 1) * damageScale,
      radius: 8,
      life: 5,
      targetSlot: state.homing.pathA >= 2 ? i : 0,
      passes: 0,
      hitGrace: 0,
      central,
    });
  }
  setMessage(`${missileCount}-missile homing salvo launched.`);
}

function findFlakTarget() {
  let bestTarget = null;
  let bestScore = -1;
  for (const candidate of enemies) {
    let nearby = 0;
    for (const enemy of enemies) {
      const dx = enemy.x - candidate.x;
      const dy = enemy.y - candidate.y;
      if (dx * dx + dy * dy <= 115 ** 2) nearby += 1;
    }
    const urgency = candidate.y / canvas.height;
    const score = nearby * 10 + urgency;
    if (score > bestScore) {
      bestScore = score;
      bestTarget = candidate;
    }
  }
  return bestTarget;
}

function fireFlakCannon() {
  if (!state.flak.unlocked) {
    setMessage("No flak weapon recovered.");
    return;
  }
  if (state.flak.cooldown > 0) {
    setMessage(`Flak cannon recharging: ${state.flak.cooldown.toFixed(1)}s.`);
    return;
  }
  const target = findFlakTarget();
  if (!target) {
    setMessage("No flak target.");
    return;
  }

  launchFlakSalvo(1);
  if (state.flak.pathA >= 4) flakSalvoQueue.push({ delay: 0.55, damageScale: 0.45 });
  state.flak.cooldown = relicCooldown("flak");
  setMessage("Flak barrage launched.");
}

function launchFlakSalvo(damageScale = 1) {
  const shellCount = 4 + state.flak.pathA + (state.flak.pathA >= 5 ? Math.max(0, enemies.length - 4) : 0);
  const targets = [...enemies].sort((a, b) => b.y - a.y);
  for (let i = 0; i < shellCount; i += 1) {
    const shellTarget = targets.length > 0
      ? targets[i % targets.length]
      : { x: state.turret.x + state.turret.aimX * 360, y: state.turret.y + state.turret.aimY * 360 };
    flakShells.push({
      x: state.turret.x,
      y: state.turret.y - 24,
      targetX: shellTarget.x,
      targetY: shellTarget.y,
      speed: 520,
      damage: 165 * (state.flak.pathB >= 1 ? 1.2 : 1) * damageScale,
      blastRadius: 125 * (state.flak.pathB >= 1 ? 1.15 : 1),
      proximityRadius: state.flak.pathA >= 3 ? 28 : 0,
      life: 2.5,
    });
  }
}

function detonateFlak(shell) {
  for (const enemy of enemies) {
    const dx = enemy.x - shell.x;
    const dy = enemy.y - shell.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= shell.blastRadius + enemy.size * 0.35) {
      const falloff = 1 - Math.min(0.45, distance / shell.blastRadius * 0.45);
      applyWeaponDamage(enemy, shell.damage * falloff);
      enemy.flash = 0.14;
    }
  }
  const payloadHits = [];
  for (const bomb of enemyBombs) {
    const distance = Math.hypot(bomb.x - shell.x, bomb.y - shell.y);
    if (distance <= shell.blastRadius + bomb.radius) {
      const payloadMultiplier = state.flak.pathB >= 2 ? 1.6 : 1;
      bomb.hp -= shell.damage * payloadMultiplier * (1 - Math.min(0.45, distance / shell.blastRadius * 0.45));
      bomb.flash = 0.14;
      payloadHits.push(bomb);
    }
  }
  flakBlasts.push({ x: shell.x, y: shell.y, radius: shell.blastRadius, life: 0.32 });
  addSparks(shell.x, shell.y, "#ffb44a", 28);
  if (state.flak.pathB >= 4) {
    payloadHits.forEach((payload) => {
      const fragmentTargets = [...enemies]
        .sort((a, b) => Math.hypot(a.x - payload.x, a.y - payload.y) - Math.hypot(b.x - payload.x, b.y - payload.y))
        .slice(0, 4);
      fragmentTargets.forEach((enemy) => {
        applyWeaponDamage(enemy, shell.damage * 0.3);
        enemy.flash = 0.12;
        addSparks(enemy.x, enemy.y, "#ffd38c", 6);
      });
    });
  }
  if (state.flak.pathB >= 3) {
    flakBlasts.push({
      x: shell.x,
      y: shell.y,
      radius: shell.blastRadius * 0.75,
      life: state.flak.pathB >= 5 ? 5 : 2.5,
      lingering: true,
      damagePerSecond: shell.damage * 0.3,
    });
  }
}

function fireEmpPulse() {
  if (!state.emp.unlocked) {
    setMessage("No EMP weapon recovered.");
    return;
  }
  if (state.emp.cooldown > 0) {
    setMessage(`EMP recharging: ${state.emp.cooldown.toFixed(1)}s.`);
    return;
  }
  if (enemies.length === 0 && enemyBombs.length === 0) {
    setMessage("No targets for EMP.");
    return;
  }

  const duration = 3.8 + state.emp.pathA;
  enemies.forEach((enemy) => {
    const bossScale = enemy.boss && state.emp.pathB >= 4 ? 1.5 : 1;
    enemy.empTimer = Math.max(enemy.empTimer || 0, duration * bossScale);
    enemy.empFreezeTimer = state.emp.pathA >= 5 ? 2 : 0;
    enemy.flash = 0.18;
  });
  enemyBombs.forEach((bomb) => {
    bomb.empTimer = duration;
    bomb.empFreezeTimer = state.emp.pathA >= 3 ? 1.5 : 0;
    bomb.flash = 0.18;
  });
  empPulses.push({ x: state.turret.x, y: state.turret.y, radius: 0, life: 0.65 });
  state.emp.cooldown = relicCooldown("emp");
  setMessage("EMP pulse discharged.");
}

function fireMinefield() {
  if (!state.railgun.unlocked) {
    setMessage("No Minefield relic recovered.");
    return;
  }
  if (state.railgun.cooldown > 0) {
    setMessage(`Minefield recharging: ${state.railgun.cooldown.toFixed(1)}s.`);
    return;
  }
  const baseCount = 4 + (state.railgun.pathA >= 1 ? 1 : 0) + (state.railgun.pathA >= 4 ? 2 : 0);
  const rows = state.railgun.pathA >= 5 ? 2 : 1;
  const deploymentWidth = state.railgun.pathA >= 2 ? canvas.width - 100 : canvas.width * 0.72;
  const damage = 300 * (state.railgun.pathB >= 1 ? 1.3 : 1);
  const blastRadius = 92 * (state.railgun.pathB >= 2 ? 1.3 : 1);
  for (let row = 0; row < rows; row += 1) {
    for (let i = 0; i < baseCount; i += 1) {
      const fraction = baseCount === 1 ? 0.5 : i / (baseCount - 1);
      mines.push({
        x: canvas.width / 2 - deploymentWidth / 2 + deploymentWidth * fraction + (Math.random() - 0.5) * 26,
        y: 120 + row * 155 + (Math.random() - 0.5) * 34,
        armTimer: 0.45 + i * 0.04,
        life: 16,
        triggerRadius: 64 + (state.railgun.pathA >= 3 ? 25 : 0),
        blastRadius,
        damage,
        payloadMultiplier: state.railgun.pathB >= 3 ? 2 : 1,
        cluster: state.railgun.pathB >= 4,
        chain: state.railgun.pathB >= 5,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }
  state.railgun.cooldown = relicCooldown("railgun");
  setMessage(`${baseCount * rows} proximity mines deployed.`);
}

function detonateMine(index, chainScale = 1) {
  const mine = mines[index];
  if (!mine) return;
  enemies.forEach((enemy) => {
    const distance = Math.hypot(enemy.x - mine.x, enemy.y - mine.y);
    if (distance <= mine.blastRadius + enemy.size * 0.35) {
      const falloff = 1 - Math.min(0.4, distance / mine.blastRadius * 0.4);
      applyWeaponDamage(enemy, mine.damage * chainScale * falloff);
      enemy.flash = 0.14;
    }
  });
  enemyBombs.forEach((bomb) => {
    const distance = Math.hypot(bomb.x - mine.x, bomb.y - mine.y);
    if (distance <= mine.blastRadius + bomb.radius) {
      bomb.hp -= mine.damage * mine.payloadMultiplier * chainScale;
      bomb.flash = 0.14;
    }
  });
  if (mine.cluster) {
    enemies
      .filter((enemy) => Math.hypot(enemy.x - mine.x, enemy.y - mine.y) <= mine.blastRadius * 1.6)
      .slice(0, 3)
      .forEach((enemy) => applyWeaponDamage(enemy, mine.damage * 0.3 * chainScale));
  }
  flakBlasts.push({ x: mine.x, y: mine.y, radius: mine.blastRadius, life: 0.34 });
  addSparks(mine.x, mine.y, "#ff8f70", 24);
  mines.splice(index, 1);
  if (mine.chain) {
    const nearbyIndex = mines.findIndex((other) =>
      other.armTimer <= 0 && Math.hypot(other.x - mine.x, other.y - mine.y) <= mine.blastRadius * 1.8,
    );
    if (nearbyIndex >= 0) detonateMine(nearbyIndex, chainScale * 0.75);
  }
}

function dischargeRailPulse(pulse) {
  let hits = 0;
  enemies.forEach((enemy) => {
    const relativeX = enemy.x - pulse.x;
    const relativeY = enemy.y - pulse.y;
    const projection = relativeX * pulse.aimX + relativeY * pulse.aimY;
    const perpendicular = Math.abs(relativeX * pulse.aimY - relativeY * pulse.aimX);
    if (projection > 0 && perpendicular <= pulse.width / 2 + enemy.size * 0.3) {
      const centerBonus = perpendicular <= pulse.width * 0.18 ? pulse.centerMultiplier : 1;
      const eliteBonus = enemy.elite || enemy.boss ? pulse.bossMultiplier : 1;
      applyWeaponDamage(enemy, pulse.damage * centerBonus * eliteBonus * pulse.resonantMultiplier);
      enemy.flash = 0.18;
      hits += 1;
    }
  });
  enemyBombs.forEach((bomb) => {
    const relativeX = bomb.x - pulse.x;
    const relativeY = bomb.y - pulse.y;
    const projection = relativeX * pulse.aimX + relativeY * pulse.aimY;
    const perpendicular = Math.abs(relativeX * pulse.aimY - relativeY * pulse.aimX);
    if (projection > 0 && perpendicular <= pulse.width / 2 + bomb.radius) {
      bomb.hp -= pulse.damage * pulse.payloadMultiplier * pulse.resonantMultiplier;
      bomb.flash = 0.18;
      hits += 1;
    }
  });
  railBeams.push({
    x: pulse.x,
    y: pulse.y,
    aimX: pulse.aimX,
    aimY: pulse.aimY,
    width: pulse.width,
    life: pulse.singularity ? 5 : 1.1,
    persistentDamage: pulse.singularity ? pulse.damage * 0.55 : 0,
    damageTick: 0.2,
  });
  addSparks(pulse.x, state.turret.y - 30, "#d9f8ff", 24);
  if (hits > 0) setMessage(`Railgun pierced ${hits} target${hits === 1 ? "" : "s"}.`);
}

function getAimPoint(distance = 360) {
  return {
    x: clamp(state.turret.x + state.turret.aimX * distance, 24, canvas.width - 24),
    y: clamp(state.turret.y + state.turret.aimY * distance, 30, state.turret.y - 50),
  };
}

function fireGravityWell() {
  if (!state.gravity.unlocked) {
    setMessage("No Gravity Well recovered.");
    return;
  }
  if (state.gravity.cooldown > 0) {
    setMessage(`Gravity Well recharging: ${state.gravity.cooldown.toFixed(1)}s.`);
    return;
  }
  const point = getAimPoint();
  const wellCount = state.gravity.pathB >= 4 ? 2 : 1;
  for (let i = 0; i < wellCount; i += 1) {
    const radius = 135 * (state.gravity.pathB >= 1 ? 1.25 : 1) * (wellCount > 1 ? 0.75 : 1);
    gravityWells.push({
      x: clamp(point.x + (i - (wellCount - 1) / 2) * 100, 30, canvas.width - 30),
      y: Math.min(point.y, state.turret.y - radius - 28),
      radius,
      life: state.gravity.pathB >= 5 ? 8 : 4 + (state.gravity.pathB >= 2 ? 2 : 0),
      pull: 170 * (state.gravity.pathB >= 3 ? 1.35 : 1),
      damagePerSecond: state.gravity.pathA >= 1 ? 42 : 0,
      centerDamage: state.gravity.pathA >= 2,
      payloadMultiplier: state.gravity.pathA >= 3 ? 1.75 : 1,
      burstDamage: state.gravity.pathA >= 4 ? 180 : 0,
      eventHorizon: state.gravity.pathA >= 5,
      eventHorizonTime: state.gravity.pathA >= 5 ? 2 : 0,
      tracking: state.gravity.pathB >= 5,
    });
  }
  state.gravity.cooldown = relicCooldown("gravity");
  setMessage(`${wellCount > 1 ? "Twin Gravity Wells" : "Gravity Well"} deployed.`);
}

function maintainDroneSquadron() {
  if (!state.drones.unlocked) {
    drones.length = 0;
    return;
  }
  const count = 3 + (state.drones.pathA >= 5 ? 2 : 0);
  while (drones.length < count) {
    const i = drones.length;
    drones.push({
      angle: (Math.PI * 2 * i) / count,
      orbitRadius: 52 + (i % 2) * 18,
      x: state.turret.x,
      y: state.turret.y,
      fireCooldown: Math.random() * 0.5,
      elite: state.drones.pathA >= 5 && i >= count - 2,
    });
  }
  drones.forEach((drone, index) => {
    drone.elite = state.drones.pathA >= 5 && index >= count - 2;
  });
  if (drones.length > count) drones.length = count;
}

function addSparks(x, y, color, count = 8) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 120;
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.25 + Math.random() * 0.25,
      color,
    });
  }
}

function dropDebris(enemy) {
  const pieces = enemy.boss ? 8 : enemy.elite ? 4 : 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < pieces; i += 1) {
    debris.push({
      x: enemy.x + (Math.random() - 0.5) * enemy.size,
      y: enemy.y,
      vx: (Math.random() - 0.5) * 100,
      vy: -80 - Math.random() * 80,
      value: enemy.boss ? 3 : enemy.elite ? 2 : 1,
      landed: false,
      radius: enemy.elite ? 8 : 6,
      spin: Math.random() * Math.PI * 2,
      life: 9,
    });
  }

  if (enemy.boss) {
    const carapaceCount = Math.min(5, 2 + Math.floor((state.wave - 1) / 5));
    for (let i = 0; i < carapaceCount; i += 1) {
      dropSpecial(enemy, "carapace");
    }
  } else if (enemy.elite && Math.random() < 0.15) {
    dropSpecial(enemy, "carapace");
  }
  const pendingRelics = new Set(
    specialDrops
      .filter((drop) => drop.type !== "carapace")
      .map((drop) => drop.type),
  );
  const lockedRelics = [];
  if (!state.homing.unlocked && !pendingRelics.has("homing")) lockedRelics.push("homing");
  if (!state.flak.unlocked && !pendingRelics.has("flak")) lockedRelics.push("flak");
  if (!state.emp.unlocked && !pendingRelics.has("emp")) lockedRelics.push("emp");
  if (!state.railgun.unlocked && !pendingRelics.has("railgun")) lockedRelics.push("railgun");
  if (!state.gravity.unlocked && !pendingRelics.has("gravity")) lockedRelics.push("gravity");
  if (!state.drones.unlocked && !pendingRelics.has("drones")) lockedRelics.push("drones");
  if (!state.weaponCore.unlocked && !pendingRelics.has("weaponCore")) lockedRelics.push("weaponCore");
  if (!state.seeker.unlocked && !pendingRelics.has("seeker")) lockedRelics.push("seeker");
  const relicChance = enemy.boss ? 1 / 5 : 1 / 18;
  if (lockedRelics.length > 0 && Math.random() < relicChance) {
    dropSpecial(enemy, lockedRelics[Math.floor(Math.random() * lockedRelics.length)]);
  }
}

function dropSpecial(enemy, type) {
  specialDrops.push({
    type,
    x: enemy.x,
    y: enemy.y,
    vx: (Math.random() - 0.5) * 70,
    vy: -130,
    landed: false,
    radius: type === "carapace" ? 9 : 12,
    spin: 0,
  });
}

function buyUpgrade(type) {
  if (!state.intermission) return;
  if (type !== "repair" && state.upgrades[type] >= BASE_UPGRADE_CONFIG[type].max) return;
  if (!canAffordUpgrade(type)) {
    const cost = getUpgradeCost(type);
    setMessage(`Not enough ${cost.currency === "carapaces" ? "alien carapaces" : "debris"}.`);
    return;
  }

  if (type === "repair") {
    if (state.base.hp >= state.base.maxHp) return;
    spendUpgradeCost(type);
    state.base.hp = Math.min(state.base.maxHp, state.base.hp + 120);
    setMessage("Base plating patched.");
  } else {
    spendUpgradeCost(type);
    state.upgrades[type] += 1;
    if (type === "defense" && state.upgrades.defense === 3) {
      state.base.maxHp += 100;
      state.base.hp += 100;
    }
    if (type === "defense" && [6, 8, 10].includes(state.upgrades.defense)) {
      state.base.maxHp += 75;
      state.base.hp += 75;
    }
    setMessage(`${BASE_UPGRADE_CONFIG[type].names[state.upgrades[type] - 1]} installed.`);
  }
  updateUi();
}

function upgradeRelicPath(type, path) {
  if (!state.intermission || !state[type].unlocked) return;
  const chosenPath = relicChosenPath(type);
  if (chosenPath !== path) return;
  const key = path === "a" ? "pathA" : "pathB";
  const level = state[type][key];
  const cost = level + 1;
  if (level >= 5 || state.carapaces < cost) return;
  state.carapaces -= cost;
  state[type][key] += 1;
  syncRelicLevel(type);
  const installed = RELIC_PATH_CONFIG[type][path][1][state[type][key] - 1];
  setMessage(`${RELIC_PATH_CONFIG[type].name} - ${installed} installed.`);
  updateUi();
}

function upgradePrimaryWeapon() {
  if (!state.intermission || state.primaryWeapon.type === "cannon") return;
  const level = state.primaryWeapon.level;
  const cost = level + 1;
  if (level >= 5 || state.carapaces < cost) return;
  state.carapaces -= cost;
  state.primaryWeapon.level += 1;
  setMessage(`${primaryWeaponConfig().upgrades[level]} installed.`);
  updateUi();
}

function getUpgradeButtons() {
  return [...document.querySelectorAll(
    "[data-stage2-upgrade], [data-stage2-relic-path], [data-stage2-weapon-upgrade]",
  )]
    .filter((button) => !button.hidden && !button.closest("[hidden]") && button.offsetParent !== null);
}

function selectUpgrade(direction = 0) {
  const buttons = getUpgradeButtons();
  if (buttons.length === 0) return;

  if (!state.upgradeSelectionActive) {
    state.upgradeSelectionIndex = direction < 0 ? buttons.length - 1 : 0;
  } else {
    state.upgradeSelectionIndex =
      (state.upgradeSelectionIndex + direction + buttons.length) % buttons.length;
  }
  state.upgradeSelectionActive = true;

  buttons.forEach((button, index) => {
    button.classList.toggle("is-controller-selected", index === state.upgradeSelectionIndex);
  });

  const selected = buttons[state.upgradeSelectionIndex];
  showUpgradeTooltip(selected);
}

function selectUpgradeSpatial(horizontal, vertical) {
  const buttons = getUpgradeButtons();
  if (buttons.length === 0) return;
  if (!state.upgradeSelectionActive) {
    state.upgradeSelectionIndex = 0;
    state.upgradeSelectionActive = true;
  } else {
    const current = buttons[state.upgradeSelectionIndex] || buttons[0];
    const items = buttons.map((button, index) => {
      const rect = button.getBoundingClientRect();
      return {
        button,
        index,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });
    const sortedItems = [...items].sort((a, b) => a.x - b.x);
    const columns = [];
    sortedItems.forEach((item) => {
      const column = columns.find((candidate) => Math.abs(candidate.x - item.x) <= 48);
      if (column) {
        column.items.push(item);
        column.x = column.items.reduce((sum, entry) => sum + entry.x, 0) / column.items.length;
      } else {
        columns.push({ x: item.x, items: [item] });
      }
    });
    columns.sort((a, b) => a.x - b.x);
    columns.forEach((column) => column.items.sort((a, b) => a.y - b.y));

    const currentItem = items.find((item) => item.button === current);
    const currentColumnIndex = columns.findIndex((column) => column.items.includes(currentItem));
    let targetItem = null;

    if (horizontal !== 0) {
      const targetColumnIndex = clamp(currentColumnIndex + horizontal, 0, columns.length - 1);
      const targetColumn = columns[targetColumnIndex];
      targetItem = targetColumn.items.reduce((closest, item) =>
        !closest || Math.abs(item.y - currentItem.y) < Math.abs(closest.y - currentItem.y)
          ? item
          : closest,
      null);
    } else if (vertical !== 0) {
      const currentColumn = columns[currentColumnIndex];
      const currentRowIndex = currentColumn.items.indexOf(currentItem);
      const targetRowIndex = clamp(currentRowIndex + vertical, 0, currentColumn.items.length - 1);
      targetItem = currentColumn.items[targetRowIndex];
    }

    if (targetItem) state.upgradeSelectionIndex = targetItem.index;
  }

  buttons.forEach((button, index) => {
    button.classList.toggle("is-controller-selected", index === state.upgradeSelectionIndex);
  });
  showUpgradeTooltip(buttons[state.upgradeSelectionIndex]);
}

function clearUpgradeSelection() {
  state.upgradeSelectionActive = false;
  getUpgradeButtons().forEach((button) => button.classList.remove("is-controller-selected"));
  hideUpgradeTooltip();
}

function activateSelectedUpgrade() {
  const selected = getUpgradeButtons()[state.upgradeSelectionIndex];
  if (!selected) return;
  selected.click();
  clearUpgradeSelection();
}

function updateInput(dt) {
  let move = 0;
  if (keys.has("a") || keys.has("arrowleft")) move -= 1;
  if (keys.has("d") || keys.has("arrowright")) move += 1;

  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find(Boolean);
  if (pad) {
    ui.controllerStatus.textContent = `${pad.id} connected`;
    ui.controllerStatus.classList.add("connected");
    const axis = Math.abs(pad.axes[0]) > 0.18 ? pad.axes[0] : 0;
    const dpad = (pad.buttons[14]?.pressed ? -1 : 0) + (pad.buttons[15]?.pressed ? 1 : 0);
    move += axis + dpad;

    const aimAxisX = Number.isFinite(pad.axes[2]) ? pad.axes[2] : 0;
    const aimAxisY = Number.isFinite(pad.axes[3]) ? pad.axes[3] : 0;
    const aimMagnitude = Math.hypot(aimAxisX, aimAxisY);
    if (aimMagnitude > 0.32) {
      const constrainedY = Math.min(aimAxisY, -0.18);
      const constrainedMagnitude = Math.hypot(aimAxisX, constrainedY);
      state.turret.aimX = aimAxisX / constrainedMagnitude;
      state.turret.aimY = constrainedY / constrainedMagnitude;
    }

    const lbPressed = Boolean(pad.buttons[4]?.pressed);
    const rbPressed = Boolean(pad.buttons[5]?.pressed);
    if (lbPressed && !state.lbWasPressed) selectUpgrade(-1);
    if (rbPressed && !state.rbWasPressed) selectUpgrade(1);
    state.lbWasPressed = lbPressed;
    state.rbWasPressed = rbPressed;

    const aPressed = Boolean(pad.buttons[0]?.pressed);
    if (state.suppressAUntilRelease) {
      if (!aPressed) state.suppressAUntilRelease = false;
    } else if (state.upgradeSelectionActive) {
      if (aPressed && !state.aWasPressed) activateSelectedUpgrade();
    } else if (aPressed) {
      fire();
    }
    state.aWasPressed = aPressed;

    const bPressed = Boolean(pad.buttons[1]?.pressed);
    if (bPressed && !state.bWasPressed) {
      if (state.upgradeSelectionActive) clearUpgradeSelection();
      else fireMinefield();
    }
    state.bWasPressed = bPressed;

    const rtPressed = Boolean(pad.buttons[7]?.pressed);
    if (rtPressed) fire();
    state.rtWasPressed = rtPressed;

    const yPressed = Boolean(pad.buttons[3]?.pressed);
    if (yPressed && !state.yWasPressed) fireHomingMissile();
    state.yWasPressed = yPressed;

    const xPressed = Boolean(pad.buttons[2]?.pressed);
    if (xPressed && !state.xWasPressed) fireFlakCannon();
    state.xWasPressed = xPressed;

    const stickClickPressed = Boolean(pad.buttons[11]?.pressed);
    if (stickClickPressed && !state.stickClickWasPressed) fireEmpPulse();
    state.stickClickWasPressed = stickClickPressed;

    const ltPressed = Boolean(pad.buttons[6]?.pressed);
    if (ltPressed && !state.ltWasPressed) fireGravityWell();
    state.ltWasPressed = ltPressed;

    const pausePressed = Boolean(pad.buttons[9]?.pressed);
    if (pausePressed && !state.pauseWasPressed) togglePause();
    state.pauseWasPressed = pausePressed;
  }

  state.turret.x = clamp(state.turret.x + clamp(move, -1, 1) * turretMoveSpeed() * dt, 24, canvas.width - 24);
  if (keys.has(" ")) fire();
  if (state.upgrades.reload >= 5 && hasTargetNearAimLine()) fire();
}

function updateStartController() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find(Boolean);
  if (!pad) {
    ui.startButton.classList.remove("is-controller-selected");
    return;
  }

  ui.controllerStatus.textContent = `${pad.id} connected`;
  ui.controllerStatus.classList.add("connected");
  ui.startButton.classList.add("is-controller-selected");

  const aPressed = Boolean(pad.buttons[0]?.pressed);
  const startPressed = Boolean(pad.buttons[9]?.pressed);
  if ((aPressed && !state.aWasPressed) || (startPressed && !state.pauseWasPressed)) {
    state.suppressAUntilRelease = aPressed;
    state.aWasPressed = aPressed;
    state.pauseWasPressed = startPressed;
    startGame();
    return;
  }

  state.aWasPressed = aPressed;
  state.pauseWasPressed = startPressed;
}

function updateWorld(dt) {
  state.turret.cooldown = Math.max(0, state.turret.cooldown - dt);
  const cryoMultiplier = state.upgrades.cooling >= 5 && state.turret.heat >= 0.9 ? 4 : 1;
  state.turret.heat = Math.max(0, state.turret.heat - heatDrain() * cryoMultiplier * dt);
  state.homing.cooldown = Math.max(0, state.homing.cooldown - dt);
  state.flak.cooldown = Math.max(0, state.flak.cooldown - dt);
  state.emp.cooldown = Math.max(0, state.emp.cooldown - dt);
  state.railgun.cooldown = Math.max(0, state.railgun.cooldown - dt);
  state.gravity.cooldown = Math.max(0, state.gravity.cooldown - dt);
  state.drones.cooldown = 0;
  state.messageTimer = Math.max(0, state.messageTimer - dt);
  maintainDroneSquadron();
  for (let i = missileSalvoQueue.length - 1; i >= 0; i -= 1) {
    missileSalvoQueue[i].delay -= dt;
    if (missileSalvoQueue[i].delay <= 0) {
      launchHomingSalvo(missileSalvoQueue[i].damageScale);
      missileSalvoQueue.splice(i, 1);
    }
  }
  for (let i = flakSalvoQueue.length - 1; i >= 0; i -= 1) {
    flakSalvoQueue[i].delay -= dt;
    if (flakSalvoQueue[i].delay <= 0) {
      launchFlakSalvo(flakSalvoQueue[i].damageScale);
      flakSalvoQueue.splice(i, 1);
    }
  }

  if (state.bossPending || state.enemiesQueued > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      if (state.bossPending) {
        spawnEnemy(true);
        state.bossPending = false;
      } else {
        spawnEnemy();
        state.enemiesQueued -= 1;
      }
      state.spawnTimer = Math.max(0.3, 1.55 - state.wave * 0.055);
    }
  } else if (enemies.length === 0 && enemyBombs.length === 0 && debris.length === 0 && specialDrops.length === 0) {
    beginWaveIntermission();
    return;
  } else if (enemies.length === 0 && state.messageTimer <= 0) {
    setMessage(enemyBombs.length > 0 ? "Incoming payloads remain. Shoot them down." : "Wave cleared. Collect remaining salvage.");
  }

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    if (bullet.railWake) {
      enemies.forEach((enemy) => {
        const relativeX = enemy.x - bullet.originX;
        const relativeY = enemy.y - bullet.originY;
        const projection = relativeX * bullet.directionX + relativeY * bullet.directionY;
        const traveled = Math.hypot(bullet.x - bullet.originX, bullet.y - bullet.originY);
        if (projection < 0 || projection > traveled + 60) return;
        const closestX = bullet.originX + bullet.directionX * projection;
        const closestY = bullet.originY + bullet.directionY * projection;
        const dx = closestX - enemy.x;
        const dy = closestY - enemy.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        if (distance <= bullet.wakeRadius) {
          const pull = (1 - distance / bullet.wakeRadius) * bullet.wakeStrength * dt;
          enemy.x += (dx / distance) * pull;
          enemy.y += Math.min(0, (dy / distance) * pull);
          enemy.x = clamp(enemy.x, 32, canvas.width - 32);
        }
      });
    }
    const seekTargets = enemies.concat(enemyBombs).filter((target) => !bullet.hitTargets.has(target));
    if (bullet.seekingStrength > 0 && seekTargets.length > 0) {
      seekTargets.sort((a, b) => {
        if (state.seeker.pathB >= 2 && Boolean(a.boss) !== Boolean(b.boss)) return a.boss ? -1 : 1;
        return Math.hypot(a.x - bullet.x, a.y - bullet.y) - Math.hypot(b.x - bullet.x, b.y - bullet.y);
      });
      const target = seekTargets[bullet.targetSlot % seekTargets.length];
      if (target) {
        const leadTime = bullet.predictiveGuidance
          ? Math.min(0.55, Math.hypot(target.x - bullet.x, target.y - bullet.y) / Math.max(1, Math.hypot(bullet.vx, bullet.vy)))
          : 0;
        const dx = target.x + (target.vx || 0) * leadTime - bullet.x;
        const dy = target.y + (target.speed || 0) * leadTime - bullet.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const speed = Math.hypot(bullet.vx, bullet.vy);
        const turn = Math.min(1, bullet.seekingStrength * dt);
        bullet.vx += ((dx / distance) * speed - bullet.vx) * turn;
        bullet.vy += ((dy / distance) * speed - bullet.vy) * turn;
        const correctedSpeed = Math.max(1, Math.hypot(bullet.vx, bullet.vy));
        bullet.vx = (bullet.vx / correctedSpeed) * speed;
        bullet.vy = (bullet.vy / correctedSpeed) * speed;
        bullet.trackingTime += dt;
      }
    }
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    const outside = bullet.y < -20 || bullet.x < -20 || bullet.x > canvas.width + 20;
    if (outside && bullet.reversalReady && seekTargets.length > 0) {
      bullet.reversalReady = false;
      bullet.x = clamp(bullet.x, 2, canvas.width - 2);
      bullet.y = Math.max(2, bullet.y);
      bullet.vx *= -1;
      bullet.vy = Math.abs(bullet.vy);
    } else if (outside) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemyBombs.length - 1; i >= 0; i -= 1) {
    const bomb = enemyBombs[i];
    bomb.empTimer = Math.max(0, (bomb.empTimer || 0) - dt);
    bomb.empFreezeTimer = Math.max(0, (bomb.empFreezeTimer || 0) - dt);
    const bombEmpScale = bomb.empFreezeTimer > 0 ? 0 : bomb.empTimer > 0 ? 0.4 : 1;
    bomb.y += bomb.speed * bombEmpScale * dt;
    bomb.x = clamp(bomb.x + bomb.vx * dt, bomb.radius, canvas.width - bomb.radius);
    bomb.spin += dt * 2.4;
    bomb.flash = Math.max(0, bomb.flash - dt);

    for (let b = bullets.length - 1; b >= 0; b -= 1) {
      const bullet = bullets[b];
      if (bullet.hitTargets.has(bomb)) continue;
      if (Math.hypot(bullet.x - bomb.x, bullet.y - bomb.y) <= bomb.radius + bullet.radius) {
        if (bullet.weaponType === "bomb") {
          detonatePrimaryBomb(bullet);
          bullets.splice(b, 1);
          break;
        }
        bomb.hp -= bullet.damage * bullet.payloadMultiplier * targetingDamageMultiplier(bomb);
        bomb.flash = 0.1;
        if (bullet.payloadFragments) bomb.fragmentDamage = Math.max(bomb.fragmentDamage || 0, bullet.damage * 0.42);
        bullet.hitTargets.add(bomb);
        bullet.remainingHits -= 1;
        if (bullet.remainingHits <= 0) bullets.splice(b, 1);
        addSparks(bomb.x, bomb.y, "#ffb44a", 5);
        if (bomb.hp <= 0) break;
      }
    }

    if (bomb.hp <= 0) {
      addSparks(bomb.x, bomb.y, "#ffb44a", 16);
      if (bomb.fragmentDamage) {
        for (let fragment = -1; fragment <= 1; fragment += 1) {
          const angle = -Math.PI / 2 + fragment * 0.42;
          bullets.push({
            x: bomb.x, y: bomb.y, vx: Math.cos(angle) * 440, vy: Math.sin(angle) * 440,
            damage: bomb.fragmentDamage, radius: 3.5, seekingStrength: 0,
            targetSlot: 0, predictiveGuidance: false, reversalReady: false, trackingTime: 0,
            remainingHits: 1, hitTargets: new Set(), fragmenting: false,
            payloadMultiplier: 1, payloadFragments: false, eliteMultiplier: 1,
            executeMultiplier: 1, seekerRound: false,
          });
        }
      }
      enemyBombs.splice(i, 1);
      continue;
    }

    if (bomb.y >= state.base.y - 10) {
      const impactDamage = bomb.damage * baseDamageMultiplier();
      state.base.hp -= impactDamage;
      if (state.drones.pathB >= 4) {
        state.base.hp = Math.min(state.base.maxHp, state.base.hp + impactDamage * 0.2);
      }
      addSparks(bomb.x, state.base.y - 16, "#ff4f45", 24);
      enemyBombs.splice(i, 1);
      setMessage(`Alien bomb hit the base for ${Math.ceil(impactDamage)} damage.`);
      if (state.base.hp <= 0) endGame();
    }
  }

  for (let i = missiles.length - 1; i >= 0; i -= 1) {
    const missile = missiles[i];
    missile.life -= dt;
    missile.hitGrace = Math.max(0, missile.hitGrace - dt);
    const prioritizedTargets = [...enemies].sort((a, b) => {
      if (state.homing.pathB >= 2 && a.boss !== b.boss) return a.boss ? -1 : 1;
      if (a.boss !== b.boss) return a.boss ? -1 : 1;
      return b.y - a.y;
    });
    const target = prioritizedTargets.length > 0
      ? prioritizedTargets[missile.targetSlot % prioritizedTargets.length]
      : null;

    if (target) {
      const dx = target.x - missile.x;
      const dy = target.y - missile.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const desiredVx = (dx / distance) * missile.speed;
      const desiredVy = (dy / distance) * missile.speed;
      const turn = Math.min(1, dt * 6.5);
      missile.vx += (desiredVx - missile.vx) * turn;
      missile.vy += (desiredVy - missile.vy) * turn;
    }

    missile.x += missile.vx * dt;
    missile.y += missile.vy * dt;

    let hit = false;
    for (const enemy of enemies) {
      const dx = enemy.x - missile.x;
      const dy = enemy.y - missile.y;
      if (missile.hitGrace <= 0 && dx * dx + dy * dy <= (enemy.size * 0.62 + missile.radius) ** 2) {
        const wasAlive = enemy.hp > 0;
        const eliteMultiplier = state.homing.pathB >= 2 && (enemy.elite || enemy.boss) ? 1.35 : 1;
        applyWeaponDamage(enemy, missile.damage * eliteMultiplier);
        if (state.homing.pathB >= 4) applyWeaponDamage(enemy, missile.damage * 0.5 * eliteMultiplier);
        enemy.flash = 0.12;
        addSparks(missile.x, missile.y, "#f2c45b", 16);
        if (state.homing.pathB >= 3) {
          enemies.forEach((nearby) => {
            if (nearby === enemy) return;
            if (Math.hypot(nearby.x - missile.x, nearby.y - missile.y) <= 70) {
              applyWeaponDamage(nearby, missile.damage * 0.35);
            }
          });
          flakBlasts.push({ x: missile.x, y: missile.y, radius: 70, life: 0.28 });
        }
        if (wasAlive && enemy.hp <= 0 && state.homing.pathA >= 4) {
          missiles.push({
            x: enemy.x, y: enemy.y, vx: 0, vy: -260, speed: 460,
            damage: missile.damage * 0.35, radius: 5, life: 3,
            targetSlot: missile.targetSlot + 1, passes: 0, hitGrace: 0.15,
          });
        }
        hit = true;
        break;
      }
    }
    if (hit && state.homing.pathA >= 3 && missile.passes < 1 && enemies.length > 1) {
      missile.passes += 1;
      missile.damage *= 0.6;
      missile.targetSlot += 1;
      missile.hitGrace = 0.18;
      missile.vy = -220;
      missile.life = Math.max(missile.life, 2);
      hit = false;
    }
    if (hit || missile.life <= 0) missiles.splice(i, 1);
  }

  for (let i = flakShells.length - 1; i >= 0; i -= 1) {
    const shell = flakShells[i];
    shell.life -= dt;
    const dx = shell.targetX - shell.x;
    const dy = shell.targetY - shell.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const travel = Math.min(distance, shell.speed * dt);
    shell.x += (dx / distance) * travel;
    shell.y += (dy / distance) * travel;
    const proximityHit = shell.proximityRadius > 0 && enemies.some((enemy) =>
      Math.hypot(enemy.x - shell.x, enemy.y - shell.y) <= shell.proximityRadius + enemy.size * 0.5,
    );
    if (distance <= 12 || proximityHit || shell.life <= 0) {
      detonateFlak(shell);
      flakShells.splice(i, 1);
    }
  }

  for (let i = flakBlasts.length - 1; i >= 0; i -= 1) {
    const blast = flakBlasts[i];
    blast.life -= dt;
    if (blast.lingering) {
      enemies.forEach((enemy) => {
        if (Math.hypot(enemy.x - blast.x, enemy.y - blast.y) <= blast.radius) {
          applyWeaponDamage(enemy, blast.damagePerSecond * dt);
        }
      });
    }
    if (blast.life <= 0) flakBlasts.splice(i, 1);
  }

  for (let i = empPulses.length - 1; i >= 0; i -= 1) {
    const pulse = empPulses[i];
    pulse.life -= dt;
    pulse.radius += 1100 * dt;
    if (pulse.life <= 0) empPulses.splice(i, 1);
  }

  for (let i = mines.length - 1; i >= 0; i -= 1) {
    const mine = mines[i];
    mine.armTimer -= dt;
    mine.life -= dt;
    mine.pulse += dt * 4;
    const triggered = mine.armTimer <= 0 && enemies.concat(enemyBombs).some((target) =>
      Math.hypot(target.x - mine.x, target.y - mine.y) <= mine.triggerRadius + (target.radius || target.size * 0.4),
    );
    if (triggered) {
      detonateMine(i);
    } else if (mine.life <= 0) {
      mines.splice(i, 1);
    }
  }

  for (let i = railBeams.length - 1; i >= 0; i -= 1) {
    const beam = railBeams[i];
    beam.life -= dt;
    if (beam.persistentDamage > 0) {
      beam.damageTick -= dt;
      if (beam.damageTick <= 0) {
        beam.damageTick = 0.2;
        enemies.forEach((enemy) => {
          const rx = enemy.x - beam.x;
          const ry = enemy.y - beam.y;
          const projection = rx * beam.aimX + ry * beam.aimY;
          const perpendicular = Math.abs(rx * beam.aimY - ry * beam.aimX);
          if (projection > 0 && perpendicular <= beam.width / 2 + enemy.size * 0.3) {
            applyWeaponDamage(enemy, beam.persistentDamage * 0.2);
            enemy.flash = 0.08;
          }
        });
        enemyBombs.forEach((bomb) => {
          const rx = bomb.x - beam.x;
          const ry = bomb.y - beam.y;
          const projection = rx * beam.aimX + ry * beam.aimY;
          const perpendicular = Math.abs(rx * beam.aimY - ry * beam.aimX);
          if (projection > 0 && perpendicular <= beam.width / 2 + bomb.radius) {
            bomb.hp -= beam.persistentDamage * 0.2;
            bomb.flash = 0.08;
          }
        });
      }
    }
    if (beam.life <= 0) railBeams.splice(i, 1);
  }

  for (let i = railPulseQueue.length - 1; i >= 0; i -= 1) {
    railPulseQueue[i].delay -= dt;
    if (railPulseQueue[i].delay <= 0) {
      dischargeRailPulse(railPulseQueue[i]);
      railPulseQueue.splice(i, 1);
    }
  }

  for (let i = gravityWells.length - 1; i >= 0; i -= 1) {
    const well = gravityWells[i];
    well.life -= dt;
    well.eventHorizonTime = Math.max(0, (well.eventHorizonTime || 0) - dt);
    if (well.tracking && enemies.length > 0) {
      const target = findFlakTarget();
      if (target) {
        well.x += (target.x - well.x) * Math.min(1, dt * 2.4);
        const safeTargetY = Math.min(target.y, state.turret.y - well.radius - 28);
        well.y += (safeTargetY - well.y) * Math.min(1, dt * 2.4);
      }
    }
    enemies.forEach((enemy) => {
      const dx = well.x - enemy.x;
      const dy = well.y - enemy.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      if (distance <= well.radius) {
        const pullScale = 1 - distance / well.radius;
        enemy.x += (dx / distance) * well.pull * pullScale * dt;
        enemy.y += (dy / distance) * well.pull * pullScale * dt;
        enemy.gravitySlow = Math.max(enemy.gravitySlow || 0, 0.12);
        if (well.eventHorizonTime > 0 && distance <= well.radius * 0.2) {
          enemy.x += (well.x - enemy.x) * Math.min(1, dt * 5);
          enemy.y += (well.y - enemy.y) * Math.min(1, dt * 5);
        }
        if (well.damagePerSecond > 0) {
          const centerMultiplier = well.centerDamage ? 1 + pullScale : 1;
          applyWeaponDamage(enemy, well.damagePerSecond * centerMultiplier * dt);
        }
      }
    });
    enemyBombs.forEach((bomb) => {
      const dx = well.x - bomb.x;
      const dy = well.y - bomb.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      if (distance <= well.radius) {
        const pullScale = 1 - distance / well.radius;
        bomb.x += (dx / distance) * well.pull * pullScale * dt;
        bomb.y += (dy / distance) * well.pull * pullScale * dt;
        bomb.hp -= well.damagePerSecond * 1.25 * well.payloadMultiplier * dt;
        bomb.flash = 0.05;
      }
    });
    if (well.life <= 0) {
      if (well.burstDamage > 0) {
        enemies.forEach((enemy) => {
          if (Math.hypot(enemy.x - well.x, enemy.y - well.y) <= well.radius) {
            applyWeaponDamage(enemy, well.burstDamage);
          }
        });
        enemyBombs.forEach((bomb) => {
          if (Math.hypot(bomb.x - well.x, bomb.y - well.y) <= well.radius) bomb.hp -= well.burstDamage;
        });
        flakBlasts.push({ x: well.x, y: well.y, radius: well.radius, life: 0.32 });
      }
      gravityWells.splice(i, 1);
    }
  }

  for (let i = drones.length - 1; i >= 0; i -= 1) {
    const drone = drones[i];
    drone.angle += dt * 1.8;
    drone.x = state.turret.x + Math.cos(drone.angle) * drone.orbitRadius;
    drone.y = state.turret.y - 22 + Math.sin(drone.angle) * drone.orbitRadius * 0.45;
    drone.fireCooldown -= dt;
    const droneTargets = state.drones.pathA >= 2 && enemyBombs.length > 0
      ? enemyBombs
      : enemies.concat(enemyBombs);
    if (drone.fireCooldown <= 0 && droneTargets.length > 0) {
      const target = droneTargets.reduce((closest, targetCandidate) => {
        if (!closest) return targetCandidate;
        if (state.drones.pathA >= 3) {
          const candidateRatio = targetCandidate.hp / Math.max(1, targetCandidate.maxHp || targetCandidate.hp);
          const closestRatio = closest.hp / Math.max(1, closest.maxHp || closest.hp);
          if (candidateRatio !== closestRatio) return candidateRatio < closestRatio ? targetCandidate : closest;
        }
        return Math.hypot(targetCandidate.x - drone.x, targetCandidate.y - drone.y) < Math.hypot(closest.x - drone.x, closest.y - drone.y)
          ? targetCandidate : closest;
      }, null);
      const dx = target.x - drone.x;
      const dy = target.y - drone.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      droneShots.push({
        x: drone.x,
        y: drone.y,
        vx: (dx / distance) * 500,
        vy: (dy / distance) * 500,
        damage: 13 * (state.drones.pathA >= 1 ? 1.25 : 1) * (drone.elite ? 1.8 : 1),
        life: 2,
      });
      drone.fireCooldown = drone.elite ? 0.62 : 0.9;
    }
  }
  if (state.drones.unlocked && state.drones.pathA >= 4) {
    state.drones.interceptTimer -= dt;
    if (state.drones.interceptTimer <= 0 && enemyBombs.length > 0) {
      const payload = enemyBombs.reduce((lowest, candidate) => candidate.y > lowest.y ? candidate : lowest);
      const index = enemyBombs.indexOf(payload);
      addSparks(payload.x, payload.y, "#7ee3a1", 14);
      enemyBombs.splice(index, 1);
      state.drones.interceptTimer = 5;
    }
  }
  if (state.drones.unlocked && state.drones.pathB >= 3) {
    state.base.hp = Math.min(state.base.maxHp, state.base.hp + 1.2 * dt);
  }
  if (state.drones.unlocked && state.drones.pathB >= 5) {
    state.drones.foundryTimer -= dt;
    if (state.drones.foundryTimer <= 0) {
      state.debris += 1;
      state.drones.foundryTimer = 18;
      addSparks(state.turret.x, state.turret.y - 30, "#f2c45b", 6);
    }
  }

  for (let i = droneShots.length - 1; i >= 0; i -= 1) {
    const shot = droneShots[i];
    shot.life -= dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    let hit = false;
    for (const bomb of enemyBombs) {
      if (Math.hypot(bomb.x - shot.x, bomb.y - shot.y) <= bomb.radius + 4) {
        bomb.hp -= shot.damage;
        bomb.flash = 0.08;
        hit = true;
        break;
      }
    }
    for (const enemy of enemies) {
      if (hit) break;
      if (Math.hypot(enemy.x - shot.x, enemy.y - shot.y) <= enemy.size * 0.55 + 4) {
        applyWeaponDamage(enemy, shot.damage);
        enemy.flash = 0.08;
        hit = true;
        break;
      }
    }
    if (hit || shot.life <= 0) droneShots.splice(i, 1);
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    enemy.wobble += dt * 3;
    enemy.empTimer = Math.max(0, (enemy.empTimer || 0) - dt);
    enemy.empFreezeTimer = Math.max(0, (enemy.empFreezeTimer || 0) - dt);
    enemy.gravitySlow = Math.max(0, (enemy.gravitySlow || 0) - dt);
    const empBlocksAbilities = enemy.empTimer > 0 && (state.emp.pathB >= 5 || state.emp.pathB >= 1);
    if (enemy.bossType === "carrier" && enemy.y >= enemy.patrolY - 4 && !empBlocksAbilities) {
      enemy.attackCooldown -= dt;
      enemy.heavyBombCooldown -= dt;
      const activeCarrierPayloads = enemyBombs.filter((bomb) => bomb.sourceCarrier).length;
      const carrierPayloadCap = state.wave <= 10 ? 4 : 6;
      if (enemy.attackCooldown <= 0 && activeCarrierPayloads < carrierPayloadCap) {
        launchEnemyBomb(enemy, "plasma");
        enemyBombs.at(-1).sourceCarrier = true;
        enemy.attackCooldown = state.wave <= 10
          ? 2.1
          : Math.max(0.9, 1.75 - state.wave * 0.025);
      }
      const activeCarrierBombs = enemyBombs.filter((bomb) => bomb.carrierPayload).length;
      const carrierPayloadSlotsAvailable =
        enemyBombs.filter((bomb) => bomb.sourceCarrier).length < carrierPayloadCap;
      const heavyBombCap = state.wave <= 10 ? 1 : 2;
      if (enemy.heavyBombCooldown <= 0 && carrierPayloadSlotsAvailable && activeCarrierBombs < heavyBombCap) {
        launchEnemyBomb(enemy, "bomb");
        enemyBombs.at(-1).sourceCarrier = true;
        enemy.heavyBombCooldown = Math.max(3.8, 6.5 - state.wave * 0.04);
      }
    } else if (enemy.bombsRemaining > 0 && !empBlocksAbilities) {
      enemy.bombCooldown -= dt;
      if (enemy.bombCooldown <= 0 && enemy.y > 55 && enemy.y < state.base.y - 130) {
        launchEnemyBomb(enemy);
      }
    }
    const empSpeedMultiplier = enemy.empFreezeTimer > 0 ? 0 :
      enemy.empTimer > 0 ? (state.emp.pathA >= 2 ? 0.04 : 0.08) : 1;
    const gravitySpeedMultiplier = enemy.gravitySlow > 0 ? 0.35 : 1;
    if (enemy.bossType === "carrier") {
      if (enemy.y < enemy.patrolY) {
        enemy.y = Math.min(enemy.patrolY, enemy.y + enemy.speed * 1.5 * empSpeedMultiplier * dt);
      } else {
        enemy.x += enemy.vx * empSpeedMultiplier * gravitySpeedMultiplier * dt;
        enemy.y = enemy.patrolY + Math.sin(enemy.wobble * 0.45) * 10;
        if (enemy.x <= enemy.size || enemy.x >= canvas.width - enemy.size) enemy.vx *= -1;
      }
    } else {
      enemy.x += (enemy.vx + Math.sin(enemy.wobble) * 16) * empSpeedMultiplier * gravitySpeedMultiplier * dt;
      enemy.y += enemy.speed * empSpeedMultiplier * gravitySpeedMultiplier * dt;
    }
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.x = clamp(enemy.x, 32, canvas.width - 32);

    for (let b = bullets.length - 1; b >= 0; b -= 1) {
      const bullet = bullets[b];
      if (bullet.hitTargets.has(enemy)) continue;
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      if (dx * dx + dy * dy <= (enemy.size * 0.62) ** 2) {
        if (bullet.weaponType === "bomb") {
          detonatePrimaryBomb(bullet);
          bullets.splice(b, 1);
          break;
        }
        const eliteOrBoss = enemy.elite || enemy.boss;
        const trackingMultiplier = state.seeker.pathB >= 4
          ? 1 + Math.min(0.35, bullet.trackingTime * 0.12)
          : 1;
        const executeMultiplier = state.seeker.pathB >= 5 && eliteOrBoss &&
          enemy.hp / Math.max(1, enemy.maxHp) <= 0.2 ? bullet.executeMultiplier : 1;
        applyWeaponDamage(
          enemy,
          bullet.damage * (eliteOrBoss ? bullet.eliteMultiplier : 1) *
            trackingMultiplier * executeMultiplier * targetingDamageMultiplier(enemy),
        );
        if (bullet.echo) applyWeaponDamage(enemy, bullet.damage * 0.55);
        bullet.hitTargets.add(enemy);
        if (state.upgrades.damage >= 5 || bullet.fragmenting) {
          const blastRadius = state.upgrades.damage >= 5 ? 58 : 44;
          const splashScale = state.upgrades.damage >= 5 ? 0.4 : 0.25;
          enemies.forEach((nearby) => {
            if (nearby === enemy) return;
            if (Math.hypot(nearby.x - bullet.x, nearby.y - bullet.y) <= blastRadius) {
              applyWeaponDamage(nearby, bullet.damage * splashScale);
            }
          });
          flakBlasts.push({ x: bullet.x, y: bullet.y, radius: blastRadius, life: 0.22 });
        }
        enemy.flash = 0.08;
        bullet.remainingHits -= 1;
        if (bullet.remainingHits <= 0) bullets.splice(b, 1);
        addSparks(bullet.x, bullet.y, "#68d6c7", 5);
        break;
      }
    }

    if (enemy.hp <= 0) {
      if (state.emp.pathB >= 3 && enemy.empTimer > 0) {
        enemies.forEach((nearby) => {
          if (nearby === enemy) return;
          if (Math.hypot(nearby.x - enemy.x, nearby.y - enemy.y) <= 105) {
            nearby.empTimer = Math.max(nearby.empTimer || 0, 1.2);
          }
        });
        empPulses.push({ x: enemy.x, y: enemy.y, radius: 0, life: 0.32 });
      }
      dropDebris(enemy);
      addSparks(enemy.x, enemy.y, enemy.elite ? "#f2c45b" : "#ff7a66", 18);
      enemies.splice(i, 1);
      continue;
    }

    if (enemy.bossType !== "carrier" && enemy.y >= state.base.y - 8) {
      if (state.upgrades.defense >= 4 && state.defense.shieldReady) {
        state.defense.shieldReady = false;
        addSparks(enemy.x, state.base.y - 20, "#7ee3a1", 28);
        enemies.splice(i, 1);
        setMessage("Reflective Shield repelled an incoming ship.");
        continue;
      }
      const impactDamage = enemy.damage * baseDamageMultiplier();
      if (state.upgrades.defense >= 5 && state.defense.artifactShieldReady && state.base.hp - impactDamage <= 0) {
        state.defense.artifactShieldReady = false;
        state.base.hp = 1;
        addSparks(state.base.x, state.base.y - 20, "#a97cff", 36);
        enemies.splice(i, 1);
        setMessage("Artifact Shield prevented base destruction.");
        continue;
      }
      state.base.hp -= impactDamage;
      addSparks(enemy.x, state.base.y - 14, "#ff7a66", 16);
      enemies.splice(i, 1);
      setMessage("Base hull hit.");
      if (state.base.hp <= 0) endGame();
    }
  }

  for (let i = debris.length - 1; i >= 0; i -= 1) {
    const piece = debris[i];
    piece.life -= dt;
    if (piece.life <= 0) {
      debris.splice(i, 1);
      continue;
    }
    if (!piece.landed) {
      piece.vy += 460 * dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.vx *= 0.985;
      piece.spin += dt * 8;
      if (piece.y >= canvas.height - 84) {
        piece.y = canvas.height - 84;
        piece.x = clamp(piece.x, 24, canvas.width - 24);
        piece.vx = 0;
        piece.vy = 0;
        piece.landed = true;
      }
    }

    const dx = piece.x - state.turret.x;
    const dy = piece.y - state.turret.y;
    const droneCollectionRadius = 42 * (state.drones.pathB >= 1 ? 1.5 : 1);
    const collectedByDrone = drones.some((drone) =>
      Math.hypot(piece.x - drone.x, piece.y - drone.y) <= droneCollectionRadius,
    );
    if (dx * dx + dy * dy <= 32 ** 2 || collectedByDrone) {
      state.debris += collectedByDrone && state.drones.pathB >= 2
        ? Math.max(1, Math.round(piece.value * 1.2))
        : piece.value;
      addSparks(piece.x, piece.y, "#f2c45b", 7);
      debris.splice(i, 1);
    }
  }

  for (let i = specialDrops.length - 1; i >= 0; i -= 1) {
    const drop = specialDrops[i];
    if (!drop.landed) {
      drop.vy += 420 * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.vx *= 0.985;
      drop.spin += dt * 5;
      if (drop.y >= canvas.height - 84) {
        drop.y = canvas.height - 84;
        drop.x = clamp(drop.x, 24, canvas.width - 24);
        drop.vx = 0;
        drop.vy = 0;
        drop.landed = true;
      }
    }

    const dx = drop.x - state.turret.x;
    const dy = drop.y - state.turret.y;
    const droneCollectionRadius = 42 * (state.drones.pathB >= 1 ? 1.5 : 1);
    const collectedByDrone = drones.some((drone) =>
      Math.hypot(drop.x - drone.x, drop.y - drone.y) <= droneCollectionRadius,
    );
    if (dx * dx + dy * dy <= 38 ** 2 || collectedByDrone) {
      if (drop.type === "carapace") {
        state.carapaces += 1;
        setMessage("Alien carapace recovered.");
      } else if (drop.type === "homing") {
        state.homing.unlocked = true;
        setMessage("Relic recovered: Homing Missile.");
      } else if (drop.type === "flak") {
        state.flak.unlocked = true;
        setMessage("Relic recovered: Flak Cannon.");
      } else if (drop.type === "emp") {
        state.emp.unlocked = true;
        setMessage("Relic recovered: EMP Pulse.");
      } else if (drop.type === "railgun") {
        state.railgun.unlocked = true;
        setMessage("Relic recovered: Minefield.");
      } else if (drop.type === "gravity") {
        state.gravity.unlocked = true;
        setMessage("Relic recovered: Gravity Well.");
      } else if (drop.type === "drones") {
        state.drones.unlocked = true;
        maintainDroneSquadron();
        setMessage("Relic recovered: Drone Squadron is permanently active.");
      } else if (drop.type === "weaponCore") {
        state.weaponCore.unlocked = true;
        setMessage("Weapon Core recovered. Choose a permanent primary weapon.");
      } else if (drop.type === "seeker") {
        state.seeker.unlocked = true;
        setMessage("Relic recovered: Seeking Matrix.");
      }
      if (drop.type === "weaponCore") showWeaponCoreChoice();
      else if (drop.type !== "carapace") showRelicPathChoice(drop.type);
      const dropColor = {
        homing: "#a97cff",
        flak: "#ffb44a",
        emp: "#63e6ff",
        railgun: "#ff8f70",
        gravity: "#6da9ff",
        drones: "#7ee3a1",
        weaponCore: "#ff8f70",
        seeker: "#8ce6ff",
        carapace: "#7ee3a1",
      }[drop.type];
      addSparks(drop.x, drop.y, dropColor, 18);
      specialDrops.splice(i, 1);
    }
  }

  for (let i = sparks.length - 1; i >= 0; i -= 1) {
    const spark = sparks[i];
    spark.life -= dt;
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vy += 120 * dt;
    if (spark.life <= 0) sparks.splice(i, 1);
  }
  for (let i = lightningArcs.length - 1; i >= 0; i -= 1) {
    lightningArcs[i].life -= dt;
    if (lightningArcs[i].life <= 0) lightningArcs.splice(i, 1);
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#151b29");
  sky.addColorStop(0.45, "#101923");
  sky.addColorStop(1, "#0a0d10");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(104, 214, 199, 0.08)";
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 157 + state.wave * 11) % canvas.width;
    const y = (i * 71) % 360;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "#10161a";
  ctx.fillRect(0, canvas.height - 78, canvas.width, 78);
  ctx.fillStyle = "#20272d";
  ctx.fillRect(state.base.x - state.base.width / 2, state.base.y, state.base.width, 42);
  ctx.fillStyle = "#30404a";
  ctx.fillRect(state.base.x - state.base.width / 2 + 18, state.base.y - 20, state.base.width - 36, 20);
  ctx.fillStyle = "#68d6c7";
  ctx.fillRect(state.base.x - 42, state.base.y - 28, 84, 8);
}

function drawTurret() {
  const x = state.turret.x;
  const y = state.turret.y;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#26333a";
  ctx.fillRect(-32, 20, 64, 18);
  ctx.fillStyle = "#68d6c7";
  ctx.fillRect(-20, 12, 40, 12);
  ctx.save();
  ctx.rotate(Math.atan2(state.turret.aimY, state.turret.aimX) + Math.PI / 2);
  ctx.fillStyle = state.turret.heat > 0.9 ? "#ff7a66" : "#f2c45b";
  ctx.fillRect(-7, -34, 14, 52);
  ctx.restore();
  ctx.fillStyle = "rgba(104, 214, 199, 0.18)";
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#34404a";
  ctx.fillRect(x - 34, y + 46, 68, 5);
  ctx.fillStyle = state.turret.heat > 0.9 ? "#ff7a66" : "#68d6c7";
  ctx.fillRect(x - 34, y + 46, 68 * clamp(state.turret.heat, 0, 1), 5);
}

function drawAimReticle() {
  if (state.upgrades.targeting < 2) return;
  const distance = state.upgrades.targeting >= 3 ? 440 : 285;
  const x = clamp(state.turret.x + state.turret.aimX * distance, 18, canvas.width - 18);
  const y = clamp(state.turret.y + state.turret.aimY * distance, 24, state.turret.y - 70);
  const startX = state.turret.x + state.turret.aimX * 42;
  const startY = state.turret.y + state.turret.aimY * 42;

  ctx.save();
  ctx.strokeStyle = "rgba(104, 214, 199, 0.9)";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([3, 9]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(242, 196, 91, 0.95)";
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();

  if (state.upgrades.targeting >= 4) {
    let bestTarget = null;
    let bestProjection = Infinity;
    for (const enemy of enemies) {
      const relativeX = enemy.x - state.turret.x;
      const relativeY = enemy.y - state.turret.y;
      const projection = relativeX * state.turret.aimX + relativeY * state.turret.aimY;
      if (projection <= 0) continue;
      const perpendicular = Math.abs(relativeX * state.turret.aimY - relativeY * state.turret.aimX);
      if (perpendicular < 90 && projection < bestProjection) {
        bestProjection = projection;
        bestTarget = enemy;
      }
    }
    if (bestTarget) {
      const travelTime = bestProjection / projectileSpeed();
      const leadX = clamp(bestTarget.x + bestTarget.vx * travelTime, 18, canvas.width - 18);
      const leadY = clamp(bestTarget.y + bestTarget.speed * travelTime, 18, state.turret.y - 40);
      ctx.strokeStyle = "rgba(242, 196, 91, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(leadX, leadY, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
  if (enemy.bossType === "carrier") {
    ctx.fillStyle = enemy.flash > 0 ? "#f4f0e8" : "#6b3e91";
    ctx.beginPath();
    ctx.moveTo(-enemy.size * 1.05, 0);
    ctx.lineTo(-enemy.size * 0.5, -enemy.size * 0.42);
    ctx.lineTo(0, -enemy.size * 0.25);
    ctx.lineTo(enemy.size * 0.5, -enemy.size * 0.42);
    ctx.lineTo(enemy.size * 1.05, 0);
    ctx.lineTo(enemy.size * 0.62, enemy.size * 0.35);
    ctx.lineTo(0, enemy.size * 0.5);
    ctx.lineTo(-enemy.size * 0.62, enemy.size * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffb44a";
    ctx.fillRect(-enemy.size * 0.42, -enemy.size * 0.08, enemy.size * 0.84, enemy.size * 0.16);
    ctx.fillStyle = "#ff7a66";
    ctx.fillRect(-enemy.size * 0.62, enemy.size * 0.62, enemy.size * 1.24 * hpRatio, 4);
    ctx.restore();
    return;
  }
  ctx.fillStyle = enemy.flash > 0 ? "#f4f0e8" : enemy.boss ? "#a33647" : enemy.elite ? "#7f4fd1" : "#7cb6c5";
  ctx.beginPath();
  ctx.moveTo(0, -enemy.size * 0.65);
  ctx.lineTo(enemy.size * 0.78, enemy.size * 0.2);
  ctx.lineTo(enemy.size * 0.34, enemy.size * 0.58);
  ctx.lineTo(0, enemy.size * 0.35);
  ctx.lineTo(-enemy.size * 0.34, enemy.size * 0.58);
  ctx.lineTo(-enemy.size * 0.78, enemy.size * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = enemy.boss ? "#7ee3a1" : enemy.elite ? "#f2c45b" : "#101923";
  ctx.fillRect(-enemy.size * 0.28, -enemy.size * 0.14, enemy.size * 0.56, enemy.size * 0.18);
  ctx.fillStyle = "#ff7a66";
  ctx.fillRect(-enemy.size * 0.52, enemy.size * 0.62, enemy.size * 1.04 * hpRatio, 3);
  ctx.restore();
}

function drawEnemyBomb(bomb) {
  ctx.save();
  ctx.translate(bomb.x, bomb.y);
  ctx.rotate(bomb.spin);
  if (bomb.kind === "plasma") {
    const pulse = 0.7 + Math.sin(performance.now() * 0.018) * 0.3;
    ctx.fillStyle = `rgba(174, 102, 255, ${0.2 + pulse * 0.22})`;
    ctx.beginPath();
    ctx.arc(0, 0, bomb.radius + 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bomb.flash > 0 ? "#fff2dc" : "#b978ff";
    ctx.beginPath();
    ctx.arc(0, 0, bomb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4f0e8";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
  const pulse = 0.78 + Math.sin(performance.now() * 0.012) * 0.22;
  ctx.fillStyle = `rgba(255, 79, 69, ${0.18 + pulse * 0.18})`;
  ctx.beginPath();
  ctx.arc(0, 0, bomb.radius + 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bomb.flash > 0 ? "#fff2dc" : "#c8393d";
  ctx.beginPath();
  ctx.moveTo(0, -bomb.radius);
  ctx.lineTo(bomb.radius * 0.8, -bomb.radius * 0.15);
  ctx.lineTo(bomb.radius * 0.55, bomb.radius);
  ctx.lineTo(-bomb.radius * 0.55, bomb.radius);
  ctx.lineTo(-bomb.radius * 0.8, -bomb.radius * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffb44a";
  ctx.fillRect(-3, -bomb.radius - 5, 6, 7);
  ctx.restore();
  }

  const hpRatio = clamp(bomb.hp / bomb.maxHp, 0, 1);
  ctx.fillStyle = "rgba(8, 10, 12, 0.8)";
  ctx.fillRect(bomb.x - 14, bomb.y + bomb.radius + 7, 28, 4);
  ctx.fillStyle = "#ff7a66";
  ctx.fillRect(bomb.x - 14, bomb.y + bomb.radius + 7, 28 * hpRatio, 4);
}

function drawDebris(piece) {
  ctx.save();
  if (piece.life <= 2.5) {
    const blinkRate = piece.life <= 1 ? 14 : 8;
    if (Math.floor(piece.life * blinkRate) % 2 === 0) {
      ctx.restore();
      return;
    }
    ctx.globalAlpha = clamp(piece.life / 2.5, 0.35, 1);
  }
  ctx.translate(piece.x, piece.y);
  ctx.rotate(piece.spin);
  ctx.fillStyle = piece.value > 1 ? "#f2c45b" : "#9db3bd";
  ctx.fillRect(-piece.radius, -piece.radius * 0.6, piece.radius * 2, piece.radius * 1.2);
  ctx.fillStyle = "rgba(104, 214, 199, 0.55)";
  ctx.fillRect(-piece.radius * 0.35, -piece.radius * 0.25, piece.radius * 0.7, piece.radius * 0.5);
  ctx.restore();
}

function drawSpecialDrop(drop) {
  ctx.save();
  ctx.translate(drop.x, drop.y);
  ctx.rotate(drop.spin);
  if (drop.type === "homing") {
    ctx.fillStyle = "rgba(169, 124, 255, 0.24)";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a97cff";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(9, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-9, 8);
    ctx.closePath();
    ctx.fill();
  } else if (drop.type === "flak") {
    ctx.fillStyle = "rgba(255, 180, 74, 0.22)";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb44a";
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const radius = i % 2 === 0 ? 12 : 6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (drop.type === "emp") {
    ctx.strokeStyle = "#63e6ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.lineTo(2, -2);
    ctx.lineTo(-2, 1);
    ctx.lineTo(5, 10);
    ctx.stroke();
  } else if (drop.type === "railgun") {
    ctx.fillStyle = "#ff8f70";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f4f0e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.moveTo(0, -13);
    ctx.lineTo(0, 13);
    ctx.stroke();
  } else if (drop.type === "gravity") {
    ctx.strokeStyle = "#6da9ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#b9d4ff";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (drop.type === "drones") {
    ctx.fillStyle = "#7ee3a1";
    ctx.fillRect(-9, -5, 18, 10);
    ctx.fillStyle = "#20352c";
    ctx.fillRect(-3, -2, 6, 4);
    ctx.strokeStyle = "#7ee3a1";
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-14, -6);
    ctx.moveTo(9, 0);
    ctx.lineTo(14, -6);
    ctx.stroke();
  } else if (drop.type === "weaponCore") {
    ctx.fillStyle = "rgba(255, 143, 112, 0.22)";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff8f70";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-4, -8);
    ctx.lineTo(4, 8);
    ctx.lineTo(11, 0);
    ctx.stroke();
  } else if (drop.type === "seeker") {
    ctx.strokeStyle = "#8ce6ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 1.55);
    ctx.stroke();
    ctx.fillStyle = "#8ce6ff";
    ctx.beginPath();
    ctx.moveTo(-11, -2);
    ctx.lineTo(-4, -8);
    ctx.lineTo(-3, 1);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = "#7ee3a1";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(10, -2);
    ctx.lineTo(7, 9);
    ctx.lineTo(-6, 11);
    ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#263d35";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  drawBackground();

  bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.weaponType === "bomb" ? "#ffb44a" :
      bullet.weaponType === "rail" ? "#f4f0e8" :
      bullet.seekerRound ? "#8ce6ff" : "#e8fffb";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bullet.seekerRound ? "rgba(140, 230, 255, 0.7)" : "rgba(104, 214, 199, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bullet.x, bullet.y);
    ctx.lineTo(bullet.x - bullet.vx * 0.025, bullet.y - bullet.vy * 0.025);
    ctx.stroke();
  });

  lightningArcs.forEach((arc) => {
    ctx.strokeStyle = `rgba(140, 230, 255, ${clamp(arc.life / 0.18, 0, 1)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(arc.x1, arc.y1);
    const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 18;
    const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 18;
    ctx.lineTo(midX, midY);
    ctx.lineTo(arc.x2, arc.y2);
    ctx.stroke();
  });

  missiles.forEach((missile) => {
    ctx.fillStyle = "#f2c45b";
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, missile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 122, 102, 0.55)";
    ctx.fillRect(missile.x - 2, missile.y + 5, 4, 13);
  });

  flakShells.forEach((shell) => {
    ctx.fillStyle = "#ffb44a";
    ctx.beginPath();
    ctx.arc(shell.x, shell.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 180, 74, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shell.x, shell.y + 4);
    ctx.lineTo(shell.x, shell.y + 18);
    ctx.stroke();
  });

  flakBlasts.forEach((blast) => {
    const duration = blast.lingering ? 1.8 : 0.32;
    const progress = clamp(1 - blast.life / duration, 0, 1);
    ctx.strokeStyle = `rgba(255, 180, 74, ${blast.lingering ? 0.3 + (1 - progress) * 0.25 : 1 - progress})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(blast.x, blast.y, blast.lingering ? blast.radius : blast.radius * progress, 0, Math.PI * 2);
    ctx.stroke();
  });

  empPulses.forEach((pulse) => {
    ctx.strokeStyle = `rgba(99, 230, 255, ${clamp(pulse.life / 0.65, 0, 1)})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  mines.forEach((mine) => {
    const armed = mine.armTimer <= 0;
    const glow = 0.45 + Math.sin(mine.pulse) * 0.2;
    ctx.fillStyle = armed ? "#ff8f70" : "#6f7378";
    ctx.beginPath();
    ctx.arc(mine.x, mine.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = armed ? `rgba(255, 143, 112, ${glow})` : "rgba(180, 185, 190, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mine.x, mine.y, armed ? 15 : 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#20272d";
    ctx.fillRect(mine.x - 3, mine.y - 3, 6, 6);
  });

  railBeams.forEach((beam) => {
    const alpha = beam.primaryRailVisual
      ? clamp(beam.life / 0.22, 0, 1)
      : clamp(beam.life / 0.9, 0, 1);
    ctx.save();
    ctx.translate(beam.x, beam.y);
    ctx.rotate(Math.atan2(beam.aimY, beam.aimX) + Math.PI / 2);
    ctx.fillStyle = `rgba(217, 248, 255, ${alpha * (beam.primaryRailVisual ? 0.48 : 0.7)})`;
    ctx.fillRect(-beam.width / 2, -1100, beam.width, 1100);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(beam.primaryRailVisual ? -2 : -3, -1100, beam.primaryRailVisual ? 4 : 6, 1100);
    ctx.restore();
  });

  gravityWells.forEach((well) => {
    const alpha = clamp(well.life / 2, 0.25, 0.8);
    ctx.strokeStyle = `rgba(109, 169, 255, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(109, 169, 255, ${alpha * 0.12})`;
    ctx.beginPath();
    ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  droneShots.forEach((shot) => {
    ctx.fillStyle = "#9fffd0";
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  drones.forEach((drone) => {
    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.fillStyle = "#7ee3a1";
    ctx.fillRect(-8, -4, 16, 8);
    ctx.fillStyle = "#20352c";
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  });

  enemyBombs.forEach(drawEnemyBomb);
  enemies.forEach(drawEnemy);
  debris.forEach(drawDebris);
  specialDrops.forEach(drawSpecialDrop);
  sparks.forEach((spark) => {
    ctx.globalAlpha = clamp(spark.life * 3, 0, 1);
    ctx.fillStyle = spark.color;
    ctx.fillRect(spark.x - 2, spark.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  });

  drawAimReticle();
  drawTurret();

}

function loop(now) {
  const dt = Math.min(0.033, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;

  if (state.over) {
    updateGameOverController();
  } else if (state.relicChoiceType) {
    updateRelicChoiceController();
  } else if (state.paused) {
    updatePauseController();
  } else if (state.intermission) {
    updateIntermissionController();
  } else if (!state.started) {
    updateStartController();
  } else {
    updateInput(dt);
    updateWorld(dt);
    updateUi();
  }

  draw();
  requestAnimationFrame(loop);
}

function startGame() {
  state.started = true;
  state.paused = false;
  state.over = false;
  state.intermission = false;
  state.relicChoiceType = null;
  state.relicChoiceIndex = 0;
  state.relicChoiceQueue.length = 0;
  state.lastTime = performance.now();
  ui.startOverlay.hidden = true;
  setMessage("Defense cannon online.");
  startWave();
  updateUi();
}

function togglePause(force) {
  if (!state.started || state.over) return;
  state.paused = typeof force === "boolean" ? force : !state.paused;
  ui.pauseOverlay.hidden = !state.paused;
  ui.resumeButton.classList.toggle("is-controller-selected", state.paused);
}

function updatePauseController() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find(Boolean);
  if (!pad) return;

  ui.resumeButton.classList.add("is-controller-selected");
  const aPressed = Boolean(pad.buttons[0]?.pressed);
  const startPressed = Boolean(pad.buttons[9]?.pressed);
  if ((aPressed && !state.aWasPressed) || (startPressed && !state.pauseWasPressed)) {
    state.suppressAUntilRelease = aPressed;
    state.aWasPressed = aPressed;
    state.pauseWasPressed = startPressed;
    togglePause(false);
    return;
  }
  state.aWasPressed = aPressed;
  state.pauseWasPressed = startPressed;
}

function updateRelicChoiceController() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find(Boolean);
  if (!pad) return;

  const previousPressed = Boolean(pad.buttons[4]?.pressed || pad.buttons[12]?.pressed || pad.buttons[14]?.pressed);
  const nextPressed = Boolean(pad.buttons[5]?.pressed || pad.buttons[13]?.pressed || pad.buttons[15]?.pressed);
  const directionPressed = previousPressed || nextPressed;
  if (directionPressed && !state.relicChoiceDirectionWasPressed) {
    state.relicChoiceIndex = previousPressed ? 0 : 1;
    updateRelicChoiceSelection();
  }
  state.relicChoiceDirectionWasPressed = directionPressed;

  const aPressed = Boolean(pad.buttons[0]?.pressed);
  if (aPressed && !state.aWasPressed) chooseRelicPath(state.relicChoiceIndex === 0 ? "a" : "b");
  state.aWasPressed = aPressed;
}

function updateIntermissionController() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find(Boolean);
  if (!pad) return;

  const lbPressed = Boolean(pad.buttons[4]?.pressed);
  const rbPressed = Boolean(pad.buttons[5]?.pressed);
  const dpadUpPressed = Boolean(pad.buttons[12]?.pressed);
  const dpadDownPressed = Boolean(pad.buttons[13]?.pressed);
  const dpadLeftPressed = Boolean(pad.buttons[14]?.pressed);
  const dpadRightPressed = Boolean(pad.buttons[15]?.pressed);
  if (lbPressed && !state.lbWasPressed) selectUpgrade(-1);
  if (rbPressed && !state.rbWasPressed) selectUpgrade(1);
  if (dpadUpPressed && !state.dpadUpWasPressed) selectUpgradeSpatial(0, -1);
  if (dpadDownPressed && !state.dpadDownWasPressed) selectUpgradeSpatial(0, 1);
  if (dpadLeftPressed && !state.dpadLeftWasPressed) selectUpgradeSpatial(-1, 0);
  if (dpadRightPressed && !state.dpadRightWasPressed) selectUpgradeSpatial(1, 0);
  state.lbWasPressed = lbPressed;
  state.rbWasPressed = rbPressed;
  state.dpadUpWasPressed = dpadUpPressed;
  state.dpadDownWasPressed = dpadDownPressed;
  state.dpadLeftWasPressed = dpadLeftPressed;
  state.dpadRightWasPressed = dpadRightPressed;

  const aPressed = Boolean(pad.buttons[0]?.pressed);
  if (aPressed && !state.aWasPressed) {
    if (state.upgradeSelectionActive) activateSelectedUpgrade();
    else startNextWave();
  }
  state.aWasPressed = aPressed;

  const bPressed = Boolean(pad.buttons[1]?.pressed);
  if (bPressed && !state.bWasPressed) clearUpgradeSelection();
  state.bWasPressed = bPressed;

  const startPressed = Boolean(pad.buttons[9]?.pressed);
  if (startPressed && !state.pauseWasPressed) startNextWave();
  state.pauseWasPressed = startPressed;
}

function endGame() {
  state.over = true;
  state.victory = false;
  state.endSelectionIndex = 0;
  state.dpadLeftWasPressed = false;
  state.dpadRightWasPressed = false;
  ui.endEyebrow.textContent = "Artifact lost";
  ui.endTitle.textContent = "Base Overrun";
  ui.finalWave.textContent = `Reached wave ${state.wave}`;
  ui.endlessButton.hidden = true;
  ui.gameOverOverlay.hidden = false;
  ui.restartButton.classList.add("is-controller-selected");
  document.body.classList.remove("base-under-attack");
}

function endVictory() {
  state.over = true;
  state.victory = true;
  state.endSelectionIndex = 0;
  state.dpadLeftWasPressed = false;
  state.dpadRightWasPressed = false;
  state.intermission = false;
  unlockUpgradeScreen();
  ui.intermission.hidden = true;
  ui.endEyebrow.textContent = "Artifact secured";
  ui.endTitle.textContent = "Defense Complete";
  ui.finalWave.textContent = "All 20 waves defeated";
  ui.restartButton.textContent = "Defend Again";
  ui.endlessButton.hidden = false;
  ui.gameOverOverlay.hidden = false;
  ui.restartButton.classList.add("is-controller-selected");
  document.body.classList.remove("base-under-attack");
}

function startEndlessMode() {
  if (!state.victory) return;
  state.over = false;
  state.victory = false;
  state.endlessMode = true;
  state.endSelectionIndex = 0;
  state.wave = 21;
  state.lastTime = performance.now();
  ui.gameOverOverlay.hidden = true;
  ui.endlessButton.hidden = true;
  ui.restartButton.classList.remove("is-controller-selected");
  ui.endlessButton.classList.remove("is-controller-selected");
  setMessage("Endless Mode engaged. Wave 21 incoming.");
  startWave();
  updateUi();
}

function restartGame() {
  bullets.length = 0;
  missiles.length = 0;
  missileSalvoQueue.length = 0;
  flakShells.length = 0;
  flakSalvoQueue.length = 0;
  flakBlasts.length = 0;
  empPulses.length = 0;
  railBeams.length = 0;
  railPulseQueue.length = 0;
  mines.length = 0;
  gravityWells.length = 0;
  lightningArcs.length = 0;
  drones.length = 0;
  droneShots.length = 0;
  enemies.length = 0;
  enemyBombs.length = 0;
  debris.length = 0;
  specialDrops.length = 0;
  sparks.length = 0;
  keys.clear();

  state.started = true;
  state.paused = false;
  state.over = false;
  state.victory = false;
  state.endlessMode = false;
  state.endSelectionIndex = 0;
  state.intermission = false;
  state.relicChoiceType = null;
  state.relicChoiceIndex = 0;
  state.relicChoiceQueue.length = 0;
  state.lastTime = performance.now();
  state.wave = 1;
  state.waveRest = 2.5;
  state.spawnTimer = 0;
  state.enemiesQueued = 0;
  state.bossPending = false;
  state.debris = 0;
  state.carapaces = 0;
  state.relicPity = 0;
  state.messageTimer = 0;
  state.base.maxHp = 300;
  state.base.hp = state.base.maxHp;
  state.turret.x = canvas.width / 2;
  state.turret.aimX = 0;
  state.turret.aimY = -1;
  state.turret.heat = 0;
  state.turret.cooldown = 0;
  state.upgrades.damage = 1;
  state.upgrades.reload = 1;
  state.upgrades.cooling = 1;
  state.upgrades.drive = 1;
  state.upgrades.targeting = 1;
  state.upgrades.defense = 1;
  state.defense.shieldReady = true;
  state.defense.artifactShieldReady = true;
  state.homing.unlocked = false;
  state.homing.chosenPath = null;
  state.homing.level = 1;
  state.homing.pathA = 0;
  state.homing.pathB = 0;
  state.homing.cooldown = 0;
  state.flak.unlocked = false;
  state.flak.chosenPath = null;
  state.flak.level = 1;
  state.flak.pathA = 0;
  state.flak.pathB = 0;
  state.flak.cooldown = 0;
  state.emp.unlocked = false;
  state.emp.chosenPath = null;
  state.emp.level = 1;
  state.emp.pathA = 0;
  state.emp.pathB = 0;
  state.emp.cooldown = 0;
  state.railgun.unlocked = false;
  state.railgun.chosenPath = null;
  state.railgun.level = 1;
  state.railgun.pathA = 0;
  state.railgun.pathB = 0;
  state.railgun.cooldown = 0;
  state.gravity.unlocked = false;
  state.gravity.chosenPath = null;
  state.gravity.level = 1;
  state.gravity.pathA = 0;
  state.gravity.pathB = 0;
  state.gravity.cooldown = 0;
  state.drones.unlocked = false;
  state.drones.chosenPath = null;
  state.drones.level = 1;
  state.drones.pathA = 0;
  state.drones.pathB = 0;
  state.drones.cooldown = 0;
  state.drones.foundryTimer = 18;
  state.drones.interceptTimer = 0;
  state.spread.unlocked = false;
  state.spread.chosenPath = null;
  state.spread.level = 1;
  state.spread.pathA = 0;
  state.spread.pathB = 0;
  state.seeker.unlocked = false;
  state.seeker.chosenPath = null;
  state.seeker.level = 1;
  state.seeker.pathA = 0;
  state.seeker.pathB = 0;
  state.weaponCore.unlocked = false;
  state.primaryWeapon.type = "cannon";
  state.primaryWeapon.level = 0;
  state.weaponChoiceOptions = [];
  state.upgradeSelectionActive = false;
  state.upgradeSelectionIndex = 0;
  state.aWasPressed = false;
  state.suppressAUntilRelease = false;
  state.bWasPressed = false;
  state.rtWasPressed = false;
  state.yWasPressed = false;
  state.xWasPressed = false;
  state.stickClickWasPressed = false;
  state.leftStickClickWasPressed = false;
  state.ltWasPressed = false;
  state.lbWasPressed = false;
  state.rbWasPressed = false;
  state.dpadPreviousWasPressed = false;
  state.dpadNextWasPressed = false;
  state.dpadUpWasPressed = false;
  state.dpadDownWasPressed = false;
  state.dpadLeftWasPressed = false;
  state.dpadRightWasPressed = false;
  state.relicChoiceDirectionWasPressed = false;
  state.pauseWasPressed = false;

  clearUpgradeSelection();
  ui.gameOverOverlay.hidden = true;
  ui.endEyebrow.textContent = "Artifact lost";
  ui.endTitle.textContent = "Base Overrun";
  ui.restartButton.textContent = "Restart";
  ui.endlessButton.hidden = true;
  ui.pauseOverlay.hidden = true;
  ui.intermission.hidden = true;
  ui.relicPathOverlay.hidden = true;
  ui.restartButton.classList.remove("is-controller-selected");
  ui.endlessButton.classList.remove("is-controller-selected");
  window.clearTimeout(relicNotificationTimer);
  ui.relicNotification.hidden = true;
  document.body.classList.remove("base-under-attack");
  setMessage("Defense cannon online.");
  startWave();
  updateUi();
}

function updateGameOverController() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find(Boolean);
  if (!pad) return;

  const leftPressed = Boolean(pad.buttons[14]?.pressed || pad.buttons[4]?.pressed);
  const rightPressed = Boolean(pad.buttons[15]?.pressed || pad.buttons[5]?.pressed);
  if (state.victory) {
    if (leftPressed && !state.dpadLeftWasPressed) state.endSelectionIndex = 0;
    if (rightPressed && !state.dpadRightWasPressed) state.endSelectionIndex = 1;
  } else {
    state.endSelectionIndex = 0;
  }
  state.dpadLeftWasPressed = leftPressed;
  state.dpadRightWasPressed = rightPressed;
  ui.restartButton.classList.toggle("is-controller-selected", state.endSelectionIndex === 0);
  ui.endlessButton.classList.toggle("is-controller-selected", state.victory && state.endSelectionIndex === 1);
  const aPressed = Boolean(pad.buttons[0]?.pressed);
  const startPressed = Boolean(pad.buttons[9]?.pressed);
  if ((aPressed && !state.aWasPressed) || (startPressed && !state.pauseWasPressed)) {
    if (state.victory && state.endSelectionIndex === 1) startEndlessMode();
    else restartGame();
    return;
  }
  state.aWasPressed = aPressed;
  state.pauseWasPressed = startPressed;
}

document.querySelectorAll("[data-stage2-upgrade]").forEach((button) => {
  button.addEventListener("click", () => buyUpgrade(button.dataset.stage2Upgrade));
});
document.querySelectorAll("[data-stage2-relic-path]").forEach((button) => {
  button.addEventListener("click", () => {
    upgradeRelicPath(button.dataset.stage2RelicPath, button.dataset.relicPath);
  });
});
ui.primaryWeaponUpgradeButton.addEventListener("click", upgradePrimaryWeapon);
document.querySelectorAll("[data-relic-choice]").forEach((button, index) => {
  button.addEventListener("click", () => {
    state.relicChoiceIndex = index;
    chooseRelicPath(button.dataset.relicChoice);
  });
});

ui.startButton.addEventListener("click", startGame);
ui.resumeButton.addEventListener("click", () => togglePause(false));
ui.restartButton.addEventListener("click", restartGame);
ui.endlessButton.addEventListener("click", startEndlessMode);
ui.nextWaveButton.addEventListener("click", startNextWave);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (state.over) {
    if (state.victory && ["arrowleft", "a"].includes(key)) state.endSelectionIndex = 0;
    if (state.victory && ["arrowright", "d"].includes(key)) state.endSelectionIndex = 1;
    ui.restartButton.classList.toggle("is-controller-selected", state.endSelectionIndex === 0);
    ui.endlessButton.classList.toggle("is-controller-selected", state.victory && state.endSelectionIndex === 1);
    if ((key === "enter" || key === " ") && !event.repeat) {
      event.preventDefault();
      if (state.victory && state.endSelectionIndex === 1) startEndlessMode();
      else restartGame();
    }
    return;
  }
  if (state.relicChoiceType) {
    if (["arrowleft", "arrowup", "a"].includes(key)) state.relicChoiceIndex = 0;
    if (["arrowright", "arrowdown", "d"].includes(key)) state.relicChoiceIndex = 1;
    updateRelicChoiceSelection();
    if ((key === "enter" || key === " ") && !event.repeat) {
      event.preventDefault();
      chooseRelicPath(state.relicChoiceIndex === 0 ? "a" : "b");
    }
    return;
  }
  if (state.intermission) {
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "pageup", "pagedown", "home", "end"].includes(key)) {
      event.preventDefault();
    }
    if ((key === "enter" || key === "n") && !event.repeat) startNextWave();
    return;
  }
  keys.add(key);
  if (key === "p" && !event.repeat) togglePause();
  if (key === "h" && !event.repeat) fireHomingMissile();
  if (key === "f" && !event.repeat) fireFlakCannon();
  if (key === "e" && !event.repeat) fireMinefield();
  if (key === "r" && !event.repeat) fireEmpPulse();
  if (key === "g" && !event.repeat) fireGravityWell();
  if (key === " " && !event.repeat) {
    event.preventDefault();
    fire();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

ui.intermission.addEventListener("wheel", (event) => {
  if (state.intermission) event.preventDefault();
}, { passive: false });

ui.intermission.addEventListener("touchmove", (event) => {
  if (state.intermission) event.preventDefault();
}, { passive: false });

window.addEventListener("gamepadconnected", (event) => {
  ui.controllerStatus.textContent = `${event.gamepad.id} connected`;
  ui.controllerStatus.classList.add("connected");
});

window.addEventListener("gamepaddisconnected", () => {
  ui.controllerStatus.textContent = "Waiting for controller input...";
  ui.controllerStatus.classList.remove("connected");
});

setInterval(() => {
  if (!state.started || state.paused || state.over || state.intermission || state.relicChoiceType) {
    document.body.classList.remove("base-under-attack");
    return;
  }
  document.body.classList.toggle(
    "base-under-attack",
    enemies.some((enemy) => enemy.y > canvas.height - 190) ||
      enemyBombs.some((bomb) => bomb.y > canvas.height - 210),
  );
}, 200);

updateUi();
setupUpgradeTooltips();
draw();
requestAnimationFrame(loop);
