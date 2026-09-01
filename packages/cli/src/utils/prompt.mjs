// packages/cli/src/utils/prompt.mjs
import readline from "node:readline";
import { colors } from "./logger.mjs";

/**
 * Kiểm tra terminal có hỗ trợ interactive prompt không (TTY thật).
 */
export function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/**
 * Menu chọn 1 option bằng phím mũi tên (↑/↓ hoặc k/j) + Enter.
 * @param {string} message Câu hỏi hiển thị
 * @param {Array<{label: string, hint?: string, value: any}>} options
 * @returns {Promise<object|null>} Option được chọn, hoặc null nếu hủy / không có TTY
 */
export async function select(message, options) {
  if (!options || options.length === 0) return null;
  if (!isInteractive()) return selectFallback(message, options);
  return selectKeypress(message, options);
}

function buildLines(message, options, activeIndex) {
  const lines = [];
  lines.push(`${colors.cyan}?${colors.reset} ${colors.bold}${message}${colors.reset}`);
  options.forEach((opt, idx) => {
    const isActive = idx === activeIndex;
    const pointer = isActive ? `${colors.cyan}❯${colors.reset}` : " ";
    const label = isActive
      ? `${colors.bold}${opt.label}${colors.reset}`
      : `${colors.dim}${opt.label}${colors.reset}`;
    const hint = opt.hint ? ` ${colors.dim}(${opt.hint})${colors.reset}` : "";
    lines.push(`${pointer} ${label}${hint}`);
  });
  lines.push(`${colors.dim}↑/↓ để di chuyển · Enter để chọn · Esc/Ctrl+C để hủy${colors.reset}`);
  return lines;
}

function selectKeypress(message, options) {
  return new Promise((resolve) => {
    let active = 0;
    let rendered = 0;

    const render = () => {
      const lines = buildLines(message, options, active);
      if (rendered > 0) {
        // Di chuyển con trỏ lên đầu frame cũ rồi xóa toàn bộ
        process.stdout.write(`\x1b[${rendered}A\x1b[J`);
      }
      process.stdout.write(lines.join("\n") + "\n");
      rendered = lines.length;
    };

    const cleanup = (index) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("keypress", onKey);

      // Thu gọn menu còn 1 dòng xác nhận
      process.stdout.write(`\x1b[${rendered}A\x1b[J`);
      const chosen = index === null ? null : options[index];
      const answer = chosen
        ? `${colors.bold}${chosen.label}${colors.reset}`
        : `${colors.red}đã hủy${colors.reset}`;
      process.stdout.write(
        `${colors.cyan}?${colors.reset} ${colors.bold}${message}${colors.reset} ${colors.dim}→${colors.reset} ${answer}\n`
      );
      resolve(chosen);
    };

    const onKey = (str, key) => {
      if (key && key.ctrl && key.name === "c") return cleanup(null);
      if (!key) return;
      if (key.name === "up" || str === "k") {
        active = (active - 1 + options.length) % options.length;
        render();
      } else if (key.name === "down" || str === "j") {
        active = (active + 1) % options.length;
        render();
      } else if (key.name === "return" || key.name === "enter") {
        cleanup(active);
      } else if (key.name === "escape") {
        cleanup(null);
      }
    };

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("keypress", onKey);
    render();
  });
}

/**
 * Fallback khi stdin/stdout không phải TTY (pipe, CI):
 * in danh sách đánh số và đọc lựa chọn từ dòng nhập.
 */
function selectFallback(message, options) {
  return new Promise((resolve) => {
    console.log(`${colors.cyan}?${colors.reset} ${colors.bold}${message}${colors.reset}`);
    options.forEach((opt, idx) => {
      const hint = opt.hint ? ` ${colors.dim}(${opt.hint})${colors.reset}` : "";
      console.log(`  ${colors.cyan}${idx + 1}.${colors.reset} ${opt.label}${hint}`);
    });

    askQuestion(`${colors.dim}Chọn 1-${options.length} (Enter = 1):${colors.reset} `).then(
      (answer) => {
        const raw = (answer || "").trim();
        if (raw === "") {
          resolve(options[0]);
          return;
        }
        const idx = parseInt(raw, 10);
        if (Number.isNaN(idx) || idx < 1 || idx > options.length) {
          console.error(`${colors.red}✖${colors.reset} Lựa chọn không hợp lệ: '${raw}'`);
          resolve(null);
          return;
        }
        resolve(options[idx - 1]);
      }
    );
  });
}

// Readline interface + hàng đợi dòng dùng chung cho toàn bộ fallback prompt
// trong một phiên CLI. Không dùng rl.question vì khi stdin là pipe, EOF có thể
// đến trước khi câu hỏi tiếp theo được đăng ký (question sẽ không bao giờ resolve).
let sharedRl = null;
const lineQueue = [];
let pendingLineResolve = null;

function getFallbackRl() {
  if (!sharedRl) {
    sharedRl = readline.createInterface({ input: process.stdin, output: process.stdout });
    sharedRl.on("line", (line) => {
      if (pendingLineResolve) {
        const resolve = pendingLineResolve;
        pendingLineResolve = null;
        resolve(line);
      } else {
        lineQueue.push(line);
      }
    });
    sharedRl.on("close", () => {
      if (pendingLineResolve) {
        const resolve = pendingLineResolve;
        pendingLineResolve = null;
        resolve("");
      }
      sharedRl = null;
    });
  }
  return sharedRl;
}

function askQuestion(question) {
  process.stdout.write(question);
  return new Promise((resolve) => {
    if (lineQueue.length > 0) {
      resolve(lineQueue.shift());
      return;
    }
    if (!getFallbackRl()) {
      // stdin đã đóng (EOF) và không còn dòng nào trong hàng đợi
      resolve("");
      return;
    }
    pendingLineResolve = resolve;
  });
}
