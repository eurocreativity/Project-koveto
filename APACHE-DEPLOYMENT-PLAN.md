# 🚀 APACHE DEPLOYMENT PLAN - Meglévő ISPConfig
## Projekt Követő Rendszer - Apache Specifikus Telepítés

---

## ✅ AMIT MÁR VAN (Előfeltételek)

- ✅ ISPConfig 3.2.9p telepítve és működik
- ✅ Apache webszerver fut
- ✅ PHP telepítve
- ✅ MySQL/MariaDB telepítve
- ✅ Már van legalább 1 működő weboldal

**→ Becsült telepítési idő: ~60 perc** (felére csökkent!)

---

## 🔍 ELŐZETES INFORMÁCIÓGYŰJTÉS

### Kérdőív (Töltsd ki most!)

```
=== SZERVER ADATOK ===
SSH IP cím: _____________________________________________
SSH user (root): ________________________________________
SSH jelszó/key: _________________________________________

=== ISPCONFIG ===
ISPConfig URL: https://___________________:8080
Admin user: _____________________________________________
Admin jelszó: ___________________________________________

=== WEBSERVER VERZIÓ ===
Apache verzió: __________________________________________ (ellenőrizd: apache2 -v)
PHP verzió: _____________________________________________ (ellenőrizd: php -v)
MySQL verzió: ___________________________________________ (ellenőrizd: mysql -V)

=== ÚJ WEBOLDAL (Projekt Követő) ===
Domain/Subdomain: _______________________________________ (pl. projekt.sajatdomain.hu)
Meglévő domain alatt lesz? (Igen/Nem): _________________
Ha IGEN, melyik domain: _________________________________

=== NODE.JS ===
Van már telepítve Node.js? ___________ (Ellenőrizd SSH-n: node -v)
Ha IGEN, verzió: ________________________________________ (kell: v20.x.x)
```

---

## 📋 GYORS ELLENŐRZÉS (SSH-n keresztül)

Jelentkezz be SSH-val és futtasd ezeket:

```bash
# 1. Apache verzió és státusz
apache2 -v
systemctl status apache2

# 2. PHP verzió
php -v

# 3. MySQL verzió és státusz
mysql -V
systemctl status mysql

# 4. ISPConfig telepítési útvonal
ls -la /usr/local/ispconfig/

# 5. Node.js ellenőrzés
node -v
# Ha "command not found" → telepíteni kell
# Ha v20.x.x → már kész!
# Ha régebbi verzió → frissíteni kell

# 6. PM2 ellenőrzés
pm2 -v
# Ha "command not found" → telepíteni kell

# 7. Apache modulok ellenőrzése
apache2ctl -M | grep proxy
# Kell: proxy_module, proxy_http_module, proxy_wstunnel_module
```

---

## 🚀 TELEPÍTÉSI LÉPÉSEK

### FÁZIS 1: NODE.JS ÉS PM2 TELEPÍTÉSE (5-10 perc)

#### Ha Node.js nincs telepítve vagy régi verzió:

```bash
# 1. NodeSource repository hozzáadása (Node.js 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# 2. Node.js és npm telepítése
apt-get install -y nodejs

# 3. Verzió ellenőrzés
node -v  # Elvárt: v20.x.x
npm -v   # Elvárt: 10.x.x

# 4. PM2 telepítése
npm install -g pm2

# 5. PM2 verzió
pm2 -v  # Elvárt: 5.x.x
```

**✅ CHECKPOINT:** `node -v` és `pm2 -v` működik

---

### FÁZIS 2: APACHE PROXY MODULOK ENGEDÉLYEZÉSE (2 perc)

Apache-nek szüksége van a proxy modulokra a Node.js backend eléréséhez:

```bash
# 1. Proxy modulok engedélyezése
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel  # WebSocket (Socket.IO) támogatáshoz
a2enmod rewrite

# 2. Apache újraindítás
systemctl restart apache2

# 3. Ellenőrzés
apache2ctl -M | grep -E "proxy|rewrite"

# Várt kimenet:
# proxy_module (shared)
# proxy_http_module (shared)
# proxy_wstunnel_module (shared)
# rewrite_module (shared)
```

