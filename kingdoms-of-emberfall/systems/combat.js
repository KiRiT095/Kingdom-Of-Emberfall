(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.CombatManager = class {
    constructor(game) {
      this.game = game;
      this.projectiles = [];
      this.particles = [];
      this.hitStop = 0;
      this.combatTimer = 0;
      this.trails = [];
      this.auras = [];
    }

    update(dt) {
      if (this.hitStop > 0) {
        this.hitStop -= dt;
        return;
      }
      this.combatTimer = Math.max(0, this.combatTimer - dt);
      for (const projectile of this.projectiles) {
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
        projectile.life -= dt;
        if (projectile.owner === "player") {
          for (const enemy of this.game.world.enemies) {
            if (enemy.dead || enemy.invuln > 0) continue;
            if (Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < enemy.radius + 7) {
              this.damage(enemy, projectile.damage, { x: projectile.vx, y: projectile.vy }, "player");
              const pierce = projectile.pierce | 0;
              if (pierce > 0) {
                projectile.pierce = pierce - 1;
              } else {
                projectile.life = 0;
              }
              break;
            }
          }
        } else {
          const player = this.game.player;
          if (Math.hypot(player.x - projectile.x, player.y - projectile.y) < player.radius + 7) {
            this.damage(player, projectile.damage, { x: projectile.vx, y: projectile.vy }, "enemy");
            projectile.life = 0;
          }
        }
      }
      this.projectiles = this.projectiles.filter((projectile) => projectile.life > 0);

      for (const trail of this.trails) {
        trail.life -= dt;
      }
      this.trails = this.trails.filter((trail) => trail.life > 0);

      for (const particle of this.particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;
        particle.size *= 0.96;
      }
      this.particles = this.particles.filter((particle) => particle.life > 0);

      for (const aura of this.auras) {
        aura.life -= dt;
        aura.pulse += dt * aura.speed;
      }
      this.auras = this.auras.filter((aura) => aura.life > 0);
    }

    playerSword() {
      const player = this.game.player;
      const weaponId = this.game.inventory.equipment.weapon;
      const weapon = KOE.ITEMS[weaponId] || {};
      const cls = weapon.weaponClass || "sword";
      const profiles = {
        sword: { stamina: 11, cooldown: 0.2, rangeBonus: 0, dmgMul: 1, hitStop: 0.034, arc: "#ffcf70", burst: 14 },
        axe: { stamina: 14, cooldown: 0.28, rangeBonus: -2, dmgMul: 1.2, hitStop: 0.045, arc: "#ff9e5b", burst: 18 },
        spear: { stamina: 10, cooldown: 0.22, rangeBonus: 12, dmgMul: 0.92, hitStop: 0.03, arc: "#f2e6c8", burst: 12 }
      };
      const profile = profiles[cls] || profiles.sword;
      if (player.attackCooldown > 0 || player.stamina < profile.stamina) return;
      player.stamina -= profile.stamina;
      player.attackCooldown = profile.cooldown;
      player.combo = (player.combo + 1) % 3;
      const range = 42 + player.combo * 6 + profile.rangeBonus;
      const damage = Math.round((player.attack + this.game.inventory.statBonus("attack") + player.combo * 4) * profile.dmgMul);
      this.game.audio.sfx("sword");
      this.combatTimer = 5;
      let hit = false;
      for (const enemy of this.game.world.enemies) {
        if (enemy.dead) continue;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > range + enemy.radius) continue;
        const dirDot = (dx / (dist || 1)) * player.facing.x + (dy / (dist || 1)) * player.facing.y;
        if (dirDot > 0.2 || dist < 24) {
          this.damage(enemy, damage, player.facing, "player");
          hit = true;
        }
      }
      if (hit) {
        this.hitStop = Math.max(this.hitStop, profile.hitStop);
        player.stamina = Math.min(player.maxStamina, player.stamina + 6);
        this.game.camera.shake = Math.max(this.game.camera.shake, 0.1);
      }
      this.trails.push({
        kind: "slash",
        x: player.x + player.facing.x * 18,
        y: player.y + player.facing.y * 18,
        vx: player.facing.x,
        vy: player.facing.y,
        life: 0.14,
        color: profile.arc
      });
      this.slashParticles(player.x + player.facing.x * 25, player.y + player.facing.y * 25, player.combo);
      this.burst(player.x + player.facing.x * 20, player.y + player.facing.y * 20, profile.arc, profile.burst);
    }

    playerBow() {
      const player = this.game.player;
      if (player.rangedCooldown > 0 || player.stamina < 16) return;
      player.stamina -= 16;
      player.rangedCooldown = 0.5;
      const dir = player.lockedTarget && !player.lockedTarget.dead
        ? this.direction(player, player.lockedTarget)
        : player.facing;
      const damage = 10 + this.game.inventory.statBonus("ranged") + Math.floor(player.level * 1.4);
      this.projectiles.push({ owner: "player", kind: "arrow", x: player.x + dir.x * 18, y: player.y + dir.y * 18, vx: dir.x * 520, vy: dir.y * 520, damage, life: 1.1, color: "#d4b06a", trail: "#f4deb2" });
      this.game.audio.sfx("bow");
      this.combatTimer = 4;
    }

    playerMagic() {
      const player = this.game.player;
      if (player.magicCooldown > 0 || player.mana < 17) return;
      player.mana -= 17;
      player.magicCooldown = 0.66;
      const dir = player.lockedTarget && !player.lockedTarget.dead
        ? this.direction(player, player.lockedTarget)
        : player.facing;
      const damage = 16 + this.game.inventory.statBonus("magic") + Math.floor(player.level * 2);
      this.projectiles.push({ owner: "player", kind: "spell", x: player.x + dir.x * 22, y: player.y + dir.y * 22, vx: dir.x * 400, vy: dir.y * 400, damage, life: 1.5, color: "#7be6ff", pierce: 1, trail: "#9de7ff" });
      this.auras.push({ x: player.x + dir.x * 8, y: player.y + dir.y * 8, life: 0.26, pulse: 0, speed: 14, color: "#8be8ff", r: 28 });
      this.game.audio.sfx("magic");
      this.combatTimer = 5;
    }

    playerWard() {
      const player = this.game.player;
      if (player.supportCooldown > 0 || player.mana < 24) return;
      player.mana -= 24;
      player.supportCooldown = 9;
      player.wardTimer = 6.5;
      player.regenTimer = 4;
      this.auras.push({ x: player.x, y: player.y, life: 0.55, pulse: 0, speed: 10, color: "#9dd6ff", r: 56 });
      this.burst(player.x, player.y, "#a8ddff", 20);
      this.game.audio.sfx("ward");
      this.game.toast("Spirit Ward: damage softened and stamina recovering.");
    }

    enemyProjectile(enemy, damage, speed, color) {
      const dir = this.direction(enemy, this.game.player);
      this.projectiles.push({ owner: "enemy", kind: "spell", x: enemy.x, y: enemy.y, vx: dir.x * speed, vy: dir.y * speed, damage, life: 2, color: color || "#b950ff" });
    }

    direction(from, to) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      return { x: dx / length, y: dy / length };
    }

    damage(target, amount, dir, source) {
      if (target.invuln > 0 || target.dead) return false;
      const defense = target.defense || 0;
      const isPlayer = target === this.game.player;
      const defenseScale = isPlayer ? 0.52 : 0.62;
      const final = Math.max(1, Math.round(amount - defense * defenseScale));
      target.health -= final;
      target.invuln = isPlayer ? 0.72 : 0.2;
      target.flash = isPlayer ? 0.22 : 0.2;
      const knock = isPlayer ? 95 : 125;
      target.vx += (dir.x || 0) * knock;
      target.vy += (dir.y || 0) * knock;
      if (isPlayer) {
        this.game.camera.shake = Math.max(this.game.camera.shake, target.boss ? 0.42 : 0.22);
        this.game.camera.flash = Math.max(this.game.camera.flash, 0.38);
        this.hitStop = Math.max(this.hitStop, 0.045);
        this.game.audio.sfx("hurt");
      } else {
        this.game.camera.shake = Math.max(this.game.camera.shake, target.boss ? 0.35 : 0.14);
        this.game.audio.sfx("hit");
      }
      this.burst(target.x, target.y, target.boss ? "#ffb25a" : "#f7e2bd", isPlayer ? 7 : 10);
      if (target.health <= 0) {
        target.die(source);
      }
      return true;
    }

    burst(x, y, color, count) {
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 120;
        this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.3 + Math.random() * 0.35, size: 3 + Math.random() * 4, color });
      }
    }

    slashParticles(x, y, combo) {
      const colors = ["#f7e2bd", "#ffcf70", "#ff8a4a"];
      for (let i = 0; i < 14; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 45 + Math.random() * 130;
        this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.12 + Math.random() * 0.12, size: 2 + combo * 1.2, color: colors[combo] });
      }
    }

    draw(ctx) {
      for (const projectile of this.projectiles) {
        ctx.save();
        ctx.fillStyle = projectile.color;
        if (projectile.kind === "arrow") {
          ctx.translate(projectile.x, projectile.y);
          ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
          ctx.fillRect(-8, -2, 16, 4);
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = projectile.trail || "#fff";
          ctx.fillRect(-14, -1, 10, 2);
        } else {
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      for (const trail of this.trails) {
        ctx.save();
        const alpha = trail.life / 0.14;
        ctx.translate(trail.x, trail.y);
        ctx.rotate(Math.atan2(trail.vy, trail.vx));
        ctx.globalAlpha = alpha * 0.45;
        ctx.fillStyle = trail.color;
        ctx.beginPath();
        ctx.ellipse(10, 0, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const aura of this.auras) {
        ctx.save();
        const pulse = 1 + Math.sin(aura.pulse) * 0.18;
        ctx.globalAlpha = Math.max(0, aura.life * 1.6);
        ctx.fillStyle = aura.color;
        ctx.beginPath();
        ctx.arc(aura.x, aura.y, aura.r * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha *= 0.45;
        ctx.beginPath();
        ctx.arc(aura.x, aura.y, aura.r * (0.6 + pulse * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const particle of this.particles) {
        ctx.globalAlpha = Math.max(0, particle.life * 2);
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
      }
      ctx.globalAlpha = 1;
    }

    serialize() {
      return {};
    }
  };
}());
