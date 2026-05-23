const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const COLS = 30;
const ROWS = 80;
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
const SURFACE_ROWS = 4;
const LEVEL_ONE_SPEED = 132;
const LEVEL_ONE_DRILL_DAMAGE = 1;

const keys = new Set();
const resources = {
  copper: 0,
  silver: 0,
  gold: 0,
  diamond: 0,
};

const cargo = {
  copper: 0,
  silver: 0,
  gold: 0,
  diamond: 0,
};

const pickups = [];
const flares = [];
const blasts = [];
const explosions = [];
const monsters = [];
const revealedTiles = new Set();

const OPEN_VISIBILITY_RADIUS = 2;
const FLARE_VISIBILITY_RADIUS = 5;
const MONSTER_SPAWN_INTERVAL = 150;

const resourceColors = {
  copper: "#cf7a43",
  silver: "#cad4da",
  gold: "#f2c45b",
  diamond: "#86f0ff",
};

const blockDefs = [
  { biome: "Topsoil", color: "#6c5640", hp: 2, depth: 0 },
  { biome: "Claystone", color: "#845f48", hp: 5, depth: 14 },
  { biome: "Basalt", color: "#4b4e57", hp: 9, depth: 30 },
  { biome: "Crystal Vein", color: "#334d65", hp: 15, depth: 52 },
];

const oreDefs = [
  { type: "copper", color: "#cf7a43", minDepth: 5, veinChance: 0.03, minVein: 2, maxVein: 6 },
  { type: "silver", color: "#cad4da", minDepth: 14, veinChance: 0.02, minVein: 1, maxVein: 4 },
  { type: "gold", color: "#f2c45b", minDepth: 24, veinChance: 0.014, minVein: 1, maxVein: 3 },
  { type: "diamond", color: "#86f0ff", minDepth: 43, veinChance: 0.008, minVein: 1, maxVein: 3 },
];

const relicDefs = {
  impact: {
    label: "Impact Drill",
    color: "#ffdf74",
    duration: 15,
    cooldown: 90,
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
    cooldown: 90,
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
};

const upgradeDefs = {
  power: {
    label: "Drill Power",
    recipe: (level) => ({
      copper: level * 3,
      silver: Math.max(0, level - 1),
      gold: Math.max(0, level - 3),
      diamond: Math.max(0, level - 5),
    }),
  },
  speed: {
    label: "Thruster Speed",
    recipe: (level) => ({
      copper: level * 3,
      silver: Math.max(0, level - 1) * 2,
      gold: Math.max(0, level - 4),
      diamond: Math.max(0, level - 6),
    }),
  },
  capacity: {
    label: "Cargo Bay",
    recipe: (level) => ({
      copper: level * 4,
      silver: Math.max(0, level - 2),
      gold: Math.max(0, level - 1),
      diamond: Math.max(0, level - 5),
    }),
  },
};

let carried = 0;
let messageTimer = 0;
let monsterSpawnTimer = MONSTER_SPAWN_INTERVAL;
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
};
const mouseHelper = {
  x: VIEW_W / 2 - 24,
  y: 64,
  target: null,
  drillCooldown: 0,
  initialized: false,
};
const dogHelper = {
  x: VIEW_W / 2 + 24,
  y: 64,
  target: null,
  path: [],
  mode: "idle",
  cargo: {
    copper: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
  },
  carried: 0,
  initialized: false,
};

const miner = {
  x: VIEW_W / 2,
  y: 64,
  radius: 9,
  vx: 0,
  vy: 0,
  speed: LEVEL_ONE_SPEED,
  power: 1,
  drillCooldown: 0,
  facingX: 1,
  facingY: 0,
  capacity: 6,
  health: 100,
  maxHealth: 100,
  upgrades: {
    power: 0,
    speed: 0,
    capacity: 0,
  },
};

const world = Array.from({ length: ROWS }, (_, y) =>
  Array.from({ length: COLS }, (_, x) => createTile(x, y)),
);
generateOreVeins();
generateRelics();
revealAround(15, SURFACE_ROWS - 1, OPEN_VISIBILITY_RADIUS);

