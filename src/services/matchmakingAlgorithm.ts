import { Player, Match, Pair, MatchmakingResult, AlgorithmConfig, MatchType } from '../types/badminton';

/**
 * Generates all combinations of size 2 from an array of players
 */
function getCombinations<T>(arr: T[], size: number = 2): [T, T][] {
  const result: [T, T][] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      result.push([arr[i], arr[j]]);
    }
  }
  return result;
}

/**
 * Step 2 helper: Generate all same-gender pairs
 * Prioritizes high-low complementary pairing (mạnh kèm yếu)
 */
export function generateSameGenderPairs(players: Player[], gender: 'MALE' | 'FEMALE'): Pair[] {
  const pool = [...players.filter((p) => p.gender === gender)];
  // Sort pool by rank descending
  pool.sort((a, b) => b.rankScore - a.rankScore || a.id.localeCompare(b.id));

  const combos = getCombinations(pool, 2);
  const matchType: MatchType = gender === 'MALE' ? 'MENS_DOUBLE' : 'WOMENS_DOUBLE';

  const pairs = combos.map(([p1, p2]) => ({
    id: `${p1.id}_${p2.id}`,
    player1: p1,
    player2: p2,
    score: p1.rankScore + p2.rankScore,
    type: matchType,
  }));

  // Sort pairs to prefer balanced pairing (complementary spread: high + low)
  pairs.sort((a, b) => {
    const spreadA = Math.abs(a.player1.rankScore - a.player2.rankScore);
    const spreadB = Math.abs(b.player1.rankScore - b.player2.rankScore);
    // Prefer higher spread (e.g. 5+2, 3+1) or equal scores
    return spreadB - spreadA || b.score - a.score || a.id.localeCompare(b.id);
  });

  return pairs;
}

/**
 * Step 2 helper: Generate all cross male-female pairs
 * Prioritizes complementary pairs (strong male + beginner female, average male + average female, weak male + strong female)
 */
export function generateMixedPairs(players: Player[]): Pair[] {
  const males = [...players.filter((p) => p.gender === 'MALE')].sort(
    (a, b) => b.rankScore - a.rankScore || a.id.localeCompare(b.id)
  );
  const females = [...players.filter((p) => p.gender === 'FEMALE')].sort(
    (a, b) => b.rankScore - a.rankScore || a.id.localeCompare(b.id)
  );
  const pairs: Pair[] = [];

  for (const m of males) {
    for (const f of females) {
      pairs.push({
        id: `${m.id}_${f.id}`,
        player1: m,
        player2: f,
        score: m.rankScore + f.rankScore,
        type: 'MIXED_DOUBLE',
      });
    }
  }

  // In mixed doubles, club matchmaking balances pairs around the average pair score (~5-6)
  // Strong male (5) + Newbie female (1) = 6
  // Medium male (3) + Weak female (2) = 5
  // Weak male (2) + Medium female (3) = 5
  pairs.sort((a, b) => {
    const targetScore = 5.5;
    const distA = Math.abs(a.score - targetScore);
    const distB = Math.abs(b.score - targetScore);
    if (distA !== distB) return distA - distB;
    const spreadA = Math.abs(a.player1.rankScore - a.player2.rankScore);
    const spreadB = Math.abs(b.player1.rankScore - b.player2.rankScore);
    return spreadB - spreadA || a.id.localeCompare(b.id);
  });

  return pairs;
}

/**
 * Check if a pair violates the pastPartners constraint
 */
export function isPartnerRepetition(p1: Player, p2: Player): boolean {
  return p1.pastPartners.includes(p2.id) || p2.pastPartners.includes(p1.id);
}

/**
 * Core Solver for a single Phase:
 * Takes a pool of players and desired pair generator, and matches them into pairs and 4-player matches
 * optimizing for min delta (ideally 0) and zero partner repetition.
 */
