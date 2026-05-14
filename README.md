# 🎯 InterviewAI — Full Stack Interview Simulator

A complete AI-powered interview preparation platform with:
- **Aptitude Tests** — 10 dynamic questions with scoring
- **DSA Coding** — 5 real FAANG problems with AI code review
- **HR Interview** — Voice-based with TTS, tone & grammar analysis

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.2, Spring Security + JWT |
| Frontend | React 18, Vite, Zustand |
| Database | MongoDB 7.0 |
| AI | **Groq API** (free, Llama 3.3 70B) |
| TTS/STT | Web Speech API (browser-native, free) |
| Container | Docker + Docker Compose |

---

## 🆓 Free Hosting Plan (Zero Cost)

| Service | Free Tier |
|---------|-----------|
| **Groq AI** | 14,400 req/day, Llama 3.3 70B 70B | 
| **MongoDB Atlas** | 512MB free cluster |
| **Railway.app** | Backend + DB hosting |
| **Vercel** | Frontend hosting |

---

## ⚙️ Local Setup (Docker)

### Prerequisites
- Docker Desktop installed
- A free Groq API key

### Step 1: Get Groq API Key (Free)
1. Go to https://console.groq.com
2. Sign up / Sign in
3. Click **API Keys** → **Create API Key**
4. Copy the key

### Step 2: Configure Environment
```bash
# Copy and edit the .env file
cp .env .env.local   # optional backup

# Edit .env with your values:
nano .env
```

Required fields in `.env`:
```env
GROQ_API_KEY=gsk_your_actual_key_here
JWT_SECRET=any_random_string_at_least_32_chars_long
MONGO_ROOT_USER=interviewadmin
MONGO_ROOT_PASS=YourSecurePassword123!
MONGO_DB_NAME=interview_simulator
GROQ_MODEL=llama-3.3-70b-versatile
CORS_ALLOWED_ORIGINS=http://localhost:3000
VITE_API_BASE_URL=http://localhost:8080/api
```

### Step 3: Run with Docker
```bash
# Start everything
docker compose up --build

# Or run in background
docker compose up --build -d
```

First build takes ~5 minutes (downloads Maven, Node dependencies).

### Step 4: Open the App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api

---

## 🌐 Free Cloud Hosting (For Many Users)

### Option A: Railway.app (Easiest)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "InterviewAI initial"
   git remote add origin https://github.com/yourusername/interview-ai
   git push -u origin main
   ```

2. **Deploy Backend on Railway**
   - Go to https://railway.app → New Project → Deploy from GitHub
   - Select your repo, set root to `/backend`
   - Add environment variables from `.env`
   - Change `CORS_ALLOWED_ORIGINS` to your Vercel URL later

3. **Deploy MongoDB on Railway**
   - In same Railway project → Add Service → Database → MongoDB
   - Copy the `MONGO_URL` from Railway and use it as `SPRING_DATA_MONGODB_URI`

4. **Deploy Frontend on Vercel**
   - Go to https://vercel.com → New Project → Import GitHub
   - Set root directory to `frontend`
   - Add environment variable: `VITE_API_BASE_URL=https://your-railway-backend-url/api`
   - Deploy!

5. **Update CORS** on Railway backend:
   ```
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

### Option B: Render.com

1. Backend: New Web Service → Docker → set env vars
2. Database: New PostgreSQL (if switching) or use MongoDB Atlas free tier
3. Frontend: New Static Site → build command: `npm run build` → publish dir: `dist`

### Option C: MongoDB Atlas (Database Only)

1. Go to https://cloud.mongodb.com → Create free cluster
2. Set up user + password
3. Whitelist `0.0.0.0/0` (all IPs for cloud deployment)
4. Get connection string, replace in `SPRING_DATA_MONGODB_URI`

---

## 📡 API Endpoints

```
POST /api/auth/register     — Register new user
POST /api/auth/login        — Login

POST /api/aptitude/start    — Generate 10 questions
POST /api/aptitude/evaluate — Submit & evaluate answers

POST /api/coding/start      — Generate 5 DSA problems
POST /api/coding/evaluate   — Evaluate submitted code
POST /api/coding/hint       — Get a hint
POST /api/coding/complete   — Finish session

POST /api/hr/start          — Generate 5 HR questions
POST /api/hr/analyze        — Analyze a spoken answer
POST /api/hr/complete       — Generate final report

GET  /api/sessions          — Get all sessions
GET  /api/sessions/me/stats — Get user stats
GET  /api/sessions/:id      — Get session details
```

---

## 🗄️ MongoDB Collections

- `users` — User accounts with session history
- `sessions` — Full session data with Q&A and feedback

---

## 🎤 HR Interview Notes

The HR module uses the **browser's Web Speech API**:
- **TTS** (Text-to-Speech): Reads questions aloud
- **STT** (Speech-to-Text): Transcribes your spoken answers

⚠️ **Best browser**: Chrome (best speech support)
⚠️ **Firefox/Safari**: May have limited STT; text input fallback is provided
⚠️ **HTTPS required** for STT in production (Vercel provides this automatically)

---

## 🔧 Development (Without Docker)

### Backend
```bash
cd backend
# Set env vars in your shell or IDE
export GROQ_API_KEY=your_key
export SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/interview_simulator
export JWT_SECRET=your_secret_min_32_chars
export CORS_ALLOWED_ORIGINS=http://localhost:3000

mvn spring-boot:run
```

### Frontend
```bash
cd frontend
echo "VITE_API_BASE_URL=http://localhost:8080/api" > .env.local
npm install
npm run dev
```

---

## 🔐 Security Notes

- JWT tokens expire in 24 hours
- Passwords are BCrypt hashed
- API key is server-side only (never exposed to frontend)
- CORS is configured per origin
- Never commit `.env` with real credentials

---

## 🐳 Docker Commands

```bash
# Start
docker compose up --build

# Stop
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild single service
docker compose up --build backend

# Remove all data (fresh start)
docker compose down -v
```

---

## 🔄 Changing AI Model

In `.env`, change `GROQ_MODEL` to any supported model:
- `llama-3.3-70b-versatile` (recommended, most capable)
- `llama-3.1-8b-instant` (faster, lower quality)
- `gemma2-9b-it` (Google's model)
- `mixtral-8x7b-32768` (long context)

Check available models at: https://console.groq.com/docs/models

---

## 📊 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Groq API error` | Check GROQ_API_KEY in .env |
| `MongoDB connection failed` | Ensure MongoDB container is running |
| `CORS error` | Update CORS_ALLOWED_ORIGINS to match frontend URL |
| `Speech not working` | Use Chrome; ensure HTTPS in production |
| `JWT invalid` | Make sure JWT_SECRET is 32+ characters |
| Backend won't start | Check logs: `docker compose logs backend` |
