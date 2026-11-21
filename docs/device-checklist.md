# Device checklist

Thiết bị: iPhone 11, iPhone 16, iPhone 17 Pro. Ghi Đạt / Không đạt, phiên bản iOS và ghi chú.

**Kết luận đợt 1 (2026-11-14):** Đạt — Vitest 173 test và pgTAP 001–005 xanh; bước 0–4 và 7 (nhắc bú) đạt trên iPhone 16 (iOS 18.2) và iPhone 17 Pro (iOS 26.5). iPhone 11 đang iOS 16.3, chưa nhận được Web Push nên chỉ đạt bước 0; người dùng chấp nhận đạt trên 2/3 máy và sẽ kiểm lại iPhone 11 sau khi cập nhật lên iOS 16.4 trở lên.

**Kết luận đợt 2 (2026-11-14):** Chờ người dùng. Phần tự động đạt: Vitest 265 test và pgTAP 001–008 xanh. Tiêu chí §11 còn chờ trên điện thoại thật: nhận push nhắc tiêm (bước 9, mục 5) trên ít nhất 1 máy, bước 7 đầy đủ (nhắc thức bị tạm tắt chặn — bước 11 mục 5; nhắc tiêm vẫn đến — bước 9 mục 4–5), và các bước 8–14.

**Kết luận đợt 3 (2026-11-14):** Chờ người dùng. Phần tự động đạt: Vitest 313 test và pgTAP 001–011 xanh. Tiêu chí §11 còn chờ trên điện thoại thật: checklist bước 5 (nhạc mở app YouTube, kể cả khi gỡ app) và bước 6 (tiếng ồn trắng khi khóa màn hình), cùng các bước 15–19.

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

## Bước 5 — Nhạc mở app YouTube (M23)

1. Tiện ích → Nhạc → tab "Thư giãn / ru ngủ" → bấm "▶ Hát ru Việt Nam". Kỳ vọng: app YouTube mở trang kết quả tìm kiếm "hát ru con ngủ dân ca Việt Nam".
2. Quay lại Bé Yêu → tab "Phát triển trí não". Kỳ vọng: dòng "Chỉ cho bé nghe, không cho bé xem màn hình. WHO khuyến nghị trẻ dưới 2 tuổi không xem màn hình."
3. Dán một link YouTube (ví dụ copy từ nút Chia sẻ của app YouTube) → "Thêm vào …". Bấm mục vừa thêm. Kỳ vọng: app YouTube mở đúng video. Dán chữ "abc". Kỳ vọng: "Link YouTube không hợp lệ." ngay dưới ô.
4. Bấm "Ẩn" ở một mục có sẵn. Kỳ vọng: mục biến mất, có nút "Hiện các mục đã ẩn (1)"; máy thứ hai cũng không thấy mục đó.
5. Gỡ app YouTube (hoặc dùng máy không cài) → bấm một mục. Kỳ vọng: sau khoảng 1,5 giây trang web YouTube mở trong Bé Yêu; link "Mở trên web" cũng mở được.
6. Máy dùng YouTube cài ngoài App Store (iPhone báo "address is invalid" khi bấm): chọn "Mở YouTube bằng" → "Trình duyệt", bấm lại một mục. Kỳ vọng: trang YouTube mở trong trình duyệt; lựa chọn còn nguyên sau khi đóng mở lại app; nút "Xem video" ở Bồng bế cũng mở theo cách này.
7. Dọn dẹp: "Hiện lại" mục đã ẩn; xóa link thử.

| Máy           | iOS | Kết quả | Ghi chú (có / không cài app YouTube) |
| ------------- | --- | ------- | ------------------------------------ |
| iPhone 11     |     |         |                                      |
| iPhone 16     |     |         |                                      |
| iPhone 17 Pro |     |         |                                      |

## Bước 6 — Tiếng ồn trắng khi khóa màn hình (M22)

1. Tiện ích → Ồn trắng → chọn "Trắng", âm lượng vừa, "Hẹn giờ tắt" = "Không" → "Phát". Kỳ vọng: nghe tiếng xì đều, không có tiếng "tách" lặp lại mỗi 2 giây.
2. Gạt công tắc im lặng của iPhone. Kỳ vọng: vẫn nghe.
3. Khóa màn hình, chờ 5 phút. Ghi lại: âm còn chạy hết 5 phút / dừng sau khoảng bao lâu.
4. Mở lại, chọn "Nâu" rồi "Hồng" khi đang phát. Kỳ vọng: âm đổi ngay. Chọn "15 phút". Kỳ vọng: dòng "Tắt sau 15:00" đếm lùi.
5. Khóa màn hình và để yên khoảng 16 phút. Kỳ vọng (nếu âm còn chạy khi khóa màn hình): khoảng phút thứ 15 âm nhỏ dần trong 10 giây rồi tự tắt.

Nếu iOS dừng âm khi khóa màn hình (spec §10.3 bước 6), ghi giới hạn đó vào README; không chặn phát hành.

| Máy           | iOS | Kết quả | Ghi chú (chạy bao lâu khi khóa màn hình) |
| ------------- | --- | ------- | ---------------------------------------- |
| iPhone 11     |     |         |                                          |
| iPhone 16     |     |         |                                          |
| iPhone 17 Pro |     |         |                                          |

## Bước 7 — Tạm tắt (M11, phần nhắc bú)

Nhắc thức cũng bị tạm tắt chặn: kiểm ở bước 11, mục 5.

