const DATA_URL = "data/availability.json";

let state = {
  data: null,
  status: "available",
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
const slotTemplate = document.getElementById("slotTemplate");

function visibleSlots() {
  if (!state.data) return [];

  return state.data.slots.filter((slot) => {
    const statusOk = state.status === "all" || slot.status === state.status;
    const conditionOk =
      conditionFilter.value === "all" ||
      slot.condition === conditionFilter.value;
    const sourceOk =
      sourceFilter.value === "all" ||
      slot.source === sourceFilter.value;

    return statusOk && conditionOk && sourceOk;
  });
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

  conditionFilter.innerHTML = '<option value="all">すべて</option>';

  for (const condition of conditions) {
    const option = document.createElement("option");
    option.value = condition;
    option.textContent = condition;
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
    "⚠ 一部の検索に失敗しました: " +
    errors.map((e) => `${e.source}: ${e.message}`).join(" / ");
}

function buildCard(slot) {
  const fragment = slotTemplate.content.cloneNode(true);
  const status = fragment.querySelector(".status");

  status.textContent = slot.status === "available" ? "空き" : "開放待ち";
  status.classList.add(slot.status);

  fragment.querySelector(".condition").textContent = slot.condition || "";
  fragment.querySelector(".time").textContent = slot.time || "";
  fragment.querySelector(".facility").textContent = slot.facility || "";
  fragment.querySelector(".court").textContent = slot.court || "";

  const link = fragment.querySelector(".booking-link");
  if (slot.booking_url) {
    link.href = slot.booking_url;
  } else {
    link.remove();
  }

  return fragment;
}

function render() {
  const slots = visibleSlots();

  availableCount.textContent = state.data.available_count ?? 0;
  waitingCount.textContent = state.data.waiting_count ?? 0;
  allCount.textContent = state.data.count ?? state.data.slots.length;

  results.innerHTML = "";
  emptyState.classList.toggle("hidden", slots.length > 0);

  const groups = new Map();

  for (const slot of slots) {
    const key = `${slot.date}|${slot.weekday || ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(slot);
  }

  for (const [key, groupSlots] of groups) {
    const [date, weekday] = key.split("|");

    const section = document.createElement("section");
    section.className = "day-group";

    const title = document.createElement("h2");
    title.className = "day-title";
    title.textContent = weekday ? `${date}（${weekday}）` : date;

    const list = document.createElement("div");
    list.className = "slot-list";

    for (const slot of groupSlots) {
      list.appendChild(buildCard(slot));
    }

    section.appendChild(title);
    section.appendChild(list);
    results.appendChild(section);
  }
}

async function loadData() {
  updatedAt.textContent = "更新情報を取得中...";

  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.data = await response.json();

    updatedAt.textContent =
      `最終確認: ${state.data.updated_at_display || state.data.updated_at}`;

    setupConditionFilter();
    renderWarnings();
    render();
  } catch (error) {
    updatedAt.textContent = "データ取得失敗";
    warningBox.classList.remove("hidden");
    warningBox.textContent = `⚠ ${error}`;
  }
}

document.querySelectorAll(".summary-card").forEach((button) => {
  button.addEventListener("click", () => {
    state.status = button.dataset.status;

    document.querySelectorAll(".summary-card").forEach((x) => {
      x.classList.remove("active");
    });

    button.classList.add("active");
    render();
  });
});

conditionFilter.addEventListener("change", render);
sourceFilter.addEventListener("change", render);
document.getElementById("reloadButton").addEventListener("click", loadData);

loadData();
