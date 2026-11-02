import React, { useState, useMemo } from 'react';
import {
  Player,
  Pair,
  MatchType,
  Match,
  LockedPair,
  getRankDefinitionByScore,
} from '../types/badminton';
import {
  findBestOpponentSuggestions,
  runContinuousMatchmaking,
} from '../services/matchmakingAlgorithm';
import {
  Swords,
  Users,
  Shield,
  Sparkles,
  Trophy,
  CheckCircle2,
  Plus,
  Play,
  ArrowRight,
  Flame,
  Award,
  Zap,
  Lock,
  Unlock,
  Check,
  Calendar,
  Layers,
  HeartHandshake,
  BarChart2,
  Eye,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InterTeamMatchmakerProps {
  players: Player[];
  targetTotalMatches?: number;
  activeLockedPairs?: LockedPair[];
  onScheduleFriendlyMatch: (match: Match) => void;
  onApplyLockedPairSchedule?: (
    matches: Match[],
    updatedPlayers: Player[],
    targetMatches: number,
    lockedPairs: LockedPair[]
  ) => void;
  onClearLockedPairs?: () => void;
}

export const InterTeamMatchmaker: React.FC<InterTeamMatchmakerProps> = ({
  players,
  targetTotalMatches = 10,
  activeLockedPairs = [],
  onScheduleFriendlyMatch,
  onApplyLockedPairSchedule,
  onClearLockedPairs,
}) => {
  // Mode selection: 'LOCKED_SESSION' (Cặp Cố Định Cả Buổi) vs 'FRIENDLY_CHALLENGE' (Giao Lưu Đội Khách / Tự Chọn)
  const [activeSubTab, setActiveSubTab] = useState<'LOCKED_SESSION' | 'FRIENDLY_CHALLENGE'>(
    'LOCKED_SESSION'
  );

  // --- State for Locked Session Mode ---
  // Default to 1st male and 1st female if available (e.g. Nam A + Nữ B)
  const defaultMale = players.find((p) => p.gender === 'MALE');
  const defaultFemale = players.find((p) => p.gender === 'FEMALE');

  const [lockedP1Id, setLockedP1Id] = useState<string>(
    activeLockedPairs[0]?.player1Id || defaultMale?.id || players[0]?.id || ''
  );
  const [lockedP2Id, setLockedP2Id] = useState<string>(
    activeLockedPairs[0]?.player2Id ||
      defaultFemale?.id ||
      players.find((p) => p.id !== lockedP1Id)?.id ||
      players[1]?.id ||
      ''
  );
  const [lockedPairLabel, setLockedPairLabel] = useState<string>(
    activeLockedPairs[0]?.name || ''
  );
  const [sessionMatchTarget, setSessionMatchTarget] = useState<number>(targetTotalMatches);

  // Live simulation of session schedule with the locked pair
  const [simulationResult, setSimulationResult] = useState<{
    matches: Match[];
    updatedPlayers: Player[];
    lockedPairMatchesCount: number;
  } | null>(null);

  // --- State for Single Friendly / Guest Challenge Mode ---
  const [player1Id, setPlayer1Id] = useState<string>(players[0]?.id || '');
  const [player2Id, setPlayer2Id] = useState<string>(players[1]?.id || '');
  const [teamCustomName, setTeamCustomName] = useState<string>('Cặp Đại Diện Nhóm');

  // External guest pairs (đội khách ngoài CLB tới giao lưu)
  const [guestPairs, setGuestPairs] = useState<Pair[]>([
    {
      id: 'guest_pair_1',
      player1: {
        id: 'G_M1',
        name: 'Văn Toàn (CLB Cầu Giấy)',
        gender: 'MALE',
        rankScore: 4,
        playedCount: 0,
        pastPartners: [],
      },
      player2: {
        id: 'G_M2',
        name: 'Minh Quang (CLB Cầu Giấy)',
        gender: 'MALE',
        rankScore: 3,
        playedCount: 0,
        pastPartners: [],
      },
      score: 7,
      type: 'MENS_DOUBLE',
    },
    {
      id: 'guest_pair_2',
      player1: {
        id: 'G_M3',
        name: 'Tuấn Anh (CLB Ba Đình)',
        gender: 'MALE',
        rankScore: 5,
        playedCount: 0,
        pastPartners: [],
      },
      player2: {
        id: 'G_F1',
        name: 'Thanh Thảo (CLB Ba Đình)',
        gender: 'FEMALE',
        rankScore: 2,
        playedCount: 0,
        pastPartners: [],
      },
      score: 7,
      type: 'MIXED_DOUBLE',
    },
    {
      id: 'guest_pair_3',
      player1: {
        id: 'G_M4',
        name: 'Đức Huy (CLB Hà Đông)',
        gender: 'MALE',
        rankScore: 3,
        playedCount: 0,
        pastPartners: [],
      },
      player2: {
        id: 'G_F2',
        name: 'Phương Linh (CLB Hà Đông)',
        gender: 'FEMALE',
        rankScore: 3,
        playedCount: 0,
        pastPartners: [],
      },
      score: 6,
      type: 'MIXED_DOUBLE',
    },
  ]);

  // Form state for creating a new guest team
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName1, setGuestName1] = useState('');
  const [guestGender1, setGuestGender1] = useState<'MALE' | 'FEMALE'>('MALE');
  const [guestRank1, setGuestRank1] = useState(3);
  const [guestName2, setGuestName2] = useState('');
  const [guestGender2, setGuestGender2] = useState<'MALE' | 'FEMALE'>('MALE');
  const [guestRank2, setGuestRank2] = useState(3);
  const [guestClub, setGuestClub] = useState('');

  // Player objects
  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  const lp1 = playerMap.get(lockedP1Id);
  const lp2 = playerMap.get(lockedP2Id);

  // Form the active locked pair
  const activeSelectedLockedPair: Pair | null =
    lp1 && lp2 && lp1.id !== lp2.id
      ? {
          id: `locked_${lp1.id}_${lp2.id}`,
          player1: lp1,
          player2: lp2,
          score: lp1.rankScore + lp2.rankScore,
          type:
            lp1.gender === lp2.gender
              ? lp1.gender === 'MALE'
                ? 'MENS_DOUBLE'
                : 'WOMENS_DOUBLE'
              : 'MIXED_DOUBLE',
        }
      : null;

  // Expected sets per player calculation
  const totalPlayerSlots = sessionMatchTarget * 4;
  const expectedSetsPerPlayer = players.length > 0 ? (totalPlayerSlots / players.length).toFixed(1) : '0';
  const expectedRoundedSets = Math.round(Number(expectedSetsPerPlayer));

  // Count compatible opponent pairs with Delta <= 1
  const compatibleOpponentPairsCount = useMemo(() => {
    if (!activeSelectedLockedPair || players.length < 4) return 0;
    const remaining = players.filter(
      (p) => p.id !== activeSelectedLockedPair.player1.id && p.id !== activeSelectedLockedPair.player2.id
    );
    let count = 0;
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        const score = remaining[i].rankScore + remaining[j].rankScore;
        if (Math.abs(score - activeSelectedLockedPair.score) <= 1) {
          count++;
        }
      }
    }
    return count;
  }, [activeSelectedLockedPair, players]);

  // Generate Simulation
  const handleSimulateLockedSession = () => {
    if (!activeSelectedLockedPair) return;

    const pairLabel =
      lockedPairLabel.trim() || `${activeSelectedLockedPair.player1.name} & ${activeSelectedLockedPair.player2.name}`;

    const configLocked: LockedPair = {
      id: `lp_${Date.now()}`,
      name: pairLabel,
      player1Id: activeSelectedLockedPair.player1.id,
      player2Id: activeSelectedLockedPair.player2.id,
    };

    // Reset played counts for fresh simulation
    const freshPlayers = players.map((p) => ({
      ...p,
      playedCount: 0,
      pastPartners: [],
    }));

    const result = runContinuousMatchmaking(freshPlayers, sessionMatchTarget, {
      lockedPairs: [configLocked],
    });

    const matchesWithPair = result.matches.filter((m) => {
      const inA =
        (m.teamA[0] === configLocked.player1Id && m.teamA[1] === configLocked.player2Id) ||
        (m.teamA[0] === configLocked.player2Id && m.teamA[1] === configLocked.player1Id);
      const inB =
        (m.teamB[0] === configLocked.player1Id && m.teamB[1] === configLocked.player2Id) ||
        (m.teamB[0] === configLocked.player2Id && m.teamB[1] === configLocked.player1Id);
      return inA || inB;
    });

    setSimulationResult({
      matches: result.matches,
      updatedPlayers: result.updatedPlayers,
      lockedPairMatchesCount: matchesWithPair.length,
    });
  };

  // Apply to Main Schedule
  const handleApplyToSchedule = () => {
    if (!simulationResult || !activeSelectedLockedPair) {
      handleSimulateLockedSession();
      return;
    }

    const pairLabel =
      lockedPairLabel.trim() || `${activeSelectedLockedPair.player1.name} & ${activeSelectedLockedPair.player2.name}`;

    const configLocked: LockedPair = {
      id: `lp_${Date.now()}`,
      name: pairLabel,
      player1Id: activeSelectedLockedPair.player1.id,
      player2Id: activeSelectedLockedPair.player2.id,
    };

    if (onApplyLockedPairSchedule) {
      onApplyLockedPairSchedule(
        simulationResult.matches,
        simulationResult.updatedPlayers,
        sessionMatchTarget,
        [configLocked]
      );
    }
  };

  // Friendly match generator for Tab 2
  const p1 = playerMap.get(player1Id);
  const p2 = playerMap.get(player2Id);

  const selectedPair: Pair | null =
    p1 && p2 && p1.id !== p2.id
      ? {
          id: `selected_${p1.id}_${p2.id}`,
          player1: p1,
          player2: p2,
          score: p1.rankScore + p2.rankScore,
          type:
            p1.gender === p2.gender
              ? p1.gender === 'MALE'
                ? 'MENS_DOUBLE'
                : 'WOMENS_DOUBLE'
              : 'MIXED_DOUBLE',
        }
      : null;

  const suggestions = selectedPair
    ? findBestOpponentSuggestions(selectedPair, players, guestPairs)
    : [];

  const handleAddGuestPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName1.trim() || !guestName2.trim()) return;

    const clubSuffix = guestClub.trim() ? ` (${guestClub.trim()})` : ' (Đội Khách)';
    const newGuestPair: Pair = {
      id: `guest_${Date.now()}`,
      player1: {
        id: `G_${Date.now()}_1`,
        name: `${guestName1.trim()}${clubSuffix}`,
        gender: guestGender1,
        rankScore: guestRank1,
        playedCount: 0,
        pastPartners: [],
      },
      player2: {
        id: `G_${Date.now()}_2`,
        name: `${guestName2.trim()}${clubSuffix}`,
        gender: guestGender2,
        rankScore: guestRank2,
        playedCount: 0,
        pastPartners: [],
      },
      score: guestRank1 + guestRank2,
      type:
        guestGender1 === guestGender2
          ? guestGender1 === 'MALE'
            ? 'MENS_DOUBLE'
            : 'WOMENS_DOUBLE'
          : 'MIXED_DOUBLE',
    };

    setGuestPairs((prev) => [newGuestPair, ...prev]);
    setShowAddGuest(false);
    setGuestName1('');
    setGuestName2('');
    setGuestClub('');
  };

  const handleCreateChallengeMatch = (opponent: Pair, delta: number) => {
    if (!selectedPair) return;

    const matchId = `challenge_${Date.now()}`;
    const newMatch: Match = {
      matchId,
      type: selectedPair.type,
      teamA: [selectedPair.player1.id, selectedPair.player2.id],
      teamB: [opponent.player1.id, opponent.player2.id],
      scoreA: selectedPair.score,
      scoreB: opponent.score,
      delta,
      phase: 1,
      phaseLabel: 'Trận Giao Lưu / Thách Đấu',
      roundNumber: 1,
      courtNumber: 1,
      status: 'SCHEDULED',
      notes: `Trận thách đấu giữa ${teamCustomName} (${selectedPair.score}đ) và ${opponent.player1.name} & ${opponent.player2.name} (${opponent.score}đ)`,
    };

    onScheduleFriendlyMatch(newMatch);

    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#10b981', '#38bdf8', '#f59e0b'],
    });
  };

  const r1Def = lp1 ? getRankDefinitionByScore(lp1.rankScore) : null;
  const r2Def = lp2 ? getRankDefinitionByScore(lp2.rankScore) : null;

  return (
    <div className="space-y-6">
      {/* Active Locked Pairs Status Banner */}
      {activeLockedPairs.length > 0 && (
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-emerald-950/40 p-4 rounded-2xl border border-purple-500/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Lock className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Đang Kích Hoạt Cặp Cố Định Cho Buổi Đấu
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Khóa Cả Buổi
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {activeLockedPairs.map((lp) => {
                  const p1Obj = playerMap.get(lp.player1Id);
                  const p2Obj = playerMap.get(lp.player2Id);
                  return (
                    <span key={lp.id} className="flex items-center gap-2">
                      <span className="text-emerald-400">
                        {p1Obj?.gender === 'MALE' ? '♂' : '♀'} {p1Obj?.name || lp.player1Id}
                      </span>
                      <span className="text-slate-400">&</span>
                      <span className="text-sky-400">
                        {p2Obj?.gender === 'MALE' ? '♂' : '♀'} {p2Obj?.name || lp.player2Id}
                      </span>
                      <span className="text-slate-400 text-xs font-normal">
                        ({(p1Obj?.rankScore || 0) + (p2Obj?.rankScore || 0)} điểm)
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {onClearLockedPairs && (
            <button
              onClick={onClearLockedPairs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold transition-all"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Hủy Cặp Cố Định</span>
            </button>
          )}
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab('LOCKED_SESSION')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'LOCKED_SESSION'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Cặp Cố Định Đánh Cùng Nhau Cả Buổi</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
            Mới
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('FRIENDLY_CHALLENGE')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all ${
            activeSubTab === 'FRIENDLY_CHALLENGE'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Swords className="w-4 h-4 text-sky-400" />
          <span>Giao Lưu Đội Khách & Thách Đấu Từng Trận</span>
        </button>
      </div>

      {/* SUB-TAB 1: LOCKED SESSION MODE */}
      {activeSubTab === 'LOCKED_SESSION' && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
                <HeartHandshake className="w-5 h-5 text-emerald-400" />
                <span>Khóa Cặp Thi Đấu Cùng Nhau Cả Buổi (Locked Pair Session)</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cho phép chọn 2 thành viên (ví dụ: <strong className="text-emerald-400">Nam A</strong> đánh cùng{' '}
                <strong className="text-sky-400">Nữ B</strong> cả buổi). Trong tất cả các trận có sự tham gia của một trong hai người,{' '}
                <strong>họ luôn được xếp cùng đội</strong>. Đối thủ được thuật toán tự động chọn ngẫu nhiên và cân bằng trình độ (
                <strong className="text-amber-400">Δ ≤ 1</strong>), đồng thời đảm bảo số set ra sân của tất cả các thành viên trong nhóm là công bằng nhất!
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {defaultMale && defaultFemale && (
                <button
                  onClick={() => {
                    setLockedP1Id(defaultMale.id);
                    setLockedP2Id(defaultFemale.id);
                    setLockedPairLabel(`${defaultMale.name} & ${defaultFemale.name}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  👫 Ghép Đôi Nam Nữ
                </button>
              )}
              {players.filter((p) => p.gender === 'MALE').length >= 2 && (
                <button
                  onClick={() => {
                    const males = players.filter((p) => p.gender === 'MALE');
                    setLockedP1Id(males[0].id);
                    setLockedP2Id(males[1].id);
                    setLockedPairLabel(`${males[0].name} & ${males[1].name}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  👬 Ghép Đôi Nam
                </button>
              )}
            </div>
          </div>

          {/* Configuration Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Select the Pair (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Chọn 2 Người Đánh Cùng Nhau</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {activeSelectedLockedPair ? `${activeSelectedLockedPair.score} điểm` : '--'}
                </span>
              </div>

              {/* Pair Label Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Đặt tên cặp đấu:
                </label>
                <input
                  type="text"
                  value={lockedPairLabel}
                  onChange={(e) => setLockedPairLabel(e.target.value)}
                  placeholder={
                    activeSelectedLockedPair
                      ? `${activeSelectedLockedPair.player1.name} & ${activeSelectedLockedPair.player2.name}`
                      : 'Ví dụ: Nam A & Nữ B'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Member 1 Select */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400">Thành viên 1:</label>
                  {r1Def && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: r1Def.bgLight,
                        color: r1Def.color,
                        borderColor: r1Def.borderLight,
                      }}
                    >
                      {r1Def.shortLabel} ({r1Def.score}đ)
                    </span>
                  )}
                </div>
                <select
                  value={lockedP1Id}
                  onChange={(e) => setLockedP1Id(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.gender === 'MALE' ? '♂ Nam' : '♀ Nữ'} : {p.name} - {p.rankScore}đ (
                      {getRankDefinitionByScore(p.rankScore).shortLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Member 2 Select */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-400">Thành viên 2 (Đồng đội gắn kết):</label>
                  {r2Def && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: r2Def.bgLight,
                        color: r2Def.color,
                        borderColor: r2Def.borderLight,
                      }}
                    >
                      {r2Def.shortLabel} ({r2Def.score}đ)
                    </span>
                  )}
                </div>
                <select
                  value={lockedP2Id}
                  onChange={(e) => setLockedP2Id(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {players
                    .filter((p) => p.id !== lockedP1Id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.gender === 'MALE' ? '♂ Nam' : '♀ Nữ'} : {p.name} - {p.rankScore}đ (
                        {getRankDefinitionByScore(p.rankScore).shortLabel})
                      </option>
                    ))}
                </select>
              </div>

              {/* Match target count selector */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase">
                  Tổng số trận cả buổi thi đấu:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[6, 8, 9, 10, 11, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSessionMatchTarget(num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        sessionMatchTarget === num
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {num} trận
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col gap-2.5">
                <button
                  onClick={handleSimulateLockedSession}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Mô Phỏng & Xem Trước Lịch Đấu Với Cặp Này</span>
                </button>

                {simulationResult && (
                  <button
                    onClick={handleApplyToSchedule}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl transition-all animate-bounce"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Áp Dụng Lịch Đấu Vào Màn Hình Chính</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: Metrics & Analysis Card (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>Phân Tích Cặp Đấu & Tính Cân Bằng Cả Buổi</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {players.length} thành viên trên sân
                </span>
              </div>

              {activeSelectedLockedPair && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400">Thể loại cặp:</span>
                    <div className="text-xs font-bold text-emerald-400">
                      {activeSelectedLockedPair.type === 'MIXED_DOUBLE'
                        ? '👫 Đôi Nam Nữ (Mix)'
                        : activeSelectedLockedPair.type === 'MENS_DOUBLE'
                        ? '👬 Đôi Nam'
                        : '👭 Đôi Nữ'}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400">Số trận cặp đánh cùng nhau:</span>
                    <div className="text-xs font-bold text-purple-300 font-mono">
                      ~ {expectedRoundedSets} trận ({sessionMatchTarget} trận tổng)
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400">Cặp đối thủ tương thích (Δ ≤ 1):</span>
                    <div className="text-xs font-bold text-amber-400 font-mono">
                      {compatibleOpponentPairsCount} cặp đối thủ
                    </div>
                  </div>
                </div>
              )}

              {/* Simulation Result Preview Area */}
              {simulationResult ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Kết Quả Xếp Trận Mô Phỏng ({simulationResult.matches.length} trận)</span>
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Cặp cố định ra sân: {simulationResult.lockedPairMatchesCount} trận
                    </span>
                  </div>

                  {/* Match Cards List */}
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-2">
                    {simulationResult.matches.map((m, idx) => {
                      const isLockedMatch =
                        m.notes?.includes('⭐ Cặp cố định') ||
                        (m.teamA[0] === lockedP1Id && m.teamA[1] === lockedP2Id) ||
                        (m.teamA[0] === lockedP2Id && m.teamA[1] === lockedP1Id) ||
                        (m.teamB[0] === lockedP1Id && m.teamB[1] === lockedP2Id) ||
                        (m.teamB[0] === lockedP2Id && m.teamB[1] === lockedP1Id);

                      const a1Name = playerMap.get(m.teamA[0])?.name || m.teamA[0];
                      const a2Name = playerMap.get(m.teamA[1])?.name || m.teamA[1];
                      const b1Name = playerMap.get(m.teamB[0])?.name || m.teamB[0];
                      const b2Name = playerMap.get(m.teamB[1])?.name || m.teamB[1];

                      return (
                        <div
                          key={m.matchId || idx}
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            isLockedMatch
                              ? 'bg-purple-950/20 border-purple-500/50 shadow-md'
                              : 'bg-slate-950/60 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-400">
                                Trận {idx + 1}
                              </span>
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                                Vòng {m.roundNumber || 1} • Sân {m.courtNumber || 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isLockedMatch ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                                  <Lock className="w-3 h-3 text-purple-400" />
                                  <span>Cặp Cố Định Thi Đấu</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">
                                  Cặp cố định nghỉ xoay tua
                                </span>
                              )}
                              <span
                                className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                                  m.delta === 0
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                }`}
                              >
                                Δ = {m.delta}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-11 items-center gap-2 bg-slate-900/60 p-2 rounded-lg">
                            <div className="col-span-5 text-right font-semibold text-slate-200 truncate">
                              <span
                                className={
                                  isLockedMatch &&
                                  (m.teamA.includes(lockedP1Id) || m.teamA.includes(lockedP2Id))
                                    ? 'text-purple-300 font-bold'
                                    : ''
                                }
                              >
                                {a1Name} & {a2Name}
                              </span>
                              <span className="ml-1 text-[10px] text-slate-400 font-mono">
                                ({m.scoreA}đ)
                              </span>
                            </div>

                            <div className="col-span-1 text-center font-bold text-slate-500 text-[10px]">
                              VS
                            </div>

                            <div className="col-span-5 font-semibold text-slate-200 truncate">
                              <span
                                className={
                                  isLockedMatch &&
                                  (m.teamB.includes(lockedP1Id) || m.teamB.includes(lockedP2Id))
                                    ? 'text-purple-300 font-bold'
                                    : ''
                                }
                              >
                                {b1Name} & {b2Name}
                              </span>
                              <span className="ml-1 text-[10px] text-slate-400 font-mono">
                                ({m.scoreB}đ)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Set distribution audit */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      Thống kê số set của từng thành viên trong buổi đấu:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {simulationResult.updatedPlayers.map((p) => {
                        const isLockedMember = p.id === lockedP1Id || p.id === lockedP2Id;
                        return (
                          <div
                            key={p.id}
                            className={`p-2 rounded-lg border flex items-center justify-between ${
                              isLockedMember
                                ? 'bg-purple-950/20 border-purple-500/40'
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <span className="truncate text-slate-300">
                              {p.name.split(' ')[0]}
                            </span>
                            <span
                              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                isLockedMember
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-slate-800 text-slate-200'
                              }`}
                            >
                              {p.playedCount} set
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                  <HeartHandshake className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Nhấp vào nút "Mô Phỏng & Xem Trước" bên trái để kiểm tra lịch thi đấu.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FRIENDLY CHALLENGE & GUEST PAIRS */}
      {activeSubTab === 'FRIENDLY_CHALLENGE' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Swords className="w-5 h-5 text-sky-400" />
                  <span>Chọn Cặp Giao Lưu Đội Khách & Thách Đấu Từng Trận</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30">
                  Inter-Club Matchmaking
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tự do chọn 2 người trong nhóm ghép thành một cặp thách đấu. Thuật toán tự động tìm và gợi ý các đội đối thủ (nội bộ hoặc đội khách ngoài CLB) có trình độ tương đương nhất (Delta ≈ 0).
              </p>
            </div>

            <button
              onClick={() => setShowAddGuest(!showAddGuest)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{showAddGuest ? 'Đóng form đội khách' : 'Thêm cặp đối thủ đội khách'}</span>
            </button>
          </div>

          {/* Add Guest Form (Collapsible) */}
          {showAddGuest && (
            <form
              onSubmit={handleAddGuestPair}
              className="bg-slate-900 p-5 rounded-2xl border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Đăng Ký Cặp Đấu Đội Khách / CLB Bạn Tới Giao Lưu</span>
                </h3>
                <span className="text-xs text-slate-500">Nhập thông tin 2 thành viên của đội đối thủ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player 1 of guest */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Vận động viên 1 (Đội khách)</span>
                  <input
                    type="text"
                    value={guestName1}
                    onChange={(e) => setGuestName1(e.target.value)}
                    placeholder="Họ và tên VĐV 1..."
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={guestGender1}
                      onChange={(e) => setGuestGender1(e.target.value as 'MALE' | 'FEMALE')}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                    </select>
                    <select
                      value={guestRank1}
                      onChange={(e) => setGuestRank1(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value={1}>1đ - Newbie</option>
                      <option value={2}>2đ - Yếu</option>
                      <option value={3}>3đ - TBY</option>
                      <option value={4}>4đ - TB</option>
                      <option value={5}>5đ - TBK</option>
                    </select>
                  </div>
                </div>

                {/* Player 2 of guest */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Vận động viên 2 (Đội khách)</span>
                  <input
                    type="text"
                    value={guestName2}
                    onChange={(e) => setGuestName2(e.target.value)}
                    placeholder="Họ và tên VĐV 2..."
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={guestGender2}
                      onChange={(e) => setGuestGender2(e.target.value as 'MALE' | 'FEMALE')}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                    </select>
                    <select
                      value={guestRank2}
                      onChange={(e) => setGuestRank2(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value={1}>1đ - Newbie</option>
                      <option value={2}>2đ - Yếu</option>
                      <option value={3}>3đ - TBY</option>
                      <option value={4}>4đ - TB</option>
                      <option value={5}>5đ - TBK</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={guestClub}
                  onChange={(e) => setGuestClub(e.target.value)}
                  placeholder="Tên CLB hoặc Đội của khách (vd: CLB Cầu Giấy, Tuyển Trẻ...)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                >
                  Lưu Cặp Đội Khách
                </button>
              </div>
            </form>
          )}

          {/* Main Pair Selection Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Choose our pair (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Cặp Đấu Của Nhóm Bạn</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Tổng: {selectedPair ? `${selectedPair.score} điểm` : '--'}
                </span>
              </div>

              {/* Pair Name Tag */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Tên gọi / Nhãn của cặp:
                </label>
                <input
                  type="text"
                  value={teamCustomName}
                  onChange={(e) => setTeamCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Đặt tên cặp đấu..."
                />
              </div>

              {/* Member 1 Select */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400">Thành viên 1:</label>
                  {p1 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: getRankDefinitionByScore(p1.rankScore).bgLight,
                        color: getRankDefinitionByScore(p1.rankScore).color,
                        borderColor: getRankDefinitionByScore(p1.rankScore).borderLight,
                      }}
                    >
                      {getRankDefinitionByScore(p1.rankScore).shortLabel} ({p1.rankScore}đ)
                    </span>
                  )}
                </div>
                <select
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.gender === 'MALE' ? '♂' : '♀'} {p.name} - {p.rankScore}đ (
                      {getRankDefinitionByScore(p.rankScore).shortLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Member 2 Select */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400">Thành viên 2 (Đồng đội):</label>
                  {p2 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: getRankDefinitionByScore(p2.rankScore).bgLight,
                        color: getRankDefinitionByScore(p2.rankScore).color,
                        borderColor: getRankDefinitionByScore(p2.rankScore).borderLight,
                      }}
                    >
                      {getRankDefinitionByScore(p2.rankScore).shortLabel} ({p2.rankScore}đ)
                    </span>
                  )}
                </div>
                <select
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {players
                    .filter((p) => p.id !== player1Id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.gender === 'MALE' ? '♂' : '♀'} {p.name} - {p.rankScore}đ (
                        {getRankDefinitionByScore(p.rankScore).shortLabel})
                      </option>
                    ))}
                </select>
              </div>

              {/* Summary Box */}
              {selectedPair && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl text-xs space-y-1 text-slate-300">
                  <div className="flex items-center justify-between font-bold text-emerald-300">
                    <span>Thể loại:</span>
                    <span>
                      {selectedPair.type === 'MIXED_DOUBLE'
                        ? 'Đôi Nam Nữ (Mix)'
                        : selectedPair.type === 'MENS_DOUBLE'
                        ? 'Đôi Nam'
                        : 'Đôi Nữ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Cấu thành điểm:</span>
                    <span className="font-mono">
                      {p1?.rankScore}đ + {p2?.rankScore}đ ={' '}
                      <strong className="text-white">{selectedPair.score} điểm</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Opponent Matchmaker Suggestions (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Các Cặp Đối Thủ Cân Bằng Nhất (Delta ≈ 0)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Được xếp hạng tự động theo độ chênh lệch điểm số nhỏ nhất với cặp của bạn
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {suggestions.length} gợi ý
                </span>
              </div>

              {!selectedPair ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Vui lòng chọn 2 thành viên khác nhau ở khung bên trái để xem các cặp đối thủ phù hợp.
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                  {suggestions.map((sug, idx) => {
                    const cand = sug.opponentPair;
                    const isZeroDelta = sug.delta === 0;

                    return (
                      <div
                        key={cand.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isZeroDelta
                            ? 'bg-emerald-950/20 border-emerald-500/50 hover:border-emerald-500'
                            : sug.delta === 1
                            ? 'bg-sky-950/20 border-sky-500/40 hover:border-sky-500'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-200">
                              {cand.player1.name} & {cand.player2.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white bg-slate-800 px-2 py-0.5 rounded">
                              {cand.score}đ
                            </span>
                            {isZeroDelta ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Δ = 0 (Tuyệt đối)
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                                Δ = {sug.delta}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                          <div className="text-[11px] text-slate-400 italic truncate max-w-sm">
                            {sug.explanation}
                          </div>

                          <button
                            onClick={() => handleCreateChallengeMatch(cand, sug.delta)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all shrink-0 ml-2"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Xếp trận ngay</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
