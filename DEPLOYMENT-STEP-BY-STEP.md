# 🚀 ISPConfig Deployment - Lépésről Lépésre Útmutató
**Projekt Követő Rendszer - Telepítés kezdőktől**

---

## 📍 Jelenlegi helyzet
✅ Van egy működő ISPConfig 3.2 szervered
✅ Van SSH hozzáférésed
✅ Van ISPConfig admin hozzáférésed
✅ Projekt fájlok készen állnak lokálisan

---

## 🎯 Mit fogunk csinálni?

1. ✅ **Node.js telepítése** a szerverre (5 perc)
2. ✅ **ISPConfig webhely létrehozása** (5 perc)
3. ✅ **MySQL adatbázis beállítása** (5 perc)
4. ✅ **Backend telepítése** (10 perc)
5. ✅ **Frontend telepítése** (5 perc)
6. ✅ **Nginx konfiguráció** (5 perc)
7. ✅ **Tesztelés** (5 perc)

**Összes idő: ~40 perc**

---

## 📋 Szükséges információk (előkészítés)

Írdd fel ezeket, mert kelleni fognak:

```
ISPConfig Admin URL: https://______________________:8080
Admin felhasználónév: _______________________________
Admin jelszó: _______________________________________

Szerver SSH cím: ____________________________________
SSH felhasználónév (root): __________________________
SSH jelszó: _________________________________________

Domain név (amit használni fogsz): project._________.hu
```

---

## 🔧 1. LÉPÉS: Node.js 20.x Telepítése

### 1.1 SSH kapcsolódás
```bash
# Windows PowerShell vagy CMD
ssh root@your-server.com

# VAGY PuTTY-val
# Host: your-server.com
# Port: 22
# Username: root
```

### 1.2 Szerver verzió ellenőrzése
```bash
cat /etc/os-release
```

**Elvárt kimenet:**
```
Ubuntu 20.04 LTS vagy 22.04 LTS
VAGY
Debian 11 vagy 12
```

### 1.3 Node.js 20.x telepítése
```bash
# NodeSource repository hozzáadása
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Node.js telepítése
apt-get install -y nodejs

# Verzió ellenőrzése
node -v
# Elvárt: v20.x.x (pl. v20.11.0)

npm -v
# Elvárt: 10.x.x (pl. 10.2.4)
```

### 1.4 PM2 telepítése (process manager)
```bash
npm install -g pm2

# Verzió ellenőrzése
pm2 -v
# Elvárt: 5.x.x
```

**✅ CHECKPOINT 1:**
```bash
node -v && npm -v && pm2 -v
```
Ha mindhárom parancs működik és verziószámot ad vissza → **SIKERES** ✅

---

## 🌐 2. LÉPÉS: ISPConfig Webhely Létrehozása

### 2.1 ISPConfig Admin Panel megnyitása
1. Nyisd meg böngészőben: `https://your-server.com:8080`
2. Jelentkezz be admin userrel
3. Kattints: **Sites** menüpont

### 2.2 Új webhely létrehozása
1. **Sites → Website → Add new website**

2. **Domain tab:**
   ```
   Domain: project.example.hu
   IPv4-Address: * (válaszd ki a dropdown-ból)
   IPv6-Address: * (ha van)
   Auto-Subdomain: www
   ```

3. **SSL tab:**
   ```
   SSL: ✅ (pipáld be)
   Let's Encrypt SSL: ✅ (pipáld be)
   Let's Encrypt: ✅ (pipáld be)
   ```

4. **PHP tab:**
   ```
   PHP: Fast-CGI (bármelyik verzió, pl. 8.1)
   ```

5. Kattints: **Save** gomb (alul)

**⏳ Várj 1-2 percet** → ISPConfig létrehozza a könyvtárakat

### 2.3 Shell User létrehozása
1. **Sites → Website → Kattints az imént létrehozott website-ra**
2. Válaszd ki a **Shell User** tabot (felül)
3. Kattints: **Add Shell User** gomb

