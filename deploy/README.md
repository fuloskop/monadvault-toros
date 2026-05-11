# TOROS Games — Deploy (Coolify Auto-Deploy)

Bu app toroscs ile **aynı Coolify + Caddy + GHA pattern'i** kullanır. Manuel
SSH ile docker compose koşturmak YASAK — auto-deploy zincirine zarar verir.

```
GHA push (main)
   → frontend + backend Docker image'leri ghcr.io'ya push
   → Hetzner'a SSH ile pre-pull (race-condition guard)
   → Coolify webhook tetiklenir
   → Coolify compose'u up -d eder
   → Caddy `/games/*` ve `/games/api/*` path'lerini route eder
```

## Kullanıcı-tarafı setup (sadece BİR kez)

### 1. Coolify UI'da yeni Application oluştur

- **Project**: `torosclan` (toroscs ile aynı project)
- **Type**: Docker Compose (Git tabanlı)
- **Source**: GitHub → `fuloskop/monadvault-toros`
- **Branch**: `main`
- **Docker Compose location**: `/docker-compose.yml`
- **Domain — frontend service**: `https://torosclan.com/games` (path-based,
  Caddy otomatik route eder)
- **Domain — backend service**: `https://torosclan.com/games/api`

### 2. Coolify env vars (Application → Environment Variables)

```
MYSQL_ROOT_PASSWORD=<güçlü-32+-char>
MYSQL_PASSWORD=<güçlü-32+-char>
MYSQL_DATABASE=toros_games
MYSQL_USER=toros_games

# CRITICAL — toroscs'un SESSION_SECRET'iyle BİREBİR aynı
SESSION_SECRET=<toroscs'taki ile aynı>

ADMIN_STEAM_IDS=<senin-steam-id>,<arkadaşlarınınki>
JWT_SECRET=unused-but-required
```

### 3. Bu app için yeni Coolify UUID'yi al

Coolify UI → Application → Settings → "Webhooks" / URL'den UUID'yi kopyala.

### 4. GitHub repo secrets (Settings → Secrets and variables → Actions)

`fuloskop/monadvault-toros` repo'sunda 4 secret:

| Secret | Değer |
|---|---|
| `DEPLOY_KEY` | toroscs ile aynı SSH key (Hetzner root) |
| `DEPLOY_HOST` | toroscs ile aynı host (`hetzner.torosclan.com` vb.) |
| `COOLIFY_API_TOKEN` | toroscs ile aynı Coolify Bearer token |
| `GAMES_COOLIFY_UUID` | Adım 3'te aldığın yeni app UUID |

### 5. İlk migration + seed (sadece ilk kez)

Coolify UI → Application → "Execute Command" üzerinden:

```bash
# Schema oluştur
docker compose exec backend npx prisma migrate deploy

# byMykel'den 5 TOROS kasası seed
docker compose exec backend npm run db:seed
```

## Her commit sonrası

`main`'e push → GHA workflow tetiklenir → build + push + pre-pull + Coolify
webhook → Coolify compose'u restart eder → ~30sn içinde canlıda.

**Manuel müdahale**: YOK. SSH yok, `docker compose up` yok, `git pull` yok.

## Doğrulama

Browser'da test:

```
https://torosclan.com/games/         → frontend (Steam ile Giriş butonu)
https://torosclan.com/games/api/health  → {"status":"ok",...}
```

toroscs'a login olduktan sonra `/games/` yenilenirse session geçişi otomatik
(aynı cookie). Steam ile Giriş butonu kaybolup kullanıcı profilin sağ üstte
görünmeli.

## Soft-launch hatırlatma

**Toroscs navbar'ına "Oyunlar" linki onay öncesi EKLENMEZ.** URL'i bilen
girer ama listeli değil. `layout.tsx`'te `robots: { index: false }` ve
`/games/robots.txt` Disallow zaten kapalı.

## Upstream sync (manual, fork update)

```bash
# Lokalde
cd /Users/berkaymuvaffak/projects/monadvault-toros
git fetch upstream
git merge upstream/main
# Conflict çöz: TOROS branding, MySQL port, web3 disable, odataId→userId
# patches korunmalı.
git push origin main
# GHA otomatik build + deploy yapar.
```

## Rollback

Eğer canlıda problem olursa Coolify UI → Application → "Restart" + previous
deployment'ı seç. Veya Hetzner'da:

```bash
ssh root@<DEPLOY_HOST>
docker tag ghcr.io/fuloskop/monadvault-toros-frontend:rollback \
           ghcr.io/fuloskop/monadvault-toros-frontend:latest
docker tag ghcr.io/fuloskop/monadvault-toros-backend:rollback \
           ghcr.io/fuloskop/monadvault-toros-backend:latest
# Coolify UI'dan restart tetikle
```

## Bilinen pürüzler

- **Web3 kodu dormant**: bundle'da kalıyor, runtime'da kapalı
  (`NEXT_PUBLIC_WEB3_ENABLED=false` build-time bake'li)
- **byMykel ilk fetch**: skins.json ~15MB, ilk seed 10-30sn (sonra 24sa Redis
  cache)
- **Framer Motion + React 19 type warning** (`Button.tsx`) — pre-existing
  upstream, build geçiyor
