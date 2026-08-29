// packages/cli/src/commands/check.mjs
import { spawnSync } from "node:child_process";
import { getWorkspaces, findWorkspace } from "../utils/workspace.mjs";
import { log, colors } from "../utils/logger.mjs";

export async function checkCommand(target) {
  const workspaces = getWorkspaces();

  if (target) {
    const selected = findWorkspace(target, workspaces);
    if (!selected) {
      log.error(`Workspace '${target}' not found.`);
      return;
    }
    const success = await runCheckForWorkspace(selected);
    if (!success) process.exitCode = 1;
    return;
  }

  log.title("Running Health & Data Checks across Monorepo");
  const checkWorkspaces = workspaces.filter(
    (w) => w.scripts.check || w.scripts["check:roles"] || w.scripts.test
  );

  if (checkWorkspaces.length === 0) {
    log.warn("No workspaces with check/test scripts found.");
    return;
  }

  let passed = 0;
  let failed = 0;

  for (const workspace of checkWorkspaces) {
    const success = await runCheckForWorkspace(workspace);
    if (success) passed++;
    else failed++;
  }

  console.log("");
  if (failed === 0) {
    log.success(`All ${passed} workspace checks passed!`);
  } else {
    log.error(`${failed} workspace check(s) failed out of ${passed + failed}.`);
    process.exitCode = 1;
  }
}

async function runCheckForWorkspace(workspace) {
  const checkKey = workspace.scripts.check
    ? "check"
    : workspace.scripts["check:roles"]
    ? "check:roles"
    : workspace.scripts.test
    ? "test"
    : null;

  if (!checkKey) {
    log.error(`[${workspace.shortName}] No check, check:roles, or test script found.`);
    return false;
  }

  const cmd = workspace.scripts[checkKey];
  log.info(`Checking ${colors.bold}${workspace.name}${colors.reset} (${workspace.relativePath})...`);

  const result = spawnSync("sh", ["-c", cmd], {
    cwd: workspace.path,
    stdio: "inherit",
    env: { ...process.env },
  });

  if (result.status === 0) {
    log.success(`[${workspace.shortName}] OK`);
    return true;
  } else {
    log.error(`[${workspace.shortName}] Failed (exit code: ${result.status})`);
    return false;
  }
}
