import { Match, Player, MatchStage, MatchType } from '../types/badminton';

export interface PlayoffSlotInfo {
  matchId: string;
  matchIndex: number;
  label: string;
  condition: 'WINNER' | 'LOSER';
  resolvedTeam?: [string, string];
  resolvedTeamName?: string;
  isReady: boolean;
}

/**
 * Tạo danh sách các trận phân nhánh tiếp theo dựa trên kết quả các trận trước đó
 * (Theo yêu cầu: Thắng gặp Thắng, Thua gặp Thua hoặc mở rộng số trận trong buổi)
 */
export function generatePlayoffMatches(
  baseMatches: Match[],
  extraMatchCount: number,
  allPlayers: Player[]
): Match[] {
  if (extraMatchCount <= 0 || baseMatches.length < 2) return [];

  const playerMap = new Map<string, Player>();
  allPlayers.forEach((p) => playerMap.set(p.id, p));

  const playoffMatches: Match[] = [];
  const startIdx = baseMatches.length;

  // Pair up compatible earlier matches (e.g. Mens with Mens, Womens with Womens, Mix with Mix)
  // Standard 16 player test case has:
  // Trận 1 & 2: Womens Double
  // Trận 3 & 4: Mens Double
  // Trận 5 & 6: Mixed Double
  // Trận 7 & 8: Mixed Double
  const candidatePairs: {
    matchA: Match;
    matchB: Match;
    type: MatchType;
    label: string;
  }[] = [];

  // Group base matches by type
  const womens = baseMatches.filter((m) => m.type === 'WOMENS_DOUBLE');
  const mens = baseMatches.filter((m) => m.type === 'MENS_DOUBLE');
  const mixed = baseMatches.filter((m) => m.type === 'MIXED_DOUBLE');

  // Mens pairs
  for (let i = 0; i < mens.length - 1; i += 2) {
    candidatePairs.push({
      matchA: mens[i],
      matchB: mens[i + 1],
      type: 'MENS_DOUBLE',
      label: 'Đôi Nam',
    });
  }

  // Womens pairs
  for (let i = 0; i < womens.length - 1; i += 2) {
    candidatePairs.push({
      matchA: womens[i],
      matchB: womens[i + 1],
      type: 'WOMENS_DOUBLE',
      label: 'Đôi Nữ',
    });
  }

  // Mixed pairs
  for (let i = 0; i < mixed.length - 1; i += 2) {
    candidatePairs.push({
      matchA: mixed[i],
      matchB: mixed[i + 1],
      type: 'MIXED_DOUBLE',
      label: 'Đôi Nam Nữ',
    });
  }

  // If no same-type pairs found, just pair sequential matches
  if (candidatePairs.length === 0) {
    for (let i = 0; i < baseMatches.length - 1; i += 2) {
      candidatePairs.push({
        matchA: baseMatches[i],
        matchB: baseMatches[i + 1],
        type: baseMatches[i].type,
        label: 'Giao Lưu',
      });
    }
  }

  let createdCount = 0;

  // Generate Winner vs Winner matches first
  for (const pair of candidatePairs) {
    if (createdCount >= extraMatchCount) break;

    const idxA = baseMatches.findIndex((m) => m.matchId === pair.matchA.matchId) + 1;
    const idxB = baseMatches.findIndex((m) => m.matchId === pair.matchB.matchId) + 1;

    const winnerMatchId = `playoff_win_${createdCount + 1}`;
    const newMatch: Match = {
      matchId: winnerMatchId,
      type: pair.type,
      teamA: getResolvedTeamFromMatch(pair.matchA, 'WINNER') || ['', ''],
      teamB: getResolvedTeamFromMatch(pair.matchB, 'WINNER') || ['', ''],
      scoreA: 0,
      scoreB: 0,
      delta: 0,
      phase: 3,
      phaseLabel: 'Lượt 3: Vòng Phân Hạng (Thắng gặp Thắng)',
      roundNumber: 3,
      courtNumber: ((startIdx + createdCount) % 4) + 1,
      status: 'SCHEDULED',
      stage: 'WINNER_BRACKET',
      notes: `Trận phân hạng nhánh Thắng: Đội thắng Trận #${idxA} vs Đội thắng Trận #${idxB}`,
      sourceMatchA: {
        matchId: pair.matchA.matchId,
        matchIndex: idxA,
        matchLabel: `Thắng Trận #${idxA}`,
        condition: 'WINNER',
      },
      sourceMatchB: {
        matchId: pair.matchB.matchId,
        matchIndex: idxB,
        matchLabel: `Thắng Trận #${idxB}`,
        condition: 'WINNER',
      },
    };

    recalculateMatchDelta(newMatch, playerMap);
    playoffMatches.push(newMatch);
    createdCount++;
  }

  // Generate Loser vs Loser matches next if still need more matches
  for (const pair of candidatePairs) {
    if (createdCount >= extraMatchCount) break;

    const idxA = baseMatches.findIndex((m) => m.matchId === pair.matchA.matchId) + 1;
    const idxB = baseMatches.findIndex((m) => m.matchId === pair.matchB.matchId) + 1;

    const loserMatchId = `playoff_lose_${createdCount + 1}`;
    const newMatch: Match = {
      matchId: loserMatchId,
      type: pair.type,
      teamA: getResolvedTeamFromMatch(pair.matchA, 'LOSER') || ['', ''],
      teamB: getResolvedTeamFromMatch(pair.matchB, 'LOSER') || ['', ''],
      scoreA: 0,
      scoreB: 0,
      delta: 0,
      phase: 3,
      phaseLabel: 'Lượt 3: Vòng Phân Hạng (Thua gặp Thua / Tranh Hạng Ba)',
      roundNumber: 3,
      courtNumber: ((startIdx + createdCount) % 4) + 1,
      status: 'SCHEDULED',
      stage: 'LOSER_BRACKET',
      notes: `Trận phân hạng nhánh Thua: Đội thua Trận #${idxA} vs Đội thua Trận #${idxB}`,
      sourceMatchA: {
        matchId: pair.matchA.matchId,
        matchIndex: idxA,
        matchLabel: `Thua Trận #${idxA}`,
        condition: 'LOSER',
      },
      sourceMatchB: {
        matchId: pair.matchB.matchId,
        matchIndex: idxB,
        matchLabel: `Thua Trận #${idxB}`,
        condition: 'LOSER',
      },
    };

    recalculateMatchDelta(newMatch, playerMap);
    playoffMatches.push(newMatch);
    createdCount++;
  }

  return playoffMatches;
}

