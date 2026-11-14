# Bé Yêu

PWA theo dõi chăm sóc bé. Spec: `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md`.

## Chạy local

```bash
bun install
cp .env.example .env.local   # điền URL và anon key của Supabase project
bun run dev
```

## Kiểm thử

```bash
bun run test        # Vitest cho lib/rules và scripts
bun run db:start    # cần OrbStack/Docker đang chạy
bun run db:test     # pgTAP cho schema và RLS
```

## Bảng tăng trưởng WHO

`content/who/*.json` (bảng LMS theo ngày tuổi 0–1856) được tạo một lần từ 6 file "expanded tables" z-score của WHO, link trong `WHO_FILES` (`scripts/build-who.ts`). Chỉ cần tạo lại khi WHO đổi bảng:

```bash
mkdir -p /tmp/who-xlsx   # tải 6 file .xlsx theo link trong WHO_FILES vào đây
bun scripts/build-who.ts /tmp/who-xlsx 2026-11-14   # ngày rà soát ghi vào reviewedAt
```

## Thiết lập lần đầu

1. Supabase project (Singapore); bật Google provider với OAuth client Web, redirect `https://<ref>.supabase.co/auth/v1/callback`.
2. Supabase → Auth → URL Configuration: Site URL `<APP_URL>`, Redirect URLs `<APP_URL>/auth/callback`, `http://localhost:3000/auth/callback`.
3. `bunx supabase link --project-ref <ref> && bunx supabase db push`.
4. Vercel: import repo, đặt `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Người đăng nhập đầu tiên tạo gia đình và thành chủ nhà; Gmail khác phải được chủ nhà thêm.
6. Gói Supabase Free tạm dừng project sau 7 ngày không có hoạt động: vào dashboard bấm Restore.
7. Thông báo đẩy (M10):
   - Chạy `bunx web-push@3.6.7 generate-vapid-keys` một lần. Giữ kín Private Key.
   - Trên Vercel → Settings → Environment Variables, thêm:
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = Public Key
     - `VAPID_PRIVATE_KEY` = Private Key
     - `VAPID_SUBJECT` = `mailto:<email của bạn>`
     - `SUPABASE_SERVICE_ROLE_KEY` = khóa `service_role` ở Supabase → Project Settings → API Keys
   - Deploy lại để Vercel chép khóa công khai vào app.
8. Gửi nhắc bú (M11):
   - Tạo một chuỗi bí mật: `openssl rand -hex 32`.
   - Vercel → Environment Variables: thêm `CRON_SECRET` = chuỗi đó, rồi deploy lại.
   - Supabase → SQL Editor, chạy (thay hai giá trị trong nháy đơn):

     ```sql
     select vault.create_secret('https://bunkid.vercel.app', 'app_url'); -- không có dấu / ở cuối
     select vault.create_secret('<chuỗi CRON_SECRET ở trên>', 'cron_secret');
     ```

   - Cron `push-dispatch` (migration `20261114000300_push_cron.sql`) gọi `/api/push/dispatch` mỗi phút. Xem lịch sử ở Supabase → Integrations → Cron.
   - Khi project Supabase bị tạm dừng (bước 6) thì cron cũng dừng, không có nhắc.
