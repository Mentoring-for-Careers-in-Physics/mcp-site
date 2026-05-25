const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
export const BASE = base;

export const BLANK_PROFILE = `${base}assets/images/live-site/clearweb/assets/blank-profile.jpeg`;
export const SUPPORTERS_BANNER = `${base}assets/images/live-site/clearweb/assets/So1918_banner.png`;
export const DEFAULT_OG_IMAGE = `${base}assets/images/live-site/clearweb/assets/annual_celebration.png`;

export const NAV_LINKS = [
  { label: "Home", href: base, key: "home" },
  { label: "Mentors", href: `${base}mentors/`, key: "mentors" },
  { label: "Industry", href: `${base}industry/`, key: "industry" },
  { label: "Leadership", href: `${base}team/`, key: "team" },
  { label: "News", href: `${base}news/`, key: "news" },
  { label: "Videos", href: `${base}videos/`, key: "videos" },
  { label: "Friends", href: `${base}#friends`, key: "friends" },
  { label: "Contact", href: `${base}contact/`, key: "contact" },
];

export const SECTOR_OVERRIDES = {
  Arcfield: "Industry",
  "Athena Theatrical": "Industry",
  "BAE Systems": "Industry",
  Calspan: "Industry",
  "Capital One": "Industry",
  "Case Western University": "Academia",
  "Christopher Newport University": "Academia",
  "Department of Defense": "Government",
  "Fannie Mae": "Industry",
  Honeywell: "Industry",
  "Independent AI/ML-at-Scale Expert": "Independent",
  "Institute for Defense Analyses": "Government",
  "ivWatch LLC": "Industry",
  "Jefferson Lab": "National Lab",
  "KLA Corporation": "Industry",
  "Klaco Ventures": "Independent",
  "Luna Innovations": "Industry",
  "Micron Technology": "Industry",
  Microsoft: "Industry",
  MITRE: "Government",
  NASA: "Government",
  "NASA Langley Research Center": "Government",
  "ProCure Treatment Centers": "Industry",
  "Psionic Technologies": "Industry",
  "Sandia National Laboratories": "National Lab",
  "Savannah River National Laboratory": "National Lab",
  "Self-Employed": "Independent",
  "U.S. Army Research Laboratory": "National Lab",
  "U.S. Naval Research Laboratory": "National Lab",
  "Varda Space Industries": "Industry",
  "Whisker Labs": "Industry",
};

