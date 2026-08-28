import fs from "node:fs";

const dataPath = process.argv[2] || "data/roles.json";
const roles = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const factionCodes = {
  village: "DL",
  werewolf: "MS",
  "solo-vote": "SB",
  "solo-killer": "SG",
  special: "DB",
};

const counters = new Map();
const manual = {
  "Dân làng": {
    revealAfter: 3,
    daySkill: "Đoán vai trò và treo cổ một lá đối thủ.",
    nightSkill: "Không có.",
  },
  "Tiên tri": {
    revealAfter: 2,
    daySkill: "Không có.",
    nightSkill: "Xem vai trò thật của một lá đối thủ.",
  },
  "Bảo vệ": {
    revealAfter: 2,
    daySkill: "Không có.",
    nightSkill: "Bảo vệ một lá đồng minh và nhận đòn thay một lần.",
  },
  "Phù thuỷ": {
    revealAfter: 1,
    daySkill: "Hồi sinh một lá đã chết.",
    nightSkill: "Đầu độc một lá đối thủ.",
  },
  "Kẻ báo thù": {
    revealAfter: 2,
    daySkill: "Chọn một lá đối thủ làm mục tiêu báo thù.",
    nightSkill: "Không có.",
  },
  "Ma sói thường": {
    revealAfter: 1,
    daySkill: "Không có.",
    nightSkill: "Tấn công một lá đối thủ.",
  },
  "Sói Ác Mộng": {
    revealAfter: 2,
    daySkill: "Không có.",
    nightSkill: "Sau đêm đầu tiên, tối đa 2 lần ru ngủ một lá và vô hiệu kỹ năng đêm của lá đó.",
  },
};

const shorten = (text, max = 138) => {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= max) return value.endsWith(".") ? value : `${value}.`;
  const clipped = value.slice(0, max).replace(/\s+\S*$/, "");
  return `${clipped}.`;
};

const sentences = (text) => text
  .replace(/([.!?])\s+/g, "$1\n")
  .split("\n")
  .map((item) => item.trim())
  .filter(Boolean);

for (const role of roles) {
  const next = (counters.get(role.factionId) || 0) + 1;
  counters.set(role.factionId, next);
  role.code = `${factionCodes[role.factionId]}-${String(next).padStart(3, "0")}`;

  if (["village", "werewolf"].includes(role.factionId)) {
    role.stage = "main";
    role.stageLabel = "Bộ chính";
  } else if (["solo-killer", "special"].includes(role.factionId)) {
    role.stage = "round6";
    role.stageLabel = "Từ vòng 6";
  } else {
    role.stage = "hold";
    role.stageLabel = "Chưa dùng";
  }

  const parts = sentences(role.description);
  const dayParts = parts.filter((part) => /ban ngày|vào ngày|ngày đầu|bỏ phiếu|thảo luận|treo cổ/i.test(part));
  const nightParts = parts.filter((part) => /ban đêm|vào đêm|mỗi đêm|đêm đầu|đêm hôm|đêm kế/i.test(part));
  const fallbackAttack = role.factionId === "werewolf" && /giết|tấn công/i.test(role.description)
    ? "Tấn công một lá đối thủ."
    : "Không có.";

  role.daySkill = dayParts.length ? shorten(dayParts.join(" ")) : "Không có.";
  role.nightSkill = nightParts.length ? shorten(nightParts.join(" ")) : fallbackAttack;
  role.revealAfter = role.mechanics.includes("Tấn công") ? 1 : role.mechanics.some((item) => ["Điều tra", "Bảo hộ", "Kiểm soát", "Đánh lừa"].includes(item)) ? 2 : 3;

  if (manual[role.name]) Object.assign(role, manual[role.name]);

  if (role.name === "Thầy Bói") {
    role.fit = "later";
    role.fitLabel = "Trùng Tiên Tri";
    role.scopeNote = "Tạm bỏ vì chức năng thông tin gần với Tiên Tri.";
  }
  if (role.name === "Bác sĩ") {
    role.fit = "later";
    role.fitLabel = "Trùng Bảo Vệ";
    role.scopeNote = "Tạm bỏ vì chức năng bảo hộ gần với Bảo Vệ.";
  }
}

fs.writeFileSync(dataPath, `${JSON.stringify(roles, null, 2)}\n`);
console.log(`Annotated ${roles.length} roles with codes, stages and day/night gameplay.`);
