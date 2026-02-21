document.addEventListener("DOMContentLoaded", async () => {
  await LongevityStatic.bootShell();
  LongevityStatic.applySeo({
    title: "Longevity Hub | Research Explained in Plain English",
    description: "Evidence-based longevity research translated into practical, plain-language takeaways.",
    path: "",
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Longevity Hub",
      url: LongevityStatic.absoluteUrl(""),
      description: "Evidence-based longevity research translated into practical, plain-language takeaways."
    }
  });

  const featuredRoot = document.getElementById("featured-root");
  const latestRoot = document.getElementById("latest-root");

  try {
    let pinnedSlug = "";
    try {
      const configResponse = await fetch(LongevityStatic.siteUrl("data/site-config.json"));
      if (configResponse.ok) {
        const config = await configResponse.json();
        pinnedSlug = String(config?.featuredSlug || "").trim();
      }
    } catch {
      pinnedSlug = "";
    }

    const articles = (await LongevityStatic.getArticles()).sort(LongevityStatic.byNewest);
    const sourceWeight = {
      "PubMed": 6,
      "NIH News": 5,
      "WHO News": 4,
      "medRxiv": 3,
      "ClinicalTrials.gov": 2
    };

    function featuredScore(article) {
      const sourceScore = sourceWeight[article.sourceName] || 1;
      const typeScore = article.sourceType === "clinical_trial" ? 0 : article.sourceType === "news" ? 2 : 3;
      const explanationScore = article.hasExplanation ? 2 : 0;
      return sourceScore + typeScore + explanationScore;
    }

    const pinnedArticle = pinnedSlug ? articles.find((a) => a.slug === pinnedSlug) : null;
    const featured = pinnedArticle || [...articles]
      .sort((a, b) => {
        const scoreDiff = featuredScore(b) - featuredScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return LongevityStatic.byNewest(a, b);
      })[0] || articles[0];
    const latest = articles.filter((a) => a.slug !== featured.slug).slice(0, 4);

    const summary = featured.technicalSummary || featured.excerpt || "";

    featuredRoot.innerHTML = `
      <article class="bg-gradient-to-br from-clinical-800 to-clinical-900 rounded-2xl p-8 mb-10 shadow-sm text-white">
        <div>
          <div>
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
        </div>
      </article>
    `;

    latestRoot.innerHTML = latest.map((article, index) => LongevityStatic.articleCard(article, index + 1)).join("");

    const trackHomeClick = (event, section) => {
      const link = event.target.closest('a[href*="/article/"]');
      if (!link) return;
      const match = link.getAttribute("href")?.match(/\/article\/([^/]+)\//);
      if (!match) return;
      LongevityStatic.trackEvent("select_article_card", {
        article_slug: decodeURIComponent(match[1]),
        page_context: section
      });
    };

    featuredRoot.addEventListener("click", (event) => trackHomeClick(event, "home_featured"));
    latestRoot.addEventListener("click", (event) => trackHomeClick(event, "home_latest"));
  } catch (err) {
    featuredRoot.innerHTML = '<p class="text-sm text-gray-500">Unable to load featured content.</p>';
    latestRoot.innerHTML = '<p class="text-sm text-gray-500">Unable to load articles.</p>';
  }
});
