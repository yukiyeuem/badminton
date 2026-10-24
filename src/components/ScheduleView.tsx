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
} from 'lucide-react';

interface ScheduleViewProps {
  matches: Match[];
  players: Player[];
  onUpdateMatchScore: (matchId: string, gameScoreA: number, gameScoreB: number, status?: Match['status']) => void;
  onSwapTeams?: (matchId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  matches,
  players,
  onUpdateMatchScore,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'ALL' | 1 | 2>('ALL');
  const [selectedCourt, setSelectedCourt] = useState<'ALL' | number>('ALL');
  const [copied, setCopied] = useState(false);

  // Player lookup map
  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const filteredMatches = matches.filter((m) => {
    if (selectedPhase !== 'ALL' && m.phase !== selectedPhase) return false;
    if (selectedCourt !== 'ALL' && m.courtNumber !== selectedCourt) return false;
    return true;
  });

  const phase1Matches = matches.filter((m) => m.phase === 1);
  const phase2Matches = matches.filter((m) => m.phase === 2);

  const handleCopySchedule = () => {
    let text = `🏸 LỊCH THI ĐẤU CẦU LÔNG - BADMINTON MATCHMAKER\n`;
    text += `Tổng số trận: ${matches.length} | Người chơi: ${players.length}\n\n`;

    matches.forEach((m, idx) => {
      const p1 = playerMap.get(m.teamA[0])?.name || m.teamA[0];
      const p2 = playerMap.get(m.teamA[1])?.name || m.teamA[1];
      const p3 = playerMap.get(m.teamB[0])?.name || m.teamB[0];
      const p4 = playerMap.get(m.teamB[1])?.name || m.teamB[1];
      text += `Trận ${idx + 1} [${m.type === 'MIXED_DOUBLE' ? 'Đôi Nam Nữ' : m.type === 'MENS_DOUBLE' ? 'Đôi Nam' : 'Đôi Nữ'}] (Sân ${m.courtNumber || 1}):\n`;
      text += `  Đội A (${m.scoreA}đ): ${p1} & ${p2}\n`;
      text += `  VS\n`;
      text += `  Đội B (${m.scoreB}đ): ${p3} & ${p4}\n`;
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
          <button
            onClick={() => setSelectedPhase(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPhase === 1
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Lượt 1: Cùng giới ({phase1Matches.length})
          </button>
          <button
            onClick={() => setSelectedPhase(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPhase === 2
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Lượt 2: Nam Nữ ({phase2Matches.length})
          </button>
        </div>

        {/* Export / Share */}
        <div className="flex items-center gap-2">
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

      {/* Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredMatches.map((m, index) => {
          const typeInfo = getMatchTypeLabel(m.type);
          const pA1 = playerMap.get(m.teamA[0]);
          const pA2 = playerMap.get(m.teamA[1]);
          const pB1 = playerMap.get(m.teamB[0]);
          const pB2 = playerMap.get(m.teamB[1]);

          const rankA1 = pA1 ? getRankDefinitionByScore(pA1.rankScore) : null;
          const rankA2 = pA2 ? getRankDefinitionByScore(pA2.rankScore) : null;
          const rankB1 = pB1 ? getRankDefinitionByScore(pB1.rankScore) : null;
          const rankB2 = pB2 ? getRankDefinitionByScore(pB2.rankScore) : null;

          const gA = m.gameScoreA ?? 0;
          const gB = m.gameScoreB ?? 0;
          const isDone = m.status === 'COMPLETED';

          return (
            <div
              key={m.matchId}
              className={`relative bg-slate-900/90 rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
                m.delta === 0
                  ? 'border-emerald-500/40 hover:border-emerald-500/70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Strip */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs font-mono">
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
                  <span className="text-[11px] text-slate-400 font-mono">
                    Lượt {m.phase}
                  </span>
                  {m.delta === 0 ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Δ = 0 (Hoàn hảo)
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Δ = {m.delta}
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
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Đội A
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {m.scoreA}đ
                      </span>
                    </div>

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
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                        Đội B
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        {m.scoreB}đ
                      </span>
                    </div>

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
                  </div>
                </div>

                {/* Scorekeeper Row */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">Tỷ số set:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 px-1">
                        <button
                          onClick={() => onUpdateMatchScore(m.matchId, Math.max(0, gA - 1), gB)}
                          className="p-1 hover:text-emerald-400 text-slate-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-emerald-400 text-sm">
                          {gA}
                        </span>
                        <button
                          onClick={() => onUpdateMatchScore(m.matchId, gA + 1, gB)}
                          className="p-1 hover:text-emerald-400 text-slate-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-slate-600 font-bold">:</span>

                      <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 px-1">
                        <button
                          onClick={() => onUpdateMatchScore(m.matchId, gA, Math.max(0, gB - 1))}
                          className="p-1 hover:text-sky-400 text-slate-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-sky-400 text-sm">
                          {gB}
                        </span>
                        <button
                          onClick={() => onUpdateMatchScore(m.matchId, gA, gB + 1)}
                          className="p-1 hover:text-sky-400 text-slate-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div>
                    {isDone ? (
                      <button
                        onClick={() => onUpdateMatchScore(m.matchId, gA, gB, 'SCHEDULED')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Đã kết thúc</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateMatchScore(m.matchId, gA, gB, 'COMPLETED')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-400" />
                        <span>Chốt trận</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
