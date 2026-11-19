const PER_PAGE = 16;
let page = 1;
let query = "";

const $ = (s) => document.querySelector(s);
const grid = $("#grid");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const icons = {
  star: '<svg viewBox="0 0 24 24" width="14" height="14" fill="var(--accent)"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
  scissors: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16 20 4M16 16 4 4"/></svg>',
  infinity: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M7 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c3.5 0 6.5-8 10-8 2.2 0 4 1.8 4 4s-1.8 4-4 4c-3.5 0-6.5-8-10-8z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  users: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-1.5-5-4-5.7"/></svg>',
  tag: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--accent)" stroke-width="1.6"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>',
};

const banner = (d) => `<div class="banner" style="--c1:${d.colors[0]};--c2:${d.colors[1]}"><span class="banner-emoji">${d.emoji}</span><span class="banner-store">${esc(d.store)}</span></div>`;
const fmtDate = (s) => new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function filtered() {
  const q = query.trim().toLowerCase();
  if (!q) return DEALS;
  return DEALS.filter((d) => [d.store, d.title, d.desc, d.cat].join(" ").toLowerCase().includes(q));
}

function render() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  page = Math.min(page, pages);
  const items = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  grid.innerHTML = items.map((d) => {
    const i = DEALS.indexOf(d);
    return `
    <article class="card">
      <div class="banner-wrap">
        ${banner(d)}
        <span class="rating">${icons.star}<b>${d.rating.toFixed(1)}</b></span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${esc(d.title)}</h3>
        <div class="incentive">
          <span class="incentive-big">${esc(d.incentive)}</span>
          <span class="incentive-desc">${esc(d.desc)}</span>
          <i class="notch l"></i><i class="notch r"></i>
        </div>
        <span class="cat-pill">${icons.tag}${esc(d.cat)}</span>
        <button class="btn get-code" data-i="${i}">${icons.scissors} Get Code</button>
      </div>
      <div class="card-foot">
        <span>${d.expires ? icons.clock + "Expires " + fmtDate(d.expires) : icons.infinity + "No expiration"}</span>
        <span>${icons.users}${d.uses} uses today</span>
      </div>
    </article>`;
  }).join("");

  $("#empty").hidden = items.length > 0;
  renderPagination(pages);
}

function renderPagination(pages) {
  const nav = $("#pagination");
  if (pages <= 1) { nav.innerHTML = ""; return; }
  let html = `<button ${page === 1 ? "disabled" : ""} data-p="${page - 1}" aria-label="Previous">‹</button>`;
  for (let p = 1; p <= pages; p++) html += `<button class="${p === page ? "active" : ""}" data-p="${p}">${p}</button>`;
  html += `<button ${page === pages ? "disabled" : ""} data-p="${page + 1}" aria-label="Next">›</button>`;
  nav.innerHTML = html;
}

function renderCategories() {
  const counts = {};
  DEALS.forEach((d) => {
    counts[d.cat] ??= { n: 0, d };
    counts[d.cat].n++;
  });
  $("#categories").innerHTML = Object.entries(counts)
    .sort((a, b) => b[1].n - a[1].n).slice(0, 3)
    .map(([cat, { n, d }]) => `
      <a href="#" class="cat-item" data-cat="${esc(cat)}">
        <span class="cat-thumb" style="--c1:${d.colors[0]};--c2:${d.colors[1]}">${d.emoji}</span>
        <span><b>${esc(cat)}</b><small class="muted">${n} coupon${n > 1 ? "s" : ""}</small></span>
      </a>`).join("");
}

// Modal: shows the code immediately. No fake "checking" steps, no lockers.
const modal = $("#modal");
function openModal(d) {
  $("#mBanner").innerHTML = banner(d);
  $("#mTitle").textContent = d.title;
  $("#mDesc").textContent = d.desc;
  $("#mCode").textContent = d.code;
  $("#mLink").href = "#";
  $("#mExpiry").textContent = d.expires ? `Expires ${fmtDate(d.expires)}` : "No expiration";
  $("#copyBtn").textContent = "Copy";
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal() { modal.hidden = true; document.body.style.overflow = ""; }

document.addEventListener("click", (e) => {
  const get = e.target.closest(".get-code");
  if (get) return openModal(DEALS[+get.dataset.i]);
  const pg = e.target.closest("#pagination button");
  if (pg && !pg.disabled) { page = +pg.dataset.p; render(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  const cat = e.target.closest(".cat-item");
  if (cat) { e.preventDefault(); query = cat.dataset.cat; $("#search").value = query; page = 1; render(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (e.target === modal || e.target.closest(".modal-close")) closeModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

$("#copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#mCode").textContent); $("#copyBtn").textContent = "Copied!"; }
  catch { $("#copyBtn").textContent = "Select & copy"; }
});

$("#search").addEventListener("input", (e) => { query = e.target.value; page = 1; render(); });

$("#themeToggle").addEventListener("click", () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("dd-theme", root.dataset.theme);
});

renderCategories();
render();
