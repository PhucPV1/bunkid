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
2. Khám phá → Triệu chứng ở bề ngang điện thoại. Chạm tên từng nhóm để mở hết các nhóm chip. Kỳ vọng: các chip triệu chứng xuống dòng, không có thanh cuộn ngang ở màn nhập.
3. Nhập 38,2; chọn "Sổ mũi, nghẹt mũi, hắt hơi" (nhóm "Hô hấp") và "Dụi, kéo tai, quấy hơn khi nằm" (nhóm "Khác"); không bật công tắc nào; bấm "Xem kết quả" ở thanh sát đáy màn hình. Kỳ vọng theo tuổi bé:
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

## Bước 36 — Tối ưu trải nghiệm mobile (spec 2026-11-19 §3–§10)

Bước này tạo vài bản ghi thử (Ngủ, Bú trái, Bú bình); mục cuối xoá chúng.

1. Tab Hôm nay khi không có timer nào chạy. Kỳ vọng: ngay trên hàng "Bấm giờ" có 3 ô "Cữ bú tiếp", "Bú gần nhất", "Tã gần nhất", không chữ nào bị cắt hay xuống dòng; ô "Cữ bú tiếp" ghi giờ của cữ tiếp kèm "còn …", hoặc "trễ …" khi đã quá giờ. Thẻ lớn có nhãn viết hoa "Trễ cữ bú", dòng "Dự kiến lúc HH:mm" và hai nút "Bú trái", "Bú phải" khi đã quá giờ; chưa quá giờ mà bé có giấc ngủ kết thúc trong 12 giờ qua thì là "Đang thức", thời gian đã thức và "từ HH:mm". Hàng "Ghi nhanh" là một hàng 5 nút tròn: Thay tã, Bú bình, Thuốc, Nhiệt độ, Khác.
2. Bấm "Ngủ" ở hàng "Bấm giờ". Kỳ vọng: thẻ lớn có nhãn "Đang ngủ", đồng hồ đang chạy, dòng "{tên người bấm} · từ HH:mm" và nút "Dừng" ở bên phải; 3 ô trạng thái vẫn hiện bên dưới. Khi không có dải cảnh báo nào và hôm nay đã ghi Vitamin D: hàng 3 ô "24 giờ qua" nằm trọn phía trên thanh tab, không cần cuộn.
3. Timer Ngủ vẫn chạy, sang tab Nhật ký rồi tab Khám phá. Kỳ vọng: không còn viên timer nổi phía trên thanh tab; tab "Hôm nay" thành ô timer rộng hơn hai tab kia, gồm ô tròn có icon, đồng hồ đang chạy (dưới 1 giờ dạng "54:38", từ 1 giờ dạng "1g 05p") và chữ "Hôm nay" bên dưới, không chữ nào bị cắt hay tràn ra ngoài ô; không có nút "Dừng". Chạm ô timer thì về tab Hôm nay; ở đó tab "Hôm nay" vẽ như bình thường.
4. Về Hôm nay, bấm thêm "Bú trái" (timer Ngủ vẫn chạy). Kỳ vọng: thẻ lớn thành "Đang bú trái" với hai nút "Đổi bên" và "Dừng"; ô "Cữ bú tiếp" ghi "Đang bú" và "từ HH:mm". Sang tab Nhật ký: ô timer có dòng chữ nhỏ "Hôm nay · +1", không bị cắt.
5. Ở tab Nhật ký, bấm "+". Kỳ vọng: bảng có ba nhóm theo thứ tự "Khác", "Ghi nhanh", "Bấm giờ"; nhóm "Bấm giờ" nằm gần ngón cái nhất, là một hàng 5 nút tròn, hai nút của timer đang chạy được tô màu; mọi nhãn nằm trên một dòng, kể cả "Uống nước". Đóng bảng, không bấm ô nào. Về Hôm nay, bấm "Khác" ở hàng "Ghi nhanh". Kỳ vọng: bảng chỉ có nhóm "Khác" với 4 ô Ăn dặm, Uống nước, Tắm, Ghi chú. Đóng bảng, bấm "+". Kỳ vọng: lại đủ ba nhóm. Đóng bảng.
6. Bấm "Thay tã" ở hàng "Ghi nhanh". Kỳ vọng: hàng "Lúc nào?" hiện đủ 4 lựa chọn "Bây giờ", "5p trước", "15p trước", "Giờ khác" trên một hàng, không phải cuộn ngang, không chữ nào bị cắt; chọn "Giờ khác" thì hiện ô chọn ngày giờ. Đóng sheet, không bấm Lưu.
7. Bấm "Nhiệt độ" ở hàng "Ghi nhanh". Kỳ vọng: ô số còn trống hiện "––,–"; dưới ô số có hàng 6 nút 36,5 · 37,0 · 37,5 · 38,0 · 38,5 · 39,0. Chạm "38,0": ô số thành 38,0 và nút đó đổi sang nền đậm. Bấm "+0,1": ô số thành 38,1 và không nút mốc nào còn nền đậm. Đóng sheet, không bấm Lưu.
8. Bấm "Bú bình", nhập 90 ml, bấm Lưu. Bấm "Bú bình" lần nữa. Kỳ vọng: ô ml điền sẵn 90; đóng sheet ngay thì không bị hỏi "Bỏ thay đổi?".
9. Tab Nhật ký. Kỳ vọng: góc trên phải là nút có chữ "Ghi bù" (không còn nút chỉ có icon lịch); bấm thì mở phần thêm bản ghi cũ như trước. Đóng lại, không lưu.
10. Khám phá. Kỳ vọng: thẻ "Tăng trưởng" ghi "Cân nặng {gam} g · {ngày/tháng}" của lần cân mới nhất (chưa cân lần nào thì vẫn là dòng mô tả cũ); thẻ "Tiêm chủng" ghi "Quá hạn: {tên mũi}" chữ đậm màu cảnh báo, hoặc "{ngày/tháng} · {tên mũi}" của mũi sắp tới; mỗi dòng không quá 2 dòng chữ.
11. Khám phá → Tiêm chủng (đã chọn xong loại vaccine lần đầu). Kỳ vọng: ngay dưới tiêu đề trang có một thẻ với nhãn viết hoa "Quá hạn {n} ngày", "Sắp tới · còn {n} ngày" (hạn là hôm nay thì "Sắp tới · hôm nay") hoặc "Mũi tiếp theo", bên dưới là tên mũi chữ lớn và dòng "Hẹn {thứ}, {ngày} · Tiêm chủng mở rộng" hoặc "… · Dịch vụ"; tên mũi trùng với thẻ "Tiêm chủng" ở Khám phá. Chạm thẻ thì mở sheet của đúng mũi đó; đóng lại, không lưu.
12. Vẫn ở Tiêm chủng, xem bảng. Kỳ vọng: hàng tiêu đề "Vắc xin", "Mũi 1", "Mũi 2", …; mỗi vắc xin một hàng, mỗi mũi một ô có trạng thái và ngày: "Đã tiêm" nền xanh nhạt có dấu tích, "Trễ hẹn" nền đỏ nhạt, "Sắp tới" nền vàng nhạt, "Chưa tiêm" nền xám nhạt; không chữ nào trong ô bị cắt. Vuốt bảng sang trái: cột "Vắc xin" đứng yên, các cột mũi trượt bên dưới, cột mũi cuối không bị dải mờ ở mép phải che. Mỗi nhóm chưa chọn loại chỉ có một hàng với ô "Chưa chọn loại ›"; khi vuốt bảng, chữ "Chưa chọn loại" vẫn nằm sát cột "Vắc xin", không trượt xuống dưới cột đó. Dưới bảng có chú giải "Đã tiêm", "Trễ hẹn", "Sắp tới", "Chưa tiêm". Trang không cuộn ngang, chỉ bảng cuộn.
13. Chạm một ô có mũi. Kỳ vọng: mở sheet của đúng mũi đó, đầu sheet có dòng "Tiêm chủng mở rộng" hoặc "Dịch vụ", ngày hẹn chỉ xuất hiện một lần. Đóng lại, không lưu. Bằng tài khoản chủ gia đình, chạm một ô "Chưa chọn loại ›". Kỳ vọng: phần "Loại vaccine" mở ra và trang cuộn về đầu. Bấm "Đóng", không bấm Lưu.
14. Khám phá → Triệu chứng. Kỳ vọng: mọi nhóm chip triệu chứng đang đóng, có dòng "Mở nhóm rồi chạm để chọn, chọn được nhiều."; chạm tên nhóm thì nhóm mở ra, mở được nhiều nhóm cùng lúc, chọn chip thì cạnh tên nhóm có nhãn "{n} đã chọn"; các công tắc dấu hiệu nguy hiểm vẫn mở sẵn. Sát đáy màn hình có một thanh gồm nút tròn gọi 115 và nút "Xem kết quả · đã chọn {n}" (n là số chip đang chọn cộng số công tắc đang bật; chưa chọn gì thì chỉ ghi "Xem kết quả"); cuối trang không còn nút "Xem kết quả" nào khác; thanh tab và nút "+" ẩn đi, và không chớp hiện lúc trang vừa mở; cuộn hết trang thì công tắc cuối cùng không bị thanh che. Không chạm nút gọi 115.
15. Cuộn xuống cuối trang Triệu chứng, nhập 50 vào ô nhiệt độ rồi bấm "Xem kết quả". Kỳ vọng: trang cuộn về đầu, dưới ô nhiệt độ có dòng "Nhiệt độ từ 30 đến 43°C, ví dụ 38,5.", chưa có kết quả. Xoá ô nhiệt độ, bấm "Xem kết quả". Kỳ vọng: hiện kết quả, thanh ở đáy biến mất, thanh tab và nút "+" hiện lại. Bấm "Làm lại". Kỳ vọng: mọi nhóm chip đóng lại, thanh ở đáy hiện lại với chữ "Xem kết quả".
16. Khám phá → Thống kê, tab "Ngủ". Kỳ vọng: góc trên trái biểu đồ có chữ "giờ"; có một vùng tô nhạt nằm ngang đúng khoảng chuẩn theo tuổi của bé (bé đến 90 ngày tuổi: 14–17 giờ) và trục Y cao tới hết vùng đó; cột của hôm nay (cột cuối) nhạt hơn các cột khác; dòng chữ dưới bảng có thêm "Vùng tô nhạt: chuẩn 14–17 giờ mỗi ngày. Cột nhạt là hôm nay, chưa hết ngày." (hai số theo tuổi của bé).
17. Vẫn ở Thống kê, bấm lần lượt các tab còn lại. Kỳ vọng:
    - "Bú": chữ "cữ"; khi bé chưa quá 180 ngày tuổi có một đường kẻ nét đứt tại 8 (bé đến 30 ngày tuổi) hoặc tại 6, và câu "Đường kẻ: chuẩn từ 8 cữ mỗi ngày." hoặc "… từ 6 cữ mỗi ngày.";
    - "Tã": chữ "tã"; khi bé trên 5 ngày tuổi có một đường kẻ nét đứt tại 6 và câu "Đường kẻ: chuẩn từ 6 tã ướt mỗi ngày.";
    - "Hút sữa" (chữ "ml"), "Nằm sấp" (chữ "phút"), "Ăn dặm" (chữ "bữa"): không có vùng tô hay đường kẻ, dưới bảng chỉ thêm câu "Cột nhạt là hôm nay, chưa hết ngày.";
    - tab nào chưa có dữ liệu thì không có biểu đồ, dòng chữ dưới bảng không có các câu trên.
