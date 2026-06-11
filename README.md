Kingdoms of Emberfall

A fully playable top-down browser RPG built with HTML5, CSS, vanilla JavaScript, Canvas API, and WebAudio API.

Play

Open index.html in Chrome, or run a tiny local server:

npm start

Then visit:

http://localhost:8000

## Screenshots

### Open World Exploration

![Open World](Screenshots/Open%20world.png)

### Town Area

![Town](Screenshots/Town.png)

### Dialogue System

![Dialogue System](Screenshots/Dialogues.png)

### Inventory System

![Inventory](Screenshots/Inventory.png)

Controls




WASD move



Shift sprint



Q dodge



J sword attack



K bow



L magic



Space interact



Tab journal, inventory, atlas, skills, and house menu



F lock-on



Z minimap zoom

Features





Living town with NPCs, schedules, shops, and dialogue



Quest journal, tracked quest HUD, and objective compass



Exploration across multiple regions



Action combat with sword, bow, magic, dodge, stamina, and bosses



Inventory, gear, economy, crafting, loot, and progression



Player house, storage, upgrades, and save/sleep loop



Day/night cycle, weather, minimap, fog memory, and fast travel



Local save/load using localStorage

Technical Notes

This project intentionally uses no heavy external engine. Rendering is handled through the Canvas API, audio through WebAudio, and all systems are plain JavaScript modules loaded directly by the browser.

The game is fully offline after loading and is designed to run smoothly in Chrome.
