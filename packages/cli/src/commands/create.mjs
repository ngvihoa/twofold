// packages/cli/src/commands/create.mjs
import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot, getWorkspaces } from "../utils/workspace.mjs";
import { log, colors } from "../utils/logger.mjs";

export async function createCommand(type, rawName, description) {
  if (!type || !["app", "package"].includes(type.toLowerCase())) {
    log.error("Invalid type. Must specify 'app' or 'package'.");
    console.log(`\nUsage: ${colors.cyan}tf create <app|package> <name> [description]${colors.reset}`);
    console.log(`Example: ${colors.cyan}tf create app admin-portal "Internal admin dashboard"${colors.reset}`);
    console.log(`Example: ${colors.cyan}tf create package network "Websocket & sync layer"${colors.reset}\n`);
    return;
  }

  if (!rawName) {
    log.error("Please provide a name for the new project.");
    return;
  }

  const name = rawName
    .toLowerCase()
    .trim()
    .replace(/^@twofold\//, "")
    .replace(/[^a-z0-9-_]/g, "-");

  const category = type.toLowerCase() === "app" ? "apps" : "packages";
  const monorepoRoot = getMonorepoRoot();
  const targetDir = path.join(monorepoRoot, category, name);

  if (fs.existsSync(targetDir)) {
    log.error(`Directory already exists: ${category}/${name}`);
    return;
  }

  const packageName = `@twofold/${name}`;
  const desc = description || `Twofold ${type.toUpperCase()}: ${name}`;

  log.title(`Scaffolding new ${type.toUpperCase()}: [${packageName}]`);

  // 1. Create directories
  fs.mkdirSync(path.join(targetDir, "src"), { recursive: true });

  // 2. Create package.json
  const pkgContent = {
    name: packageName,
    version: "0.1.0",
    private: true,
    description: desc,
    type: "module",
    main: "src/index.js",
    scripts:
      type === "app"
        ? {
            dev: "python3 -m http.server 3000",
            build: "echo 'Build script placeholder'",
            check: "echo 'Check script placeholder'",
          }
        : {
            test: "echo 'Test script placeholder'",
            check: "echo 'Check script placeholder'",
          },
  };

  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(pkgContent, null, 2)}\n`
  );

  // 3. Create src/index.js entrypoint
  const indexContent = `// ${packageName} - ${desc}
export const VERSION = "0.1.0";
export const NAME = "${packageName}";

export function info() {
  return { name: NAME, version: VERSION, description: "${desc}" };
}
`;
  fs.writeFileSync(path.join(targetDir, "src/index.js"), indexContent);

  // 4. Create README.md
  const readmeContent = `# ${packageName}

> ${desc}

## Tổng quan

Dự án thuộc nhóm **${category}** trong Twofold Monorepo.

## Cấu trúc

\`\`\`text
${category}/${name}/
├── src/
│   └── index.js
├── package.json
└── README.md
\`\`\`

## Cách sử dụng

\`\`\`bash
# Chạy dev server hoặc test qua Twofold CLI:
tf run ${name} dev
# hoặc
tf check ${name}
\`\`\`
`;
  fs.writeFileSync(path.join(targetDir, "README.md"), readmeContent);

  log.success(`Successfully created ${colors.bold}${packageName}${colors.reset} at ${colors.cyan}${category}/${name}${colors.reset}`);
  log.info(`Run ${colors.bold}tf list${colors.reset} to view all workspaces.`);
}

