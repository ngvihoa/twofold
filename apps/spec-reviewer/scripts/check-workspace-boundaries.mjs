import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const reviewerRoot = path.resolve(path.dirname(scriptPath), "..");
const repoRoot = path.resolve(reviewerRoot, "../..");
const reviewerPackage = JSON.parse(
  fs.readFileSync(path.join(reviewerRoot, "package.json"), "utf8"),
);

const forbiddenPackages = ["@twofold/game-core", "@twofold/shared-types"];
const dependencyGroups = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const declaredDependencies = new Set(
  dependencyGroups.flatMap((group) => Object.keys(reviewerPackage[group] || {})),
);

for (const packageName of forbiddenPackages) {
  if (declaredDependencies.has(packageName)) {
    throw new Error(`spec-reviewer không được phụ thuộc ${packageName}.`);
  }
}

function sourceFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (["dist", "node_modules", ".output"].includes(entry.name)) continue;
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(entryPath));
    else if (/\.(?:[cm]?js|mjs|ts|tsx)$/.test(entry.name)) files.push(entryPath);
  }
  return files;
}

const reviewerViolations = sourceFiles(reviewerRoot)
  .filter((file) => file !== scriptPath)
  .filter((file) => {
    const source = fs.readFileSync(file, "utf8");
    return forbiddenPackages.some((packageName) => source.includes(packageName)) || source.includes("core-adapter.mjs");
  });

const coreRoot = path.join(repoRoot, "packages/game-core/src");
const coreViolations = sourceFiles(coreRoot).filter((file) => {
  const source = fs.readFileSync(file, "utf8");
  return source.includes("apps/spec-reviewer") || source.includes("game-flow-demo");
});

const violations = [...reviewerViolations, ...coreViolations].map((file) => path.relative(repoRoot, file));
if (violations.length) {
  throw new Error(`Phát hiện import vượt ranh giới workspace:\n- ${violations.join("\n- ")}`);
}

console.log("OK: spec-reviewer và runtime core không import source của nhau");
