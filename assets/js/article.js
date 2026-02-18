document.addEventListener("DOMContentLoaded", async () => {
  await LongevityStatic.bootShell();

  const params = new URLSearchParams(window.location.search);
  const pathMatch = window.location.pathname.match(/\/article\/([^/]+)\/?$/);
  const slug = window.__ARTICLE_SLUG__ || (pathMatch ? decodeURIComponent(pathMatch[1]) : params.get("slug"));
  const root = document.getElementById("article-root");

  if (!slug) {
    root.innerHTML = '<div class="max-w-7xl mx-auto px-6 py-10 text-sm text-gray-600">Missing article slug.</div>';
    return;
  }

  function toParagraphs(text) {
    return String(text || "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${LongevityStatic.escapeHtml(p)}</p>`)
      .join("");
  }

  try {
    const articles = await LongevityStatic.getArticles();
    const article = articles.find((a) => a.slug === slug);

    if (!article) {
      root.innerHTML = '<div class="max-w-7xl mx-auto px-6 py-10 text-sm text-gray-600">The requested article does not exist.</div>';
      return;
    }

    LongevityStatic.applySeo({
      title: `${article.title} | Longevity Hub`,
      description: (article.excerpt || article.technicalSummary || "").slice(0, 160),
      path: `article/${encodeURIComponent(article.slug)}/`,
      type: "article",
      image: article.image || "",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.excerpt || article.technicalSummary || "",
        datePublished: article.publishedDate,
        author: {
          "@type": "Organization",
          name: "Longevity Hub Editorial Team"
        },
        publisher: {
          "@type": "Organization",
          name: "Longevity Hub"
        },
        mainEntityOfPage: LongevityStatic.absoluteUrl(`article/${encodeURIComponent(article.slug)}/`),
        isBasedOn: article.sourceUrl || undefined
      }
    });

    const categories = article.categories || [];
    const breadcrumbCategory = categories[0];
    const categoryBadges = categories.map((category) => `
      <a href="${LongevityStatic.siteUrl(`category/${encodeURIComponent(category.slug)}/`)}" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-clinical-700 text-white hover:bg-clinical-600 transition-colors">${LongevityStatic.escapeHtml(category.name)}</a>
    `).join("");

    const takeaways = (article.keyTakeaways || []).map((takeaway) => `
      <li class="flex items-start gap-3">
        <svg class="w-5 h-5 text-lab-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-neutral-700">${LongevityStatic.escapeHtml(takeaway)}</span>
      </li>
    `).join("");

    const sourceUrl = article.sourceUrl || "#";
    const sourceName = article.sourceName || "Source";
    const sourceType = LongevityStatic.sourceTypeLabel(article.sourceType);

    root.innerHTML = `
      <article>
        <header class="bg-gradient-to-br from-clinical-800 to-clinical-900 text-white py-12 md:py-16">
          <div class="container mx-auto px-4">
            <div class="max-w-4xl mx-auto">
              <nav class="mb-6 text-sm" aria-label="Breadcrumb">
                <ol class="flex items-center gap-2 text-clinical-300">
                  <li><a href="${LongevityStatic.siteUrl("")}" class="hover:text-white transition-colors">Home</a></li>
                  <li><span class="mx-2">/</span></li>
                  <li><a href="${LongevityStatic.siteUrl("articles/")}" class="hover:text-white transition-colors">Articles</a></li>
                  ${breadcrumbCategory ? `<li><span class="mx-2">/</span></li><li><a href="${LongevityStatic.siteUrl(`category/${encodeURIComponent(breadcrumbCategory.slug)}/`)}" class="hover:text-white transition-colors">${LongevityStatic.escapeHtml(breadcrumbCategory.name)}</a></li>` : ""}
                </ol>
              </nav>

              ${categoryBadges ? `<div class="flex flex-wrap gap-2 mb-4">${categoryBadges}</div>` : ""}

              <h1 class="text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight">${LongevityStatic.escapeHtml(article.title)}</h1>

              <div class="flex flex-wrap items-center gap-4 text-clinical-200 source-meta">
                <p class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                  </svg>
                  ${LongevityStatic.escapeHtml(sourceName)}
                </p>
                <p class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  ${LongevityStatic.fmtDate(article.publishedDate)}
                </p>
                <p class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                  ${LongevityStatic.escapeHtml(sourceType)}
                </p>
              </div>

              ${article.hasExplanation ? '<div class="flex flex-wrap gap-3 mt-6"><span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-lab-500 text-white">Explained in Plain English</span></div>' : ""}
            </div>
          </div>
        </header>

        <div class="container mx-auto px-4 py-8 md:py-12">
          <div class="max-w-4xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div class="lg:col-span-2">
                <div class="bg-clinical-50 border border-clinical-200 rounded-xl p-6 mb-8">
                  <h2 class="text-lg font-bold text-clinical-800 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                    </svg>
                    Key Takeaways
                  </h2>
                  <ul class="space-y-3">${takeaways || '<li class="text-neutral-700">No key takeaways yet.</li>'}</ul>
                </div>

                <div class="bg-white border border-neutral-200 rounded-xl p-6 md:p-8 mb-8">
                  <h2 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                    <span class="flex-shrink-0 w-10 h-10 rounded-full bg-lab-100 text-lab-600 flex items-center justify-center">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                      </svg>
                    </span>
                    Here's What This Means For You
                  </h2>
                  <div class="prose prose-neutral prose-lg max-w-none">${toParagraphs(article.laymansExplanation || article.excerpt || "Explanation coming soon.")}</div>
                </div>

                <div class="bg-white border border-neutral-200 rounded-xl p-6 md:p-8">
                  <h2 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                    <span class="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </span>
                    Article Summary
                  </h2>
                  ${article.image ? `<div class="mb-6 rounded-lg overflow-hidden"><img src="${article.image}" alt="${LongevityStatic.escapeHtml(article.title)}" class="w-full h-auto" loading="lazy"></div>` : ""}
                  <div class="prose prose-neutral max-w-none">${toParagraphs(article.excerpt || article.technicalSummary || "Summary coming soon.")}</div>
                </div>
              </div>

              <aside class="lg:col-span-1">
                <div class="bg-white border border-neutral-200 rounded-xl p-6 mb-6 sticky top-32">
                  <h3 class="text-lg font-bold text-neutral-900 mb-4">Source Information</h3>

                  <dl class="space-y-4 text-sm">
                    <div>
                      <dt class="text-neutral-500 mb-1">Source</dt>
                      <dd class="font-medium text-neutral-900">${LongevityStatic.escapeHtml(sourceName)}</dd>
                    </div>
                    <div>
                      <dt class="text-neutral-500 mb-1">Content Type</dt>
                      <dd class="font-medium text-neutral-900">${LongevityStatic.escapeHtml(sourceType)}</dd>
                    </div>
                    <div>
                      <dt class="text-neutral-500 mb-1">Published</dt>
                      <dd class="font-medium text-neutral-900">${LongevityStatic.fmtDate(article.publishedDate)}</dd>
                    </div>
                    ${article.evidenceQuality ? `<div><dt class="text-neutral-500 mb-1">Evidence Quality</dt><dd class="font-medium text-neutral-900">${LongevityStatic.escapeHtml(article.evidenceQuality)}</dd></div>` : ""}
                  </dl>

                  <div class="mt-6 pt-6 border-t border-neutral-200">
                    <a href="${sourceUrl}" target="_blank" rel="noopener" class="inline-flex items-center justify-center w-full px-4 py-3 rounded-lg bg-clinical-600 text-white font-medium hover:bg-clinical-700 transition-colors">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                      Read Original Article
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </article>
    `;
  } catch (err) {
    root.innerHTML = '<div class="max-w-7xl mx-auto px-6 py-10 text-sm text-gray-600">Unable to load article.</div>';
  }
});
