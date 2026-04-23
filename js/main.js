const BLANK_PROFILE = "assets/images/live-site/clearweb/assets/blank-profile.jpeg";
const SUPPORTERS_BANNER = "assets/images/live-site/clearweb/assets/So1918_banner.png";
const PAGE = document.body.dataset.page || "home";
const ROOT = document.body.dataset.root || ".";

let revealObserver = null;
let activeModal = null;
let companyDirectory = new Map();

function rootPath(relativePath) {
  const cleanPath = String(relativePath || "")
    .replace(/^\/+/, "")
    .replace(/^\.\//, "");
  return `${ROOT}/${cleanPath}`;
}

function assetPath(value = "") {
  if (!value) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(value) || /^(mailto:|tel:|#|data:)/i.test(value)) {
    return value;
  }

  return rootPath(value);
}

async function loadJson(fileName) {
  const response = await fetch(rootPath(`data/${fileName}`));
  if (!response.ok) {
    throw new Error(`Could not load ${fileName}`);
  }
  return response.json();
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shuffleList(items = []) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function monogram(value = "") {
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
  const source = significant.length ? significant : parts;

  return source
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function stripMarkdown(markdown = "") {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(text = "", maxLength = 180) {
  const plain = stripMarkdown(text);
  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, maxLength).trim()}…`;
}

function organizationLabel(role = "", fallback = "Mentor") {
  const parts = String(role)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts.slice(1).join(", ");
  }

  return role || fallback;
}

function companyCategory(company = {}) {
  const name = String(company.name || "");

  if (/(national lab|laborator|jefferson lab|research center|research laboratory)/i.test(name)) {
    return "Research";
  }

  if (/(department|nasa|defense|naval|army|mitre)/i.test(name)) {
    return "Government";
  }

  if (/(university|college)/i.test(name)) {
    return "Academia";
  }

  return "Industry";
}

function companySummary(company = {}) {
  const description = String(company.description || "").trim();
  if (description) {
    return description;
  }

  const category = companyCategory(company);
  if (category === "Research") {
    return "Research and technical work connected to advanced science and laboratory systems.";
  }
  if (category === "Government") {
    return "Public-sector science, engineering, and mission-driven technical work.";
  }
  if (category === "Academia") {
    return "Higher education, research, and student-centered science and engineering work.";
  }

  return "Industry work spanning engineering, technology, and applied problem-solving.";
}

function setCompanyDirectory(companies = []) {
  companyDirectory = new Map();

  companies.forEach((company) => {
    [company.name, ...(company.aliases || [])]
      .filter(Boolean)
      .forEach((value) => {
        companyDirectory.set(String(value).toLowerCase(), company);
      });
  });
}

function getCompanyRecord(name = "") {
  return companyDirectory.get(String(name).toLowerCase()) || null;
}

function getPersonTitle(person, fallback = "Mentor") {
  return person?.title || person?.role || fallback;
}

function getPersonOrganizations(person) {
  if (Array.isArray(person?.organizations) && person.organizations.length) {
    return [...new Set(person.organizations.filter(Boolean))];
  }

  const fallback = organizationLabel(person?.role || "");
  return fallback ? [fallback] : [];
}

function sortByDateDesc(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.date).getTime();
    const rightTime = new Date(right.date).getTime();
    return rightTime - leftTime;
  });
}

function getProfileImage(item) {
  if (!item?.image) {
    return assetPath(BLANK_PROFILE);
  }
  return assetPath(item.image);
}

function socialPlatform(url = "") {
  const value = String(url).toLowerCase();
  if (value.includes("instagram.com")) return "instagram";
  if (value.includes("linkedin.com")) return "linkedin";
  if (value.includes("twitter.com") || value.includes("x.com")) return "x";
  if (value.includes("youtu")) return "youtube";
  return "website";
}

function classifySocialLink(url = "") {
  const platform = socialPlatform(url);
  if (platform === "instagram") return "Instagram";
  if (platform === "linkedin") return "LinkedIn";
  if (platform === "x") return "X";
  if (platform === "youtube") return "YouTube";
  return "Website";
}

function socialIconMarkup(platform = "website") {
  switch (platform) {
    case "instagram":
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.25" stroke="currentColor" stroke-width="1.9"/>
          <circle cx="12" cy="12" r="4.15" stroke="currentColor" stroke-width="1.9"/>
          <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor"/>
        </svg>
      `;
    case "linkedin":
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="3.25" stroke="currentColor" stroke-width="1.9"/>
          <rect x="7.1" y="10.15" width="2.55" height="6.75" rx="1.1" fill="currentColor"/>
          <circle cx="8.38" cy="7.8" r="1.35" fill="currentColor"/>
          <path d="M12.2 16.9v-6.75h2.45v1.05c.54-.77 1.4-1.23 2.58-1.23 2.02 0 3.17 1.26 3.17 3.76v3.17h-2.55v-2.88c0-1.18-.43-1.82-1.42-1.82-1.05 0-1.68.74-1.68 2.02v2.68H12.2Z" fill="currentColor"/>
        </svg>
      `;
    case "x":
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 4.5h3.7l4.1 5.5 4.5-5.5H19l-5.3 6.45L19.5 19h-3.7l-4.4-5.9L6.35 19H5l5.73-6.98L5 4.5Z" fill="currentColor"/>
        </svg>
      `;
    case "youtube":
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 12c0 2.72-.3 4.45-.75 5.2-.22.37-.53.66-.91.83-.94.42-3.75.72-7.34.72s-6.4-.3-7.34-.72a2.07 2.07 0 0 1-.91-.83C3.3 16.45 3 14.72 3 12s.3-4.45.75-5.2c.22-.37.53-.66.91-.83.94-.42 3.75-.72 7.34-.72s6.4.3 7.34.72c.38.17.69.46.91.83.45.75.75 2.48.75 5.2Z" stroke="currentColor" stroke-width="1.7"/>
          <path d="M10.25 8.85 15.75 12l-5.5 3.15v-6.3Z" fill="currentColor"/>
        </svg>
      `;
    default:
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8.75" stroke="currentColor" stroke-width="1.7"/>
          <path d="M3.8 12h16.4M12 3.25c2.3 2.4 3.45 5.32 3.45 8.75S14.3 18.35 12 20.75c-2.3-2.4-3.45-5.32-3.45-8.75S9.7 5.65 12 3.25Z" stroke="currentColor" stroke-width="1.7"/>
        </svg>
      `;
  }
}

function buildSocialLink(url, options = {}) {
  const platform = socialPlatform(url);
  const label = classifySocialLink(url);
  const baseClass = options.className || "social-pill";
  const classes = [baseClass, "social-link", `social-link--${platform}`].filter(Boolean).join(" ");
  const labelHtml = options.labelVisible ? `<span class="social-link__label">${label}</span>` : "";

  return `
    <a class="${classes}" href="${escapeHtml(url)}" target="_blank" rel="noreferrer" aria-label="${label}" title="${label}">
      <span class="social-link__icon" aria-hidden="true">${socialIconMarkup(platform)}</span>
      ${labelHtml}
    </a>
  `;
}

function buildSocialLinks(urls = [], options = {}) {
  return urls.map((url) => buildSocialLink(url, options)).join("");
}

function linkMap(site) {
  const pageLinks = site.pageLinks || [];
  const donateLink =
    site.givingUrl ||
    pageLinks.find((item) => item.url.includes("donate.wm.edu"))?.url ||
    "#";
  const givePageLink = site.givingPagePath ? rootPath(site.givingPagePath) : "#";

  return {
    donateLink,
    givePageLink,
    givingFundCode: site.givingFundCode || "",
    interestLink: site.interestFormUrl || "#",
    menteeLink: site.menteeInterestFormUrl || site.interestFormUrl || "#",
    mentorLink: site.mentorInterestFormUrl || "",
    directorLink: site.directorMailtoUrl || site.mentorInterestFormUrl || "",
    contactEmail: site.contactEmail || "mcp.superuser@gmail.com",
  };
}

function applyExternalAction(node, url) {
  if (!node) {
    return;
  }

  if (!url) {
    node.setAttribute("href", "#");
    node.setAttribute("aria-disabled", "true");
    node.setAttribute("title", "Link coming soon");
    node.setAttribute("tabindex", "-1");
    node.classList.add("is-placeholder");
    return;
  }

  node.setAttribute("href", url);
  if (/^(mailto:|tel:)/i.test(url) || /^(\/|\.\/|\.\.\/)/.test(url)) {
    node.removeAttribute("target");
    node.removeAttribute("rel");
  } else {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noreferrer");
  }
  node.classList.remove("is-placeholder");
  node.removeAttribute("aria-disabled");
  node.removeAttribute("title");
  node.removeAttribute("tabindex");
}

function populateGlobalContent(site) {
  const links = linkMap(site);
  const footerSocialHtml = buildSocialLinks(site.socialLinks || []);

  document.querySelectorAll("[data-contact-email]").forEach((node) => {
    node.textContent = links.contactEmail;
    node.setAttribute("href", `mailto:${links.contactEmail}`);
  });

  document.querySelectorAll("[data-interest-link]").forEach((node) => {
    applyExternalAction(node, links.interestLink);
  });

  document.querySelectorAll("[data-mentee-link]").forEach((node) => {
    applyExternalAction(node, links.menteeLink);
  });

  document.querySelectorAll("[data-mentor-link]").forEach((node) => {
    applyExternalAction(node, links.mentorLink);
  });

  document.querySelectorAll("[data-director-link]").forEach((node) => {
    applyExternalAction(node, links.directorLink);
  });

  document.querySelectorAll("[data-donate-link]").forEach((node) => {
    applyExternalAction(node, links.donateLink);
  });

  document.querySelectorAll("[data-give-page-link]").forEach((node) => {
    applyExternalAction(node, links.givePageLink);
  });

  document.querySelectorAll("[data-giving-portal-link]").forEach((node) => {
    applyExternalAction(node, links.donateLink);
  });

  document.querySelectorAll("[data-giving-fund-code]").forEach((node) => {
    node.textContent = links.givingFundCode;
  });

  document.querySelectorAll("[data-footer-social]").forEach((node) => {
    node.innerHTML = footerSocialHtml;
  });

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = new Date().getFullYear().toString();
  });

  const missionNode = document.querySelector("[data-site-mission]");
  if (missionNode && site.mission) {
    missionNode.textContent = site.mission;
  }

  const storyNode = document.querySelector("[data-site-story]");
  if (storyNode && site.story) {
    storyNode.textContent = site.story;
  }

  const summaryNode = document.querySelector("[data-site-summary]");
  if (summaryNode && site.summary) {
    summaryNode.textContent = site.summary;
  }

  document.querySelectorAll("[data-supporters-banner-image]").forEach((node) => {
    node.setAttribute("src", assetPath(SUPPORTERS_BANNER));
  });
}

