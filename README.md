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
