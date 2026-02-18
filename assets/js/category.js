document.addEventListener("DOMContentLoaded", async () => {
  LongevityStatic.bootShell();

  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/category\/([^/]+)\/?$/);
  const slug = window.__CATEGORY_SLUG__ || (pathMatch ? decodeURIComponent(pathMatch[1]) : params.get("slug"));
  const root = document.getElementById("category-root");

  if (!slug) {
    root.innerHTML = `<div class="panel"><h2>Missing category</h2><p>No category slug provided.</p></div>`;
    return;
  }

  try {
    const articles = (await LongevityStatic.getArticles()).sort(LongevityStatic.byNewest);
    const filtered = articles.filter(a => (a.categories || []).some(c => c.slug === slug));

    if (!filtered.length) {
      root.innerHTML = `<div class="panel"><h2>No category content</h2><p>No articles found for this category.</p></div>`;
      return;
    }

    const first = filtered[0];
    const category = (first.categories || []).find(c => c.slug === slug) || { slug, name: slug };
    const explained = filtered.filter(a => a.hasExplanation).length;
    const latest = filtered[0].publishedDate;

    document.title = `${category.name} | Longevity Hub`;

    root.innerHTML = `
      <section class="page-hero">
        <div class="container">
          <span class="eyebrow">Category Focus</span>
          <h1>${category.name}</h1>
          <p>${category.description || "Curated longevity research and plain-language explainers for this topic."}</p>

          <div class="stats">
            <div class="stat"><small>Total Articles</small><strong>${filtered.length}</strong></div>
            <div class="stat"><small>Explained</small><strong>${explained}</strong></div>
            <div class="stat"><small>Latest Update</small><strong>${LongevityStatic.fmtDate(latest)}</strong></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container card-grid">
          ${filtered.map(LongevityStatic.articleCard).join("")}
        </div>
      </section>
    `;
  } catch (err) {
    root.innerHTML = `<div class="panel"><h2>Error</h2><p>Unable to load category.</p></div>`;
  }
});
