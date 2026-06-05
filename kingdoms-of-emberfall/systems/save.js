(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.SaveManager = class {
    constructor(game) {
      this.game = game;
      this.autoTimer = 20;
      this.lastSavedAt = null;
    }

    exists() {
      return Boolean(localStorage.getItem(KOE.SAVE_KEY));
    }

    save(options) {
      const quiet = options && options.quiet;
      const data = {
        version: KOE.VERSION,
        savedAt: Date.now(),
        player: this.game.player.serialize(),
        inventory: this.game.inventory.serialize(),
        quests: this.game.quests.serialize(),
        house: this.game.house.serialize(),
        clock: this.game.clock.serialize(),
        weather: this.game.weather.serialize(),
        world: this.game.world.serialize()
      };
      try {
        const payload = JSON.stringify(data);
        const prev = localStorage.getItem(KOE.SAVE_KEY);
        if (prev) localStorage.setItem(KOE.SAVE_KEY_BACKUP, prev);
        localStorage.setItem(KOE.SAVE_KEY, payload);
      } catch (error) {
        console.error(error);
        this.game.toast("Could not save (storage full or blocked).");
        return null;
      }
      this.lastSavedAt = data.savedAt;
      if (this.game.ui) this.game.ui.onSaveComplete(data.savedAt, { quiet });
      return data;
    }

    load() {
      const tryParse = (raw) => {
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || typeof data !== "object") return null;
        if (!data.player || !data.inventory) return null;
        return data;
      };

      let raw = localStorage.getItem(KOE.SAVE_KEY);
      let data = null;
      let usedBackup = false;
      try {
        data = tryParse(raw);
      } catch (error) {
        console.error(error);
        data = null;
      }
      if (!data) {
        raw = localStorage.getItem(KOE.SAVE_KEY_BACKUP);
        try {
          data = tryParse(raw);
        } catch (error) {
          console.error(error);
          data = null;
        }
        if (data) usedBackup = true;
      }
      if (!data) {
        this.game.toast("Save data could not be loaded.");
        return false;
      }
      if (this.game.ui) this.game.ui.beginLoadCurtain();
      try {
        this.game.inventory.restore(data.inventory);
        this.game.quests.restore(data.quests);
        this.game.house.restore(data.house);
        this.game.clock.restore(data.clock);
        this.game.weather.restore(data.weather);
        this.game.player.restore(data.player);
        this.game.world.restore(data.world);
        this.game.world.changeRegion(this.game.player.region || "town", {
          px: this.game.player.x,
          py: this.game.player.y
        }, true);
        this.game.ui.resetMinimapCache();
        this.lastSavedAt = data.savedAt || null;
        this.game.toast(usedBackup ? "Restored from backup — you're back in the world." : "Adventure restored — welcome back.");
        return true;
      } catch (error) {
        console.error(error);
        this.game.toast("Save data was corrupted.");
        return false;
      } finally {
        if (this.game.ui) this.game.ui.endLoadCurtain();
      }
    }

    newGame() {
      this.game.inventory.setupStarterKit();
      this.game.quests.setupNewGame();
      this.game.house.setupNewGame();
      this.game.clock.day = 1;
      this.game.clock.minute = 6 * 60;
      this.game.weather.rollDaily();
      this.game.player.restore({
        x: 40 * KOE.TILE,
        y: 36 * KOE.TILE,
        region: "town",
        health: 100,
        mana: 70,
        stamina: 100,
        level: 1,
        xp: 0,
        skillPoints: 0,
        skills: { blade: 0, ward: 0, ranger: 0, hearth: 0 }
      });
      this.game.world.restore(null);
      this.game.world.changeRegion("town", { x: 40, y: 36 }, true);
      this.game.ui.resetMinimapCache();
      this.save({ quiet: true });
    }

    update(dt) {
      this.autoTimer -= dt;
      if (this.autoTimer <= 0) {
        this.autoTimer = 30;
        this.save({ quiet: true });
      }
    }
  };
}());
