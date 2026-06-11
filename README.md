# Datadog Quest

> 🇬🇧 English (this page) | 🇯🇵 [日本語](./README.ja.md)

A NES-style retro RPG that quizzes you on Datadog skills (APM/RUM, Infrastructure, Security, Agent Observability, CI/CD, SLO, Integration). Runs in your browser on Node.js + Express. UI and questions support **both Japanese and English** with an in-game toggle.

![mode](https://img.shields.io/badge/style-NES%20retro-yellow)
![lang](https://img.shields.io/badge/lang-JP%2FEN-blue)
![node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen)

## 🎮 Story

The Datadog Kingdom was protected by a small fairy called **Bits**, who lit the realm with the light of metrics and traces. One day an impostor calling itself **DARK BITS** seized the king's castle, imprisoned the true Bits deep inside, and plunged the kingdom into darkness.

You — a hero summoned to restore observability — must travel the kingdom, defeat 12 trials, beat DARK BITS in a 5-question boss battle, and **rescue the captive Bits**.

### Question Categories

| Category | Description |
| -- | -- |
| APM & RUM | Distributed tracing, Spans, RUM Core Web Vitals, etc. |
| Infrastructure | Agent, Kubernetes, Autodiscovery, Cluster Agent, etc. |
| Security | Cloud SIEM, ASM, CSM, CWS, SDS, etc. |
| Agent Observability | LLM Observability, Quality Evaluations, RAG instrumentation, etc. |
| CI/CD | CI Visibility, Test Optimization, ITR, Deployment Tracking, etc. |
| SLO | SLI/SLO/Error Budget, Burn Rate, Multi-window, etc. |
| Integration & Instrumentation | OTel, AWS, Lambda, Admission Controller, SSI, etc. |

### Enemies (level shown by color)

- Slime / Mage / Skeleton / Bat / Bee / Dragon
- Boss: 🐕 **DARK BITS** (the impostor that calls itself Bits)

### Features

- Tile-based movement (arrow keys / WASD)
- 12 enemies placed randomly on the map each new game
- Choice order is shuffled so the correct answer is never always at position 1
- Player name entry → typewriter-style intro → adventure begins
- HUD shows name, mistakes/accuracy, play time, defeats
- Saves to both `localStorage` and server-side JSON (same player ID resumes)
- Score = `(accuracy × 10000) − elapsed seconds`
- Rankings (top 20) available from the title screen and end-of-game
- **Bilingual UI and questions** with an in-game language toggle (JP / EN)
- Wrong answers don't end the game — keep playing and your score absorbs the penalty

## 🚀 Run Locally

### Requirements

- Node.js 18 or later
- npm

### Steps

```bash
npm install
npm start
```

Open `http://localhost:3000` in your browser.

To change the port:

```bash
PORT=8080 npm start
```

## 🎯 Controls

| Input | Action |
| -- | -- |
| ↑↓←→ / WASD | Move the hero |
| Click | Pick an answer / press a button |
| Enter | Confirm name dialog |
| JP / EN buttons | Switch language (title screen + HUD) |

## 🐳 Docker

```bash
docker build -t datadog-quest .
docker run -p 3000:3000 -v $(pwd)/data:/app/data datadog-quest
```

Or with Docker Compose:

```bash
docker compose up --build
```

> Mounting `data/` keeps saves and rankings across container restarts.

## ☁️ Cloud Deployment

### Persistence note

Saves and rankings are stored in the filesystem under `data/`. On platforms with ephemeral disks (Cloud Run, Lambda, ECS Fargate without EFS, etc.) data is lost when instances restart. For production, do one of:

- Mount a persistent volume (EFS / Persistent Disk / Render Disk, etc.)
- Migrate to an external store (Redis, Postgres, Datadog KV, etc.)

### Cloud Run example

```bash
# build & push
gcloud builds submit --tag gcr.io/$PROJECT_ID/datadog-quest

# deploy (demo only - no persistence)
gcloud run deploy datadog-quest \
  --image gcr.io/$PROJECT_ID/datadog-quest \
  --region us-central1 \
  --allow-unauthenticated
```

Use **GCS FUSE** or **Cloud Run Volumes** for persistence.

### AWS ECS Fargate

1. Push the image to ECR
2. Mount `data/` to EFS in the ECS Task Definition
3. Expose via ALB or a public IP

### Render / Railway / Fly.io

These platforms auto-detect the `Dockerfile`. Enable a Persistent Disk and mount `data/`.

## 📁 Project Layout

```
.
├── server.js                  # Express server (API + static assets)
├── package.json
├── Dockerfile
├── docker-compose.yml
├── data/
│   ├── questions.json         # Japanese question bank
│   ├── questions.en.json      # English translations (keyed by question id)
│   ├── ranking.json           # Ranking (runtime, gitignored)
│   └── saves/                 # Per-player saves (runtime, gitignored)
└── public/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── i18n.js            # UI string table (JP/EN)
        ├── game.js            # Main state machine
        ├── map.js             # Field map
        ├── battle.js          # Battle & questions
        ├── questions.js       # Question selection & localization
        ├── save.js            # Saves & ranking API
        └── sprites.js         # Characters
```

## 🔌 API Endpoints

| Method | Path | Description |
| -- | -- | -- |
| GET  | `/api/questions` | Returns `{ ja, en }` question banks |
| GET  | `/api/save/:playerId` | Returns save (`{exists:false}` if missing) |
| POST | `/api/save/:playerId` | Persist save data |
| DELETE | `/api/save/:playerId` | Delete the player's save |
| GET  | `/api/ranking?limit=20` | Top entries on the leaderboard |
| POST | `/api/ranking` | Submit a score |

## 🛠 Add / Edit Questions

Edit `data/questions.json` (Japanese) and optionally provide an entry in `data/questions.en.json` (English) keyed by the same `id`.

```json
// data/questions.json
{
  "id": "apm_2_x",
  "category": "apm_rum",
  "level": 2,
  "question": "...問題文...",
  "choices": ["...", "...", "...", "..."],
  "answer": 0,
  "explanation": "..."
}
```

```json
// data/questions.en.json (keyed by id)
{
  "questions": {
    "apm_2_x": {
      "question": "...question text...",
      "choices": ["...", "...", "...", "..."],
      "explanation": "..."
    }
  }
}
```

- `level`: 1, 2, or 3 (use id `boss_*` for boss-only pool)
- `answer`: index into `choices` (the client shuffles the order anyway)

## 📜 License

[MIT](./LICENSE)
