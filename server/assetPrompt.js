import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const template = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assetPrompt.json"), "utf-8")
);

export function buildAssetPrompt(name) {
  return [template.nameTemplate.replace("{name}", name), ...template.suffix].join(
    " "
  );
}
