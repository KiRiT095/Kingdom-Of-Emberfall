(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.NPC = class extends KOE.Entity {
    constructor(game, def) {
      const first = def.schedule[0];
      super(game, {
        id: def.id,
        name: def.name,
        x: first.x * KOE.TILE + 16,
        y: first.y * KOE.TILE + 16,
        sprite: def.sprite,
        radius: 12,
        health: 999
      });
      this.def = def;
      this.role = def.role;
      this.action = "";
      this.target = { x: this.x, y: this.y };
      this.wanderTimer = Math.random() * 2;
    }

    update(dt) {
      const schedule = this.currentSchedule();
      this.action = schedule.action;
      if (schedule.region !== this.game.world.region.id) return;
      const tx = schedule.x * KOE.TILE + 16;
      const ty = schedule.y * KOE.TILE + 16;
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2.5 + Math.random() * 4;
        const weatherPush = this.game.weather.current === "Rain" || this.game.weather.current === "Thunderstorm" ? 0.35 : 1;
        this.target = {
          x: tx + (Math.random() - 0.5) * 80 * weatherPush,
          y: ty + (Math.random() - 0.5) * 80 * weatherPush
        };
      }
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        const speed = schedule.action === "sleep" ? 0 : 44;
        this.vx += dx / dist * speed * 4 * dt;
        this.vy += dy / dist * speed * 4 * dt;
        const current = Math.hypot(this.vx, this.vy);
        if (current > speed) {
          this.vx = this.vx / current * speed;
          this.vy = this.vy / current * speed;
        }
      } else {
        this.vx *= Math.pow(0.03, dt);
        this.vy *= Math.pow(0.03, dt);
      }
      super.update(dt);
    }

    currentSchedule() {
      const hour = this.game.clock.hour;
      return this.def.schedule.find((entry) => hour >= entry.from && hour < entry.to) || this.def.schedule[0];
    }

    availableInRegion(regionId) {
      return this.currentSchedule().region === regionId;
    }

    interact() {
      this.game.dialogue.npc(Object.assign({}, this.def, { action: this.action }));
    }

    draw(ctx) {
      if (!this.availableInRegion(this.game.world.region.id)) return;
      super.draw(ctx);
      if (KOE.dist(this, this.game.player) < 72) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        const text = this.name;
        const w = ctx.measureText(text).width + 10;
        ctx.fillRect(this.x - w / 2, this.y - 54, w, 17);
        ctx.fillStyle = "#f7ead4";
        ctx.fillText(text, this.x - w / 2 + 5, this.y - 42);
      }
    }
  };
}());