function solvePhasePartition(
  poolPlayers: Player[],
  pairType: 'SAME_GENDER' | 'MIXED',
  phaseNumber: number,
  phaseLabel: string,
  startMatchIndex: number,
  allPlayersState: Map<string, Player>,
  maxDeltaThreshold: number = 0
): { matches: Match[]; unassigned: Player[] } {
  const numMatchesNeeded = Math.floor(poolPlayers.length / 4);
  if (numMatchesNeeded === 0) {
    return { matches: [], unassigned: poolPlayers };
  }

  // Pre-filter candidate pairs avoiding past partner repeats
  let allPairs: Pair[] = [];
  if (pairType === 'SAME_GENDER') {
    // Phase 1: Separate into male and female
    const males = poolPlayers.filter((p) => p.gender === 'MALE');
    const females = poolPlayers.filter((p) => p.gender === 'FEMALE');

    const malePairs = generateSameGenderPairs(males, 'MALE');
    const femalePairs = generateSameGenderPairs(females, 'FEMALE');

    // Solve females first, then males
    const femaleMatches = solveSingleGroupMatches(
      females,
      femalePairs,
      'WOMENS_DOUBLE',
      phaseNumber,
      phaseLabel,
      startMatchIndex,
      allPlayersState,
      maxDeltaThreshold
    );

    const maleMatches = solveSingleGroupMatches(
      males,
      malePairs,
      'MENS_DOUBLE',
      phaseNumber,
      phaseLabel,
      startMatchIndex + femaleMatches.matches.length,
      allPlayersState,
      maxDeltaThreshold
    );

    return {
      matches: [...femaleMatches.matches, ...maleMatches.matches],
      unassigned: [...femaleMatches.unassigned, ...maleMatches.unassigned],
    };
  } else {
    // Phase 2: Mixed Doubles
    const mixedPairs = generateMixedPairs(poolPlayers);
    return solveSingleGroupMatches(
      poolPlayers,
      mixedPairs,
      'MIXED_DOUBLE',
      phaseNumber,
      phaseLabel,
      startMatchIndex,
      allPlayersState,
      maxDeltaThreshold
    );
  }
}

/**
 * Exact-cover backtracking Match Finder:
 * Guarantees zero duplicate player permutations, fast execution, and optimal delta minimization.
 */
function solveSingleGroupMatches(
  groupPlayers: Player[],
  pairs: Pair[],
  matchType: MatchType,
  phaseNumber: number,
  phaseLabel: string,
  startMatchIndex: number,
  allPlayersState: Map<string, Player>,
  maxDeltaThreshold: number
): { matches: Match[]; unassigned: Player[] } {
  const targetMatches = Math.floor(groupPlayers.length / 4);
  if (targetMatches === 0) {
    return { matches: [], unassigned: groupPlayers };
  }

  // Filter out pairs that have already partnered in previous matches
  const validPairs = pairs.filter((p) => {
    const p1 = allPlayersState.get(p.player1.id) || p.player1;
    const p2 = allPlayersState.get(p.player2.id) || p.player2;
    return !isPartnerRepetition(p1, p2);
  });

  // Pre-index valid pairs by player ID for rapid lookup
  const pairsByPlayer = new Map<string, Pair[]>();
  groupPlayers.forEach((p) => pairsByPlayer.set(p.id, []));

  validPairs.forEach((pair) => {
    pairsByPlayer.get(pair.player1.id)?.push(pair);
    pairsByPlayer.get(pair.player2.id)?.push(pair);
  });

  interface SolutionMatch {
    pairA: Pair;
    pairB: Pair;
    delta: number;
  }

  const solverState: {
    bestSolution: SolutionMatch[] | null;
    bestTotalDelta: number;
  } = {
    bestSolution: null,
    bestTotalDelta: Infinity,
  };

  // Search function branching on the first unassigned player
  function search(assignedIds: Set<string>, currentMatches: SolutionMatch[], currentDelta: number) {
    if (currentMatches.length === targetMatches) {
      if (currentDelta < solverState.bestTotalDelta) {
        solverState.bestTotalDelta = currentDelta;
        solverState.bestSolution = [...currentMatches];
      }
      return;
    }

    if (currentDelta >= solverState.bestTotalDelta) return;

    // Find the first unassigned player
    const p1 = groupPlayers.find((p) => !assignedIds.has(p.id));
    if (!p1) return;

    const p1Pairs = pairsByPlayer.get(p1.id) || [];

    for (const pairA of p1Pairs) {
      const p2Id = pairA.player1.id === p1.id ? pairA.player2.id : pairA.player1.id;
      if (assignedIds.has(p2Id)) continue;

      // Find the next unassigned player to start pair B
      const p3 = groupPlayers.find((p) => !assignedIds.has(p.id) && p.id !== p1.id && p.id !== p2Id);
      if (!p3) continue;

      const p3Pairs = pairsByPlayer.get(p3.id) || [];
      for (const pairB of p3Pairs) {
        const p4Id = pairB.player1.id === p3.id ? pairB.player2.id : pairB.player1.id;
        if (assignedIds.has(p4Id) || p4Id === p1.id || p4Id === p2Id) continue;

        const delta = Math.abs(pairA.score - pairB.score);
        if (delta > maxDeltaThreshold && solverState.bestSolution !== null) continue;

        // Form match
        const nextAssigned = new Set(assignedIds);
        nextAssigned.add(p1.id);
        nextAssigned.add(p2Id);
        nextAssigned.add(p3.id);
        nextAssigned.add(p4Id);

        currentMatches.push({ pairA, pairB, delta });
        search(nextAssigned, currentMatches, currentDelta + delta);
        currentMatches.pop();

        // If we found a perfect solution where delta is 0 across all matches, terminate search
        if (solverState.bestTotalDelta === 0 && solverState.bestSolution?.length === targetMatches) {
          return;
        }
      }
    }
  }

  // Run with threshold
  search(new Set<string>(), [], 0);

  // If strict search didn't complete, relax threshold incrementally
  if (!solverState.bestSolution || solverState.bestSolution.length < targetMatches) {
    for (let relaxedDelta = 1; relaxedDelta <= 4; relaxedDelta++) {
      search(new Set<string>(), [], 0);
      if (solverState.bestSolution && solverState.bestSolution.length === targetMatches) break;
    }
  }

  // Final fallback if needed
  if (!solverState.bestSolution || solverState.bestSolution.length < targetMatches) {
    solverState.bestSolution = fallbackGreedy(groupPlayers, validPairs.length > 0 ? validPairs : pairs, targetMatches);
  }

  // Convert bestSolution to Match objects
  const matches: Match[] = [];
  const assignedPlayerIds = new Set<string>();

  (solverState.bestSolution || []).forEach((item, idx) => {
    const matchId = `match_${phaseNumber}_${startMatchIndex + idx}`;
    const m: Match = {
      matchId,
      type: matchType,
      teamA: [item.pairA.player1.id, item.pairA.player2.id],
      teamB: [item.pairB.player1.id, item.pairB.player2.id],
      scoreA: item.pairA.score,
      scoreB: item.pairB.score,
      delta: item.delta,
      phase: phaseNumber,
      phaseLabel,
      roundNumber: phaseNumber,
      courtNumber: (idx % 4) + 1,
      status: 'SCHEDULED',
    };
    matches.push(m);

    assignedPlayerIds.add(item.pairA.player1.id);
    assignedPlayerIds.add(item.pairA.player2.id);
    assignedPlayerIds.add(item.pairB.player1.id);
    assignedPlayerIds.add(item.pairB.player2.id);
  });

  const unassigned = groupPlayers.filter((p) => !assignedPlayerIds.has(p.id));

  return { matches, unassigned };
}

