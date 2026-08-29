// packages/cli/src/commands/list.mjs
import { getWorkspaces } from "../utils/workspace.mjs";
import { log, renderTable, colors } from "../utils/logger.mjs";

export async function listCommand() {
  log.title("Twofold Monorepo Workspaces");
  const workspaces = getWorkspaces();

  if (workspaces.length === 0) {
    log.warn("No workspaces found in apps/ or packages/.");
    return;
  }

  const headers = ["Type", "Workspace Name", "Alias (-<short>)", "Location", "Scripts", "Description"];
  const rows = workspaces.map((w) => {
    const typeLabel =
      w.type === "app"
        ? `${colors.blue}app${colors.reset}`
        : `${colors.magenta}package${colors.reset}`;

    const scriptKeys = Object.keys(w.scripts).join(", ") || `${colors.dim}none${colors.reset}`;
    const aliasLabel = `${colors.yellow}-${w.alias}${colors.reset} / ${colors.dim}${w.shortName}${colors.reset}`;

    return [
      typeLabel,
      `${colors.bold}${w.name}${colors.reset}`,
      aliasLabel,
      w.relativePath,
      scriptKeys,
      w.description.length > 35 ? `${w.description.slice(0, 32)}...` : w.description,
    ];
  });

  renderTable(headers, rows);
  console.log(`\n${colors.dim}Total: ${workspaces.length} workspace(s)${colors.reset}`);
  console.log(`Format: ${colors.cyan}pnpm tf <feat> [--filter <name> | -<alias>]${colors.reset}`);
  console.log(`Ví dụ:  ${colors.cyan}pnpm tf dev --filter spec-reviewer${colors.reset} hoặc ${colors.cyan}pnpm tf dev -sr${colors.reset}\n`);
}