18. Bật Ban đêm rồi lặp lại mục 3, mục 12, mục 14 và mục 16. Kỳ vọng: chữ đọc rõ; ô timer, các ô của bảng tiêm chủng, thanh kết quả, vùng tô nhạt và đường kẻ theo tông hổ phách, không có màu xanh.
19. Đóng hẳn app rồi mở lại từ màn hình chính. Kỳ vọng: trong lúc chờ, khung chờ có hình dạng của trang Hôm nay (một thẻ lớn thấp, 3 ô, hai hàng 5 ô tròn); khi dữ liệu hiện ra, phần trên của trang không nhảy nhiều (thẻ lớn có thể cao lên khi đang trễ cữ bú).
20. Dọn dẹp: về tab Hôm nay bấm "Dừng" cả hai timer, rồi xóa bản ghi Ngủ thử, Bú trái thử và Bú bình 90 ml thử trong Nhật ký.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 37 — Sức khỏe, Tăng trưởng, Chiều cao và thông báo tăng trưởng (spec 2026-11-25 §3–§8)

Mục 2 tạo một bản ghi Ngủ thử và mục 6 tạo một lần đo thử; mỗi mục xóa dữ liệu thử của nó ngay. Cần hai máy đã bật thông báo, đăng nhập hai tài khoản khác nhau của cùng gia đình (máy A, máy B).

