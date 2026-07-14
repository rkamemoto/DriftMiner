import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = String.raw`C:\Users\RyanKamemoto\OneDrive - kamemotofinancial.com\Documents\DriftMiner`;
const inputPath = path.join(root, "outputs", "stage2-tech-tree", "Drift Miner Stage 2 Tech Tree.xlsx");
const outputPath = path.join(root, "outputs", "stage2-tech-tree", "Drift Miner Stage 2 Tech Tree - Described.xlsx");
const previewDir = path.join(root, "tmp", "tech-tree-builder", "described-previews");
await fs.mkdir(previewDir, { recursive: true });

const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const tree = wb.worksheets.getItem("Tech Tree");
const editor = wb.worksheets.getItem("Node Editor");
const descriptions = wb.worksheets.add("Upgrade Descriptions");

const colors = {
  ink: "#EAF1F2",
  darkInk: "#203137",
  muted: "#A8B5B9",
  surface: "#182126",
  surface2: "#222E34",
  teal: "#67D5C7",
  tealDark: "#254642",
  gold: "#F2C45B",
  purple: "#A97CFF",
  line: "#40515A",
  green: "#7EE3A1",
};

const upgrades = [
  ["Core", 1, "Manual Aim", "Base Defense", "Allows the cannon to rotate with the right stick instead of firing only straight upward.", "Direct fire toward edge targets and moving alien formations.", "Free", 0, "Implemented"],
  ["Core", 2, "Dotted Aim Guide", "Manual Aim", "Projects a dotted line from the cannon so the player can see the exact firing direction.", "Makes angled shots easier to place without adding automatic targeting.", "Debris", 8, "Planned"],
  ["Core", 3, "Longer Dotted Line", "Dotted Aim Guide", "Extends the aiming guide farther into the sky.", "Improves long-range accuracy and makes distant edge targets easier to line up.", "Debris", 14, "Planned"],
  ["Core", 4, "Predictive Aiming", "Longer Dotted Line", "Adds a lead marker showing where the selected alien will be when the shell arrives.", "Helps hit fast lateral targets without turning the base cannon into an automatic weapon.", "Debris", 24, "Planned"],

  ["Ballistics", 1, "Cannon Damage I", "Base Defense", "Increases the damage dealt by each ordinary cannon shell.", "Raises shell damage from 18 to 25.", "Debris", 8, "Implemented"],
  ["Ballistics", 2, "Cannon Damage II", "Cannon Damage I", "Further improves shell impact damage.", "Raises shell damage from 25 to 32.", "Debris", 13, "Implemented"],
  ["Ballistics", 3, "Cannon Damage III", "Cannon Damage II", "Improves the cannon against tougher mid-wave ships.", "Raises shell damage from 32 to 39.", "Debris", 18, "Implemented"],
  ["Ballistics", 4, "Cannon Damage IV", "Cannon Damage III", "Adds another direct-damage increase for late waves.", "Suggested shell damage: 46.", "Debris", 24, "Planned"],
  ["Ballistics", 5, "Heavy Shells with Splash Damage", "Cannon Damage IV", "Heavy shells burst on impact and damage aliens close to the primary target.", "Suggested: full damage to the target and 40% damage in a small radius.", "Debris", 36, "Planned"],

  ["Cycling", 1, "Reload Drive I", "Base Defense", "Shortens the delay between ordinary cannon shots.", "Improves firing rate from about 2.9 to 3.4 shots per second.", "Debris", 10, "Implemented"],
  ["Cycling", 2, "Reload Drive II", "Reload Drive I", "Further shortens the cannon reload cycle.", "Reduces shot interval from 0.295 to 0.250 seconds.", "Debris", 15, "Implemented"],
  ["Cycling", 3, "Reload Drive III", "Reload Drive II", "Improves sustained damage against larger waves.", "Reduces shot interval from 0.250 to 0.205 seconds.", "Debris", 20, "Implemented"],
  ["Cycling", 4, "Reload Drive IV", "Reload Drive III", "Pushes manual firing closer to the current reload cap.", "Suggested shot interval: 0.170 seconds.", "Debris", 27, "Planned"],
  ["Cycling", 5, "Auto Loader", "Reload Drive IV", "The cannon automatically fires while the trigger is held and a valid target is near the aim line.", "Maintains the normal heat limit; it does not provide automatic aiming.", "Debris", 40, "Planned"],

  ["Thermal", 1, "Cooling Banks I", "Base Defense", "Reduces heat generated per shot and improves passive heat dissipation.", "Extends the number of shots possible before overheating.", "Debris", 12, "Implemented"],
  ["Thermal", 2, "Cooling Banks II", "Cooling Banks I", "Further improves sustained firing.", "Reduces heat per shot from 0.23 to 0.21.", "Debris", 17, "Implemented"],
  ["Thermal", 3, "Cooling Banks III", "Cooling Banks II", "Adds another heat reduction and faster recovery.", "Suggested heat per shot: 0.19.", "Debris", 23, "Planned"],
  ["Thermal", 4, "Cooling Banks IV", "Cooling Banks III", "Provides late-game cooling for rapid-fire builds.", "Suggested heat per shot: 0.17 with stronger passive cooling.", "Debris", 30, "Planned"],
  ["Thermal", 5, "Cryo Cooling", "Cooling Banks IV", "Vents the weapon rapidly after it reaches maximum heat.", "Suggested: one-second emergency vent followed by a brief cooling boost.", "Debris", 42, "Planned"],

  ["Mobility", 1, "Turret Drive I", "Base Defense", "Increases horizontal turret movement speed.", "Raises movement speed from 250 to 285.", "Debris", 7, "Implemented"],
  ["Mobility", 2, "Turret Drive II", "Turret Drive I", "Improves debris collection and edge defense.", "Raises movement speed from 285 to 320.", "Debris", 12, "Implemented"],
  ["Mobility", 3, "Turret Drive III", "Turret Drive II", "Adds another meaningful movement increase.", "Suggested movement speed: 355.", "Debris", 18, "Planned"],
  ["Mobility", 4, "Turret Drive IV", "Turret Drive III", "Improves late-wave repositioning without making the turret uncontrollable.", "Suggested movement speed: 373.", "Debris", 25, "Planned"],
  ["Mobility", 5, "Mag-Rail Drive", "Turret Drive IV", "Accelerates quickly toward full speed and slows precisely near debris or screen edges.", "Suggested: faster acceleration plus a short directional dash.", "Debris", 38, "Planned"],

  ["Defense", 1, "Patch Base", "Base Defense", "Spends debris to restore damaged Base Integrity.", "Restores 120 integrity per purchase, up to the maximum.", "Debris", 6, "Implemented"],
  ["Defense", 2, "Repair Drones", "Patch Base", "Deploys drones that slowly repair the base between waves.", "Suggested: restore 20 integrity during each wave break.", "Debris", 16, "Planned"],
  ["Defense", 3, "Carapace Plating", "Repair Drones", "Reinforces the base with recovered alien armor.", "Suggested: increase maximum integrity and reduce collision damage by 15%.", "Alien Carapace", 2, "Planned"],
  ["Defense", 4, "Reflective Shield", "Carapace Plating", "Creates a temporary shield that reflects alien projectiles back into the sky.", "Suggested: activates automatically at low integrity with a long cooldown.", "Alien Carapace", 4, "Planned"],
  ["Defense", 5, "Artifact Shield", "Reflective Shield", "Uses the artifact's energy to protect the base from a lethal strike.", "Suggested: once per wave, prevent destruction and leave the base at 1 integrity.", "Alien Carapace", 7, "Planned"],

  ["Homing", 1, "Homing Missile x3", "Rare Relic Drop", "Launches three guided missiles that divide among dangerous targets.", "Each missile deals 72 damage and tracks independently.", "Relic Drop", 0, "Implemented"],
  ["Homing", 2, "Expanded Salvo", "Homing Missile x3", "Adds missiles to the homing salvo as the relic is upgraded.", "Progresses toward a maximum seven-missile salvo.", "Alien Carapace", 1, "Implemented"],
  ["Homing", 3, "Hunter Swarm", "Expanded Salvo", "Improves target assignment so missiles spread intelligently across priority threats.", "Bosses remain the first priority; extra missiles seek separate ships.", "Alien Carapace", 3, "Planned"],
  ["Homing", 4, "Homing Cluster Bombs", "Hunter Swarm", "Each missile releases smaller bomblets when it reaches its target.", "Suggested: three bomblets dealing 30% missile damage in a small radius.", "Alien Carapace", 5, "Planned"],
  ["Homing", 5, "Custom Homing", "Homing Cluster Bombs", "Reserved for the final homing specialization.", "Possible direction: missiles loop back for a second pass if their target dies.", "Alien Carapace", 8, "Idea"],

  ["Flak", 1, "Flak Cannon x3", "Rare Relic Drop", "Fires three flak shells toward the densest alien groups.", "Each shell detonates for area damage; spread targeting avoids wasting all shells.", "Relic Drop", 0, "Planned"],
  ["Flak", 2, "Shrapnel Payload", "Flak Cannon x3", "Increases blast damage and radius.", "Improves swarm clearing without strongly increasing boss damage.", "Alien Carapace", 1, "Implemented"],
  ["Flak", 3, "Proximity Burst", "Shrapnel Payload", "Detonates when enough aliens enter the blast area instead of only at a fixed point.", "Makes the weapon more reliable against moving formations.", "Alien Carapace", 3, "Planned"],
  ["Flak", 4, "Flak Cluster Shrapnel", "Proximity Burst", "Each flak explosion releases secondary shrapnel bursts.", "Suggested: four fragments seek nearby ships for reduced damage.", "Alien Carapace", 5, "Planned"],
  ["Flak", 5, "Custom Flak", "Flak Cluster Shrapnel", "Reserved for the final flak specialization.", "Possible direction: lingering debris cloud damages ships that pass through it.", "Alien Carapace", 8, "Idea"],

  ["EMP", 1, "EMP Pulse", "Rare Relic Drop", "Damages and nearly freezes every alien currently onscreen.", "Deals 30 damage and heavily slows ships for 2.4 seconds.", "Relic Drop", 0, "Implemented"],
  ["EMP", 2, "EMP Amplifier", "EMP Pulse", "Increases EMP damage and disruption duration.", "Raises the effect to roughly 48 damage and 2.95 seconds.", "Alien Carapace", 1, "Implemented"],
  ["EMP", 3, "System Overload", "EMP Amplifier", "EMP-disrupted ships take additional damage from all weapons.", "Suggested vulnerability: 25% bonus damage while disrupted.", "Alien Carapace", 3, "Planned"],
  ["EMP", 4, "Extended Freeze", "System Overload", "Keeps affected ships nearly frozen for longer.", "Suggested: add 1.5 seconds without increasing screen-wide damage.", "Alien Carapace", 5, "Planned"],
  ["EMP", 5, "Custom EMP", "Extended Freeze", "Reserved for the final EMP specialization.", "Possible direction: destroyed disabled ships chain a smaller EMP to nearby ships.", "Alien Carapace", 8, "Idea"],

  ["Railgun", 1, "Railgun", "Rare Relic Drop", "Fires a vertical beam that pierces every alien above the turret.", "Deals 170 damage across a 52-pixel-wide firing lane.", "Relic Drop", 0, "Implemented"],
  ["Railgun", 2, "Rail Accelerator", "Railgun", "Widens the beam and increases its damage.", "Suggested upgrade: 240 damage and 60-pixel width.", "Alien Carapace", 1, "Implemented"],
  ["Railgun", 3, "Capacitor Echo", "Rail Accelerator", "Fires a weaker second beam shortly after the first.", "Suggested echo damage: 55% of the initial beam.", "Alien Carapace", 3, "Planned"],
  ["Railgun", 4, "Extra Railgun Pulses", "Capacitor Echo", "Adds additional delayed pulses along the same firing lane.", "Suggested: two follow-up pulses at 40% damage each.", "Alien Carapace", 5, "Planned"],
  ["Railgun", 5, "Custom Railgun", "Extra Railgun Pulses", "Reserved for the final Railgun specialization.", "Possible direction: beam width narrows but damage rises sharply against bosses.", "Alien Carapace", 8, "Idea"],
];

