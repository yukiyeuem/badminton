# 🏸 Badminton Matchmaker - Thuật Toán Xếp Trận Cầu Lông Cân Bằng

> Hệ thống tự động xếp trận cầu lông thông minh: đảm bảo cân bằng trình độ giữa hai đội ($\Delta \approx 0$), triệt tiêu tình trạng trùng lặp partner, hỗ trợ Đôi Nam, Đôi Nữ, Đôi Nam Nữ (Mix) và giao lưu thách đấu liên đội.

---

## 🎯 Mục tiêu cốt lõi (Core Objectives)

1. **Cân bằng trình độ ($\Delta \text{ Score} \approx 0$):**
   - Lượng hóa trình độ người chơi theo thang điểm chuẩn 1 - 5 (Newbie, Yếu, TBY, TB, TBK).
   - Ghép 2 đội (Team A vs Team B) sao cho độ chênh lệch $|X - Y|$ tối thiểu (ưu tiên tuyệt đối $\Delta = 0$).

2. **Chống trùng đồng đội (Zero Duplicate Partners):**
   - Theo dõi mảng `pastPartners` của từng thành viên qua từng lượt đấu.
   - Không cho phép người chơi lặp lại đồng đội đã từng đánh cùng.

3. **Linh hoạt thể loại thi đấu:**
   - **Lượt 1 (Same-Gender):** Đôi Nam, Đôi Nữ.
   - **Lượt 2 (Mixed Doubles):** Đôi Nam Nữ hoàn toàn đổi mới partner.

4. **Tính năng mở rộng:**
   - **Điền / Dán danh sách nhóm nhanh (Bulk Import):** Hỗ trợ nhập danh sách thành viên dạng text hoặc dạng bảng.
   - **Chọn cặp đi giao lưu / Thách đấu liên đội (Inter-Team Matchmaking):** Chọn 2 người cụ thể trong nhóm và tự động tìm kiếm đối thủ có trình độ tương đương nhất ($\Delta \approx 0$).
   - **Bảng điều khiển sân trực tiếp (Live Court Arena):** Sơ đồ sân cầu lông SVG trực quan, chấm điểm live, chỉ báo quyền giao cầu.

---

## 📊 Hệ số hóa trình độ (Scoring System)

| Hạng | Tên trình độ | Điểm (Score) | Đặc điểm lối chơi |
| :--- | :--- | :---: | :--- |
| **Newbie** | Mới chơi | **1** | Mới làm quen vợt và luật sân |
| **Yếu** | Yếu | **2** | Đang rèn luyện bước di chuyển và đánh cơ bản |
| **TBY** | Trung bình yếu | **3** | Kỹ thuật cơ bản ổn định, giao cầu tốt |
| **TB** | Trung bình | **4** | Phản tạt nhanh, điều cầu tốt |
| **TBK** | Trung bình khá | **5** | Thể lực dồi dào, công thủ toàn diện |

---

## 🧪 Kết quả kiểm định Test Case Tiêu chuẩn (16 người - 8 Trận)

- **Input:**
  - 8 Nam: 2 TBK (5đ), 4 TBY (3đ), 2 Yếu (2đ)
  - 8 Nữ: 2 TBY (3đ), 4 Yếu (2đ), 2 Newbie (1đ)
- **Kết quả:**
  - **8 / 8 Trận đạt $\Delta = 0$ tuyệt đối (100%)**
  - **0% trùng lặp partner sau lượt 1**
  - **Mỗi người chơi đúng 2 trận (1 cùng giới, 1 nam nữ)**

---

## 🚀 Cài đặt & Chạy dự án (Getting Started)

```bash
# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy dev server
npm run dev

# Kiểm tra lint
npm run lint

# Build bản phát hành
npm run build
```

---

## 📁 Cấu trúc thư mục

```
src/
├── types/
│   └── badminton.ts                 # Data models (Player, Match, Pair, Rank)
├── services/
│   ├── matchmakingAlgorithm.ts      # Thuật toán 5 bước (Backtracking & Constraints)
│   └── standardTestCase.ts          # Bộ dữ liệu mẫu 16 người & validator kiểm định
├── components/
│   ├── Navbar.tsx                   # Thanh điều hướng và tác vụ nhanh
│   ├── ScheduleView.tsx             # Lịch thi đấu, thẻ trận đấu & nhập điểm
│   ├── CourtManager.tsx             # Bảng điều khiển sân live & SVG Court
│   ├── BadmintonCourtSvg.tsx        # Sơ đồ sân cầu lông SVG chuẩn
│   ├── PlayerRoster.tsx             # Quản lý danh sách thành viên nhóm
│   ├── InterTeamMatchmaker.tsx      # Chọn cặp & tìm đối thủ giao lưu
│   ├── BulkMemberImportModal.tsx    # Modal điền / nạp danh sách nhanh
│   ├── AlgorithmVisualizer.tsx      # Trực quan hóa 5 bước thuật toán
│   ├── ValidationReport.tsx         # Báo cáo kiểm định toán học
│   └── SpecModal.tsx                # Xem trực tiếp file tài liệu đặc tả .md
├── App.tsx                          # Component chính tích hợp toàn bộ tính năng
└── main.tsx                         # Entry point ứng dụng React
```

---

*Phát triển dựa trên Tài liệu đặc tả tính năng xếp trận cầu lông.*
