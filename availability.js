const DATA_URL = "data/availability.json";

const state = {
  data: null,
  showAvailable: true,
  showWaiting: true,
};

const updatedAt = document.getElementById("updatedAt");
const availableCount = document.getElementById("availableCount");
const waitingCount = document.getElementById("waitingCount");
const allCount = document.getElementById("allCount");
const results = document.getElementById("results");
const emptyState = document.getElementById("emptyState");
const warningBox = document.getElementById("warningBox");
const conditionFilter = document.getElementById("conditionFilter");
const sourceFilter = document.getElementById("sourceFilter");

function getVisibleSlots() {
  if (!state.data) return [];

  return state.data.slots.filter((slot) => {
    const statusOk =
      (slot.status === "available" && state.showAvailable) ||
      (slot.status === "waiting" && state.showWaiting);

    const conditionOk =
      conditionFilter.value === "all" ||
      slot.condition === conditionFilter.value;

    const sourceOk =
      sourceFilter.value === "all" ||
      slot.source === sourceFilter.value;

    return statusOk && conditionOk && sourceOk;
  });
}

function shortCondition(text) {
  if (!text) return "";
  return text
    .replace("条件A：", "A ")
    .replace("条件B：", "B ")
    .replace("条件C：", "C ")
    .replace("保土ケ谷公園 早朝", "早朝");
}

function shortTime(text) {
  if (!text) return "";

  return text
    .replace(/:00/g, "")
    .replace("～", "-");
}

function setupConditionFilter() {
  const current = conditionFilter.value;
  const conditions = [
    ...new Set(
      state.data.slots
        .map((slot) => slot.condition)
        .filter(Boolean)
    ),
  ].sort();

  conditionFilter.innerHTML =
    '<option value="all">条件：すべて</option>';

  for (const condition of conditions) {
    const option = document.createElement("option");
    option.value = condition;
    option.textContent = shortCondition(condition);
    conditionFilter.appendChild(option);
  }

  if ([...conditionFilter.options].some((x) => x.value === current)) {
    conditionFilter.value = current;
  }
}

function renderWarnings() {
  const errors = state.data?.errors ?? [];

  if (!errors.length) {
    warningBox.classList.add("hidden");
    warningBox.textContent = "";
    return;
  }

  warningBox.classList.remove("hidden");
  warningBox.textContent =
    "⚠ 一部検索失敗: " +
    errors.map((e) => e.source).join(" / ");
}

function makeRow(slot) {
  const row = document.createElement("div");
  row.className = "slot-row";

  const time = document.createElement("div");
  time.className = "slot-time";
  time.textContent = shortTime(slot.time);

  const place = document.createElement("div");
  place.className = "slot-place";

  const facility = document.createElement("div");
  facility.className = "slot-facility";
  facility.textContent = slot.facility || "";

  const court = document.createElement("div");
  court.className = "slot-court";
  court.textContent = slot.court || "";

  place.appendChild(facility);
  place.appendChild(court);

  const condition = document.createElement("div");
  condition.className = "slot-condition";
  condition.textContent = shortCondition(slot.condition);

  const status = document.createElement("div");
  status.className = "slot-status";
  status.textContent = slot.status === "available" ? "🟢" : "🟡";

  row.appendChild(time);
  row.appendChild(place);
  row.appendChild(condition);
  row.appendChild(status);

  return row;
}

function render() {
  const slots = getVisibleSlots();

  availableCount.textContent = state.data.available_count ?? 0;
  waitingCount.textContent = state.data.waiting_count ?? 0;
  allCount.textContent = state.data.count ?? state.data.slots.length;

  results.innerHTML = "";
  emptyState.classList.toggle("hidden", slots.length > 0);

  const groups = new Map();

  for (const slot of slots) {
    const key = `${slot.date}|${slot.weekday || ""}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(slot);
  }

  for (const [key, daySlots] of groups) {
    const [date, weekday] = key.split("|");

    const group = document.createElement("section");
    group.className = "day-group";

    const title = document.createElement("h2");
    title.className = "day-title";

    const compactDate = date
      .replace(/^\d{4}-/, "")
      .replace("-", "/");

    title.textContent =
      `${compactDate}${weekday ? `（${weekday}）` : ""}`;

    const table = document.createElement("div");
    table.className = "slot-table";

    for (const slot of daySlots) {
      table.appendChild(makeRow(slot));
    }

    group.appendChild(title);
    group.appendChild(table);
    results.appendChild(group);
  }
}

async function loadData() {
  updatedAt.textContent = "取得中...";

  try {
    const response = await fetch(
      `${DATA_URL}?t=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.data = await response.json();

    updatedAt.textContent =
      `更新 ${state.data.updated_at_display || state.data.updated_at}`;

    setupConditionFilter();
    renderWarnings();
    render();
  } catch (error) {
    updatedAt.textContent = "取得失敗";
    warningBox.classList.remove("hidden");
    warningBox.textContent = `⚠ ${error}`;
  }
}

document.querySelectorAll(".status-tab").forEach((button) => {
  button.addEventListener("click", () => {
    const status = button.dataset.status;

    if (status === "available") {
      state.showAvailable = !state.showAvailable;
      button.classList.toggle("active", state.showAvailable);
    }

    if (status === "waiting") {
      state.showWaiting = !state.showWaiting;
      button.classList.toggle("active", state.showWaiting);
    }

    render();
  });
});

conditionFilter.addEventListener("change", render);
sourceFilter.addEventListener("change", render);
document.getElementById("reloadButton").addEventListener("click", loadData);

loadData();
