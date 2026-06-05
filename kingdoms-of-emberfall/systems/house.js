(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.HOUSE_FURNITURE = {
    bed: { name: "Bed", cost: [{ id: "gold", qty: 80 }, { id: "sturdy_plank", qty: 3 }], target: "bed", desc: "Sleep to save and advance to morning." },
    chest: { name: "Storage Chest", cost: [{ id: "gold", qty: 70 }, { id: "sturdy_plank", qty: 5 }], target: "chest", desc: "Expands storage and satisfies home quests." },
    hearth: { name: "Cooking Hearth", cost: [{ id: "gold", qty: 120 }, { id: "coal", qty: 3 }, { id: "sturdy_plank", qty: 4 }], target: "crafting_station", desc: "Unlocks potion and food crafting." },
    workbench: { name: "Workbench", cost: [{ id: "gold", qty: 130 }, { id: "iron_ore", qty: 4 }, { id: "sturdy_plank", qty: 6 }], target: "crafting_station", desc: "Unlocks gear crafting." },
    trophy: { name: "Trophy Display", cost: [{ id: "gold", qty: 160 }, { id: "ancient_relic", qty: 1 }, { id: "sturdy_plank", qty: 4 }], target: "trophy", desc: "Displays boss rewards and town pride." },
    farm_plot: { name: "Farm Plot", cost: [{ id: "gold", qty: 90 }, { id: "farm_seed_pack", qty: 1 }, { id: "ash_reed", qty: 2 }], target: "farm_plot", desc: "Grows emberberries over time." },
    rug: { name: "Woven Rug", cost: [{ id: "gold", qty: 60 }, { id: "silk_thread", qty: 2 }], target: "decor", desc: "Makes the place feel less abandoned." }
  };

  KOE.HouseSystem = class {
    constructor(game) {
      this.game = game;
      this.level = 0;
      this.furniture = [];
      this.storage = {};
      this.crops = [];
      this.lastSleptDay = 0;
    }

    setupNewGame() {
      this.level = 0;
      this.furniture = [{ type: "bed", x: 1, y: 1 }];
      this.storage = {};
      this.crops = [];
      this.lastSleptDay = 0;
    }

    upgradeCost() {
      const costs = [
        [{ id: "gold", qty: 250 }, { id: "sturdy_plank", qty: 10 }],
        [{ id: "gold", qty: 600 }, { id: "sturdy_plank", qty: 18 }, { id: "iron_ore", qty: 8 }],
        [{ id: "gold", qty: 1200 }, { id: "ancient_relic", qty: 2 }, { id: "ember_scale", qty: 4 }]
      ];
      return costs[this.level] || null;
    }

    upgrade() {
      const cost = this.upgradeCost();
      if (!cost) {
        this.game.toast("Your home is fully restored.");
        return false;
      }
      if (!this.game.inventory.pay(cost)) {
        this.game.toast("Missing materials for the house upgrade.");
        return false;
      }
      this.level += 1;
      this.game.toast(`House upgraded to level ${this.level + 1}`);
      this.game.quests.onHouse("upgrade", this.level);
      this.game.save.save({ quiet: true });
      return true;
    }

    place(type) {
      const def = KOE.HOUSE_FURNITURE[type];
      if (!def) return false;
      if (!this.game.inventory.pay(def.cost)) {
        this.game.toast("Missing materials.");
        return false;
      }
      const capacity = 6 + this.level * 4;
      if (this.furniture.length >= capacity) {
        this.game.toast("Upgrade your house for more room.");
        return false;
      }
      const index = this.furniture.length;
      const x = index % 5;
      const y = Math.floor(index / 5);
      this.furniture.push({ type, x, y });
      if (type === "farm_plot") this.crops.push({ plantedDay: this.game.clock.day, ready: false });
      this.game.toast(`Placed ${def.name}`);
      this.game.quests.onHouse(def.target, this.countType(type));
      if (type === "hearth" || type === "workbench") this.game.quests.onHouse("crafting_station", this.countStations());
      this.game.save.save({ quiet: true });
      return true;
    }

    countType(type) {
      return this.furniture.filter((item) => item.type === type).length;
    }

    countStations() {
      return this.furniture.filter((item) => item.type === "hearth" || item.type === "workbench").length;
    }

    hasStation(station) {
      if (station === "garden") return this.countType("farm_plot") > 0;
      if (station === "hearth") return this.countType("hearth") > 0;
      if (station === "workbench") return this.countType("workbench") > 0;
      return true;
    }

    craft(id) {
      const craft = KOE.CRAFTS.find((entry) => entry.id === id);
      if (!craft) return false;
      if (!this.hasStation(craft.station)) {
        this.game.toast(`Requires ${craft.station}.`);
        return false;
      }
      if (!this.game.inventory.pay(craft.cost)) {
        this.game.toast("Missing crafting materials.");
        return false;
      }
      this.game.inventory.add(id, 1);
      this.game.toast(`Crafted ${KOE.ITEMS[id].name}`);
      this.game.audio.sfx("ui");
      return true;
    }

    sleep() {
      if (!this.countType("bed")) {
        this.game.toast("You need a bed first.");
        return;
      }
      if (this.lastSleptDay === this.game.clock.day && this.game.clock.hour < 20) {
        this.game.toast("You are not tired yet.");
        return;
      }
      this.lastSleptDay = this.game.clock.day + 1;
      this.game.clock.day += 1;
      this.game.clock.minute = 6 * 60;
      this.game.player.health = this.game.player.maxHealth;
      this.game.player.mana = this.game.player.maxMana;
      this.game.player.stamina = this.game.player.maxStamina;
      this.tickCrops();
      this.game.weather.rollDaily();
      this.game.quests.generateRepeatables();
      this.game.save.save();
      this.game.toast("You sleep until dawn. Game saved. Check the notice board for fresh contracts.");
    }

    tickCrops() {
      for (const crop of this.crops) {
        if (this.game.clock.day - crop.plantedDay >= 2) crop.ready = true;
      }
    }

    harvest() {
      let harvested = 0;
      for (const crop of this.crops) {
        if (!crop.ready) continue;
        crop.ready = false;
        crop.plantedDay = this.game.clock.day;
        harvested += 3;
      }
      if (harvested) {
        this.game.inventory.add("emberberry", harvested);
        this.game.toast(`Harvested ${harvested} emberberries.`);
      } else {
        this.game.toast("No crops are ready.");
      }
    }

    serialize() {
      return {
        level: this.level,
        furniture: this.furniture,
        storage: this.storage,
        crops: this.crops,
        lastSleptDay: this.lastSleptDay
      };
    }

    restore(data) {
      if (!data) {
        this.setupNewGame();
        return;
      }
      this.level = data.level || 0;
      this.furniture = data.furniture || [{ type: "bed", x: 1, y: 1 }];
      this.storage = data.storage || {};
      this.crops = data.crops || [];
      this.lastSleptDay = data.lastSleptDay || 0;
    }
  };
}());
