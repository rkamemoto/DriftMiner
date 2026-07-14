import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = String.raw`C:\Users\RyanKamemoto\OneDrive - kamemotofinancial.com\Documents\DriftMiner`;
const outputDir = path.join(root, "outputs", "stage2-tech-tree");
const outputPath = path.join(outputDir, "Drift Miner Stage 2 Tech Tree.xlsx");
const previewDir = path.join(root, "tmp", "tech-tree-builder", "previews");

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const wb = Workbook.create();
const tree = wb.worksheets.add("Tech Tree");
const editor = wb.worksheets.add("Node Editor");
const lists = wb.worksheets.add("Lists");

const colors = {
  ink: "#EAF1F2",
  muted: "#A8B5B9",
  page: "#101619",
  surface: "#182126",
  surface2: "#222E34",
  teal: "#67D5C7",
  tealDark: "#254642",
  gold: "#F2C45B",
  purple: "#A97CFF",
  orange: "#FFB44A",
  cyan: "#63E6FF",
  white: "#F4F0E8",
  line: "#40515A",
  green: "#7EE3A1",
};

const branches = ["Core", "Targeting", "Ballistics", "Cycling", "Thermal", "Mobility", "Defense", "Homing", "Flak", "EMP", "Railgun", "Custom"];
const types = ["Root", "Base Upgrade", "Relic Unlock", "Relic Upgrade", "Utility", "Custom"];
const currencies = ["Debris", "Alien Carapace", "Relic Drop", "Free", "TBD"];
const statuses = ["Implemented", "Planned", "Idea", "Disabled"];

lists.getRange("A1:D1").values = [["Branches", "Node Types", "Currencies", "Statuses"]];
lists.getRange(`A2:A${branches.length + 1}`).values = branches.map((value) => [value]);
lists.getRange(`B2:B${types.length + 1}`).values = types.map((value) => [value]);
lists.getRange(`C2:C${currencies.length + 1}`).values = currencies.map((value) => [value]);
lists.getRange(`D2:D${statuses.length + 1}`).values = statuses.map((value) => [value]);
lists.getRange("A1:D1").format = {
  fill: colors.tealDark,
  font: { bold: true, color: colors.ink },
  borders: { preset: "all", style: "thin", color: colors.line },
};
lists.getRange("A2:D20").format = {
  fill: colors.surface,
  font: { color: colors.ink },
  borders: { preset: "all", style: "thin", color: colors.line },
};
lists.getRange("A:D").format.columnWidth = 22;
lists.showGridLines = false;

