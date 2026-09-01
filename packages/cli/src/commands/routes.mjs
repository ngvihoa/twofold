import { spawn } from "node:child_process";
import { findWorkspace, getWorkspaces } from "../utils/workspace.mjs";
import { colors, log } from "../utils/logger.mjs";

export async function routesCommand(target = "web") {
  const workspace = findWorkspace(target || "web", getWorkspaces());

  if (!workspace) {
    log.error(`Workspace '${target}' not found.`);
    process.exitCode = 1;
    return;
  }

  const command = workspace.scripts["routes:generate"];
  if (!command) {
    log.error(`[${workspace.shortName}] Script 'routes:generate' not found.`);
    process.exitCode = 1;
    return;
  }

  log.title(`Generating TanStack routes for [${workspace.name}]`);
  log.info(`Location: ${workspace.relativePath}`);
  log.info(`Command: ${colors.bold}${command}${colors.reset}\n`);

  await new Promise((resolve) => {
    const child = spawn("pnpm", ["run", "routes:generate"], {
      cwd: workspace.path,
      stdio: "inherit",
      env: { ...process.env },
    });

    child.on("error", (error) => {
      log.error(`Failed to generate routes: ${error.message}`);
      process.exitCode = 1;
      resolve();
    });

    child.on("exit", (code) => {
      if (code !== 0) process.exitCode = code ?? 1;
      resolve();
    });
  });
}
