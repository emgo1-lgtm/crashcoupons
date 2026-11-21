const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = __dirname;
const couponsDataFile = path.join(baseDir, 'assets/front/js/coupons-data.js');
const indexHtmlFile = path.join(baseDir, 'index.html');

const couponsDataCode = fs.readFileSync(couponsDataFile, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlFile, 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(couponsDataCode, sandbox);

const brands = sandbox.window.LOCAL_BRANDS || {};
const coupons = sandbox.window.LOCAL_COUPONS || {};

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str || '').replace(/[&<>"']/g, c => map[c]);
}

function decodeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
}

function getRandomCount(id, min, max) {
    const seed = ((id * 2654435761) >>> 0) % (max - min + 1);
    return min + seed;
}

// Extract modal markup from index.html
const modalOverlayMatch = indexHtml.match(/<!-- Alpine\.js Modal Overlay -->[\s\S]*?(?=<!-- Foot Scripts -->|<\/body>)/i) 
    || indexHtml.match(/<div x-data="" x-show="\$store\.couponModal\.isOpen" class="modal-overlay"[\s\S]*?(?=<!-- Foot Scripts -->|<\/body>)/i);

let modalMarkup = '';
if (modalOverlayMatch) {
    modalMarkup = modalOverlayMatch[0];
}

// Extract script head for modal
const modalScriptMatch = indexHtml.match(/<script>\s*function getCouponFromUrl\(\)[\s\S]*?<\/script>/i);
let modalScript = modalScriptMatch ? modalScriptMatch[0] : '';
// Replace baseUrl: '.' with baseUrl: ''
modalScript = modalScript.replace("baseUrl: '.',", "baseUrl: '',");

const brandsDir = path.join(baseDir, 'brands');
if (!fs.existsSync(brandsDir)) {
    fs.mkdirSync(brandsDir, { recursive: true });
}

