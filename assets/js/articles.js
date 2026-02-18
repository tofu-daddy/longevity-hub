document.addEventListener("DOMContentLoaded", async () => {
  await LongevityStatic.bootShell();

  const categoryFilters = document.getElementById("category-filters");
  const explanationFilters = document.getElementById("explanation-filters");
  const grid = document.getElementById("articles-grid");
  const pager = document.getElementById("pager");
  const loading = document.getElementById("loading-indicator");

  const params = new URLSearchParams(window.location.search);
  let currentCategory = params.get("category") || "all";
  let currentExplanation = params.get("has_explanation") || "all";
  let currentPage = Number(params.get("page") || "1");
  const PER_PAGE = 8;
  let allArticles = [];

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
      `<button class="filter-btn ${currentCategory === "all" ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 whitespace-nowrap transition-all" data-cat="all">All Articles</button>`,
      ...categories.map((c) => `<button class="filter-btn ${currentCategory === c.slug ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-clinical-300 whitespace-nowrap transition-all" data-cat="${c.slug}">${LongevityStatic.escapeHtml(c.name)}</button>`)
    ].join("");

    explanationFilters.innerHTML = `
      <button class="filter-btn ${currentExplanation === "all" ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 whitespace-nowrap transition-all" data-exp="all">All Content</button>
      <button class="filter-btn ${currentExplanation === "yes" ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 whitespace-nowrap transition-all" data-exp="yes">Explained</button>
      <button class="filter-btn ${currentExplanation === "no" ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 whitespace-nowrap transition-all" data-exp="no">Needs Explanation</button>
    `;

    categoryFilters.querySelectorAll("[data-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentCategory = btn.dataset.cat;
        currentPage = 1;
        run();
      });
    });

    explanationFilters.querySelectorAll("[data-exp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentExplanation = btn.dataset.exp;
        currentPage = 1;
        run();
      });
    });
  }

  function applyFilters(articles) {
    return articles.filter((a) => {
      const categoryMatch = currentCategory === "all" || (a.categories || []).some((c) => c.slug === currentCategory);
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
      <button class="px-5 py-2 border border-gray-300 rounded-lg text-sm" ${currentPage <= 1 ? "disabled" : ""} id="prev-page">Previous</button>
      <span class="text-sm text-gray-600">Page ${currentPage} of ${totalPages}</span>
      <button class="px-5 py-2 border border-gray-300 rounded-lg text-sm" ${currentPage >= totalPages ? "disabled" : ""} id="next-page">Next</button>
    `;

    const prev = document.getElementById("prev-page");
    const next = document.getElementById("next-page");
    if (prev) prev.addEventListener("click", () => { currentPage -= 1; run(); });
    if (next) next.addEventListener("click", () => { currentPage += 1; run(); });
  }

  function run() {
    if (loading) loading.classList.remove("hidden");
    updateUrl();
    renderFilterButtons(allArticles);

    const filtered = applyFilters(allArticles).sort(LongevityStatic.byNewest);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    grid.innerHTML = pageItems.length
      ? pageItems.map((item, index) => LongevityStatic.articleCard(item, index + 1)).join("")
      : '<div class="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">No matching articles. Try adjusting your filters.</div>';

    renderPager(totalPages);

    if (loading) {
      setTimeout(() => loading.classList.add("hidden"), 120);
    }
  }

  try {
    allArticles = await LongevityStatic.getArticles();
    run();
  } catch (err) {
    grid.innerHTML = '<p class="text-sm text-gray-500">Unable to load articles.</p>';
    if (loading) loading.classList.add("hidden");
  }
});