1. Mở app từ màn hình chính. Kỳ vọng: thanh tab có 4 tab "Hôm nay", "Nhật ký", "Sức khỏe", "Tiện ích"; không chữ nào bị cắt. Tab Sức khỏe có các mục Tăng trưởng, Tiêm chủng, Phát triển, Thống kê và phần "Khi bé ốm"; tab Tiện ích có các trang còn lại.
2. Ở Hôm nay bấm "Ngủ", rồi sang tab Nhật ký, Sức khỏe, Tiện ích. Kỳ vọng: tab "Hôm nay" thành ô timer rộng hơn ba tab kia, đồng hồ đang chạy và dòng chữ nhỏ bên dưới không bị cắt hay tràn ra ngoài ô. Về Hôm nay, bấm "Dừng" rồi xóa bản ghi Ngủ thử trong Nhật ký.
3. Sức khỏe → Tăng trưởng. Kỳ vọng: thẻ kết luận ở đầu trang nói bằng chữ bé đang thế nào so với chuẩn; mỗi chỉ số có thanh vị trí với ba số chuẩn bên dưới; thẻ "Mục tiêu chiều cao" mở trang Chiều cao.
4. Bằng tài khoản chủ gia đình: Tăng trưởng → Mục tiêu chiều cao → nút bút chì. Nhập chiều cao thật của bố, của mẹ và mục tiêu, bấm Lưu. Kỳ vọng: thẻ mục tiêu hiện số vừa nhập và chip trạng thái; thẻ "Di truyền dự kiến" hiện khoảng dự kiến và vạch mục tiêu; biểu đồ "Đường tới … cm" có đường mục tiêu nét đứt. Bằng tài khoản thành viên khác: thấy cùng các số, không có nút bút chì.
5. Nhập một lần đo thật (cân nặng, chiều dài, vòng đầu) ở Tăng trưởng. Kỳ vọng: thẻ kết luận, thẻ Tăng trưởng ở tab Sức khỏe và trang Chiều cao cùng cập nhật theo lần đo mới; nếu có cảnh báo thì mục "Cần chú ý" ở tab Sức khỏe có dòng của nó.
6. Trên máy A, nhập một lần đo thử có cân nặng thấp hẳn so với lần trước (ví dụ bằng một nửa), ngày đo hôm nay. Máy B không đang trong "Giờ yên lặng" hay "Tạm tắt nhắc". Kỳ vọng: trong vài phút máy B nhận thông báo "Tăng trưởng của {tên bé} cần chú ý", chạm vào thì mở trang Tăng trưởng; máy A không nhận thông báo này. Xóa lần đo thử ngay sau đó.
7. Cài đặt → Thông báo. Kỳ vọng: có hai công tắc "Cảnh báo tăng trưởng" và "Nhắc đo định kỳ", đang bật. Tắt "Nhắc đo định kỳ", mở Sức khỏe → Tăng trưởng → Mục tiêu chiều cao: công tắc ở hàng "Nhắc đo mỗi tháng" (bé từ 1 tuổi: "Nhắc đo ba tháng một lần") cũng đang tắt. Bật lại ở đó, quay về Cài đặt: công tắc "Nhắc đo định kỳ" đã bật.
8. Mục này làm sau, vào ngày hàng nhắc đo ghi "Đã đến kỳ đo" (bé dưới 1 tuổi: 30 ngày sau lần đo gần nhất). Kỳ vọng: 08:00 sáng hôm đó các máy đang bật "Nhắc đo định kỳ" nhận thông báo "Đến kỳ đo cho {tên bé}"; tab Sức khỏe có dòng "Đến kỳ đo" trong "Cần chú ý". Sau khi nhập lần đo mới, dòng đó mất và hàng nhắc đo ghi "Lần tới {ngày/tháng} · 08:00".
9. Trang Chiều cao, khối "Thói quen 7 ngày qua". Kỳ vọng: số giờ ngủ, số phút nằm sấp và số ngày uống vitamin D khớp với Nhật ký của bảy ngày trước hôm nay; khi giấc ngủ có chip "Ít hơn chuẩn" hoặc nằm sấp có chip "Còn thiếu" thì tab Sức khỏe có dòng tương ứng trong "Cần chú ý".
10. Bật Ban đêm rồi xem lại tab Sức khỏe, trang Tăng trưởng và trang Chiều cao. Kỳ vọng: chữ, chip và biểu đồ đọc rõ, theo tông hổ phách.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 38 — Đợt ốm (spec 2026-11-26)

Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23, bảng "Triệu chứng" của Báo cáo là mục 24, kỳ "Đợt ốm" của Báo cáo và nút "Báo cáo cho bác sĩ" là mục 25–28; phần của mốc M5 (lần khám, spec §8) là mục 29–35: thẻ và sheet "Lần khám" là mục 29–33, vạch "Khám" trên biểu đồ và bảng "Lần khám" của Báo cáo là mục 34–35. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó. Mục 24 tạo một bản ghi Triệu chứng thử và xóa nó. Mục 25 tạo một đợt ốm thử và một bản ghi nhiệt độ thử; mục 28 xóa cả hai. Mục 29 tạo một đợt ốm thử, một lần khám thử và một ảnh thử, mục 33 thêm một ảnh thử nữa; mục 33 xóa hết. Mục 34 tạo một đợt ốm thử, một bản ghi nhiệt độ thử và một lần khám thử; mục 35 xóa hết.