**✅ CHECKPOINT:** Mind a 4 modul engedélyezve

---

### FÁZIS 3: ISPCONFIG - ÚJ WEBOLDAL LÉTREHOZÁSA (10 perc)

#### 3.1 ISPConfig Admin Bejelentkezés

1. Böngésző: `https://your-server-ip:8080`
2. Bejelentkezés admin userrel

#### 3.2 Website Létrehozása (Ha még nincs subdomain)

**Sites → Website → Add new Website**

**Domain tab:**
- Client: Válaszd ki a meglévő klienst
- Domain: `projekt.sajatdomain.hu`
- Auto-Subdomain: `none` vagy `www`
- **SSL:** ☑ SSL
- **Let's Encrypt SSL:** ☑ Let's Encrypt SSL
- **PHP:** PHP-FPM (válassz verziót: 8.1 vagy 8.2)

**Redirect tab:**
- **Rewrite HTTP to HTTPS:** ☑ (minden HTTP → HTTPS)

**Options tab:**
- **Apache Directives:** **ÜRESEN HAGYD MOST!** (később töltjük ki)

**Save** → Várj 10-20 másodpercet

#### 3.3 DNS Ellenőrzés

```bash
dig +short projekt.sajatdomain.hu
# VAGY
nslookg projekt.sajatdomain.hu

# Elvárt: A szervered IP címe
```

**Ha nem egyezik:** Domain regisztrátorban állítsd be az A record-ot, várj 5-60 percet.

**✅ CHECKPOINT:** Website létrehozva, SSL generálódott, DNS mutat a szerverre

---

### FÁZIS 4: MYSQL ADATBÁZIS LÉTREHOZÁSA (5 perc)

**Sites → Database → Add new Database**

- **Client:** Válaszd ki a klienst
- **Site:** `projekt.sajatdomain.hu`
- **Database name:** `projekt_tracker`
  - Teljes név lesz: `c1projekt_tracker` (c1 = client prefix, függ a clienttől)
- **Database user:** `projekt_user`
  - Teljes név lesz: `c1projekt_user`
- **Database password:** Kattints **Generate Password**
  - **ÍRD FEL!** _________________________________
- **Database charset:** `utf8mb4`

**Save**

**✅ CHECKPOINT:** Adatbázis és user létrehozva, jelszó elmentve

---

### FÁZIS 5: BACKEND TELEPÍTÉSE (15 perc)

#### 5.1 Mappák és Fájlok

```bash
# 1. Backend könyvtár létrehozása
mkdir -p /opt/project-tracker/backend
mkdir -p /opt/project-tracker/backend/logs
cd /opt/project-tracker

# 2. Git clone (VAGY fájlok feltöltése SCP-vel)
git clone https://github.com/eurocreativity/Project-koveto.git temp
mv temp/backend/* ./backend/
rm -rf temp

# 3. Ellenőrzés
ls -la /opt/project-tracker/backend/
# Kell: package.json, src/, schema.sql, ecosystem.config.js
```

#### 5.2 npm Függőségek

```bash
cd /opt/project-tracker/backend
npm install

# Várj 1-2 percet...
# Elvárt: ~200+ csomag települ
```

#### 5.3 MySQL Adatbázis Séma Importálás

```bash
# Használd az ISPConfig által generált adatokat!
# Helyettesítsd be:
# - c1projekt_user → az ISPConfig által létrehozott user név
# - c1projekt_tracker → az ISPConfig által létrehozott DB név
# - [JELSZÓ] → az ISPConfig által generált jelszó

mysql -u c1projekt_user -p c1projekt_tracker < /opt/project-tracker/backend/schema.sql

# Add meg a jelszót amikor kéri

# Ellenőrzés
mysql -u c1projekt_user -p c1projekt_tracker -e "SHOW TABLES;"
# Várt kimenet: users, projects, tasks, settings
```

