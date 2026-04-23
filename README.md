# One Piece: Bounty Match

Một trò chơi **One Piece** kết nối và ghép cặp (tile‑matching) trên nền web, lấy cảm hứng từ trò chơi Pikachu cổ điển. Dự án sử dụng **HTML, CSS, Vanilla JavaScript** cho phần giao diện và **Node.js + Express + MySQL** cho phần máy chủ PvP trực tuyến, được triển khai trên **Railway**.

## 🌐 Demo Trực Tuyến

| Môi trường | Link | Ghi chú |
|------------|------|---------|
| **Frontend (GitHub Pages)** | [![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0ea5e9?style=for-the-badge&logo=github)](https://vp2802.github.io/One-Piece-Bounty-Match/index.html) | Giao diện người dùng, chơi offline được. Cần backend để chơi PvP. |
| **Backend API (Railway)** | [https://one-piece-bounty-match-production.up.railway.app/](https://one-piece-bounty-match-production.up.railway.app/) | Server xử lý đăng nhập, PvP, xếp hạng. |

*Frontend được deploy tự động từ thư mục `frontend` lên nhánh `gh-pages` thông qua GitHub Actions. Backend được deploy lên Railway với MySQL tích hợp.*

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
- GitHub Pages + GitHub Actions (CI/CD tự động từ nhánh `main`)

**Backend**
- Node.js + Express.js
- MySQL (qua `mysql2`) – sử dụng Railway MySQL service
- bcryptjs để băm mật khẩu
- Lưu trữ trên bộ nhớ (Map) cho hàng đợi và phòng đang hoạt động

**Triển khai & Giám sát**
- **Railway** – Deploy backend & MySQL database
- **UptimeRobot** – Giữ server không bị sleep (ping định kỳ 5 phút)

---

## 📁 Cấu Trúc Dự Án

One-Piece-Bounty-Match/
├── .github/workflows/ # GitHub Actions CI/CD
│ └── deploy-frontend.yml # Workflow deploy frontend lên gh-pages
├── frontend/ # Mã nguồn giao diện (được deploy lên GitHub Pages)
│ ├── index.html
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
│ │ ├── state.js # Trạng thái toàn cục (chứa API_BASE_URL)
│ │ └── ui.js # Tiện ích UI & quản lý màn hình
│ ├── image/ # Hình ảnh tile & background board
│ └── sound/ # SFX và BGM
├── backend/ # Mã nguồn máy chủ (deploy lên Railway)
│ ├── routes/ # Định nghĩa các route Express
│ ├── services/ # Logic nghiệp vụ & truy vấn DB
│ ├── stores/ # Lưu trữ trên bộ nhớ (hàng đợi, phòng)
│ ├── utils/ # Hàm tiện ích
│ ├── app.js # Thiết lập Express app
│ ├── db.js # Kết nối MySQL (hỗ trợ biến Railway)
│ ├── server.js # Điểm vào máy chủ
│ ├── rank.js # Tính toán cấp bậc
│ └── package.json
├── .gitignore
└── README.md

-----

## ⚙️ Hướng Dẫn Cài Đặt & Triển Khai

Dự án hỗ trợ hai phương thức vận hành chính: Trải nghiệm cá nhân (Offline) hoặc Hệ thống đầy đủ tính năng (Online PvP).

### 🕹️ A. Chơi Offline (Frontend Tĩnh)

Phù hợp để test gameplay nhanh hoặc chơi đơn. Dữ liệu bảng xếp hạng được lưu tại trình duyệt của người chơi (**LocalStorage**).

1.  **Clone repository:**
    ```bash
    git clone https://github.com/VP2802/One-Piece-Bounty-Match.git
    ```
2.  **Khởi chạy:**
      * Truy cập trực tiếp: [One Piece Bounty Match Online](https://vp2802.github.io/One-Piece-Bounty-Match/) *(Bản Github Pages)*.
      * Hoặc mở file `frontend/index.html` bằng trình duyệt bất kỳ.

-----

### 🌐 B. Triển Khai Online PvP (Full Stack)

Để kích hoạt tính năng đấu hạng, kết bạn và PvP thời gian thực, bạn cần triển khai Backend & Database lên **Railway.app**.

#### 1\. Deploy Backend lên Railway

1.  **Fork** repository này về tài khoản GitHub cá nhân.
2.  Truy cập [Railway.app](https://railway.app/) và kết nối với GitHub.
3.  Chọn **New Project** → **Deploy from GitHub repo** → Chọn repo vừa fork.
4.  Cấu hình tại tab **Settings**:
      * **Root Directory:** `backend`
      * **Build Command:** `npm install`
      * **Start Command:** `node server.js`

#### 2\. Cài đặt MySQL Database

1.  Trong project Railway, nhấn **Add Service** → **Database** → **MySQL**.
2.  Railway sẽ tự động tạo Instance.

#### 3\. Cấu hình Biến Môi Trường (Environment Variables)

Tại service **Backend**, vào tab **Variables** và thêm các biến liên kết với MySQL (Sử dụng *Reference Variables* của Railway):

| Variable | Value (Reference) |
| :--- | :--- |
| `MYSQLHOST` | `${{MySQL.MYSQLHOST}}` |
| `MYSQLPORT` | `${{MySQL.MYSQLPORT}}` |
| `MYSQLUSER` | `${{MySQL.MYSQLUSER}}` |
| `MYSQLPASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `MYSQLDATABASE` | `${{MySQL.MYSQLDATABASE}}` |

> [\!IMPORTANT]
> Lưu ý: `MySQL` trong cú pháp `${{MySQL...}}` phải trùng với **tên service database** bạn vừa tạo.

#### 4\. Khởi tạo Database Schema

Sử dụng một công cụ như **DBeaver** hoặc **TablePlus**, kết nối vào MySQL thông qua **Public Connection String** (Lấy tại tab *Connect* của service MySQL) và thực thi script sau:

\<details\>
\<summary\>📑 Nhấn để xem SQL Script khởi tạo\</summary\>

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_name VARCHAR(30) NOT NULL UNIQUE,
  faction ENUM('pirate', 'marine') NOT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  show_pvp_history TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leaderboard_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  highest_score INT DEFAULT 0,
  highest_stage INT DEFAULT 1,
  best_run_time_seconds INT DEFAULT 0,
  total_single_runs INT DEFAULT 0,
  total_pvp_matches INT DEFAULT 0,
  total_pvp_wins INT DEFAULT 0,
  ranking_points INT DEFAULT 0,
  current_rank VARCHAR(100) DEFAULT 'Rookie (Tân Binh)',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pvp_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player1_id INT NOT NULL,
  player2_id INT NOT NULL,
  random_mode VARCHAR(50) NOT NULL,
  player1_score INT NOT NULL,
  player2_score INT NOT NULL,
  player1_stage INT NOT NULL,
  player2_stage INT NOT NULL,
  player1_time_seconds INT NOT NULL,
  player2_time_seconds INT NOT NULL,
  winner_user_id INT NULL,
  match_result ENUM('player1_win', 'player2_win', 'draw') NOT NULL,
  player1_rank_points_change INT DEFAULT 0,
  player2_rank_points_change INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bot_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  match_id VARCHAR(100) NOT NULL,
  bot_name VARCHAR(100) NOT NULL,
  bot_faction ENUM('pirate', 'marine') NOT NULL,
  random_mode VARCHAR(50) NOT NULL,
  player_score INT NOT NULL,
  bot_score INT NOT NULL,
  player_stage INT NOT NULL,
  bot_stage INT NOT NULL,
  player_time_seconds INT NOT NULL,
  bot_time_seconds INT NOT NULL,
  match_result ENUM('player1_win', 'player2_win', 'draw') NOT NULL,
  rank_change INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_user_id INT NOT NULL,
  receiver_user_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_user_id INT NOT NULL,
  receiver_user_id INT NOT NULL,
  room_mode ENUM('friendly', 'ranked') NOT NULL,
  room_code VARCHAR(12) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

\</details\>

#### 5\. Cập nhật Endpoint cho Frontend

1.  Tại Railway: Vào service **Backend** → **Settings** → **Public Networking** → Nhấn **Generate Domain**.
2.  Copy domain vừa tạo (ví dụ: `https://your-api.up.railway.app`).
3.  Trong source code: Mở file `frontend/js/state.js`, tìm biến `API_BASE_URL` và dán domain của bạn vào.
4.  **Commit & Push** thay đổi lên GitHub để cập nhật trang web.

#### 6\. Duy trì Server (Keep-alive)

Để backend không bị tắt sau một thời gian không sử dụng (đối với gói Free), bạn nên sử dụng [UptimeRobot](https://uptimerobot.com/) để "ping" vào URL backend với chu kỳ 5 phút một lần.

-----

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