1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
3. Tab Nhật ký. Kỳ vọng: có dòng "Triệu chứng: Sổ mũi, Ho · thử"; bộ lọc "Nhiệt độ" vẫn hiện dòng này, bộ lọc "Khác" thì không. Về tab Hôm nay, bấm nút "Khác" của hàng "Ghi nhanh". Kỳ vọng: phiếu chỉ có nhóm "Khác", trong đó có ô "Triệu chứng"; hàng "Ghi nhanh" của Hôm nay vẫn năm nút như trước.
4. Ở Nhật ký bấm vào dòng đó. Kỳ vọng: phiếu "Bản ghi" có hai chip đang chọn và ô "Ghi chú (không bắt buộc)" chứa "thử"; không có ô "Ghi chú" thứ hai. Bỏ chọn "Ho", bấm "Lưu". Kỳ vọng: dòng thành "Triệu chứng: Sổ mũi · thử". Mở lại dòng đó, bấm "Xóa bản ghi".
5. Bật Ban đêm, mở lại phiếu "Triệu chứng", chọn một chip. Kỳ vọng: chip đang chọn vẫn phân biệt được với chip chưa chọn nhờ nền đậm và dấu ✓.
6. Tab Sức khỏe. Kỳ vọng: mục "Khi bé ốm" có dòng "Đợt ốm" đứng đầu, trên "Triệu chứng". Bấm vào. Kỳ vọng: trang "Đợt ốm" có nút quay lại "Sức khỏe"; chưa có đợt nào thì ghi "Chưa có đợt ốm nào" kèm dòng "Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ." và nút "Bắt đầu đợt ốm"; tab Sức khỏe vẫn sáng. Bấm "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết mở ra, thẻ trên cùng ghi "Chưa đo nhiệt độ" và "Ngày thứ 1 · bắt đầu … lúc …" đúng giờ vừa bấm, có ba nút "Nhiệt độ", "Thuốc", "Triệu chứng"; thẻ "Nhiệt độ và thuốc hạ sốt" ghi "Chưa có lần đo nào trong đợt này."; mục "Từng ngày" có một hàng "Hôm nay · ngày 1" ghi "Chưa đo · không dùng thuốc"; cuối trang có nút "Bé đã khỏi".
7. Trong thẻ trên cùng bấm "Nhiệt độ", nhập 38,5, bấm "Lưu". Kỳ vọng: thẻ thành "… đang sốt 38,5°C", hàng "Đo gần nhất" và "Sốt cao nhất" đều ghi 38,5°C; biểu đồ có một chấm kèm số 38,5 nằm trong vùng tô có chữ "Sốt"; hàng hôm nay ghi "Cao nhất 38,5°C · không dùng thuốc" với nhãn "Sốt". Bấm "Triệu chứng", chọn "Ho", bấm "Lưu". Kỳ vọng: hàng hôm nay có chip "Ho".
8. Bấm nút bút chì ở đầu trang. Kỳ vọng: phiếu "Sửa đợt ốm" có ô "Bắt đầu", nút "Lưu" và "Xóa đợt ốm"; không có ô "Kết thúc", không có "Mở lại đợt ốm". Chạm ô "Bắt đầu". Kỳ vọng: bánh xe chọn ngày giờ của iOS hiện ra; ô ghi đúng ngày giờ đang có, không chữ nào bị cắt. Lùi giờ bắt đầu 2 giờ, bấm "Lưu". Kỳ vọng: dòng dưới tiêu đề của thẻ đổi sang giờ mới. Mở lại phiếu, đặt giờ bắt đầu sang ngày mai, bấm "Lưu". Kỳ vọng: dòng đỏ "Giờ bắt đầu ở tương lai." dưới ô, phiếu không đóng. Đóng phiếu, chọn bỏ thay đổi.
9. Bấm "Bé đã khỏi". Kỳ vọng: không hỏi lại; toast "Đã đóng đợt ốm"; tiêu đề thẻ thành "Đã khỏi sau 1 ngày"; ba nút và nút "Bé đã khỏi" biến mất. Bấm quay lại "Đợt ốm". Kỳ vọng: mục "Đang diễn ra" là nút "Bắt đầu đợt ốm"; mục "Đã qua" có một hàng "… – … · 1 ngày". Bấm hàng đó, bấm bút chì. Kỳ vọng: phiếu có cả "Bắt đầu" và "Kết thúc", có "Mở lại đợt ốm". Bấm "Mở lại đợt ốm". Kỳ vọng: phiếu đóng, trang lại là đợt đang mở, có ba nút và "Bé đã khỏi"; ở danh sách, thẻ "Đang diễn ra" ghi "Từ … · ngày thứ 1" với chip "Đang sốt" (hoặc "Chưa đo lại" nếu lần đo đã quá 6 giờ) nằm dưới dòng đó.
10. Bấm "Bé đã khỏi" để đóng đợt. Bật chế độ máy bay. Ở danh sách bấm "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết của đợt mới mở ra ngay, thanh đồng bộ báo có thay đổi đang chờ. Nếu thay vào đó thấy trang "Bạn đang offline" hoặc "Không tìm thấy đợt ốm này": ghi lại đúng màn hình đã thấy rồi làm tiếp; đợt vừa tạo vẫn nằm trong hàng chờ và sẽ hiện khi có mạng. Tắt chế độ máy bay. Kỳ vọng: sau vài giây thanh đồng bộ hết; đóng hẳn app rồi mở lại, đợt mới vẫn ở mục "Đang diễn ra".
11. Trên máy thứ hai (đang mở sẵn trang "Đợt ốm" từ trước mục 10, không tải lại). Kỳ vọng: sau tối đa 2 phút thấy đợt mới ở mục "Đang diễn ra", chưa có chip. Để máy thứ hai ở trang đó; trên máy thứ nhất mở đợt mới, bấm "Nhiệt độ" trong thẻ trên cùng, nhập 38,8, bấm "Lưu". Kỳ vọng: trong vài giây, không tải lại, thẻ trên máy thứ hai có chip "Đang sốt"; bấm thẻ đó, trang chi tiết ghi "… đang sốt 38,8°C".
12. Bật Ban đêm và mở trang chi tiết của đợt đang mở. Bấm "Nhiệt độ" trong thẻ trên cùng, nhập 37,6, bấm "Lưu". Kỳ vọng: trên biểu đồ, lần đo là chấm tròn (liều hạ sốt, nếu có, là hình thoi); nhãn "37,6" nằm bên cạnh hoặc dưới chấm mới nhất, không nằm trên đường 38 nét đứt: không gạch nào ló ra sát con số; chữ "Sốt" và đường 38 nét đứt vẫn đọc được; thẻ trên cùng vẫn phân biệt được nhờ icon và chữ. Mở trang chi tiết trong Safari bằng một đường dẫn sai mã (thêm vài chữ vào cuối địa chỉ; app đã cài không có thanh địa chỉ). Kỳ vọng: "Không tìm thấy đợt ốm này" và đường dẫn "Về danh sách".
13. Tắt Ban đêm. Cài đặt › Giao diện › Nền sáng: lần lượt chọn Đào mơ, Oải hương, Biển sương; mỗi lần mở tab Sức khỏe, trang "Đợt ốm" và trang chi tiết của đợt đang mở. Kỳ vọng: dòng "Đợt ốm", thẻ trên cùng, chip, mục "Từng ngày" và biểu đồ (vùng tô có chữ "Sốt", đường 38 nét đứt, nhãn giá trị) đọc rõ. Về lại Hồng dịu.
14. Có mạng, mở trang "Đợt ốm" rồi trang chi tiết của đợt đang mở. Đóng hẳn app, bật chế độ máy bay, mở lại app → Sức khỏe → "Đợt ốm". Kỳ vọng: trang mở ra (không phải trang "Bạn đang offline"), thẻ "Đang diễn ra" như lúc có mạng. Bấm thẻ đó. Kỳ vọng: trang chi tiết mở ra với thẻ trên cùng và biểu đồ như lúc có mạng. Nếu thay vào đó thấy "Bạn đang offline" hoặc "Cần mạng để …": ghi lại đúng màn hình đã thấy rồi làm tiếp. Tắt chế độ máy bay.
15. Dọn: mở từng đợt thử, bấm bút chì, "Xóa đợt ốm". Kỳ vọng: hỏi lại "Xóa đợt ốm này? Các bản ghi nhiệt độ, thuốc, triệu chứng vẫn giữ nguyên."; đồng ý thì phiếu đóng và trang tự về danh sách "Đợt ốm", đợt đó không còn. Nếu trang vẫn đứng ở trang chi tiết, hoặc dòng "Không tìm thấy đợt ốm này" ở lại quá một nhịp: ghi lại rồi bấm quay lại "Đợt ốm". Xóa xong cả hai đợt, trang ghi lại "Chưa có đợt ốm nào". Vào Nhật ký xóa bản ghi nhiệt độ 38,5 và bản ghi triệu chứng "Ho" của mục 7, bản ghi nhiệt độ 38,8 của mục 11 và 37,6 của mục 12.
16. Máy A, tab Hôm nay, bé không có đợt ốm nào đang mở: ở hàng "Ghi nhanh" bấm "Nhiệt độ", nhập 38,5, bấm "Lưu". Kỳ vọng: banner sốt hiện như trước (vàng; đỏ nếu bé dưới 3 tháng), giữ nguyên chữ và các nút của nó; ngay sau các nút ấy có thêm câu "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?" và hai nút "Bắt đầu đợt ốm", "Không". Bấm "Không". Kỳ vọng: câu và hai nút biến mất, banner còn nguyên. Đóng hẳn app rồi mở lại: lời mời vẫn không hiện trên máy A.
17. Máy B, tab Hôm nay (chờ tới khi thấy lần đo 38,5, tối đa 30 giây). Kỳ vọng: banner sốt có lời mời (lời "Không" ở máy A chỉ có tác dụng trên máy A). Bấm "Bắt đầu đợt ốm". Kỳ vọng: vẫn ở Hôm nay, không có thông báo; lời mời biến mất; ngay dưới banner có thẻ "Đang ốm · ngày 1" với dòng "Đang sốt · 38,5°C lúc …" và ba nút "Nhiệt độ", "Thuốc", "Triệu chứng". Bấm vào hàng trên của thẻ. Kỳ vọng: trang chi tiết của đợt, dòng "Ngày thứ 1 · bắt đầu … lúc …" mang đúng giờ của lần đo 38,5, không phải giờ vừa bấm.
18. Máy B về Hôm nay, bấm "Triệu chứng" trên thẻ đợt ốm, chọn "Ho", bấm "Lưu". Kỳ vọng: toast Hoàn tác như mọi bản ghi; mở trang chi tiết, hàng "Hôm nay · ngày 1" có chip "Ho". Trên máy A (sau tối đa 2 phút): Hôm nay có thẻ "Đang ốm · ngày 1".
19. Máy B, trang chi tiết, bấm "Bé đã khỏi", rồi về Hôm nay. Kỳ vọng: thẻ đợt ốm biến mất; banner sốt của lần đo 38,5 vẫn còn nhưng **không** có lời mời (lần đo ấy nằm trong đợt vừa đóng). Ở hàng "Ghi nhanh" bấm "Nhiệt độ", nhập 37,2, "Lưu". Kỳ vọng: banner sốt biến mất.
20. Dọn: Sức khỏe → Đợt ốm, mở đợt thử, bút chì, "Xóa đợt ốm"; vào Nhật ký xóa ba bản ghi thử (38,5, "Ho", 37,2). Lưu ý: lời "Không" của mục 16 còn giữ trên máy A thêm 24 giờ; trong 24 giờ đó, nếu bé sốt thật, máy A không hiện lời mời (máy B vẫn hiện).
21. Làm sau, khi có một đợt ốm thật đang mở hơn 48 giờ. Kỳ vọng: dưới thẻ đợt ốm có thẻ nhắc với một trong ba tiêu đề: "{tên bé} đã 48 giờ không sốt" (lần đo cuối dưới 38 và đã 48 giờ từ lần sốt cuối), "48 giờ qua chưa đo lại nhiệt độ" (lần đo cuối vẫn từ 38 và đã 48 giờ không đo), hoặc "48 giờ qua không có triệu chứng hay liều hạ sốt nào"; dòng "Đợt ốm bắt đầu … xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa."; hai nút "Bé đã khỏi", "Chưa". Bấm "Chưa". Kỳ vọng: thẻ nhắc biến mất trên máy này trong 24 giờ, máy kia vẫn thấy. Bật Ban đêm: ba dạng thẻ nhắc khác nhau ở icon (dấu tích, đồng hồ, nhiệt kế) chứ không chỉ ở màu.
22. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết có thẻ "So với thường ngày" ngay dưới mục "Từng ngày"; trong thẻ chỉ có câu "Chưa có ngày trọn nào của đợt ốm để so." và dòng "Phân loại triệu chứng" có mũi tên. Bấm bút chì, đổi "Bắt đầu" thành 08:00 của hôm kia, bấm "Lưu". Kỳ vọng: thẻ có dòng "Hôm qua, so với trung bình 7 ngày trước khi ốm" rồi tới ba hàng "Bú", "Tã ướt", "Ngủ" (hàng nào bảy ngày trước đó không có số thì không có); mỗi hàng có dòng "{số} cữ · thường {số} cữ", "{số} lần · thường {số} lần" hoặc "{số} giờ · thường {số} giờ" và một chip "Ít hơn", "Như thường" hoặc "Nhiều hơn"; không chữ nào bị cắt. Nếu bảy ngày trước hôm kia có ít hơn ba ngày được ghi bú, ngủ hay tã thì thay vào đó là câu "Chưa đủ dữ liệu trước khi ốm để so.". Bấm "Phân loại triệu chứng". Kỳ vọng: trang Phân loại triệu chứng mở ra. Quay lại.
23. Bật Ban đêm. Kỳ vọng: các chip của thẻ "So với thường ngày" khác nhau ở chữ, đọc rõ. Tắt Ban đêm. Bấm "Bé đã khỏi". Kỳ vọng: dòng đầu của thẻ thành "{ngày hôm qua, dd/mm}, so với trung bình 7 ngày trước khi ốm", các hàng giữ nguyên. Dọn: bấm bút chì, "Xóa đợt ốm".
24. Bấm "+", nhóm "Khác", "Triệu chứng"; chọn "Ho", gõ ghi chú "thử", bấm "Lưu". Sức khỏe → "Báo cáo cho bác sĩ", để "7 ngày". Kỳ vọng: sau mục "Thuốc đã dùng" có bảng "Triệu chứng" ba cột "Giờ", "Triệu chứng", "Ghi chú"; có một hàng với giờ vừa lưu, "Ho", "thử"; bảng không tràn ra ngoài màn hình. Bấm "In / Lưu PDF". Kỳ vọng: bản xem trước có bảng đó, chữ đen trên nền trắng, có kẻ ô. Hủy in. Dọn: vào Nhật ký xóa bản ghi "Triệu chứng: Ho · thử". Mở lại Báo cáo. Kỳ vọng: không còn bảng "Triệu chứng" (nếu bảy ngày qua không có bản ghi triệu chứng nào khác).
25. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Trong thẻ trên cùng bấm "Nhiệt độ", nhập 38,5, bấm "Lưu". Cuộn xuống cuối trang. Kỳ vọng: nút "Báo cáo cho bác sĩ" (nền đậm, có icon tờ giấy) nằm ngay trên nút "Bé đã khỏi". Bấm nút đó. Kỳ vọng: trang "Báo cáo cho bác sĩ" có ba lựa chọn "7 ngày", "14 ngày", "Đợt ốm", đang chọn "Đợt ốm"; dòng dưới tên bé là "Đợt ốm từ {hôm nay, dd/mm} · ngày thứ 1 · in ngày …"; bảng "Theo ngày" chỉ có một hàng; mục "Nhiệt độ" có biểu đồ (một chấm kèm số 38,5 trong vùng có chữ "Sốt"; chú thích "Nhiệt độ", "Liều hạ sốt", "Từ 38°C là sốt") rồi tới dòng có 38,5°C.
26. Bấm "7 ngày". Kỳ vọng: báo cáo bảy ngày như trước ("7 ngày, từ … đến …"), không có biểu đồ. Bấm "Đợt ốm". Kỳ vọng: lại là đợt vừa mở.
27. Bật Ban đêm, bấm "In / Lưu PDF". Kỳ vọng: bản xem trước nền trắng chữ đen; biểu đồ in màu như ở nền sáng: đường và chấm màu xanh, vùng sốt hồng nhạt, chữ "38" và "Sốt" đỏ đậm đọc rõ, ba dấu của chú thích có màu; biểu đồ không bị cắt đôi giữa hai trang. Hủy in, tắt Ban đêm.
28. Về trang chi tiết, bấm "Bé đã khỏi", rồi "Báo cáo cho bác sĩ". Kỳ vọng: dòng dưới tên bé là "Đợt ốm {dd/mm} – {dd/mm} · 1 ngày · in ngày …". Đóng hẳn app, bật chế độ máy bay, mở lại app → Sức khỏe → "Đợt ốm" → hàng của đợt vừa đóng → "Báo cáo cho bác sĩ". Kỳ vọng: trang mở ra (không phải trang "Bạn đang offline") và vẫn chọn "Đợt ốm". Nếu thay vào đó thấy "Cần mạng để tải báo cáo. …" hay một màn khác: ghi lại đúng màn hình đã thấy. Tắt chế độ máy bay. Dọn: bút chì → "Xóa đợt ốm"; vào Nhật ký xóa bản ghi 38,5.
29. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết có thẻ "Lần khám" (sau "So với thường ngày", trên "Báo cáo cho bác sĩ") với nút "Thêm" và dòng "Chưa có lần khám nào.". Bấm "Thêm". Kỳ vọng: phiếu "Lần khám" có dòng "Chỉ cần ngày giờ. Các ô khác điền được sau.", ô "Lúc khám" ghi giờ hiện tại, ba ô "Nơi khám", "Bác sĩ kết luận", "Lời dặn", mục "Ảnh đơn thuốc, giấy khám" có ô "Thêm". Gõ "thử" vào "Nơi khám", bấm ô "Thêm", chụp một tờ giấy bất kỳ. Kỳ vọng: ảnh hiện thành một ô có viền nét đứt và dấu × đỏ. Bấm "Lưu". Kỳ vọng: phiếu đóng; thẻ có dòng "{dd/mm} {HH:mm} · thử" và một ô ảnh; bấm ô ảnh thì thấy ảnh lớn. Đóng ảnh. Vào Tiện ích → Ảnh. Kỳ vọng: ảnh vừa chụp **không** có ở trang Ảnh.
30. Về trang chi tiết, bấm dòng "… · thử". Kỳ vọng: phiếu mở với "thử" và ảnh đã lưu (không còn viền nét đứt). Gõ "thử kết luận" vào "Bác sĩ kết luận", gõ hai dòng vào "Lời dặn", bấm "Lưu". Kỳ vọng: thẻ có nhãn nhỏ "Bác sĩ kết luận", dưới là "thử kết luận" chữ đậm, rồi lời dặn đúng hai dòng; không chữ nào bị cắt. Mở lại, đặt "Lúc khám" sang hôm qua (trước giờ bắt đầu của đợt), bấm "Lưu". Kỳ vọng: dòng đỏ "Lúc khám nằm ngoài đợt ốm." dưới ô, phiếu không đóng. Đóng phiếu, chọn bỏ thay đổi.
31. Bật chế độ máy bay. Kỳ vọng: thẻ "Lần khám" có dòng "Cần kết nối mạng để thay đổi các mục dưới đây.", nút "Thêm" mờ. Bấm dòng lần khám. Kỳ vọng: phiếu có dòng đó; "Lưu" và "Xóa lần khám" mờ. Đóng phiếu, tắt chế độ máy bay.
32. Bấm bút chì ở đầu trang. Kỳ vọng: "Xóa đợt ốm" mờ, ngay dưới là dòng "Xóa các lần khám trước.". Đóng phiếu.
33. Dọn: bấm dòng lần khám, bấm dấu × trên ảnh. Kỳ vọng: hỏi lại "Xóa ảnh này?"; đồng ý thì ảnh biến mất ngay, phiếu vẫn mở. Bấm ô "Thêm", chụp một ảnh nữa, bấm "Lưu". Mở lại lần khám, bấm "Xóa lần khám". Kỳ vọng: hỏi lại "Xóa lần khám này và các ảnh của nó?"; đồng ý thì phiếu đóng, thẻ ghi lại "Chưa có lần khám nào.". Bút chì → "Xóa đợt ốm" bấm được: xóa đợt thử.
34. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Trong thẻ trên cùng bấm "Nhiệt độ", nhập 38,5, bấm "Lưu". Trong thẻ "Lần khám" bấm "Thêm", gõ "thử" vào "Nơi khám", bấm "Lưu" (không chọn ảnh). Kỳ vọng: biểu đồ "Nhiệt độ và thuốc hạ sốt" có thêm một vạch dọc nét đứt ở giờ vừa lưu, chữ "Khám" ở trên cùng hình, không đè lên số hay chữ "Sốt"; vạch không chạy xuyên chữ "Sốt". Bật Ban đêm. Kỳ vọng: vạch và chữ "Khám" vẫn đọc được. Tắt Ban đêm.
35. Bấm "Báo cáo cho bác sĩ". Kỳ vọng: biểu đồ của báo cáo cũng có vạch "Khám"; sau mục "Thuốc đã dùng" là bảng "Lần khám" bốn cột "Lúc khám", "Nơi khám", "Bác sĩ kết luận", "Lời dặn", một hàng với giờ vừa lưu và "thử"; bảng không tràn ra ngoài màn hình, không chữ nào bị cắt. Bấm "In / Lưu PDF". Kỳ vọng: bản xem trước có bảng đó, không có ảnh. Hủy in. Bấm "7 ngày". Kỳ vọng: không có bảng "Lần khám". Dọn: về trang chi tiết, bấm dòng lần khám, "Xóa lần khám"; bút chì → "Xóa đợt ốm"; vào Nhật ký xóa bản ghi 38,5.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 39 — Triệu chứng theo ngày (spec 2026-11-27)

