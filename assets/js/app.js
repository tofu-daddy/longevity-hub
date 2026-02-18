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

const SITE_ORIGIN = "https://tofu-daddy.github.io/longevity-hub";

function absoluteUrl(path = "") {
  const cleaned = String(path || "").replace(/^\/+/, "");
  return `${SITE_ORIGIN}/${cleaned}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
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

function sourceTypeLabel(sourceType) {
  const map = {
    research_paper: "Research Paper",
    clinical_trial: "Clinical Trial",
    review: "Review",
    news: "News",
    guideline: "Guideline"
  };
  return map[sourceType] || "Article";
}

function upsertMeta({ attr, key, value }) {
  if (!value) return;
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
}

function upsertLink(rel, href) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function applySeo({
  title,
  description,
  path = "",
  type = "website",
  image = "",
  noindex = false,
  jsonLd = null
}) {
  if (title) document.title = title;
  const canonical = absoluteUrl(path);
  const imageUrl = image ? (image.startsWith("http") ? image : absoluteUrl(image)) : absoluteUrl("assets/og-default.svg");

  upsertLink("canonical", canonical);
  upsertMeta({ attr: "name", key: "description", value: description });
  upsertMeta({ attr: "name", key: "robots", value: noindex ? "noindex,follow" : "index,follow,max-image-preview:large" });
  upsertMeta({ attr: "property", key: "og:type", value: type });
  upsertMeta({ attr: "property", key: "og:title", value: title });
  upsertMeta({ attr: "property", key: "og:description", value: description });
  upsertMeta({ attr: "property", key: "og:url", value: canonical });
  upsertMeta({ attr: "property", key: "og:image", value: imageUrl });
  upsertMeta({ attr: "property", key: "og:site_name", value: "Longevity Hub" });
  upsertMeta({ attr: "name", key: "twitter:card", value: "summary_large_image" });
  upsertMeta({ attr: "name", key: "twitter:title", value: title });
  upsertMeta({ attr: "name", key: "twitter:description", value: description });
  upsertMeta({ attr: "name", key: "twitter:image", value: imageUrl });

  const existing = document.getElementById("lh-jsonld");
  if (existing) existing.remove();
  if (jsonLd) {
    const script = document.createElement("script");
    script.id = "lh-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}

function articleCard(article, index = 1) {
  const summary = article.technicalSummary || article.excerpt || "";
  const cta = article.hasExplanation ? "Read Plain-Language Summary" : "Read Article Details";
  const staggerClass = `stagger-${Math.min(index, 6)}`;

  return `
    <article class="article-card bg-white rounded-xl p-6 border border-neutral-200 fade-in-up ${staggerClass}">
      <h3 class="text-xl font-semibold mb-4 leading-tight text-gray-900">
        <a href="${siteUrl(`article/${encodeURIComponent(article.slug)}/`)}" class="hover:text-clinical-600 transition-colors">${escapeHtml(article.title)}</a>
      </h3>
      <p class="text-sm text-gray-600 leading-relaxed mb-5">${escapeHtml(summary.slice(0, 320))}${summary.length > 320 ? "..." : ""}</p>
      <a href="${siteUrl(`article/${encodeURIComponent(article.slug)}/`)}" class="inline-flex items-center gap-2 text-sm font-semibold text-clinical-600 hover:text-clinical-700 transition-colors group">
        ${cta}
        <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        </svg>
      </a>
    </article>
  `;
}

function heartLogo() {
  return `
    <div class="w-10 h-10 bg-gradient-to-br from-clinical-500 to-lab-500 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-shadow">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 12.75C4.5 9.022 7.522 6 11.25 6c1.808 0 3.448.711 4.66 1.87A6.726 6.726 0 0120.25 6c2.9 0 5.25 2.35 5.25 5.25 0 5.262-6.484 9.508-9.252 11.105a1.5 1.5 0 01-1.496 0C10.984 20.758 4.5 16.512 4.5 12.75z" transform="translate(-3 -3)"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h2l1.5-2.5L13 14l1.5-2H17"></path>
      </svg>
    </div>
  `;
}

function shellHeader(topics = []) {
  const topicLinks = topics.length
    ? topics.map((topic) => `
      <a href="${siteUrl(`category/${encodeURIComponent(topic.slug)}/`)}" class="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-clinical-700 transition-colors">${escapeHtml(topic.name)}</a>
    `).join("")
    : '<span class="block px-3 py-2 text-sm text-gray-500">No topics yet.</span>';

  return `
    <header id="masthead" class="site-header border-b border-gray-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-12">
            <a href="${siteUrl("")}" class="flex items-center gap-3 group">
              ${heartLogo()}
              <div>
                <span class="font-semibold text-lg tracking-tight block leading-tight">Longevity Hub</span>
                <span class="text-xs text-gray-500 font-medium">Research Explained</span>
              </div>
            </a>

            <nav id="site-navigation" class="main-navigation hidden md:flex items-center gap-8" aria-label="Primary">
              <ul class="flex items-center gap-8">
                <li><a href="${siteUrl("articles/")}" class="nav-link text-sm font-medium text-gray-700 hover:text-clinical-600 pb-1">Articles</a></li>
                <li><a href="${siteUrl("articles/?has_explanation=yes")}" class="nav-link text-sm font-medium text-gray-700 hover:text-clinical-600 pb-1">Explained</a></li>
                <li><a href="${siteUrl("about/")}" class="nav-link text-sm font-medium text-gray-700 hover:text-clinical-600 pb-1">About</a></li>
              </ul>
            </nav>
          </div>

          <div class="hidden md:flex items-center gap-4">
            <details class="relative">
              <summary class="list-none cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 hover:text-clinical-600 transition-colors inline-flex items-center gap-2">
                <span>Browse Topics</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </summary>
              <div class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50">
                ${topicLinks}
                <a href="${siteUrl("articles/")}" class="block mt-1 px-3 py-2 rounded-lg text-sm font-medium text-clinical-700 hover:bg-clinical-50 transition-colors">View all articles</a>
              </div>
            </details>
          </div>

          <button id="mobile-menu-toggle" class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-expanded="false" aria-controls="mobile-menu">
            <span class="sr-only">Open menu</span>
            <svg class="w-6 h-6 menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
            <svg class="w-6 h-6 close-icon hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <div id="mobile-menu" class="md:hidden hidden border-t border-gray-200 bg-white">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <ul class="flex flex-col gap-2">
            <li><a href="${siteUrl("articles/")}" class="block py-2 text-sm font-medium text-gray-700">Articles</a></li>
            <li><a href="${siteUrl("articles/?has_explanation=yes")}" class="block py-2 text-sm font-medium text-gray-700">Explained</a></li>
            <li><a href="${siteUrl("about/")}" class="block py-2 text-sm font-medium text-gray-700">About</a></li>
          </ul>
          <div class="mt-4 pt-4 border-t border-gray-200">
            <details>
              <summary class="list-none cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 inline-flex items-center gap-2">
                <span>Browse Topics</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </summary>
              <div class="mt-2 flex flex-col gap-1">
                ${topicLinks.replaceAll("px-3", "px-4")}
                <a href="${siteUrl("articles/")}" class="px-4 py-2 text-sm font-medium text-clinical-700 hover:bg-clinical-50 rounded-lg">View all articles</a>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  `;
}

function shellFooter() {
  return `
    <footer id="colophon" class="site-footer border-t border-gray-200 mt-20 bg-white">
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
          <div>
            <a href="${siteUrl("")}" class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-gradient-to-br from-clinical-500 to-lab-500 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 12.75C4.5 9.022 7.522 6 11.25 6c1.808 0 3.448.711 4.66 1.87A6.726 6.726 0 0120.25 6c2.9 0 5.25 2.35 5.25 5.25 0 5.262-6.484 9.508-9.252 11.105a1.5 1.5 0 01-1.496 0C10.984 20.758 4.5 16.512 4.5 12.75z" transform="translate(-3 -3)"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h2l1.5-2.5L13 14l1.5-2H17"></path>
                </svg>
              </div>
              <span class="font-semibold">Longevity Hub</span>
            </a>
            <p class="text-sm text-gray-600">Complex longevity research, explained in plain English.</p>
          </div>

          <div>
            <h4 class="font-semibold mb-3">Company</h4>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><a href="${siteUrl("about/")}" class="hover:text-clinical-600 transition-colors">About</a></li>
            </ul>
          </div>

          <div>
            <h4 class="font-semibold mb-3">Legal</h4>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><a href="${siteUrl("privacy-policy/")}" class="hover:text-clinical-600 transition-colors">Privacy Policy</a></li>
              <li><a href="${siteUrl("terms/")}" class="hover:text-clinical-600 transition-colors">Terms</a></li>
              <li><a href="${siteUrl("medical-disclaimer/")}" class="hover:text-clinical-600 transition-colors">Medical Disclaimer</a></li>
              <li><a href="${siteUrl("ai-editorial-policy/")}" class="hover:text-clinical-600 transition-colors">AI Editorial Policy</a></li>
              <li><a href="${siteUrl("california-privacy-notice/")}" class="hover:text-clinical-600 transition-colors">California Privacy Notice</a></li>
              <li><a href="${siteUrl("cookie-notice/")}" class="hover:text-clinical-600 transition-colors">Cookie Notice</a></li>
              <li><a href="${siteUrl("copyright-and-dmca-notice/")}" class="hover:text-clinical-600 transition-colors">Copyright & DMCA Notice</a></li>
            </ul>
          </div>
        </div>

        <div class="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-sm text-gray-500">&copy; ${new Date().getFullYear()} Longevity Hub. All rights reserved.</p>
          <div class="flex items-center gap-6">
            <a href="https://twitter.com/" target="_blank" rel="noopener" class="text-sm text-gray-500 hover:text-clinical-600 transition-colors">Twitter</a>
            <a href="https://linkedin.com/" target="_blank" rel="noopener" class="text-sm text-gray-500 hover:text-clinical-600 transition-colors">LinkedIn</a>
            <a href="${siteUrl("rss.xml")}" class="text-sm text-gray-500 hover:text-clinical-600 transition-colors">RSS</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function initMobileMenu() {
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!menuToggle || !mobileMenu) return;

  const menuIcon = menuToggle.querySelector(".menu-icon");
  const closeIcon = menuToggle.querySelector(".close-icon");

  menuToggle.addEventListener("click", function () {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    mobileMenu.classList.toggle("hidden");
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    if (menuIcon && closeIcon) {
      menuIcon.classList.toggle("hidden");
      closeIcon.classList.toggle("hidden");
    }
  });

  document.addEventListener("click", function (event) {
    if (!menuToggle.contains(event.target) && !mobileMenu.contains(event.target)) {
      mobileMenu.classList.add("hidden");
      menuToggle.setAttribute("aria-expanded", "false");
      if (menuIcon && closeIcon) {
        menuIcon.classList.remove("hidden");
        closeIcon.classList.add("hidden");
      }
    }
  });
}

async function bootShell() {
  const headerRoot = document.getElementById("shell-header");
  const footerRoot = document.getElementById("shell-footer");

  let topics = [];
  try {
    const articles = await getArticles();
    topics = categoryFromArticles(articles).slice(0, 8);
  } catch (error) {
    topics = [];
  }

  if (headerRoot) headerRoot.innerHTML = shellHeader(topics);
  if (footerRoot) footerRoot.innerHTML = shellFooter();
  initMobileMenu();
}

window.LongevityStatic = {
  getArticles,
  byNewest,
  fmtDate,
  uniq,
  categoryFromArticles,
  articleCard,
  sourceTypeLabel,
  bootShell,
  siteUrl,
  absoluteUrl,
  applySeo,
  escapeHtml
};
