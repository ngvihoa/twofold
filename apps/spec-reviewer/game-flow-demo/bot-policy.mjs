const ROLE_KEYS = [
  'villager',
  'wolf',
  'seer',
  'guard',
  'witch',
  'shooter',
  'avenger',
  'priest',
  'wolfguard',
];

const isVillageRole = (roleKey) => roleKey !== 'wolf' && roleKey !== 'wolfguard';

/** Bot turn gate chỉ đọc public submission locks, không đọc pending payload. */
export function botNeedsTurn(publicState, self) {
  const ownLocks = publicState.submissionLocks[self.seat];
  const opponentSeat = self.seat === 'A' ? 'B' : 'A';
  const opponentLocks = publicState.submissionLocks[opponentSeat];

  if (publicState.phase === `setup-${self.seat}`) return true;
  if (publicState.phase === `day-${self.seat}`) return true;
  if (publicState.phase === 'purge') return opponentLocks.purge && !ownLocks.purge;
  if (publicState.phase === 'council') {
    return opponentLocks.council && !ownLocks.council;
  }
  if (publicState.phase === 'dusk-defense') {
    return opponentLocks.defense && !ownLocks.defense;
  }
  if (publicState.phase === 'night-plan') return opponentLocks.night && !ownLocks.night;
  if (publicState.phase === 'final-duel') {
    return opponentLocks.finalGuess && !ownLocks.finalGuess;
  }
  return false;
}

/**
 * Chọn action deterministic từ public snapshot và private view của chính bot.
 * Hàm không nhận master/adaptor state nên không thể đọc hidden opponent role
 * hoặc payload Council/Night/Purge đang chờ của đối thủ.
 */
export function chooseBotAction(publicState, self) {
  const seat = self.seat;
  const opponentSeat = seat === 'A' ? 'B' : 'A';
  const own = self.hand.filter((card) => card.alive);
  const enemies = publicState.board[opponentSeat].filter((card) => card.alive);
  const ownRole = (roleKey) => own.find((card) => card.roleKey === roleKey);

  if (publicState.phase === `setup-${seat}`) {
    return { type: 'setup.submit', seat, order: self.hand.map((card) => card.id) };
  }

  if (publicState.phase === 'purge') {
    const rule = ['cut', 'swap', 'reveal', 'lock'][(publicState.round - 6) % 4];
    const ownTargets = own.filter((card) => rule !== 'reveal' || !card.revealed);
    const target = ownTargets.length
      ? ownTargets[publicState.round % ownTargets.length]
      : null;
    const swapTarget = enemies.length
      ? enemies[(publicState.round + 1) % enemies.length]
      : null;
    return {
      type: 'purge.submit',
      seat,
      target: target?.id ?? null,
      swapTarget: rule === 'swap' ? swapTarget?.id ?? null : undefined,
    };
  }

  if (publicState.phase === `day-${seat}`) {
    const revealedEnemies = enemies.filter((card) => card.revealed);
    const shooter = ownRole('shooter');
    if (shooter?.uses.bullet > 0 && revealedEnemies.length >= 2) {
      return {
        type: 'day.submit',
        seat,
        kind: 'shoot',
        source: shooter.id,
        target: revealedEnemies[0].id,
      };
    }

    const witch = ownRole('witch');
    const deadAlly = self.hand.find((card) => !card.alive);
    if (witch?.uses.revive > 0 && deadAlly) {
      return {
        type: 'day.submit',
        seat,
        kind: 'revive',
        source: witch.id,
        target: deadAlly.id,
      };
    }

    const knownWolf = [...self.intel]
      .reverse()
      .find((entry) => entry.faction === 'werewolf' && enemies.some((card) => card.id === entry.cardId));
    const priest = ownRole('priest');
    if (priest?.uses.holyWater > 0 && knownWolf) {
      return {
        type: 'day.submit',
        seat,
        kind: 'purify',
        source: priest.id,
        target: knownWolf.cardId,
      };
    }

    const avenger = ownRole('avenger');
    if (avenger && enemies.length) {
      const target = enemies[(publicState.round + enemies.length - 1) % enemies.length];
      return {
        type: 'day.submit',
        seat,
        kind: 'mark',
        source: avenger.id,
        target: target.id,
      };
    }
    return { type: 'day.submit', seat, kind: 'pass' };
  }

  if (publicState.phase === 'council') {
    const target = enemies.find((card) => card.revealed);
    const voters = own
      .filter(
        (card) =>
          isVillageRole(card.roleKey) &&
          card.voteCooldown === 0 &&
          card.purgeLockedRound !== publicState.round,
      )
      .slice(0, 3)
      .map((card) => card.id);
    if (target && voters.length === 3) {
      return {
        type: 'council.submit',
        seat,
        kind: 'accuse',
        target: target.id,
        voters,
      };
    }
    return { type: 'council.submit', seat, kind: 'pass' };
  }

  if (publicState.phase === 'dusk-defense') {
    const guard = ownRole('guard');
    if (!guard?.uses.guard) return { type: 'defense.submit', seat, pass: true };
    const choices = own.filter(
      (card) =>
        card.instanceId !== self.lastGuardTarget && card.instanceId !== guard.instanceId,
    );
    if (!choices.length) return { type: 'defense.submit', seat, pass: true };
    const target =
      choices.find((card) => card.revealed) ??
      choices[publicState.round % choices.length];
    return {
      type: 'defense.submit',
      seat,
      pass: false,
      source: guard.id,
      target: target.id,
    };
  }

  if (publicState.phase === 'night-plan') {
    if (!enemies.length) return { type: 'night.submit', seat, kind: 'pass' };
    const openTargets = enemies.filter((card) => !card.shielded);
    const pool = openTargets.length ? openTargets : enemies;
    const target = pool[publicState.round % pool.length];
    const wolf = ownRole('wolf');
    if (wolf) {
      return {
        type: 'night.submit',
        seat,
        kind: 'attack',
        source: wolf.id,
        target: target.id,
      };
    }

    const revealedTargets = enemies.filter((card) => card.revealed);
    const special = publicState.special[seat];
    if (special.unlocked && special.ready && revealedTargets.length) {
      return {
        type: 'night.submit',
        seat,
        kind: 'bloodmoon',
        target: revealedTargets[publicState.round % revealedTargets.length].id,
      };
    }

    const seer = ownRole('seer');
    const knownLightIds = new Set(
      self.intel
        .filter((entry) => entry.faction === 'village')
        .map((entry) => entry.cardId),
    );
    const seerTargets = enemies.filter((card) => !knownLightIds.has(card.id));
    if (seer?.uses.seer > 0 && seerTargets.length) {
      return {
        type: 'night.submit',
        seat,
        kind: 'inspect',
        source: seer.id,
        target: seerTargets[publicState.round % seerTargets.length].id,
      };
    }
    return { type: 'night.submit', seat, kind: 'pass' };
  }

  return {
    type: 'final.submit',
    seat,
    guess: ROLE_KEYS[publicState.round % ROLE_KEYS.length],
  };
}