const nodes = [
  ["ROOT", "Core", 0, "", "Base Defense", "Root", "Free", 0, "Defend the recovered artifact from descending alien ships.", "", "", "", "Implemented", "Starting node."],
  ["TARGET-1", "Targeting", 1, "ROOT", "Manual Aim", "Base Upgrade", "Free", 0, "Right stick controls cannon direction.", "Fixed vertical fire", "Directional fire", "Right Stick", "Implemented", ""],
  ["TARGET-2", "Targeting", 2, "TARGET-1", "Dotted Aim Guide", "Utility", "Debris", 8, "Displays a dotted guide along the cannon firing path.", "No guide", "Dotted guide", "", "Planned", "Reticle becomes an upgrade."],
  ["TARGET-3", "Targeting", 3, "TARGET-2", "Predictive Lead", "Utility", "Debris", 18, "Shows where a moving alien will intersect the current shot.", "Direction only", "Lead marker", "", "Idea", ""],
  ["DAMAGE-1", "Ballistics", 1, "ROOT", "Cannon Damage I", "Base Upgrade", "Debris", 8, "Increase ordinary cannon shell damage.", "18 damage", "25 damage", "", "Implemented", ""],
  ["DAMAGE-2", "Ballistics", 2, "DAMAGE-1", "Cannon Damage II", "Base Upgrade", "Debris", 13, "Increase ordinary cannon shell damage.", "25 damage", "32 damage", "", "Implemented", ""],
  ["DAMAGE-3", "Ballistics", 3, "DAMAGE-2", "Cannon Damage III", "Base Upgrade", "Debris", 18, "Increase ordinary cannon shell damage.", "32 damage", "39 damage", "", "Implemented", ""],
  ["RELOAD-1", "Cycling", 1, "ROOT", "Reload Drive I", "Base Upgrade", "Debris", 10, "Reduces time between cannon shots.", "0.340 sec", "0.295 sec", "", "Implemented", "About 2.9 to 3.4 shots/sec."],
  ["RELOAD-2", "Cycling", 2, "RELOAD-1", "Reload Drive II", "Base Upgrade", "Debris", 15, "Reduces time between cannon shots.", "0.295 sec", "0.250 sec", "", "Implemented", ""],
  ["RELOAD-3", "Cycling", 3, "RELOAD-2", "Reload Drive III", "Base Upgrade", "Debris", 20, "Reduces time between cannon shots.", "0.250 sec", "0.205 sec", "", "Implemented", ""],
  ["COOL-1", "Thermal", 1, "ROOT", "Cooling Banks I", "Base Upgrade", "Debris", 12, "Reduces heat per shot and improves heat dissipation.", "0.25 heat", "0.23 heat", "", "Implemented", ""],
  ["COOL-2", "Thermal", 2, "COOL-1", "Cooling Banks II", "Base Upgrade", "Debris", 17, "Further improves sustained firing.", "0.23 heat", "0.21 heat", "", "Implemented", ""],
  ["DRIVE-1", "Mobility", 1, "ROOT", "Turret Drive I", "Base Upgrade", "Debris", 7, "Increases horizontal turret speed.", "250 speed", "285 speed", "", "Implemented", ""],
  ["DRIVE-2", "Mobility", 2, "DRIVE-1", "Turret Drive II", "Base Upgrade", "Debris", 12, "Increases horizontal turret speed.", "285 speed", "320 speed", "", "Implemented", ""],
  ["REPAIR-1", "Defense", 1, "ROOT", "Patch Base", "Base Upgrade", "Debris", 6, "Restore Base Integrity.", "Damaged base", "+120 integrity", "", "Implemented", "Repeatable purchase."],
  ["HOMING-0", "Homing", 1, "ROOT", "Homing Missile", "Relic Unlock", "Relic Drop", 0, "Launches a tracking missile salvo.", "Locked", "3 missiles, 72 damage each", "Y / H", "Implemented", "Rare alien drop."],
  ["HOMING-1", "Homing", 2, "HOMING-0", "Expanded Salvo", "Relic Upgrade", "Alien Carapace", 1, "Adds missiles to the salvo over multiple levels.", "3 missiles", "Up to 7 missiles", "Y / H", "Implemented", ""],
  ["HOMING-2", "Homing", 3, "HOMING-1", "Hunter Swarm", "Relic Upgrade", "Alien Carapace", 3, "Missiles prioritize separate dangerous targets.", "Basic priority", "Advanced target split", "Y / H", "Idea", ""],
  ["FLAK-0", "Flak", 1, "ROOT", "Flak Cannon", "Relic Unlock", "Relic Drop", 0, "Targets the densest group and deals area damage.", "Locked", "85 damage, 90 radius", "X / F", "Implemented", "Rare alien drop."],
  ["FLAK-1", "Flak", 2, "FLAK-0", "Shrapnel Payload", "Relic Upgrade", "Alien Carapace", 1, "Increase flak damage and blast radius.", "85 / 90", "121 / 104", "X / F", "Implemented", ""],
  ["FLAK-2", "Flak", 3, "FLAK-1", "Proximity Burst", "Relic Upgrade", "Alien Carapace", 3, "Detonates early when several aliens enter the blast area.", "Fixed target burst", "Proximity burst", "X / F", "Idea", ""],
  ["EMP-0", "EMP", 1, "ROOT", "EMP Pulse", "Relic Unlock", "Relic Drop", 0, "Damages and nearly freezes every alien onscreen.", "Locked", "30 damage, 2.4 sec", "B / E", "Implemented", "Rare alien drop."],
  ["EMP-1", "EMP", 2, "EMP-0", "EMP Amplifier", "Relic Upgrade", "Alien Carapace", 1, "Increase disruption duration and damage.", "2.4 sec / 30", "2.95 sec / 48", "B / E", "Implemented", ""],
  ["EMP-2", "EMP", 3, "EMP-1", "System Overload", "Relic Upgrade", "Alien Carapace", 3, "Disabled ships take bonus damage from other weapons.", "Slow only", "Damage vulnerability", "B / E", "Idea", ""],
  ["RAIL-0", "Railgun", 1, "ROOT", "Railgun", "Relic Unlock", "Relic Drop", 0, "Pierces every alien in a vertical lane.", "Locked", "170 damage, 52 width", "RSC / R", "Implemented", "Rare alien drop."],
  ["RAIL-1", "Railgun", 2, "RAIL-0", "Rail Accelerator", "Relic Upgrade", "Alien Carapace", 1, "Increase beam damage and width.", "170 / 52", "240 / 60", "RSC / R", "Implemented", ""],
  ["RAIL-2", "Railgun", 3, "RAIL-1", "Capacitor Echo", "Relic Upgrade", "Alien Carapace", 3, "Fires a weaker second beam after a short delay.", "Single beam", "Double pulse", "RSC / R", "Idea", ""],
  ["CUSTOM-1", "Custom", 1, "ROOT", "Custom Node 1", "Custom", "TBD", 0, "Replace this row with a new weapon or upgrade.", "", "", "", "Idea", ""],
  ["CUSTOM-2", "Custom", 2, "CUSTOM-1", "Custom Node 2", "Custom", "TBD", 0, "Use Parent ID to connect it to another node.", "", "", "", "Idea", ""],
  ["CUSTOM-3", "Custom", 3, "CUSTOM-2", "Custom Node 3", "Custom", "TBD", 0, "Duplicate these rows for more branches.", "", "", "", "Idea", ""],
];

