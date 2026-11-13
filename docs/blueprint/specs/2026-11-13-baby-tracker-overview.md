# Baby Tracker — Overview

**Status:** approved 2026-11-13
**Date:** 2026-11-13

App theo dõi và chăm sóc bé sơ sinh cho một gia đình (bé hiện 2 tháng tuổi). Người dùng chính dùng iPhone 17 Pro, iPhone 16, iPhone 11.

## Units

| #   | Unit                                                       | Ship tới                                            | Trạng thái                                        |
| --- | ---------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| 1   | `web` — Next.js PWA + API route gửi push + schema Supabase | Vercel Hobby + Supabase Free                        | Thiết kế: `2026-11-13-baby-tracker-web-design.md` |
| 2   | `ios` — app SwiftUI native                                 | TestFlight/App Store (cần Apple Developer, chưa có) | Chưa thiết kế, làm sau                            |

## Phụ thuộc và thứ tự build

1. `web` build trước. Unit này **sở hữu** schema Postgres, RLS policy, Storage bucket và migration trong `supabase/migrations/`.
2. `ios` build sau, **dùng lại** cùng project Supabase qua `supabase-swift`, chịu cùng RLS. `ios` không tạo lại hay sửa schema theo hướng phá vỡ; nếu cần cột mới thì thêm migration theo kiểu chỉ-thêm (additive) trong repo `web`.

## Hợp đồng giữa các unit

- **Dữ liệu:** các bảng Postgres, RLS và các RPC `claim_membership()`, `can_create_family()`, `create_family(name, display_name)` định nghĩa trong spec `web` (mục 4 và 5). Đây là API duy nhất giữa các unit.
- **Nội dung tĩnh:** `content/*.vi.json` trong repo `web` là nguồn chuẩn. `web` phục vụ chúng tại `https://<APP_URL>/content/<tên>.vi.json`. `ios` đọc cùng các file này (copy vào bundle lúc build hoặc tải từ URL đó).
- **Thông báo:** `web` gửi Web Push. Push APNs cho `ios` do unit `ios` tự thiết kế; nó dùng lại bảng `notification_prefs` và `notification_log`.

## Global Constraints

- Ngôn ngữ giao diện và nội dung: chỉ tiếng Việt (`vi-VN`).
- Múi giờ nghiệp vụ: `Asia/Ho_Chi_Minh` (ranh giới ngày, giờ gửi nhắc tiêm 08:00).
- Lưu thời gian trong DB: `timestamptz` (UTC). Ngày không có giờ: `date`.
- Đơn vị: gram (cân nặng), cm (chiều dài, vòng đầu), °C (nhiệt độ), ml (sữa).
- Mọi khóa chính là UUID v4. Bản ghi `logs` sinh UUID ở client để gửi lại offline không bị trùng.
- Chỉ dùng gói miễn phí: Vercel Hobby, Supabase Free. Không thêm dịch vụ trả phí.
- Bí mật không bao giờ xuống client: `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
- An toàn y tế: app **không** đặt tên bệnh, **không** tính liều thuốc. Mọi màn kết quả triệu chứng có nút gọi `115` và dòng "Thông tin tham khảo, không thay thế bác sĩ."
- Nội dung y tế (lịch tiêm, triệu chứng, mốc phát triển, chuẩn đánh giá) mỗi mục phải ghi `source` (URL) và `reviewedAt` (ngày).
- Đăng nhập chỉ bằng Google (Supabase Auth). Quyền truy cập dữ liệu do danh sách Gmail trong `family_members` quyết định.
