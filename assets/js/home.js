document.addEventListener("DOMContentLoaded", async () => {
  LongevityStatic.bootShell();

  const featuredRoot = document.getElementById("featured-root");
  const latestRoot = document.getElementById("latest-root");

  try {
    const articles = (await LongevityStatic.getArticles()).sort(LongevityStatic.byNewest);
    const featured = articles.find(a => a.hasExplanation) || articles[0];
    const latest = articles.filter(a => a.slug !== featured.slug).slice(0, 4);

    const imageMarkup = featured.image
      ? `<div class="featured-image"><img src="${featured.image}" alt="${featured.title}"></div>`
      : "";

    featuredRoot.innerHTML = `
      <article class="featured-card">
        <div class="featured-grid">
          <div>
            <span class="eyebrow">Featured Article</span>
            <h2 class="featured-title"><a href="${LongevityStatic.siteUrl(`article/${encodeURIComponent(featured.slug)}/`)}">${featured.title}</a></h2>
            <p class="featured-copy">${(featured.technicalSummary || featured.excerpt || "").slice(0, 360)}...</p>
            <div style="margin-top:1rem;">
              <a class="btn btn-primary" href="${LongevityStatic.siteUrl(`article/${encodeURIComponent(featured.slug)}/`)}">Read Plain-Language Summary</a>
            </div>
          </div>
          ${imageMarkup}
        </div>
      </article>
    `;

    latestRoot.innerHTML = latest.map(LongevityStatic.articleCard).join("");
  } catch (err) {
    featuredRoot.innerHTML = `<p>Unable to load featured content.</p>`;
    latestRoot.innerHTML = `<p>Unable to load articles.</p>`;
  }
});
