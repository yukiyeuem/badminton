import React, { useState } from 'react';
import { Player, Match, MatchmakingResult } from './types/badminton';
import {
  createStandardTestPlayers,
  validateMatchesStrict,
} from './services/standardTestCase';
import { runMatchmaking, runContinuousMatchmaking } from './services/matchmakingAlgorithm';
import { generatePlayoffMatches, syncPlayoffMatchesWithResults } from './services/playoffManager';
import { Navbar } from './components/Navbar';
import { ScheduleView } from './components/ScheduleView';
import { CourtManager } from './components/CourtManager';
import { PlayerRoster } from './components/PlayerRoster';
import { InterTeamMatchmaker } from './components/InterTeamMatchmaker';
import { AlgorithmVisualizer } from './components/AlgorithmVisualizer';
import { ValidationReport } from './components/ValidationReport';
import { SpecModal } from './components/SpecModal';
import { BulkMemberImportModal } from './components/BulkMemberImportModal';
import { SessionConfigModal } from './components/SessionConfigModal';
import { PlayerStatsView } from './components/PlayerStatsView';
import { CheckCircle2, Sparkles, Trophy, Users, ShieldCheck, FileText, Swords, Sliders, BarChart3 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => createStandardTestPlayers());
  const [targetTotalMatches, setTargetTotalMatches] = useState<number>(8);
  const [sessionMode, setSessionMode] = useState<'CONTINUOUS_MIXER' | 'PROGRESSIVE_PLAYOFF'>('CONTINUOUS_MIXER');
  const [matchResult, setMatchResult] = useState<MatchmakingResult>(() => {
    return runMatchmaking(createStandardTestPlayers());
  });
  const [matches, setMatches] = useState<Match[]>(() => matchResult.matches);
  const [activeTab, setActiveTab] = useState<string>('schedule');
  const [isSpecModalOpen, setIsSpecModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSessionConfigOpen, setIsSessionConfigOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Re-run matchmaking whenever triggered
  const executeMatchmaking = (
    playerList: Player[],
    matchTarget: number = targetTotalMatches,
    mode: 'CONTINUOUS_MIXER' | 'PROGRESSIVE_PLAYOFF' = sessionMode
  ) => {
    // If CONTINUOUS_MIXER or 8 players 6 matches or custom mixer without forced brackets
    if (mode === 'CONTINUOUS_MIXER' || (playerList.length <= 8 && mode !== 'PROGRESSIVE_PLAYOFF')) {
      const res = runContinuousMatchmaking(playerList, matchTarget);
      setMatchResult(res);
      setMatches(res.matches);
      setPlayers(res.updatedPlayers);
      return res;
    }

    // Progressive Playoff Tournament flow
    const res = runMatchmaking(playerList, {
      phaseMode: 'STANDARD_TWO_PHASES',
      sessionConfig: {
        sessionTargetMode: 'TARGET_TOTAL_MATCHES',
        roundsPerPlayer: 2,
        totalMatchesTarget: matchTarget,
        enableProgressivePlayoffs: true,
        playoffMode: 'WINNERS_AND_LOSERS',
        courtCount: 4,
        maxDeltaThreshold: 0,
        mixerMode: 'PROGRESSIVE_PLAYOFF',
      },
    });
    setMatchResult(res);

    let finalMatches = [...res.matches];
    if (matchTarget > res.matches.length) {
      const extraCount = matchTarget - res.matches.length;
      const playoffs = generatePlayoffMatches(res.matches, extraCount, playerList);
      finalMatches = [...finalMatches, ...playoffs];
    }

    const playerMap = new Map<string, Player>();
    playerList.forEach((p) => playerMap.set(p.id, p));
    finalMatches = syncPlayoffMatchesWithResults(finalMatches, playerMap);

    setMatches(finalMatches);
    setPlayers(res.updatedPlayers);
    return { ...res, matches: finalMatches };
  };

  // Standard Test Case 1-click trigger
  const handleRunStandardTest = () => {
    const stdPlayers = createStandardTestPlayers();
    setPlayers(stdPlayers);
    setTargetTotalMatches(8);
    setSessionMode('CONTINUOUS_MIXER');
    const res = runMatchmaking(stdPlayers);
    setMatchResult(res);
    setMatches(res.matches);
    setPlayers(res.updatedPlayers);
    showToast('Đã nạp và chạy hoàn tất Test Case Tiêu chuẩn 16 người - 8 trận (Delta = 0)!');
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleRerunCurrent = () => {
    const resetList = players.map((p) => ({
      ...p,
      playedCount: 0,
      pastPartners: [],
    }));
    executeMatchmaking(resetList, targetTotalMatches, sessionMode);
    showToast('Đã tính toán và xếp lại trận đấu thành công (Δ ≤ 1)!');
  };

  const handleApplySessionConfig = (
    newTargetCount: number,
    mode: 'CONTINUOUS_MIXER' | 'PROGRESSIVE_PLAYOFF'
  ) => {
    setTargetTotalMatches(newTargetCount);
    setSessionMode(mode);
    executeMatchmaking(players, newTargetCount, mode);
    const modeLabel =
      mode === 'CONTINUOUS_MIXER'
        ? 'Mix Giao Lưu Tự Do: 100% Trận Delta ≤ 1'
        : 'Giải Đấu Nối Tiếp: Playoffs Thắng/Thua';
    showToast(`Đã thiết lập buổi đấu gồm ${newTargetCount} trận (${modeLabel})!`);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#38bdf8'],
    });
  };

  const handleBulkImport = (newPlayersData: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>[]) => {
    const newPlayers: Player[] = newPlayersData.map((item, idx) => ({
      ...item,
      id: `${item.gender === 'MALE' ? 'M_GRP_' : 'F_GRP_'}${Date.now()}_${idx + 1}`,
      playedCount: 0,
      pastPartners: [],
    }));

    setPlayers(newPlayers);
    executeMatchmaking(newPlayers, targetTotalMatches);
    showToast(`Đã nạp thành công ${newPlayers.length} thành viên và xếp trận cân bằng (Delta ≈ 0)!`);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#38bdf8', '#fbbf24'],
    });
  };

  const handleScheduleFriendlyMatch = (friendlyMatch: Match) => {
    // Add to match list and assign court
    setMatches((prev) => [friendlyMatch, ...prev]);
    showToast(`Đã tạo trận thách đấu giao lưu! (Sân ${friendlyMatch.courtNumber || 1})`);
    setActiveTab('schedule');
  };

  const handleUpdateMatchScore = (
    matchId: string,
    gameScoreA: number,
    gameScoreB: number,
    status?: Match['status']
  ) => {
    setMatches((prev) => {
      const updated = prev.map((m) => {
        if (m.matchId !== matchId) return m;
        const newStatus = status || m.status;
        let winner: 'teamA' | 'teamB' | undefined = m.winner;
        if (newStatus === 'COMPLETED' || gameScoreA !== gameScoreB) {
          winner = gameScoreA > gameScoreB ? 'teamA' : 'teamB';
        }
        return {
          ...m,
          gameScoreA,
          gameScoreB,
          status: newStatus,
          winner,
        };
      });

      // Synchronize with downstream playoff matches (e.g. Winner vs Winner, Loser vs Loser)
      const playerMap = new Map<string, Player>();
      players.forEach((p) => playerMap.set(p.id, p));
      return syncPlayoffMatchesWithResults(updated, playerMap);
    });
  };

  const handleAddPlayer = (newP: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>) => {
    const prefix = newP.gender === 'MALE' ? 'M_CUS_' : 'F_CUS_';
    const id = `${prefix}${Date.now()}`;
    const p: Player = {
      ...newP,
      id,
      playedCount: 0,
      pastPartners: [],
    };
    const updated = [...players, p];
    setPlayers(updated);
    executeMatchmaking(updated, targetTotalMatches);
    showToast(`Đã thêm thành viên ${p.name}!`);
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    const updated = players.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPlayers(updated);
    executeMatchmaking(updated, targetTotalMatches);
    showToast('Đã cập nhật thông tin thành viên!');
  };

  const handleDeletePlayer = (id: string) => {
    if (players.length <= 4) {
      alert('Cần tối thiểu 4 người chơi để duy trì ít nhất 1 trận đôi.');
      return;
    }
    const updated = players.filter((p) => p.id !== id);
    setPlayers(updated);
    executeMatchmaking(updated, targetTotalMatches);
    showToast('Đã xóa thành viên khỏi danh sách!');
  };

  const handleResetAllStats = () => {
    const resetList = players.map((p) => ({
      ...p,
      playedCount: 0,
      pastPartners: [],
    }));
    setPlayers(resetList);
    executeMatchmaking(resetList, targetTotalMatches);
    showToast('Đã đặt lại số trận đã đánh và lịch sử partner về 0!');
  };

  const summary = validateMatchesStrict(matches, players);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-900/90 text-white border border-emerald-500/50 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        onRunStandardTest={handleRunStandardTest}
        onRerunCurrent={handleRerunCurrent}
        onOpenSpecModal={() => setIsSpecModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSessionConfig={() => setIsSessionConfigOpen(true)}
        totalPlayers={players.length}
        totalMatches={matches.length}
        averageDelta={matchResult.algorithmStats.averageDelta}
        isStandardPassed={summary.passed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Match Schedule */}
        {activeTab === 'schedule' && (
          <ScheduleView
            matches={matches}
            players={players}
            onUpdateMatchScore={handleUpdateMatchScore}
            onOpenSessionConfig={() => setIsSessionConfigOpen(true)}
            onNavigateToStats={() => setActiveTab('stats')}
          />
        )}

        {/* Tab: Player Set & Score Statistics */}
        {activeTab === 'stats' && (
          <PlayerStatsView
            players={players}
            matches={matches}
            onUpdateMatchScore={handleUpdateMatchScore}
            onNavigateToSchedule={() => setActiveTab('schedule')}
          />
        )}

        {/* Tab 2: Inter-Team & Pair Selection Challenge */}
        {activeTab === 'interteam' && (
          <InterTeamMatchmaker
            players={players}
            onScheduleFriendlyMatch={handleScheduleFriendlyMatch}
          />
        )}

        {/* Tab 3: Court Arena Manager */}
        {activeTab === 'courts' && (
          <CourtManager
            matches={matches}
            players={players}
            onUpdateMatchScore={handleUpdateMatchScore}
          />
        )}

        {/* Tab 4: Player Roster */}
        {activeTab === 'players' && (
          <PlayerRoster
            players={players}
            matches={matches}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onLoadStandardPreset={handleRunStandardTest}
            onResetAllStats={handleResetAllStats}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onNavigateToStats={() => setActiveTab('stats')}
          />
        )}

        {/* Tab 5: Algorithm Inspector */}
        {activeTab === 'visualizer' && (
          <AlgorithmVisualizer players={players} matches={matches} />
        )}

        {/* Tab 6: Validation Report */}
        {activeTab === 'validation' && (
          <ValidationReport
            matches={matches}
            players={players}
            onRerunVerification={handleRerunCurrent}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            Badminton Matchmaking Algorithm • Đảm bảo cân bằng trình độ (Delta ≈ 0) & chống trùng Partner
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSpecModalOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Đặc tả .md</span>
            </button>
            <span>•</span>
            <span className="font-mono text-emerald-400">{matches.length} Trận Đấu Sắp Xếp</span>
          </div>
        </div>
      </footer>

      {/* Spec Document Modal */}
      <SpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />

      {/* Bulk Member Import Modal */}
      <BulkMemberImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportPlayers={handleBulkImport}
      />

      {/* Session Match Count & Progressive Playoff Config Modal */}
      <SessionConfigModal
        isOpen={isSessionConfigOpen}
        onClose={() => setIsSessionConfigOpen(false)}
        currentTotalMatches={targetTotalMatches}
        currentMode={sessionMode}
        totalPlayersCount={players.length}
        onApplyConfig={handleApplySessionConfig}
      />
    </div>
  );
}
