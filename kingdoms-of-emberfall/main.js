(function () {
  "use strict";

  const KOE = window.KOE;

  class Game {
    constructor() {
      this.canvas = document.getElementById("game");
      this.ctx = this.canvas.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
      this.bus = new KOE.EventBus();
      this.input = new KOE.Input(this.canvas);
      this.assets = new KOE.Assets();
      this.assets.generate();
      this.audio = new KOE.AudioManager();
      this.clock = new KOE.GameClock();
      this.camera = new KOE.Camera();
      this.inventory = new KOE.Inventory(this);
      this.quests = new KOE.QuestManager(this);
      this.weather = new KOE.WeatherSystem(this);
      this.player = new KOE.Player(this);
      this.house = new KOE.HouseSystem(this);
      this.combat = new KOE.CombatManager(this);
      this.guidance = new KOE.GuidanceSystem(this);
      this.dialogue = new KOE.DialogueEngine(this);
      this.economy = new KOE.Economy(this);
      this.world = new KOE.World(this);
      this.save = new KOE.SaveManager(this);
      this.ui = new KOE.UI(this);
      try {
        const raw = localStorage.getItem(KOE.SAVE_KEY);
        if (raw) {
          const meta = JSON.parse(raw);
          if (meta && meta.savedAt) this.save.lastSavedAt = meta.savedAt;
        }
      } catch (e) {
        /* ignore */
      }
      this.running = false;
      this.last = performance.now();
      this.accumulator = 0;
      this.toastEl = document.getElementById("toastLog");
      this.title = document.getElementById("titleScreen");
      this.resize();
      window.addEventListener("resize", () => this.resize());
      document.getElementById("newGame").addEventListener("click", () => this.startNewGame());
      document.getElementById("continueGame").addEventListener("click", () => this.continueGame());
      if (!this.save.exists()) document.getElementById("continueGame").disabled = true;
      requestAnimationFrame((time) => this.loop(time));
    }

    resize() {
      const scale = Math.min(1, window.devicePixelRatio || 1);
      this.canvas.width = Math.floor(window.innerWidth * scale);
      this.canvas.height = Math.floor(window.innerHeight * scale);
      this.ctx.imageSmoothingEnabled = false;
    }

    startNewGame() {
      this.audio.resume();
      this.title.classList.add("hidden");
      this.save.newGame();
      this.running = true;
      this.input.focus();
      this.dialogue.scene(KOE.DIALOGUE.intro);
      this.toast("Welcome to Emberfall.");
    }

    continueGame() {
      this.audio.resume();
      this.title.classList.add("hidden");
      this.save.load();
      this.running = true;
      this.input.focus();
    }

    loop(time) {
      const dt = Math.min(0.05, (time - this.last) / 1000 || 0);
      this.last = time;
      if (this.running) this.update(dt);
      this.draw();
      this.input.endFrame();
      requestAnimationFrame((next) => this.loop(next));
    }

    update(dt) {
      this.audio.resume();
      this.dialogue.update(this.input);
      this.ui.update(this.input);
      const paused = this.dialogue.active || this.ui.menuOpen;
      const combatFrozen = !paused && this.combat.hitStop > 0;
      if (!paused && !combatFrozen) {
        this.clock.update(dt);
        this.player.update(dt);
        this.world.update(dt);
      }
      if (!paused) {
        this.combat.update(dt);
      }
      this.weather.update(dt, this.canvas);
      this.guidance.update(dt);
      this.camera.follow(this.player, this.world, this.canvas, dt);
      this.audio.update(dt, this.combat.combatTimer > 0 || this.world.enemies.some((enemy) => enemy.boss && !enemy.dead && KOE.dist(enemy, this.player) < 420));
      this.save.update(dt);
    }

    draw() {
      const ctx = this.ctx;
      ctx.save();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = "#05070b";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.font = "12px Inter, system-ui, sans-serif";
      ctx.textBaseline = "alphabetic";
      if (this.running) {
        ctx.save();
        this.camera.apply(ctx);
        this.world.draw(ctx, this.camera, this.canvas);
        ctx.restore();
        this.weather.drawOverlay(ctx, this.canvas, this.clock);
        this.drawMoodOverlay(ctx);
        this.drawBossHud(ctx);
        this.drawReticle(ctx);
        if (this.camera.flash > 0) {
          ctx.fillStyle = `rgba(255, 236, 220, ${this.camera.flash * 0.28})`;
          ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
      }
      ctx.restore();
    }

    drawMoodOverlay(ctx) {
      const region = this.world.region.id;
      const danger = this.world.region.danger || 0;
      const vignette = ctx.createRadialGradient(
        this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.25,
        this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.75
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, `rgba(0,0,0,${0.08 + danger * 0.012})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      if (region === "citadel") {
        ctx.fillStyle = "rgba(200, 72, 36, 0.09)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else if (region === "swamp") {
        ctx.fillStyle = "rgba(120, 140, 70, 0.07)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else if (region === "forest") {
        ctx.fillStyle = "rgba(84, 130, 76, 0.05)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else if (region === "mountains") {
        ctx.fillStyle = "rgba(170, 206, 238, 0.06)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    drawBossHud(ctx) {
      const boss = this.world.enemies.find((enemy) => enemy.boss && !enemy.dead && KOE.dist(enemy, this.player) < 500);
      if (!boss) return;
      const w = Math.min(580, this.canvas.width - 80);
      const x = (this.canvas.width - w) / 2;
      const y = this.canvas.height - 36;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(x, y, w, 16);
      ctx.fillStyle = "#f15d42";
      ctx.fillRect(x, y, w * KOE.clamp(boss.health / boss.maxHealth, 0, 1), 16);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.strokeRect(x, y, w, 16);
      ctx.fillStyle = "#f7ead4";
      ctx.textAlign = "center";
      ctx.fillText(`${boss.name} · Phase ${boss.phase}`, this.canvas.width / 2, y - 6);
      ctx.textAlign = "left";
    }

    drawReticle(ctx) {
      if (!this.world.interactHint || this.dialogue.active || this.ui.menuOpen) return;
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(this.canvas.width / 2 - 118, this.canvas.height - 70, 236, 25);
      ctx.fillStyle = "#f7ead4";
      ctx.textAlign = "center";
      ctx.fillText(`Space: ${this.world.interactHint}`, this.canvas.width / 2, this.canvas.height - 53);
      ctx.textAlign = "left";
    }

    toast(message) {
      const el = document.createElement("div");
      el.className = "toast";
      el.textContent = message;
      this.toastEl.appendChild(el);
      setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(8px)";
        setTimeout(() => el.remove(), 250);
      }, 3600);
      while (this.toastEl.children.length > 5) this.toastEl.firstChild.remove();
    }
  }

  window.addEventListener("load", () => {
    window.KingdomsOfEmberfall = new Game();
  });
}());
