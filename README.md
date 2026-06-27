# Arcwell Systems — статический сайт

Полностью статический корпоративный сайт (только HTML / CSS / JavaScript).
Без CMS, без PHP, без Node.js, без базы данных. Каждая страница — это обычный
HTML, который можно отдавать напрямую из корня веб-сервера, например из
`/var/www/html`.

## Содержимое

```
/
├── index.html              Главная
├── about.html              О компании
├── services.html           Услуги
├── contacts.html           Контакты
├── privacy.html            Политика конфиденциальности
├── terms.html              Terms of Service
├── 404.html                Страница «не найдено»
├── robots.txt
├── sitemap.xml
├── manifest.json           Web app manifest
├── favicon.ico
├── .htaccess               Конфигурация Apache (сжатие, кэш, заголовки)
├── css/
│   └── styles.css
├── js/
│   └── main.js             Только прогрессивное улучшение (меню, форма, анимации)
├── images/                 Логотип, favicon, OG-изображение, SVG-иллюстрации
├── news/                   Индекс новостей + 9 статей
├── blog/                   Индекс блога + 9 публикаций
└── deploy/
    └── nginx.conf.example  Эталонный server-блок для nginx
```

## Краткое содержание (TL;DR)

```sh
# 1. Скопировать файлы сайта в корень веб-сервера
sudo rsync -a --exclude='.git' --exclude='deploy' --exclude='README.md' ./ /var/www/html/

# 2. Выставить владельца и права
sudo chown -R www-data:www-data /var/www/html
sudo find /var/www/html -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f -exec chmod 644 {} \;

# 3. Настроить веб-сервер (Apache или nginx — см. ниже) и TLS-сертификат
```

После этого сайт работает «как есть»: точка входа — `index.html`, страница
ошибки — `404.html`.

---

# Подробная инструкция по развёртыванию

Ниже два полных сценария: **nginx** и **Apache**. Команды приведены для
Debian/Ubuntu; для других дистрибутивов отличаются только имена пакетов и
путь к каталогу конфигов.

## 0. Предварительные требования

- Сервер с Linux (Ubuntu 20.04+/Debian 11+ или аналог) и root/sudo-доступом.
- Доменное имя, A/AAAA-запись которого указывает на IP-адрес сервера
  (нужно для выпуска TLS-сертификата).
- Открытые порты **80** (HTTP) и **443** (HTTPS) в файрволе/группе
  безопасности.

> Везде в примерах используется домен `www.arcwellsystems.com`. Замените его
> на свой реальный домен. Также при необходимости поменяйте контактные данные
> и адрес в подвале страниц и в `sitemap.xml`/`manifest.json`/мета-тегах
> (см. раздел «Что заменить под свой домен»).

## 1. Загрузка файлов на сервер

Вариант А — клонировать репозиторий и скопировать содержимое:

```sh
git clone <URL-репозитория> arcwell
cd arcwell
sudo mkdir -p /var/www/html
sudo rsync -a --exclude='.git' --exclude='deploy' --exclude='README.md' ./ /var/www/html/
```

Вариант Б — загрузить архив/файлы по SFTP (`scp`/`rsync`) в `/var/www/html`.

Проверьте, что файлы на месте:

```sh
ls -la /var/www/html
# должны быть index.html, css/, js/, images/, news/, blog/, и т.д.
```

## 2. Права доступа

Веб-сервер должен иметь право читать файлы (но не писать в них):

```sh
sudo chown -R www-data:www-data /var/www/html
sudo find /var/www/html -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f -exec chmod 644 {} \;
```

> В CentOS/RHEL пользователь веб-сервера обычно `nginx` или `apache`, а не
> `www-data`. Если включён SELinux, выполните также
> `sudo restorecon -Rv /var/www/html`.

---

## 3А. Развёртывание на nginx

### Установка

```sh
sudo apt update
sudo apt install -y nginx
```

### Конфигурация сайта

Скопируйте эталонный конфиг и откройте его для правки:

```sh
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/arcwell
sudo nano /etc/nginx/sites-available/arcwell
```

Что нужно проверить/поменять в файле:

- `server_name` — ваш домен (обе строки: с `www` и без).
- `root` — путь к файлам (`/var/www/html`).
- `ssl_certificate` и `ssl_certificate_key` — пути к сертификату и ключу.
  Если вы будете выпускать сертификат через certbot (см. ниже), он сам
  пропишет эти строки — тогда временно можно закомментировать секцию TLS и
  поднять сайт только на 80-м порту, а HTTPS добавить на шаге с certbot.

Включите сайт и (опционально) отключите дефолтный:

```sh
sudo ln -s /etc/nginx/sites-available/arcwell /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Проверьте синтаксис и перезапустите:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

### TLS-сертификат (Let's Encrypt)

```sh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.arcwellsystems.com -d arcwellsystems.com
```

Certbot сам выпустит сертификат, пропишет пути в конфиге и настроит
автоматическое продление. Проверьте таймер продления:

```sh
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### Brotli (необязательно)

В стандартной поставке nginx модуля Brotli нет. gzip уже включён в конфиге и
его достаточно. Если нужен Brotli — установите пакет
`libnginx-mod-http-brotli` (если доступен в вашем дистрибутиве) и
раскомментируйте строки `brotli ...` в начале конфига.

---

## 3Б. Развёртывание на Apache

### Установка и модули