4. Töltsd ki:
   ```
   Username: project-tracker
   Password: <generálj egy erős jelszót>
   Shell: /bin/bash
   SSH-RSA: (hagyd üresen)
   ```

5. Kattints: **Save**

6. **FONTOS:** Jegyezd fel a shell user adatokat:
   ```
   Shell Username: project-tracker
   Shell Password: _________________________
   ```

### 2.4 Könyvtárstruktúra ellenőrzése
SSH-ban (root-ként):
```bash
# Találd meg a webhely könyvtárát
find /var/www -name "project.example.hu" -type d

# Elvárt kimenet:
# /var/www/clients/client1/web3
```

**Könyvtár struktúra (ISPConfig automatikusan létrehozta):**
```
/var/www/clients/client1/web3/
├── web/           ← Frontend ide kerül (index.html)
├── private/       ← Backend ide kerül (nem publikus!)
├── log/           ← Nginx logok
└── tmp/
```

**✅ CHECKPOINT 2:**
- Webhely látható ISPConfig-ban ✅
- Shell user létrehozva ✅
- Könyvtárak léteznek ✅

---

## 🗄️ 3. LÉPÉS: MySQL Adatbázis Beállítása

### 3.1 Adatbázis létrehozása ISPConfig-ban
1. **Sites → Database → Add new database**

2. Töltsd ki:
   ```
   Site: project.example.hu (válaszd ki dropdown-ból)
   Database name: project_tracker
   Database user: project_user
   Password: (kattints "Generate Password" gombra)
   Database charset: utf8mb4
   ```

3. **FONTOS:** Másold ki és mentsd el:
   ```
   Database Name: project_tracker
   Database User: project_user
   Database Password: _________________________________
   Database Host: localhost
   ```

4. Kattints: **Save**

### 3.2 MySQL Schema importálása
SSH-ban (root userrel):
```bash
# Belépés MySQL-be (teszt)
mysql -u project_user -p
# Írd be az ISPConfig által generált jelszót

# Adatbázis kiválasztása
USE project_tracker;

# Kilépés
EXIT;
```

**Schema fájl feltöltése:**

Lokális gépen (Windows PowerShell):
```powershell
# Irány: f:\AI\Project koveto\backend\
cd "f:\AI\Project koveto\backend"

# SFTP feltöltés
sftp root@your-server.com
```

SFTP-ben:
```bash
put schema.sql /tmp/schema.sql
bye
```

SSH-ban (root):
```bash
# Schema importálása
mysql -u project_user -p project_tracker < /tmp/schema.sql
# Írd be a jelszót

# Ellenőrzés
mysql -u project_user -p -e "USE project_tracker; SHOW TABLES;"
```

**Elvárt kimenet:**
```
+---------------------------+
| Tables_in_project_tracker |
+---------------------------+
| projects                  |
| tasks                     |
| users                     |
+---------------------------+
```

### 3.3 Demo adatok importálása
SSH-ban:
```bash
mysql -u project_user -p project_tracker << 'EOF'
-- Demo users
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@example.com', '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y', 'admin'),
('János Kovács', 'janos@example.com', '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y', 'user'),
('Anna Nagy', 'anna@example.com', '$2b$10$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y', 'user');

-- Demo projects
INSERT INTO projects (name, description, start_date, end_date, owner_id, status, color) VALUES
('Backend API fejlesztés', 'REST API és Socket.IO implementáció', '2025-10-01', '2025-10-15', 1, 'in_progress', '#667eea'),
('Frontend UI', 'Felhasználói felület tervezés és implementáció', '2025-10-05', '2025-10-20', 2, 'open', '#f093fb'),
('ISPConfig Deployment', 'Production környezet beállítása', '2025-10-10', '2025-10-12', 1, 'in_progress', '#4facfe');

-- Demo tasks
INSERT INTO tasks (project_id, name, description, start_date, deadline, owner_id, status, priority) VALUES
(1, 'Auth API endpoint', 'JWT authentikáció implementálása', '2025-10-01', '2025-10-03', 1, 'completed', 'high'),
(1, 'Project CRUD', 'Projekt kezelés végpontok', '2025-10-02', '2025-10-05', 1, 'in_progress', 'high'),
(2, 'Dashboard UI', 'Főoldal tervezése', '2025-10-05', '2025-10-08', 2, 'open', 'medium');
EOF
```

