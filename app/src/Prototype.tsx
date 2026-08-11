import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  GearIcon,
  LockClosedIcon,
  MinusIcon,
  MoonIcon,
  PersonIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ReloadIcon,
  SpeakerLoudIcon,
  StarIcon,
  SunIcon,
  TimerIcon,
} from "@radix-ui/react-icons";
import { BottomSheet, FlowStack, KeyboardInput, MobileScroll, type FlowControls, type FlowScreen } from "./mobile";

type Player = {
  name: string;
  role: string;
  status: "ready" | "acting" | "done";
};

function createRoomId() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const players: Player[] = [
  { name: "Minh", role: "Ma Sói", status: "done" },
  { name: "An", role: "Tiên Tri", status: "acting" },
  { name: "Vy", role: "Bảo Vệ", status: "ready" },
  { name: "Khoa", role: "Dân Làng", status: "ready" },
  { name: "Hà", role: "Phù Thủy", status: "ready" },
  { name: "Nam", role: "Thợ Săn", status: "ready" },
  { name: "Linh", role: "Ma Sói", status: "ready" },
  { name: "Tú", role: "Dân Làng", status: "ready" },
];

type RoleId = "wolf" | "seer" | "guard" | "witch" | "hunter" | "villager" | "fool" | "elder" | "wolfCub" | "whiteWolf";

type RoleDefinition = {
  id: RoleId;
  name: string;
  note: string;
  faction: "Sói" | "Dân làng";
  hasAbility: boolean;
  ability: string;
  winCondition: string;
  winTip: string;
  artAlt: string;
};

const roleCatalog: RoleDefinition[] = [
  { id: "wolf", name: "Ma Sói", note: "Cùng phe chọn một người để tấn công", faction: "Sói", hasAbility: true, ability: "Mỗi đêm, cùng phe Sói chọn một người để tấn công.", winCondition: "Phe Sói kiểm soát ngôi làng.", winTip: "Nói thật vừa đủ và đừng vội bảo vệ đồng đội khi họ bị nghi ngờ.", artAlt: "Ma Sói đen trong trang phục sơn mài" },
  { id: "seer", name: "Tiên Tri", note: "Soi phe của một người mỗi đêm", faction: "Dân làng", hasAbility: true, ability: "Mỗi đêm, chọn một người để biết họ thuộc phe nào.", winCondition: "Phe Dân làng loại bỏ toàn bộ Sói.", winTip: "Ghi nhớ kết quả soi và chỉ lộ diện khi thông tin đủ sức xoay chuyển biểu quyết.", artAlt: "Tiên Tri cầm quả cầu ánh trăng" },
  { id: "guard", name: "Bảo Vệ", note: "Bảo vệ một người khỏi tấn công", faction: "Dân làng", hasAbility: true, ability: "Mỗi đêm, chọn một người để bảo vệ khỏi một lần tấn công.", winCondition: "Phe Dân làng loại bỏ toàn bộ Sói.", winTip: "Quan sát người đang dẫn dắt tốt và tránh để lựa chọn bảo vệ trở nên dễ đoán.", artAlt: "Bảo Vệ cầm khiên sơn mài đỏ" },
  { id: "witch", name: "Phù Thủy", note: "Có một bình cứu và một bình độc", faction: "Dân làng", hasAbility: true, ability: "Trong ván, bạn có một bình cứu và một bình độc để sử dụng.", winCondition: "Phe Dân làng loại bỏ toàn bộ Sói.", winTip: "Đừng dùng thuốc quá sớm; mỗi bình mạnh nhất khi nó xác nhận được một suy luận.", artAlt: "Phù Thủy cầm hai bình thuốc" },
  { id: "hunter", name: "Thợ Săn", note: "Kéo theo một người khi bị loại", faction: "Dân làng", hasAbility: true, ability: "Khi bị loại, chọn một người khác rời ván cùng bạn.", winCondition: "Phe Dân làng loại bỏ toàn bộ Sói.", winTip: "Theo dõi các mâu thuẫn từ sớm để luôn có mục tiêu đáng tin nếu bị loại.", artAlt: "Thợ Săn cầm nỏ gỗ" },
  { id: "villager", name: "Dân Làng", note: "Không có năng lực đặc biệt", faction: "Dân làng", hasAbility: false, ability: "Không có năng lực riêng. Hãy thảo luận, suy luận và biểu quyết.", winCondition: "Phe Dân làng loại bỏ toàn bộ Sói.", winTip: "Đặt câu hỏi cụ thể, ghi nhớ ai đổi lời và đừng im lặng trong lượt thảo luận.", artAlt: "Dân Làng cầm đèn lồng sơn mài" },
  { id: "fool", name: "Kẻ Ngốc", note: "Kích hoạt hiệu ứng khi bị biểu quyết", faction: "Dân làng", hasAbility: true, ability: "Hiệu ứng đặc biệt được kích hoạt khi bạn bị biểu quyết loại.", winCondition: "Phe Dân làng loại bỏ toàn bộ Sói.", winTip: "Tạo đủ nghi ngờ để gây áp lực, nhưng đừng khiến phe Dân làng mất cả ngày vô ích.", artAlt: "Kẻ Ngốc cầm mặt nạ lễ hội và quạt" },
  { id: "elder", name: "Già Làng", note: "Có khả năng chống chịu đặc biệt", faction: "Dân làng", hasAbility: true, ability: "Bạn có khả năng chống chịu đặc biệt trước một số nguyên nhân bị loại.", winCondition: "Phe Dân làng loại bỏ toàn bộ Sói.", winTip: "Dùng uy tín để giữ cuộc thảo luận có hướng, nhưng đừng tiết lộ khả năng quá sớm.", artAlt: "Già Làng cầm trượng và ấn làng" },
  { id: "wolfCub", name: "Sói Con", note: "Kích hoạt trả thù khi bị loại", faction: "Sói", hasAbility: true, ability: "Khi bị loại, bạn kích hoạt lượt trả thù cho phe Sói.", winCondition: "Phe Sói kiểm soát ngôi làng.", winTip: "Khi cần, hãy nhận rủi ro thay đồng đội để mở ra lượt trả thù có lợi.", artAlt: "Sói Con trong áo chàm và dây đỏ" },
  { id: "whiteWolf", name: "Sói Trắng", note: "Có mục tiêu và điều kiện thắng riêng", faction: "Sói", hasAbility: true, ability: "Bạn có mục tiêu riêng và có thể quay lưng với phe Sói.", winCondition: "Hoàn thành điều kiện thắng riêng của Sói Trắng.", winTip: "Giữ cân bằng hai phe cho đến khi bạn có thể kiểm soát đoạn cuối của ván.", artAlt: "Sói Trắng trong lễ phục đen vàng" },
];