function setNavState() {
  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.navPage === PAGE);
  });
}

function wireNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const header = document.querySelector(".site-header");

  if (!toggle || !header) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function refreshReveals() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll("[data-reveal]").forEach((node) => {
      node.classList.add("is-visible");
    });
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16 },
    );
  }

  document.querySelectorAll("[data-reveal]").forEach((node, index) => {
    node.style.setProperty("--reveal-delay", `${Math.min(index * 45, 280)}ms`);
    revealObserver.observe(node);
  });
}

function openModal(html) {
  const modal = document.querySelector("[data-modal]");
  const content = document.querySelector("[data-modal-content]");
  if (!modal || !content) {
    return;
  }

  activeModal = modal;
  content.innerHTML = html;
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeModal() {
  if (!activeModal) {
    return;
  }

  activeModal.hidden = true;
  document.body.classList.remove("modal-open");
  activeModal = null;
}

function wireModal() {
  const modal = document.querySelector("[data-modal]");
  if (!modal) {
    return;
  }

  modal.querySelectorAll("[data-close-modal]").forEach((node) => {
    node.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

function renderCompanyCard(company, options = {}) {
  const image = company.image ? assetPath(company.image) : "";
  const name = escapeHtml(company.name || "Organization");
  const website = company.website || "";
  const compactClass = options.compact ? " logo-card--compact" : "";
  const label = options.compact ? "" : `<span>${name}</span>`;
  const inner = image
    ? `<img src="${image}" alt="${name} logo" loading="lazy" />`
    : `<span class="logo-card__monogram" aria-hidden="true">${escapeHtml(monogram(company.name || "MCP"))}</span>`;
  const tagName = website ? "a" : "article";
  const attrs = website
    ? `href="${website}" target="_blank" rel="noreferrer" aria-label="${name}"`
    : `aria-label="${name}"`;

  return `
    <${tagName}
      class="logo-card${compactClass}"
      ${attrs}
      data-reveal
    >
      ${inner}
      ${label}
    </${tagName}>
  `;
}

function renderLogoWall(containerSelector, companies = [], options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }

  container.innerHTML = companies
    .map((company) => renderCompanyCard(company, options))
    .join("");
}

function renderSupporterCard(supporter = {}) {
  const name = escapeHtml(supporter.name || "Supporter");
  const subtitle = escapeHtml(supporter.subtitle || "MCP supporter");
  const description = escapeHtml(supporter.description || "Supporting MCP at William & Mary.");
  const website = supporter.website || "";
  const image = supporter.image ? assetPath(supporter.image) : "";
  const mediaStyle = supporter.mediaBackground
    ? ` style="background:${escapeHtml(supporter.mediaBackground)}"`
    : "";
  const media = image
    ? `<img src="${image}" alt="${name} logo" loading="lazy" />`
    : `<span class="supporter-card__monogram" aria-hidden="true">${escapeHtml(monogram(supporter.name || "MCP"))}</span>`;
  const tagName = website ? "a" : "article";
  const attrs = website
    ? `href="${website}" target="_blank" rel="noreferrer" aria-label="${name}"`
    : `aria-label="${name}"`;

  return `
    <${tagName} class="supporter-card" ${attrs} data-reveal>
      <div class="supporter-card__media"${mediaStyle}>${media}</div>
      <div class="supporter-card__body">
        <span class="profile-card__meta">${subtitle}</span>
        <h3 class="profile-card__title">${name}</h3>
        <p class="profile-card__excerpt">${description}</p>
        ${website ? `<span class="profile-hint">Visit website →</span>` : ""}
      </div>
    </${tagName}>
  `;
}

function renderSupporterGrid(containerSelector, supporters = []) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }

  container.innerHTML = supporters.length
    ? supporters.map((supporter) => renderSupporterCard(supporter)).join("")
    : `<div class="empty-state">Supporters will appear here soon.</div>`;
}

function renderSupportStoryCard(article) {
  if (!article) {
    return `<div class="empty-state">Featured story coming soon.</div>`;
  }

  const title = escapeHtml(article.title || "Featured story");
  const image = assetPath(article.localImage || article.imageUrl || BLANK_PROFILE);
  const imageAlt = escapeHtml(article.imageAlt || article.title || "Featured story");
  const summary = escapeHtml(excerpt(article.bodyMarkdown || "", 280));
  const externalUrl =
    article.primaryExternalUrl ||
    (Array.isArray(article.resourceLinks) && article.resourceLinks[0]?.url) ||
    (Array.isArray(article.links) && article.links.find((link) => /cdsp\.wm\.edu/i.test(link))) ||
    "";

  return `
    <article class="support-story-card" data-reveal>
      <div class="support-story-card__media">
        <img src="${image}" alt="${imageAlt}" loading="lazy" />
      </div>
      <div class="support-story-card__body">
        <span class="kicker">In The News</span>
        <h3 class="support-story-card__title">${title}</h3>
        <p class="support-story-card__text">${summary}</p>
        <div class="support-story-card__actions">
          ${
            externalUrl
              ? `<a class="button button-primary" href="${externalUrl}" target="_blank" rel="noreferrer">Read this news</a>`
              : ""
          }
          <a class="button button-ghost" href="${rootPath(`pages/news.html#${article.id}`)}">See MCP news</a>
        </div>
      </div>
    </article>
  `;
}

function renderCompanyShowcaseCard(company = {}) {
  const category = escapeHtml(companyCategory(company));
  const name = escapeHtml(company.name || "Partner organization");
  const website = company.website || "";
  const image = company.image ? assetPath(company.image) : "";
  const media = image
    ? `<div class="company-logo-wrap"><img src="${image}" alt="${name} logo" loading="lazy" /></div>`
    : `<div class="company-monogram" aria-hidden="true">${escapeHtml(monogram(company.name || "MCP"))}</div>`;
  const action = website
    ? `<a class="button button-ghost" href="${website}" target="_blank" rel="noreferrer">Visit website</a>`
    : `<span class="chip chip--soft">Website coming soon</span>`;

  return `
    <article class="company-card" data-reveal>
      <div>
        <div class="company-sector">${category}</div>
        <div style="margin-top:1rem">${media}</div>
      </div>
      <div>
        <h3 class="company-name">${name}</h3>
        <p class="company-desc">${escapeHtml(companySummary(company))}</p>
      </div>
      <div class="profile-card__actions">
        ${action}
      </div>
    </article>
  `;
}

function renderCompanyShowcaseGrid(containerSelector, companies = []) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }

  container.innerHTML = companies.length
    ? companies.map((company) => renderCompanyShowcaseCard(company)).join("")
    : `<div class="empty-state">Partner organizations will appear here soon.</div>`;
}

function renderSocialAction(url) {
  return buildSocialLink(url);
}

function renderOrganizationPills(organizations = []) {
  return organizations
    .map((organization) => {
      const company = getCompanyRecord(organization) || {};
      const name = escapeHtml(company.name || organization);
      const website = company.website || "";
      const image = company.image ? assetPath(company.image) : "";
      const media = image
        ? `<img src="${image}" alt="" loading="lazy" />`
        : `<span class="organization-pill__monogram" aria-hidden="true">${escapeHtml(monogram(company.name || organization))}</span>`;
      const tagName = website ? "a" : "span";
      const attrs = website
        ? `href="${website}" target="_blank" rel="noreferrer"`
        : "";

      return `
        <${tagName} class="organization-pill" ${attrs}>
          ${media}
          <span>${name}</span>
        </${tagName}>
      `;
    })
    .join("");
}

function renderPersonCard(person, options = {}) {
  const id = options.id || `${options.prefix || "card"}-${slugify(person.name)}`;
  const image = getProfileImage(person);
  const name = escapeHtml(person.name || "MCP profile");
  const title = escapeHtml(getPersonTitle(person, options.defaultRole || "Mentor"));
  const organizations = getPersonOrganizations(person);
  const bio = escapeHtml(excerpt(person.bio || "", options.excerptLength || 200));
  const chips = [
    options.categoryLabel ? `<span class="chip">${escapeHtml(options.categoryLabel)}</span>` : "",
    person.hasLongBio ? `<span class="chip chip--soft">Full biography</span>` : "",
    person.linkedin ? `<span class="chip chip--soft">LinkedIn</span>` : "",
  ]
    .filter(Boolean)
    .join("");

  const primaryLink =
    options.mode === "link"
      ? `
        <a class="button button-ghost" href="${options.primaryHref || "#"}">
          ${escapeHtml(options.primaryLabel || "Learn more")}
        </a>
      `
      : `
        <button
          class="button button-ghost"
          type="button"
          data-open-person="${id}"
        >
          ${escapeHtml(options.primaryLabel || "Read bio")}
        </button>
      `;

  const secondaryLink = person.linkedin
    ? `
      <a
        class="text-link"
        href="${person.linkedin}"
        target="_blank"
        rel="noreferrer"
      >
        LinkedIn
      </a>
    `
    : "";

  return `
    <article class="profile-card" id="${id}" data-reveal>
      <div class="profile-card__media">
        <img src="${image}" alt="${name}" loading="lazy" />
      </div>
      <div class="profile-card__body">
        <span class="profile-card__meta">${escapeHtml(options.metaLabel || "Profile")}</span>
        <h3 class="profile-card__title">${name}</h3>
        <p class="profile-card__role">${title}</p>
        ${organizations.length ? `<div class="organization-pill-row">${renderOrganizationPills(organizations)}</div>` : ""}
        <div class="chip-row">${chips}</div>
        <p class="profile-card__excerpt">${bio || "Bio coming soon."}</p>
        <div class="profile-card__actions">
          ${primaryLink}
          ${secondaryLink}
        </div>
      </div>
    </article>
  `;
}

function renderCompactTeamCard(person) {
  const image = getProfileImage(person);
  const name = escapeHtml(person.name || "Team member");
  const role = escapeHtml(person.role || "Leadership Team");
  const bio = escapeHtml(excerpt(person.bio || "", 120));
  const metaLabel = person.group === "advisor" ? "Advisor" : "Leadership";

  return `
    <article class="profile-card" data-reveal>
      <div class="profile-card__media">
        <img src="${image}" alt="${name}" loading="lazy" />
      </div>
      <div class="profile-card__body">
        <span class="profile-card__meta">${metaLabel}</span>
        <h3 class="profile-card__title">${name}</h3>
        <p class="profile-card__role">${role}</p>
        <p class="profile-card__excerpt">${bio || "Leadership profile."}</p>
      </div>
    </article>
  `;
}

function renderNewsCard(article, options = {}) {
  const image = assetPath(article.localImage || article.imageUrl || BLANK_PROFILE);
  const title = escapeHtml(article.title || "MCP update");
  const summary = escapeHtml(excerpt(article.bodyMarkdown || "", options.excerptLength || 190));
  const articleId = article.id || slugify(article.title || "article");
  const mediaBackground = escapeHtml(article.imageBackground || "var(--blush)");
  const imageStyle =
    article.imageFit === "contain"
      ? `style="object-fit:contain;padding:0.85rem;background:${mediaBackground};"`
      : "";
  const action =
    options.mode === "link"
      ? `
        <a class="button button-ghost" href="${options.hrefBuilder(article)}">
          ${escapeHtml(options.primaryLabel || "Read more")}
        </a>
      `
      : `
        <button
          class="button button-ghost"
          type="button"
          data-open-article="${articleId}"
        >
          ${escapeHtml(options.primaryLabel || "Read article")}
        </button>
      `;

  return `
    <article class="news-card" id="article-${articleId}" data-reveal>
      <div class="news-card__media">
        <img src="${image}" alt="${title}" loading="lazy" ${imageStyle} />
      </div>
      <div class="news-card__body">
        <span class="news-card__eyebrow">${formatDate(article.date)}</span>
        <h3 class="news-card__title">${title}</h3>
        <p class="news-card__summary">${summary}</p>
        <div class="news-card__footer">
          ${action}
        </div>
      </div>
    </article>
  `;
}

function renderFeaturedNews(article, options = {}) {
  if (!article) {
    return `<div class="empty-state">No public news has been imported yet.</div>`;
  }

  const image = assetPath(article.localImage || article.imageUrl || BLANK_PROFILE);
  const title = escapeHtml(article.title || "Featured story");
  const summary = escapeHtml(excerpt(article.bodyMarkdown || "", 460));
  const mediaBackground = escapeHtml(article.imageBackground || "var(--blush)");
  const featuredClass =
    article.imageFit === "contain"
      ? "featured-article featured-article--poster"
      : "featured-article";
  const mediaHtml =
    article.imageFit === "contain"
      ? `
        <div class="featured-article__media">
          <div class="featured-article__poster-card" style="background:${mediaBackground};">
            <img src="${image}" alt="${title}" loading="lazy" />
          </div>
        </div>
      `
      : `
        <div class="featured-article__media">
          <img src="${image}" alt="${title}" loading="lazy" />
        </div>
      `;
  const primaryAction =
    options.mode === "link"
      ? `
        <a class="button button-primary" href="${options.hrefBuilder(article)}">
          ${escapeHtml(options.primaryLabel || "Read update")}
        </a>
      `
      : `
        <button
          class="button button-primary"
          type="button"
          data-open-article="${article.id}"
        >
          ${escapeHtml(options.primaryLabel || "Open article")}
        </button>
      `;
  const secondaryAction =
    options.secondaryHref
      ? `
        <a class="button button-ghost" href="${options.secondaryHref}">
          ${escapeHtml(options.secondaryLabel || "See all news")}
        </a>
      `
      : "";

  return `
    <article class="${featuredClass}" data-reveal>
      ${mediaHtml}
      <div class="featured-article__body">
        <p class="section-kicker">Featured Story</p>
        <h2 class="featured-article__title">${title}</h2>
        <p class="featured-article__summary">${summary}</p>
        <div class="news-card__footer">
          <span class="chip">${formatDate(article.date)}</span>
          ${primaryAction}
          ${secondaryAction}
        </div>
      </div>
    </article>
  `;
}

function renderEventCard(event) {
  const assets = (event.assets || [])
    .map((asset) => {
      const assetImage = assetPath(asset.image);
      return `
        <a
          class="event-card__asset"
          href="${assetImage}"
          target="_blank"
          rel="noreferrer"
        >
          <img src="${assetImage}" alt="${escapeHtml(asset.label)}" loading="lazy" />
          <span>${escapeHtml(asset.label)}</span>
        </a>
      `;
    })
    .join("");

  return `
    <article class="event-card" data-reveal>
      <p class="micro-label">Recovered Archive</p>
      <h3>${escapeHtml(event.title || "Event materials")}</h3>
      <p>
        Public materials from an earlier MCP event archive, retained here for
        continuity and institutional memory.
      </p>
      <div class="event-card__assets">${assets}</div>
    </article>
  `;
}

function renderSpotlightMentor(mentor) {
  const container = document.querySelector("[data-spotlight-mentor]");
  if (!container) {
    return;
  }

  if (!mentor) {
    container.innerHTML = `<div class="empty-state">Spotlight mentor coming soon.</div>`;
    return;
  }

  const organizations = getPersonOrganizations(mentor);
  const spotlightLink = rootPath(`pages/mentors.html#mentor-${slugify(mentor.name)}`);

  container.innerHTML = `
    <article class="spotlight-card" data-reveal>
      <div class="spotlight-card__media">
        <img src="${getProfileImage(mentor)}" alt="${escapeHtml(mentor.name)}" loading="lazy" />
      </div>
      <div class="spotlight-card__body">
        <span class="spotlight-card__eyebrow">Spotlight mentor</span>
        <h2 class="spotlight-card__title">${escapeHtml(mentor.name)}</h2>
        <p class="spotlight-card__role">${escapeHtml(getPersonTitle(mentor, "Mentor"))}</p>
        ${organizations.length ? `<div class="organization-pill-row">${renderOrganizationPills(organizations.slice(0, 2))}</div>` : ""}
        <p class="spotlight-card__summary">${escapeHtml(excerpt(mentor.bio || "", 170) || "MCP mentor profile coming soon.")}</p>
        <div class="spotlight-card__actions">
          <a class="button button-primary" href="${spotlightLink}">View full profile</a>
        </div>
      </div>
    </article>
  `;
}

function renderModalProfile(person) {
  const name = escapeHtml(person.name || "MCP profile");
  const title = escapeHtml(getPersonTitle(person, "Mentor"));
  const organizations = getPersonOrganizations(person);
  const bio = escapeHtml(person.bio || "Bio coming soon.").replace(/\n+/g, "<br /><br />");

  return `
    <article class="modal-profile">
      <div class="modal-profile__media">
        <img src="${getProfileImage(person)}" alt="${name}" loading="lazy" />
      </div>

      <div class="modal-profile__content">
        <p class="section-kicker">Mentor Profile</p>
        <h2 id="modal-title">${name}</h2>
        <p class="modal-profile__role">${title}</p>
        ${organizations.length ? `<div class="organization-pill-row organization-pill-row--modal">${renderOrganizationPills(organizations)}</div>` : ""}
        <div class="chip-row">
          ${person.hasLongBio ? `<span class="chip">Full biography</span>` : ""}
          ${person.linkedin ? `<span class="chip chip--soft">LinkedIn available</span>` : ""}
        </div>
        <div class="article-body">
          <p>${bio}</p>
        </div>
        ${
          person.linkedin
            ? `
              <div class="news-card__footer">
                <a
                  class="button button-primary"
                  href="${person.linkedin}"
                  target="_blank"
                  rel="noreferrer"
                >
                  View LinkedIn
                </a>
              </div>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function renderInlineMarkdown(text = "") {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function renderMarkdown(markdown = "") {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) {
      return;
    }
    blocks.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    listItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("<iframe")) {
      flushList();
      blocks.push(`<div class="article-embed">${line}</div>`);
      return;
    }

    if (line === "---") {
      flushList();
      blocks.push("<hr />");
      return;
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushList();
      const [, alt, src] = imageMatch;
      blocks.push(`
        <figure>
          <img src="${src}" alt="${escapeHtml(alt || "Article image")}" loading="lazy" />
          ${alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : ""}
        </figure>
      `);
      return;
    }

    if (line.startsWith("- ")) {
      listItems.push(renderInlineMarkdown(line.slice(2)));
      return;
    }

    flushList();

    if (line.startsWith("# ")) {
      blocks.push(`<h1>${renderInlineMarkdown(line.slice(2))}</h1>`);
      return;
    }

    if (line.startsWith("## ")) {
      blocks.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
      return;
    }

    if (line.startsWith("### ")) {
      blocks.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
      return;
    }

    blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
  });

  flushList();
  return blocks.join("");
}