1. Cài đặt → Thông báo → "2 giờ".
2. Nhật ký → "+ Thêm" → Bú bình 30 ml, Thời điểm = bây giờ trừ 61 phút → Lưu. Kỳ vọng: 3 phút không có thông báo trên máy này.
3. Bấm "Bật lại". Kỳ vọng: trong ≤ 2 phút nhận "Đến giờ bú rồi".
4. Dọn dẹp: xóa hai bản ghi Bú bình thử; Khoảng cách cữ bú đặt lại giá trị cũ (thường "3 giờ").
5. Nhắc tiêm vẫn đến khi tạm tắt: kiểm ở bước 9, mục 4.

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

## Bước 9 — Tiêm chủng khi offline và nhắc lịch tiêm (M16)

1. Bật chế độ máy bay. Tiêm chủng → bấm một mũi "Sắp tới" → Đã tiêm → Lưu. Kỳ vọng: mũi chuyển sang "Đã tiêm" ngay, có dấu ⏳; đầu trang có chip "⏳ 1 mục chờ đồng bộ".
2. Tắt chế độ máy bay, giữ app mở. Kỳ vọng: trong ≤ 30 giây ⏳ và chip biến mất; máy thứ hai mở Tiêm chủng thấy mũi đó "Đã tiêm". Mở lại mũi → "Xóa đánh dấu".
3. Cài đặt → Thông báo: công tắc "Nhắc lịch tiêm" đang bật, không còn dòng "Có từ đợt 2". Tiêm chủng → bấm một mũi chưa tiêm **không** có nhãn "Chưa chọn loại" → Đổi ngày hẹn → **ngày kia** (hôm nay + 2) → Lưu.
4. Sáng hôm sau, khoảng 07:50, Cài đặt → Thông báo → "Tạm tắt 2 giờ".
5. Kỳ vọng: trong khoảng 08:00–08:59 mọi máy đã bật thông báo nhận "Sắp tới lịch tiêm" / "<tên mũi> vào <Thứ, dd/MM>." dù đang tạm tắt; bấm vào thì mở trang Tiêm chủng.
6. Dọn dẹp: "Bật lại" thông báo; mở lại mũi ở bước 3 → "Xóa đánh dấu".

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 10 — Khẩn cấp (M17)

1. Tiện ích → Khẩn cấp. Kỳ vọng: nút đỏ "Cấp cứu 115" ở đầu; thẻ "Hồ sơ của bé" có tên, tuổi, nhóm máu, dị ứng, cân nặng (lúc sinh nếu chưa có lần đo).
2. "Thêm số bác sĩ, người thân" → thêm hai số (ví dụ bác sĩ nhi và ông bà) → Lưu từng số. Bấm ↑ ở số thứ hai. Kỳ vọng: thứ tự đổi; máy thứ hai thấy cùng thứ tự sau khi mở lại trang.
3. Bấm một số trong danh sách. Kỳ vọng: iPhone hỏi gọi đúng số đó (bấm Hủy).
4. Chủ gia đình: "Sửa nhóm máu, dị ứng" → chọn nhóm máu, ghi dị ứng → Lưu. Kỳ vọng: thẻ hồ sơ hiện giá trị mới.
5. Bật chế độ máy bay, đóng hẳn app rồi mở lại → Tiện ích → Khẩn cấp. Kỳ vọng: vẫn thấy nút 115, danh bạ và hồ sơ; nút Lưu trong phần sửa bị mờ kèm "Cần kết nối mạng".

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 11 — Nhắc khi bé thức quá lâu (M17)

1. Cài đặt → Thông báo: công tắc "Nhắc khi bé thức quá lâu" đang bật, không còn dòng "Có từ đợt 2".
2. Tra ngưỡng theo tuổi bé hôm nay: 0–27 ngày 60 phút; 28–90 ngày 90 phút; 91–150 ngày 120 phút; 151–240 ngày 180 phút; 241–365 ngày 210 phút; trên 365 ngày 240 phút. Gọi ngưỡng là W.
3. Nhật ký → "+ Thêm" → Ngủ, kết thúc lúc bây giờ trừ (W − 1) phút → Lưu. Đảm bảo không có giấc ngủ nào đang chạy và không có giấc ngủ thật nào kết thúc muộn hơn giấc thử. Khóa màn hình.
4. Kỳ vọng: trong ≤ 3 phút nhận "Bé thức đã W phút" (có thể là W + 1 hoặc W + 2 tùy lúc cron chạy) / "Bé có thể đang mệt, thử cho bé ngủ." trên mọi máy đã bật thông báo; bấm vào mở trang chủ.
5. Lặp lại bước 3 với một giấc ngủ khác sau khi bấm Cài đặt → Thông báo → "2 giờ". Kỳ vọng: không có nhắc thức trong 5 phút. Bấm "Bật lại". Kỳ vọng: nhắc đến trong ≤ 2 phút.
6. Dọn dẹp: xóa các giấc ngủ thử.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 12 — Tăng trưởng (M19)

