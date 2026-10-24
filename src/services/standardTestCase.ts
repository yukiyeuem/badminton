import { Player, Match } from '../types/badminton';

/**
 * Section 4: Test Case Tiêu chuẩn (16 người - 8 Trận) from spec
 * Nam (8): 2 TBK (5đ), 4 TBY (3đ), 2 Yếu (2đ)
 * Nữ (8): 2 TBY (3đ), 4 Yếu (2đ), 2 Newbie (1đ)
 */
export function createStandardTestPlayers(): Player[] {
  return [
    // 8 Nam
    {
      id: 'M_TBK_1',
      name: 'Nam TBK (1)',
      gender: 'MALE',
      rankScore: 5,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Tay vợt công lưới tốt, đập cầu uy lực',
    },
    {
      id: 'M_TBK_2',
      name: 'Nam TBK (2)',
      gender: 'MALE',
      rankScore: 5,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Thể lực dồi dào, điều cầu góc sân',
    },
    {
      id: 'M_TBY_1',
      name: 'Nam TBY (1)',
      gender: 'MALE',
      rankScore: 3,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Kỹ thuật cơ bản ổn định',
    },
    {
      id: 'M_TBY_2',
      name: 'Nam TBY (2)',
      gender: 'MALE',
      rankScore: 3,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Phản tạt nhanh, thủ cầu khá',
    },
    {
      id: 'M_TBY_3',
      name: 'Nam TBY (3)',
      gender: 'MALE',
      rankScore: 3,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Giao cầu chắc chắn, nhãn quan tốt',
    },
    {
      id: 'M_TBY_4',
      name: 'Nam TBY (4)',
      gender: 'MALE',
      rankScore: 3,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Bọc lót sân sau nhiệt huyết',
    },
    {
      id: 'M_YEU_1',
      name: 'Nam Yếu (1)',
      gender: 'MALE',
      rankScore: 2,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Mới tập chơi được vài tháng',
    },
    {
      id: 'M_YEU_2',
      name: 'Nam Yếu (2)',
      gender: 'MALE',
      rankScore: 2,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Đang rèn luyện bước di chuyển',
    },

    // 8 Nữ
    {
      id: 'F_TBY_1',
      name: 'Nữ TBY (1)',
      gender: 'FEMALE',
      rankScore: 3,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Bắt lưới nhanh, phản xạ tốt',
    },
    {
      id: 'F_TBY_2',
      name: 'Nữ TBY (2)',
      gender: 'FEMALE',
      rankScore: 3,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Kê cầu tinh tế, bỏ nhỏ chuẩn',
    },
    {
      id: 'F_YEU_1',
      name: 'Nữ Yếu (1)',
      gender: 'FEMALE',
      rankScore: 2,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Giao cầu tốt, đang tập lùi sân',
    },
    {
      id: 'F_YEU_2',
      name: 'Nữ Yếu (2)',
      gender: 'FEMALE',
      rankScore: 2,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Nhiệt tình chạy cầu khắp sân',
    },
    {
      id: 'F_YEU_3',
      name: 'Nữ Yếu (3)',
      gender: 'FEMALE',
      rankScore: 2,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Thích hợp đánh lưới đôi nam nữ',
    },
    {
      id: 'F_YEU_4',
      name: 'Nữ Yếu (4)',
      gender: 'FEMALE',
      rankScore: 2,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Có tiến bộ vượt bậc tuần qua',
    },
    {
      id: 'F_NEW_1',
      name: 'Nữ Newbie (1)',
      gender: 'FEMALE',
      rankScore: 1,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Mới làm quen vợt và luật sân',
    },
    {
      id: 'F_NEW_2',
      name: 'Nữ Newbie (2)',
      gender: 'FEMALE',
      rankScore: 1,
      playedCount: 0,
      pastPartners: [],
      clubNote: 'Người mới tham gia buổi đầu tiên',
    },
  ];
}

/**
 * Expected 8 matches as specified in Section 4.3 of the spec:
 */
