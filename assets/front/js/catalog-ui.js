(function () {
    const PER_PAGE = 16;
    let currentPage = 1;
    let currentMode = 'all'; // 'all' | 'brand' | 'search'
    let currentFilterLabel = '';
    let filteredIds = null;

    function decodeHtml(str) {
        if (!str) return '';
        const t = document.createElement('textarea');
        t.innerHTML = str;
        return t.value;
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str == null ? '' : String(str);
        return d.innerHTML;
    }

    function getRandomCount(id, min, max) {
        // Deterministic-looking per session via localStorage or seeded fallback
        const seed = ((id * 2654435761) >>> 0) % (max - min + 1);
        return min + seed;
    }

    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function renderCouponCard(c) {
        const title = escapeHtml(decodeHtml(c.coupon_title || ''));
        const rawBrand = c.brand_name ? decodeHtml(c.brand_name) : '';
        const brandName = escapeHtml(rawBrand);
        const brandSlug = slugify(rawBrand);
        const incent = escapeHtml(decodeHtml(c.coupon_short_incent || 'Free Offer'));
        const shortDesc = escapeHtml(decodeHtml(c.coupon_short_description || ''));
        const rating = Number(c.coupon_rating || 4.9).toFixed(1);
        const bannerSrc = c.coupon_banner ? `./public/${c.coupon_banner}` : '';
        const brandLogoSrc = c.brand_logo ? `./public/${c.brand_logo}` : '';
        const couponsLeft = (window.getCouponAvailability && window.getCouponAvailability(c.id)) || getRandomCount(c.id, 120, 999);
        const usesToday = getRandomCount(c.id + 77, 12, 89);

        return `
        <div class="col">
            <div class="card h-100 coupon-card coupon-card-standard bg hover:bg-secondary rounded-4 border border-light transition-all">
                <div class="banner-section position-relative">
                    ${bannerSrc ? `<img src="${bannerSrc}" class="card-img-top banner-image" alt="${title}" loading="lazy">` : ''}
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
                    ${brandLogoSrc ? `
                    <div class="brand-logo-wrapper">
                        <a href="/brands/${brandSlug}">
                            <img src="${brandLogoSrc}" alt="${brandName || title}" class="brand-logo" loading="lazy">
                        </a>
                    </div>` : ''}
                </div>
                <div class="card-body pt-4">
                    <div class="d-flex flex-column h-100">
                        <div class="mb-xl-3 mb-2">
                            <h3 class="card-title h5 fw-600 mb-1">${title}</h3>
                            ${brandName ? `<p class="card-subtitle small text-third mb-0"><a href="/brands/${brandSlug}" class="text-third text-decoration-none hover-accent">${brandName}</a></p>` : ''}
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
    }

    function getActiveIds() {
        if (filteredIds) return filteredIds;
        return window.LOCAL_COUPON_ORDER || Object.keys(window.LOCAL_COUPONS || {}).map(Number);
    }

    function renderPagination(totalItems, page) {
        const nav = document.querySelector('.all-coupons-section nav, .pagination')?.closest('nav') || document.querySelector('.pagination')?.parentElement;
        const ul = document.querySelector('.pagination');
        if (!ul) return;

        const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));
        if (totalPages <= 1) {
            ul.innerHTML = '';
            return;
        }

        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        let html = `
            <li class="page-item ${page <= 1 ? 'disabled' : ''}">
                <a class="page-link" href="#page-${Math.max(1, page - 1)}" data-page="${Math.max(1, page - 1)}" aria-label="Previous">&laquo;</a>
            </li>`;

        pages.forEach(p => {
            if (p === '...') {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            } else {
                html += `
                    <li class="page-item ${p === page ? 'active' : ''}">
                        <a class="page-link" href="#page-${p}" data-page="${p}">${p}</a>
                    </li>`;
            }
        });

        html += `
            <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#page-${Math.min(totalPages, page + 1)}" data-page="${Math.min(totalPages, page + 1)}" aria-label="Next">&raquo;</a>
            </li>`;

        ul.innerHTML = html;
        ul.querySelectorAll('a[data-page]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const target = parseInt(a.dataset.page, 10);
                if (!isNaN(target) && target !== currentPage) {
                    goToPage(target);
                }
            });
        });
    }

    function updateHeader(totalCount) {
        const section = document.querySelector('.all-coupons-section');
        if (!section) return;
        let headerEl = section.querySelector('.catalog-header-bar');
        const origH2 = section.querySelector('h1, h2');

        if (!headerEl && origH2) {
            headerEl = document.createElement('div');
            headerEl.className = 'catalog-header-bar d-flex flex-wrap align-items-center justify-content-between gap-2 mb-sm-4 mb-3';
            origH2.classList.remove('mb-sm-4', 'mb-3');
            origH2.classList.add('mb-0');
            origH2.parentNode.insertBefore(headerEl, origH2);
            headerEl.appendChild(origH2);
        }

        if (!headerEl) return;
        const h2 = headerEl.querySelector('h1, h2');
        let resetBtn = headerEl.querySelector('.catalog-reset-btn');

        if (currentMode === 'all') {
            h2.textContent = 'All Codes';
            if (resetBtn) resetBtn.remove();
        } else {
            h2.textContent = `${currentFilterLabel} (${totalCount})`;
            if (!resetBtn) {
                resetBtn = document.createElement('button');
                resetBtn.type = 'button';
                resetBtn.className = 'catalog-reset-btn btn btn-sm rounded-pill px-3 py-1 border border-light bg text d-inline-flex align-items-center gap-1';
                resetBtn.innerHTML = '<i class="bi bi-arrow-left accent"></i><span>All Codes</span>';
                resetBtn.addEventListener('click', () => window.CatalogUI.reset());
                headerEl.appendChild(resetBtn);
            }
        }
    }

    function renderGrid(scrollTop = false) {
        const row = document.querySelector('.all-coupons-section .row');
        if (!row) return;
        const ids = getActiveIds();
        const total = ids.length;
        const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * PER_PAGE;
        const pageIds = ids.slice(start, start + PER_PAGE);

        updateHeader(total);

        if (pageIds.length === 0) {
            row.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search fs-1 text-third d-block mb-2"></i>
                    <p class="h5 fw-500 mb-1">No matching codes found</p>
                    <p class="small text-third mb-3">Try searching for another game, brand, or keyword.</p>
                    <button type="button" class="btn btn-sm bg-accent text-white rounded-pill px-4 py-2 border-0" onclick="window.CatalogUI.reset()">Show All Codes</button>
                </div>`;
        } else {
            row.innerHTML = pageIds
                .map(id => window.LOCAL_COUPONS[id])
                .filter(Boolean)
                .map(renderCouponCard)
                .join('');
        }

        renderPagination(total, currentPage);

        if (scrollTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function goToPage(page) {
        currentPage = page;
        renderGrid(true);
    }

    window.CatalogUI = {
        goToPage,
        filterByBrand(brandId) {
            const bid = parseInt(brandId, 10);
            const brand = (window.LOCAL_BRANDS || {})[bid];
            const ids = (window.LOCAL_COUPON_ORDER || []).filter(id => {
                const c = window.LOCAL_COUPONS[id];
                return c && parseInt(c.brand_id, 10) === bid;
            });
            currentMode = 'brand';
            currentFilterLabel = brand ? decodeHtml(brand.brand_name) : `Brand #${bid}`;
            filteredIds = ids;
            currentPage = 1;
            renderGrid(true);
        },
        filterBySearch(query) {
            const q = (query || '').trim().toLowerCase();
            if (!q) return this.reset();
            const ids = (window.LOCAL_COUPON_ORDER || []).filter(id => {
                const c = window.LOCAL_COUPONS[id];
                if (!c) return false;
                return (
                    decodeHtml(c.coupon_title || '').toLowerCase().includes(q) ||
                    decodeHtml(c.coupon_short_description || '').toLowerCase().includes(q) ||
                    decodeHtml(c.coupon_short_incent || '').toLowerCase().includes(q) ||
                    decodeHtml(c.brand_name || '').toLowerCase().includes(q) ||
                    decodeHtml(c.coupon_description || '').toLowerCase().includes(q)
                );
            });
            currentMode = 'search';
            currentFilterLabel = `Search: "${query.trim()}"`;
            filteredIds = ids;
            currentPage = 1;
            renderGrid(true);
        },
        reset() {
            currentMode = 'all';
            currentFilterLabel = '';
            filteredIds = null;
            currentPage = 1;
            const searchInput = document.querySelector('#searchInput, input[placeholder="Search here"]');
            if (searchInput) searchInput.value = '';
            renderGrid(true);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        // Wire initial pagination links on page 1
        renderPagination(getActiveIds().length, 1);

        // Wire Popular Categories / footer brand links
        document.querySelectorAll('a[href^="#brand-"]').forEach(a => {
            const match = a.getAttribute('href').match(/^#brand-(\d+)/);
            if (match) {
                a.removeAttribute('onclick');
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.CatalogUI.filterByBrand(parseInt(match[1], 10));
                });
            }
        });

        // Wire logo click to reset to All Codes
        document.querySelectorAll('.navbar-brand, header a[href="./"]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                window.CatalogUI.reset();
            });
        });
    });
})();
