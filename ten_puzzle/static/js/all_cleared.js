// static/js/all_cleared.js

console.log("all_cleared.js読み込み開始");

window.onload = function() {
    console.log("window.onload実行");
    createConfetti();
    createStars();
    launchFireworks();
    playVictorySound();
};

// 紙吹雪
function createConfetti() {
    console.log("紙吹雪作成開始");
    const container = document.querySelector('.confetti');
    if (!container) {
        console.error("confettiコンテナが見つかりません");
        return;
    }
    
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
    console.log("紙吹雪150個作成完了");
}

// 星キラキラ
function createStars() {
    console.log("星作成開始");
    const container = document.querySelector('.stars');
    if (!container) {
        console.error("starsコンテナが見つかりません");
        return;
    }
    
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
    console.log("星30個作成完了");
}

// 花火
function launchFireworks() {
    console.log("花火開始");
    const container = document.querySelector('.fireworks');
    if (!container) {
        console.error("fireworksコンテナが見つかりません");
        return;
    }
    
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
        if (count >= 20) {
            clearInterval(interval);
        }
    }, 500);
    
    console.log("花火20発発射完了");
}

// 効果音
function playVictorySound() {
    console.log("効果音再生試行");
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
        console.log("効果音再生成功");
    } catch (e) {
        console.error("効果音再生失敗:", e);
    }
}

console.log("all_cleared.js読み込み完了");