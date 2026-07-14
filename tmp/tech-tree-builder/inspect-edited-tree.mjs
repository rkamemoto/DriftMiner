import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const root = String.raw`C:\Users\RyanKamemoto\OneDrive - kamemotofinancial.com\Documents\DriftMiner`;
const workbookPath = path.join(root, "outputs", "stage2-tech-tree", "Drift Miner Stage 2 Tech Tree.xlsx");
const previewDir = path.join(root, "tmp", "tech-tree-builder", "edited-previews");
await fs.mkdir(previewDir, { recursive: true });

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));

for (const [sheetName, range, fileName] of [
  ["Tech Tree", "A1:L30", "tech-tree-edited.png"],
  ["Node Editor", "A1:O45", "node-editor-edited.png"],
]) {
  const preview = await workbook.render({ sheetName, range, scale: 1.1, format: "png" });
  await fs.writeFile(path.join(previewDir, fileName), new Uint8Array(await preview.arrayBuffer()));
  const inspection = await workbook.inspect({
    kind: "table",
    range: `${sheetName}!${range}`,
    include: "values,formulas",
    tableMaxRows: 50,
    tableMaxCols: 15,
    maxChars: 18000,
  });
  console.log(`--- ${sheetName} ---`);
  console.log(inspection.ndjson);
}
