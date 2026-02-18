document.addEventListener("DOMContentLoaded", async () => {
  await LongevityStatic.bootShell();

  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/category\/([^/]+)\/?$/);
  const slug = window.__CATEGORY_SLUG__ || (pathMatch ? decodeURIComponent(pathMatch[1]) : params.get("slug"));
  const root = document.getElementById("category-root");

  if (!slug) {
    root.innerHTML = '<div class="max-w-7xl mx-auto px-6 py-10 text-sm text-gray-600">Missing category slug.</div>';
    return;
  }

  try {
    const articles = (await LongevityStatic.getArticles()).sort(LongevityStatic.byNewest);
    const filtered = articles.filter((a) => (a.categories || []).some((c) => c.slug === slug));

    if (!filtered.length) {
      root.innerHTML = '<div class="max-w-7xl mx-auto px-6 py-10 text-sm text-gray-600">No articles found for this category.</div>';
      return;
    }

    const first = filtered[0];
    const category = (first.categories || []).find((c) => c.slug === slug) || { slug, name: slug };
    const explained = filtered.filter((a) => a.hasExplanation).length;
    const latest = filtered[0].publishedDate;

    document.title = `${category.name} | Longevity Hub`;

    root.innerHTML = `
      <section class="bg-gradient-to-br from-clinical-800 to-clinical-900 text-white border-b border-clinical-700">
        <div class="max-w-7xl mx-auto px-6 py-14 md:py-16">
          <p class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/10 text-clinical-100 mb-5">Category Focus</p>
          <h1 class="text-4xl md:text-5xl font-normal tracking-tight mb-4">${LongevityStatic.escapeHtml(category.name)}</h1>
          <div class="max-w-3xl text-clinical-100 text-base md:text-lg leading-relaxed">
            <p>${LongevityStatic.escapeHtml(category.description || "A focused collection of longevity research and practical explainers in this topic area.")}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div class="bg-white/10 rounded-xl p-4 border border-white/10">
              <p class="text-xs uppercase tracking-wide text-clinical-200 mb-1">Total Articles</p>
              <p class="text-2xl font-semibold text-white">${filtered.length}</p>
            </div>
            <div class="bg-white/10 rounded-xl p-4 border border-white/10">
              <p class="text-xs uppercase tracking-wide text-clinical-200 mb-1">Explained</p>
              <p class="text-2xl font-semibold text-white">${explained}</p>
            </div>
            <div class="bg-white/10 rounded-xl p-4 border border-white/10">
              <p class="text-xs uppercase tracking-wide text-clinical-200 mb-1">Latest Update</p>
              <p class="text-base md:text-lg font-medium text-white">${LongevityStatic.fmtDate(latest)}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-5 mt-7 text-sm">
            <a href="${LongevityStatic.siteUrl("articles/")}" class="text-white hover:text-clinical-100 font-medium">View All Articles</a>
            <a href="${LongevityStatic.siteUrl("")}" class="text-clinical-200 hover:text-white font-medium">Back to Homepage</a>
          </div>
        </div>
      </section>

      <section class="max-w-7xl mx-auto px-6 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          ${filtered.map((article, index) => LongevityStatic.articleCard(article, index + 1)).join("")}
        </div>
      </section>
    `;
  } catch (err) {
    root.innerHTML = '<div class="max-w-7xl mx-auto px-6 py-10 text-sm text-gray-600">Unable to load category.</div>';
  }
});
