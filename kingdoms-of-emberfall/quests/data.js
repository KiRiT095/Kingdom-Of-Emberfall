(function () {
  "use strict";

  const KOE = window.KOE = window.KOE || {};

  KOE.QUESTS = [
    {
      id: "story_arrival",
      type: "story",
      title: "Ashes at the Gate",
      giver: "rowan",
      summary: "Find Mayor Rowan and learn why Emberfall still smolders after the war.",
      objectives: [
        { type: "talk", target: "rowan", count: 1, text: "Speak with Mayor Rowan in Town Hall" },
        { type: "explore", target: "town_square", count: 1, text: "Inspect the scorched town square" }
      ],
      // Early reward: small XP/gold to avoid runaway leveling if the objective fires twice.
      rewards: { gold: 60, xp: 90, items: [{ id: "hearthstone", qty: 1 }, { id: "health_potion", qty: 2 }] },
      next: "story_blacksmith"
    },
    {
      id: "story_blacksmith",
      type: "story",
      title: "A Blade Reforged",
      giver: "brann",
      summary: "Gather the materials Brann needs to restore your old sword.",
      objectives: [
        { type: "collect", target: "iron_ore", count: 4, text: "Collect iron ore from Bandit Pass or Crystal Caverns" },
        { type: "kill", target: "slime", count: 3, text: "Defeat slimes for binding gel" }
      ],
      rewards: { gold: 180, xp: 180, items: [{ id: "ember_steel_sword", qty: 1 }] },
      requires: "story_arrival",
      next: "story_forest"
    },
    {
      id: "story_forest",
      type: "story",
      title: "The Green Road",
      giver: "elara",
      summary: "Reopen the forest road and discover why the trees whisper at night.",
      objectives: [
        { type: "explore", target: "forest_shrine", count: 1, text: "Find the shrine in Whispering Forest" },
        { type: "kill", target: "wolf", count: 8, text: "Drive back hungry wolves" },
        { type: "collect", target: "moonleaf", count: 5, text: "Gather moonleaf for Elara" }
      ],
      rewards: { gold: 220, xp: 260, items: [{ id: "forest_key", qty: 1 }] },
      requires: "story_blacksmith",
      next: "story_bandit"
    },
    {
      id: "story_bandit",
      type: "story",
      title: "The Pass Must Open",
      giver: "cora",
      summary: "Bandits have seized the western pass. Break their grip on Emberfall's trade.",
      objectives: [
        { type: "kill", target: "bandit", count: 10, text: "Defeat bandits in Bandit Pass" },
        { type: "boss", target: "hollow_captain", count: 1, text: "Defeat the Hollow Knight Captain" }
      ],
      rewards: { gold: 360, xp: 460, items: [{ id: "trade_charter", qty: 1 }] },
      requires: "story_forest",
      next: "story_crystal"
    },
    {
      id: "story_crystal",
      type: "story",
      title: "Caverns of Glass",
      giver: "selene",
      summary: "The mage tower needs a living crystal to restore the town ward.",
      objectives: [
        { type: "collect", target: "crystal_shard", count: 8, text: "Mine crystal shards" },
        { type: "boss", target: "crystal_wyrm", count: 1, text: "Defeat the Crystal Wyrm" }
      ],
      rewards: { gold: 460, xp: 620, items: [{ id: "ward_crystal", qty: 1 }] },
      requires: "story_bandit",
      next: "story_swamp"
    },
    {
      id: "story_swamp",
      type: "story",
      title: "Lanterns in the Mire",
      giver: "mira",
      summary: "Track the missing lantern keepers into Ashen Swamp.",
      objectives: [
        { type: "explore", target: "swamp_camp", count: 1, text: "Find the abandoned swamp camp" },
        { type: "collect", target: "ash_reed", count: 6, text: "Collect ash reeds" },
        { type: "boss", target: "swamp_maw", count: 1, text: "Defeat Swamp Maw" }
      ],
      rewards: { gold: 540, xp: 760, items: [{ id: "mire_lantern", qty: 1 }] },
      requires: "story_crystal",
      next: "story_ruins"
    },
    {
      id: "story_ruins",
      type: "story",
      title: "Names Beneath Stone",
      giver: "rowan",
      summary: "Recover royal records from Forgotten Ruins and learn who betrayed the kingdom.",
      objectives: [
        { type: "collect", target: "royal_seal", count: 3, text: "Recover broken royal seals" },
        { type: "boss", target: "forgotten_king", count: 1, text: "Defeat the Forgotten King" }
      ],
      rewards: { gold: 620, xp: 930, items: [{ id: "oathbound_crown", qty: 1 }] },
      requires: "story_swamp",
      next: "story_frost"
    },
    {
      id: "story_frost",
      type: "story",
      title: "Signal Fire",
      giver: "brann",
      summary: "Climb Frostpeak Mountains and relight the old beacon.",
      objectives: [
        { type: "collect", target: "frost_core", count: 5, text: "Harvest frost cores from spirits" },
        { type: "boss", target: "frost_titan", count: 1, text: "Defeat the Frost Titan" },
        { type: "explore", target: "frost_beacon", count: 1, text: "Relight the mountain beacon" }
      ],
      rewards: { gold: 780, xp: 1180, items: [{ id: "beacon_flame", qty: 1 }] },
      requires: "story_ruins",
      next: "story_citadel"
    },
    {
      id: "story_citadel",
      type: "story",
      title: "The Ancient Citadel",
      giver: "selene",
      summary: "Unlock the citadel gate using relics won from every region.",
      objectives: [
        { type: "collect", target: "ancient_relic", count: 4, text: "Recover ancient relics from elite foes" },
        { type: "explore", target: "citadel_gate", count: 1, text: "Open the Ancient Citadel" }
      ],
      rewards: { gold: 900, xp: 1500, items: [{ id: "citadel_key", qty: 1 }] },
      requires: "story_frost",
      next: "story_ember_dragon"
    },
    {
      id: "story_ember_dragon",
      type: "story",
      title: "Crown of Embers",
      giver: "rowan",
      summary: "Face the Ember Dragon and decide the future of the kingdom.",
      objectives: [
        { type: "boss", target: "ember_dragon", count: 1, text: "Defeat the Ember Dragon" },
        { type: "house", target: "upgrade", count: 3, text: "Restore your home as a symbol of renewal" },
        { type: "relationship", target: "town", count: 20, text: "Earn the trust of Emberfall" }
      ],
      rewards: { gold: 1600, xp: 2500, items: [{ id: "ember_crown", qty: 1 }] },
      requires: "story_citadel"
    },

    { id: "side_wolf_pelts", type: "side", title: "Warm Cloaks", giver: "tamsin", summary: "Tamsin needs pelts before the night frost returns.", objectives: [{ type: "collect", target: "wolf_pelt", count: 6, text: "Bring wolf pelts to Tamsin" }], rewards: { gold: 130, xp: 90, relation: { tamsin: 2 } } },
    { id: "side_mushroom_stew", type: "side", title: "A Stew for Survivors", giver: "orin", summary: "The tavern can feed everyone if you gather glowcaps.", objectives: [{ type: "collect", target: "glowcap", count: 8, text: "Gather glowcaps in forest or caverns" }], rewards: { gold: 110, xp: 80, items: [{ id: "hearty_stew", qty: 3 }], relation: { orin: 2 } } },
    { id: "side_smith_coal", type: "side", title: "The Forge Breathes", giver: "brann", summary: "Brann wants coal and ore to keep the forge running.", objectives: [{ type: "collect", target: "coal", count: 5, text: "Collect coal" }, { type: "collect", target: "iron_ore", count: 5, text: "Collect iron ore" }], rewards: { gold: 190, xp: 120, relation: { brann: 2 } } },
    { id: "side_dock_rope", type: "side", title: "Ropes for the Docks", giver: "nella", summary: "The docks need repairs after last night's tide.", objectives: [{ type: "collect", target: "ash_reed", count: 5, text: "Gather ash reeds for rope" }], rewards: { gold: 140, xp: 95, relation: { nella: 2 } } },
    { id: "side_market_spice", type: "side", title: "Spice Road Memory", giver: "cora", summary: "Cora wants to restart trade with a fragrant batch of swamp pepper.", objectives: [{ type: "collect", target: "swamp_pepper", count: 7, text: "Collect swamp pepper" }], rewards: { gold: 210, xp: 125, relation: { cora: 2 } } },
    { id: "side_mage_pages", type: "side", title: "Pages in the Rain", giver: "selene", summary: "A storm scattered Selene's notes into the ruins.", objectives: [{ type: "collect", target: "runic_page", count: 6, text: "Recover runic pages" }], rewards: { gold: 220, xp: 160, items: [{ id: "mana_tonic", qty: 2 }], relation: { selene: 2 } } },
    { id: "side_farm_seed", type: "side", title: "Seed Hope", giver: "jory", summary: "Jory has soil again, but no seeds worth planting.", objectives: [{ type: "collect", target: "ember_seed", count: 10, text: "Find ember seeds from wild growth" }], rewards: { gold: 100, xp: 90, items: [{ id: "farm_seed_pack", qty: 1 }], relation: { jory: 3 } } },
    { id: "side_inn_linen", type: "side", title: "Beds for Travelers", giver: "ada", summary: "The inn can reopen if Ada can mend her bedding.", objectives: [{ type: "collect", target: "silk_thread", count: 5, text: "Harvest silk thread from insects" }], rewards: { gold: 160, xp: 120, relation: { ada: 2 } } },
    { id: "side_bounty_bones", type: "bounty", title: "Bounty: Rattling Bones", giver: "rowan", summary: "Skeletons prowl the grave road.", objectives: [{ type: "kill", target: "skeleton", count: 12, text: "Defeat skeletons" }], rewards: { gold: 280, xp: 220 } },
    { id: "side_bounty_cult", type: "bounty", title: "Bounty: Violet Candles", giver: "mira", summary: "Cultists are lighting candles where no prayers should be said.", objectives: [{ type: "kill", target: "cultist", count: 9, text: "Defeat cultists" }], rewards: { gold: 300, xp: 260 } },
    { id: "side_bounty_insects", type: "bounty", title: "Bounty: Chitin Tide", giver: "brann", summary: "Giant insects are chewing through lumber wagons.", objectives: [{ type: "kill", target: "insect", count: 14, text: "Defeat giant insects" }], rewards: { gold: 260, xp: 230 } },
    { id: "side_spirits", type: "side", title: "Blue Fire Friends", giver: "selene", summary: "Not every elemental spirit is hostile. Bring proof before Rowan orders a purge.", objectives: [{ type: "collect", target: "spirit_ember", count: 5, text: "Collect spirit embers" }], rewards: { gold: 260, xp: 240, items: [{ id: "spirit_charm", qty: 1 }], relation: { selene: 2, rowan: 1 } } },
    { id: "side_lost_ring", type: "side", title: "Nella's Ring", giver: "nella", summary: "Nella lost her wedding ring when the docks burned.", objectives: [{ type: "collect", target: "river_ring", count: 1, text: "Find Nella's ring near water" }], rewards: { gold: 180, xp: 130, relation: { nella: 4 } } },
    { id: "side_old_map", type: "side", title: "Cartographer's Debt", giver: "tamsin", summary: "A map fragment may reveal safe paths through the mountains.", objectives: [{ type: "collect", target: "map_fragment", count: 4, text: "Collect map fragments" }], rewards: { gold: 250, xp: 210, items: [{ id: "mountain_map", qty: 1 }], relation: { tamsin: 2 } } },
    { id: "side_gem_order", type: "side", title: "Gemlight Windows", giver: "ada", summary: "Ada dreams of lantern glass that will make the inn glow again.", objectives: [{ type: "collect", target: "crystal_shard", count: 10, text: "Gather crystal shards" }], rewards: { gold: 290, xp: 230, relation: { ada: 3 } } },
    { id: "side_house_warmth", type: "house", title: "A Real Hearth", giver: "orin", summary: "Build a cooking hearth in your house.", objectives: [{ type: "house", target: "crafting_station", count: 1, text: "Place a crafting station or hearth at home" }], rewards: { gold: 150, xp: 120, items: [{ id: "hearty_stew", qty: 2 }], relation: { orin: 2 } } },
    { id: "side_home_storage", type: "house", title: "Chest With a Past", giver: "mira", summary: "Mira gives you an old guard chest if you can repair it.", objectives: [{ type: "collect", target: "sturdy_plank", count: 8, text: "Collect sturdy planks" }, { type: "house", target: "chest", count: 1, text: "Place a storage chest in your house" }], rewards: { gold: 150, xp: 130, relation: { mira: 2 } } },
    { id: "side_trophy_wall", type: "house", title: "Stories on the Wall", giver: "rowan", summary: "Display proof that Emberfall still has protectors.", objectives: [{ type: "house", target: "trophy", count: 2, text: "Place two trophies at home" }], rewards: { gold: 240, xp: 200, relation: { rowan: 2 } } },
    { id: "side_first_crop", type: "side", title: "First Harvest", giver: "jory", summary: "Grow something on your recovered plot.", objectives: [{ type: "collect", target: "emberberry", count: 6, text: "Harvest emberberries from your farm plot or wild shrubs" }], rewards: { gold: 170, xp: 170, relation: { jory: 3 } } },
    { id: "side_secret_well", type: "side", title: "The Well Hums Back", giver: "selene", summary: "The old well echoes with citadel magic.", objectives: [{ type: "explore", target: "old_well", count: 1, text: "Investigate the old well in town" }, { type: "collect", target: "ancient_relic", count: 1, text: "Bring Selene a relic from the echo" }], rewards: { gold: 330, xp: 300, relation: { selene: 3 } } },
    { id: "side_lore_books", type: "side", title: "Library Without a Roof", giver: "rowan", summary: "Rowan wants books rescued before rain takes the ink.", objectives: [{ type: "collect", target: "lore_book", count: 6, text: "Recover lore books" }], rewards: { gold: 230, xp: 210, relation: { rowan: 2 } } },
    { id: "side_moon_tea", type: "side", title: "Moon Tea", giver: "ada", summary: "Ada's sleep tea calms nightmares after thunderstorms.", objectives: [{ type: "collect", target: "moonleaf", count: 9, text: "Gather moonleaf" }], rewards: { gold: 170, xp: 140, items: [{ id: "focus_tea", qty: 3 }], relation: { ada: 2 } } },
    { id: "side_better_bow", type: "side", title: "Quiet String", giver: "tamsin", summary: "Tamsin can improve your bow if you bring rare thread.", objectives: [{ type: "collect", target: "silk_thread", count: 8, text: "Collect silk thread" }, { type: "collect", target: "wolf_pelt", count: 3, text: "Bring soft pelts" }], rewards: { gold: 150, xp: 190, items: [{ id: "ranger_bow", qty: 1 }], relation: { tamsin: 2 } } },
    { id: "side_cave_echo", type: "dungeon", title: "Echoes in Crystal", giver: "selene", summary: "An echo in the caverns repeats one word: home.", objectives: [{ type: "explore", target: "crystal_echo", count: 1, text: "Find the echo chamber" }, { type: "kill", target: "spirit", count: 5, text: "Calm hostile spirits" }], rewards: { gold: 320, xp: 330, items: [{ id: "mirror_gem", qty: 1 }] } },
    { id: "side_bandit_letter", type: "side", title: "Letters Never Sent", giver: "mira", summary: "Some bandits may be deserters. Find their letters.", objectives: [{ type: "collect", target: "deserter_letter", count: 5, text: "Collect deserter letters" }], rewards: { gold: 220, xp: 210, relation: { mira: 3 } } },
    { id: "side_swamp_bell", type: "dungeon", title: "Bell Under Black Water", giver: "nella", summary: "A dock bell sunk in the mire may guide boats home.", objectives: [{ type: "collect", target: "dock_bell", count: 1, text: "Retrieve the sunken dock bell" }, { type: "kill", target: "slime", count: 8, text: "Clear mire slimes" }], rewards: { gold: 310, xp: 300, relation: { nella: 3 } } },
    { id: "side_ruin_masks", type: "dungeon", title: "Masks of the Old Court", giver: "rowan", summary: "Masks in the ruins bear faces of nobles erased from records.", objectives: [{ type: "collect", target: "court_mask", count: 5, text: "Recover old court masks" }], rewards: { gold: 370, xp: 360, relation: { rowan: 3 } } },
    { id: "side_frost_wool", type: "side", title: "Wool for Frostpeak", giver: "cora", summary: "Cora can stock cold-weather gear if you find frost wool.", objectives: [{ type: "collect", target: "frost_wool", count: 8, text: "Gather frost wool" }], rewards: { gold: 330, xp: 280, items: [{ id: "frost_cloak", qty: 1 }], relation: { cora: 3 } } },
    { id: "side_dragon_scales", type: "side", title: "Scales That Remember", giver: "brann", summary: "Brann can forge legendary armor with dragon-touched scales.", objectives: [{ type: "collect", target: "ember_scale", count: 8, text: "Collect ember scales in the citadel" }, { type: "collect", target: "ancient_relic", count: 2, text: "Add ancient relics to the alloy" }], rewards: { gold: 600, xp: 620, items: [{ id: "emberguard_armor", qty: 1 }], relation: { brann: 4 } } },
    { id: "side_friendship_feast", type: "relationship", title: "A Feast With Names", giver: "orin", summary: "Bring dishes and gifts so Emberfall can sit together again.", objectives: [{ type: "collect", target: "hearty_stew", count: 4, text: "Bring hearty stew" }, { type: "relationship", target: "town", count: 12, text: "Earn twelve total relationship hearts" }], rewards: { gold: 420, xp: 420, relation: { orin: 4, rowan: 2, mira: 2 } } },
    { id: "side_final_garden", type: "house", title: "Garden After War", giver: "jory", summary: "Turn your yard into proof that the kingdom can grow.", objectives: [{ type: "house", target: "farm_plot", count: 4, text: "Build four farm plots" }, { type: "collect", target: "emberberry", count: 12, text: "Harvest twelve emberberries" }], rewards: { gold: 450, xp: 500, relation: { jory: 4 } } }
  ];

  KOE.REPEATABLE_QUESTS = [
    { id: "repeat_bounty", type: "bounty", title: "Notice Board: Monster Bounty", giver: "rowan", targetPool: ["wolf", "skeleton", "bandit", "slime", "cultist", "insect", "spirit"], count: [6, 14], rewardGold: [90, 260], rewardXp: [80, 220] },
    { id: "repeat_gather", type: "fetch", title: "Notice Board: Supply Run", giver: "cora", targetPool: ["moonleaf", "glowcap", "iron_ore", "ash_reed", "crystal_shard", "swamp_pepper", "sturdy_plank"], count: [4, 12], rewardGold: [70, 230], rewardXp: [60, 190] },
    { id: "repeat_dungeon", type: "dungeon", title: "Notice Board: Strange Rumor", giver: "mira", targetPool: ["forest_shrine", "crystal_echo", "swamp_camp", "old_well", "frost_beacon", "depths_gate", "vale_marker"], count: [1, 1], rewardGold: [120, 280], rewardXp: [120, 260] }
  ];

  KOE.STORY_CHAIN = [
    "story_arrival",
    "story_blacksmith",
    "story_forest",
    "story_bandit",
    "story_crystal",
    "story_swamp",
    "story_ruins",
    "story_frost",
    "story_citadel",
    "story_ember_dragon"
  ];

  KOE.STORY_PHASE_LABELS = {
    early: "Part I — Hearth and Roads",
    mid: "Part II — Borders of the Old Kingdom",
    late: "Part III — Crown and Citadel"
  };

  KOE.STORY_PHASE_IDS = {
    early: ["story_arrival", "story_blacksmith", "story_forest"],
    mid: ["story_bandit", "story_crystal", "story_swamp", "story_ruins"],
    late: ["story_frost", "story_citadel", "story_ember_dragon"]
  };

  KOE.ADVENTURE_NOTES = [
    {
      id: "note_welcome",
      title: "Letter from the Road",
      body: "Captain Mira asked you to speak with Mayor Rowan and learn why Emberfall still stands. The west gate opens onto the Long Vale—your first step beyond the walls.",
      unlockOnComplete: "story_arrival"
    },
    {
      id: "note_forge",
      title: "Steel Remembers",
      body: "Brann can restore a blade if you bring ore from Bandit Pass or the Crystal Caverns, and gel from slimes. A sharper sword opens every path that follows.",
      unlockOnComplete: "story_blacksmith"
    },
    {
      id: "note_vale",
      title: "The Long Vale",
      body: "Crosshill and Harbor Moor sit on the vale road. The Sunken Stair east of the vale leads down into the Ember Depths—keys hide in dead ends; the Warden waits at the heart.",
      unlockOnComplete: "story_forest"
    },
    {
      id: "note_trade",
      title: "When the Pass Opens",
      body: "Defeating the Hollow Knight Captain restores sanctioned trade. Rangers trust scheduled fast travel along known roads—check your World journal once caravans run again.",
      unlockOnComplete: "story_bandit"
    },
    {
      id: "note_ward",
      title: "Glass and Breath",
      body: "Living crystal from the caverns can anchor Selene's ward over the town. The Crystal Wyrm guards the deepest reflections.",
      unlockOnComplete: "story_crystal"
    },
    {
      id: "note_swamp",
      title: "Lanterns Under Ash",
      body: "The swamp hides the bell that once called boats home. Follow Mira's markers—fire draws worse things than wolves after dark.",
      unlockOnComplete: "story_swamp"
    },
    {
      id: "note_throne",
      title: "Names Carved in Ruins",
      body: "Royal seals and masks tell who broke oaths before the kingdom fell. The Forgotten King still judges from broken stone.",
      unlockOnComplete: "story_ruins"
    },
    {
      id: "note_peak",
      title: "The Beacon Memory",
      body: "Frostpeak's flame proves the mountains still answer Emberfall. Carry cores warm enough to wake old signals.",
      unlockOnComplete: "story_frost"
    },
    {
      id: "note_gate",
      title: "Relics and Locks",
      body: "Four relics from the world's trials fit the citadel gate. What sleeps beyond has waited longer than living memory.",
      unlockOnComplete: "story_citadel"
    },
    {
      id: "note_dragon",
      title: "The Ember Crown",
      body: "When the dragon falls, the town looks to you—not for conquest, but for proof that ordinary courage can finish what kings began.",
      unlockOnComplete: "story_ember_dragon"
    }
  ];

  KOE.REGION_RUMORS = {
    overworld: "Travelers say Crosshill trades grain while Harbor Moor smells of tide and rope. Eastward, black stairs descend toward something that hoards keys.",
    crosshill: "Hamlet folk whisper that the pass clears when the Hollow Captain falls—then caravans remember your name.",
    harbor_moor: "Fishers tie reed ropes tight before dusk. The swamp mouth southward swallows bells and patience alike.",
    ember_depths: "Two gates hunger for iron and brass. Listen for the Warden—when radial fire fills the dark, dance outward first.",
    forest: "The shrine moss glows when wolves quiet. Moonleaf grows where silver light touches bark.",
    pass: "Bandits respect broken armor more than speeches. The captain camps where cliffs choke the road.",
    caverns: "Echoes repeat what you wish you'd said. The Wyrm coils where crystal sings loudest.",
    swamp: "Ash clings to reed boats. The maw rises where black water forgets its shore.",
    ruins: "Courtiers wore smiles cut from porcelain. Seals bear wings—follow broken crowns toward truth.",
    mountains: "Spirits ride the cold wind. The beacon stone remembers every fire ever lit above the snow.",
    citadel: "Dragon ash salts the floor. Scale for scale, the hoard weighs memory heavier than gold."
  };

  KOE.SIGNPOSTS = [
    { region: "town", x: 6, y: 34, lines: ["West gate → Long Vale", "South docks · farms · YOUR HOUSE"] },
    { region: "town", x: 41, y: 28, lines: ["Town Square", "Town Hall north · Market east"] },
    { region: "town", x: 74, y: 36, lines: ["East routes", "Bandit Pass · mountains · ruins"] },
    { region: "overworld", x: 54, y: 46, lines: ["Crosshill ↑ North", "Harbor Moor ↓ South", "Forest ← West · Stair → East"] },
    { region: "overworld", x: 102, y: 74, lines: ["Sunken Stair — Ember Depths", "Turn back if unprovisioned"] }
  ];

  KOE.FAST_TRAVEL = {
    unlockQuest: "story_bandit",
    points: [
      { region: "overworld", label: "Long Vale (crossroads)", spawn: { x: 54, y: 46 } },
      { region: "forest", label: "Whispering Forest (east edge)", spawn: { x: 74, y: 36 } },
      { region: "crosshill", label: "Crosshill Hamlet", spawn: { x: 22, y: 30 } },
      { region: "harbor_moor", label: "Harbor Moor", spawn: { x: 25, y: 34 } },
      { region: "pass", label: "Bandit Pass (town side)", spawn: { x: 12, y: 38 } },
      { region: "caverns", label: "Crystal Caverns (forest mouth)", spawn: { x: 78, y: 62 } },
      { region: "swamp", label: "Ashen Swamp (moor gate)", spawn: { x: 12, y: 62 } },
      { region: "ruins", label: "Forgotten Ruins (south)", spawn: { x: 42, y: 68 } },
      { region: "mountains", label: "Frostpeak approach", spawn: { x: 20, y: 68 } }
    ]
  };
}());
