import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const BACKUP_ROOT = path.resolve(PROJECT_ROOT, "../MCP-Website-BACKUP");
const CLEARWEB_ROOT = path.join(BACKUP_ROOT, "client", "src", "clearweb");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const LIVE_IMAGE_ROOT = path.join(PROJECT_ROOT, "assets", "images", "live-site");
const LIVE_ICON_ROOT = path.join(PROJECT_ROOT, "assets", "icons", "live-site");
const LIVE_NEWS_IMAGE_ROOT = path.join(LIVE_IMAGE_ROOT, "news");
const LIVE_BASE_URL = "https://mcp.physics.wm.edu";

const SOURCE_FILES = {
  app: path.join(BACKUP_ROOT, "client", "src", "App.js"),
  homepage: path.join(CLEARWEB_ROOT, "pages", "Homepage.js"),
  mentors: path.join(CLEARWEB_ROOT, "pages", "Mentors.js"),
  mentees: path.join(CLEARWEB_ROOT, "pages", "Mentees.js"),
  retired: path.join(CLEARWEB_ROOT, "pages", "RetiredMembers.js"),
  contact: path.join(CLEARWEB_ROOT, "pages", "Contact.js"),
  footer: path.join(CLEARWEB_ROOT, "components", "Footer.js"),
  interest: path.join(BACKUP_ROOT, "client", "src", "interest", "pages", "Redirect.js"),
  event: path.join(CLEARWEB_ROOT, "pages", "event_components", "dec_9_2022.js"),
};

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function stripComments(text) {
  return text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function normalizeWhitespace(value) {
  return value
    .replace(/\\\s*\n\s*/g, " ")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeJsxString(value) {
  return normalizeWhitespace(
    value.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, "\n"),
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function relativeToPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function toWebAssetPath(sourcePath) {
  const relative = relativeToPosix(path.relative(BACKUP_ROOT, sourcePath));
  const clearwebAssetPrefix = "client/src/clearweb/assets/";
  const homeAssetPrefix = "client/src/clearweb/pages/home/assets/";
  const eventAssetPrefix = "client/src/clearweb/pages/event_components/";

  if (relative.startsWith(clearwebAssetPrefix)) {
    return `/assets/images/live-site/clearweb/assets/${relative.slice(clearwebAssetPrefix.length)}`;
  }
  if (relative.startsWith(homeAssetPrefix)) {
    return `/assets/images/live-site/clearweb/home/${relative.slice(homeAssetPrefix.length)}`;
  }
  if (relative.startsWith(eventAssetPrefix)) {
    return `/assets/images/live-site/clearweb/events/${path.basename(relative)}`;
  }
  return null;
}

function parseImports(sourceText, sourceFilePath) {
  const imports = new Map();
  const importRegex = /import\s+([A-Za-z0-9_]+)\s+from\s+["']([^"']+)["'];?/g;

  for (const match of sourceText.matchAll(importRegex)) {
    const [, alias, importPath] = match;
    const absolutePath = path.resolve(path.dirname(sourceFilePath), importPath);
    imports.set(alias, {
      absolutePath,
      webPath: toWebAssetPath(absolutePath),
    });
  }

  return imports;
}

function extractStringProp(block, propName) {
  const doubleQuote = block.match(
    new RegExp(`${propName}\\s*=\\s*"([\\s\\S]*?)"`),
  );
  if (doubleQuote) {
    return decodeJsxString(doubleQuote[1]);
  }

  const singleQuote = block.match(
    new RegExp(`${propName}\\s*=\\s*'([\\s\\S]*?)'`),
  );
  if (singleQuote) {
    return decodeJsxString(singleQuote[1]);
  }

  return null;
}

function extractExpressionProp(block, propName) {
  const match = block.match(
    new RegExp(`${propName}\\s*=\\s*\\{\\s*([^}]+?)\\s*\\}`),
  );
  return match ? match[1].trim() : null;
}

function extractBooleanProp(block, propName, defaultValue = false) {
  const value = extractExpressionProp(block, propName);
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return defaultValue;
}

function extractBioPopupBlocks(sourceText) {
  return stripComments(sourceText).match(/<BioPopup\b[\s\S]*?\/>/g) ?? [];
}

function parseBioPopupBlock(block, importMap) {
  const imageAlias = extractExpressionProp(block, "image");
  const imageImport = imageAlias ? importMap.get(imageAlias) : null;

  return {
    name: extractStringProp(block, "name") || "",
    role: extractStringProp(block, "subheading") || "",
    bio: extractStringProp(block, "body") || "",
    linkedin: extractStringProp(block, "linkedin") || null,
    imageAlias,
    image: imageImport?.webPath || null,
    hasBio: extractBooleanProp(block, "hasBio", true),
    hasLongBio: extractBooleanProp(block, "longBio", false),
  };
}

function extractSection(sourceText, startMarker, endMarker) {
  const startIndex = sourceText.indexOf(startMarker);
  if (startIndex === -1) {
    return "";
  }

  const endIndex = endMarker
    ? sourceText.indexOf(endMarker, startIndex)
    : sourceText.length;

  return sourceText.slice(startIndex, endIndex === -1 ? sourceText.length : endIndex);
}

function cleanArray(items) {
  return items.filter(Boolean);
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function extractLinksFromText(sourceText) {
  const links = [];
  const urlRegex = /https?:\/\/[^\s"'`)>]+/g;
  const internalRouteRegex = /\b(?:href|to)\s*=\s*["'](\/[^"']*)["']/g;

  for (const match of sourceText.matchAll(urlRegex)) {
    links.push(match[0]);
  }

  for (const match of sourceText.matchAll(internalRouteRegex)) {
    links.push(`${LIVE_BASE_URL}${match[1]}`);
  }

  return Array.from(new Set(links)).sort();
}

function markdownLinks(markdown) {
  const links = [];
  const regex = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g;
  for (const match of markdown.matchAll(regex)) {
    links.push(match[1]);
  }
  return links;
}

function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readSourceFile(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function writeJson(relativePath, value) {
  const outputPath = path.join(PROJECT_ROOT, relativePath);
  await fs.writeFile(outputPath, formatJson(value));
}

async function copyRecoveredAssets() {
  const clearwebAssetsSource = path.join(CLEARWEB_ROOT, "assets");
  const homeAssetsSource = path.join(CLEARWEB_ROOT, "pages", "home", "assets");
  const eventAssetsSource = path.join(CLEARWEB_ROOT, "pages", "event_components");

  const clearwebAssetsDest = path.join(LIVE_IMAGE_ROOT, "clearweb", "assets");
  const homeAssetsDest = path.join(LIVE_IMAGE_ROOT, "clearweb", "home");
  const eventAssetsDest = path.join(LIVE_IMAGE_ROOT, "clearweb", "events");

  ensureDir(clearwebAssetsDest);
  ensureDir(homeAssetsDest);
  ensureDir(eventAssetsDest);

  cpSync(clearwebAssetsSource, clearwebAssetsDest, { recursive: true, force: true });
  cpSync(homeAssetsSource, homeAssetsDest, { recursive: true, force: true });

  const eventEntries = await fs.readdir(eventAssetsSource);
  for (const entry of eventEntries) {
    if (!entry.toLowerCase().endsWith(".png")) {
      continue;
    }
    cpSync(
      path.join(eventAssetsSource, entry),
      path.join(eventAssetsDest, entry),
      { force: true },
    );
  }
}

async function downloadFile(url, destinationPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destinationPath, Buffer.from(arrayBuffer));
  return response.headers.get("content-type") || "";
}

function extensionFromContentType(contentType) {
  if (contentType.includes("image/png")) return ".png";
  if (contentType.includes("image/jpeg")) return ".jpg";
  if (contentType.includes("image/webp")) return ".webp";
  if (contentType.includes("image/svg")) return ".svg";
  if (contentType.includes("image/gif")) return ".gif";
  if (contentType.includes("image/x-icon")) return ".ico";
  return "";
}

function extensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    return ext && ext.length <= 5 ? ext.toLowerCase() : "";
  } catch {
    return "";
  }
}

async function downloadSiteIcons() {
  ensureDir(LIVE_ICON_ROOT);

  const iconSpecs = [
    { url: `${LIVE_BASE_URL}/manifest.json`, fileName: "manifest.json" },
    { url: `${LIVE_BASE_URL}/favicon.ico`, fileName: "favicon.ico" },
    { url: `${LIVE_BASE_URL}/cypher_white-min.svg`, fileName: "cypher_white-min.svg" },
    { url: `${LIVE_BASE_URL}/android-chrome-192x192.png`, fileName: "android-chrome-192x192.png" },
    { url: `${LIVE_BASE_URL}/android-chrome-512x512.png`, fileName: "android-chrome-512x512.png" },
  ];

  const downloaded = [];
  for (const spec of iconSpecs) {
    const destination = path.join(LIVE_ICON_ROOT, spec.fileName);
    try {
      await downloadFile(spec.url, destination);
      downloaded.push({
        sourceUrl: spec.url,
        localPath: `/assets/icons/live-site/${spec.fileName}`,
      });
    } catch (error) {
      downloaded.push({
        sourceUrl: spec.url,
        localPath: null,
        error: error.message,
      });
    }
  }

  return downloaded;
}

async function downloadNewsImage(article) {
  if (!article.imageUrl) {
    return { localImage: null, imageDownloadStatus: "missing-image-url" };
  }

  ensureDir(LIVE_NEWS_IMAGE_ROOT);

  const temporaryName = `${article.id}-${slugify(article.title || article.id)}`;
  const temporaryPath = path.join(LIVE_NEWS_IMAGE_ROOT, temporaryName);

  try {
    const response = await fetch(article.imageUrl);
    if (!response.ok) {
      return {
        localImage: null,
        imageDownloadStatus: `http-${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return {
        localImage: null,
        imageDownloadStatus: `skipped-${contentType || "non-image"}`,
      };
    }

    const extension =
      extensionFromUrl(article.imageUrl) ||
      extensionFromContentType(contentType) ||
      ".img";

    const finalFileName = `${temporaryName}${extension}`;
    const finalPath = path.join(LIVE_NEWS_IMAGE_ROOT, finalFileName);
    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(finalPath, Buffer.from(arrayBuffer));

    return {
      localImage: `/assets/images/live-site/news/${finalFileName}`,
      imageDownloadStatus: "downloaded",
    };
  } catch (error) {
    return {
      localImage: null,
      imageDownloadStatus: `error-${error.message}`,
    };
  } finally {
    if (existsSync(temporaryPath)) {
      rmSync(temporaryPath, { force: true });
    }
  }
}

async function fetchNewsArticles() {
  const titlesResponse = await fetch(`${LIVE_BASE_URL}/api/v1/news/titles`);
  if (!titlesResponse.ok) {
    throw new Error(`Failed to fetch news titles: ${titlesResponse.status}`);
  }

  const titles = await titlesResponse.json();
  const articles = [];

  for (const item of titles) {
    const articleResponse = await fetch(`${LIVE_BASE_URL}/api/v1/news/article/${item.id}`);
    if (!articleResponse.ok) {
      articles.push({
        id: item.id,
        title: item.subject,
        date: item.date,
        bodyMarkdown: "",
        imageUrl: item.imageUrl || null,
        localImage: null,
        isClearweb: item.isClearweb ?? true,
        imageDownloadStatus: `article-http-${articleResponse.status}`,
      });
      continue;
    }

    const articleJson = await articleResponse.json();
    const article = {
      id: item.id,
      title: articleJson.subject,
      date: articleJson.date,
      bodyMarkdown: (articleJson.body || "").replace(/\r\n/g, "\n").trim(),
      imageUrl: articleJson.imageUrl || item.imageUrl || null,
      isClearweb: articleJson.isClearweb ?? item.isClearweb ?? true,
      sourceApi: `${LIVE_BASE_URL}/api/v1/news/article/${item.id}`,
      links: markdownLinks(articleJson.body || ""),
    };

    const imageInfo = await downloadNewsImage(article);
    articles.push({
      ...article,
      ...imageInfo,
    });
  }

  return articles.sort((left, right) => {
    return new Date(right.date).getTime() - new Date(left.date).getTime();
  });
}

async function buildMentorsData(mentorsText) {
  const importMap = parseImports(mentorsText, SOURCE_FILES.mentors);
  const mentorsSection = extractSection(
    mentorsText,
    '<div className = "friendspage-headshots-wrapper">',
    '<div className = "friendspage-header">\n                Related <u>Companies</u>',
  );
  const companiesSection = extractSection(
    mentorsText,
    '<div className = "friendspage-header">\n                Related <u>Companies</u>',
    null,
  );

  const mentors = extractBioPopupBlocks(mentorsSection)
    .map((block) => parseBioPopupBlock(block, importMap))
    .filter((item) => item.name);

  const companies = extractBioPopupBlocks(companiesSection)
    .map((block) => ({
      name: extractStringProp(block, "name") || "",
      website: extractStringProp(block, "linkedin") || null,
      image: importMap.get(extractExpressionProp(block, "image"))?.webPath || null,
    }))
    .filter((item) => item.name);

  return { mentors, companies };
}

async function buildTeamData(homepageText, retiredText) {
  const homepageImports = parseImports(homepageText, SOURCE_FILES.homepage);
  const retiredImports = parseImports(retiredText, SOURCE_FILES.retired);

  const teamSectionMatch = stripComments(homepageText).match(
    /<div className="team-card-wrapper">([\s\S]*?)<\/div>\s*<div className="mentors-link">/,
  );
  const teamSection = teamSectionMatch ? teamSectionMatch[1] : "";

  const team = enrichTeamMembers(
    extractBioPopupBlocks(teamSection)
      .map((block) => parseBioPopupBlock(block, homepageImports))
      .filter((item) => item.name),
    "Leadership Team",
  );

  const retiredTeam = enrichTeamMembers(
    extractBioPopupBlocks(retiredText)
      .map((block) => parseBioPopupBlock(block, retiredImports))
      .filter((item) => item.name),
    "Previous Team Member",
  );

  return { team, retiredTeam };
}

function inferTeamRole(member, fallbackRole) {
  if (member.role && member.role.trim()) {
    return member.role.trim();
  }

  const bio = member.bio || "";
  const patterns = [
    [/co-founder and director/i, "Co-Founder & Director"],
    [/program assistant/i, "Program Assistant"],
    [/assistant events coordinator/i, "Assistant Events Coordinator"],
    [/\bevent coordinator\b/i, "Event Coordinator"],
    [/assistant pr coordinator/i, "Assistant PR Coordinator"],
    [/social media designer and pr coordinator/i, "PR Coordinator & Social Media Designer"],
    [/director of public relations/i, "Director of Public Relations"],
    [/\bpr coordinator\b/i, "PR Coordinator"],
    [/\bweb developer(s)?\b/i, "Web Developer"],
  ];

  const match = patterns.find(([pattern]) => pattern.test(bio));
  return match ? match[1] : fallbackRole;
}

function enrichTeamMembers(members, fallbackRole) {
  return members.map((member) => ({
    ...member,
    role: inferTeamRole(member, fallbackRole),
  }));
}

function buildEventsData(eventText) {
  const importMap = parseImports(eventText, SOURCE_FILES.event);
  return [
    {
      slug: "12-9-22",
      route: "/events/12-9-22",
      title: "MCP Event Materials: December 9, 2022",
      assets: [
        {
          label: "MCP program",
          image: importMap.get("program")?.webPath || null,
        },
        {
          label: "MCP seating arrangement",
          image: importMap.get("seating")?.webPath || null,
        },
      ],
    },
  ];
}

function buildSiteData({
  homepageText,
  footerText,
  contactText,
  menteesText,
  routes,
  events,
  downloadedIcons,
}) {
  const missionMatch = homepageText.match(
    /<div className="mission-text">[\s\S]*?<p>([\s\S]*?)<\/p>/,
  );
  const storyMatch = homepageText.match(
    /<div className="story-text">([\s\S]*?)<\/div>/,
  );
  const friendsMatch = homepageText.match(
    /<p>MCP is supported by the ([\s\S]*?)<\/p>/,
  );
  const contactEmailMatch = contactText.match(/mailto:([^"']+)/);

  const homepageLinks = extractLinksFromText(homepageText);
  const footerLinks = extractLinksFromText(footerText);
  const menteeLinks = extractLinksFromText(menteesText);
  const contactEmail = contactEmailMatch ? contactEmailMatch[1] : "mcp.superuser@gmail.com";
  const menteeInterestFormUrl = "https://forms.gle/zkuoy8HGdec81Y5o8";
  const givingUrl = [...homepageLinks, ...footerLinks].find((url) =>
    url.includes("donate.wm.edu"),
  );

  const socialLinks = cleanArray([
    footerText.match(/https:\/\/www\.instagram\.com\/[^\s"'`)<]+/)?.[0],
    footerText.match(/https:\/\/www\.linkedin\.com\/company\/[^\s"'`)<]+/)?.[0],
    footerText.match(/https:\/\/twitter\.com\/[^\s"'`)<]+/)?.[0],
    footerText.match(/https:\/\/youtu\.be\/[^\s"'`)<]+/)?.[0],
  ]);

  return {
    title: "Mentoring for Careers in Physics",
    summary:
      "A one-to-one professional mentorship program for undergraduate students in physics and related STEM pathways at William & Mary.",
    mission: missionMatch ? normalizeWhitespace(missionMatch[1].replace(/<[^>]+>/g, " ")) : "",
    story: storyMatch ? normalizeWhitespace(storyMatch[1].replace(/<[^>]+>/g, " ")) : "",
    supportersText: friendsMatch
      ? normalizeWhitespace(friendsMatch[1].replace(/<[^>]+>/g, " "))
      : "",
    contactEmail,
    interestFormUrl: menteeInterestFormUrl,
    menteeInterestFormUrl,
    mentorInterestFormUrl: `mailto:${contactEmail}?subject=${encodeURIComponent("MCP Mentor Interest")}`,
    givingUrl: givingUrl || "",
    socialLinks,
    publicRoutes: routes.publicRoutes,
    publicPages: routes.publicPages,
    portalRoutes: routes.portalRoutes,
    pageLinks: uniqueBy(
      [
        ...homepageLinks,
        ...footerLinks,
        ...menteeLinks,
        `${LIVE_BASE_URL}/interest`,
      ].map((url) => ({ url })),
      (item) => item.url,
    ).filter((item) => !item.url.startsWith("http://www.w3.org/")),
    events,
    downloadedIcons,
  };
}

function buildRoutesData(appText) {
  const routeMatches = Array.from(
    appText.matchAll(/<Route path="([^"]+)"/g),
    (match) => match[1],
  );

  const publicRoutes = routeMatches.filter((route) => !route.startsWith("/portal"));
  const portalRoutes = routeMatches.filter((route) => route.startsWith("/portal"));

  if (!publicRoutes.includes("/interest")) {
    publicRoutes.push("/interest");
  }

  const publicPages = publicRoutes.flatMap((route) => {
    if (route === "/events/:eventName") {
      return [route, "/events/12-9-22"];
    }
    return [route];
  });

  return {
    publicRoutes: Array.from(new Set(publicRoutes)).sort(),
    publicPages: Array.from(new Set(publicPages)).sort(),
    portalRoutes: Array.from(new Set(portalRoutes)).sort(),
  };
}

function buildLinkInventory({
  mentors,
  companies,
  team,
  retiredTeam,
  news,
  site,
  sourceTexts,
}) {
  const mentorLinks = mentors
    .filter((mentor) => mentor.linkedin)
    .map((mentor) => ({
      label: mentor.name,
      url: mentor.linkedin,
    }));

  const companyLinks = companies
    .filter((company) => company.website)
    .map((company) => ({
      label: company.name,
      url: company.website,
    }));

  const newsLinks = uniqueBy(
    news.flatMap((article) => {
      const links = article.links.map((url) => ({
        label: article.title,
        url,
        source: "news-body",
      }));
      if (article.imageUrl) {
        links.push({
          label: `${article.title} image`,
          url: article.imageUrl,
          source: "news-image",
        });
      }
      return links;
    }),
    (item) => `${item.source}:${item.url}`,
  );

  const rawSourceLinks = uniqueBy(
    Object.entries(sourceTexts).flatMap(([source, text]) =>
      extractLinksFromText(text).map((url) => ({ source, url })),
    ),
    (item) => `${item.source}:${item.url}`,
  );

  return {
    publicRoutes: site.publicRoutes,
    publicPages: site.publicPages,
    portalRoutes: site.portalRoutes,
    socialLinks: site.socialLinks,
    mentorLinkedIn: mentorLinks,
    companyLinks,
    newsLinks,
    currentTeamNames: team.map((member) => member.name),
    retiredTeamNames: retiredTeam.map((member) => member.name),
    discoveredSourceLinks: rawSourceLinks,
  };
}

async function main() {
  ensureDir(DATA_DIR);
  ensureDir(LIVE_IMAGE_ROOT);
  ensureDir(LIVE_ICON_ROOT);
  ensureDir(LIVE_NEWS_IMAGE_ROOT);

  const sourceTexts = {};
  for (const [key, filePath] of Object.entries(SOURCE_FILES)) {
    sourceTexts[key] = await readSourceFile(filePath);
  }

  await copyRecoveredAssets();
  const downloadedIcons = await downloadSiteIcons();

  const routes = buildRoutesData(sourceTexts.app);
  const { mentors, companies } = await buildMentorsData(sourceTexts.mentors);
  const { team, retiredTeam } = await buildTeamData(
    sourceTexts.homepage,
    sourceTexts.retired,
  );
  const events = buildEventsData(sourceTexts.event);
  const news = await fetchNewsArticles();
  const site = buildSiteData({
    homepageText: sourceTexts.homepage,
    footerText: sourceTexts.footer,
    contactText: sourceTexts.contact,
    menteesText: sourceTexts.mentees,
    routes,
    events,
    downloadedIcons,
  });
  const linkInventory = buildLinkInventory({
    mentors,
    companies,
    team,
    retiredTeam,
    news,
    site,
    sourceTexts,
  });

  await writeJson("data/site.json", site);
  await writeJson("data/mentors.json", mentors);
  await writeJson("data/team.json", team);
  await writeJson("data/retired-team.json", retiredTeam);
  await writeJson("data/companies.json", companies);
  await writeJson("data/news.json", news);
  await writeJson("data/events.json", events);
  await writeJson("data/routes.json", routes);
  await writeJson("data/link-inventory.json", linkInventory);

  console.log(
    `Imported ${mentors.length} mentors, ${team.length} current team members, ` +
      `${retiredTeam.length} retired team members, ${companies.length} companies, ` +
      `and ${news.length} news articles.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
