import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "articles.json");
const SITE_URL = "https://tofu-daddy.github.io/longevity-hub";

const ABOUT_PAGE = {
  slug: "about",
  title: "About",
  description: "Why Longevity Hub exists and how we approach evidence-based health communication.",
  updated: "February 18, 2026",
  content: `
    <p>Longevity Hub translates complex longevity and preventive-health research into plain-language summaries with clear caveats and source links.</p>
    <h2>Editorial Approach</h2>
    <p>We prioritize source fidelity, clear explanation of uncertainty, and practical relevance. We avoid overclaiming and clearly label early-stage evidence.</p>
    <h2>What You Can Expect</h2>
    <p>Each article is designed to help you quickly understand what was studied, what the results suggest, and what limitations matter before acting.</p>
    <h2>Scope</h2>
    <p>This site is for educational use and science communication. It is not medical advice.</p>
  `
};

const LEGAL_PAGES = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description: "How Longevity Hub collects, uses, and protects personal information.",
    updated: "February 18, 2026",
    content: `
      <p>Longevity Hub values your privacy. This policy explains what data we collect, why we collect it, and the choices available to you.</p>
      <h2>Information We Collect</h2>
      <p>We may collect basic analytics data (such as page views, browser type, and approximate location), information you submit directly, and technical logs needed for security and performance.</p>
      <h2>How We Use Information</h2>
      <p>We use data to operate and improve the site, understand audience usage, maintain security, respond to requests, and comply with legal obligations.</p>
      <h2>Sharing</h2>
      <p>We do not sell personal information. We may share limited data with service providers that support hosting, analytics, or security, subject to contractual safeguards.</p>
      <h2>Data Retention</h2>
      <p>We retain information only as long as reasonably needed for the purposes listed in this policy or as required by law.</p>
      <h2>Your Rights</h2>
      <p>Depending on your location, you may have rights to access, correct, delete, or restrict use of your data.</p>
    `
  },
  {
    slug: "terms",
    title: "Terms",
    description: "Terms and conditions for using Longevity Hub.",
    updated: "February 18, 2026",
    content: `
      <p>By using Longevity Hub, you agree to these Terms.</p>
      <h2>Educational Use Only</h2>
      <p>Content is provided for general informational and educational purposes only and is not medical advice, diagnosis, or treatment.</p>
      <h2>No Professional Relationship</h2>
      <p>Your use of the site does not create a doctor-patient or other professional relationship.</p>
      <h2>Accuracy and Availability</h2>
      <p>We aim for accuracy but do not guarantee completeness, timeliness, or uninterrupted availability of the site.</p>
      <h2>Third-Party Sources</h2>
      <p>We link to external sources for reference. We are not responsible for third-party content, updates, or availability.</p>
      <h2>Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, Longevity Hub is not liable for indirect, incidental, or consequential damages from site use.</p>
      <h2>Changes</h2>
      <p>We may update these Terms periodically. Continued use after updates means you accept the revised Terms.</p>
    `
  },
  {
    slug: "medical-disclaimer",
    title: "Medical Disclaimer",
    description: "Important medical and health-content disclaimer for Longevity Hub.",
    updated: "February 18, 2026",
    content: `
      <p>Longevity Hub provides science communication, not individualized medical advice.</p>
      <h2>Not Medical Advice</h2>
      <p>Nothing on this website should be used as a substitute for professional medical advice, diagnosis, or treatment from a qualified clinician.</p>
      <h2>Emergency Situations</h2>
      <p>If you believe you are experiencing a medical emergency, call emergency services immediately.</p>
      <h2>Health Decisions</h2>
      <p>Do not delay or discontinue medical care based on information from this website. Discuss any intervention, supplement, or protocol with your healthcare professional.</p>
      <h2>Evidence Changes</h2>
      <p>Biomedical evidence evolves rapidly. Findings summarized here may be preliminary or later revised.</p>
    `
  },
  {
    slug: "ai-editorial-policy",
    title: "AI Editorial Policy",
    description: "How AI is used in drafting and reviewing content on Longevity Hub.",
    updated: "February 18, 2026",
    content: `
      <p>Longevity Hub uses AI tools to assist with drafting summaries and formatting content.</p>
      <h2>Human Oversight</h2>
      <p>AI outputs are reviewed and edited before publication. We prioritize source fidelity, plain-language clarity, and transparent uncertainty.</p>
      <h2>Source Grounding</h2>
      <p>Articles should link to primary sources when available. Where evidence is early or mixed, summaries should state this clearly.</p>
      <h2>Limitations</h2>
      <p>AI can misinterpret context or overstate confidence. We actively monitor for these failure modes and correct issues when identified.</p>
      <h2>Corrections</h2>
      <p>When issues are identified, we review source material and publish corrections as needed.</p>
    `
  },
  {
    slug: "california-privacy-notice",
    title: "California Privacy Notice",
    description: "California-specific privacy disclosures and rights.",
    updated: "February 18, 2026",
    content: `
      <p>This California notice supplements our Privacy Policy for California residents.</p>
      <h2>Categories of Information</h2>
      <p>We may collect identifiers, internet activity, and other data categories described in our Privacy Policy.</p>
      <h2>Purposes</h2>
      <p>Information is used to operate, secure, and improve the website and to provide requested services.</p>
      <h2>Your Rights</h2>
      <p>California residents may have rights to know, delete, correct, and limit certain uses of personal information, subject to legal exceptions.</p>
      <h2>Non-Discrimination</h2>
      <p>We do not discriminate against users for exercising privacy rights.</p>
      <h2>Submitting Requests</h2>
      <p>Verifiable privacy requests may be submitted through available site channels.</p>
    `
  },
  {
    slug: "cookie-notice",
    title: "Cookie Notice",
    description: "Information about cookies and tracking technologies used by Longevity Hub.",
    updated: "February 18, 2026",
    content: `
      <p>Longevity Hub may use cookies and similar technologies for core site functionality, analytics, and security.</p>
      <h2>Types of Cookies</h2>
      <p>Essential cookies support site operation; analytics cookies help us understand usage and improve content quality.</p>
      <h2>Managing Cookies</h2>
      <p>You can control cookies in your browser settings. Disabling cookies may affect some site functionality.</p>
      <h2>Third-Party Technologies</h2>
      <p>Some analytics or hosting providers may set cookies on our behalf, subject to their own policies.</p>
    `
  },
  {
    slug: "copyright-and-dmca-notice",
    title: "Copyright & DMCA Notice",
    description: "Copyright ownership and DMCA takedown policy for Longevity Hub.",
    updated: "February 18, 2026",
    content: `
      <p>Unless otherwise noted, site content is owned by Longevity Hub and protected by copyright laws.</p>
      <h2>Permitted Use</h2>
      <p>You may link to and quote brief excerpts with proper attribution. Reproduction of full content requires permission unless otherwise allowed by law.</p>
      <h2>DMCA Procedure</h2>
      <p>If you believe material on this site infringes your copyright, send a DMCA notice with the infringing URL, ownership details, and a sworn statement of good faith.</p>
      <h2>Counter-Notice</h2>
      <p>If your content was removed in error, you may submit a counter-notice in accordance with applicable law.</p>
    `
  }
];

