const DATA_URL =
  "data/availability.json";


/* =========================================================
   状態
   ========================================================= */

const state = {

  data: null,

  /*
    初期状態：
    空き・開放待ちの両方を表示
  */

  showAvailable: true,

  showWaiting: true,

};


/* =========================================================
   DOM
   ========================================================= */

const updatedAt =
  document.getElementById(
    "updatedAt"
  );


const availableCount =
  document.getElementById(
    "availableCount"
  );


const waitingCount =
  document.getElementById(
    "waitingCount"
  );


const results =
  document.getElementById(
    "results"
  );


const emptyState =
  document.getElementById(
    "emptyState"
  );


const warningBox =
  document.getElementById(
    "warningBox"
  );


const conditionFilter =
  document.getElementById(
    "conditionFilter"
  );


const sourceFilter =
  document.getElementById(
    "sourceFilter"
  );


/* =========================================================
   表示対象を抽出
   ========================================================= */

function getVisibleSlots() {

  if (!state.data) {

    return [];

  }


  return state.data.slots.filter(
    (slot) => {

      /*
        状態
      */

      const statusOk =

        (
          slot.status === "available"
          &&
          state.showAvailable
        )

        ||

        (
          slot.status === "waiting"
          &&
          state.showWaiting
        );


      /*
        条件
      */

      const conditionOk =

        conditionFilter.value === "all"

        ||

        slot.condition ===
        conditionFilter.value;


      /*
        検索元
      */

      const sourceOk =

        sourceFilter.value === "all"

        ||

        slot.source ===
        sourceFilter.value;


      return (
        statusOk
        &&
        conditionOk
        &&
        sourceOk
      );

    }
  );

}


/* =========================================================
   条件名を短くする
   ========================================================= */

function shortCondition(text) {

  if (!text) {

    return "";

  }


  return text

    .replace(
      "条件A：",
      "A "
    )

    .replace(
      "条件B：",
      "B "
    )

    .replace(
      "条件C：",
      "C "
    )

    .replace(
      "保土ケ谷公園 早朝",
      "早朝"
    );

}


/* =========================================================
   時間表示を短縮
   ========================================================= */

function shortTime(text) {

  if (!text) {

    return "";

  }


  return text

    .replace(
      /:00/g,
      ""
    )

    .replace(
      "～",
      "-"
    );

}


/* =========================================================
   条件フィルター
   ========================================================= */

function setupConditionFilter() {

  const current =
    conditionFilter.value;


  const conditions = [

    ...new Set(

      state.data.slots

        .map(
          (slot) =>
            slot.condition
        )

        .filter(Boolean)

    ),

  ].sort();


  conditionFilter.innerHTML =
    '<option value="all">'
    +
    '条件：すべて'
    +
    '</option>';


  for (
    const condition
    of conditions
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      condition;


    option.textContent =
      shortCondition(
        condition
      );


    conditionFilter.appendChild(
      option
    );

  }


  /*
    再読み込み時に
    選択状態を維持
  */

  const exists =

    [
      ...conditionFilter.options
    ]

    .some(
      (option) =>
        option.value === current
    );


  if (exists) {

    conditionFilter.value =
      current;

  }

}


/* =========================================================
   エラー表示
   ========================================================= */

function renderWarnings() {

  const errors =
    state.data?.errors ?? [];


  if (!errors.length) {

    warningBox.classList.add(
      "hidden"
    );


    warningBox.textContent =
      "";


    return;

  }


  warningBox.classList.remove(
    "hidden"
  );


  warningBox.textContent =

    "⚠ 一部検索失敗: "

    +

    errors

      .map(
        (error) =>
          error.source
      )

      .join(" / ");

}


/* =========================================================
   1行生成
   ========================================================= */