const headers = ["Node ID", "Branch", "Tier", "Parent ID", "Node Name", "Type", "Currency", "Cost", "Effect / Description", "Current Value", "Next Value", "Control", "Status", "Notes", "Parent Exists?"];
editor.mergeCells("A1:O2");
editor.getRange("A1").values = [["Drift Miner Stage 2 - Tech Tree Node Editor"]];
editor.getRange("A1:O2").format = {
  fill: colors.tealDark,
  font: { bold: true, color: colors.ink, size: 18 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "outside", style: "medium", color: colors.teal },
};
editor.getRange("A3:O3").merge();
editor.getRange("A3").values = [["Edit the rows below. Parent ID creates the prerequisite link; add or duplicate rows to grow the tree."]];
editor.getRange("A3:O3").format = {
  fill: colors.surface2,
  font: { color: colors.muted, italic: true },
  horizontalAlignment: "left",
};
editor.getRange("A5:O5").values = [headers];
editor.getRange(`A6:N${nodes.length + 5}`).values = nodes;
editor.getRange("O6").formulas = [[`=IF(D6="","Root",IF(COUNTIF($A$6:$A$105,D6)>0,"Yes","Missing"))`]];
editor.getRange(`O6:O${nodes.length + 5}`).fillDown();

const editorTable = editor.tables.add(`A5:O${nodes.length + 5}`, true, "TechTreeNodes");
editorTable.style = "TableStyleMedium2";
editorTable.showBandedRows = true;
editorTable.showFilterButton = true;

editor.getRange(`B6:B105`).dataValidation = { rule: { type: "list", formula1: "Lists!$A$2:$A$13" } };
editor.getRange(`F6:F105`).dataValidation = { rule: { type: "list", formula1: "Lists!$B$2:$B$7" } };
editor.getRange(`G6:G105`).dataValidation = { rule: { type: "list", formula1: "Lists!$C$2:$C$6" } };
editor.getRange(`M6:M105`).dataValidation = { rule: { type: "list", formula1: "Lists!$D$2:$D$5" } };
editor.getRange("C6:C105").dataValidation = { rule: { type: "whole", operator: "between", formula1: 0, formula2: 10 } };
editor.getRange("H6:H105").dataValidation = { rule: { type: "whole", operator: "between", formula1: 0, formula2: 999 } };

editor.getRange("A5:O105").format = {
  font: { color: "#203137", size: 10 },
  verticalAlignment: "center",
  borders: { preset: "all", style: "thin", color: colors.line },
};
editor.getRange("A5:O5").format = {
  fill: colors.tealDark,
  font: { bold: true, color: colors.ink },
  horizontalAlignment: "center",
  wrapText: true,
  rowHeight: 30,
};
editor.getRange(`6:${nodes.length + 5}`).format.rowHeight = 28;
editor.getRange(`I6:N105`).format.wrapText = true;
editor.getRange("C6:C105").format.numberFormat = "0";
editor.getRange("H6:H105").format.numberFormat = "0";
editor.getRange("A:A").format.columnWidth = 15;
editor.getRange("B:B").format.columnWidth = 14;
editor.getRange("C:C").format.columnWidth = 8;
editor.getRange("D:D").format.columnWidth = 15;
editor.getRange("E:E").format.columnWidth = 24;
editor.getRange("F:G").format.columnWidth = 18;
editor.getRange("H:H").format.columnWidth = 10;
editor.getRange("I:I").format.columnWidth = 38;
editor.getRange("J:K").format.columnWidth = 20;
editor.getRange("L:L").format.columnWidth = 15;
editor.getRange("M:M").format.columnWidth = 14;
editor.getRange("N:N").format.columnWidth = 28;
editor.getRange("O:O").format.columnWidth = 15;
editor.freezePanes.freezeRows(5);
editor.showGridLines = false;

