import Player from './player.js';
import Obstacle from './obstacle.js';

export default class GameManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width = canvas.clientWidth;
    this.height = canvas.height = canvas.clientHeight;

    this.player = new Player(120, this.height / 2);
    this.obstacles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.2; // seconds
    this.speed = 220; // horizontal scroll speed px/s
    this.distance = 0;
    this.gameOver = false;
    this.bgGradient = null;
  }

  resize() {
    this.width = this.canvas.width = this.canvas.clientWidth;
    this.height = this.canvas.height = this.canvas.clientHeight;
    // create background gradient
    const g = this.ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, '#071028');
    g.addColorStop(1, '#021018');
    this.bgGradient = g;
  }

  reset() {
    this.player = new Player(120, this.height / 2);
    this.obstacles = [];
    this.spawnTimer = 0;
    this.distance = 0;
    this.gameOver = false;
  }

  update(dt, input) {
    if (this.gameOver) return;
    this.player.update(dt, input);
    // clamp player vertically
    const pad = 10;
    this.player.y = Math.max(pad + this.player.size, Math.min(this.height - pad - this.player.size, this.player.y));

    // spawn obstacles
    this.spawnTimer += dt;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      this.addObstacle();
      // small random variation
      this.spawnInterval = 0.9 + Math.random() * 1.0;
    }

    // update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.update(dt, this.speed);
      if (o.x + o.w < -50) this.obstacles.splice(i, 1);
    }

    // distance/score
    this.distance += this.speed * dt;

    // collision check (simple AABB with player's bounding box)
    const pb = this.player.getBounds();
    for (const o of this.obstacles) {
      const ob = o.getBounds();
      if (this.aabbIntersect(pb, ob)) {
        this.gameOver = true;
      }
    }
  }

  aabbIntersect(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
  }

  addObstacle() {
    // create a gap that the ship must pass through
    const gap = 110; // vertical gap size
    const minH = 40;
    const topH = minH + Math.random() * (this.height - gap - minH * 2);
    const bottomY = topH + gap;
    const w = 36 + Math.random() * 18;
    const x = this.width + 20;
    // top obstacle
    this.obstacles.push(new Obstacle(x, 0, w, topH));
    // bottom obstacle
    this.obstacles.push(new Obstacle(x, bottomY, w, this.height - bottomY));
  }

  draw() {
    const ctx = this.ctx;
    // background
    ctx.fillStyle = this.bgGradient || '#071028';
    ctx.fillRect(0, 0, this.width, this.height);

    // stars simple (parallax)
    ctx.fillStyle = '#0ea5e9';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 73) % (this.width + 200) - 100;
      const sy = ((i * 137) % this.height);
      const ox = (sx + (this.distance * 0.04 * (1 + (i % 3)))) % (this.width + 200);
      ctx.fillRect(ox - 40, sy, 2, 2);
    }

    // obstacles
    for (const o of this.obstacles) o.draw(ctx);

    // subtle glow under player
    ctx.save();
    ctx.fillStyle = 'rgba(255,209,102,0.07)';
    const pb = this.player.getBounds();
    ctx.beginPath();
    ctx.ellipse(this.player.x + 2, this.player.y + this.player.size + 8, this.player.size * 1.6, this.player.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.player.draw(ctx);

    // HUD
    ctx.fillStyle = '#e6edf3';
    ctx.font = '18px sans-serif';
    ctx.fillText('Distance: ' + Math.floor(this.distance) + 'm', 14, 26);

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, this.height / 2 - 60, this.width, 120);
      ctx.fillStyle = '#fff';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('You Died — Click or press R to restart', this.width / 2, this.height / 2);
      ctx.textAlign = 'left';
    }
  }
}
