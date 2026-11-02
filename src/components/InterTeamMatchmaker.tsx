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
  Trash2,
  Shuffle,
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

  // --- State for Locked Session Mode (Multi-Pair Support) ---
  const [lockedPairsList, setLockedPairsList] = useState<LockedPair[]>(() => {
    if (activeLockedPairs.length > 0) return [...activeLockedPairs];
    const defaultMale = players.find((p) => p.gender === 'MALE');
    const defaultFemale = players.find((p) => p.gender === 'FEMALE');
    if (defaultMale && defaultFemale) {
      return [
        {
          id: `lp_init_1`,
          name: `${defaultMale.name} & ${defaultFemale.name}`,
          player1Id: defaultMale.id,
          player2Id: defaultFemale.id,
        },
      ];
    }
    return [];
  });

  // State for adding a new locked pair
  const [newP1Id, setNewP1Id] = useState<string>('');
  const [newP2Id, setNewP2Id] = useState<string>('');
  const [newPairLabel, setNewPairLabel] = useState<string>('');
  const [showAddPairForm, setShowAddPairForm] = useState<boolean>(false);
  const [sessionMatchTarget, setSessionMatchTarget] = useState<number>(targetTotalMatches);

  // Live simulation of session schedule with the configured locked pairs
  const [simulationResult, setSimulationResult] = useState<{
    matches: Match[];
    updatedPlayers: Player[];
    pairStats: {
      pair: LockedPair;
      matchesCount: number;
      p1: Player | undefined;
      p2: Player | undefined;
      combinedScore: number;
    }[];
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

  // Set of players already assigned to a locked pair
  const lockedPlayerIds = useMemo(() => {
    return new Set(lockedPairsList.flatMap((lp) => [lp.player1Id, lp.player2Id]));
  }, [lockedPairsList]);

  // Unlocked players available to be chosen for a new pair
  const availablePlayersForNewPair = useMemo(() => {
    return players.filter((p) => !lockedPlayerIds.has(p.id));
  }, [players, lockedPlayerIds]);

  // Run simulation for given pairs list
  const runSimulationForPairs = (pairs: LockedPair[], targetMatches: number = sessionMatchTarget) => {
    if (pairs.length === 0) {
      setSimulationResult(null);
      return;
    }

    const freshPlayers = players.map((p) => ({
      ...p,
      playedCount: 0,
      pastPartners: [],
    }));

    const result = runContinuousMatchmaking(freshPlayers, targetMatches, {
      lockedPairs: pairs,
    });

    const pairStats = pairs.map((pair) => {
      const p1 = playerMap.get(pair.player1Id);
      const p2 = playerMap.get(pair.player2Id);
      const combinedScore = (p1?.rankScore || 0) + (p2?.rankScore || 0);

      const matchesCount = result.matches.filter((m) => {
        const inA =
          (m.teamA[0] === pair.player1Id && m.teamA[1] === pair.player2Id) ||
          (m.teamA[0] === pair.player2Id && m.teamA[1] === pair.player1Id);
        const inB =
          (m.teamB[0] === pair.player1Id && m.teamB[1] === pair.player2Id) ||
          (m.teamB[0] === pair.player2Id && m.teamB[1] === pair.player1Id);
        return inA || inB;
      }).length;

      return {
        pair,
        matchesCount,
        p1,
        p2,
        combinedScore,
      };
    });

    setSimulationResult({
      matches: result.matches,
      updatedPlayers: result.updatedPlayers,
      pairStats,
    });
  };

  const handleAddLockedPair = (p1Id: string, p2Id: string, customLabel?: string) => {
    if (!p1Id || !p2Id || p1Id === p2Id) return;
    const p1 = playerMap.get(p1Id);
    const p2 = playerMap.get(p2Id);
    if (!p1 || !p2) return;

    const label = customLabel?.trim() || `${p1.name} & ${p2.name}`;
    const newPair: LockedPair = {
      id: `lp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: label,
      player1Id: p1.id,
      player2Id: p2.id,
    };

    const nextList = [...lockedPairsList, newPair];
    setLockedPairsList(nextList);
    setNewP1Id('');
    setNewP2Id('');
    setNewPairLabel('');
    setShowAddPairForm(false);
    runSimulationForPairs(nextList, sessionMatchTarget);
  };

  const handleRemoveLockedPair = (id: string) => {
    const nextList = lockedPairsList.filter((lp) => lp.id !== id);
    setLockedPairsList(nextList);
    if (nextList.length > 0) {
      runSimulationForPairs(nextList, sessionMatchTarget);
    } else {
      setSimulationResult(null);
    }
  };

  const handleClearAllLockedPairs = () => {
    setLockedPairsList([]);
    setSimulationResult(null);
    if (onClearLockedPairs) onClearLockedPairs();
  };

  // Quick auto-pairing presets
  const handleAutoPair2 = () => {
    if (players.length < 4) return;
    const males = players.filter((p) => p.gender === 'MALE');
    const females = players.filter((p) => p.gender === 'FEMALE');

    const pairs: LockedPair[] = [];
    if (males.length >= 2 && females.length >= 2) {
      pairs.push({
        id: `lp_auto_${Date.now()}_1`,
        name: `Cặp 1 (${males[0].name} & ${females[females.length - 1].name})`,
        player1Id: males[0].id,
        player2Id: females[females.length - 1].id,
      });
      pairs.push({
        id: `lp_auto_${Date.now()}_2`,
        name: `Cặp 2 (${males[1].name} & ${females[0].name})`,
        player1Id: males[1].id,
        player2Id: females[0].id,
      });
    } else {
      const sorted = [...players].sort((a, b) => b.rankScore - a.rankScore);
      pairs.push({
        id: `lp_auto_${Date.now()}_1`,
        name: `Cặp 1 (${sorted[0].name} & ${sorted[sorted.length - 1].name})`,
        player1Id: sorted[0].id,
        player2Id: sorted[sorted.length - 1].id,
      });
      pairs.push({
        id: `lp_auto_${Date.now()}_2`,
        name: `Cặp 2 (${sorted[1].name} & ${sorted[sorted.length - 2].name})`,
        player1Id: sorted[1].id,
        player2Id: sorted[sorted.length - 2].id,
      });
    }
    setLockedPairsList(pairs);
    runSimulationForPairs(pairs, sessionMatchTarget);
  };

  const handleAutoPairAll = () => {
    if (players.length < 4) return;
    const males = [...players.filter((p) => p.gender === 'MALE')].sort((a, b) => b.rankScore - a.rankScore);
    const females = [...players.filter((p) => p.gender === 'FEMALE')].sort((a, b) => a.rankScore - b.rankScore);

    const pairs: LockedPair[] = [];
    if (males.length === females.length && males.length >= 2) {
      for (let i = 0; i < males.length; i++) {
        pairs.push({
          id: `lp_all_${Date.now()}_${i + 1}`,
          name: `Cặp Mix #${i + 1} (${males[i].name} & ${females[i].name})`,
          player1Id: males[i].id,
          player2Id: females[i].id,
        });
      }
    } else {
      const sorted = [...players].sort((a, b) => b.rankScore - a.rankScore);
      const half = Math.floor(sorted.length / 2);
      for (let i = 0; i < half; i++) {
        const p1 = sorted[i];
        const p2 = sorted[sorted.length - 1 - i];
        pairs.push({
          id: `lp_all_${Date.now()}_${i + 1}`,
          name: `Cặp Cố Định #${i + 1} (${p1.name} & ${p2.name})`,
          player1Id: p1.id,
          player2Id: p2.id,
        });
      }
    }
    setLockedPairsList(pairs);
    runSimulationForPairs(pairs, sessionMatchTarget);
  };

  // Apply to Main Schedule
  const handleApplyToSchedule = () => {
    if (lockedPairsList.length === 0) return;

    let res = simulationResult;
    if (!res) {
      const freshPlayers = players.map((p) => ({
        ...p,
        playedCount: 0,
        pastPartners: [],
      }));
      const r = runContinuousMatchmaking(freshPlayers, sessionMatchTarget, {
        lockedPairs: lockedPairsList,
      });
      res = {
        matches: r.matches,
        updatedPlayers: r.updatedPlayers,
        pairStats: [],
      };
    }

    if (onApplyLockedPairSchedule) {
      onApplyLockedPairSchedule(
        res.matches,
        res.updatedPlayers,
        sessionMatchTarget,
        lockedPairsList
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

      {/* SUB-TAB 1: LOCKED SESSION MODE (MULTI-PAIR SUPPORT) */}
      {activeSubTab === 'LOCKED_SESSION' && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
                <HeartHandshake className="w-5 h-5 text-emerald-400" />
                <span>Khóa Nhiều Cặp Thi Đấu Cùng Nhau Cả Buổi (Multi-Pair Session Locking)</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cho phép cố định <strong className="text-emerald-400">1 cặp, 2 cặp, 3 cặp hoặc toàn bộ các cặp trên sân</strong>. 
                Trong mọi trận đấu, hai thành viên của cặp đã khóa <strong className="text-purple-300">luôn luôn đứng chung một đội</strong>, không bao giờ bị tách rời hay đối đầu nhau. 
                Các cặp có thể đối đầu trực tiếp với nhau hoặc gặp đối thủ ngẫu nhiên công bằng (<strong className="text-amber-400">Δ ≤ 1</strong>), đồng thời số set ra sân của toàn bộ thành viên vẫn đảm bảo chênh lệch <strong className="text-emerald-400">Δ ≤ 1</strong>.
              </p>
            </div>

            {/* Quick Action Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoPair2}
                className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Tự động ghép 2 cặp cân bằng điểm số nhất"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Ghép 2 Cặp (4 người)</span>
              </button>

              <button
                type="button"
                onClick={handleAutoPairAll}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Tự động ghép toàn bộ người chơi trong sân thành các cặp đôi cố định cân bằng"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ghép Toàn Bộ Sân ({Math.floor(players.length / 2)} Cặp)</span>
              </button>

              {lockedPairsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllLockedPairs}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Hết Cặp</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Grid Configuration & Simulation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Configured Pairs List & Add Form (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Card 1: Configured Pairs List */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-100">
                      Danh Sách Cặp Cố Định
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                    {lockedPairsList.length} cặp ({lockedPlayerIds.size}/{players.length} người)
                  </span>
                </div>

                {/* List of Configured Locked Pairs */}
                {lockedPairsList.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs space-y-2 border border-dashed border-slate-800 rounded-xl">
                    <HeartHandshake className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>Chưa có cặp cố định nào được thiết lập.</p>
                    <p className="text-[11px] text-slate-500">
                      Nhấp nút "Thêm Cặp Mới" bên dưới hoặc chọn gợi ý ghép cặp tự động.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {lockedPairsList.map((lp, idx) => {
                      const p1Obj = playerMap.get(lp.player1Id);
                      const p2Obj = playerMap.get(lp.player2Id);
                      const r1 = p1Obj ? getRankDefinitionByScore(p1Obj.rankScore) : null;
                      const r2 = p2Obj ? getRankDefinitionByScore(p2Obj.rankScore) : null;
                      const combined = (p1Obj?.rankScore || 0) + (p2Obj?.rankScore || 0);
                      const pairType =
                        p1Obj && p2Obj
                          ? p1Obj.gender === p2Obj.gender
                            ? p1Obj.gender === 'MALE'
                              ? 'Đôi Nam'
                              : 'Đôi Nữ'
                            : 'Đôi Nam Nữ'
                          : '';

                      return (
                        <div
                          key={lp.id}
                          className="bg-slate-950/80 border border-purple-500/30 hover:border-purple-500/60 p-3 rounded-xl flex items-center justify-between gap-3 transition-all shadow-sm"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-white truncate">
                                {lp.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({combined}đ • {pairType})
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                {p1Obj?.gender === 'MALE' ? '♂' : '♀'} {p1Obj?.name}
                                {r1 && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({r1.score}đ)
                                  </span>
                                )}
                              </span>
                              <span className="text-slate-500">&</span>
                              <span className="text-sky-400 font-semibold flex items-center gap-1">
                                {p2Obj?.gender === 'MALE' ? '♂' : '♀'} {p2Obj?.name}
                                {r2 && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({r2.score}đ)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveLockedPair(lp.id)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 transition-all shrink-0"
                            title="Xóa cặp này khỏi danh sách cố định"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Toggle / Add New Pair Form */}
                <div className="pt-2 border-t border-slate-800">
                  {!showAddPairForm ? (
                    <button
                      type="button"
                      disabled={availablePlayersForNewPair.length < 2}
                      onClick={() => {
                        setShowAddPairForm(true);
                        if (availablePlayersForNewPair.length >= 2) {
                          setNewP1Id(availablePlayersForNewPair[0].id);
                          setNewP2Id(availablePlayersForNewPair[1].id);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Thêm Cặp Cố Định Mới</span>
                    </button>
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo Cặp Cố Định Mới</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddPairForm(false)}
                          className="text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          Đóng
                        </button>
                      </div>

                      {/* Name input */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Tên Cặp (Tùy chọn):
                        </label>
                        <input
                          type="text"
                          value={newPairLabel}
                          onChange={(e) => setNewPairLabel(e.target.value)}
                          placeholder="Ví dụ: Nam A & Nữ B hoặc Cặp Vô Địch"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Member 1 */}
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-1">
                          Thành viên 1:
                        </label>
                        <select
                          value={newP1Id}
                          onChange={(e) => {
                            setNewP1Id(e.target.value);
                            if (newP2Id === e.target.value) {
                              const other = availablePlayersForNewPair.find((p) => p.id !== e.target.value);
                              if (other) setNewP2Id(other.id);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {players.map((p) => {
                            const isAlreadyLocked = lockedPlayerIds.has(p.id);
                            return (
                              <option key={p.id} value={p.id} disabled={isAlreadyLocked}>
                                {p.gender === 'MALE' ? '♂ Nam' : '♀ Nữ'}: {p.name} ({p.rankScore}đ)
                                {isAlreadyLocked ? ' - [Đã có cặp]' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Member 2 */}
                      <div>
                        <label className="block text-[10px] font-bold text-sky-400 uppercase mb-1">
                          Thành viên 2:
                        </label>
                        <select
                          value={newP2Id}
                          onChange={(e) => setNewP2Id(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                        >
                          {players
                            .filter((p) => p.id !== newP1Id)
                            .map((p) => {
                              const isAlreadyLocked = lockedPlayerIds.has(p.id);
                              return (
                                <option key={p.id} value={p.id} disabled={isAlreadyLocked}>
                                  {p.gender === 'MALE' ? '♂ Nam' : '♀ Nữ'}: {p.name} ({p.rankScore}đ)
                                  {isAlreadyLocked ? ' - [Đã có cặp]' : ''}
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={!newP1Id || !newP2Id || newP1Id === newP2Id}
                        onClick={() => handleAddLockedPair(newP1Id, newP2Id, newPairLabel)}
                        className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Lưu Cặp Vào Danh Sách</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Match Target Selector */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Tổng số trận buổi đấu:
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {sessionMatchTarget} trận
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[6, 8, 9, 10, 11, 12, 16].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setSessionMatchTarget(num);
                          if (lockedPairsList.length > 0) {
                            runSimulationForPairs(lockedPairsList, num);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          sessionMatchTarget === num
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {num} trận
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={lockedPairsList.length === 0}
                    onClick={() => runSimulationForPairs(lockedPairsList, sessionMatchTarget)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Mô Phỏng & Kiểm Tra Toàn Bộ Lịch Đấu</span>
                  </button>

                  {simulationResult && (
                    <button
                      type="button"
                      onClick={handleApplyToSchedule}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl transition-all animate-bounce"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Áp Dụng {lockedPairsList.length} Cặp Cố Định Vào Lịch Đấu Chính</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Multi-Pair Analytics & Simulation Preview (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Phân Tích & Mô Phỏng Cả Buổi
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {players.length} thành viên sân
                </span>
              </div>

              {/* Status & Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Số Cặp Khóa:</span>
                  <div className="text-xs font-bold text-purple-300 font-mono">
                    {lockedPairsList.length} cặp ({lockedPlayerIds.size} VĐV)
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Số Trận Buổi:</span>
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    {sessionMatchTarget} trận
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Chuẩn Delta:</span>
                  <div className="text-xs font-bold text-amber-400 font-mono">
                    100% Δ ≤ 1
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">Độ Tách Rời:</span>
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    0 lần (Tuyệt đối)
                  </div>
                </div>
              </div>

              {/* Breakdown per Locked Pair */}
              {simulationResult?.pairStats && simulationResult.pairStats.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Thống kê ra sân của các cặp cố định:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {simulationResult.pairStats.map(({ pair, matchesCount, combinedScore }, idx) => (
                      <div
                        key={pair.id}
                        className="bg-slate-950/90 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="truncate">
                          <span className="font-bold text-purple-300">
                            #{idx + 1} {pair.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Tổng {combinedScore}đ • 100% đánh cùng nhau
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                          {matchesCount} trận
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simulation Result Area */}
              {simulationResult ? (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Kết Quả Lịch Đấu Mô Phỏng ({simulationResult.matches.length} trận)</span>
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Delta max ≤ 1
                    </span>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2">
                    {simulationResult.matches.map((m, idx) => {
                      const a1Name = playerMap.get(m.teamA[0])?.name || m.teamA[0];
                      const a2Name = playerMap.get(m.teamA[1])?.name || m.teamA[1];
                      const b1Name = playerMap.get(m.teamB[0])?.name || m.teamB[0];
                      const b2Name = playerMap.get(m.teamB[1])?.name || m.teamB[1];

                      // Check which locked pairs are involved
                      const involvedPairs = lockedPairsList.filter((lp) => {
                        const inA =
                          (m.teamA[0] === lp.player1Id && m.teamA[1] === lp.player2Id) ||
                          (m.teamA[0] === lp.player2Id && m.teamA[1] === lp.player1Id);
                        const inB =
                          (m.teamB[0] === lp.player1Id && m.teamB[1] === lp.player2Id) ||
                          (m.teamB[0] === lp.player2Id && m.teamB[1] === lp.player1Id);
                        return inA || inB;
                      });

                      const hasLockedPair = involvedPairs.length > 0;

                      return (
                        <div
                          key={m.matchId || idx}
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            hasLockedPair
                              ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
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
                              {hasLockedPair ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                                  <Lock className="w-3 h-3 text-purple-400" />
                                  <span>{involvedPairs.map((lp) => lp.name).join(' vs ')}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">
                                  Các cặp cố định nghỉ xoay tua
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
                              <span>{a1Name} & {a2Name}</span>
                              <span className="ml-1 text-[10px] text-slate-400 font-mono">
                                ({m.scoreA}đ)
                              </span>
                            </div>

                            <div className="col-span-1 text-center font-bold text-slate-500 text-[10px]">
                              VS
                            </div>

                            <div className="col-span-5 font-semibold text-slate-200 truncate">
                              <span>{b1Name} & {b2Name}</span>
                              <span className="ml-1 text-[10px] text-slate-400 font-mono">
                                ({m.scoreB}đ)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Individual Player Set Distribution Audit */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Thống kê số set của tất cả thành viên trong buổi:
                      </span>
                      {(() => {
                        const counts = simulationResult.updatedPlayers.map((p) => p.playedCount);
                        const maxP = Math.max(...counts);
                        const minP = Math.min(...counts);
                        return (
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Độ lệch số set: Δ = {maxP - minP} (Chuẩn ≤ 1)
                          </span>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {simulationResult.updatedPlayers.map((p) => {
                        const isLockedMember = lockedPlayerIds.has(p.id);
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
                              {p.name.split(' ')[0]} {p.gender === 'MALE' ? '♂' : '♀'}
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
                  <p>Nhấp vào nút "Mô Phỏng & Kiểm Tra Toàn Bộ Lịch Đấu" bên trái để kiểm tra lịch thi đấu.</p>
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
