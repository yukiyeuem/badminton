import { Match, Player, MatchType } from '../types/badminton';

export interface PlayerSetMatchDetail {
  matchId: string;
  matchIndex: number;
  phase: number;
  phaseLabel: string;
  type: MatchType;
  courtNumber?: number;
  partner?: Player;
  partnerId?: string;
  opponent1?: Player;
  opponent2?: Player;
  myScore: number;
  opponentScore: number;
  isCompleted: boolean;
  outcome: 'WON' | 'LOST' | 'DRAW' | 'PENDING';
  pointDiff: number;
  delta: number;
}

export interface PlayerSetStats {
  player: Player;
  totalScheduledSets: number;    // Tổng số set được xếp
  completedSets: number;         // Số set đã đánh xong (có điểm chốt)
  remainingSets: number;         // Số set chưa đánh
  wonSets: number;               // Số set thắng
  lostSets: number;              // Số set thua
  drawSets: number;              // Số set hòa
  winRate: number;               // Tỷ lệ thắng % (dựa trên set đã đánh)
  totalPointsScored: number;     // Tổng điểm ghi được
  totalPointsConceded: number;   // Tổng điểm bị thủng lưới
  pointDiff: number;             // Hiệu số điểm
  matchHistory: PlayerSetMatchDetail[];
}

export interface ClubSetStatsSummary {
  totalPlayers: number;
  totalMatches: number;
  totalCompletedMatches: number;
  totalPendingMatches: number;
  completionRate: number;
  mvp?: PlayerSetStats;
  topScorer?: PlayerSetStats;
  playerStatsList: PlayerSetStats[];
}

/**
 * Calculates comprehensive set and match statistics for each player
 */
