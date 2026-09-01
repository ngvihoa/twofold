export function chooseBotCouncilAction(state, roleDefs) {
  if (state.players.B.eliminationSpent) {
    return { type: "council.submit", seat: "B", kind: "pass" };
  }
  const target = state.players.A.board.find((card) => card.alive && card.revealed);
  const candidates = state.players.B.board
    .filter((card) => card.alive && roleDefs[card.role].faction === "village" && !card.dayExhausted && card.voteCooldown === 0 && card.purgeLockedRound !== state.round)
    .sort((left, right) => Number(right.role === "villager") - Number(left.role === "villager"));
  const voters = [];
  let power = 0;
  for (const card of candidates) {
    if (power >= 3 || voters.length >= 3) break;
    voters.push(card.id);
    power += card.role === "villager" ? 2 : 1;
  }
  if (target && power >= 3) {
    return { type: "council.submit", seat: "B", kind: "accuse", target: target.id, guess: target.role, voters };
  }
  return { type: "council.submit", seat: "B", kind: "pass" };
}
