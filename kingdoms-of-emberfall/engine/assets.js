(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.Assets = class {
    constructor() {
      this.sprites = {};
      this.tiles = {};
      this.palettes = {
        hero: ["#1a2740", "#f2d9a8", "#c73d32", "#f2b84a", "#faf3e4"],
        villager: ["#2d3242", "#d7b17c", "#5aa06a", "#855740", "#f3e1bd"],
        mage: ["#25273a", "#d8bcff", "#7862c8", "#f0d68a", "#f9ecce"],
        smith: ["#252b34", "#c88f65", "#994032", "#adb0b3", "#f5d9b2"],
        wolf: ["#2d3034", "#5b6770", "#9aa6ad", "#e6d6b1", "#241a18"],
        skeleton: ["#26242a", "#d9d0b8", "#f5edd4", "#7c715e", "#1b1617"],
        bandit: ["#211c1e", "#c08356", "#792e2f", "#38445f", "#f1d4a9"],
        slime: ["#17332e", "#3fc883", "#83ffb2", "#22825d", "#e4fff0"],
        cultist: ["#17131d", "#55285e", "#ad4c78", "#e5b55b", "#f8d6c0"],
        insect: ["#241b18", "#6f8f36", "#cfb34b", "#41321c", "#e9e0a8"],
        spirit: ["#142232", "#5bc8ff", "#bff7ff", "#7568f0", "#ffffff"],
        boss: ["#1d1721", "#973b31", "#f1a24a", "#e2d5bd", "#4c5a78"]
      };
    }

    generate() {
      const spriteNames = Object.keys(this.palettes);
      for (const name of spriteNames) {
        this.sprites[name] = this.makeHumanoid(this.palettes[name], name);
      }

      this.tiles = {
        grass: this.makeTile(["#315c32", "#3f7441", "#2d512e", "#598d50"], "grass"),
        path: this.makeTile(["#8e7147", "#a38657", "#75603e", "#b79862"], "path"),
        water: this.makeTile(["#184c68", "#226b89", "#2a7fa4", "#12394f"], "water"),
        forest: this.makeTile(["#173c26", "#255536", "#1a472c", "#45703a"], "forest"),
        rock: this.makeTile(["#4c4f56", "#61656e", "#363941", "#777b84"], "rock"),
        snow: this.makeTile(["#d7e8ec", "#edf8f8", "#b7d0d8", "#ffffff"], "snow"),
        swamp: this.makeTile(["#253a2a", "#314c31", "#59663e", "#19271d"], "swamp"),
        crystal: this.makeTile(["#313a6b", "#5b70c7", "#8fd9ff", "#222846"], "crystal"),
        ruin: this.makeTile(["#5f574b", "#746b5e", "#423c35", "#9b907d"], "ruin"),
        lava: this.makeTile(["#5e1b19", "#a13924", "#e16b2f", "#f0b348"], "lava"),
        floor: this.makeTile(["#4e443b", "#66594c", "#38312c", "#80715e"], "floor"),
        roof: this.makeTile(["#612f28", "#7d3d31", "#4a241f", "#a6533f"], "roof")
      };
    }

    makeTile(colors, kind) {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = colors[0];
      ctx.fillRect(0, 0, 32, 32);
      for (let i = 0; i < 28; i += 1) {
        ctx.fillStyle = colors[(i % (colors.length - 1)) + 1];
        const x = (i * 11 + colors[0].charCodeAt(1)) % 32;
        const y = (i * 17 + colors[1].charCodeAt(2)) % 32;
        ctx.globalAlpha = 0.28 + (i % 3) * 0.12;
        ctx.fillRect(x, y, 1 + (i % 3), 1 + ((i + 1) % 3));
      }
      if (kind === "grass") {
        ctx.globalAlpha = 0.35;
        for (let i = 0; i < 16; i += 1) {
          ctx.fillStyle = i % 3 === 0 ? "#6ea55c" : i % 3 === 1 ? "#7ebd6a" : "#3a6a3a";
          ctx.fillRect((i * 7 + 3) % 32, (i * 11 + 9) % 32, 1, 2 + (i % 2));
        }
        ctx.fillStyle = "rgba(214, 196, 134, 0.35)";
        for (let i = 0; i < 6; i += 1) ctx.fillRect((i * 13 + 2) % 32, (i * 17 + 8) % 32, 1, 1);
      } else if (kind === "path") {
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = "#6f5b39";
        for (let i = 0; i < 4; i += 1) ctx.fillRect(i * 8 + 2, 14 + (i % 2), 6, 1);
        ctx.fillStyle = "rgba(131, 115, 79, 0.5)";
        for (let i = 0; i < 7; i += 1) ctx.fillRect((i * 9 + 6) % 32, (i * 5 + 4) % 32, 2, 1);
      } else if (kind === "forest") {
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = "#2d5a30";
        for (let i = 0; i < 10; i += 1) ctx.fillRect((i * 5 + 4) % 32, (i * 9 + 7) % 32, 3, 2);
        ctx.fillStyle = "#624f2d";
        ctx.fillRect(3, 25, 8, 2);
      } else if (kind === "swamp") {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "rgba(120, 136, 80, 0.45)";
        for (let i = 0; i < 7; i += 1) ctx.fillRect((i * 7 + 2) % 32, (i * 10 + 3) % 32, 4, 2);
        ctx.fillStyle = "rgba(65, 80, 52, 0.7)";
        for (let i = 0; i < 8; i += 1) ctx.fillRect((i * 11 + 5) % 32, (i * 13 + 2) % 32, 1, 3);
      } else if (kind === "snow") {
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = "#f7fdff";
        for (let i = 0; i < 12; i += 1) ctx.fillRect((i * 7 + 1) % 32, (i * 9 + 5) % 32, 2, 1);
        ctx.fillStyle = "#bdd6df";
        for (let i = 0; i < 4; i += 1) ctx.fillRect(i * 8 + 1, 20 + (i % 2), 7, 1);
      } else if (kind === "water") {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#5ca6c2";
        for (let i = 0; i < 5; i += 1) {
          const y = 5 + i * 5;
          ctx.fillRect(1 + (i % 2), y, 30, 1);
        }
      }
      ctx.globalAlpha = 1;
      return canvas;
    }

    makeHumanoid(palette, variant) {
      const frames = [];
      for (let f = 0; f < 4; f += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 40;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        const bob = f === 1 || f === 3 ? 1 : 0;
        const step = f === 1 ? 2 : f === 3 ? -2 : 0;

        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(8, 34, 16, 4);

        if (variant === "slime") {
          ctx.fillStyle = palette[1];
          ctx.fillRect(6, 18 + bob, 20, 15);
          ctx.fillStyle = palette[2];
          ctx.fillRect(10, 14 + bob, 12, 7);
          ctx.fillStyle = palette[4];
          ctx.fillRect(12, 21 + bob, 3, 3);
          ctx.fillRect(20, 21 + bob, 3, 3);
          frames.push(canvas);
          continue;
        }

        if (variant === "wolf") {
          ctx.fillStyle = palette[1];
          ctx.fillRect(6, 20 + bob, 22, 10);
          ctx.fillRect(20, 15 + bob, 8, 8);
          ctx.fillStyle = palette[2];
          ctx.fillRect(23, 13 + bob, 3, 3);
          ctx.fillRect(28, 17 + bob, 2, 2);
          ctx.fillStyle = palette[0];
          ctx.fillRect(8, 30 + step, 4, 6);
          ctx.fillRect(22, 30 - step, 4, 6);
          frames.push(canvas);
          continue;
        }

        if (variant === "insect") {
          ctx.fillStyle = palette[1];
          ctx.fillRect(9, 16 + bob, 14, 18);
          ctx.fillStyle = palette[2];
          ctx.fillRect(11, 12 + bob, 10, 7);
          ctx.fillStyle = palette[3];
          for (let i = 0; i < 3; i += 1) {
            ctx.fillRect(5, 20 + i * 4 + step / 2, 5, 2);
            ctx.fillRect(22, 20 + i * 4 - step / 2, 5, 2);
          }
          frames.push(canvas);
          continue;
        }

        if (variant === "hero") {
          ctx.fillStyle = "rgba(0,0,0,0.34)";
          ctx.fillRect(7, 34 + step * 0.2, 18, 4);
          const cloak = "#243056";
          const trim = palette[3];
          const tunic = palette[2];
          ctx.fillStyle = cloak;
          ctx.fillRect(5, 18 + bob, 22, 16);
          ctx.fillStyle = tunic;
          ctx.fillRect(9, 16 + bob, 14, 12);
          ctx.fillStyle = trim;
          ctx.fillRect(8, 24 + bob, 16, 2);
          ctx.fillRect(6, 17 + bob, 3, 14);
          ctx.fillRect(23, 17 + bob, 3, 14);
          ctx.fillStyle = "#8b1e1e";
          ctx.fillRect(8, 5 + bob, 16, 4);
          ctx.fillStyle = palette[1];
          ctx.fillRect(10, 7 + bob, 12, 11);
          ctx.fillStyle = palette[0];
          ctx.fillRect(4, 18 + bob, 6, 11);
          ctx.fillRect(22, 18 + bob, 6, 11);
          ctx.fillStyle = trim;
          ctx.fillRect(3, 26 + bob, 7, 10);
          ctx.fillRect(22, 26 + bob, 7, 10);
          ctx.fillStyle = palette[4];
          ctx.fillRect(12, 11 + bob, 2, 2);
          ctx.fillRect(18, 11 + bob, 2, 2);
          ctx.strokeStyle = "rgba(250,243,228,0.55)";
          ctx.lineWidth = 1;
          ctx.strokeRect(9, 8 + bob, 14, 12);
          frames.push(canvas);
          continue;
        }

        ctx.fillStyle = palette[0];
        ctx.fillRect(9, 27 + step, 5, 9);
        ctx.fillRect(18, 27 - step, 5, 9);
        ctx.fillStyle = palette[2];
        ctx.fillRect(8, 17 + bob, 16, 15);
        ctx.fillStyle = palette[1];
        ctx.fillRect(10, 7 + bob, 12, 11);
        ctx.fillStyle = palette[3];
        ctx.fillRect(8, 5 + bob, 16, 5);
        ctx.fillRect(9, 10 + bob, 3, 5);
        ctx.fillStyle = palette[4];
        ctx.fillRect(12, 12 + bob, 2, 2);
        ctx.fillRect(18, 12 + bob, 2, 2);
        ctx.fillStyle = palette[0];
        ctx.fillRect(5, 19 + bob, 4, 9);
        ctx.fillRect(23, 19 + bob, 4, 9);

        if (variant === "skeleton") {
          ctx.fillStyle = palette[2];
          ctx.fillRect(12, 19 + bob, 8, 2);
          ctx.fillRect(13, 23 + bob, 6, 2);
        }

        if (variant === "spirit") {
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = palette[2];
          ctx.fillRect(6, 13 + bob, 20, 24);
          ctx.globalAlpha = 1;
        }

        if (variant === "boss") {
          ctx.fillStyle = palette[3];
          ctx.fillRect(7, 16 + bob, 18, 3);
          ctx.fillStyle = palette[2];
          ctx.fillRect(14, 2 + bob, 4, 5);
        }

        frames.push(canvas);
      }
      return frames;
    }

    drawSprite(ctx, name, x, y, frame, flip, scale) {
      const frames = this.sprites[name] || this.sprites.villager;
      const image = frames[Math.floor(frame) % frames.length];
      const s = scale || 1;
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (flip) {
        ctx.scale(-1, 1);
        ctx.drawImage(image, -16 * s, -32 * s, 32 * s, 40 * s);
      } else {
        ctx.drawImage(image, -16 * s, -32 * s, 32 * s, 40 * s);
      }
      ctx.restore();
    }
  };
}());