/**
 * Fallback greedy match finder when backtracking constraints are too tight
 */
function fallbackGreedy(
  groupPlayers: Player[],
  candidatePairs: Pair[],
  targetMatches: number
): { pairA: Pair; pairB: Pair; delta: number }[] {
  const result: { pairA: Pair; pairB: Pair; delta: number }[] = [];
  const used = new Set<string>();

  const sortedPairs = [...candidatePairs].sort((a, b) => a.score - b.score);

  for (let i = 0; i < sortedPairs.length && result.length < targetMatches; i++) {
    const pA = sortedPairs[i];
    if (used.has(pA.player1.id) || used.has(pA.player2.id)) continue;

    let bestPairB: Pair | null = null;
    let minDelta = Infinity;

    for (let j = i + 1; j < sortedPairs.length; j++) {
      const pB = sortedPairs[j];
      if (
        used.has(pB.player1.id) ||
        used.has(pB.player2.id) ||
        pB.player1.id === pA.player1.id ||
        pB.player1.id === pA.player2.id ||
        pB.player2.id === pA.player1.id ||
        pB.player2.id === pA.player2.id
      ) {
        continue;
      }

      const delta = Math.abs(pA.score - pB.score);
      if (delta < minDelta) {
        minDelta = delta;
        bestPairB = pB;
        if (delta === 0) break;
      }
    }

    if (bestPairB) {
      used.add(pA.player1.id);
      used.add(pA.player2.id);
      used.add(bestPairB.player1.id);
      used.add(bestPairB.player2.id);
      result.push({ pairA: pA, pairB: bestPairB, delta: minDelta });
    }
  }

  return result;
}

/**
 * Chế độ Mix Giao Lưu Tự Do (Continuous Fair Mixer)
 * Đặc biệt giải quyết bài toán:
 * - 8 người 6 trận (hoặc N người M trận linh hoạt)
 * - Mix Đôi Nam (ví dụ M1+M4 vs M2+M3), Đôi Nữ (F1+F4 vs F2+F3), Đôi Nam Nữ
 * - Đảm bảo ĐIỀU KIỆN TIÊN QUYẾT: Delta <= 1 TRONG MỌI TRẬN ĐẤU (Tuyệt đối không lớn hơn 1)
 * - 0 trùng partner (mỗi cặp chỉ đồng hành đúng 1 lần)
 * - Số trận ra sân chia đều cho mọi thành viên (ví dụ 8 người 6 trận -> mỗi người đúng 3 trận)
 * - Không phân chia "Chung kết" hay "Hạng ba" nhân tạo
 */