1. Tiện ích → Tăng trưởng → "+ Thêm lần đo": ngày đo, cân nặng (ví dụ "5,2"), chiều dài, vòng đầu theo sổ khám gần nhất → Lưu. Kỳ vọng: lần đo hiện ngay trong "Các lần đo"; biểu đồ Cân nặng có chấm của bé giữa các đường P3–P97 của đúng giới tính; dòng đo có nhãn "z … · P…".
2. Bấm "Chiều dài" rồi "Vòng đầu". Kỳ vọng: biểu đồ và nhãn z đổi theo chỉ số.
3. Bật chế độ máy bay, thêm một lần đo thử. Kỳ vọng: hiện ngay, có ⏳ và chip "⏳ 1 mục chờ đồng bộ". Tắt máy bay. Kỳ vọng: trong ≤ 30 giây ⏳ biến mất; máy thứ hai mở Tăng trưởng thấy lần đo đó.
4. Tiện ích → Khẩn cấp. Kỳ vọng: "Cân nặng gần nhất" là cân nặng của lần đo mới nhất.
5. Bấm lần đo thử → "Xóa lần đo" → xác nhận. Kỳ vọng: dòng biến mất.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 13 — Phân loại triệu chứng (M20)

1. Cẩm nang → Triệu chứng. Kỳ vọng: tuổi của bé; ô nhiệt độ (tự điền kèm "Lấy từ nhật ký trong 6 giờ qua." nếu vừa đo); sáu nhóm Sốt, Hô hấp, Tiêu hóa, Da, Hành vi, ăn bú, Khác; nút "Gọi cấp cứu 115".
2. Xóa ô nhiệt độ, không đánh dấu gì → "Xem kết quả". Kỳ vọng: 🟢 "Theo dõi tại nhà", mục "Chăm bé tại nhà", dòng "Đi khám ngay nếu xuất hiện: …", nút 115, danh bạ khẩn cấp, dòng "Thông tin tham khảo, không thay thế bác sĩ.".
3. "Làm lại" → xóa ô nhiệt độ nếu đã tự điền → đánh dấu "Bé sốt kèm phát ban" → Xem kết quả. Kỳ vọng: 🟡 "Cho bé đi khám trong 24 giờ".
4. "Làm lại" → xóa ô nhiệt độ nếu đã tự điền → đánh dấu "Bé sốt kèm phát ban" và "Bé co giật" → Xem kết quả. Kỳ vọng: 🔴 "Đi cấp cứu ngay", dòng "Bé co giật" đứng trước dòng phát ban.
5. "Làm lại" → nhập nhiệt độ 38 (bé dưới 3 tháng) hoặc 40 (mọi tuổi) → Xem kết quả. Kỳ vọng: 🔴.
6. Không có kết quả nào hiện tên bệnh.
7. Trang chủ: khi có banner đỏ (ví dụ ghi nhiệt độ 40°C rồi xóa sau khi xem), banner có nút "Gọi 115" và nút "Phân loại triệu chứng" mở đúng trang.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 14 — Bệnh thường gặp (M21)

1. Cẩm nang → Bệnh thường gặp. Kỳ vọng: 10 mục (Cảm lạnh, Sổ mũi nghẹt mũi, Nôn trớ, Táo bón, Hăm tã, Chàm sữa, Nấm miệng, Vàng da sinh lý, Viêm tiểu phế quản, Tiêu chảy), nút "Phân loại triệu chứng" và "Gọi 115" ở đầu.
2. Mở một mục. Kỳ vọng: Dấu hiệu, Chăm bé tại nhà, Nên cho bé đi khám, khung đỏ "Khi nào đi khám ngay", thời gian thường kéo dài, nguồn NHS.
3. Bật chế độ máy bay, đóng hẳn app rồi mở lại → Cẩm nang → Bệnh thường gặp. Kỳ vọng: vẫn đọc được.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 15 — Hút sữa và tummy time (M22)

1. Trang chủ: dưới hàng nút chính có hàng "Hút sữa · Tummy time". Bấm "Hút sữa". Kỳ vọng: nút đổi thành "Dừng hút sữa", thẻ "Đang chạy" hiện Hút sữa.
2. Bấm "Dừng hút sữa". Kỳ vọng: hiện "Đã hút được bao nhiêu?" với ô trái, phải (ml). Nhập 60 và 45 → Lưu. Nhật ký có dòng "Hút sữa · … · 105 ml".
3. Lần nữa: bắt đầu rồi bấm "Dừng" ở thẻ "Đang chạy" → "Bỏ qua". Kỳ vọng: bản ghi kết thúc, không có ml.
4. Bấm "Tummy time", chờ 1–2 phút, bấm lại để dừng.
5. Tiện ích → Thống kê → tab "Hút sữa": hôm nay 105 ml; tab "Tummy": hôm nay có số phút vừa ghi.
6. Dọn dẹp: xóa các bản ghi thử trong Nhật ký.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 16 — Bồng bế (M23)

1. Cẩm nang → Bồng bế. Kỳ vọng: tab đúng nhóm tuổi của bé đang được chọn (0–3 tháng, 3–6 tháng hoặc Trên 6 tháng); mỗi tư thế có các bước, khung "Lưu ý an toàn", nút "Xem video", link "Nguồn".
2. Bấm "Xem video" ở một tư thế. Kỳ vọng: app YouTube mở trang tìm kiếm tư thế đó.
3. Bật chế độ máy bay, đóng hẳn app rồi mở lại → Cẩm nang → Bồng bế. Kỳ vọng: vẫn đọc được.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 17 — Ảnh (M24)

