# Device checklist

Thiết bị: iPhone 11, iPhone 16, iPhone 17 Pro. Ghi Đạt / Không đạt, phiên bản iOS và ghi chú.

**Kết luận đợt 1 (2026-11-14):** Đạt — Vitest 173 test và pgTAP 001–005 xanh; bước 0–4 và 7 (nhắc bú) đạt trên iPhone 16 (iOS 18.2) và iPhone 17 Pro (iOS 26.5). iPhone 11 đang iOS 16.3, chưa nhận được Web Push nên chỉ đạt bước 0; người dùng chấp nhận đạt trên 2/3 máy và sẽ kiểm lại iPhone 11 sau khi cập nhật lên iOS 16.4 trở lên.

## Bước 0 — Đăng nhập Google trong PWA standalone (M1)

1. Safari mở `<APP_URL>/dang-nhap` → Chia sẻ → Thêm vào MH chính → mở từ biểu tượng.
2. Bấm "Đăng nhập bằng Google", hoàn tất đăng nhập.
3. Kỳ vọng: quay lại **bên trong** app (không phải tab Safari), trang "Bạn chưa được mời" hiện đúng Gmail.
4. Vuốt tắt hẳn app, mở lại từ biểu tượng. Kỳ vọng: vẫn ở trang có Gmail, không phải trang đăng nhập.

| Máy           | iOS  | Kết quả | Ghi chú                    |
| ------------- | ---- | ------- | -------------------------- |
| iPhone 11     | 16.3 | Đạt     | Đạt cả 4 bước (2026-11-14) |
| iPhone 16     | 18.2 | Đạt     | Đạt cả 4 bước (2026-11-14) |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt cả 4 bước (2026-11-14) |

## Bước 1 — Cài PWA và chạy standalone (M13)

1. Safari mở `https://bunkid.vercel.app` → Chia sẻ → Thêm vào MH chính → mở từ biểu tượng.
2. Kỳ vọng: app mở toàn màn hình, không có thanh địa chỉ Safari; Cài đặt → "Cài Bé Yêu lên màn hình chính" ghi "Bé Yêu đã được cài và đang chạy từ màn hình chính."

| Máy           | iOS  | Kết quả | Ghi chú                                   |
| ------------- | ---- | ------- | ----------------------------------------- |
| iPhone 11     | 16.3 | Bỏ qua  | Máy đang iOS 16.3, cần 16.4 trở lên       |
| iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14)                          |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14)                          |

## Bước 2 — Nhắc bú (M11)

1. Cài đặt → Thông báo: "Máy này đang nhận thông báo.". Cài đặt → Khoảng cách cữ bú: chọn "1 giờ" → Lưu.
2. Nhật ký → "+ Thêm" → Bú bình 30 ml, Thời điểm = bây giờ trừ 59 phút → Lưu. Khóa màn hình.
3. Kỳ vọng: trong ≤ 2 phút nhận thông báo "Đến giờ bú rồi" / "Cữ trước lúc HH:mm (1 giờ … trước)." trên mọi máy đã bật thông báo; bấm vào thì mở trang chủ Bé Yêu.

| Máy           | iOS  | Kết quả | Ghi chú                                   |
| ------------- | ---- | ------- | ----------------------------------------- |
| iPhone 11     | 16.3 | Bỏ qua  | Máy đang iOS 16.3, cần 16.4 trở lên       |
| iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14)                          |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14)                          |

## Bước 3 — Hai máy thấy nhau trong 3 giây (M13)

1. Mở Bé Yêu trên hai máy cùng gia đình (hai iPhone, hoặc iPhone và máy tính).
2. Máy A bấm "Ngủ". Kỳ vọng: máy B hiện thẻ "Ngủ · … (đang chạy)" trong ≤ 3 giây.
3. Máy B bấm "Dừng". Kỳ vọng: thẻ trên máy A biến mất trong ≤ 3 giây. Xóa bản ghi ngủ thử ở Nhật ký.

| Máy           | iOS  | Kết quả | Ghi chú                                   |
| ------------- | ---- | ------- | ----------------------------------------- |
| iPhone 11     | 16.3 | Bỏ qua  | Máy đang iOS 16.3, cần 16.4 trở lên       |
| iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14)                          |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14)                          |

## Bước 4 — Ghi khi offline rồi đồng bộ (M12)