#### 5.4 .env Konfiguráció

```bash
cd /opt/project-tracker/backend
cp .env.production .env
nano .env
```

**Töltsd ki (FONTOS!):**

```bash
NODE_ENV=production
PORT=3001

# ISPConfig adatbázis adatok
DB_HOST=localhost
DB_USER=c1projekt_user                    # CSERE: ISPConfig user
DB_PASSWORD=ÍRDBE_ISPCONFIG_JELSZÓT       # CSERE: ISPConfig jelszó
DB_NAME=c1projekt_tracker                 # CSERE: ISPConfig DB név

# JWT Secret generálás (SSH-n futtasd):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=GENERÁLT_64_KARAKTERES_STRING  # CSERE!
JWT_EXPIRES_IN=7d

# Domain (pontos!)
CORS_ORIGIN=https://projekt.sajatdomain.hu  # CSERE: saját domain!

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (később beállítható)
EMAIL_ENABLED=false
```

**JWT Secret generálás:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Másold be a kimenetet JWT_SECRET-hez
```

**Mentés:** `CTRL+X` → `Y` → `ENTER`

#### 5.5 Biztonság

```bash
# .env fájl csak root olvassa
chmod 600 /opt/project-tracker/backend/.env
ls -la .env
# Várt: -rw------- root root
```

#### 5.6 Backend Teszt

```bash
cd /opt/project-tracker/backend
node src/server.js

# Várt kimenet:
# ✅ MySQL connection established
# 🚀 Server running on port 3001
# ⚡ Socket.IO initialized

# Másik terminálban teszteld:
curl http://localhost:3001/api/health
# Várt: {"success":true,"message":"Server is running",...}

# Állítsd le: CTRL+C
```

**✅ CHECKPOINT:** Backend elindul hibátlanul, API válaszol

---

### FÁZIS 6: FRONTEND TELEPÍTÉSE (5 perc)

#### 6.1 ISPConfig Webroot Megkeresése

```bash
# ISPConfig → Sites → Website → projekt.sajatdomain.hu → jobb klikk → Show
# VAGY általában itt van:
WEBROOT="/var/www/clients/client0/web1/web"

# Ellenőrzés
ls -la $WEBROOT/
# Látható: index.html vagy más fájlok
```

#### 6.2 Frontend Fájl Másolása

```bash
# Másolás
WEBROOT="/var/www/clients/client0/web1/web"  # CSERE: saját útvonal!
cp /opt/project-tracker/frontend/index.html $WEBROOT/projekt-koveto.html

# Jogosultságok (ISPConfig user és group)
# Nézd meg melyik user:
ls -la $WEBROOT/
# Példa kimenet: web1:client0

# Állítsd be (CSERE: web1:client0 → saját user:group):
chown web1:client0 $WEBROOT/projekt-koveto.html
chmod 644 $WEBROOT/projekt-koveto.html

# Ellenőrzés
ls -la $WEBROOT/projekt-koveto.html
# Várt: -rw-r--r-- web1 client0
```

**Megjegyzés:** A fájl már automatikusan detektálja a hostname-t, nincs szükség módosításra!

**✅ CHECKPOINT:** Frontend fájl a webroot-ban van, helyes jogosultságokkal

---

### FÁZIS 7: APACHE KONFIGURÁCIÓ (KRITIKUS!) (10 perc)

**Ez a LEGFONTOSABB LÉPÉS!** Apache-nek reverse proxy-ként kell működnie a Node.js backend felé.

#### 7.1 Apache Directives Beállítása ISPConfig-ban

1. **ISPConfig → Sites → Website**
2. Kattints a `projekt.sajatdomain.hu` website-ra
3. Lépj az **Options** fülre
4. Görgess le az **Apache Directives** mezőhöz

5. **Másold be ezt (TELJES):**

```apache
# ============================================
# PROJEKT KÖVETŐ RENDSZER - Apache Config
# ============================================

