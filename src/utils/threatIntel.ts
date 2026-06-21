export type IntelKind = "cves" | "campaigns";

export interface IntelItem {
  id: string;
  title: string;
  vendor?: string;
  product?: string;
  date: string;
  severity?: string;
  ransomware?: string;
  summary: string;
  url: string;
  source: string;
  kind: IntelKind;
}

export interface IntelBundle {
  cves: IntelItem[];
  campaigns: IntelItem[];
  updatedAt: string;
}

const cisaKevUrl =
  "https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json";
const githubAdvisoryUrl =
  "https://api.github.com/advisories?per_page=12&sort=published&direction=desc";

const campaignFeeds = [
  {
    source: "Microsoft Threat Intelligence",
    url: "https://www.microsoft.com/en-us/security/blog/topic/threat-intelligence/feed/",
  },
  {
    source: "BleepingComputer",
    url: "https://www.bleepingcomputer.com/feed/",
  },
];

const cacheKey = "raviyelna-threat-intel-cache-v2";
const cacheTtl = 1000 * 60 * 20;

const stripHtml = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const rssProxyUrl = (url: string) =>
  `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;

const readCache = (): IntelBundle | null => {
  if (typeof sessionStorage === "undefined") return null;
  const rawCache = sessionStorage.getItem(cacheKey);
  if (!rawCache) return null;

  const cached = JSON.parse(rawCache);
  if (Date.now() - cached.savedAt > cacheTtl) return null;
  return cached.bundle;
};

const writeCache = (bundle: IntelBundle) => {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    cacheKey,
    JSON.stringify({
      savedAt: Date.now(),
      bundle,
    }),
  );
};

const loadCves = async (): Promise<IntelItem[]> => {
  const [kevResponse, ghsaResponse] = await Promise.all([
    fetch(cisaKevUrl, { cache: "no-store" }),
    fetch(githubAdvisoryUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
    }),
  ]);

  if (!kevResponse.ok) throw new Error(`CISA KEV ${kevResponse.status}`);
  if (!ghsaResponse.ok) throw new Error(`GitHub GHSA ${ghsaResponse.status}`);

  const kevData = await kevResponse.json();
  const ghsaData = await ghsaResponse.json();

  const kevItems: IntelItem[] = kevData.vulnerabilities
    .slice()
    .sort(
      (a: any, b: any) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
    )
    .slice(0, 8)
    .map((item: any) => ({
      id: item.cveID,
      title: item.vulnerabilityName,
      vendor: item.vendorProject,
      product: item.product,
      date: item.dateAdded,
      ransomware: item.knownRansomwareCampaignUse,
      summary: item.shortDescription,
      url: `https://nvd.nist.gov/vuln/detail/${item.cveID}`,
      source: "CISA KEV",
      kind: "cves",
    }));

  const ghsaItems: IntelItem[] = ghsaData.slice(0, 8).map((item: any) => ({
    id: item.cve_id || item.ghsa_id,
    title: item.summary,
    date: item.published_at,
    severity: item.severity,
    summary: item.description || item.summary,
    url: item.html_url,
    source: "GitHub Advisory",
    kind: "cves",
  }));

  return [...kevItems, ...ghsaItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

const loadCampaignFeed = async ({
  source,
  url,
}: {
  source: string;
  url: string;
}): Promise<IntelItem[]> => {
  const response = await fetch(rssProxyUrl(url), { cache: "no-store" });
  if (!response.ok) throw new Error(`${source} ${response.status}`);

  const data = await response.json();
  if (data.status !== "ok") return [];

  return data.items.slice(0, 8).map((item: any) => ({
    id: source,
    title: item.title,
    date: item.pubDate,
    summary: stripHtml(item.description || item.content || ""),
    url: item.link,
    source,
    kind: "campaigns",
  }));
};

const loadCampaigns = async (): Promise<IntelItem[]> => {
  const settled = await Promise.allSettled(campaignFeeds.map(loadCampaignFeed));
  return settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);
};

export const loadThreatIntel = async (force = false): Promise<IntelBundle> => {
  if (!force) {
    const cached = readCache();
    if (cached) return cached;
  }

  const [cves, campaigns] = await Promise.all([loadCves(), loadCampaigns()]);
  const bundle = {
    cves,
    campaigns,
    updatedAt: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  writeCache(bundle);
  return bundle;
};

export const sourceUrl = (source: string) => {
  switch (source) {
    case "CISA KEV":
      return "https://github.com/cisagov/kev-data";
    case "GitHub Advisory":
      return "https://github.com/advisories";
    case "Microsoft Threat Intelligence":
      return "https://www.microsoft.com/en-us/security/blog/topic/threat-intelligence/";
    case "BleepingComputer":
      return "https://www.bleepingcomputer.com/";
    default:
      return "#";
  }
};
