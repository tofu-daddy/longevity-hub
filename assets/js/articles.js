document.addEventListener("DOMContentLoaded", async () => {
  LongevityStatic.bootShell();

  const categoryFilters = document.getElementById("category-filters");
  const explanationFilters = document.getElementById("explanation-filters");
  const grid = document.getElementById("articles-grid");
  const pager = document.getElementById("pager");

  const params = new URLSearchParams(window.location.search);
  let currentCategory = params.get("category") || "all";
  let currentExplanation = params.get("has_explanation") || "all";
  let currentPage = Number(params.get("page") || "1");

  const PER_PAGE = 8;

  function updateUrl() {
    const q = new URLSearchParams();
    if (currentCategory !== "all") q.set("category", currentCategory);
    if (currentExplanation !== "all") q.set("has_explanation", currentExplanation);
    if (currentPage > 1) q.set("page", String(currentPage));
    history.replaceState(null, "", `${LongevityStatic.siteUrl("articles/")}${q.toString() ? `?${q}` : ""}`);
  }

  function renderFilterButtons(articles) {
    const categories = LongevityStatic.categoryFromArticles(articles);

    categoryFilters.innerHTML = [
      `<button class="filter-btn ${currentCategory === "all" ? "active" : ""}" data-cat="all">All</button>`,
      ...categories.map(c => `<button class="filter-btn ${currentCategory === c.slug ? "active" : ""}" data-cat="${c.slug}">${c.name}</button>`)
    ].join("");

    explanationFilters.innerHTML = `
      <button class="filter-btn ${currentExplanation === "all" ? "active" : ""}" data-exp="all">All Content</button>
      <button class="filter-btn ${currentExplanation === "yes" ? "active" : ""}" data-exp="yes">Explained</button>
      <button class="filter-btn ${currentExplanation === "no" ? "active" : ""}" data-exp="no">Needs Explanation</button>
    `;

    categoryFilters.querySelectorAll("[data-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentCategory = btn.dataset.cat;
        currentPage = 1;
        run();
      });
    });

    explanationFilters.querySelectorAll("[data-exp]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentExplanation = btn.dataset.exp;
        currentPage = 1;
        run();
      });
    });
  }

  function applyFilters(articles) {
    return articles.filter(a => {
      const categoryMatch = currentCategory === "all" || (a.categories || []).some(c => c.slug === currentCategory);
      const explanationMatch = currentExplanation === "all"
        || (currentExplanation === "yes" && !!a.hasExplanation)
        || (currentExplanation === "no" && !a.hasExplanation);
      return categoryMatch && explanationMatch;
    });
  }

  function renderPager(totalPages) {
    if (totalPages <= 1) {
      pager.innerHTML = "";
      return;
    }

    pager.innerHTML = `
      <button class="btn" ${currentPage <= 1 ? "disabled" : ""} id="prev-page">Previous</button>
      <span>Page ${currentPage} of ${totalPages}</span>
      <button class="btn" ${currentPage >= totalPages ? "disabled" : ""} id="next-page">Next</button>
    `;

    const prev = document.getElementById("prev-page");
    const next = document.getElementById("next-page");
    if (prev) prev.addEventListener("click", () => { currentPage -= 1; run(); });
    if (next) next.addEventListener("click", () => { currentPage += 1; run(); });
  }

  let allArticles = [];

  function run() {
    updateUrl();
    renderFilterButtons(allArticles);

    const filtered = applyFilters(allArticles).sort(LongevityStatic.byNewest);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    grid.innerHTML = pageItems.length
      ? pageItems.map(LongevityStatic.articleCard).join("")
      : `<div class="panel"><h2>No matching articles</h2><p>Try adjusting your filters.</p></div>`;

    renderPager(totalPages);
  }

  try {
    allArticles = await LongevityStatic.getArticles();
    run();
  } catch (err) {
    grid.innerHTML = `<p>Unable to load articles.</p>`;
  }
});
