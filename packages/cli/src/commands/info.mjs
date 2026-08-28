// packages/cli/src/commands/info.mjs
import { getMonorepoRoot, getWorkspaces } from "../utils/workspace.mjs";
import { log, colors } from "../utils/logger.mjs";

export async function infoCommand() {
  const root = getMonorepoRoot();
  const workspaces = getWorkspaces();
  const apps = workspaces.filter((w) => w.type === "app");
  const pkgs = workspaces.filter((w) => w.type === "package");

  console.log(`
${colors.bold}${colors.cyan}  _______                __      _     _ 
 |__   __|              / _|    | |   | |
    | |_      _____  __| |_ ___ | | __| |
    | \\ \\ /\\ / / _ \\/ _\` | |/ _ \\| |/ _\` |
    | |\\ V  V / (_) | (_| | | (_) | | (_| |
    |_| \\_/\\_/ \\___/ \\__,_|_|\\___/|_|\\__,_|${colors.reset}
  ${colors.dim}Turn-based 1v1 Strategy Card Game — Web Alpha 2026${colors.reset}

${colors.bold}Monorepo Status:${colors.reset}
  • Root Directory: ${colors.dim}${root}${colors.reset}
  • Total Workspaces: ${colors.bold}${workspaces.length}${colors.reset} (${apps.length} apps, ${pkgs.length} packages)
  • Target Milestone: ${colors.yellow}07/09/2026${colors.reset} (Web Alpha Release: ${colors.green}< 30/10/2026${colors.reset})

${colors.bold}Core Apps & Tools:${colors.reset}
  • ${colors.bold}spec-reviewer${colors.reset}: PO Specification & Role Atlas Review Hub
  • ${colors.bold}web${colors.reset}: Twofold Web Alpha Game Client
  • ${colors.bold}game-core${colors.reset}: Ruleset v0.1 & Turn State Machine
  • ${colors.bold}shared-types${colors.reset}: Shared Schema & Type Definitions
  • ${colors.bold}cli${colors.reset}: Centralized Monorepo Management CLI

${colors.bold}Quick Commands:${colors.reset}
  ${colors.cyan}tf list${colors.reset}                     List all workspaces
  ${colors.cyan}tf dev spec-reviewer${colors.reset}        Launch PO Spec Reviewer
  ${colors.cyan}tf check${colors.reset}                    Run monorepo data checks
  ${colors.cyan}tf create <app|package> <name>${colors.reset}  Scaffold new project
`);
}