```sh
sudo apt update
sudo apt install -y apache2
sudo a2enmod headers expires deflate mime rewrite
# Brotli (необязательно), если модуль доступен:
sudo a2enmod brotli
sudo systemctl restart apache2
```

### Подключение .htaccess

Файл `.htaccess` уже лежит в корне сайта и включает сжатие, кэширование,
ETag, страницу 404 и заголовки безопасности. Чтобы Apache его учитывал, в
конфиге виртуального хоста для каталога `/var/www/html` должно быть
`AllowOverride All`. Пример виртуального хоста
`/etc/apache2/sites-available/arcwell.conf`:

```apache
<VirtualHost *:80>
    ServerName www.arcwellsystems.com
    ServerAlias arcwellsystems.com
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Включите сайт:

```sh
sudo a2ensite arcwell
sudo a2dissite 000-default
sudo apache2ctl configtest
sudo systemctl reload apache2
```

### TLS-сертификат (Let's Encrypt)

```sh
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d www.arcwellsystems.com -d arcwellsystems.com
```

Certbot создаст HTTPS-виртуалхост и настроит редирект с HTTP на HTTPS.

---

## 4. Проверка после развёртывания

Откройте сайт в браузере: `https://www.arcwellsystems.com` — должна
загрузиться главная страница. Затем проверьте ключевые вещи из консоли:

```sh
# Заголовки безопасности и тип контента
curl -sI https://www.arcwellsystems.com | grep -iE \
  'strict-transport|content-type|x-content-type|referrer|permissions-policy|x-frame|content-security'

# Сжатие (должно быть Content-Encoding: gzip или br)
curl -s -H 'Accept-Encoding: gzip, br' -I https://www.arcwellsystems.com/css/styles.css | grep -i content-encoding

# HTTP/2 (должно быть HTTP/2 200)
curl -sI --http2 https://www.arcwellsystems.com | head -1

# ETag и Last-Modified на статике
curl -sI https://www.arcwellsystems.com/css/styles.css | grep -iE 'etag|last-modified|cache-control'

# Страница 404 (должен быть код 404 и наш дизайн)
curl -sI https://www.arcwellsystems.com/this-page-does-not-exist | head -1

# robots и sitemap
curl -s https://www.arcwellsystems.com/robots.txt
curl -sI https://www.arcwellsystems.com/sitemap.xml | head -1
```

Дополнительно стоит проверить:

- редирект `http://` → `https://` работает;
- автопродление сертификата (`sudo certbot renew --dry-run`);
- валидность разметки и Open Graph во внешних валидаторах при необходимости.

## 5. Обновление сайта

Сайт статический, поэтому обновление — это просто перезапись файлов:

```sh
cd arcwell
git pull
sudo rsync -a --delete --exclude='.git' --exclude='deploy' --exclude='README.md' ./ /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

Перезапускать веб-сервер не нужно. HTML отдаётся с `must-revalidate`, поэтому
изменения подхватываются сразу; статические ресурсы (`css/js/svg/png`) имеют
долгий кэш — если потребуется принудительно обновить их у пользователей,
поменяйте имя файла или добавьте версию в URL (`styles.css?v=2`).

---

# Что заменить под свой домен

Если вы поднимаете сайт на собственном домене, замените `arcwellsystems.com`
на ваш домен в следующих местах:

- мета-теги `canonical`, `og:url`, `og:image`, `twitter:image` во всех `*.html`;
- абсолютные URL в `sitemap.xml`;
- `Sitemap:` в `robots.txt`;
- `start_url`/иконки при необходимости в `manifest.json`;
- `server_name` и пути сертификатов в конфиге nginx/Apache;
- контактные данные и адрес в подвале страниц и на странице контактов.

Быстрая массовая замена домена (выполнять до копирования в `/var/www/html`):

```sh
grep -rl 'arcwellsystems.com' . --include='*.html' --include='*.xml' \
  --include='*.json' --include='*.txt' \
  | xargs sed -i 's/arcwellsystems\.com/ВАШ-ДОМЕН.ru/g'
```

---

# HTTP-поведение

Конфигурации серверов настроены так, чтобы корректно работать с:

- **Сжатием** — gzip и (опционально) Brotli для текстовых ресурсов.
- **HTTP/2** — включён в примере для nginx.
- **Кэшированием** — `Cache-Control: immutable` для `css/js/svg/png/ico`,
  ревалидация для HTML, более короткий кэш для манифеста.
- **ETag** и **Last-Modified** — отдаются веб-сервером (strong validators).
- **Content-Type** — явные MIME-типы с `charset=utf-8`.

# Заголовки безопасности

Обе конфигурации выставляют: `Strict-Transport-Security` (HSTS),
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
`X-Frame-Options` и `Content-Security-Policy`, ограничивающую всё до `'self'`
(с `'unsafe-inline'` для небольшого числа инлайновых атрибутов `style` и
`data:` для фоновых иконок в CSS). Все ресурсы — первой стороны: нет внешних
CDN, шрифтов, аналитики и рекламных скриптов.

# SEO

Каждая страница содержит уникальные `title` и `meta description`, ссылку
`canonical`, метаданные Open Graph и Twitter Cards, а также структурированные
данные JSON-LD (`Organization` и `WebSite` на главной,
`Article`/`BlogPosting` и `BreadcrumbList` на страницах контента). Файлы
`robots.txt` и `sitemap.xml` включены.