editor.getRange("M6:M105").conditionalFormats.add("containsText", {
  text: "Implemented",
  format: { fill: "#254A38", font: { color: colors.green, bold: true } },
});
editor.getRange("M6:M105").conditionalFormats.add("containsText", {
  text: "Planned",
  format: { fill: "#4A3E25", font: { color: colors.gold, bold: true } },
});
editor.getRange("M6:M105").conditionalFormats.add("containsText", {
  text: "Idea",
  format: { fill: "#372B4D", font: { color: colors.purple, bold: true } },
});
editor.getRange("O6:O105").conditionalFormats.add("containsText", {
  text: "Missing",
  format: { fill: "#552B2B", font: { color: "#FF9B8D", bold: true } },
});

tree.mergeCells("A1:L2");
tree.getRange("A1").values = [["Drift Miner Stage 2 - Editable Weapon Tech Tree"]];
tree.getRange("A1:L2").format = {
  fill: colors.tealDark,
  font: { bold: true, color: colors.ink, size: 18 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "outside", style: "medium", color: colors.teal },
};
tree.mergeCells("A3:L3");
tree.getRange("A3").values = [["Edit node text directly here for planning, and use the Node Editor sheet for detailed prerequisites, costs, and effects."]];
tree.getRange("A3:L3").format = {
  fill: colors.surface2,
  font: { color: colors.muted, italic: true },
};

const tierHeaders = [["Branch", "Tier 0", "", "Tier 1", "", "Tier 2", "", "Tier 3", "", "Tier 4 / Future", "", "Notes"]];
tree.getRange("A5:L5").values = tierHeaders;
tree.getRange("A5:L5").format = {
  fill: colors.tealDark,
  font: { bold: true, color: colors.ink },
  horizontalAlignment: "center",
  borders: { preset: "all", style: "thin", color: colors.line },
};

