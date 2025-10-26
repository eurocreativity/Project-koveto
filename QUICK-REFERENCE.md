# ⚡ GYORS REFERENCIA - ISPConfig Deployment
## Projekt Követő Rendszer - Cheat Sheet

---

## 🎯 TELEPÍTÉSI LÉPÉSEK GYORSNAVIGÁCIÓ

| # | Lépés | Időigény | Dokument | Oldal |
|---|-------|----------|----------|-------|
| 1 | Előkészítés | 10 perc | PRE-DEPLOYMENT-CHECKLIST.md | - |
| 2 | Node.js telepítés | 5 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §2.3 |
| 3 | PM2 telepítés | 2 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §2.4 |
| 4 | ISPConfig webhely | 15 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §3 |
| 5 | MySQL adatbázis | 10 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §4 |
| 6 | Backend setup | 15 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §5 |
| 7 | Frontend setup | 5 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §6 |
| 8 | Nginx config | 10 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §7 |
| 9 | SSL setup | 5 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §8 |
| 10 | PM2 indítás | 10 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §9 |
| 11 | Tesztelés | 15 perc | PRODUCTION-DEPLOYMENT-PLAN.md | §10 |

**TELJES IDŐIGÉNY:** ~100 perc (1 óra 40 perc)

---

## 📋 KRITIKUS PARANCSOK