export const EXPECTED_SPEC_MATCHES: {
  matchIndex: number;
  phase: number;
  type: string;
  expectedScoreA: number;
  expectedScoreB: number;
  expectedDelta: number;
  description: string;
}[] = [
  {
    matchIndex: 1,
    phase: 1,
    type: 'WOMENS_DOUBLE',
    expectedScoreA: 4,
    expectedScoreB: 4,
    expectedDelta: 0,
    description: 'Trận 1 (Đôi Nữ | 4đ vs 4đ): Nữ TBY (1) + Nữ Newbie (1) vs Nữ TBY (2) + Nữ Newbie (2)',
  },
  {
    matchIndex: 2,
    phase: 1,
    type: 'WOMENS_DOUBLE',
    expectedScoreA: 4,
    expectedScoreB: 4,
    expectedDelta: 0,
    description: 'Trận 2 (Đôi Nữ | 4đ vs 4đ): Nữ Yếu (1) + Nữ Yếu (2) vs Nữ Yếu (3) + Nữ Yếu (4)',
  },
  {
    matchIndex: 3,
    phase: 1,
    type: 'MENS_DOUBLE',
    expectedScoreA: 7,
    expectedScoreB: 7,
    expectedDelta: 0,
    description: 'Trận 3 (Đôi Nam | 7đ vs 7đ): Nam TBK (1) + Nam Yếu (1) vs Nam TBK (2) + Nam Yếu (2)',
  },
  {
    matchIndex: 4,
    phase: 1,
    type: 'MENS_DOUBLE',
    expectedScoreA: 6,
    expectedScoreB: 6,
    expectedDelta: 0,
    description: 'Trận 4 (Đôi Nam | 6đ vs 6đ): Nam TBY (1) + Nam TBY (2) vs Nam TBY (3) + Nam TBY (4)',
  },
  {
    matchIndex: 5,
    phase: 2,
    type: 'MIXED_DOUBLE',
    expectedScoreA: 6,
    expectedScoreB: 6,
    expectedDelta: 0,
    description: 'Trận 5 (Mix | 6đ vs 6đ): Nam TBK (1) + Nữ Newbie (1) vs Nam TBK (2) + Nữ Newbie (2)',
  },
  {
    matchIndex: 6,
    phase: 2,
    type: 'MIXED_DOUBLE',
    expectedScoreA: 5,
    expectedScoreB: 5,
    expectedDelta: 0,
    description: 'Trận 6 (Mix | 5đ vs 5đ): Nam TBY (1) + Nữ Yếu (1) vs Nam TBY (2) + Nữ Yếu (2)',
  },
  {
    matchIndex: 7,
    phase: 2,
    type: 'MIXED_DOUBLE',
    expectedScoreA: 5,
    expectedScoreB: 5,
    expectedDelta: 0,
    description: 'Trận 7 (Mix | 5đ vs 5đ): Nam TBY (3) + Nữ Yếu (3) vs Nam TBY (4) + Nữ Yếu (4)',
  },
  {
    matchIndex: 8,
    phase: 2,
    type: 'MIXED_DOUBLE',
    expectedScoreA: 5,
    expectedScoreB: 5,
    expectedDelta: 0,
    description: 'Trận 8 (Mix | 5đ vs 5đ): Nam Yếu (1) + Nữ TBY (1) vs Nam Yếu (2) + Nữ TBY (2)',
  },
];

export interface ValidationSummary {
  passed: boolean;
  totalMatches: number;
  zeroDeltaCount: number;
  maxDelta: number;
  duplicatePartnersFound: number;
  allPlayersPlayedExactCount: boolean;
  expectedPlayedCount: number;
  details: string[];
}

export function validateMatchesStrict(matches: Match[], players: Player[]): ValidationSummary {
  const details: string[] = [];
  let zeroDeltaCount = 0;
  let maxDelta = 0;

  matches.forEach((m, idx) => {
    if (m.delta === 0) {
      zeroDeltaCount++;
    }
    if (m.delta > maxDelta) {
      maxDelta = m.delta;
    }
    details.push(`Trận ${idx + 1} (${m.type}): Team A (${m.scoreA}đ) vs Team B (${m.scoreB}đ) -> Delta = ${m.delta}`);
  });

  // Check duplicate partners across all matches
  let duplicatePartnersFound = 0;
  const partnerMap = new Map<string, Set<string>>();

  matches.forEach((m, matchIdx) => {
    const checkPair = (p1: string, p2: string, teamLabel: string) => {
      const set1 = partnerMap.get(p1) || new Set<string>();
      if (set1.has(p2)) {
        duplicatePartnersFound++;
        details.push(`[CẢNH BÁO] Trùng partner ở Trận ${matchIdx + 1} (${teamLabel}): ${p1} & ${p2} đã từng đánh cùng trước đó!`);
      }
      set1.add(p2);
      partnerMap.set(p1, set1);

      const set2 = partnerMap.get(p2) || new Set<string>();
      set2.add(p1);
      partnerMap.set(p2, set2);
    };

    checkPair(m.teamA[0], m.teamA[1], 'Team A');
    checkPair(m.teamB[0], m.teamB[1], 'Team B');
  });

  // Check player count
  const playCounts = new Map<string, number>();
  players.forEach((p) => playCounts.set(p.id, 0));
  matches.forEach((m) => {
    [...m.teamA, ...m.teamB].forEach((id) => {
      playCounts.set(id, (playCounts.get(id) || 0) + 1);
    });
  });

  let allPlayersPlayedExactCount = true;
  const expectedCount = matches.length > 0 ? (matches.length * 4) / (players.length || 1) : 0;
  playCounts.forEach((count, id) => {
    if (count !== Math.round(expectedCount)) {
      allPlayersPlayedExactCount = false;
    }
  });

  const passed =
    maxDelta === 0 &&
    duplicatePartnersFound === 0 &&
    allPlayersPlayedExactCount &&
    matches.length === 8;

  return {
    passed,
    totalMatches: matches.length,
    zeroDeltaCount,
    maxDelta,
    duplicatePartnersFound,
    allPlayersPlayedExactCount,
    expectedPlayedCount: Math.round(expectedCount),
    details,
  };
}