const roleArtSlug: Record<RoleId, string> = {
  wolf: "ma-soi",
  seer: "tien-tri",
  guard: "bao-ve",
  witch: "phu-thuy",
  hunter: "tho-san",
  villager: "dan-lang",
  fool: "ke-ngoc",
  elder: "gia-lang",
  wolfCub: "soi-con",
  whiteWolf: "soi-trang",
};

function getRole(id: RoleId) {
  return roleCatalog.find((role) => role.id === id) ?? roleCatalog[0];
}

function roleLayerPaths(id: RoleId, thumbnail = false) {
  const slug = roleArtSlug[id];
  const suffix = thumbnail ? "-thumb" : "";
  const isSeer = id === "seer";

  return {
    background: `/assets/cards/layers/shared/00-background-lacquer${suffix}-v1.png`,
    ornaments: `/assets/cards/layers/shared/10-ornaments-halo${suffix}-v1.png`,
    environment: isSeer ? `/assets/cards/layers/roles/tien-tri/20-environment${suffix}-v2.png` : null,
    subject: `/assets/cards/layers/roles/${slug}/30-subject${suffix}-v1.png`,
    focus: isSeer ? `/assets/cards/layers/roles/tien-tri/40-focus-orb${suffix}-v1.png` : null,
    foreground: isSeer ? `/assets/cards/layers/roles/tien-tri/50-foreground-foil${suffix}-v1.png` : null,
    frame: `/assets/cards/layers/shared/60-frame-overlay${suffix}-v2.png`,
  };
}

function StaticRoleArtwork({ roleId, className }: { roleId: RoleId; className: string }) {
  const layers = roleLayerPaths(roleId, true);

  return (
    <span className={className} aria-hidden="true">
      <img src={layers.background} alt="" loading="lazy" />
      <img src={layers.ornaments} alt="" loading="lazy" />
      {layers.environment ? <img src={layers.environment} alt="" loading="lazy" /> : null}
      <img src={layers.subject} alt="" loading="lazy" />
      {layers.focus ? <img src={layers.focus} alt="" loading="lazy" /> : null}
      {layers.foreground ? <img src={layers.foreground} alt="" loading="lazy" /> : null}
      <img className="static-card-frame" src={layers.frame} alt="" loading="lazy" />
    </span>
  );
}

function CardFrameLayer() {
  return <img className="card-frame-layer" src="/assets/cards/layers/shared/60-frame-overlay-v2.png" alt="" aria-hidden="true" />;
}

function emptyDeck(): Record<RoleId, number> {
  return { wolf: 0, seer: 0, guard: 0, witch: 0, hunter: 0, villager: 0, fool: 0, elder: 0, wolfCub: 0, whiteWolf: 0 };
}

function classicDeck(playerCount: number): Record<RoleId, number> {
  const deck = emptyDeck();
  deck.wolf = playerCount >= 10 ? 3 : 2;
  deck.seer = 1;
  deck.guard = 1;
  if (playerCount >= 8) {
    deck.witch = 1;
    deck.hunter = 1;
  }
  if (playerCount >= 10) deck.fool = 1;
  deck.villager = Math.max(0, playerCount - Object.values(deck).reduce((sum, value) => sum + value, 0));
  return deck;
}

function specialDeck(playerCount: number): Record<RoleId, number> {
  const deck = emptyDeck();
  const order: RoleId[] = ["wolf", "wolf", "seer", "guard", "witch", "hunter", "fool", "elder", "wolfCub", "whiteWolf", "seer", "guard", "witch", "hunter", "wolf"];
  order.slice(0, playerCount).forEach((id) => { deck[id] += 1; });
  return deck;
}

function RoleThumbnail({ role, onOpen }: { role: RoleDefinition; onOpen: () => void }) {
  return (
    <button className="role-picker-card" data-role={role.id} type="button" aria-label={`Xem lá ${role.name}`} onClick={onOpen}>
      <StaticRoleArtwork roleId={role.id} className="role-picker-card-art" />
      <span className="role-picker-card-shade" />
    </button>
  );
}

function RoleReferencePanel({ roleId }: { roleId: RoleId }) {
  const role = getRole(roleId);

  return (
    <div className="role-reference-panel">
      <StaticRoleArtwork roleId={roleId} className="role-reference-art" />
      <div className="role-reference-copy">
        <span>Phe {role.faction}</span>
        <strong>{role.name.toUpperCase()}</strong>
        <p>{role.ability}</p>
        <small><StarIcon /> {role.winCondition}</small>
      </div>
    </div>
  );
}

