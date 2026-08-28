import fs from "node:fs";

const inputPath = process.argv[2] || "/tmp/wwo_roles.json";
const outputPath = process.argv[3] || "data/roles-source.json";
const pageImagePaths = process.argv.slice(4);
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const wikitext = payload.parse.wikitext["*"];

const clean = (value) => value
  .replace(/<!--.*?-->/g, "")
  .replace(/<ref[^>]*>.*?<\/ref>/g, "")
  .replace(/<[^>]+>/g, "")
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
  .replace(/\[\[([^\]]+)\]\]/g, "$1")
  .replace(/'''?/g, "")
  .replace(/[—–]/g, "-")
  .replace(/\s+/g, " ")
  .trim();

const slugify = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/Đ/g, "D")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const factionMap = {
  "Đặc biệt": "special",
  "Phe Dân Làng": "village",
  "Phe Ma sói": "werewolf",
  "Phe Solo bỏ phiếu": "solo-vote",
  "Phe Solo giết người": "solo-killer",
};

const mechanicRules = [
  ["Điều tra", /xem vai trò|xem ai|thông tin|nghi phạm|cùng (chung )?một phe|hào quang|kiểm tra/i],
  ["Bảo hộ", /bảo vệ|bảo kê|khiên|ngăn.*tấn công|lãnh thay|đặt bẫy/i],
  ["Tấn công", /giết|bắn|đầu độc|tấn công|thiêu|phóng hoả|đặt bom|ăn thịt/i],
  ["Kiểm soát", /không thể.*(nói|bỏ phiếu|làm gì|dùng)|giam|im lặng|chặn|ngăn tất cả bỏ phiếu|khóa/i],
  ["Đánh lừa", /giả|ngụy|đổi vị trí|xáo trộn|ẩn.*vai trò|che.*vai trò|lừa|đánh tráo/i],
  ["Biến đổi", /biến đổi|chuyển đổi|cắn|giáo phái|zombie|đồng phạm|thay đổi vai trò/i],
  ["Hồi sinh", /hồi sinh|người chết|gọi hồn|chiêu hồn/i],
  ["Bỏ phiếu", /bỏ phiếu|treo cổ|phiếu bầu/i],
];

const core = new Set(["Dân làng", "Ma sói thường", "Tiên tri", "Bác sĩ", "Bảo vệ", "Phù thuỷ", "Kẻ báo thù", "Thầy Bói"]);
const prototype = new Set(["Thợ săn quái thú", "Mục sư", "Xạ thủ", "Thợ Rèn", "Sói Pháp sư", "Sói Ác Mộng", "Sói Hộ Vệ", "Thợ săn người", "Sát thủ", "Sói Lừa Đảo"]);
const eventOnly = new Set(["Ông già Noel", "Vua bí ngô", "Thỏ phục sinh"]);

const roles = [];
let faction = null;
let current = null;

for (const rawLine of wikitext.split("\n")) {
  const line = rawLine.trim();
  const h3 = faction && line.match(/^===\s*(.*?)\s*===$/);
  if (h3) {
    const linked = h3[1].match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    const external = h3[1].match(/\[https?:\/\/[^\s\]]+\/wiki\/([^#?\s\]]+)[^\s\]]*\s+([^\]]+)\]/);
    const externalTarget = external ? decodeURIComponent(external[1]).replaceAll("_", " ") : null;
    const title = clean(linked?.[2] || linked?.[1] || external?.[2] || h3[1]);
    current = {
      id: slugify(title),
      name: title,
      pageTitle: clean(linked?.[1] || externalTarget || title),
      faction,
      factionId: factionMap[faction],
      description: "",
      aura: "Không rõ",
      wikiGroup: "Không phân loại",
      relation: "",
      image: null,
    };
    roles.push(current);
    continue;
  }

  const h2 = line.match(/^==\s*([^=].*?[^=])\s*==$/);
  if (h2) {
    const heading = clean(h2[1]);
    faction = factionMap[heading] ? heading : null;
    current = null;
    continue;
  }

  if (!current || !line.startsWith("*")) continue;
  const content = clean(line.replace(/^\*\s*/, ""));
  if (/^Hào quang:/i.test(content)) current.aura = clean(content.replace(/^Hào quang:\s*/i, ""));
  else if (/^(Phe|Thuộc nhóm):/i.test(content)) current.wikiGroup = clean(content.replace(/^(Phe|Thuộc nhóm):\s*/i, ""));
  else if (/^(Vai trò cơ bản|Vai trò nâng cao|Là vai|Sau khi chết)/i.test(content)) current.relation = content;
  else if (!current.description && content) current.description = content;
}

for (const role of roles) {
  role.mechanics = mechanicRules.filter(([, pattern]) => pattern.test(role.description)).map(([label]) => label);
  if (!role.mechanics.length) role.mechanics = ["Đặc thù"];

  const socialHeavy = /trò chuyện|nói chuyện|bỏ phiếu|cả làng|tất cả người chơi|người cuối cùng|đồng đội|khán giả/i.test(role.description);
  const complex = /2 khả năng|hai khả năng|biến đổi|chuyển đổi|giáo phái|zombie|xáo trộn|vị trí|ngẫu nhiên|tất cả.*chết/i.test(role.description);
  if (core.has(role.name)) {
    role.fit = "core";
    role.fitLabel = "Đưa vào trước";
  } else if (prototype.has(role.name)) {
    role.fit = "prototype";
    role.fitLabel = "Test sớm";
  } else if (eventOnly.has(role.name)) {
    role.fit = "event";
    role.fitLabel = "Chỉ sự kiện";
  } else if (complex) {
    role.fit = "later";
    role.fitLabel = "Để sau";
  } else if (socialHeavy) {
    role.fit = "adapt";
    role.fitLabel = "Cần chuyển thể";
  } else {
    role.fit = "consider";
    role.fitLabel = "Đáng cân nhắc";
  }
}

if (pageImagePaths.length) {
  const key = (value) => value.normalize("NFC").toLocaleLowerCase("vi").replaceAll("_", " ").replace(/\s+/g, " ").trim();
  const images = new Map();
  const aliases = new Map();
  for (const pageImagePath of pageImagePaths) {
    const query = JSON.parse(fs.readFileSync(pageImagePath, "utf8")).query || {};
    for (const page of Object.values(query.pages || {})) {
      if (page.original?.source) images.set(key(page.title), page.original.source);
    }
    for (const item of [...(query.normalized || []), ...(query.redirects || [])]) {
      aliases.set(key(item.from), key(item.to));
    }
  }
  for (const role of roles) {
    let resolved = key(role.pageTitle);
    for (let step = 0; step < 4 && aliases.has(resolved); step += 1) resolved = aliases.get(resolved);
    role.image = images.get(resolved) || null;
  }
}

fs.mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(roles, null, 2)}\n`);
console.log(`Extracted ${roles.length} roles to ${outputPath}`);
console.log(`${roles.filter((role) => role.image).length} roles have source artwork`);
console.log(roles.reduce((acc, role) => ({ ...acc, [role.faction]: (acc[role.faction] || 0) + 1 }), {}));