1. Mở Bé Yêu từ màn hình chính khi có mạng, rồi bật chế độ máy bay.
2. Trang chủ → "Tã" → Lưu, làm hai lần. Kỳ vọng: hai dòng tã hiện ngay trong "24 giờ qua".
3. Tắt chế độ máy bay, giữ app mở. Kỳ vọng: trong ≤ 30 giây máy thứ hai (hoặc Supabase → Table Editor → `logs`) thấy đủ hai tã, đúng giờ đã ghi lúc offline.
4. Xóa hai bản ghi tã thử ở Nhật ký.

| Máy           | iOS  | Kết quả | Ghi chú                                                                                                          |
| ------------- | ---- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| iPhone 11     | 16.3 | Bỏ qua  | Không thử ở M12                                                                                                  |
| iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14). Lần đầu máy còn chạy bản cũ: phải mở app khi có mạng, tắt hẳn rồi mở lại trước khi bật máy bay |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14). Như iPhone 16                                                                                  |

## Bước 4b — Hiển thị chờ đồng bộ và nút cần mạng (M13)

1. Bật chế độ máy bay. Trang chủ → "Tã" → Lưu. Kỳ vọng: dòng tã mới có dấu ⏳; đầu trang có chip "⏳ 1 mục chờ đồng bộ".
2. Vẫn chế độ máy bay, vào Cài đặt. Kỳ vọng: dòng "Cần kết nối mạng để thay đổi các mục dưới đây."; nút Lưu của hồ sơ bé, khoảng cách cữ bú, thêm thành viên, công tắc thông báo đều mờ, bấm không được. Phần Giao diện vẫn đổi được.
3. Tắt chế độ máy bay. Kỳ vọng: trong ≤ 30 giây chip và dấu ⏳ biến mất, các nút trong Cài đặt bấm lại được. Xóa bản ghi tã thử.

| Máy           | iOS  | Kết quả | Ghi chú                                   |
| ------------- | ---- | ------- | ----------------------------------------- |
| iPhone 11     | 16.3 | Bỏ qua  | Máy đang iOS 16.3, cần 16.4 trở lên       |
| iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14)                          |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14)                          |

## Bước 7 — Tạm tắt (M11, phần nhắc bú)

1. Cài đặt → Thông báo → "2 giờ".
2. Nhật ký → "+ Thêm" → Bú bình 30 ml, Thời điểm = bây giờ trừ 61 phút → Lưu. Kỳ vọng: 3 phút không có thông báo trên máy này.
3. Bấm "Bật lại". Kỳ vọng: trong ≤ 2 phút nhận "Đến giờ bú rồi".
4. Dọn dẹp: xóa hai bản ghi Bú bình thử; Khoảng cách cữ bú đặt lại giá trị cũ (thường "3 giờ").
5. Phần "nhắc tiêm vẫn đến khi tạm tắt" kiểm ở đợt 2.

| Máy           | iOS  | Kết quả | Ghi chú                                   |
| ------------- | ---- | ------- | ----------------------------------------- |
| iPhone 11     | 16.3 | Bỏ qua  | Máy đang iOS 16.3, cần 16.4 trở lên       |
| iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14)                          |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14)                          |

## Bước 8 — Tiêm chủng (M15)

1. Cẩm nang → Tiêm chủng. Kỳ vọng: khung lưu ý "Lịch tham khảo theo Thông tư 52/2025/TT-BYT…"; nếu chưa chọn loại vaccine (tài khoản chủ gia đình) thì có khối "Thiết lập lịch tiêm".
2. Chọn loại cho các nhóm theo sổ tiêm của bé ("Không tiêm" cho nhóm không định tiêm). Phần "Mũi đã đến hạn trước hôm nay" đã tick sẵn BCG và Viêm gan B sơ sinh; tick thêm mũi bé đã tiêm → Lưu. Kỳ vọng: các mũi đã tick nằm trong "Đã tiêm", nhóm "Quá hạn" chỉ còn mũi chưa tiêm.
3. Bấm một mũi "Sắp tới" → "Đổi ngày hẹn" → chọn ngày khác → Lưu. Kỳ vọng: dòng đó hiện "Hẹn <ngày mới>". Mở lại → "Xóa đánh dấu". Kỳ vọng: về ngày hẹn cũ.
4. Trên máy thứ hai (tài khoản thành viên khác) mở Tiêm chủng. Kỳ vọng: thấy đúng các đánh dấu ở bước 2; không có nút "Chọn loại vaccine".

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
