(function () {
  "use strict";

  const KOE = window.KOE;
  const T = KOE.TILE;

  KOE.World = class {
    constructor(game) {
      this.game = game;
      this.region = KOE.REGIONS.town;
      this.maps = {};
      this.npcs = KOE.NPCS.map((npc) => new KOE.NPC(game, npc));
      this.enemies = [];
      this.openedChests = {};
      this.openedGates = {};
      this.harvested = {};
      this.defeatedBosses = {};
      this.discovered = { town: true };
      this.discoveredLandmarks = {};
      this.minimapFog = {};
      this.minimapZoom = 1;
      this.minimapFogVersion = 0;
      this.exitCooldown = 0;
      this.regionTitleTimer = 0;
      this.interactHint = "";
      this._gateWarn = 0;
      this.visitedRumorRegions = {};
      this._fogTimer = 0;
    }

    restore(data) {
      if (data) {
        this.openedChests = data.openedChests || {};
        this.openedGates = data.openedGates || {};
        this.harvested = data.harvested || {};
        this.defeatedBosses = data.defeatedBosses || {};
        this.discovered = data.discovered || { town: true };
        this.discoveredLandmarks = data.discoveredLandmarks || {};
        this.minimapFog = data.minimapFog || {};
        this.minimapZoom = data.minimapZoom || 1;
        this.visitedRumorRegions = data.visitedRumorRegions || {};
      } else {
        this.openedChests = {};
        this.openedGates = {};
        this.harvested = {};
        this.defeatedBosses = {};
        this.discovered = { town: true };
        this.discoveredLandmarks = {};
        this.minimapFog = {};
        this.minimapZoom = 1;
        this.visitedRumorRegions = {};
      }
      if (![1, 1.6, 2.2].includes(this.minimapZoom)) this.minimapZoom = 1;
      this.maps = {};
      this.minimapFogVersion = 0;
    }

    serialize() {
      return {
        openedChests: this.openedChests,
        openedGates: this.openedGates,
        harvested: this.harvested,
        defeatedBosses: this.defeatedBosses,
        discovered: this.discovered,
        discoveredLandmarks: this.discoveredLandmarks,
        minimapFog: this.minimapFog,
        minimapZoom: this.minimapZoom,
        visitedRumorRegions: this.visitedRumorRegions
      };
    }

    get width() {
      return this.region.width;
    }

    get height() {
      return this.region.height;
    }

    changeRegion(regionId, spawn, silent) {
      this.region = KOE.REGIONS[regionId] || KOE.REGIONS.town;
      if (!this.maps[regionId]) this.maps[regionId] = this.generateRegion(this.region);
      this.applyOpenGates(this.region);
      this.enemies = this.spawnEnemies(this.region);
      this.discovered[regionId] = true;
      this.game.player.region = regionId;
      if (spawn) {
        if (spawn.px !== undefined) {
          this.game.player.x = spawn.px;
          this.game.player.y = spawn.py;
        } else {
          this.game.player.x = spawn.x * T + 16;
          this.game.player.y = spawn.y * T + 16;
        }
      }
      this.ensurePlayerOpen();
      this.game.camera.x = KOE.clamp(this.game.player.x - this.game.canvas.width / 2, 0, Math.max(0, this.width * T - this.game.canvas.width));
      this.game.camera.y = KOE.clamp(this.game.player.y - this.game.canvas.height / 2, 0, Math.max(0, this.height * T - this.game.canvas.height));
      this.game.audio.setTheme(this.region.music);
      this.exitCooldown = 1;
      this.regionTitleTimer = 3;
      this._fogTimer = 0;
      if (this.game.guidance) this.game.guidance.clearCache();
      this.revealMinimapAroundPlayer(true);
      if (!silent) {
        const rumor = KOE.REGION_RUMORS && KOE.REGION_RUMORS[regionId];
        if (rumor && !this.visitedRumorRegions[regionId]) {
          this.visitedRumorRegions[regionId] = true;
          this.game.toast(`${this.region.name} — ${rumor}`);
        } else {
          this.game.toast(this.region.name);
        }
      }
    }

    canFastTravel() {
      const uq = KOE.FAST_TRAVEL && KOE.FAST_TRAVEL.unlockQuest;
      return !uq || this.game.quests.completed[uq];
    }

    fastTravelTo(regionId, spawn) {
      if (!this.canFastTravel()) {
        this.game.toast("Fast travel unlocks after the pass reopens to trade.");
        return false;
      }
      if (!this.discovered[regionId]) {
        this.game.toast("Walk there once on foot to chart the road.");
        return false;
      }
      const reg = KOE.REGIONS[regionId];
      if (!reg) return false;
      this.changeRegion(regionId, spawn || { x: Math.floor(reg.width / 2), y: Math.floor(reg.height / 2) }, false);
      this.game.audio.sfx("ui");
      this.game.toast(`Caravan routes bring you toward ${reg.name}.`);
      return true;
    }

    ensurePlayerOpen() {
      const player = this.game.player;
      if (!this.collidesCircle(player.x, player.y, player.radius)) return;
      const startX = Math.floor(player.x / T);
      const startY = Math.floor(player.y / T);
      for (let radius = 1; radius < 16; radius += 1) {
        for (let y = startY - radius; y <= startY + radius; y += 1) {
          for (let x = startX - radius; x <= startX + radius; x += 1) {
            if (x < 1 || y < 1 || x >= this.region.width - 1 || y >= this.region.height - 1) continue;
            const px = x * T + 16;
            const py = y * T + 16;
            if (!this.collidesCircle(px, py, player.radius)) {
              player.x = px;
              player.y = py;
              player.vx = 0;
              player.vy = 0;
              return;
            }
          }
        }
      }
    }

    generateRegion(region) {
      if (region.id === "ember_depths") return this.buildEmberDepths(region);
      if (region.id === "overworld") return this.generateOverworld(region);
      if (region.id === "crosshill") return this.generateCrosshill(region);
      if (region.id === "harbor_moor") return this.generateHarborMoor(region);

      const tiles = new Array(region.width * region.height);
      const blocked = new Uint8Array(region.width * region.height);
      const seed = KOE.hash(region.id);
      for (let y = 0; y < region.height; y += 1) {
        for (let x = 0; x < region.width; x += 1) {
          let tile = region.base;
          let block = 0;
          const n = KOE.noise2(x * 0.12, y * 0.12, seed);
          const edge = x < 2 || y < 2 || x > region.width - 3 || y > region.height - 3;
          if (region.id === "town") {
            tile = this.townTile(x, y);
            block = tile === "water" ? 1 : 0;
          } else if (region.id === "forest") {
            if (n > 0.67 || edge) { tile = "forest"; block = 1; }
            if (n < 0.12) tile = "grass";
            if ((x > 70 && x < 83 && y > 30 && y < 43) || (x > 6 && x < 14 && y > 7 && y < 15)) { tile = "path"; block = 0; }
          } else if (region.id === "pass") {
            if (n > 0.59 || edge) { tile = "rock"; block = 1; }
            if (Math.abs(y - (35 + Math.sin(x * 0.15) * 8)) < 5) { tile = "path"; block = 0; }
          } else if (region.id === "caverns") {
            if (n > 0.58 || edge) { tile = "rock"; block = 1; }
            if (n < 0.16) { tile = "crystal"; block = 0; }
            if (Math.abs(x - 46) < 12 || Math.abs(y - 56) < 8 || Math.abs(x - 10) < 7) block = 0;
          } else if (region.id === "swamp") {
            if (n < 0.24) { tile = "water"; block = 1; }
            if (n > 0.72 || edge) { tile = "forest"; block = 1; }
            if (Math.abs(x - 66) < 8 || Math.abs(y - 8) < 5 || Math.abs(x - 12) < 7) { tile = "path"; block = 0; }
          } else if (region.id === "ruins") {
            if (n > 0.68 || edge) { tile = "rock"; block = 1; }
            if ((x % 14 === 0 || y % 13 === 0) && n > 0.42) tile = "floor";
            if (Math.abs(x - 45) < 10 || Math.abs(y - 68) < 5 || Math.abs(y - 36) < 7) block = 0;
          } else if (region.id === "mountains") {
            if (n > 0.57 || edge) { tile = "rock"; block = 1; }
            if (n < 0.25) tile = "snow";
            if (Math.abs(x - 20) < 9 || Math.abs(y - 68) < 4 || Math.abs(x - 49) < 8) block = 0;
          } else if (region.id === "citadel") {
            if (edge || (n > 0.78 && x > 18 && y > 9)) { tile = "roof"; block = 1; }
            else tile = n < 0.2 ? "lava" : "floor";
            if (tile === "lava") block = 1;
            if (Math.abs(y - 40) < 9 || Math.abs(x - 72) < 12 || Math.abs(x - 8) < 6) block = 0;
          }
          tiles[y * region.width + x] = tile;
          blocked[y * region.width + x] = block;
        }
      }

      for (const exit of region.exits || []) this.carve(blocked, tiles, region.width, exit.x, exit.y, exit.w, exit.h, "path");
      for (const landmark of region.landmarks || []) this.carve(blocked, tiles, region.width, landmark.x, landmark.y, landmark.w, landmark.h, region.id === "citadel" ? "floor" : "path");

      if (region.id === "town") {
        for (const building of region.buildings) {
          if (building.kind !== "landmark" && building.kind !== "secret") {
            this.fill(blocked, tiles, region.width, building.x, building.y, building.w, building.h, "roof", 1);
            this.carve(blocked, tiles, region.width, building.x + Math.floor(building.w / 2) - 1, building.y + building.h - 1, 3, 1, "path");
          }
        }
      }
      return { tiles, blocked };
    }

    townTile(x, y) {
      if (x > 69 && y > 44) return "water";
      const ring = Math.hypot(x - 40, y - 30) < 14;
      const guildPath = x >= 4 && x <= 14 && y >= 42 && y <= 48;
      const chapelPath = x >= 7 && x <= 14 && y >= 28 && y <= 34;
      const tradeRow = y >= 30 && y <= 34 && x >= 48 && x <= 62;
      if ((x > 35 && x < 47 && y > 22 && y < 35) || Math.abs(x - 40) < 2 || Math.abs(y - 35) < 2 || Math.abs(y - 42) < 2 || Math.abs(x - 26) < 2 || Math.abs(x - 55) < 2 || guildPath || chapelPath || tradeRow || ring) return "path";
      if ((x + y * 2) % 9 === 0 && x > 18 && x < 70 && y > 12 && y < 55 && !(x > 55 && y > 48)) return "path";
      if (x > 55 && y > 48) return "grass";
      return "grass";
    }

    carve(blocked, tiles, width, x, y, w, h, tile) {
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) {
          const i = yy * width + xx;
          if (i >= 0 && i < blocked.length) {
            blocked[i] = 0;
            tiles[i] = tile;
          }
        }
      }
    }

    fill(blocked, tiles, width, x, y, w, h, tile, block) {
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) {
          const i = yy * width + xx;
          if (i >= 0 && i < blocked.length) {
            blocked[i] = block;
            tiles[i] = tile;
          }
        }
      }
    }

    carveThickLine(blocked, tiles, width, x0, y0, x1, y1, thick, tile) {
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 2;
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        const x = Math.round(x0 + (x1 - x0) * t);
        const y = Math.round(y0 + (y1 - y0) * t);
        for (let dy = -thick; dy <= thick; dy += 1) {
          for (let dx = -thick; dx <= thick; dx += 1) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 1 || yy < 1 || xx >= width - 1 || yy >= tiles.length / width - 1) continue;
            const i = yy * width + xx;
            blocked[i] = 0;
            tiles[i] = tile;
          }
        }
      }
    }

    generateOverworld(region) {
      const tiles = new Array(region.width * region.height);
      const blocked = new Uint8Array(region.width * region.height);
      const seed = KOE.hash(region.id);
      for (let y = 0; y < region.height; y += 1) {
        for (let x = 0; x < region.width; x += 1) {
          const n = KOE.noise2(x * 0.09, y * 0.09, seed);
          let tile = "grass";
          let block = 0;
          const edge = x < 2 || y < 2 || x > region.width - 3 || y > region.height - 3;
          if (edge || n > 0.82) {
            tile = n > 0.9 ? "rock" : "forest";
            block = 1;
          } else if (n < 0.08) tile = "path";
          tiles[y * region.width + x] = tile;
          blocked[y * region.width + x] = block;
        }
      }
      const hubs = [
        [8, 46], [105, 46], [56, 8], [54, 89], [102, 74]
      ];
      for (let i = 0; i < hubs.length; i += 1) {
        for (let j = i + 1; j < hubs.length; j += 1) {
          this.carveThickLine(blocked, tiles, region.width, hubs[i][0], hubs[i][1], hubs[j][0], hubs[j][1], 1, "path");
        }
      }
      for (const exit of region.exits || []) this.carve(blocked, tiles, region.width, exit.x, exit.y, exit.w, exit.h, "path");
      for (const landmark of region.landmarks || []) this.carve(blocked, tiles, region.width, landmark.x, landmark.y, landmark.w, landmark.h, "path");
      return { tiles, blocked };
    }

    generateCrosshill(region) {
      return this.generateSettlementLayout(region, { streetX: 25, water: false });
    }

    generateHarborMoor(region) {
      return this.generateSettlementLayout(region, { streetX: 26, water: true });
    }

    generateSettlementLayout(region, opts) {
      const tiles = new Array(region.width * region.height);
      const blocked = new Uint8Array(region.width * region.height);
      const seed = KOE.hash(region.id);
      for (let y = 0; y < region.height; y += 1) {
        for (let x = 0; x < region.width; x += 1) {
          let tile = "grass";
          let block = 0;
          if (opts.water && y > region.height - 8) {
            tile = y > region.height - 5 ? "water" : "swamp";
            block = y > region.height - 5 ? 1 : 0;
          }
          const n = KOE.noise2(x * 0.16, y * 0.16, seed);
          if (Math.abs(x - opts.streetX) < 3 && y > 4 && y < region.height - (opts.water ? 10 : 5)) {
            tile = "path";
            block = 0;
          } else if (!opts.water && n > 0.78 && y < region.height - 4) {
            tile = "forest";
            block = 1;
          }
          tiles[y * region.width + x] = tile;
          blocked[y * region.width + x] = block;
        }
      }
      for (const building of region.buildings || []) {
        if (building.kind !== "landmark") {
          this.fill(blocked, tiles, region.width, building.x, building.y, building.w, building.h, "roof", 1);
          this.carve(blocked, tiles, region.width, building.x + Math.floor(building.w / 2) - 1, building.y + building.h - 1, 3, 1, "path");
        }
      }
      for (const exit of region.exits || []) this.carve(blocked, tiles, region.width, exit.x, exit.y, exit.w, exit.h, "path");
      for (const landmark of region.landmarks || []) this.carve(blocked, tiles, region.width, landmark.x, landmark.y, landmark.w, landmark.h, "path");
      return { tiles, blocked };
    }

    buildEmberDepths(region) {
      const W = region.width;
      const H = region.height;
      const tiles = new Array(W * H);
      const blocked = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i += 1) {
        tiles[i] = "rock";
        blocked[i] = 1;
      }
      const rng = KOE.mulberry32(KOE.hash("ember-depths-maze-v3"));
      const exit = region.exits[0];
      const bottomOpenX = Math.floor(exit.x + exit.w / 2);
      const locW = 47;
      const locH = 27;
      const cw = (locW - 1) / 2;
      const ch = (locH - 1) / 2;
      const ox = KOE.clamp(bottomOpenX - Math.floor(cw / 2) * 2 - 1, 4, W - locW - 5);
      const oy = 6;
      const local = new Uint8Array(locW * locH);
      local.fill(1);
      const LI = (lx, ly) => ly * locW + lx;
      const dirs = [[0, -2], [0, 2], [2, 0], [-2, 0]];
      const shuffle = (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i -= 1) {
          const j = Math.floor(rng() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };
      const carve = (sx, sy) => {
        local[LI(sx, sy)] = 0;
        for (const [dx, dy] of shuffle(dirs)) {
          const nx = sx + dx;
          const ny = sy + dy;
          if (nx > 0 && nx < locW - 1 && ny > 0 && ny < locH - 1 && local[LI(nx, ny)] === 1) {
            local[LI(sx + dx / 2, sy + dy / 2)] = 0;
            carve(nx, ny);
          }
        }
      };
      const startCx = Math.floor(cw / 2);
      const startCy = ch - 1;
      const startLX = startCx * 2 + 1;
      const startLY = startCy * 2 + 1;
      carve(startLX, startLY);
      const midX = startLX;
      local[LI(midX, locH - 1)] = 0;
      local[LI(midX, locH - 2)] = 0;
      for (let s = 0; s < 3; s += 1) {
        let tries = 0;
        while (tries < 100) {
          tries += 1;
          const gx = 1 + Math.floor(rng() * (locW - 2));
          const gy = 1 + Math.floor(rng() * (locH - 2));
          if (local[LI(gx, gy)] !== 1) continue;
          const hOpen = local[LI(gx - 1, gy)] === 0 && local[LI(gx + 1, gy)] === 0;
          const vOpen = local[LI(gx, gy - 1)] === 0 && local[LI(gx, gy + 1)] === 0;
          if (hOpen || vOpen) {
            local[LI(gx, gy)] = 0;
            break;
          }
        }
      }
      for (let ly = 0; ly < locH; ly += 1) {
        for (let lx = 0; lx < locW; lx += 1) {
          if (local[LI(lx, ly)] === 0) {
            const wx = ox + lx;
            const wy = oy + ly;
            if (wx >= 0 && wx < W && wy >= 0 && wy < H) {
              const wi = wy * W + wx;
              tiles[wi] = "floor";
              blocked[wi] = 0;
            }
          }
        }
      }
      let connX = ox + midX;
      for (let wy = oy + locH; wy < exit.y; wy += 1) {
        const wi = wy * W + connX;
        tiles[wi] = "floor";
        blocked[wi] = 0;
      }
      if (connX !== bottomOpenX) {
        this.carveThickLine(blocked, tiles, W, connX, exit.y - 1, bottomOpenX, exit.y - 1, 0, "floor");
        connX = bottomOpenX;
      }
      const neighbors4 = (wx, wy) => {
        const out = [];
        const tryAdd = (tx, ty) => {
          if (tx < 0 || ty < 0 || tx >= W || ty >= H) return;
          const i = ty * W + tx;
          if (!blocked[i]) out.push({ x: tx, y: ty, i });
        };
        tryAdd(wx + 1, wy);
        tryAdd(wx - 1, wy);
        tryAdd(wx, wy + 1);
        tryAdd(wx, wy - 1);
        return out;
      };
      const entrance = { x: bottomOpenX, y: exit.y - 2 };
      const startI = entrance.y * W + entrance.x;
      const dist = new Int32Array(W * H);
      dist.fill(-1);
      const prev = new Int32Array(W * H);
      prev.fill(-1);
      const q = [startI];
      dist[startI] = 0;
      for (let qi = 0; qi < q.length; qi += 1) {
        const cur = q[qi];
        const cx = cur % W;
        const cy = Math.floor(cur / W);
        for (const n of neighbors4(cx, cy)) {
          if (dist[n.i] >= 0) continue;
          dist[n.i] = dist[cur] + 1;
          prev[n.i] = cur;
          q.push(n.i);
        }
      }
      let farI = startI;
      let farD = 0;
      for (let i = 0; i < W * H; i += 1) {
        if (dist[i] > farD) {
          farD = dist[i];
          farI = i;
        }
      }
      const path = [];
      let at = farI;
      while (at !== -1) {
        path.push(at);
        at = prev[at];
      }
      path.reverse();
      if (farD < 4 && path.length > 0) {
        farI = path[Math.floor(path.length * 0.85)];
      }
      const bossCx = farI % W;
      const bossCy = Math.floor(farI / W);
      for (let dy = -3; dy <= 3; dy += 1) {
        for (let dx = -3; dx <= 3; dx += 1) {
          const tx = bossCx + dx;
          const ty = bossCy + dy;
          if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) continue;
          const ii = ty * W + tx;
          tiles[ii] = "floor";
          blocked[ii] = 0;
        }
      }
      const gates = [];
      const addGate = (idxPath, keyId, gateId) => {
        if (idxPath < 1 || idxPath >= path.length - 3) return;
        const gi = path[idxPath];
        const gx = gi % W;
        const gy = Math.floor(gi / W);
        if (blocked[gi]) return;
        blocked[gi] = 1;
        tiles[gi] = "rock";
        gates.push({ id: gateId, x: gx, y: gy, requires: keyId, consume: true });
      };
      if (path.length > 12) {
        const g1 = KOE.clamp(Math.floor(path.length * 0.38), 2, Math.max(2, path.length - 5));
        const g2 = KOE.clamp(Math.floor(path.length * 0.68), g1 + 2, Math.max(g1 + 2, path.length - 3));
        addGate(g1, "maze_iron_key", "depth_iron_gate");
        addGate(g2, "maze_brass_key", "depth_brass_gate");
      }
      const pickups = [];
      const deadEnds = [];
      for (let y = 1; y < H - 1; y += 1) {
        for (let x = 1; x < W - 1; x += 1) {
          const i = y * W + x;
          if (blocked[i]) continue;
          const ns = neighbors4(x, y);
          if (ns.length === 1) deadEnds.push({ x, y, i });
        }
      }
      for (let i = deadEnds.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [deadEnds[i], deadEnds[j]] = [deadEnds[j], deadEnds[i]];
      }
      const lootDefs = [
        { loot: [{ id: "maze_iron_key", qty: 1 }, { id: "gold", qty: 120 }] },
        { loot: [{ id: "maze_brass_key", qty: 1 }, { id: "mana_tonic", qty: 2 }] },
        { loot: [{ id: "ember_lantern", qty: 1 }, { id: "ancient_relic", qty: 1 }] }
      ];
      for (let k = 0; k < lootDefs.length && deadEnds.length > 0; k += 1) {
        const cell = deadEnds.pop();
        pickups.push({ id: `depth_pick_${k + 1}`, x: cell.x, y: cell.y, loot: lootDefs[k].loot });
      }
      const bossPx = bossCx * T + 16;
      const bossPy = bossCy * T + 16;
      return {
        tiles,
        blocked,
        meta: {
          boss: { x: bossPx, y: bossPy },
          gates,
          pickups
        }
      };
    }

    applyOpenGates(region) {
      const map = this.maps[region.id];
      if (!map || !map.meta || !map.meta.gates) return;
      for (const gate of map.meta.gates) {
        if (!this.openedGates[gate.id]) continue;
        const i = gate.y * region.width + gate.x;
        if (i >= 0 && i < map.blocked.length) {
          map.blocked[i] = 0;
          map.tiles[i] = "floor";
        }
      }
    }

    spawnEnemies(region) {
      const enemies = [];
      const map = this.maps[region.id] || this.generateRegion(region);
      this.maps[region.id] = map;
      const night = this.game.clock.phase === "Night";
      const nightMul = night && region.danger >= 1 ? 1.38 : 1;
      const nightBonus = night && region.danger >= 2 ? 2 : night && region.danger >= 1 ? 1 : 0;
      const rng = KOE.mulberry32(KOE.hash(`${region.id}-${this.game.clock.day}`));
      for (const entry of region.enemies || []) {
        const total = Math.floor(entry.count * nightMul) + (entry.type === "wolf" || entry.type === "bandit" ? nightBonus : Math.floor(nightBonus / 2));
        for (let i = 0; i < total; i += 1) {
          for (let tries = 0; tries < 80; tries += 1) {
            const x = (4 + rng() * (region.width - 8)) * T;
            const y = (4 + rng() * (region.height - 8)) * T;
            if (!this.collidesCircle(x, y, 13) && Math.hypot(x - this.game.player.x, y - this.game.player.y) > 260) {
              const danger = region.danger + (night ? 1 : 0);
              enemies.push(new KOE.Enemy(this.game, entry.type, x, y, danger));
              break;
            }
          }
        }
      }
      for (const boss of region.bosses || []) {
        if (this.defeatedBosses[boss.type]) continue;
        if (boss.mazeBoss && map.meta && map.meta.boss) {
          enemies.push(new KOE.Boss(this.game, boss.type, map.meta.boss.x, map.meta.boss.y));
        } else if (!boss.mazeBoss) {
          enemies.push(new KOE.Boss(this.game, boss.type, boss.x * T + 16, boss.y * T + 16));
        }
      }
      return enemies;
    }

    update(dt) {
      this.exitCooldown = Math.max(0, this.exitCooldown - dt);
      this.regionTitleTimer = Math.max(0, this.regionTitleTimer - dt);
      this._gateWarn = Math.max(0, this._gateWarn - dt);
      this._fogTimer -= dt;
      if (this._fogTimer <= 0) {
        this._fogTimer = 0.22;
        this.revealMinimapAroundPlayer(false);
      }
      for (const npc of this.npcs) npc.update(dt);
      for (const enemy of this.enemies) enemy.update(dt);
      for (const enemy of this.enemies) {
        if (enemy.dead && enemy.boss) this.defeatedBosses[enemy.type] = true;
      }
      this.enemies = this.enemies.filter((enemy) => !enemy.dead || enemy.boss);
      this.checkExits();
      this.checkLandmarks();
      this.checkMazeGates();
      this.checkDepthPickups();
      this.checkLandmarkDiscovery();
      this.updateHint();
    }

    revealMinimapAroundPlayer(force) {
      const key = this.region.id;
      if (!this.minimapFog[key]) this.minimapFog[key] = {};
      const fog = this.minimapFog[key];
      const px = Math.floor(this.game.player.x / T);
      const py = Math.floor(this.game.player.y / T);
      const radius = force ? 8 : 5;
      let changed = false;
      for (let y = py - radius; y <= py + radius; y += 1) {
        for (let x = px - radius; x <= px + radius; x += 1) {
          if (x < 0 || y < 0 || x >= this.region.width || y >= this.region.height) continue;
          if (Math.hypot(x - px, y - py) > radius) continue;
          const k = `${x},${y}`;
          if (!fog[k]) {
            fog[k] = 1;
            changed = true;
          }
        }
      }
      if (changed) this.minimapFogVersion += 1;
    }

    checkLandmarkDiscovery() {
      const landmarks = KOE.LANDMARKS[this.region.id] || [];
      const player = this.game.player;
      for (const landmark of landmarks) {
        if (this.discoveredLandmarks[landmark.id]) continue;
        const x = landmark.x * T + 16;
        const y = landmark.y * T + 16;
        if (Math.hypot(player.x - x, player.y - y) > 150) continue;
        this.discoveredLandmarks[landmark.id] = { region: this.region.id, day: this.game.clock.day };
        this.game.toast(`Landmark discovered: ${landmark.name}`);
        this.game.audio.sfx("ui");
      }
    }

    checkMazeGates() {
      if (this.region.id !== "ember_depths") return;
      const map = this.maps[this.region.id];
      if (!map || !map.meta || !map.meta.gates) return;
      const p = this.game.player;
      for (const gate of map.meta.gates) {
        if (this.openedGates[gate.id]) continue;
        const gx = gate.x * T + 16;
        const gy = gate.y * T + 16;
        if (Math.hypot(p.x - gx, p.y - gy) > 42) continue;
        if (!this.game.inventory.has(gate.requires, 1)) {
          if (this._gateWarn <= 0) {
            this._gateWarn = 2;
            this.game.toast(`Locked: needs ${KOE.ITEMS[gate.requires].name}.`);
          }
          return;
        }
        this.openedGates[gate.id] = true;
        if (gate.consume) this.game.inventory.remove(gate.requires, 1);
        const i = gate.y * this.region.width + gate.x;
        map.blocked[i] = 0;
        map.tiles[i] = "floor";
        this.game.audio.sfx("quest");
        this.game.toast("The gate grinds open.");
        if (this.game.ui) this.game.ui.resetMinimapCache();
        this.game.save.save({ quiet: true });
      }
    }

    checkDepthPickups() {
      if (this.region.id !== "ember_depths") return;
      const map = this.maps[this.region.id];
      if (!map || !map.meta || !map.meta.pickups) return;
      const p = this.game.player;
      for (const pk of map.meta.pickups) {
        if (this.openedChests[pk.id]) continue;
        const px = pk.x * T + 16;
        const py = pk.y * T + 16;
        if (Math.hypot(p.x - px, p.y - py) < 36) this.openChest(pk);
      }
    }

    checkExits() {
      if (this.exitCooldown > 0) return;
      const px = Math.floor(this.game.player.x / T);
      const py = Math.floor(this.game.player.y / T);
      for (const exit of this.region.exits || []) {
        if (px >= exit.x && px < exit.x + exit.w && py >= exit.y && py < exit.y + exit.h) {
          if (exit.requires && !this.game.inventory.has(exit.requires, 1)) {
            this.game.toast(`Requires ${KOE.ITEMS[exit.requires].name}.`);
            this.exitCooldown = 1.5;
            return;
          }
          this.changeRegion(exit.to, exit.spawn);
          return;
        }
      }
    }

    checkLandmarks() {
      const player = this.game.player;
      for (const landmark of this.region.landmarks || []) {
        const rect = { x: landmark.x * T, y: landmark.y * T, w: landmark.w * T, h: landmark.h * T };
        if (player.x > rect.x && player.x < rect.x + rect.w && player.y > rect.y && player.y < rect.y + rect.h) {
          this.game.quests.onExplore(landmark.id);
        }
      }
      if (this.region.buildings) {
        for (const building of this.region.buildings) {
          if (building.kind === "landmark" || building.kind === "secret") {
            const rect = { x: building.x * T, y: building.y * T, w: building.w * T, h: building.h * T };
            if (player.x > rect.x && player.x < rect.x + rect.w && player.y > rect.y && player.y < rect.y + rect.h) {
              this.game.quests.onExplore(building.id);
            }
          }
        }
      }
    }

    updateHint() {
      const target = this.findInteractable();
      this.interactHint = target ? target.hint : "";
    }

    findInteractable() {
      const player = this.game.player;
      let best = null;
      const consider = (obj, dist, hint, action) => {
        if (dist < 52 && (!best || dist < best.dist)) best = { obj, dist, hint, action };
      };
      for (const npc of this.npcs) {
        if (!npc.availableInRegion(this.region.id)) continue;
        consider(npc, KOE.dist(player, npc), `Talk: ${npc.name}`, () => npc.interact());
      }
      for (const chest of this.region.chests || []) {
        if (this.openedChests[chest.id]) continue;
        const cx = chest.x * T + 16;
        const cy = chest.y * T + 16;
        consider(chest, Math.hypot(player.x - cx, player.y - cy), "Open chest", () => this.openChest(chest));
      }
      for (const resource of this.region.resources || []) {
        if (!this.resourceReady(resource)) continue;
        const rx = resource.x * T + 16;
        const ry = resource.y * T + 16;
        const name = KOE.ITEMS[resource.id] ? KOE.ITEMS[resource.id].name : resource.id;
        consider(resource, Math.hypot(player.x - rx, player.y - ry), `Gather ${name}`, () => this.harvest(resource));
      }
      if (this.region.buildings) {
        for (const building of this.region.buildings) {
          const bx = (building.x + building.w / 2) * T;
          const by = (building.y + building.h) * T;
          const dist = Math.hypot(player.x - bx, player.y - by);
          if (building.id === "player_house" && this.region.id === "town") consider(building, dist, "Enter your house", () => this.game.ui.openHouse());
          else if (building.kind === "shop" && KOE.SHOPS[building.id]) consider(building, dist, `Visit ${building.name}`, () => this.game.economy.open(building.id, building.name));
        }
      }
      return best;
    }

    interact() {
      const target = this.findInteractable();
      if (target) target.action();
      else this.game.toast("Nothing nearby to interact with.");
    }

    openChest(chest) {
      this.openedChests[chest.id] = true;
      const names = [];
      for (const loot of chest.loot) {
        this.game.inventory.add(loot.id, loot.qty);
        names.push(loot.id === "gold" ? `${loot.qty}g` : `${KOE.ITEMS[loot.id].name} x${loot.qty}`);
      }
      this.game.toast(`Found ${names.join(", ")}.`);
      this.game.audio.sfx("coin");
      this.game.save.save({ quiet: true });
    }

    resourceReady(resource) {
      const key = `${this.region.id}:${resource.x}:${resource.y}:${resource.id}`;
      const last = this.harvested[key] || -999;
      return this.game.clock.day - last >= (resource.respawn || 1);
    }

    harvest(resource) {
      const key = `${this.region.id}:${resource.x}:${resource.y}:${resource.id}`;
      this.harvested[key] = this.game.clock.day;
      const qty = resource.id === "emberberry" ? 3 : 1 + Math.floor(Math.random() * 2);
      this.game.inventory.add(resource.id, qty);
      this.game.toast(`Gathered ${KOE.ITEMS[resource.id].name} x${qty}.`);
      this.game.audio.sfx("ui");
    }

    collidesCircle(x, y, radius) {
      const map = this.maps[this.region.id] || this.generateRegion(this.region);
      this.maps[this.region.id] = map;
      const minX = Math.floor((x - radius) / T);
      const maxX = Math.floor((x + radius) / T);
      const minY = Math.floor((y - radius) / T);
      const maxY = Math.floor((y + radius) / T);
      for (let ty = minY; ty <= maxY; ty += 1) {
        for (let tx = minX; tx <= maxX; tx += 1) {
          if (tx < 0 || ty < 0 || tx >= this.region.width || ty >= this.region.height) return true;
          if (map.blocked[ty * this.region.width + tx]) return true;
        }
      }
      return false;
    }

    draw(ctx, camera, canvas) {
      const map = this.maps[this.region.id] || this.generateRegion(this.region);
      this.maps[this.region.id] = map;
      const startX = Math.max(0, Math.floor(camera.x / T) - 1);
      const startY = Math.max(0, Math.floor(camera.y / T) - 1);
      const endX = Math.min(this.region.width, Math.ceil((camera.x + canvas.width) / T) + 1);
      const endY = Math.min(this.region.height, Math.ceil((camera.y + canvas.height) / T) + 1);
      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const tile = map.tiles[y * this.region.width + x];
          ctx.drawImage(this.game.assets.tiles[tile] || this.game.assets.tiles.grass, x * T, y * T, T, T);
        }
      }
      this.drawDecor(ctx, startX, startY, endX, endY);
      const actors = [
        ...this.npcs.filter((npc) => npc.availableInRegion(this.region.id)),
        ...this.enemies.filter((enemy) => !enemy.dead),
        this.game.player
      ].sort((a, b) => a.y - b.y);
      for (const actor of actors) actor.draw(ctx);
      this.game.combat.draw(ctx);
      this.drawForeground(ctx, startX, startY, endX, endY);
      this.drawInteractables(ctx);
    }

    drawDecor(ctx, startX, startY, endX, endY) {
      if (this.region.buildings) {
        for (const building of this.region.buildings) {
          this.drawBuilding(ctx, building);
          if (this.region.id === "town" && (building.kind === "shop" || building.kind === "landmark")) {
            const bx = building.x * T;
            const by = building.y * T;
            ctx.fillStyle = this.game.clock.hour >= 18 || this.game.clock.hour < 6 ? "rgba(255, 200, 120, 0.55)" : "rgba(255, 220, 150, 0.35)";
            ctx.fillRect(bx + building.w * T - 22, by + building.h * T - 28, 8, 11);
          }
        }
      }
      if (this.region.id === "town") {
        const hx = 40 * T;
        const hy = 28 * T;
        ctx.fillStyle = "rgba(60, 90, 55, 0.45)";
        ctx.beginPath();
        ctx.ellipse(hx, hy + 8, 38, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 14; i += 1) {
          const a = (i / 14) * Math.PI * 2 + 0.2;
          ctx.fillStyle = i % 3 === 0 ? "#5a8f4e" : "#4a7a42";
          ctx.fillRect(hx + Math.cos(a) * 28 - 2, hy + Math.sin(a) * 14, 5, 8);
        }
      }
      for (const landmark of this.region.landmarks || []) this.drawLandmark(ctx, landmark);
      for (const exit of this.region.exits || []) {
        ctx.fillStyle = "rgba(245, 183, 77, 0.25)";
        ctx.fillRect(exit.x * T, exit.y * T, exit.w * T, exit.h * T);
      }
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textBaseline = "alphabetic";
      for (const sp of KOE.SIGNPOSTS || []) {
        if (sp.region !== this.region.id) continue;
        const sx = sp.x * T;
        const sy = sp.y * T;
        ctx.fillStyle = "#5c4a38";
        ctx.fillRect(sx - 3, sy - 36, 6, 38);
        ctx.fillStyle = "#f5b74d";
        ctx.fillRect(sx - 6, sy - 40, 12, 8);
        ctx.fillStyle = "rgba(0,0,0,0.78)";
        ctx.fillRect(sx + 8, sy - 44, 118, 14 + sp.lines.length * 12);
        ctx.fillStyle = "#f7ead4";
        sp.lines.forEach((line, i) => {
          ctx.fillText(line, sx + 14, sy - 32 + i * 12);
        });
      }
      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const n = KOE.noise2(x, y, KOE.hash(this.region.id));
          if (n > 0.93) {
            const px = x * T + 8 + (n * 11 % 12);
            const py = y * T + 8 + (n * 17 % 12);
            ctx.fillStyle = this.region.id === "snow" ? "#ffffff" : "rgba(0,0,0,0.18)";
            ctx.fillRect(px, py, 3, 3);
          }
          if (n > 0.88 && this.region.id === "forest") {
            ctx.fillStyle = "rgba(40, 76, 39, 0.32)";
            ctx.fillRect(x * T + 4, y * T + 20, 12, 5);
          } else if (n > 0.9 && this.region.id === "swamp") {
            ctx.fillStyle = "rgba(76, 96, 51, 0.35)";
            ctx.beginPath();
            ctx.arc(x * T + 10, y * T + 14, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (n > 0.91 && this.region.id === "mountains") {
            ctx.fillStyle = "rgba(208, 232, 248, 0.42)";
            ctx.fillRect(x * T + 6, y * T + 5, 8, 2);
          } else if (n > 0.9 && (this.region.id === "ruins" || this.region.id === "citadel")) {
            ctx.fillStyle = "rgba(108, 64, 54, 0.34)";
            ctx.fillRect(x * T + 6, y * T + 7, 5, 8);
          }
        }
      }
    }

    drawForeground(ctx, startX, startY, endX, endY) {
      if (this.region.id !== "forest" && this.region.id !== "swamp" && this.region.id !== "ruins") return;
      ctx.save();
      const phase = this.game.clock.phase;
      const dark = phase === "Night" ? 0.24 : phase === "Dusk" ? 0.16 : 0.1;
      for (let y = startY; y < endY; y += 3) {
        for (let x = startX; x < endX; x += 3) {
          const n = KOE.noise2(x * 0.8, y * 0.8, KOE.hash(`${this.region.id}-fg`));
          if (n < 0.92) continue;
          const px = x * T + 8;
          const py = y * T + 2;
          if (this.region.id === "forest") ctx.fillStyle = `rgba(24, 54, 31, ${dark})`;
          else if (this.region.id === "swamp") ctx.fillStyle = `rgba(30, 55, 28, ${dark + 0.05})`;
          else ctx.fillStyle = `rgba(40, 32, 30, ${dark + 0.05})`;
          ctx.fillRect(px, py, 20, 10);
        }
      }
      ctx.restore();
    }

    drawBuilding(ctx, b) {
      const x = b.x * T;
      const y = b.y * T;
      const w = b.w * T;
      const h = b.h * T;
      if (b.id === "town_square") {
        ctx.fillStyle = "#a38657";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        for (let yy = y; yy < y + h; yy += 16) {
          ctx.beginPath();
          ctx.moveTo(x, yy);
          ctx.lineTo(x + w, yy);
          ctx.stroke();
        }
        for (let xx = x; xx < x + w; xx += 16) {
          ctx.beginPath();
          ctx.moveTo(xx, y);
          ctx.lineTo(xx, y + h);
          ctx.stroke();
        }
        ctx.fillStyle = "#5b6169";
        ctx.fillRect(x + w / 2 - 10, y + h / 2 - 30, 20, 52);
        ctx.fillStyle = "#f5b74d";
        ctx.fillRect(x + w / 2 - 4, y + h / 2 - 40, 8, 10);
        return;
      }
      if (b.id === "old_well") {
        ctx.fillStyle = "#4f5660";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#172736";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (b.id === "chapel" || b.id === "cross_shrine") {
        ctx.fillStyle = "#9a8c78";
        ctx.fillRect(x + 6, y + 22, w - 12, h - 22);
        ctx.fillStyle = "#d4c4a8";
        ctx.fillRect(x + 4, y + 8, w - 8, 22);
        ctx.fillStyle = "#f5b74d";
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 4);
        ctx.lineTo(x + w - 8, y + 14);
        ctx.lineTo(x + 8, y + 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#2a2430";
        ctx.fillRect(x + w / 2 - 5, y + 28, 10, 14);
        ctx.fillStyle = "#f7ead4";
        ctx.fillText(b.name, x + 12, y + h - 4);
        return;
      }
      if (b.id === "cross_mill" || b.id === "moor_warehouse") {
        ctx.fillStyle = "#7a5c3a";
        ctx.fillRect(x + 6, y + 28, w - 12, h - 28);
        ctx.fillStyle = "#5a4630";
        ctx.fillRect(x + 10, y + 10, w - 20, 22);
        ctx.fillStyle = "#c4a882";
        for (let i = 0; i < 5; i += 1) {
          ctx.fillRect(x + 14 + i * ((w - 28) / 4), y + 14, 3, 14);
        }
        ctx.fillStyle = "#8b7355";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x + 8, y + h - 14, Math.min(w - 16, ctx.measureText(b.name).width + 12), 15);
        ctx.fillStyle = "#f7ead4";
        ctx.fillText(b.name, x + 14, y + h - 3);
        return;
      }
      if (b.id === "cross_square" || b.id === "moor_square") {
        ctx.fillStyle = b.id === "moor_square" ? "#6d7a82" : "#9a7f58";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x + 8, y + h - 14, Math.min(w - 16, ctx.measureText(b.name).width + 12), 15);
        ctx.fillStyle = "#f7ead4";
        ctx.fillText(b.name, x + 14, y + h - 3);
        return;
      }
      if (b.id === "guild_hall") {
        ctx.fillStyle = "#4a5568";
        ctx.fillRect(x + 6, y + 26, w - 12, h - 26);
        ctx.fillStyle = "#384252";
        ctx.fillRect(x, y + 10, w, 22);
        ctx.strokeStyle = "#f5b74d";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 12, w - 8, 18);
        ctx.lineWidth = 1;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x + 8, y + h - 14, Math.min(w - 16, ctx.measureText(b.name).width + 12), 15);
        ctx.fillStyle = "#f7ead4";
        ctx.fillText(b.name, x + 14, y + h - 3);
        return;
      }
      if (b.id === "stables") {
        ctx.fillStyle = "#6b4f3a";
        ctx.fillRect(x + 6, y + 22, w - 12, h - 22);
        ctx.fillStyle = "#8b6914";
        ctx.fillRect(x + 8, y + 12, w - 16, 14);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x + 12, y + 16, 8, 10);
        ctx.fillRect(x + w - 20, y + 16, 8, 10);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x + 8, y + h - 14, Math.min(w - 16, ctx.measureText(b.name).width + 12), 15);
        ctx.fillStyle = "#f7ead4";
        ctx.fillText(b.name, x + 14, y + h - 3);
        return;
      }
      if (b.id === "moor_wharf" || b.id === "moor_chandler") {
        ctx.fillStyle = "#5c4a42";
        ctx.fillRect(x + 4, y + 24, w - 8, h - 24);
        ctx.fillStyle = "#3d6a7a";
        ctx.fillRect(x + 6, y + 12, w - 12, 16);
        ctx.fillStyle = "#2a4a58";
        ctx.fillRect(x + 10, y + 16, w - 20, 6);
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x + 8, y + h - 14, Math.min(w - 16, ctx.measureText(b.name).width + 12), 15);
        ctx.fillStyle = "#f7ead4";
        ctx.fillText(b.name, x + 14, y + h - 3);
        return;
      }
      const levelBoost = b.id === "player_house" ? this.game.house.level : 0;
      ctx.fillStyle = b.id === "player_house" ? ["#73402f", "#8f5a3b", "#a76842", "#c3834e"][levelBoost] : "#6e4634";
      ctx.fillRect(x + 8, y + 24, w - 16, h - 24);
      ctx.fillStyle = b.id === "mage_tower" ? "#514084" : b.id === "blacksmith" ? "#5c3540" : "#813d32";
      ctx.fillRect(x, y + 8, w, 26);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(x + 12, y + h - 26, 22, 26);
      ctx.fillStyle = "#f2c86a";
      if (this.game.clock.hour > 18 || this.game.weather.current !== "Clear") {
        ctx.fillRect(x + w - 34, y + 42, 12, 12);
      } else {
        ctx.fillRect(x + w - 34, y + 42, 12, 8);
      }
      if (b.id === "blacksmith") {
        ctx.fillStyle = "#e16b2f";
        ctx.fillRect(x + w - 38, y + h - 34, 18, 12);
      }
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(x + 8, y + h - 14, Math.min(w - 16, ctx.measureText(b.name).width + 12), 15);
      ctx.fillStyle = "#f7ead4";
      ctx.fillText(b.name, x + 14, y + h - 3);
    }

    drawLandmark(ctx, landmark) {
      const x = landmark.x * T;
      const y = landmark.y * T;
      ctx.strokeStyle = "rgba(245, 183, 77, 0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, landmark.w * T, landmark.h * T);
      ctx.fillStyle = "rgba(245, 183, 77, 0.14)";
      ctx.fillRect(x, y, landmark.w * T, landmark.h * T);
    }

    drawInteractables(ctx) {
      const map = this.maps[this.region.id];
      if (map && map.meta && map.meta.pickups) {
        for (const pk of map.meta.pickups) {
          if (this.openedChests[pk.id]) continue;
          const px = pk.x * T + 16;
          const py = pk.y * T + 16;
          ctx.fillStyle = "rgba(245, 183, 77, 0.35)";
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#6e4325";
          ctx.fillRect(px - 8, py - 6, 16, 12);
          ctx.fillStyle = "#f5b74d";
          ctx.fillRect(px - 3, py - 9, 6, 5);
        }
      }
      for (const chest of this.region.chests || []) {
        if (this.openedChests[chest.id]) continue;
        const x = chest.x * T + 7;
        const y = chest.y * T + 12;
        ctx.fillStyle = "#6e4325";
        ctx.fillRect(x, y, 18, 14);
        ctx.fillStyle = "#f5b74d";
        ctx.fillRect(x + 7, y + 5, 4, 4);
      }
      for (const resource of this.region.resources || []) {
        if (!this.resourceReady(resource)) continue;
        const x = resource.x * T + 16;
        const y = resource.y * T + 18;
        ctx.fillStyle = this.resourceColor(resource.id);
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(x - 2, y - 7, 4, 4);
      }
      this.drawGuidanceOutline(ctx);
      if (this.interactHint) {
        const player = this.game.player;
        ctx.fillStyle = "rgba(0,0,0,0.68)";
        const text = `Space: ${this.interactHint}`;
        const w = ctx.measureText(text).width + 14;
        ctx.fillRect(player.x - w / 2, player.y - 64, w, 20);
        ctx.fillStyle = "#f7ead4";
        ctx.fillText(text, player.x - w / 2 + 7, player.y - 50);
      }
      if (this.regionTitleTimer > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.regionTitleTimer);
        ctx.fillStyle = "rgba(0,0,0,0.58)";
        ctx.fillRect(this.game.camera.x + 24, this.game.camera.y + 78, 260, 36);
        ctx.fillStyle = "#f5b74d";
        ctx.font = "18px serif";
        ctx.fillText(this.region.name, this.game.camera.x + 40, this.game.camera.y + 102);
        ctx.restore();
      }
    }

    drawGuidanceOutline(ctx) {
      const guidance = this.game.guidance && this.game.guidance.current();
      if (!guidance || !guidance.sameRegion || guidance.state !== KOE.GUIDANCE_STATE.DISCOVERED) return;
      if (guidance.distance > 520) return;
      const pulse = 1 + Math.sin(this.game.guidance.pulse * 4.2) * 0.08;
      ctx.save();
      ctx.strokeStyle = guidance.color;
      ctx.globalAlpha = guidance.distance < 190 ? 0.72 : 0.42;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(guidance.point.x, guidance.point.y, 22 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha *= 0.22;
      ctx.fillStyle = guidance.color;
      ctx.beginPath();
      ctx.arc(guidance.point.x, guidance.point.y, 22 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    resourceColor(id) {
      if (id.includes("crystal") || id.includes("frost")) return "#8fd9ff";
      if (id.includes("ore") || id.includes("coal")) return "#a0a6ad";
      if (id.includes("pepper") || id.includes("ember")) return "#ff8a4a";
      if (id.includes("relic") || id.includes("seal") || id.includes("crown")) return "#f5b74d";
      if (id.includes("page") || id.includes("book") || id.includes("letter")) return "#ead8ad";
      return "#76d17f";
    }
  };
}());