1. Tiện ích → Ảnh. Kỳ vọng: thanh dung lượng "Đã dùng … MB / 1 GB".
2. "Chọn ảnh" → chọn một ảnh chụp bằng camera iPhone từ vài ngày trước. Kỳ vọng: "Ngày chụp" tự điền đúng ngày chụp (đọc từ thông tin ảnh; ảnh không có thông tin này thì là hôm nay, sửa được); thêm ghi chú → "Tải ảnh lên". Kỳ vọng: "Đã tải ảnh lên."; ảnh hiện trong nhóm "N tháng tuổi", không bị xoay ngang.
3. Bấm ảnh. Kỳ vọng: xem ảnh lớn, ngày, ghi chú. Máy thứ hai mở Ảnh cũng thấy ảnh này.
4. Tải ảnh về máy tính từ Supabase → Storage → photos và xem thông tin ảnh. Kỳ vọng: cạnh dài tối đa 1600 px, không còn vị trí GPS hay thông tin máy chụp.
5. Bật chế độ máy bay → Ảnh. Kỳ vọng: form tải lên mờ kèm "Cần kết nối mạng".
6. Tắt máy bay, mở ảnh thử → "Xóa ảnh" → xác nhận. Kỳ vọng: ảnh biến mất; tài khoản thành viên khác không thấy nút xóa ảnh của chủ gia đình.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 18 — Mốc phát triển (M25)

1. Cẩm nang → Phát triển. Kỳ vọng: phần "Mốc vận động lớn" (Lật, Ngồi không cần đỡ, … Tự đi) có nhãn khoảng tuổi; tiếp theo là mốc của tháng hiện tại và tháng kế tiếp, chia 4 lĩnh vực, mỗi tháng có khung "Khi nào nên hỏi bác sĩ" và link "Nguồn: CDC".
2. Bấm một mốc bé đã làm được → chọn ngày, ghi chú, chọn một ảnh (nếu đã có ảnh ở Tiện ích → Ảnh) → Lưu. Kỳ vọng: mốc có dấu ✓ và dòng "Đạt ngày … · có ảnh"; máy thứ hai thấy giống vậy.
3. Bật chế độ máy bay, đánh dấu thêm một mốc. Kỳ vọng: hiện ngay với ⏳ và chip chờ đồng bộ. Tắt máy bay. Kỳ vọng: ⏳ biến mất trong ≤ 30 giây.
4. "Xem tất cả các mốc" hiện đủ các tháng 2 đến 24. Mở lại mốc thử → "Bỏ đánh dấu".

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 19 — Báo cáo cho bác sĩ (M26)

1. Tiện ích → Báo cáo → "7 ngày". Kỳ vọng: tên, tuổi, ngày sinh, giới tính (nhóm máu, dị ứng nếu đã ghi); bảng 7 ngày (giờ ngủ, cữ bú, ml bình, tã ướt / bẩn); nhiệt độ; thuốc đã dùng; lần đo tăng trưởng gần nhất kèm phân vị; mũi tiêm gần nhất và mũi sắp tới. Đổi sang "14 ngày" thì bảng có 14 dòng.
2. Bấm "In / Lưu PDF" → Chia sẻ → Lưu vào Tệp (hoặc In). Kỳ vọng: khổ A4 dọc, chữ đen nền trắng kể cả khi đang dùng giao diện Tối hoặc Ban đêm; không có thanh tab, nút chọn ngày hay nút In trong bản in.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 20 — Kim Bun: tên và icon (UI đợt 1)

1. Trên iPhone đã cài app cũ: xóa biểu tượng cũ khỏi màn hình chính, mở `bunkid.vercel.app` bằng Safari, Chia sẻ → Thêm vào MH chính. Kỳ vọng: tên gợi ý "Kim Bun", biểu tượng bánh bao trên nền đào–hồng; tab Safari hiện favicon bánh bao.
2. Gửi một thông báo thử (nhắc bú). Kỳ vọng: thông báo có biểu tượng bánh bao.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 21 — Ban đêm theo lịch (UI đợt 1)

1. Cài đặt → Giao diện: bật "Ban đêm theo lịch", chọn "Bắt đầu" là mốc :00 hoặc :30 sắp tới gần nhất và "Kết thúc" là mốc sau đó 1 tiếng, để app mở. Kỳ vọng: tới giờ bắt đầu, trong ≤ 1 phút app tự chuyển sang tông hổ phách, thanh trạng thái tối; tới giờ kết thúc tự về giao diện ban ngày.
2. Tắt "Ban đêm theo lịch". Kỳ vọng: giao diện theo lựa chọn Sáng / Tối / Tự động.
3. Đặt lại 21:00–06:00 và bật lại.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 22 — Tab bar mới và Khám phá (UI đợt 2)

1. Mở app trên iPhone. Kỳ vọng: tab bar kính nổi 3 tab Hôm nay · Nhật ký · Khám phá, icon nét, không emoji; không che nội dung cuối trang; không đè lên thanh home của iPhone.
2. Khám phá: thẻ Khẩn cấp đỏ, Theo dõi, Cẩm nang, Dỗ bé và kỷ niệm, Báo cáo; mỗi mục mở đúng trang; cuộn xuống thì thanh tiêu đề nhỏ hiện trên cùng, không đè lên giờ/pin.
3. Mở link cũ `…/cam-nang` và `…/tien-ich`. Kỳ vọng: tự sang Khám phá.
4. Bật Ban đêm: tab bar và icon tông hổ phách, không còn màu xanh/trắng.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 23 — Nút "+" và bảng 9 hành động (UI đợt 2)

