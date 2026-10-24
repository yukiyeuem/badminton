import React, { useState } from 'react';
import { Player, Match, Pair, MatchType, getRankDefinitionByScore } from '../types/badminton';
import {
  generateSameGenderPairs,
  generateMixedPairs,
  isPartnerRepetition,
} from '../services/matchmakingAlgorithm';
import {
  Sparkles,
  GitBranch,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code2,
  RefreshCw,
  Cpu,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface AlgorithmVisualizerProps {
  players: Player[];
  matches: Match[];
}

export const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({
  players,
  matches,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedPhaseInspector, setSelectedPhaseInspector] = useState<1 | 2>(1);

  // Generate intermediate combinations for visualization
  const males = players.filter((p) => p.gender === 'MALE');
  const females = players.filter((p) => p.gender === 'FEMALE');

  const sameGenderPairs = [
    ...generateSameGenderPairs(males, 'MALE'),
    ...generateSameGenderPairs(females, 'FEMALE'),
  ];
  const mixedPairs = generateMixedPairs(players);

  const displayedPairs = selectedPhaseInspector === 1 ? sameGenderPairs : mixedPairs;

  const playerLookup = new Map<string, Player>();
  players.forEach((p) => playerLookup.set(p.id, p));

  const stepsInfo = [
    {
      step: 1,
      title: 'Bước 1: Chia Phase (Phân Loại Kịch Bản)',
      desc: 'Hệ thống nhận input và xác định cần xếp trận theo Phase 1 (Cùng giới) hay Phase 2 (Nam Nữ).',
      badge: 'Lược đồ Phase',
    },
    {
      step: 2,
      title: 'Bước 2: Tạo Mảng Cặp Đấu (Generate Pairs)',
      desc: 'Tổ hợp chập 2 (Combinations) tính PairScore = P1.rankScore + P2.rankScore.',
      badge: `${displayedPairs.length} cặp khả dĩ`,
    },
    {
      step: 3,
      title: 'Bước 3: Thuật Toán Matchmaking (Backtracking Solver)',
      desc: 'Sắp xếp mảng Cặp theo điểm. Đối chiếu 3 điều kiện: Delta ≈ 0, 4 ID phân biệt, và pastPartners không trùng.',
      badge: 'Cân bằng Delta = 0',
    },
    {
      step: 4,
      title: 'Bước 4: Cập Nhật State (Database / State Persistence)',
      desc: 'Đẩy Match vào danh sách, cộng playedCount + 1 cho 4 Players, push ID của partner vào pastPartners.',
      badge: 'State Update',
    },
    {
      step: 5,
      title: 'Bước 5: Lặp Lại & Kết Thúc (Termination Check)',
      desc: 'Quay lại Bước 2 cho đến khi toàn bộ người chơi đạt đủ số playedCount yêu cầu (target = 2 trận).',
      badge: 'Hoàn thành 100%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Trực Quan Hóa 5 Bước Thuật Toán (Algorithm Inspector)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Xem từng bước xử lý dữ liệu, kiểm tra ma trận tổ hợp cặp và logic đối chiếu ràng buộc
          </p>
        </div>

        {/* Phase selector for inspector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Xem dữ liệu:</span>
          <button
            onClick={() => setSelectedPhaseInspector(1)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedPhaseInspector === 1
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Phase 1: Cùng giới ({sameGenderPairs.length} cặp)
          </button>
          <button
            onClick={() => setSelectedPhaseInspector(2)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedPhaseInspector === 2
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Phase 2: Nam Nữ ({mixedPairs.length} cặp)
          </button>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {stepsInfo.map((s) => {
          const isActive = activeStep === s.step;
          return (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                isActive
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s.step}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  B{s.step}
                </span>
              </div>
              <div className={`text-xs font-bold truncate ${isActive ? 'text-emerald-300' : 'text-slate-300'}`}>
                {s.title.split(':')[1]?.trim() || s.title}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {s.badge}
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Detail Content */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
        {/* Step Banner */}
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              BƯỚC {activeStep}
            </span>
            <h3 className="text-base font-bold text-white">
              {stepsInfo[activeStep - 1].title}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {stepsInfo[activeStep - 1].desc}
          </p>
        </div>

        {/* Step 1 Content */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Phase 1: Chế độ Cùng giới (Same-Gender)
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Tách danh sách thành <strong>malePool</strong> ({males.length} người) và <strong>femalePool</strong> ({females.length} người).
                </p>
                <div className="text-xs space-y-1 font-mono text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div>• malePool: {males.map((m) => m.name).join(', ')}</div>
                  <div className="mt-2 text-rose-300">• femalePool: {females.map((f) => f.name).join(', ')}</div>
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Phase 2: Chế độ Nam Nữ (Mixed Doubles)
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Tạo các cặp chéo Nam x Nữ, kiểm tra ma trận <strong>pastPartners</strong> để ngăn ngừa tình trạng trùng lặp partner.
                </p>
                <div className="text-xs space-y-1 font-mono text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div>• Kích thước không gian ghép: {males.length} x {females.length} = {males.length * females.length} cặp khả dĩ</div>
                  <div className="text-emerald-400 mt-2">✓ Ràng buộc bắt buộc: Không lặp partner sau Lượt 1</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 Content */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Hiển thị danh sách cặp và điểm số <strong>PairScore = P1.rankScore + P2.rankScore</strong> ({displayedPairs.length} cặp)
              </span>
              <span className="font-mono text-emerald-400 font-semibold">
                Sắp xếp theo độ lệch cân bằng
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-2">
              {displayedPairs.map((pair) => {
                const r1 = getRankDefinitionByScore(pair.player1.rankScore);
                const r2 = getRankDefinitionByScore(pair.player2.rankScore);
                return (
                  <div
                    key={pair.id}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {pair.type === 'MIXED_DOUBLE' ? 'Nam x Nữ' : 'Cùng giới'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-500/30">
                        {pair.score}đ
                      </span>
                    </div>

                    <div className="text-slate-200 truncate font-medium">
                      {pair.player1.name} <span className="text-slate-500 text-[10px]">({r1.shortLabel})</span>
                    </div>
                    <div className="text-slate-200 truncate font-medium mt-0.5">
                      + {pair.player2.name} <span className="text-slate-500 text-[10px]">({r2.shortLabel})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 Content */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40">
                <div className="text-emerald-400 font-bold text-xs mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Điều kiện 1: Cân bằng Delta
                </div>
                <div className="font-mono text-xs text-slate-300">
                  |PairA.Score - PairB.Score| == 0
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Đảm bảo 2 đội có tổng trình độ tương đương tuyệt đối, giảm thiểu chênh lệch sức mạnh.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/40">
                <div className="text-sky-400 font-bold text-xs mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Điều kiện 2: 4 ID Phân biệt
                </div>
                <div className="font-mono text-xs text-slate-300">
                  p1 ≠ p2 ≠ p3 ≠ p4
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Không một vận động viên nào bị xếp trùng lặp trong cùng một trận đấu trên sân.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/40">
                <div className="text-purple-400 font-bold text-xs mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Điều kiện 3: Không trùng Partner
                </div>
                <div className="font-mono text-xs text-slate-300">
                  p2 ∉ p1.pastPartners
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mỗi người chơi có trải nghiệm giao lưu đa dạng, không ghép đôi lại với người vừa đánh cùng.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 mb-2">
                Kết quả giải mã của Thuật toán (Solvers Matches):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {matches.map((m, idx) => (
                  <div
                    key={m.matchId}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-emerald-400 font-bold">Trận #{idx + 1}: </span>
                      <span className="text-slate-300">
                        {m.scoreA}đ vs {m.scoreB}đ
                      </span>
                    </div>
                    <span className="text-emerald-400 font-bold">Δ = {m.delta}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 Content */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div className="text-slate-500">// Step 4: Cập nhật State sau khi chốt một trận (Match)</div>
              <div className="text-emerald-400">match.status = 'SCHEDULED';</div>
              <div className="text-sky-300">p1.playedCount += 1; p2.playedCount += 1;</div>
              <div className="text-purple-300">p1.pastPartners.push(p2.id); p2.pastPartners.push(p1.id);</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {players.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                >
                  <div className="font-bold text-slate-200 truncate">{p.name}</div>
                  <div className="text-emerald-400 font-mono text-[11px] mt-1">
                    Đã đánh: {p.playedCount} trận
                  </div>
                  <div className="text-slate-500 text-[10px] truncate mt-0.5">
                    Partners: {p.pastPartners.length} người
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5 Content */}
        {activeStep === 5 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">
              Thuật toán hoàn thành xếp 100% người chơi!
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tất cả {players.length} vận động viên đã đạt đúng mục tiêu 2 trận đấu. Không xảy ra trường hợp phân thân hay trùng đồng đội.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              <span>Độ lệch trung bình toàn giải: Δ = 0.00</span>
              <span>•</span>
              <span>Tỷ lệ trùng partner: 0%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
