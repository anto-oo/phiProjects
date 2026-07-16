# Project Planner

Web app di project planning con React + Node/Express + Prisma/SQLite.

## Stack
- Frontend: React (Vite), React Router, Tailwind CSS, Zustand
- Backend: Node.js, Express, Prisma ORM
- Database: SQLite

## Struttura
```
project-planner/
├── client/
├── mcp-server/
├── server/
├── docker-compose.yml
└── README.md
```

## Requisiti
- Node.js 20+
- npm 10+

## Setup locale

### 1) Backend
```bash
cd /home/runner/work/phiProjects/phiProjects/server
npm install
npm run prisma:migrate -- --name init
npm run prisma:generate
npm run dev
```
Server API: `http://localhost:3001`

### 2) Frontend
```bash
cd /home/runner/work/phiProjects/phiProjects/client
npm install
npm run dev
```
Client: `http://localhost:5173`

Il client usa proxy Vite verso il backend per `/api`.

### 3) MCP Server (Claude Connector)
```bash
cd /home/runner/work/phiProjects/phiProjects/mcp-server
npm install
npx prisma generate --schema=../server/prisma/schema.prisma
PORT=3002 DATABASE_URL=file:../data/planner.db npm run start
```
Endpoint MCP Streamable HTTP: `http://localhost:3002/mcp`

## API principali
- `GET/POST /api/projects`
- `GET/PUT/DELETE /api/projects/:id`
- `GET/POST /api/nodes`
- `PUT/DELETE /api/nodes/:id`

I nodi supportano:
- gerarchia ad albero (`parentId`)
- stato/priorità
- date start/end
- dipendenze task (`dependencyIds` in create/update)

## Viste UI
- Feature Tree con espandi/collassa e drag&drop base
- Kanban board con drag&drop tra colonne
- Timeline/Gantt con zoom giorni/settimane/mesi
- Filtri globali (search, status, priority)

## Docker / ZimaOS

### Avvio
```bash
cd /home/runner/work/phiProjects/phiProjects
docker compose up -d --build
```

### Endpoint
- Porta host app: `8420`
- Client (Nginx): `8420 -> 80`
- Server (Express): interno su `3001`
- MCP Server (Express + MCP SDK): interno su `3002`
- DB SQLite persistente: `./data/planner.db`

Il reverse proxy Nginx nel container client inoltra:
- `/api` verso `server:3001`
- `/mcp` verso `mcp-server:3002/mcp`

Per il collegamento remoto con Claude, usa lo stesso tunnel già configurato per l’app e punta il connector a un URL dedicato (es. `https://<tuo-dominio>/mcp` oppure sottodominio dedicato `https://mcp.<tuo-dominio>`).

## Variabili ambiente
### server
- `DATABASE_URL` (default locale: `file:./dev.db`)
- `PORT` (default: `3001`)