function makeRow(slot) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "slot-row";


  /*
    時間
  */

  const time =
    document.createElement(
      "div"
    );


  time.className =
    "slot-time";


  time.textContent =
    shortTime(
      slot.time
    );


  /*
    場所
  */

  const place =
    document.createElement(
      "div"
    );


  place.className =
    "slot-place";


  const facility =
    document.createElement(
      "div"
    );


  facility.className =
    "slot-facility";


  facility.textContent =
    slot.facility || "";


  const court =
    document.createElement(
      "div"
    );


  court.className =
    "slot-court";


  court.textContent =
    slot.court || "";


  place.appendChild(
    facility
  );


  place.appendChild(
    court
  );


  /*
    条件
  */

  const condition =
    document.createElement(
      "div"
    );


  condition.className =
    "slot-condition";


  condition.textContent =
    shortCondition(
      slot.condition
    );


  /*
    状態
  */

  const status =
    document.createElement(
      "div"
    );


  status.className =
    "slot-status";


  status.textContent =

    slot.status === "available"

      ? "🟢"

      : "🟡";


  /*
    行
  */

  row.appendChild(
    time
  );


  row.appendChild(
    place
  );


  row.appendChild(
    condition
  );


  row.appendChild(
    status
  );


  return row;

}


/* =========================================================
   描画
   ========================================================= */

function render() {

  if (!state.data) {

    return;

  }


  const slots =
    getVisibleSlots();


  /*
    件数
  */

  availableCount.textContent =
    state.data.available_count ?? 0;


  waitingCount.textContent =
    state.data.waiting_count ?? 0;


  /*
    一覧初期化
  */

  results.innerHTML =
    "";


  emptyState.classList.toggle(

    "hidden",

    slots.length > 0

  );


  /*
    日付単位でグループ化
  */

  const groups =
    new Map();


  for (
    const slot
    of slots
  ) {

    const key =

      `${slot.date}|${slot.weekday || ""}`;


    if (
      !groups.has(key)
    ) {

      groups.set(
        key,
        []
      );

    }


    groups
      .get(key)
      .push(slot);

  }


  /*
    描画
  */

  for (
    const [key, daySlots]
    of groups
  ) {

    const [
      date,
      weekday
    ] =
      key.split("|");


    const group =
      document.createElement(
        "section"
      );


    group.className =
      "day-group";


    /*
      日付
    */

    const title =
      document.createElement(
        "h2"
      );


    title.className =
      "day-title";


    /*
      2026-09-20
      ↓
      09/20
    */

    const compactDate =
      date

        .replace(
          /^\d{4}-/,
          ""
        )

        .replace(
          "-",
          "/"
        );


    title.textContent =

      weekday

        ? `${compactDate}（${weekday}）`

        : compactDate;


    /*
      一覧
    */

    const table =
      document.createElement(
        "div"
      );


    table.className =
      "slot-table";


    for (
      const slot
      of daySlots
    ) {

      table.appendChild(
        makeRow(slot)
      );

    }


    group.appendChild(
      title
    );


    group.appendChild(
      table
    );


    results.appendChild(
      group
    );

  }

}


/* =========================================================
   JSON取得
   ========================================================= */

async function loadData() {

  updatedAt.textContent =
    "取得中...";


  try {

    /*
      ?t= を付けて
      GitHub Pages / ブラウザキャッシュ回避
    */

    const response =
      await fetch(

        `${DATA_URL}?t=${Date.now()}`,

        {
          cache: "no-store",
        }

      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    state.data =
      await response.json();


    updatedAt.textContent =

      `更新 ${

        state.data.updated_at_display

        ||

        state.data.updated_at

      }`;


    setupConditionFilter();


    renderWarnings();


    render();


  }

  catch (error) {

    updatedAt.textContent =
      "取得失敗";


    warningBox.classList.remove(
      "hidden"
    );


    warningBox.textContent =
      `⚠ ${error}`;

  }

}


/* =========================================================
   空き / 開放待ち ON・OFF
   ========================================================= */

document

  .querySelectorAll(
    ".status-tab"
  )

  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const status =
            button.dataset.status;


          /*
            空き
          */

          if (
            status === "available"
          ) {

            state.showAvailable =
              !state.showAvailable;


            button.classList.toggle(

              "active",

              state.showAvailable

            );

          }


          /*
            開放待ち
          */

          if (
            status === "waiting"
          ) {

            state.showWaiting =
              !state.showWaiting;


            button.classList.toggle(

              "active",

              state.showWaiting

            );

          }


          render();

        }
      );

    }
  );


/* =========================================================
   フィルター
   ========================================================= */

conditionFilter.addEventListener(
  "change",
  render
);


sourceFilter.addEventListener(
  "change",
  render
);


/* =========================================================
   更新
   ========================================================= */

document

  .getElementById(
    "reloadButton"
  )

  .addEventListener(
    "click",
    loadData
  );


/* =========================================================
   初回ロード
   ========================================================= */

loadData();
