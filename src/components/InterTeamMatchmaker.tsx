import React, { useState } from 'react';
import { Player, Pair, MatchType, Match, getRankDefinitionByScore } from '../types/badminton';
import { findBestOpponentSuggestions } from '../services/matchmakingAlgorithm';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InterTeamMatchmakerProps {
  players: Player[];
  onScheduleFriendlyMatch: (match: Match) => void;
}

export const InterTeamMatchmaker: React.FC<InterTeamMatchmakerProps> = ({
  players,
  onScheduleFriendlyMatch,
}) => {
  // Selection for our chosen pair
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

  const p1 = players.find((p) => p.id === player1Id);
  const p2 = players.find((p) => p.id === player2Id);

  // Form the active selected pair
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

  // Find opponent recommendations
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

  const r1Def = p1 ? getRankDefinitionByScore(p1.rankScore) : null;
  const r2Def = p2 ? getRankDefinitionByScore(p2.rankScore) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Swords className="w-5 h-5 text-emerald-400" />
              <span>Chọn Cặp Đánh Cùng Nhau & Giao Lưu Đội Khác</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
              Inter-Team Matchmaking
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Tự do chọn 2 người trong nhóm ghép thành một cặp cố định. Thuật toán tự động tìm và gợi ý các đội đối thủ có trình độ tương đương nhất (Delta ≈ 0) để thi đấu giao lưu.
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
              {r1Def && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
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
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.gender === 'MALE' ? '♂' : '♀'} {p.name} - {p.rankScore}đ ({getRankDefinitionByScore(p.rankScore).shortLabel})
                </option>
              ))}
            </select>
          </div>

          {/* Member 2 Select */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400">Thành viên 2 (Đồng đội):</label>
              {r2Def && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
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
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {players
                .filter((p) => p.id !== player1Id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.gender === 'MALE' ? '♂' : '♀'} {p.name} - {p.rankScore}đ ({getRankDefinitionByScore(p.rankScore).shortLabel})
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
                  {p1?.rankScore}đ + {p2?.rankScore}đ = <strong className="text-white">{selectedPair.score} điểm</strong>
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
  );
};
