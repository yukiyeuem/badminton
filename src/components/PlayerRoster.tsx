import React, { useState } from 'react';
import { Player, Gender, RANK_DEFINITIONS, RankKey, getRankDefinitionByScore, Match } from '../types/badminton';
import { calculatePlayerSetStats } from '../services/playerStatsService';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';

interface PlayerRosterProps {
  players: Player[];
  matches?: Match[];
  onAddPlayer: (player: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
  onLoadStandardPreset: () => void;
  onResetAllStats: () => void;
  onOpenImportModal: () => void;
  onNavigateToStats?: () => void;
}

export const PlayerRoster: React.FC<PlayerRosterProps> = ({
  players,
  matches = [],
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onLoadStandardPreset,
  onResetAllStats,
  onOpenImportModal,
  onNavigateToStats,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'ALL' | Gender>('ALL');
  const [filterRank, setFilterRank] = useState<'ALL' | number>('ALL');

  // New player inline form state
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('MALE');
  const [newRankScore, setNewRankScore] = useState<number>(3);
  const [newClubNote, setNewClubNote] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRankScore, setEditRankScore] = useState<number>(3);

  const filteredPlayers = players.filter((p) => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterGender !== 'ALL' && p.gender !== filterGender) return false;
    if (filterRank !== 'ALL' && p.rankScore !== filterRank) return false;
    return true;
  });

  const maleCount = players.filter((p) => p.gender === 'MALE').length;
  const femaleCount = players.filter((p) => p.gender === 'FEMALE').length;

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddPlayer({
      name: newName.trim(),
      gender: newGender,
      rankScore: newRankScore,
      clubNote: newClubNote.trim() || undefined,
    });

    setNewName('');
    setNewClubNote('');
  };

  const startEdit = (p: Player) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditRankScore(p.rankScore);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdatePlayer(id, {
      name: editName.trim(),
      rankScore: editRankScore,
    });
    setEditingId(null);
  };

  const playerLookup = new Map<string, Player>();
  players.forEach((p) => playerLookup.set(p.id, p));

  // Compute live set statistics for each player
  const statsSummary = calculatePlayerSetStats(players, matches);
  const statsMap = new Map<string, (typeof statsSummary.playerStatsList)[0]>();
  statsSummary.playerStatsList.forEach((s) => statsMap.set(s.player.id, s));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Danh Sách Thành Viên Trong Nhóm (Player Roster)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Tổng cộng: <strong className="text-white">{players.length} người</strong> ({maleCount} Nam, {femaleCount} Nữ). Tự động phân loại trình độ và xếp cặp đấu phù hợp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToStats && (
            <button
              onClick={onNavigateToStats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Thống Kê Set & BXH →</span>
            </button>
          )}

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import File Excel (.xlsx)</span>
          </button>

          <button
            onClick={onLoadStandardPreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <span>Test Case Chuẩn (16p)</span>
          </button>

          <button
            onClick={onResetAllStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
            title="Đặt lại số trận đã đánh và lịch sử partner về 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Số Trận</span>
          </button>
        </div>
      </div>

      {/* Add New Player Bar */}
      <form
        onSubmit={handleCreatePlayer}
        className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3"
      >
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
          <Plus className="w-4 h-4 text-emerald-400" />
          Thêm người chơi:
        </span>

        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Tên vận động viên (vd: Hoàng Nam, Minh Thư...)"
          className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          required
        />

        {/* Gender selector */}
        <select
          value={newGender}
          onChange={(e) => setNewGender(e.target.value as Gender)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="MALE">♂ Nam</option>
          <option value="FEMALE">♀ Nữ</option>
        </select>

        {/* Rank score selector */}
        <select
          value={newRankScore}
          onChange={(e) => setNewRankScore(Number(e.target.value))}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value={1}>1đ - Newbie (Mới chơi)</option>
          <option value={2}>2đ - Yếu</option>
          <option value={3}>3đ - Trung bình yếu (TBY)</option>
          <option value={4}>4đ - Trung bình (TB)</option>
          <option value={5}>5đ - Trung bình khá (TBK)</option>
        </select>

        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm ngay</span>
        </button>
      </form>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên vận động viên..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Giới tính:</span>
          <button
            onClick={() => setFilterGender('ALL')}
            className={`px-2.5 py-1 rounded-lg ${filterGender === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterGender('MALE')}
            className={`px-2.5 py-1 rounded-lg ${filterGender === 'MALE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Nam ({maleCount})
          </button>
          <button
            onClick={() => setFilterGender('FEMALE')}
            className={`px-2.5 py-1 rounded-lg ${filterGender === 'FEMALE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Nữ ({femaleCount})
          </button>
        </div>
      </div>

      {/* Players Table / Grid */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Giới tính</th>
                <th className="py-3 px-4">Trình độ (Rank Score)</th>
                <th className="py-3 px-4">Số Set & Kết Quả</th>
                <th className="py-3 px-4">Đồng đội cũ (pastPartners)</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPlayers.map((player, idx) => {
                const rankDef = getRankDefinitionByScore(player.rankScore);
                const isEditing = editingId === player.id;
                const stat = statsMap.get(player.id);

                return (
                  <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Index */}
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-200">
                            {player.name}
                          </div>
                          {player.clubNote && (
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">
                              {player.clubNote}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Gender */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          player.gender === 'MALE'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {player.gender === 'MALE' ? '♂ Nam' : '♀ Nữ'}
                      </span>
                    </td>

                    {/* Rank Score */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select
                          value={editRankScore}
                          onChange={(e) => setEditRankScore(Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value={1}>1đ - Newbie</option>
                          <option value={2}>2đ - Yếu</option>
                          <option value={3}>3đ - TBY</option>
                          <option value={4}>4đ - TB</option>
                          <option value={5}>5đ - TBK</option>
                        </select>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
                          style={{
                            backgroundColor: rankDef.bgLight,
                            color: rankDef.color,
                            borderColor: rankDef.borderLight,
                          }}
                        >
                          <span className="font-mono font-bold">{rankDef.score}đ</span>
                          <span>•</span>
                          <span>{rankDef.shortLabel}</span>
                        </span>
                      )}
                    </td>

                    {/* Set Stats & Results */}
                    <td className="py-3 px-4">
                      {stat ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 text-xs">
                              {stat.completedSets}/{stat.totalScheduledSets} set
                            </span>
                            {stat.completedSets > 0 && (
                              <span className="text-[11px] font-mono font-semibold text-slate-300">
                                {stat.wonSets}T - {stat.lostSets}B
                              </span>
                            )}
                          </div>
                          {stat.completedSets > 0 ? (
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              Thắng: <strong className="text-amber-300">{stat.winRate}%</strong> • HS: {stat.pointDiff >= 0 ? `+${stat.pointDiff}` : stat.pointDiff}đ
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Chưa đấu xong set nào
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                          {player.playedCount} trận
                        </span>
                      )}
                    </td>

                    {/* Past Partners */}
                    <td className="py-3 px-4 max-w-xs">
                      {player.pastPartners.length === 0 ? (
                        <span className="text-slate-500 italic text-[11px]">Chưa đánh cùng ai</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {player.pastPartners.map((partnerId) => {
                            const pName = playerLookup.get(partnerId)?.name || partnerId;
                            return (
                              <span
                                key={partnerId}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700 truncate max-w-[120px]"
                                title={pName}
                              >
                                {pName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => saveEdit(player.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                          title="Lưu thay đổi"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(player)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePlayer(player.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Xóa người chơi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