export function calculatePlayerSetStats(
  players: Player[],
  matches: Match[]
): ClubSetStatsSummary {
  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const playerStatsList: PlayerSetStats[] = players.map((player) => {
    let totalScheduledSets = 0;
    let completedSets = 0;
    let wonSets = 0;
    let lostSets = 0;
    let drawSets = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;
    const matchHistory: PlayerSetMatchDetail[] = [];

    matches.forEach((m, idx) => {
      const inTeamA = m.teamA && (m.teamA[0] === player.id || m.teamA[1] === player.id);
      const inTeamB = m.teamB && (m.teamB[0] === player.id || m.teamB[1] === player.id);

      if (!inTeamA && !inTeamB) return;

      totalScheduledSets += 1;

      const scoreA = m.gameScoreA ?? 0;
      const scoreB = m.gameScoreB ?? 0;
      const isCompleted =
        m.status === 'COMPLETED' ||
        (m.gameScoreA !== undefined && m.gameScoreB !== undefined && (scoreA > 0 || scoreB > 0));

      let myScore = 0;
      let oppScore = 0;
      let partnerId: string | undefined;
      let opp1Id: string | undefined;
      let opp2Id: string | undefined;

      if (inTeamA) {
        myScore = scoreA;
        oppScore = scoreB;
        partnerId = m.teamA[0] === player.id ? m.teamA[1] : m.teamA[0];
        opp1Id = m.teamB[0];
        opp2Id = m.teamB[1];
      } else {
        myScore = scoreB;
        oppScore = scoreA;
        partnerId = m.teamB[0] === player.id ? m.teamB[1] : m.teamB[0];
        opp1Id = m.teamA[0];
        opp2Id = m.teamA[1];
      }

      let outcome: 'WON' | 'LOST' | 'DRAW' | 'PENDING' = 'PENDING';

      if (isCompleted) {
        completedSets += 1;
        totalPointsScored += myScore;
        totalPointsConceded += oppScore;

        if (m.winner) {
          const myTeam = inTeamA ? 'teamA' : 'teamB';
          if (m.winner === myTeam) {
            outcome = 'WON';
            wonSets += 1;
          } else {
            outcome = 'LOST';
            lostSets += 1;
          }
        } else if (myScore > oppScore) {
          outcome = 'WON';
          wonSets += 1;
        } else if (myScore < oppScore) {
          outcome = 'LOST';
          lostSets += 1;
        } else {
          outcome = 'DRAW';
          drawSets += 1;
        }
      }

      matchHistory.push({
        matchId: m.matchId,
        matchIndex: idx + 1,
        phase: m.phase,
        phaseLabel: m.phaseLabel,
        type: m.type,
        courtNumber: m.courtNumber,
        partner: partnerId ? playerMap.get(partnerId) : undefined,
        partnerId,
        opponent1: opp1Id ? playerMap.get(opp1Id) : undefined,
        opponent2: opp2Id ? playerMap.get(opp2Id) : undefined,
        myScore,
        opponentScore: oppScore,
        isCompleted,
        outcome,
        pointDiff: myScore - oppScore,
        delta: m.delta,
      });
    });

    const remainingSets = Math.max(0, totalScheduledSets - completedSets);
    const winRate = completedSets > 0 ? Math.round((wonSets / completedSets) * 1000) / 10 : 0;
    const pointDiff = totalPointsScored - totalPointsConceded;

    return {
      player,
      totalScheduledSets,
      completedSets,
      remainingSets,
      wonSets,
      lostSets,
      drawSets,
      winRate,
      totalPointsScored,
      totalPointsConceded,
      pointDiff,
      matchHistory,
    };
  });

  // Sort initially by: Won sets desc, Win rate desc, Point diff desc, Scheduled sets desc
  playerStatsList.sort((a, b) => {
    if (b.wonSets !== a.wonSets) return b.wonSets - a.wonSets;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.totalScheduledSets - a.totalScheduledSets;
  });

  const totalMatches = matches.length;
  const totalCompletedMatches = matches.filter(
    (m) =>
      m.status === 'COMPLETED' ||
      (m.gameScoreA !== undefined && m.gameScoreB !== undefined && ((m.gameScoreA ?? 0) > 0 || (m.gameScoreB ?? 0) > 0))
  ).length;
  const totalPendingMatches = Math.max(0, totalMatches - totalCompletedMatches);
  const completionRate = totalMatches > 0 ? Math.round((totalCompletedMatches / totalMatches) * 100) : 0;

  // Best MVP: most wins with at least 1 completed set
  const mvpCandidate = [...playerStatsList].filter((p) => p.completedSets > 0)[0];
  // Top Scorer: most points scored
  const topScorerCandidate = [...playerStatsList]
    .filter((p) => p.totalPointsScored > 0)
    .sort((a, b) => b.totalPointsScored - a.totalPointsScored)[0];

  return {
    totalPlayers: players.length,
    totalMatches,
    totalCompletedMatches,
    totalPendingMatches,
    completionRate,
    mvp: mvpCandidate,
    topScorer: topScorerCandidate,
    playerStatsList,
  };
}

/**
 * Formats a clean, readable text report suitable for sharing in club messaging groups (Zalo/Telegram/Facebook)
 */
export function generateClubStatsReportText(summary: ClubSetStatsSummary): string {
  let text = `🏸 BẢNG THỐNG KÊ KẾT QUẢ & SỐ SET ĐẤU CẦU LÔNG 🏸\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👥 Thành viên: ${summary.totalPlayers} | 🏆 Tổng số trận/set: ${summary.totalMatches}\n`;
  text += `✅ Đã chốt điểm: ${summary.totalCompletedMatches} set (${summary.completionRate}%) | ⏳ Còn lại: ${summary.totalPendingMatches} set\n\n`;

  text += `📊 BẢNG XẾP HẠNG THÀNH TÍCH TỪNG CẦU THỦ:\n`;
  summary.playerStatsList.forEach((stat, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    const genderIcon = stat.player.gender === 'MALE' ? '♂' : '♀';
    const diffStr = stat.pointDiff >= 0 ? `+${stat.pointDiff}` : `${stat.pointDiff}`;
    text += `${medal} ${stat.player.name} (${genderIcon}): ${stat.completedSets}/${stat.totalScheduledSets} set | Thắng ${stat.wonSets} - Thua ${stat.lostSets} (${stat.winRate}%) | Hiệu số: ${diffStr}đ (${stat.totalPointsScored}-${stat.totalPointsConceded})\n`;
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏸 Tạo bởi Badminton Matchmaker • Thuật toán Delta ≤ 1`;
  return text;
}