### Node.js Telepítés
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v
```

### PM2 Telepítés
```bash
npm install -g pm2
pm2 -v
```

### Backend Indítás PM2-vel
```bash
cd /opt/project-tracker/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd
```

### Backend Restart
```bash
pm2 restart project-tracker-api
```

### Logok Megtekintése
```bash
pm2 logs project-tracker-api --lines 100
```

### Nginx Reload
```bash
nginx -t
systemctl reload nginx
```

### MySQL Adatbázis Import
```bash
mysql -u c1projekt_user -p c1projekt_tracker < schema.sql
```

---

## 🔑 FONTOS FÁJL ÚTVONALAK

| Fájl | Útvonal | Jogosultság |
|------|---------|-------------|
| Backend app | `/opt/project-tracker/backend/` | 755 |
| .env config | `/opt/project-tracker/backend/.env` | **600** |
| Frontend | `/var/www/clients/client0/web1/web/` | 644 |
| Nginx vhost | `/etc/nginx/sites-available/*.vhost` | 644 |
| PM2 logs | `/opt/project-tracker/backend/logs/` | 755 |
| ISPConfig | `/usr/local/ispconfig/` | - |
| MySQL data | `/var/lib/mysql/` | - |

---

## 🌐 KRITIKUS URL-EK ÉS PORTOK

| Szolgáltatás | URL/Port | Elérhetőség |
|--------------|----------|-------------|
| Frontend | `https://projekt.domain.hu` | Publikus |
| Backend API | `https://projekt.domain.hu/api/` | Publikus (proxy) |
| Socket.IO | `wss://projekt.domain.hu/socket.io/` | Publikus (WebSocket) |
| Backend direkt | `http://localhost:3001` | **Csak localhost** |
| ISPConfig | `https://server-ip:8080` | Publikus (admin) |
| MySQL | `localhost:3306` | **Csak localhost** |
| phpMyAdmin | ISPConfig → Database → phpMyAdmin | Admin |

---

## 🔐 .ENV KONFIGURÁCIÓ TEMPLATE

```bash
# /opt/project-tracker/backend/.env

NODE_ENV=production
PORT=3001

DB_HOST=localhost
DB_USER=c1projekt_user
DB_PASSWORD=ISPCONFIG_GENERALT_JELSZO
DB_NAME=c1projekt_tracker

JWT_SECRET=GENERALT_64_KARAKTERES_STRING
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://projekt.domain.hu

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

EMAIL_ENABLED=false
```

### JWT Secret Generálás
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔧 NGINX DIRECTIVES (ISPConfig)

**Hova:** ISPConfig → Sites → Website → Options → Nginx Directives

```nginx
# Backend API proxy
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
    proxy_buffering off;
}

# Socket.IO WebSocket
location /socket.io/ {
    proxy_pass http://localhost:3001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
    proxy_buffering off;
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

---

## 💾 BACKUP PARANCSOK

### Gyors Backup
```bash
# Backend
tar -czf backend-backup-$(date +%Y%m%d).tar.gz /opt/project-tracker/backend

# Adatbázis
mysqldump -u c1projekt_user -p c1projekt_tracker > db-backup-$(date +%Y%m%d).sql

# Frontend
tar -czf frontend-backup-$(date +%Y%m%d).tar.gz /var/www/clients/client0/web1/web
```

### Visszaállítás
```bash
# Backend
tar -xzf backend-backup-YYYYMMDD.tar.gz -C /

# Adatbázis
mysql -u c1projekt_user -p c1projekt_tracker < db-backup-YYYYMMDD.sql

# PM2 restart
pm2 restart project-tracker-api
```

---

## 🧪 GYORS TESZTELÉS

### Backend Health Check
```bash
curl https://projekt.domain.hu/api/health
# Várt: {"success":true,"message":"Server is running",...}
```

### Login Teszt
```bash
curl -X POST https://projekt.domain.hu/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
# Várt: {"success":true,"data":{"user":{...},"token":"eyJ..."}}
```

### PM2 Státusz
```bash
pm2 status
# Várt: project-tracker-api | online
```

### Nginx Teszt
```bash
nginx -t
# Várt: syntax is ok
```

### MySQL Kapcsolat
```bash
mysql -u c1projekt_user -p c1projekt_tracker -e "SHOW TABLES;"
# Várt: users, projects, tasks, settings
```

---

## 🐛 GYAKORI HIBÁK ÉS MEGOLDÁSOK

| Hiba | Ok | Gyors Megoldás |
|------|-------|---------------|
| `502 Bad Gateway` | Backend nem fut | `pm2 restart project-tracker-api` |
| `ECONNREFUSED 3306` | MySQL kapcsolat hiba | Ellenőrizd `.env` DB adatokat |
| `ER_ACCESS_DENIED` | Hibás MySQL jelszó | ISPConfig → Database → Reset password |
| `Port 3001 in use` | Port foglalt | `lsof -i :3001` majd `kill -9 PID` |
| `No token provided` | JWT hiba | Ellenőrizd `.env` JWT_SECRET |
| `SSL certificate error` | Let's Encrypt hiba | `certbot certonly --webroot ...` |
| `Socket.IO not working` | WebSocket proxy hiba | Nginx directives ellenőrzés |
| `PM2 errored` | Backend indítási hiba | `pm2 logs project-tracker-api` |

---

## 📊 PM2 PARANCSOK

| Parancs | Leírás |
|---------|--------|
| `pm2 start ecosystem.config.js --env production` | Backend indítás |
| `pm2 restart project-tracker-api` | Újraindítás |
| `pm2 stop project-tracker-api` | Leállítás |
| `pm2 delete project-tracker-api` | Törlés PM2-ből |
| `pm2 logs project-tracker-api` | Logok valós időben |
| `pm2 logs project-tracker-api --lines 100` | Utolsó 100 sor |
| `pm2 status` | Összes folyamat státusza |
| `pm2 monit` | Real-time monitor |
| `pm2 info project-tracker-api` | Részletes info |
| `pm2 save` | Jelenlegi állapot mentése |
| `pm2 startup systemd` | Auto-start beállítás |
| `pm2 resurrect` | Mentett állapot visszaállítás |

---

## 🔒 BIZTONSÁGI CHECKLIST

- [ ] `.env` fájl jogosultság: `chmod 600`
- [ ] Port 3001 CSAK localhost-ról elérhető
- [ ] UFW tűzfal engedélyezve: `ufw status`
- [ ] MySQL root remote login tiltva
- [ ] Fail2ban beállítva SSH-hoz
- [ ] Let's Encrypt SSL engedélyezve
- [ ] HTTP → HTTPS redirect bekapcsolva
- [ ] Security headers Nginx-ben
- [ ] Regular backup cron job beállítva
- [ ] PM2 auto-restart engedélyezve

---

## 📞 SUPPORT LINKEK

| Dokumentum | Leírás |
|------------|--------|
| `PRODUCTION-DEPLOYMENT-PLAN.md` | Részletes telepítési útmutató (13 fejezet) |
| `PRE-DEPLOYMENT-CHECKLIST.md` | Előkészítési ellenőrző lista |
| `DEPLOYMENT-STEP-BY-STEP.md` | Lépésről lépésre útmutató |
| `backend/README.md` | Backend dokumentáció |
| `CLAUDE.md` | Fejlesztői útmutató |
| `README.md` | Projekt áttekintés |

---

## ⚡ HOTFIX - Gyors Javítás

### Backend nem válaszol
```bash
pm2 restart project-tracker-api && pm2 logs project-tracker-api --lines 50
```

### Adatbázis kapcsolat hiba
```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'c1projekt%';"
nano /opt/project-tracker/backend/.env
pm2 restart project-tracker-api
```

### Nginx hiba
```bash
nginx -t
systemctl reload nginx
```

### SSL hiba
```bash
certbot renew
systemctl reload nginx
```

### Teljes Reset (Vészhelyzet)
```bash
pm2 delete project-tracker-api
cd /opt/project-tracker/backend
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 🎯 SIKERES TELEPÍTÉS ELLENŐRZÉS

**Minden működik, ha:**

1. ✅ `pm2 status` → `online`
2. ✅ `curl https://projekt.domain.hu/api/health` → `{"success":true}`
3. ✅ Böngészőben: `https://projekt.domain.hu` → Login oldal
4. ✅ Bejelentkezés `admin@example.com` / `password123` → Dashboard
5. ✅ Projekt létrehozás → Sikeres
6. ✅ 2 böngésző ablak → Real-time sync működik
7. ✅ F12 Console → Nincs hiba
8. ✅ SSL zöld lakat ikon
9. ✅ `nginx -t` → syntax ok
10. ✅ `systemctl status nginx` → active

---

**Nyomtatható verzió - mentsd el PDF-be!**
**Verzió:** 1.0 | **Dátum:** 2025-10-26
