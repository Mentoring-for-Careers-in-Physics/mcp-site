function dataRoot() {
  return document.body.dataset.page && document.body.dataset.page !== "home"
    ? "../data"
    : "./data";
}

async function loadJson(fileName) {
  const response = await fetch(`${dataRoot()}/${fileName}`);
  if (!response.ok) {
    throw new Error(`Could not load ${fileName}`);
  }
  return response.json();
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

function setSiteMeta(site) {
  const title = document.querySelector("[data-site-title]");
  const summary = document.querySelector("[data-site-summary]");

  if (title && site.title) {
    title.textContent = site.title;
  }

  if (summary && site.summary) {
    summary.textContent = site.summary;
  }
}

function renderList(containerSelector, items, renderer, emptyMessage) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  container.innerHTML = items.map(renderer).join("");
}

function renderNewsCard(item) {
  return `
    <article class="news-card">
      <h3>${item.title}</h3>
      <p>${item.summary || ""}</p>
      <time datetime="${item.date}">${formatDate(item.date)}</time>
    </article>
  `;
}

function renderTeamCard(item) {
  return `
    <article class="team-card">
      <h3>${item.name}</h3>
      <span class="role">${item.role || ""}</span>
      <p>${item.bio || ""}</p>
    </article>
  `;
}

function renderMentorCard(item) {
  return `
    <article class="mentor-card">
      <h3>${item.name}</h3>
      <span class="role">${item.role || ""}</span>
      <p>${item.bio || ""}</p>
    </article>
  `;
}

async function init() {
  try {
    const [site, news, mentors, team] = await Promise.all([
      loadJson("site.json"),
      loadJson("news.json"),
      loadJson("mentors.json"),
      loadJson("team.json"),
    ]);

    setSiteMeta(site);

    renderList(
      "[data-news-list]",
      news.slice(0, 6),
      renderNewsCard,
      "Add public news records to data/news.json."
    );

    renderList(
      "[data-team-list]",
      team,
      renderTeamCard,
      "Add team records to data/team.json."
    );

    renderList(
      "[data-mentor-list]",
      mentors,
      renderMentorCard,
      "Add mentor records to data/mentors.json."
    );
  } catch (error) {
    console.error(error);
  }
}

init();
