(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.SHOPS = {
    blacksmith: [
      { id: "leather_vest", price: 120 },
      { id: "knight_blade", price: 260 },
      { id: "war_axe", price: 390, requiresQuest: "story_bandit" },
      { id: "spear_of_ashes", price: 350, requiresQuest: "story_swamp" },
      { id: "ranger_bow", price: 320 },
      { id: "apprentice_wand", price: 260 },
      { id: "iron_ore", price: 28 },
      { id: "coal", price: 22 }
    ],
    mage: [
      { id: "mana_tonic", price: 70 },
      { id: "focus_tea", price: 85 },
      { id: "apprentice_wand", price: 220 },
      { id: "crystal_staff", price: 360, requiresQuest: "story_crystal" },
      { id: "crystal_shard", price: 50 },
      { id: "spirit_charm", price: 300, requiresQuest: "story_crystal" },
      { id: "regen_philter", price: 125, requiresQuest: "story_swamp" }
    ],
    tavern: [
      { id: "hearty_stew", price: 42 },
      { id: "health_potion", price: 52 },
      { id: "stamina_tonic", price: 64 },
      { id: "glowcap", price: 24 }
    ],
    market: [
      { id: "health_potion", price: 48 },
      { id: "moonleaf", price: 24 },
      { id: "ash_reed", price: 26 },
      { id: "farm_seed_pack", price: 120 },
      { id: "sturdy_plank", price: 26 }
    ],
    farm: [
      { id: "farm_seed_pack", price: 95 },
      { id: "ember_seed", price: 20 },
      { id: "emberberry", price: 28 },
      { id: "ash_reed", price: 24 }
    ],
    inn: [
      { id: "hearty_stew", price: 38 },
      { id: "focus_tea", price: 90 },
      { id: "health_potion", price: 55 }
    ],
    docks: [
      { id: "ash_reed", price: 22 },
      { id: "sturdy_plank", price: 24 },
      { id: "swamp_pepper", price: 38 }
    ],
    ranger: [
      { id: "hunter_bow", price: 190 },
      { id: "ranger_bow", price: 280 },
      { id: "stamina_tonic", price: 58 },
      { id: "wolf_pelt", price: 34 },
      { id: "mountain_map", price: 110 }
    ],
    stables: [
      { id: "stamina_tonic", price: 56 },
      { id: "hearty_stew", price: 36 },
      { id: "farm_seed_pack", price: 105 },
      { id: "ember_seed", price: 18 }
    ],
    cross_store: [
      { id: "health_potion", price: 46 },
      { id: "moonleaf", price: 22 },
      { id: "sturdy_plank", price: 24 },
      { id: "ember_lantern", price: 240 },
      { id: "leather_vest", price: 115 }
    ],
    cross_inn: [
      { id: "hearty_stew", price: 36 },
      { id: "focus_tea", price: 82 },
      { id: "health_potion", price: 50 }
    ],
    moor_wharf: [
      { id: "ash_reed", price: 20 },
      { id: "swamp_pepper", price: 36 },
      { id: "stamina_tonic", price: 60 },
      { id: "health_potion", price: 52 }
    ],
    moor_chandler: [
      { id: "silk_thread", price: 30 },
      { id: "sturdy_plank", price: 25 },
      { id: "mana_tonic", price: 68 },
      { id: "glowcap", price: 22 }
    ]
  };

  KOE.Economy = class {
    constructor(game) {
      this.game = game;
      this.panel = document.getElementById("shop");
      this.title = this.panel.querySelector(".shop-title");
      this.grid = this.panel.querySelector(".shop-grid");
      this.current = null;
    }

    open(shopId, title) {
      this.current = shopId;
      this.panel.classList.remove("hidden");
      this.render(title || "Shop");
      this.game.audio.sfx("ui");
    }

    close() {
      this.current = null;
      this.panel.classList.add("hidden");
    }

    toggle(shopId, title) {
      if (this.current === shopId) this.close();
      else this.open(shopId, title);
    }

    render(title) {
      const stock = KOE.SHOPS[this.current] || [];
      this.title.innerHTML = `<h2>${KOE.sanitize(title)}</h2><p class="small">Gold: ${this.game.inventory.gold}</p>`;
      this.grid.innerHTML = "";
      for (const entry of stock) {
        if (entry.requiresQuest && !this.game.quests.completed[entry.requiresQuest]) continue;
        const item = KOE.ITEMS[entry.id];
        const row = document.createElement("div");
        row.className = "shop-row";
        row.innerHTML = `<div><strong>${KOE.sanitize(item.name)}</strong><p class="small">${KOE.sanitize(item.desc)}</p></div><span>${entry.price}g</span>`;
        const buy = document.createElement("button");
        buy.textContent = "Buy";
        buy.addEventListener("click", () => {
          if (this.game.inventory.gold < entry.price) {
            this.game.toast("Not enough gold.");
            return;
          }
          this.game.inventory.remove("gold", entry.price);
          this.game.inventory.add(entry.id, 1);
          this.game.toast(`Bought ${item.name}`);
          this.game.audio.sfx("coin");
          this.render(title);
        });
        row.appendChild(buy);
        this.grid.appendChild(row);
      }

      const sellHeader = document.createElement("div");
      sellHeader.className = "small";
      sellHeader.textContent = "Inventory goods can be sold for half price.";
      this.grid.appendChild(sellHeader);
      for (const [id, qty] of Object.entries(this.game.inventory.items)) {
        const item = KOE.ITEMS[id];
        if (!item || item.price <= 0 || item.type === "key" || item.type === "quest") continue;
        const price = Math.max(1, Math.floor(item.price * 0.5));
        const row = document.createElement("div");
        row.className = "shop-row";
        row.innerHTML = `<div><strong>Sell ${KOE.sanitize(item.name)}</strong><p class="small">Owned: ${qty}</p></div><span>${price}g</span>`;
        const sell = document.createElement("button");
        sell.textContent = "Sell";
        sell.addEventListener("click", () => {
          this.game.inventory.remove(id, 1);
          this.game.inventory.add("gold", price);
          this.game.toast(`Sold ${item.name}`);
          this.game.audio.sfx("coin");
          this.render(title);
        });
        row.appendChild(sell);
        this.grid.appendChild(row);
      }
    }
  };
}());
