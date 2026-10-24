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
  onApplyConfig: (targetMatches: number, enablePlayoffs: boolean) => void;
}

export const SessionConfigModal: React.FC<SessionConfigModalProps> = ({
  isOpen,
  onClose,
  currentTotalMatches,
  onApplyConfig,
}) => {
  const [selectedMatchCount, setSelectedMatchCount] = useState<number>(currentTotalMatches);
  const [enablePlayoffs, setEnablePlayoffs] = useState<boolean>(true);

  if (!isOpen) return null;

  const presets = [
    {
      count: 8,
      label: '8 Trận Tiêu Chuẩn',
      roundsDesc: 'Mỗi người đúng 2 trận (1 cùng giới, 1 nam nữ)',
      badge: 'Chuẩn Spec .md',
      color: 'border-emerald-500/40 bg-emerald-950/20',
    },
    {
      count: 10,
      label: '10 Trận (+2 Trận Chung Kết)',
      roundsDesc: '8 trận cơ bản + 2 trận Thắng gặp Thắng (Đôi Nam & Đôi Nữ)',
      badge: 'Phân hạng Nhất - Nhì',
      color: 'border-sky-500/40 bg-sky-950/20',
    },
    {
      count: 12,
      label: '12 Trận (+4 Trận Phân Nhánh)',
      roundsDesc: '8 trận cơ bản + 2 trận Thắng gặp Thắng + 2 trận Thua gặp Thua (Hạng Ba)',
      badge: 'Trọn vẹn Thắng & Thua',
      color: 'border-purple-500/40 bg-purple-950/20',
    },
    {
      count: 16,
      label: '16 Trận (Mỗi người 4 trận)',
      roundsDesc: 'Tất cả các đội đều được đá lượt tiếp theo theo kết quả trước đó',
      badge: 'Đại hội thi đấu',
      color: 'border-amber-500/40 bg-amber-950/20',
    },
  ];

  const handleSave = () => {
    onApplyConfig(selectedMatchCount, enablePlayoffs);
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
                Tùy chỉnh số lượng trận và kích hoạt tính năng xếp nối tiếp theo kết quả (Thắng gặp Thắng / Thua gặp Thua)
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
          {/* Preset Buttons */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Chọn số trận đấu cho buổi chơi:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((p) => {
                const isSelected = selectedMatchCount === p.count;
                return (
                  <button
                    key={p.count}
                    type="button"
                    onClick={() => setSelectedMatchCount(p.count)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                        : `${p.color} hover:border-slate-600`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{p.label}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {p.roundsDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Slider / Input */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Hoặc tùy chỉnh số trận đấu bất kỳ:
              </label>
              <span className="font-mono text-base font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                {selectedMatchCount} Trận
              </span>
            </div>

            <input
              type="range"
              min={8}
              max={24}
              step={2}
              value={selectedMatchCount}
              onChange={(e) => setSelectedMatchCount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>8 trận</span>
              <span>10 trận</span>
              <span>12 trận</span>
              <span>16 trận</span>
              <span>20 trận</span>
              <span>24 trận</span>
            </div>
          </div>

          {/* Progressive Playoff Feature Toggle */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-emerald-400" />
                  <span>Cơ chế Xếp Trận Nối Tiếp (Thắng gặp Thắng / Thua gặp Thua)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Khi tổng số trận &gt; 8, các trận sau sẽ tự động liên kết với kết quả trận trước:
                  <br />
                  • <strong>Đôi nam thắng Trận 3</strong> gặp <strong>Đôi nam thắng Trận 4</strong> (Tranh Vô địch).
                  <br />
                  • <strong>Đôi nam thua Trận 3</strong> gặp <strong>Đôi nam thua Trận 4</strong> (Tranh Hạng Ba).
                  <br />
                  • Hệ thống tự động điền danh sách vận động viên ngay khi bạn chốt điểm số trận trước!
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={enablePlayoffs}
                  onChange={(e) => setEnablePlayoffs(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
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
            <span>Áp dụng quy mô buổi đấu ({selectedMatchCount} trận)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
