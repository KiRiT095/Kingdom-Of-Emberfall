(function () {
  "use strict";

  const KOE = window.KOE = window.KOE || {};

  KOE.REGIONS = {
    town: {
      id: "town",
      name: "Emberfall Town",
      theme: "town",
      width: 82,
      height: 62,
      base: "grass",
      music: "town",
      danger: 0,
      exits: [
        { x: 4, y: 31, w: 3, h: 7, to: "overworld", spawn: { x: 103, y: 46 }, label: "The Long Vale" },
        { x: 78, y: 34, w: 3, h: 7, to: "pass", spawn: { x: 8, y: 35 }, label: "Bandit Pass" },
        { x: 69, y: 58, w: 8, h: 3, to: "swamp", spawn: { x: 67, y: 8 }, label: "Ashen Swamp" },
        { x: 17, y: 5, w: 8, h: 3, to: "mountains", spawn: { x: 20, y: 68 }, label: "Frostpeak Mountains" },
        { x: 54, y: 5, w: 7, h: 3, to: "ruins", spawn: { x: 42, y: 68 }, label: "Forgotten Ruins" }
      ],
      buildings: [
        { id: "blacksmith", name: "Blacksmith", x: 14, y: 22, w: 8, h: 6, kind: "shop" },
        { id: "tavern", name: "Tavern", x: 29, y: 34, w: 8, h: 6, kind: "shop" },
        { id: "market", name: "Market", x: 50, y: 31, w: 8, h: 6, kind: "shop" },
        { id: "mage_tower", name: "Mage Tower", x: 61, y: 22, w: 6, h: 8, kind: "shop" },
        { id: "player_house", name: "Your House", x: 22, y: 43, w: 8, h: 6, kind: "house" },
        { id: "farm", name: "Farm", x: 56, y: 48, w: 14, h: 9, kind: "farm" },
        { id: "town_square", name: "Town Square", x: 35, y: 24, w: 10, h: 7, kind: "landmark" },
        { id: "inn", name: "Inn", x: 40, y: 42, w: 8, h: 6, kind: "shop" },
        { id: "docks", name: "Docks", x: 68, y: 45, w: 10, h: 6, kind: "shop" },
        { id: "town_hall", name: "Town Hall", x: 43, y: 15, w: 10, h: 7, kind: "landmark" },
        { id: "barracks", name: "Barracks", x: 20, y: 16, w: 8, h: 5, kind: "landmark" },
        { id: "ranger_lodge", name: "Ranger Lodge", x: 10, y: 39, w: 7, h: 5, kind: "shop" },
        { id: "chapel", name: "Sungrove Chapel", x: 7, y: 28, w: 7, h: 6, kind: "landmark" },
        { id: "stables", name: "South Stables", x: 33, y: 52, w: 10, h: 6, kind: "shop" },
        { id: "woodcut_yard", name: "Woodcutter's Yard", x: 71, y: 18, w: 8, h: 7, kind: "landmark" },
        { id: "guild_hall", name: "Rangers' Hall", x: 4, y: 44, w: 8, h: 5, kind: "landmark" },
        { id: "old_well", name: "Old Well", x: 47, y: 35, w: 2, h: 2, kind: "secret" }
      ],
      resources: [
        { id: "sturdy_plank", x: 23, y: 36, respawn: 1 },
        { id: "ember_seed", x: 58, y: 52, respawn: 1 },
        { id: "emberberry", x: 63, y: 52, respawn: 1 },
        { id: "river_ring", x: 73, y: 51, respawn: 999 }
      ],
      chests: [
        { id: "town_cache", x: 30, y: 45, loot: [{ id: "health_potion", qty: 2 }, { id: "gold", qty: 80 }] },
        { id: "chapel_offering", x: 10, y: 31, loot: [{ id: "focus_tea", qty: 1 }, { id: "moonleaf", qty: 4 }] },
        { id: "stables_tack", x: 37, y: 54, loot: [{ id: "stamina_tonic", qty: 2 }, { id: "gold", qty: 55 }] },
        { id: "guild_cache", x: 6, y: 46, loot: [{ id: "mountain_map", qty: 1 }, { id: "map_fragment", qty: 1 }] },
        { id: "well_echo", x: 47, y: 36, loot: [{ id: "ancient_relic", qty: 1 }, { id: "lore_book", qty: 1 }], secret: "old_well" }
      ]
    },
    overworld: {
      id: "overworld",
      name: "The Long Vale",
      theme: "overworld",
      width: 112,
      height: 94,
      base: "grass",
      music: "forest",
      danger: 1,
      exits: [
        { x: 106, y: 43, w: 5, h: 8, to: "town", spawn: { x: 8, y: 34 }, label: "Emberfall Town" },
        { x: 2, y: 43, w: 5, h: 8, to: "forest", spawn: { x: 74, y: 36 }, label: "Whispering Forest" },
        { x: 52, y: 2, w: 10, h: 4, to: "crosshill", spawn: { x: 22, y: 32 }, label: "Crosshill Hamlet" },
        { x: 48, y: 88, w: 12, h: 4, to: "harbor_moor", spawn: { x: 25, y: 34 }, label: "Harbor Moor" },
        { x: 100, y: 72, w: 4, h: 6, to: "ember_depths", spawn: { x: 28, y: 38 }, label: "Sunken Stair" }
      ],
      enemies: [
        { type: "wolf", count: 8 },
        { type: "bandit", count: 5 },
        { type: "insect", count: 4 }
      ],
      landmarks: [
        { id: "vale_marker", x: 54, y: 44, w: 6, h: 5, label: "Mileward Stone" },
        { id: "depths_gate", x: 98, y: 69, w: 8, h: 10, label: "Sunken Stair" }
      ],
      resources: [
        { id: "moonleaf", x: 24, y: 22, respawn: 1 },
        { id: "ember_seed", x: 88, y: 28, respawn: 2 },
        { id: "map_fragment", x: 62, y: 78, respawn: 999 }
      ],
      chests: [
        { id: "vale_traveler", x: 58, y: 46, loot: [{ id: "health_potion", qty: 2 }, { id: "stamina_tonic", qty: 1 }, { id: "gold", qty: 90 }] },
        { id: "roadside_cache", x: 18, y: 62, loot: [{ id: "iron_ore", qty: 3 }, { id: "rusty_sword", qty: 1 }] }
      ]
    },
    crosshill: {
      id: "crosshill",
      name: "Crosshill Hamlet",
      theme: "crosshill",
      width: 50,
      height: 40,
      base: "grass",
      music: "town",
      danger: 0,
      exits: [
        { x: 18, y: 36, w: 8, h: 3, to: "overworld", spawn: { x: 56, y: 8 }, label: "The Long Vale" },
        { x: 44, y: 16, w: 4, h: 6, to: "pass", spawn: { x: 12, y: 38 }, label: "Bandit Pass" }
      ],
      buildings: [
        { id: "cross_inn", name: "The Crossed Keys", x: 12, y: 18, w: 8, h: 6, kind: "shop" },
        { id: "cross_store", name: "Hamlet Goods", x: 28, y: 20, w: 7, h: 6, kind: "shop" },
        { id: "cross_shrine", name: "Wayside Shrine", x: 8, y: 8, w: 6, h: 5, kind: "landmark" },
        { id: "cross_square", name: "Village Green", x: 20, y: 10, w: 8, h: 6, kind: "landmark" },
        { id: "cross_mill", name: "Windmill", x: 34, y: 8, w: 6, h: 7, kind: "landmark" }
      ],
      resources: [
        { id: "emberberry", x: 16, y: 28, respawn: 1 },
        { id: "sturdy_plank", x: 38, y: 30, respawn: 2 }
      ],
      chests: [
        { id: "crosshill_hide", x: 6, y: 14, loot: [{ id: "trade_charter", qty: 1 }, { id: "gold", qty: 70 }] }
      ]
    },
    harbor_moor: {
      id: "harbor_moor",
      name: "Harbor Moor",
      theme: "harbor_moor",
      width: 54,
      height: 44,
      base: "grass",
      music: "town",
      danger: 1,
      exits: [
        { x: 22, y: 2, w: 10, h: 3, to: "overworld", spawn: { x: 54, y: 86 }, label: "The Long Vale" },
        { x: 48, y: 18, w: 4, h: 8, to: "swamp", spawn: { x: 12, y: 62 }, label: "Ashen Swamp" }
      ],
      buildings: [
        { id: "moor_wharf", name: "Wharf House", x: 10, y: 24, w: 12, h: 7, kind: "shop" },
        { id: "moor_chandler", name: "Chandler & Net", x: 28, y: 22, w: 8, h: 6, kind: "shop" },
        { id: "moor_warehouse", name: "Salt Warehouse", x: 38, y: 30, w: 10, h: 6, kind: "landmark" },
        { id: "moor_square", name: "Tide Circle", x: 22, y: 14, w: 9, h: 6, kind: "landmark" }
      ],
      resources: [
        { id: "ash_reed", x: 8, y: 36, respawn: 1 },
        { id: "dock_bell", x: 22, y: 26, respawn: 999 }
      ],
      chests: [
        { id: "moor_tide", x: 42, y: 18, loot: [{ id: "swamp_pepper", qty: 4 }, { id: "mana_tonic", qty: 2 }, { id: "gold", qty: 110 }] }
      ]
    },
    ember_depths: {
      id: "ember_depths",
      name: "Ember Depths",
      theme: "dungeon",
      width: 58,
      height: 44,
      base: "rock",
      music: "caverns",
      danger: 5,
      exits: [
        { x: 26, y: 40, w: 6, h: 3, to: "overworld", spawn: { x: 100, y: 74 }, label: "The Long Vale" }
      ],
      enemies: [
        { type: "skeleton", count: 14 },
        { type: "cultist", count: 10 },
        { type: "spirit", count: 8 },
        { type: "slime", count: 6 }
      ],
      bosses: [{ type: "depth_warden", mazeBoss: true }],
      landmarks: [{ id: "warden_arena", x: 26, y: 6, w: 12, h: 10, label: "Seal Hall" }],
      resources: [],
      chests: []
    },
    forest: {
      id: "forest",
      name: "Whispering Forest",
      theme: "forest",
      width: 92,
      height: 72,
      base: "forest",
      music: "forest",
      danger: 1,
      exits: [
        { x: 78, y: 32, w: 5, h: 8, to: "overworld", spawn: { x: 5, y: 46 }, label: "The Long Vale" },
        { x: 8, y: 8, w: 5, h: 6, to: "caverns", spawn: { x: 78, y: 62 }, label: "Crystal Caverns" }
      ],
      enemies: [
        { type: "wolf", count: 15 },
        { type: "slime", count: 12 },
        { type: "insect", count: 7 }
      ],
      resources: [
        { id: "moonleaf", x: 20, y: 18, respawn: 1 },
        { id: "glowcap", x: 33, y: 45, respawn: 1 },
        { id: "ember_seed", x: 54, y: 24, respawn: 2 },
        { id: "sturdy_plank", x: 65, y: 51, respawn: 2 },
        { id: "map_fragment", x: 12, y: 12, respawn: 999 }
      ],
      landmarks: [
        { id: "forest_shrine", x: 16, y: 16, w: 7, h: 6, label: "Moss-Lit Shrine" }
      ],
      chests: [
        { id: "forest_hidden_1", x: 18, y: 18, loot: [{ id: "forest_key", qty: 1 }, { id: "gold", qty: 100 }] },
        { id: "forest_cache_2", x: 63, y: 50, loot: [{ id: "moonleaf", qty: 3 }, { id: "health_potion", qty: 1 }] }
      ]
    },
    pass: {
      id: "pass",
      name: "Bandit Pass",
      theme: "pass",
      width: 96,
      height: 72,
      base: "rock",
      music: "pass",
      danger: 2,
      exits: [
        { x: 2, y: 31, w: 5, h: 8, to: "town", spawn: { x: 76, y: 37 }, label: "Emberfall Town" },
        { x: 88, y: 9, w: 5, h: 7, to: "caverns", spawn: { x: 10, y: 60 }, label: "Crystal Caverns" },
        { x: 44, y: 66, w: 10, h: 4, to: "crosshill", spawn: { x: 22, y: 10 }, label: "Crosshill Hamlet" }
      ],
      enemies: [
        { type: "bandit", count: 18 },
        { type: "skeleton", count: 8 },
        { type: "insect", count: 5 }
      ],
      bosses: [{ type: "hollow_captain", x: 74, y: 24 }],
      resources: [
        { id: "iron_ore", x: 46, y: 22, respawn: 1 },
        { id: "coal", x: 58, y: 49, respawn: 1 },
        { id: "deserter_letter", x: 69, y: 36, respawn: 999 },
        { id: "map_fragment", x: 84, y: 12, respawn: 999 }
      ],
      chests: [
        { id: "pass_bandit_1", x: 67, y: 37, loot: [{ id: "deserter_letter", qty: 2 }, { id: "gold", qty: 160 }] },
        { id: "pass_cache_2", x: 35, y: 55, loot: [{ id: "iron_ore", qty: 4 }, { id: "stamina_tonic", qty: 1 }] }
      ]
    },
    caverns: {
      id: "caverns",
      name: "Crystal Caverns",
      theme: "caverns",
      width: 92,
      height: 74,
      base: "crystal",
      music: "caverns",
      danger: 3,
      exits: [
        { x: 77, y: 64, w: 7, h: 5, to: "forest", spawn: { x: 11, y: 11 }, label: "Whispering Forest" },
        { x: 7, y: 60, w: 6, h: 5, to: "pass", spawn: { x: 87, y: 12 }, label: "Bandit Pass" },
        { x: 42, y: 2, w: 7, h: 5, to: "ruins", spawn: { x: 43, y: 65 }, label: "Forgotten Ruins" }
      ],
      enemies: [
        { type: "slime", count: 14 },
        { type: "spirit", count: 12 },
        { type: "skeleton", count: 8 }
      ],
      bosses: [{ type: "crystal_wyrm", x: 45, y: 18 }],
      resources: [
        { id: "crystal_shard", x: 31, y: 28, respawn: 1 },
        { id: "glowcap", x: 57, y: 46, respawn: 1 },
        { id: "runic_page", x: 38, y: 15, respawn: 999 },
        { id: "mirror_gem", x: 53, y: 24, respawn: 999 }
      ],
      landmarks: [{ id: "crystal_echo", x: 49, y: 22, w: 8, h: 8, label: "Echo Chamber" }],
      chests: [
        { id: "cavern_shrine", x: 51, y: 23, loot: [{ id: "mirror_gem", qty: 1 }, { id: "mana_tonic", qty: 2 }, { id: "crystal_staff", qty: 1 }] },
        { id: "cavern_ore", x: 28, y: 30, loot: [{ id: "crystal_shard", qty: 6 }, { id: "gold", qty: 120 }] }
      ]
    },
    swamp: {
      id: "swamp",
      name: "Ashen Swamp",
      theme: "swamp",
      width: 92,
      height: 72,
      base: "swamp",
      music: "swamp",
      danger: 4,
      exits: [
        { x: 63, y: 2, w: 9, h: 5, to: "town", spawn: { x: 72, y: 56 }, label: "Emberfall Town" },
        { x: 8, y: 62, w: 6, h: 5, to: "ruins", spawn: { x: 77, y: 12 }, label: "Forgotten Ruins" },
        { x: 84, y: 22, w: 6, h: 8, to: "harbor_moor", spawn: { x: 50, y: 24 }, label: "Harbor Moor" }
      ],
      enemies: [
        { type: "slime", count: 16 },
        { type: "insect", count: 12 },
        { type: "cultist", count: 7 }
      ],
      bosses: [{ type: "swamp_maw", x: 41, y: 47 }],
      resources: [
        { id: "ash_reed", x: 58, y: 21, respawn: 1 },
        { id: "swamp_pepper", x: 34, y: 34, respawn: 1 },
        { id: "dock_bell", x: 22, y: 56, respawn: 999 },
        { id: "runic_page", x: 17, y: 60, respawn: 999 }
      ],
      landmarks: [{ id: "swamp_camp", x: 30, y: 28, w: 9, h: 7, label: "Abandoned Lantern Camp" }],
      chests: [
        { id: "swamp_bell_chest", x: 22, y: 56, loot: [{ id: "dock_bell", qty: 1 }, { id: "ash_reed", qty: 4 }] },
        { id: "swamp_cache", x: 37, y: 33, loot: [{ id: "swamp_pepper", qty: 5 }, { id: "health_potion", qty: 2 }] }
      ]
    },
    ruins: {
      id: "ruins",
      name: "Forgotten Ruins",
      theme: "ruins",
      width: 94,
      height: 74,
      base: "ruin",
      music: "ruins",
      danger: 5,
      exits: [
        { x: 38, y: 69, w: 10, h: 4, to: "town", spawn: { x: 57, y: 8 }, label: "Emberfall Town" },
        { x: 78, y: 9, w: 6, h: 5, to: "swamp", spawn: { x: 10, y: 62 }, label: "Ashen Swamp" },
        { x: 41, y: 2, w: 8, h: 5, to: "caverns", spawn: { x: 45, y: 7 }, label: "Crystal Caverns" },
        { x: 88, y: 34, w: 5, h: 8, to: "citadel", spawn: { x: 8, y: 40 }, label: "Ancient Citadel", requires: "citadel_key" }
      ],
      enemies: [
        { type: "skeleton", count: 18 },
        { type: "cultist", count: 15 },
        { type: "spirit", count: 8 }
      ],
      bosses: [{ type: "forgotten_king", x: 48, y: 22 }],
      resources: [
        { id: "royal_seal", x: 35, y: 26, respawn: 999 },
        { id: "court_mask", x: 55, y: 34, respawn: 999 },
        { id: "lore_book", x: 43, y: 48, respawn: 999 },
        { id: "runic_page", x: 31, y: 14, respawn: 999 },
        { id: "ancient_relic", x: 52, y: 17, respawn: 999 }
      ],
      chests: [
        { id: "ruin_records", x: 43, y: 48, loot: [{ id: "lore_book", qty: 2 }, { id: "royal_seal", qty: 1 }] },
        { id: "ruin_court", x: 55, y: 34, loot: [{ id: "court_mask", qty: 3 }, { id: "gold", qty: 260 }] }
      ]
    },
    mountains: {
      id: "mountains",
      name: "Frostpeak Mountains",
      theme: "mountains",
      width: 92,
      height: 74,
      base: "snow",
      music: "mountains",
      danger: 6,
      exits: [
        { x: 16, y: 70, w: 9, h: 4, to: "town", spawn: { x: 20, y: 8 }, label: "Emberfall Town" }
      ],
      enemies: [
        { type: "wolf", count: 10 },
        { type: "spirit", count: 16 },
        { type: "skeleton", count: 8 }
      ],
      bosses: [{ type: "frost_titan", x: 48, y: 22 }],
      resources: [
        { id: "frost_core", x: 50, y: 29, respawn: 1 },
        { id: "frost_wool", x: 35, y: 44, respawn: 1 },
        { id: "map_fragment", x: 23, y: 31, respawn: 999 },
        { id: "ancient_relic", x: 52, y: 21, respawn: 999 }
      ],
      landmarks: [{ id: "frost_beacon", x: 46, y: 18, w: 8, h: 7, label: "Frostpeak Beacon" }],
      chests: [
        { id: "mountain_beacon", x: 52, y: 21, loot: [{ id: "frost_core", qty: 3 }, { id: "ancient_relic", qty: 1 }, { id: "frost_wand", qty: 1 }] },
        { id: "mountain_cache", x: 31, y: 50, loot: [{ id: "frost_wool", qty: 4 }, { id: "focus_tea", qty: 2 }] }
      ]
    },
    citadel: {
      id: "citadel",
      name: "Ancient Citadel",
      theme: "citadel",
      width: 98,
      height: 78,
      base: "floor",
      music: "citadel",
      danger: 8,
      exits: [
        { x: 2, y: 36, w: 6, h: 8, to: "ruins", spawn: { x: 86, y: 38 }, label: "Forgotten Ruins" }
      ],
      enemies: [
        { type: "cultist", count: 16 },
        { type: "skeleton", count: 14 },
        { type: "spirit", count: 12 },
        { type: "bandit", count: 8 }
      ],
      bosses: [{ type: "ember_dragon", x: 72, y: 32 }],
      resources: [
        { id: "ember_scale", x: 68, y: 42, respawn: 2 },
        { id: "ancient_relic", x: 70, y: 29, respawn: 999 },
        { id: "lore_book", x: 58, y: 51, respawn: 999 }
      ],
      landmarks: [{ id: "citadel_gate", x: 8, y: 36, w: 8, h: 8, label: "Citadel Gate" }],
      chests: [
        { id: "citadel_armory", x: 61, y: 48, loot: [{ id: "ember_scale", qty: 3 }, { id: "gold", qty: 440 }] },
        { id: "dragon_hoard", x: 73, y: 30, loot: [{ id: "ancient_relic", qty: 2 }, { id: "mana_tonic", qty: 3 }, { id: "ember_blade", qty: 1 }] }
      ]
    }
  };
}());
