import React, { useState } from 'react';
import { Player, Gender, RANK_DEFINITIONS } from '../types/badminton';
import { parseBulkMembersText } from '../services/matchmakingAlgorithm';
import { X, FileText, CheckCircle2, AlertCircle, Sparkles, Plus, Copy } from 'lucide-react';

interface BulkMemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlayers: (players: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>[]) => void;
}

const SAMPLE_TEXT = `# Mẫu danh sách thành viên (Định dạng: Tên, Giới tính, Trình độ [1-5 hoặc Newbie/Yếu/TBY/TB/TBK], Ghi chú)
Nguyễn Hoàng Nam, Nam, 5, Đập cầu uy lực
Trần Quốc Toản, Nam, 4, Thủ cầu phản tạt
Lê Văn Bình, Nam, 3, Đánh lưới nhanh
Phạm Minh Đức, Nam, 2, Đang tập cổ tay
Nguyễn Thu Hương, Nữ, 3, Bắt lưới tinh tế
Đỗ Khánh Linh, Nữ, 2, Nhiệt tình chạy sân
Vũ Thảo My, Nữ, 1, Người mới tham gia
Bùi Mai Anh, Nữ, 2, Giao cầu chắc chắn`;

export const BulkMemberImportModal: React.FC<BulkMemberImportModalProps> = ({
  isOpen,
  onClose,
  onImportPlayers,
}) => {
  const [rawText, setRawText] = useState<string>(SAMPLE_TEXT);
  const [mode, setMode] = useState<'PASTE' | 'QUICK_TABLE'>('PASTE');

  // Quick table rows for manual fast entry
  const [tableRows, setTableRows] = useState<
    { name: string; gender: Gender; rankScore: number; note: string }[]
  >([
    { name: 'Nguyễn Văn A', gender: 'MALE', rankScore: 4, note: '' },
    { name: 'Trần Thị B', gender: 'FEMALE', rankScore: 3, note: '' },
    { name: 'Lê Văn C', gender: 'MALE', rankScore: 3, note: '' },
    { name: 'Phạm Thị D', gender: 'FEMALE', rankScore: 2, note: '' },
  ]);

  if (!isOpen) return null;

  const handleImportText = () => {
    const res = parseBulkMembersText(rawText);
    if (!res.success) {
      alert('Không tìm thấy thành viên hợp lệ nào trong văn bản. Vui lòng kiểm tra định dạng.');
      return;
    }
    onImportPlayers(res.players);
    onClose();
  };

  const handleImportTable = () => {
    const valid = tableRows.filter((r) => r.name.trim() !== '');
    if (valid.length === 0) {
      alert('Vui lòng nhập ít nhất một thành viên có tên.');
      return;
    }
    onImportPlayers(
      valid.map((r) => ({
        name: r.name.trim(),
        gender: r.gender,
        rankScore: r.rankScore,
        clubNote: r.note.trim() || undefined,
      }))
    );
    onClose();
  };

  const addTableRow = () => {
    setTableRows((prev) => [
      ...prev,
      { name: '', gender: 'MALE', rankScore: 3, note: '' },
    ]);
  };

  const updateTableRow = (
    index: number,
    field: 'name' | 'gender' | 'rankScore' | 'note',
    val: any
  ) => {
    setTableRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeTableRow = (index: number) => {
    setTableRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Điền & Nạp Danh Sách Thành Viên Nhanh
              </h2>
              <p className="text-xs text-slate-400">
                Nhập tên, giới tính và trình độ cho cả nhóm để thuật toán tự động xếp cặp và xếp trận phù hợp
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setMode('PASTE')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'PASTE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dán danh sách văn bản (Nhanh)
          </button>
          <button
            onClick={() => setMode('QUICK_TABLE')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'QUICK_TABLE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Nhập theo hàng bảng
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {mode === 'PASTE' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Định dạng mỗi dòng: <code className="text-emerald-300 font-mono">Tên, Giới tính, Trình độ (1-5 hoặc Newbie/Yếu/TBY/TB/TBK), [Ghi chú]</code>
                </span>
                <button
                  onClick={() => setRawText(SAMPLE_TEXT)}
                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  Nạp mẫu thử
                </button>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={12}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                placeholder="Dán danh sách thành viên ở đây..."
              />

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• <strong>Trình độ hợp lệ:</strong> 1 (Newbie), 2 (Yếu), 3 (TBY), 4 (TB), 5 (TBK).</div>
                <div>• <strong>Giới tính hợp lệ:</strong> Nam, Nữ (hoặc Male, Female, M, F).</div>
                <div>• Sau khi nạp, thuật toán sẽ tự động phân loại và tính toán ma trận xếp trận cân bằng nhất (Delta ≈ 0).</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Tên thành viên</th>
                      <th className="py-2 px-3">Giới tính</th>
                      <th className="py-2 px-3">Trình độ (Điểm)</th>
                      <th className="py-2 px-3">Ghi chú</th>
                      <th className="py-2 px-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tableRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => updateTableRow(idx, 'name', e.target.value)}
                            placeholder="Tên người chơi"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.gender}
                            onChange={(e) => updateTableRow(idx, 'gender', e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.rankScore}
                            onChange={(e) => updateTableRow(idx, 'rankScore', Number(e.target.value))}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value={1}>1đ - Newbie</option>
                            <option value={2}>2đ - Yếu</option>
                            <option value={3}>3đ - TBY</option>
                            <option value={4}>4đ - TB</option>
                            <option value={5}>5đ - TBK</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.note}
                            onChange={(e) => updateTableRow(idx, 'note', e.target.value)}
                            placeholder="Ghi chú sở trường..."
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => removeTableRow(idx)}
                            className="text-slate-500 hover:text-rose-400 text-xs"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addTableRow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm dòng mới
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Hủy
          </button>
          <button
            onClick={mode === 'PASTE' ? handleImportText : handleImportTable}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác nhận nạp và xếp trận</span>
          </button>
        </div>
      </div>
    </div>
  );
};
