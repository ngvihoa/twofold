// packages/cli/src/utils/workspace.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Find monorepo root by locating pnpm-workspace.yaml or root package.json with workspaces
 */
export function getMonorepoRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(path.join(current, "pnpm-workspace.yaml")) ||
      (fs.existsSync(path.join(current, "package.json")) &&
        JSON.parse(fs.readFileSync(path.join(current, "package.json"), "utf8")).workspaces)
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(__dirname, "../../../");
    }
    current = parent;
  }
}

/**
 * Generate short acronym from name (e.g. spec-reviewer -> sr, game-core -> gc, web -> w)
 */
export function getAcronym(name) {
  const parts = name.split(/[-_]/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0];
  }
  return parts.map((part) => part[0]).join("").toLowerCase();
}

/**
 * Scan and return all workspaces in the monorepo
 */
export function getWorkspaces(monorepoRoot = getMonorepoRoot()) {
  const workspaces = [];
  const patterns = ["apps", "packages"];

  for (const group of patterns) {
    const groupDir = path.join(monorepoRoot, group);
    if (!fs.existsSync(groupDir)) continue;

    const entries = fs.readdirSync(groupDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const workspacePath = path.join(groupDir, entry.name);
      const pkgPath = path.join(workspacePath, "package.json");

      let pkg = {};
      if (fs.existsSync(pkgPath)) {
        try {
          pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        } catch {
          pkg = { name: entry.name };
        }
      } else {
        pkg = { name: entry.name };
      }

      const relativePath = path.relative(monorepoRoot, workspacePath);
      const shortName = entry.name;
      const fullName = pkg.name || shortName;
      const type = group === "apps" ? "app" : "package";
      const alias = getAcronym(shortName);

      workspaces.push({
        name: fullName,
        shortName,
        alias,
        type,
        group,
        path: workspacePath,
        relativePath,
        pkg,
        scripts: pkg.scripts || {},
        description: pkg.description || "No description provided",
      });
    }
  }

  return workspaces;
}

/**
 * Find workspace by exact name, directory name, acronym, or prefix
 */
export function findWorkspace(query, workspaces = getWorkspaces()) {
  if (!query) return null;
  let q = query.toLowerCase().trim();

  // Strip leading flags or quotes if passed
  q = q.replace(/^--?/, "").replace(/^@twofold\//, "");

  // 1. Exact match with shortName or fullName
  let match = workspaces.find(
    (w) =>
      w.shortName.toLowerCase() === q ||
      w.name.toLowerCase() === q ||
      w.name.toLowerCase() === `@twofold/${q}` ||
      w.relativePath.toLowerCase() === q
  );
  if (match) return match;

  // 2. Exact acronym match (e.g. sr -> spec-reviewer, gc -> game-core, st -> shared-types)
  match = workspaces.find((w) => w.alias === q);
  if (match) return match;

  // 3. Prefix match (e.g. spec -> spec-reviewer)
  match = workspaces.find((w) => w.shortName.toLowerCase().startsWith(q));
  if (match) return match;

  // 4. Substring match
  match = workspaces.find((w) => w.shortName.toLowerCase().includes(q));
  return match || null;
}
