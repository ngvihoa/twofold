// packages/cli/src/index.mjs
import { parseCliArgs } from "./utils/args.mjs";
import { listCommand } from "./commands/list.mjs";
import { devCommand } from "./commands/dev.mjs";
import { checkCommand } from "./commands/check.mjs";
import { createCommand } from "./commands/create.mjs";
import { runCommand } from "./commands/run.mjs";
import { infoCommand } from "./commands/info.mjs";
import { routesCommand } from "./commands/routes.mjs";
import { envCommand } from "./commands/env.mjs";
import { log, colors } from "./utils/logger.mjs";

export async function runCli(argv = process.argv.slice(2)) {
  const { feature, filter, positional, flags } = parseCliArgs(argv);

  switch (feature) {
    case "list":
    case "ls":
      await listCommand();
      break;

    case "dev":
    case "start":
      await devCommand(filter);
      break;

    case "check":
    case "test":
      await checkCommand(filter);
      break;

    case "routes":
    case "route":
    case "routes:generate":
      await routesCommand(filter);
      break;

    case "create":
    case "new":
      await createCommand(positional[0], positional[1], positional.slice(2).join(" "));
      break;

    case "run":
      await runCommand(filter || positional[0], positional[1] || positional[0], positional.slice(2));
      break;

    case "info":
      await infoCommand();
      break;

    case "env":
      await envCommand(positional, filter, flags);
      break;

    case "help":
    case "--help":
    case "-h":
    case null:
    case undefined:
      printHelp();
      break;

    default:
      log.error(`Lệnh không hợp lệ: '${feature}'`);
      printHelp();
      process.exitCode = 1;
  }
}

function printHelp() {
  console.log(`
${colors.bold}${colors.cyan}Twofold Monorepo CLI (tf / twofold)${colors.reset}
${colors.dim}Cú pháp chuẩn hóa quản trị monorepo Twofold.${colors.reset}

${colors.bold}CÚ PHÁP CHUẨN:${colors.reset}
  ${colors.cyan}pnpm tf <feat> [--filter <project_name> | -<shorten>]${colors.reset}

${colors.bold}DANH SÁCH TÍNH NĂNG (<feat>):${colors.reset}
  ${colors.bold}list, ls${colors.reset}                       Liệt kê tất cả apps & packages và alias rút gọn
  ${colors.bold}dev${colors.reset}                            Chạy dev server cho project chỉ định (hoặc mặc định)
  ${colors.bold}check${colors.reset}                          Chạy kiểm tra dữ liệu/tests toàn monorepo hoặc project
  ${colors.bold}routes [project]${colors.reset}               Generate TanStack Router route tree (mặc định: web)
  ${colors.bold}create <app|package> <name>${colors.reset}   Tự động scaffold app/package mới theo chuẩn
  ${colors.bold}run <script>${colors.reset}                   Chạy một script tùy ý trong project
  ${colors.bold}info${colors.reset}                           Xem thông tin roadmap và trạng thái dự án
  ${colors.bold}env pull${colors.reset}                       Pull environment variables từ Vercel về project (${colors.cyan}-i${colors.reset} để chọn từ menu)
  ${colors.bold}help${colors.reset}                           Hiển thị hướng dẫn này

${colors.bold}CÁC CÁCH CHỈ ĐỊNH PROJECT (Filter / Shorten):${colors.reset}
  ${colors.dim}1. Dùng flag --filter:${colors.reset}      ${colors.cyan}pnpm tf dev --filter spec-reviewer${colors.reset}
  ${colors.dim}2. Dùng flag -F hoặc -f:${colors.reset}   ${colors.cyan}pnpm tf dev -F spec-reviewer${colors.reset}
  ${colors.dim}3. Dùng mã rút gọn -<short>:${colors.reset} ${colors.cyan}pnpm tf dev -sr${colors.reset}   ${colors.dim}(sr: spec-reviewer, gc: game-core, st: shared-types)${colors.reset}
  ${colors.dim}4. Dùng tên trực tiếp:${colors.reset}       ${colors.cyan}pnpm tf dev spec-reviewer${colors.reset}

${colors.bold}VÍ DỤ:${colors.reset}
  ${colors.dim}# Liệt kê danh sách và alias của từng project${colors.reset}
  pnpm tf list

  ${colors.dim}# Chạy dev server của PO Spec Reviewer bằng tên đầy đủ hoặc alias${colors.reset}
  pnpm tf dev --filter spec-reviewer
  pnpm tf dev -sr

  ${colors.dim}# Kiểm tra dữ liệu roles của spec-reviewer hoặc toàn bộ repo${colors.reset}
  pnpm tf check -sr
  pnpm tf check

  ${colors.dim}# Generate type-safe route tree cho web${colors.reset}
  pnpm tf routes
  pnpm tf routes web

  ${colors.dim}# Pull env tương tác: chọn project và environment từ menu${colors.reset}
  pnpm tf env pull -i

  ${colors.dim}# Tạo một app hoặc package mới${colors.reset}
  pnpm tf create app admin-portal "Admin dashboard"
  pnpm tf create package audio-fx "Hiệu ứng âm thanh"
`);
}
