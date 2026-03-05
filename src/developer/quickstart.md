# GameLayer API Quickstart

Get from zero to your first gamification integration in ~10 minutes.

> **Note:** The code examples in this guide are simplified for clarity. See the [full client libraries](../examples/) for production-ready implementations with error handling.

## Prerequisites

- A GameLayer account with an **API key** (get one from the [dashboard](https://app.gamelayer.co))
- At least one **event** configured in the dashboard
- An HTTP client (curl, Postman) or your language of choice

## Environments

| Environment | API Base URL | Dashboard |
|-------------|-------------|-----------|
| Production | `https://api.gamelayer.co/api/v0` | [app.gamelayer.co](https://app.gamelayer.co) |
| Development | `https://api.dev.gamelayer.co/api/v0` | [app.dev.gamelayer.co](https://app.dev.gamelayer.co) |

## Authentication

Every request needs two things:

| What | Where | Example |
|------|-------|---------|
| API key | `api-key` header | `api-key: your-api-key-here` |
| Account ID | `account` query param or request body | `account=my-account` |

```
GET /api/v0/events?account=my-account
Host: api.gamelayer.co
api-key: your-api-key-here
```

---

## Step 1: Create a Player

Players represent your users inside GameLayer. Use your own user ID as the player ID to keep the mapping simple.

### curl

```bash
curl -X POST https://api.gamelayer.co/api/v0/players \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "YOUR_ACCOUNT",
    "player": "user-123",
    "name": "Jane Doe"
  }'
```

### JavaScript (fetch)

```javascript
const BASE_URL = "https://api.gamelayer.co/api/v0";
const API_KEY = "YOUR_API_KEY";
const ACCOUNT = "YOUR_ACCOUNT";

const res = await fetch(`${BASE_URL}/players`, {
  method: "POST",
  headers: {
    "api-key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    account: ACCOUNT,
    player: "user-123",
    name: "Jane Doe",
  }),
});

const player = await res.json();
console.log(player);
```

### Python (requests)

```python
import requests

BASE_URL = "https://api.gamelayer.co/api/v0"
API_KEY = "YOUR_API_KEY"
ACCOUNT = "YOUR_ACCOUNT"

headers = {"api-key": API_KEY, "Content-Type": "application/json"}

res = requests.post(f"{BASE_URL}/players", headers=headers, json={
    "account": ACCOUNT,
    "player": "user-123",
    "name": "Jane Doe",
})

player = res.json()
print(player)
```

### Expected response (201 Created)

```json
{
  "player": "user-123",
  "name": "Jane Doe",
  "tags": [],
  "category": "",
  "imgUrl": "",
  "isAvailable": true,
  "points": 0,
  "credits": 0,
  "team": "",
  "level": { "id": "", "name": "", "description": "", "imgUrl": "", "ordinal": 0 },
  "createdOn": "2025-03-15T10:30:00.000Z"
}
```

The player starts with **0 points** and **0 credits**. Points accumulate over time and drive level progression. Credits are a spendable balance for the prize shop.

---

## Step 2: Set Up Gamification (Dashboard)

Before your player can earn rewards, you need game elements configured in the [GameLayer Dashboard](https://app.gamelayer.co) (or [dev dashboard](https://app.dev.gamelayer.co)):

- **Events** — the actions your users take (e.g., "complete-lesson", "make-purchase")
- **Missions** — goals with objectives tied to events (e.g., "Complete 5 lessons this week")
- **Achievements** — step-based milestones (e.g., "Complete 10 missions")
- **Levels** — progression tiers based on accumulated points
- **Prizes** — reward shop items redeemable with credits

If you're using a development account, sample elements may already be configured for you.

---

## Step 3: Complete an Event

This is the core integration point. When a user performs an action in your app, call `POST /events/{id}/complete`. GameLayer handles the rest through the **progression cascade** — a single call can trigger mission progress, achievement steps, level ups, streak updates, and leaderboard changes.

### curl

```bash
curl -X POST https://api.gamelayer.co/api/v0/events/complete-lesson/complete \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "YOUR_ACCOUNT",
    "player": "user-123",
    "count": 1
  }'
```

### JavaScript

```javascript
const res = await fetch(`${BASE_URL}/events/complete-lesson/complete`, {
  method: "POST",
  headers: {
    "api-key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    account: ACCOUNT,
    player: "user-123",
    count: 1,
  }),
});

const result = await res.json();
console.log("Points earned:", result.progress.points.earned);
console.log("Missions completed:", result.progress.missions);
```

### Python

```python
res = requests.post(
    f"{BASE_URL}/events/complete-lesson/complete",
    headers=headers,
    json={
        "account": ACCOUNT,
        "player": "user-123",
        "count": 1,
    },
)

result = res.json()
print("Points earned:", result["progress"]["points"]["earned"])
print("Missions completed:", result["progress"]["missions"])
```

### Expected response (200 OK)

```json
{
  "event": {
    "id": "complete-lesson",
    "name": "Complete Lesson",
    "reward": { "points": 10, "credits": 5, "achievements": [] }
  },
  "player": { "name": "Jane Doe", "points": 10, "credits": 5 },
  "progress": {
    "points": { "before": 0, "earned": 10 },
    "credits": { "before": 0, "earned": 5 },
    "missions": [],
    "startedMissions": [
      { "id": "weekly-challenge", "name": "Weekly Challenge", "description": "Complete 5 lessons this week", "imgUrl": "..." }
    ],
    "achievements": [],
    "unlockedAchievements": [],
    "levels": { "completed": [], "started": {} },
    "completedStreaks": [],
    "activeStreaks": [],
    "rules": []
  }
}
```

**Reading the `progress` object:**

| Field | Meaning |
|-------|---------|
| `points.earned` | Total points earned from this cascade (after rule multipliers) |
| `credits.earned` | Total credits earned |
| `missions` | Missions **completed** by this event (with reward details) |
| `startedMissions` | Missions that **started** progressing |
| `achievements` | Achievements **completed** |
| `unlockedAchievements` | Achievements that received steps but aren't complete yet |
| `levels.completed` | Levels the player advanced through |
| `levels.started` | The player's new current level (if they leveled up) |
| `completedStreaks` | Streaks that completed |
| `activeStreaks` | Streaks that incremented |

---

## Step 4: Check Player Progress

Query specific progress areas to build your UI.

### Get player missions

```bash
curl "https://api.gamelayer.co/api/v0/players/user-123/missions?account=YOUR_ACCOUNT&completion=all" \
  -H "api-key: YOUR_API_KEY"
```

```javascript
const res = await fetch(
  `${BASE_URL}/players/user-123/missions?account=${ACCOUNT}&completion=all`,
  { headers: { "api-key": API_KEY } }
);
const data = await res.json();
console.log("Started missions:", data.missions.started);
console.log("Completed missions:", data.missions.completed);
```

```python
res = requests.get(
    f"{BASE_URL}/players/user-123/missions",
    headers=headers,
    params={"account": ACCOUNT, "completion": "all"},
)
data = res.json()
print("Started:", data["missions"]["started"])
print("Completed:", data["missions"]["completed"])
```

### Get player achievements

```bash
curl "https://api.gamelayer.co/api/v0/players/user-123/achievements?account=YOUR_ACCOUNT" \
  -H "api-key: YOUR_API_KEY"
```

### Get player levels

```bash
curl "https://api.gamelayer.co/api/v0/players/user-123/levels?account=YOUR_ACCOUNT" \
  -H "api-key: YOUR_API_KEY"
```

---

## Step 5: Prize Economy

Players spend **credits** to claim prizes from your reward shop.

### List available prizes

```bash
curl "https://api.gamelayer.co/api/v0/prizes?account=YOUR_ACCOUNT&player=user-123" \
  -H "api-key: YOUR_API_KEY"
```

Passing `player` filters to only prizes the player is eligible for (meets requirements and has stock).

### Claim a prize

```bash
curl -X POST https://api.gamelayer.co/api/v0/prizes/cup-coffee/claim \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "YOUR_ACCOUNT",
    "player": "user-123"
  }'
```

```javascript
const res = await fetch(`${BASE_URL}/prizes/cup-coffee/claim`, {
  method: "POST",
  headers: {
    "api-key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    account: ACCOUNT,
    player: "user-123",
  }),
});

const claim = await res.json();
console.log("Claim result code:", claim.code);
console.log("Remaining credits:", claim.player.credits);
```

```python
res = requests.post(
    f"{BASE_URL}/prizes/cup-coffee/claim",
    headers=headers,
    json={"account": ACCOUNT, "player": "user-123"},
)

claim = res.json()
print("Claim result:", claim["code"])
print("Remaining credits:", claim["player"]["credits"])
```

### Claim response codes

| Code | Meaning |
|------|---------|
| `2` | **REDEEMED** — success, credits deducted |
| `3` | NOT_ENOUGH_CREDITS — insufficient balance |
| `4` | OUT_OF_STOCK — no stock remaining |
| `5` | COUNT_EXCEEDED — player hit their redemption limit for this period |

---

## What's Next

- **[Integration Guide](integration-guide.md)** — Common patterns, architecture guidance, and advanced scenarios
- **[API Cheat Sheet](cheat-sheet.md)** — One-page reference of all endpoints and parameters
- **[Postman Collection](../postman/)** — Import and explore the API interactively
- **[Code Examples](../examples/)** — Copy-paste client libraries in JavaScript, Python, C#, and curl
- **[API Reference](https://gamelayer.io/api-docs)** — Full interactive documentation with try-it-out