Bước này thay mục 1–4, 18 và 24 của Bước 38 ở những chỗ nói tới phiếu "Triệu chứng" cũ (chip "Lúc nào?", toast có "Hoàn tác", phiếu "Bản ghi" của Nhật ký): phiếu đó không còn. Mục 2–5 tạo một bản ghi Triệu chứng thử cho hôm qua; mục 6–10 tạo một đợt ốm thử và hai bản ghi Triệu chứng thử cho hôm nay (một của chủ, một của thành viên; mục 10 gộp chúng làm một), cần hai máy cùng gia đình: máy A đăng nhập bằng tài khoản chủ, máy B bằng một thành viên không phải chủ; mục 11 xóa hết.

1. Máy A, bé không có đợt ốm nào đang mở. Bấm "+", nhóm "Khác", "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có nhãn "Ngày nào?" và một dải ô vuông: năm ô thứ ("T2"…"CN"), "Hôm qua", "Hôm nay", rồi ô "Khác" có icon lịch; dải đã cuộn sẵn tới cuối, ô "Hôm nay" nền đậm; không có "Lúc nào?". Dòng "Bấm những gì bé có trong ngày."; ô ghi chú mờ, dưới ô có dòng "Bật ít nhất một triệu chứng để ghi chú."; nút "Lưu" mờ. Không chữ nào bị cắt.
2. Bấm ô "Hôm qua", chọn "Ho", gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: phiếu đóng, toast "Đã lưu triệu chứng {dd/mm của hôm qua}", không có nút "Hoàn tác". Tab Nhật ký, ngày hôm qua: dòng "Triệu chứng: Ho · thử" đứng đầu ngày, chỗ giờ ghi "Cả ngày".
3. Bấm "+" → "Triệu chứng" lần nữa. Kỳ vọng: ô "Hôm qua" có một chấm nhỏ. Bấm ô "Hôm qua". Kỳ vọng: chip "Ho" bật sẵn, ô ghi chú có "thử", dòng nền hồng "Ngày này đã ghi Ho. Bấm để thêm hoặc bỏ rồi Lưu.". Chọn thêm "Sổ mũi", bấm "Lưu". Kỳ vọng: ở Nhật ký ngày hôm qua vẫn chỉ một dòng triệu chứng, nay là "Triệu chứng: Sổ mũi, Ho · thử".
4. Bấm "+" → "Triệu chứng", chạm ô "Khác". Kỳ vọng: bánh xe chọn ngày của iOS mở ra; không chọn được ngày sau hôm nay. Chọn ngày cách đây 10 ngày, bấm "Xong". Kỳ vọng: ô "Khác" nền đậm, dòng dưới đổi thành ngày đó (dd/mm); không ô ngày nào khác nền đậm. Đóng phiếu (không lưu).
5. Nhật ký, bấm dòng triệu chứng của hôm qua. Kỳ vọng: phiếu "Triệu chứng · {dd/mm}" với dòng "Cả ngày", không có dải ngày; dưới "Lưu" có nút chữ đỏ "Xóa triệu chứng ngày này". Đóng phiếu. Bấm "Ghi bù". Kỳ vọng: ô "Loại" không còn "Triệu chứng". Đóng phiếu.
6. Máy A: Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Kỳ vọng: ở "Từng ngày", hàng "Hôm nay · ngày 1" có nút nhỏ "+ Ghi triệu chứng". Bấm nút đó. Kỳ vọng: phiếu "Triệu chứng · {dd/mm}" với dòng "Ngày 1 của đợt ốm · cả ngày", không có dải ngày, không có nút xóa. Chọn "Sốt", bấm "Lưu". Kỳ vọng: hàng có chip "Sốt" và ngay sau là nút "Sửa" có hình bút chì; hàng tự nó không bấm được.
7. Trong thẻ trên cùng bấm "Triệu chứng". Kỳ vọng: nhãn "Ngày nào? · đợt ốm từ {dd/mm}" và một ô "Hôm nay" có chấm, cộng ô "Khác". Đóng phiếu.
8. Máy B (thành viên), trang chi tiết của đợt vừa mở, chờ tối đa 2 phút cho thấy chip "Sốt". Bấm "Sửa" ở hàng hôm nay. Kỳ vọng: chip "Sốt" bật nhưng mờ, chạm vào không tắt; dưới các chip có dòng "Chip mờ do người khác ghi, chỉ họ hoặc chủ gia đình bỏ được."; ô ghi chú mờ; không có nút xóa. Bật "Ho", gõ "máy B", bấm "Lưu". Kỳ vọng: hàng hôm nay có "Sốt" và "Ho". Máy A (sau tối đa 30 giây) cũng thấy hai chip đó. Máy A bấm "Báo cáo cho bác sĩ". Kỳ vọng: bảng "Triệu chứng" có cột đầu tên "Ngày", một hàng cho hôm nay với "Sốt, Ho" và ghi chú "máy B".
9. Máy A bật Ban đêm, mở "+" → "Triệu chứng". Kỳ vọng: ô đang chọn của dải khác hẳn các ô khác (nền đậm, chữ sáng); chấm của ô "Hôm qua" vẫn thấy. Mở "Sửa" ở hàng hôm nay trên máy B khi bật Ban đêm. Kỳ vọng: chip mờ vẫn phân biệt được với chip thường. Tắt Ban đêm.
10. Máy A (chủ) mở "Sửa" ở hàng hôm nay. Kỳ vọng: "Sốt" và "Ho" đều bật, không chip nào mờ (chủ sửa được mọi bản ghi); ô ghi chú có "máy B"; có nút "Xóa triệu chứng ngày này". Bật thêm "Quấy", bấm "Lưu". Kỳ vọng: toast "Đã lưu triệu chứng hôm nay"; hàng hôm nay có "Sốt", "Ho", "Quấy". Tab Nhật ký, hôm nay: chỉ còn **một** dòng triệu chứng, "Triệu chứng: Sốt, Ho, Quấy · máy B", người ghi là người của máy A (bản ghi của máy B đã gộp vào bản ghi cũ hơn của máy A rồi bị xóa). Máy B (sau tối đa 30 giây) mở "Sửa" ở hàng hôm nay. Kỳ vọng: cả ba chip đều mờ, ô ghi chú mờ, không có nút xóa. Đóng phiếu.
11. Dọn: máy A mở "Sửa" ở hàng hôm nay, bấm "Xóa triệu chứng ngày này". Kỳ vọng: hỏi lại "Xóa triệu chứng ngày {dd/mm}?"; đồng ý thì toast "Đã xóa triệu chứng {dd/mm}", hàng trở lại "+ Ghi triệu chứng". Bút chì → "Xóa đợt ốm". Nhật ký: bấm dòng triệu chứng của hôm qua, "Xóa triệu chứng ngày này", đồng ý.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 40 — Nhật ký gom theo buổi (spec 2026-11-27)

