import React, { useState } from 'react';
import { Match, Player, getRankDefinitionByScore } from '../types/badminton';
import { BadmintonCourtSvg } from './BadmintonCourtSvg';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Plus,
  Minus,
} from 'lucide-react';

interface CourtManagerProps {
  matches: Match[];
  players: Player[];
  onUpdateMatchScore: (matchId: string, gameScoreA: number, gameScoreB: number, status?: Match['status']) => void;
}

export const CourtManager: React.FC<CourtManagerProps> = ({
  matches,
  players,
  onUpdateMatchScore,
}) => {
  const [courtCount, setCourtCount] = useState<number>(4);
  const [servingTeam, setServingTeam] = useState<Record<number, 'A' | 'B'>>({
    1: 'A',
    2: 'B',
    3: 'A',
    4: 'B',
  });

  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const courts = Array.from({ length: courtCount }, (_, i) => i + 1);

  // Group matches by court
  const getMatchesForCourt = (courtNum: number) => {
    return matches.filter((m) => (m.courtNumber || 1) === courtNum);
  };

  const toggleServe = (courtNum: number) => {
    setServingTeam((prev) => ({
      ...prev,
      [courtNum]: prev[courtNum] === 'A' ? 'B' : 'A',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Court Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Bảng Điều Khiển Sân Đấu (Badminton Live Arena)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Giám sát trực quan sân đấu, nhập điểm live, quản lý giao cầu và hàng đợi trận tiếp theo
          </p>
        </div>

        {/* Court count switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Số lượng sân:</span>
          {[2, 3, 4, 6].map((num) => (
            <button
              key={num}
              onClick={() => setCourtCount(num)}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-colors ${
                courtCount === num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {num} Sân
            </button>
          ))}
        </div>
      </div>

      {/* Courts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courts.map((courtNum) => {
          const courtMatches = getMatchesForCourt(courtNum);
          const activeMatch = courtMatches.find((m) => m.status !== 'COMPLETED') || courtMatches[0];
          const queuedMatches = courtMatches.filter((m) => m.matchId !== activeMatch?.matchId && m.status !== 'COMPLETED');

          if (!activeMatch) {
            return (
              <div
                key={courtNum}
                className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center min-h-[360px]"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3 font-bold font-mono">
                  S{courtNum}
                </div>
                <h3 className="text-base font-semibold text-slate-300">Sân {courtNum} đang trống</h3>
                <p className="text-xs text-slate-500 mt-1">Chưa có trận đấu nào được phân bổ cho sân này</p>
              </div>
            );
          }

          const pA1 = playerMap.get(activeMatch.teamA[0]);
          const pA2 = playerMap.get(activeMatch.teamA[1]);
          const pB1 = playerMap.get(activeMatch.teamB[0]);
          const pB2 = playerMap.get(activeMatch.teamB[1]);

          const gA = activeMatch.gameScoreA ?? 0;
          const gB = activeMatch.gameScoreB ?? 0;
          const currentServe = servingTeam[courtNum] || 'A';

          return (
            <div
              key={courtNum}
              className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col"
            >
              {/* Court Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                    SÂN {courtNum}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {activeMatch.type === 'MIXED_DOUBLE'
                      ? 'Đôi Nam Nữ'
                      : activeMatch.type === 'MENS_DOUBLE'
                      ? 'Đôi Nam'
                      : 'Đôi Nữ'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Lượt {activeMatch.phase})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activeMatch.delta === 0 ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Δ = 0
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Δ = {activeMatch.delta}
                    </span>
                  )}
                  {activeMatch.status === 'COMPLETED' ? (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      Đã xong
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold animate-pulse">
                      <Flame className="w-3 h-3 text-emerald-400" />
                      Live Match
                    </span>
                  )}
                </div>
              </div>

              {/* Court Visual Diagram */}
              <div className="p-4 bg-slate-950/40">
                <BadmintonCourtSvg
                  className="w-full h-44"
                  teamANames={[pA1?.name || '', pA2?.name || '']}
                  teamBNames={[pB1?.name || '', pB2?.name || '']}
                  scoreA={gA}
                  scoreB={gB}
                  activeServe={currentServe}
                />
              </div>

              {/* Live Match Info & Controls */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-4">
                  {/* Side A */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => toggleServe(courtNum)}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                          currentServe === 'A'
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                        title="Click để đổi quyền giao cầu"
                      >
                        {currentServe === 'A' && '🏸 Giao'} Đội A ({activeMatch.scoreA}đ)
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {pA1?.name}
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {pA2?.name}
                    </div>

                    {/* Point button */}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(activeMatch.matchId, Math.max(0, gA - 1), gB)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        title="Giảm 1 điểm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={35}
                        value={gA === 0 ? '' : gA}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                          onUpdateMatchScore(activeMatch.matchId, val, gB);
                        }}
                        className="w-12 text-center font-mono text-xl font-black text-emerald-400 bg-slate-900 border border-slate-700/80 rounded py-0.5 focus:border-emerald-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Điền trực tiếp điểm Đội A"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(activeMatch.matchId, gA + 1, gB)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        title="Cộng 1 điểm"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Side B */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        type="button"
                        onClick={() => toggleServe(courtNum)}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                          currentServe === 'B'
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-sky-500/10 text-sky-400'
                        }`}
                        title="Click để đổi quyền giao cầu"
                      >
                        {currentServe === 'B' && '🏸 Giao'} Đội B ({activeMatch.scoreB}đ)
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {pB1?.name}
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {pB2?.name}
                    </div>

                    {/* Point button */}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(activeMatch.matchId, gA, Math.max(0, gB - 1))}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        title="Giảm 1 điểm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={35}
                        value={gB === 0 ? '' : gB}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                          onUpdateMatchScore(activeMatch.matchId, gA, val);
                        }}
                        className="w-12 text-center font-mono text-xl font-black text-sky-400 bg-slate-900 border border-slate-700/80 rounded py-0.5 focus:border-sky-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Điền trực tiếp điểm Đội B"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateMatchScore(activeMatch.matchId, gA, gB + 1)}
                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                        title="Cộng 1 điểm"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>

                {/* Queue status */}
                {queuedMatches.length > 0 && (
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-xs flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">Trận kế tiếp: {queuedMatches[0].type === 'MIXED_DOUBLE' ? 'Đôi Nam Nữ' : 'Cùng giới'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      +{queuedMatches.length} trận đợi
                    </span>
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
