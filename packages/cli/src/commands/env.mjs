// packages/cli/src/commands/env.mjs
import { spawn } from "node:child_process";
import { getWorkspaces, findWorkspace } from "../utils/workspace.mjs";
import { log, colors } from "../utils/logger.mjs";
import { select } from "../utils/prompt.mjs";

/**
 * Danh sách project hỗ trợ pull env (cấu hình thủ công, KHÔNG tự dò).
 * Khi thêm app mới có pull env, bổ sung target vào đây.
 */
const ENV_PROJECTS = [
  {
    target: "spec-reviewer",
    description: "PO Spec Reviewer · Vercel: twofold-reviewer",
  },
];

const ENV_SCRIPT_PREFIX = "env:pull";

/**
 * pnpm tf env pull [-i] [-<alias> | --filter <name>] [environment]
 *
 * Ví dụ:
 *   pnpm tf env pull -i               # Menu chọn project + environment
 *   pnpm tf env pull -sr              # Pull mặc định của spec-reviewer
 *   pnpm tf env pull -sr production   # Pull environment cụ thể
 */
export async function envCommand(positional = [], filter = null, flags = {}) {
  const sub = positional[0] || "pull";
  if (sub !== "pull") {
    log.error(
      `Lệnh 'env ${sub}' không được hỗ trợ. Hiện chỉ có: ${colors.bold}env pull${colors.reset}`
    );
    process.exitCode = 1;
    return;
  }

  const interactive = Boolean(flags.i || flags.interactive);
  const envName =
    positional
      .slice(1)
      .find((arg) => !arg.startsWith("-") && !arg.startsWith("--"))?.toLowerCase() || null;

  const workspaces = getWorkspaces();
  const projects = ENV_PROJECTS.map((p) => ({
    ...p,
    workspace: findWorkspace(p.target, workspaces),
  })).filter((p) => {
    if (!p.workspace) {
      log.warn(`Project '${p.target}' trong ENV_PROJECTS không tìm thấy trong workspace.`);
    }
    return Boolean(p.workspace);
  });

  if (projects.length === 0) {
    log.error("Không có project pull env nào khả dụng. Kiểm tra lại ENV_PROJECTS trong env.mjs.");
    process.exitCode = 1;
    return;
  }

  // 1. Xác định các project cần pull
  let selected = [];

  if (filter) {
    const ws = findWorkspace(filter, workspaces);
    if (!ws) {
      log.error(`Workspace '${filter}' không tìm thấy.`);
      log.info(`Chạy ${colors.bold}tf list${colors.reset} để xem danh sách workspace.`);
      process.exitCode = 1;
      return;
    }
    selected = [ws];
  } else if (interactive) {
    const options = projects.map((p) => ({
      label: p.workspace.name,
      hint: p.description,
      value: p.workspace,
    }));
    if (projects.length > 1) {
      options.push({
        label: "Tất cả project",
        hint: `${projects.length} project`,
        value: projects.map((p) => p.workspace),
      });
    }

    const choice = await select("Chọn project để pull env:", options);
    if (!choice) {
      log.warn("Đã hủy pull env.");
      return;
    }
    selected = Array.isArray(choice.value) ? choice.value : [choice.value];
  } else {
    log.info("Chưa chỉ định project. Các project hỗ trợ pull env:");
    for (const p of projects) {
      console.log(
        `  - ${colors.bold}${p.workspace.name}${colors.reset} ${colors.dim}(${p.description})${colors.reset}`
      );
    }
    console.log(
      `\nChạy ${colors.cyan}pnpm tf env pull -i${colors.reset} để chọn từ menu, ` +
        `hoặc ${colors.cyan}pnpm tf env pull -${projects[0].workspace.alias}${colors.reset} để pull trực tiếp.`
    );
    return;
  }

  // 2. Pull lần lượt từng project
  for (const ws of selected) {
    const targets = getEnvTargets(ws);
    if (targets.length === 0) {
      log.warn(`[${ws.name}] không có script '${ENV_SCRIPT_PREFIX}*' để pull env.`);
      continue;
    }

    let target = null;
    if (envName) {
      target = targets.find((t) => t.name === envName || t.env === envName);
      if (!target) {
        log.error(
          `Environment '${envName}' không tồn tại trong [${ws.name}]. Có sẵn: ${targets
            .map((t) => t.name)
            .join(", ")}`
        );
        process.exitCode = 1;
        continue;
      }
    } else if (interactive) {
      const choice = await select(`Chọn environment cho [${ws.name}]:`, targets);
      if (!choice) {
        log.warn("Đã hủy pull env.");
        return;
      }
      target = targets.find((t) => t.key === choice.value.key);
    } else {
      target = targets.find((t) => t.name === "default") || targets[0];
    }

    const code = await runPull(ws, target);
    if (code !== 0) {
      process.exitCode = code;
    }
  }
}

/**
 * Sinh danh sách environment target từ scripts env:pull* của workspace.
 */
function getEnvTargets(workspace) {
  return Object.entries(workspace.scripts)
    .filter(
      ([key]) => key === ENV_SCRIPT_PREFIX || key.startsWith(`${ENV_SCRIPT_PREFIX}:`)
    )
    .map(([key, cmd]) => {
      const suffix =
        key === ENV_SCRIPT_PREFIX ? "default" : key.slice(ENV_SCRIPT_PREFIX.length + 1);
      const envMatch = cmd.match(/--environment=([a-z]+)/i);
      const fileMatch = cmd.match(/env\s+pull\s+(\S+)/);
      const label =
        suffix === "default" && envMatch
          ? `Default (${envMatch[1]})`
          : suffix.charAt(0).toUpperCase() + suffix.slice(1);
      return {
        key,
        name: suffix,
        env: (envMatch?.[1] || suffix).toLowerCase(),
        file: fileMatch?.[1] || ".env.local",
        label,
        hint: fileMatch?.[1] || cmd,
        cmd,
        value: { key, cmd },
      };
    });
}

/**
 * Chạy script env pull tương ứng trong thư mục workspace.
 */
function runPull(workspace, target) {
  log.title(`Pull env · ${workspace.name}`);
  log.info(`Location: ${workspace.relativePath}`);
  log.info(`Command: ${colors.bold}${target.cmd}${colors.reset}\n`);

  return new Promise((resolve) => {
    const child = spawn("pnpm", ["run", target.key], {
      cwd: workspace.path,
      stdio: "inherit",
      env: { ...process.env },
    });

    child.on("exit", (code) => {
      if (code === 0) {
        log.success(`Pull env [${workspace.name}] hoàn tất.`);
      }
      resolve(code ?? 1);
    });
    child.on("error", (err) => {
      log.error(`Không chạy được pull env cho [${workspace.name}]: ${err.message}`);
      resolve(1);
    });
  });
}