**Jelszó mindhárom userhez:** `password123`

**✅ CHECKPOINT 3:**
```bash
mysql -u project_user -p -e "USE project_tracker; SELECT COUNT(*) FROM users;"
# Elvárt: 3

mysql -u project_user -p -e "USE project_tracker; SELECT COUNT(*) FROM projects;"
# Elvárt: 3
```

---

## 📦 4. LÉPÉS: Backend Telepítése

### 4.1 Fájlok feltöltése

**Lokális gépen (Windows PowerShell):**
```powershell
cd "f:\AI\Project koveto\backend"

# Backend csomagolása (node_modules nélkül!)
tar -czf backend-deploy.tar.gz --exclude=node_modules --exclude=test-results --exclude=.env --exclude=*.spec.js src/ package.json package-lock.json ecosystem.config.js

# SFTP kapcsolódás
sftp project-tracker@your-server.com
```

**SFTP-ben:**
```bash
# Irány a private mappába
cd private

# Backend mappa létrehozása
mkdir backend

cd backend

# Fájl feltöltése
put backend-deploy.tar.gz

# Kilépés
bye
```

### 4.2 Backend kicsomagolása és telepítése

**SSH kapcsolódás shell userrel:**
```bash
# FONTOS: NE root-ként, hanem shell userként!
ssh project-tracker@your-server.com
```

**Shell userként:**
```bash
cd ~/private/backend

# Tartalom kicsomagolása
tar -xzf backend-deploy.tar.gz

# Törlés
rm backend-deploy.tar.gz

# Ellenőrzés
ls -la
# Látnod kell: src/ package.json ecosystem.config.js

# npm install
npm install --production

# Ez eltart ~1-2 percig, várj türelemmel!
```

### 4.3 .env fájl létrehozása

**Shell userként:**
```bash
cd ~/private/backend

# .env fájl létrehozása
nano .env
```

**Másold be ezt (FONTOS: cseréld ki az értékeket!):**
```env
# Server
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_USER=project_user
DB_PASSWORD=<ISPConfig_adatbázis_jelszó_ide>
DB_NAME=project_tracker

# JWT Authentication
JWT_SECRET=<generáld_le_alább>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://project.example.hu

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**JWT_SECRET generálása:**
```bash
# Nyiss egy MÁSIK SSH ablakot vagy új terminált
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Kimenet példa:
# 7a8f3b2e9c1d4a5f6e8b7c9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b

# Másold be ezt a JWT_SECRET-hez
```

**Mentés:**
- `Ctrl + O` (mentés)
- `Enter`
- `Ctrl + X` (kilépés)

### 4.4 Log mappa létrehozása
```bash
cd ~/private/backend

mkdir -p logs
touch logs/out.log logs/err.log logs/combined.log

# Jogosultságok
chmod 755 logs
```

### 4.5 PM2 indítás

```bash
cd ~/private/backend

# Backend indítása production mode-ban
pm2 start ecosystem.config.js --env production

# Mentés (autostart beállítása)
pm2 save

# Státusz
pm2 status
```

**Elvárt kimenet:**
```
┌─────┬────────────────────────┬─────────┬─────────┬──────────┬────────┐
│ id  │ name                   │ mode    │ status  │ cpu      │ mem    │
├─────┼────────────────────────┼─────────┼─────────┼──────────┼────────┤
│ 0   │ project-tracker-api    │ fork    │ online  │ 0%       │ 45mb   │
└─────┴────────────────────────┴─────────┴─────────┴──────────┴────────┘
```

**Ha `online` státuszt látsz → SIKERES!** ✅

### 4.6 Logok ellenőrzése
```bash
pm2 logs project-tracker-api --lines 20
```

**Elvárt kimenet:**
```
✅ MySQL database connected successfully
==================================================
🚀 Project Tracker API Server
==================================================
📡 Server running on port 3001
🌍 Environment: production
🔗 API URL: http://localhost:3001/api
💾 Database: project_tracker
⚡ Socket.IO: Enabled
==================================================
```

### 4.7 Health check (localhost)
```bash
curl http://localhost:3001/api/health
```

**Elvárt válasz:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-02T20:00:00.000Z",
  "uptime": 123,
  "database": "connected"
}
```

