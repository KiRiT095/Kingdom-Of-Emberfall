(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.BOSS_TYPES = {
    hollow_captain: { name: "The Hollow Knight Captain", sprite: "boss", health: 340, attack: 24, defense: 5, xp: 420, gold: 260, reward: "ancient_relic", music: "boss", lines: ["The pass belongs to the dead who still march."] },
    swamp_maw: { name: "Swamp Maw", sprite: "slime", health: 420, attack: 27, defense: 4, xp: 620, gold: 340, reward: "mire_lantern", music: "boss", lines: ["The black water opens one enormous eye."] },
    crystal_wyrm: { name: "Crystal Wyrm", sprite: "spirit", health: 390, attack: 29, defense: 4, xp: 560, gold: 320, reward: "ward_crystal", music: "boss", lines: ["A song of glass coils around the cavern."] },
    forgotten_king: { name: "The Forgotten King", sprite: "skeleton", health: 520, attack: 34, defense: 8, xp: 820, gold: 460, reward: "oathbound_crown", music: "boss", lines: ["Kneel, little ember. I remember crowns."] },
    frost_titan: { name: "Frost Titan", sprite: "boss", health: 620, attack: 38, defense: 9, xp: 980, gold: 540, reward: "beacon_flame", music: "boss", lines: ["The mountain stands up."] },
    ember_dragon: { name: "Ember Dragon", sprite: "boss", health: 900, attack: 46, defense: 10, xp: 1800, gold: 900, reward: "ember_crown", music: "boss", lines: ["The crown chamber burns without flame."] },
    depth_warden: { name: "The Depth Warden", sprite: "boss", health: 520, attack: 30, defense: 7, xp: 780, gold: 480, reward: "warden_sigil", music: "boss", lines: ["I am the hinge of every blind corridor. Turn back—or learn the cost of curiosity."] }
  };

  KOE.Boss = class extends KOE.Entity {
    constructor(game, type, x, y) {
      const def = KOE.BOSS_TYPES[type];
      super(game, {
        id: type,
        name: def.name,
        x,
        y,
        sprite: def.sprite,
        radius: 25,
        health: def.health,
        defense: def.defense
      });
      this.type = type;
      this.def = def;
      this.attack = def.attack;
      this.xp = def.xp;
      this.boss = true;
      this.phase = 1;
      this.attackTimer = 1.2;
      this.dashTimer = 0;
      this.introShown = false;
      this.lastPhase = 1;
      this.meleeTelegraph = 0;
    }

    update(dt) {
      const player = this.game.player;
      const dist = KOE.dist(this, player);
      if (!this.introShown && dist < 320) {
        this.introShown = true;
        this.game.toast(this.def.lines[0]);
        this.game.camera.shake = 0.4;
        this.game.combat.combatTimer = 10;
      }
      if (dist > 560 && !this.introShown) return;
      const hpPct = this.health / this.maxHealth;
      this.phase = hpPct < 0.33 ? 3 : hpPct < 0.66 ? 2 : 1;
      if (this.phase > this.lastPhase) {
        this.game.toast(`${this.name} — Phase ${this.phase}`);
        this.game.camera.shake = 0.42;
        this.game.audio.sfx("enemyWarn");
      }
      this.lastPhase = this.phase;

      if (this.meleeTelegraph > 0) {
        this.meleeTelegraph -= dt;
        this.telegraph = KOE.clamp(this.meleeTelegraph / 0.36, 0.12, 1);
        if (this.meleeTelegraph <= 0) {
          this.meleeTelegraph = 0;
          this.telegraph = 0;
          const d2 = KOE.dist(this, player);
          if (d2 < 98 && player.invuln <= 0.02) {
            const dir = this.game.combat.direction(this, player);
            this.game.combat.damage(player, this.attack + this.phase * 6, dir, "enemy");
          }
        }
      } else {
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
          this.attackTimer = Math.max(0.55, 1.5 - this.phase * 0.25);
          this.usePattern(player, dist);
        }
      }

      if (this.dashTimer > 0) this.dashTimer -= dt;
      else {
        const speed = 48 + this.phase * 18;
        const dir = this.game.combat.direction(this, player);
        this.vx += dir.x * speed * 2.5 * dt;
        this.vy += dir.y * speed * 2.5 * dt;
      }

      this.vx *= Math.pow(0.014, dt);
      this.vy *= Math.pow(0.014, dt);
      super.update(dt);
    }

    usePattern(player, dist) {
      if (this.type === "swamp_maw") {
        this.spawnMinions("slime", this.phase + 1);
        this.radialProjectiles(6 + this.phase * 2, "#80ff9e", 190 + this.phase * 35);
      } else if (this.type === "crystal_wyrm") {
        this.radialProjectiles(8 + this.phase * 3, "#90e9ff", 240);
      } else if (this.type === "forgotten_king") {
        this.spawnMinions("skeleton", this.phase);
        this.cleave(player, dist);
      } else if (this.type === "frost_titan") {
        this.radialProjectiles(7 + this.phase * 2, "#d7f7ff", 170);
        this.dash(player);
      } else if (this.type === "ember_dragon") {
        this.radialProjectiles(12 + this.phase * 4, "#ff8848", 260);
        this.spawnMinions(this.phase === 3 ? "cultist" : "spirit", this.phase);
        if (dist < 90) this.cleave(player, dist);
      } else if (this.type === "depth_warden") {
        if (this.phase === 1) {
          this.radialProjectiles(8, "#d8b878", 195);
          if (dist < 92) this.cleave(player, dist);
        } else if (this.phase === 2) {
          this.radialProjectiles(11, "#ff9a5c", 225);
          this.spawnMinions("skeleton", 3);
          if (dist > 120) this.dash(player);
          else this.cleave(player, dist);
        } else {
          this.radialProjectiles(7, "#ffd7a0", 210);
          this.radialProjectiles(12, "#ff6b3d", 248);
          this.spawnMinions("cultist", 2);
          this.cleave(player, dist);
        }
      } else {
        this.cleave(player, dist);
        if (this.phase >= 2) this.spawnMinions("bandit", this.phase);
      }
    }

    cleave(player, dist) {
      if (dist < 86) {
        if (this.meleeTelegraph <= 0) {
          this.meleeTelegraph = 0.36;
          this.game.audio.sfx("enemyWarn");
        }
      } else {
        this.dash(player);
      }
    }

    dash(player) {
      const dir = this.game.combat.direction(this, player);
      this.vx = dir.x * (300 + this.phase * 55);
      this.vy = dir.y * (300 + this.phase * 55);
      this.dashTimer = 0.28;
      this.game.combat.burst(this.x, this.y, "#ffcf70", 10);
    }

    radialProjectiles(count, color, speed) {
      for (let i = 0; i < count; i += 1) {
        const angle = i / count * Math.PI * 2 + Math.random() * 0.08;
        this.game.combat.projectiles.push({
          owner: "enemy",
          kind: "spell",
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage: Math.round(this.attack * 0.65),
          life: 2.2,
          color
        });
      }
    }

    spawnMinions(type, count) {
      const maxMinions = this.game.world.enemies.filter((enemy) => enemy.type === type && !enemy.boss && KOE.dist(enemy, this) < 420).length;
      if (maxMinions > 7) return;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const x = this.x + Math.cos(angle) * (70 + Math.random() * 60);
        const y = this.y + Math.sin(angle) * (70 + Math.random() * 60);
        if (!this.game.world.collidesCircle(x, y, 12)) this.game.world.enemies.push(new KOE.Enemy(this.game, type, x, y, this.game.world.region.danger));
      }
    }

    die(source) {
      if (this.dead) return;
      this.dead = true;
      if (source === "player") {
        this.game.player.gainXp(this.xp);
        this.game.quests.onBoss(this.type);
      }
      this.game.inventory.add("gold", this.def.gold);
      this.game.inventory.add(this.def.reward, 1);
      if (this.type === "depth_warden") {
        this.game.inventory.add("ancient_relic", 2);
        this.game.inventory.add("focus_tea", 2);
        this.game.inventory.add("ember_scale", 4);
      } else if (this.type !== "ember_dragon") this.game.inventory.add("ancient_relic", 1);
      else this.game.inventory.add("ember_scale", 6);
      this.game.combat.burst(this.x, this.y, "#ffcf70", 40);
      this.game.camera.shake = 0.8;
      this.game.toast(this.type === "depth_warden" ? `${this.name} falls. The maze exhales.` : `${this.name} defeated. Rare reward claimed.`);
      this.game.save.save();
    }
  };
}());