function renderModalArticle(article) {
  const image = assetPath(article.localImage || article.imageUrl || "");
  const imageHtml = image
    ? `
      <figure>
        <img src="${image}" alt="${escapeHtml(article.title || "MCP article")}" loading="lazy" />
      </figure>
    `
    : "";

  return `
    <article class="article-body">
      <p class="section-kicker">MCP News</p>
      <h1 id="modal-title">${escapeHtml(article.title || "Article")}</h1>
      <div class="article-meta">
        <span>${formatDate(article.date)}</span>
        <span>MCP archive</span>
      </div>
      ${imageHtml}
      ${renderMarkdown(article.bodyMarkdown || "")}
    </article>
  `;
}

function initHomePage({ site, mentors, team, news, companies }) {
  const visibleMentors = shuffleList(
    mentors.filter(
      (mentor) => mentor.bio && !getProfileImage(mentor).includes("blank-profile"),
    ),
  );
  const spotlightMentor = visibleMentors[0] || mentors[0];
  const featuredMentors = visibleMentors
    .filter((mentor) => mentor.name !== spotlightMentor?.name)
    .slice(0, 3);
  const featuredArticle = news[0];

  renderSpotlightMentor(spotlightMentor);

  const currentNewsContainer = document.querySelector("[data-home-current-news]");
  if (currentNewsContainer) {
    currentNewsContainer.innerHTML = renderFeaturedNews(featuredArticle, {
      mode: "link",
      hrefBuilder: (item) => rootPath(`pages/news.html#${item.id}`),
      primaryLabel: "Read update",
      secondaryHref: rootPath("pages/news.html"),
      secondaryLabel: "See all news",
    });
  }

  const cdspStory =
    news.find((article) => article.primaryExternalUrl && /cdsp\.wm\.edu/i.test(article.primaryExternalUrl)) ||
    news.find((article) => /you belong here/i.test(article.title || ""));
  const supportStoryContainer = document.querySelector("[data-home-support-story]");
  if (supportStoryContainer) {
    supportStoryContainer.innerHTML = renderSupportStoryCard(cdspStory);
  }

  renderSupporterGrid("[data-home-supporters]", site.supporters || []);

  const mentorHighlights = document.querySelector("[data-home-mentor-highlights]");
  if (mentorHighlights) {
    mentorHighlights.innerHTML = featuredMentors
      .map((mentor) =>
        renderPersonCard(mentor, {
          prefix: "mentor",
          metaLabel: "Mentor",
          categoryLabel: "Mentor",
          defaultRole: "Mentor",
          mode: "link",
          primaryHref: rootPath(`pages/mentors.html#mentor-${slugify(mentor.name)}`),
          primaryLabel: "Full profile",
          excerptLength: 120,
        }),
      )
      .join("");
  }

  const teamContainer = document.querySelector("[data-home-team]");
  if (teamContainer) {
    teamContainer.innerHTML = team
      .filter((person) => person.group !== "advisor")
      .slice(0, 4)
      .map(renderCompactTeamCard)
      .join("");
  }

  renderCompanyShowcaseGrid(
    "[data-home-company-highlights]",
    shuffleList(companies.filter((company) => company.name && (company.image || company.website))).slice(0, 3),
  );

  const foundedYear = 2021;
  const years = Math.max(new Date().getFullYear() - foundedYear, 1);

  const statMap = {
    "[data-stat-mentors]": mentors.length,
    "[data-stat-companies]": companies.length,
    "[data-stat-years]": years,
  };

  Object.entries(statMap).forEach(([selector, value]) => {
    const node = document.querySelector(selector);
    if (node) {
      node.textContent = String(value);
    }
  });
}