const visualRows = [
  ["Core", "Base Defense", "→", "Manual Aim", "→", "Dotted Aim Guide", "→", "Predictive Lead", "→", "Custom Targeting", "", "Reticle begins as a purchasable upgrade."],
  ["Ballistics", "Base Defense", "→", "Cannon Damage I", "→", "Cannon Damage II", "→", "Cannon Damage III", "→", "Heavy Shells", "", "+7 damage per implemented level."],
  ["Cycling", "Base Defense", "→", "Reload Drive I", "→", "Reload Drive II", "→", "Reload Drive III", "→", "Auto Loader", "", "Reduces seconds between shots."],
  ["Thermal", "Base Defense", "→", "Cooling Banks I", "→", "Cooling Banks II", "→", "Cooling Banks III", "→", "Cryo Cooling", "", "Improves sustained fire."],
  ["Mobility", "Base Defense", "→", "Turret Drive I", "→", "Turret Drive II", "→", "Turret Drive III", "→", "Mag-Rail Drive", "", "Horizontal turret speed."],
  ["Defense", "Base Defense", "→", "Patch Base", "→", "Repair Drones", "→", "Carapace Plating", "→", "Artifact Shield", "", "Patch Base currently restores 120."],
  ["Homing", "Rare Relic Drop", "→", "Homing Missile", "→", "Expanded Salvo", "→", "Hunter Swarm", "→", "Custom Homing", "", "Y controller / H keyboard."],
  ["Flak", "Rare Relic Drop", "→", "Flak Cannon", "→", "Shrapnel Payload", "→", "Proximity Burst", "→", "Custom Flak", "", "X controller / F keyboard."],
  ["EMP", "Rare Relic Drop", "→", "EMP Pulse", "→", "EMP Amplifier", "→", "System Overload", "→", "Custom EMP", "", "B controller / E keyboard."],
  ["Railgun", "Rare Relic Drop", "→", "Railgun", "→", "Rail Accelerator", "→", "Capacitor Echo", "→", "Custom Railgun", "", "Right Stick Click / R keyboard."],
  ["Custom A", "Start", "→", "Custom Node", "→", "Custom Node", "→", "Custom Node", "→", "Custom Node", "", "Replace these cells."],
  ["Custom B", "Start", "→", "Custom Node", "→", "Custom Node", "→", "Custom Node", "→", "Custom Node", "", "Duplicate rows for more branches."],
];
tree.getRange(`A6:L${visualRows.length + 5}`).values = visualRows;
tree.getRange(`A6:L${visualRows.length + 5}`).format = {
  fill: colors.surface,
  font: { color: colors.ink },
  verticalAlignment: "center",
  borders: { preset: "all", style: "thin", color: colors.line },
};
tree.getRange(`A6:A${visualRows.length + 5}`).format = {
  fill: colors.surface2,
  font: { bold: true, color: colors.teal },
};
tree.getRange(`C6:C${visualRows.length + 5}`).format.font = { bold: true, color: colors.gold, size: 14 };
tree.getRange(`E6:E${visualRows.length + 5}`).format.font = { bold: true, color: colors.gold, size: 14 };
tree.getRange(`G6:G${visualRows.length + 5}`).format.font = { bold: true, color: colors.gold, size: 14 };
tree.getRange(`I6:I${visualRows.length + 5}`).format.font = { bold: true, color: colors.gold, size: 14 };
tree.getRange(`B6:J${visualRows.length + 5}`).format.horizontalAlignment = "center";
tree.getRange(`L6:L${visualRows.length + 5}`).format = {
  fill: colors.surface2,
  font: { color: colors.muted, italic: true },
  wrapText: true,
};
tree.getRange("A:A").format.columnWidth = 15;
tree.getRange("B:B").format.columnWidth = 20;
tree.getRange("C:C").format.columnWidth = 5;
tree.getRange("D:D").format.columnWidth = 22;
tree.getRange("E:E").format.columnWidth = 5;
tree.getRange("F:F").format.columnWidth = 22;
tree.getRange("G:G").format.columnWidth = 5;
tree.getRange("H:H").format.columnWidth = 22;
tree.getRange("I:I").format.columnWidth = 5;
tree.getRange("J:J").format.columnWidth = 22;
tree.getRange("K:K").format.columnWidth = 4;
tree.getRange("L:L").format.columnWidth = 34;
tree.getRange(`6:${visualRows.length + 5}`).format.rowHeight = 38;
tree.freezePanes.freezeRows(5);
tree.showGridLines = false;

tree.mergeCells("A20:F20");
tree.getRange("A20").values = [["Legend"]];
tree.getRange("A20:F20").format = {
  fill: colors.tealDark,
  font: { bold: true, color: colors.ink },
};
tree.getRange("A21:F24").values = [
  ["Status", "Meaning", "", "Currency", "Use", ""],
  ["Implemented", "Already in the prototype", "", "Debris", "Base upgrades", ""],
  ["Planned", "Next intended addition", "", "Alien Carapace", "Relic upgrades", ""],
  ["Idea", "Optional future direction", "", "Relic Drop", "Unlocks a weapon", ""],
];
tree.getRange("A21:F24").format = {
  fill: colors.surface,
  font: { color: colors.ink },
  borders: { preset: "all", style: "thin", color: colors.line },
};
tree.getRange("A22").format = { fill: "#254A38", font: { color: colors.green, bold: true } };
tree.getRange("A23").format = { fill: "#4A3E25", font: { color: colors.gold, bold: true } };
tree.getRange("A24").format = { fill: "#372B4D", font: { color: colors.purple, bold: true } };

const treePreview = await wb.render({ sheetName: "Tech Tree", range: "A1:L24", scale: 1.3, format: "png" });
await fs.writeFile(path.join(previewDir, "tech-tree.png"), new Uint8Array(await treePreview.arrayBuffer()));
const editorPreview = await wb.render({ sheetName: "Node Editor", range: "A1:O22", scale: 1.0, format: "png" });
await fs.writeFile(path.join(previewDir, "node-editor.png"), new Uint8Array(await editorPreview.arrayBuffer()));

const inspectTree = await wb.inspect({
  kind: "table",
  range: "Tech Tree!A1:L18",
  include: "values,formulas",
  tableMaxRows: 18,
  tableMaxCols: 12,
  maxChars: 5000,
});
console.log(inspectTree.ndjson);

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
if (errors.ndjson) console.log(errors.ndjson);

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(outputPath);
console.log(outputPath);