/**
 * Lấy ra 2 người chơi của đội Thắng hoặc đội Thua từ một trận đấu đã có tỷ số
 */
export function getResolvedTeamFromMatch(
  match: Match,
  condition: 'WINNER' | 'LOSER'
): [string, string] | null {
  const gA = match.gameScoreA ?? 0;
  const gB = match.gameScoreB ?? 0;

  // If status is completed or points entered
  if (match.status === 'COMPLETED' || gA !== gB) {
    const isTeamAWinner = match.winner === 'teamA' || gA > gB;
    if (condition === 'WINNER') {
      return isTeamAWinner ? match.teamA : match.teamB;
    } else {
      return isTeamAWinner ? match.teamB : match.teamA;
    }
  }

  // Not finished yet
  return null;
}

/**
 * Cập nhật động toàn bộ các trận Playoff dựa trên tỷ số mới nhất của các trận trước
 */
export function syncPlayoffMatchesWithResults(
  allMatches: Match[],
  playerMap: Map<string, Player>
): Match[] {
  const matchLookup = new Map<string, Match>();
  allMatches.forEach((m) => matchLookup.set(m.matchId, m));

  return allMatches.map((m) => {
    if (!m.sourceMatchA && !m.sourceMatchB) return m;

    const updated = { ...m };
    let changed = false;

    if (m.sourceMatchA) {
      const parentA = matchLookup.get(m.sourceMatchA.matchId);
      if (parentA) {
        const resolvedA = getResolvedTeamFromMatch(parentA, m.sourceMatchA.condition);
        if (resolvedA && (updated.teamA[0] !== resolvedA[0] || updated.teamA[1] !== resolvedA[1])) {
          updated.teamA = resolvedA;
          changed = true;
        }
      }
    }

    if (m.sourceMatchB) {
      const parentB = matchLookup.get(m.sourceMatchB.matchId);
      if (parentB) {
        const resolvedB = getResolvedTeamFromMatch(parentB, m.sourceMatchB.condition);
        if (resolvedB && (updated.teamB[0] !== resolvedB[0] || updated.teamB[1] !== resolvedB[1])) {
          updated.teamB = resolvedB;
          changed = true;
        }
      }
    }

    if (changed) {
      recalculateMatchDelta(updated, playerMap);
    }

    return updated;
  });
}

function recalculateMatchDelta(match: Match, playerMap: Map<string, Player>) {
  const pA1 = playerMap.get(match.teamA[0]);
  const pA2 = playerMap.get(match.teamA[1]);
  const pB1 = playerMap.get(match.teamB[0]);
  const pB2 = playerMap.get(match.teamB[1]);

  const scoreA = (pA1?.rankScore || 0) + (pA2?.rankScore || 0);
  const scoreB = (pB1?.rankScore || 0) + (pB2?.rankScore || 0);

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.delta = Math.abs(scoreA - scoreB);
}
