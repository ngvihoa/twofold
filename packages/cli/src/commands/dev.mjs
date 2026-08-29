// packages/cli/src/commands/dev.mjs
import { spawn } from "node:child_process";
import { getWorkspaces, findWorkspace } from "../utils/workspace.mjs";
import { log, colors } from "../utils/logger.mjs";

export async function devCommand(target) {
  const workspaces = getWorkspaces();
  const devWorkspaces = workspaces.filter((w) => w.scripts.dev || w.scripts.start);

  if (devWorkspaces.length === 0) {
    log.error("No workspaces found with a 'dev' or 'start' script.");
    return;
  }

  let selected = null;
  if (target) {
    selected = findWorkspace(target, workspaces);
    if (!selected) {
      log.error(`Workspace '${target}' not found.`);
      log.info(`Available targets with dev scripts: ${devWorkspaces.map((w) => w.shortName).join(", ")}`);
      return;
    }
  } else {
    // Default to spec-reviewer if available, or first app
    selected =
      devWorkspaces.find((w) => w.shortName === "spec-reviewer") ||
      devWorkspaces.find((w) => w.type === "app") ||
      devWorkspaces[0];
  }

  const scriptName = selected.scripts.dev ? "dev" : "start";
  const scriptCmd = selected.scripts[scriptName];

  log.title(`Starting Dev Server for [${selected.name}]`);
  log.info(`Location: ${selected.relativePath}`);
  log.info(`Command: ${colors.bold}${scriptCmd}${colors.reset}`);
  log.info(`Press Ctrl+C to stop.\n`);

  const child = spawn("pnpm", ["run", scriptName], {
    cwd: selected.path,
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("error", (err) => {
    log.error(`Failed to start dev server: ${err.message}`);
    process.exitCode = 1;
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      log.warn(`Dev server exited with code ${code}`);
      process.exitCode = code;
    }
  });
}
