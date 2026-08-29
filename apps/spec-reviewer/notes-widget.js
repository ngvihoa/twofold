/**
 * Twofold Notes Widget — floating note composer cho mọi trang HTML.
 *
 * Cách dùng: thêm một dòng vào trang bất kỳ (phải được serve từ spec-reviewer):
 *   <script type="module" src="/notes-widget.js?v=20260829-3"></script>
 *
 * Widget tái sử dụng /lib/note-store.js nên note ghi nhanh ở đây cũng xuất hiện
 * ở trang /notes và đồng bộ qua cùng workspace token / /api/notes.
 */

import {
  createNote,
  subscribeNotes,
  syncNotes,
} from "/lib/note-store.js?v=20260829-4";

const STATUS_LABELS = {
  todo: "Todo",
  in_progress: "In progress",
  cancelled: "Cancelled",
  done: "Done",
};

const WIDGET_CSS = `
.tfnw-fab {
  --tfnw-accent: var(--accent, #d08c3f);
  --tfnw-accent-strong: var(--accent-strong, #a85e16);
  --tfnw-accent-ink: var(--accent-ink, #21180f);
  --tfnw-surface: var(--surface, #ffffff);
  --tfnw-surface-2: var(--surface-2, #f3f4f2);
  --tfnw-text: var(--text, #1c221f);
  --tfnw-muted: var(--muted, #59635f);
  --tfnw-line: var(--line, #c7ceca);
  position: fixed;
  z-index: 2147483000;
  right: 1.25rem;
  bottom: 1.25rem;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  min-height: 48px;
  padding: 0 1rem;
  border: 1px solid var(--tfnw-accent-strong);
  border-radius: 999px;
  background: var(--tfnw-accent);
  color: var(--tfnw-accent-ink);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 32px rgba(5, 8, 7, .35);
}
.tfnw-fab:hover { background: var(--tfnw-accent-strong); transform: translateY(-2px); }
.tfnw-fab svg { flex: 0 0 auto; }
.tfnw-fab-label { font-size: .78rem; letter-spacing: .04em; text-transform: uppercase; }
.tfnw-fab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  padding: .1rem .4rem;
  border-radius: 999px;
  background: var(--tfnw-surface);
  color: var(--tfnw-text);
  font-size: .72rem;
  font-variant-numeric: tabular-nums;
}
.tfnw-fab[data-pending="true"] .tfnw-fab-badge { outline: 2px dashed var(--tfnw-accent-strong); outline-offset: -4px; }
.tfnw-toast {
  position: fixed;
  z-index: 2147483000;
  right: 1.25rem;
  bottom: 4.75rem;
  max-width: min(320px, calc(100vw - 2.5rem));
  margin: 0;
  padding: .6rem .9rem;
  border: 1px solid var(--tfnw-line, var(--line, #c7ceca));
  border-radius: 10px;
  background: var(--tfnw-surface, var(--surface, #ffffff));
  color: var(--tfnw-text, var(--text, #1c221f));
  font: inherit;
  font-size: .78rem;
  box-shadow: 0 12px 32px rgba(5, 8, 7, .28);
  opacity: 0;
  translate: 0 6px;
  transition: opacity .25s ease, translate .25s ease;
  pointer-events: none;
}
.tfnw-toast[data-visible="true"] { opacity: 1; translate: 0 0; }
.tfnw-dialog {
  width: min(560px, calc(100% - 2rem), calc(100vw - 2rem), calc(100dvw - 2rem));
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  box-sizing: border-box;
  border: 1px solid var(--tfnw-line, var(--line, #c7ceca));
  border-radius: 14px;
  background: var(--tfnw-surface, var(--surface, #ffffff));
  color: var(--tfnw-text, var(--text, #1c221f));
  font: inherit;
  box-shadow: 0 24px 64px rgba(5, 8, 7, .4);
}
.tfnw-dialog::backdrop { background: rgba(5, 8, 7, .74); backdrop-filter: blur(8px); }
.tfnw-dialog[open] { animation: tfnw-dialog-in .3s cubic-bezier(.16, 1, .3, 1) both; }
@keyframes tfnw-dialog-in {
  from { opacity: 0; transform: translateY(14px) scale(.98); }
  to { opacity: 1; transform: none; }
}
.tfnw-dialog, .tfnw-dialog *, .tfnw-dialog *::before, .tfnw-dialog *::after { box-sizing: border-box; min-width: 0; }
.tfnw-form { display: grid; gap: .5rem; padding: clamp(1.25rem, 4vw, 2rem); }
.tfnw-form-header { display: flex; align-items: start; justify-content: space-between; gap: 1rem; margin-bottom: .5rem; }
.tfnw-kicker { margin: 0 0 .3rem; color: var(--tfnw-accent, var(--accent, #d08c3f)); font-size: .68rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.tfnw-title { margin: 0; font-size: 1.3rem; letter-spacing: -.02em; }
.tfnw-close {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 .7rem;
  border: 1px solid var(--tfnw-line, var(--line, #c7ceca));
  border-radius: 7px;
  background: var(--tfnw-surface-2, var(--surface-2, #f3f4f2));
  color: var(--tfnw-text, var(--text, #1c221f));
  font: inherit;
  font-size: .72rem;
  font-weight: 700;
  cursor: pointer;
}
.tfnw-label { color: var(--tfnw-muted, var(--muted, #59635f)); font-size: .7rem; font-weight: 740; }
.tfnw-context {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .55rem .7rem;
  border: 1px dashed var(--tfnw-line, var(--line, #c7ceca));
  border-radius: 8px;
  background: var(--tfnw-surface-2, var(--surface-2, #f3f4f2));
  color: var(--tfnw-muted, var(--muted, #59635f));
  font-size: .72rem;
}
.tfnw-context span { flex: 0 0 auto; }
.tfnw-context strong { flex: 1 1 auto; min-width: 0; overflow: hidden; color: var(--tfnw-text, var(--text, #1c221f)); font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.tfnw-context input { flex: 0 0 auto; accent-color: var(--tfnw-accent, var(--accent, #d08c3f)); }
.tfnw-body {
  width: 100%;
  min-height: 140px;
  padding: .75rem;
  color: var(--tfnw-text, var(--text, #1c221f));
  background: var(--tfnw-surface-2, var(--surface-2, #f3f4f2));
  border: 1px solid var(--tfnw-line, var(--line, #c7ceca));
  border-radius: 8px;
  font: inherit;
  line-height: 1.5;
  resize: vertical;
}
.tfnw-body:focus { border-color: var(--tfnw-accent, var(--accent, #d08c3f)); outline: 2px solid color-mix(in srgb, var(--tfnw-accent, var(--accent, #d08c3f)) 28%, transparent); outline-offset: 0; }
.tfnw-status {
  min-height: 44px;
  padding: 0 .75rem;
  color: var(--tfnw-text, var(--text, #1c221f));
  background: var(--tfnw-surface-2, var(--surface-2, #f3f4f2));
  border: 1px solid var(--tfnw-line, var(--line, #c7ceca));
  border-radius: 8px;
  font: inherit;
}
.tfnw-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .6rem 1rem; margin-top: .4rem; padding-top: .9rem; border-top: 1px solid var(--tfnw-line, var(--line, #c7ceca)); }
.tfnw-feedback { color: var(--tfnw-muted, var(--muted, #59635f)); font-size: .72rem; }
.tfnw-feedback[data-error="true"] { color: #a44c46; }
.tfnw-buttons { display: flex; gap: .55rem; margin-left: auto; }
.tfnw-button-secondary {
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid var(--tfnw-line, var(--line, #c7ceca));
  border-radius: 8px;
  background: transparent;
  color: var(--tfnw-text, var(--text, #1c221f));
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.tfnw-button-primary {
  min-height: 44px;
  padding: 0 1.2rem;
  border: 1px solid var(--tfnw-accent-strong, var(--accent-strong, #a85e16));
  border-radius: 8px;
  background: var(--tfnw-accent, var(--accent, #d08c3f));
  color: var(--tfnw-accent-ink, var(--accent-ink, #21180f));
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
.tfnw-button-primary:hover { background: var(--tfnw-accent-strong, var(--accent-strong, #a85e16)); }
.tfnw-button-primary:disabled { opacity: .6; cursor: wait; }
.tfnw-footer-link { color: var(--tfnw-accent-strong, var(--accent-strong, #a85e16)); font-size: .72rem; font-weight: 700; }
@media (prefers-reduced-motion: reduce) {
  .tfnw-fab:hover { transform: none; }
  .tfnw-dialog[open] { animation: none; }
}
`;
function pageContext() {
  const title = document.title?.trim() || "Trang không tiêu đề";
  return `[Trang] ${title} · ${location.pathname}`;
}

