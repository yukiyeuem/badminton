import React from 'react';
import { X, FileText, CheckCircle2, Award, Zap, Code2 } from 'lucide-react';

interface SpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecModal: React.FC<SpecModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Tài Liệu Đặc Tả Tính Năng Xếp Trận Cầu Lông
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                /public/assets/aistudio/t_i_li_u_c_t_thu_t_to_n_x_p_tr_n_c_u_l_ng_9f336cc7.md
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
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Section 1 */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-emerald-400 font-bold text-base mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-bold">1</span>
              Mục tiêu (Objective)
            </h3>
            <p className="text-slate-300 leading-relaxed mb-3">
              Xây dựng module thuật toán tự động sắp xếp các trận đấu cầu lông dựa trên danh sách người chơi đầu vào.
            </p>
            <ul className="space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Đảm bảo cân bằng trình độ:</strong> Delta Score (|Điểm Đội A - Điểm Đội B|) ≈ 0.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Đảm bảo tính đa dạng:</strong> Mỗi người chơi không lặp lại partner (đồng đội).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span><strong>Linh hoạt thể loại:</strong> Đôi Nam, Đôi Nữ, Đôi Nam Nữ (Mix).</span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-emerald-400 font-bold text-base mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-bold">2</span>
              Hệ số hóa trình độ (Scoring System)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-center">
                <div className="text-xs text-slate-400">Newbie</div>
                <div className="text-lg font-bold text-slate-300">1 điểm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-600/30 text-center">
                <div className="text-xs text-sky-400 font-medium">Yếu</div>
                <div className="text-lg font-bold text-sky-300">2 điểm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/30 text-center">
                <div className="text-xs text-amber-400 font-medium">Trung bình yếu (TBY)</div>
                <div className="text-lg font-bold text-amber-300">3 điểm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-600/30 text-center">
                <div className="text-xs text-orange-400 font-medium">Trung bình (TB)</div>
                <div className="text-lg font-bold text-orange-300">4 điểm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-center">
                <div className="text-xs text-emerald-400 font-medium">Trung bình khá (TBK)</div>
                <div className="text-lg font-bold text-emerald-300">5 điểm</div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-emerald-400 font-bold text-base mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-bold">3</span>
              Cấu trúc dữ liệu (Data Model)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <div className="text-slate-500 mb-1">// 3.1. Player Object</div>
                <pre>{`{
  "id": "string",
  "name": "string",
  "gender": "MALE | FEMALE",
  "rankScore": "number", // 1..5
  "playedCount": "number", // default = 0
  "pastPartners": ["string"]
}`}</pre>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <div className="text-slate-500 mb-1">// 3.2. Match Object</div>
                <pre>{`{
  "matchId": "string",
  "type": "MENS_DOUBLE | WOMENS_DOUBLE | MIXED_DOUBLE",
  "teamA": ["playerId1", "playerId2"], // Tổng điểm: X
  "teamB": ["playerId3", "playerId4"], // Tổng điểm: Y
  "delta": "number" // |X - Y| ≈ 0
}`}</pre>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-emerald-400 font-bold text-base mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-bold">4</span>
                Test Case Tiêu chuẩn (16 người - 8 Trận)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Zero Delta
              </span>
            </h3>

            <div className="text-xs text-slate-400 mb-3">
              <strong>Input:</strong> Nam (8): 2 TBK (5đ), 4 TBY (3đ), 2 Yếu (2đ) | Nữ (8): 2 TBY (3đ), 4 Yếu (2đ), 2 Newbie (1đ)
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-xs font-semibold text-emerald-300 mb-2">LƯỢT 1: Chế độ Cùng giới (Same-Gender Phase)</div>
                <ul className="space-y-1 text-xs font-mono text-slate-300">
                  <li>• Trận 1 (Đôi Nữ | 4đ vs 4đ): Nữ TBY (1) + Nữ Newbie (1) vs Nữ TBY (2) + Nữ Newbie (2)</li>
                  <li>• Trận 2 (Đôi Nữ | 4đ vs 4đ): Nữ Yếu (1) + Nữ Yếu (2) vs Nữ Yếu (3) + Nữ Yếu (4)</li>
                  <li>• Trận 3 (Đôi Nam | 7đ vs 7đ): Nam TBK (1) + Nam Yếu (1) vs Nam TBK (2) + Nam Yếu (2)</li>
                  <li>• Trận 4 (Đôi Nam | 6đ vs 6đ): Nam TBY (1) + Nam TBY (2) vs Nam TBY (3) + Nam TBY (4)</li>
                </ul>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-xs font-semibold text-purple-300 mb-2">LƯỢT 2: Chế độ Nam Nữ (Mixed Doubles Phase - Không lặp Partner)</div>
                <ul className="space-y-1 text-xs font-mono text-slate-300">
                  <li>• Trận 5 (Mix | 6đ vs 6đ): Nam TBK (1) + Nữ Newbie (1) vs Nam TBK (2) + Nữ Newbie (2)</li>
                  <li>• Trận 6 (Mix | 5đ vs 5đ): Nam TBY (1) + Nữ Yếu (1) vs Nam TBY (2) + Nữ Yếu (2)</li>
                  <li>• Trận 7 (Mix | 5đ vs 5đ): Nam TBY (3) + Nữ Yếu (3) vs Nam TBY (4) + Nữ Yếu (4)</li>
                  <li>• Trận 8 (Mix | 5đ vs 5đ): Nam Yếu (1) + Nữ TBY (1) vs Nam Yếu (2) + Nữ TBY (2)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-emerald-400 font-bold text-base mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-bold">5</span>
              Luồng thuật toán triển khai (Algorithm Logic Flow)
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <strong>Bước 1 (Chia Phase):</strong> Phân loại xếp theo Phase 1 (Cùng giới) hoặc Phase 2 (Nam Nữ).
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <strong>Bước 2 (Tạo mảng cặp đấu):</strong> Tổ hợp chập 2 (Combinations) tính PairScore = P1.rankScore + P2.rankScore.
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <strong>Bước 3 (Thuật toán Matchmaking):</strong> Backtracking tìm Pair A và Pair B thoả mãn: Delta = 0, 4 ID phân biệt, không trùng pastPartners.
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <strong>Bước 4 (Cập nhật State):</strong> Tăng playedCount + 1, push partner ID vào mảng pastPartners.
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <strong>Bước 5 (Lặp lại):</strong> Tiếp tục cho đến khi mọi người chơi đạt đủ số playedCount.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs transition-colors"
          >
            Đóng tài liệu
          </button>
        </div>
      </div>
    </div>
  );
};
