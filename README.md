# One Piece: Bounty Match

Một trò chơi **One Piece** kết nối và ghép cặp (tile‑matching) trên nền web, lấy cảm hứng từ trò chơi Pikachu cổ điển. Dự án sử dụng **HTML, CSS, Vanilla JavaScript** cho phần giao diện và **Node.js + Express + MySQL** cho phần máy chủ PvP trực tuyến.

## 🌐 Demo Trực Tuyến

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0ea5e9?style=for-the-badge&logo=github)](https://vp2802.github.io/One-Piece-Bounty-Match/index.html)

*Bản demo chỉ bao gồm chế độ chơi đơn ngoại tuyến. Để trải nghiệm PvP trực tuyến, bạn cần chạy back-end server.*

---

## 📖 Giới Thiệu Dự Án

**One Piece: Bounty Match** tái hiện lối chơi kết nối cổ điển trong một giao diện mang chủ đề hải tặc. Trò chơi cung cấp **chế độ chơi đơn ngoại tuyến** đầy đủ và **hệ thống PvP trực tuyến** hoàn chỉnh, bao gồm ghép trận, phe phái, cấp bậc và bảng xếp hạng toàn cầu.

Người chơi loại bỏ các cặp hình giống nhau bằng cách nối chúng bằng một đường đi có tối đa **2 lần rẽ**. Khi độ khó tăng, bàn chơi trở nên lớn hơn, lượt xáo trộn bị hạn chế và các cơ chế đặc biệt như dịch chuyển bàn chơi khiến trận đấu trở nên khó lường hơn.

---

## ✨ Tính Năng Chính

- **4 chế độ chơi:** Easy, Hard, Insane, Impossible
- **2 cách chơi:** Single Run & Continuous
- **Chế độ Offline** với bảng xếp hạng cục bộ
- **Chế độ Online PvP** đầy đủ:
  - **Hệ thống tài khoản:** Đăng ký / Đăng nhập với mật khẩu mã hóa
  - **Hai phe phái:** Hải Tặc & Hải Quân, mỗi phe 8 cấp bậc
  - **Loại trận đấu:** Đấu với Bot, Đấu Thường (phòng), Đấu Xếp Hạng (ghép tự động)
  - **Hệ thống RP động:** Dựa trên Elo, xét đến chênh lệch điểm số giữa hai người chơi
  - **Bảng xếp hạng Top 10 toàn cầu**, tìm kiếm người chơi, kết bạn & mời đấu
  - **Theo dõi điểm số trực tiếp** với đối thủ
- **Giao diện và bàn chơi phong cách One Piece**
- **Đồng hồ đếm ngược dạng "Wanted Poster"**
- **Hệ thống tính điểm theo chuỗi (combo)**
- **Gợi ý (Hints) ở chế độ Easy**
- **Xáo trộn (Reshuffle) thủ công** với giới hạn theo chế độ
- **Cơ chế dịch chuyển bàn chơi** ở độ khó cao
- **Điều khiển:** Tạm dừng / Chơi lại / Trang chính / Kết thúc
- **Bảng xếp hạng cục bộ** (offline) và **lịch sử đấu** PvP trên máy chủ
- **Thông báo dạng toast** tùy chỉnh
- **Âm thanh:** Bật/tắt & chỉnh âm lượng, nhạc nền tự chuyển khi gần hết giờ
- **Giao diện thích ứng** cho màn hình nhỏ

---

## 🕹️ Cách Chơi

### Single Run (Chơi Đơn & PvP)
- Chơi chính xác **1 màn**
- Màn kết quả hiện ngay sau khi thắng hoặc thua
- Phù hợp để thử sức nhanh

### Continuous (Chỉ Offline)
- Chơi liên tiếp các màn trong cùng một lần chạy
- **Tổng điểm** tích lũy qua các màn đã thắng
- Nhấn **End** bất cứ lúc nào để kết thúc và lưu điểm

---

## 🎮 Chế Độ Trò Chơi

| Chế độ      | Thời gian | Gợi ý | Kích thước | Reshuffle | Đặc biệt                                            |
|-------------|-----------|-------|------------|-----------|-----------------------------------------------------|
| Easy        | 15 phút   | 3     | 9 x 10     | 5         | Chỉ mở Reshuffle sau khi dùng hết gợi ý             |
| Hard        | 12 phút   | 0     | 10 x 15    | 3         | Mật độ bàn chơi cao tiêu chuẩn                       |
| Insane      | 10 phút   | 0     | 12 x 15    | 1         | Dịch chuyển bàn theo một hướng cố định trong cả màn |
| Impossible  | 8 phút    | 0     | 15 x 16    | 0         | Dịch chuyển bàn theo hướng ngẫu nhiên sau mỗi lần nối thành công |

*Trong PvP, chế độ được chọn ngẫu nhiên từ Hard, Insane, Impossible (Đấu Thường có thể có cả Easy).*

---

## 📊 Hệ Thống Điểm

### Điểm Ghép Cặp
Mỗi lần nối thành công:
- **Điểm cơ bản:** `100`
- **Thưởng Combo:** tùy theo chuỗi liên tiếp và độ khó

| Chế độ      | Thưởng Combo mỗi cấp |
|-------------|-----------------------|
| Easy        | +10                   |
| Hard        | +15                   |
| Insane      | +25                   |
| Impossible  | +35                   |

Combo tối đa được tính ở **5 cấp**.

### Nhân Thưởng Thời Gian
Số giây còn lại được nhân với hệ số khi thắng màn:

| Chế độ      | Hệ số |
|-------------|-------|
| Easy        | ×8    |
| Hard        | ×12   |
| Insane      | ×16   |
| Impossible  | ×20   |

### Thưởng Chế Độ
| Easy       | 0     |
| Hard       | 500   |
| Insane     | 1200  |
| Impossible | 2500  |

### Tổng Điểm Mỗi Màn
Tổng điểm màn = Điểm ghép cặp + Thưởng thời gian + Thưởng chế độ

---

## ⚔️ PvP Online

### Tài Khoản & Phe Phái
- **Đăng Ký** yêu cầu: Tên người chơi, Mật khẩu (có quy tắc mạnh), Xác nhận mật khẩu và Chọn phe.
- **Đăng Nhập** chỉ cần Tên và Mật khẩu.
- Mật khẩu được băm với bcrypt, không lưu dạng thô.
- Chọn giữa **Hải Tặc** hoặc **Hải Quân**, mỗi phe có hệ thống cấp bậc riêng.

### Hệ Thống Cấp Bậc (Rank)
| Khoảng RP | Hải Tặc                       | Hải Quân                        |
|-----------|-------------------------------|---------------------------------|
| < 100     | Rookie (Tân Binh)             | Recruit (Tân Binh)              |
| 100+      | Crewmate (Thuyền Viên)       | Petty Officer (Hạ Sĩ)          |
| 250+      | Captain (Thuyền Trưởng)      | Captain (Đại Úy)               |
| 500+      | Super Rookie (Siêu Tân Tinh) | Major (Thiếu Tá)               |
| 900+      | Shichibukai (Thất Vũ Hải)    | Commodore (Đề Đốc)             |
| 1500+     | Yonko Commander (Tư Lệnh Tứ Hoàng) | Vice Admiral (Phó Đô Đốc)      |
| 2300+     | Yonko (Tứ Hoàng)             | Admiral (Đô Đốc)               |
| 3500+     | Pirate King (Vua Hải Tặc)    | Fleet Admiral (Thủy Sư Đô Đốc) |

### Loại Trận Đấu
- **Đấu với Bot:** Một mình đấu với AI. Không thay đổi RP.
- **Đấu Thường (Friendly PvP):** Tạo phòng hoặc tham gia bằng mã phòng, hoặc ghép ngẫu nhiên. Không thay đổi RP.
- **Đấu Xếp Hạng (Ranked PvP):** Chỉ ghép ngẫu nhiên. Thay đổi Điểm Xếp Hạng (RP).

### Cách Tính RP Động
RP thay đổi dựa trên thuật toán kiểu Elo, xét đến chênh lệch điểm số và đẳng cấp hiện tại:

Điểm kỳ vọng = 1 / (1 + 10^((RP_đối_thủ - RP_bạn) / 400))
Thay đổi RP = K * (Điểm thực tế - Điểm kỳ vọng)

- **Hệ số K** phụ thuộc vào cấp bậc hiện tại (cao hơn ở bậc thấp, thấp hơn ở bậc cao).
- Điểm thực tế: 1 nếu thắng, 0.5 nếu hòa, 0 nếu thua.
- Thay đổi được giới hạn trong khoảng **-50** đến **+50**.
- Thắng đối thủ mạnh hơn được nhiều điểm hơn; thua đối thủ yếu hơn mất nhiều điểm hơn.

### Sảnh Chờ PvP
- Xem hồ sơ, cấp bậc và chỉ số của bản thân.
- Bảng **Top 10 Xếp Hạng** toàn cầu.
- **Tìm kiếm người chơi** để xem hồ sơ và kết bạn.
- **Danh sách bạn bè**, gửi/nhận lời mời kết bạn và mời đấu (chỉ đấu thường).
- Cập nhật thời gian thực lời mời kết bạn và mời đấu.

---

## 💡 Gợi Ý & Xáo Trộn

### Gợi Ý (Hint)
- Chỉ có ở chế độ **Easy**
- Mỗi lần dùng hiện một cặp có thể nối
- Mỗi lần dùng tốn **200 điểm**
- Khi hết gợi ý, nút **Hint biến mất**
- Ở chế độ Easy, dùng hết gợi ý sẽ **mở khóa Reshuffle**

### Xáo Trộn (Reshuffle)
- **Easy:** ẩn cho đến khi dùng hết gợi ý
- **Hard:** có sẵn ngay từ đầu
- **Insane:** có sẵn ngay từ đầu
- **Impossible:** không có sẵn

Nếu không còn nước đi hợp lệ:
- Trò chơi cố gắng xáo trộn các ô còn lại
- Nếu sau nhiều lần thử vẫn không có nước đi, bàn chơi có thể được xây dựng lại một phần để tránh bế tắc

---

## 🔊 Âm Thanh

- **Hiệu ứng:** match, wrong, win, lose
- **Nhạc nền:** Danh sách phát thường khi chơi; tự động chuyển sang danh sách "Nguy hiểm" trong **60 giây cuối**
- **Điều khiển âm lượng:** Nút tắt/bật và thanh trượt, lưu trong localStorage

---

## 🎮 Điều Khiển

| Nút              | Hành động                              |
|------------------|----------------------------------------|
| Sound / 🔊      | Tắt/bật toàn bộ âm thanh               |
| Thanh Âm Lượng   | Chỉnh âm lượng toàn cục                |
| Hints            | Hiện một cặp có thể nối (chỉ Easy)     |
| Reshuffle        | Xáo trộn các ô còn lại (nếu được phép)|
| Pause            | Đóng băng trò chơi và nhạc             |
| Restart          | Chơi lại chế độ/lượt chơi hiện tại     |
| End              | Kết thúc lượt Continuous hiện tại       |
| Home / Quit      | Quay về màn hình chính hoặc sảnh PvP   |

---

## 🛠️ Công Nghệ Sử Dụng

**Frontend**
- HTML5, CSS3 (biến tùy chỉnh, responsive)
- JavaScript thuần (ES Modules)
- LocalStorage cho bảng xếp hạng và cài đặt âm thanh
- GitHub Pages để lưu trữ tĩnh

**Backend**
- Node.js
- Express.js
- MySQL (qua `mysql2`)
- bcryptjs để băm mật khẩu
- Lưu trữ trên bộ nhớ (Map) cho hàng đợi và phòng đang hoạt động

---

## 📁 Cấu Trúc Dự Án

OnePieceBountyMatch/
├── index.html # File HTML chính (frontend)
├── style.css # Style toàn cục
├── README.md
├── frontend/
│ ├── css/
│ │ ├── components/
│ │ ├── game/
│ │ ├── screens/
│ │ ├── base.css
│ │ └── responsive.css
│ ├── js/
│ │ ├── game/ # Logic trò chơi offline
│ │ ├── pvp/ # Logic PvP (auth, room, matchmaking...)
│ │ ├── api.js # Gọi API đến backend
│ │ ├── audio.js # Quản lý âm thanh
│ │ ├── dom.js # Tham chiếu DOM
│ │ ├── main.js # Điểm vào & gán sự kiện
│ │ ├── state.js # Trạng thái toàn cục
│ │ └── ui.js # Tiện ích UI & quản lý màn hình
│ └── index.html # (nếu phục vụ riêng)
├── backend/
│ ├── routes/ # Định nghĩa các route Express
│ ├── services/ # Logic nghiệp vụ & truy vấn DB
│ ├── stores/ # Lưu trữ trên bộ nhớ (hàng đợi, phòng)
│ ├── utils/ # Hàm tiện ích
│ ├── app.js # Thiết lập Express app
│ ├── db.js # Kết nối MySQL
│ ├── server.js # Điểm vào máy chủ
│ ├── rank.js # Tính toán cấp bậc
│ └── .env # Biến môi trường
├── image/ # Hình ảnh tile & background board
└── sound/ # SFX và BGM

---

## ⚙️ Cài Đặt & Khởi Chạy (PvP Mode)

Để trải nghiệm đầy đủ tính năng PvP và lưu trữ dữ liệu, hãy thực hiện theo các bước sau:

### 1. Tải mã nguồn
```bash
git clone https://github.com/VP2802/One-Piece-Bounty-Match.git
cd One-Piece-Bounty-Match
```

### 2. Cấu hình Backend
Di chuyển vào thư mục backend và cài đặt các thư viện cần thiết:
```bash
cd backend
npm install
```

### 3. Thiết lập Cơ sở dữ liệu
* Cài đặt **MySQL** trên máy của bạn.
* Tạo một database mới (ví dụ: `one_piece_game`).
* Chạy các lệnh SQL (tìm trong thư mục backend hoặc file `.sql` đi kèm) để khởi tạo cấu trúc bảng.

### 4. Cấu hình biến môi trường
Tạo file `.env` nằm trong thư mục `backend/` với nội dung sau:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mật_khẩu_của_bạn
DB_NAME=ten_database
DB_PORT=3306
PORT=3000
```

### 5. Khởi chạy Server
```bash
npm run dev
```

### 6. Trải nghiệm Game
Mở file `index.html` (ở thư mục gốc hoặc frontend) bằng trình duyệt. 
> **Lưu ý:** Đảm bảo API base URL trong file `state.js` đã trỏ đúng về `http://localhost:3000` (mặc định đã được thiết lập).

---

## 📝 Ghi Chú
* **Độ khó:** Chế độ **Easy** dành cho người mới; **Insane** và **Impossible** đòi hỏi kỹ năng di chuyển bàn cờ thượng thừa.
* **Continuous Mode:** Thử thách sự ổn định của bạn qua nhiều màn chơi liên tiếp.
* **Lưu trữ:** Âm thanh và bảng xếp hạng offline được quản lý qua `localStorage`.
* **Cơ chế PvP:** Hiện tại đang sử dụng cơ chế **polling** phía máy chủ; dự kiến nâng cấp lên WebSocket trong tương lai.

---

## 🔮 Hướng Phát Triển
- [ ] **Real-time:** Sử dụng WebSocket để đồng bộ PvP tức thời.
- [ ] **Âm nhạc:** Thêm nhạc nền riêng biệt cho từng chế độ chơi và chủ đề màn.
- [ ] **Hiệu ứng âm thanh:** Chuyển đổi nhạc mượt mà (transition) khi rơi vào trạng thái nguy hiểm.
- [ ] **Visual:** Bổ sung hiệu ứng hình ảnh cho các chuỗi combo, chiến thắng và cảnh báo nguy hiểm.
- [ ] **Tùy biến:** Thêm nhiều bộ skin nhân vật và chủ đề bàn chơi (Themes).
- [ ] **Dữ liệu:** Hỗ trợ xuất/nhập (Export/Import) dữ liệu bảng xếp hạng.
- [ ] **Replay:** Hệ thống xem lại các trận đấu PvP đỉnh cao.

---