const sitemapUrls = [
    { loc: 'https://crashcoupons.online/', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://crashcoupons.online/brands', priority: '0.9', changefreq: 'daily' },
    { loc: 'https://crashcoupons.online/about', priority: '0.8', changefreq: 'weekly' },
    { loc: 'https://crashcoupons.online/adbluemedia-locker', priority: '0.7', changefreq: 'weekly' },
    { loc: 'https://crashcoupons.online/contact', priority: '0.6', changefreq: 'monthly' },
    { loc: 'https://crashcoupons.online/privacy', priority: '0.5', changefreq: 'monthly' },
    { loc: 'https://crashcoupons.online/terms', priority: '0.5', changefreq: 'monthly' }
];

const brandList = Object.values(brands).sort((a, b) => a.brand_name.localeCompare(b.brand_name));

brandList.forEach(brand => {
    const brandName = decodeHtml(brand.brand_name);
    const slug = slugify(brandName);
    const brandCoupons = Object.values(coupons).filter(c => parseInt(c.brand_id, 10) === parseInt(brand.id, 10));
    const count = brandCoupons.length;
    const brandLogo = brand.brand_logo ? `/${brand.brand_logo}` : '/public/assets/uploads/favicons/favicon_69cbf2b8bcc8e.png';

    sitemapUrls.push({
        loc: `https://crashcoupons.online/brands/${slug}`,
        priority: '0.8',
        changefreq: 'daily'
    });

    const pageTitle = `${escapeHtml(brandName)} Crash Coupon Codes &amp; Promo Deals – CrashCoupons`;
    const metaDesc = `Get verified ${escapeHtml(brandName)} crash coupon promo codes, free game keys, and secret share codes on CrashCoupons. Tested and updated daily for maximum savings.`;
    const canonicalUrl = `https://crashcoupons.online/brands/${slug}`;

    const cardsHtml = brandCoupons.map(c => {
        const title = escapeHtml(decodeHtml(c.coupon_title || ''));
        const incent = escapeHtml(decodeHtml(c.coupon_short_incent || 'Free Deal'));
        const shortDesc = escapeHtml(decodeHtml(c.coupon_short_description || ''));
        const rating = Number(c.coupon_rating || 4.9).toFixed(1);
        const bannerSrc = c.coupon_banner ? `/public/${c.coupon_banner}` : '/public/assets/uploads/coupon_banners/coupon_307_fee38f825078c8c1.jpg';
        const brandLogoSrc = c.brand_logo ? `/public/${c.brand_logo}` : brandLogo;
        const couponsLeft = getRandomCount(c.id, 120, 999);
        const usesToday = getRandomCount(c.id + 77, 12, 89);

        return `
        <div class="col">
            <div class="card h-100 coupon-card coupon-card-standard bg hover:bg-secondary rounded-4 border border-light transition-all shadow-sm">
                <div class="banner-section position-relative">
                    <img src="${bannerSrc}" class="card-img-top banner-image" alt="${title}" loading="lazy">
                    <div class="position-absolute top-0 start-0 m-3">
                        <div class="rating-badge bg-secondary-lightest backdrop-blur-sm rounded-pill d-flex align-items-center gap-1 py-1 px-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" class="accent">
                                <path d="M17.286 21.09q -1.69 .001 -5.288 -2.615q -3.596 2.617 -5.288 2.616q -2.726 0 -.495 -6.8q -9.389 -6.775 2.135 -6.775h.076q 1.785 -5.516 3.574 -5.516q 1.785 0 3.574 5.516h.076q 11.525 0 2.133 6.774q 2.23 6.802 -.497 6.8"></path>
                            </svg>
                            <span class="smallest fw-600 text">${rating}</span>
                        </div>
                    </div>
                    ${c.coupon_badge ? `
                    <div class="position-absolute top-0 end-0 m-3">
                        <span class="badge bg-accent text-white rounded-pill px-2 py-1 smallest fw-600">${escapeHtml(decodeHtml(c.coupon_badge))}</span>
                    </div>` : ''}
                </div>
                <div class="card-body pt-4">
                    <div class="d-flex flex-column h-100">
                        <div class="mb-xl-3 mb-2">
                            <h3 class="card-title h5 fw-600 mb-1">${title}</h3>
                            <p class="card-subtitle small text-third mb-0">${escapeHtml(brandName)}</p>
                        </div>
                        <div class="coupon-incentive mt-auto mb-3">
                            <div class="coupon-incentive-inner bg-secondary rounded-3 position-relative overflow-hidden">
                                <div class="incentive-content p-3 text-center position-relative">
                                    <span class="incentive-text accent fw-600">${incent}</span>
                                    <span class="d-block short-description-text small text fw-600 mt-xl-2 mt-1">${shortDesc}</span>
                                </div>
                                <div class="incentive-circle start"></div>
                                <div class="incentive-circle end"></div>
                            </div>
                        </div>
                        <div class="coupons-remaining-wrapper bg-accent-lightest rounded-5 px-3 py-1 d-inline-flex mx-auto mb-2 align-items-center justify-content-center" data-coupon-id="${c.id}">
                            <div class="d-flex align-items-center gap-sm-2 gap-1 small accent">
                                <svg class="icon-rotate" width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14.005 4H9.99502C6.21439 4 4.32407 4 3.14958 5.17157C2.34091 5.97823 2.08903 7.12339 2.01058 8.98947C1.99502 9.35954 1.98724 9.54458 2.05634 9.66802C2.12545 9.79147 2.40133 9.94554 2.95308 10.2537C3.56586 10.5959 3.98007 11.2497 3.98007 12C3.98007 12.7503 3.56586 13.4041 2.95308 13.7463C2.40133 14.0545 2.12545 14.2085 2.05634 14.332C1.98724 14.4554 1.99502 14.6405 2.01058 15.0105C2.08903 16.8766 2.34091 18.0218 3.14958 18.8284C4.32407 20 6.21439 20 9.99502 20H14.005C17.7856 20 19.6759 20 20.8504 18.8284C21.6591 18.0218 21.911 16.8766 21.9894 15.0105C22.005 14.6405 22.0128 14.4554 21.9437 14.332C21.8746 14.2085 21.5987 14.0545 21.0469 13.7463C20.4341 13.4041 20.0199 12.7503 20.0199 12C20.0199 11.2497 20.4341 10.5959 21.0469 10.2537C21.5987 9.94554 21.8746 9.79147 21.9437 9.66802C22.0128 9.54458 22.005 9.35954 21.9894 8.98947C21.911 7.12339 21.6591 5.97823 20.8504 5.17157C19.6759 4 17.7856 4 14.005 4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M9 15L15 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                                    <path d="M14.5 14.5H14.509" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M9.5 9.5H9.509" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                                <span class="smallest fw-500">
                                    <span class="coupons-count">${couponsLeft}</span> coupons left
                                </span>
                            </div>
                        </div>
                        <button type="button" onclick="window.Alpine && window.Alpine.store('couponModal').open(${c.id});" class="btn-reveal border-0 bg-accent text-white rounded-2 py-2 px-2 fw-500 d-flex align-items-center justify-content-center gap-2 w-100">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="6" cy="6" r="3"></circle>
                                <circle cx="6" cy="18" r="3"></circle>
                                <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                                <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                                <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                            </svg>
                            <span>Get Code</span>
                        </button>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top border-light py-2 px-3">
                    <div class="d-flex align-items-center justify-content-between smallest text-third">
                        <span class="d-flex align-items-center gap-1">
                            <i class="bi bi-infinity accent"></i>
                            <span>No expiration</span>
                        </span>
                        <span class="d-flex align-items-center gap-1">
                            <i class="bi bi-people accent"></i>
                            <span class="uses-count" data-coupon-id="${c.id}">${usesToday} uses today</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="en" data-bs-theme="light" data-accent-color="a-c-c5">
<head>
    <!-- Google Tag Manager -->
    <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-5KQ439BM"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <meta name="keywords" content="${escapeHtml(brandName)} crash coupon, ${escapeHtml(brandName)} coupons, ${escapeHtml(brandName)} promo codes, crash coupon, crash coupons, crashcoupons, verified coupons">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="CrashCoupons">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${escapeHtml(metaDesc)}">
    <meta property="og:image" content="https://crashcoupons.online/public/assets/uploads/coupon_banners/coupon_307_fee38f825078c8c1.jpg">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${canonicalUrl}">
    <meta name="twitter:title" content="${pageTitle}">
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
    <meta name="twitter:image" content="https://crashcoupons.online/public/assets/uploads/coupon_banners/coupon_307_fee38f825078c8c1.jpg">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://crashcoupons.online/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Brands",
              "item": "https://crashcoupons.online/brands"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "${escapeHtml(brandName)}",
              "item": "${canonicalUrl}"
            }
          ]
        },
        {
          "@type": "CollectionPage",
          "@id": "${canonicalUrl}#webpage",
          "url": "${canonicalUrl}",
          "name": "${pageTitle}",
          "description": "${escapeHtml(metaDesc)}",
          "isPartOf": {
            "@type": "WebSite",
            "name": "CrashCoupons",
            "alternateName": ["crash coupon", "crash coupons", "crashcoupons"],
            "url": "https://crashcoupons.online/"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Where can I find an active ${escapeHtml(brandName)} crash coupon?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can find every verified ${escapeHtml(brandName)} crash coupon right here on CrashCoupons. All offers are hand-tested daily for guaranteed redemption."
              }
            },
            {
              "@type": "Question",
              "name": "How do I redeem my ${escapeHtml(brandName)} coupon code?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Select your preferred ${escapeHtml(brandName)} deal, click Get Code to reveal your exclusive code, and apply it during checkout on the official store or game launcher."
              }
            },
            {
              "@type": "Question",
              "name": "Are ${escapeHtml(brandName)} crash coupons completely free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, all ${escapeHtml(brandName)} codes and deals on CrashCoupons are 100% free with no registration or hidden fees required."
              }
            }
          ]
        }
      ]
    }
    </script>

    <meta name="base-url" content="/">
    <link rel="icon" type="image/x-icon" href="/public/assets/uploads/favicons/favicon_69cbf2b8bcc8e.png">
    <script>
        if (localStorage.getItem('user_color_mode')) {
            document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('user_color_mode'));
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&amp;display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/assets/front/css/colors.css">
    <link rel="stylesheet" href="/assets/front/css/utility.css">
    <link rel="stylesheet" href="/assets/front/css/style.css">

    ${modalScript}
    <script src="/assets/front/js/coupons-data.js"></script>
    <script defer="" src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5KQ439BM" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

    <!-- Header -->
    <header class="header d-flex align-items-center justify-content-center bg border-b border-light">
        <nav class="navbar navbar-expand w-100">
            <div class="container container-2xl">
                <div class="d-flex align-items-center w-100 gap-3">
                    <a class="navbar-brand p-0 flex-shrink-0" href="/">
                        <img src="/public/assets/uploads/logo_darks/logo_dark_69cbf7933898f.png" class="theme-logo" data-light-src="/public/assets/uploads/logo_darks/logo_dark_69cbf7933898f.png" data-dark-src="/public/assets/uploads/logo_lights/logo_light_69cbf7907a240.png" alt="CrashCoupons Logo" height="28">
                    </a>
                    <div class="search-form-wrapper flex-grow-1 mx-2" style="max-width: 500px;">
                        <form action="/" method="GET" class="position-relative">
                            <input type="search" name="q" class="form-control header-search text-third rounded-3 bg-secondary border border-subtle" placeholder="👉 Search games &amp; coupons..." aria-label="Search" autocomplete="off">
                        </form>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <a href="/brands" class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-none d-sm-inline-flex">All Games</a>
                        <button class="btn btn-theme-switch btn-link nav-link p-1" id="themeToggle" type="button" aria-label="Toggle theme">
                            <i class="bi bi-sun-fill theme-icon-light" style="font-size: 1.2rem; color: var(--accent);"></i>
                            <i class="bi bi-moon-stars-fill theme-icon-dark" style="font-size: 1.2rem; color: var(--accent);"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    </header>

    <div class="main-wrapper">
        <main class="main-content px-xl-5 px-3 py-sm-5 py-4 container-2xl">
            <!-- Breadcrumbs -->
            <nav aria-label="breadcrumb" class="mb-4">
                <ol class="breadcrumb small">
                    <li class="breadcrumb-item"><a href="/" class="text-accent text-decoration-none">Home</a></li>
                    <li class="breadcrumb-item"><a href="/brands" class="text-accent text-decoration-none">Brands</a></li>
                    <li class="breadcrumb-item active text-third" aria-current="page">${escapeHtml(brandName)}</li>
                </ol>
            </nav>

            <!-- Brand Header Banner -->
            <div class="brand-hero bg-secondary border border-light rounded-4 p-4 mb-4">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div class="d-flex align-items-center gap-3">
                        <div class="bg rounded-3 p-2 border border-light" style="width: 64px; height: 64px;">
                            <img src="${brandLogo}" alt="${escapeHtml(brandName)} Logo" class="img-fluid rounded-2 h-100 w-100 object-fit-cover" onerror="this.src='/public/assets/uploads/favicons/favicon_69cbf2b8bcc8e.png'">
                        </div>
                        <div>
                            <h1 class="h3 fw-600 mb-1">${escapeHtml(brandName)} Crash Coupon &amp; Promo Deals</h1>
                            <p class="text-third small mb-0">Verified <strong>${escapeHtml(brandName)}</strong> coupons, redeem keys, and digital discount codes.</p>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill small">
                            <i class="bi bi-patch-check-fill me-1"></i> 100% Hand-Tested
                        </span>
                        <span class="badge bg-secondary-lightest text px-3 py-2 rounded-pill small">
                            ${count} Active Code${count === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Coupons Grid -->
            <section class="all-coupons-section mb-5">
                <h2 class="h5 fw-600 mb-3 text">Available ${escapeHtml(brandName)} Crash Coupons</h2>
                <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-xl-4 g-3">
                    ${cardsHtml}
                </div>
            </section>

            <!-- FAQ Section -->
            <section class="mt-5 pt-4 border-top border-light">
                <div class="row g-4">
                    <div class="col-lg-8">
                        <h2 class="h4 fw-600 mb-3 text">Frequently Asked Questions About ${escapeHtml(brandName)} Deals</h2>
                        <div class="mb-4">
                            <h3 class="h6 fw-semibold text mb-1">Where is the best place to find an active ${escapeHtml(brandName)} crash coupon?</h3>
                            <p class="text-third small mb-3">
                                CrashCoupons verifies each <strong>${escapeHtml(brandName)} crash coupon</strong> daily against official storefronts and launchers so you never waste time with expired promo codes.
                            </p>

                            <h3 class="h6 fw-semibold text mb-1">How do I redeem my ${escapeHtml(brandName)} coupon code?</h3>
                            <p class="text-third small mb-3">
                                Click 'Get Code' on your chosen ${escapeHtml(brandName)} offer to open the instant unlock window. Copy your unique verified code and paste it at checkout on the official game or merchant page.
                            </p>

                            <h3 class="h6 fw-semibold text mb-1">Are ${escapeHtml(brandName)} crash coupons really free?</h3>
                            <p class="text-third small mb-0">
                                Yes, every coupon listed on CrashCoupons is 100% free with no hidden fees, paid subscriptions, or credit card requirements.
                            </p>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="p-3 bg-secondary rounded-4 border border-light">
                            <h3 class="h6 fw-600 mb-2 text"><i class="bi bi-shield-check text-accent me-2"></i>Verification Guarantee</h3>
                            <p class="text-third small mb-2">Every ${escapeHtml(brandName)} promo code listed on this page is tested by our human editorial team.</p>
                            <a href="/brands" class="btn btn-sm btn-outline-secondary rounded-pill w-100">Explore More Brands</a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- Footer -->
    <footer class="footer bg border-t border-light mt-5">
        <div class="container py-4 text-center">
            <p class="mb-2 text-third small">© 2026 CrashCoupons.com. All rights reserved. • Curated by the CrashCoupons Editorial Team</p>
            <div class="d-flex justify-content-center flex-wrap gap-3 small">
                <a href="/" class="text-third text-decoration-none">Home</a>
                <span class="text-third">•</span>
                <a href="/brands" class="text-third text-decoration-none">All Brands</a>
                <span class="text-third">•</span>
                <a href="/about" class="text-third text-decoration-none">About CrashCoupons</a>
                <span class="text-third">•</span>
                <a href="/privacy" class="text-third text-decoration-none">Privacy Policy</a>
                <span class="text-third">•</span>
                <a href="/terms" class="text-third text-decoration-none">Terms of Service</a>
                <span class="text-third">•</span>
                <a href="/contact" class="text-third text-decoration-none">Contact Us</a>
            </div>
        </div>
    </footer>

    ${modalMarkup}

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-bs-theme');
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-bs-theme', next);
                localStorage.setItem('user_color_mode', next);
            });
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(brandsDir, `${slug}.html`), htmlContent, 'utf8');
});

console.log(`Generated ${brandList.length} brand pages in /brands/`);

// Generate brands/index.html (Directory)
const brandsGridHtml = brandList.map(b => {
    const name = decodeHtml(b.brand_name);
    const slug = slugify(name);
    const logo = b.brand_logo ? `/${b.brand_logo}` : '/public/assets/uploads/favicons/favicon_69cbf2b8bcc8e.png';
    const count = Object.values(coupons).filter(c => parseInt(c.brand_id, 10) === parseInt(b.id, 10)).length;

    return `
    <div class="col">
        <a href="/brands/${slug}" class="card h-100 bg hover:bg-secondary border border-light rounded-4 p-3 text-decoration-none transition-all shadow-sm d-flex flex-column align-items-center text-center">
            <div class="bg-secondary rounded-3 p-2 mb-2 d-flex align-items-center justify-content-center" style="width: 56px; height: 56px;">
                <img src="${logo}" alt="${escapeHtml(name)}" class="img-fluid rounded-2 h-100 w-100 object-fit-cover" onerror="this.src='/public/assets/uploads/favicons/favicon_69cbf2b8bcc8e.png'">
            </div>
            <div class="fw-600 text mb-1 text-truncate w-100" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
            <small class="text-third">${count} coupon${count === 1 ? '' : 's'}</small>
        </a>
    </div>`;
}).join('\n');

const brandsDirectoryHtml = `<!DOCTYPE html>
<html lang="en" data-bs-theme="light" data-accent-color="a-c-c5">
<head>
    <!-- Google Tag Manager -->
    <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-5KQ439BM"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Games &amp; Brands – Verified Crash Coupon Directory | CrashCoupons</title>
    <meta name="description" content="Browse the complete directory of games and brands with verified crash coupon codes on CrashCoupons. Discover promo codes for Roblox, Fortnite, Forza, and 100+ top titles.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://crashcoupons.online/brands">

    <link rel="icon" type="image/x-icon" href="/public/assets/uploads/favicons/favicon_69cbf2b8bcc8e.png">
    <script>
        if (localStorage.getItem('user_color_mode')) {
            document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('user_color_mode'));
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&amp;display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/assets/front/css/colors.css">
    <link rel="stylesheet" href="/assets/front/css/utility.css">
    <link rel="stylesheet" href="/assets/front/css/style.css">
</head>
<body>
    <header class="header d-flex align-items-center justify-content-center bg border-b border-light">
        <nav class="navbar navbar-expand w-100">
            <div class="container container-2xl">
                <div class="d-flex align-items-center w-100 gap-3">
                    <a class="navbar-brand p-0 flex-shrink-0" href="/">
                        <img src="/public/assets/uploads/logo_darks/logo_dark_69cbf7933898f.png" class="theme-logo" data-light-src="/public/assets/uploads/logo_darks/logo_dark_69cbf7933898f.png" data-dark-src="/public/assets/uploads/logo_lights/logo_light_69cbf7907a240.png" alt="CrashCoupons Logo" height="28">
                    </a>
                    <div class="search-form-wrapper flex-grow-1 mx-2" style="max-width: 500px;">
                        <form action="/" method="GET" class="position-relative">
                            <input type="search" name="q" class="form-control header-search text-third rounded-3 bg-secondary border border-subtle" placeholder="👉 Search games &amp; coupons..." aria-label="Search" autocomplete="off">
                        </form>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <a href="/" class="btn btn-sm btn-outline-secondary rounded-pill px-3">Home</a>
                        <button class="btn btn-theme-switch btn-link nav-link p-1" id="themeToggle" type="button" aria-label="Toggle theme">
                            <i class="bi bi-sun-fill theme-icon-light" style="font-size: 1.2rem; color: var(--accent);"></i>
                            <i class="bi bi-moon-stars-fill theme-icon-dark" style="font-size: 1.2rem; color: var(--accent);"></i>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    </header>

    <div class="main-wrapper">
        <main class="main-content px-xl-5 px-3 py-sm-5 py-4 container-2xl">
            <nav aria-label="breadcrumb" class="mb-4">
                <ol class="breadcrumb small">
                    <li class="breadcrumb-item"><a href="/" class="text-accent text-decoration-none">Home</a></li>
                    <li class="breadcrumb-item active text-third" aria-current="page">Brands &amp; Games Directory</li>
                </ol>
            </nav>

            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <h1 class="h3 fw-600 mb-1">All Games &amp; Brands Directory</h1>
                    <p class="text-third small mb-0">Browse all 118 game titles and brands with active, hand-tested crash coupon deals.</p>
                </div>
                <span class="badge bg-secondary-lightest text px-3 py-2 rounded-pill small">118 Brands Listed</span>
            </div>

            <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-3 mb-5">
                ${brandsGridHtml}
            </div>
        </main>
    </div>

    <footer class="footer bg border-t border-light mt-5">
        <div class="container py-4 text-center">
            <p class="mb-2 text-third small">© 2026 CrashCoupons.com. All rights reserved. • Curated by the CrashCoupons Editorial Team</p>
            <div class="d-flex justify-content-center flex-wrap gap-3 small">
                <a href="/" class="text-third text-decoration-none">Home</a>
                <span class="text-third">•</span>
                <a href="/brands" class="text-third text-decoration-none">All Brands</a>
                <span class="text-third">•</span>
                <a href="/about" class="text-third text-decoration-none">About CrashCoupons</a>
                <span class="text-third">•</span>
                <a href="/privacy" class="text-third text-decoration-none">Privacy Policy</a>
                <span class="text-third">•</span>
                <a href="/terms" class="text-third text-decoration-none">Terms of Service</a>
                <span class="text-third">•</span>
                <a href="/contact" class="text-third text-decoration-none">Contact Us</a>
            </div>
        </div>
    </footer>
    <script>
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-bs-theme');
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-bs-theme', next);
                localStorage.setItem('user_color_mode', next);
            });
        }
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(brandsDir, 'index.html'), brandsDirectoryHtml, 'utf8');
console.log('Generated /brands/index.html directory');

// Generate sitemap.xml
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>2026-11-21</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(baseDir, 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`Generated sitemap.xml with ${sitemapUrls.length} URLs`);