function createTile(x, y) {
  if (y < SURFACE_ROWS) return null;
  const definition = [...blockDefs].reverse().find((block) => y >= block.depth) ?? blockDefs[0];
  const tile = {
    hp: definition.hp + Math.floor(Math.random() * 2),
    maxHp: definition.hp,
    color: definition.color,
    biome: definition.biome,
    ore: null,
    relic: null,
  };

  if (x < 2 || x > COLS - 3) tile.hp *= 2;
  return tile;
}

function generateRelics() {
  blockDefs.forEach((zone, index) => {
    const minY = Math.max(SURFACE_ROWS, zone.depth);
    const maxY = (blockDefs[index + 1]?.depth ?? ROWS) - 1;
    for (let i = 0; i < 2; i++) {
      placeRelicInZone(minY, maxY);
    }
  });
}

function placeRelicInZone(minY, maxY) {
  for (let attempt = 0; attempt < 120; attempt++) {
    const x = 2 + Math.floor(Math.random() * (COLS - 4));
    const y = minY + Math.floor(Math.random() * Math.max(1, maxY - minY + 1));
    const tile = world[y]?.[x];
    if (!tile || tile.ore || tile.relic) continue;
    tile.relic = true;
    tile.hp = Math.max(tile.hp, tile.maxHp + 1);
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
    if (y >= ore.minDepth && Math.random() < ore.veinChance) return ore;
  }
  return null;
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

    tile.ore = { ...ore, yield: 1 + Math.floor(Math.random() * 3) };
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

function update(dt) {
  messageTimer = Math.max(0, messageTimer - dt);
  miner.drillCooldown = Math.max(0, miner.drillCooldown - dt);
  updateRelics(dt);
  updateFlares(dt);
  updateBlaster(dt);
  updateExplosions(dt);
  updateMonsters(dt);
  updateMouse(dt);
  updateDog(dt);
  updateTileEffects(dt);
  const inputX = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
  const inputY = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
  const length = Math.hypot(inputX, inputY) || 1;
  if (inputX !== 0 || inputY !== 0) {
    miner.facingX = inputX / length;
    miner.facingY = inputY / length;
  }

  const currentSpeed = miner.speed * getSpeedMultiplier();
  miner.vx = (inputX / length) * currentSpeed;
  miner.vy = (inputY / length) * currentSpeed;

  moveMiner(miner.vx * dt, miner.vy * dt, dt);
  collectPickups();
  handleBase(dt);
  updateCamera();
  updateHud();
}

function updateMonsters(dt) {
  monsterSpawnTimer -= dt;
  if (monsterSpawnTimer <= 0) {
    spawnMonster();
    monsterSpawnTimer = MONSTER_SPAWN_INTERVAL;
  }

  for (const monster of monsters) {
    monster.hitFlash = Math.max(0, monster.hitFlash - dt);
    const dx = miner.x - monster.x;
    const dy = miner.y - monster.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 1) {
      const speed = 34 + monster.level * 3;
      monster.x += (dx / distance) * speed * dt;
      monster.y += (dy / distance) * speed * dt;
    }
  }
}

function spawnMonster() {
  const openTiles = [];
  const minerTile = { x: Math.floor(miner.x / TILE), y: Math.floor(miner.y / TILE) };
  for (let y = SURFACE_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!isOpenTile(x, y)) continue;
      if (Math.hypot(x - minerTile.x, y - minerTile.y) < 8) continue;
      openTiles.push({ x, y });
    }
  }

  const spawnTile = openTiles[Math.floor(Math.random() * openTiles.length)] ?? getNearestOpenTile({ x: 15, y: SURFACE_ROWS - 1 });
  if (!spawnTile) return;
  const level = getMonsterLevel(spawnTile.y);
  monsters.push({
    x: spawnTile.x * TILE + TILE / 2,
    y: spawnTile.y * TILE + TILE / 2,
    radius: 11,
    level,
    hp: level * 10,
    maxHp: level * 10,
    hitFlash: 0,
  });
  setMessage(`Level ${level} monster detected.`);
}

function getMonsterLevel(tileY) {
  let level = 1;
  for (let i = 0; i < blockDefs.length; i++) {
    if (tileY >= blockDefs[i].depth) level = i + 1;
  }
  return level;
}

function updateExplosions(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].life -= dt;
    if (explosions[i].life <= 0) explosions.splice(i, 1);
  }
}

