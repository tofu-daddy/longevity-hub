function normalizeJoin(base, path) {
  const b = String(base || ".").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  if (!p) return `${b}/`;
  return `${b}/${p}`;
}

function getSiteBase() {
  return window.__BASE_PATH__ || ".";
}

function siteUrl(path) {
  return normalizeJoin(getSiteBase(), path);
}

async function getArticles() {
  const response = await fetch(siteUrl("data/articles.json"));
  if (!response.ok) throw new Error("Failed to load articles");
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function byNewest(a, b) {
  return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
}

function fmtDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function categoryFromArticles(articles) {
  const map = new Map();
  for (const article of articles) {
    for (const c of article.categories || []) {
      const prev = map.get(c.slug) || { ...c, count: 0 };
      prev.count += 1;
      map.set(c.slug, prev);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function articleCard(article) {
  const summary = article.technicalSummary || article.excerpt || "";
  const cta = article.hasExplanation ? "Read Plain-Language Summary" : "Read Article Details";
  const categoryPills = (article.categories || []).slice(0, 2)
    .map(c => `<a class="pill" href="${siteUrl(`category/${encodeURIComponent(c.slug)}/`)}">${c.name}</a>`)
    .join("");

  return `
    <article class="article-card">
      <div class="meta-row">
        <span class="pill">${article.sourceName || "Source"}</span>
        <span class="pill">${fmtDate(article.publishedDate)}</span>
        ${categoryPills}
      </div>
      <h3><a href="${siteUrl(`article/${encodeURIComponent(article.slug)}/`)}">${article.title}</a></h3>
      <p>${summary.slice(0, 260)}${summary.length > 260 ? "..." : ""}</p>
      <a class="btn" href="${siteUrl(`article/${encodeURIComponent(article.slug)}/`)}">${cta}</a>
    </article>
  `;
}

function shellHeader() {
  return `
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="${siteUrl("")}">
          <span class="brand-badge">❤</span>
          <span>Longevity Hub</span>
        </a>
        <nav class="nav-links">
          <a class="btn" href="${siteUrl("articles/")}">Browse Articles</a>
        </nav>
      </div>
    </header>
  `;
}

function shellFooter() {
  return `
    <footer class="site-footer">
      <div class="container footer-inner">
        <span>© ${new Date().getFullYear()} Longevity Hub</span>
        <span>Static GitHub Pages Edition</span>
      </div>
    </footer>
  `;
}

function bootShell() {
  const headerRoot = document.getElementById("shell-header");
  const footerRoot = document.getElementById("shell-footer");
  if (headerRoot) headerRoot.innerHTML = shellHeader();
  if (footerRoot) footerRoot.innerHTML = shellFooter();
}

window.LongevityStatic = {
  getArticles,
  byNewest,
  fmtDate,
  uniq,
  categoryFromArticles,
  articleCard,
  bootShell,
  siteUrl
};