export function assetPath(value = "") {
  if (!value) return "";
  if (
    /^(https?:)?\/\//i.test(value) ||
    /^(mailto:|tel:|#|data:)/i.test(value) ||
    value.startsWith("/")
  ) {
    return value;
  }
  const normalizedPath = String(value).replace(/^\.\//, "");
  return `${base}${normalizedPath}`;
}

export function buildExternalLinks(site = {}) {
  return {
    mentee:
      site.menteeInterestFormUrl ||
      site.interestFormUrl ||
      "https://forms.gle/zkuoy8HGdec81Y5o8",
    mentor:
      site.mentorInterestFormUrl ||
      "mailto:rxyan2@wm.edu?subject=MCP%20Mentor%20Inquiry",
    director:
      site.directorMailtoUrl ||
      "mailto:rxyan2@wm.edu?subject=MCP%20Director%20Inquiry",
    giving:
      site.givingUrl ||
      "https://give.wm.edu/?a=38ff2762-682c-497f-b540-f77eebc77831&d=5519",
    email: site.contactEmail || "mcp.superuser@gmail.com",
    socialLinks: site.socialLinks || [],
  };
}

export function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function monogram(value = "") {
  const ignored = new Set([
    "and",
    "at",
    "for",
    "in",
    "of",
    "the",
    "to",
    "llc",
    "inc",
    "corp",
    "corporation",
    "national",
    "research",
    "center",
  ]);
  const parts = String(value)
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
  const significant = parts.filter((part) => !ignored.has(part.toLowerCase()));
  return (significant.length ? significant : parts)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function normalizeOrgName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function formatDate(dateString = "") {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function stripMarkdown(markdown = "") {
  return String(markdown)
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/---+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function markdownParagraphs(markdown = "") {
  return String(markdown)
    .split(/\n{2,}/)
    .map((block) => stripMarkdown(block))
    .filter(Boolean)
    .filter((block) => !/^by\s+/i.test(block));
}

export function excerpt(text = "", maxLength = 180) {
  const plain = stripMarkdown(text);
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, Math.max(maxLength - 1, 0)).trimEnd()}...`;
}

export function websiteHost(value = "") {
  if (!value) return "";
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return String(value)
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  }
}

export function socialPlatform(url = "") {
  const value = String(url).toLowerCase();
  if (value.includes("instagram.com")) return "Instagram";
  if (value.includes("linkedin.com")) return "LinkedIn";
  if (value.includes("twitter.com") || value.includes("x.com")) return "X";
  if (value.includes("youtu")) return "YouTube";
  return websiteHost(url) || "Website";
}

export function companySector(name = "") {
  if (SECTOR_OVERRIDES[name]) return SECTOR_OVERRIDES[name];
  if (
    /(national lab|laborator|jefferson lab|research center|research laboratory)/i.test(
      name,
    )
  )
    return "National Lab";
  if (/(department|nasa|defense|naval|army|mitre)/i.test(name))
    return "Government";
  if (/(university|college)/i.test(name)) return "Academia";
  return "Industry";
}

export function companySummary(company = {}) {
  if (company.description) return company.description;
  if (company.sector === "Government")
    return "Public-sector science, engineering, and mission-driven technical work.";
  if (company.sector === "National Lab")
    return "Research and technical work connected to advanced science and laboratory systems.";
  if (company.sector === "Academia")
    return "Higher education, research, and student-centered science and engineering work.";
  if (company.sector === "Independent")
    return "Independent technical, entrepreneurial, and advisory work connected to STEM careers.";
  return "Industry work spanning engineering, technology, and applied problem-solving.";
}

export function buildCompanies(companies = [], mentors = []) {
  return companies
    .map((company) => {
      const organizationKeys = new Set(
        [company.name, ...(company.aliases || [])].map(normalizeOrgName),
      );
      const matchedMentors = mentors
        .filter((mentor) =>
          (mentor.organizations || []).some((organization) =>
            organizationKeys.has(normalizeOrgName(organization)),
          ),
        )
        .map((mentor) => mentor.name)
        .sort((left, right) => left.localeCompare(right));

      const sector = companySector(company.name);
      return {
        ...company,
        image: assetPath(company.image),
        sector,
        summary: companySummary({ ...company, sector }),
        websiteHost: websiteHost(company.website),
        mentors: [...new Set(matchedMentors)],
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function buildMentors(mentors = [], companies = []) {
  const companyMap = new Map();
  companies.forEach((company) => {
    [company.name, ...(company.aliases || [])].forEach((name) =>
      companyMap.set(normalizeOrgName(name), company),
    );
  });

  return mentors
    .map((mentor) => {
      const organizations = mentor.organizations?.length
        ? [...new Set(mentor.organizations.filter(Boolean))]
        : organizationFromRole(mentor.role);
      const linkedCompanies = organizations
        .map((name) => companyMap.get(normalizeOrgName(name)))
        .filter(Boolean);
      const sectors = [
        ...new Set(
          (linkedCompanies.length
            ? linkedCompanies
            : organizations.map((name) => ({ name }))
          ).map((item) => companySector(item.name)),
        ),
      ];
      const sectorLabel =
        sectors.length > 1 ? "Cross-sector" : sectors[0] || "Mentor";
      return {
        ...mentor,
        image: assetPath(mentor.image || BLANK_PROFILE),
        title: mentor.title || roleTitle(mentor.role),
        organizations,
        linkedCompanies: linkedCompanies.map((company) => ({
          ...company,
          image: assetPath(company.image),
          sector: companySector(company.name),
        })),
        sectors,
        sectorLabel,
        organizationLabel: organizations.slice(0, 2).join(", "),
        excerpt: excerpt(mentor.bio || "", 170),
        searchText: [
          mentor.name,
          mentor.role,
          mentor.title,
          organizations.join(" "),
          mentor.bio,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        id: `mentor-${slugify(mentor.name)}`,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function buildTeamDirectory(team = [], retired = []) {
  const current = team
    .filter((person) => person.group !== "advisor")
    .map(normalizePerson)
    .sort((left, right) => {
      if (left.name === "Ran Yang") return -1;
      if (right.name === "Ran Yang") return 1;
      return left.name.localeCompare(right.name);
    });
  const advisors = team
    .filter((person) => person.group === "advisor")
    .map(normalizePerson)
    .sort((left, right) => left.name.localeCompare(right.name));
  const archive = retired
    .map((person) => normalizePerson({ ...person, group: "archive" }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return { current, advisors, archive };
}

export function buildNewsFeed(items = []) {
  return [...items]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .map((item) => ({
      ...item,
      image: assetPath(item.localImage || item.imageUrl),
      formattedDate: formatDate(item.date),
      year: new Date(item.date).getFullYear(),
      paragraphs: markdownParagraphs(item.bodyMarkdown),
      summary: excerpt(item.bodyMarkdown, 180),
      resourceLinks: articleResourceLinks(item),
      id: item.id || slugify(item.title),
    }));
}

export function buildVideos(videos = []) {
  return [...videos]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .map((video) => ({
      ...video,
      thumbnail: assetPath(video.thumbnail),
      dateLabel: video.displayDate || formatDate(video.date),
      relatedHref: video.relatedPage
        ? `${base}${video.relatedPage.replace(/^pages\//, "").replace(/\.html/, "/")}`
        : "",
    }));
}

export function normalizeEventArchive(events = []) {
  return events.map((event) => ({
    ...event,
    assets: (event.assets || []).map((asset) => ({
      ...asset,
      image: assetPath(asset.image),
    })),
  }));
}

function normalizePerson(person = {}) {
  return {
    ...person,
    image: assetPath(person.image || BLANK_PROFILE),
    excerpt: excerpt(person.bio || "", 160),
    id: `person-${slugify(person.name)}`,
  };
}

function roleTitle(role = "") {
  return String(role).split(",")[0]?.trim() || "Mentor";
}

function organizationFromRole(role = "") {
  const parts = String(role)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 ? [parts.slice(1).join(", ")] : [];
}

function articleResourceLinks(article = {}) {
  if (Array.isArray(article.resourceLinks) && article.resourceLinks.length) {
    return article.resourceLinks
      .filter((item) => item?.url)
      .map((item) => ({
        label: item.label || socialPlatform(item.url),
        url: item.url,
      }));
  }
  return (article.links || []).map((url) => ({
    label: socialPlatform(url),
    url,
  }));
}