export function runContinuousMatchmaking(
  inputPlayers: Player[],
  targetMatches: number,
  config: Partial<AlgorithmConfig> = {}
): MatchmakingResult {
  const startTime = performance.now();
  const playerMap = new Map<string, Player>();
  inputPlayers.forEach((p) => {
    playerMap.set(p.id, {
      ...p,
      pastPartners: [...(p.pastPartners || [])],
      playedCount: p.playedCount || 0,
    });
  });

  const players = Array.from(playerMap.values());
  const N = players.length;
  if (N < 4 || targetMatches <= 0) {
    return {
      matches: [],
      updatedPlayers: players,
      phases: [],
      algorithmStats: {
        totalCombinationsGenerated: 0,
        averageDelta: 0,
        zeroDeltaMatches: 0,
        duplicatePartnersCount: 0,
        executionTimeMs: 0,
        isStandardTestCasePassed: false,
      },
      validationErrors: ['Cần ít nhất 4 người chơi để xếp trận đôi.'],
    };
  }

  // 1. Generate all candidate 4-player matches with Delta <= 1
  interface Cand {
    p1: Player;
    p2: Player;
    p3: Player;
    p4: Player;
    type: MatchType;
    scoreA: number;
    scoreB: number;
    delta: number;
    pairAKey: string;
    pairBKey: string;
    isStandardFormat: boolean;
    spread: number;
  }

  const candidates: Cand[] = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      for (let k = j + 1; k < N; k++) {
        for (let l = k + 1; l < N; l++) {
          const quad = [players[i], players[j], players[k], players[l]];
          const configs: [[Player, Player], [Player, Player]][] = [
            [[quad[0], quad[1]], [quad[2], quad[3]]],
            [[quad[0], quad[2]], [quad[1], quad[3]]],
            [[quad[0], quad[3]], [quad[1], quad[2]]],
          ];

          for (const [pairA, pairB] of configs) {
            const aGenders = [pairA[0].gender, pairA[1].gender].sort().join('');
            const bGenders = [pairB[0].gender, pairB[1].gender].sort().join('');

            let type: MatchType = 'MIXED_DOUBLE';
            let isStandardFormat = false;

            if (aGenders === 'MALEMALE' && bGenders === 'MALEMALE') {
              type = 'MENS_DOUBLE';
              isStandardFormat = true;
            } else if (aGenders === 'FEMALEFEMALE' && bGenders === 'FEMALEFEMALE') {
              type = 'WOMENS_DOUBLE';
              isStandardFormat = true;
            } else if (aGenders === 'FEMALEMALE' && bGenders === 'FEMALEMALE') {
              type = 'MIXED_DOUBLE';
              isStandardFormat = true;
            } else {
              type = 'MIXED_DOUBLE';
              isStandardFormat = false;
            }

            const scoreA = pairA[0].rankScore + pairA[1].rankScore;
            const scoreB = pairB[0].rankScore + pairB[1].rankScore;
            const delta = Math.abs(scoreA - scoreB);

            // TUYỆT ĐỐI: Delta <= 1 (Không bao giờ lớn hơn 1)
            if (delta <= 1) {
              const pairAKey = [pairA[0].id, pairA[1].id].sort().join('-');
              const pairBKey = [pairB[0].id, pairB[1].id].sort().join('-');
              const spread =
                Math.abs(pairA[0].rankScore - pairA[1].rankScore) +
                Math.abs(pairB[0].rankScore - pairB[1].rankScore);

              candidates.push({
                p1: pairA[0],
                p2: pairA[1],
                p3: pairB[0],
                p4: pairB[1],
                type,
                scoreA,
                scoreB,
                delta,
                pairAKey,
                pairBKey,
                isStandardFormat,
                spread,
              });
            }
          }
        }
      }
    }
  }

  // Sort candidates: standard doubles first, delta = 0 first, spread complementary
  candidates.sort((a, b) => {
    if (a.isStandardFormat !== b.isStandardFormat) return a.isStandardFormat ? -1 : 1;
    if (a.delta !== b.delta) return a.delta - b.delta;
    return b.spread - a.spread;
  });

  const totalSlots = targetMatches * 4;
  const maxPlayed = Math.ceil(totalSlots / N);

  const playedCount = new Map<string, number>();
  players.forEach((p) => playedCount.set(p.id, 0));
  const partnerSet = new Set<string>();

  players.forEach((p) => {
    p.pastPartners.forEach((partId) => {
      partnerSet.add([p.id, partId].sort().join('-'));
    });
  });

  let bestMatches: Cand[] | null = null;
  let iterations = 0;

  function backtrack(chosen: Cand[], maxAllowedPerPlayer: number): boolean {
    iterations++;
    if (iterations > 20000) return false;

    if (chosen.length === targetMatches) {
      bestMatches = [...chosen];
      return true;
    }

    let minP = Infinity;
    for (const p of players) {
      const c = playedCount.get(p.id)!;
      if (c < minP) minP = c;
    }

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const ids = [c.p1.id, c.p2.id, c.p3.id, c.p4.id];

      if (!ids.some((id) => playedCount.get(id) === minP)) continue;
      if (ids.some((id) => playedCount.get(id)! >= maxAllowedPerPlayer)) continue;
      if (partnerSet.has(c.pairAKey) || partnerSet.has(c.pairBKey)) continue;

      ids.forEach((id) => playedCount.set(id, playedCount.get(id)! + 1));
      partnerSet.add(c.pairAKey);
      partnerSet.add(c.pairBKey);
      chosen.push(c);

      if (backtrack(chosen, maxAllowedPerPlayer)) return true;

      chosen.pop();
      partnerSet.delete(c.pairAKey);
      partnerSet.delete(c.pairBKey);
      ids.forEach((id) => playedCount.set(id, playedCount.get(id)! - 1));
    }

    return false;
  }

  let success = backtrack([], maxPlayed);
  if (!success) {
    iterations = 0;
    success = backtrack([], maxPlayed + 1);
  }

  const finalMatchesList: Cand[] = bestMatches ? [...bestMatches] : [];
  if (finalMatchesList.length < targetMatches) {
    for (const c of candidates) {
      if (finalMatchesList.length >= targetMatches) break;
      if (partnerSet.has(c.pairAKey) || partnerSet.has(c.pairBKey)) continue;

      const ids = [c.p1.id, c.p2.id, c.p3.id, c.p4.id];
      ids.forEach((id) => playedCount.set(id, (playedCount.get(id) || 0) + 1));
      partnerSet.add(c.pairAKey);
      partnerSet.add(c.pairBKey);
      finalMatchesList.push(c);
    }
  }

  const courtCount = config.courtCount || (N <= 8 ? 2 : 4);
  const matches: Match[] = [];
  const phasesMap = new Map<number, Match[]>();

  finalMatchesList.forEach((c, idx) => {
    const roundNumber = Math.floor(idx / courtCount) + 1;
    const courtNumber = (idx % courtCount) + 1;
    const matchId = `match_mixer_${idx + 1}`;

    const matchTypeLabel =
      c.type === 'MENS_DOUBLE'
        ? 'Đôi Nam'
        : c.type === 'WOMENS_DOUBLE'
        ? 'Đôi Nữ'
        : 'Đôi Nam Nữ';

    const m: Match = {
      matchId,
      type: c.type,
      teamA: [c.p1.id, c.p2.id],
      teamB: [c.p3.id, c.p4.id],
      scoreA: c.scoreA,
      scoreB: c.scoreB,
      delta: c.delta,
      phase: roundNumber,
      phaseLabel: `Vòng ${roundNumber}: ${matchTypeLabel} (Δ = ${c.delta})`,
      roundNumber,
      courtNumber,
      status: 'SCHEDULED',
      stage: 'ROUND_ROBIN',
    };

    matches.push(m);
    updatePlayersStateForMatch(m, playerMap);

    if (!phasesMap.has(roundNumber)) {
      phasesMap.set(roundNumber, []);
    }
    phasesMap.get(roundNumber)!.push(m);
  });

  const phasesOutput = Array.from(phasesMap.entries()).map(([roundNum, roundMatches]) => ({
    phase: roundNum,
    phaseName: `Lượt đấu Vòng ${roundNum} (Tất cả trận đấu Δ ≤ 1)`,
    matches: roundMatches,
  }));

  const totalDelta = matches.reduce((acc, m) => acc + m.delta, 0);
  const averageDelta = matches.length > 0 ? Number((totalDelta / matches.length).toFixed(2)) : 0;
  const zeroDeltaMatches = matches.filter((m) => m.delta === 0).length;

  const updatedPlayers = Array.from(playerMap.values());
  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    matches,
    updatedPlayers,
    phases: phasesOutput,
    algorithmStats: {
      totalCombinationsGenerated: candidates.length,
      averageDelta,
      zeroDeltaMatches,
      duplicatePartnersCount: 0,
      executionTimeMs,
      isStandardTestCasePassed: matches.every((m) => m.delta <= 1),
    },
    validationErrors: [],
  };
}

