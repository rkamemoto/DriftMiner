import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("../outputs/relic_upgrade_trees");
await fs.mkdir(outputDir, { recursive: true });

const relics = [
  {
    name: "Homing Missile",
    sheet: "Homing Missile",
    role: "Heavy guided salvo",
    control: "Y / H",
    pathA: {
      name: "Swarm Doctrine",
      summary: "More missiles, faster reacquisition, and broad target coverage.",
      upgrades: [
        ["Expanded Racks", "Adds two missiles to each salvo.", "+2 missiles", 1],
        ["Distributed Locks", "Missiles divide themselves across more separate targets.", "Improved target distribution", 2],
        ["Rapid Reacquisition", "A missile that loses its target immediately seeks another.", "Faster retargeting", 3],
        ["Cascade Launch", "Destroyed targets release a small secondary seeker.", "1 micro-missile per kill", 4],
        ["Hunter Swarm", "Launches an additional wave shortly after the first.", "Second wave at 45% power", 5],
      ],
    },
    pathB: {
      name: "Siege Warheads",
      summary: "Fewer compromises: heavier impacts, boss damage, and explosive payloads.",
      upgrades: [
        ["Dense Warheads", "Increases missile impact damage.", "+25% missile damage", 1],
        ["Breach Guidance", "Missiles deal increased damage to elites and bosses.", "+35% elite/boss damage", 2],
        ["Cluster Charge", "Missile impacts damage nearby ships and payloads.", "70 px blast, 35% splash", 3],
        ["Tandem Detonation", "Each missile detonates a second time after impact.", "Second blast at 50%", 4],
        ["Siege Breaker", "The central missile becomes a massive boss-killing warhead.", "3x central missile damage", 5],
      ],
    },
  },
  {
    name: "Flak Cannon",
    sheet: "Flak Cannon",
    role: "Cluster-clearing artillery",
    control: "X / F",
    pathA: {
      name: "Saturation Barrage",
      summary: "More shells and better coverage against large formations.",
      upgrades: [
        ["Expanded Battery", "Adds one shell to every flak salvo.", "+1 shell", 1],
        ["Wide Pattern", "Shells distribute themselves across more targets.", "Wider target spread", 2],
        ["Proximity Fuses", "Shells detonate early when passing close to an alien.", "+28 px trigger radius", 3],
        ["Chain Barrage", "The salvo launches a delayed second group of shells.", "Second group at 45% power", 4],
        ["Sky Saturation", "Every visible cluster receives at least one shell.", "Maximum target coverage", 5],
      ],
    },
    pathB: {
      name: "Area Denial",
      summary: "Bigger blasts, lingering shrapnel, and stronger payload interception.",
      upgrades: [
        ["Shrapnel Payload", "Increases blast damage and radius.", "+20% damage, +15% radius", 1],
        ["Payload Interceptor", "Flak deals increased damage to alien bombs and plasma.", "+60% payload damage", 2],
        ["Burning Fragments", "Blast zones linger and damage ships passing through.", "2.5 sec hazard field", 3],
        ["Cluster Shrapnel", "Destroyed payloads throw fragments into nearby aliens.", "4 fragments per payload", 4],
        ["No-Fly Zone", "Flak fields overlap into a large persistent defensive canopy.", "5 sec combined field", 5],
      ],
    },
  },
  {
    name: "EMP Pulse",
    sheet: "EMP Pulse",
    role: "Non-damaging battlefield control",
    control: "Right Stick Click / R",
    pathA: {
      name: "Lockdown Field",
      summary: "Longer, stronger slowing and broader control of the whole screen.",
      upgrades: [
        ["Field Amplifier", "Increases EMP disruption duration.", "+1.0 sec duration", 1],
        ["Deep Suppression", "Affected ships move even more slowly.", "Speed reduced to 4%", 2],
        ["Payload Arrest", "Alien payloads briefly stop instead of merely slowing.", "1.5 sec payload freeze", 3],
        ["Residual Charge", "A weaker disruption lingers after the main pulse ends.", "3 sec at 40% strength", 4],
        ["Total Lockdown", "All targets freeze briefly before normal disruption begins.", "2 sec full freeze", 5],
      ],
    },
    pathB: {
      name: "System Sabotage",
      summary: "EMP remains non-damaging but makes enemies easier to destroy.",
      upgrades: [
        ["Sensor Blackout", "Disrupted ships wobble less predictably and cannot release payloads.", "Payload launch disabled", 1],
        ["Shield Collapse", "Disrupted targets take additional weapon damage.", "+15% incoming damage", 2],
        ["Cascade Interference", "Destroying a disrupted enemy spreads EMP to nearby targets.", "100 px chain radius", 3],
        ["Boss Override", "Boss weapons and movement are more heavily suppressed.", "+50% boss disruption", 4],
        ["System Failure", "Disrupted targets lose all special abilities for the pulse duration.", "Abilities disabled", 5],
      ],
    },
  },
  {
    name: "Railgun",
    sheet: "Railgun",
    role: "High-power piercing lane attack",
    control: "B / E",
    pathA: {
      name: "Capacitor Cascade",
      summary: "Multiple pulses, wider coverage, and repeated lane clearing.",
      upgrades: [
        ["Capacitor Echo", "Adds a second rail pulse after the first.", "Second pulse at 65%", 1],
        ["Wide Conduit", "Increases beam width.", "+24 px beam width", 2],
        ["Triple Discharge", "Adds a third pulse to the firing sequence.", "Third pulse at 55%", 3],
        ["Resonant Channel", "Each hit slightly strengthens the next pulse.", "+8% per prior hit", 4],
        ["Storm Rail", "Fires five rapid pulses across a very wide lane.", "5-pulse sequence", 5],
      ],
    },
    pathB: {
      name: "Singularity Lance",
      summary: "One enormous shot optimized for bosses and armored targets.",
      upgrades: [
        ["Rail Accelerator", "Increases base rail damage.", "+30% damage", 1],
        ["Tungsten Lance", "Greatly increases boss and elite damage.", "+60% elite/boss damage", 2],
        ["Payload Vaporizer", "Railgun instantly destroys most non-boss payloads.", "4x payload damage", 3],
        ["Critical Channel", "Targets near the beam center take additional damage.", "+50% centerline damage", 4],
        ["Singularity Lance", "Condenses the sequence into one devastating narrow beam.", "3.5x damage, narrower beam", 5],
      ],
    },
  },
  {
    name: "Gravity Well",
    sheet: "Gravity Well",
    role: "Formation control and payload capture",
    control: "LT / G",
    pathA: {
      name: "Compression Field",
      summary: "Crushes targets together and increases damage inside the well.",
      upgrades: [
        ["Crushing Field", "Adds continuous damage inside the gravity well.", "+35 damage/sec", 1],
        ["Tidal Stress", "Targets closer to the center take more damage.", "Up to 2x center damage", 2],
        ["Payload Collapse", "Alien payloads take increased gravity damage.", "+75% payload damage", 3],
        ["Compression Burst", "The well explodes when it expires.", "180 final blast damage", 4],
        ["Event Horizon", "Targets at the center are briefly trapped and heavily damaged.", "2 sec center trap", 5],
      ],
    },
    pathB: {
      name: "Orbital Control",
      summary: "Larger wells, longer duration, and multiple placement options.",
      upgrades: [
        ["Expanded Singularity", "Increases gravity well radius.", "+25% radius", 1],
        ["Stable Orbit", "Increases well duration.", "+2 sec duration", 2],
        ["Vector Pull", "Pull strength increases and affects faster ships.", "+35% pull strength", 3],
        ["Twin Wells", "Deploys two smaller wells around the aiming point.", "2 wells at 75% size", 4],
        ["Orbital Prison", "Creates a long-duration field that follows the densest cluster.", "Tracking 8 sec well", 5],
      ],
    },
  },
  {
    name: "Drone Squadron",
    sheet: "Drone Squadron",
    role: "Permanent autonomous support",
    control: "Passive",
    pathA: {
      name: "Interceptor Wing",
      summary: "Improves combat performance and prioritizes dangerous payloads.",
      upgrades: [
        ["Combat Drones", "Increases drone shot damage.", "+25% drone damage", 1],
        ["Interceptor Logic", "Drones prioritize bombs and plasma over ships.", "Payload priority", 2],
        ["Coordinated Fire", "Multiple drones focus damaged priority targets.", "Shared target logic", 3],
        ["Point Defense", "Drones can destroy nearby hostile shots instantly on a timer.", "1 intercept per 5 sec", 4],
        ["Guardian Wing", "Adds two elite drones with stronger weapons.", "+2 elite drones", 5],
      ],
    },
    pathB: {
      name: "Support Network",
      summary: "Improves salvage collection, repairs, and defensive utility.",
      upgrades: [
        ["Salvage Network", "Increases drone pickup range.", "+50% collection radius", 1],
        ["Cargo Relay", "Collected debris is worth more.", "+20% debris value", 2],
        ["Repair Wing", "Drones slowly restore base integrity.", "+1.2 HP/sec", 3],
        ["Emergency Patch", "Drones repair the base after a payload impact.", "Restore 20% of hit damage", 4],
        ["Autonomous Foundry", "Drones periodically create one debris during combat.", "1 debris per 18 sec", 5],
      ],
    },
  },
  {
    name: "Scatter Core",
    sheet: "Scatter Core",
    role: "Unguided multi-shot main weapon",
    control: "Passive",
    pathA: {
      name: "Fusillade Array",
      summary: "Adds more projectiles and wider coverage.",
      upgrades: [
        ["Triple Volley", "Converts the cannon into a three-shot spread.", "3 projectiles", 1],
        ["Wide Formation", "Increases spacing between spread projectiles.", "+30% spread angle", 2],
        ["Fusillade Array", "Expands the volley to five projectiles.", "5 projectiles", 3],
        ["Wing Cannons", "Adds two low-damage outer projectiles.", "7 projectiles", 4],
        ["Barrage Core", "Fires nine projectiles in a broad defensive fan.", "9 projectiles", 5],
      ],
    },
    pathB: {
      name: "Fragmentation Core",
      summary: "Keeps a tighter volley but adds impact effects and penetration.",
      upgrades: [
        ["Tight Formation", "Narrows the spread and improves individual projectile damage.", "+12% pellet damage", 1],
        ["Dense Pellets", "Spread projectiles deal increased payload damage.", "+40% payload damage", 2],
        ["Fragmenting Volley", "Impacts damage nearby targets.", "45 px splash", 3],
        ["Shatter Rounds", "Destroyed payloads create damaging fragments.", "3 fragments", 4],
        ["Breach Volley", "Every pellet penetrates one additional target.", "+1 penetration", 5],
      ],
    },
  },
  {
    name: "Seeking Matrix",
    sheet: "Seeking Matrix",
    role: "Homing main-weapon mutation",
    control: "Passive",
    pathA: {
      name: "Guidance Matrix",
      summary: "Improves tracking, reacquisition, and multi-target performance.",
      upgrades: [
        ["Vector Guidance", "Increases guided-round turning strength.", "+35% turn rate", 1],
        ["Smart Reacquisition", "Rounds immediately seek a new target after a kill.", "Instant retarget", 2],
        ["Distributed Guidance", "Spread projectiles prefer separate targets.", "Target distribution", 3],
        ["Predictive Pursuit", "Guided rounds lead moving targets.", "Motion prediction", 4],
        ["Perfect Guidance", "Rounds can reverse once to acquire a missed target.", "One reversal", 5],
      ],
    },
    pathB: {
      name: "Hunter Matrix",
      summary: "Trades some broad tracking for penetration and priority-target damage.",
      upgrades: [
        ["Hunter Rounds", "Guided rounds deal additional damage to elites.", "+25% elite damage", 1],
        ["Boss Lock", "Guided rounds prioritize bosses while one is present.", "Boss priority", 2],
        ["Piercing Guidance", "Guided rounds pass through one target.", "+1 penetration", 3],
        ["Weak-Point Logic", "Guided rounds gain damage after sustained tracking.", "Up to +35% damage", 4],
        ["Execution Matrix", "Low-health elites and bosses take greatly increased damage.", "+80% below 20% HP", 5],
      ],
    },
  },
];