Chỉ xem, trừ mục 6 tạo một bản ghi thử rồi xóa nó. Một máy là đủ.

1. Mở tab Nhật ký. Kỳ vọng: mỗi ngày một khối kính; nếu ngày có triệu chứng thì dòng "Cả ngày" đứng đầu khối; sau đó là các hàng buổi từ muộn tới sớm ("Tối · 18–24 giờ", "Chiều · 12–18 giờ", "Sáng · 6–12 giờ", "Đêm · 0–6 giờ"). Hôm nay không có buổi chưa tới. Chỉ một buổi đang mở: buổi muộn nhất có bản ghi của hôm nay. Hàng buổi có nền hơi đậm hơn dòng bản ghi. Không chữ nào bị cắt "…".
2. Hàng buổi đang gập có tóm tắt kiểu "3 cữ · 2 tã · ngủ 2g 10p" và mũi tên xuống. Bấm vào. Kỳ vọng: các dòng của buổi hiện ra ngay dưới, mũi tên lên, trang không nhảy. Bấm lại: gập.
3. Một ngày cũ. Kỳ vọng: đủ bốn buổi; buổi không có gì là hàng mờ "Không có bản ghi", bấm không có gì xảy ra. Nếu đêm đó bé ngủ từ tối hôm trước mà 0–6 giờ không ghi gì thì "Đêm · 0–6 giờ" ghi "ngủ …", cũng không bấm được.
4. Bấm chip "Bú". Kỳ vọng: mọi buổi còn lại đều mở, chỉ có dòng bú; buổi không có cữ bú nào biến mất. Bấm "Tất cả". Kỳ vọng: về như mục 1.
5. Mở một buổi của hôm qua, sang tab "Hôm nay" rồi quay lại "Nhật ký". Kỳ vọng: buổi đó đã gập lại, như mục 1.
6. Bật chế độ máy bay, ghi một cữ bú thử. Nhật ký: dòng đó có dấu đồng hồ "Chờ đồng bộ". Gập buổi đó. Kỳ vọng: dấu đồng hồ hiện trên hàng buổi. Tắt chế độ máy bay, chờ dấu mất, rồi mở dòng thử và xóa nó.
7. Bật Ban đêm. Kỳ vọng: hàng buổi vẫn tách được với dòng bản ghi, hàng "Không có bản ghi" đọc được, buổi mở và gập phân biệt được bằng mũi tên. Tắt Ban đêm.
8. Bật VoiceOver, vuốt tới một hàng buổi. Kỳ vọng: đọc tên buổi, tóm tắt, là nút, và "thu gọn" hoặc "mở rộng" đúng trạng thái. Tắt VoiceOver.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 41 — Mốc phát triển theo dòng thời gian (spec 2026-11-27)

