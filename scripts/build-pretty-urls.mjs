import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "articles.json");

const ARTICLE_TEMPLATE = (slug) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Article | Longevity Hub</title>
  <meta name="description" content="Detailed longevity article summary with key takeaways.">
  <link rel="stylesheet" href="../../assets/css/styles.css">
  <script>window.__BASE_PATH__="../..";window.__ARTICLE_SLUG__=${JSON.stringify(slug)};</script>
  <script defer src="../../assets/js/app.js"></script>
  <script defer src="../../assets/js/article.js"></script>
</head>
<body>
  <div id="shell-header"></div>
  <main id="article-root"></main>
  <div id="shell-footer"></div>
</body>
</html>
`;

const CATEGORY_TEMPLATE = (slug) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Category | Longevity Hub</title>
  <meta name="description" content="Topic-focused longevity research category page.">
  <link rel="stylesheet" href="../../assets/css/styles.css">
  <script>window.__BASE_PATH__="../..";window.__CATEGORY_SLUG__=${JSON.stringify(slug)};</script>
  <script defer src="../../assets/js/app.js"></script>
  <script defer src="../../assets/js/category.js"></script>
</head>
<body>
  <div id="shell-header"></div>
  <main id="category-root"></main>
  <div id="shell-footer"></div>
</body>
</html>
`;

const ARTICLES_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Articles | Longevity Hub</title>
  <meta name="description" content="Filter and browse longevity research summaries.">
  <link rel="stylesheet" href="../assets/css/styles.css">
  <script>window.__BASE_PATH__="..";</script>
  <script defer src="../assets/js/app.js"></script>
  <script defer src="../assets/js/articles.js"></script>
</head>
<body>
  <div id="shell-header"></div>

  <main>
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Article Library</span>
        <h1>Browse Longevity Articles</h1>
        <p>Filter by category and explanation status to quickly find the studies and summaries you want.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-title-row"><h2 class="section-title">Filters</h2></div>
        <div id="category-filters" class="filters"></div>
        <div id="explanation-filters" class="filters"></div>

        <div id="articles-grid" class="card-grid"></div>

        <div id="pager" class="section-title-row" style="margin-top:1rem;"></div>
      </div>
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

  // Legacy entry points keep backward compatibility.
  await copyFile(path.join(ROOT, "articles", "index.html"), path.join(ROOT, "articles.html"));

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