const workbook = Workbook.create();
const overview = workbook.worksheets.add("Overview");

const colors = {
  bg: "#10161A",
  panel: "#182126",
  panel2: "#202B31",
  teal: "#68D6C7",
  gold: "#F2C45B",
  text: "#F3F1E8",
  muted: "#A9B5BA",
  branchA: "#1F5E5A",
  branchB: "#725C20",
  line: "#40505B",
  input: "#DDEBF7",
};

function styleTitle(sheet, range, title, subtitle) {
  sheet.getRange(range).merge();
  const titleCell = sheet.getRange(range.split(":")[0]);
  titleCell.values = [[title]];
  titleCell.format = {
    fill: colors.bg,
    font: { bold: true, color: colors.text, size: 18 },
    verticalAlignment: "center",
  };
  titleCell.format.rowHeight = 34;

  const subtitleRange = sheet.getRange("A2:M2");
  subtitleRange.merge();
  subtitleRange.values = [[subtitle]];
  subtitleRange.format = {
    fill: colors.panel,
    font: { color: colors.muted, italic: true, size: 10 },
    verticalAlignment: "center",
  };
  subtitleRange.format.rowHeight = 28;
}

function formatBranch(sheet, startCol, pathInfo, accent) {
  const endCol = startCol + 5;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const start = letters[startCol];
  const end = letters[endCol];

  sheet.getRange(`${start}4:${end}4`).merge();
  sheet.getRange(`${start}4`).values = [[pathInfo.name]];
  sheet.getRange(`${start}4:${end}4`).format = {
    fill: accent,
    font: { bold: true, color: colors.text, size: 13 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  sheet.getRange(`${start}4:${end}4`).format.rowHeight = 26;

  sheet.getRange(`${start}5:${end}5`).merge();
  sheet.getRange(`${start}5`).values = [[pathInfo.summary]];
  sheet.getRange(`${start}5:${end}5`).format = {
    fill: colors.panel2,
    font: { color: colors.muted, italic: true, size: 9 },
    wrapText: true,
    verticalAlignment: "center",
  };
  sheet.getRange(`${start}5:${end}5`).format.rowHeight = 34;

  const headers = [["Tier", "Upgrade", "Description", "Numerical Change", "Cost", "Cumulative"]];
  sheet.getRange(`${start}6:${end}6`).values = headers;
  sheet.getRange(`${start}6:${end}6`).format = {
    fill: colors.bg,
    font: { bold: true, color: colors.text },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };

  const rows = pathInfo.upgrades.map((upgrade, index) => [
    index + 1,
    upgrade[0],
    upgrade[1],
    upgrade[2],
    upgrade[3],
    null,
  ]);
  sheet.getRange(`${start}7:${end}11`).values = rows;
  sheet.getRange(`${start}7:${end}11`).format = {
    fill: colors.panel,
    font: { color: colors.text, size: 9 },
    wrapText: true,
    verticalAlignment: "top",
    borders: {
      insideHorizontal: { style: "thin", color: colors.line },
      bottom: { style: "thin", color: colors.line },
    },
  };
  sheet.getRangeByIndexes(6, startCol, 5, 1).format.horizontalAlignment = "center";
  sheet.getRangeByIndexes(6, startCol + 4, 5, 2).format.horizontalAlignment = "center";
  sheet.getRangeByIndexes(6, startCol + 4, 5, 2).format.numberFormat = "0";
  sheet.getRangeByIndexes(6, startCol + 5, 1, 1).formulas = [[`=${letters[startCol + 4]}7`]];
  sheet.getRangeByIndexes(7, startCol + 5, 4, 1).formulasR1C1 = [["=R[-1]C+RC[-1]"]];
  sheet.getRangeByIndexes(7, startCol + 5, 4, 1).fillDown();

  sheet.getRange(`${start}13:${end}13`).merge();
  sheet.getRange(`${start}13`).values = [["Branch rule: tiers are sequential; choose whether branches are exclusive or mixable during implementation."]];
  sheet.getRange(`${start}13:${end}13`).format = {
    fill: "#263138",
    font: { color: colors.muted, italic: true, size: 9 },
    wrapText: true,
  };
  sheet.getRange(`${start}13:${end}13`).format.rowHeight = 30;
}

styleTitle(
  overview,
  "A1:H1",
  "Drift Miner Stage 2 - Relic Upgrade Trees",
  "Editable design workbook: two five-tier paths for each relic. Costs and effects are starting proposals.",
);
overview.getRange("A4:H4").values = [[
  "Relic",
  "Combat Role",
  "Control",
  "Path A",
  "Path B",
  "Path A Cost",
  "Path B Cost",
  "Design Intent",
]];
overview.getRange("A4:H4").format = {
  fill: colors.bg,
  font: { bold: true, color: colors.text },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: colors.line },
};

const overviewRows = relics.map((relic) => [
  relic.name,
  relic.role,
  relic.control,
  relic.pathA.name,
  relic.pathB.name,
  null,
  null,
  `${relic.pathA.summary} / ${relic.pathB.summary}`,
]);
overview.getRange(`A5:H${4 + relics.length}`).values = overviewRows;
for (let i = 0; i < relics.length; i += 1) {
  const row = 5 + i;
  overview.getRange(`F${row}`).formulas = [[`='${relics[i].sheet}'!F11`]];
  overview.getRange(`G${row}`).formulas = [[`='${relics[i].sheet}'!M11`]];
}
overview.getRange(`A5:H${4 + relics.length}`).format = {
  fill: colors.panel,
  font: { color: colors.text, size: 9 },
  wrapText: true,
  verticalAlignment: "top",
  borders: { insideHorizontal: { style: "thin", color: colors.line } },
};
overview.getRange(`F5:G${4 + relics.length}`).format = {
  fill: colors.input,
  font: { bold: true, color: "#17324D" },
  numberFormat: "0",
  horizontalAlignment: "center",
};
overview.getRange(`A${6 + relics.length}:H${6 + relics.length}`).merge();
overview.getRange(`A${6 + relics.length}`).values = [[
  "Suggested implementation: recover the relic at Level 1, then spend carapaces between waves. A branch-selection rule can be added later without changing the workbook structure.",
]];
overview.getRange(`A${6 + relics.length}:H${6 + relics.length}`).format = {
  fill: colors.panel2,
  font: { color: colors.gold, italic: true },
  wrapText: true,
};
overview.getRange(`A${6 + relics.length}:H${6 + relics.length}`).format.rowHeight = 38;
overview.freezePanes.freezeRows(4);
overview.showGridLines = false;
overview.getRange("A1:H20").format.font.name = "Aptos";
overview.getRange(`A5:H${4 + relics.length}`).format.rowHeight = 42;
const overviewWidths = [22, 27, 22, 24, 24, 13, 13, 52];
overviewWidths.forEach((width, index) => {
  overview.getRangeByIndexes(0, index, 20, 1).format.columnWidth = width;
});

for (const relic of relics) {
  const sheet = workbook.worksheets.add(relic.sheet);
  styleTitle(
    sheet,
    "A1:M1",
    `${relic.name} Upgrade Tree`,
    `${relic.role} | Control: ${relic.control}`,
  );
  formatBranch(sheet, 0, relic.pathA, colors.branchA);
  formatBranch(sheet, 7, relic.pathB, colors.branchB);
  sheet.getRange("G4:G13").format.fill = colors.bg;
  sheet.getRange("G4:G13").format.columnWidth = 3;
  sheet.getRange("A15:M15").merge();
  sheet.getRange("A15").values = [["Designer Notes"]];
  sheet.getRange("A15:M15").format = {
    fill: colors.bg,
    font: { bold: true, color: colors.gold },
  };
  sheet.getRange("A16:M19").merge();
  sheet.getRange("A16").values = [["Editable notes: tune numerical values, branch exclusivity, and prerequisite rules after playtesting."]];
  sheet.getRange("A16:M19").format = {
    fill: "#EAF2F8",
    font: { color: "#17324D" },
    wrapText: true,
    verticalAlignment: "top",
    borders: { preset: "outside", style: "thin", color: colors.line },
  };
  sheet.getRange("A16:M19").format.rowHeight = 24;
  sheet.freezePanes.freezeRows(6);
  sheet.showGridLines = false;
  sheet.getRange("A1:M20").format.font.name = "Aptos";
  const widths = [7, 22, 38, 25, 9, 12, 3, 7, 22, 38, 25, 9, 12];
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 20, 1).format.columnWidth = width;
  });
  sheet.getRange("A7:M11").format.rowHeight = 52;
}

const overviewCheck = await workbook.inspect({
  kind: "table",
  range: "Overview!A1:H14",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 10,
});
console.log(overviewCheck.ndjson);

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(formulaErrors.ndjson);

const checkpointPath = path.join(outputDir, "relic_trees_checkpoint.xlsx");
const checkpoint = await SpreadsheetFile.exportXlsx(workbook);
await checkpoint.save(checkpointPath);
const imported = await SpreadsheetFile.importXlsx(await FileBlob.load(checkpointPath));

for (const sheetName of ["Overview", ...relics.map((relic) => relic.sheet)]) {
  const preview = await imported.render({
    sheetName,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const fileName = sheetName.toLowerCase().replaceAll(" ", "_");
  await fs.writeFile(
    path.join(outputDir, `${fileName}_preview.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const output = await SpreadsheetFile.exportXlsx(imported);
await output.save(path.join(outputDir, "Drift_Miner_Stage_2_Relic_Upgrade_Trees.xlsx"));
await fs.rm(checkpointPath, { force: true });