descriptions.mergeCells("A1:I2");
descriptions.getRange("A1").values = [["Drift Miner Stage 2 - Upgrade Descriptions"]];
descriptions.getRange("A1:I2").format = {
  fill: colors.tealDark,
  font: { bold: true, color: colors.ink, size: 18 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "outside", style: "medium", color: colors.teal },
};
descriptions.mergeCells("A3:I3");
descriptions.getRange("A3").values = [["Suggested values are planning targets and remain fully editable. Your Tech Tree sheet remains the source for branch order and names."]];
descriptions.getRange("A3:I3").format = {
  fill: colors.surface2,
  font: { color: colors.muted, italic: true },
};

const headers = ["Branch", "Tier", "Upgrade", "Prerequisite", "Description", "Suggested Gameplay Effect", "Currency", "Suggested Cost", "Status"];
descriptions.getRange("A5:I5").values = [headers];
descriptions.getRange(`A6:I${upgrades.length + 5}`).values = upgrades;
const descTable = descriptions.tables.add(`A5:I${upgrades.length + 5}`, true, "UpgradeDescriptions");
descTable.style = "TableStyleMedium2";
descTable.showBandedRows = true;
descTable.showFilterButton = true;

descriptions.getRange(`A5:I${upgrades.length + 5}`).format = {
  font: { color: colors.darkInk, size: 10 },
  borders: { preset: "all", style: "thin", color: colors.line },
  verticalAlignment: "center",
};
descriptions.getRange("A5:I5").format = {
  fill: colors.tealDark,
  font: { bold: true, color: colors.ink },
  horizontalAlignment: "center",
  wrapText: true,
  rowHeight: 32,
};
descriptions.getRange(`E6:F${upgrades.length + 5}`).format.wrapText = true;
descriptions.getRange(`6:${upgrades.length + 5}`).format.rowHeight = 38;
descriptions.getRange("A:A").format.columnWidth = 14;
descriptions.getRange("B:B").format.columnWidth = 8;
descriptions.getRange("C:C").format.columnWidth = 27;
descriptions.getRange("D:D").format.columnWidth = 25;
descriptions.getRange("E:E").format.columnWidth = 44;
descriptions.getRange("F:F").format.columnWidth = 48;
descriptions.getRange("G:G").format.columnWidth = 18;
descriptions.getRange("H:H").format.columnWidth = 15;
descriptions.getRange("I:I").format.columnWidth = 14;
descriptions.freezePanes.freezeRows(5);
descriptions.showGridLines = false;

