import zipUtil from "adm-zip";

const zipPath = process.argv[2];
const outputPath = process.argv[3];

process.noAsar = true;
const task = new zipUtil(zipPath);
task.extractAllTo(outputPath, true);