# Proxy modulok ellenőrzése (ha hiba van, lásd a troubleshooting-ot)
<IfModule mod_proxy.c>

# Backend API reverse proxy (Node.js port 3001)
ProxyPreserveHost On
ProxyRequests Off

# Backend API endpoint
<Location /api/>
    ProxyPass http://localhost:3001/api/
    ProxyPassReverse http://localhost:3001/api/

    # Headers
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"

    # Timeouts (WebSocket support)
    ProxyTimeout 300
</Location>

# Socket.IO WebSocket support
<Location /socket.io/>
    ProxyPass ws://localhost:3001/socket.io/
    ProxyPassReverse ws://localhost:3001/socket.io/

    # Headers
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"

    # WebSocket specific
    ProxyTimeout 300

    # Fallback HTTP (Socket.IO long-polling)
    ProxyPass http://localhost:3001/socket.io/
    ProxyPassReverse http://localhost:3001/socket.io/
</Location>

</IfModule>

# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache static assets (opcionális)
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

# Frontend app redirect (opcionális)
# Ha azt szeretnéd, hogy https://projekt.domain.hu/ egyből a projekt-koveto.html-re mutasson:
# DirectoryIndex projekt-koveto.html
```

6. Kattints: **Save**

**ISPConfig automatikusan újratölti az Apache konfigurációt** 10-20 másodpercen belül.

#### 7.2 Apache Konfiguráció Ellenőrzése

```bash
# 1. Apache szintaxis ellenőrzés
apache2ctl configtest
# Várt: Syntax OK

# 2. Ha hiba van
systemctl status apache2
tail -f /var/log/apache2/error.log

# 3. Apache reload (ha nem automatikus)
systemctl reload apache2

# 4. Ellenőrzés
systemctl status apache2
# Várt: active (running)
```

**✅ CHECKPOINT:** Apache hiba nélkül fut, konfiguráció érvényes

---

### FÁZIS 8: PM2 BACKEND INDÍTÁSA (5 perc)

```bash
# 1. Backend mappába
cd /opt/project-tracker/backend

# 2. PM2 indítás
pm2 start ecosystem.config.js --env production

# Várt kimenet:
# ┌─────┬──────────────────────────┬─────────┬─────────┐
# │ id  │ name                     │ mode    │ status  │
# ├─────┼──────────────────────────┼─────────┼─────────┤
# │ 0   │ project-tracker-api      │ fork    │ online  │
# └─────┴──────────────────────────┴─────────┴─────────┘

# 3. PM2 mentés
pm2 save

# 4. Auto-start beállítás (szerver reboot után is elindul)
pm2 startup systemd

# Kimenet: egy parancsot ad vissza, futtasd le!
# Példa: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
# >>> FUTTASD LE A KIÍRT PARANCSOT!

pm2 save  # újra mentés

# 5. Ellenőrzés
pm2 status
# Várt: project-tracker-api | online

pm2 logs project-tracker-api --lines 30
# Nincs error
```

**✅ CHECKPOINT:** PM2 online, nincs error log

---

### FÁZIS 9: TESZTELÉS (10 perc)

#### 9.1 Backend API Teszt (SSH)

```bash
# 1. Health check (backend direkt)
curl http://localhost:3001/api/health
# Várt: {"success":true,"message":"Server is running",...}

# 2. Health check (Apache proxy-n keresztül)
curl https://projekt.sajatdomain.hu/api/health
# Várt: {"success":true,"message":"Server is running",...}

