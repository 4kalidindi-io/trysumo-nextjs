export default class Obstacle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.passed = false;
  }

  update(dt, speed) {
    this.x -= speed * dt;
  }

  getBounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ef476f';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.restore();
  }
}