function updateRelics(dt) {
  for (const relic of Object.values(relics)) {
    if ("active" in relic) relic.active = Math.max(0, relic.active - dt);
    if ("cooldown" in relic) relic.cooldown = Math.max(0, relic.cooldown - dt);
  }
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
      blasts.splice(i, 1);
      continue;
    }
    blast.x += blast.vx * dt;
    blast.y += blast.vy * dt;
    if (updateBlastHit(blast)) blasts.splice(i, 1);
  }

  if (keys.has(" ") && blaster.unlocked) fireBlaster();
}

function fireBlaster() {
  const blaster = relics.blaster;
  if (blaster.overheat > 0 || blaster.charge <= 0 || blaster.shotCooldown > 0) return;

  blaster.charge = Math.max(0, blaster.charge - 1);
  blaster.shotCooldown = 0.5;
  if (blaster.charge === 0) blaster.overheat = 30;
  blasts.push({
    x: miner.x + miner.facingX * 14,
    y: miner.y + miner.facingY * 14,
    vx: miner.facingX * 420,
    vy: miner.facingY * 420,
    life: 0.7,
  });
}

function updateBlastHit(blast) {
  const monster = findMonsterAt(blast.x, blast.y);
  if (monster) {
    damageMonster(monster, miner.power * getDamageMultiplier() * 0.1);
    return true;
  }

  const x = Math.floor(blast.x / TILE);
  const y = Math.floor(blast.y / TILE);
  const tile = world[y]?.[x];
  if (!tile) return false;

  tile.hp -= miner.power * getDamageMultiplier() * 0.1;
  tile.hitFlash = 0.12;
  if (tile.hp <= 0) breakTile(x, y, tile);
  return true;
}

function updateMouse(dt) {
  if (!relics.mouse.unlocked) return;
  if (!mouseHelper.initialized) {
    mouseHelper.x = miner.x - 22;
    mouseHelper.y = miner.y + 18;
    mouseHelper.initialized = true;
  }

  mouseHelper.drillCooldown = Math.max(0, mouseHelper.drillCooldown - dt);
  if (!mouseHelper.target || !world[mouseHelper.target.y]?.[mouseHelper.target.x]) {
    mouseHelper.target = findMouseTarget();
  }

  if (!mouseHelper.target) {
    moveMouseToward(miner.x - 22, miner.y + 18, dt);
    return;
  }

  const tx = mouseHelper.target.x * TILE + TILE / 2;
  const ty = mouseHelper.target.y * TILE + TILE / 2;
  if (Math.hypot(tx - mouseHelper.x, ty - mouseHelper.y) > TILE * 0.72) {
    moveMouseToward(tx, ty, dt);
    return;
  }

  mouseDrill(mouseHelper.target.x, mouseHelper.target.y);
}

function findMouseTarget() {
  const originX = Math.floor(mouseHelper.x / TILE);
  const originY = Math.floor(mouseHelper.y / TILE);
  let best = null;
  let bestDistance = Infinity;

  for (let y = originY - 8; y <= originY + 8; y++) {
    for (let x = originX - 8; x <= originX + 8; x++) {
      const tile = world[y]?.[x];
      if (!tile || !isTileVisible(x, y)) continue;
      const distance = Math.hypot(x - originX, y - originY);
      if (distance < bestDistance) {
        best = { x, y };
        bestDistance = distance;
      }
    }
  }

  return best;
}

function moveMouseToward(x, y, dt) {
  const dx = x - mouseHelper.x;
  const dy = y - mouseHelper.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const speed = LEVEL_ONE_SPEED * 0.5;
  const step = Math.min(distance, speed * dt);
  mouseHelper.x += (dx / distance) * step;
  mouseHelper.y += (dy / distance) * step;
}

function mouseDrill(x, y) {
  if (mouseHelper.drillCooldown > 0) return;
  const tile = world[y]?.[x];
  if (!tile) {
    mouseHelper.target = null;
    return;
  }

  mouseHelper.drillCooldown = 0.42;
  tile.hp -= LEVEL_ONE_DRILL_DAMAGE * 0.5;
  tile.hitFlash = 0.12;
  if (tile.hp <= 0) {
    breakTile(x, y, tile, true);
    mouseHelper.target = null;
  }
}