**✅ CHECKPOINT 4:**
- PM2 status: `online` ✅
- Logokban: "Server running on port 3001" ✅
- Health check válaszol ✅

---

## 🌍 5. LÉPÉS: Frontend Telepítése

### 5.1 API URL frissítése index.html-ben

**Lokális gépen (Windows):**
```powershell
cd "f:\AI\Project koveto\frontend"

# Nyisd meg index.html szövegszerkesztőben
notepad index.html
```

**Keresés (Ctrl+F):**
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

**Csere erre (FONTOS: saját domain!):**
```javascript
const API_BASE_URL = 'https://project.example.hu/api';
```

**Keresés:**
```javascript
const SOCKET_URL = 'http://localhost:3001';
```

**Csere:**
```javascript
const SOCKET_URL = 'https://project.example.hu';
```

**Mentés:** `Ctrl + S`

### 5.2 Frontend feltöltése

**PowerShell:**
```powershell
cd "f:\AI\Project koveto\frontend"

# SFTP
sftp project-tracker@your-server.com
```

**SFTP-ben:**
```bash
# Irány a web mappába
cd web

# index.html feltöltése
put index.html

# Ellenőrzés
ls -la

# Kilépés
bye
```

### 5.3 Fájl jogosultságok ellenőrzése

**SSH-ban (shell userként):**
```bash
cd ~/web

# Jogosultságok ellenőrzése
ls -la index.html

# Elvárt: -rw-r--r-- (644)

# Ha nem jó, javítsd:
chmod 644 index.html
```

**✅ CHECKPOINT 5:**
```bash
ls -la ~/web/index.html
# Fájl létezik és 644 jogosultsággal ✅
```

---

## ⚙️ 6. LÉPÉS: Nginx Reverse Proxy Konfiguráció

### 6.1 ISPConfig Admin Panel
1. Nyisd meg: `https://your-server.com:8080`
2. **Sites → Website → project.example.hu (kattints rá)**
3. Kattints az **Options** tabra (felül)
4. Görgets le az **Nginx Directives** mezőig

### 6.2 Nginx Directives beillesztése

**Másold be ezt a teljes tartalmat:**
```nginx
# Backend API reverse proxy
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

# Socket.IO WebSocket
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
```

### 6.3 Mentés és alkalmazás
1. Kattints: **Save** gomb (alul)
2. **Várj 10-15 másodpercet** → ISPConfig újragenerálja az Nginx konfigot

### 6.4 Nginx teszt (SSH root-ként)
```bash
# Válts vissza root-ra
exit  # Kilépés shell userből
ssh root@your-server.com

# Nginx konfig teszt
nginx -t

# Elvárt kimenet:
# nginx: configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Nginx reload
systemctl reload nginx

# Státusz
systemctl status nginx
```

**✅ CHECKPOINT 6:**
- Nginx directives mentve ISPConfig-ban ✅
- `nginx -t` sikeres ✅
- Nginx reload sikeres ✅

---

## 🧪 7. LÉPÉS: Tesztelés

### 7.1 Backend API teszt (külső elérés)

**PowerShell (lokális gépen):**
```powershell
curl https://project.example.hu/api/health
```