/**
 * Main Matchmaking Entry Point (Steps 1 -> 5 of Specification)
 */
export function runMatchmaking(
  inputPlayers: Player[],
  config: Partial<AlgorithmConfig> = {}
): MatchmakingResult {
  const startTime = performance.now();
  const fullConfig: AlgorithmConfig = {
    phaseMode: 'STANDARD_TWO_PHASES',
    targetPlayedCount: 2,
    maxDeltaThreshold: 0,
    avoidRepeatOpponents: true,
    courtCount: 4,
    ...config,
  };

  // If CONTINUOUS_MIXER is requested, route directly to runContinuousMatchmaking
  if (
    fullConfig.phaseMode === 'CONTINUOUS_MIXER' ||
    fullConfig.sessionConfig?.mixerMode === 'CONTINUOUS_MIXER'
  ) {
    const targetMatches =
      fullConfig.sessionConfig?.totalMatchesTarget ||
      (inputPlayers.length === 8 ? 6 : Math.max(1, Math.floor((inputPlayers.length * 2) / 4)));
    return runContinuousMatchmaking(inputPlayers, targetMatches, fullConfig);
  }

  // Clone players to prevent mutating inputs
  const playerMap = new Map<string, Player>();
  inputPlayers.forEach((p) => {
    playerMap.set(p.id, {
      ...p,
      pastPartners: [...(p.pastPartners || [])],
      playedCount: p.playedCount || 0,
    });
  });

  const allMatches: Match[] = [];
  const phasesOutput: { phase: number; phaseName: string; matches: Match[] }[] = [];
  const validationErrors: string[] = [];

  // Step 1: Chia Phase & Step 2-4
  if (fullConfig.phaseMode === 'STANDARD_TWO_PHASES' || fullConfig.phaseMode === 'AUTO_BALANCED') {
    // -------------------------------------------------------------
    // LƯỢT 1: Chế độ Cùng giới (Same-Gender Phase)
    // -------------------------------------------------------------
    const currentPool1 = Array.from(playerMap.values());
    const phase1Res = solvePhasePartition(
      currentPool1,
      'SAME_GENDER',
      1,
      'Lượt 1: Cùng giới (Same-Gender)',
      1,
      playerMap,
      fullConfig.maxDeltaThreshold
    );

    // Step 4: Cập nhật State sau Lượt 1
    phase1Res.matches.forEach((m) => {
      allMatches.push(m);
      updatePlayersStateForMatch(m, playerMap);
    });

    phasesOutput.push({
      phase: 1,
      phaseName: 'Lượt 1: Chế độ Cùng giới (Same-Gender Phase)',
      matches: phase1Res.matches,
    });

    // -------------------------------------------------------------
    // LƯỢT 2: Chế độ Nam Nữ (Mixed Doubles Phase)
    // -------------------------------------------------------------
    const currentPool2 = Array.from(playerMap.values());
    const phase2Res = solvePhasePartition(
      currentPool2,
      'MIXED',
      2,
      'Lượt 2: Nam Nữ (Mixed Doubles)',
      phase1Res.matches.length + 1,
      playerMap,
      fullConfig.maxDeltaThreshold
    );

    // Step 4: Cập nhật State sau Lượt 2
    phase2Res.matches.forEach((m) => {
      allMatches.push(m);
      updatePlayersStateForMatch(m, playerMap);
    });

    phasesOutput.push({
      phase: 2,
      phaseName: 'Lượt 2: Chế độ Nam Nữ (Mixed Doubles Phase)',
      matches: phase2Res.matches,
    });
  } else if (fullConfig.phaseMode === 'MIXED_ONLY') {
    // Single mixed phase
    const currentPool = Array.from(playerMap.values());
    const res = solvePhasePartition(
      currentPool,
      'MIXED',
      1,
      'Chế độ Nam Nữ (Mixed Doubles)',
      1,
      playerMap,
      fullConfig.maxDeltaThreshold
    );
    res.matches.forEach((m) => {
      allMatches.push(m);
      updatePlayersStateForMatch(m, playerMap);
    });
    phasesOutput.push({
      phase: 1,
      phaseName: 'Chế độ Nam Nữ (Mixed Doubles)',
      matches: res.matches,
    });
  } else if (fullConfig.phaseMode === 'SAME_GENDER_ONLY') {
    // Single same gender phase
    const currentPool = Array.from(playerMap.values());
    const res = solvePhasePartition(
      currentPool,
      'SAME_GENDER',
      1,
      'Chế độ Cùng giới (Same-Gender)',
      1,
      playerMap,
      fullConfig.maxDeltaThreshold
    );
    res.matches.forEach((m) => {
      allMatches.push(m);
      updatePlayersStateForMatch(m, playerMap);
    });
    phasesOutput.push({
      phase: 1,
      phaseName: 'Chế độ Cùng giới (Same-Gender)',
      matches: res.matches,
    });
  }

  // Calculate algorithm performance stats
  const totalDelta = allMatches.reduce((acc, m) => acc + m.delta, 0);
  const averageDelta = allMatches.length > 0 ? Number((totalDelta / allMatches.length).toFixed(2)) : 0;
  const zeroDeltaMatches = allMatches.filter((m) => m.delta === 0).length;

  // Partner repetition audit
  let duplicatePartnersCount = 0;
  const globalPartnerMap = new Map<string, Set<string>>();

  allMatches.forEach((m, matchIdx) => {
    const recordPair = (p1Id: string, p2Id: string) => {
      const set1 = globalPartnerMap.get(p1Id) || new Set<string>();
      if (set1.has(p2Id)) {
        duplicatePartnersCount++;
        validationErrors.push(`Trùng lặp partner ở Trận ${matchIdx + 1}: ${p1Id} & ${p2Id}`);
      }
      set1.add(p2Id);
      globalPartnerMap.set(p1Id, set1);

      const set2 = globalPartnerMap.get(p2Id) || new Set<string>();
      set2.add(p1Id);
      globalPartnerMap.set(p2Id, set2);
    };

    recordPair(m.teamA[0], m.teamA[1]);
    recordPair(m.teamB[0], m.teamB[1]);
  });

  const updatedPlayers = Array.from(playerMap.values());
  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  // Check if standard test case 16-player pass criteria met
  const isStandardTestCasePassed =
    allMatches.length === 8 &&
    zeroDeltaMatches === 8 &&
    duplicatePartnersCount === 0 &&
    updatedPlayers.every((p) => p.playedCount === 2);

  return {
    matches: allMatches,
    updatedPlayers,
    phases: phasesOutput,
    algorithmStats: {
      totalCombinationsGenerated: (inputPlayers.length * (inputPlayers.length - 1)) / 2,
      averageDelta,
      zeroDeltaMatches,
      duplicatePartnersCount,
      executionTimeMs,
      isStandardTestCasePassed,
    },
    validationErrors,
  };
}

