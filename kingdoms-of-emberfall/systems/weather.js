(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.WeatherSystem = class {
    constructor(game) {
      this.game = game;
      this.current = "Clear";
      this.intensity = 0;
      this.particles = [];
      this.ambient = [];
      this.thunderTimer = 8;
      this.rollDaily();
    }

    rollDaily() {
      const rng = KOE.mulberry32(KOE.hash(`weather-${this.game ? this.game.clock.day : 1}`));
      const roll = rng();
      this.current = roll < 0.48 ? "Clear" : roll < 0.7 ? "Rain" : roll < 0.88 ? "Fog" : "Thunderstorm";
      this.intensity = this.current === "Clear" ? 0 : this.current === "Fog" ? 0.5 : this.current === "Rain" ? 0.72 : 1;
      this.particles = [];
      this.thunderTimer = 4 + rng() * 9;
    }

    update(dt, canvas) {
      const regionId = this.game.world.region.id;
      if (this.current === "Rain" || this.current === "Thunderstorm") {
        const target = this.current === "Thunderstorm" ? 160 : 90;
        while (this.particles.length < target) {
          this.particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, v: 500 + Math.random() * 260 });
        }
        for (const drop of this.particles) {
          drop.x -= dt * 120;
          drop.y += dt * drop.v;
          if (drop.y > canvas.height + 20) {
            drop.y = -20;
            drop.x = Math.random() * canvas.width;
          }
          if (drop.x < -20) drop.x = canvas.width + 20;
        }
      } else {
        this.particles.length = 0;
      }

      const ambientTarget = regionId === "forest" ? 28
        : regionId === "swamp" ? 32
          : regionId === "mountains" ? 24
            : regionId === "ruins" || regionId === "citadel" ? 26
              : 16;
      while (this.ambient.length < ambientTarget) {
        this.ambient.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: -12 + Math.random() * 24,
          vy: -8 + Math.random() * 16,
          life: 2 + Math.random() * 5,
          size: 1 + Math.random() * 3,
          tw: Math.random() * 10
        });
      }
      for (const p of this.ambient) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.tw += dt * 3.1;
        if (p.x < -20) p.x = canvas.width + 10;
        if (p.x > canvas.width + 20) p.x = -10;
        if (p.y < -20) p.y = canvas.height + 10;
        if (p.y > canvas.height + 20) p.y = -10;
        if (p.life <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 2 + Math.random() * 5;
        }
      }

      if (this.current === "Thunderstorm") {
        this.thunderTimer -= dt;
        if (this.thunderTimer <= 0) {
          this.thunderTimer = 6 + Math.random() * 13;
          this.game.camera.flash = 1;
          this.game.camera.shake = Math.max(this.game.camera.shake, 0.22);
          this.game.audio.sfx("thunder");
        }
      }
    }

    drawOverlay(ctx, canvas, clock) {
      const regionId = this.game.world.region.id;
      const hour = clock.hour + (clock.minute % 60) / 60;
      let night = 0;
      if (hour < 6) night = (6 - hour) / 6;
      else if (hour > 18) night = (hour - 18) / 6;
      const trinket = this.game.inventory.equipment.trinket;
      const lantern = trinket && KOE.ITEMS[trinket] && KOE.ITEMS[trinket].nightLantern;
      const nightCap = lantern ? 0.52 : 0.9;
      night = KOE.clamp(night, 0, nightCap);
      if (night > 0) {
        ctx.fillStyle = `rgba(14, 21, 45, ${night})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      // Lightweight biome identity tinting.
      if (regionId === "forest") {
        ctx.fillStyle = "rgba(66, 104, 72, 0.11)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (regionId === "swamp") {
        ctx.fillStyle = "rgba(94, 120, 64, 0.14)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (regionId === "mountains") {
        ctx.fillStyle = "rgba(156, 194, 236, 0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (regionId === "citadel" || regionId === "ruins") {
        ctx.fillStyle = "rgba(124, 52, 38, 0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (night > 0.35 && lantern) {
        const px = this.game.player.x - this.game.camera.x;
        const py = this.game.player.y - this.game.camera.y;
        const grd = ctx.createRadialGradient(px, py, 40, px, py, 220 + night * 80);
        grd.addColorStop(0, "rgba(255, 230, 190, 0.14)");
        grd.addColorStop(1, "rgba(255, 230, 190, 0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (regionId === "forest") {
        ctx.globalAlpha = 0.14;
        for (let i = 0; i < 4; i += 1) {
          const x = ((clock.minute * 3 + i * 220) % (canvas.width + 240)) - 120;
          const grad = ctx.createLinearGradient(x, 0, x + 120, canvas.height);
          grad.addColorStop(0, "rgba(180, 220, 150, 0.28)");
          grad.addColorStop(1, "rgba(180, 220, 150, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(x, 0, 120, canvas.height);
        }
        ctx.globalAlpha = 1;
      }
      if (this.current === "Fog") {
        ctx.fillStyle = "rgba(190, 199, 188, 0.18)";
        for (let i = 0; i < 8; i += 1) {
          const y = (i * 120 + clock.minute * 0.9) % (canvas.height + 180) - 90;
          ctx.fillRect(0, y, canvas.width, 40);
        }
      }
      if (this.current === "Rain" || this.current === "Thunderstorm") {
        ctx.strokeStyle = this.current === "Thunderstorm" ? "rgba(170, 205, 255, 0.55)" : "rgba(150, 190, 225, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const drop of this.particles) {
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 8, drop.y + 15);
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(20, 25, 34, 0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      // Ambient lightweight particles per biome.
      for (const p of this.ambient) {
        const a = 0.2 + Math.sin(p.tw) * 0.15;
        if (regionId === "forest") ctx.fillStyle = `rgba(134, 202, 124, ${a})`;
        else if (regionId === "swamp") ctx.fillStyle = `rgba(188, 210, 90, ${a * 0.8})`;
        else if (regionId === "mountains") ctx.fillStyle = `rgba(225, 240, 255, ${a * 0.9})`;
        else if (regionId === "citadel" || regionId === "ruins") ctx.fillStyle = `rgba(255, 146, 96, ${a * 0.85})`;
        else ctx.fillStyle = `rgba(240, 230, 200, ${a * 0.65})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      if (regionId === "swamp") {
        ctx.fillStyle = "rgba(36, 64, 54, 0.1)";
        for (let i = 0; i < 6; i += 1) {
          const y = (i * 90 + clock.minute * 1.8) % (canvas.height + 120) - 40;
          ctx.fillRect(0, y, canvas.width, 18);
        }
      }
      if (regionId === "citadel") {
        ctx.fillStyle = "rgba(255, 96, 48, 0.06)";
        ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
      }
      if (this.game.camera.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${this.game.camera.flash * 0.35})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    serialize() {
      return { current: this.current, intensity: this.intensity, thunderTimer: this.thunderTimer };
    }

    restore(data) {
      if (!data) {
        this.rollDaily();
        return;
      }
      this.current = data.current || "Clear";
      this.intensity = data.intensity || 0;
      this.thunderTimer = data.thunderTimer || 8;
    }
  };
}());
