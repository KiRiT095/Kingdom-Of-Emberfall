(function () {
  "use strict";

  const KOE = window.KOE;
  const T = KOE.TILE;

  const STATE = {
    UNKNOWN: "UNKNOWN",
    SEARCH: "SEARCH",
    DISCOVERED: "DISCOVERED",
    COMPLETE: "COMPLETE"
  };

  KOE.GUIDANCE_STATE = STATE;

  KOE.LANDMARKS = {
    town: [
      { id: "town_hall", name: "Town Hall", type: "quest", x: 48, y: 20, quest: "story_arrival" },
      { id: "town_square", name: "Town Square", type: "quest", x: 40, y: 28, quest: "story_arrival" },
      { id: "blacksmith", name: "Blacksmith", type: "blacksmith", x: 18, y: 28, quest: "story_blacksmith" },
      { id: "inn", name: "Inn", type: "inn", x: 44, y: 47 },
      { id: "player_house", name: "Your House", type: "home", x: 26, y: 49 },
      { id: "mage_tower", name: "Mage Tower", type: "quest", x: 64, y: 29, quest: "story_crystal" },
      { id: "ranger_caravan", name: "Ranger Caravan", type: "caravan", x: 6, y: 34 },
      { id: "old_well", name: "Old Well", type: "dungeon", x: 48, y: 36, quest: "side_secret_well" }
    ],
    overworld: [
      { id: "vale_marker", name: "Mileward Stone", type: "quest", x: 57, y: 47 },
      { id: "depths_gate", name: "Sunken Stair", type: "dungeon", x: 102, y: 74 },
      { id: "vale_caravan", name: "Long Vale Caravan", type: "caravan", x: 54, y: 46 }
    ],
    crosshill: [
      { id: "cross_square", name: "Village Green", type: "quest", x: 24, y: 13 },
      { id: "cross_inn", name: "The Crossed Keys", type: "inn", x: 16, y: 24 },
      { id: "cross_caravan", name: "Crosshill Caravan", type: "caravan", x: 22, y: 30 }
    ],
    harbor_moor: [
      { id: "moor_square", name: "Tide Circle", type: "quest", x: 26, y: 17 },
      { id: "moor_wharf", name: "Wharf House", type: "inn", x: 16, y: 31 },
      { id: "moor_caravan", name: "Harbor Caravan", type: "caravan", x: 25, y: 34 }
    ],
    forest: [
      { id: "forest_shrine", name: "Whispering Shrine", type: "quest", x: 19, y: 19, quest: "story_forest" },
      { id: "forest_caravan", name: "Forest Trail Marker", type: "caravan", x: 74, y: 36 }
    ],
    pass: [
      { id: "hollow_captain", name: "Hollow Camp", type: "bounty", x: 74, y: 24, quest: "story_bandit" },
      { id: "pass_caravan", name: "Pass Caravan Post", type: "caravan", x: 12, y: 38 }
    ],
    caverns: [
      { id: "crystal_echo", name: "Echo Chamber", type: "dungeon", x: 53, y: 26, quest: "side_cave_echo" },
      { id: "crystal_wyrm", name: "Wyrm Lair", type: "quest", x: 45, y: 18, quest: "story_crystal" }
    ],
    swamp: [
      { id: "swamp_camp", name: "Lantern Camp", type: "quest", x: 34, y: 31, quest: "story_swamp" },
      { id: "swamp_maw", name: "Maw Pool", type: "bounty", x: 41, y: 47, quest: "story_swamp" }
    ],
    ruins: [
      { id: "forgotten_king", name: "Broken Throne", type: "bounty", x: 48, y: 22, quest: "story_ruins" },
      { id: "citadel_gate", name: "Citadel Gate", type: "dungeon", x: 90, y: 38, quest: "story_citadel" }
    ],
    mountains: [
      { id: "frost_beacon", name: "Frostpeak Beacon", type: "quest", x: 50, y: 21, quest: "story_frost" },
      { id: "frost_titan", name: "Titan Shelf", type: "bounty", x: 48, y: 22, quest: "story_frost" },
      { id: "frostpeak_lift", name: "Frostpeak Lift", type: "caravan", x: 20, y: 68 }
    ],
    ember_depths: [
      { id: "warden_arena", name: "Seal Hall", type: "dungeon", x: 32, y: 11 }
    ],
    citadel: [
      { id: "ember_dragon", name: "Crown Chamber", type: "bounty", x: 72, y: 32, quest: "story_ember_dragon" }
    ]
  };

  KOE.OBJECTIVE_TARGETS = {
    rowan: { kind: "npc", region: "town", x: 48, y: 20, landmark: "town_hall", hint: "Seek Mayor Rowan in Town Hall." },
    town_square: { region: "town", x: 40, y: 28, landmark: "town_square", hint: "Search the scorched stones near town center." },
    iron_ore: { region: "pass", x: 46, y: 22, radius: 12, hint: "Look along rocky seams in Bandit Pass." },
    slime: { region: "forest", x: 44, y: 44, radius: 18, hint: "Slimes gather in damp forest clearings." },
    forest_shrine: { region: "forest", x: 19, y: 19, landmark: "forest_shrine", hint: "Travel toward the Whispering Shrine." },
    wolf: { region: "forest", x: 32, y: 30, radius: 22, hint: "Wolf packs roam the forest road." },
    moonleaf: { region: "forest", x: 20, y: 18, radius: 16, hint: "Moonleaf grows near silver-lit trees." },
    bandit: { region: "pass", x: 58, y: 36, radius: 24, hint: "Bandits patrol the pass cliffs." },
    hollow_captain: { region: "pass", x: 74, y: 24, landmark: "hollow_captain", hint: "Find the captain's camp in Bandit Pass." },
    crystal_shard: { region: "caverns", x: 31, y: 28, radius: 16, hint: "Mine the glowing seams in Crystal Caverns." },
    crystal_wyrm: { region: "caverns", x: 45, y: 18, landmark: "crystal_wyrm", hint: "The wyrm coils where crystal sings loudest." },
    swamp_camp: { region: "swamp", x: 34, y: 31, landmark: "swamp_camp", hint: "Track lantern marks into Ashen Swamp." },
    ash_reed: { region: "swamp", x: 58, y: 21, radius: 16, hint: "Ash reeds grow near black water." },
    swamp_maw: { region: "swamp", x: 41, y: 47, landmark: "swamp_maw", hint: "Swamp Maw waits in the deeper mire." },
    royal_seal: { region: "ruins", x: 35, y: 26, radius: 18, hint: "Search broken courts in Forgotten Ruins." },
    forgotten_king: { region: "ruins", x: 48, y: 22, landmark: "forgotten_king", hint: "The old throne still judges from the ruins." },
    frost_core: { region: "mountains", x: 50, y: 29, radius: 16, hint: "Harvest cores from spirits above the snow line." },
    frost_titan: { region: "mountains", x: 48, y: 22, landmark: "frost_titan", hint: "Climb toward the Titan Shelf." },
    frost_beacon: { region: "mountains", x: 50, y: 21, landmark: "frost_beacon", hint: "Relight the Frostpeak Beacon." },
    ancient_relic: { region: "ruins", x: 52, y: 17, radius: 24, hint: "Relics hide in old royal places." },
    citadel_gate: { region: "ruins", x: 90, y: 38, landmark: "citadel_gate", hint: "Bring relics to the Citadel Gate." },
    ember_dragon: { region: "citadel", x: 72, y: 32, landmark: "ember_dragon", hint: "Face the dragon in the Crown Chamber." },
    upgrade: { region: "town", x: 26, y: 49, landmark: "player_house", hint: "Restore your house as the town recovers." },
    town: { region: "town", x: 40, y: 30, radius: 32, hint: "Build trust with Emberfall's people." },
    depths_gate: { region: "overworld", x: 102, y: 74, landmark: "depths_gate", hint: "Find the Sunken Stair in the Long Vale." },
    vale_marker: { region: "overworld", x: 57, y: 47, landmark: "vale_marker", hint: "Seek the Mileward Stone in the Long Vale." }
  };

  KOE.GuidanceSystem = class {
    constructor(game) {
      this.game = game;
      this.lastGuidanceKey = "";
      this.lastNearbyKey = "";
      this._cacheKey = "";
      this._cache = null;
      this.pulse = 0;
    }

    update(dt) {
      this.pulse += dt;
      const guidance = this.current();
      if (guidance && guidance.state === STATE.DISCOVERED && guidance.distance < 150) {
        const key = `${guidance.questId}:${guidance.objectiveIndex}:${guidance.region}`;
        if (this.lastNearbyKey !== key) {
          this.lastNearbyKey = key;
          this.game.toast("Objective nearby.");
          this.game.audio.sfx("ui");
        }
      }
    }

    current() {
      const tracked = this.game.quests.tracked();
      if (!tracked) return null;
      const quest = this.game.quests.defs.get(tracked.id);
      if (!quest) return null;
      const objectiveIndex = quest.objectives.findIndex((objective, index) => tracked.progress[index] < objective.count);
      if (objectiveIndex < 0) return {
        quest,
        questId: quest.id,
        state: STATE.COMPLETE,
        color: this.questColor(quest, objective),
        label: quest.title
      };
      const objective = quest.objectives[objectiveIndex];
      const cacheKey = [
        quest.id,
        objectiveIndex,
        tracked.progress[objectiveIndex],
        this.game.world.region.id,
        Math.floor(this.game.player.x / 24),
        Math.floor(this.game.player.y / 24)
      ].join(":");
      if (cacheKey === this._cacheKey && this._cache) return this._cache;
      const target = this.resolveTarget(objective);
      const guidance = this.buildGuidance(quest, tracked, objective, objectiveIndex, target);
      this._cacheKey = cacheKey;
      this._cache = guidance;
      return guidance;
    }

    resolveTarget(objective) {
      if (objective.type === "talk") {
        const npc = this.game.world.npcs.find((item) => item.id === objective.target);
        if (npc && npc.availableInRegion(this.game.world.region.id)) {
          return {
            region: this.game.world.region.id,
            x: npc.x / T,
            y: npc.y / T,
            kind: "npc",
            landmark: objective.target,
            hint: `Find ${npc.name}.`
          };
        }
      }
      const direct = KOE.OBJECTIVE_TARGETS[objective.target];
      if (direct) return direct;
      if (objective.type === "kill" || objective.type === "boss") {
        const enemy = this.game.world.enemies.find((item) => item.type === objective.target || item.id === objective.target);
        if (enemy) return {
          region: this.game.world.region.id,
          x: enemy.x / T,
          y: enemy.y / T,
          radius: enemy.boss ? 8 : 18,
          hint: `Track ${enemy.name}.`
        };
      }
      return {
        region: this.game.world.region.id,
        x: this.game.player.x / T,
        y: this.game.player.y / T,
        radius: 20,
        hint: objective.text
      };
    }

    buildGuidance(quest, tracked, objective, objectiveIndex, target) {
      const world = this.game.world;
      const player = this.game.player;
      const region = target.region || world.region.id;
      let point = { x: (target.x || 0) * T + 16, y: (target.y || 0) * T + 16 };
      let targetRegion = KOE.REGIONS[region] || world.region;
      let sameRegion = region === world.region.id;
      let directionPoint = point;
      let distance = sameRegion ? KOE.dist(player, point) : Infinity;
      let state = STATE.UNKNOWN;

      if (!sameRegion) {
        const exit = this.bestExitToward(region);
        if (exit) {
          directionPoint = { x: (exit.x + exit.w / 2) * T, y: (exit.y + exit.h / 2) * T };
          distance = KOE.dist(player, directionPoint);
        }
      } else if (distance < 270) {
        state = STATE.DISCOVERED;
      } else if (distance < 680) {
        state = STATE.SEARCH;
      }

      const angle = Math.atan2(directionPoint.y - player.y, directionPoint.x - player.x);
      const searchRadius = (target.radius || (objective.type === "talk" ? 7 : 16)) * T;
      return {
        quest,
        questId: quest.id,
        questType: quest.type || "side",
        objective,
        objectiveIndex,
        target,
        region,
        regionName: targetRegion.name,
        sameRegion,
        state,
        label: target.hint || objective.text,
        color: this.questColor(quest),
        point,
        directionPoint,
        angle,
        distance,
        searchRadius
      };
    }

    bestExitToward(targetRegion) {
      const exits = this.game.world.region.exits || [];
      return exits.find((exit) => exit.to === targetRegion)
        || exits.find((exit) => exit.to === "overworld")
        || exits.find((exit) => exit.to === "town")
        || exits[0]
        || null;
    }

    questColor(quest, objective) {
      if ((objective && (objective.type === "kill" || objective.type === "boss")) || quest.type === "bounty") return "#e45b4a";
      if (quest.type === "story") return "#f5b74d";
      return "#75c7ff";
    }

    nearbyLandmarks() {
      const list = KOE.LANDMARKS[this.game.world.region.id] || [];
      const player = this.game.player;
      return list
        .map((landmark) => {
          const x = landmark.x * T + 16;
          const y = landmark.y * T + 16;
          return Object.assign({}, landmark, { px: x, py: y, distance: Math.hypot(player.x - x, player.y - y) });
        })
        .filter((landmark) => landmark.distance < 900 || this.game.world.discoveredLandmarks[landmark.id])
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);
    }

    clearCache() {
      this._cacheKey = "";
      this._cache = null;
    }
  };
}());
