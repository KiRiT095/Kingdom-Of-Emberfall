(function () {
  "use strict";

  const KOE = window.KOE = window.KOE || {};

  KOE.NPCS = [
    {
      id: "rowan",
      name: "Mayor Rowan",
      sprite: "villager",
      role: "Mayor",
      personality: "Tired, careful, and stubbornly hopeful.",
      home: "town_hall",
      shop: null,
      quests: ["story_arrival", "side_bounty_bones", "side_trophy_wall", "side_lore_books", "side_ruin_masks", "story_ruins", "story_ember_dragon"],
      schedule: [
        { from: 0, to: 7, region: "town", x: 42, y: 23, action: "sleep" },
        { from: 7, to: 10, region: "town", x: 39, y: 32, action: "inspect the square" },
        { from: 10, to: 17, region: "town", x: 47, y: 20, action: "work in Town Hall" },
        { from: 17, to: 21, region: "town", x: 35, y: 25, action: "listen by the fountain" },
        { from: 21, to: 24, region: "town", x: 42, y: 23, action: "rest" }
      ],
      lines: {
        default: ["The war took our banners, not our names.", "A town is rebuilt one promise at a time."],
        rain: ["Rain makes every roof complain. It also tells us which ones still stand."],
        night: ["At night the ruins look almost royal again. That is what frightens me."],
        friend: ["You are no longer a visitor here. People look for your lamp in the dark."],
        after_pass: ["Trade charters are legal again. Crosshill sends grain without counting arrows first.", "Tell Cora I said thank you when you next pass the market."],
        after_crystal: ["Selene says the ward holds—thin as frost on glass, but it holds.", "When you walk out there now, something remembers we still live here."]
      }
    },
    {
      id: "mira",
      name: "Captain Mira Vale",
      sprite: "smith",
      role: "Guard Captain",
      personality: "Direct, protective, with a dry sense of humor.",
      home: "barracks",
      quests: ["story_swamp", "side_bounty_cult", "side_home_storage", "side_bandit_letter"],
      schedule: [
        { from: 0, to: 5, region: "town", x: 23, y: 21, action: "sleep" },
        { from: 5, to: 9, region: "town", x: 26, y: 33, action: "patrol the gate" },
        { from: 9, to: 16, region: "town", x: 31, y: 25, action: "drill recruits" },
        { from: 16, to: 22, region: "town", x: 28, y: 42, action: "walk the southern road" },
        { from: 22, to: 24, region: "town", x: 23, y: 21, action: "write reports" }
      ],
      lines: {
        default: ["Keep your blade loose and your feet honest.", "If something growls from a bush, do not negotiate with the bush."],
        rain: ["Rain hides tracks. It also hides you. Use that."],
        night: ["The gate feels heavier after sunset."],
        friend: ["You fight like someone who plans to come home. Good."],
        after_pass: ["Caravan schedules run again—your Journal can chart fast roads once you've walked them once.", "I'll sleep when the pass stops pretending it's neutral ground."]
      }
    },
    {
      id: "brann",
      name: "Brann Coalhand",
      sprite: "smith",
      role: "Blacksmith",
      personality: "Booming, practical, sentimental about broken tools.",
      home: "blacksmith",
      shop: "blacksmith",
      quests: ["story_blacksmith", "side_smith_coal", "side_bounty_insects", "story_frost", "side_dragon_scales"],
      schedule: [
        { from: 0, to: 6, region: "town", x: 17, y: 18, action: "sleep" },
        { from: 6, to: 18, region: "town", x: 18, y: 27, action: "work the forge" },
        { from: 18, to: 21, region: "town", x: 32, y: 37, action: "drink at the tavern" },
        { from: 21, to: 24, region: "town", x: 17, y: 18, action: "bank coals" }
      ],
      lines: {
        default: ["Every nick in a blade is a receipt.", "Bring me ore and I will give your courage an edge."],
        rain: ["Wet coal sulks. So do I."],
        night: ["The forge looks like a second sunrise when the town goes dark."],
        friend: ["Your sword knows my hammer now. Treat it well."],
        after_crystal: ["Crystal dust in the air makes sparks honest.", "I've stock for serious smithing once Selene's ward quiets the edges."]
      }
    },
    {
      id: "selene",
      name: "Selene Voss",
      sprite: "mage",
      role: "Tower Mage",
      personality: "Brilliant, distracted, tender beneath sarcasm.",
      home: "mage_tower",
      shop: "mage",
      quests: ["story_crystal", "story_citadel", "side_mage_pages", "side_spirits", "side_secret_well", "side_cave_echo"],
      schedule: [
        { from: 0, to: 8, region: "town", x: 63, y: 17, action: "read star charts" },
        { from: 8, to: 14, region: "town", x: 62, y: 29, action: "study the tower ward" },
        { from: 14, to: 19, region: "town", x: 48, y: 38, action: "measure ley lines" },
        { from: 19, to: 24, region: "town", x: 63, y: 17, action: "argue with candles" }
      ],
      lines: {
        default: ["Magic is just history refusing to stay buried.", "Do not touch the blue flame. It touches back."],
        rain: ["Thunder is the sky failing a concentration check."],
        night: ["The tower hears better at night. Speak kindly near the stones."],
        friend: ["I have begun labeling my dangerous experiments. That is practically affection."],
        after_crystal: ["The ward sings again—not loudly. Honestly.", "I've unlocked certain tower supplies for those who carried crystal through glass teeth."]
      }
    },
    {
      id: "orin",
      name: "Orin Hearth",
      sprite: "villager",
      role: "Tavern Keeper",
      personality: "Warm, theatrical, and nosy in a helpful way.",
      home: "tavern",
      shop: "tavern",
      quests: ["side_mushroom_stew", "side_house_warmth", "side_friendship_feast"],
      schedule: [
        { from: 0, to: 5, region: "town", x: 33, y: 17, action: "sleep" },
        { from: 5, to: 11, region: "town", x: 34, y: 31, action: "bake bread" },
        { from: 11, to: 23, region: "town", x: 33, y: 37, action: "run the tavern" },
        { from: 23, to: 24, region: "town", x: 33, y: 17, action: "count cups" }
      ],
      lines: {
        default: ["You look like someone whose lunch tried to bite them.", "A full bowl is a small rebellion against despair."],
        rain: ["Rain doubles soup sales. I am grieving responsibly."],
        night: ["Night stories are cheaper if you buy stew."],
        friend: ["Your chair is the one closest to the hearth. No arguing."]
      }
    },
    {
      id: "cora",
      name: "Cora Finch",
      sprite: "villager",
      role: "Market Trader",
      personality: "Fast-talking, sharp-eyed, generous after bargaining.",
      home: "market",
      shop: "market",
      quests: ["story_bandit", "side_market_spice", "side_frost_wool"],
      schedule: [
        { from: 0, to: 6, region: "town", x: 52, y: 20, action: "sleep" },
        { from: 6, to: 16, region: "town", x: 51, y: 34, action: "run market stall" },
        { from: 16, to: 19, region: "town", x: 55, y: 45, action: "check trade road" },
        { from: 19, to: 24, region: "town", x: 52, y: 20, action: "audit ledgers" }
      ],
      lines: {
        default: ["A discount is just a friendship with paperwork.", "Bring me rare goods and I will make your coin purse sing."],
        rain: ["Rain makes buyers sentimental. Excellent weather."],
        night: ["Never trust a deal made by moonlight unless I am making it."],
        friend: ["For you, I start the price almost fair."]
      }
    },
    {
      id: "jory",
      name: "Jory Seed",
      sprite: "villager",
      role: "Farmer",
      personality: "Soft-spoken, observant, quietly brave.",
      home: "farm",
      shop: "farm",
      quests: ["side_farm_seed", "side_first_crop", "side_final_garden"],
      schedule: [
        { from: 0, to: 5, region: "town", x: 62, y: 48, action: "sleep" },
        { from: 5, to: 15, region: "town", x: 59, y: 51, action: "work the farm" },
        { from: 15, to: 18, region: "town", x: 43, y: 38, action: "share vegetables" },
        { from: 18, to: 24, region: "town", x: 62, y: 48, action: "repair fences" }
      ],
      lines: {
        default: ["Soil remembers everything, but it forgives slowly.", "Seeds are tiny plans."],
        rain: ["The fields are drinking. Best sound in the world."],
        night: ["I talk to seedlings at night. They keep secrets better than people."],
        friend: ["Your garden has the stubborn look of a survivor."]
      }
    },
    {
      id: "nella",
      name: "Nella Reed",
      sprite: "villager",
      role: "Dock Master",
      personality: "Practical, weather-wise, and haunted by the river.",
      home: "docks",
      shop: "docks",
      quests: ["side_dock_rope", "side_lost_ring", "side_swamp_bell"],
      schedule: [
        { from: 0, to: 6, region: "town", x: 70, y: 40, action: "sleep" },
        { from: 6, to: 17, region: "town", x: 72, y: 49, action: "repair docks" },
        { from: 17, to: 20, region: "town", x: 67, y: 46, action: "watch the river" },
        { from: 20, to: 24, region: "town", x: 70, y: 40, action: "mend nets" }
      ],
      lines: {
        default: ["The river has been too quiet since the citadel fell.", "If you hear bells underwater, walk away first and ask questions later."],
        rain: ["Good rain fills a river. Bad rain wakes it."],
        night: ["The docks creak in old voices after midnight."],
        friend: ["You may borrow any boat that does not currently have a hole in it."]
      }
    },
    {
      id: "ada",
      name: "Ada Plum",
      sprite: "villager",
      role: "Innkeeper",
      personality: "Kind, fussy, brave about small comforts.",
      home: "inn",
      shop: "inn",
      quests: ["side_inn_linen", "side_gem_order", "side_moon_tea"],
      schedule: [
        { from: 0, to: 5, region: "town", x: 44, y: 47, action: "sleep" },
        { from: 5, to: 12, region: "town", x: 43, y: 44, action: "clean rooms" },
        { from: 12, to: 19, region: "town", x: 41, y: 42, action: "welcome travelers" },
        { from: 19, to: 24, region: "town", x: 44, y: 47, action: "sew linens" }
      ],
      lines: {
        default: ["A made bed is civilization in miniature.", "Do come in before you start bleeding on my porch."],
        rain: ["Rain means leaks. Leaks mean buckets. Buckets mean character."],
        night: ["The inn lantern stays lit for anyone who makes it back."],
        friend: ["I saved you the room with the least haunted floorboard."]
      }
    },
    {
      id: "tamsin",
      name: "Tamsin Quill",
      sprite: "villager",
      role: "Ranger",
      personality: "Laconic, precise, affectionate toward maps.",
      home: "ranger_lodge",
      shop: "ranger",
      quests: ["side_wolf_pelts", "side_old_map", "side_better_bow"],
      schedule: [
        { from: 0, to: 5, region: "town", x: 13, y: 43, action: "sleep" },
        { from: 5, to: 12, region: "forest", x: 18, y: 18, action: "scout forest trails" },
        { from: 12, to: 16, region: "town", x: 16, y: 42, action: "mark maps" },
        { from: 16, to: 21, region: "town", x: 28, y: 32, action: "train archers" },
        { from: 21, to: 24, region: "town", x: 13, y: 43, action: "sharpen arrows" }
      ],
      lines: {
        default: ["Walk lighter. Listen longer.", "A map is a promise made by someone who survived."],
        rain: ["Rain quiets leaves and wakes roots."],
        night: ["Do not follow lights in the forest unless they follow you first."],
        friend: ["You have stopped stepping on every twig. Progress."]
      }
    },
    {
      id: "elara",
      name: "Elara Moss",
      sprite: "villager",
      role: "Crosshill Speaker",
      personality: "Warm, practical, proud of her hamlet.",
      home: "cross_inn",
      shop: null,
      quests: [],
      schedule: [
        { from: 0, to: 7, region: "crosshill", x: 14, y: 20, action: "sleep" },
        { from: 7, to: 22, region: "crosshill", x: 24, y: 14, action: "tend the green" },
        { from: 22, to: 24, region: "crosshill", x: 14, y: 20, action: "rest" }
      ],
      lines: {
        default: ["The vale road wears boots thin but hearts lighter.", "Crosshill sends grain east and stories west."],
        night: ["We bar the mill at dusk. Nothing good hunts the crossroads sober."],
        rain: ["Mud is just the road telling you to slow down."]
      }
    },
    {
      id: "tomar",
      name: "Tomar Salt",
      sprite: "smith",
      role: "Wharf Clerk",
      personality: "Dry humor, salt-stained cuffs.",
      home: "moor_wharf",
      shop: null,
      quests: [],
      schedule: [
        { from: 0, to: 6, region: "harbor_moor", x: 14, y: 28, action: "sleep" },
        { from: 6, to: 20, region: "harbor_moor", x: 26, y: 18, action: "tally crates" },
        { from: 20, to: 24, region: "harbor_moor", x: 14, y: 28, action: "lock the wharf" }
      ],
      lines: {
        default: ["Tide pays no tax, but we still measure it.", "Harbor Moor isn't pretty. It's honest."],
        night: ["Lanterns on the water look like coins. Remember which is which."],
        rain: ["Rain saves us the trouble of rinsing the decks."]
      }
    }
  ];

  KOE.DIALOGUE = {
    intro: [
      { speaker: "Captain Mira Vale", text: "You picked a dramatic week to arrive, stranger. Emberfall is still standing, but only because no one told it to stop." },
      { speaker: "Captain Mira Vale", text: "Find Mayor Rowan at Town Hall. Then come back alive from wherever your curiosity drags you." }
    ],
    loreBooks: [
      "The Last Orchard: Before the war, Emberfall was famous for red fruit that glowed beside the river at dusk.",
      "A Soldier's Primer: The citadel's eastern stones were built to hold fire, not keep it out.",
      "Court Record, Torn: The old king sealed a dragon beneath the crown chamber and called it mercy.",
      "Children's Rhyme: Ash in the bell, frost on the stair, do not wake the ember there.",
      "Mage Tower Note: Living crystal amplifies memory. Do not sing near it unless you enjoy consequences."
    ]
  };
}());