descriptions.getRange(`I6:I${upgrades.length + 5}`).conditionalFormats.add("containsText", {
  text: "Implemented",
  format: { fill: "#254A38", font: { color: colors.green, bold: true } },
});
descriptions.getRange(`I6:I${upgrades.length + 5}`).conditionalFormats.add("containsText", {
  text: "Planned",
  format: { fill: "#4A3E25", font: { color: colors.gold, bold: true } },
});
descriptions.getRange(`I6:I${upgrades.length + 5}`).conditionalFormats.add("containsText", {
  text: "Idea",
  format: { fill: "#372B4D", font: { color: colors.purple, bold: true } },
});

// Improve the edited visual tree's Tier 4 and Tier 5 readability without changing the user's text.
tree.getRange("J:J").format.columnWidth = 31;
tree.getRange("K:K").format.columnWidth = 26;
tree.getRange("L:L").format.columnWidth = 34;
tree.getRange("J6:K17").format.wrapText = true;
tree.getRange("6:17").format.rowHeight = 48;

// Synchronize the most important edited names and descriptions back into the detailed node editor.
const editorUpdates = [
  ["TARGET-3", "Longer Dotted Line", "Extends the dotted aiming guide farther into the sky.", "Longer guide", "Planned"],
  ["DAMAGE-3", "Cannon Damage III", "Improves ordinary shell damage for tougher mid-wave ships.", "39 damage", "Implemented"],
  ["HOMING-0", "Homing Missile x3", "Launches three tracking missiles that divide among dangerous targets.", "3 missiles, 72 damage each", "Implemented"],
  ["FLAK-0", "Flak Cannon x3", "Launches three area-damage shells toward dense alien formations.", "Three flak shells", "Planned"],
  ["RAIL-1", "Rail Accelerator", "Widens the Railgun beam and increases its damage.", "240 damage, 60 width", "Implemented"],
];