**Elvárt válasz:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-02T20:00:00.000Z",
  "uptime": 1234,
  "database": "connected"
}
```

### 7.2 Frontend teszt

**Böngészőben nyisd meg:**
```
https://project.example.hu
```

**Mit kell látnod:**
1. 🎨 Landing page betöltődik (glassmorphism design)
2. 📊 Dashboard látható (3 projekt kártya)
3. 🔐 "Bejelentkezés" gomb látható

### 7.3 Bejelentkezés teszt

1. Kattints: **Bejelentkezés** gomb
2. Email: `admin@example.com`
3. Jelszó: `password123`
4. Kattints: **Bejelentkezés**

**Elvárt:**
- ✅ Sikeres bejelentkezés
- ✅ Átirányít a Dashboard-ra
- ✅ Látod a projekteket és feladatokat
- ✅ Console-ban (F12): "Socket.IO kapcsolat létrejött ✅"

### 7.4 CRUD műveletek teszt

**Új projekt létrehozása:**
1. Kattints: **Projektek** tab
2. Kattints: **+ Új Projekt** gomb
3. Töltsd ki az űrlapot:
   - Név: "Teszt Projekt"
   - Leírás: "Deployment teszt"
   - Kezdő dátum: ma
   - Befejezés: 7 nap múlva
   - Felelős: Admin User
   - Szín: válassz egy színt
4. Kattints: **Mentés**

**Elvárt:**
- ✅ Értesítés: "Projekt sikeresen létrehozva"
- ✅ Projekt megjelenik a listában
- ✅ Naptárban is látható

### 7.5 Real-time szinkronizáció teszt

1. **Nyiss MEG EGY MÁSIK BÖNGÉSZŐ TABOT** (vagy inkognitó ablak)
2. Jelentkezz be ugyanazzal a userrel
3. Az **első tab-ban** hozz létre egy új projektet
4. **A második tab-ban AZONNAL** meg kell jelennie!

**Ha megjelenik → Real-time sync működik!** ✅

### 7.6 WebSocket ellenőrzés

**Böngésző DevTools (F12) → Network tab:**
1. Szűrő: `WS` (WebSocket)
2. Keress: `socket.io`
3. Státusz: `101 Switching Protocols`

**Console tab:**
```
Socket.IO kapcsolat létrejött ✅
Socket ID: abc123xyz
```

**✅ CHECKPOINT 7:**
- Frontend betöltődik ✅
- Login működik ✅
- CRUD műveletek működnek ✅
- Real-time sync működik ✅
- WebSocket kapcsolat aktív ✅

---

## 🎉 GRATULÁLOK! SIKERES TELEPÍTÉS!

### 📊 Összefoglaló

✅ **Node.js 20.x + PM2** telepítve
✅ **ISPConfig webhely** létrehozva
✅ **MySQL adatbázis** konfigurálva + demo adatok
✅ **Backend API** fut PM2-vel (port 3001)
✅ **Frontend** kiszolgálva Nginx-en keresztül
✅ **Nginx reverse proxy** beállítva
✅ **SSL tanúsítvány** aktív (Let's Encrypt)
✅ **WebSocket kapcsolat** működik
✅ **Real-time szinkronizáció** működik

---

## 📝 Fontos Információk (Mentsd El!)

```
==============================================
PROJEKT KÖVETŐ - PRODUCTION ENVIRONMENT
==============================================

Frontend URL: https://project.example.hu
Backend API: https://project.example.hu/api
Health Check: https://project.example.hu/api/health

SSH Shell User: project-tracker@your-server.com
Backend Location: ~/private/backend
Frontend Location: ~/web

MySQL Database: project_tracker
MySQL User: project_user
MySQL Password: _______________________

Demo Users:
- admin@example.com / password123 (admin)
- janos@example.com / password123 (user)
- anna@example.com / password123 (user)

PM2 Commands:
- pm2 status
- pm2 logs project-tracker-api
- pm2 restart project-tracker-api
- pm2 monit

==============================================
```

---

## 🔄 Következő Lépések

### 1. Biztonsági Beállítások
```bash
# SSH shell userként
cd ~/private/backend

# .env fájl jogosultság (csak owner olvashatja)
chmod 600 .env

# Demo users törlése (később)
# mysql -u project_user -p project_tracker
# DELETE FROM users WHERE email LIKE '%@example.com';
```

### 2. PM2 Autostart Beállítása
```bash
# Root-ként
ssh root@your-server.com

# PM2 startup script
pm2 startup systemd -u project-tracker --hp /home/project-tracker

