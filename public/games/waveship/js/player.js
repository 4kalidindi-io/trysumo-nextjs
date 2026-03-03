export default class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 18; // triangle half-size
    this.vy = 0;
    this.targetVy = 0;
    this.maxSpeed = 180; // px/s (vertical drift speed)
    this.smooth = 10; // smoothing for velocity
    // small visual bob (doesn't affect collision)
    this.phase = 0;
    this.phaseSpeed = 10;
    this.bobAmp = 6;
  }

  update(dt, input) {
    // input: boolean holdUp -> drift up when true, down when false
    this.targetVy = input ? -this.maxSpeed : this.maxSpeed;
    // smooth velocity toward target
    this.vy += (this.targetVy - this.vy) * Math.min(1, this.smooth * dt);
    this.y += this.vy * dt;
    // advance visual phase
    this.phase += this.phaseSpeed * dt;
  }

  getBounds() {
    // bounding box for simple collision
    return {
      x: this.x - this.size,
      y: this.y - this.size,
      w: this.size * 2,
      h: this.size * 2,
    };
  }

  getVertices() {
    // upward-pointing triangle centered at (x,y)
    const drawY = this.y + Math.sin(this.phase) * this.bobAmp * 0.8; // visual bob
    return [
      { x: this.x + this.size, y: drawY },
      { x: this.x - this.size, y: drawY - this.size },
      { x: this.x - this.size, y: drawY + this.size },
    ];
  }

  draw(ctx) {
    const v = this.getVertices();
    // white shadow / glow beneath when moving
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(v[0].x + 6, v[0].y + 6);
    ctx.lineTo(v[1].x + 6, v[1].y + 6);
    ctx.lineTo(v[2].x + 6, v[2].y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(v[0].x, v[0].y);
    ctx.lineTo(v[1].x, v[1].y);
    ctx.lineTo(v[2].x, v[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
