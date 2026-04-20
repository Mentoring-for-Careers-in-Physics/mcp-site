const BLANK_PROFILE = "assets/images/live-site/clearweb/assets/blank-profile.jpeg";
const SUPPORTERS_BANNER = "assets/images/live-site/clearweb/assets/So1918_banner.png";
const PAGE = document.body.dataset.page || "home";
const ROOT = document.body.dataset.root || ".";

let revealObserver = null;
let activeModal = null;

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

function classifySocialLink(url) {
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("twitter.com")) return "X";
  if (url.includes("youtu")) return "YouTube";
  return "Website";
}

function buildSocialLinks(urls = []) {
  return urls
    .map((url) => {
      return `
        <a class="social-pill" href="${url}" target="_blank" rel="noreferrer">
          ${classifySocialLink(url)}
        </a>
      `;
    })
    .join("");
}

function linkMap(site) {
  const pageLinks = site.pageLinks || [];
  const donateLink =
    site.givingUrl ||
    pageLinks.find((item) => item.url.includes("donate.wm.edu"))?.url ||
    "#";

  return {
    donateLink,
    interestLink: site.interestFormUrl || "#",
    menteeLink: site.menteeInterestFormUrl || site.interestFormUrl || "#",
    mentorLink: site.mentorInterestFormUrl || "",
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
  if (/^(mailto:|tel:)/i.test(url)) {
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

  document.querySelectorAll("[data-donate-link]").forEach((node) => {
    applyExternalAction(node, links.donateLink);
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

  document.querySelectorAll("[data-supporters-text]").forEach((node) => {
    node.textContent = site.supportersText || "";
  });

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
  const image = assetPath(company.image || SUPPORTERS_BANNER);
  const name = escapeHtml(company.name || "Organization");
  const website = company.website || "#";
  const compactClass = options.compact ? " logo-card--compact" : "";
  const label = options.compact ? "" : `<span>${name}</span>`;

  return `
    <a
      class="logo-card${compactClass}"
      href="${website}"
      target="_blank"
      rel="noreferrer"
      aria-label="${name}"
      data-reveal
    >
      <img src="${image}" alt="${name} logo" loading="lazy" />
      ${label}
    </a>
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

function renderSocialAction(url) {
  const label = classifySocialLink(url);
  return `
    <a class="social-pill" href="${url}" target="_blank" rel="noreferrer">
      ${label}
    </a>
  `;
}

function renderPersonCard(person, options = {}) {
  const id = options.id || `${options.prefix || "card"}-${slugify(person.name)}`;
  const image = getProfileImage(person);
  const name = escapeHtml(person.name || "MCP profile");
  const role = escapeHtml(person.role || options.defaultRole || "Mentor");
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
        <p class="profile-card__role">${role}</p>
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

  return `
    <article class="profile-card" data-reveal>
      <div class="profile-card__media">
        <img src="${image}" alt="${name}" loading="lazy" />
      </div>
      <div class="profile-card__body">
        <span class="profile-card__meta">Leadership</span>
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
        <img src="${image}" alt="${title}" loading="lazy" />
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

function renderFeaturedNews(article) {
  if (!article) {
    return `<div class="empty-state">No public news has been imported yet.</div>`;
  }

  const image = assetPath(article.localImage || article.imageUrl || BLANK_PROFILE);
  const title = escapeHtml(article.title || "Featured story");
  const summary = escapeHtml(excerpt(article.bodyMarkdown || "", 460));

  return `
    <article class="featured-article" data-reveal>
      <div class="featured-article__media">
        <img src="${image}" alt="${title}" loading="lazy" />
      </div>
      <div class="featured-article__body">
        <p class="section-kicker">Featured Story</p>
        <h2 class="featured-article__title">${title}</h2>
        <p class="featured-article__summary">${summary}</p>
        <div class="news-card__footer">
          <span class="chip">${formatDate(article.date)}</span>
          <button
            class="button button-primary"
            type="button"
            data-open-article="${article.id}"
          >
            Open article
          </button>
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

function renderPortraitCluster(mentors) {
  const container = document.querySelector("[data-featured-portraits]");
  if (!container) {
    return;
  }

  container.innerHTML = mentors
    .slice(0, 3)
    .map((mentor, index) => {
      return `
        <figure class="portrait-chip portrait-chip--${index + 1}">
          <div class="portrait-chip__media">
            <img src="${getProfileImage(mentor)}" alt="${escapeHtml(mentor.name)}" />
          </div>
          <figcaption>
            <span class="portrait-chip__eyebrow">${index === 0 ? "Mentor spotlight" : "Mentor"}</span>
            <h3>${escapeHtml(mentor.name)}</h3>
            <p>${escapeHtml(organizationLabel(mentor.role || "Mentor"))}</p>
          </figcaption>
        </figure>
      `;
    })
    .join("");
}

function renderModalProfile(person) {
  const name = escapeHtml(person.name || "MCP profile");
  const role = escapeHtml(person.role || "Mentor");
  const bio = escapeHtml(person.bio || "Bio coming soon.").replace(/\n+/g, "<br /><br />");

  return `
    <article class="modal-profile">
      <div class="modal-profile__media">
        <img src="${getProfileImage(person)}" alt="${name}" loading="lazy" />
      </div>

      <div class="modal-profile__content">
        <p class="section-kicker">Mentor Profile</p>
        <h2 id="modal-title">${name}</h2>
        <p class="modal-profile__role">${role}</p>
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
  const featuredMentors = mentors
    .filter((mentor) => mentor.bio && !getProfileImage(mentor).includes("blank-profile"))
    .slice(0, 6);

  renderPortraitCluster(featuredMentors);

  renderLogoWall("[data-home-logo-ribbon]", companies.slice(0, 4), {
    compact: true,
  });

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
    teamContainer.innerHTML = team.slice(0, 4).map(renderCompactTeamCard).join("");
  }

  const newsContainer = document.querySelector("[data-home-news]");
  if (newsContainer) {
    newsContainer.innerHTML = news
      .slice(0, 3)
      .map((article) =>
        renderNewsCard(article, {
          mode: "link",
          hrefBuilder: (item) => rootPath(`pages/news.html#${item.id}`),
          primaryLabel: "Read",
          excerptLength: 110,
        }),
      )
      .join("");
  }

  renderLogoWall("[data-company-grid]", companies.slice(0, 8));

  const foundedYear = 2021;
  const years = Math.max(new Date().getFullYear() - foundedYear, 1);

  const statMap = {
    "[data-stat-mentors]": mentors.length,
    "[data-stat-companies]": companies.length,
    "[data-stat-news]": news.length,
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
      const haystack = `${mentor.name} ${mentor.role} ${mentor.bio}`.toLowerCase();
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
  const retiredTeamNode = document.querySelector("[data-retired-team-directory]");
  const eventNode = document.querySelector("[data-events-list]");

  if (currentTeam) {
    currentTeam.innerHTML = team
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
  const retiredCount = document.querySelector("[data-retired-count]");
  const companyCount = document.querySelector("[data-company-count]");

  if (teamCount) teamCount.textContent = String(team.length);
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