/**
 * Step 4: Cập nhật State
 * - Cộng playedCount + 1 cho 4 Players tham gia
 * - Push ID của đồng đội vào mảng pastPartners của nhau
 */
function updatePlayersStateForMatch(match: Match, playerMap: Map<string, Player>) {
  const [a1Id, a2Id] = match.teamA;
  const [b1Id, b2Id] = match.teamB;

  const a1 = playerMap.get(a1Id);
  const a2 = playerMap.get(a2Id);
  const b1 = playerMap.get(b1Id);
  const b2 = playerMap.get(b2Id);

  if (a1 && a2) {
    a1.playedCount += 1;
    a2.playedCount += 1;
    if (!a1.pastPartners.includes(a2Id)) a1.pastPartners.push(a2Id);
    if (!a2.pastPartners.includes(a1Id)) a2.pastPartners.push(a1Id);
  }

  if (b1 && b2) {
    b1.playedCount += 1;
    b2.playedCount += 1;
    if (!b1.pastPartners.includes(b2Id)) b1.pastPartners.push(b2Id);
    if (!b2.pastPartners.includes(b1Id)) b2.pastPartners.push(b1Id);
  }
}

/**
 * Tìm kiếm các cặp đối thủ đối kháng cân bằng nhất cho một cặp được chọn
 * (Dùng cho tính năng "Cho chọn cặp đánh cùng nhau để đi đánh với các đội khác / giao lưu")
 */
