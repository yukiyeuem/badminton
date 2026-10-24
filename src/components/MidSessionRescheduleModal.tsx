import React, { useState, useEffect } from 'react';
import { Player, Match, getRankDefinitionByScore } from '../types/badminton';
import {
  X,
  RefreshCw,
  Lock,
  UserX,
  UserCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Users,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface MidSessionRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  players: Player[];
  initialCutoffMatch?: number;
  onApplyReschedule: (
    cutoffMatchNumber: number,
    activePlayerIds: string[],
    targetTotalMatches: number
  ) => void;
  onLoadEightMaleSample?: () => void;
}

export const MidSessionRescheduleModal: React.FC<MidSessionRescheduleModalProps> = ({
  isOpen,
  onClose,
  matches,
  players,
  initialCutoffMatch,
  onApplyReschedule,
  onLoadEightMaleSample,
}) => {
  const [cutoffMatch, setCutoffMatch] = useState<number>(() => {
    if (initialCutoffMatch && initialCutoffMatch > 0 && initialCutoffMatch < matches.length) {
      return initialCutoffMatch;
    }
    // Default to 5 if matches.length >= 6, else half of matches
    return matches.length >= 6 ? Math.min(5, matches.length - 1) : Math.max(1, Math.floor(matches.length / 2));
  });

  const [targetTotalMatches, setTargetTotalMatches] = useState<number>(() => {
    return Math.max(matches.length, 10);
  });

  // State of active player IDs
  const [activePlayerIds, setActivePlayerIds] = useState<string[]>(() => players.map((p) => p.id));

  // Sync state when modal opens or initialCutoffMatch changes
  useEffect(() => {
    if (isOpen) {
      const initialCut = initialCutoffMatch && initialCutoffMatch > 0 && initialCutoffMatch < matches.length
        ? initialCutoffMatch
        : matches.length >= 6 ? Math.min(5, matches.length - 1) : Math.max(1, Math.floor(matches.length / 2));
      setCutoffMatch(initialCut);
      setTargetTotalMatches(Math.max(matches.length, 10));
      setActivePlayerIds(players.map((p) => p.id));
    }
  }, [isOpen, initialCutoffMatch, matches.length, players]);

  if (!isOpen) return null;

  // Calculate how many matches each player played in the frozen matches (1..cutoffMatch)
  const frozenMatches = matches.slice(0, cutoffMatch);
  const frozenPlayedCounts = new Map<string, number>();
  players.forEach((p) => frozenPlayedCounts.set(p.id, 0));

  frozenMatches.forEach((m) => {
    [...m.teamA, ...m.teamB].forEach((id) => {
      frozenPlayedCounts.set(id, (frozenPlayedCounts.get(id) || 0) + 1);
    });
  });

  const togglePlayerActive = (id: string) => {
    setActivePlayerIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setActivePlayerIds(players.map((p) => p.id));
  };

  // 1-Click quick test case for prompt 4: "Sân 8 Nam, A1 đánh hết trận 5 rồi về, xếp lại từ trận 6 đến 10"
  const handleApplyPromptTestCase = () => {
    setCutoffMatch(5);
    setTargetTotalMatches(10);
    // Exclude the first player (e.g. A1)
    if (players.length > 0) {
      const firstPlayerId = players[0].id;
      setActivePlayerIds(players.filter((p) => p.id !== firstPlayerId).map((p) => p.id));
    }
  };

  const remainingMatchesCount = Math.max(0, targetTotalMatches - cutoffMatch);
  const activeCount = activePlayerIds.length;
  const isRunnable = activeCount >= 4 && remainingMatchesCount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRunnable) return;
    onApplyReschedule(cutoffMatch, activePlayerIds, targetTotalMatches);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Điều Chỉnh & Xếp Lại Giữa Buổi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Bảo lưu kết quả
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Thành viên về sớm / đến muộn? Tự động tái tính toán lịch thi đấu từ trận đã chọn mà không làm mất tỷ số các trận trước!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Preset Banner (Prompt 4 Highlight) */}
          <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Tình Huống Yêu Cầu (8 Nam, A1 Về Sau Trận 5)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Khóa 5 trận đầu (kèm điểm số), xếp lại từ <strong>Trận 6 đến 10</strong> cho <strong>7 người còn lại</strong> với cam kết 100% <strong>Δ ≤ 1</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onLoadEightMaleSample && (
                <button
                  type="button"
                  onClick={onLoadEightMaleSample}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold border border-slate-700 transition-colors"
                  title="Nạp nhanh 8 người Nam (A1..A8) để thử nghiệm"
                >
                  Nạp 8 Nam Mẫu
                </button>
              )}
              <button
                type="button"
                onClick={handleApplyPromptTestCase}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Áp dụng kịch bản này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section 1: Cutoff Match & Session Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cutoff Match Selector */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Khóa & Bảo Lưu Đến Trận Số:</span>
                </label>
                <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Trận {cutoffMatch}
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={Math.max(1, matches.length - 1)}
                value={cutoffMatch}
                onChange={(e) => setCutoffMatch(parseInt(e.target.value) || 1)}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Trận 1</span>
                <span>Trận {Math.max(1, matches.length - 1)}</span>
              </div>

              <p className="text-[11px] text-emerald-400/90 bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-2 flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  <strong>Trận 1 đến {cutoffMatch}</strong>: Giữ nguyên 100% tỷ số, người chơi, đội hình và kết quả thắng/thua.
                </span>
              </p>
            </div>

            {/* Total Target Matches */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span>Tổng Số Trận Cả Buổi Đấu:</span>
                </label>
                <span className="font-mono text-sm font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {targetTotalMatches} trận
                </span>
              </div>

              <div className="flex items-center gap-2">
                {[6, 8, 9, 10, 11, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTargetTotalMatches(cnt)}
                    className={`flex-1 py-1 text-xs font-mono font-semibold rounded-lg border transition-all ${
                      targetTotalMatches === cnt
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-sky-400/90 bg-sky-950/30 border border-sky-500/30 rounded-lg p-2 flex items-start gap-1.5">
                <Clock className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                <span>
                  Sẽ xếp mới <strong>{remainingMatchesCount} trận</strong> (từ Trận {cutoffMatch + 1} đến Trận {targetTotalMatches}).
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Player Presence / Attendance Checklist */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Điểm Danh Thành Viên Còn Lại Trên Sân</span>
                  <span className="text-xs font-mono text-slate-400">
                    ({activeCount}/{players.length} người đang có mặt)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Bỏ chọn người chơi đã về sớm (ví dụ A1). Thuật toán sẽ chỉ xếp các trận từ Trận {cutoffMatch + 1} cho những ai được chọn.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 font-medium transition-colors"
                >
                  Chọn tất cả ({players.length})
                </button>
              </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {players.map((p) => {
                const isActive = activePlayerIds.includes(p.id);
                const rankDef = getRankDefinitionByScore(p.rankScore);
                const playedInPast = frozenPlayedCounts.get(p.id) || 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => togglePlayerActive(p.id)}
                    className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 select-none ${
                      isActive
                        ? 'bg-slate-900 border-emerald-500/60 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="truncate">
                        <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {p.gender === 'MALE' ? '♂' : '♀'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Đã đánh {cutoffMatch} trận đầu: <strong className="text-white font-mono">{playedInPast} trận</strong>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isActive ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center">
                            <UserCheck className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center justify-center">
                            <UserX className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                      <span
                        className="font-semibold px-1.5 py-0.2 rounded"
                        style={{
                          backgroundColor: rankDef.bgLight,
                          color: rankDef.color,
                          borderColor: rankDef.borderLight,
                        }}
                      >
                        {rankDef.shortLabel} ({rankDef.score}đ)
                      </span>

                      <span className={`font-semibold ${isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isActive ? '✓ Đang có mặt' : '✕ Đã về / Vắng'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {activeCount < 4 && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Cần ít nhất 4 người chơi đang có mặt để xếp các trận đấu đôi tiếp theo.</span>
              </div>
            )}
          </div>

          {/* Section 3: Summary Plan */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Kế hoạch xếp trận sau điều chỉnh:</span>
            </h4>
            <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc list-inside">
              <li>
                <strong className="text-emerald-300">Trận 1 → Trận {cutoffMatch}</strong>: Bảo lưu nguyên vẹn danh sách vận động viên, điểm số và kết quả đã đấu.
              </li>
              <li>
                <strong className="text-amber-300">Trận {cutoffMatch + 1} → Trận {targetTotalMatches}</strong>: Xếp lại độc quyền cho <strong className="text-white">{activeCount} thành viên</strong> còn lại trên sân.
              </li>
              <li>
                <strong className="text-sky-300">Chỉ số cân bằng Δ ≤ 1</strong>: 100% các trận xếp mới được tối ưu chênh lệch điểm trình độ ≤ 1, phân bổ đều số set và hạn chế lặp lại partner.
              </li>
            </ul>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Đóng / Hủy bỏ
          </button>

          <button
            type="button"
            disabled={!isRunnable}
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isRunnable
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              Xếp Lại Từ Trận {cutoffMatch + 1} Đến {targetTotalMatches} (Bảo Lưu {cutoffMatch} Trận Đầu)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
