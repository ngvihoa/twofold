import readline from "node:readline";
import { chatSnapshot, createGame, dispatch, privateView, publicView, ROLE_DEFS } from "./engine.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const item = args.find((value) => value.startsWith(`--${name}=`));
  return item ? item.split("=").slice(1).join("=") : fallback;
};

const privateSeat = option("seat", "A").toUpperCase();
const seed = option("seed", "twofold-01");
const noClear = args.includes("--no-clear");
let state = createGame(seed);
let message = "Nhập help để xem lệnh.";
let shownSeat = privateSeat;

const color = {
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
  amber: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function boardLine(card) {
  const status = card.alive ? "LIVE" : "DEAD";
  const shield = card.shielded ? " SHIELD" : "";
  const vote = card.canVote ? " VOTE" : "";
  return `${card.id.padEnd(3)} ${status.padEnd(4)} ${card.role.padEnd(14)}${shield}${vote}`;
}

function render() {
  if (process.stdout.isTTY && !noClear) console.clear();
  const view = publicView(state);
  const own = privateView(state, shownSeat);
  console.log(`${color.bold}TWOFOLD CHAT PROTOTYPE${color.reset}  ${color.dim}seed=${seed}${color.reset}`);
  console.log(`${color.amber}Vòng ${view.round}${color.reset}  phase=${color.bold}${view.phase}${color.reset}  elimination A=${view.elimination.A} B=${view.elimination.B}`);
  console.log(`\n${color.bold}PUBLIC BOARD A${color.reset}`);
  console.log(view.board.A.map(boardLine).join("\n"));
  console.log(`\n${color.bold}PUBLIC BOARD B${color.reset}`);
  console.log(view.board.B.map(boardLine).join("\n"));
  console.log(`\n${color.bold}PRIVATE ${shownSeat}${color.reset}`);
  console.log(own.hand.map((card) => `${card.id} ${card.role}${card.alive ? "" : " [DEAD]"}${card.revealed ? " [REVEALED]" : ""}`).join(" | "));
  if (own.notes.length) console.log(`${color.blue}Notes: ${own.notes.join(" | ")}${color.reset}`);
  console.log(`\n${color.bold}LOG${color.reset}`);
  console.log(view.log.slice(-6).map((item) => `- ${item}`).join("\n"));
  if (view.result) console.log(`\n${color.red}${color.bold}RESULT: ${view.result.winner || "DRAW"} - ${view.result.reason}${color.reset}`);
  console.log(`\n${color.dim}${message}${color.reset}`);
  console.log(`${color.dim}[help] lệnh  [view A|B] đổi private view  [chat] tóm tắt để gửi  [public] JSON public  [quit] thoát${color.reset}`);
}

function roleKey(value) {
  const normalized = value?.toLowerCase();
  if (ROLE_DEFS[normalized]) return normalized;
  const found = Object.entries(ROLE_DEFS).find(([, role]) => role.name.toLowerCase() === normalized);
  return found?.[0] || normalized;
}

function parseCommand(line) {
  const parts = line.trim().split(/\s+/);
  const command = parts.shift()?.toLowerCase();
  if (!command) return null;
  if (command === "setup") return { type: "setup.submit", seat: parts.shift()?.toUpperCase(), order: parts.map((item) => item.toUpperCase()) };
  if (command === "council") {
    const seat = parts.shift()?.toUpperCase();
    if (parts[0]?.toLowerCase() === "pass") return { type: "council.submit", seat, pass: true };
    if (parts[0]?.toLowerCase() === "protect") {
      parts.shift();
      return { type: "council.submit", seat, kind: "protect", source: parts.shift()?.toUpperCase(), target: parts.shift()?.toUpperCase() };
    }
    const target = parts.shift()?.toUpperCase();
    const guess = roleKey(parts.shift());
    return { type: "council.submit", seat, pass: false, target, guess, voters: parts.map((item) => item.toUpperCase()) };
  }
  if (command === "day") {
    const seat = parts.shift()?.toUpperCase();
    const kind = parts.shift()?.toLowerCase();
    if (kind === "pass") return { type: "day.submit", seat, kind };
    return { type: "day.submit", seat, kind, source: parts.shift()?.toUpperCase(), target: parts.shift()?.toUpperCase() };
  }
  if (command === "defend") {
    const seat = parts.shift()?.toUpperCase();
    const target = parts.shift();
    return target?.toLowerCase() === "pass"
      ? { type: "defense.submit", seat, pass: true }
      : { type: "defense.submit", seat, pass: false, target: target?.toUpperCase() };
  }
  if (command === "night") {
    const seat = parts.shift()?.toUpperCase();
    const kind = parts.shift()?.toLowerCase();
    if (kind === "pass") return { type: "night.submit", seat, kind };
    return { type: "night.submit", seat, kind, source: parts.shift()?.toUpperCase(), target: parts.shift()?.toUpperCase() };
  }
  if (command === "final") return { type: "final.submit", seat: parts.shift()?.toUpperCase(), guess: roleKey(parts.shift()) };
  return { type: command, parts };
}

function helpText() {
  return [
    "setup A A1 A2 A3 A4 A5 A6 A7 A8 A9 A10",
    "council A pass",
    "council A B3 guard A1 A2 A3",
    "council A protect A7 A3",
    "day A pass | day A shoot A9 B3 | day A revive A8 A2 | day A mark A6 B4 | day A purify A5 B4",
    "defend A pass | defend A A4",
    "night A pass | night A attack A5 B4 | night A inspect A7 B4 | night A poison A8 B4",
    "final A guard",
  ].join("  ||  ");
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
render();
rl.prompt();
rl.on("line", (line) => {
  try {
    const action = parseCommand(line);
    if (!action) message = "Không có lệnh.";
    else if (action.type === "quit" || action.type === "q") return rl.close();
    else if (action.type === "help") message = helpText();
    else if (action.type === "view") {
      const seat = action.parts[0]?.toUpperCase();
      if (!['A', 'B'].includes(seat)) throw new Error("Dùng view A hoặc view B.");
      shownSeat = seat;
      message = `Đang xem private hand ${seat}.`;
    } else if (action.type === "public") {
      message = JSON.stringify(publicView(state));
    } else if (action.type === "chat") {
      message = `\n${chatSnapshot(state)}`;
    } else {
      state = dispatch(state, action);
      message = "Action hợp lệ.";
    }
  } catch (error) {
    message = `Lỗi: ${error.message}`;
  }
  render();
  rl.prompt();
});
rl.on("close", () => {
  console.log("Đã thoát prototype. State không được lưu.");
});