# 3. Login teszt
curl -X POST https://projekt.sajatdomain.hu/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Várt: {"success":true,"data":{"user":{...},"token":"eyJ..."}}
```

#### 9.2 Frontend Teszt (Böngésző)

1. Nyisd meg: `https://projekt.sajatdomain.hu/projekt-koveto.html`
2. **Elvárt:** Bejelentkezési oldal betöltődik
3. **Ha 404 hiba:** Ellenőrizd a fájlnevet és útvonalat
4. **Ha SSL hiba:** Várj 2-5 percet (Let's Encrypt generálódik)

#### 9.3 Bejelentkezési Teszt

- **Email:** `admin@example.com`
- **Jelszó:** `password123`

**Elvárt:** Dashboard betöltődik, látszanak projektek és feladatok (demo adatok)

#### 9.4 Funkció Tesztek

- ✅ Projekt létrehozása
- ✅ Feladat létrehozása
- ✅ Feladat státusz módosítása
- ✅ Naptár nézet működik
- ✅ Dark mode kapcsoló

#### 9.5 Real-time Sync Teszt

1. Nyisd meg 2 böngésző ablakban ugyanazt az URL-t
2. Mindkettőben jelentkezz be
3. Hozz létre egy projektet az egyik ablakban
4. **Elvárt:** A másik ablakban is azonnal megjelenik (frissítés nélkül)

#### 9.6 Console Hiba Ellenőrzés

- Nyomj `F12` → Console tab
- **Nem lehet error!** (csak info/warning OK)
- Ha WebSocket error → Apache proxy hiba (lásd troubleshooting)

**✅ CHECKPOINT:** Minden működik, nincs hiba

---

### FÁZIS 10: BIZTONSÁG ÉS BACKUP (8 perc)

#### 10.1 Biztonsági Beállítások

```bash
# 1. .env fájl biztonság (ellenőrzés)
ls -la /opt/project-tracker/backend/.env
# Várt: -rw------- root root

# 2. UFW tűzfal (ha használod)
ufw status

# Port 3001 NE LEGYEN nyitva kívülről!
# Csak localhost-ról érhető el (Apache proxy)

# 3. MySQL secure installation (ha még nem futott)
mysql_secure_installation
# Válaszolj IGEN-nel mindenhol
```

#### 10.2 Backup Script

```bash
# Backup script létrehozása
cat > /root/backup-project-tracker.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backend
tar -czf $BACKUP_DIR/backend-$DATE.tar.gz /opt/project-tracker/backend

# Frontend
tar -czf $BACKUP_DIR/frontend-$DATE.tar.gz /var/www/clients/*/web*/web/projekt-koveto.html

# Database (CSERE: user és db név!)
mysqldump -u c1projekt_user -p'YOUR_PASSWORD_HERE' c1projekt_tracker > $BACKUP_DIR/database-$DATE.sql

# Összesítés
tar -czf $BACKUP_DIR/full-backup-$DATE.tar.gz $BACKUP_DIR/*-$DATE.*
rm -f $BACKUP_DIR/backend-$DATE.tar.gz $BACKUP_DIR/frontend-$DATE.tar.gz $BACKUP_DIR/database-$DATE.sql

echo "Backup completed: $BACKUP_DIR/full-backup-$DATE.tar.gz"
EOF

# Futtathatóvá tétel
chmod +x /root/backup-project-tracker.sh

# Teszt
/root/backup-project-tracker.sh
```

#### 10.3 Napi Automatikus Mentés (Cron)

```bash
# Crontab szerkesztés
crontab -e

# Hozzáadás: minden éjjel 3:00-kor
0 3 * * * /root/backup-project-tracker.sh >> /var/log/project-backup.log 2>&1

# Mentés és kilépés
```

**✅ CHECKPOINT:** Biztonság rendben, backup működik

---

## ✅ TELEPÍTÉS KÉSZ!

### Sikerkritériumok Ellenőrzése

- [ ] `pm2 status` → project-tracker-api **online**
- [ ] `curl https://domain.hu/api/health` → **{"success":true}**
- [ ] Böngésző: `https://domain.hu/projekt-koveto.html` → **Login oldal**
- [ ] Bejelentkezés → **Dashboard betöltődik**
- [ ] Projekt létrehozás → **Sikeres**
- [ ] 2 ablak teszt → **Real-time sync működik**
- [ ] F12 Console → **Nincs error**
- [ ] SSL → **Zöld lakat ikon**
- [ ] `apache2ctl configtest` → **Syntax OK**
- [ ] `systemctl status apache2` → **active (running)**

---

## 🐛 HIBAELHÁRÍTÁS (Apache Specifikus)

### 502 Bad Gateway

**Ok:** Apache nem éri el a Node.js backend-et

```bash
# 1. Backend fut-e?
pm2 status
# Ha nem online: pm2 restart project-tracker-api

# 2. Port 3001 listen?
netstat -tulnp | grep 3001
# Várt: node ... 127.0.0.1:3001

# 3. Apache proxy modulok?
apache2ctl -M | grep proxy
# Kell: proxy_module, proxy_http_module

# Ha hiányzik:
a2enmod proxy proxy_http proxy_wstunnel
systemctl restart apache2

# 4. Apache error log
tail -f /var/log/apache2/error.log
```

### Socket.IO Nem Működik

**Ok:** WebSocket proxy hiba

```bash
# 1. proxy_wstunnel modul engedélyezve?
apache2ctl -M | grep wstunnel
# Ha nincs:
a2enmod proxy_wstunnel
systemctl restart apache2

# 2. Apache directives ellenőrzés
# ISPConfig → Sites → Website → Options → Apache Directives
# Kell: ProxyPass ws://localhost:3001/socket.io/

# 3. Backend Socket.IO log
pm2 logs project-tracker-api | grep -i socket
```

### Let's Encrypt SSL Nem Generálódik

**Ok:** Domain DNS nem mutat a szerverre

```bash
# 1. DNS ellenőrzés
dig +short projekt.sajatdomain.hu
# Elvárt: szerver IP

# 2. Port 80 nyitva?
ufw status | grep 80
# Vagy: netstat -tulnp | grep :80

# 3. Kézi SSL generálás
certbot certonly --webroot -w /var/www/clients/client0/web1/web -d projekt.sajatdomain.hu

# 4. ISPConfig SSL reload
# ISPConfig → Sites → Website → SSL tab → Let's Encrypt SSL → újra enable → Save
```

### Frontend 404 Not Found

**Ok:** Fájl rossz helyen vagy rossz néven van

```bash
# 1. Fájl létezik?
ls -la /var/www/clients/*/web*/web/projekt-koveto.html

# 2. Jogosultságok OK?
ls -la /var/www/clients/client0/web1/web/projekt-koveto.html
# Várt: -rw-r--r-- web1 client0

# 3. URL jó?
# https://projekt.domain.hu/projekt-koveto.html
# (nem index.html hanem projekt-koveto.html!)
```

---

## 📊 HASZNOS PARANCSOK

```bash
# Backend restart
pm2 restart project-tracker-api

# Backend logok
pm2 logs project-tracker-api --lines 100

# Apache reload
systemctl reload apache2

# Apache syntax check
apache2ctl configtest

# Apache error log
tail -f /var/log/apache2/error.log

# MySQL belépés
mysql -u c1projekt_user -p c1projekt_tracker

# Backup
/root/backup-project-tracker.sh

# .env szerkesztés
nano /opt/project-tracker/backend/.env
pm2 restart project-tracker-api  # után!
```

---

## 🎉 GRATULÁLUNK!

**A Projekt Követő Rendszer sikeresen telepítve Apache + ISPConfig környezetben!**

### Következő Lépések

1. **Regisztrálj új felhasználókat** a frontend-en
2. **Email értesítések bekapcsolása** (opcionális):
   - `.env`: `EMAIL_ENABLED=true`
   - SMTP beállítások kitöltése
   - `pm2 restart project-tracker-api`
3. **Monitoring:** PM2 Plus vagy Uptime Robot
4. **Custom domain email:** Nodemailer + Gmail App Password

---

**Készítette:** Claude Code
**Verzió:** Apache 1.0
**Dátum:** 2025-10-26
**Support:** GitHub Issues
