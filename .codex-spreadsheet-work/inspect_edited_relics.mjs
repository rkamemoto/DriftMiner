import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = path.resolve("../outputs/relic_upgrade_trees/Drift_Miner_Stage_2_Relic_Upgrade_Trees.xlsx");
const previewDir = path.resolve("../outputs/relic_upgrade_trees/edited_previews");
await fs.mkdir(previewDir, { recursive: true });

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const sheets = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
console.log(sheets.ndjson);

const names = [
  "Overview",
  "Homing Missile",
  "Flak Cannon",
  "EMP Pulse",
  "Railgun",
  "Gravity Well",
  "Drone Squadron",
  "Scatter Core",
  "Seeking Matrix",
];

for (const name of names) {
  const table = await workbook.inspect({
    kind: "table",
    range: `'${name}'!A1:M19`,
    include: "values,formulas",
    tableMaxRows: 22,
    tableMaxCols: 14,
    tableMaxCellChars: 500,
  });
  await fs.writeFile(
    path.join(previewDir, `${name.toLowerCase().replaceAll(" ", "_")}.ndjson`),
    table.ndjson,
    "utf8",
  );
  const preview = await workbook.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(
    path.join(previewDir, `${name.toLowerCase().replaceAll(" ", "_")}.png`),
    new Uint8Array(await preview.arrayBuffer()),
  );
}