1. Ở mỗi tab (Hôm nay, Nhật ký, Khám phá) bấm nút "+". Kỳ vọng: bảng "Ghi lại cho <tên bé>" nổi trên tab bar, 9 ô, 5 ô có đồng hồ; nút "+" thành "×".
2. Chọn "Bú trái". Kỳ vọng: bảng đóng, timer bú trái chạy (thấy ở Trang chủ). Mở lại "+": ô Bú trái có viền và chữ "Dừng bú trái"; bấm để dừng.
3. Chọn "Hút sữa", đợi vài giây, mở "+" chọn lại để dừng. Kỳ vọng: hiện sheet nhập số ml như khi dừng ở Trang chủ.
4. Chọn "Thay tã" từ tab Nhật ký. Kỳ vọng: sheet Thay tã mở, nút Lưu không bị tab bar che; lưu xong bản ghi hiện ở Nhật ký.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 24 — Header Trang chủ và nút trăng (UI đợt 2)

1. Mở Trang chủ. Kỳ vọng: trên cùng là avatar tròn chữ cái đầu tên bé (nền đào–hồng), tên bé và tuổi; bên phải nút trăng và nút điện thoại đỏ. Không còn dòng "Xin chào …".
2. Bấm avatar hoặc tên bé. Kỳ vọng: mở Cài đặt. Bấm nút điện thoại. Kỳ vọng: mở Khẩn cấp.
3. Ban ngày, bấm nút trăng. Kỳ vọng: app chuyển ngay sang tông hổ phách, trăng tô đặc. Bấm lại: về giao diện ban ngày.
4. Sau 21:00 (lịch đang bật), bấm nút trăng. Kỳ vọng: tắt Ban đêm đến 06:00 sáng; đóng mở lại app vẫn giữ.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 25 — Cài đặt kiểu iOS (UI đợt 2)

1. Bấm avatar ở Trang chủ. Kỳ vọng: trang Cài đặt có nút "‹ Hôm nay", tiêu đề lớn, thẻ hồ sơ bé (tên, giới tính, ngày sinh, cân nặng lúc sinh), rồi các nhóm GIA ĐÌNH, THÔNG BÁO, GIAO DIỆN, ỨNG DỤNG, TÀI KHOẢN. Không hiện email.
2. Bấm thẻ hồ sơ, Thành viên, Khoảng cách cữ bú (chủ nhà). Kỳ vọng: mỗi trang con có nút "‹ Cài đặt" và nội dung như trước. Tài khoản thành viên thường: thẻ hồ sơ và hàng Cữ bú không có "›", không mở được. Trang con đang hiện tiêu đề hai lần (tiêu đề lớn và tiêu đề cũ của form): đã biết, Đợt 5 làm lại.
3. Thông báo: gạt một công tắc nhắc; đóng mở lại app vẫn giữ. Bấm "Tạm tắt nhắc" → chọn 2 giờ. Kỳ vọng: hàng hiện "Đến HH:mm"; mở lại sheet có "Bật lại ngay".
4. Giao diện: đổi Sáng / Tối / Tự động; tắt bật "Ban đêm theo lịch"; đổi "Giờ ban đêm" trong sheet. Kỳ vọng: app đổi theme ngay, giá trị hàng Giờ ban đêm cập nhật.
5. Bật "Giảm độ trong suốt" (Cài đặt iOS → Trợ năng → Màn hình & cỡ chữ). Kỳ vọng: các khối kính thành nền đặc, chữ vẫn rõ ở cả 3 theme.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 26 — Trang chủ mới và Hoàn tác (UI đợt 3)

1. Thẻ chính, đủ 4 trạng thái:
   - Bấm "Ngủ". Kỳ vọng: vòng màu tím chạy, đồng hồ "0:05"… tăng từng giây, dòng "<tên> · từ HH:mm", một nút "Dừng" rộng.
   - Bấm "Bú trái". Kỳ vọng: thẻ chính đổi sang bú trái (timer mới nhất), giấc ngủ xuống hàng kính bên dưới có nút "Dừng".
   - Bấm "Đổi bên". Kỳ vọng: thành bú phải, không hiện Toast.
   - Dừng hết. Kỳ vọng: thẻ chính là "Cữ bú tiếp theo" (giờ to, "còn …").
   - Chờ quá giờ dự kiến (hoặc đổi cữ bú ngắn trong Cài đặt). Kỳ vọng: "Trễ cữ bú" viền vàng.
   - Khi không có cữ bú nào trong 12 giờ: "Chưa có cữ bú nào gần đây".
2. Bấm "Dừng" một timer. Kỳ vọng: Toast "Đã ghi … lúc HH:mm" có nút "Hoàn tác" hiện 5 giây phía trên tab bar. Bấm "Hoàn tác". Kỳ vọng: timer chạy tiếp từ giờ cũ.
3. Ghi nhanh "Thay tã" → Lưu. Kỳ vọng: Toast "Đã ghi Tã … lúc HH:mm". Bấm "Hoàn tác". Kỳ vọng: bản ghi biến mất khỏi "Gần đây". Làm lại khi tắt mạng: vẫn hoàn tác được, "N mục chờ đồng bộ" về 0 sau khi có mạng.
4. Bắt đầu một timer. Kỳ vọng: không có Toast.
5. Dừng "Hút sữa" (tài khoản có quyền sửa). Kỳ vọng: sheet hỏi ml mở ra trước; Toast chỉ hiện sau khi đóng sheet. Nếu bấm Hoàn tác lúc này, số ml vừa nhập bị bỏ (lần dừng sau sẽ hỏi lại).
6. Tài khoản thành viên thường dừng timer do người khác bắt đầu. Kỳ vọng: Toast "Đã ghi …" không có nút Hoàn tác.
7. Dừng "Bú trái", bấm "Bú trái" lại ngay, rồi bấm "Hoàn tác" trên Toast cũ. Kỳ vọng: "Không hoàn tác được: đang có timer cùng loại chạy"; chỉ một timer bú trái chạy.
8. Android (nếu có): bấm nút bấm giờ thấy rung nhẹ. iPhone: không rung, không lỗi.
9. "24 giờ qua": 3 ô luôn có số; nhãn "Bình thường" / "Cần chú ý" / "Báo bác sĩ" chỉ khi đã đủ 24 giờ dữ liệu. "Gần đây" tối đa 6 hàng, "Tất cả" mở Nhật ký.
10. Lặp lại mục 1–2 ở theme Sáng, Tối, Ban đêm: chữ rõ, vòng đúng màu (Ban đêm: tông hổ phách).

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 27 — 4 sheet ghi nhanh (UI đợt 4)

