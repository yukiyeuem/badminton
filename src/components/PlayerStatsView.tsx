import React, { useState } from 'react';
import { Player, Match, getRankDefinitionByScore } from '../types/badminton';
import {
  calculatePlayerSetStats,
  generateClubStatsReportText,
  PlayerSetStats,
  PlayerSetMatchDetail,
} from '../services/playerStatsService';
import {
  Trophy,
  Medal,
  Award,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Search,
  Filter,
  Copy,
  Check,
  Flame,
  Zap,
  TrendingUp,
  X,
  Swords,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlayerStatsViewProps {
  players: Player[];
  matches: Match[];
  onUpdateMatchScore: (
    matchId: string,
    gameScoreA: number,
    gameScoreB: number,
    status?: Match['status']
  ) => void;
  onNavigateToSchedule?: () => void;
}

type SortField = 'wonSets' | 'completedSets' | 'winRate' | 'pointDiff' | 'totalScheduledSets' | 'name';

export const PlayerStatsView: React.FC<PlayerStatsViewProps> = ({
  players,
  matches,
  onUpdateMatchScore,
  onNavigateToSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [sortField, setSortField] = useState<SortField>('wonSets');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedPlayerStat, setSelectedPlayerStat] = useState<PlayerSetStats | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute live statistics
  const summary = calculatePlayerSetStats(players, matches);

  // Filter & sort
  const filteredList = summary.playerStatsList
    .filter((stat) => {
      if (searchTerm && !stat.player.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (genderFilter !== 'ALL' && stat.player.gender !== genderFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      switch (sortField) {
        case 'wonSets':
          diff = a.wonSets - b.wonSets;
          if (diff === 0) diff = a.winRate - b.winRate;
          if (diff === 0) diff = a.pointDiff - b.pointDiff;
          break;
        case 'completedSets':
          diff = a.completedSets - b.completedSets;
          if (diff === 0) diff = a.wonSets - b.wonSets;
          break;
        case 'winRate':
          diff = a.winRate - b.winRate;
          if (diff === 0) diff = a.wonSets - b.wonSets;
          break;
        case 'pointDiff':
          diff = a.pointDiff - b.pointDiff;
          break;
        case 'totalScheduledSets':
          diff = a.totalScheduledSets - b.totalScheduledSets;
          break;
        case 'name':
          diff = a.player.name.localeCompare(b.player.name);
          break;
      }
      return sortAsc ? diff : -diff;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleCopyReport = () => {
    const text = generateClubStatsReportText(summary);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Quick simulate scores for any uncompleted matches so user can preview full stats
  const handleSimulatePendingScores = () => {
    let simulatedCount = 0;
    matches.forEach((m) => {
      const isDone =
        m.status === 'COMPLETED' ||
        (m.gameScoreA !== undefined && m.gameScoreB !== undefined && ((m.gameScoreA ?? 0) > 0 || (m.gameScoreB ?? 0) > 0));
      if (!isDone) {
        // Random standard badminton set score: 21-17, 21-19, 21-15, 22-20
        const winnerScore = 21;
        const loserScore = 15 + Math.floor(Math.random() * 5); // 15 to 19
        const isTeamAWinner = Math.random() > 0.5;
        const scoreA = isTeamAWinner ? winnerScore : loserScore;
        const scoreB = isTeamAWinner ? loserScore : winnerScore;
        onUpdateMatchScore(m.matchId, scoreA, scoreB, 'COMPLETED');
        simulatedCount += 1;
      }
    });

    if (simulatedCount > 0) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleResetScores = () => {
    matches.forEach((m) => {
      onUpdateMatchScore(m.matchId, 0, 0, 'SCHEDULED');
    });
  };

  // Keep modal player stat updated
  const activeModalStat = selectedPlayerStat
    ? summary.playerStatsList.find((s) => s.player.id === selectedPlayerStat.player.id) || selectedPlayerStat
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Sets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Tổng Số Trận / Set</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {summary.totalMatches}{' '}
              <span className="text-xs font-normal text-slate-400">set đấu</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary.totalPlayers} thành viên tham gia
            </div>
          </div>
        </div>

        {/* KPI 2: Completed Sets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-medium">Tiến Độ Set Đã Đánh</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {summary.totalCompletedMatches}{' '}
              <span className="text-xs font-normal text-slate-400">/ {summary.totalMatches}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${summary.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: MVP Player */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="truncate">
            <div className="text-xs text-slate-400 font-medium">Thắng Nhiều Set Nhất</div>
            {summary.mvp && summary.mvp.wonSets > 0 ? (
              <>
                <div className="text-base font-bold text-amber-300 truncate mt-0.5">
                  {summary.mvp.player.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  <span className="text-emerald-400 font-bold">{summary.mvp.wonSets} set thắng</span> (
                  {summary.mvp.winRate}%)
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500 italic mt-1">Chưa có set nào kết thúc</div>
            )}
          </div>
        </div>

        {/* KPI 4: Top Scorer / Hiệu số */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div className="truncate">
            <div className="text-xs text-slate-400 font-medium">Vua Ghi Điểm</div>
            {summary.topScorer && summary.topScorer.totalPointsScored > 0 ? (
              <>
                <div className="text-base font-bold text-purple-300 truncate mt-0.5">
                  {summary.topScorer.player.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  <span className="text-purple-400 font-bold">
                    {summary.topScorer.totalPointsScored} điểm
                  </span>{' '}
                  (Hiệu số: {summary.topScorer.pointDiff >= 0 ? `+${summary.topScorer.pointDiff}` : summary.topScorer.pointDiff})
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500 italic mt-1">Chưa có điểm thi đấu</div>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Sorting & Actions */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search & Gender filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm cầu thủ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setGenderFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                genderFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả ({players.length})
            </button>
            <button
              onClick={() => setGenderFilter('MALE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                genderFilter === 'MALE'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ♂ Nam
            </button>
            <button
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                genderFilter === 'FEMALE'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ♀ Nữ
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Simulate Button for Testing/Demoing */}
          {summary.totalCompletedMatches < summary.totalMatches && (
            <button
              onClick={handleSimulatePendingScores}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
              title="Tự động điền điểm mô phỏng 21-xx cho các set chưa đấu để xem trước bảng tổng kết"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Điền Nhanh Điểm Test</span>
            </button>
          )}

          {summary.totalCompletedMatches > 0 && (
            <button
              onClick={handleResetScores}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
              title="Đặt lại toàn bộ điểm các trận về 0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Điểm</span>
            </button>
          )}

          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            title="Sao chép văn bản thống kê bảng kết quả gửi Zalo/Facebook nhóm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép Báo Cáo Zalo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Player Set Statistics Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px] select-none">
              <tr>
                <th className="py-3.5 px-4 font-semibold text-center w-12">#</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Cầu Thủ</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-3 font-semibold">Trình Độ</th>
                <th
                  onClick={() => handleSort('totalScheduledSets')}
                  className="py-3.5 px-3 font-semibold text-center cursor-pointer hover:text-white"
                  title="Tổng số set đấu được thuật toán xếp cho người này"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Số Set Xếp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('completedSets')}
                  className="py-3.5 px-3 font-semibold text-center cursor-pointer hover:text-white"
                  title="Số set đã thi đấu xong (có kết quả)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Đã Đánh</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('wonSets')}
                  className="py-3.5 px-3 font-semibold text-center cursor-pointer hover:text-white text-emerald-400"
                  title="Số set chiến thắng"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Thắng</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-3 font-semibold text-center text-rose-400" title="Số set thua">
                  Thua
                </th>
                <th
                  onClick={() => handleSort('winRate')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white"
                  title="Tỷ lệ thắng = Set Thắng / Set Đã Đánh"
                >
                  <div className="flex items-center gap-1">
                    <span>Tỷ Lệ Thắng</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('pointDiff')}
                  className="py-3.5 px-4 font-semibold text-center cursor-pointer hover:text-white"
                  title="Hiệu số = Điểm ghi được - Điểm bị thủng"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Điểm / Hiệu Số</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Không tìm thấy thành viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredList.map((stat, idx) => {
                  const rankDef = getRankDefinitionByScore(stat.player.rankScore);
                  const isTop3 = idx < 3;
                  const medalEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

                  return (
                    <tr
                      key={stat.player.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedPlayerStat(stat)}
                    >
                      {/* Rank Index */}
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {medalEmoji ? (
                          <span className="text-base" title={`Hạng ${idx + 1}`}>
                            {medalEmoji}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold">{idx + 1}</span>
                        )}
                      </td>

                      {/* Player Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              stat.player.gender === 'MALE'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {stat.player.gender === 'MALE' ? '♂' : '♀'}
                          </span>
                          <span className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                            {stat.player.name}
                          </span>
                        </div>
                      </td>

                      {/* Rank definition badge */}
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0"
                          style={{
                            backgroundColor: rankDef.bgLight,
                            color: rankDef.color,
                            borderColor: rankDef.borderLight,
                          }}
                        >
                          <span>{rankDef.score}đ</span>
                          <span>•</span>
                          <span>{rankDef.shortLabel}</span>
                        </span>
                      </td>

                      {/* Total Scheduled Sets */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                          {stat.totalScheduledSets} set
                        </span>
                      </td>

                      {/* Completed Sets / Remaining */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-slate-200">
                          {stat.completedSets}
                        </span>
                        <span className="text-slate-500 text-[10px] ml-1">
                          ({stat.remainingSets} chưa đánh)
                        </span>
                      </td>

                      {/* Won Sets */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {stat.wonSets}
                        </span>
                      </td>

                      {/* Lost Sets */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                          {stat.lostSets}
                        </span>
                      </td>

                      {/* Win Rate with visual bar */}
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span
                            className={`font-bold ${
                              stat.winRate >= 70
                                ? 'text-emerald-400'
                                : stat.winRate >= 50
                                ? 'text-amber-400'
                                : stat.completedSets === 0
                                ? 'text-slate-500'
                                : 'text-slate-300'
                            }`}
                          >
                            {stat.completedSets === 0 ? '--' : `${stat.winRate}%`}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {stat.wonSets}/{stat.completedSets}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              stat.winRate >= 70
                                ? 'bg-emerald-500'
                                : stat.winRate >= 50
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${stat.winRate}%` }}
                          />
                        </div>
                      </td>

                      {/* Point Diff */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono font-bold text-xs">
                          <span
                            className={
                              stat.pointDiff > 0
                                ? 'text-emerald-400'
                                : stat.pointDiff < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }
                          >
                            {stat.pointDiff > 0 ? `+${stat.pointDiff}` : stat.pointDiff}đ
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {stat.totalPointsScored} - {stat.totalPointsConceded}
                        </div>
                      </td>

                      {/* Detail Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white transition-all text-[11px] font-medium"
                        >
                          <span>Lịch sử set</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Player Set History Modal */}
      {activeModalStat && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                    activeModalStat.player.gender === 'MALE'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {activeModalStat.player.gender === 'MALE' ? '♂' : '♀'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{activeModalStat.player.name}</span>
                    {(() => {
                      const r = getRankDefinitionByScore(activeModalStat.player.rankScore);
                      return (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-semibold border"
                          style={{
                            backgroundColor: r.bgLight,
                            color: r.color,
                            borderColor: r.borderLight,
                          }}
                        >
                          {r.score}đ • {r.shortLabel}
                        </span>
                      );
                    })()}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lịch sử thi đấu & kết quả chi tiết từng set
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayerStat(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stat Bar Inside Modal */}
            <div className="grid grid-cols-4 gap-2 p-4 bg-slate-950/60 border-b border-slate-800 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Đã Đánh</div>
                <div className="text-base font-black text-white font-mono mt-0.5">
                  {activeModalStat.completedSets} / {activeModalStat.totalScheduledSets}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Thắng - Thua</div>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  {activeModalStat.wonSets} - {activeModalStat.lostSets}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Tỷ Lệ Thắng</div>
                <div className="text-base font-black text-amber-300 font-mono mt-0.5">
                  {activeModalStat.completedSets === 0 ? '--' : `${activeModalStat.winRate}%`}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Hiệu Số Điểm</div>
                <div
                  className={`text-base font-black font-mono mt-0.5 ${
                    activeModalStat.pointDiff > 0
                      ? 'text-emerald-400'
                      : activeModalStat.pointDiff < 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {activeModalStat.pointDiff > 0 ? `+${activeModalStat.pointDiff}` : activeModalStat.pointDiff}đ
                </div>
              </div>
            </div>

            {/* List of sets played by this person */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Danh Sách Các Set Đấu ({activeModalStat.matchHistory.length} set):</span>
                {onNavigateToSchedule && (
                  <button
                    onClick={() => {
                      setSelectedPlayerStat(null);
                      onNavigateToSchedule();
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Xem trên Lịch thi đấu →
                  </button>
                )}
              </div>

              {activeModalStat.matchHistory.map((set, sIdx) => {
                const partnerName = set.partner?.name || 'Đang chờ';
                const opp1Name = set.opponent1?.name || 'Đối thủ 1';
                const opp2Name = set.opponent2?.name || 'Đối thủ 2';

                return (
                  <div
                    key={set.matchId}
                    className={`p-3.5 rounded-xl border transition-all ${
                      set.outcome === 'WON'
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : set.outcome === 'LOST'
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-300">
                          Set {set.matchIndex}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Sân {set.courtNumber || 1} • {set.phaseLabel}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                          Δ {set.delta}đ
                        </span>
                      </div>

                      {/* Outcome badge */}
                      {set.outcome === 'WON' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Thắng (+{set.pointDiff}đ)</span>
                        </span>
                      )}
                      {set.outcome === 'LOST' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          Thua ({set.pointDiff}đ)
                        </span>
                      )}
                      {set.outcome === 'PENDING' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Chưa đấu</span>
                        </span>
                      )}
                    </div>

                    {/* Match matchup details */}
                    <div className="grid grid-cols-11 items-center gap-2 text-xs">
                      {/* My Team */}
                      <div className="col-span-5 p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold mb-1">
                          Đội Bạn & Đồng Đội:
                        </div>
                        <div className="font-bold text-emerald-400 truncate">
                          {activeModalStat.player.name}
                        </div>
                        <div className="text-slate-300 truncate text-[11px]">
                          + {partnerName}
                        </div>
                      </div>

                      {/* Score in middle */}
                      <div className="col-span-1 text-center font-mono font-black text-sm">
                        {set.isCompleted ? (
                          <div
                            className={
                              set.outcome === 'WON'
                                ? 'text-emerald-400'
                                : set.outcome === 'LOST'
                                ? 'text-rose-400'
                                : 'text-slate-300'
                            }
                          >
                            {set.myScore} : {set.opponentScore}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">vs</span>
                        )}
                      </div>

                      {/* Opponents */}
                      <div className="col-span-5 p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold mb-1">
                          Đối Thủ:
                        </div>
                        <div className="text-slate-300 truncate text-[11px] font-medium">
                          {opp1Name}
                        </div>
                        <div className="text-slate-300 truncate text-[11px] font-medium">
                          + {opp2Name}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedPlayerStat(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
