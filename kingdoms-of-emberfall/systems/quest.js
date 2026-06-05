(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.QuestManager = class {
    constructor(game) {
      this.game = game;
      this.defs = new Map(KOE.QUESTS.map((quest) => [quest.id, quest]));
      this.active = {};
      this.completed = {};
      this.relationships = {};
      this.repeatableSeed = 1;
      this.unlockedNotes = {};
      // Prevent re-entrant / duplicated completion during UI callbacks.
      this._completionGuard = {};
    }

    setupNewGame() {
      this.active = {};
      this.completed = {};
      this.relationships = {};
      this.unlockedNotes = {};
      this.accept("story_arrival", true);
      this.generateRepeatables();
    }

    generateRepeatables() {
      const rng = KOE.mulberry32(KOE.hash(`repeat-${this.game.clock.day}-${this.repeatableSeed}`));
      for (const template of KOE.REPEATABLE_QUESTS) {
        const target = KOE.pick(template.targetPool, rng);
        const count = Math.floor(template.count[0] + rng() * (template.count[1] - template.count[0] + 1));
        const gold = Math.floor(template.rewardGold[0] + rng() * (template.rewardGold[1] - template.rewardGold[0] + 1));
        const xp = Math.floor(template.rewardXp[0] + rng() * (template.rewardXp[1] - template.rewardXp[0] + 1));
        const id = `${template.id}_${this.game.clock.day}`;
        if (this.defs.has(id) || this.completed[id]) continue;
        const isExplore = template.type === "dungeon";
        this.defs.set(id, {
          id,
          type: template.type,
          title: template.title,
          giver: template.giver,
          repeatable: true,
          summary: isExplore ? "Investigate a fresh rumor posted on the town board." : "A fresh task posted for anyone brave and solvent.",
          objectives: [{
            type: isExplore ? "explore" : template.type === "bounty" ? "kill" : "collect",
            target,
            count,
            text: isExplore ? `Investigate ${this.pretty(target)}` : template.type === "bounty" ? `Defeat ${count} ${this.pretty(target)}` : `Bring ${count} ${this.pretty(target)}`
          }],
          rewards: { gold, xp }
        });
      }
    }

    getAvailableForNpc(npcId) {
      const npc = KOE.NPCS.find((item) => item.id === npcId);
      if (!npc) return [];
      const ids = new Set(npc.quests || []);
      for (const [id, quest] of this.defs) {
        if (quest.repeatable && quest.giver === npcId && !this.active[id] && !this.completed[id]) ids.add(id);
      }
      return Array.from(ids)
        .map((id) => this.defs.get(id))
        .filter((quest) => quest && this.canOffer(quest));
    }

    canOffer(quest) {
      if (this.active[quest.id] || this.completed[quest.id]) return false;
      if (quest.requires && !this.completed[quest.requires]) return false;
      return true;
    }

    accept(id, silent) {
      const quest = this.defs.get(id);
      if (!quest || this.active[id] || this.completed[id]) return false;
      const trackStory = quest.type === "story";
      if (trackStory) {
        for (const state of Object.values(this.active)) state.tracked = false;
      }
      this.active[id] = {
        id,
        progress: quest.objectives.map(() => 0),
        tracked: trackStory || Object.keys(this.active).length === 0
      };
      if (this.game.guidance) this.game.guidance.clearCache();
      this.refreshInventoryObjectives(id);
      if (!silent) {
        this.game.toast(`Quest accepted: ${quest.title}`);
        this.game.audio.sfx("quest");
      }
      return true;
    }

    refreshInventoryObjectives(id) {
      const state = this.active[id];
      const quest = this.defs.get(id);
      if (!state || !quest) return;
      quest.objectives.forEach((objective, index) => {
        if (objective.type === "collect") {
          state.progress[index] = Math.min(objective.count, this.game.inventory.count(objective.target));
        }
      });
      this.tryComplete(id);
    }

    track(id) {
      for (const state of Object.values(this.active)) state.tracked = false;
      if (this.active[id]) this.active[id].tracked = true;
      if (this.game.guidance) this.game.guidance.clearCache();
    }

    onCollect(itemId) {
      for (const [id, state] of Object.entries(this.active)) {
        const quest = this.defs.get(id);
        quest.objectives.forEach((objective, index) => {
          if (objective.type === "collect" && objective.target === itemId) {
            state.progress[index] = Math.min(objective.count, this.game.inventory.count(itemId));
          }
        });
        this.tryComplete(id);
      }
    }

    onKill(enemyType) {
      this.increment("kill", enemyType, 1);
    }

    onBoss(bossType) {
      this.increment("boss", bossType, 1);
    }

    onExplore(landmarkId) {
      this.increment("explore", landmarkId, 1);
    }

    onHouse(target, amount) {
      this.increment("house", target, amount || 1, true);
    }

    onRelationship() {
      for (const [id, state] of Object.entries(this.active)) {
        const quest = this.defs.get(id);
        quest.objectives.forEach((objective, index) => {
          if (objective.type === "relationship") {
            const value = objective.target === "town"
              ? Object.values(this.relationships).reduce((sum, num) => sum + num, 0)
              : (this.relationships[objective.target] || 0);
            state.progress[index] = Math.min(objective.count, value);
          }
        });
        this.tryComplete(id);
      }
    }

    increment(type, target, amount, absolute) {
      for (const [id, state] of Object.entries(this.active)) {
        const quest = this.defs.get(id);
        quest.objectives.forEach((objective, index) => {
          if (objective.type === type && objective.target === target) {
            state.progress[index] = absolute ? Math.min(objective.count, amount) : Math.min(objective.count, state.progress[index] + amount);
          }
        });
        this.tryComplete(id);
      }
    }

    tryComplete(id) {
      const state = this.active[id];
      const quest = this.defs.get(id);
      if (!state || !quest) return false;
      const done = quest.objectives.every((objective, index) => state.progress[index] >= objective.count);
      if (!done) return false;
      this.complete(id);
      return true;
    }

    complete(id) {
      const quest = this.defs.get(id);
      if (!quest) return false;
      if (!this.active[id]) {
        if (this.completed[id]) console.warn(`[QuestManager] Duplicate completion ignored: ${id}`);
        return false;
      }
      // Idempotency guard (re-entrant completions can happen when dialogue callbacks trigger quest events).
      if (this._completionGuard[id]) {
        console.warn(`[QuestManager] Completion re-entry blocked: ${id}`);
        return false;
      }
      this._completionGuard[id] = true;

      try {
        const rewards = quest.rewards || {};

        // Sanitize rewards to prevent malformed XP/gold from runaway level loops.
        const rawGold = Number(rewards.gold);
        const gold = Number.isFinite(rawGold) ? Math.max(0, Math.min(200000, rawGold)) : 0;

        const rawXp = Number(rewards.xp);
        // Hard cap per completion to prevent accidental giant XP spikes from freezing the game.
        const xpCap = 5000;
        const xp = Number.isFinite(rawXp) ? Math.max(0, Math.min(xpCap, rawXp)) : 0;

        // Mark completion first to ensure rewards apply only once, even if nested quest events occur.
        this.completed[id] = { day: this.game.clock.day };
        delete this.active[id];

        if (this.game.guidance) this.game.guidance.clearCache();

        if (gold > 0) this.game.inventory.add("gold", gold);
        if (xp > 0) this.game.player.gainXp(xp);

        if (Array.isArray(rewards.items)) {
          for (const item of rewards.items) {
            if (!item || !item.id) continue;
            const qty = Number(item.qty);
            if (!Number.isFinite(qty) || qty <= 0) continue;
            this.game.inventory.add(item.id, qty);
          }
        }

        if (rewards.relation && typeof rewards.relation === "object") {
          for (const [npc, amount] of Object.entries(rewards.relation)) {
            const n = Number(amount);
            if (!Number.isFinite(n) || n === 0) continue;
            this.addRelationship(npc, n, true);
          }
        }

        this.game.toast(`Quest complete: ${quest.title}`);
        this.game.audio.sfx("quest");
        this.unlockChronicleForMilestone(id);
        if (id === "story_bandit") this.game.toast("Caravan routes reopen—use the World atlas for fast travel between charted places.");
        if (id === "story_crystal") this.game.toast("The mage tower stocks spirit charms for ward-savers.");
        if (quest.next) this.accept(quest.next);
        this.onRelationship();
        return true;
      } finally {
        this._completionGuard[id] = false;
      }
    }

    unlockChronicleForMilestone(completedId) {
      const notes = KOE.ADVENTURE_NOTES || [];
      for (const note of notes) {
        if (note.unlockOnComplete !== completedId || this.unlockedNotes[note.id]) continue;
        this.unlockedNotes[note.id] = this.game.clock.day;
        this.game.toast(`Chronicle unlocked: ${note.title}`);
        this.game.audio.sfx("ui");
      }
    }

    currentStoryPhase() {
      for (const phase of ["early", "mid", "late"]) {
        const ids = KOE.STORY_PHASE_IDS[phase];
        if (!ids) continue;
        const done = ids.filter((qid) => this.completed[qid]).length;
        if (done < ids.length) return { phase, label: KOE.STORY_PHASE_LABELS[phase], done, total: ids.length };
      }
      return { phase: "done", label: "Epilogue — Your Emberfall", done: 1, total: 1 };
    }

    suggestedNextStep() {
      if (this.game.guidance) {
        const guidance = this.game.guidance.current();
        if (guidance && guidance.state !== KOE.GUIDANCE_STATE.COMPLETE) {
          if (guidance.sameRegion && guidance.state === KOE.GUIDANCE_STATE.DISCOVERED) return `Nearby: ${guidance.label}`;
          if (guidance.sameRegion && guidance.state === KOE.GUIDANCE_STATE.SEARCH) return `Search nearby: ${guidance.label}`;
          return `Travel toward ${guidance.regionName}: ${guidance.objective.text}`;
        }
      }
      for (const id of KOE.STORY_CHAIN || []) {
        if (!this.active[id]) continue;
        const q = this.defs.get(id);
        const st = this.active[id];
        for (let i = 0; i < q.objectives.length; i += 1) {
          if (st.progress[i] < q.objectives[i].count) {
            return `Next: ${q.objectives[i].text}`;
          }
        }
      }
      for (const id of KOE.STORY_CHAIN || []) {
        if (this.completed[id]) continue;
        const q = this.defs.get(id);
        if (!q || this.active[id]) continue;
        if (q.requires && !this.completed[q.requires]) continue;
        const npc = KOE.NPCS.find((n) => n.id === q.giver);
        return `Main chapter: seek "${q.title}" — ${npc ? npc.name : q.giver}.`;
      }
      const board = Object.keys(this.active).filter((qid) => this.defs.get(qid)?.repeatable);
      if (board.length) return "Notice board contracts active — finish or explore for more.";
      return "Rest at the inn, check the board after dawn, or pursue side quests from allies.";
    }

    objectiveState(questId, objectiveIndex) {
      const state = this.active[questId];
      const quest = this.defs.get(questId);
      if (!state || !quest || !quest.objectives[objectiveIndex]) return "UNKNOWN";
      if (state.progress[objectiveIndex] >= quest.objectives[objectiveIndex].count) return "COMPLETE";
      if (this.game.guidance) {
        const guidance = this.game.guidance.current();
        if (guidance && guidance.questId === questId && guidance.objectiveIndex === objectiveIndex) return guidance.state;
      }
      return "UNKNOWN";
    }

    formatRewards(quest) {
      const r = quest.rewards || {};
      const parts = [];
      if (r.gold) parts.push(`${r.gold}g`);
      if (r.xp) parts.push(`${r.xp} XP`);
      if (r.items) {
        for (const it of r.items) {
          const item = KOE.ITEMS[it.id];
          parts.push(item ? `${item.name} ×${it.qty}` : `${it.id} ×${it.qty}`);
        }
      }
      if (r.relation) {
        for (const [npc, n] of Object.entries(r.relation)) parts.push(`+${n} ${this.npcName(npc)} trust`);
      }
      return parts.length ? parts.join(" · ") : "—";
    }

    addRelationship(npcId, amount, quiet) {
      this.relationships[npcId] = (this.relationships[npcId] || 0) + amount;
      if (!quiet) this.game.toast(`${this.npcName(npcId)} relationship +${amount}`);
      this.onRelationship();
    }

    npcName(id) {
      const npc = KOE.NPCS.find((item) => item.id === id);
      return npc ? npc.name : id;
    }

    tracked() {
      const active = Object.values(this.active);
      return active.find((state) => state.tracked) || active[0] || null;
    }

    pretty(id) {
      if (KOE.ITEMS && KOE.ITEMS[id]) return KOE.ITEMS[id].name;
      return String(id).replace(/_/g, " ");
    }

    serialize() {
      return {
        active: this.active,
        completed: this.completed,
        relationships: this.relationships,
        repeatableSeed: this.repeatableSeed,
        unlockedNotes: this.unlockedNotes
      };
    }

    restore(data) {
      if (!data) {
        this.setupNewGame();
        return;
      }
      this.active = data.active || {};
      this.completed = data.completed || {};
      this.relationships = data.relationships || {};
      this.repeatableSeed = data.repeatableSeed || 1;
      this.unlockedNotes = data.unlockedNotes || {};
      if (Object.values(this.active).length && !Object.values(this.active).some((state) => state.tracked)) {
        const story = Object.values(this.active).find((state) => this.defs.get(state.id)?.type === "story");
        (story || Object.values(this.active)[0]).tracked = true;
      }
      this.backfillChronicleFromProgress();
      this.generateRepeatables();
    }

    backfillChronicleFromProgress() {
      for (const note of KOE.ADVENTURE_NOTES || []) {
        if (!note.unlockOnComplete || this.unlockedNotes[note.id]) continue;
        const fin = this.completed[note.unlockOnComplete];
        if (fin) this.unlockedNotes[note.id] = fin.day || 1;
      }
    }
  };
}());
