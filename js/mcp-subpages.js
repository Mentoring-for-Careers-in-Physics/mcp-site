(function () {
  const SECTOR_OVERRIDES = {
    "Arcfield": "Industry",
    "Athena Theatrical": "Industry",
    "BAE Systems": "Industry",
    "Calspan": "Industry",
    "Capital One": "Industry",
    "Case Western University": "Academia",
    "Christopher Newport University": "Academia",
    "Department of Defense": "Government",
    "Fannie Mae": "Industry",
    "Honeywell": "Industry",
    "Independent AI/ML-at-Scale Expert": "Independent",
    "Institute for Defense Analyses": "Government",
    "ivWatch LLC": "Industry",
    "Jefferson Lab": "National Lab",
    "KLA Corporation": "Industry",
    "Klaco Ventures": "Independent",
    "Luna Innovations": "Industry",
    "Micron Technology": "Industry",
    "Microsoft": "Industry",
    "MITRE": "Government",
    "NASA": "Government",
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

  const DEFAULT_EXTERNAL_LINKS = {
    mentee: "https://forms.gle/zkuoy8HGdec81Y5o8",
    mentor: "mailto:rxyan2@wm.edu?subject=MCP%20Mentor%20Inquiry",
    giving: "https://donate.wm.edu/",
    linkedin: "https://www.linkedin.com/company/wmmcp",
    instagram: "https://www.instagram.com/wm_mcp",
    email: "mcp.superuser@gmail.com",
    socialLinks: [
      "https://www.instagram.com/wm_mcp",
      "https://www.linkedin.com/company/wmmcp",
    ],
  };

  function rootPath(relativePath, root) {
    const cleanPath = String(relativePath || "")
      .replace(/^\/+/, "")
      .replace(/^\.\//, "");
    return `${root}/${cleanPath}`;
  }

  function assetPath(value, root) {
    if (!value) {
      return "";
    }

    if (/^(https?:)?\/\//i.test(value) || /^(mailto:|tel:|#|data:)/i.test(value)) {
      return value;
    }

    return rootPath(value, root);
  }

  async function loadJson(fileName, root) {
    const response = await fetch(rootPath(`data/${fileName}`, root));
    if (!response.ok) {
      throw new Error(`Could not load ${fileName}`);
    }
    return response.json();
  }

  function normalizeOrgName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function monogram(value) {
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

    const parts = String(value || "")
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

  function stripMarkdown(markdown) {
    return String(markdown || "")
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

  function excerptText(text, length) {
    const normalized = String(text || "").trim();
    if (normalized.length <= length) {
      return normalized;
    }

    return `${normalized.slice(0, Math.max(length - 1, 0)).trimEnd()}...`;
  }

  function markdownParagraphs(markdown) {
    return String(markdown || "")
      .split(/\n{2,}/)
      .map((block) => stripMarkdown(block))
      .filter(Boolean);
  }

  function websiteHost(value) {
    if (!value) {
      return "";
    }

    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch (error) {
      return String(value)
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "");
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function socialPlatform(url) {
    const value = String(url || "").toLowerCase();
    if (value.includes("instagram.com")) return "instagram";
    if (value.includes("linkedin.com")) return "linkedin";
    if (value.includes("twitter.com") || value.includes("x.com")) return "x";
    if (value.includes("youtu")) return "youtube";
    return "website";
  }

  function socialLabel(url) {
    const platform = socialPlatform(url);
    if (platform === "instagram") return "Instagram";
    if (platform === "linkedin") return "LinkedIn";
    if (platform === "x") return "X";
    if (platform === "youtube") return "YouTube";
    return websiteHost(url) || "Link";
  }

  function socialIconMarkup(url) {
    switch (socialPlatform(url)) {
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

  function buildSocialLink(url, options) {
    const settings = options || {};
    const platform = socialPlatform(url);
    const label = socialLabel(url);
    const baseClass = settings.className || "social-pill";
    const classes = [baseClass, "social-link", `social-link--${platform}`].filter(Boolean).join(" ");
    const labelHtml = settings.labelVisible ? `<span class="social-link__label">${escapeHtml(label)}</span>` : "";

    return `
      <a class="${classes}" href="${escapeHtml(url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
        <span class="social-link__icon" aria-hidden="true">${socialIconMarkup(url)}</span>
        ${labelHtml}
      </a>
    `;
  }

  function buildSocialLinks(urls, options) {
    return (urls || []).map((url) => buildSocialLink(url, options)).join("");
  }

  function organizationSector(name) {
    const value = String(name || "");
    if (SECTOR_OVERRIDES[value]) {
      return SECTOR_OVERRIDES[value];
    }

    if (/(university|college)/i.test(value)) {
      return "Academia";
    }
    if (/(national lab|research laboratory|jefferson lab)/i.test(value)) {
      return "National Lab";
    }
    if (/(department|nasa|institute for defense analyses|mitre)/i.test(value)) {
      return "Government";
    }
    return "Industry";
  }

  function buildCompanyLookup(companies) {
    const lookup = new Map();
    (companies || []).forEach((company) => {
      const normalizedCompany = {
        ...company,
        sector: organizationSector(company.name),
      };
      [company.name, ...(company.aliases || [])].forEach((value) => {
        lookup.set(normalizeOrgName(value), normalizedCompany);
      });
    });
    return lookup;
  }

  function buildMentorDirectory(mentors, companies, root) {
    const companyLookup = buildCompanyLookup(companies);

    return (mentors || [])
      .map((mentor) => {
        const organizations = mentor.organizations || [];
        const matchedCompanies = organizations
          .map((organization) => companyLookup.get(normalizeOrgName(organization)))
          .filter(Boolean);
        const sectors = [...new Set(matchedCompanies.map((company) => company.sector))];
        const bio = stripMarkdown(mentor.bio || "");

        return {
          ...mentor,
          image: assetPath(mentor.image, root),
          organizations,
          companies: matchedCompanies,
          sectors: sectors.length ? sectors : ["Industry"],
          sectorLabel: (sectors.length ? sectors : ["Industry"]).join(" / "),
          primaryOrganization: organizations[0] || "Independent",
          organizationLabel:
            organizations.length <= 1
              ? organizations[0] || "Independent"
              : `${organizations[0]} + ${organizations.length - 1} more`,
          bio,
          excerpt: excerptText(bio || "Full biography coming soon.", 170),
          linkedinHost: websiteHost(mentor.linkedin),
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  function buildTeamDirectory(team, retiredTeam, root) {
    const normalizePerson = (person, fallbackGroup) => ({
      ...person,
      group: person.group || fallbackGroup,
      image: assetPath(person.image, root),
      bio: stripMarkdown(person.bio || ""),
    });

    return {
      current: (team || []).filter((person) => person.group !== "advisor").map((person) => normalizePerson(person, "leadership")),
      advisors: (team || []).filter((person) => person.group === "advisor").map((person) => normalizePerson(person, "advisor")),
      retired: (retiredTeam || []).map((person) => normalizePerson(person, "archive")),
    };
  }

  function sortByDateDesc(items) {
    return [...(items || [])].sort((left, right) => new Date(right.date) - new Date(left.date));
  }

  function buildNewsFeed(news, root) {
    return sortByDateDesc(news).map((article) => {
      const paragraphs = markdownParagraphs(article.bodyMarkdown || "");
      const text = paragraphs.join(" ");
      const year = new Date(article.date).getFullYear();
      const articleLinks = Array.isArray(article.links) ? article.links : [];
      const externalLinks = articleLinks.filter((link) => /^https?:/i.test(link));

      return {
        ...article,
        image: assetPath(article.localImage || article.imageUrl || "", root),
        paragraphs,
        bodyText: text,
        summary: excerptText(text, 220),
        formattedDate: formatDate(article.date),
        year: Number.isFinite(year) ? year : null,
        externalLinks,
      };
    });
  }

  function buildExternalLinks(site) {
    return {
      mentee: site?.menteeInterestFormUrl || site?.interestFormUrl || DEFAULT_EXTERNAL_LINKS.mentee,
      mentor: site?.mentorInterestFormUrl || DEFAULT_EXTERNAL_LINKS.mentor,
      giving: site?.givingUrl || DEFAULT_EXTERNAL_LINKS.giving,
      linkedin:
        (site?.socialLinks || []).find((url) => String(url).includes("linkedin.com")) ||
        DEFAULT_EXTERNAL_LINKS.linkedin,
      instagram:
        (site?.socialLinks || []).find((url) => String(url).includes("instagram.com")) ||
        DEFAULT_EXTERNAL_LINKS.instagram,
      email: site?.contactEmail || DEFAULT_EXTERNAL_LINKS.email,
      socialLinks: site?.socialLinks || [DEFAULT_EXTERNAL_LINKS.instagram, DEFAULT_EXTERNAL_LINKS.linkedin],
    };
  }

  window.MCPSubpages = {
    DEFAULT_EXTERNAL_LINKS,
    buildExternalLinks,
    buildMentorDirectory,
    buildNewsFeed,
    buildTeamDirectory,
    excerptText,
    formatDate,
    loadJson,
    markdownParagraphs,
    monogram,
    organizationSector,
    rootPath,
    assetPath,
    buildSocialLink,
    buildSocialLinks,
    socialIconMarkup,
    socialLabel,
    socialPlatform,
    stripMarkdown,
    websiteHost,
  };
})();