1. Mở "Thay tã" từ Trang chủ và từ nút "+". Kỳ vọng: sheet kính trượt lên, đầu sheet có chip icon màu, tiêu đề, nút đóng tròn; đáy có nút "Lưu" to rộng hết.
2. Thay tã: chọn "Bẩn" → hiện 7 ô màu phân (ô Đen và Bạc màu có viền); chọn "Cả hai" giữ màu đã chọn; chọn "Ướt" thì ẩn màu phân. Lưu → Toast "Đã ghi Tã …".
3. Bú bình: bấm +10 ba lần → 30; −10 không xuống dưới 0; chip ml gần đây điền số; chọn Sữa mẹ / Sữa công thức. Lưu.
4. Thuốc: chip tên thuốc gần đây điền tên; bàn phím số khi gõ lượng; chọn đơn vị; bật "Thuốc hạ sốt" khi vừa cho uống hạ sốt dưới 4 giờ → thẻ cảnh báo vàng. Nút "Ghi Vitamin D hôm nay" mở sheet Thuốc điền sẵn Vitamin D 1 giọt.
5. Nhiệt độ: ô rỗng, bấm +0,1 → 37,1; chọn chỗ đo. Gõ 45 rồi Lưu → báo "Nhập nhiệt độ từ 34 đến 43°C" ngay trên nút Lưu, sheet không đóng.
6. "Lúc nào?": chọn "15 phút trước" rồi Lưu → bản ghi trong "Gần đây" lùi 15 phút. Chọn "Chọn giờ…" → hiện ô chọn ngày giờ.
7. Trên iPhone 11: bấm vào ô nhập, bàn phím hiện mà vẫn cuộn tới được nút Lưu.
8. Kéo tay nắm xuống: sheet đóng. Đang nhập dở mà đóng: hỏi "Bỏ thay đổi?" với "Bỏ" và "Tiếp tục nhập".
9. Lặp lại ở theme Sáng, Tối, Ban đêm: chữ và ô màu đọc rõ.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 28 — Các sheet còn lại (UI đợt 4)

1. Nhật ký → bấm một bản ghi của mình. Kỳ vọng:
   - sheet kính "Bản ghi" có chip icon màu loại, công tắc thay cho ô tick, ô chọn Trái/Phải hoặc chỗ đo dạng nút liền;
   - nút "Lưu" to và "Xóa bản ghi" chữ đỏ (bấm Xóa vẫn hỏi lại).

   Bản ghi của người khác (tài khoản thành viên): chỉ xem, không có nút.

2. Nhật ký → "+ Thêm". Đổi "Loại". Kỳ vọng: chip và các ô đổi theo; Lưu tạo bản ghi đúng giờ đã chọn.
3. Dừng "Hút sữa". Kỳ vọng:
   - sheet "Đã hút được bao nhiêu?" có chip cốc, 2 ô ml, "Lưu" và "Bỏ qua";
   - Lưu ghi ml vào bản ghi;
   - Toast "Đã ghi …" hiện sau khi sheet đóng.
4. Tăng trưởng → thêm lần đo. Kỳ vọng: bàn phím số khi gõ cân nặng; nhập sai thì báo đỏ ngay dưới ô; "Xóa lần đo" hỏi lại.
5. Tiêm chủng → bấm một mũi. Kỳ vọng:
   - ba nút liền "Đã tiêm / Bỏ qua / Đổi ngày hẹn";
   - đổi lựa chọn thì ô ngày đổi theo, ô "Nơi tiêm" chỉ hiện khi Đã tiêm;
   - bấm lại lựa chọn đang chọn thì ngày không đổi;
   - "Xóa đánh dấu" chỉ có khi mũi đã được đánh dấu.
6. Phát triển → bấm một mốc. Kỳ vọng: ngày đạt, ghi chú, lưới ảnh (nếu có ảnh) với ô "Không"; ảnh được chọn có vòng viền; "Bỏ đánh dấu" cho mốc đã đánh dấu.
7. Với mọi sheet trên:
   - kéo tay nắm xuống thì đóng;
   - đang nhập dở mà đóng thì hỏi "Bỏ thay đổi?";
   - trên iPhone 11 khi bàn phím bật vẫn cuộn tới nút Lưu;
   - ở 3 theme chữ đều rõ.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 29 — Các màn còn lại, dòng đồng bộ và bản in (UI đợt 5)