Chỉ xem, không bấm Lưu, không bỏ đánh dấu mốc nào. Một máy là đủ.

1. Mở tab Sức khỏe, bấm "Phát triển". Kỳ vọng: không còn đoạn giới thiệu dài; trên cùng là dòng "Vận động lớn" có ngôi sao và một dòng tóm tắt bằng tên mốc (ví dụ "Đã lật · đang tới tuổi ngồi, đứng có đỡ"), không có số; dưới là dòng thời gian 8 mốc từ "Mốc 2 tháng" tới "Mốc 24 tháng". Chỉ mốc của tháng bé đang ở mở sẵn, nút tròn của nó màu chủ đạo có số tháng. Các mốc sau mốc "Sắp tới" có tiêu đề màu nhạt. Không chữ nào bị cắt "…".
2. Bấm tiêu đề một mốc đang gập. Kỳ vọng: mốc đó mở thành một thẻ chia nhóm "Xã hội, cảm xúc", "Ngôn ngữ, giao tiếp", "Nhận thức", "Vận động", mỗi nhóm một chấm màu; mốc đang mở trước đó gập lại; mũi tên đổi chiều. Bấm lại tiêu đề vừa mở. Kỳ vọng: gập, không mốc nào mở.
3. Nhìn các mốc đã qua. Kỳ vọng: mốc đạt đủ có nút xanh với dấu tick và "Đạt đủ … mốc"; mốc còn thiếu có nút cam "!" và chữ cam "Còn … mốc chưa đạt · nên hỏi bác sĩ".
4. Bấm dòng "Vận động lớn". Kỳ vọng: sheet "Vận động lớn" trượt lên, dòng đầu "{tên bé} hôm nay: …", 7 mốc; mỗi mốc có một chip ngắn không xuống dòng ("Đạt dd/mm/yyyy", "Đang tới tuổi", "Sắp tới" hoặc "Nên hỏi bác sĩ"), một thanh màu và một vạch đen "hôm nay"; dưới cùng nhãn "0", "6", "12", "18 tháng".
5. Trong sheet đó bấm một mốc chưa đạt. Kỳ vọng: sheet nhập ngày đạt thay chỗ ngay. Bấm nút Đóng (không Lưu). Kỳ vọng: sheet "Vận động lớn" mở lại. Đóng nó.
6. Bấm dòng cam "Khi nào nên hỏi bác sĩ" cuối màn. Kỳ vọng: sheet cùng tên có 3 ý. Đóng. Bấm "Nguồn CDC" rồi "Nguồn WHO". Kỳ vọng: mỗi link mở trang nguồn ở tab mới.
7. Bật Ban đêm. Kỳ vọng: chữ cam, tiêu đề mốc nhạt, tiêu đề nhóm và chip "Sắp tới" đều đọc được; mốc mở và mốc gập phân biệt được bằng mũi tên. Tắt Ban đêm.
8. Bật VoiceOver, vuốt tới tiêu đề một mốc. Kỳ vọng: đọc "Mốc … tháng", dòng tóm tắt, là nút, và "thu gọn" hoặc "mở rộng" đúng trạng thái. Mở sheet "Vận động lớn", vuốt tới một mốc. Kỳ vọng: đọc tên mốc, chip và "Thường trong khoảng … tháng". Tắt VoiceOver.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
