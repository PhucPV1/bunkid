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

## Thiết lập lần đầu

1. Supabase project (Singapore); bật Google provider với OAuth client Web, redirect `https://<ref>.supabase.co/auth/v1/callback`.
2. Supabase → Auth → URL Configuration: Site URL `<APP_URL>`, Redirect URLs `<APP_URL>/auth/callback`, `http://localhost:3000/auth/callback`.
3. `bunx supabase link --project-ref <ref> && bunx supabase db push`.
4. Vercel: import repo, đặt `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Người đăng nhập đầu tiên tạo gia đình và thành chủ nhà; Gmail khác phải được chủ nhà thêm.
6. Gói Supabase Free tạm dừng project sau 7 ngày không có hoạt động: vào dashboard bấm Restore.
