// static/js/title.js

// ページ読み込み時のアニメーション
window.addEventListener('load', function() {
    // フェードイン効果
    document.querySelector('.title-content').style.animation = 'slideIn 0.8s ease-out';
});

// 背景の数字を動的に追加（オプション）
function addFloatingNumber() {
    const container = document.querySelector('.floating-numbers');
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '−', '×', '÷'];
    const number = document.createElement('span');
    
    number.className = 'number';
    number.textContent = numbers[Math.floor(Math.random() * numbers.length)];
    number.style.left = Math.random() * 100 + '%';
    number.style.animationDuration = (10 + Math.random() * 10) + 's';
    
    container.appendChild(number);
    
    // アニメーション終了後に削除
    setTimeout(() => {
        number.remove();
    }, 15000);
}

// 定期的に数字を追加
setInterval(addFloatingNumber, 2000);