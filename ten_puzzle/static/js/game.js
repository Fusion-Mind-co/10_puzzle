// セキュリティ上必須なおまじないコード
function getCSRFToken() {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// ゲーム状態管理
let gameState = {
  availableNumbers: [], // 使える数字の配列
  selectedFirstNumber: null, // 1つ目に選択した数字
  selectedFirstIndex: null, // 1つ目に選択した数字のインデックス
  selectedOperator: null, // 選択した演算子
  phase: 1, // 現在のフェーズ（1〜4）
};

// 初期化
function initGame() {
  // テンプレートから初期の数字を取得
  const numberButtons = document.querySelectorAll(".btn-number");
  gameState.availableNumbers = Array.from(numberButtons).map((btn) =>
    parseFloat(btn.textContent.trim())
  );

  console.log("ゲーム初期化:", gameState.availableNumbers);

  // イベントリスナー設定
  setupEventListeners();
}

// イベントリスナー設定
function setupEventListeners() {
  // 数字ボタンのクリック
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-number")) {
      handleNumberClick(e.target);
    }
  });

  // 演算子ボタンのクリック
  document.querySelectorAll(".btn-operator").forEach((btn) => {
    btn.addEventListener("click", function () {
      handleOperatorClick(this);
    });
  });

  // リセットボタン
  document.querySelector(".btn-reset").addEventListener("click", resetGame);
}

// 数字ボタンクリック処理
function handleNumberClick(button) {
  const clickedNumber = parseFloat(button.textContent.trim());
  const clickedIndex = Array.from(
    document.querySelectorAll(".btn-number")
  ).indexOf(button);

  // 1つ目の数字選択（または選択し直し）
  if (gameState.selectedOperator === null) {
    // 同じボタンをクリックした場合は選択解除
    if (gameState.selectedFirstIndex === clickedIndex) {
      gameState.selectedFirstNumber = null;
      gameState.selectedFirstIndex = null;
      button.classList.remove("selected");
      updateStatusMessage("数字を選んで計算しよう！");
      console.log("数字の選択を解除");
      return;
    }

    // 別の数字を選択
    gameState.selectedFirstNumber = clickedNumber;
    gameState.selectedFirstIndex = clickedIndex;

    // 選択状態を視覚的に表示
    document
      .querySelectorAll(".btn-number")
      .forEach((b) => b.classList.remove("selected"));
    button.classList.add("selected");

    updateStatusMessage("演算子を選んでください");
    console.log("1つ目の数字選択:", clickedNumber);
  }
  // 2つ目の数字選択（演算子選択後）
  else {
    const secondNumber = clickedNumber;
    const secondIndex = clickedIndex;

    // 同じ数字を選択していないかチェック
    if (gameState.selectedFirstIndex === secondIndex) {
      updateStatusMessage("違う数字を選んでください");
      return;
    }

    console.log("2つ目の数字選択:", secondNumber);

    // 計算実行
    calculate(
      gameState.selectedFirstNumber,
      gameState.selectedOperator,
      secondNumber,
      gameState.selectedFirstIndex,
      secondIndex
    );
  }
}

// 演算子ボタンクリック処理
function handleOperatorClick(button) {
  // 1つ目の数字が選択されていない場合は無効
  if (gameState.selectedFirstNumber === null) {
    updateStatusMessage("先に数字を選んでください");
    return;
  }

  const clickedOperator = button.textContent.trim();

  // 同じ演算子をクリックした場合は選択解除
  if (gameState.selectedOperator === clickedOperator) {
    gameState.selectedOperator = null;
    button.classList.remove("selected");
    updateStatusMessage("演算子を選んでください");
    console.log("演算子の選択を解除");
    return;
  }

  // 別の演算子を選択
  gameState.selectedOperator = clickedOperator;

  // 演算子の選択状態を表示
  document
    .querySelectorAll(".btn-operator")
    .forEach((b) => b.classList.remove("selected"));
  button.classList.add("selected");

  updateStatusMessage("2つ目の数字を選んでください");
  console.log("演算子選択:", gameState.selectedOperator);
}

