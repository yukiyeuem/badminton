# TÀI LIỆU ĐẶC TẢ TÍNH NĂNG XẾP TRẬN CẦU LÔNG (MATCHMAKING ALGORITHM)

## 1. Mục tiêu (Objective)
Xây dựng module thuật toán tự động sắp xếp các trận đấu cầu lông dựa trên danh sách người chơi đầu vào. 
Yêu cầu cốt lõi: 
- Đảm bảo cân bằng trình độ giữa hai đội trong một trận đấu (Delta Score $\approx$ 0).
- Đảm bảo tính đa dạng: Mỗi người chơi không lặp lại partner (đồng đội).
- Hỗ trợ linh hoạt các thể loại: Đôi Nam, Đôi Nữ, Đôi Nam Nữ (Mix).

## 2. Hệ số hóa trình độ (Scoring System)
Hệ thống sử dụng thang điểm (Rank Score) để lượng hóa trình độ người chơi:
- **Newbie:** 1 điểm
- **Yếu:** 2 điểm
- **Trung bình yếu (TBY):** 3 điểm
- **Trung bình (TB):** 4 điểm
- **Trung bình khá (TBK):** 5 điểm

## 3. Cấu trúc dữ liệu (Data Model)

### 3.1. Player Object
```json
{
  "id": "string",
  "name": "string",
  "gender": "MALE | FEMALE",
  "rankScore": "number",
  "playedCount": "number", // Số trận đã ra sân (Mặc định = 0)
  "pastPartners": ["string"] // Mảng chứa ID của những người đã từng đánh cùng
}
```

### 3.2. Match Object
```json
{
  "matchId": "string",
  "type": "MENS_DOUBLE | WOMENS_DOUBLE | MIXED_DOUBLE",
  "teamA": ["playerId1", "playerId2"], // Tổng điểm: X
  "teamB": ["playerId3", "playerId4"], // Tổng điểm: Y
  "delta": "number" // |X - Y| (Càng gần 0 càng tốt)
}
```

## 4. Test Case Tiêu chuẩn (16 người - 8 Trận)
**Input Data:** 
- Nam (8): 2 TBK (5đ), 4 TBY (3đ), 2 Yếu (2đ)
- Nữ (8): 2 TBY (3đ), 4 Yếu (2đ), 2 Newbie (1đ)

**Kịch bản yêu cầu:** 16 người tạo thành 8 trận. Mỗi người đánh đúng 2 trận (1 trận đánh cùng giới, 1 trận đánh nam nữ). Đổi partner sau lượt 1.

### KẾT QUẢ ĐẦU RA MONG ĐỢI (EXPECTED OUTPUT)

**LƯỢT 1: Chế độ Cùng giới (Same-Gender Phase)**
- **Trận 1 (Đôi Nữ | 4đ vs 4đ):** Nữ TBY (1) + Nữ Newbie (1) **vs** Nữ TBY (2) + Nữ Newbie (2)
- **Trận 2 (Đôi Nữ | 4đ vs 4đ):** Nữ Yếu (1) + Nữ Yếu (2) **vs** Nữ Yếu (3) + Nữ Yếu (4)
- **Trận 3 (Đôi Nam | 7đ vs 7đ):** Nam TBK (1) + Nam Yếu (1) **vs** Nam TBK (2) + Nam Yếu (2)
- **Trận 4 (Đôi Nam | 6đ vs 6đ):** Nam TBY (1) + Nam TBY (2) **vs** Nam TBY (3) + Nam TBY (4)

**LƯỢT 2: Chế độ Nam Nữ (Mixed Doubles Phase)**
*(Kiểm tra Validation: Đã đổi Partner hoàn toàn)*
- **Trận 5 (Mix | 6đ vs 6đ):** Nam TBK (1) + Nữ Newbie (1) **vs** Nam TBK (2) + Nữ Newbie (2)
- **Trận 6 (Mix | 5đ vs 5đ):** Nam TBY (1) + Nữ Yếu (1) **vs** Nam TBY (2) + Nữ Yếu (2)
- **Trận 7 (Mix | 5đ vs 5đ):** Nam TBY (3) + Nữ Yếu (3) **vs** Nam TBY (4) + Nữ Yếu (4)
- **Trận 8 (Mix | 5đ vs 5đ):** Nam Yếu (1) + Nữ TBY (1) **vs** Nam Yếu (2) + Nữ TBY (2)

## 5. Luồng thuật toán triển khai (Algorithm Logic Flow)

**Bước 1: Chia Phase (Phân loại kịch bản)**
Hệ thống nhận input và xác định cần xếp trận theo Phase 1 (Cùng giới) hay Phase 2 (Nam Nữ).

**Bước 2: Tạo mảng cặp đấu (Generate Pairs)**
- **Phase 1:** Tách danh sách thành `malePool` và `femalePool`. Sử dụng thuật toán tổ hợp chập 2 (Combinations) để tạo ra tất cả các cặp đánh đôi cùng giới có thể xảy ra. Tính `PairScore = P1.rankScore + P2.rankScore`.
- **Phase 2:** Duyệt chéo `malePool` và `femalePool` để tạo các cặp Nam-Nữ. Tính `PairScore`.

**Bước 3: Thuật toán Matchmaking (Greedy / Backtracking)**
- Sắp xếp mảng các Cặp (Pairs) theo điểm số (PairScore).
- Tìm kiếm 2 Cặp (Pair A và Pair B) thoả mãn các điều kiện:
  1. **Condition 1:** `|PairA.Score - PairB.Score| == 0` (Hoặc $\le$ Threshold định trước).
  2. **Condition 2:** 4 ID trong 2 cặp phải hoàn toàn khác biệt (Không ai phân thân ra đá 2 sân).
  3. **Condition 3:** Đối chiếu ID của từng người với mảng `pastPartners` của họ. Nếu phát hiện trùng lặp $\rightarrow$ Loại kết quả này, duyệt tiếp xuống mảng.

**Bước 4: Cập nhật State**
- Khi chốt được 1 trận (Match), đẩy Match vào Database.
- Cộng `playedCount` + 1 cho 4 Players tham gia.
- Push ID của đồng đội vào mảng `pastPartners` của nhau.

**Bước 5: Lặp lại**
Quay lại Bước 2 cho đến khi toàn bộ người chơi đạt đủ số `playedCount` yêu cầu (trong ví dụ này là 2).