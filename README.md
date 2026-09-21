# Todo Backend (Express + MongoDB + TypeScript)

## Run locally

```bash
npm install
cp .env.example .env      # add your MongoDB connection string
npm run dev               # http://localhost:5000
```

## Endpoints

| Method | Path           | Description                                     |
| ------ | -------------- | ----------------------------------------------- |
| POST   | /api/tasks     | Create a task                                   |
| GET    | /api/tasks     | List tasks (?isCompleted=true&isImportant=true) |
| GET    | /api/tasks/:id | Get one task                                    |
| PATCH  | /api/tasks/:id | Partial update (PUT works the same)             |
| DELETE | /api/tasks/:id | Delete a task (204)                             |

```bash
curl -X POST localhost:5000/api/tasks -H "Content-Type: application/json" \
  -d '{"task":"Finish portfolio website","isImportant":true}'
```

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel (or run `npx vercel`).
2. Add the env var `MONGODB_URI` (Project Settings -> Environment Variables).
3. In MongoDB Atlas -> Network Access, allow `0.0.0.0/0` (Vercel uses dynamic IPs).
4. Deploy.
