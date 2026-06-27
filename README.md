# Arcwell Systems — static website

A fully static corporate website (HTML / CSS / JavaScript only). No CMS, no
PHP, no Node.js, no database. Every page is plain HTML and can be served
directly from a web root such as `/var/www/html`.

## Contents

```
/
├── index.html              Home
├── about.html              About the company
├── services.html          Services
├── contacts.html          Contact
├── privacy.html            Privacy Policy
├── terms.html              Terms of Service
├── 404.html                Not-found page
├── robots.txt
├── sitemap.xml
├── manifest.json           Web app manifest
├── favicon.ico
├── .htaccess               Apache config (compression, caching, headers)
├── css/
│   └── styles.css
├── js/
│   └── main.js             Progressive enhancement only (nav, form, reveal)
├── images/                 Logo, favicons, OG image, SVG illustrations
├── news/                   Newsroom index + 9 articles
├── blog/                   Engineering blog index + 9 posts
└── deploy/
    └── nginx.conf.example  Reference nginx server block
```

## Deploying

### Quick start

Copy the contents of this repository into your web root:

```sh
rsync -a --exclude='.git' --exclude='deploy' --exclude='README.md' ./ /var/www/html/
```

The site is then served as-is. `index.html` is the entry point and
`404.html` is the not-found page.

### Apache

The included `.htaccess` enables gzip/Brotli compression, long-lived caching
for static assets, ETag/Last-Modified validators, the custom 404 page, and the
security headers below. Ensure `mod_headers`, `mod_expires`, `mod_deflate`
(and optionally `mod_brotli`), and `mod_mime` are enabled, and that
`AllowOverride All` is set for the directory.

### nginx

Use `deploy/nginx.conf.example` as a starting point. Set `server_name` and the
TLS certificate paths, then enable the site. It configures HTTP/2, gzip
(Brotli optional), caching, correct MIME types, and the security headers.

## HTTP behaviour

The provided server configs are set up to work correctly with:

- **Compression** — gzip and (optionally) Brotli for text assets.
- **HTTP/2** — enabled in the nginx example.
- **Caching** — `Cache-Control: immutable` for `css/js/svg/png/ico`,
  revalidation for HTML, shorter cache for the manifest.
- **ETag** and **Last-Modified** — left to the web server's strong validators.
- **Content-Type** — explicit MIME types with `charset=utf-8`.

## Security headers

Both configs set: `Strict-Transport-Security` (HSTS), `X-Content-Type-Options:
nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, and a
`Content-Security-Policy` that restricts everything to `'self'` (with
`'unsafe-inline'` for the small number of inline `style` attributes and
`data:` for inline CSS background icons). All assets are first-party — there
are no external CDNs, fonts, analytics, or advertising scripts.

## SEO

Every page includes a unique `title` and `meta description`, a `canonical`
link, Open Graph and Twitter Card metadata, and JSON-LD structured data
(`Organization` and `WebSite` on the home page, `Article`/`BlogPosting` plus
`BreadcrumbList` on content pages). `robots.txt` and `sitemap.xml` are
included.
