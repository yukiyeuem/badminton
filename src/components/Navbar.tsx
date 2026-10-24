import React from 'react';
import {
  Trophy,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  Swords,
  UserPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NavbarProps {
  onRunStandardTest: () => void;
  onRerunCurrent: () => void;
  onOpenSpecModal: () => void;
  onOpenImportModal: () => void;
  totalPlayers: number;
  totalMatches: number;
  averageDelta: number;
  isStandardPassed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRunStandardTest,
  onRerunCurrent,
  onOpenSpecModal,
  onOpenImportModal,
  totalPlayers,
  totalMatches,
  averageDelta,
  isStandardPassed,
  activeTab,
  setActiveTab,
}) => {
  const handleTriggerStandardTest = () => {
    onRunStandardTest();
    // Celebrate with confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#38bdf8', '#fbbf24', '#ffffff'],
    });
  };

  const navTabs = [
    { id: 'schedule', label: 'Lịch Thi Đấu & Trận', icon: Trophy },
    { id: 'interteam', label: 'Chọn Cặp & Giao Lưu', icon: Swords },
    { id: 'courts', label: 'Bảng Sân Cầu Lông', icon: ShieldCheck },
    { id: 'players', label: 'Thành Viên Nhóm', icon: Users },
    { id: 'visualizer', label: 'Trực Quan Thuật Toán', icon: Sparkles },
    { id: 'validation', label: 'Kiểm Định Chuẩn', icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
            🏸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Badminton Matchmaker
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Delta ≈ 0 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Thuật toán xếp trận cầu lông cân bằng, chống trùng partner & giao lưu đội khác
            </p>
          </div>
        </div>

        {/* Quick Stat Badges */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="text-slate-400">Thành viên:</span>{' '}
            <span className="font-bold text-white font-mono">{totalPlayers}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="text-slate-400">Số trận:</span>{' '}
            <span className="font-bold text-white font-mono">{totalMatches}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs flex items-center gap-1.5">
            <span className="text-slate-400">Độ lệch TB:</span>{' '}
            <span className={`font-bold font-mono ${averageDelta === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Δ = {averageDelta}
            </span>
            {averageDelta === 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-colors"
            title="Điền hoặc dán danh sách thành viên nhóm nhanh"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Điền Nhóm Nhanh</span>
          </button>

          <button
            onClick={onOpenSpecModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            title="Xem tài liệu đặc tả thuật toán .md"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Spec .md</span>
          </button>

          <button
            onClick={onRerunCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
            title="Chạy lại thuật toán xếp trận với danh sách hiện tại"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Xếp lại</span>
          </button>

          <button
            onClick={handleTriggerStandardTest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all"
            title="Nạp và chạy test case 16 người - 8 trận tiêu chuẩn từ tài liệu đặc tả"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">Test Case Chuẩn (16p)</span>
            <span className="md:hidden">16p Spec</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-800/80 scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'validation' && isStandardPassed && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
