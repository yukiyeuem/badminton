import React, { useState, useRef } from 'react';
import { Player, Gender, getRankDefinitionByScore } from '../types/badminton';
import { parseBulkMembersText } from '../services/matchmakingAlgorithm';
import { parseExcelFile, downloadSampleExcelTemplate, ExcelImportResult } from '../services/excelImporter';
import {
  X,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Copy,
  Upload,
  Download,
  Table,
  Check,
} from 'lucide-react';

interface BulkMemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlayers: (players: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>[]) => void;
  initialMode?: 'EXCEL' | 'PASTE' | 'QUICK_TABLE';
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
  initialMode = 'EXCEL',
}) => {
  const [mode, setMode] = useState<'EXCEL' | 'PASTE' | 'QUICK_TABLE'>(initialMode);
  const [rawText, setRawText] = useState<string>(SAMPLE_TEXT);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel file import state
  const [excelResult, setExcelResult] = useState<ExcelImportResult | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Quick table rows for manual fast entry
  const [tableRows, setTableRows] = useState<
    { name: string; gender: Gender; rankScore: number; note: string }[]
  >([
    { name: 'Nguyễn Văn A', gender: 'MALE', rankScore: 4, note: 'Tấn công tốt' },
    { name: 'Trần Thị B', gender: 'FEMALE', rankScore: 3, note: 'Bắt lưới nhanh' },
    { name: 'Lê Văn C', gender: 'MALE', rankScore: 3, note: 'Phản tạt' },
    { name: 'Phạm Thị D', gender: 'FEMALE', rankScore: 2, note: 'Thủ bền' },
  ]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsParsingExcel(true);
    try {
      const res = await parseExcelFile(file);
      setExcelResult(res);
    } catch (err: any) {
      alert(`Lỗi khi phân tích file: ${err?.message || 'Không xác định'}`);
    } finally {
      setIsParsingExcel(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleConfirmExcel = () => {
    if (!excelResult || !excelResult.success || excelResult.players.length === 0) {
      alert('Chưa có danh sách thành viên hợp lệ từ file Excel. Vui lòng tải lên file hợp lệ.');
      return;
    }
    onImportPlayers(excelResult.players);
    onClose();
  };

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
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Nạp Danh Sách Thành Viên (Excel / Văn Bản)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  .xlsx • .xls • .csv
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tự động nhận diện Tên, Giới tính, Trình độ và xếp trận tối ưu Delta ≈ 0
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
            onClick={() => setMode('EXCEL')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'EXCEL'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Nhập File Excel (.xlsx / .csv)</span>
          </button>
          <button
            onClick={() => setMode('PASTE')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'PASTE'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dán văn bản</span>
          </button>
          <button
            onClick={() => setMode('QUICK_TABLE')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'QUICK_TABLE'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Nhập theo hàng</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* TAB 1: EXCEL IMPORT */}
          {mode === 'EXCEL' && (
            <div className="space-y-4">
              {/* Template Download & Instructions Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-300">
                  <div className="font-semibold text-white mb-0.5">Cấu trúc cột được hỗ trợ:</div>
                  <div className="text-slate-400 text-[11px]">
                    Cột 1: <strong>Họ và Tên</strong> | Cột 2: <strong>Giới tính</strong> (Nam/Nữ) | Cột 3: <strong>Trình độ</strong> (1-5 hoặc Newbie/Yếu/TBY/TB/TBK) | Cột 4: <strong>Ghi chú</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file mẫu Excel (.xlsx)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFileInputChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDropFile}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? 'border-emerald-400 bg-emerald-950/30 scale-[1.01]'
                    : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    {isParsingExcel ? 'Đang đọc và phân tích file...' : 'Kéo thả file Excel vào đây hoặc click để chọn file'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Hỗ trợ định dạng Microsoft Excel <strong>.xlsx</strong>, <strong>.xls</strong> hoặc <strong>.csv</strong>
                  </p>
                </div>
              </div>

              {/* Parsed Excel Preview */}
              {excelResult && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        File: {excelResult.fileName}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {excelResult.players.length} thành viên hợp lệ
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExcelResult(null)}
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      Chọn file khác
                    </button>
                  </div>

                  {excelResult.errors.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/30 text-xs text-amber-300 space-y-1">
                      {excelResult.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Họ và tên</th>
                          <th className="py-2 px-3">Giới tính</th>
                          <th className="py-2 px-3">Trình độ</th>
                          <th className="py-2 px-3">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {excelResult.players.map((p, idx) => {
                          const rDef = getRankDefinitionByScore(p.rankScore);
                          return (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="py-1.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                              <td className="py-1.5 px-3 font-medium text-slate-200">{p.name}</td>
                              <td className="py-1.5 px-3">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${p.gender === 'MALE' ? 'text-blue-400 bg-blue-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                  {p.gender === 'MALE' ? '♂ Nam' : '♀ Nữ'}
                                </span>
                              </td>
                              <td className="py-1.5 px-3">
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                                  style={{
                                    backgroundColor: rDef.bgLight,
                                    color: rDef.color,
                                    borderColor: rDef.borderLight,
                                  }}
                                >
                                  {rDef.shortLabel} ({rDef.score}đ)
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                                {p.clubNote || '--'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {mode === 'PASTE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Định dạng mỗi dòng: <code className="text-emerald-300 font-mono">Tên, Giới tính, Trình độ (1-5 hoặc Newbie/Yếu/TBY/TB/TBK), [Ghi chú]</code>
                </span>
                <button
                  type="button"
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
                rows={11}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                placeholder="Dán danh sách thành viên ở đây..."
              />

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>• <strong>Trình độ hợp lệ:</strong> 1 (Newbie), 2 (Yếu), 3 (TBY), 4 (TB), 5 (TBK).</div>
                <div>• <strong>Giới tính hợp lệ:</strong> Nam, Nữ (hoặc Male, Female, M, F).</div>
                <div>• Sau khi nạp, thuật toán sẽ tự động phân loại và tính toán ma trận xếp trận cân bằng nhất (Delta ≈ 0).</div>
              </div>
            </div>
          )}

          {/* TAB 3: TABLE INPUT */}
          {mode === 'QUICK_TABLE' && (
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
                            type="button"
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
                type="button"
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
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={
              mode === 'EXCEL'
                ? handleConfirmExcel
                : mode === 'PASTE'
                ? handleImportText
                : handleImportTable
            }
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