function updateDog(dt) {
  if (!relics.dog.unlocked) return;
  if (!dogHelper.initialized) {
    dogHelper.x = miner.x + 22;
    dogHelper.y = miner.y + 18;
    dogHelper.initialized = true;
  }
  ensureDogInOpenTile();

  const baseX = 15 * TILE;
  const baseY = 3 * TILE;
  const shouldDeposit = dogHelper.carried >= 5 || (dogHelper.carried > 0 && pickups.length === 0);

  if (shouldDeposit) {
    setDogPathToTile(15, 3, "base", true);
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

function followDogPath(dt) {
  if (dogHelper.path.length === 0) return;
  const next = dogHelper.path[0];
  const x = next.x * TILE + TILE / 2;
  const y = next.y * TILE + TILE / 2;
  moveDogToward(x, y, dt);
  if (Math.hypot(dogHelper.x - x, dogHelper.y - y) < 3) dogHelper.path.shift();
}

function moveDogToward(x, y, dt) {
  const dx = x - dogHelper.x;
  const dy = y - dogHelper.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;

  const speed = LEVEL_ONE_SPEED * 0.5;
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

function getNearestOpenTile(origin, maxRadius = 12) {
  if (isOpenTile(origin.x, origin.y)) return origin;

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (Math.max(Math.abs(origin.x - x), Math.abs(origin.y - y)) !== radius) continue;
        if (isOpenTile(x, y)) return { x, y };
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
  return x >= 0 && y >= 0 && x < COLS && y < ROWS && !world[y]?.[x];
}

function collectDogPickup(pickup) {
  if (dogHelper.carried >= 5) return;
  const index = pickups.indexOf(pickup);
  if (index < 0) return;

  dogHelper.cargo[pickup.type] += 1;
  dogHelper.carried += 1;
  pickups.splice(index, 1);
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
    flares[i].timeLeft -= dt;
    if (flares[i].timeLeft <= 0) flares.splice(i, 1);
  }
}

function updateTileEffects(dt) {
  for (const row of world) {
    for (const tile of row) {
      if (tile?.hitFlash) tile.hitFlash = Math.max(0, tile.hitFlash - dt);
    }
  }
}

function moveMiner(dx, dy, dt) {
  const nextX = clamp(miner.x + dx, miner.radius, COLS * TILE - miner.radius);
  const nextY = clamp(miner.y + dy, miner.radius, ROWS * TILE - miner.radius);
  const monster = findMonsterAt(nextX, nextY, miner.radius);
  if (monster) {
    drillMonster(monster);
    applyDrillBounce(dx, dy);
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
  slideAlongBlock(nextX, nextY, dx, dy);
}

function applyDrillBounce(dx, dy) {
  const force = Math.hypot(dx, dy);
  if (force <= 0) return;

  const bounce = 15;
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

function drillMonster(monster) {
  if (miner.drillCooldown > 0 || miner.health <= 0) return;
  miner.drillCooldown = 0.42;
  miner.health = Math.max(0, miner.health - miner.maxHealth * 0.05);
  damageMonster(monster, miner.power * getDamageMultiplier());
}

function findMonsterAt(x, y, radius = 0) {
  return monsters.find((monster) => Math.hypot(monster.x - x, monster.y - y) <= monster.radius + radius);
}

function damageMonster(monster, amount) {
  monster.hp -= amount;
  monster.hitFlash = 0.18;
  if (monster.hp <= 0) {
    const index = monsters.indexOf(monster);
    if (index >= 0) monsters.splice(index, 1);
    setMessage("Monster defeated.");
  }
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
    setMessage("Drill is fully damaged. Return to base for repairs.");
    return false;
  }

  miner.drillCooldown = 0.42;
  tile.hp -= miner.power * getDamageMultiplier();
  tile.hitFlash = 0.2;
  if (tile.hp > 0) return "hit";

  breakTile(x, y, tile);
  return "broke";
}

function breakTile(x, y, tile, quiet = false) {
  world[y][x] = null;
  revealAround(x, y, OPEN_VISIBILITY_RADIUS);
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
  setMessage(`${relicDefs[type].label} relic recovered.`);
}

function dropResource(type, tileX, tileY, amount = 1) {
  for (let i = 0; i < amount; i++) {
    const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.4;
    const distance = amount === 1 ? 0 : 5 + Math.random() * 6;
    pickups.push({
      type,
      x: tileX * TILE + TILE / 2 + Math.cos(angle) * distance,
      y: tileY * TILE + TILE / 2 + Math.sin(angle) * distance,
      bob: Math.random() * Math.PI * 2,
    });
  }
  setMessage(`${amount} ${type} dropped.`);
}

function collectPickups() {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];
    const distance = Math.hypot(miner.x - pickup.x, miner.y - pickup.y);
    if (distance > miner.radius + 12) continue;

    if (carried >= miner.capacity) {
      setMessage("Cargo full. Resources will wait here.");
      continue;
    }

    cargo[pickup.type] += 1;
    carried += 1;
    pickups.splice(i, 1);
    setMessage(`Picked up ${pickup.type}.`);
  }
}

function handleBase(dt) {
  const onPad = miner.y < SURFACE_ROWS * TILE && miner.x > 11 * TILE && miner.x < 19 * TILE;
  if (!onPad) return;

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

function buyUpgrade(type) {
  const recipe = getUpgradeRecipe(type);
  if (!canAfford(recipe)) {
    setMessage(`Need ${formatRecipe(recipe)} for ${upgradeDefs[type].label}.`);
    return;
  }

  spendResources(recipe);
  miner.upgrades[type] += 1;
  if (type === "power") {
    miner.power += 1;
  }
  if (type === "speed") miner.speed += 22;
  if (type === "capacity") miner.capacity += 6;
  miner.health = Math.min(miner.maxHealth, miner.health + miner.maxHealth * 0.1);
  setMessage(`${upgradeDefs[type].label} upgraded.`);
  updateHud();
}

function activateRelic(type) {
  const relic = relics[type];
  const definition = relicDefs[type];
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
  } else {
    relic.active = definition.duration;
  }
  relic.cooldown = definition.cooldown;
  if (type === "flare") placeRelicFlare(definition.duration);
  setMessage(`${definition.label} activated.`);
}

function getDamageMultiplier() {
  return relics.impact.active > 0 ? 3 : 1;
}

function getSpeedMultiplier() {
  return relics.speed.active > 0 ? 2 : 1;
}

function repairDrill() {
  const recipe = getRepairRecipe();
  if (miner.health >= miner.maxHealth) {
    setMessage("Drill is already fully repaired.");
    return;
  }
  if (!canAfford(recipe)) {
    setMessage(`Need ${formatRecipe(recipe)} to repair the drill.`);
    return;
  }

  spendResources(recipe);
  miner.health = Math.min(miner.maxHealth, miner.health + miner.maxHealth * 0.25);
  setMessage("Drill damage reduced by 25%.");
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

function placeRelicFlare(duration) {
  flares.push({
    x: Math.floor(miner.x / TILE),
    y: Math.floor(miner.y / TILE),
    timeLeft: duration,
  });
}

function detonateBomb() {
  const centerX = Math.floor(miner.x / TILE);
  const centerY = Math.floor(miner.y / TILE);
  const radius = 3;
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
      revealAround(x, y, OPEN_VISIBILITY_RADIUS);
      const tile = world[y]?.[x];
      if (!tile) continue;
      tile.hp -= miner.power * 5;
      tile.hitFlash = 0.25;
      if (tile.hp <= 0) breakTile(x, y, tile);
    }
  }
}

