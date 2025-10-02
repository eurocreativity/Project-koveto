# 🚀 ISPConfig 3.2 Deployment Guide
**Projekt Követő Rendszer - Production Telepítési Útmutató**

---

## 📋 Előfeltételek

### Szerver követelmények
- Ubuntu 20.04 LTS / 22.04 LTS vagy Debian 11/12
- ISPConfig 3.2 telepítve és működik
- Root vagy sudo hozzáférés
- Minimum 2GB RAM, 2 CPU core
- 20GB szabad disk terület

### ISPConfig követelmények
- MySQL/MariaDB 10.x vagy MySQL 8.x
- Nginx webszerver
- PHP-FPM (ISPConfig alapból telepíti)
- SSL támogatás (Let's Encrypt)

### Lokális követelmények
- Git telepítve
- SSH kliens
- FTP/SFTP kliens (opcionális)

---

## ✅ Deployment Checklist

### 1. Szerver előkészítés
- [ ] SSH hozzáférés ellenőrzése
- [ ] ISPConfig admin hozzáférés ellenőrzése
- [ ] Domain DNS beállítások (A rekord)
- [ ] Node.js 20.x telepítése
- [ ] PM2 telepítése globálisan

### 2. ISPConfig konfiguráció
- [ ] Új webhely létrehozása
- [ ] Shell user létrehozása
- [ ] MySQL adatbázis létrehozása
- [ ] MySQL user létrehozása + jogosultságok
- [ ] SSL tanúsítvány aktiválása (Let's Encrypt)

### 3. Backend deployment
- [ ] Backend fájlok feltöltése
- [ ] npm install futtatása
- [ ] .env production konfiguráció
- [ ] MySQL schema import
- [ ] Demo adatok import (opcionális)
- [ ] PM2 indítás és autostart

### 4. Frontend deployment
- [ ] Frontend fájlok feltöltése web root-ba
- [ ] API endpoint URL frissítése index.html-ben
- [ ] Socket.IO URL frissítése

### 5. Nginx konfiguráció
- [ ] Reverse proxy beállítása (port 3001)
- [ ] WebSocket támogatás engedélyezése
- [ ] CORS headers beállítása
- [ ] Nginx reload

### 6. Tesztelés
- [ ] Backend health check (/api/health)
- [ ] Frontend betöltődik
- [ ] Login működik
- [ ] WebSocket kapcsolat működik
- [ ] CRUD műveletek tesztelése
- [ ] Multi-user szinkronizáció teszt

### 7. Monitoring
- [ ] PM2 status ellenőrzése
- [ ] Log fájlok elérhetősége
- [ ] Error monitoring beállítása

---

## 📦 1. Node.js 20.x telepítése

### Ubuntu/Debian szerveren
```bash
# NodeSource repository hozzáadása
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js telepítése
sudo apt-get install -y nodejs

# Verzió ellenőrzése
node -v  # v20.x.x
npm -v   # 10.x.x
```

### PM2 telepítése globálisan
```bash
sudo npm install -g pm2

# PM2 verzió ellenőrzése
pm2 -v

# PM2 startup script (autostart boot-nál)
sudo pm2 startup systemd -u <shell_user> --hp /home/<shell_user>
```

---

## 🌐 2. ISPConfig Webhely Létrehozása

### 2.1 ISPConfig Admin Panel
1. Bejelentkezés: `https://server.example.com:8080`
2. Navigáció: **Sites → Add new website**

### 2.2 Webhely beállítások
```
Domain: project-tracker.example.com
IPv4-Address: * (vagy dedikált IP)
IPv6-Address: * (ha van)
Auto-Subdomain: www
SSL: Yes (Let's Encrypt)
Let's Encrypt: Yes
PHP: Fast-CGI (bármelyik verzió)
```

**Save** gombra kattintás.

### 2.3 Shell User létrehozása
1. **Sites → Select website → Shell User tab**
2. Kattintás: **Add Shell User**
```
Username: project-tracker
Shell: /bin/bash
SSH-RSA: (opcionális - SSH kulcs feltöltése)
```

**Save** gombra kattintás.

### 2.4 Könyvtárstruktúra
ISPConfig automatikusan létrehozza:
```
/var/www/clients/client<X>/web<Y>/
├── web/           # Frontend (public_html)
│   └── index.html
├── private/       # Backend (nem publikus)
│   └── backend/
│       ├── src/
│       ├── node_modules/
│       ├── package.json
│       └── .env
├── log/           # Nginx access/error logok
└── tmp/
```

---

## 🗄️ 3. MySQL Adatbázis Létrehozása

### 3.1 ISPConfig Admin Panel
1. **Sites → Databases → Add new database**
```
Database Name: project_tracker
Database User: project_user
Password: <erős_jelszó_generálása>
Database Host: localhost
```

**Save** → Feljegyezni az adatokat!

### 3.2 Schema Import (SSH-n keresztül)
```bash
# SSH belépés shell userrel
ssh project-tracker@server.example.com

# MySQL séma importálása
mysql -u project_user -p project_tracker < /path/to/schema.sql

# Ellenőrzés
mysql -u project_user -p -e "USE project_tracker; SHOW TABLES;"
```

**Elvárt táblák:**
- users
- projects
- tasks
- settings (opcionális)

### 3.3 Demo adatok importálása (Opcionális)
```bash
# Demo users, projects, tasks feltöltése
mysql -u project_user -p project_tracker < /path/to/demo-data.sql
```

---

## 🔧 4. Backend Deployment

### 4.1 Fájlok feltöltése
```bash
# Lokális gépen (projekt mappában)
cd "f:\AI\Project koveto\backend"

# Tömörítés (node_modules nélkül!)
tar -czf backend.tar.gz --exclude=node_modules --exclude=test-results --exclude=.env src/ package.json ecosystem.config.js schema.sql

# Feltöltés SFTP-vel
sftp project-tracker@server.example.com
> cd private
> mkdir backend
> cd backend
> put backend.tar.gz
> bye

# Szerveren kicsomagolás
ssh project-tracker@server.example.com
cd ~/private/backend
tar -xzf backend.tar.gz
rm backend.tar.gz
```

### 4.2 npm install
```bash
cd ~/private/backend
npm install --production

# Ellenőrzés
ls -lh node_modules/  # ~200 package
```

### 4.3 .env Production konfiguráció
```bash
cd ~/private/backend
nano .env
```

**Tartalom (.env):**
```env
# Server
NODE_ENV=production
PORT=3001

# Database (MySQL/MariaDB)
DB_HOST=localhost
DB_USER=project_user
DB_PASSWORD=<ISPConfig_adatbázis_jelszó>
DB_NAME=project_tracker

# JWT Authentication
JWT_SECRET=<64_karakter_random_string_generálás>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://project-tracker.example.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**JWT_SECRET generálás:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4.4 Logs mappa létrehozása
```bash
cd ~/private/backend
mkdir -p logs
touch logs/out.log logs/err.log logs/combined.log
```

### 4.5 PM2 indítás
```bash
cd ~/private/backend

# Backend indítása PM2-vel (production mode)
pm2 start ecosystem.config.js --env production

# PM2 mentése (autostart)
pm2 save

# PM2 startup script (ha még nem történt meg)
sudo pm2 startup systemd -u project-tracker --hp /home/project-tracker

# Státusz ellenőrzése
pm2 status
pm2 logs project-tracker-api --lines 50
```

**Elvárt kimenet:**
```
┌─────┬────────────────────────┬─────────┬─────────┬──────────┬────────┬──────────┐
│ id  │ name                   │ mode    │ status  │ cpu      │ mem    │ watching │
├─────┼────────────────────────┼─────────┼─────────┼──────────┼────────┼──────────┤
│ 0   │ project-tracker-api    │ fork    │ online  │ 0%       │ 45.2mb │ disabled │
└─────┴────────────────────────┴─────────┴─────────┴──────────┴────────┴──────────┘
```

### 4.6 Health Check
```bash
curl http://localhost:3001/api/health
```

**Elvárt válasz:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-02T18:30:00.000Z",
  "uptime": 1234,
  "database": "connected"
}
```

---

## 🌍 5. Frontend Deployment

### 5.1 Frontend fájlok feltöltése
```bash
# Lokális gépen
cd "f:\AI\Project koveto\frontend"

# SFTP feltöltés
sftp project-tracker@server.example.com
> cd web
> put index.html
> bye
```

### 5.2 API URL frissítése (index.html)
```bash
# Szerveren
ssh project-tracker@server.example.com
cd ~/web
nano index.html
```

**Keresés és csere:**
```javascript
// ELŐTTE (local development)
const API_BASE_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// UTÁNA (production)
const API_BASE_URL = 'https://project-tracker.example.com/api';
const SOCKET_URL = 'https://project-tracker.example.com';
```

**Mentés:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## ⚙️ 6. Nginx Reverse Proxy Konfiguráció

### 6.1 ISPConfig Admin Panel
1. **Sites → Select website (project-tracker.example.com)**
2. **Options tab → Nginx Directives**

### 6.2 Nginx Directives beillesztése
```nginx
# Backend API reverse proxy (port 3001)
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
}

# Socket.IO WebSocket support
location /socket.io/ {
    proxy_pass http://localhost:3001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 86400;
}

# CORS headers (ha szükséges)
add_header 'Access-Control-Allow-Origin' 'https://project-tracker.example.com' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

**Save** gombra kattintás → ISPConfig automatikusan regenerálja az Nginx konfigot.

### 6.3 Nginx reload
```bash
# ISPConfig automatikusan újratölti, de manuálisan is ellenőrizhető
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 7. Telepítés Tesztelése

### 7.1 Backend Health Check
```bash
curl https://project-tracker.example.com/api/health
```

**Elvárt válasz:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-02T18:30:00.000Z",
  "uptime": 1234,
  "database": "connected"
}
```

### 7.2 Frontend betöltés
1. Böngészőben megnyitni: `https://project-tracker.example.com`
2. Landing page betöltődik → Dashboard látható
3. **Login gomb** kattintás
4. Bejelentkezés demo userrel:
   - Email: `admin@example.com`
   - Jelszó: `password123`

### 7.3 CRUD műveletek tesztelése
- ✅ Projekt létrehozása
- ✅ Feladat létrehozása
- ✅ Szerkesztés működik
- ✅ Törlés működik
- ✅ Szűrés működik

### 7.4 Real-time szinkronizáció teszt
1. Nyiss **2 böngésző tabot** (vagy 2 különböző böngészőt)
2. Mindkettőben jelentkezz be
3. Az egyikben hozz létre egy új projektet
4. A másik tab-ban **azonnal megjelenik** ✅

### 7.5 WebSocket connection ellenőrzése
**Böngésző DevTools (F12) → Console:**
```
Socket.IO kapcsolat létrejött ✅
Socket ID: abc123xyz
```

**Network tab:**
- Keresés: `socket.io`
- Státusz: `101 Switching Protocols` (WebSocket upgrade)

---

## 📊 8. Monitoring és Logok

### 8.1 PM2 monitoring
```bash
# Státusz
pm2 status

# Live logok
pm2 logs project-tracker-api

# CPU/Memory monitoring
pm2 monit

# Process info
pm2 info project-tracker-api
```

### 8.2 Log fájlok
```bash
# Backend logok
tail -f ~/private/backend/logs/out.log
tail -f ~/private/backend/logs/err.log

# Nginx access log
tail -f ~/log/access.log

# Nginx error log
tail -f ~/log/error.log
```

### 8.3 PM2 alapvető parancsok
```bash
# Újraindítás
pm2 restart project-tracker-api

# Leállítás
pm2 stop project-tracker-api

# Indítás
pm2 start project-tracker-api

# Törlés a listából
pm2 delete project-tracker-api

# Minden process törlése
pm2 delete all

# Mentett config frissítése
pm2 save
```

---

## 🔄 9. Update és Maintenance

### 9.1 Backend frissítés
```bash
# Lokális gépen: új backend.tar.gz készítése
cd "f:\AI\Project koveto\backend"
tar -czf backend.tar.gz --exclude=node_modules --exclude=test-results --exclude=.env src/ package.json

# Feltöltés
sftp project-tracker@server.example.com
> cd private/backend
> put backend.tar.gz
> bye

# Szerveren
ssh project-tracker@server.example.com
cd ~/private/backend

# PM2 leállítás
pm2 stop project-tracker-api

# Fájlok cseréje
tar -xzf backend.tar.gz
npm install --production

# PM2 újraindítás
pm2 restart project-tracker-api

# Logok ellenőrzése
pm2 logs project-tracker-api --lines 50
```

### 9.2 Frontend frissítés
```bash
# Lokális gépen
cd "f:\AI\Project koveto\frontend"

# SFTP feltöltés
sftp project-tracker@server.example.com
> cd web
> put index.html
> bye

# Cache ürítés böngészőben (Ctrl+Shift+R)
```

### 9.3 Adatbázis migráció
```bash
# Schema változások alkalmazása
ssh project-tracker@server.example.com
mysql -u project_user -p project_tracker < /path/to/migration.sql
```

### 9.4 SSL tanúsítvány megújítás
ISPConfig automatikusan megújítja a Let's Encrypt tanúsítványokat.

**Manuális megújítás (ha szükséges):**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 🔐 10. Biztonsági Ellenőrzőlista

- [ ] **.env fájl védett** (nem publikus könyvtárban)
- [ ] **JWT_SECRET erős** (64+ karakter random)
- [ ] **MySQL jelszó erős** (ISPConfig generált)
- [ ] **SSH kulcs authentikáció** (jelszó helyett)
- [ ] **SSL tanúsítvány aktív** (HTTPS)
- [ ] **Firewall konfiguráció** (csak 80, 443, 22 port)
- [ ] **PM2 futtatása nem-root userrel** (shell user)
- [ ] **Rate limiting aktív** (100 req / 15 min)
- [ ] **CORS beállítás pontos** (csak saját domain)
- [ ] **Nginx security headers** (ISPConfig default)

---

## ❌ 11. Troubleshooting

### Backend nem indul (PM2 error)
```bash
pm2 logs project-tracker-api --err --lines 100

# Gyakori okok:
# - Hibás .env konfiguráció
# - MySQL kapcsolat hiba
# - Port 3001 már foglalt
# - Hiányzó node_modules
```

**Megoldás:**
```bash
cd ~/private/backend
cat .env  # Ellenőrzés
mysql -u project_user -p -e "SELECT 1;"  # MySQL teszt
netstat -tuln | grep 3001  # Port ellenőrzés
npm install --production  # Reinstall dependencies
```

### Frontend 502 Bad Gateway
**Ok:** Backend nem fut vagy Nginx misconfiguration.

```bash
# Backend ellenőrzés
pm2 status
curl http://localhost:3001/api/health

# Nginx config teszt
sudo nginx -t
sudo systemctl status nginx
```

### Socket.IO connection failed
**Ok:** WebSocket proxy nincs beállítva vagy HTTPS/WSS eltérés.

**Megoldás:**
- Nginx Directives ellenőrzése (`/socket.io/` location block)
- HTTPS használata (nem HTTP)
- Böngésző console hibák nézése (F12)

### Database connection refused
**Ok:** Hibás DB credentials vagy MySQL nem fut.

```bash
# MySQL státusz
sudo systemctl status mysql

# Connection teszt
mysql -u project_user -p project_tracker -e "SHOW TABLES;"

# .env ellenőrzés
cat ~/private/backend/.env | grep DB_
```

---

## 📞 12. Support és Dokumentáció

### Hivatalos dokumentációk
- ISPConfig: https://www.ispconfig.org/documentation/
- PM2: https://pm2.keymetrics.io/docs/usage/quick-start/
- Node.js: https://nodejs.org/docs/
- Socket.IO: https://socket.io/docs/

### Projekt dokumentáció
- **README.md** - Projekt áttekintés
- **SESSION-STATUS.md** - Fejlesztési állapot
- **project-summary.md** - Teljes specifikáció
- **backend/README.md** - Backend API docs

### Hasznos parancsok gyűjteménye
```bash
# PM2
pm2 status
pm2 logs project-tracker-api
pm2 restart project-tracker-api
pm2 monit

# MySQL
mysql -u project_user -p project_tracker
SHOW TABLES;
SELECT * FROM users;

# Nginx
sudo nginx -t
sudo systemctl reload nginx
tail -f /var/log/nginx/error.log

# System
df -h         # Disk usage
free -h       # Memory usage
htop          # Process monitor
netstat -tuln # Port listening
```

---

## ✅ Deployment Sikeres!

Ha minden lépést követtél, az alkalmazás most élesben fut:

🌐 **URL:** https://project-tracker.example.com
🔐 **Login:** admin@example.com / password123
📊 **Health:** https://project-tracker.example.com/api/health
🔄 **PM2 Status:** `pm2 status`

**Következő lépések:**
1. Demo users törlése és éles felhasználók létrehozása
2. Backup stratégia beállítása (MySQL dump cronjob)
3. Monitoring beállítása (PM2 Plus, UptimeRobot, stb.)
4. Email értesítések beállítása (opcionális)
5. Nextcloud CalDAV integráció (tervezett funkció)

---

**Telepítés dátuma:** _______________
**Telepítette:** _______________
**Szerver:** _______________
**Domain:** _______________

---

🎉 **Gratulálok a sikeres deployment-hez!** 🎉
