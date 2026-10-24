/**
 * Data models and types for the Badminton Matchmaking Algorithm
 * Based on: TÀI LIỆU ĐẶC TẢ TÍNH NĂNG XẾP TRẬN CẦU LÔNG
 */

export type Gender = 'MALE' | 'FEMALE';

export type RankKey = 'NEWBIE' | 'YEU' | 'TBY' | 'TB' | 'TBK';

export interface RankDefinition {
  key: RankKey;
  label: string;
  shortLabel: string;
  score: number;
  color: string;
  bgLight: string;
  borderLight: string;
}

export const RANK_DEFINITIONS: Record<RankKey, RankDefinition> = {
  NEWBIE: {
    key: 'NEWBIE',
    label: 'Newbie (Mới chơi)',
    shortLabel: 'Newbie',
    score: 1,
    color: '#94a3b8', // slate-400
    bgLight: 'rgba(148, 163, 184, 0.15)',
    borderLight: 'rgba(148, 163, 184, 0.3)',
  },
  YEU: {
    key: 'YEU',
    label: 'Yếu',
    shortLabel: 'Yếu',
    score: 2,
    color: '#38bdf8', // sky-400
    bgLight: 'rgba(56, 189, 248, 0.15)',
    borderLight: 'rgba(56, 189, 248, 0.3)',
  },
  TBY: {
    key: 'TBY',
    label: 'Trung bình yếu (TBY)',
    shortLabel: 'TBY',
    score: 3,
    color: '#facc15', // yellow-400
    bgLight: 'rgba(250, 204, 21, 0.15)',
    borderLight: 'rgba(250, 204, 21, 0.3)',
  },
  TB: {
    key: 'TB',
    label: 'Trung bình (TB)',
    shortLabel: 'TB',
    score: 4,
    color: '#fb923c', // orange-400
    bgLight: 'rgba(251, 146, 60, 0.15)',
    borderLight: 'rgba(251, 146, 60, 0.3)',
  },
  TBK: {
    key: 'TBK',
    label: 'Trung bình khá (TBK)',
    shortLabel: 'TBK',
    score: 5,
    color: '#10b981', // emerald-500
    bgLight: 'rgba(16, 185, 129, 0.15)',
    borderLight: 'rgba(16, 185, 129, 0.3)',
  },
};

export function getRankDefinitionByScore(score: number): RankDefinition {
  const found = Object.values(RANK_DEFINITIONS).find((r) => r.score === score);
  if (found) return found;
  if (score <= 1) return RANK_DEFINITIONS.NEWBIE;
  if (score === 2) return RANK_DEFINITIONS.YEU;
  if (score === 3) return RANK_DEFINITIONS.TBY;
  if (score === 4) return RANK_DEFINITIONS.TB;
  return RANK_DEFINITIONS.TBK;
}

/**
 * 3.1. Player Object (from spec)
 */
export interface Player {
  id: string;
  name: string;
  gender: Gender;
  rankScore: number; // 1, 2, 3, 4, 5
  playedCount: number; // Default 0
  pastPartners: string[]; // IDs of players they have partnered with
  avatarSeed?: string;
  clubNote?: string;
}

/**
 * Intermediate pair representing 2 players teamed up
 */
export interface Pair {
  id: string;
  player1: Player;
  player2: Player;
  score: number; // player1.rankScore + player2.rankScore
  type: MatchType;
}

/**
 * 3.2. Match Object (from spec)
 */
export type MatchType = 'MENS_DOUBLE' | 'WOMENS_DOUBLE' | 'MIXED_DOUBLE';
export type MatchStage = 'ROUND_ROBIN' | 'WINNER_BRACKET' | 'LOSER_BRACKET' | 'CHALLENGE' | 'CUSTOM';

export interface Match {
  matchId: string;
  type: MatchType;
  teamA: [string, string]; // [playerId1, playerId2]
  teamB: [string, string]; // [playerId3, playerId4]
  delta: number; // |TotalA - TotalB|
  scoreA: number;
  scoreB: number;
  phase: 1 | 2 | 3 | 4 | number;
  phaseLabel: string;
  roundNumber: number;
  courtNumber?: number;
  status: 'SCHEDULED' | 'PLAYING' | 'COMPLETED';
  gameScoreA?: number;
  gameScoreB?: number;
  winner?: 'teamA' | 'teamB';
  notes?: string;
  stage?: MatchStage;
  // Dynamic progression tracking:
  sourceMatchA?: {
    matchId: string;
    matchIndex: number;
    matchLabel: string;
    condition: 'WINNER' | 'LOSER';
  };
  sourceMatchB?: {
    matchId: string;
    matchIndex: number;
    matchLabel: string;
    condition: 'WINNER' | 'LOSER';
  };
}

export interface MatchmakingResult {
  matches: Match[];
  updatedPlayers: Player[];
  phases: {
    phase: number;
    phaseName: string;
    matches: Match[];
  }[];
  algorithmStats: {
    totalCombinationsGenerated: number;
    averageDelta: number;
    zeroDeltaMatches: number;
    duplicatePartnersCount: number;
    executionTimeMs: number;
    isStandardTestCasePassed: boolean;
  };
  validationErrors: string[];
}

export interface LockedPair {
  id: string;
  name: string;
  player1Id: string;
  player2Id: string;
  clubOrTeamName?: string;
  isGuestTeam?: boolean;
}

export interface OpponentMatchSuggestion {
  opponentPair: Pair;
  delta: number;
  matchType: MatchType;
  qualityBadge: 'PERFECT' | 'EXCELLENT' | 'GOOD';
  explanation: string;
}

export interface SessionConfig {
  sessionTargetMode: 'TARGET_ROUNDS_PER_PLAYER' | 'TARGET_TOTAL_MATCHES';
  roundsPerPlayer: number; // e.g. 2, 3, 4
  totalMatchesTarget: number; // e.g. 8, 10, 12, 16
  enableProgressivePlayoffs: boolean; // Auto-pair winners vs winners, losers vs losers
  playoffMode: 'WINNERS_AND_LOSERS' | 'WINNERS_ONLY';
  courtCount: number;
  maxDeltaThreshold: number;
}

export interface AlgorithmConfig {
  phaseMode: 'STANDARD_TWO_PHASES' | 'MIXED_FIRST' | 'SAME_GENDER_ONLY' | 'MIXED_ONLY' | 'AUTO_BALANCED' | 'PROGRESSIVE_PLAYOFF';
  targetPlayedCount: number;
  maxDeltaThreshold: number; // Usually 0 or 1
  avoidRepeatOpponents: boolean;
  courtCount: number;
  lockedPairs?: LockedPair[];
  sessionConfig?: SessionConfig;
}