1. Mở lần lượt mọi màn trong Khám phá, Nhật ký, Thống kê, Cài đặt và 3 trang con, Cài app, Đăng nhập (sau khi đăng xuất), Offline (bật chế độ máy bay rồi mở một trang chưa từng mở). Kỳ vọng:
   - không còn khung viền đen hoặc trắng kiểu cũ, mọi khối là thẻ kính;
   - không có emoji làm icon;
   - nhãn nút gạt ("Hậu môn", "Đổi ngày hẹn", "30 phút", "Tự động") nằm trên một dòng;
   - ô chọn ảnh là nút "Chọn ảnh" tiếng Việt;
   - thanh dung lượng ảnh nhìn thấy rõ ở cả 3 theme.
2. Tắt mạng, ghi một lần "Thay tã" (tài khoản thật, sau đó Hoàn tác hoặc xóa). Kỳ vọng: viên "1 mục chờ đồng bộ" nằm ngay dưới header Trang chủ; mở Nhật ký thấy viên này dưới tiêu đề "Nhật ký". Bật mạng lại: viên biến mất.
3. Mở app khi mạng chậm (Cài đặt nhà phát triển → Network Link Conditioner "3G", nếu có). Kỳ vọng: Trang chủ hiện các khối xám nhấp nháy theo hình thẻ chính, 3 ô số, 4 hàng rồi mới hiện dữ liệu.
4. In `/bao-cao` (Chia sẻ → In, hoặc lưu PDF). Kỳ vọng: khổ A4, chữ đen trên nền trắng, không có vệt màu nền, không có tab bar, nút "+" hay viên đồng bộ.
5. Lặp lại mục 1 ở theme Sáng, Tối, Ban đêm: chữ đọc rõ.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 30 — Nền sáng dịu mắt, chip thuốc, popup giữa màn hình

1. Cập nhật app (đóng hẳn rồi mở lại). Kỳ vọng: nền Hồng dịu `#E9DBDB`, không có khối trắng tinh, không chớp trắng lúc mở.
2. Cài đặt › Giao diện › Nền sáng: bấm lần lượt Trắng, Đào mơ, Oải hương, Biển sương, rồi về lại Hồng dịu. Kỳ vọng: nền đổi ngay mỗi lần bấm, chữ đọc rõ; 21:00 Ban đêm vẫn tự bật.
3. "+" → "Thuốc", bấm DHA. Kỳ vọng: tên điền "DHA". Nếu đã từng ghi DHA thì lượng và đơn vị đúng như lần trước. Các nút đơn vị ml · mg · giọt · viên · gói · ống nằm trên một dòng.
4. Đang gõ tên thuốc (bàn phím đang mở) thì bấm X. Kỳ vọng: bàn phím tắt, hộp "Bỏ thay đổi?" hiện rõ giữa màn hình. Bấm "Tiếp tục nhập" thì chữ còn nguyên; bấm X lần nữa rồi "Bỏ thay đổi" thì sheet đóng.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 31 — Bốn loại bản ghi mới (spec 2026-11-17 §3)

1. "+" → nhóm "Khác" → ghi lần lượt Ăn dặm (gõ tên món, chọn Lượng, bật "Món mới"), Uống nước (bấm +10 vài lần), Tắm, Ghi chú (gõ một câu dài hơn 60 ký tự). Kỳ vọng: mỗi lần Lưu có toast Hoàn tác; toast của ghi chú dài bị cắt và kết thúc bằng "…".
2. Mở Nhật ký. Kỳ vọng: bốn bản ghi hiện đủ với icon riêng; chip "Ăn dặm" lọc ra Ăn dặm và Uống nước; chip "Khác" lọc ra Tắm, Ghi chú, Hút sữa, Nằm sấp. Máy thứ hai cũng thấy.
3. Bấm bản ghi Ghi chú. Kỳ vọng: sheet chỉ có "Nội dung" và "Thời điểm". Sửa chữ, Lưu. Bấm bản ghi Ăn dặm: có Món, Lượng, Món mới, Phản ứng.
4. Thống kê → tab "Ăn dặm". Kỳ vọng: cột số bữa cho hôm nay, bảng có "Bữa ăn dặm" và "Nước (ml)".
5. Dọn dẹp: xóa bốn bản ghi thử.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 32 — Nhắc thuốc (spec 2026-11-17 §4.2, §4.3)

1. Cài đặt → Thông báo → "Lịch nhắc thuốc". Kỳ vọng: có sẵn Vitamin D, DHA, Men tiêu hoá, đang tắt.
2. Bật Vitamin D rồi đổi giờ nhắc thành giờ hiện tại cộng 2 phút. Không ghi Vitamin D. Khóa màn hình. Kỳ vọng: trong ≤ 3 phút nhận "Đến giờ uống Vitamin D" / "Hôm nay chưa ghi Vitamin D."
3. Ghi một liều Vitamin D ("+" → Thuốc → chip Vitamin D → Lưu). Đổi giờ nhắc thành giờ hiện tại cộng 2 phút lần nữa. Kỳ vọng: không có thông báo, vì hôm nay đã ghi.
4. "Tên thuốc khác": gõ "Canxi" → Thêm. Kỳ vọng: dòng Canxi hiện ra, đang bật, giờ 09:00, có nút "Xóa". Gõ "men tiêu hóa" → Thêm. Kỳ vọng: "Thuốc này đã có trong danh sách".
5. Ghi một liều thuốc có bật "Hạ sốt", Thời điểm = bây giờ trừ 3 giờ 58 phút. Kỳ vọng: trong ≤ 4 phút nhận "Đã đủ 4 giờ từ liều hạ sốt" / "Liều trước lúc HH:mm. Đo lại nhiệt độ cho bé."
6. Dọn dẹp: xóa dòng Canxi, tắt Vitamin D nếu không dùng, xóa hai bản ghi thuốc thử.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 33 — Giờ yên lặng và "bé đang ngủ" (spec 2026-11-17 §4.3, §4.4)

