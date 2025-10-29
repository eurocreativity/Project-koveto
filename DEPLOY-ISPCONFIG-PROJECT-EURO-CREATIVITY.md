# 🚀 ISPConfig Deployment Guide - project.euro-creativity.com

**Projekt:** Projekt Követő Rendszer
**Target Domain:** `project.euro-creativity.com`
**Server:** ISPConfig 3.x + Apache + MySQL
**Becsült idő:** 90-120 perc
**Dátum:** 2025-10-29

---

## 📋 Előfeltételek Checklist

Mielőtt elkezdjük, győződj meg róla, hogy ezek mind megvannak:

- [ ] SSH hozzáférés a szerverhez (root vagy sudo)
- [ ] ISPConfig admin hozzáférés (https://server-ip:8080)
- [ ] `euro-creativity.com` domain ISPConfig-ban létezik
- [ ] MySQL/MariaDB fut a szerveren
- [ ] Apache webserver fut
- [ ] Node.js v18+ telepítve (vagy telepítjük most)
- [ ] Git telepítve a szerveren

---

## 🎯 Deployment Architektúra

```
┌─────────────────────────────────────────────────────────┐
│  project.euro-creativity.com (HTTPS)                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Apache Reverse Proxy         │
        │  - Frontend: /                │
        │  - Backend API: /api/*        │
        │  - WebSocket: /socket.io/*    │
        └───────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  Frontend       │         │  Backend        │
│  (Static HTML)  │         │  (Node.js)      │
│  /var/www/      │         │  Port 3001      │
│  project/       │         │  PM2 managed    │
│  public/        │         │                 │
└─────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  MySQL Database │
                            │  project_tracker│
                            └─────────────────┘
```

---

## 📝 STEP-BY-STEP DEPLOYMENT

---

### STEP 1: SSH Bejelentkezés és Előkészítés (5 perc)

```bash
# 1.1 SSH bejelentkezés (cseréld ki a szerver IP-re)
ssh root@your-server-ip

# 1.2 Rendszer frissítés
apt update && apt upgrade -y

# 1.3 Ellenőrizd a telepített szoftvereket
echo "=== Apache verzió ==="
apache2 -v

echo "=== PHP verzió ==="
php -v

echo "=== MySQL verzió ==="
mysql -V

echo "=== Node.js verzió ==="
node -v || echo "Node.js NINCS telepítve - telepítjük később"

echo "=== Git verzió ==="
git --version || apt install -y git
```

**Eredmény ellenőrzés:**
- ✅ Apache 2.4.x
- ✅ PHP 7.4+ vagy 8.x
- ✅ MySQL 8.0 vagy MariaDB 10.x
- ⚠️ Node.js (ha nincs, lépj a 2.1-re)

---

### STEP 2: Node.js és PM2 Telepítése (10 perc)

#### 2.1 Node.js 20.x telepítése (ha nincs vagy régi)

```bash
# Node.js 20.x repository hozzáadása
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Node.js és npm telepítése
apt-get install -y nodejs

# Verzió ellenőrzés
node -v     # Elvárt: v20.x.x
npm -v      # Elvárt: 10.x.x

# Build tools telepítése (bcrypt compilation-hoz kell)
apt-get install -y build-essential
```

#### 2.2 PM2 Process Manager telepítése

```bash
# PM2 globális telepítése
npm install -g pm2

# PM2 verzió ellenőrzés
pm2 -v     # Elvárt: 5.x.x

# PM2 startup script (hogy restart után is fusson)
pm2 startup systemd
# FONTOS: Futtasd le a parancsot amit kiír!

# PM2 log rotation setup
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

### STEP 3: ISPConfig - Subdomain Létrehozása (10 perc)

#### 3.1 Bejelentkezés ISPConfig-ba

1. Nyisd meg böngészőben: `https://your-server-ip:8080`
2. Jelentkezz be admin userrel

#### 3.2 Subdomain létrehozása

**Navigáció:** Sites → Websites → Add new website

**Beállítások:**

| Mező | Érték |
|------|-------|
| **Domain** | `project.euro-creativity.com` |
| **IP Address** | `*` (minden IP) |
| **IPv6** | `*` |
| **Auto-Subdomain** | `www` vagy `none` |
| **SSL** | ☑ Let's Encrypt SSL |
| **Let's Encrypt** | ☑ Enable |
| **PHP** | PHP-FPM (latest version) |
| **Active** | ☑ Yes |

**Directory paths (Auto-filled):**
```
/var/www/clients/client1/web[X]/web
```
Jegyezd fel ezt az utat! (pl. `/var/www/clients/client1/web5/web`)

#### 3.3 SSL Certificate generálás

1. Mentsd el a website-ot
2. Várj 2-3 percet
3. Ellenőrizd: **Options** tab → **SSL** → Status: "Let's Encrypt OK"

---

### STEP 4: MySQL Adatbázis Létrehozása (10 perc)

#### 4.1 Adatbázis létrehozása ISPConfig-ban

**Navigáció:** Sites → Databases → Add new database

| Mező | Érték |
|------|-------|
| **Site** | project.euro-creativity.com |
| **Database Name** | `project_tracker` |
| **Database User** | `project_user` |
| **Database Password** | **[Generálj erős jelszót!]** |
| **Active** | ☑ Yes |

**Jelszó generálás (SSH-n):**
```bash
openssl rand -base64 32
```

**FONTOS:** Jegyezd fel:
- Database name: `c1_project_tracker` (ISPConfig prefix + your name)
- Username: `c1_project_user` (ISPConfig prefix + your username)
- Password: `[generált jelszó]`

#### 4.2 Schema importálás

```bash
# MySQL bejelentkezés
mysql -u root -p

# Database kiválasztása (cseréld a prefix-et!)
USE c1_project_tracker;

# Ellenőrizd, hogy üres
SHOW TABLES;
# Kimenet: Empty set (0.00 sec)
```

Most importáljuk a schemát később (STEP 6 után, amikor már van a kód).

---

### STEP 5: Projekt Könyvtárak Létrehozása (5 perc)

```bash
# Navigálj a webroot-ba (cseréld a client/web számot!)
cd /var/www/clients/client1/web5

# Könyvtár struktúra létrehozása
mkdir -p web/projekt-koveto
mkdir -p private/backend

# Tulajdonos beállítása (ISPConfig user)
# web5 esetén a user általában: web5
chown -R web5:client1 web/projekt-koveto
chown -R web5:client1 private/backend

# Jogosultságok
chmod -R 755 web/projekt-koveto
chmod -R 755 private/backend

# Ellenőrzés
ls -la web/
ls -la private/
```

---

### STEP 6: Kód Letöltése Git-ről (10 perc)

```bash
# Navigálj a backend könyvtárba
cd /var/www/clients/client1/web5/private/backend

# Git clone (cseréld a branch-re ha kell)
git clone https://github.com/eurocreativity/Project-koveto.git .

# Ellenőrizd
ls -la
# Látszódnia kell: backend/, frontend/, *.md fájloknak

# Frontend fájlok másolása a public web könyvtárba
cp -r frontend/* ../../web/projekt-koveto/

# Ellenőrzés
ls -la ../../web/projekt-koveto/
# Látszódnia kell: index.html
```

---

### STEP 7: Backend Dependencies Telepítése (10 perc)

```bash
# Navigálj a backend könyvtárba
cd /var/www/clients/client1/web5/private/backend/backend

# npm install
npm install --production

# Ellenőrzés - paketek száma
ls -la node_modules/ | wc -l
# Elvárt: ~180 csomag

# Tesztelés (ha hiba van, javítsd)
node -e "console.log('Node.js működik!')"
```

---

### STEP 8: Environment Variables Konfigurálása (15 perc)

```bash
# .env fájl létrehozása
cd /var/www/clients/client1/web5/private/backend/backend
nano .env
```

**Másold be ezt (cseréld az értékeket!):**

```bash
# Node environment
NODE_ENV=production
PORT=3001

# Database (ISPConfig prefix-szel!)
DB_HOST=localhost
DB_USER=c1_project_user
DB_PASSWORD=YOUR_GENERATED_PASSWORD_HERE
DB_NAME=c1_project_tracker

# JWT Secret (generálj új erős secret-et!)
JWT_SECRET=YOUR_STRONG_64_CHAR_SECRET_HERE
JWT_EXPIRES_IN=7d

# CORS Origin (FONTOS: a domain-del!)
CORS_ORIGIN=https://project.euro-creativity.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (opcionális - beállíthatod később)
EMAIL_ENABLED=false
EMAIL_FROM=Projekt Követő <noreply@euro-creativity.com>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

**JWT_SECRET generálás:**
```bash
# Generálj 64 karakteres secret-et
openssl rand -base64 64
```

**Mentsd el:** Ctrl+O, Enter, Ctrl+X

**Jogosultságok beállítása:**
```bash
chmod 600 .env
chown web5:client1 .env
```

---

### STEP 9: MySQL Schema és Demo Data Importálás (10 perc)

```bash
# Navigálj a backend könyvtárba
cd /var/www/clients/client1/web5/private/backend/backend

# Schema importálás (cseréld a DB neveket!)
mysql -u c1_project_user -p c1_project_tracker < schema.sql

# Demo data importálás (OPCIONÁLIS - csak teszteléshez!)
mysql -u c1_project_user -p c1_project_tracker < seed-demo-data.sql

# Ellenőrzés
mysql -u c1_project_user -p c1_project_tracker -e "SHOW TABLES;"
```

**Kimenet ellenőrzés:**
```
+---------------------------+
| Tables_in_c1_project_tracker |
+---------------------------+
| projects                  |
| settings                  |
| tasks                     |
| users                     |
+---------------------------+
```

**User jelszavak frissítése (demo users):**
```bash
# Futtasd ezt (Admin123 jelszó minden usernek)
mysql -u c1_project_user -p c1_project_tracker -e "
UPDATE users
SET password_hash = '\$2b\$10\$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y'
WHERE email IN ('admin@example.com', 'janos@example.com', 'anna@example.com');
"

# Ellenőrzés
mysql -u c1_project_user -p c1_project_tracker -e "SELECT id, name, email FROM users;"
```

---

### STEP 10: PM2 Backend Indítása (10 perc)

```bash
# Navigálj a backend könyvtárba
cd /var/www/clients/client1/web5/private/backend/backend

# PM2 ecosystem fájl ellenőrzése
cat ecosystem.config.js
# Ha nincs ilyen fájl, létrehozzuk:
```

**ecosystem.config.js létrehozása:**
```bash
nano ecosystem.config.js
```

**Tartalom:**
```javascript
module.exports = {
  apps: [{
    name: 'project-tracker-api',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false
  }]
};
```

**Mentsd el és indítsd el:**
```bash
# Logs könyvtár létrehozása
mkdir -p logs

# PM2 indítás
pm2 start ecosystem.config.js --env production

# PM2 startup beállítása (hogy restart után is fusson)
pm2 save
pm2 startup systemd
# Futtasd le a parancsot amit kiír!

# Ellenőrzés
pm2 status
pm2 logs project-tracker-api --lines 50

# Endpoint teszt
curl http://localhost:3001/api/health
# Elvárt válasz: {"success":true,"message":"Project Tracker API is running"...}
```

**Ha hiba van:**
```bash
# Nézd meg a logokat
pm2 logs project-tracker-api

# Gyakori hibák:
# 1. MySQL connection error → ellenőrizd .env DB_* változókat
# 2. Port already in use → kill a másik process-t: lsof -ti:3001 | xargs kill
# 3. Permission denied → chown web5:client1 -R .
```

---

### STEP 11: Apache Reverse Proxy Konfigurálása (15 perc)

#### 11.1 Apache modulok engedélyezése

```bash
# Proxy modulok engedélyezése
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel  # WebSocket support
a2enmod rewrite
a2enmod ssl
a2enmod headers

# Apache restart
systemctl restart apache2

# Ellenőrzés
apache2ctl -M | grep proxy
# Kimenet:
#  proxy_module (shared)
#  proxy_http_module (shared)
#  proxy_wstunnel_module (shared)
```

#### 11.2 ISPConfig Apache Directives konfigurálása

**ISPConfig Admin Panel:**
1. Sites → Websites → `project.euro-creativity.com` → **Options** tab
2. Görgess le az **Apache Directives** mezőig

**Másold be ezt:**

```apache
# Backend API Reverse Proxy (REST)
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyRequests Off

    # API endpoints
    ProxyPass /api http://127.0.0.1:3001/api
    ProxyPassReverse /api http://127.0.0.1:3001/api

    # Socket.IO WebSocket
    ProxyPass /socket.io http://127.0.0.1:3001/socket.io
    ProxyPassReverse /socket.io http://127.0.0.1:3001/socket.io

    # WebSocket upgrade headers
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /socket.io/(.*) ws://127.0.0.1:3001/socket.io/$1 [P,L]

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Frontend - Serve static files
<Directory /var/www/clients/client1/web5/web/projekt-koveto>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted

    # Frontend routing (SPA support)
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api
    RewriteCond %{REQUEST_URI} !^/socket.io
    RewriteRule . /index.html [L]
</Directory>
```

**Mentsd el (Save button)**

#### 11.3 Dokumentum root beállítása

**Ugyanazon az oldalon (Options tab):**

Keresd meg a **Document Root** mezőt és módosítsd:

```
/var/www/clients/client1/web5/web/projekt-koveto
```

**Mentsd el.**

#### 11.4 Apache config teszt és restart

```bash
# Apache konfigurációs teszt
apachectl configtest
# Elvárt: Syntax OK

# Apache restart
systemctl restart apache2

# Státusz ellenőrzés
systemctl status apache2
```

---

### STEP 12: Frontend Környezeti Változók Frissítése (5 perc)

```bash
# Nyisd meg a frontend index.html-t
nano /var/www/clients/client1/web5/web/projekt-koveto/index.html

# Keresd meg ezt a sort (Ctrl+W és gépeld: API_URL)
# const API_URL = 'http://localhost:3001/api';

# Módosítsd erre (HTTPS és domain nélküli /api):
# const API_URL = '/api';

# Mentsd el: Ctrl+O, Enter, Ctrl+X
```

**VAGY sed-del:**
```bash
cd /var/www/clients/client1/web5/web/projekt-koveto

# Backup
cp index.html index.html.backup

# API_URL módosítása
sed -i "s|const API_URL = 'http://localhost:3001/api'|const API_URL = '/api'|g" index.html

# Ellenőrzés
grep "API_URL" index.html
```

---

### STEP 13: Teszt és Ellenőrzés (10 perc)

#### 13.1 Backend API teszt

```bash
# Health check
curl https://project.euro-creativity.com/api/health

# Elvárt válasz:
# {"success":true,"message":"Project Tracker API is running","timestamp":"..."}
```

#### 13.2 Browser teszt

1. Nyisd meg böngészőben: **https://project.euro-creativity.com**
2. Látszódnia kell a landing page-nek
3. Kattints **Bejelentkezés**
4. Használd a demo credentials-t:
   - Email: `janos@example.com`
   - Jelszó: `Admin123`

**Ellenőrizd:**
- ✅ Login sikeres
- ✅ Dashboard betölt
- ✅ Projektek listája látható
- ✅ Feladatok listája látható
- ✅ Real-time frissítés működik (nyisd meg 2 tabban és próbáld)

#### 13.3 WebSocket teszt

**Browser DevTools Console:**
```javascript
// Nyisd meg DevTools (F12)
// Network tab → Filter: WS (WebSocket)
// Frissítsd az oldalt
// Látnod kell: socket.io kapcsolatot
```

#### 13.4 PM2 monitoring

```bash
# PM2 státusz
pm2 status

# Logs (utolsó 100 sor)
pm2 logs project-tracker-api --lines 100

# Monitor (real-time)
pm2 monit
```

---

### STEP 14: Security Hardening (10 perc)

#### 14.1 File permissions audit

```bash
# Backend könyvtár
cd /var/www/clients/client1/web5/private/backend/backend
chmod 600 .env
chmod 700 logs/
chmod -R 755 src/
chown -R web5:client1 .

# Frontend könyvtár
cd /var/www/clients/client1/web5/web/projekt-koveto
chmod -R 755 .
chown -R web5:client1 .
```

#### 14.2 Firewall ellenőrzés

```bash
# UFW status (ha használod)
ufw status

# CSAK ezeknek kell nyitva lenniük:
# - 22/tcp (SSH)
# - 80/tcp (HTTP)
# - 443/tcp (HTTPS)
# - 8080/tcp (ISPConfig - csak megbízható IP-ről!)

# Port 3001 NE legyen publikusan elérhető!
# Ellenőrzés külső gépről:
# telnet your-server-ip 3001  # NEM szabad működnie!
```

#### 14.3 SSL/HTTPS érvényesítés

```bash
# SSL Certificate ellenőrzése
openssl s_client -connect project.euro-creativity.com:443 -servername project.euro-creativity.com

# Nézd meg:
# - Issuer: Let's Encrypt
# - Validity: nem lejárt
# - Subject: CN=project.euro-creativity.com
```

---

### STEP 15: Backup Stratégia Beállítása (15 perc)

#### 15.1 Database backup script

```bash
# Backup könyvtár létrehozása
mkdir -p /var/backups/project-tracker
chmod 700 /var/backups/project-tracker

# Backup script létrehozása
nano /usr/local/bin/backup-project-tracker.sh
```

**Script tartalom:**
```bash
#!/bin/bash

# Variables
DB_USER="c1_project_user"
DB_PASS="YOUR_DB_PASSWORD_HERE"
DB_NAME="c1_project_tracker"
BACKUP_DIR="/var/backups/project-tracker"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db-backup-$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db-backup-*.sql.gz" -mtime +7 -delete

echo "Backup completed: db-backup-$DATE.sql.gz"
```

**Mentsd és tedd futtathatóvá:**
```bash
chmod +x /usr/local/bin/backup-project-tracker.sh

# Teszt futtatás
/usr/local/bin/backup-project-tracker.sh

# Ellenőrzés
ls -lh /var/backups/project-tracker/
```

#### 15.2 Cron job beállítása (napi backup 3:00-kor)

```bash
# Crontab szerkesztése
crontab -e

# Add hozzá ezt a sort:
0 3 * * * /usr/local/bin/backup-project-tracker.sh >> /var/log/project-tracker-backup.log 2>&1
```

#### 15.3 Kód backup (Git)

```bash
# Backend könyvtárban
cd /var/www/clients/client1/web5/private/backend/backend

# .gitignore ellenőrzése
cat .gitignore
# node_modules/ és .env KELL benne legyen!

# Git remote ellenőrzése
git remote -v

# FIGYELEM: .env fájlt SOHA ne commit-old!
```

---

## ✅ DEPLOYMENT CHECKLIST - Végleges Ellenőrzés

### Pre-Launch Checklist

- [ ] **Backend**
  - [ ] PM2 fut (`pm2 status`)
  - [ ] API health check OK (`curl https://project.euro-creativity.com/api/health`)
  - [ ] .env fájl nem publikus (nem elérhető böngészőből)
  - [ ] Logs írhatók (`pm2 logs`)

- [ ] **Frontend**
  - [ ] index.html elérhető (`https://project.euro-creativity.com`)
  - [ ] API_URL = '/api' (relative path)
  - [ ] Login működik
  - [ ] Dashboard betölt

- [ ] **Database**
  - [ ] Schema importálva (`SHOW TABLES;`)
  - [ ] Demo users léteznek (`SELECT * FROM users;`)
  - [ ] Backup script működik

- [ ] **Apache/Reverse Proxy**
  - [ ] `/api` → backend proxy működik
  - [ ] `/socket.io` → WebSocket proxy működik
  - [ ] SSL certificate érvényes
  - [ ] HTTPS redirect működik (HTTP → HTTPS)

- [ ] **Security**
  - [ ] Port 3001 NEM publikus
  - [ ] .env fájl 600 permission
  - [ ] JWT_SECRET erős (64+ char)
  - [ ] CORS_ORIGIN beállítva
  - [ ] Rate limiting enabled

- [ ] **Monitoring**
  - [ ] PM2 startup enabled (`pm2 list` után is fut restart esetén)
  - [ ] Logs rotation configured
  - [ ] Daily backup cron job futtatva

---

## 🚨 Troubleshooting Guide

### Probléma 1: "502 Bad Gateway" hiba

**Lehetséges okok:**
1. Backend nem fut (`pm2 status` ellenőrzés)
2. Backend más porton fut (`.env` PORT ellenőrzés)
3. Apache proxy config hibás

**Megoldás:**
```bash
# Backend restart
pm2 restart project-tracker-api

# Apache restart
systemctl restart apache2

# Logs ellenőrzése
pm2 logs project-tracker-api --lines 50
tail -f /var/log/apache2/error.log
```

---

### Probléma 2: Login nem működik / "Invalid credentials"

**Lehetséges okok:**
1. Database kapcsolat hiba
2. User jelszavak nem jók
3. CORS error

**Megoldás:**
```bash
# Database connection teszt
mysql -u c1_project_user -p c1_project_tracker -e "SELECT COUNT(*) FROM users;"

# Jelszavak reset (Admin123)
mysql -u c1_project_user -p c1_project_tracker -e "
UPDATE users SET password_hash = '\$2b\$10\$F9VtkoLOFa/SthhNxP30WuEoyLUhJYGtOQGwqfB4ICRrlFQ7Wt.7y';
"

# CORS ellenőrzés (.env)
cat /var/www/clients/client1/web5/private/backend/backend/.env | grep CORS
```

---

### Probléma 3: WebSocket nem működik / Real-time sync fail

**Lehetséges okok:**
1. `proxy_wstunnel` modul nincs engedélyezve
2. RewriteRule hibás
3. Firewall blokkolja

**Megoldás:**
```bash
# proxy_wstunnel engedélyezése
a2enmod proxy_wstunnel
systemctl restart apache2

# Apache modulok ellenőrzése
apache2ctl -M | grep proxy_wstunnel

# Browser DevTools → Network → WS tab ellenőrzése
```

---

### Probléma 4: "Cannot connect to MySQL server"

**Lehetséges okok:**
1. MySQL nem fut
2. .env DB credentials hibásak
3. Database nem létezik

**Megoldás:**
```bash
# MySQL service ellenőrzés
systemctl status mysql

# Database létezik?
mysql -u root -p -e "SHOW DATABASES LIKE 'c1_project_tracker';"

# User létezik és van jogosultsága?
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User = 'c1_project_user';"

# Teszt connection
mysql -u c1_project_user -p c1_project_tracker -e "SELECT 1;"
```

---

### Probléma 5: PM2 nem indul újra restart után

**Megoldás:**
```bash
# PM2 startup újra konfigurálása
pm2 unstartup systemd
pm2 startup systemd
# Futtasd le a parancsot amit kiír!

pm2 save

# Teszt: restart a szerver
reboot

# Belépés után ellenőrzés
pm2 status
```

---

## 📊 Monitoring & Maintenance

### Napi Ellenőrzés

```bash
# PM2 status
pm2 status

# Logs utolsó 50 sor
pm2 logs project-tracker-api --lines 50 --nostream

# Database size
mysql -u c1_project_user -p c1_project_tracker -e "
SELECT
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'c1_project_tracker'
GROUP BY table_schema;
"

# Disk space
df -h /var/www
```

### Heti Karbantartás

```bash
# PM2 log flush
pm2 flush

# Apache log rotation check
logrotate -f /etc/logrotate.d/apache2

# Backup ellenőrzés
ls -lh /var/backups/project-tracker/

# npm dependencies audit
cd /var/www/clients/client1/web5/private/backend/backend
npm audit
```

### Havi Frissítés

```bash
# Rendszer frissítés
apt update && apt upgrade -y

# npm dependencies update (óvatosan!)
cd /var/www/clients/client1/web5/private/backend/backend
npm outdated
# npm update  # Csak ha teszteltél!

# PM2 update
pm2 update
```

---

## 🎉 DEPLOYMENT COMPLETE!

Ha minden lépést követted, az alkalmazás mostanra fut a **https://project.euro-creativity.com** címen!

### Következő Lépések

1. **Tesztelés**
   - Próbálj ki minden funkciót
   - Ellenőrizd a real-time sync-et (2 böngésző tab)
   - Tesztelj különböző felhasználókkal

2. **Monitoring Setup** (opcionális)
   - Uptime monitoring (UptimeRobot, Pingdom)
   - Error tracking (Sentry)
   - Analytics (Google Analytics, Matomo)

3. **Production Optimization**
   - PM2 cluster mode (több instance)
   - Redis cache (opcionális)
   - CDN setup (opcionális)

4. **Dokumentáció**
   - User manual készítése
   - Admin guide
   - API documentation

---

## 📞 Support & Resources

**Dokumentáció:**
- [SECURITY-AUDIT-2025-10-29.md](SECURITY-AUDIT-2025-10-29.md) - Biztonsági audit
- [TEST-RESULTS-FINAL.md](TEST-RESULTS-FINAL.md) - Teszt eredmények
- [CLAUDE.md](CLAUDE.md) - Development guide

**Ha elakadtál:**
1. Ellenőrizd a logs-okat (`pm2 logs`, `tail -f /var/log/apache2/error.log`)
2. Nézd meg a Troubleshooting Guide-ot (fentebb)
3. Google the error message
4. Stack Overflow

---

**Deployment végezte:** Claude Code
**Dátum:** 2025-10-29
**Status:** ✅ READY FOR PRODUCTION
**Domain:** https://project.euro-creativity.com