function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined) continue;
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

const FAB_ICON = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M11.3 1.6a1.6 1.6 0 0 1 2.26 0l.84.84a1.6 1.6 0 0 1 0 2.26l-8.1 8.1-3.6.9.9-3.6 8.1-8.1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;

let instance;

export function initNotesWidget() {
  if (instance) return instance;

  if (!document.getElementById("tfnw-styles")) {
    document.head.append(el("style", { id: "tfnw-styles", text: WIDGET_CSS }));
  }

  const fab = el("button", {
    class: "tfnw-fab",
    type: "button",
    "aria-label": "Mở form ghi chú nhanh",
    "aria-haspopup": "dialog",
  });
  fab.innerHTML = `${FAB_ICON}
    <span class="tfnw-fab-label">Ghi chú</span>
    <span class="tfnw-fab-badge" data-tfnw-badge>0</span>`;

  const toast = el("p", { class: "tfnw-toast", role: "status" });
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.dataset.visible = "true";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.dataset.visible = "false"; }, 2600);
  }
  const statusSelect = el("select", { class: "tfnw-status", id: "tfnw-note-status", name: "status" },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => el("option", { value, text: label })));
  const contextCheckbox = el("input", { type: "checkbox", id: "tfnw-include-context", checked: "" });
  const bodyInput = el("textarea", {
    class: "tfnw-body",
    id: "tfnw-note-body",
    name: "body",
    maxlength: "5000",
    required: "",
    placeholder: "Ví dụ: Cần làm rõ thời điểm kỹ năng được kích hoạt...",
  });
  const feedback = el("span", { class: "tfnw-feedback", role: "status" });
  const submitButton = el("button", { class: "tfnw-button-primary", type: "submit", text: "Lưu note" });

  const form = el("form", { class: "tfnw-form" },
    el("div", { class: "tfnw-form-header" },
      el("div", {},
        el("p", { class: "tfnw-kicker", text: "Specification review" }),
        el("h2", { class: "tfnw-title", id: "tfnw-dialog-title", text: "Ghi chú nhanh" })),
      el("button", { class: "tfnw-close", type: "button", "data-tfnw-close": "", text: "Đóng" })),
    el("label", { class: "tfnw-label", for: "tfnw-note-status", text: "Trạng thái" }),
    statusSelect,
    el("label", { class: "tfnw-label", for: "tfnw-note-body", text: "Nội dung" }),
    bodyInput,
    el("label", { class: "tfnw-context", for: "tfnw-include-context" },
      contextCheckbox,
      el("span", { text: "Kèm trang: " }),
      el("strong", { text: pageContext() })),
    el("div", { class: "tfnw-actions" },
      feedback,
      el("div", { class: "tfnw-buttons" },
        el("button", { class: "tfnw-button-secondary", type: "button", "data-tfnw-close": "", text: "Hủy" }),
        submitButton)),
    el("a", { class: "tfnw-footer-link", href: "/notes", text: "Xem tất cả notes →" }));

  const dialog = el("dialog", { class: "tfnw-dialog", "aria-labelledby": "tfnw-dialog-title" }, form);

  document.body.append(fab, toast, dialog);

  fab.addEventListener("click", () => {
    feedback.textContent = "";
    delete feedback.dataset.error;
    dialog.showModal();
    bodyInput.focus();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-tfnw-close]")) dialog.close();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = contextCheckbox.checked ? `${pageContext()}\n\n${bodyInput.value}` : bodyInput.value;
    submitButton.disabled = true;
    try {
      const note = await createNote({ body, status: statusSelect.value });
      dialog.close();
      form.reset();
      statusSelect.value = note.status;
      showToast("Đã lưu note. Xem tất cả tại /notes.");
    } catch (error) {
      feedback.dataset.error = "true";
      feedback.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });
  subscribeNotes(({ notes, pending, sync }) => {
    const badge = fab.querySelector("[data-tfnw-badge]");
    badge.textContent = String(notes.length);
    fab.dataset.pending = String(pending > 0);
    if (dialog.open && !feedback.dataset.error) {
      feedback.textContent = sync.status === "syncing"
        ? sync.message
        : pending > 0
          ? `${pending} note chờ đồng bộ.`
          : "";
    }
  });

  syncNotes();

  instance = {
    fab,
    dialog,
    destroy() {
      fab.remove();
      toast.remove();
      dialog.remove();
      instance = undefined;
    },
  };
  return instance;
}

function start() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.__twofoldNotesWidget) return;
  try {
    window.__twofoldNotesWidget = initNotesWidget();
  } catch (error) {
    console.error("tfnw: không khởi tạo được notes widget.", error);
  }
}

start();

