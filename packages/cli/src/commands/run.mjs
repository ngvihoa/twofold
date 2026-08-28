// packages/cli/src/commands/run.mjs
import { spawn } from "node:child_process";
import { getWorkspaces, findWorkspace } from "../utils/workspace.mjs";
import { log, colors } from "../utils/logger.mjs";

export async function runCommand(target, scriptName, extraArgs = []) {
  if (!target || !scriptName) {
    log.error("Please provide both target workspace and script name.");
    console.log(`\nUsage: ${colors.cyan}tf run <target> <script> [...args]${colors.reset}`);
    console.log(`Example: ${colors.cyan}tf run spec-reviewer check${colors.reset}\n`);
    return;
  }

  const workspaces = getWorkspaces();
  const workspace = findWorkspace(target, workspaces);

  if (!workspace) {
    log.error(`Workspace '${target}' not found.`);
    log.info(`Run ${colors.bold}tf list${colors.reset} to see available workspaces.`);
    return;
  }

  const cmd = workspace.scripts[scriptName];
  if (!cmd) {
    log.error(`Script '${scriptName}' not found in [${workspace.name}].`);
    log.info(`Available scripts: ${Object.keys(workspace.scripts).join(", ") || "none"}`);
    return;
  }

  const fullCmd = extraArgs.length ? `${cmd} ${extraArgs.join(" ")}` : cmd;

  log.title(`Running '${scriptName}' in [${workspace.name}]`);
  log.info(`Location: ${workspace.relativePath}`);
  log.info(`Command: ${colors.bold}${fullCmd}${colors.reset}\n`);

  const child = spawn("sh", ["-c", fullCmd], {
    cwd: workspace.path,
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      process.exitCode = code;
    }
  });
}

