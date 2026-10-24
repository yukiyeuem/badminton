import React, { useState } from 'react';
import { SessionConfig } from '../types/badminton';
import {
  X,
  Sliders,
  Trophy,
  Swords,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Clock,
} from 'lucide-react';

interface SessionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTotalMatches: number;
  currentMode?: 'CONTINUOUS_MIXER' | 'PROGRESSIVE_PLAYOFF';
  totalPlayersCount?: number;
  onApplyConfig: (targetMatches: number, mode: 'CONTINUOUS_MIXER' | 'PROGRESSIVE_PLAYOFF') => void;
}

export const SessionConfigModal: React.FC<SessionConfigModalProps> = ({
  isOpen,
  onClose,
  currentTotalMatches,
  currentMode = 'CONTINUOUS_MIXER',
  totalPlayersCount = 8,
  onApplyConfig,
}) => {
  const [selectedMatchCount, setSelectedMatchCount] = useState<number>(currentTotalMatches);
  const [mixerMode, setMixerMode] = useState<'CONTINUOUS_MIXER' | 'PROGRESSIVE_PLAYOFF'>(currentMode);

  if (!isOpen) return null;

  const presets = [
    {
      count: 6,
      label: '6 Trận Mix Cân Bằng (8 Người)',
      roundsDesc: 'Mỗi người đúng 3 trận, Delta ≤ 1 tuyệt đối, xoay tua cặp đấu linh hoạt',
      badge: 'Khuyên Dùng (8 Người)',
      mode: 'CONTINUOUS_MIXER' as const,
      color: 'border-emerald-500/40 bg-emerald-950/20',
    },
    {
      count: 8,
      label: '8 Trận Giao Lưu (8 hoặc 16 Người)',
      roundsDesc: '8 người mỗi người 4 trận, hoặc 16 người mỗi người 2 trận, Delta = 0',
      badge: 'Tiêu Chuẩn',
      mode: 'CONTINUOUS_MIXER' as const,
      color: 'border-sky-500/40 bg-sky-950/20',
    },
    {
      count: 9,
      label: '9 Trận Mở Rộng (8 Người)',
      roundsDesc: '4 người 5 trận, 4 người 4 trận. Cam kết mọi trận Delta ≤ 1, phân bổ đều',
      badge: 'Tùy Chỉnh 9 Trận',
      mode: 'CONTINUOUS_MIXER' as const,
      color: 'border-teal-500/40 bg-teal-950/20',
    },
    {
      count: 10,
      label: '10 Trận Tăng Cường (8 Người)',
      roundsDesc: 'Mỗi người chơi đúng 5 trận (40 lượt). 100% trận đấu Delta ≤ 1',
      badge: '5 Trận / Người',
      mode: 'CONTINUOUS_MIXER' as const,
      color: 'border-cyan-500/40 bg-cyan-950/20',
    },
    {
      count: 11,
      label: '11 Trận Thêm Lượt (8 Người)',
      roundsDesc: '4 người 6 trận, 4 người 5 trận. Tối ưu thời gian sân, Delta ≤ 1 tuyệt đối',
      badge: 'Tùy Chỉnh 11 Trận',
      mode: 'CONTINUOUS_MIXER' as const,
      color: 'border-blue-500/40 bg-blue-950/20',
    },
    {
      count: 10,
      label: '10 Trận (Playoffs Thắng Gặp Thắng)',
      roundsDesc: '8 trận cơ bản + 2 trận Chung kết nối tiếp từ kết quả trước',
      badge: 'Phân Nhánh Playoffs',
      mode: 'PROGRESSIVE_PLAYOFF' as const,
      color: 'border-amber-500/40 bg-amber-950/20',
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedMatchCount(p.count);
    setMixerMode(p.mode);
  };

  const handleSave = () => {
    onApplyConfig(selectedMatchCount, mixerMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Cấu Hình Quy Mô & Số Trận Đấu Trong Buổi</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tự do cấu hình số trận (6, 8, 9, 10, 11...) với cam kết tuyệt đối Delta ≤ 1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Chọn chế độ tổ chức buổi đấu:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMixerMode('CONTINUOUS_MIXER')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  mixerMode === 'CONTINUOUS_MIXER'
                    ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Mix Giao Lưu Tự Do</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ml-auto">
                    Δ ≤ 1 Tuyệt Đối
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tự do chọn <strong>6, 8, 9, 10, 11... trận</strong>. Cam kết <strong>Delta ≤ 1 trong mọi trận đấu</strong>, chia đều số trận cho mọi thành viên, không gò bó chung kết.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMixerMode('PROGRESSIVE_PLAYOFF')}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  mixerMode === 'PROGRESSIVE_PLAYOFF'
                    ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">Giải Đấu Phân Nhánh</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-auto">
                    Playoffs
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Xếp các trận sau nối tiếp từ kết quả trước: <strong>Thắng gặp Thắng</strong> (Chung kết) và <strong>Thua gặp Thua</strong> (Hạng Ba) tự động cập nhật khi nhập điểm.
                </p>
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Chọn nhanh kịch bản cấu hình:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((p) => {
                const isSelected = selectedMatchCount === p.count && mixerMode === p.mode;
                return (
                  <button
                    key={`${p.count}_${p.mode}_${p.label}`}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                        : `${p.color} hover:border-slate-600`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{p.label}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {p.roundsDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Slider / Direct Number Input */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200 block">
                  Tùy chỉnh chính xác số trận đấu:
                </label>
                <span className="text-[11px] text-slate-400">
                  {mixerMode === 'CONTINUOUS_MIXER'
                    ? 'Chế độ Mix giao lưu: Hỗ trợ bất kỳ số trận nào (9, 10, 11, v.v.)'
                    : 'Chế độ giải đấu phân nhánh'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={4}
                  max={30}
                  value={selectedMatchCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setSelectedMatchCount(Math.max(4, Math.min(30, val)));
                    }
                  }}
                  className="w-16 px-2 py-1 bg-slate-900 border border-emerald-500/50 rounded text-center font-mono font-bold text-sm text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <span className="text-xs font-bold text-slate-300">Trận</span>
              </div>
            </div>

            <input
              type="range"
              min={4}
              max={24}
              step={1}
              value={selectedMatchCount}
              onChange={(e) => setSelectedMatchCount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[6, 8, 9, 10, 11, 12, 14, 16].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSelectedMatchCount(cnt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    selectedMatchCount === cnt
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {cnt} trận
                </button>
              ))}
            </div>
          </div>

          {/* Guarantee banner */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200 leading-relaxed">
              <strong>Cam kết thuật toán:</strong> Trong mọi trận đấu, độ lệch <strong>Delta ≤ 1</strong> tuyệt đối (không bao giờ vượt quá 1). Với 8 thành viên chọn 9, 10 hoặc 11 trận, số trận sẽ được chia đều tối đa (mỗi người 4-5 trận hoặc 5-6 trận), hạn chế tối đa việc lặp lại đồng đội!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Áp dụng ({selectedMatchCount} Trận • {mixerMode === 'CONTINUOUS_MIXER' ? 'Mix Δ ≤ 1' : 'Playoffs'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