# Másold ki és futtasd a parancsot amit kiír!
# Példa:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u project-tracker --hp /home/project-tracker
```

### 3. Backup Stratégia
```bash
# MySQL dump cronjob (root-ként)
crontab -e

# Adj hozzá egy sort:
0 2 * * * mysqldump -u project_user -p'JELSZÓ' project_tracker > /backup/project_tracker_$(date +\%Y\%m\%d).sql
```

### 4. Monitoring
- **UptimeRobot**: https://uptimerobot.com (ingyenes 50 monitor)
  - Figyelje: `https://project.example.hu/api/health`
  - Email értesítés ha leáll

### 5. Update Folyamat (Később)
```bash
# Lokális gépen
cd "f:\AI\Project koveto"
./deploy.sh full

# VAGY manuálisan
./deploy.sh backend
./deploy.sh frontend
```

---

## 🆘 Hibaelhárítás

### Backend nem indul (PM2 error)
```bash
# Logok
pm2 logs project-tracker-api --err --lines 50

# Gyakori hibák:
# 1. Hibás .env (DB_PASSWORD)
# 2. MySQL nem elérhető
# 3. Port 3001 foglalt

# Megoldás:
cd ~/private/backend
cat .env  # Ellenőrizd
mysql -u project_user -p  # Teszt
netstat -tuln | grep 3001  # Port check
pm2 restart project-tracker-api
```

### Frontend 502 Bad Gateway
```bash
# Backend státusz
pm2 status

# Ha offline:
pm2 restart project-tracker-api
pm2 logs project-tracker-api

# Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Socket.IO nem kapcsolódik
1. **F12 → Console** → Hibakereső üzenetek
2. Ellenőrizd: `SOCKET_URL` helyes-e index.html-ben
3. Nginx directives ISPConfig-ban megvannak-e
4. `sudo systemctl reload nginx`

### SSL hiba
```bash
# ISPConfig → Sites → SSL tab
# Let's Encrypt SSL: ✅ (pipáld be újra)
# Save

# Vagy CLI:
sudo certbot renew
sudo systemctl reload nginx
```

---

## 📞 Support

### Dokumentációk
- **Teljes deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API dokumentáció**: [backend/README.md](./backend/README.md)
- **Projekt specifikáció**: [project-summary.md](./project-summary.md)

### Hasznos Parancsok Gyűjtemény
```bash
# === PM2 ===
pm2 status
pm2 logs project-tracker-api
pm2 restart project-tracker-api
pm2 monit
pm2 info project-tracker-api

# === MySQL ===
mysql -u project_user -p project_tracker
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM projects;

# === Nginx ===
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx
tail -f /var/www/clients/client1/web3/log/access.log
tail -f /var/www/clients/client1/web3/log/error.log

# === System ===
df -h          # Disk usage
free -h        # Memory
htop           # Process monitor
netstat -tuln  # Port listening
```

---

## ✅ Deployment Checklist (Utolsó Ellenőrzés)

- [ ] Node.js 20.x telepítve (`node -v`)
- [ ] PM2 telepítve (`pm2 -v`)
- [ ] ISPConfig webhely létrehozva
- [ ] Shell user létrehozva
- [ ] MySQL adatbázis + táblák léteznek
- [ ] Backend feltöltve + npm install
- [ ] .env fájl konfigurálva (DB jelszó, JWT secret, CORS)
- [ ] PM2 online státusz
- [ ] Frontend feltöltve + API URL frissítve
- [ ] Nginx directives beállítva ISPConfig-ban
- [ ] SSL tanúsítvány aktív (HTTPS működik)
- [ ] Backend API health check válaszol
- [ ] Frontend betöltődik
- [ ] Login működik
- [ ] CRUD műveletek működnek
- [ ] Socket.IO kapcsolat működik
- [ ] Real-time sync működik két tab között

**Ha minden pipálva → SIKERES DEPLOYMENT!** 🎉

---

**Deployment dátuma:** _______________
**Telepítette:** _______________
**Szerver:** _______________
**Domain:** _______________
**Notes:** _________________________________

---

**🚀 Élvezd az új Project Tracker alkalmazást!** 🚀
