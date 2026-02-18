import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, "../data/articles.json");

const KEYWORDS = ["longevity", "aging", "healthspan", "senolytics", "metabolic health"];

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferSourceType(title = "") {
  const t = title.toLowerCase();
  if (t.includes("trial")) return "clinical_trial";
  if (t.includes("review") || t.includes("meta")) return "review";
  return "research_paper";
}

function inferEvidenceQuality(title = "") {
  const t = title.toLowerCase();
  if (t.includes("randomized")) return "rct";
  if (t.includes("meta-analysis") || t.includes("meta analysis")) return "meta_analysis";
  if (t.includes("review")) return "review";
  return "observational";
}

function toIsoDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function parseRssItems(xml, { sourceKey, sourceName, sourceType = "news", evidenceQuality = "editorial" }) {
  const items = [];
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

  for (const block of blocks) {
    const title = stripHtml(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
    const link = stripHtml(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "");
    const guid = stripHtml(block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1] || "");
    const pubDateRaw = stripHtml(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "");
    const description = stripHtml(block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || "");

    if (!title || !link) continue;

    const id = normalizeSlug(guid || link || title);
    items.push({
      externalId: `${sourceKey}:${id}`,
      title,
      abstract: description || title,
      sourceName,
      sourceUrl: link,
      sourceType,
      evidenceQuality,
      publishedDate: toIsoDate(pubDateRaw)
    });
  }

  return items;
}

async function fetchPubMedIds() {
  const term = encodeURIComponent(KEYWORDS.join(" OR "));
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmode=json&retmax=8&sort=pub+date`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data?.esearchresult?.idlist || [];
}

async function fetchPubMedDetails(pmid) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const xml = await response.text();

  const title = (xml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
  const abstract = Array.from(xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi))
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join("\n\n");
  const journal = (xml.match(/<MedlineTA>([\s\S]*?)<\/MedlineTA>/i)?.[1] || xml.match(/<Title>([\s\S]*?)<\/Title>/i)?.[1] || "PubMed Source").trim();

  const dateMatch = xml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>[\s\S]*?(<Month>([A-Za-z0-9]+)<\/Month>)?[\s\S]*?(<Day>(\d{1,2})<\/Day>)?[\s\S]*?<\/PubDate>/i);
  const year = dateMatch?.[1] || new Date().getUTCFullYear();
  const monthRaw = dateMatch?.[3] || "01";
  const dayRaw = dateMatch?.[5] || "01";

  const monthMap = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
  const month = monthMap[String(monthRaw).slice(0, 3).toLowerCase()] || String(monthRaw).padStart(2, "0");
  const day = String(dayRaw).padStart(2, "0");

  return {
    externalId: `pubmed:${pmid}`,
    title,
    abstract,
    sourceName: journal,
    sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    sourceType: inferSourceType(title),
    evidenceQuality: inferEvidenceQuality(title),
    publishedDate: `${year}-${month}-${day}`
  };
}

async function fetchMedrxiv() {
  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  const url = `https://api.biorxiv.org/details/medrxiv/${from}/${to}/0`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();

  return (data.collection || [])
    .filter((item) => item?.title && item?.abstract && item?.doi)
    .slice(0, 8)
    .map((item) => ({
      externalId: `medrxiv:${item.doi}`,
      title: item.title,
      abstract: item.abstract,
      sourceName: "medRxiv",
      sourceUrl: `https://doi.org/${item.doi}`,
      sourceType: "research_paper",
      evidenceQuality: "observational",
      publishedDate: item.date || new Date().toISOString().slice(0, 10)
    }));
}

async function fetchClinicalTrials() {
  const term = encodeURIComponent(KEYWORDS.join(" OR "));
  const url = `https://clinicaltrials.gov/api/v2/studies?format=json&pageSize=8&query.term=${term}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();

  return (data.studies || [])
    .map((study) => {
      const protocol = study.protocolSection || {};
      const idModule = protocol.identificationModule || {};
      const desc = protocol.descriptionModule || {};
      const design = protocol.designModule || {};
      const status = protocol.statusModule || {};

      const nctId = idModule.nctId;
      const title = idModule.briefTitle;
      const abstract = desc.briefSummary;
      if (!nctId || !title || !abstract) return null;

      const date = status.studyFirstPostDateStruct?.date || status.startDateStruct?.date || new Date().toISOString().slice(0, 10);

      return {
        externalId: `ctgov:${nctId}`,
        title,
        abstract,
        sourceName: "ClinicalTrials.gov",
        sourceUrl: `https://clinicaltrials.gov/study/${nctId}`,
        sourceType: "clinical_trial",
        evidenceQuality: design.designInfo?.allocation?.toLowerCase?.().includes("randomized") ? "rct" : "observational",
        publishedDate: date.length === 7 ? `${date}-01` : date.length === 4 ? `${date}-01-01` : date
      };
    })
    .filter(Boolean);
}

