import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const dataDir = join(root, "src", "data");
const publicDir = join(root, "public");

const requiredFiles = [
  "site.json",
  "mentors.json",
  "team.json",
  "retired-team.json",
  "companies.json",
  "news.json",
  "videos.json",
  "events.json",
  "routes.json",
  "link-inventory.json",
];

function readJson(fileName) {
  const path = join(dataDir, fileName);
  if (!existsSync(path)) {
    throw new Error(`Missing data file: ${fileName}`);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${fileName}: ${error.message}`);
  }
}

function assertArray(value, fileName) {
  if (!Array.isArray(value)) {
    throw new Error(`${fileName} must contain a JSON array.`);
  }
}

function requireString(item, key, fileName, label) {
  if (!item[key] || typeof item[key] !== "string") {
    throw new Error(
      `${fileName}: ${label} is missing required string field "${key}".`,
    );
  }
}

function validateLocalAsset(value, context) {
  if (
    !value ||
    /^(https?:)?\/\//i.test(value) ||
    /^(mailto:|tel:|#|data:)/i.test(value)
  ) {
    return;
  }
  const clean = String(value).replace(/^\/+/, "").replace(/^\.\//, "");
  const path = join(publicDir, clean);
  if (!existsSync(path)) {
    throw new Error(`${context} references missing public asset: ${value}`);
  }
}

const parsed = Object.fromEntries(
  requiredFiles.map((fileName) => [fileName, readJson(fileName)]),
);

const site = parsed["site.json"];
for (const key of [
  "title",
  "summary",
  "mission",
  "contactEmail",
  "menteeInterestFormUrl",
  "mentorInterestFormUrl",
  "givingUrl",
]) {
  requireString(site, key, "site.json", "site");
}
if (!Array.isArray(site.supporters) || !site.supporters.length) {
  throw new Error("site.json must include at least one supporter.");
}
site.supporters.forEach((supporter) => {
  requireString(supporter, "name", "site.json", "supporter");
  validateLocalAsset(supporter.image, `site supporter ${supporter.name}`);
});

for (const fileName of [
  "mentors.json",
  "team.json",
  "retired-team.json",
  "companies.json",
  "news.json",
  "videos.json",
  "events.json",
]) {
  assertArray(parsed[fileName], fileName);
}

parsed["mentors.json"].forEach((mentor) => {
  requireString(mentor, "name", "mentors.json", "mentor");
  requireString(mentor, "role", "mentors.json", mentor.name);
  validateLocalAsset(mentor.image, `mentor ${mentor.name}`);
});

parsed["team.json"].concat(parsed["retired-team.json"]).forEach((person) => {
  requireString(person, "name", "team data", "team member");
  requireString(person, "role", "team data", person.name);
  validateLocalAsset(person.image, `team member ${person.name}`);
});

parsed["companies.json"].forEach((company) => {
  requireString(company, "name", "companies.json", "company");
  validateLocalAsset(company.image, `company ${company.name}`);
});

parsed["news.json"].forEach((item) => {
  requireString(item, "id", "news.json", "news item");
  requireString(item, "title", "news.json", item.id);
  requireString(item, "date", "news.json", item.title);
  validateLocalAsset(
    item.localImage || item.imageUrl,
    `news item ${item.title}`,
  );
});

parsed["videos.json"].forEach((video) => {
  requireString(video, "id", "videos.json", "video");
  requireString(video, "title", "videos.json", video.id);
  requireString(video, "embedUrl", "videos.json", video.title);
  validateLocalAsset(video.thumbnail, `video ${video.title}`);
});

parsed["events.json"].forEach((event) => {
  requireString(event, "title", "events.json", "event");
  (event.assets || []).forEach((asset) =>
    validateLocalAsset(asset.image, `event ${event.title}`),
  );
});

console.log("Data validation passed.");