1. Cài đặt → Thông báo → "Giờ yên lặng": bật, đặt Từ = giờ hiện tại trừ 5 phút, Đến = giờ hiện tại cộng 10 phút → Lưu. Kỳ vọng: hàng hiện hai giờ vừa đặt. Đặt Từ bằng Đến rồi Lưu: "Giờ bắt đầu và kết thúc phải khác nhau".
2. Tạo điều kiện nhắc bú như bước 2 (Khoảng cách cữ bú 1 giờ; ghi Bú bình lúc bây giờ trừ 59 phút). Kỳ vọng: 3 phút không có thông báo trên máy này; máy của người không bật giờ yên lặng vẫn nhận.
3. Chờ qua giờ "Đến". Kỳ vọng: trong ≤ 2 phút nhận "Đến giờ bú rồi".
4. Tắt giờ yên lặng. Bật "Không nhắc bú khi bé đang ngủ" (đọc dòng ghi chú bên dưới). Bấm "Ngủ" ở trang chủ, rồi ghi Bú bình lúc bây giờ trừ 61 phút. Kỳ vọng: không có nhắc bú khi timer Ngủ đang chạy. Bấm "Dừng" timer Ngủ. Kỳ vọng: trong ≤ 2 phút nhận "Đến giờ bú rồi".
5. Dọn dẹp: tắt công tắc "bé đang ngủ" nếu không dùng, xóa các bản ghi thử, đặt lại Khoảng cách cữ bú.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 34 — Canh timer (spec 2026-11-17 §5, §4.3)

1. Bấm "Nằm sấp" ở trang chủ, sang tab Nhật ký. Kỳ vọng: tab "Hôm nay" trong thanh tab thành ô timer rộng hơn hai tab còn lại, có ô tròn màu của Nằm sấp, đồng hồ "m:ss" đang nhảy và chữ "Hôm nay" bên dưới; không có viên kính nào phía trên thanh tab và không có nút "Dừng"; về tab Hôm nay thì tab "Hôm nay" trở lại như thường.
2. Ở Nhật ký chạm ô timer. Kỳ vọng: về trang Hôm nay, thẻ đầu trang chủ ghi "Đang nằm sấp" và có nút "Dừng". Bấm "Dừng". Kỳ vọng: timer dừng, toast Hoàn tác hiện ngay phía trên thanh tab.
3. Sau một cữ bú mẹ đã xong: thẻ đầu trang chủ (khi đang "Trễ cữ bú") và hàng "Bấm giờ" có nhãn "Nên bú" trên nút của bên ngược lại, kèm dòng "Lần trước: … lúc …"; bảng "+" cũng có nhãn đó.
4. Bấm "Nằm sấp" và để yên 31 phút. Kỳ vọng: nhận "Timer Nằm sấp đã chạy quá 30 phút"; trang chủ có dải vàng "Nằm sấp đã chạy … Còn đang nằm sấp không?" với nút "Dừng".
5. Dọn dẹp: dừng timer, xóa các bản ghi Nằm sấp thử.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 35 — Popup đóng mượt và phân loại triệu chứng (spec 2026-11-17 trieu-chung §3, §8)

1. Trang chủ, bấm "+" để mở "Ghi lại cho {tên bé}", rồi đóng bằng nút ✕. Mở lại, đóng bằng chạm vào nền tối. Kỳ vọng: bảng trượt hết xuống dưới đáy màn hình, nền tối mờ dần cùng lúc, không có cú nhảy hay chớp ở cuối. Không bấm ô nào trong lưới.
2. Khám phá → Triệu chứng ở bề ngang điện thoại. Kỳ vọng: các chip triệu chứng xuống dòng, không có thanh cuộn ngang ở màn nhập.
3. Nhập 38,2; chọn "Sổ mũi, nghẹt mũi, hắt hơi" và "Dụi, kéo tai, quấy hơn khi nằm"; không bật công tắc nào; bấm "Xem kết quả". Kỳ vọng theo tuổi bé:
   - dưới 90 ngày: thẻ đỏ "Bé dưới 3 tháng sốt từ 38°C trở lên", khối "Nếu bé đang sốt", "Trên đường đi"; tab: Cảm lạnh, Viêm tai giữa, Sổ mũi, Sốt, Tay chân miệng, Croup;
   - đúng 90 ngày: như trên, có thêm Mọc răng ngay sau Sổ mũi;
   - 91–182 ngày: thẻ vàng, thẻ "Trong lúc chờ đi khám" có khối sốt; tab: Cảm lạnh, Viêm tai giữa, Sổ mũi, Mọc răng, Sốt, (từ 150 ngày: Sốt phát ban), Tay chân miệng, Croup;
   - từ 183 ngày: thẻ xanh "Theo dõi tại nhà", thẻ "Làm ngay tại nhà" có khối sốt; tab như dòng trên.
4. Chạm từng tab. Kỳ vọng: nội dung bên dưới đổi theo; thanh tab cuộn ngang được.
5. Bấm "Làm lại". Kỳ vọng: chip, công tắc và nhiệt độ về như lúc mới vào.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