function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function canonical(pathname = "") {
  const cleaned = String(pathname).replace(/^\/+/, "");
  return `${SITE_URL}/${cleaned}`;
}

function pageHead({ title, description, basePath, scriptPath = "", pagePath, extraScript = "", type = "website", image = "assets/og-default.svg" }) {
  const prefix = basePath === "." ? "" : `${basePath}/`;
  const canonicalUrl = canonical(pagePath);
  const imageUrl = image.startsWith("http") ? image : canonical(image);

  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="Longevity Hub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-WQ4NKNN0TM"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-WQ4NKNN0TM');
  </script>
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
  ${scriptPath ? `<script defer src="${prefix}${scriptPath}"></script>` : ""}
`;
}

function articleTemplate(article) {
  return `<!doctype html>
<html lang="en">
<head>${pageHead({
  title: `${article.title} | Longevity Hub`,
  description: (article.excerpt || article.technicalSummary || "Detailed longevity article summary with key takeaways.").slice(0, 160),
  basePath: "../..",
  scriptPath: "assets/js/article.js",
  pagePath: `article/${article.slug}/`,
  extraScript: `window.__ARTICLE_SLUG__=${JSON.stringify(article.slug)};`,
  type: "article",
  image: article.image || "assets/og-default.svg"
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
}

function categoryTemplate(category) {
  return `<!doctype html>
<html lang="en">
<head>${pageHead({
  title: `${category.name} Articles | Longevity Hub`,
  description: category.description || `Curated longevity research and plain-language summaries for ${category.name}.`,
  basePath: "../..",
  scriptPath: "assets/js/category.js",
  pagePath: `category/${category.slug}/`,
  extraScript: `window.__CATEGORY_SLUG__=${JSON.stringify(category.slug)};`
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
}

function staticContentTemplate({ sectionLabel, title, description, slug, updated, content }) {
  return `<!doctype html>
<html lang="en">
<head>${pageHead({
  title: `${title} | Longevity Hub`,
  description,
  basePath: "..",
  pagePath: `${slug}/`
})}</head>
<body class="bg-gray-50 text-gray-900 antialiased">
  <div id="shell-header"></div>
  <main id="primary" class="site-main">
    <section class="bg-gradient-to-br from-clinical-800 to-clinical-900 text-white border-b border-clinical-700">
      <div class="max-w-7xl mx-auto px-6 py-14 md:py-16">
        <p class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/10 text-clinical-100 mb-5">${esc(sectionLabel)}</p>
        <h1 class="text-4xl md:text-5xl font-normal tracking-tight mb-4">${esc(title)}</h1>
        <p class="text-clinical-100 text-base md:text-lg leading-relaxed">${esc(description)}</p>
      </div>
    </section>
    <section class="max-w-5xl mx-auto px-6 py-12">
      <article class="bg-white rounded-xl border border-neutral-200 p-6 md:p-8 prose prose-neutral max-w-none">
        <p><strong>Last Updated:</strong> ${esc(updated)}</p>
        ${content}
      </article>
    </section>
  </main>
  <div id="shell-footer"></div>
  <script>
    document.addEventListener('DOMContentLoaded', async function () {
      if (window.LongevityStatic && window.LongevityStatic.bootShell) {
        await window.LongevityStatic.bootShell();
      }
      if (window.LongevityStatic && window.LongevityStatic.applySeo) {
        window.LongevityStatic.applySeo({
          title: ${JSON.stringify(`${title} | Longevity Hub`)},
          description: ${JSON.stringify(description)},
          path: ${JSON.stringify(`${slug}/`)},
          type: 'website'
        });
      }
    });
  </script>
</body>
</html>
`;
}

const ARTICLES_PAGE = `<!doctype html>
<html lang="en">
<head>${pageHead({
  title: "Articles | Longevity Hub",
  description: "Filter and browse longevity research summaries.",
  basePath: "..",
  scriptPath: "assets/js/articles.js",
  pagePath: "articles/"
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

async function buildSitemap(articleSlugs, categories) {
  const urls = [
    "",
    "about/",
    "articles/",
    ...articleSlugs.map((slug) => `article/${slug}/`),
    ...categories.map((category) => `category/${category.slug}/`),
    ...LEGAL_PAGES.map((page) => `${page.slug}/`)
  ];

  const body = urls.map((u) => `  <url><loc>${canonical(u)}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  await writeFile(path.join(ROOT, "sitemap.xml"), xml, "utf8");
}

async function writeSupportFiles() {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  await writeFile(path.join(ROOT, "robots.txt"), robots, "utf8");

  const llms = `# Longevity Hub\n\n## Summary\nLongevity Hub publishes plain-language summaries of longevity and preventive-health research with links to original sources.\n\n## Canonical URLs\n- Home: ${SITE_URL}/\n- About: ${SITE_URL}/about/\n- Articles: ${SITE_URL}/articles/\n- AI Editorial Policy: ${SITE_URL}/ai-editorial-policy/\n- Medical Disclaimer: ${SITE_URL}/medical-disclaimer/\n\n## Use Guidance\n- Prefer source links cited on each article page.\n- Do not treat this site as medical advice.\n`;
  await writeFile(path.join(ROOT, "llms.txt"), llms, "utf8");
}

async function main() {
  const articles = JSON.parse(await readFile(DATA_PATH, "utf8"));

  await rm(path.join(ROOT, "article"), { recursive: true, force: true });
  await rm(path.join(ROOT, "category"), { recursive: true, force: true });

  await mkdir(path.join(ROOT, "articles"), { recursive: true });
  await writeFile(path.join(ROOT, "articles", "index.html"), ARTICLES_PAGE, "utf8");

  for (const article of articles) {
    if (!article?.slug) continue;
    const dir = path.join(ROOT, "article", article.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), articleTemplate(article), "utf8");
  }

  const categoryMap = new Map();
  for (const article of articles) {
    for (const category of article?.categories || []) {
      if (!category?.slug) continue;
      if (!categoryMap.has(category.slug)) categoryMap.set(category.slug, category);
    }
  }

  const categories = [...categoryMap.values()];
  for (const category of categories) {
    const dir = path.join(ROOT, "category", category.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), categoryTemplate(category), "utf8");
  }

  const aboutDir = path.join(ROOT, ABOUT_PAGE.slug);
  await mkdir(aboutDir, { recursive: true });
  await writeFile(path.join(aboutDir, "index.html"), staticContentTemplate({
    sectionLabel: "Company",
    title: ABOUT_PAGE.title,
    description: ABOUT_PAGE.description,
    slug: ABOUT_PAGE.slug,
    updated: ABOUT_PAGE.updated,
    content: ABOUT_PAGE.content
  }), "utf8");

  for (const page of LEGAL_PAGES) {
    const dir = path.join(ROOT, page.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), staticContentTemplate({
      sectionLabel: "Legal",
      title: page.title,
      description: page.description,
      slug: page.slug,
      updated: page.updated,
      content: page.content
    }), "utf8");
  }

  await writeFile(path.join(ROOT, "articles.html"), "<!doctype html><meta charset='utf-8'><meta http-equiv='refresh' content='0; url=./articles/'><title>Redirecting...</title>", "utf8");
  await writeFile(path.join(ROOT, "article.html"), "<!doctype html><meta charset='utf-8'><meta http-equiv='refresh' content='0; url=./articles/'><title>Redirecting...</title>", "utf8");
  await writeFile(path.join(ROOT, "category.html"), "<!doctype html><meta charset='utf-8'><meta http-equiv='refresh' content='0; url=./articles/'><title>Redirecting...</title>", "utf8");

  await buildSitemap(articles.map((a) => a.slug), categories);
  await writeSupportFiles();

  console.log(`Generated site artifacts: ${articles.length} articles, ${categories.length} categories, ${LEGAL_PAGES.length} legal pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
