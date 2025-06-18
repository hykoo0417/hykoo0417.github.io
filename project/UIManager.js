export class UIManager {
    constructor() {
        // 💰 돈 표시
        this.moneyText = document.createElement('div');
        Object.assign(this.moneyText.style, {
            position: 'fixed',
            top: '20px',
            left: '20px',
            padding: '8px 14px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: '"NeoDunggeunmo", sans-serif',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            border: '2px solid #fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
            zIndex: '1002',
        });
        document.body.appendChild(this.moneyText);

        // ⏱ 타임바 컨테이너
        this.timeBarContainer = document.createElement('div');
        Object.assign(this.timeBarContainer.style, {
            position: 'fixed',
            top: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            height: '16px',
            background: 'rgba(20, 20, 20, 0.7)',
            borderRadius: '8px',
            border: '1px solid #444',
            overflow: 'hidden',
            boxShadow: '0 0 6px rgba(0,0,0,0.6)',
            zIndex: '1000',
        });
        document.body.appendChild(this.timeBarContainer);

        // 🎯 이벤트 및 경고 오버레이
        this._createEventOverlay(50, 50, 'rgba(255, 50, 50, 0.3)', '1px solid #aa0000');   // 이벤트
        this._createEventOverlay(45, 5, 'rgba(255, 255, 0, 0.3)', '1px solid #aaaa00');    // 경고

        // 진행 바
        this.timeBar = document.createElement('div');
        Object.assign(this.timeBar.style, {
            height: '100%',
            width: '0.1%',  // 초기에도 보이도록 최소 너비
            background: 'linear-gradient(90deg, #00ff88, #00ccff)',
            position: 'absolute',
            left: '0',
            top: '0',
            borderRadius: '8px 0 0 8px',
            transition: 'width 0.2s ease-in-out',
            zIndex: '1001',
        });
        this.timeBarContainer.appendChild(this.timeBar);

        // 🐔 배고픔 UI
        this.hungerTooltip = document.createElement('div');
        Object.assign(this.hungerTooltip.style, {
            position: 'fixed',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            fontSize: '13px',
            fontFamily: '"NeoDunggeunmo", sans-serif',
            borderRadius: '6px',
            pointerEvents: 'none',
            zIndex: '1003',
            display: 'none',
        });
        document.body.appendChild(this.hungerTooltip);
    }

    _createEventOverlay(startSec, durationSec, color, border) {
        const totalTime = 100;
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'absolute',
            left: `${(startSec / totalTime) * 100}%`,
            width: `${(durationSec / totalTime) * 100}%`,
            height: '100%',
            background: color,
            borderRight: border,
            zIndex: '1000',
            pointerEvents: 'none',
        });
        this.timeBarContainer.appendChild(overlay);
    }

    updateTimeBar(timeLeft) {
        const totalTime = 100;
        const progress = ((totalTime - timeLeft) / totalTime) * 100;
        this.timeBar.style.width = `${progress}%`;
    }

    updateMoney(money) {
        this.moneyText.textContent = `💰 ${money}`;
    }

    updateHoverHunger3D(hunger, x, y) {
        if (!this.hungerTooltip) return;
        if (hunger === null) {
            this.hungerTooltip.style.display = 'none';
        } else {
            const intHunger = Math.floor(hunger);
            this.hungerTooltip.textContent = `🍗 배고픔: ${intHunger}`;
            this.hungerTooltip.style.left = `${x}px`;
            this.hungerTooltip.style.top = `${y - 30}px`;
            this.hungerTooltip.style.display = 'block';
        }
    }

    showimagePopup(imageSrc, message) {
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '20%';
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        popup.style.background = '#fff8dc';
        popup.style.border = '2px solid #ff9900';
        popup.style.padding = '20px';
        popup.style.borderRadius = '12px';
        popup.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        popup.style.zIndex = '1000';
        popup.style.maxWidth = '400px';
        popup.style.textAlign = 'center';
        popup.innerHTML = `
            <img src="${imageSrc}" alt="경고 이미지" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">
            <div style="font-size: 18px; font-weight: bold;">${message}</div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.remove();
        }, 4000);
    }

    showWarningPopup(message) {
        const popup = document.createElement('div');
        popup.textContent = message;
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px 30px',
            background: 'rgba(255, 255, 0, 0.9)',
            color: '#000',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: '"NeoDunggeunmo", sans-serif',
            borderRadius: '12px',
            border: '2px solid #aaa',
            zIndex: '2000',
            boxShadow: '0 0 12px rgba(255, 255, 0, 0.7)',
            pointerEvents: 'none',
        });
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.remove();
        }, 5000);
    }

    showGameOver(chickenCount) {
        this.showimagePopup('assets/gameover.png', `💀 게임 종료! 닭 ${chickenCount}마리 보유`);
    }
}