function initMentorsPage({ mentors, companies }) {
  const directory = document.querySelector("[data-mentor-directory]");
  const searchInput = document.querySelector("[data-mentor-search]");
  const filterButtons = [...document.querySelectorAll("[data-mentor-filter]")];
  const stats = {
    directory: document.querySelector("[data-mentor-directory-count]"),
    bios: document.querySelector("[data-mentor-bio-count]"),
    linkedin: document.querySelector("[data-mentor-linkedin-count]"),
  };

  const lookup = new Map();
  mentors.forEach((mentor) => {
    lookup.set(`mentor-${slugify(mentor.name)}`, mentor);
  });

  if (stats.directory) stats.directory.textContent = String(mentors.length);
  if (stats.bios) {
    stats.bios.textContent = String(mentors.filter((mentor) => mentor.hasLongBio).length);
  }
  if (stats.linkedin) {
    stats.linkedin.textContent = String(mentors.filter((mentor) => mentor.linkedin).length);
  }

  renderLogoWall("[data-company-grid]", companies);

  let activeFilter = "all";

  function applyFilters() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const filtered = mentors.filter((mentor) => {
      const haystack = `${mentor.name} ${mentor.role} ${mentor.title || ""} ${(mentor.organizations || []).join(" ")} ${mentor.bio}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "bios" && mentor.hasLongBio) ||
        (activeFilter === "linkedin" && mentor.linkedin);

      return matchesQuery && matchesFilter;
    });

    if (!directory) {
      return;
    }

    if (!filtered.length) {
      directory.innerHTML = `
        <div class="empty-state">
          No mentors matched that search. Try another name, role, or filter.
        </div>
      `;
      return;
    }

    directory.innerHTML = filtered
      .map((mentor) =>
        renderPersonCard(mentor, {
          prefix: "mentor",
          metaLabel: "Mentor",
          categoryLabel: mentor.hasLongBio ? "Profile available" : "Network mentor",
          defaultRole: "Mentor",
          primaryLabel: mentor.bio ? "Read bio" : "View details",
          excerptLength: 170,
        }),
      )
      .join("");

    refreshReveals();
    maybeOpenMentorFromHash(lookup);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.mentorFilter || "all";
      filterButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      applyFilters();
    });
  });

  searchInput?.addEventListener("input", applyFilters);

  directory?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-person]");
    if (!trigger) {
      return;
    }

    const mentor = lookup.get(trigger.dataset.openPerson);
    if (!mentor) {
      return;
    }

    openModal(renderModalProfile(mentor));
  });

  applyFilters();

  window.addEventListener("hashchange", () => maybeOpenMentorFromHash(lookup));
}

function maybeOpenMentorFromHash(lookup) {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || !lookup.has(hash)) {
    return;
  }

  const mentor = lookup.get(hash);
  const target = document.getElementById(hash);
  target?.scrollIntoView({ block: "center" });
  openModal(renderModalProfile(mentor));
}

function initNewsPage({ news }) {
  const featuredContainer = document.querySelector("[data-featured-news]");
  const archiveContainer = document.querySelector("[data-news-archive]");
  const lookup = new Map(news.map((article) => [article.id, article]));

  if (featuredContainer) {
    featuredContainer.innerHTML = renderFeaturedNews(news[0]);
  }

  if (archiveContainer) {
    archiveContainer.innerHTML = news
      .map((article) =>
        renderNewsCard(article, {
          mode: "modal",
          primaryLabel: "Read article",
          excerptLength: 170,
        }),
      )
      .join("");
  }

  const countNode = document.querySelector("[data-news-count]");
  if (countNode) {
    countNode.textContent = String(news.length);
  }

  const rangeNode = document.querySelector("[data-news-year-range]");
  if (rangeNode && news.length) {
    const years = news.map((article) => new Date(article.date).getFullYear()).sort();
    rangeNode.textContent = `${years[0]}–${years[years.length - 1]}`;
  }

  document.body.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-article]");
    if (!trigger) {
      return;
    }

    const article = lookup.get(trigger.dataset.openArticle);
    if (!article) {
      return;
    }

    openModal(renderModalArticle(article));
  });

  maybeOpenArticleFromHash(lookup);
  window.addEventListener("hashchange", () => maybeOpenArticleFromHash(lookup));
}

function maybeOpenArticleFromHash(lookup) {
  const rawHash = window.location.hash.replace(/^#/, "");
  if (!rawHash) {
    return;
  }

  const key = rawHash.replace(/^article-/, "");
  const article = lookup.get(key);
  if (!article) {
    return;
  }

  const target = document.getElementById(`article-${key}`);
  target?.scrollIntoView({ block: "center" });
  openModal(renderModalArticle(article));
}

function initTeamPage({ team, retiredTeam, companies, events }) {
  const currentTeam = document.querySelector("[data-team-directory]");
  const advisorTeam = document.querySelector("[data-advisor-directory]");
  const retiredTeamNode = document.querySelector("[data-retired-team-directory]");
  const eventNode = document.querySelector("[data-events-list]");
  const leadership = team.filter((person) => person.group !== "advisor");
  const advisors = team.filter((person) => person.group === "advisor");

  if (currentTeam) {
    currentTeam.innerHTML = leadership
      .map((person) =>
        renderPersonCard(person, {
          prefix: "team",
          metaLabel: "Leadership",
          categoryLabel: "Current team",
          defaultRole: "Leadership Team",
          mode: "link",
          primaryHref: rootPath("pages/contact.html"),
          primaryLabel: "Contact MCP",
          excerptLength: 150,
        }),
      )
      .join("");
  }

  if (advisorTeam) {
    advisorTeam.innerHTML = advisors.length
      ? advisors
          .map((person) =>
            renderPersonCard(person, {
              prefix: "advisor",
              metaLabel: "Advisor",
              categoryLabel: "Co-founder",
              defaultRole: "Advisor",
              mode: "link",
              primaryHref: rootPath("pages/contact.html"),
              primaryLabel: "Contact MCP",
              excerptLength: 150,
            }),
          )
          .join("")
      : `<div class="empty-state">Advisor profiles will appear here soon.</div>`;
  }

  if (retiredTeamNode) {
    retiredTeamNode.innerHTML = retiredTeam
      .map((person) =>
        renderPersonCard(person, {
          prefix: "retired",
          metaLabel: "Previous Team Member",
          categoryLabel: "Archive",
          defaultRole: "Previous Team Member",
          mode: "link",
          primaryHref: rootPath("pages/news.html"),
          primaryLabel: "See program archive",
          excerptLength: 140,
        }),
      )
      .join("");
  }

  if (eventNode) {
    eventNode.innerHTML = events.map(renderEventCard).join("");
  }

  renderLogoWall("[data-company-grid]", companies);

  const teamCount = document.querySelector("[data-team-count]");
  const advisorCount = document.querySelector("[data-advisor-count]");
  const retiredCount = document.querySelector("[data-retired-count]");
  const companyCount = document.querySelector("[data-company-count]");

  if (teamCount) teamCount.textContent = String(leadership.length);
  if (advisorCount) advisorCount.textContent = String(advisors.length);
  if (retiredCount) retiredCount.textContent = String(retiredTeam.length);
  if (companyCount) companyCount.textContent = String(companies.length);
}

function initContactPage({ site }) {
  const socialNodes = document.querySelectorAll("[data-footer-social]");
  const socialHtml = buildSocialLinks(site.socialLinks || []);
  socialNodes.forEach((node) => {
    node.innerHTML = socialHtml;
  });
}

async function init() {
  wireNavigation();
  setNavState();
  wireModal();

  if (PAGE === "not-found") {
    refreshReveals();
    return;
  }

  try {
    const [site, mentors, team, retiredTeam, news, companies, events] = await Promise.all([
      loadJson("site.json"),
      loadJson("mentors.json"),
      loadJson("team.json"),
      loadJson("retired-team.json"),
      loadJson("news.json"),
      loadJson("companies.json"),
      loadJson("events.json"),
    ]);
    const newsByDate = sortByDateDesc(news);
    setCompanyDirectory(companies);

    populateGlobalContent(site);

    if (PAGE === "home") {
      initHomePage({ site, mentors, team, news: newsByDate, companies });
    }

    if (PAGE === "mentors") {
      initMentorsPage({ mentors, companies });
    }

    if (PAGE === "news") {
      initNewsPage({ news: newsByDate });
    }

    if (PAGE === "team") {
      initTeamPage({ team, retiredTeam, companies, events });
    }

    if (PAGE === "contact") {
      initContactPage({ site });
    }

    refreshReveals();
  } catch (error) {
    console.error(error);
  }
}

init();
