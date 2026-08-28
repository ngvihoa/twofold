import fs from "node:fs";

const dataPath = process.argv[2] || "data/roles.json";
const curlConfigPath = process.argv[3] || "/tmp/wwo-role-art.curl";
const assetDirectory = "assets/game/wwo-reference";
const roles = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const curlConfig = [];
const sourceRows = [];

fs.mkdirSync(assetDirectory, { recursive: true });

for (const role of roles) {
  const sourceImage = role.sourceImage || role.image;
  if (!sourceImage?.startsWith("https://")) continue;
  const match = decodeURIComponent(sourceImage).match(/\.([a-z0-9]+)\/revision/i);
  const extension = match?.[1]?.toLowerCase() || "webp";
  const localPath = `${assetDirectory}/${role.id}.${extension}`;
  const thumbnailUrl = sourceImage.replace("/revision/latest", "/revision/latest/scale-to-width-down/360");
  if (!fs.existsSync(localPath)) curlConfig.push(`url = "${thumbnailUrl.replaceAll('"', '\\"')}"`, `output = "${localPath}"`);
  sourceRows.push(`| ${role.name} | [Wiki page](https://wwo-vietnamese.fandom.com/vi/wiki/${encodeURIComponent(role.pageTitle.replaceAll(" ", "_"))}) | [Original image](${sourceImage}) |`);
  role.sourceImage = sourceImage;
  role.image = localPath;
}

fs.writeFileSync(curlConfigPath, `${curlConfig.join("\n")}\n`);
fs.writeFileSync(dataPath, `${JSON.stringify(roles, null, 2)}\n`);
fs.writeFileSync(`${assetDirectory}/SOURCES.md`, `# WWO role artwork sources\n\nThese 360px reference thumbnails are used in an internal role-selection prototype. Each file links back to its source page and original image on Wiki WWO Vietnamese.\n\n| Role | Source page | Original artwork |\n|---|---|---|\n${sourceRows.join("\n")}\n`);

console.log(`Prepared ${sourceRows.length} artwork downloads in ${curlConfigPath}`);
