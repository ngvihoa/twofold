import type {
  CardInstanceId,
  PlayerGameAction,
  PlayerId,
} from '@twofold/shared-types';

/** Setup contract luôn yêu cầu đúng 10 card instance theo thứ tự slot mới. */
export type SetupOrder = readonly [
  CardInstanceId,
  CardInstanceId,
  CardInstanceId,
  CardInstanceId,
  CardInstanceId,
  CardInstanceId,
  CardInstanceId,
  CardInstanceId,
  CardInstanceId,
  CardInstanceId,
];

export interface SetupDraftState {
  /** Key của authoritative order mà draft hiện tại bắt nguồn từ đó. */
  readonly authoritativeKey: string;
  /** Local order có thể thay đổi mà không mutate player view. */
  readonly order: SetupOrder;
}

/**
 * Validate một danh sách instance ID thành setup tuple đủ 10 lá, không trùng.
 *
 * @throws Khi số lượng khác 10 hoặc có instance ID trùng nhau.
 */
export function toSetupOrder(ids: readonly CardInstanceId[]): SetupOrder {
  if (ids.length !== 10) throw new Error('Setup order phải chứa đúng 10 card.');
  if (new Set(ids).size !== ids.length) {
    throw new Error('Setup order không được chứa card instance trùng nhau.');
  }
  return ids as SetupOrder;
}

/** Tạo stable comparison key cho authoritative/draft order. */
export function setupOrderKey(order: readonly CardInstanceId[]): string {
  return order.join('|');
}

/** Tạo local draft ban đầu từ private board đã được server sắp theo slot. */
export function createSetupDraft(
  board: readonly { readonly instanceId: CardInstanceId }[]
): SetupDraftState {
  const order = toSetupOrder(board.map((card) => card.instanceId));
  return { authoritativeKey: setupOrderKey(order), order };
}

/**
 * Di chuyển một card trong draft bằng index, không mutate tuple đầu vào.
 *
 * Index ngoài phạm vi hoặc hai index giống nhau trả lại chính order hiện tại.
 */
export function moveSetupCard(
  order: SetupOrder,
  fromIndex: number,
  toIndex: number
): SetupOrder {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= order.length ||
    toIndex < 0 ||
    toIndex >= order.length
  ) {
    return order;
  }
  const next = [...order];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return toSetupOrder(next);
}

/**
 * Reconcile local draft khi authoritative board order thay đổi.
 *
 * Snapshot mới có cùng order giữ nguyên object/draft để không xóa chỉnh sửa
 * chưa lưu. Khi server xác nhận order khác, draft được thay bằng baseline mới.
 */
export function reconcileSetupDraft(
  draft: SetupDraftState,
  authoritativeOrder: SetupOrder
): SetupDraftState {
  const authoritativeKey = setupOrderKey(authoritativeOrder);
  return authoritativeKey === draft.authoritativeKey
    ? draft
    : { authoritativeKey, order: authoritativeOrder };
}

/** Tạo action v0.2 lưu setup order nhưng chưa khóa đội hình. */
export function createSetupReorderAction(
  playerId: PlayerId,
  order: SetupOrder
): Extract<PlayerGameAction, { type: 'SETUP_REORDER' }> {
  return { type: 'SETUP_REORDER', playerId, order: [...order] };
}

/** Tạo action v0.2 khóa authoritative setup hiện tại. */
export function createSetupLockAction(
  playerId: PlayerId
): Extract<PlayerGameAction, { type: 'SETUP_LOCK' }> {
  return { type: 'SETUP_LOCK', playerId };
}
