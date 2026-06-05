(function () {
  "use strict";

  const KOE = window.KOE;

  KOE.DialogueEngine = class {
    constructor(game) {
      this.game = game;
      this.box = document.getElementById("dialogueBox");
      this.speakerEl = this.box.querySelector(".speaker");
      this.bodyEl = this.box.querySelector(".body");
      this.choicesEl = this.box.querySelector(".choices");
      this.active = false;
      this.queue = [];
      this.onClose = null;
    }

    say(speaker, text, choices, onClose) {
      this.active = true;
      this.queue = Array.isArray(text) ? text.slice() : [{ speaker, text }];
      this.onClose = onClose || null;
      this.box.classList.remove("hidden");
      this.renderLine(this.queue.shift(), choices);
      this.game.audio.sfx("ui");
    }

    scene(lines, onClose) {
      this.active = true;
      this.queue = lines.slice();
      this.onClose = onClose || null;
      this.box.classList.remove("hidden");
      this.renderLine(this.queue.shift(), null);
    }

    npc(npc) {
      const weather = this.game.weather.current;
      const hour = this.game.clock.hour;
      const relation = this.game.quests.relationships[npc.id] || 0;
      const done = this.game.quests.completed;
      let pool = npc.lines.default;
      if (relation >= 5 && npc.lines.friend) pool = npc.lines.friend;
      else if (done.story_crystal && npc.lines.after_crystal) pool = npc.lines.after_crystal;
      else if (done.story_bandit && npc.lines.after_pass) pool = npc.lines.after_pass;
      else if (weather !== "Clear" && npc.lines.rain) pool = npc.lines.rain;
      else if ((hour < 6 || hour > 20) && npc.lines.night) pool = npc.lines.night;
      const line = KOE.pick(pool);
      const choices = [];
      const quests = this.game.quests.getAvailableForNpc(npc.id);
      for (const quest of quests.slice(0, 4)) {
        choices.push({
          label: `Quest: ${quest.title}`,
          action: () => this.offerQuest(npc, quest)
        });
      }
      if (npc.shop) {
        choices.push({ label: `Shop: ${npc.role}`, action: () => this.game.economy.open(npc.shop, npc.name) });
      }
      choices.push({ label: "Chat", action: () => this.smallTalk(npc) });
      choices.push({ label: "Goodbye", action: () => this.close() });
      this.say(npc.name, `${line} (${npc.action || "in town"})`, choices);
      this.game.quests.increment("talk", npc.id, 1);
      this.game.quests.addRelationship(npc.id, 1);
    }

    offerQuest(npc, quest) {
      const objectives = quest.objectives.map((objective) => `- ${objective.text}`).join("<br>");
      const rewards = this.game.quests.formatRewards(quest);
      this.say(npc.name, `${quest.summary}<br><br>${objectives}<br><br><em>Rewards:</em> ${rewards}`, [
        {
          label: "Accept",
          action: () => {
            this.game.quests.accept(quest.id);
            this.close();
          }
        },
        { label: "Maybe later", action: () => this.npc(npc) }
      ]);
    }

    smallTalk(npc) {
      const relation = this.game.quests.relationships[npc.id] || 0;
      const text = relation > 6
        ? `You have ${relation} heartmarks with ${npc.name}. ${npc.personality}`
        : `${npc.personality} Current trust: ${relation} heartmarks.`;
      this.say(npc.name, text, [{ label: "Back", action: () => this.npc(npc) }]);
    }

    renderLine(line, choices) {
      if (!line) {
        this.close();
        return;
      }
      const speaker = line.speaker || line.name || "Emberfall";
      const text = line.text || line;
      this.speakerEl.textContent = speaker;
      this.bodyEl.innerHTML = text;
      this.renderChoices(choices || [{ label: this.queue.length ? "Continue" : "Close", action: () => this.advance() }]);
    }

    renderChoices(choices) {
      this.choicesEl.innerHTML = "";
      for (const choice of choices) {
        const button = document.createElement("button");
        button.textContent = choice.label;
        button.addEventListener("click", () => choice.action());
        this.choicesEl.appendChild(button);
      }
    }

    advance() {
      if (this.queue.length) {
        this.renderLine(this.queue.shift(), null);
      } else {
        this.close();
      }
    }

    update(input) {
      if (!this.active) return;
      if (input.justPressed("Space") || input.justPressed("Enter")) this.advance();
      if (input.justPressed("Escape")) this.close();
    }

    close() {
      this.active = false;
      this.queue = [];
      this.box.classList.add("hidden");
      if (this.onClose) {
        const callback = this.onClose;
        this.onClose = null;
        callback();
      }
    }
  };
}());
