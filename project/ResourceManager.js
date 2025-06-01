// 재화와 게임 시간을 관리하는 class

export class ResourceManager {
  constructor() {
    this.money = 0;
    this.timer = 0;
    this.moneyRate = 1;       // 초당 1원 증가
  }

  update(deltaTime) {
    this.money += this.moneyRate * deltaTime;
    this.timer += deltaTime;
  }

  spend(amount) {
    if (this.money >= amount) {
      this.money -= amount;
      return true;
    }
    return false;
  }

  getMoney() {
    return Math.floor(this.money);
  }

  getTime() {
    return Math.floor(this.timer);
  }
}