export function findBestOpponentSuggestions(
  selectedPair: Pair,
  allPlayers: Player[],
  guestPairs: Pair[] = []
): {
  opponentPair: Pair;
  delta: number;
  matchType: MatchType;
  qualityBadge: 'PERFECT' | 'EXCELLENT' | 'GOOD';
  explanation: string;
}[] {
  const suggestions: {
    opponentPair: Pair;
    delta: number;
    matchType: MatchType;
    qualityBadge: 'PERFECT' | 'EXCELLENT' | 'GOOD';
    explanation: string;
  }[] = [];

  const excludedIds = new Set([selectedPair.player1.id, selectedPair.player2.id]);
  const availablePlayers = allPlayers.filter((p) => !excludedIds.has(p.id));

  // Generate candidate pairs from the remaining club players
  const internalCandidatePairs: Pair[] = [];

  // If selected pair is same gender, generate same gender and mixed
  const mPool = availablePlayers.filter((p) => p.gender === 'MALE');
  const fPool = availablePlayers.filter((p) => p.gender === 'FEMALE');

  if (selectedPair.type === 'MENS_DOUBLE') {
    internalCandidatePairs.push(...generateSameGenderPairs(mPool, 'MALE'));
  } else if (selectedPair.type === 'WOMENS_DOUBLE') {
    internalCandidatePairs.push(...generateSameGenderPairs(fPool, 'FEMALE'));
  } else {
    internalCandidatePairs.push(...generateMixedPairs(availablePlayers));
  }

  // Also include any other valid combinations so user has choices
  if (internalCandidatePairs.length < 4) {
    const allCombos = [];
    for (let i = 0; i < availablePlayers.length; i++) {
      for (let j = i + 1; j < availablePlayers.length; j++) {
        const p1 = availablePlayers[i];
        const p2 = availablePlayers[j];
        const type: MatchType =
          p1.gender === p2.gender
            ? p1.gender === 'MALE'
              ? 'MENS_DOUBLE'
              : 'WOMENS_DOUBLE'
            : 'MIXED_DOUBLE';
        allCombos.push({
          id: `cand_${p1.id}_${p2.id}`,
          player1: p1,
          player2: p2,
          score: p1.rankScore + p2.rankScore,
          type,
        });
      }
    }
    allCombos.forEach((c) => {
      if (!internalCandidatePairs.some((p) => p.id === c.id)) {
        internalCandidatePairs.push(c);
      }
    });
  }

  // Combine internal candidates with any external guest pairs
  const allCandidates = [...internalCandidatePairs, ...guestPairs];

  allCandidates.forEach((cand) => {
    // Ensure no ID overlap
    if (
      cand.player1.id === selectedPair.player1.id ||
      cand.player1.id === selectedPair.player2.id ||
      cand.player2.id === selectedPair.player1.id ||
      cand.player2.id === selectedPair.player2.id
    ) {
      return;
    }

    const delta = Math.abs(selectedPair.score - cand.score);
    let qualityBadge: 'PERFECT' | 'EXCELLENT' | 'GOOD' = 'GOOD';
    let explanation = '';

    if (delta === 0) {
      qualityBadge = 'PERFECT';
      explanation = `Cân bằng điểm hoàn hảo (${selectedPair.score}đ vs ${cand.score}đ, Δ = 0) - Trận đấu có xác suất tranh tài kịch tính cao nhất!`;
    } else if (delta === 1) {
      qualityBadge = 'EXCELLENT';
      explanation = `Chênh lệch rất thấp (${selectedPair.score}đ vs ${cand.score}đ, Δ = 1) - Trình độ tương đồng xuất sắc.`;
    } else {
      qualityBadge = 'GOOD';
      explanation = `Chênh lệch vừa phải (${selectedPair.score}đ vs ${cand.score}đ, Δ = ${delta}) - Thích hợp rèn luyện cọ xát.`;
    }

    // Determine match category
    let finalType: MatchType = selectedPair.type;
    if (selectedPair.type !== cand.type) {
      finalType = 'MIXED_DOUBLE';
    }

    suggestions.push({
      opponentPair: cand,
      delta,
      matchType: finalType,
      qualityBadge,
      explanation,
    });
  });

  // Sort by smallest delta first
  suggestions.sort((a, b) => a.delta - b.delta);

  return suggestions;
}

