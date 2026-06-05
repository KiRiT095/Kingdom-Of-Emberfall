(function () {
  "use strict";

  const KOE = window.KOE = window.KOE || {};

  KOE.TILE = 32;
  KOE.VERSION = "1.3.0";
  KOE.SAVE_KEY = "kingdoms-of-emberfall-save-v1";
  KOE.SAVE_KEY_BACKUP = "kingdoms-of-emberfall-save-v1-backup";

  KOE.clamp = function (value, min, max) {
    return Math.max(min, Math.min(max, value));
  };

  KOE.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  KOE.dist = function (a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  };

  KOE.rectsOverlap = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  KOE.now = function () {
    return performance.now() / 1000;
  };

  KOE.pick = function (items, rng) {
    return items[Math.floor((rng || Math.random)() * items.length)];
  };

  KOE.weightedPick = function (items, rng) {
    const random = rng || Math.random;
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = random() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) return item.value;
    }
    return items[items.length - 1].value;
  };

  KOE.hash = function (text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  KOE.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };

  KOE.noise2 = function (x, y, seed) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  };

  KOE.EventBus = class {
    constructor() {
      this.handlers = {};
    }

    on(type, handler) {
      if (!this.handlers[type]) this.handlers[type] = [];
      this.handlers[type].push(handler);
      return () => this.off(type, handler);
    }

    off(type, handler) {
      if (!this.handlers[type]) return;
      this.handlers[type] = this.handlers[type].filter((item) => item !== handler);
    }

    emit(type, payload) {
      if (!this.handlers[type]) return;
      for (const handler of this.handlers[type]) handler(payload);
    }
  };

  KOE.Camera = class {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.shake = 0;
      this.flash = 0;
    }

    follow(target, world, canvas, dt) {
      const desiredX = target.x - canvas.width / 2;
      const desiredY = target.y - canvas.height / 2;
      this.x = KOE.lerp(this.x, desiredX, 1 - Math.pow(0.001, dt));
      this.y = KOE.lerp(this.y, desiredY, 1 - Math.pow(0.001, dt));
      this.x = KOE.clamp(this.x, 0, Math.max(0, world.width * KOE.TILE - canvas.width));
      this.y = KOE.clamp(this.y, 0, Math.max(0, world.height * KOE.TILE - canvas.height));
      this.shake = Math.max(0, this.shake - dt * 9);
      this.flash = Math.max(0, this.flash - dt * 3.2);
    }

    apply(ctx) {
      let sx = 0;
      let sy = 0;
      if (this.shake > 0) {
        sx = (Math.random() - 0.5) * this.shake * 14;
        sy = (Math.random() - 0.5) * this.shake * 14;
      }
      ctx.translate(Math.round(-this.x + sx), Math.round(-this.y + sy));
    }
  };

  KOE.GameClock = class {
    constructor() {
      this.day = 1;
      this.minute = 6 * 60;
      this.speed = 22;
      this.paused = false;
    }

    update(dt) {
      if (this.paused) return;
      this.minute += dt * this.speed;
      while (this.minute >= 24 * 60) {
        this.minute -= 24 * 60;
        this.day += 1;
      }
    }

    get hour() {
      return Math.floor(this.minute / 60);
    }

    get phase() {
      const h = this.hour;
      if (h >= 5 && h < 8) return "Dawn";
      if (h >= 8 && h < 17) return "Day";
      if (h >= 17 && h < 20) return "Dusk";
      return "Night";
    }

    format() {
      const h = Math.floor(this.minute / 60);
      const m = Math.floor(this.minute % 60);
      return `${this.phase}, Day ${this.day} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    serialize() {
      return { day: this.day, minute: this.minute };
    }

    restore(data) {
      if (!data) return;
      this.day = data.day || 1;
      this.minute = data.minute || 360;
    }
  };

  KOE.sanitize = function (text) {
    return String(text).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  };
}());
