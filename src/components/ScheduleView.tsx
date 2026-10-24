import React, { useState } from 'react';
import { Match, Player, getRankDefinitionByScore } from '../types/badminton';
import {
  Trophy,
  Users,
  CheckCircle2,
  Clock,
  Play,
  Share2,
  Check,
  Award,
  Filter,
  Plus,
  Minus,
  Sliders,
  Swords,
  Medal,
  AlertCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Lock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { calculatePlayerSetStats } from '../services/playerStatsService';

interface ScheduleViewProps {
  matches: Match[];
  players: Player[];
  onUpdateMatchScore: (matchId: string, gameScoreA: number, gameScoreB: number, status?: Match['status']) => void;
  onOpenSessionConfig?: () => void;
  onNavigateToStats?: () => void;
  onOpenRescheduleModal?: (cutoffMatchNumber?: number) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  matches,
  players,
  onUpdateMatchScore,
  onOpenSessionConfig,
  onNavigateToStats,
  onOpenRescheduleModal,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'ALL' | number>('ALL');
  const [selectedCourt, setSelectedCourt] = useState<'ALL' | number>('ALL');
  const [copied, setCopied] = useState(false);
  const [showQuickStats, setShowQuickStats] = useState(false);

  // Compute live set statistics for fast reference
  const statsSummary = calculatePlayerSetStats(players, matches);

  // Player lookup map
  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const filteredMatches = matches.filter((m) => {
    if (selectedPhase !== 'ALL') {
      if (selectedPhase === 999) {
        if (!m.sourceMatchA && m.stage !== 'WINNER_BRACKET' && m.stage !== 'LOSER_BRACKET') return false;
      } else if (m.phase !== selectedPhase) {
        return false;
      }
    }
    if (selectedCourt !== 'ALL' && m.courtNumber !== selectedCourt) return false;
    return true;
  });

  const isPlayoffModeActive = matches.some((m) => m.stage === 'WINNER_BRACKET' || m.stage === 'LOSER_BRACKET' || m.sourceMatchA);
  const playoffMatches = matches.filter((m) => m.stage === 'WINNER_BRACKET' || m.stage === 'LOSER_BRACKET' || m.sourceMatchA);
  const distinctPhases = Array.from(new Set(matches.filter((m) => !m.sourceMatchA && m.stage !== 'WINNER_BRACKET' && m.stage !== 'LOSER_BRACKET').map((m) => m.phase))).sort((a, b) => a - b);

  const handleCopySchedule = () => {
    let text = `🏸 LỊCH THI ĐẤU CẦU LÔNG - BADMINTON MATCHMAKER\n`;
    text += `Tổng số trận: ${matches.length} | Người chơi: ${players.length}\n\n`;

    matches.forEach((m, idx) => {
      const p1 = playerMap.get(m.teamA[0])?.name || m.sourceMatchA?.matchLabel || 'Chưa xác định';
      const p2 = playerMap.get(m.teamA[1])?.name || '';
      const p3 = playerMap.get(m.teamB[0])?.name || m.sourceMatchB?.matchLabel || 'Chưa xác định';
      const p4 = playerMap.get(m.teamB[1])?.name || '';

      const teamAStr = p2 ? `${p1} & ${p2}` : p1;
      const teamBStr = p4 ? `${p3} & ${p4}` : p3;

      text += `Trận ${idx + 1} [${m.type === 'MIXED_DOUBLE' ? 'Đôi Nam Nữ' : m.type === 'MENS_DOUBLE' ? 'Đôi Nam' : 'Đôi Nữ'}] (Sân ${m.courtNumber || 1}) - ${m.phaseLabel}:\n`;
      text += `  Đội A (${m.scoreA}đ): ${teamAStr}\n`;
      text += `  VS\n`;
      text += `  Đội B (${m.scoreB}đ): ${teamBStr}\n`;
      text += `  Delta: ${m.delta}đ\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getMatchTypeLabel = (type: Match['type']) => {
    switch (type) {
      case 'MENS_DOUBLE':
        return { label: 'Đôi Nam', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'WOMENS_DOUBLE':
        return { label: 'Đôi Nữ', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'MIXED_DOUBLE':
        return { label: 'Đôi Nam Nữ (Mix)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      default:
        return { label: 'Đôi Giao Lưu', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc lượt đấu:</span>
          </div>
          <button
            onClick={() => setSelectedPhase('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPhase === 'ALL'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({matches.length})
          </button>
          {distinctPhases.map((phaseNum) => {
            const count = matches.filter((m) => m.phase === phaseNum && !m.sourceMatchA && m.stage !== 'WINNER_BRACKET' && m.stage !== 'LOSER_BRACKET').length;
            const label = distinctPhases.length === 2
              ? phaseNum === 1 ? 'Lượt 1: Cùng giới' : 'Lượt 2: Nam Nữ'
              : `Vòng ${phaseNum}`;
            return (
              <button
                key={phaseNum}
                onClick={() => setSelectedPhase(phaseNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPhase === phaseNum
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
          {isPlayoffModeActive && playoffMatches.length > 0 && (
            <button
              onClick={() => setSelectedPhase(999)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedPhase === 999
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-amber-300 hover:text-amber-200'
              }`}
            >
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Phân Hạng Thắng/Thua ({playoffMatches.length})</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Player Set Stats Toggle */}
          <button
            type="button"
            onClick={() => setShowQuickStats(!showQuickStats)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              showQuickStats
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Xem nhanh mỗi người đã đánh bao nhiêu set, thắng thua ra sao"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Thống kê set ({statsSummary.totalCompletedMatches}/{statsSummary.totalMatches})</span>
            {showQuickStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onOpenSessionConfig && (
            <button
              onClick={onOpenSessionConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-500/40 text-xs text-emerald-300 font-semibold transition-colors"
              title="Mở rộng số trận đấu trong buổi (8, 10, 12, 16 trận) và xếp tiếp từ kết quả"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cấu hình số trận ({matches.length})</span>
            </button>
          )}

          {onOpenRescheduleModal && (
            <button
              onClick={() => onOpenRescheduleModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 font-semibold transition-colors"
              title="Thành viên về sớm (ví dụ A1 về sau trận 5) hoặc đến muộn? Tự động xếp lại các trận còn lại mà không làm mất tỷ số các trận trước"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Xếp lại giữa buổi (Về sớm/Muộn)</span>
            </button>
          )}

          <button
            onClick={handleCopySchedule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Sao chép lịch đấu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Quick Player Set Stats Grid */}
      {showQuickStats && (
        <div className="bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Thống Kê Số Set & Kết Quả Từng Cầu Thủ ({players.length} người)
              </h3>
            </div>
            {onNavigateToStats && (
              <button
                type="button"
                onClick={onNavigateToStats}
                className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Xem BXH đầy đủ & chi tiết →</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {statsSummary.playerStatsList.map((stat, idx) => {
              const rankDef = getRankDefinitionByScore(stat.player.rankScore);
              return (
                <div
                  key={stat.player.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 flex flex-col justify-between transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-200 text-xs truncate">
                      {stat.player.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {stat.player.gender === 'MALE' ? '♂' : '♀'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between mb-1">
                    <span>Số set:</span>
                    <span className="font-mono font-bold text-white">
                      {stat.completedSets}/{stat.totalScheduledSets}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-400 font-bold">
                      {stat.wonSets}T - {stat.lostSets}B
                    </span>
                    <span className="text-slate-400">
                      {stat.completedSets > 0 ? `${stat.winRate}%` : '--'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredMatches.map((m, index) => {
          const typeInfo = getMatchTypeLabel(m.type);
          const pA1 = playerMap.get(m.teamA[0]);
          const pA2 = playerMap.get(m.teamA[1]);
          const pB1 = playerMap.get(m.teamB[0]);
          const pB2 = playerMap.get(m.teamB[1]);

          const isPlayoff = !!(m.sourceMatchA || m.sourceMatchB) || m.stage === 'WINNER_BRACKET' || m.stage === 'LOSER_BRACKET';
          const isPendingA = !pA1 && !!m.sourceMatchA;
          const isPendingB = !pB1 && !!m.sourceMatchB;

          const rankA1 = pA1 ? getRankDefinitionByScore(pA1.rankScore) : null;
          const rankA2 = pA2 ? getRankDefinitionByScore(pA2.rankScore) : null;
          const rankB1 = pB1 ? getRankDefinitionByScore(pB1.rankScore) : null;
          const rankB2 = pB2 ? getRankDefinitionByScore(pB2.rankScore) : null;

          const gA = m.gameScoreA ?? 0;
          const gB = m.gameScoreB ?? 0;
          const isDone = m.status === 'COMPLETED';
          const matchSeqNum = matches.findIndex((orig) => orig.matchId === m.matchId) + 1;

          return (
            <div
              key={m.matchId}
              className={`relative bg-slate-900/90 rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
                isPlayoff
                  ? m.stage === 'WINNER_BRACKET'
                    ? 'border-amber-500/50 hover:border-amber-500/80 bg-gradient-to-b from-amber-950/20 to-slate-900/90'
                    : 'border-purple-500/40 hover:border-purple-500/70 bg-gradient-to-b from-purple-950/20 to-slate-900/90'
                  : m.delta === 0
                  ? 'border-emerald-500/40 hover:border-emerald-500/70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Strip */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
                    isPlayoff
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Sân {m.courtNumber || 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isPlayoff ? (
                    <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      m.stage === 'WINNER_BRACKET'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}>
                      {m.stage === 'WINNER_BRACKET' ? (
                        <>
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>Chung Kết (Thắng gặp Thắng)</span>
                        </>
                      ) : (
                        <>
                          <Medal className="w-3 h-3 text-purple-400" />
                          <span>Hạng Ba (Thua gặp Thua)</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Lượt {m.phase}
                    </span>
                  )}

                  {!isPendingA && !isPendingB && (
                    m.delta === 0 ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Δ = 0
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Δ = {m.delta}
                      </span>
                    )
                  )}

                  {m.isLockedPast && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 shrink-0"
                      title="Trận đấu thuộc nhóm bảo lưu kết quả, không thay đổi"
                    >
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Bảo lưu</span>
                    </span>
                  )}

                  {m.isRescheduled && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0"
                      title="Trận đấu được xếp lại linh hoạt giữa buổi theo sĩ số còn lại"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      <span>Xếp lại (Δ ≤ 1)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Matchup Body */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-11 items-center gap-2">
                  {/* Team A Box (5 cols) */}
                  <div className={`col-span-5 p-3 rounded-xl border transition-all ${
                    isDone && gA > gB
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span>Đội A</span>
                        {m.sourceMatchA && (
                          <span className="text-[9px] lowercase font-normal px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                            ({m.sourceMatchA.matchLabel})
                          </span>
                        )}
                      </span>
                      {!isPendingA && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {m.scoreA}đ
                        </span>
                      )}
                    </div>

                    {isPendingA ? (
                      <div className="py-3 text-center text-xs text-amber-400/90 font-medium border border-dashed border-amber-500/30 rounded-lg bg-amber-950/20">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-amber-400 animate-pulse" />
                        <span>Đang chờ: {m.sourceMatchA?.matchLabel}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Player A1 */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-400 text-[10px]">
                              {pA1?.gender === 'MALE' ? '♂' : '♀'}
                            </span>
                            <span className="font-medium text-slate-200 truncate">
                              {pA1?.name || m.teamA[0]}
                            </span>
                          </div>
                          {rankA1 && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                backgroundColor: rankA1.bgLight,
                                color: rankA1.color,
                                borderColor: rankA1.borderLight,
                              }}
                            >
                              {rankA1.shortLabel} ({rankA1.score}đ)
                            </span>
                          )}
                        </div>

                        {/* Player A2 */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-400 text-[10px]">
                              {pA2?.gender === 'MALE' ? '♂' : '♀'}
                            </span>
                            <span className="font-medium text-slate-200 truncate">
                              {pA2?.name || m.teamA[1]}
                            </span>
                          </div>
                          {rankA2 && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                backgroundColor: rankA2.bgLight,
                                color: rankA2.color,
                                borderColor: rankA2.borderLight,
                              }}
                            >
                              {rankA2.shortLabel} ({rankA2.score}đ)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VS Middle (1 col) */}
                  <div className="col-span-1 text-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      VS
                    </span>
                  </div>

                  {/* Team B Box (5 cols) */}
                  <div className={`col-span-5 p-3 rounded-xl border transition-all ${
                    isDone && gB > gA
                      ? 'bg-sky-950/30 border-sky-500/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                        <span>Đội B</span>
                        {m.sourceMatchB && (
                          <span className="text-[9px] lowercase font-normal px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                            ({m.sourceMatchB.matchLabel})
                          </span>
                        )}
                      </span>
                      {!isPendingB && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          {m.scoreB}đ
                        </span>
                      )}
                    </div>

                    {isPendingB ? (
                      <div className="py-3 text-center text-xs text-amber-400/90 font-medium border border-dashed border-amber-500/30 rounded-lg bg-amber-950/20">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-amber-400 animate-pulse" />
                        <span>Đang chờ: {m.sourceMatchB?.matchLabel}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Player B1 */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-400 text-[10px]">
                              {pB1?.gender === 'MALE' ? '♂' : '♀'}
                            </span>
                            <span className="font-medium text-slate-200 truncate">
                              {pB1?.name || m.teamB[0]}
                            </span>
                          </div>
                          {rankB1 && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                backgroundColor: rankB1.bgLight,
                                color: rankB1.color,
                                borderColor: rankB1.borderLight,
                              }}
                            >
                              {rankB1.shortLabel} ({rankB1.score}đ)
                            </span>
                          )}
                        </div>

                        {/* Player B2 */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-400 text-[10px]">
                              {pB2?.gender === 'MALE' ? '♂' : '♀'}
                            </span>
                            <span className="font-medium text-slate-200 truncate">
                              {pB2?.name || m.teamB[1]}
                            </span>
                          </div>
                          {rankB2 && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                backgroundColor: rankB2.bgLight,
                                color: rankB2.color,
                                borderColor: rankB2.borderLight,
                              }}
                            >
                              {rankB2.shortLabel} ({rankB2.score}đ)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scorekeeper Row */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Điền tỷ số:</span>
                    <div className="flex items-center gap-1.5">
                      {/* Team A direct score input */}
                      <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700/80 focus-within:border-emerald-500 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateMatchScore(m.matchId, Math.max(0, gA - 1), gB)}
                          className="p-1 hover:text-emerald-400 text-slate-400"
                          title="Giảm 1 điểm"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={35}
                          value={gA === 0 ? '' : gA}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                            onUpdateMatchScore(m.matchId, val, gB);
                          }}
                          className="w-10 text-center font-mono font-bold text-emerald-400 text-sm bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title="Nhập trực tiếp số điểm Đội A"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateMatchScore(m.matchId, gA + 1, gB)}
                          className="p-1 hover:text-emerald-400 text-slate-400"
                          title="Tăng 1 điểm"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-slate-500 font-bold">:</span>

                      {/* Team B direct score input */}
                      <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700/80 focus-within:border-sky-500 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateMatchScore(m.matchId, gA, Math.max(0, gB - 1))}
                          className="p-1 hover:text-sky-400 text-slate-400"
                          title="Giảm 1 điểm"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={35}
                          value={gB === 0 ? '' : gB}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                            onUpdateMatchScore(m.matchId, gA, val);
                          }}
                          className="w-10 text-center font-mono font-bold text-sky-400 text-sm bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          title="Nhập trực tiếp số điểm Đội B"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateMatchScore(m.matchId, gA, gB + 1)}
                          className="p-1 hover:text-sky-400 text-slate-400"
                          title="Tăng 1 điểm"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle & Quick Sets */}
                  <div className="flex items-center gap-1.5">
                    {/* Quick 21 button */}
                    <button
                      type="button"
                      onClick={() => onUpdateMatchScore(m.matchId, 21, gB === 0 ? 19 : gB, 'COMPLETED')}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Gán nhanh Đội A 21 điểm"
                    >
                      A=21
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateMatchScore(m.matchId, gA === 0 ? 19 : gA, 21, 'COMPLETED')}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Gán nhanh Đội B 21 điểm"
                    >
                      B=21
                    </button>

                    {isDone ? (
                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(m.matchId, gA, gB, 'SCHEDULED')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors ml-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Đã chốt</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(m.matchId, gA, gB, 'COMPLETED')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors ml-1"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-400" />
                        <span>Chốt trận</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mid-Session Reschedule Shortcut Link */}
                {onOpenRescheduleModal && matchSeqNum < matches.length && (
                  <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-500">
                      {m.isLockedPast ? '✓ Đã bảo lưu kết quả' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenRescheduleModal(matchSeqNum)}
                      className="text-[11px] text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold ml-auto"
                      title={`Bảo lưu từ Trận 1 đến Trận ${matchSeqNum}, xếp lại từ Trận ${matchSeqNum + 1} đến hết (ví dụ khi có người về sớm)`}
                    >
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>Xếp lại từ sau Trận {matchSeqNum} (Trận {matchSeqNum + 1} → {matches.length})...</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