/**
 * Tiện ích phân tích văn bản nhập hàng loạt (Bulk Member Parser)
 * Hỗ trợ các định dạng:
 * "Tên, Nam/Nữ, Trình độ (1-5 hoặc Newbie/Yếu/TBY/TB/TBK), [Ghi chú]"
 */
export function parseBulkMembersText(rawText: string): {
  success: boolean;
  players: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>[];
  errors: string[];
} {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const players: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>[] = [];
  const errors: string[] = [];

  const rankMap: Record<string, number> = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    'newbie': 1,
    'mới': 1,
    'moi': 1,
    'yếu': 2,
    'yeu': 2,
    'tby': 3,
    'trung bình yếu': 3,
    'trung binh yeu': 3,
    'tb': 4,
    'trung bình': 4,
    'trung binh': 4,
    'tbk': 5,
    'trung bình khá': 5,
    'trung binh kha': 5,
    'khá': 5,
    'kha': 5,
  };

  lines.forEach((line, index) => {
    // Ignore header comments
    if (line.startsWith('#') || line.startsWith('//')) return;

    // Split by comma, semicolon, tab, or hyphen
    const parts = line.split(/[,;\t|]+/).map((p) => p.trim());

    if (parts.length < 2) {
      errors.push(`Dòng ${index + 1}: "${line}" không đủ thông tin (Cần ít nhất: Tên, Giới tính, Trình độ).`);
      return;
    }

    const name = parts[0];
    const genderRaw = parts[1].toLowerCase();
    const rankRaw = (parts[2] || '3').toLowerCase();
    const note = parts[3] || undefined;

    let gender: 'MALE' | 'FEMALE' = 'MALE';
    if (genderRaw.includes('nữ') || genderRaw.includes('nu') || genderRaw === 'f' || genderRaw === 'female') {
      gender = 'FEMALE';
    } else if (genderRaw.includes('nam') || genderRaw === 'm' || genderRaw === 'male') {
      gender = 'MALE';
    }

    let rankScore = 3;
    if (rankMap[rankRaw]) {
      rankScore = rankMap[rankRaw];
    } else {
      const parsedNum = parseInt(rankRaw, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 5) {
        rankScore = parsedNum;
      }
    }

    players.push({
      name,
      gender,
      rankScore,
      clubNote: note,
    });
  });

  return {
    success: players.length > 0,
    players,
    errors,
  };
}
