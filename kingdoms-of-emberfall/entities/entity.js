(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.Entity = class {
    constructor(game, data) {
      this.game = game;
      this.id = data.id || `entity_${Math.random().toString(36).slice(2)}`;
      this.name = data.name || "Entity";
      this.x = data.x || 0;
      this.y = data.y || 0;
      this.vx = 0;
      this.vy = 0;
      this.radius = data.radius || 13;
      this.sprite = data.sprite || "villager";
      this.frame = 0;
      this.facing = { x: 0, y: 1 };
      this.flip = false;
      this.dead = false;
      this.invuln = 0;
      this.flash = 0;
      this.telegraph = 0;
      this.health = data.health || 10;
      this.maxHealth = data.maxHealth || this.health;
      this.defense = data.defense || 0;
      this.boss = false;
    }

    update(dt) {
      this.invuln = Math.max(0, this.invuln - dt);
      this.flash = Math.max(0, this.flash - dt);
      if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
        this.facing = this.normalized(this.vx, this.vy);
        this.flip = this.facing.x < -0.05;
      }
      this.move(dt);
      this.frame += dt * (Math.hypot(this.vx, this.vy) > 8 ? 8 : 2);
    }

    normalized(x, y) {
      const len = Math.hypot(x, y) || 1;
      return { x: x / len, y: y / len };
    }

    move(dt) {
      const world = this.game.world;
      let nx = this.x + this.vx * dt;
      let ny = this.y;
      if (!world.collidesCircle(nx, ny, this.radius)) this.x = nx;
      else this.vx *= -0.15;
      nx = this.x;
      ny = this.y + this.vy * dt;
      if (!world.collidesCircle(nx, ny, this.radius)) this.y = ny;
      else this.vy *= -0.15;
    }

    draw(ctx) {
      if (this.telegraph > 0 && !this.dead) {
        const pulse = 0.4 + this.telegraph * 0.55;
        ctx.strokeStyle = `rgba(255, 132, 96, ${pulse})`;
        ctx.lineWidth = this.boss ? 3 : 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 2, this.radius + 9 + (1 - this.telegraph) * (this.boss ? 10 : 6), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (this.flash > 0) {
        ctx.globalAlpha = 0.55 + Math.sin(this.flash * 80) * 0.2;
      }
      this.game.assets.drawSprite(ctx, this.sprite, this.x, this.y, this.frame, this.flip, this.boss ? 1.8 : 1);
      ctx.globalAlpha = 1;
      if (this.health < this.maxHealth) this.drawHealth(ctx);
    }

    drawHealth(ctx) {
      const w = this.boss ? 70 : 34;
      const y = this.y - (this.boss ? 66 : 42);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(this.x - w / 2, y, w, 5);
      ctx.fillStyle = this.boss ? "#ff704d" : "#e85b4d";
      ctx.fillRect(this.x - w / 2, y, w * KOE.clamp(this.health / this.maxHealth, 0, 1), 5);
    }

    die() {
      this.dead = true;
    }
  };
}());
