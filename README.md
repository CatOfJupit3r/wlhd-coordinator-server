# Walenholde Combat System — Game Coordinator


This repository contains coordinator for WLHD ecosystem. This server is responsible for managing games, players, and game sessions.

Built using ExpressJS and MongoDB.


## Description

This is a passion project, created to provide a platform for playing Walenholde Combat System. 

WLHD is a tabletop RPG system, created by me, that is still in active development. For more detailed information, check [Learn More](#Learn-More).

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed [Node.js and npm](https://nodejs.org/en/download/) (built using NodeJS v21.6.1).
- You have installed [MongoDB](https://www.mongodb.com/try/download/community).
- You have a `<Windows/Linux/Mac>` machine.

## Installation

1. Clone this repository:
```bash
git clone https://github.com/CatOfJupit3r/wlc-coordinator-server.git
```
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file in the root directory of the project and populate it with the variables from `.env.example`.

## Environment Variables


- PORT — Port on which the server will run _(default: 5000)_
- HOST — Host on which the server will run _(default: localhost)_
- GAME_SERVER_URL — FULL URL to the GAME server ~~(not this repository)~~
- GAME_SECRET_TOKEN — Secret token to access the GAME server. **DO NOT SHARE THIS!**
- JWT_SECRET — Secret token for JWT. **DO NOT SHARE THIS!**
- JWT_REFRESH — Secret token for JWT refresh. **DO NOT SHARE THIS TOO!**
- GITHUB_TOKEN — GitHub token for cloning and pulling DLCs. Use this if you want automatic installation of DLCs.


## Usage

### Local

Open a terminal inside the project directory run according to your package manager:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

### Docker

This repository supports Docker. To build the image, run:

```bash
docker build -t wlhd-game-coordinator .
```

Then, to run the container:

```bash
docker run -p 4000:4000 -d wlhd-game-coordinator
```


## Learn More

To learn more about Walenholde Combat System... Well, you can't, as it's still a WIP. But in future you will be able to find more information about it on GitHub Wiki page, including:

- Creating your own lobbies, characters and hosting them.
- Mechanics of the game, including combat, spells, and other features.


## Related

- [React Frontend](https://github.com/CatOfJupit3r/wlhd-frontend-web) — Frontend for the game coordinator, built using React, Redux and GraphQL. (You are here!)
- [Game Coordinator](https://github.com/CatOfJupit3r/wlhd-coordinator-server) — Backend for the game coordinator, built using ExpressJS and MongoDB.
- [Game Engine](https://youtu.be/h81WXIfCnoE?si=LS7HpLYhI-LBg4-9) — Core game engine, built using Python, Python and Python. (also, FastAPI).
- [Discord Bot Interface](https://github.com/CatOfJupit3r/wlhd-frontend-discord) — Frontend for the game coordinator, built using Discord API. (Deprecated)
- [Game Guide] — Contains all the necessary information about the game and its various mechanics in a traditional TTRPG format. (WIP)
- [Game Wiki] — Contains all the necessary information about the game and its various mechanics in easily navigable way. (WIP)