// 計算実行
function calculate(num1, operator, num2, index1, index2) {
  let result;

  switch (operator) {
    case "+":
      result = num1 + num2;
      break;
    case "−":
    case "-":
      result = num1 - num2;
      break;
    case "×":
    case "*":
      result = num1 * num2;
      break;
    case "÷":
    case "/":
      if (num2 === 0) {
        updateStatusMessage("0で割ることはできません");
        resetSelection();
        return;
      }
      result = num1 / num2;
      break;
  }

  console.log(`計算: ${num1} ${operator} ${num2} = ${result}`);

  // 使用した数字を削除して、結果を追加
  updateAvailableNumbers(index1, index2, result);

  // 選択状態をリセット
  resetSelection();

  // ボタンを再描画
  renderButtons();

  // フェーズを進める
  gameState.phase++;

  // 最終フェーズ（数字が1つになった）かチェック
  if (gameState.availableNumbers.length === 1) {
    checkGameResult();
  } else {
    updateStatusMessage("数字を選んで計算しよう！");
  }
}

// 使える数字を更新
function updateAvailableNumbers(index1, index2, result) {
  // インデックスの大きい方から削除（インデックスのズレを防ぐ）
  const indices = [index1, index2].sort((a, b) => b - a);

  indices.forEach((index) => {
    gameState.availableNumbers.splice(index, 1);
  });

  // 計算結果を追加
  gameState.availableNumbers.push(result);

  console.log("更新後の数字:", gameState.availableNumbers);
}

// ボタンを再描画
function renderButtons() {
  const container = document.querySelector(".number-buttons");
  container.innerHTML = "";

  gameState.availableNumbers.forEach((num, index) => {
    const button = document.createElement("button");
    button.className = "btn-number";

    // 元の数字か計算結果かを判定
    // フェーズ1（4つ）なら全て original
    // それ以降で小数点がある、または元の4つの数字に含まれない場合は result
    const initialNumbers = Array.from(document.querySelectorAll(".btn-number"))
      .slice(0, 4)
      .map((btn) => parseFloat(btn.textContent.trim()));

    if (gameState.phase === 1 || initialNumbers.includes(num)) {
      button.classList.add("original");
    } else {
      button.classList.add("result");
    }

    // 小数点以下が0の場合は整数表示
    button.textContent = num % 1 === 0 ? num.toString() : num.toFixed(2);

    container.appendChild(button);
  });
}

// 選択状態をリセット
function resetSelection() {
  gameState.selectedFirstNumber = null;
  gameState.selectedFirstIndex = null;
  gameState.selectedOperator = null;

  document
    .querySelectorAll(".btn-number")
    .forEach((b) => b.classList.remove("selected"));
  document
    .querySelectorAll(".btn-operator")
    .forEach((b) => b.classList.remove("selected"));
}

// ゲーム結果をチェック
function checkGameResult() {
  const finalNumber = gameState.availableNumbers[0];

  console.log("最終結果:", finalNumber);

  // 10かどうかをチェック（浮動小数点の誤差を考慮）
  if (Math.abs(finalNumber - 10) < 0.0001) {
    showClearAnimation();
    stageClear();
  } else {
    showFailAnimation();
  }
}

// ステージクリアを記録
function stageClear() {
  console.log("stageClear関数実行");
  fetch("stage_clear", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    },
    body: JSON.stringify({ data_id: data.id }),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
    })
    .catch((error) => console.error(error));
}

// クリア演出
function showClearAnimation() {
  updateStatusMessage("🎉 クリア！おめでとうございます！ 🎉");
  document.querySelector(".status-message").style.background = "#d4edda";
  document.querySelector(".status-message").style.color = "#155724";

  // TODO: サーバーにクリア情報を送信
  console.log("クリア！");
}

// 失敗演出
function showFailAnimation() {
  const finalNumber = gameState.availableNumbers[0];
  updateStatusMessage(`😢 残念...結果は ${finalNumber} でした`);
  document.querySelector(".status-message").style.background = "#f8d7da";
  document.querySelector(".status-message").style.color = "#721c24";

  console.log("失敗...");
}

// ゲームリセット
function resetGame() {
  // ページをリロードして新しい問題を取得
  location.reload();
}

// ステータスメッセージ更新
function updateStatusMessage(message) {
  const statusElement = document.querySelector(".status-message");
  statusElement.textContent = message;

  // デフォルトのスタイルに戻す
  statusElement.style.background = "#e7f3ff";
  statusElement.style.color = "#0066cc";
}

// ページ読み込み時に初期化
document.addEventListener("DOMContentLoaded", initGame);
