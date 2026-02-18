document.addEventListener("DOMContentLoaded", async () => {
  LongevityStatic.bootShell();

  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/article\/([^/]+)\/?$/);
  const slug = window.__ARTICLE_SLUG__ || (pathMatch ? decodeURIComponent(pathMatch[1]) : params.get("slug"));
  const root = document.getElementById("article-root");

  if (!slug) {
    root.innerHTML = `<div class="panel"><h2>Missing article</h2><p>No slug provided.</p></div>`;
    return;
  }

  try {
    const articles = await LongevityStatic.getArticles();
    const article = articles.find(a => a.slug === slug);
    if (!article) {
      root.innerHTML = `<div class="panel"><h2>Not found</h2><p>The requested article does not exist.</p></div>`;
      return;
    }

    document.title = `${article.title} | Longevity Hub`;

    const takeaways = (article.keyTakeaways || []).map(t => `<li>${t}</li>`).join("");
    const catLinks = (article.categories || []).map(c => `<a class="pill" href="${LongevityStatic.siteUrl(`category/${encodeURIComponent(c.slug)}/`)}">${c.name}</a>`).join("");

    root.innerHTML = `
      <section class="page-hero">
        <div class="container">
          <span class="eyebrow">${article.sourceName}</span>
          <h1>${article.title}</h1>
          <p>${article.excerpt || ""}</p>
          <div class="meta-row" style="margin-top:0.8rem;">${catLinks}</div>
        </div>
      </section>

      <section class="section">
        <div class="container detail-wrap">
          <div style="display:grid; gap:1rem;">
            <article class="panel">
              <h2>Key Takeaways</h2>
              <ul class="list">${takeaways || "<li>No takeaways yet.</li>"}</ul>
            </article>

            <article class="panel">
              <h2>Plain-Language Explanation</h2>
              <p style="line-height:1.75; color:#1e293b; margin:0;">${article.laymansExplanation || "Explanation coming soon."}</p>
            </article>
          </div>

          <aside class="panel">
            <h2>Source Information</h2>
            <p><strong>Source:</strong> ${article.sourceName}</p>
            <p><strong>Type:</strong> ${article.sourceType}</p>
            <p><strong>Published:</strong> ${LongevityStatic.fmtDate(article.publishedDate)}</p>
            <p><strong>Evidence:</strong> ${article.evidenceQuality || "N/A"}</p>
            <p><a class="btn" href="${article.sourceUrl}" target="_blank" rel="noopener">View Original Source</a></p>
          </aside>
        </div>
      </section>
    `;
  } catch (err) {
    root.innerHTML = `<div class="panel"><h2>Error</h2><p>Unable to load article.</p></div>`;
  }
});
