# 🗓️ AI Life Calendar

An AI-powered calendar app that helps you plan your days and build better habits.

## ✨ Features

- **AI Planning Assistant**: Chat with Claude to plan your day conversationally
- **Smart Calendar**: View your schedule with color-coded time blocks
- **Habit Tracking**: Add habits, track streaks, get scheduled time for them
- **User Authentication**: Secure login with Clerk

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (React framework)
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Convex (real-time)
- **AI**: Claude (Anthropic API)
- **Deployment**: Vercel

---

## 🚀 Quick Setup Guide (30 minutes)

### Prerequisites

- Node.js 18+ installed ([download here](https://nodejs.org/))
- A code editor (VS Code recommended)
- Terminal/Command Line access

### Step 1: Install Dependencies (2 minutes)

\`\`\`bash
# Navigate to the project folder
cd calendar-app

# Install all packages
npm install
\`\`\`

### Step 2: Set Up Clerk Authentication (5 minutes)

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application (call it "AI Calendar")
3. Go to **API Keys** in the sidebar
4. Copy your keys

### Step 3: Set Up Convex Database (5 minutes)

1. Go to [convex.dev](https://convex.dev) and sign up
2. Create a new project (call it "ai-calendar")
3. You'll get the URL after running the CLI (next step)

### Step 4: Get Your Anthropic API Key (2 minutes)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Navigate to **API Keys**
3. Create a new key and copy it

### Step 5: Configure Environment Variables (3 minutes)

\`\`\`bash
# Copy the example env file
cp .env.example .env.local

# Open .env.local in your editor and fill in your keys:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# - CLERK_SECRET_KEY=sk_test_...
# - ANTHROPIC_API_KEY=sk-ant-...
# - NEXT_PUBLIC_CONVEX_URL (will be auto-filled)
\`\`\`

### Step 6: Initialize Convex (3 minutes)

\`\`\`bash
# This will prompt you to log in and link your project
npx convex dev
\`\`\`

This command:
- Connects to your Convex project
- Syncs your database schema
- Generates TypeScript types
- Stays running to sync changes

**Keep this terminal running!**

### Step 7: Start the Development Server (1 minute)

In a **new terminal**:

\`\`\`bash
npm run dev:next
\`\`\`

### Step 8: Open Your App! 🎉

Go to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure Explained

\`\`\`
calendar-app/
├── src/
│   ├── app/                    # Next.js App Router (pages)
│   │   ├── layout.tsx          # Root layout (wraps all pages)
│   │   ├── page.tsx            # Landing page (/)
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts    # Claude API endpoint
│   │   └── dashboard/
│   │       ├── layout.tsx      # Dashboard layout (sidebar)
│   │       ├── page.tsx        # Dashboard home (/dashboard)
│   │       ├── plan/
│   │       │   └── page.tsx    # AI planning chat (/dashboard/plan)
│   │       ├── calendar/
│   │       │   └── page.tsx    # Calendar view (/dashboard/calendar)
│   │       ├── habits/
│   │       │   └── page.tsx    # Habits page (/dashboard/habits)
│   │       └── settings/
│   │           └── page.tsx    # Settings (/dashboard/settings)
│   │
│   ├── components/             # Reusable React components
│   │   └── ConvexClientProvider.tsx
│   │
│   ├── convex/                 # Database schema & functions
│   │   ├── schema.ts           # Database tables definition
│   │   ├── users.ts            # User-related queries/mutations
│   │   ├── events.ts           # Calendar events queries/mutations
│   │   ├── habits.ts           # Habits queries/mutations
│   │   ├── planning.ts         # Planning session queries/mutations
│   │   └── _generated/         # Auto-generated types (don't edit!)
│   │
│   └── lib/
│       └── utils.ts            # Utility functions
│
├── package.json                # Dependencies (like requirements.txt)
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── .env.example                # Environment variables template
\`\`\`

---

## 🔑 Key Concepts for Python Developers

### React/Next.js vs Python Web Frameworks

| Python (Flask/Django) | Next.js/React |
|-----------------------|---------------|
| \`@app.route('/')\` | File at \`app/page.tsx\` |
| \`render_template()\` | Return JSX directly |
| \`request.get_json()\` | \`await request.json()\` |
| \`session['user']\` | \`useUser()\` hook |
| SQLAlchemy models | Convex schema |
| \`db.query().all()\` | \`useQuery(api.table.function)\` |

### State Management

- **useState**: Like a Python variable that triggers UI update when changed
- **useEffect**: Code that runs after render (like \`__init__\` but for side effects)
- **useQuery**: Subscribes to database and auto-updates when data changes

### File-Based Routing

\`\`\`
app/page.tsx           → /
app/dashboard/page.tsx → /dashboard
app/api/chat/route.ts  → POST /api/chat
\`\`\`

---

## 🔧 Common Commands

\`\`\`bash
# Start development (both Next.js and Convex)
npm run dev

# Start only Next.js
npm run dev:next

# Start only Convex
npm run dev:convex

# Build for production
npm run build

# Run linting
npm run lint
\`\`\`

---

## 🚢 Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add your environment variables in Vercel dashboard
5. Deploy!

For Convex, run:
\`\`\`bash
npx convex deploy
\`\`\`

---

## 🐛 Troubleshooting

### "Module not found" errors
\`\`\`bash
rm -rf node_modules
npm install
\`\`\`

### Convex types not working
\`\`\`bash
# Make sure Convex CLI is running
npx convex dev
\`\`\`

### Clerk not working
- Check that your environment variables are correct
- Make sure you're using the correct Clerk API keys for dev/prod

### Claude API errors
- Verify your API key is correct
- Check you have credits in your Anthropic account

---

## 📈 Next Steps (After MVP)

1. **Email Reminders**: Add Resend + Vercel Cron for notifications
2. **Feature Gating**: Implement the 3-day feature rollout system
3. **Better Habit AI**: Make AI smarter about scheduling habits
4. **Mobile App**: Consider React Native or PWA
5. **Calendar Sync**: Google Calendar integration

---

## 🤝 Getting Help

- **Next.js Docs**: https://nextjs.org/docs
- **Convex Docs**: https://docs.convex.dev
- **Clerk Docs**: https://clerk.com/docs
- **Anthropic Docs**: https://docs.anthropic.com

---

Built with ❤️ to help you be more productive!
