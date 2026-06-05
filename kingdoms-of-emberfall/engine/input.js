(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.Input = class {
    constructor(target) {
      this.target = target || window;
      this.keys = new Set();
      this.pressed = new Set();
      this.released = new Set();
      this.mouse = { x: 0, y: 0, down: false, clicked: false };
      this.bind(this.target);
    }

    bind(target) {
      window.addEventListener("keydown", (event) => {
        for (const key of this.eventKeys(event)) {
          if (!this.keys.has(key)) this.pressed.add(key);
          this.keys.add(key);
        }
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Tab"].includes(event.key)) {
          event.preventDefault();
        }
      }, { passive: false });

      window.addEventListener("keyup", (event) => {
        for (const key of this.eventKeys(event)) {
          this.keys.delete(key);
          this.released.add(key);
        }
      });

      target.addEventListener("mousemove", (event) => {
        const rect = target.getBoundingClientRect();
        this.mouse.x = (event.clientX - rect.left) * (target.width / rect.width);
        this.mouse.y = (event.clientY - rect.top) * (target.height / rect.height);
      });

      target.addEventListener("mousedown", () => {
        if (target.focus) target.focus();
        this.mouse.down = true;
        this.mouse.clicked = true;
      });

      target.addEventListener("touchstart", () => {
        if (target.focus) target.focus();
      }, { passive: true });

      window.addEventListener("mouseup", () => {
        this.mouse.down = false;
      });

      window.addEventListener("blur", () => {
        this.keys.clear();
        this.pressed.clear();
        this.released.clear();
        this.mouse.down = false;
      });
    }

    eventKeys(event) {
      const keys = new Set();
      keys.add(this.normalize(event.key));
      const fromCode = this.normalizeCode(event.code);
      if (fromCode) keys.add(fromCode);
      return Array.from(keys).filter(Boolean);
    }

    normalize(key) {
      if (key === " ") return "Space";
      if (key.length === 1) return key.toLowerCase();
      return key;
    }

    normalizeCode(code) {
      if (!code) return "";
      if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
      if (/^Digit[0-9]$/.test(code)) return code.slice(5);
      if (code === "Space") return "Space";
      if (code === "ShiftLeft" || code === "ShiftRight") return "Shift";
      if (code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight") return code;
      if (code === "Escape" || code === "Tab" || code === "Enter") return code;
      return "";
    }

    focus() {
      if (this.target && this.target.focus) this.target.focus();
    }

    down(key) {
      return this.keys.has(this.normalize(key));
    }

    justPressed(key) {
      return this.pressed.has(this.normalize(key));
    }

    anyJustPressed(keys) {
      return keys.some((key) => this.justPressed(key));
    }

    axis() {
      let x = 0;
      let y = 0;
      if (this.down("a") || this.down("ArrowLeft")) x -= 1;
      if (this.down("d") || this.down("ArrowRight")) x += 1;
      if (this.down("w") || this.down("ArrowUp")) y -= 1;
      if (this.down("s") || this.down("ArrowDown")) y += 1;
      if (x !== 0 || y !== 0) {
        const length = Math.hypot(x, y);
        x /= length;
        y /= length;
      }
      return { x, y };
    }

    endFrame() {
      this.pressed.clear();
      this.released.clear();
      this.mouse.clicked = false;
    }
  };
}());
