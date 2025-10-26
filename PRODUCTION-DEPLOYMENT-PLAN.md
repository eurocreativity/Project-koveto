# 🚀 ÉLES TELEPÍTÉSI TERV - ISPConfig 3.2.9p
## Projekt Követő Rendszer - Production Deployment

---

## 📋 TARTALOM

1. [Előkészítés és Követelmények](#1-előkészítés-és-követelmények)
2. [Szerver Környezet Beállítása](#2-szerver-környezet-beállítása)
3. [ISPConfig Webhely Létrehozása](#3-ispconfig-webhely-létrehozása)
4. [MySQL Adatbázis Konfigurálása](#4-mysql-adatbázis-konfigurálása)
5. [Backend Telepítése](#5-backend-telepítése)
6. [Frontend Telepítése](#6-frontend-telepítése)
7. [Nginx Konfiguráció](#7-nginx-konfiguráció)
8. [SSL/HTTPS Beállítása](#8-sslhttps-beállítása)
9. [PM2 Process Manager](#9-pm2-process-manager)
10. [Tesztelés és Ellenőrzés](#10-tesztelés-és-ellenőrzés)
11. [Biztonsági Beállítások](#11-biztonsági-beállítások)
12. [Mentés és Visszaállítás](#12-mentés-és-visszaállítás)
13. [Hibaelhárítás](#13-hibaelhárítás)

---

## ⏱️ BECSÜLT IDŐIGÉNY

| Lépés | Időigény | Nehézség |
|-------|----------|----------|
| Előkészítés | 10 perc | Könnyű |
| Node.js telepítés | 5 perc | Könnyű |
| ISPConfig beállítások | 15 perc | Közepes |
| Adatbázis setup | 10 perc | Könnyű |
| Backend telepítés | 15 perc | Közepes |
| Frontend telepítés | 5 perc | Könnyű |
| Nginx konfiguráció | 10 perc | Közepes |
| SSL beállítás | 5 perc | Könnyű |
| PM2 és indítás | 10 perc | Könnyű |
| Tesztelés | 15 perc | Könnyű |
| **ÖSSZESEN** | **~100 perc** | **Közepes** |

---

## 1. ELŐKÉSZÍTÉS ÉS KÖVETELMÉNYEK

### 1.1 Szükséges Információk (Írd fel!)

```plaintext
=== SZERVER ADATOK ===
Szerver IP cím: _______________________________________
SSH port: _____________________________________________ (alapértelmezett: 22)
Root/Admin SSH user: __________________________________ (általában: root)
SSH jelszó vagy SSH key: ______________________________

=== ISPCONFIG ===
ISPConfig admin URL: __________________________________ (pl. https://server.com:8080)
ISPConfig admin user: _________________________________ (alapértelmezett: admin)
ISPConfig admin jelszó: _______________________________

=== DOMAIN ===
Domain név: ___________________________________________ (pl. projekt.sajatdomain.hu)
DNS A record beállítva: _______________________________ (Igen/Nem)

=== ADATBÁZIS (később kitöltendő) ===
MySQL adatbázis név: __________________________________ (javasolt: c1projekt_tracker)
MySQL user név: _______________________________________ (javasolt: c1projekt_user)
MySQL jelszó: _________________________________________ (ISPConfig generálja)

=== EMAIL (opcionális) ===
SMTP szerver: _________________________________________ (pl. smtp.gmail.com)
SMTP user: ____________________________________________
SMTP jelszó: __________________________________________
```

### 1.2 Előfeltételek Ellenőrzése

**Szerver követelmények:**
- ✅ Ubuntu 20.04/22.04 vagy Debian 11/12
- ✅ ISPConfig 3.2.9p telepítve és működik
- ✅ Minimum 2 GB RAM
- ✅ Minimum 10 GB szabad HDD
- ✅ Root vagy sudo hozzáférés

**Hálózati követelmények:**
- ✅ Nyitott portok: 80 (HTTP), 443 (HTTPS), 22 (SSH), 8080 (ISPConfig)
- ✅ Domain DNS A record beállítva a szerver IP-re
- ✅ Tűzfal beállítva (UFW vagy iptables)

**Szoftver követelmények (telepítendő):**
- ⚪ Node.js 20.x (telepítjük)
- ⚪ npm 10.x (Node.js-szel együtt jön)
- ⚪ PM2 process manager (telepítjük)
- ✅ MySQL/MariaDB (ISPConfig-gal már telepítve)
- ✅ Nginx (ISPConfig-gal már telepítve)

### 1.3 Biztonsági Mentés Készítése

**FONTOS! Mindig készíts mentést!**

```bash
# ISPConfig teljes mentés
/usr/local/ispconfig/server/scripts/ispconfig_backup.sh

# Vagy kézi mentés
tar -czf ispconfig_backup_$(date +%Y%m%d).tar.gz /var/www /etc/nginx /etc/mysql
```

---

## 2. SZERVER KÖRNYEZET BEÁLLÍTÁSA

### 2.1 SSH Kapcsolódás

**Windows:**
```powershell
# PowerShell vagy CMD
ssh root@your-server-ip

# Ha más port:
ssh -p 2222 root@your-server-ip
```

**Linux/Mac:**
```bash
ssh root@your-server-ip

# SSH key használata:
ssh -i ~/.ssh/your-key.pem root@your-server-ip
```

### 2.2 Rendszer Frissítése

```bash
# 1. Csomaglisták frissítése
apt update

# 2. Telepített csomagok frissítése (opcionális, de ajánlott)
apt upgrade -y

# 3. Szerver verzió ellenőrzése
cat /etc/os-release

# Várt kimenet:
# Ubuntu 20.04 LTS vagy 22.04 LTS
# VAGY Debian 11 vagy 12
```

**✅ CHECKPOINT:** A rendszer frissült, nincs hiba.

### 2.3 Node.js 20.x Telepítése

```bash
# 1. NodeSource repository hozzáadása
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# 2. Node.js és npm telepítése
apt-get install -y nodejs

# 3. Verzió ellenőrzés
node -v
# Várt kimenet: v20.x.x (pl. v20.18.0)

npm -v
# Várt kimenet: 10.x.x (pl. 10.8.2)

# 4. Build eszközök telepítése (szükséges lehet)
apt-get install -y build-essential
```

**✅ CHECKPOINT:** `node -v` és `npm -v` működik és megfelelő verziót mutat.

### 2.4 PM2 Process Manager Telepítése

```bash
# 1. PM2 globális telepítése
npm install -g pm2

# 2. Verzió ellenőrzés
pm2 -v
# Várt kimenet: 5.x.x

# 3. PM2 systemd startup beállítása (később)
# pm2 startup systemd
# pm2 save
```

**✅ CHECKPOINT:** `pm2 -v` működik.

### 2.5 Mappák Létrehozása

```bash
# 1. Alkalmazás könyvtár (ISPConfig struktúrán kívül)
mkdir -p /opt/project-tracker
mkdir -p /opt/project-tracker/backend
mkdir -p /opt/project-tracker/backend/logs

# 2. Jogosultságok beállítása (később módosítjuk az ISPConfig user-re)
chmod 755 /opt/project-tracker
```

---

## 3. ISPCONFIG WEBHELY LÉTREHOZÁSA

### 3.1 ISPConfig Admin Bejelentkezés

1. Nyisd meg böngészőben: `https://your-server-ip:8080`
2. Jelentkezz be admin felhasználóval
3. Fogadd el az SSL figyelmeztetést (self-signed certificate)

### 3.2 Kliens (Client) Létrehozása vagy Kiválasztása

**Új kliens létrehozása:**

1. Menü: **Client** → **Add new Client**
2. Töltsd ki:
   - **Company Name:** `Projekt Követő`
   - **Contact Name:** `Admin`
   - **Username:** `projekt` (automatikusan generálódik: c1, c2, stb.)
   - **Password:** `[erős jelszó]`
   - **Language:** `hu` (magyar)
   - **Email:** `admin@sajatdomain.hu`
3. Limits fül:
   - **Max. number of web domains:** `10`
   - **Max. number of databases:** `10`
   - **Web Quota (MB):** `5000` (5GB)
   - **Traffic Quota (MB):** `50000` (50GB)
4. Kattints: **Save**

**✅ CHECKPOINT:** Kliens létrehozva, látható a Client listában.

### 3.3 Website (Webhely) Létrehozása

1. Menü: **Sites** → **Website** → **Add new Website**

2. **Domain tab:**
   - **Client:** Válaszd ki az előbb létrehozott klienst
   - **IPv4-Address:** `*` (minden IP)
   - **Domain:** `projekt.sajatdomain.hu`
   - **Auto-Subdomain:** `www` (www.projekt.sajatdomain.hu is működjön)
   - **SSL:** `☑ SSL` (bekapcsolva)
   - **Let's Encrypt SSL:** `☑ Let's Encrypt SSL` (automatikus SSL)
   - **PHP:** `PHP-FPM` (válaszd ki a PHP 8.1 vagy 8.2 verziót)

3. **Redirect tab:**
   - **SEO Redirect:** `no-www => www` VAGY `www => no-www` (válassz egyet)
   - **Rewrite HTTP to HTTPS:** `☑` (bekapcsolva) - Minden HTTP automatikusan HTTPS-re

4. **Options tab:**
   - **Apache Directives:** Hagyd üresen (Nginx-et használunk)
   - **Nginx Directives:** **ÜRESEN HAGYD MOST!** (Később töltjük ki)
   - **PHP open_basedir:** `Enabled`

5. **Statistics tab:**
   - **Webalizer, AWStats:** Bekapcsolhatod (opcionális)

6. Kattints: **Save**

**✅ CHECKPOINT:** Website létrehozva, látható a Sites → Website listában. Az ISPConfig automatikusan létrehozza a webroot mappát: `/var/www/clients/client0/web1/web/`

### 3.4 DNS Ellenőrzés

```bash
# Ellenőrizd, hogy a domain a szerveredre mutat:
dig projekt.sajatdomain.hu +short

# VAGY
nslookup projekt.sajatdomain.hu

# Várt kimenet: A szervered IP címe (pl. 123.45.67.89)
```

**Ha nem egyezik:**
- Lépj be a domain regisztrátorhoz (pl. Rackhost, EZIT, GoDaddy)
- Állítsd be az A record-ot a szerver IP-jére
- Várj 5-60 percet (DNS propagáció)

---

## 4. MYSQL ADATBÁZIS KONFIGURÁLÁSA

### 4.1 Adatbázis Létrehozása ISPConfig-ban

1. Menü: **Sites** → **Database** → **Add new Database**

2. Töltsd ki:
   - **Client:** Válaszd ki a klienst
   - **Site:** Válaszd ki a website-ot (projekt.sajatdomain.hu)
   - **Database name:** `projekt_tracker`
     - **Teljes név lesz:** `c1projekt_tracker` (c1 = client prefix)
   - **Database user:** `projekt_user`
     - **Teljes név lesz:** `c1projekt_user`
   - **Database password:** Kattints a **Generate Password** gombra
     - **ÍRD FEL!** Másolással: `_________________________________`
   - **Database charset:** `utf8mb4`

3. Kattints: **Save**

**✅ CHECKPOINT:** Adatbázis létrehozva, látható a Sites → Database listában.

### 4.2 Adatbázis Séma Importálása

**SSH-n keresztül:**

```bash
# 1. Ellenőrizd az adatbázis létrejöttét
mysql -u root -p -e "SHOW DATABASES LIKE 'c1projekt%';"
# Add meg a MySQL root jelszót

# 2. Készítsd elő az SQL fájlt (lokális gépről másold fel SSH-val)
# Majd importáld (később, amikor a fájlok felkerülnek):

mysql -u c1projekt_user -p c1projekt_tracker < /opt/project-tracker/backend/schema.sql

# Add meg a c1projekt_user jelszavát (amit ISPConfig generált)
```

**VAGY ISPConfig phpMyAdmin-on keresztül:**

1. Menü: **Sites** → **Database**
2. Kattints a **phpMyAdmin** gombra az adatbázis mellett
3. Bejelentkezés:
   - **Username:** `c1projekt_user`
   - **Password:** `[ISPConfig generálta jelszó]`
4. Import fül:
   - Válaszd ki a `schema.sql` fájlt
   - Kattints: **Go**

**✅ CHECKPOINT:** Táblák létrejöttek (users, projects, tasks, settings).

### 4.3 Demo Adatok Importálása (Opcionális)

```bash
# Demo users és projects importálása
mysql -u c1projekt_user -p c1projekt_tracker < /opt/project-tracker/backend/seed-demo-data.sql

# Ellenőrzés
mysql -u c1projekt_user -p c1projekt_tracker -e "SELECT email FROM users;"

# Várt kimenet:
# admin@example.com
# janos@example.com
# anna@example.com
```

---

## 5. BACKEND TELEPÍTÉSE

### 5.1 Fájlok Feltöltése

**Opció A: Git clone (Ajánlott)**

```bash
# 1. Navigálj az alkalmazás könyvtárba
cd /opt/project-tracker

# 2. Clone a repository
git clone https://github.com/eurocreativity/Project-koveto.git temp
mv temp/backend/* ./backend/
rm -rf temp

# 3. Ellenőrzés
ls -la /opt/project-tracker/backend/
# Várt fájlok: package.json, src/, schema.sql, stb.
```

**Opció B: SCP/SFTP feltöltés**

```bash
# Lokális gépről (Windows PowerShell vagy Linux):
scp -r ./backend root@your-server-ip:/opt/project-tracker/

# VAGY WinSCP, FileZilla használata
```

**✅ CHECKPOINT:** Backend fájlok a `/opt/project-tracker/backend/` mappában vannak.

### 5.2 npm Függőségek Telepítése

```bash
# 1. Navigálj a backend mappába
cd /opt/project-tracker/backend

# 2. Függőségek telepítése (ez eltarthat 1-2 percig)
npm install

# 3. Ellenőrzés
ls -la node_modules/
# Látható: express, socket.io, mysql2, bcrypt, stb.
```

**✅ CHECKPOINT:** `node_modules` mappa létezik és ~200+ csomag telepítve.

### 5.3 .env Konfiguráció Létrehozása

```bash
# 1. Másold le a production példa fájlt
cd /opt/project-tracker/backend
cp .env.production .env

# 2. Szerkesztés (nano vagy vi)
nano .env
```

**Töltsd ki a következőket:**

```bash
# Server
NODE_ENV=production
PORT=3001

# Database (ISPConfig adatbázis adatokkal)
DB_HOST=localhost
DB_USER=c1projekt_user
DB_PASSWORD=ÍRDBE_ISPCONFIG_ÁLTAL_GENERÁLT_JELSZÓT
DB_NAME=c1projekt_tracker

# JWT Secret (generálj egyet!)
# Futtasd ezt a szerveren:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=ÍRDBE_A_GENERÁLT_64_KARAKTERES_STRINGET
JWT_EXPIRES_IN=7d

# CORS (pontos domain!)
CORS_ORIGIN=https://projekt.sajatdomain.hu

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (opcionális - később beállítható)
EMAIL_ENABLED=false
# EMAIL_FROM="Projekt Követő <noreply@projekt.sajatdomain.hu>"
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-gmail-app-password
```

**JWT Secret generálása:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Kimenet példa: a7f3b8c2d9e4f1a6b5c8d7e2f9a3b6c1d4e7f2a8b9c5d3e6f1a4b7c2d9e5f8a1
```

**Mentés:**
- Nano: `CTRL+X`, majd `Y`, majd `ENTER`
- Vi: `ESC`, majd `:wq`, majd `ENTER`

**✅ CHECKPOINT:** `.env` fájl létrehozva és kitöltve helyes adatokkal.

### 5.4 Biztonság - Fájl Jogosultságok

```bash
# .env fájl biztonságossá tétele (csak root olvashatja)
chmod 600 /opt/project-tracker/backend/.env

# Logs mappa írható
chmod 755 /opt/project-tracker/backend/logs

# Ellenőrzés
ls -la /opt/project-tracker/backend/.env
# Várt kimenet: -rw------- (csak owner read/write)
```

### 5.5 Backend Tesztelés (Development módban)

```bash
# 1. Indítsd el manuálisan a backend-et (tesztelés)
cd /opt/project-tracker/backend
node src/server.js

# Várt kimenet:
# ✅ MySQL connection established
# 🚀 Server running on port 3001
# ⚡ Socket.IO initialized

# 2. Másik terminálban teszteld:
curl http://localhost:3001/api/health

# Várt kimenet:
# {"success":true,"message":"Server is running","timestamp":"..."}

# 3. Állítsd le: CTRL+C
```

**✅ CHECKPOINT:** Backend elindul hiba nélkül és az `/api/health` végpont válaszol.

---

## 6. FRONTEND TELEPÍTÉSE

### 6.1 Frontend Fájlok Másolása ISPConfig Webroot-ba

```bash
# 1. Keresd meg az ISPConfig webroot mappát
# Általában: /var/www/clients/client0/web1/web/
# Pontosítás: ISPConfig → Sites → Website → Web Domain → jobb klikk → Show → Path

# Példa útvonal:
WEBROOT="/var/www/clients/client0/web1/web"

# 2. Másold át a frontend fájlt
cp /opt/project-tracker/frontend/index.html $WEBROOT/

# 3. Másold át a DEMO fájlt is (opcionális)
cp /opt/project-tracker/DEMO-STANDALONE.html $WEBROOT/

# 4. Jogosultságok beállítása (ISPConfig user és group)
# Nézd meg az ISPConfig user-t:
ls -la $WEBROOT/
# Példa kimenet: web1:client0

# Állítsd be a tulajdonost:
chown web1:client0 $WEBROOT/index.html
chown web1:client0 $WEBROOT/DEMO-STANDALONE.html

# 5. Jogosultságok ellenőrzése
ls -la $WEBROOT/
# Várt kimenet: -rw-r--r-- web1 client0 ... index.html
```

**✅ CHECKPOINT:** `index.html` az ISPConfig webroot mappában van, helyes jogosultságokkal.

### 6.2 Frontend API URL Frissítése (Ha Szükséges)

Az aktuális `index.html` már automatikusan detektálja a hostname-t, de ellenőrizzük:

```bash
# Ellenőrizd az API URL konfigot
cd $WEBROOT
grep -n "API_URL\|SOCKET_URL" index.html

# Várt kimenet:
# const hostname = window.location.hostname || 'localhost';
# const API_URL = `http://${hostname}:3001/api`;
# const SOCKET_URL = `http://${hostname}:3001`;
```

**Ha hardcoded localhost van, akkor cseréld ki:**

```bash
# Backup
cp index.html index.html.backup

# Cseréld le (opcionális, csak ha szükséges)
sed -i "s|http://localhost:3001|https://projekt.sajatdomain.hu|g" index.html
```

**FONTOS:** A jelenlegi verzió már automatikus detektálást használ, ezért ez a lépés valószínűleg NEM szükséges!

**✅ CHECKPOINT:** Frontend API URL helyes.

---

## 7. NGINX KONFIGURÁCIÓ

### 7.1 Nginx Directives Beállítása ISPConfig-ban

1. Menü: **Sites** → **Website**
2. Kattints a website-odra (projekt.sajatdomain.hu)
3. Lépj az **Options** fülre
4. Görgess le az **Nginx Directives** mezőhöz

5. **Másold be a következőt:**

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
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_buffering off;
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
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_buffering off;
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

6. Kattints: **Save**

**✅ CHECKPOINT:** ISPConfig automatikusan újratölti az Nginx konfigurációt. Várj 10-20 másodpercet.

### 7.2 Nginx Konfiguráció Ellenőrzése

```bash
# 1. Nginx szintaxis ellenőrzés
nginx -t

# Várt kimenet:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 2. Nginx újratöltés (ha nem automatikus)
systemctl reload nginx

# 3. Nginx státusz ellenőrzés
systemctl status nginx
# Várt kimenet: active (running)
```

**✅ CHECKPOINT:** Nginx hiba nélkül fut, konfiguráció érvényes.

---

## 8. SSL/HTTPS BEÁLLÍTÁSA

### 8.1 Let's Encrypt SSL Automatikus Generálás

Ha az ISPConfig-ban bekapcsoltad a **Let's Encrypt SSL** opciót (3.3 lépés), akkor:

```bash
# 1. Várj 2-5 percet (ISPConfig automatikusan generálja)

# 2. Ellenőrzés
ls -la /var/www/clients/client0/web1/ssl/
# Várt fájlok:
# projekt.sajatdomain.hu.crt
# projekt.sajatdomain.hu.key
# projekt.sajatdomain.hu-le.crt (Let's Encrypt)
```

### 8.2 Kézi SSL Generálás (Ha Automatikus Nem Működött)

```bash
# ISPConfig-ban lépj vissza a website-ra
# Options fül → Let's Encrypt SSL → mentés
# Az ISPConfig újra megpróbálja generálni

# VAGY certbot manuálisan:
certbot certonly --webroot -w /var/www/clients/client0/web1/web -d projekt.sajatdomain.hu
```

### 8.3 HTTPS Tesztelés

```bash
# 1. Böngészőben nyisd meg
https://projekt.sajatdomain.hu

# 2. VAGY curl-lel
curl -I https://projekt.sajatdomain.hu

# Várt kimenet:
# HTTP/2 200
# server: nginx
# ...
```

**✅ CHECKPOINT:** HTTPS működik, nincs SSL hiba a böngészőben (zöld lakat ikon).

---

## 9. PM2 PROCESS MANAGER

### 9.1 Backend Indítása PM2-vel

```bash
# 1. Navigálj a backend mappába
cd /opt/project-tracker/backend

# 2. Indítsd el PM2-vel
pm2 start ecosystem.config.js --env production

# Várt kimenet:
# ┌─────┬──────────────────────────┬─────────────┬─────────┬─────────┬──────────┐
# │ id  │ name                     │ mode        │ ↺       │ status  │ cpu      │
# ├─────┼──────────────────────────┼─────────────┼─────────┼─────────┼──────────┤
# │ 0   │ project-tracker-api      │ fork        │ 0       │ online  │ 0%       │
# └─────┴──────────────────────────┴─────────────┴─────────┴─────────┴──────────┘

# 3. Státusz ellenőrzés
pm2 status

# 4. Logok megtekintése
pm2 logs project-tracker-api --lines 50

# 5. Részletes info
pm2 info project-tracker-api
```

**✅ CHECKPOINT:** PM2 process `online` státuszban van, nincsenek error logok.

### 9.2 PM2 Auto-Start Beállítása (Szerver Újraindulás Esetén)

```bash
# 1. Systemd startup script generálása
pm2 startup systemd

# Kimenet: egy parancsot ad vissza, amit futtass (root-ként):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
# >>> Futtasd le ezt a parancsot!

# 2. Jelenlegi PM2 állapot mentése
pm2 save

# Várt kimenet:
# [PM2] Saving current process list...
# [PM2] Successfully saved in /root/.pm2/dump.pm2

# 3. Ellenőrzés
systemctl status pm2-root
# Várt kimenet: active (running)
```

**✅ CHECKPOINT:** PM2 automatikusan elindul szerver reboot után.

### 9.3 PM2 Hasznos Parancsok

```bash
# Backend újraindítása
pm2 restart project-tracker-api

# Backend leállítása
pm2 stop project-tracker-api

# Backend törlése PM2-ből
pm2 delete project-tracker-api

# Minden folyamat újraindítása
pm2 restart all

# Logok valós időben
pm2 logs project-tracker-api --lines 100

# Monitorozás
pm2 monit

# Lista
pm2 list
```

---

## 10. TESZTELÉS ÉS ELLENŐRZÉS

### 10.1 Backend API Tesztelés

```bash
# 1. Health check
curl https://projekt.sajatdomain.hu/api/health

# Várt kimenet:
# {"success":true,"message":"Server is running","timestamp":"2025-10-26T..."}

# 2. Login teszt
curl -X POST https://projekt.sajatdomain.hu/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Várt kimenet:
# {"success":true,"message":"Login successful","data":{"user":{...},"token":"eyJ..."}}

# 3. Projektek lekérése (token nélkül - hibát kell adnia)
curl https://projekt.sajatdomain.hu/api/projects

# Várt kimenet:
# {"success":false,"message":"No token provided"}
```

**✅ CHECKPOINT:** API végpontok válaszolnak, authentikáció működik.

### 10.2 Frontend Tesztelés Böngészőben

1. Nyisd meg: `https://projekt.sajatdomain.hu`
2. **Elvárt:** Bejelentkezési oldal betöltődik
3. Jelentkezz be:
   - Email: `admin@example.com`
   - Jelszó: `password123`
4. **Elvárt:** Dashboard betöltődik, láthatók a projektek és feladatok
5. **Teszteld:**
   - ✅ Projekt létrehozása
   - ✅ Feladat létrehozása
   - ✅ Feladat státusz módosítása
   - ✅ Naptár nézet (drag & drop)
   - ✅ Dark mode kapcsoló

**✅ CHECKPOINT:** Minden funkció működik, nincs JavaScript hiba (F12 → Console).

### 10.3 Socket.IO Real-Time Tesztelés

1. Nyisd meg 2 böngésző ablakban ugyanazt a domain-t
2. Mindkettőben jelentkezz be (különböző userekkel)
3. Az egyik ablakban hozz létre egy új projektet
4. **Elvárt:** A másik ablakban is azonnal megjelenik (frissítés nélkül)

**✅ CHECKPOINT:** Real-time szinkronizáció működik.

### 10.4 Email Értesítés Tesztelés (Ha Beállítottad)

```bash
# 1. Kapcsold be az emailt a .env fájlban
nano /opt/project-tracker/backend/.env

# 2. Állítsd be:
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# 3. Restart PM2
pm2 restart project-tracker-api

# 4. Tesztelés: Hozz létre egy feladatot és rendelj valakit hozzá
# Várt eredmény: Email érkezik a hozzárendelt usernek
```

### 10.5 Teljesítmény Tesztelés

```bash
# 1. Backend válaszidő
curl -o /dev/null -s -w "Total time: %{time_total}s\n" https://projekt.sajatdomain.hu/api/health

# Várt kimenet: Total time: < 0.5s

# 2. PM2 monitorozás
pm2 monit
# Ellenőrizd: CPU < 10%, Memory < 200MB

# 3. Nginx access log
tail -f /var/log/nginx/access.log
# Ellenőrizd: 200 OK válaszok
```

---

## 11. BIZTONSÁGI BEÁLLÍTÁSOK

### 11.1 .env Fájl Biztonsága

```bash
# Állítsd be, hogy csak root olvashassa
chmod 600 /opt/project-tracker/backend/.env
chown root:root /opt/project-tracker/backend/.env

# Ellenőrzés
ls -la /opt/project-tracker/backend/.env
# Várt kimenet: -rw------- root root
```

### 11.2 Tűzfal Beállítása (UFW)

```bash
# 1. UFW engedélyezése (ha még nincs)
ufw status

# Ha inactive:
ufw enable

# 2. Szükséges portok megnyitása
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 8080/tcp comment 'ISPConfig'

# 3. Port 3001 NE LEGYEN nyitva kívülről (csak localhost-ról érhető el)
# Ez alapértelmezés, nem kell külön zárni

# 4. Ellenőrzés
ufw status numbered

# Várt kimenet:
# [ 1] 22/tcp        ALLOW IN    Anywhere
# [ 2] 80/tcp        ALLOW IN    Anywhere
# [ 3] 443/tcp       ALLOW IN    Anywhere
# [ 4] 8080/tcp      ALLOW IN    Anywhere
```

### 11.3 Fail2Ban Beállítása (SSH védelem)

```bash
# 1. Fail2ban telepítése
apt install -y fail2ban

# 2. Konfiguráció
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local

# 3. SSH jail engedélyezése
[sshd]
enabled = true
port    = 22
filter  = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

# 4. Fail2ban restart
systemctl restart fail2ban

# 5. Ellenőrzés
fail2ban-client status sshd
```

### 11.4 MySQL Biztonság

```bash
# 1. MySQL secure installation
mysql_secure_installation

# Válaszolj IGEN-nel minden kérdésre:
# - Remove anonymous users? YES
# - Disallow root login remotely? YES
# - Remove test database? YES
# - Reload privilege tables? YES

# 2. MySQL bind address ellenőrzése
grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf

# Várt kimenet: bind-address = 127.0.0.1
# (csak localhostról érhető el, nem kívülről)
```

### 11.5 Regular Updates Beállítása

```bash
# Automatikus security updates engedélyezése
apt install -y unattended-upgrades

# Konfiguráció
dpkg-reconfigure --priority=low unattended-upgrades
# Válaszolj: YES
```

---

## 12. MENTÉS ÉS VISSZAÁLLÍTÁS

### 12.1 Teljes Mentés Script

Készíts egy mentési scriptet:

```bash
nano /root/backup-project-tracker.sh
```

**Tartalom:**

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="project-tracker-backup-$DATE.tar.gz"

# Könyvtár létrehozása
mkdir -p $BACKUP_DIR

# 1. Backend fájlok
tar -czf $BACKUP_DIR/backend-$DATE.tar.gz /opt/project-tracker/backend

# 2. Frontend fájlok
tar -czf $BACKUP_DIR/frontend-$DATE.tar.gz /var/www/clients/client0/web1/web

# 3. MySQL adatbázis
mysqldump -u root -p$(cat /root/.my.cnf | grep password | cut -d'"' -f2) c1projekt_tracker > $BACKUP_DIR/database-$DATE.sql

# 4. PM2 konfiguráció
cp /root/.pm2/dump.pm2 $BACKUP_DIR/pm2-dump-$DATE.pm2

# 5. Nginx konfiguráció
cp /etc/nginx/sites-available/projekt.sajatdomain.hu.vhost $BACKUP_DIR/nginx-$DATE.conf

# Összesítés
cd $BACKUP_DIR
tar -czf $BACKUP_FILE backend-$DATE.tar.gz frontend-$DATE.tar.gz database-$DATE.sql pm2-dump-$DATE.pm2 nginx-$DATE.conf
rm -f backend-$DATE.tar.gz frontend-$DATE.tar.gz database-$DATE.sql pm2-dump-$DATE.pm2 nginx-$DATE.conf

echo "Backup completed: $BACKUP_DIR/$BACKUP_FILE"
```

**Futtathatóvá tétel:**

```bash
chmod +x /root/backup-project-tracker.sh

# Tesztelés
/root/backup-project-tracker.sh
```

### 12.2 Automatikus Napi Mentés Cron Job

```bash
# Crontab szerkesztése
crontab -e

# Hozzáadás: minden nap hajnal 3-kor
0 3 * * * /root/backup-project-tracker.sh >> /var/log/project-tracker-backup.log 2>&1

# Ellenőrzés
crontab -l
```

### 12.3 Visszaállítás Mentésből

```bash
# 1. PM2 leállítása
pm2 stop project-tracker-api

# 2. Mentés kicsomagolása
cd /root/backups
tar -xzf project-tracker-backup-YYYYMMDD_HHMMSS.tar.gz

# 3. Backend visszaállítás
tar -xzf backend-YYYYMMDD_HHMMSS.tar.gz -C /

# 4. Frontend visszaállítás
tar -xzf frontend-YYYYMMDD_HHMMSS.tar.gz -C /

# 5. Adatbázis visszaállítás
mysql -u c1projekt_user -p c1projekt_tracker < database-YYYYMMDD_HHMMSS.sql

# 6. PM2 újraindítás
pm2 restart project-tracker-api
```

---

## 13. HIBAELHÁRÍTÁS

### 13.1 Backend Nem Indul El

**Tünet:** PM2 `errored` vagy `stopped` státusz

**Megoldás:**

```bash
# 1. Logok ellenőrzése
pm2 logs project-tracker-api --lines 100

# Gyakori hibák:

# HIBA: "Error: connect ECONNREFUSED ::1:3306"
# OK: MySQL connection hiba
# Megoldás:
nano /opt/project-tracker/backend/.env
# Ellenőrizd: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# HIBA: "Error: ER_ACCESS_DENIED_ERROR"
# OK: Hibás MySQL jelszó
# Megoldás: ISPConfig → Database → Jelszó visszaállítás

# HIBA: "Port 3001 already in use"
# OK: Port foglalt
# Megoldás:
lsof -i :3001
kill -9 [PID]
pm2 restart project-tracker-api
```

### 13.2 Frontend 502 Bad Gateway

**Tünet:** Böngészőben 502 hiba

**Megoldás:**

```bash
# 1. Backend fut-e?
pm2 status
# Ha nem: pm2 restart project-tracker-api

# 2. Nginx konfiguráció szintaxis
nginx -t

# 3. Nginx újratöltés
systemctl reload nginx

# 4. Backend port ellenőrzés
netstat -tulnp | grep 3001
# Várt kimenet: node ... LISTEN 127.0.0.1:3001
```

### 13.3 Socket.IO Nem Működik (Real-Time Sync)

**Tünet:** Változások nem jelennek meg automatikusan

**Megoldás:**

```bash
# 1. Böngésző konzol ellenőrzés (F12)
# Keress "WebSocket" vagy "socket.io" hibákat

# 2. Nginx WebSocket support
# Ellenőrizd az Nginx directives-ben:
# location /socket.io/ { ... proxy_set_header Upgrade $http_upgrade; ... }

# 3. Backend socket.io működik-e
curl -I http://localhost:3001/socket.io/

# Várt kimenet: HTTP/1.1 400 Bad Request (ez OK, mert nem WebSocket kérés)
```

### 13.4 Let's Encrypt SSL Hiba

**Tünet:** SSL certificate nem generálódik

**Megoldás:**

```bash
# 1. Domain DNS ellenőrzés
dig projekt.sajatdomain.hu +short
# Elvárt: szerver IP

# 2. Port 80 nyitva?
ufw status | grep 80

# 3. Kézi certbot
certbot certonly --webroot -w /var/www/clients/client0/web1/web -d projekt.sajatdomain.hu

# 4. Certbot log
tail -f /var/log/letsencrypt/letsencrypt.log
```

### 13.5 "No token provided" Hiba Frontend-en

**Tünet:** Bejelentkezés után "No token provided" vagy azonnal kijelentkezik

**Megoldás:**

```bash
# 1. Böngésző konzol ellenőrzése (F12)
# Keresd: localStorage.authToken

# 2. CORS hiba?
# Backend logs:
pm2 logs project-tracker-api | grep CORS

# 3. .env CORS_ORIGIN ellenőrzés
cat /opt/project-tracker/backend/.env | grep CORS_ORIGIN
# Elvárt: https://projekt.sajatdomain.hu (pontos egyezés!)

# 4. JWT_SECRET hiányzik?
cat /opt/project-tracker/backend/.env | grep JWT_SECRET
# Ne legyen üres!
```

### 13.6 Email Nem Küldjön

**Tünet:** Feladat létrehozásakor nincs email értesítés

**Megoldás:**

```bash
# 1. Email enabled?
cat /opt/project-tracker/backend/.env | grep EMAIL_ENABLED
# Elvárt: true

# 2. SMTP beállítások ellenőrzése
cat /opt/project-tracker/backend/.env | grep SMTP

# 3. Gmail App Password használata (nem a normál jelszó!)
# Google Account → Security → 2-Step Verification → App passwords

# 4. Backend logs
pm2 logs project-tracker-api | grep -i email

# 5. Teszt email küldés
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'your-email@gmail.com', pass: 'your-app-password' }
});
transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test email'
}).then(console.log).catch(console.error);
"
```

### 13.7 Gyakori PM2 Parancsok Hibaelhárításhoz

```bash
# Backend teljes újraindítása
pm2 delete project-tracker-api
pm2 start ecosystem.config.js --env production

# Logok valós időben
pm2 logs project-tracker-api --lines 100 --raw

# Memory leak ellenőrzés
pm2 monit

# Részletes folyamat info
pm2 info project-tracker-api

# Összes folyamat újraindítása
pm2 restart all

# PM2 daemon újraindítása
pm2 kill
pm2 resurrect
```

---

## 🎉 TELEPÍTÉS BEFEJEZVE!

### Ellenőrző Lista (FINAL CHECKLIST)

- ✅ Node.js 20.x telepítve
- ✅ PM2 telepítve és automatikus start beállítva
- ✅ ISPConfig webhely létrehozva
- ✅ MySQL adatbázis létrehozva és séma importálva
- ✅ Backend telepítve, .env konfigurálva
- ✅ Frontend az ISPConfig webroot-ban
- ✅ Nginx directives beállítva (API proxy + Socket.IO)
- ✅ Let's Encrypt SSL működik
- ✅ Backend PM2-n keresztül fut (`pm2 status` → online)
- ✅ API végpontok válaszolnak (curl teszt)
- ✅ Frontend elérhető HTTPS-en
- ✅ Bejelentkezés működik
- ✅ Real-time Socket.IO működik (2 böngésző ablak teszt)
- ✅ Tűzfal beállítva (UFW)
- ✅ Biztonsági beállítások (.env chmod 600, MySQL secure)
- ✅ Napi automatikus mentés beállítva (cron)
- ✅ Email értesítések (opcionális) működnek

### Hasznos Parancsok Gyorsreferencia

```bash
# Backend újraindítás
pm2 restart project-tracker-api

# Logok megtekintése
pm2 logs project-tracker-api --lines 100

# Nginx reload
systemctl reload nginx

# MySQL belépés
mysql -u c1projekt_user -p c1projekt_tracker

# Backup készítés
/root/backup-project-tracker.sh

# .env szerkesztése
nano /opt/project-tracker/backend/.env

# API health check
curl https://projekt.sajatdomain.hu/api/health
```

### Következő Lépések

1. **Felhasználók létrehozása:**
   - Regisztrálj új felhasználókat a frontend-en
   - Vagy SQL-ben: `INSERT INTO users ...`

2. **Email értesítések bekapcsolása** (ha még nem tetted):
   - .env: `EMAIL_ENABLED=true`
   - SMTP beállítások kitöltése
   - `pm2 restart project-tracker-api`

3. **Monitoring beállítása:**
   - PM2 Plus (https://pm2.io) - ingyenes
   - VAGY Uptime Robot (https://uptimerobot.com)

4. **Performance optimalizálás:**
   - Redis cache (opcionális)
   - Nginx gzip compression
   - CDN a statikus fájlokhoz (opcionális)

---

## 📞 SUPPORT ÉS TOVÁBBI INFORMÁCIÓK

- **Projekt dokumentáció:** `/home/user/Project-koveto/README.md`
- **Backend README:** `/home/user/Project-koveto/backend/README.md`
- **Deployment docs:** `/home/user/Project-koveto/DEPLOYMENT.md`

**Sikeres telepítést!** 🚀

---

**Készítette:** Claude Code
**Verzió:** 1.0
**Dátum:** 2025-10-26
**ISPConfig verzió:** 3.2.9p
