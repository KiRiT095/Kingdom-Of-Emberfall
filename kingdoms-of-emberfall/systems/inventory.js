(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.ITEMS = {
    gold: { id: "gold", name: "Gold", type: "currency", rarity: "common", price: 1, desc: "Stamped coins from the old kingdom." },
    health_potion: { id: "health_potion", name: "Health Potion", type: "consumable", rarity: "common", price: 45, heal: 45, desc: "Red tonic brewed from emberberries." },
    mana_tonic: { id: "mana_tonic", name: "Mana Tonic", type: "consumable", rarity: "uncommon", price: 60, mana: 35, desc: "Cold-blue liquid that tastes like rain on stone." },
    stamina_tonic: { id: "stamina_tonic", name: "Stamina Tonic", type: "consumable", rarity: "uncommon", price: 55, stamina: 45, desc: "Peppery drink carried by rangers." },
    hearty_stew: { id: "hearty_stew", name: "Hearty Stew", type: "consumable", rarity: "common", price: 38, heal: 25, stamina: 25, desc: "A bowl of tavern warmth." },
    focus_tea: { id: "focus_tea", name: "Focus Tea", type: "consumable", rarity: "uncommon", price: 70, mana: 55, desc: "Moonleaf tea that steadies spellwork." },
    regen_philter: { id: "regen_philter", name: "Regen Philter", type: "consumable", rarity: "rare", price: 110, mana: 20, desc: "Triggers a short restorative aura." },

    rusty_sword: { id: "rusty_sword", name: "Rusty Sword", type: "weapon", slot: "weapon", rarity: "common", price: 30, stats: { attack: 4 }, desc: "Old steel with a memory of sharpness.", weaponClass: "sword" },
    ember_steel_sword: { id: "ember_steel_sword", name: "Ember-Steel Sword", type: "weapon", slot: "weapon", rarity: "rare", price: 280, stats: { attack: 12 }, desc: "Reforged at Brann's anvil with a red line through the edge.", weaponClass: "sword" },
    knight_blade: { id: "knight_blade", name: "Knight Blade", type: "weapon", slot: "weapon", rarity: "uncommon", price: 210, stats: { attack: 9 }, desc: "Balanced steel from a disciplined age.", weaponClass: "sword" },
    war_axe: { id: "war_axe", name: "War Axe", type: "weapon", slot: "weapon", rarity: "rare", price: 330, stats: { attack: 14 }, desc: "Heavy arc, brutal impact.", weaponClass: "axe" },
    spear_of_ashes: { id: "spear_of_ashes", name: "Spear of Ashes", type: "weapon", slot: "weapon", rarity: "rare", price: 300, stats: { attack: 11 }, desc: "Long reach, clean thrusts.", weaponClass: "spear" },
    ember_blade: { id: "ember_blade", name: "Ember Blade", type: "weapon", slot: "weapon", rarity: "relic", price: 0, stats: { attack: 18 }, desc: "Its edge hums when danger rises.", weaponClass: "sword" },
    ranger_bow: { id: "ranger_bow", name: "Quiet String Bow", type: "weapon", slot: "bow", rarity: "rare", price: 260, stats: { ranged: 9 }, desc: "A bow that whispers after the arrow leaves." },
    hunter_bow: { id: "hunter_bow", name: "Hunter Bow", type: "weapon", slot: "bow", rarity: "uncommon", price: 180, stats: { ranged: 6 }, desc: "Lighter draw, quicker release." },
    apprentice_wand: { id: "apprentice_wand", name: "Apprentice Wand", type: "weapon", slot: "focus", rarity: "uncommon", price: 180, stats: { magic: 7 }, desc: "Selene insists it has only exploded twice." },
    crystal_staff: { id: "crystal_staff", name: "Crystal Staff", type: "weapon", slot: "focus", rarity: "rare", price: 320, stats: { magic: 11 }, desc: "Focused beamwork from the echo chambers." },
    frost_wand: { id: "frost_wand", name: "Frost Wand", type: "weapon", slot: "focus", rarity: "relic", price: 0, stats: { magic: 14, defense: 2 }, desc: "Cools incoming blows before they land." },
    leather_vest: { id: "leather_vest", name: "Leather Vest", type: "armor", slot: "armor", rarity: "common", price: 100, stats: { defense: 3 }, desc: "Patched but sturdy." },
    frost_cloak: { id: "frost_cloak", name: "Frost Cloak", type: "armor", slot: "cloak", rarity: "rare", price: 310, stats: { defense: 3, maxMana: 15 }, desc: "Keeps winter from finding your bones." },
    emberguard_armor: { id: "emberguard_armor", name: "Emberguard Armor", type: "armor", slot: "armor", rarity: "epic", price: 900, stats: { defense: 12, maxHealth: 30 }, desc: "Dragon-touched plates that pulse like banked coals." },
    spirit_charm: { id: "spirit_charm", name: "Spirit Charm", type: "trinket", slot: "trinket", rarity: "rare", price: 300, stats: { magic: 4, maxMana: 20 }, desc: "A charm that hums when memories gather." },
    mountain_map: { id: "mountain_map", name: "Mountain Map", type: "key", rarity: "uncommon", price: 80, desc: "A surviving chart of Frostpeak's safer paths." },
    forest_key: { id: "forest_key", name: "Mossy Shrine Key", type: "key", rarity: "uncommon", price: 90, desc: "Green metal that smells faintly of rain." },
    hearthstone: { id: "hearthstone", name: "Hearthstone", type: "key", rarity: "rare", price: 0, desc: "A warm stone that marks your house as home." },
    trade_charter: { id: "trade_charter", name: "Trade Charter", type: "key", rarity: "rare", price: 0, desc: "A reopened promise between towns." },
    ward_crystal: { id: "ward_crystal", name: "Ward Crystal", type: "key", rarity: "rare", price: 0, desc: "Living crystal for the town ward." },
    mire_lantern: { id: "mire_lantern", name: "Mire Lantern", type: "key", rarity: "rare", price: 0, desc: "A lantern that burns even under swamp water." },
    oathbound_crown: { id: "oathbound_crown", name: "Oathbound Crown", type: "key", rarity: "epic", price: 0, desc: "A broken crown still heavy with promises." },
    beacon_flame: { id: "beacon_flame", name: "Beacon Flame", type: "key", rarity: "epic", price: 0, desc: "Fire carried from the mountain signal." },
    citadel_key: { id: "citadel_key", name: "Citadel Key", type: "key", rarity: "epic", price: 0, desc: "It opens locks that forgot they were locks." },
    ember_crown: { id: "ember_crown", name: "Ember Crown", type: "key", rarity: "legendary", price: 0, desc: "A future made visible." },
    maze_iron_key: { id: "maze_iron_key", name: "Iron Depth Key", type: "key", rarity: "rare", price: 0, desc: "Cold iron from the first seal below the vale." },
    maze_brass_key: { id: "maze_brass_key", name: "Brass Depth Key", type: "key", rarity: "rare", price: 0, desc: "Warm brass that clicks twice before it turns." },
    warden_sigil: { id: "warden_sigil", name: "Warden's Sigil", type: "trinket", slot: "trinket", rarity: "epic", price: 0, stats: { attack: 5, defense: 4, maxHealth: 20 }, desc: "A medal pressed from melted gate-locks and stubborn vows." },
    ember_lantern: { id: "ember_lantern", name: "Ember Lantern", type: "trinket", slot: "trinket", rarity: "rare", price: 220, stats: { magic: 3, maxMana: 12 }, desc: "Sheds a honest radius of light when the world goes cruel and dark.", nightLantern: true },

    iron_ore: { id: "iron_ore", name: "Iron Ore", type: "material", rarity: "common", price: 18, desc: "Dense ore from old cliff roads." },
    coal: { id: "coal", name: "Forge Coal", type: "material", rarity: "common", price: 14, desc: "Black fuel with ember veins." },
    moonleaf: { id: "moonleaf", name: "Moonleaf", type: "material", rarity: "common", price: 16, desc: "Silver-edged leaves that glow at dusk." },
    glowcap: { id: "glowcap", name: "Glowcap", type: "material", rarity: "common", price: 15, desc: "Small mushrooms with cheerful lantern caps." },
    wolf_pelt: { id: "wolf_pelt", name: "Wolf Pelt", type: "material", rarity: "common", price: 22, desc: "Warm, coarse pelt from forest wolves." },
    slime_gel: { id: "slime_gel", name: "Slime Gel", type: "material", rarity: "common", price: 12, desc: "Useful, sticky, and personally unpleasant." },
    crystal_shard: { id: "crystal_shard", name: "Crystal Shard", type: "material", rarity: "uncommon", price: 32, desc: "A shard that repeats quiet sounds." },
    ash_reed: { id: "ash_reed", name: "Ash Reed", type: "material", rarity: "common", price: 18, desc: "Tough reeds from black water." },
    swamp_pepper: { id: "swamp_pepper", name: "Swamp Pepper", type: "material", rarity: "uncommon", price: 28, desc: "Spice that makes soup stand up straight." },
    silk_thread: { id: "silk_thread", name: "Silk Thread", type: "material", rarity: "uncommon", price: 26, desc: "Strong thread harvested from giant insects." },
    ember_seed: { id: "ember_seed", name: "Ember Seed", type: "material", rarity: "common", price: 14, desc: "Tiny warm seed for stubborn soil." },
    emberberry: { id: "emberberry", name: "Emberberry", type: "crop", rarity: "common", price: 20, desc: "Sweet red fruit with a smoky finish." },
    sturdy_plank: { id: "sturdy_plank", name: "Sturdy Plank", type: "material", rarity: "common", price: 17, desc: "Salvaged wood ready for repairs." },
    runic_page: { id: "runic_page", name: "Runic Page", type: "quest", rarity: "uncommon", price: 35, desc: "A page of notes that keeps rearranging itself." },
    spirit_ember: { id: "spirit_ember", name: "Spirit Ember", type: "material", rarity: "rare", price: 55, desc: "Blue fire that burns without heat." },
    river_ring: { id: "river_ring", name: "Nella's Ring", type: "quest", rarity: "rare", price: 0, desc: "A simple ring polished by river stones." },
    map_fragment: { id: "map_fragment", name: "Map Fragment", type: "quest", rarity: "uncommon", price: 25, desc: "A torn map corner with careful ranger marks." },
    royal_seal: { id: "royal_seal", name: "Broken Royal Seal", type: "quest", rarity: "rare", price: 60, desc: "A cracked seal bearing a winged crown." },
    court_mask: { id: "court_mask", name: "Court Mask", type: "quest", rarity: "rare", price: 58, desc: "Ceramic smile from a court no one admits existed." },
    lore_book: { id: "lore_book", name: "Lore Book", type: "quest", rarity: "uncommon", price: 40, desc: "Weather-damaged writing from before the fall." },
    deserter_letter: { id: "deserter_letter", name: "Deserter Letter", type: "quest", rarity: "uncommon", price: 30, desc: "A letter that was folded too many times." },
    dock_bell: { id: "dock_bell", name: "Sunken Dock Bell", type: "quest", rarity: "rare", price: 0, desc: "A small brass bell with black water inside." },
    frost_core: { id: "frost_core", name: "Frost Core", type: "material", rarity: "rare", price: 65, desc: "A cold gem from mountain spirits." },
    frost_wool: { id: "frost_wool", name: "Frost Wool", type: "material", rarity: "uncommon", price: 42, desc: "Soft wool that never fully thaws." },
    ancient_relic: { id: "ancient_relic", name: "Ancient Relic", type: "quest", rarity: "epic", price: 130, desc: "A device from the citadel age, still ticking." },
    ember_scale: { id: "ember_scale", name: "Ember Scale", type: "material", rarity: "epic", price: 120, desc: "A red-black scale warm enough to melt frost." },
    mirror_gem: { id: "mirror_gem", name: "Mirror Gem", type: "quest", rarity: "rare", price: 110, desc: "A gem that shows where you wish you were." },
    farm_seed_pack: { id: "farm_seed_pack", name: "Farm Seed Pack", type: "house", rarity: "uncommon", price: 80, desc: "Seeds suited to the reclaimed plot behind your house." }
  };

  KOE.CRAFTS = [
    { id: "health_potion", name: "Health Potion", cost: [{ id: "emberberry", qty: 2 }, { id: "moonleaf", qty: 1 }], station: "hearth" },
    { id: "stamina_tonic", name: "Stamina Tonic", cost: [{ id: "swamp_pepper", qty: 1 }, { id: "glowcap", qty: 2 }], station: "hearth" },
    { id: "mana_tonic", name: "Mana Tonic", cost: [{ id: "crystal_shard", qty: 1 }, { id: "moonleaf", qty: 2 }], station: "hearth" },
    { id: "leather_vest", name: "Leather Vest", cost: [{ id: "wolf_pelt", qty: 5 }, { id: "silk_thread", qty: 2 }], station: "workbench" },
    { id: "apprentice_wand", name: "Apprentice Wand", cost: [{ id: "sturdy_plank", qty: 4 }, { id: "crystal_shard", qty: 3 }], station: "workbench" },
    { id: "farm_seed_pack", name: "Farm Seed Pack", cost: [{ id: "ember_seed", qty: 6 }, { id: "ash_reed", qty: 2 }], station: "garden" }
  ];

  KOE.Inventory = class {
    constructor(game) {
      this.game = game;
      this.items = {};
      this.gold = 0;
      this.equipment = { weapon: "rusty_sword", bow: null, focus: null, armor: null, cloak: null, trinket: null };
    }

    setupStarterKit() {
      this.gold = 80;
      this.items = {};
      this.add("health_potion", 3);
      this.add("stamina_tonic", 1);
      this.add("rusty_sword", 1);
      this.equipment.weapon = "rusty_sword";
    }

    add(id, qty) {
      if (id === "gold") {
        this.gold += qty;
        return;
      }
      this.items[id] = (this.items[id] || 0) + qty;
      if (this.game && this.game.quests) this.game.quests.onCollect(id, this.items[id]);
    }

    remove(id, qty) {
      if (id === "gold") {
        if (this.gold < qty) return false;
        this.gold -= qty;
        return true;
      }
      if ((this.items[id] || 0) < qty) return false;
      this.items[id] -= qty;
      if (this.items[id] <= 0) delete this.items[id];
      return true;
    }

    has(id, qty) {
      if (id === "gold") return this.gold >= qty;
      return (this.items[id] || 0) >= qty;
    }

    count(id) {
      return id === "gold" ? this.gold : (this.items[id] || 0);
    }

    canPay(cost) {
      return cost.every((entry) => this.has(entry.id, entry.qty));
    }

    pay(cost) {
      if (!this.canPay(cost)) return false;
      for (const entry of cost) this.remove(entry.id, entry.qty);
      return true;
    }

    equip(id) {
      const item = KOE.ITEMS[id];
      if (!item || !item.slot || !this.has(id, 1)) return false;
      this.equipment[item.slot] = id;
      this.game.toast(`Equipped ${item.name}`);
      this.game.audio.sfx("ui");
      return true;
    }

    use(id) {
      const item = KOE.ITEMS[id];
      if (!item || item.type !== "consumable" || !this.has(id, 1)) return false;
      const player = this.game.player;
      if (item.heal) player.health = KOE.clamp(player.health + item.heal, 0, player.maxHealth);
      if (item.mana) player.mana = KOE.clamp(player.mana + item.mana, 0, player.maxMana);
      if (item.stamina) player.stamina = KOE.clamp(player.stamina + item.stamina, 0, player.maxStamina);
      if (id === "regen_philter") {
        player.regenTimer = Math.max(player.regenTimer || 0, 6);
        player.wardTimer = Math.max(player.wardTimer || 0, 1.5);
        if (this.game && this.game.combat) this.game.combat.auras.push({ x: player.x, y: player.y, life: 0.6, pulse: 0, speed: 9, color: "#8fe6b7", r: 52 });
      }
      this.remove(id, 1);
      this.game.toast(`Used ${item.name}`);
      this.game.audio.sfx("ui");
      return true;
    }

    statBonus(stat) {
      let total = 0;
      for (const id of Object.values(this.equipment)) {
        if (!id) continue;
        const item = KOE.ITEMS[id];
        if (item && item.stats && item.stats[stat]) total += item.stats[stat];
      }
      return total;
    }

    serialize() {
      return {
        items: this.items,
        gold: this.gold,
        equipment: this.equipment
      };
    }

    restore(data) {
      if (!data) {
        this.setupStarterKit();
        return;
      }
      this.items = Object.assign({}, data.items || {});
      this.gold = data.gold || 0;
      this.equipment = Object.assign({ weapon: "rusty_sword", bow: null, focus: null, armor: null, cloak: null, trinket: null }, data.equipment || {});
    }
  };
}());
