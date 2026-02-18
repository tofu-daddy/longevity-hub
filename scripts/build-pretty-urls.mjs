import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "articles.json");

function pageHead({ title, description, basePath, scriptPath, extraScript = "" }) {
  const prefix = basePath === "." ? "" : `${basePath}/`;

  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            clinical: {
              50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8',
              500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e'
            },
            lab: {
              50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
              500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d'
            }
          },
          fontFamily: {
            sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
            mono: ['IBM Plex Mono', 'monospace']
          }
        }
      }
    };
  </script>
  <link rel="stylesheet" href="${prefix}assets/css/theme.css">
  <link rel="stylesheet" href="${prefix}assets/css/styles.css">
  <script>window.__BASE_PATH__=${JSON.stringify(basePath)};${extraScript}</script>
  <script defer src="${prefix}assets/js/app.js"></script>
  <script defer src="${prefix}${scriptPath}"></script>
`;
}

const ARTICLE_TEMPLATE = (slug) => `<!doctype html>
<html lang="en">
<head>${pageHead({
  title: "Article | Longevity Hub",
  description: "Detailed longevity article summary with key takeaways.",
  basePath: "../..",
  scriptPath: "assets/js/article.js",
  extraScript: `window.__ARTICLE_SLUG__=${JSON.stringify(slug)};`
})}</head>
<body class="bg-gray-50 text-gray-900 antialiased single-longevity_article">
  <div id="shell-header"></div>
  <main id="primary" class="site-main">
    <div id="article-root"></div>
  </main>
  <div id="shell-footer"></div>
</body>
</html>
`;

const CATEGORY_TEMPLATE = (slug) => `<!doctype html>
<html lang="en">
<head>${pageHead({
  title: "Category | Longevity Hub",
  description: "Topic-focused longevity research category page.",
  basePath: "../..",
  scriptPath: "assets/js/category.js",
  extraScript: `window.__CATEGORY_SLUG__=${JSON.stringify(slug)};`
})}</head>
<body class="bg-gray-50 text-gray-900 antialiased">
  <div id="shell-header"></div>
  <main id="primary" class="site-main">
    <div id="category-root"></div>
  </main>
  <div id="shell-footer"></div>
</body>
</html>
`;

const ARTICLES_PAGE = `<!doctype html>
<html lang="en">
<head>${pageHead({
  title: "Articles | Longevity Hub",
  description: "Filter and browse longevity research summaries.",
  basePath: "..",
  scriptPath: "assets/js/articles.js"
})}</head>
<body class="bg-gray-50 text-gray-900 antialiased">
  <div id="shell-header"></div>

  <main id="primary" class="site-main">
    <section class="border-b border-gray-200 gradient-bg">
      <div class="max-w-7xl mx-auto px-6 py-20">
        <div class="max-w-3xl fade-in-up">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-clinical-200 text-clinical-700 text-xs font-mono rounded-full mb-6 shadow-sm">
            <span class="w-2 h-2 bg-lab-500 rounded-full pulse-dot"></span>
            <span class="font-semibold uppercase tracking-wide">Complex Research, Simple Explanations</span>
          </div>

          <h1 class="text-5xl md:text-6xl tracking-tight mb-6 leading-tight">
            Longevity research,<br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-clinical-600 to-lab-600">explained in plain English.</span>
          </h1>

          <p class="text-xl text-gray-600 leading-relaxed mb-8">
            Stop struggling with medical jargon. Get expert-curated longevity research translated into simple, actionable insights you can actually understand and apply.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-gray-200 bg-white sticky top-[73px] z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide" id="category-filters"></div>
        <div class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide mt-2" id="explanation-filters"></div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-6 py-12">
      <div id="loading-indicator" class="hidden fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-clinical-200 border-t-clinical-600 rounded-full animate-spin"></div>
          <span class="text-gray-600">Loading...</span>
        </div>
      </div>

      <div id="articles-grid" class="grid grid-cols-1 lg:grid-cols-2 gap-8"></div>
      <div id="pager" class="flex justify-center items-center gap-4 mt-10"></div>
    </section>
  </main>

  <div id="shell-footer"></div>
</body>
</html>
`;

async function main() {
  const articles = JSON.parse(await readFile(DATA_PATH, "utf8"));

  await mkdir(path.join(ROOT, "articles"), { recursive: true });
  await writeFile(path.join(ROOT, "articles", "index.html"), ARTICLES_PAGE, "utf8");

  for (const article of articles) {
    if (!article?.slug) continue;
    const dir = path.join(ROOT, "article", article.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), ARTICLE_TEMPLATE(article.slug), "utf8");
  }

  const categorySlugs = new Set();
  for (const article of articles) {
    for (const category of article?.categories || []) {
      if (category?.slug) categorySlugs.add(category.slug);
    }
  }

  for (const slug of categorySlugs) {
    const dir = path.join(ROOT, "category", slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), CATEGORY_TEMPLATE(slug), "utf8");
  }

  await writeFile(
    path.join(ROOT, "articles.html"),
    "<!doctype html><meta charset='utf-8'><meta http-equiv='refresh' content='0; url=./articles/'><title>Redirecting...</title>",
    "utf8"
  );

  await writeFile(
    path.join(ROOT, "article.html"),
    "<!doctype html><meta charset='utf-8'><meta http-equiv='refresh' content='0; url=./articles/'><title>Redirecting...</title>",
    "utf8"
  );

  await writeFile(
    path.join(ROOT, "category.html"),
    "<!doctype html><meta charset='utf-8'><meta http-equiv='refresh' content='0; url=./articles/'><title>Redirecting...</title>",
    "utf8"
  );

  console.log(`Generated pretty URLs: ${articles.length} articles, ${categorySlugs.size} categories`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