const editorValues = editor.getRange("A6:O105").values;
for (const [id, name, description, nextValue, status] of editorUpdates) {
  const rowIndex = editorValues.findIndex((row) => row[0] === id);
  if (rowIndex < 0) continue;
  const excelRow = rowIndex + 6;
  editor.getRange(`E${excelRow}`).values = [[name]];
  editor.getRange(`I${excelRow}`).values = [[description]];
  editor.getRange(`K${excelRow}`).values = [[nextValue]];
  editor.getRange(`M${excelRow}`).values = [[status]];
}

const preview = await wb.render({ sheetName: "Upgrade Descriptions", range: "A1:I25", scale: 1.05, format: "png" });
await fs.writeFile(path.join(previewDir, "upgrade-descriptions.png"), new Uint8Array(await preview.arrayBuffer()));
const treePreview = await wb.render({ sheetName: "Tech Tree", range: "A1:L24", scale: 1.0, format: "png" });
await fs.writeFile(path.join(previewDir, "tech-tree-improved.png"), new Uint8Array(await treePreview.arrayBuffer()));

const inspection = await wb.inspect({
  kind: "table",
  range: "Upgrade Descriptions!A1:I18",
  include: "values,formulas",
  tableMaxRows: 18,
  tableMaxCols: 9,
  maxChars: 10000,
});
console.log(inspection.ndjson);

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
if (errors.ndjson) console.log(errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(outputPath);
console.log(outputPath);
