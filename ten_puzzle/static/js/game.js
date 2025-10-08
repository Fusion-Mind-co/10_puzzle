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
      
      gameState.availableNumbers = state.availableNumbers;
      gameState.phase = state.phase;
      
      renderButtons();
      setupEventListeners();
      updateStatusMessage("数字を選んで計算しよう！");
      
      if (gameState.availableNumbers.length === 1) {
        checkGameResult();
      }
      
    } catch (e) {
      console.error("状態の復元に失敗:", e);
      initGame();
    }
  } else {
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
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-number")) {
      handleNumberClick(e.target);
    }
  });

  document.querySelectorAll(".btn-operator").forEach((btn) => {
    btn.addEventListener("click", function () {
      handleOperatorClick(this);
    });
  });

  document.querySelector(".btn-reset").addEventListener("click", resetGame);
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

// ステージクリアを記録
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
        updateStatusMessage(result.message);
        clearGameState();
        
        setTimeout(() => {
          showAllClearedPage();
        }, 2000);
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
        clearGameState();
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
  
  clearGameState();
  location.reload();
}

// ステータスメッセージ更新
function updateStatusMessage(message) {
  const statusElement = document.querySelector(".status-message");
  statusElement.textContent = message;
  statusElement.style.background = "#e7f3ff";
  statusElement.style.color = "#0066cc";
}

// 全クリページを表示
function showAllClearedPage() {
  document.body.innerHTML = `
    <div class="confetti"></div>
    <div class="fireworks"></div>
    <div class="stars"></div>
    
    <div class="all-cleared-container">
        <div class="all-cleared-content">
            <h1 class="all-cleared-title">🎊 全問クリア！ 🎊</h1>
            <div class="all-cleared-count">達成おめでとう！</div>
            <p class="celebration-message">おめでとうございます！🎉</p>
            <div class="all-cleared-buttons">
                <a href="/game/" class="btn-next-round">次の周回へ 🚀</a>
                <a href="/logout/" class="btn-logout">ログアウト</a>
            </div>
        </div>
    </div>
    
    <style>
        body { margin: 0; overflow: hidden; }
        .all-cleared-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 20px; position: relative; }
        .confetti { position: fixed; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; z-index: 1; }
        .confetti-piece { position: absolute; width: 10px; height: 10px; animation: fall linear infinite; }
        @keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
        .fireworks { position: fixed; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; z-index: 2; }
        .firework { position: absolute; width: 4px; height: 4px; border-radius: 50%; animation: explode 1.5s ease-out forwards; }
        @keyframes explode { 0% { transform: translate(0, 0); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)); opacity: 0; } }
        .stars { position: fixed; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; z-index: 1; }
        .star { position: absolute; color: white; font-size: 20px; animation: twinkle 2s ease-in-out infinite; }
        @keyframes twinkle { 0%, 100% { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1); } }
        .all-cleared-content { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(20px); border-radius: 30px; padding: 60px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); position: relative; z-index: 3; animation: bounceIn 0.8s ease-out; }
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }
        .all-cleared-title { font-size: 64px; margin-bottom: 30px; font-weight: 900; text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); animation: glow 2s ease-in-out infinite; }
        @keyframes glow { 0%, 100% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 215, 0, 0.5); } 50% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 50px rgba(255, 215, 0, 0.8); } }
        .all-cleared-count { font-size: 48px; font-weight: bold; margin: 30px 0; padding: 20px 40px; background: rgba(255, 215, 0, 0.3); border-radius: 20px; display: inline-block; border: 3px solid rgba(255, 215, 0, 0.5); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); } 50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); } }
        .celebration-message { font-size: 24px; margin: 20px 0; }
        .all-cleared-buttons { display: flex; gap: 20px; margin-top: 40px; flex-wrap: wrap; justify-content: center; }
        .btn-next-round, .btn-logout { padding: 18px 45px; font-size: 20px; font-weight: bold; text-decoration: none; border-radius: 50px; transition: all 0.3s ease; display: inline-block; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); }
        .btn-next-round { background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #333; }
        .btn-next-round:hover { transform: translateY(-5px) scale(1.05); box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5); }
        .btn-logout { background: rgba(255, 255, 255, 0.2); color: white; border: 3px solid white; }
        .btn-logout:hover { background: rgba(255, 255, 255, 0.3); transform: translateY(-5px); }
    </style>
  `;
  
  createConfetti();
  createStars();
  launchFireworks();
  playVictorySound();
}

function createConfetti() {
    const container = document.querySelector('.confetti');
    if (!container) return;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#ffd700', '#ff69b4', '#00d2ff'];
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = Math.random() * -50 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 3) + 's';
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        container.appendChild(confetti);
    }
}

function createStars() {
    const container = document.querySelector('.stars');
    if (!container) return;
    const starSymbols = ['⭐', '✨', '💫', '🌟'];
    for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.textContent = starSymbols[Math.floor(Math.random() * starSymbols.length)];
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        star.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(star);
    }
}

function launchFireworks() {
    const container = document.querySelector('.fireworks');
    if (!container) return;
    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff', '#ff69b4'];
    function createFirework() {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = color;
            const angle = (Math.PI * 2 * i) / 30;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
    }
    createFirework();
    let count = 0;
    const interval = setInterval(() => {
        createFirework();
        count++;
        if (count >= 20) clearInterval(interval);
    }, 500);
}

function playVictorySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            const startTime = audioContext.currentTime + index * 0.2;
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
    } catch (e) {}
}