function revealAround(centerX, centerY, radius) {
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
      revealedTiles.add(`${x},${y}`);
    }
  }
}

function getUpgradeRecipe(type) {
  const nextLevel = miner.upgrades[type] + 1;
  return upgradeDefs[type].recipe(nextLevel);
}

function getRepairRecipe() {
  const lastPowerLevel = Math.max(1, miner.upgrades.power);
  const previousPowerRecipe = upgradeDefs.power.recipe(lastPowerLevel);
  return Object.fromEntries(
    Object.entries(previousPowerRecipe)
      .filter(([, amount]) => amount > 0)
      .map(([type, amount]) => [type, Math.max(1, Math.floor(amount * 0.5))])
      .filter(([, amount]) => amount > 0),
  );
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
    .map(([type, amount]) => `${amount} ${type}`)
    .join(", ");
}

function updateCamera() {
  camera.x = clamp(miner.x - VIEW_W / 2, 0, COLS * TILE - VIEW_W);
  camera.y = clamp(miner.y - VIEW_H / 2, 0, ROWS * TILE - VIEW_H);
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawSky();
  drawTiles();
  drawFlares();
  drawExplosions();
  drawBlasts();
  drawPickups();
  drawBase();
  drawMonsters();
  drawDog();
  drawMouse();
  drawMiner();
  drawVignette();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, "#17272d");
  gradient.addColorStop(0.4, "#111417");
  gradient.addColorStop(1, "#08090a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTiles() {
  const startX = Math.floor(camera.x / TILE);
  const endX = Math.ceil((camera.x + VIEW_W) / TILE);
  const startY = Math.floor(camera.y / TILE);
  const endY = Math.ceil((camera.y + VIEW_H) / TILE);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = world[y]?.[x];
      if (!isTileVisible(x, y)) {
        drawFogTile(x, y);
        continue;
      }
      if (!tile) continue;
      const sx = x * TILE - camera.x;
      const sy = y * TILE - camera.y;
      ctx.fillStyle = tile.color;
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.24)";
      ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);

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

      if (tile.hp < tile.maxHp) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
        ctx.fillRect(sx + 6, sy + 14, 20, 3);
      }

      if (tile.hitFlash > 0) {
        ctx.fillStyle = `rgba(255, 245, 198, ${tile.hitFlash * 2.8})`;
        ctx.fillRect(sx, sy, TILE, TILE);
      }
    }
  }
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

