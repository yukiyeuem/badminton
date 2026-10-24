import * as XLSX from 'xlsx';
import { Player, Gender } from '../types/badminton';

export interface ExcelImportResult {
  success: boolean;
  players: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>[];
  errors: string[];
  totalRows: number;
  fileName: string;
}

/**
 * Standardize Rank Score from various textual / numerical representations
 */
function normalizeRankScore(val: any): number {
  if (typeof val === 'number') {
    if (val >= 1 && val <= 5) return Math.round(val);
    return 3;
  }
  const str = String(val || '').trim().toLowerCase();
  if (str === '1' || str === 'newbie' || str.includes('mới')) return 1;
  if (str === '2' || str === 'yếu' || str === 'yeu') return 2;
  if (str === '3' || str === 'tby' || str.includes('trung bình yếu') || str.includes('trung binh yeu')) return 3;
  if (str === '4' || str === 'tb' || str.includes('trung bình') || str.includes('trung binh')) return 4;
  if (str === '5' || str === 'tbk' || str.includes('trung bình khá') || str.includes('trung binh kha') || str.includes('khá')) return 5;

  const parsed = parseInt(str, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) return parsed;
  return 3; // Default average
}

/**
 * Standardize Gender from Vietnamese/English text
 */
function normalizeGender(val: any): Gender {
  const str = String(val || '').trim().toLowerCase();
  if (
    str.includes('nữ') ||
    str.includes('nu') ||
    str === 'f' ||
    str === 'female' ||
    str === 'gái' ||
    str === 'gai'
  ) {
    return 'FEMALE';
  }
  return 'MALE';
}

/**
 * Parse an Excel file (.xlsx, .xls, .csv) into structured Player objects
 */
export async function parseExcelFile(file: File): Promise<ExcelImportResult> {
  const errors: string[] = [];
  const players: Omit<Player, 'id' | 'playedCount' | 'pastPartners'>[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        players: [],
        errors: ['File Excel không chứa bất kỳ sheet dữ liệu nào.'],
        totalRows: 0,
        fileName: file.name,
      };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to array of rows (header: 1 returns array of arrays)
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        players: [],
        errors: ['Sheet Excel trống, không có dòng dữ liệu nào.'],
        totalRows: 0,
        fileName: file.name,
      };
    }

    // Detect header row index (looking for keywords: Tên, Name, Họ tên, Giới tính, Trình độ...)
    let headerRowIdx = -1;
    let colNameIdx = 0;
    let colGenderIdx = 1;
    let colRankIdx = 2;
    let colNoteIdx = 3;

    for (let i = 0; i < Math.min(rawData.length, 5); i++) {
      const row = rawData[i].map((cell) => String(cell || '').trim().toLowerCase());
      const hasName = row.some((c) => c.includes('tên') || c.includes('name') || c.includes('vận động viên') || c.includes('vdv'));
      const hasGender = row.some((c) => c.includes('giới tính') || c.includes('gender') || c.includes('phái'));
      const hasRank = row.some((c) => c.includes('trình độ') || c.includes('rank') || c.includes('level') || c.includes('điểm'));

      if (hasName || hasGender || hasRank) {
        headerRowIdx = i;
        row.forEach((cell, idx) => {
          if (cell.includes('tên') || cell.includes('name') || cell.includes('vận động viên') || cell.includes('vdv')) colNameIdx = idx;
          if (cell.includes('giới') || cell.includes('gender') || cell.includes('phái') || cell.includes('nam/nữ')) colGenderIdx = idx;
          if (cell.includes('trình') || cell.includes('rank') || cell.includes('level') || cell.includes('điểm') || cell.includes('score')) colRankIdx = idx;
          if (cell.includes('ghi chú') || cell.includes('note') || cell.includes('sở trường') || cell.includes('clb')) colNoteIdx = idx;
        });
        break;
      }
    }

    const dataStartIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;

    for (let r = dataStartIdx; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0) continue;

      const rawName = String(row[colNameIdx] || '').trim();
      if (!rawName) continue; // Skip empty row

      const rawGender = row[colGenderIdx];
      const rawRank = row[colRankIdx];
      const rawNote = row[colNoteIdx] ? String(row[colNoteIdx]).trim() : undefined;

      const gender = normalizeGender(rawGender);
      const rankScore = normalizeRankScore(rawRank);

      players.push({
        name: rawName,
        gender,
        rankScore,
        clubNote: rawNote,
      });
    }

    if (players.length === 0) {
      errors.push('Không tìm thấy bản ghi người chơi hợp lệ nào trong file Excel.');
    }

    return {
      success: players.length > 0,
      players,
      errors,
      totalRows: players.length,
      fileName: file.name,
    };
  } catch (err: any) {
    return {
      success: false,
      players: [],
      errors: [`Lỗi khi đọc file Excel: ${err?.message || 'Định dạng không được hỗ trợ'}`],
      totalRows: 0,
      fileName: file.name,
    };
  }
}

/**
 * Generate and trigger download of a sample Excel template (.xlsx)
 */
export function downloadSampleExcelTemplate() {
  const headers = ['Họ và Tên', 'Giới tính', 'Trình độ (1-5)', 'Ghi chú sở trường'];
  const sampleData = [
    headers,
    ['Nguyễn Hoàng Nam', 'Nam', '5 (TBK)', 'Tấn công dồn dập, đập cầu uy lực'],
    ['Trần Quốc Toản', 'Nam', '4 (TB)', 'Thủ cầu bền bỉ, phản tạt nhanh'],
    ['Lê Văn Bình', 'Nam', '3 (TBY)', 'Đánh lưới phản xạ tốt'],
    ['Phạm Minh Đức', 'Nam', '2 (Yếu)', 'Mới chơi được 6 tháng'],
    ['Nguyễn Thu Hương', 'Nữ', '3 (TBY)', 'Bắt lưới nhanh, giao cầu khó'],
    ['Đỗ Khánh Linh', 'Nữ', '2 (Yếu)', 'Chạy sân nhiệt tình, thủ bền'],
    ['Vũ Thảo My', 'Nữ', '1 (Newbie)', 'Người mới làm quen với vợt'],
    ['Bùi Mai Anh', 'Nữ', '2 (Yếu)', 'Cầu bổng tốt, di chuyển ổn định'],
    ['Trần Văn Hưng', 'Nam', '3 (TBY)', 'Giao cầu đầm, bao sân sau'],
    ['Nguyễn Hải Yến', 'Nữ', '3 (TBY)', 'Bỏ nhỏ tinh tế góc lưới'],
    ['Đặng Quang Huy', 'Nam', '4 (TB)', 'Tạt cầu chéo sân, điều nhịp tốt'],
    ['Lê Ngọc Ánh', 'Nữ', '1 (Newbie)', 'Mới tham gia giao lưu buổi đầu'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // Họ và tên
    { wch: 12 }, // Giới tính
    { wch: 16 }, // Trình độ
    { wch: 35 }, // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachThanhVien');

  XLSX.writeFile(wb, 'Mau_Danh_Sach_Thanh_Vien_Cau_Long.xlsx');
}
