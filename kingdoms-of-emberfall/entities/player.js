(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.Player = class extends KOE.Entity {
    constructor(game) {
      super(game, { id: "player", name: "Wanderer", x: 40 * KOE.TILE, y: 36 * KOE.TILE, sprite: "hero", radius: 12, health: 100, defense: 1 });
      this.level = 1;
      this.xp = 0;
      this.skillPoints = 0;
      this.skills = { blade: 0, ward: 0, ranger: 0, hearth: 0 };
      this.baseAttack = 8;
      this.baseMagic = 8;
      this.baseDefense = 1;
      this.maxMana = 70;
      this.mana = this.maxMana;
      this.maxStamina = 100;
      this.stamina = this.maxStamina;
      this.attackCooldown = 0;
      this.rangedCooldown = 0;
      this.magicCooldown = 0;
      this.supportCooldown = 0;
      this.dodgeCooldown = 0;
      this.dodgeTimer = 0;
      this.wardTimer = 0;
      this.regenTimer = 0;
      this.combo = 0;
      this.lockedTarget = null;
      this.region = "town";
    }

    get maxHealth() {
      return 100 + (this.level - 1) * 12 + this.game.inventory.statBonus("maxHealth") + this.skills.ward * 12;
    }

    set maxHealth(_) {}

    get attack() {
      return this.baseAttack + Math.floor(this.level * 1.6) + this.skills.blade * 3;
    }

    get magic() {
      return this.baseMagic + Math.floor(this.level * 1.4) + this.skills.hearth * 2;
    }

    get defense() {
      return this.baseDefense + Math.floor(this.level * 0.4) + this.game.inventory.statBonus("defense") + this.skills.ward * 2;
    }

    set defense(_) {}

    update(dt) {
      const input = this.game.input;
      const axis = input.axis();
      const sprinting = input.down("Shift") && this.stamina > 2 && (axis.x || axis.y);
      const accel = sprinting ? 1180 : 860;
      const maxSpeed = sprinting ? 208 + this.skills.ranger * 8 : 148 + this.skills.ranger * 5;
      if (sprinting) this.stamina = Math.max(0, this.stamina - dt * 22);
      else this.stamina = Math.min(this.maxStamina, this.stamina + dt * (18 + this.skills.hearth * 2));
      this.mana = Math.min(this.maxMana, this.mana + dt * (3 + this.skills.hearth));

      if (this.dodgeTimer <= 0) {
        this.vx += axis.x * accel * dt;
        this.vy += axis.y * accel * dt;
      }

      const speed = Math.hypot(this.vx, this.vy);
      if (speed > maxSpeed && this.dodgeTimer <= 0) {
        this.vx = this.vx / speed * maxSpeed;
        this.vy = this.vy / speed * maxSpeed;
      }
      const friction = this.dodgeTimer > 0 ? 0.985 : Math.pow(0.0008, dt);
      this.vx *= friction;
      this.vy *= friction;

      if (axis.x || axis.y) this.facing = { x: axis.x, y: axis.y };
      this.flip = this.facing.x < -0.05;

      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
      this.rangedCooldown = Math.max(0, this.rangedCooldown - dt);
      this.magicCooldown = Math.max(0, this.magicCooldown - dt);
      this.supportCooldown = Math.max(0, this.supportCooldown - dt);
      this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
      this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
      this.wardTimer = Math.max(0, this.wardTimer - dt);
      this.regenTimer = Math.max(0, this.regenTimer - dt);
      if (this.wardTimer > 0) this.invuln = Math.max(this.invuln, 0.08);
      if (this.regenTimer > 0) {
        this.health = Math.min(this.maxHealth, this.health + dt * 2.8);
        this.stamina = Math.min(this.maxStamina, this.stamina + dt * 5.5);
      }
      if (this.dodgeTimer > 0) this.invuln = Math.max(this.invuln, 0.12);

      if (!this.game.dialogue.active && !this.game.ui.menuOpen) {
        if (input.justPressed("j") || input.mouse.clicked) this.game.combat.playerSword();
        if (input.justPressed("k")) this.game.combat.playerBow();
        if (input.justPressed("l")) this.game.combat.playerMagic();
        if (input.justPressed("u")) this.game.combat.playerWard();
        if (input.justPressed("q")) this.dodge();
        if (input.justPressed("f")) this.lockOn();
        if (input.justPressed("Space") || input.justPressed("e")) this.game.world.interact();
        if (input.justPressed("1")) this.game.inventory.use("health_potion");
        if (input.justPressed("2")) this.game.inventory.use("mana_tonic");
        if (input.justPressed("3")) this.game.inventory.use("stamina_tonic");
      }

      super.update(dt);
      this.health = Math.min(this.health, this.maxHealth);
      this.maxMana = 70 + this.game.inventory.statBonus("maxMana") + this.skills.hearth * 10;
      this.maxStamina = 100 + this.skills.ranger * 12;
      if (this.lockedTarget && (this.lockedTarget.dead || KOE.dist(this, this.lockedTarget) > 360)) this.lockedTarget = null;
    }

    dodge() {
      if (this.dodgeCooldown > 0 || this.stamina < 19) return;
      this.stamina -= 19;
      this.dodgeCooldown = 0.48;
      this.dodgeTimer = 0.17;
      this.invuln = 0.35;
      const axis = this.game.input.axis();
      const dir = Math.hypot(axis.x, axis.y) > 0.1 ? axis : this.facing;
      this.vx = dir.x * 540;
      this.vy = dir.y * 540;
      this.game.combat.burst(this.x, this.y, "#d4f1ff", 8);
      this.game.audio.sfx("dodge");
      this.game.camera.shake = Math.max(this.game.camera.shake, 0.08);
    }

    lockOn() {
      const enemies = this.game.world.enemies
        .filter((enemy) => !enemy.dead && KOE.dist(this, enemy) < 340)
        .sort((a, b) => KOE.dist(this, a) - KOE.dist(this, b));
      if (!enemies.length) {
        this.lockedTarget = null;
        this.game.toast("No target nearby.");
        return;
      }
      const currentIndex = enemies.indexOf(this.lockedTarget);
      this.lockedTarget = enemies[(currentIndex + 1) % enemies.length];
      this.game.toast(`Locked on: ${this.lockedTarget.name}`);
    }

    gainXp(amount) {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) {
        if (!Number.isFinite(n)) console.warn("[Player] gainXp received non-finite amount:", amount);
        return;
      }

      // Keep gainXp bounded to avoid rare freezes from malformed reward values.
      const xpCapPerGrant = 5000;
      const safeGain = Math.max(0, Math.min(xpCapPerGrant, n));

      this.xp = Number.isFinite(this.xp) ? this.xp : 0;
      this.xp += safeGain;

      let needed = this.xpToNext();
      let levelUps = 0;
      const maxLevelUps = 25;

      while (this.xp >= needed && levelUps < maxLevelUps) {
        if (!Number.isFinite(needed) || needed <= 0) break;
        this.xp -= needed;
        this.level += 1;
        this.skillPoints += 1;
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.stamina = this.maxStamina;
        this.game.toast(`Level ${this.level}! Skill point gained.`);
        this.game.audio.sfx("quest");
        levelUps += 1;
        needed = this.xpToNext();
      }

      if (levelUps >= maxLevelUps) {
        console.warn("[Player] gainXp capped level-up iterations to prevent freeze. Remaining XP:", this.xp);
      }
    }

    xpToNext() {
      return 120 + this.level * this.level * 55;
    }

    learn(skill) {
      if (this.skillPoints <= 0) return false;
      if (!Object.prototype.hasOwnProperty.call(this.skills, skill)) return false;
      if (this.skills[skill] >= 5) return false;
      this.skills[skill] += 1;
      this.skillPoints -= 1;
      this.game.toast(`Learned ${skill} rank ${this.skills[skill]}`);
      return true;
    }

    draw(ctx) {
      const speed = Math.hypot(this.vx, this.vy);
      const lean = KOE.clamp(this.vx / 220, -0.12, 0.12);
      const breathe = Math.sin(this.frame * 0.35) * 0.02;
      const sprintStretch = speed > 180 ? 0.07 : 0;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(lean);
      ctx.scale(1 + breathe - sprintStretch * 0.4, 1 - breathe + sprintStretch);
      ctx.translate(-this.x, -this.y);
      super.draw(ctx);
      ctx.restore();
      if (this.lockedTarget && !this.lockedTarget.dead) {
        ctx.strokeStyle = "#f5b74d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.lockedTarget.x, this.lockedTarget.y - 15, this.lockedTarget.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (this.dodgeTimer > 0) {
        ctx.strokeStyle = "rgba(190, 235, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(this.x, this.y - 14, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (this.wardTimer > 0) {
        ctx.strokeStyle = "rgba(170, 220, 255, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 13, 20 + Math.sin(this.frame * 0.6) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    die() {
      this.health = Math.ceil(this.maxHealth * 0.5);
      this.mana = Math.ceil(this.maxMana * 0.4);
      this.stamina = this.maxStamina;
      this.game.world.changeRegion("town", { x: 28, y: 39 });
      this.game.inventory.gold = Math.max(0, Math.floor(this.game.inventory.gold * 0.85));
      this.game.toast("You wake at the inn, bruised and lighter on gold.");
      this.game.save.save({ quiet: true });
    }

    serialize() {
      return {
        x: this.x,
        y: this.y,
        region: this.region,
        health: this.health,
        mana: this.mana,
        stamina: this.stamina,
        supportCooldown: this.supportCooldown,
        wardTimer: this.wardTimer,
        regenTimer: this.regenTimer,
        level: this.level,
        xp: this.xp,
        skillPoints: this.skillPoints,
        skills: this.skills
      };
    }

    restore(data) {
      if (!data) return;
      this.x = data.x || this.x;
      this.y = data.y || this.y;
      this.region = data.region || "town";
      this.level = data.level || 1;
      this.xp = data.xp || 0;
      this.skillPoints = data.skillPoints || 0;
      this.skills = Object.assign({ blade: 0, ward: 0, ranger: 0, hearth: 0 }, data.skills || {});
      this.health = data.health || this.maxHealth;
      this.mana = data.mana || this.maxMana;
      this.stamina = data.stamina || this.maxStamina;
      this.supportCooldown = data.supportCooldown || 0;
      this.wardTimer = data.wardTimer || 0;
      this.regenTimer = data.regenTimer || 0;
    }
  };
}());