function isTileVisible(x, y) {
  for (const flare of flares) {
    if (Math.max(Math.abs(flare.x - x), Math.abs(flare.y - y)) <= FLARE_VISIBILITY_RADIUS) {
      return true;
    }
  }

  return revealedTiles.has(`${x},${y}`);
}

function drawFogTile(x, y) {
  const sx = x * TILE - camera.x;
  const sy = y * TILE - camera.y;
  ctx.fillStyle = "#050607";
  ctx.fillRect(sx, sy, TILE, TILE);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
}

function drawFlares() {
  for (const flare of flares) {
    if (!isTileVisible(flare.x, flare.y)) continue;
    const x = flare.x * TILE + TILE / 2 - camera.x;
    const y = flare.y * TILE + TILE / 2 - camera.y;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, TILE * 5.5);
    glow.addColorStop(0, "rgba(255, 106, 72, 0.58)");
    glow.addColorStop(1, "rgba(255, 204, 96, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - TILE * 6, y - TILE * 6, TILE * 12, TILE * 12);
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

function drawBlasts() {
  ctx.fillStyle = "#b7ff6d";
  for (const blast of blasts) {
    const x = blast.x - camera.x;
    const y = blast.y - camera.y;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(183, 255, 109, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x - blast.vx * 0.025, y - blast.vy * 0.025);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawMonsters() {
  for (const monster of monsters) {
    const tileX = Math.floor(monster.x / TILE);
    const tileY = Math.floor(monster.y / TILE);
    if (!isTileVisible(tileX, tileY)) continue;

    const x = monster.x - camera.x;
    const y = monster.y - camera.y;
    const flash = monster.hitFlash > 0;
    ctx.fillStyle = flash ? "#fff0b8" : "#c44d5c";
    ctx.beginPath();
    ctx.arc(x, y, monster.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#35171d";
    ctx.beginPath();
    ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    const hpWidth = 24;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(x - hpWidth / 2, y - 19, hpWidth, 4);
    ctx.fillStyle = "#ff7a66";
    ctx.fillRect(x - hpWidth / 2, y - 19, hpWidth * Math.max(0, monster.hp / monster.maxHp), 4);
    ctx.fillStyle = "#f4f0e8";
    ctx.font = "700 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`L${monster.level}`, x, y + 22);
    ctx.textAlign = "start";
  }
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

function drawBase() {
  const x = 11 * TILE - camera.x;
  const y = 2 * TILE - camera.y;
  ctx.fillStyle = "#25343b";
  ctx.fillRect(x, y, 8 * TILE, TILE * 1.5);
  ctx.fillStyle = "#68d6c7";
  ctx.fillRect(x + 12, y + 10, 8 * TILE - 24, 8);
  ctx.fillStyle = "#f4f0e8";
  ctx.font = "700 14px system-ui";
  ctx.fillText("BASE", x + 100, y + 34);
}

function drawPickups() {
  for (const pickup of pickups) {
    const x = pickup.x - camera.x;
    const y = pickup.y - camera.y + Math.sin(performance.now() / 240 + pickup.bob) * 2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(x, y + 9, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = resourceColors[pickup.type] ?? "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(x - 2, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMiner() {
  const x = miner.x - camera.x;
  const y = miner.y - camera.y;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.72, 0.72);
  ctx.rotate(Math.atan2(miner.vy, miner.vx || 0.01));
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
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function updateHud() {
  document.querySelector("#depthStat").textContent = `${Math.max(0, Math.floor((miner.y - SURFACE_ROWS * TILE) / TILE))}m`;
  document.querySelector("#cargoStat").textContent = `${carried} / ${miner.capacity}`;
  document.querySelector("#healthStat").textContent = `${Math.round(100 - (miner.health / miner.maxHealth) * 100)}%`;
  document.querySelector("#upgradeStat").textContent = `${Object.values(miner.upgrades).reduce((sum, level) => sum + level, 0)}`;

  for (const type of Object.keys(upgradeDefs)) {
    const recipe = getUpgradeRecipe(type);
    const button = document.querySelector(`[data-upgrade="${type}"]`);
    document.querySelector(`#${type}Cost`).textContent = `Lv ${miner.upgrades[type] + 1}: ${formatRecipe(recipe)}`;
    button.disabled = !canAfford(recipe);
  }

  const repairRecipe = getRepairRecipe();
  const repairButton = document.querySelector("[data-repair='drill']");
  document.querySelector("#repairCost").textContent = formatRecipe(repairRecipe);
  repairButton.disabled = miner.health >= miner.maxHealth || !canAfford(repairRecipe);

  updateRelicHud("impact");
  updateRelicHud("speed");
  updateRelicHud("flare");
  updateRelicHud("blaster");
  updateRelicHud("bomb");
  updateRelicHud("mouse");
  updateRelicHud("dog");
  document.querySelector("#relicPanel").hidden = !Object.values(relics).some((relic) => relic.unlocked);

  document.querySelector("#resourceList").innerHTML = Object.entries(resources)
    .map(([type, amount]) => {
      const cargoAmount = cargo[type];
      const cargoText = cargoAmount > 0 ? ` <span>(+${cargoAmount})</span>` : "";
      return `<dt>${type}</dt><dd>${amount}${cargoText}</dd>`;
    })
    .join("");
}

function updateRelicHud(type) {
  const relic = relics[type];
  const button = document.querySelector(`[data-relic="${type}"]`);
  const status = document.querySelector(`#${type}Status`);

  if (!relic.unlocked) {
    status.textContent = "Locked";
    button.disabled = true;
    button.hidden = true;
    return;
  }

  button.hidden = false;

  if (type === "blaster") {
    status.textContent = relic.overheat > 0 ? `Overheat ${formatTime(relic.overheat)}` : `${Math.floor(relic.charge)}%`;
    button.disabled = true;
    return;
  }

  if (type === "mouse") {
    status.textContent = "Active";
    button.disabled = true;
    return;
  }

  if (type === "dog") {
    status.textContent = `${dogHelper.carried} / 5`;
    button.disabled = true;
    return;
  }

  if (relic.active > 0) {
    status.textContent = `${Math.ceil(relic.active)}s active`;
    button.disabled = true;
    return;
  }

  if (relic.cooldown > 0) {
    status.textContent = `${formatTime(relic.cooldown)}`;
    button.disabled = true;
    return;
  }

  status.textContent = "Ready";
  button.disabled = false;
}

function formatTime(seconds) {
  const whole = Math.ceil(seconds);
  if (whole < 60) return `${whole}s`;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function setMessage(text) {
  if (messageTimer > 0 && text.startsWith("Need")) return;
  document.querySelector("#messageLog").textContent = text;
  messageTimer = 1.1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.key === " ") event.preventDefault();
  keys.add(event.key.toLowerCase());
  if (event.key === "1") activateRelic("impact");
  if (event.key === "2") activateRelic("speed");
  if (event.key === "3") activateRelic("flare");
  if (event.key === "4") activateRelic("bomb");
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

document.querySelectorAll(".upgrade").forEach((button) => {
  if (button.dataset.upgrade) {
    button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade));
  }
  if (button.dataset.repair) {
    button.addEventListener("click", repairDrill);
  }
});

document.querySelectorAll("[data-relic]").forEach((button) => {
  button.addEventListener("click", () => activateRelic(button.dataset.relic));
});


updateHud();
requestAnimationFrame(loop);