function BackButton({ flow, label = "Quay lại" }: { flow: FlowControls; label?: string }) {
  return (
    <button className="icon-button" type="button" aria-label={label} onClick={() => flow.pop()}>
      <ArrowLeftIcon width="20" height="20" />
    </button>
  );
}

function AppHeader({ flow, eyebrow, title, action }: { flow: FlowControls; eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="app-header">
      <BackButton flow={flow} />
      <div className="app-header-copy">
        {eyebrow ? <span>{eyebrow}</span> : null}
        <strong>{title}</strong>
      </div>
      <div className="app-header-action">{action}</div>
    </div>
  );
}

function restartGameInRoom(flow: FlowControls) {
  const lobbyIndex = flow.stack.map((entry) => entry.id).lastIndexOf("host-lobby");

  if (lobbyIndex < 0) {
    flow.replace(makeHostLobbyScreen(createRoomId()));
    return;
  }

  const screensToClose = flow.stack.length - lobbyIndex - 1;
  for (let index = 0; index < screensToClose; index += 1) flow.pop();
}

function RestartGameAction({ flow }: { flow: FlowControls }) {
  const [open, setOpen] = useState(false);

  const confirmRestart = () => {
    setOpen(false);
    restartGameInRoom(flow);
  };

  return (
    <>
      <button className="icon-button" type="button" aria-label="Chơi lại ván" onClick={() => setOpen(true)}>
        <ReloadIcon width="19" height="19" />
      </button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Chơi lại ván?"
        description="Người chơi vẫn ở lại phòng hiện tại."
        snap={0.46}
      >
        <div className="restart-confirmation">
          <div className="restart-warning">
            <span><ReloadIcon width="22" height="22" /></span>
            <p><strong>Bắt đầu lại từ đầu</strong><small>Mọi lượt đêm, dấu vết và kết quả biểu quyết hiện tại sẽ bị xóa.</small></p>
          </div>
          <div className="restart-actions">
            <button className="restart-danger" type="button" onClick={confirmRestart}><ReloadIcon /> Chơi lại ván</button>
            <button className="restart-cancel" type="button" onClick={() => setOpen(false)}>Tiếp tục ván hiện tại</button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

function HomeScreen({ flow }: { flow: FlowControls }) {
  return (
    <MobileScroll className="app-screen home-screen">
      <main className="home-content" data-testid="home-screen">
        <div className="brand-mark" aria-hidden="true"><MoonIcon width="24" height="24" /></div>
        <div className="home-spacer" />
        <section className="home-intro">
          <p className="eyebrow">TRÒ CHƠI SUY LUẬN TẠI BÀN</p>
          <h1>DẠ LANG</h1>
          <p className="home-tagline">Không cần mang bài.<br />Chỉ cần đừng tin ai.</p>
        </section>
        <div className="home-actions">
          <button className="primary-button" type="button" onClick={() => flow.push(createRoomScreen)}>
            Tạo phòng <ChevronRightIcon />
          </button>
          <button className="secondary-button" type="button" onClick={() => flow.push(joinRoomScreen)}>
            Vào bằng mã phòng
          </button>
          <p className="privacy-note"><LockClosedIcon /> Không cần tài khoản · Tối đa 15 người</p>
        </div>
      </main>
    </MobileScroll>
  );
}

function CreateRoom({ flow }: { flow: FlowControls }) {
  const [mode, setMode] = useState<"classic" | "special">("classic");
  const [count, setCount] = useState(8);
  const [roleCounts, setRoleCounts] = useState<Record<RoleId, number>>(() => classicDeck(8));
  const [previewRoleId, setPreviewRoleId] = useState<RoleId | null>(null);
  const selectedCount = Object.values(roleCounts).reduce((sum, value) => sum + value, 0);
  const villagerCount = roleCounts.villager;
  const abilityCount = selectedCount - villagerCount;
  const wolfCount = roleCounts.wolf + roleCounts.wolfCub + roleCounts.whiteWolf;
  const deckIsReady = selectedCount === count && wolfCount > 0;

  const applyPlayerCount = (nextCount: number) => {
    setCount(nextCount);
    setRoleCounts(mode === "classic" ? classicDeck(nextCount) : specialDeck(nextCount));
  };

  const applyMode = (nextMode: "classic" | "special") => {
    setMode(nextMode);
    setRoleCounts(nextMode === "classic" ? classicDeck(count) : specialDeck(count));
  };

  const updateRole = (id: RoleId, delta: number) => {
    setRoleCounts((current) => ({ ...current, [id]: Math.max(0, Math.min(count, current[id] + delta)) }));
  };

  return (
    <MobileScroll className="app-screen utility-screen">
      <main className="screen-shell setup-screen" data-testid="create-room-screen">
        <section className="page-intro">
          <p className="eyebrow">THIẾT LẬP VÁN</p>
          <h2>Chọn một đêm<br />đáng nhớ.</h2>
          <p>Chọn số người và đủ từng lá bài trước khi tạo phòng.</p>
        </section>

        <section className="setup-section">
          <div className="section-heading"><span>Số người chơi</span><strong>{count}</strong></div>
          <div className="stepper">
            <button type="button" aria-label="Giảm số người" onClick={() => applyPlayerCount(Math.max(6, count - 1))}><MinusIcon /></button>
            <div><PersonIcon /><span>{count} người</span></div>
            <button type="button" aria-label="Tăng số người" onClick={() => applyPlayerCount(Math.min(15, count + 1))}><PlusIcon /></button>
          </div>
        </section>

        <section className="setup-section">
          <div className="section-heading"><span>Kiểu ván</span><small>Có thể đổi sau</small></div>
          <div className="mode-list">
            <button className={mode === "classic" ? "mode-row selected" : "mode-row"} type="button" aria-pressed={mode === "classic"} onClick={() => applyMode("classic")}>
              <span className="mode-icon"><MoonIcon /></span>
              <span><strong>Cổ điển</strong><small>Có Dân làng · Dễ nhập cuộc</small></span>
              <span className="radio-mark">{mode === "classic" ? <CheckIcon /> : null}</span>
            </button>
            <button className={mode === "special" ? "mode-row selected" : "mode-row"} type="button" aria-pressed={mode === "special"} onClick={() => applyMode("special")}>
              <span className="mode-icon"><StarIcon /></span>
              <span><strong>Toàn vai đặc biệt</strong><small>Nhiều năng lực · Khó đoán hơn</small></span>
              <span className="radio-mark">{mode === "special" ? <CheckIcon /> : null}</span>
            </button>
          </div>
        </section>

        <section className="setup-section deck-builder-section">
          <div className="section-heading"><span>Chọn bộ bài</span><strong>{selectedCount}/{count} lá</strong></div>

          <div className="deck-counter" data-ready={deckIsReady ? "true" : "false"}>
            <div><span>Tổng bài</span><strong>{selectedCount}<small>/{count}</small></strong></div>
            <div><span>Có năng lực</span><strong>{abilityCount}</strong></div>
            <div><span>Dân làng</span><strong>{villagerCount}</strong></div>
          </div>

          <div className="deck-balance-line">
            <span><MoonIcon /> Phe Sói <strong>{wolfCount}</strong></span>
            <span><PersonIcon /> Phe Dân <strong>{selectedCount - wolfCount}</strong></span>
          </div>

          <div className="role-picker-list">
            {roleCatalog.map((role) => (
              <div className="role-picker-row" key={role.id} data-selected={roleCounts[role.id] > 0 ? "true" : "false"}>
                <RoleThumbnail role={role} onOpen={() => setPreviewRoleId(role.id)} />
                <span className="role-picker-copy">
                  <strong>{role.name}</strong>
                  <small>{role.note}</small>
                  <em>{role.hasAbility ? "Có năng lực" : "Không năng lực"} · Phe {role.faction}</em>
                </span>
                <span className="role-count-control">
                  <button type="button" aria-label={`Bớt ${role.name}`} disabled={roleCounts[role.id] === 0} onClick={() => updateRole(role.id, -1)}><MinusIcon /></button>
                  <b>{roleCounts[role.id]}</b>
                  <button type="button" aria-label={`Thêm ${role.name}`} onClick={() => updateRole(role.id, 1)}><PlusIcon /></button>
                </span>
              </div>
            ))}
          </div>

          <div className={deckIsReady ? "deck-validation ready" : "deck-validation"}>
            {selectedCount < count ? <><PlusIcon /><span><strong>Còn thiếu {count - selectedCount} lá</strong><small>Thêm role để đủ cho {count} người.</small></span></> : null}
            {selectedCount > count ? <><MinusIcon /><span><strong>Đang dư {selectedCount - count} lá</strong><small>Bớt role trước khi tạo phòng.</small></span></> : null}
            {selectedCount === count && wolfCount === 0 ? <><MoonIcon /><span><strong>Cần ít nhất một Sói</strong><small>Thêm role thuộc phe Sói để ván có thể bắt đầu.</small></span></> : null}
            {deckIsReady ? <><CheckIcon /><span><strong>Bộ bài đã sẵn sàng</strong><small>{abilityCount} vai có năng lực · {villagerCount} Dân làng không năng lực.</small></span></> : null}
          </div>
        </section>

        <button className="primary-button sticky-cta" disabled={!deckIsReady} type="button" onClick={() => flow.push(makeHostLobbyScreen(createRoomId()))}>
          Tạo phòng với {selectedCount} lá <ChevronRightIcon />
        </button>

        <BottomSheet
          open={previewRoleId !== null}
          onOpenChange={(open) => { if (!open) setPreviewRoleId(null); }}
          title={previewRoleId ? getRole(previewRoleId).name : "Xem lá bài"}
          description="Artwork, năng lực và điều kiện thắng của role."
        >
          {previewRoleId ? <RoleReferencePanel roleId={previewRoleId} /> : null}
        </BottomSheet>
      </main>
    </MobileScroll>
  );
}

function JoinRoom({ flow }: { flow: FlowControls }) {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const canJoin = roomId.length === 4 && playerName.trim().length > 0;

  return (
    <MobileScroll className="app-screen utility-screen">
      <main className="screen-shell join-screen" data-testid="join-room-screen">
        <section className="page-intro compact">
          <div className="ornament-seal"><MoonIcon /></div>
          <p className="eyebrow">GIA NHẬP NGÔI LÀNG</p>
          <h2>Đêm nay,<br />bạn là ai?</h2>
          <p>Nhập mã được hiển thị trên máy của quản trò.</p>
        </section>
        <div className="form-stack">
          <label className="mobile-field" htmlFor="room-id">
            <span className="field-label">ID phòng</span>
            <KeyboardInput
              id="room-id"
              data-testid="room-code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder="VD: 4827"
              value={roomId}
              onChange={(event) => setRoomId(event.currentTarget.value.replace(/\D/g, "").slice(0, 4))}
            />
          </label>
          <label className="mobile-field" htmlFor="player-name">
            <span className="field-label">Tên của bạn</span>
            <KeyboardInput
              id="player-name"
              data-testid="player-name-input"
              autoComplete="name"
              placeholder="Tên mọi người thường gọi"
              value={playerName}
              onChange={(event) => setPlayerName(event.currentTarget.value)}
            />
          </label>
        </div>
        <button className="primary-button" disabled={!canJoin} type="button" onClick={() => flow.push(roleRevealScreen)}>
          Vào phòng <ChevronRightIcon />
        </button>
        <p className="privacy-note"><LockClosedIcon /> Vai của bạn chỉ hiện trên máy này</p>
      </main>
    </MobileScroll>
  );
}

function RoomIdBadge({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="room-id-badge"
      type="button"
      aria-label={`ID phòng ${roomId}. Nhấn để sao chép`}
      title={copied ? "Đã sao chép" : "Sao chép ID phòng"}
      onClick={() => setCopied(true)}
    >
      <span>{copied ? "ĐÃ CHÉP" : "ID PHÒNG"}</span>
      <strong>{roomId}</strong>
    </button>
  );
}

function Lobby({ flow }: { flow: FlowControls }) {
  const lobbyNames = ["Minh", "An", "Vy", "Khoa", "Hà", "Nam", "Linh", "Tú"];

  return (
    <MobileScroll className="app-screen utility-screen host-screen">
      <main className="screen-shell lobby-screen" data-testid="host-lobby-screen">
        <section className="player-list-section">
          <div className="section-heading"><span>Đã vào phòng</span><strong>{lobbyNames.length}/8</strong></div>
          <div className="player-list">
            {lobbyNames.map((name) => (
              <div className="player-row" key={name}>
                <span className="avatar">{name.charAt(0)}</span>
                <strong>{name}</strong>
              </div>
            ))}
          </div>
        </section>

        <button className="primary-button sticky-cta" type="button" onClick={() => flow.push(hostCockpitScreen)}>
          Chia vai và bắt đầu <ChevronRightIcon />
        </button>
      </main>
    </MobileScroll>
  );
}

function RoleSymbol({ roleId }: { roleId: RoleId }) {
  if (roleId === "seer") return <EyeOpenIcon />;
  if (roleId === "guard") return <LockClosedIcon />;
  if (roleId === "villager") return <PersonIcon />;
  if (roleId === "wolf" || roleId === "wolfCub" || roleId === "whiteWolf") return <MoonIcon />;
  return <StarIcon />;
}

function LayeredRoleArt({ roleId }: { roleId: RoleId }) {
  const reduceMotion = useReducedMotion();
  const role = getRole(roleId);
  const layers = roleLayerPaths(roleId);

  return (
    <div className="role-art-stack" role="img" aria-label={role.artAlt}>
      <img className="role-art-layer" src={layers.background} alt="" />
      <motion.img
        className="role-art-layer"
        src={layers.ornaments}
        alt=""
        animate={reduceMotion ? undefined : { opacity: [0.86, 1, 0.86], scale: [1, 1.012, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {layers.environment ? (
        <motion.img
          className="role-art-layer"
          src={layers.environment}
          alt=""
          animate={reduceMotion ? undefined : { x: [0, 2, 0], y: [0, -4, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <motion.img
        className="role-art-layer"
        src={layers.subject}
        alt=""
        animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {layers.focus ? (
        <motion.img
          className="role-art-layer role-art-focus"
          src={layers.focus}
          alt=""
          animate={reduceMotion ? undefined : { scale: [1, 1.035, 1], y: [0, -3, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      {layers.foreground ? (
        <motion.img
          className="role-art-layer"
          src={layers.foreground}
          alt=""
          animate={reduceMotion ? undefined : { opacity: [0.42, 0.86, 0.42], y: [2, -2, 2] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}

function RoleReveal({ roleId = "seer" }: { roleId?: RoleId }) {
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const role = getRole(roleId);

  const turnCard = () => {
    if (spinning) return;

    setSpinning(true);
    setRevealed((current) => !current);
    setRotation((current) => current + 180);
  };

  return (
    <MobileScroll className={revealed ? "app-screen role-screen revealed" : "app-screen role-screen concealed"}>
      <main className="role-shell" data-testid="role-reveal-screen" aria-busy={spinning}>
        <div className="role-flip-stage">
          <motion.div
            className="role-flip-card"
            data-spinning={spinning ? "true" : "false"}
            animate={{ rotateY: rotation }}
            transition={reduceMotion
              ? { duration: 0.18, ease: "easeOut" }
              : { duration: 0.72, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={() => setSpinning(false)}
          >
            <button
              className="role-face card-back"
              type="button"
              onClick={turnCard}
              tabIndex={!revealed && !spinning ? 0 : -1}
              aria-hidden={revealed}
              aria-label="Chạm để xem vai"
            >
              <CardFrameLayer />
            </button>

            <button
              className="role-face role-card"
              data-testid="revealed-role-card"
              type="button"
              onClick={turnCard}
              tabIndex={revealed && !spinning ? 0 : -1}
              aria-hidden={!revealed}
              aria-label="Úp lá bài"
            >
              <div className="role-meta"><span>Dạ Lang</span><b>Ván 1</b></div>
              <LayeredRoleArt roleId={roleId} />
              <section className="role-copy">
                <h2>{role.name.toUpperCase()}</h2>
                <div className="faction"><RoleSymbol roleId={roleId} /> PHE {role.faction.toUpperCase()}</div>
                <div className="role-facts">
                  <div><RoleSymbol roleId={roleId} /><span><b>{role.hasAbility ? "NĂNG LỰC" : "VAI TRÒ"}</b><p>{role.ability}</p></span></div>
                  <div><StarIcon /><span><b>ĐIỀU KIỆN THẮNG</b><p>{role.winCondition}</p></span></div>
                  <div><EyeOpenIcon /><span><b>MẸO CHIẾN THẮNG</b><p>{role.winTip}</p></span></div>
                </div>
              </section>
              <CardFrameLayer />
            </button>
          </motion.div>
        </div>
      </main>
    </MobileScroll>
  );
}

function PlayerWaiting({ flow }: { flow: FlowControls }) {
  const [showRole, setShowRole] = useState(false);
  return (
    <MobileScroll className="app-screen utility-screen waiting-screen">
      <main className="screen-shell waiting-shell" data-testid="player-waiting-screen">
        <div className="night-orbit"><MoonIcon width="48" height="48" /></div>
        <p className="eyebrow">ĐÊM THỨ NHẤT</p>
        <h2>Ngôi làng<br />đã ngủ.</h2>
        <p>Úp điện thoại xuống và lắng nghe quản trò. App sẽ báo khi đến lượt bạn.</p>
        <div className="phase-status"><span className="pulse-dot" /><span><small>Đang diễn ra</small><strong>Ma Sói đang thức dậy</strong></span></div>
        <button className="secondary-button" type="button" onClick={() => setShowRole(true)}><EyeOpenIcon /> Xem lại vai</button>
        <BottomSheet open={showRole} onOpenChange={setShowRole} title="Vai của bạn" description="Chỉ mở khi không ai đang nhìn.">
          <RoleReferencePanel roleId="seer" />
        </BottomSheet>
        <button className="day-demo-button" type="button" onClick={() => flow.push(playerDayScreen)}><SunIcon /> Mô phỏng bình minh</button>
        <button className="text-button" type="button" onClick={() => flow.pop()}>Quay lại lá bài</button>
      </main>
    </MobileScroll>
  );
}

function PlayerDay({ flow }: { flow: FlowControls }) {
  return (
    <MobileScroll className="app-screen utility-screen player-day-screen">
      <main className="screen-shell player-day-shell" data-testid="player-day-screen">
        <div className="dawn-symbol"><SunIcon width="46" height="46" /></div>
        <p className="eyebrow">BÌNH MINH · NGÀY 01</p>
        <h2>Không ai rời làng<br />đêm qua.</h2>
        <p>Hãy thảo luận cùng mọi người. Giữ kín vai trò cho đến khi quản trò mở biểu quyết.</p>

        <section className="player-private-note">
          <span>GHI NHỚ RIÊNG</span>
          <div><EyeOpenIcon /><p>Đêm qua bạn đã soi <strong>Minh</strong> — người này thuộc <strong>phe Ma Sói</strong>.</p></div>
        </section>

        <div className="discussion-status"><TimerIcon /><span><small>Đang thảo luận</small><strong>04:36 còn lại</strong></span></div>
        <button className="secondary-button" type="button" onClick={() => flow.pop()}><MoonIcon /> Trở lại trạng thái đêm</button>
      </main>
    </MobileScroll>
  );
}

function HostCockpit({ flow, night = 1 }: { flow: FlowControls; night?: number }) {
  const [targetOpen, setTargetOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const faction = selected === "Minh" || selected === "Linh" ? "Ma Sói" : "Dân làng";

  return (
    <MobileScroll className="app-screen utility-screen host-screen cockpit-screen">
      <main className="screen-shell cockpit-shell" data-testid="host-cockpit-screen">
        <section className="phase-hero">
          <div className="phase-topline"><span><MoonIcon /> ĐÊM {String(night).padStart(2, "0")}</span><button type="button"><TimerIcon /> 00:42</button></div>
          <p>Đang gọi lượt</p>
          <h2>Tiên Tri,<br />hãy thức dậy.</h2>
          <div className="phase-progress" aria-label="Tiến độ đêm"><i className="complete" /><i className="active" /><i /><i /><i /></div>
        </section>

        <section className="current-action">
          <div className="action-icon"><EyeOpenIcon /></div>
          <div><span>NĂNG LỰC</span><strong>Soi một người chơi</strong><p>Cho Tiên Tri biết người được chọn thuộc phe nào.</p></div>
        </section>

        <button className={selected ? "target-button selected" : "target-button"} type="button" onClick={() => setTargetOpen(true)}>
          <span className="avatar">{selected ? selected.charAt(0) : "?"}</span>
          <span><small>Mục tiêu</small><strong>{selected ?? "Chọn một người"}</strong></span>
          <ChevronRightIcon />
        </button>

        {resolved ? <div className="result-banner"><CheckIcon /><span><small>Kết quả đã ghi</small><strong>{selected} thuộc phe {faction}</strong></span><button type="button" onClick={() => setResolved(false)}>Hoàn tác</button></div> : null}

        <section className="host-player-grid-section">
          <div className="section-heading"><span>Sơ đồ người chơi</span><button type="button"><GearIcon /> Quản lý</button></div>
          <div className="player-grid">
            {players.map((player) => (
              <button type="button" key={player.name} className={player.name === selected ? "player-tile selected" : "player-tile"} onClick={() => setSelected(player.name)}>
                <span className="avatar">{player.name.charAt(0)}</span>
                <span><strong>{player.name}</strong><small>{player.role}</small></span>
                <i data-status={player.status} />
              </button>
            ))}
          </div>
        </section>

        <button className="primary-button sticky-cta" disabled={!selected} type="button" onClick={() => resolved ? flow.push(nightSummaryScreen) : setResolved(true)}>
          {resolved ? "Hoàn tất các lượt đêm" : "Xác nhận kết quả"} <ChevronRightIcon />
        </button>

        <BottomSheet open={targetOpen} onOpenChange={setTargetOpen} title="Tiên Tri muốn soi ai?" description="Chọn một người còn sống trong làng.">
          <div className="sheet-player-list">
            {players.filter((player) => player.role !== "Tiên Tri").map((player) => (
              <button type="button" key={player.name} onClick={() => { setSelected(player.name); setTargetOpen(false); }}>
                <span className="avatar">{player.name.charAt(0)}</span><strong>{player.name}</strong>{selected === player.name ? <CheckIcon /> : null}
              </button>
            ))}
          </div>
        </BottomSheet>
      </main>
    </MobileScroll>
  );
}

const nightActions = [
  { role: "Ma Sói", note: "Đã chọn Khoa", state: "done" },
  { role: "Tiên Tri", note: "Đã soi Minh", state: "done" },
  { role: "Bảo Vệ", note: "Đã bảo vệ Khoa", state: "done" },
  { role: "Phù Thủy", note: "Không dùng bình thuốc", state: "skipped" },
] as const;

function NightSummary({ flow }: { flow: FlowControls }) {
  return (
    <MobileScroll className="app-screen utility-screen host-screen summary-screen">
      <main className="screen-shell summary-shell" data-testid="night-summary-screen">
        <section className="summary-intro">
          <span className="summary-seal"><CheckIcon width="25" height="25" /></span>
          <p className="eyebrow">ĐÊM 01 HOÀN TẤT</p>
          <h2>Mọi dấu vết<br />đã được ghi.</h2>
          <p>Kiểm tra nhanh trước khi đánh thức ngôi làng.</p>
        </section>

        <section className="night-ledger">
          <div className="section-heading"><span>Nhật ký quản trò</span><small>4 lượt</small></div>
          {nightActions.map((action, index) => (
            <div className="ledger-row" key={action.role} data-state={action.state}>
              <span>{index + 1}</span>
              <div><strong>{action.role}</strong><small>{action.note}</small></div>
              <CheckIcon />
            </div>
          ))}
        </section>

        <section className="night-outcome">
          <span>KẾT QUẢ DỰ KIẾN</span>
          <div><MoonIcon /><p><strong>Không ai chết đêm nay</strong><small>Khoa được Bảo Vệ che chở khỏi Ma Sói.</small></p></div>
          <button type="button">Chỉnh kết quả thủ công</button>
        </section>

        <p className="host-hint"><SpeakerLoudIcon /> Kết quả chỉ được công bố sau khi bạn xác nhận.</p>
        <button className="primary-button sticky-cta" type="button" onClick={() => flow.push(dawnScreen)}>
          Công bố bình minh <SunIcon />
        </button>
      </main>
    </MobileScroll>
  );
}

function Dawn({ flow }: { flow: FlowControls }) {
  const [running, setRunning] = useState(false);

  return (
    <MobileScroll className="app-screen utility-screen host-screen dawn-screen">
      <main className="screen-shell dawn-shell" data-testid="dawn-screen">
        <section className="dawn-hero">
          <div className="dawn-symbol"><SunIcon width="48" height="48" /></div>
          <p className="eyebrow">BÌNH MINH · NGÀY 01</p>
          <h2>Ngôi làng<br />đã thức giấc.</h2>
          <div className="announcement"><SpeakerLoudIcon /><span><small>CÔNG BỐ</small><strong>Đêm qua, không ai rời làng.</strong></span></div>
        </section>

        <section className="discussion-panel">
          <div className="section-heading"><span>Thời gian thảo luận</span><small>8 người còn sống</small></div>
          <strong className="discussion-timer">05:00</strong>
          <button className={running ? "timer-control running" : "timer-control"} type="button" onClick={() => setRunning(!running)}>
            {running ? <PauseIcon /> : <PlayIcon />} {running ? "Tạm dừng" : "Bắt đầu đếm giờ"}
          </button>
        </section>

        <section className="host-prompt">
          <span>GỢI Ý DẪN CHUYỆN</span>
          <p>“Ánh nắng rọi qua mái đình. Tất cả đều có mặt, nhưng sự im lặng trong làng chưa bao giờ nặng nề đến thế...”</p>
        </section>

        <button className="primary-button sticky-cta" type="button" onClick={() => flow.push(votingScreen)}>
          Mở biểu quyết <ChevronRightIcon />
        </button>
      </main>
    </MobileScroll>
  );
}

function Voting({ flow }: { flow: FlowControls }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <MobileScroll className="app-screen utility-screen host-screen voting-screen">
      <main className="screen-shell voting-shell" data-testid="voting-screen">
        <section className="vote-intro">
          <p className="eyebrow">BIỂU QUYẾT · NGÀY 01</p>
          <h2>Ngôi làng nghi ngờ ai?</h2>
          <p>Đếm phiếu ngoài đời, sau đó ghi lại người bị chọn để tránh nhầm lẫn.</p>
        </section>

        <section className="vote-grid" aria-label="Chọn người bị biểu quyết">
          {players.map((player) => (
            <button type="button" key={player.name} className={selected === player.name ? "vote-person selected" : "vote-person"} onClick={() => { setSelected(player.name); setConfirmed(false); }}>
              <span className="avatar">{player.name.charAt(0)}</span>
              <strong>{player.name}</strong>
              <span className="vote-check">{selected === player.name ? <CheckIcon /> : null}</span>
            </button>
          ))}
        </section>

        {selected ? (
          <section className="vote-record">
            <span>NGƯỜI ĐƯỢC CHỌN</span>
            <strong>{selected}</strong>
            <div><button type="button">−</button><b>5 phiếu</b><button type="button">+</button></div>
          </section>
        ) : null}

        {confirmed ? <div className="result-banner"><CheckIcon /><span><small>Biểu quyết đã khóa</small><strong>{selected} sẽ rời làng</strong></span><button type="button" onClick={() => setConfirmed(false)}>Mở lại</button></div> : null}

        <button className="primary-button sticky-cta" disabled={!selected} type="button" onClick={() => confirmed ? flow.push(resolutionScreen) : setConfirmed(true)}>
          {confirmed ? "Công bố kết quả" : "Khóa biểu quyết"} <ChevronRightIcon />
        </button>
      </main>
    </MobileScroll>
  );
}

function Resolution({ flow }: { flow: FlowControls }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <MobileScroll className="app-screen utility-screen host-screen resolution-screen">
      <main className="screen-shell resolution-shell" data-testid="resolution-screen">
        <section className="resolution-hero">
          <span className="avatar">M</span>
          <p className="eyebrow">KẾT QUẢ BIỂU QUYẾT</p>
          <h2>Minh rời khỏi<br />ngôi làng.</h2>
          <p>5 trên 8 người đã bỏ phiếu cho Minh.</p>
        </section>

        <button className={revealed ? "role-result revealed" : "role-result"} type="button" onClick={() => setRevealed(!revealed)}>
          <span>{revealed ? <EyeOpenIcon /> : <EyeClosedIcon />}</span>
          <div><small>{revealed ? "VAI TRÒ ĐÃ LỘ" : "VAI TRÒ ĐANG ẨN"}</small><strong>{revealed ? "MA SÓI" : "Chạm để lật vai"}</strong></div>
          <ChevronRightIcon />
        </button>

        <section className="round-stats">
          <div><span>7</span><small>người còn sống</small></div>
          <div><span>1</span><small>Ma Sói còn lại</small></div>
          <div><span>02</span><small>đêm tiếp theo</small></div>
        </section>

        <div className="round-note"><StarIcon /><p><strong>Phe Dân làng đang chiếm ưu thế.</strong><small>Ván chơi vẫn tiếp tục cho đến khi một phe đạt điều kiện thắng.</small></p></div>
        <button className="primary-button sticky-cta" type="button" onClick={() => flow.replace(hostCockpitNightTwoScreen)}>
          Bắt đầu đêm 02 <MoonIcon />
        </button>
      </main>
    </MobileScroll>
  );
}

const homeScreen: FlowScreen = { id: "home", render: (flow) => <HomeScreen flow={flow} /> };
const createRoomScreen: FlowScreen = {
  id: "create-room",
  headerHeight: 58,
  header: (flow) => <AppHeader flow={flow} eyebrow="DẠ LANG" title="Tạo phòng" />,
  render: (flow) => <CreateRoom flow={flow} />,
};
const joinRoomScreen: FlowScreen = {
  id: "join-room",
  headerHeight: 58,
  header: (flow) => <AppHeader flow={flow} eyebrow="DẠ LANG" title="Vào phòng" />,
  render: (flow) => <JoinRoom flow={flow} />,
};
function makeHostLobbyScreen(roomId: string): FlowScreen {
  return {
    id: "host-lobby",
    headerHeight: 58,
    header: (flow) => <AppHeader flow={flow} eyebrow="QUẢN TRÒ" title="Chờ người chơi" action={<RoomIdBadge roomId={roomId} />} />,
    render: (flow) => <Lobby flow={flow} />,
  };
}
const roleRevealScreen: FlowScreen = { id: "role-reveal", render: () => <RoleReveal /> };
const playerWaitingScreen: FlowScreen = { id: "player-waiting", render: (flow) => <PlayerWaiting flow={flow} /> };
const playerDayScreen: FlowScreen = { id: "player-day", render: (flow) => <PlayerDay flow={flow} /> };
const hostCockpitScreen: FlowScreen = {
  id: "host-cockpit",
  headerHeight: 58,
  header: (flow) => <AppHeader flow={flow} eyebrow="QUẢN TRÒ" title="Điều khiển ván" action={<RestartGameAction flow={flow} />} />,
  render: (flow) => <HostCockpit flow={flow} />,
};
const hostCockpitNightTwoScreen: FlowScreen = {
  id: "host-cockpit-night-two",
  headerHeight: 58,
  header: (flow) => <AppHeader flow={flow} eyebrow="QUẢN TRÒ" title="Điều khiển ván" action={<RestartGameAction flow={flow} />} />,
  render: (flow) => <HostCockpit flow={flow} night={2} />,
};
const nightSummaryScreen: FlowScreen = {
  id: "night-summary",
  headerHeight: 58,
  header: (flow) => <AppHeader flow={flow} eyebrow="QUẢN TRÒ" title="Tổng kết đêm" action={<RestartGameAction flow={flow} />} />,
  render: (flow) => <NightSummary flow={flow} />,
};
const dawnScreen: FlowScreen = {
  id: "dawn",
  headerHeight: 58,
  header: (flow) => <AppHeader flow={flow} eyebrow="QUẢN TRÒ" title="Ngày 01" action={<RestartGameAction flow={flow} />} />,
  render: (flow) => <Dawn flow={flow} />,
};
const votingScreen: FlowScreen = {
  id: "voting",
  headerHeight: 58,
  header: (flow) => <AppHeader flow={flow} eyebrow="QUẢN TRÒ" title="Biểu quyết" action={<RestartGameAction flow={flow} />} />,
  render: (flow) => <Voting flow={flow} />,
};
const resolutionScreen: FlowScreen = {
  id: "resolution",
  headerHeight: 58,
  header: (flow) => <AppHeader flow={flow} eyebrow="QUẢN TRÒ" title="Kết quả vòng" action={<RestartGameAction flow={flow} />} />,
  render: (flow) => <Resolution flow={flow} />,
};

export default function Prototype() {
  return <FlowStack initial={homeScreen} />;
}
