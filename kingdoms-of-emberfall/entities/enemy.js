(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.ENEMY_TYPES = {
    wolf: { name: "Wolf", sprite: "wolf", health: 42, attack: 11, defense: 1, speed: 96, xp: 25, gold: [4, 14], range: 28, loot: [{ id: "wolf_pelt", chance: 0.55 }, { id: "moonleaf", chance: 0.12 }] },
    skeleton: { name: "Skeleton", sprite: "skeleton", health: 60, attack: 14, defense: 3, speed: 62, xp: 40, gold: [8, 22], range: 30, loot: [{ id: "royal_seal", chance: 0.12 }, { id: "lore_book", chance: 0.08 }, { id: "ancient_relic", chance: 0.025 }] },
    bandit: { name: "Bandit", sprite: "bandit", health: 70, attack: 16, defense: 2, speed: 78, xp: 48, gold: [16, 38], range: 32, loot: [{ id: "deserter_letter", chance: 0.18 }, { id: "iron_ore", chance: 0.25 }, { id: "health_potion", chance: 0.08 }] },
    slime: { name: "Slime", sprite: "slime", health: 36, attack: 8, defense: 0, speed: 48, xp: 20, gold: [2, 8], range: 24, loot: [{ id: "slime_gel", chance: 0.75 }, { id: "glowcap", chance: 0.2 }] },
    cultist: { name: "Cultist", sprite: "cultist", health: 76, attack: 18, defense: 2, speed: 66, xp: 62, gold: [18, 44], range: 155, ranged: true, loot: [{ id: "runic_page", chance: 0.22 }, { id: "spirit_ember", chance: 0.16 }, { id: "ancient_relic", chance: 0.04 }] },
    insect: { name: "Giant Insect", sprite: "insect", health: 52, attack: 13, defense: 2, speed: 112, xp: 36, gold: [3, 15], range: 25, loot: [{ id: "silk_thread", chance: 0.55 }, { id: "swamp_pepper", chance: 0.12 }] },
    spirit: { name: "Elemental Spirit", sprite: "spirit", health: 58, attack: 17, defense: 1, speed: 84, xp: 55, gold: [6, 24], range: 145, ranged: true, loot: [{ id: "spirit_ember", chance: 0.45 }, { id: "frost_core", chance: 0.18 }, { id: "crystal_shard", chance: 0.18 }] }
  };

  KOE.Enemy = class extends KOE.Entity {
    constructor(game, type, x, y, level) {
      const def = KOE.ENEMY_TYPES[type];
      const scale = 1 + (level || 0) * 0.16;
      super(game, {
        id: `${type}_${Math.random().toString(36).slice(2)}`,
        name: def.name,
        x,
        y,
        sprite: def.sprite,
        radius: type === "slime" ? 11 : 13,
        health: Math.round(def.health * scale),
        defense: Math.round(def.defense * scale)
      });
      this.type = type;
      this.def = def;
      this.attack = Math.round(def.attack * scale);
      this.speed = def.speed;
      this.xp = Math.round(def.xp * scale);
      this.state = "patrol";
      this.spawn = { x, y };
      this.patrolTarget = this.randomPatrol();
      this.thinkTimer = Math.random();
      this.attackTimer = 0.5 + Math.random();
      this.groupCall = 0;
      this.windup = 0;
    }

    update(dt) {
      const player = this.game.player;
      const dist = KOE.dist(this, player);
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      this.groupCall = Math.max(0, this.groupCall - dt);
      this.thinkTimer -= dt;

      const aggro = 250 * (this.game.clock.phase === "Night" ? 1.24 : 1);
      if (dist < aggro && !player.dead) this.state = "chase";
      const retreatChance = this.game.clock.phase === "Night" ? 0.09 : 0.14;
      if (this.health < this.maxHealth * 0.2 && Math.random() < dt * retreatChance) this.state = "retreat";
      if (dist > 420 && this.state !== "patrol") this.state = "patrol";

      if (this.state === "patrol") this.patrol(dt);
      else if (this.state === "chase") this.chase(dt, player, dist);
      else if (this.state === "retreat") this.retreat(dt, player);

      if (this.windup > 0) {
        this.telegraph = KOE.clamp(this.windup / 0.28, 0.15, 1);
      } else {
        this.telegraph = 0;
      }

      this.applySeparation(dt);
      this.vx *= Math.pow(0.02, dt);
      this.vy *= Math.pow(0.02, dt);
      super.update(dt);
    }

    applySeparation(dt) {
      for (const ally of this.game.world.enemies) {
        if (ally === this || ally.dead) continue;
        const dx = this.x - ally.x;
        const dy = this.y - ally.y;
        const d = Math.hypot(dx, dy);
        if (d < 34 && d > 0.01) {
          const push = (34 - d) / 34;
          this.vx += (dx / d) * push * 140 * dt;
          this.vy += (dy / d) * push * 140 * dt;
        }
      }
    }

    patrol(dt) {
      if (KOE.dist(this, this.patrolTarget) < 18 || this.thinkTimer <= 0) {
        this.thinkTimer = 1.5 + Math.random() * 2;
        this.patrolTarget = this.randomPatrol();
      }
      this.steerTo(this.patrolTarget.x, this.patrolTarget.y, this.speed * 0.45, dt);
    }

    chase(dt, player, dist) {
      if (this.windup > 0) {
        this.windup -= dt;
        if (this.windup <= 0) {
          this.windup = 0;
          if (this.def.ranged) {
            this.game.combat.enemyProjectile(this, this.attack, this.type === "spirit" ? 255 : 205, this.type === "spirit" ? "#6ee7ff" : "#bc5bff");
            this.attackTimer = 1.15 + Math.random() * 0.45;
          } else {
            const dist2 = KOE.dist(this, player);
            if (dist2 < this.def.range + 12 && player.invuln <= 0.02) {
              const dir = this.game.combat.direction(this, player);
              this.game.combat.damage(player, this.attack, dir, "enemy");
            }
            this.attackTimer = 0.78 + Math.random() * 0.32;
          }
        }
        return;
      }

      if (this.def.ranged && dist < this.def.range) {
        this.vx *= 0.84;
        this.vy *= 0.84;
        const lateral = Math.sin(this.thinkTimer * 2.4 + this.spawn.x * 0.01) * 38 * dt;
        this.vx += -Math.sin(Math.atan2(player.y - this.y, player.x - this.x)) * lateral;
        this.vy += Math.cos(Math.atan2(player.y - this.y, player.x - this.x)) * lateral;
        if (this.attackTimer <= 0) {
          this.windup = 0.22;
          this.attackTimer = 2;
          this.game.audio.sfx("enemyWarn");
        }
      } else if (dist < this.def.range) {
        if (this.attackTimer <= 0) {
          this.windup = 0.26;
          this.attackTimer = 2;
        }
      } else {
        const lead = this.predictPlayer();
        this.steerTo(lead.x, lead.y, this.speed, dt);
        if (this.groupCall <= 0 && dist < 180) {
          this.groupCall = 3;
          for (const ally of this.game.world.enemies) {
            if (ally !== this && ally.type === this.type && KOE.dist(this, ally) < 160) ally.state = "chase";
          }
        }
      }
    }

    predictPlayer() {
      const p = this.game.player;
      const look = 0.22;
      return { x: p.x + p.vx * look, y: p.y + p.vy * look };
    }

    retreat(dt, player) {
      const dir = this.game.combat.direction(player, this);
      this.vx += dir.x * this.speed * 4 * dt;
      this.vy += dir.y * this.speed * 4 * dt;
      if (KOE.dist(this, player) > 220) this.state = "patrol";
    }

    steerTo(x, y, speed, dt) {
      const dx = x - this.x;
      const dy = y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this.vx += dx / len * speed * 5 * dt;
      this.vy += dy / len * speed * 5 * dt;
      const current = Math.hypot(this.vx, this.vy);
      if (current > speed) {
        this.vx = this.vx / current * speed;
        this.vy = this.vy / current * speed;
      }
    }

    randomPatrol() {
      return {
        x: this.spawn.x + (Math.random() - 0.5) * 220,
        y: this.spawn.y + (Math.random() - 0.5) * 220
      };
    }

    die(source) {
      if (this.dead) return;
      this.dead = true;
      if (source === "player") {
        this.game.player.gainXp(this.xp);
        this.game.quests.onKill(this.type);
      }
      const gold = this.def.gold[0] + Math.floor(Math.random() * (this.def.gold[1] - this.def.gold[0] + 1));
      this.game.inventory.add("gold", gold);
      const drops = [];
      for (const loot of this.def.loot) {
        if (Math.random() < loot.chance) {
          this.game.inventory.add(loot.id, 1);
          drops.push(KOE.ITEMS[loot.id].name);
        }
      }
      this.game.combat.burst(this.x, this.y, "#f5b74d", 16);
      if (drops.length) this.game.toast(`${this.name} dropped ${drops.join(", ")} and ${gold}g.`);
      else this.game.toast(`${this.name} defeated. +${gold}g`);
    }
  };
}());
