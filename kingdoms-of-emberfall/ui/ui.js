(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.UI = class {
    constructor(game) {
      this.game = game;
      this.menu = document.getElementById("menu");
      this.content = document.getElementById("menuContent");
      this.tabs = Array.from(this.menu.querySelectorAll(".tabs button"));
      this.questTracker = document.getElementById("questTracker");
      this.timeLabel = document.getElementById("timeLabel");
      this.weatherLabel = document.getElementById("weatherLabel");
      this.minimap = document.getElementById("minimap");
      this.minictx = this.minimap.getContext("2d");
      this.compass = document.getElementById("compass");
      this.compassCardinals = this.compass ? this.compass.querySelector(".compass-cardinals") : null;
      this.compassLandmarks = this.compass ? this.compass.querySelector(".compass-landmarks") : null;
      this.compassQuestMarker = this.compass ? this.compass.querySelector(".compass-quest-marker") : null;
      this.minimapZoom = document.getElementById("minimapZoom");
      this.actionHud = document.getElementById("actionHud");
      this._minimapRegion = "";
      this._minimapStatic = null;
      this._minimapFogLayer = null;
      this._minimapZoom = 1;
      this._minimapViewKey = "";
      this._minimapFogKey = "";
      this.menuOpen = false;
      this.activeTab = "inventory";
      this.tabs.forEach((button) => button.addEventListener("click", () => this.open(button.dataset.tab)));
      if (this.compassCardinals) {
        this.compassCardinals.innerHTML = ["N", "E", "S", "W"].map((dir) => `<span data-dir="${dir}">${dir}</span>`).join("");
      }
      if (this.minimapZoom) {
        this.minimapZoom.addEventListener("click", () => this.toggleMinimapZoom());
      }
    }

    update(input) {
      if (input.justPressed("Tab") || input.justPressed("i")) {
        this.toggle(this.activeTab);
        this.game.audio.sfx("ui");
      }
      if (input.justPressed("m")) this.toggle("map");
      if (input.justPressed("c")) this.toggle("skills");
      if (input.justPressed("h")) this.toggle("house");
      if (input.justPressed("z")) this.toggleMinimapZoom();
      if (input.justPressed("Escape")) {
        if (this.menuOpen) this.close();
        if (this.game.economy.current) this.game.economy.close();
      }
      this.renderHud();
    }

    toggle(tab) {
      if (this.menuOpen && this.activeTab === tab) this.close();
      else this.open(tab);
    }

    open(tab) {
      this.menuOpen = true;
      this.activeTab = tab || this.activeTab;
      this.menu.classList.remove("hidden");
      this.tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === this.activeTab));
      this.renderMenu();
    }

    close() {
      this.menuOpen = false;
      this.menu.classList.add("hidden");
    }

    openHouse() {
      this.open("house");
    }

    resetMinimapCache() {
      this._minimapRegion = "";
      this._minimapStatic = null;
      this._minimapFogLayer = null;
      this._minimapZoom = 0;
      this._minimapViewKey = "";
      this._minimapFogKey = "";
    }

    toggleMinimapZoom() {
      const levels = [1, 1.6, 2.2];
      const current = this.game.world.minimapZoom || 1;
      const index = levels.indexOf(current);
      this.game.world.minimapZoom = levels[(index + 1) % levels.length];
      if (this.minimapZoom) this.minimapZoom.textContent = this.game.world.minimapZoom === 1 ? "+" : "−";
      this.resetMinimapCache();
      this.game.toast(this.game.world.minimapZoom === 1 ? "Minimap zoom: region view" : "Minimap zoom: local view");
      this.game.audio.sfx("ui");
      this.game.save.save({ quiet: true });
    }

    formatSaveTime(ts) {
      if (!ts) return "";
      try {
        return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      } catch (e) {
        return "";
      }
    }

    onSaveComplete(savedAt, meta) {
      const quiet = meta && meta.quiet;
      const line = document.getElementById("saveLine");
      if (line && savedAt) line.textContent = `Save ${this.formatSaveTime(savedAt)}`;
      if (quiet) return;
      const ribbon = document.getElementById("saveRibbon");
      const text = document.getElementById("saveRibbonText");
      if (text && savedAt) text.textContent = `Saved · ${this.formatSaveTime(savedAt)}`;
      if (ribbon) {
        ribbon.classList.remove("hidden");
        ribbon.classList.remove("save-pulse");
        void ribbon.offsetWidth;
        ribbon.classList.add("save-pulse");
        clearTimeout(this._saveHideTimer);
        this._saveHideTimer = setTimeout(() => ribbon.classList.add("hidden"), 2400);
      }
      this.game.audio.sfx("ui");
    }

    beginLoadCurtain() {
      document.getElementById("loadCurtain")?.classList.remove("hidden");
    }

    endLoadCurtain() {
      const el = document.getElementById("loadCurtain");
      setTimeout(() => el?.classList.add("hidden"), 180);
    }

    renderHud() {
      const player = this.game.player;
      document.querySelector(".bar.health span").style.width = `${KOE.clamp(player.health / player.maxHealth, 0, 1) * 100}%`;
      document.querySelector(".bar.mana span").style.width = `${KOE.clamp(player.mana / player.maxMana, 0, 1) * 100}%`;
      document.querySelector(".bar.stamina span").style.width = `${KOE.clamp(player.stamina / player.maxStamina, 0, 1) * 100}%`;
      this.timeLabel.textContent = this.game.clock.format();
      this.weatherLabel.textContent = `${this.game.weather.current} · ${this.game.world.region.name}`;
      const saveLine = document.getElementById("saveLine");
      if (saveLine) {
        saveLine.textContent = this.game.save.lastSavedAt ? `Save ${this.formatSaveTime(this.game.save.lastSavedAt)}` : "—";
      }
      if (this.minimapZoom) this.minimapZoom.textContent = (this.game.world.minimapZoom || 1) === 1 ? "+" : "−";
      const tracked = this.game.quests.tracked();
      const navHint = this.game.quests.suggestedNextStep();
      if (tracked) {
        const quest = this.game.quests.defs.get(tracked.id);
        const lines = quest.objectives.map((objective, index) => {
          const state = this.game.quests.objectiveState(tracked.id, index);
          return `${objective.text} · ${state.toLowerCase()} (${tracked.progress[index]}/${objective.count})`;
        });
        this.questTracker.innerHTML = `<h2>${KOE.sanitize(quest.title)}</h2><p class="quest-nav-hint">${KOE.sanitize(navHint)}</p><p>${lines.map(KOE.sanitize).join("<br>")}</p>`;
      } else {
        this.questTracker.innerHTML = `<h2>Adventure</h2><p class="quest-nav-hint">${KOE.sanitize(navHint)}</p><p>Open Journal (Tab) for the full log.</p>`;
      }
      this.drawMinimap();
      this.syncCompass();
      this.syncActionHud();
    }

    syncCompass() {
      if (!this.compass) return;
      const guidance = this.game.guidance.current();
      const player = this.game.player;
      const facing = Math.atan2(player.facing.y, player.facing.x);
      const center = this.compass.clientWidth / 2 || 180;
      const range = Math.max(120, center - 22);
      const place = (angle) => {
        let delta = angle - facing;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        return KOE.clamp(center + (delta / Math.PI) * range, 12, center * 2 - 12);
      };

      if (this.compassCardinals) {
        const dirs = [
          { dir: "N", angle: -Math.PI / 2 },
          { dir: "E", angle: 0 },
          { dir: "S", angle: Math.PI / 2 },
          { dir: "W", angle: Math.PI }
        ];
        for (const item of dirs) {
          const el = this.compassCardinals.querySelector(`[data-dir="${item.dir}"]`);
          if (!el) continue;
          el.style.left = `${place(item.angle)}px`;
        }
      }

      if (this.compassQuestMarker) {
        if (guidance && guidance.state !== KOE.GUIDANCE_STATE.COMPLETE) {
          this.compassQuestMarker.classList.remove("hidden");
          this.compassQuestMarker.style.left = `${place(guidance.angle)}px`;
          this.compassQuestMarker.style.borderColor = guidance.color;
          this.compassQuestMarker.style.backgroundColor = guidance.color;
          this.compassQuestMarker.title = guidance.label;
          this.compassQuestMarker.dataset.state = guidance.state;
        } else {
          this.compassQuestMarker.classList.add("hidden");
        }
      }

      if (this.compassLandmarks) {
        const html = this.game.guidance.nearbyLandmarks().slice(0, 6).map((landmark) => {
          const angle = Math.atan2(landmark.py - player.y, landmark.px - player.x);
          const x = place(angle);
          const icon = this.landmarkIcon(landmark.type);
          return `<span class="compass-landmark compass-${landmark.type}" style="left:${x}px" title="${KOE.sanitize(landmark.name)}">${icon}</span>`;
        }).join("");
        if (this.compassLandmarks.dataset.html !== html) {
          this.compassLandmarks.dataset.html = html;
          this.compassLandmarks.innerHTML = html;
        }
      }
    }

    landmarkIcon(type) {
      return {
        blacksmith: "◆",
        inn: "⌂",
        quest: "!",
        dungeon: "⌄",
        caravan: "↔",
        bounty: "×",
        home: "⌂"
      }[type] || "•";
    }

    syncActionHud() {
      const root = this.actionHud;
      if (!root) return;
      const p = this.game.player;
      const set = (sel, cd, max) => {
        const el = root.querySelector(sel);
        if (!el) return;
        const t = max > 0 ? KOE.clamp(cd / max, 0, 1) : 0;
        el.style.transform = `scaleX(${t})`;
      };
      set(".cd-blade", p.attackCooldown, 0.2);
      set(".cd-bow", p.rangedCooldown, 0.5);
      set(".cd-magic", p.magicCooldown, 0.66);
      set(".cd-dodge", p.dodgeCooldown, 0.48);
    }

    drawMinimap() {
      const ctx = this.minictx;
      const world = this.game.world;
      const zoom = world.minimapZoom || 1;
      const viewW = world.width / zoom;
      const viewH = world.height / zoom;
      const playerTileX = this.game.player.x / KOE.TILE;
      const playerTileY = this.game.player.y / KOE.TILE;
      const left = KOE.clamp(playerTileX - viewW / 2, 0, Math.max(0, world.width - viewW));
      const top = KOE.clamp(playerTileY - viewH / 2, 0, Math.max(0, world.height - viewH));
      const sx = this.minimap.width / viewW;
      const sy = this.minimap.height / viewH;
      const viewKey = zoom === 1 ? "full" : `${Math.floor(left)}:${Math.floor(top)}`;
      const toMini = (tx, ty) => ({ x: (tx - left) * sx, y: (ty - top) * sy });
      const map = world.maps[world.region.id] || world.generateRegion(world.region);
      world.maps[world.region.id] = map;
      if (this._minimapRegion !== world.region.id || this._minimapZoom !== zoom || this._minimapViewKey !== viewKey || !this._minimapStatic) {
        this._minimapRegion = world.region.id;
        this._minimapZoom = zoom;
        this._minimapViewKey = viewKey;
        if (!this._minimapStatic) this._minimapStatic = document.createElement("canvas");
        this._minimapStatic.width = this.minimap.width;
        this._minimapStatic.height = this.minimap.height;
        const sctx = this._minimapStatic.getContext("2d");
        sctx.fillStyle = "#10151c";
        sctx.fillRect(0, 0, this.minimap.width, this.minimap.height);
        const startX = Math.floor(left);
        const startY = Math.floor(top);
        const endX = Math.min(world.width, Math.ceil(left + viewW) + 1);
        const endY = Math.min(world.height, Math.ceil(top + viewH) + 1);
        for (let y = startY; y < endY; y += 1) {
          for (let x = startX; x < endX; x += 1) {
            const tile = map.tiles[y * world.width + x];
            sctx.fillStyle = this.tileColor(tile);
            const p = toMini(x, y);
            sctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(sx), Math.ceil(sy));
          }
        }
      }
      ctx.clearRect(0, 0, this.minimap.width, this.minimap.height);
      ctx.drawImage(this._minimapStatic, 0, 0);

      this.drawMinimapFog(ctx, toMini, left, top, viewW, viewH, sx, sy);
      this.drawMinimapLandmarks(ctx, toMini);
      this.drawMinimapObjective(ctx, toMini, sx, sy);

      ctx.fillStyle = "#e45b4a";
      for (const enemy of world.enemies) {
        if (!enemy.dead && KOE.dist(enemy, this.game.player) < 360) {
          const p = toMini(enemy.x / KOE.TILE, enemy.y / KOE.TILE);
          if (p.x >= 0 && p.y >= 0 && p.x <= this.minimap.width && p.y <= this.minimap.height) ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
      }
      this.drawMinimapPlayer(ctx, toMini);
      this.drawMinimapRegionLabel(ctx);
    }

    drawMinimapFog(ctx, toMini, left, top, viewW, viewH, sx, sy) {
      const fog = this.game.world.minimapFog[this.game.world.region.id] || {};
      const fogKey = `${this.game.world.region.id}:${this._minimapViewKey}:${this.game.world.minimapFogVersion}`;
      if (!this._minimapFogLayer) this._minimapFogLayer = document.createElement("canvas");
      if (this._minimapFogLayer.width !== this.minimap.width || this._minimapFogLayer.height !== this.minimap.height) {
        this._minimapFogLayer.width = this.minimap.width;
        this._minimapFogLayer.height = this.minimap.height;
        this._minimapFogKey = "";
      }
      if (this._minimapFogKey !== fogKey) {
        this._minimapFogKey = fogKey;
        const fctx = this._minimapFogLayer.getContext("2d");
        fctx.clearRect(0, 0, this.minimap.width, this.minimap.height);
        fctx.fillStyle = "rgba(4, 7, 10, 0.58)";
        const step = Math.max(2, Math.floor(zoomSafe(sx, sy)));
        const startX = Math.floor(left);
        const startY = Math.floor(top);
        const endX = Math.ceil(left + viewW);
        const endY = Math.ceil(top + viewH);
        for (let y = startY; y < endY; y += step) {
          for (let x = startX; x < endX; x += step) {
            if (fog[`${x},${y}`]) continue;
            const p = toMini(x, y);
            fctx.fillRect(p.x, p.y, Math.ceil(sx * step) + 1, Math.ceil(sy * step) + 1);
          }
        }
      }
      ctx.drawImage(this._minimapFogLayer, 0, 0);

      function zoomSafe(a, b) {
        return Math.max(1, Math.min(a, b));
      }
    }

    drawMinimapLandmarks(ctx, toMini) {
      const world = this.game.world;
      const landmarks = KOE.LANDMARKS[world.region.id] || [];
      for (const landmark of landmarks) {
        const discovered = world.discoveredLandmarks[landmark.id];
        const near = Math.hypot(this.game.player.x / KOE.TILE - landmark.x, this.game.player.y / KOE.TILE - landmark.y) < 18;
        if (!discovered && !near) continue;
        const p = toMini(landmark.x, landmark.y);
        if (p.x < -6 || p.y < -6 || p.x > this.minimap.width + 6 || p.y > this.minimap.height + 6) continue;
        ctx.save();
        ctx.fillStyle = this.landmarkColor(landmark.type);
        ctx.strokeStyle = "rgba(0,0,0,0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = "#10151c";
        ctx.font = "7px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this.landmarkIcon(landmark.type), p.x, p.y + 2);
        ctx.restore();
      }
    }

    landmarkColor(type) {
      return {
        blacksmith: "#ff9b54",
        inn: "#8fd26a",
        quest: "#f5b74d",
        dungeon: "#b98cff",
        caravan: "#75c7ff",
        bounty: "#e45b4a",
        home: "#f7ead4"
      }[type] || "#f7ead4";
    }

    drawMinimapObjective(ctx, toMini, sx, sy) {
      const guidance = this.game.guidance.current();
      if (!guidance || guidance.state === KOE.GUIDANCE_STATE.COMPLETE || !guidance.sameRegion) return;
      const tx = guidance.point.x / KOE.TILE;
      const ty = guidance.point.y / KOE.TILE;
      const p = toMini(tx, ty);
      ctx.save();
      ctx.strokeStyle = guidance.color;
      ctx.fillStyle = guidance.color;
      ctx.lineWidth = 2;
      if (guidance.state === KOE.GUIDANCE_STATE.SEARCH) {
        const r = KOE.clamp((guidance.searchRadius / KOE.TILE) * Math.min(sx, sy), 10, 42);
        ctx.globalAlpha = 0.38 + Math.sin(this.game.guidance.pulse * 2.3) * 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (guidance.state === KOE.GUIDANCE_STATE.DISCOVERED) {
        const pulse = 1 + Math.sin(this.game.guidance.pulse * 5) * 0.18;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 7 * pulse);
        ctx.lineTo(p.x + 6 * pulse, p.y + 5 * pulse);
        ctx.lineTo(p.x - 6 * pulse, p.y + 5 * pulse);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    drawMinimapPlayer(ctx, toMini) {
      const player = this.game.player;
      const p = toMini(player.x / KOE.TILE, player.y / KOE.TILE);
      const angle = Math.atan2(player.facing.y, player.facing.x);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.fillStyle = "#f5b74d";
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    drawMinimapRegionLabel(ctx) {
      const alpha = KOE.clamp(this.game.world.regionTitleTimer / 3, 0, 1);
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(0,0,0,0.58)";
      ctx.fillRect(8, 8, this.minimap.width - 16, 18);
      ctx.fillStyle = "#f7ead4";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(this.game.world.region.name, this.minimap.width / 2, 21);
      ctx.restore();
    }

    tileColor(tile) {
      return {
        grass: "#3f7441",
        path: "#a38657",
        water: "#226b89",
        forest: "#255536",
        rock: "#555a62",
        snow: "#d7e8ec",
        swamp: "#314c31",
        crystal: "#5b70c7",
        ruin: "#746b5e",
        lava: "#a13924",
        floor: "#66594c",
        roof: "#813d32"
      }[tile] || "#333";
    }

    renderMenu() {
      if (!this.menuOpen) return;
      if (this.activeTab === "inventory") this.renderInventory();
      if (this.activeTab === "quests") this.renderQuests();
      if (this.activeTab === "skills") this.renderSkills();
      if (this.activeTab === "map") this.renderWorldMap();
      if (this.activeTab === "house") this.renderHouse();
      if (this.activeTab === "help") this.renderHelp();
    }

    renderInventory() {
      const inv = this.game.inventory;
      const equipment = Object.entries(inv.equipment).map(([slot, id]) => `<p><strong>${slot}</strong>: ${id ? KOE.ITEMS[id].name : "Empty"}</p>`).join("");
      const rows = Object.entries(inv.items).sort().map(([id, qty]) => {
        const item = KOE.ITEMS[id];
        if (!item) return "";
        const actions = [];
        if (item.type === "consumable") actions.push(`<button data-use="${id}">Use</button>`);
        if (item.slot) actions.push(`<button data-equip="${id}">Equip</button>`);
        const rarity = String(item.rarity || "common").toLowerCase();
        return `<div class="item-row rarity-${KOE.sanitize(rarity)}"><h3>${KOE.sanitize(item.name)} x${qty}</h3><p><span class="rarity-badge badge-${KOE.sanitize(rarity)}">${KOE.sanitize(item.rarity)}</span> · ${KOE.sanitize(item.type)}</p><p>${KOE.sanitize(item.desc)}</p>${actions.join(" ")}</div>`;
      }).join("");
      this.content.innerHTML = `<h2>Inventory</h2><p>Gold: ${inv.gold} · Level ${this.game.player.level} · XP ${this.game.player.xp}/${this.game.player.xpToNext()}</p><div class="card">${equipment}</div><div class="grid">${rows || "<p>No items yet.</p>"}</div><p class="small">Quick use: 1 health potion, 2 mana tonic, 3 stamina tonic.</p>`;
      this.content.querySelectorAll("[data-use]").forEach((button) => button.addEventListener("click", () => { inv.use(button.dataset.use); this.renderInventory(); }));
      this.content.querySelectorAll("[data-equip]").forEach((button) => button.addEventListener("click", () => { inv.equip(button.dataset.equip); this.renderInventory(); }));
    }

    renderQuests() {
      const qm = this.game.quests;
      const phase = qm.currentStoryPhase();
      const storyActive = Object.entries(qm.active).filter(([, st]) => qm.defs.get(st.id)?.type === "story");
      const sideActive = Object.entries(qm.active).filter(([, st]) => qm.defs.get(st.id)?.type !== "story");
      const fmtActive = (entries) => entries.map(([_, state]) => {
        const quest = qm.defs.get(state.id);
        const objectives = quest.objectives.map((objective, index) => {
          const targetState = qm.objectiveState(state.id, index);
          return `<li>${KOE.sanitize(objective.text)} <span class="target-state state-${targetState.toLowerCase()}">${targetState}</span> <span class="prog">${state.progress[index]}/${objective.count}</span></li>`;
        }).join("");
        const rew = qm.formatRewards(quest);
        return `<div class="quest-row quest-row-${quest.type || "side"}"><div class="quest-head"><h3>${KOE.sanitize(quest.title)}</h3><span class="reward-tag">${KOE.sanitize(rew)}</span></div><p class="small">${KOE.sanitize(quest.summary)}</p><ul class="obj-list">${objectives}</ul><button type="button" data-track="${state.id}" class="${state.tracked ? "tracked" : ""}">${state.tracked ? "Pinned to HUD" : "Pin to HUD"}</button></div>`;
      }).join("");

      const chronicle = (KOE.ADVENTURE_NOTES || []).filter((n) => qm.unlockedNotes[n.id]).map((n) =>
        `<div class="chronicle-entry"><h4>${KOE.sanitize(n.title)}</h4><p>${KOE.sanitize(n.body)}</p><span class="small">Recorded day ${qm.unlockedNotes[n.id]}</span></div>`
      ).join("") || "<p class=\"small\">Complete story milestones to add chronicle entries.</p>";

      const completedStory = (KOE.STORY_CHAIN || []).filter((id) => qm.completed[id]).map((id) => {
        const quest = qm.defs.get(id);
        return `<li>${KOE.sanitize(quest.title)}</li>`;
      }).join("");

      const completedSide = Object.keys(qm.completed).filter((id) => !KOE.STORY_CHAIN?.includes(id)).length;

      this.content.innerHTML = `
        <h2>Adventure journal</h2>
        <div class="journal-phase card">
          <h3>${KOE.sanitize(phase.label)}</h3>
          <p class="small">Main chapters ${phase.done}/${phase.total} in this act · ${KOE.sanitize(qm.suggestedNextStep())}</p>
        </div>
        <h2>Main chapter</h2>
        <div class="grid">${storyActive.length ? fmtActive(storyActive) : "<p class=\"small\">No active main quest — speak with allies marked in your last chronicle entry.</p>"}</div>
        <h2>Side & contracts</h2>
        <div class="grid">${sideActive.length ? fmtActive(sideActive) : "<p class=\"small\">Accept tasks from townsfolk or the notice board. New board jobs appear after you rest at home.</p>"}</div>
        <h2>Chronicle</h2>
        <div class="chronicle-scroll">${chronicle}</div>
        <details class="journal-done"><summary>Completed (${Object.keys(qm.completed).length})</summary>
          <ul class="done-story">${completedStory || "<li>—</li>"}</ul>
          <p class="small">Other finished quests: ${completedSide}</p>
        </details>`;
      this.content.querySelectorAll("[data-track]").forEach((button) => button.addEventListener("click", () => {
        qm.track(button.dataset.track);
        this.renderQuests();
      }));
    }

    renderSkills() {
      const player = this.game.player;
      const skills = [
        { id: "blade", name: "Bladecraft", desc: "+3 sword damage per rank." },
        { id: "ward", name: "Ward", desc: "+12 health and +2 defense per rank." },
        { id: "ranger", name: "Ranger", desc: "Move faster and gain stamina per rank." },
        { id: "hearth", name: "Hearth Magic", desc: "Regenerate mana and improve crafting magic." }
      ];
      const rows = skills.map((skill) => `<div class="skill-row"><h3>${skill.name} ${player.skills[skill.id]}/5</h3><p>${skill.desc}</p><button data-skill="${skill.id}">Learn</button></div>`).join("");
      this.content.innerHTML = `<h2>Skills</h2><p>Skill points: ${player.skillPoints}</p><div class="grid">${rows}</div><div class="card"><h3>Stats</h3><p>Attack ${player.attack + this.game.inventory.statBonus("attack")} · Magic ${player.magic + this.game.inventory.statBonus("magic")} · Defense ${player.defense}</p><p>HP ${Math.ceil(player.health)}/${player.maxHealth} · MP ${Math.ceil(player.mana)}/${player.maxMana} · Stamina ${Math.ceil(player.stamina)}/${player.maxStamina}</p></div>`;
      this.content.querySelectorAll("[data-skill]").forEach((button) => button.addEventListener("click", () => { player.learn(button.dataset.skill); this.renderSkills(); }));
    }

    renderWorldMap() {
      const w = this.game.world;
      const ft = KOE.FAST_TRAVEL || {};
      const canFt = w.canFastTravel();
      const pins = Object.keys(KOE.REGIONS).map((rid) => {
        const region = KOE.REGIONS[rid];
        const known = w.discovered[rid];
        const here = w.region.id === rid;
        const rumor = known && KOE.REGION_RUMORS && KOE.REGION_RUMORS[rid];
        return `<div class="map-pin card ${here ? "here" : ""} ${known ? "known" : ""}">
          <h3>${known ? region.name : "???"}</h3>
          <p class="small">${known ? `Danger ${region.danger}` : "Explore on foot to chart."}${here ? " · You are here" : ""}</p>
          ${known && rumor ? `<p class="rumor">${KOE.sanitize(rumor)}</p>` : ""}
        </div>`;
      }).join("");
      const travelBtns = (ft.points || []).map((pt) => {
        const ok = canFt && w.discovered[pt.region];
        const lockReason = !canFt ? "Unlocks when trade routes reopen (finish main chapter in Bandit Pass)." : !w.discovered[pt.region] ? "Walk there once first." : "";
        const disabled = ok ? "" : " disabled";
        return `<button type="button" class="travel-btn"${disabled} data-fast="${pt.region}" data-spawn-x="${pt.spawn.x}" data-spawn-y="${pt.spawn.y}" title="${KOE.sanitize(lockReason)}">${KOE.sanitize(pt.label)}${ok ? "" : " (locked)"}</button>`;
      }).join("");
      this.content.innerHTML = `
        <h2>World atlas</h2>
        <p class="small">You are in <strong>${KOE.sanitize(w.region.name)}</strong>. Regions reveal when you enter them. Rumors echo once per place.</p>
        <div class="grid map-pin-grid">${pins}</div>
        <div class="card travel-card"><h3>Ranger caravan routes</h3>
          <p class="small">${canFt ? "Fast travel between charted places your allies patrol." : "Complete <em>The Pass Must Open</em> so scheduled travel opens."}</p>
          <div class="travel-grid">${travelBtns}</div>
        </div>`;
      this.content.querySelectorAll("[data-fast]").forEach((btn) => {
        if (btn.disabled) return;
        btn.addEventListener("click", () => {
          const spawn = { x: Number(btn.dataset.spawnX), y: Number(btn.dataset.spawnY) };
          if (this.game.world.fastTravelTo(btn.dataset.fast, spawn)) this.renderWorldMap();
        });
      });
    }

    renderHouse() {
      const house = this.game.house;
      const cost = house.upgradeCost();
      const costText = cost ? cost.map((entry) => `${KOE.ITEMS[entry.id].name} x${entry.qty}`).join(", ") : "Fully upgraded";
      const furniture = house.furniture.map((item) => `<div class="card"><h3>${KOE.HOUSE_FURNITURE[item.type].name}</h3><p>Placed at room tile ${item.x + 1}, ${item.y + 1}</p></div>`).join("");
      const placeRows = Object.entries(KOE.HOUSE_FURNITURE).map(([id, def]) => {
        const costs = def.cost.map((entry) => `${KOE.ITEMS[entry.id].name} x${entry.qty}`).join(", ");
        return `<div class="item-row"><h3>${def.name}</h3><p>${def.desc}</p><p>${costs}</p><button data-place="${id}">Place</button></div>`;
      }).join("");
      const crafts = KOE.CRAFTS.map((craft) => `<div class="item-row"><h3>${craft.name}</h3><p>Station: ${craft.station}</p><p>${craft.cost.map((entry) => `${KOE.ITEMS[entry.id].name} x${entry.qty}`).join(", ")}</p><button data-craft="${craft.id}">Craft</button></div>`).join("");
      const cropsReady = house.crops.filter((crop) => crop.ready).length;
      this.content.innerHTML = `<h2>Player House</h2><p>Upgrade level ${house.level + 1}/4 · Capacity ${house.furniture.length}/${6 + house.level * 4}</p><div class="card"><h3>Upgrade</h3><p>${costText}</p><button data-house="upgrade">Upgrade House</button> <button data-house="sleep">Sleep/Save</button> <button data-house="harvest">Harvest Crops (${cropsReady})</button></div><h2>Placed</h2><div class="grid">${furniture || "<p>No furniture placed.</p>"}</div><h2>Place Furniture</h2><div class="grid">${placeRows}</div><h2>Crafting</h2><div class="grid">${crafts}</div>`;
      this.content.querySelectorAll("[data-place]").forEach((button) => button.addEventListener("click", () => { house.place(button.dataset.place); this.renderHouse(); }));
      this.content.querySelectorAll("[data-craft]").forEach((button) => button.addEventListener("click", () => { house.craft(button.dataset.craft); this.renderHouse(); }));
      this.content.querySelectorAll("[data-house]").forEach((button) => button.addEventListener("click", () => {
        if (button.dataset.house === "upgrade") house.upgrade();
        if (button.dataset.house === "sleep") house.sleep();
        if (button.dataset.house === "harvest") house.harvest();
        this.renderHouse();
      }));
    }

    renderHelp() {
      this.content.innerHTML = `<h2>Controls</h2><div class="grid"><div class="card"><h3>Movement</h3><p>WASD or arrows move. Hold Shift to sprint. Q dodge rolls.</p></div><div class="card"><h3>Combat</h3><p>J or click melee. K bow. L magic bolt. U spirit ward (defensive/support). F lock-on.</p></div><div class="card"><h3>Journal & world</h3><p>Tab opens the menu—use the Journal for the main story, side jobs, and chronicle. M opens the world atlas and caravan travel (after the pass reopens). C skills, H house. West gate → Long Vale.</p></div><div class="card"><h3>Saving</h3><p>Sleep at home, defeat major foes, or use autosave (quiet). Manual save shows a confirmation banner and updates the clock panel. A backup copy is kept if the main slot is damaged.</p><button data-save="save">Save Now</button> <button data-save="load">Load Save</button></div></div>`;
      this.content.querySelectorAll("[data-save]").forEach((button) => button.addEventListener("click", () => {
        if (button.dataset.save === "save") {
          this.game.save.save();
          this.game.toast("Game saved.");
        } else {
          this.game.save.load();
        }
      }));
    }
  };
}());