async function fetchNihNews() {
  const url = "https://www.nih.gov/news-events/news-releases";
  const response = await fetch(url);
  if (!response.ok) return [];
  const html = await response.text();

  const items = [];
  const linkPattern = /href="(\/news-events\/news-releases\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkPattern.exec(html)) && items.length < 12) {
    const href = match[1];
    const text = stripHtml(match[2]);
    if (!href || !text || text.length < 20) continue;
    if (items.some((item) => item.sourceUrl.endsWith(href))) continue;

    const fullUrl = `https://www.nih.gov${href}`;
    const [headline] = text.split(/\s+\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b\s+\d{1,2},\s+\d{4}\s+—\s+/);
    const title = (headline || text).trim();
    const abstract = text.trim();

    const dateMatch = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/);
    const publishedDate = dateMatch ? toIsoDate(dateMatch[0]) : new Date().toISOString().slice(0, 10);

    items.push({
      externalId: `nihnews:${normalizeSlug(href)}`,
      title,
      abstract,
      sourceName: "NIH News",
      sourceUrl: fullUrl,
      sourceType: "news",
      evidenceQuality: "editorial",
      publishedDate
    });
  }

  return items;
}

async function fetchWhoNews() {
  const url = "https://www.who.int/rss-feeds/news-english.xml";
  const response = await fetch(url);
  if (!response.ok) return [];
  const xml = await response.text();
  return parseRssItems(xml, {
    sourceKey: "whonews",
    sourceName: "WHO News",
    sourceType: "news",
    evidenceQuality: "editorial"
  }).slice(0, 10);
}

async function generateLaySummary(article) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      laymansExplanation: `This piece discusses ${article.title.toLowerCase()}. The key point is to interpret findings carefully, compare with broader evidence, and avoid overgeneralizing from a single source.`,
      keyTakeaways: [
        "Use this as educational context, not individualized medical advice.",
        "Check source quality and publication type before acting.",
        "Compare claims against multiple high-quality sources."
      ],
      technicalSummary: article.abstract.slice(0, 700)
    };
  }

  const prompt = `You are a longevity science communicator. Return strict JSON with keys laymansExplanation, keyTakeaways (array of 3), technicalSummary. Vary opening style (do not always start with 'Imagine').\n\nTitle: ${article.title}\nAbstract: ${article.abstract}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error(`LLM request failed: ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    laymansExplanation: parsed.laymansExplanation || parsed.laymans_explanation || "",
    keyTakeaways: parsed.keyTakeaways || parsed.key_takeaways || [],
    technicalSummary: parsed.technicalSummary || parsed.technical_summary || article.abstract.slice(0, 700)
  };
}

function mapCategories(text = "") {
  const t = text.toLowerCase();
  const categories = [];

  const all = [
    ["exercise", "Exercise", "Movement, training, and performance-related longevity insights.", ["exercise", "training", "vo2", "aerobic", "muscle", "strength"]],
    ["sleep", "Sleep", "Sleep quality, rhythms, and recovery-focused findings.", ["sleep", "circadian"]],
    ["nutrition", "Nutrition", "Dietary patterns and nutrition interventions for longevity.", ["diet", "nutrition", "protein", "fasting"]],
    ["metabolic-health", "Metabolic Health", "Insulin, glucose, lipid, and body-composition driven research.", ["metabolic", "insulin", "glucose", "prediabetes"]],
    ["cellular-health", "Cellular Health", "Cell-level mechanisms influencing aging and resilience.", ["cell", "mitochond", "inflammation", "nad"]],
    ["healthspan", "Healthspan", "Strategies that improve quality years, not only lifespan.", ["healthspan", "frailty", "aging", "longevity", "preventive", "prevention"]]
  ];

  for (const [slug, name, description, terms] of all) {
    if (terms.some((term) => t.includes(term))) categories.push({ slug, name, description });
  }

  return categories.length
    ? categories.slice(0, 2)
    : [{ slug: "healthspan", name: "Healthspan", description: "Strategies that improve quality years, not only lifespan." }];
}

async function main() {
  const existing = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const seen = new Set(existing.map((a) => a.externalId));

  const [nih, who] = await Promise.all([fetchNihNews(), fetchWhoNews()]);

  const prioritized = [...nih.slice(0, 6), ...who.slice(0, 6)];
  const incoming = prioritized
    .filter((a) => a.title && a.abstract && a.externalId)
    .filter((a) => !seen.has(a.externalId));

  const enriched = [];
  for (const article of incoming.slice(0, 10)) {
    const ai = await generateLaySummary(article);
    const categories = mapCategories(`${article.title} ${article.abstract}`);
    enriched.push({
      externalId: article.externalId,
      slug: normalizeSlug(article.title),
      title: article.title,
      excerpt: ai.technicalSummary.slice(0, 220),
      technicalSummary: ai.technicalSummary,
      laymansExplanation: ai.laymansExplanation,
      keyTakeaways: Array.isArray(ai.keyTakeaways) ? ai.keyTakeaways.slice(0, 5) : [],
      hasExplanation: !!ai.laymansExplanation,
      sourceName: article.sourceName,
      sourceUrl: article.sourceUrl,
      sourceType: article.sourceType,
      evidenceQuality: article.evidenceQuality,
      publishedDate: article.publishedDate,
      categories
    });
  }

  const merged = [...enriched, ...existing]
    .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
    .slice(0, 200);

  await writeFile(DATA_FILE, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Updated articles.json with ${enriched.length} new items (NIH/WHO/PubMed/medRxiv/CT.gov)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
