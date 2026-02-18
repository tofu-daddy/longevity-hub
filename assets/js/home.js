document.addEventListener("DOMContentLoaded", async () => {
  await LongevityStatic.bootShell();

  const featuredRoot = document.getElementById("featured-root");
  const latestRoot = document.getElementById("latest-root");

  try {
    const articles = (await LongevityStatic.getArticles()).sort(LongevityStatic.byNewest);
    const featured = articles.find((a) => a.hasExplanation) || articles[0];
    const latest = articles.filter((a) => a.slug !== featured.slug).slice(0, 4);

    const summary = featured.technicalSummary || featured.excerpt || "";
    const imageMarkup = featured.image
      ? `
      <div class="md:col-span-2">
        <a href="${LongevityStatic.siteUrl(`article/${encodeURIComponent(featured.slug)}/`)}" class="block rounded-xl overflow-hidden border border-white/20">
          <img src="${featured.image}" alt="${LongevityStatic.escapeHtml(featured.title)}" class="w-full h-full object-cover aspect-[4/3]" loading="lazy">
        </a>
      </div>
    `
      : "";

    featuredRoot.innerHTML = `
      <article class="bg-gradient-to-br from-clinical-800 to-clinical-900 rounded-2xl p-8 mb-10 shadow-sm text-white">
        <div class="${featured.image ? "grid grid-cols-1 md:grid-cols-5 gap-8 items-center" : ""}">
          <div class="${featured.image ? "md:col-span-3" : ""}">
            <p class="text-xs font-semibold uppercase tracking-wide text-clinical-200 mb-3">Featured Article</p>
            <h2 class="text-3xl md:text-4xl font-medium tracking-tight leading-tight mb-4">
              <a href="${LongevityStatic.siteUrl(`article/${encodeURIComponent(featured.slug)}/`)}" class="hover:text-white/90 transition-colors">${LongevityStatic.escapeHtml(featured.title)}</a>
            </h2>
            <p class="text-base text-clinical-100 leading-relaxed mb-6">${LongevityStatic.escapeHtml(summary.slice(0, 420))}${summary.length > 420 ? "..." : ""}</p>
            <a href="${LongevityStatic.siteUrl(`article/${encodeURIComponent(featured.slug)}/`)}" class="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-clinical-100 transition-colors group">
              Read Plain-Language Summary
              <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </a>
          </div>
          ${imageMarkup}
        </div>
      </article>
    `;

    latestRoot.innerHTML = latest.map((article, index) => LongevityStatic.articleCard(article, index + 1)).join("");
  } catch (err) {
    featuredRoot.innerHTML = '<p class="text-sm text-gray-500">Unable to load featured content.</p>';
    latestRoot.innerHTML = '<p class="text-sm text-gray-500">Unable to load articles.</p>';
  }
});
