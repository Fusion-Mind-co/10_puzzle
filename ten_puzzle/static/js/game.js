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
  availableNumbers: [],
  selectedFirstNumber: null,
  selectedFirstIndex: null,
  selectedOperator: null,
  phase: 1,
};

// 現在の問題データ(テンプレートから取得)
let currentProblemData = {
  id: data.id,
  number1: data.number1,
  number2: data.number2,
  number3: data.number3,
  number4: data.number4,
};

// ローカルストレージのキー
const STORAGE_KEY = `game_state_${currentProblemData.id}`;

// ページ読み込み時
window.onload = function () {
  console.log("ページが読み込まれました！");
  
  // ローカルストレージから状態を復元
  loadGameState();
};

// 初期化
function initGame() {
  const numberButtons = document.querySelectorAll(".btn-number");
  gameState.availableNumbers = Array.from(numberButtons).map((btn) =>
    parseFloat(btn.textContent.trim())
  );

  console.log("ゲーム初期化:", gameState.availableNumbers);
  setupEventListeners();
  
  // 初期状態を保存
  saveGameState();
}

// ゲーム状態をローカルストレージに保存
function saveGameState() {
  const stateToSave = {
    availableNumbers: gameState.availableNumbers,
    phase: gameState.phase,
    timestamp: new Date().getTime()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  console.log("ゲーム状態を保存:", stateToSave);
}

// ゲーム状態をローカルストレージから復元
function loadGameState() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      console.log("保存された状態を復元:", state);
      
      // 状態を復元
      gameState.availableNumbers = state.availableNumbers;
      gameState.phase = state.phase;
      
      // ボタンを再描画
      renderButtons();
      setupEventListeners();
      updateStatusMessage("数字を選んで計算しよう！");
      
      // 最終フェーズかチェック
      if (gameState.availableNumbers.length === 1) {
        checkGameResult();
      }
      
    } catch (e) {
      console.error("状態の復元に失敗:", e);
      initGame();
    }
  } else {
    // 保存された状態がない場合は初期化
    console.log("保存された状態がないため、初期化します");
    initGame();
  }
}

// ゲーム状態をクリア
function clearGameState() {
  localStorage.removeItem(STORAGE_KEY);
  console.log("ゲーム状態をクリア");
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
  
  // スキップボタン
  document.querySelector(".btn-skip").addEventListener("click", skipProblem);
}

// 数字ボタンクリック処理
function handleNumberClick(button) {
  const clickedNumber = parseFloat(button.textContent.trim());
  const clickedIndex = Array.from(
    document.querySelectorAll(".btn-number")
  ).indexOf(button);

  if (gameState.selectedOperator === null) {
    if (gameState.selectedFirstIndex === clickedIndex) {
      gameState.selectedFirstNumber = null;
      gameState.selectedFirstIndex = null;
      button.classList.remove("selected");
      updateStatusMessage("数字を選んで計算しよう！");
      console.log("数字の選択を解除");
      return;
    }

    gameState.selectedFirstNumber = clickedNumber;
    gameState.selectedFirstIndex = clickedIndex;

    document
      .querySelectorAll(".btn-number")
      .forEach((b) => b.classList.remove("selected"));
    button.classList.add("selected");

    updateStatusMessage("演算子を選んでください");
    console.log("1つ目の数字選択:", clickedNumber);
  } else {
    const secondNumber = clickedNumber;
    const secondIndex = clickedIndex;

    if (gameState.selectedFirstIndex === secondIndex) {
      updateStatusMessage("違う数字を選んでください");
      return;
    }

    console.log("2つ目の数字選択:", secondNumber);
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
  if (gameState.selectedFirstNumber === null) {
    updateStatusMessage("先に数字を選んでください");
    return;
  }

  const clickedOperator = button.textContent.trim();

  if (gameState.selectedOperator === clickedOperator) {
    gameState.selectedOperator = null;
    button.classList.remove("selected");
    updateStatusMessage("演算子を選んでください");
    console.log("演算子の選択を解除");
    return;
  }

  gameState.selectedOperator = clickedOperator;

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

  updateAvailableNumbers(index1, index2, result);
  resetSelection();
  renderButtons();
  gameState.phase++;
  
  // 状態を保存
  saveGameState();

  if (gameState.availableNumbers.length === 1) {
    checkGameResult();
  } else {
    updateStatusMessage("数字を選んで計算しよう！");
  }
}

// 使える数字を更新
function updateAvailableNumbers(index1, index2, result) {
  const indices = [index1, index2].sort((a, b) => b - a);
  indices.forEach((index) => {
    gameState.availableNumbers.splice(index, 1);
  });
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

    const initialNumbers = [
      currentProblemData.number1,
      currentProblemData.number2,
      currentProblemData.number3,
      currentProblemData.number4
    ];

    if (gameState.phase === 1 || initialNumbers.includes(num)) {
      button.classList.add("original");
    } else {
      button.classList.add("result");
    }

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

  if (Math.abs(finalNumber - 10) < 0.0001) {
    showClearAnimation();
    stageClear();
  } else {
    showFailAnimation();
  }
}


// stage_clearのfetch部分を修正
function stageClear() {
  console.log("stageClear関数実行");
  
  fetch("/stage_clear/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    },
    body: JSON.stringify({ data_id: currentProblemData.id }),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      
      if (result.status === 'success') {
        clearGameState();
        setTimeout(() => {
          location.reload();
        }, 2000);
      } else if (result.status === 'all_cleared') {
        // 全クリ演出
        updateStatusMessage(result.message);
        clearGameState();
        
        setTimeout(() => {
          location.href = "/game/";  // all_cleared.htmlへ
        }, 3000);
      }
    })
    .catch((error) => console.error(error));
}

// スキップ処理
function skipProblem() {
  if (!confirm("この問題をスキップしますか?")) {
    return;
  }
  
  console.log("スキップ処理実行");
  
  fetch("/skip_problem/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    },
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      
      if (result.status === 'success') {
        // ローカルストレージをクリア
        clearGameState();
        
        // 次の問題へ
        location.reload();
      }
    })
    .catch((error) => console.error(error));
}

// クリア演出
function showClearAnimation() {
  updateStatusMessage("🎉 クリア！おめでとうございます！ 🎉");
  document.querySelector(".status-message").style.background = "#d4edda";
  document.querySelector(".status-message").style.color = "#155724";
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
  if (!confirm("ゲームをリセットしますか?")) {
    return;
  }
  
  // ローカルストレージをクリア
  clearGameState();
  
  // ページをリロード
  location.reload();
}

// ステータスメッセージ更新
function updateStatusMessage(message) {
  const statusElement = document.querySelector(".status-message");
  statusElement.textContent = message;
  statusElement.style.background = "#e7f3ff";
  statusElement.style.color = "#0066cc";
}

// ページ読み込み時に初期化は不要(window.onloadで処理)
// document.addEventListener("DOMContentLoaded", initGame);