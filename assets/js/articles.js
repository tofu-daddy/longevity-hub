document.addEventListener("DOMContentLoaded", async () => {
  await LongevityStatic.bootShell();
  LongevityStatic.applySeo({
    title: "Browse Articles | Longevity Hub",
    description: "Browse and filter longevity research summaries by topic.",
    path: "articles/",
    type: "website"
  });

  const categoryFilters = document.getElementById("category-filters");
  const grid = document.getElementById("articles-grid");
  const pager = document.getElementById("pager");
  const loading = document.getElementById("loading-indicator");

  const params = new URLSearchParams(window.location.search);
  let currentCategory = params.get("category") || "all";
  let currentPage = Number(params.get("page") || "1");
  const PER_PAGE = 8;
  let allArticles = [];

  function updateUrl() {
    const q = new URLSearchParams();
    if (currentCategory !== "all") q.set("category", currentCategory);
    if (currentPage > 1) q.set("page", String(currentPage));
    history.replaceState(null, "", `${LongevityStatic.siteUrl("articles/")}${q.toString() ? `?${q}` : ""}`);
  }

  function renderFilterButtons(articles) {
    const categories = LongevityStatic.categoryFromArticles(articles);

    categoryFilters.innerHTML = [
      `<button class="filter-btn ${currentCategory === "all" ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 whitespace-nowrap transition-all" data-cat="all">All Articles</button>`,
      ...categories.map((c) => `<button class="filter-btn ${currentCategory === c.slug ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-clinical-300 whitespace-nowrap transition-all" data-cat="${c.slug}">${LongevityStatic.escapeHtml(c.name)}</button>`)
    ].join("");

    categoryFilters.querySelectorAll("[data-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentCategory = btn.dataset.cat;
        currentPage = 1;
        run();
      });
    });

  }

  function applyFilters(articles) {
    return articles.filter((a) => currentCategory === "all" || (a.categories || []).some((c) => c.slug === currentCategory));
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
