# 🎯 Quick Start Guide

## You're Almost Ready! Just 3 Steps:

### Step 1: Set up Supabase (5 minutes)

1. **Go to [supabase.com](https://supabase.com)** and create a free account
2. Click **"New Project"** 
   - Organization: Create new or select existing
   - Name: `alcovia-intervention-engine`
   - Database Password: (save this somewhere)
   - Region: Choose closest to you
   - Click **Create Project** (wait 2-3 minutes)

3. **Run SQL Schema**
   - In Supabase dashboard, go to **SQL Editor** (left sidebar)
   - Click **"New Query"**
   - Copy the entire contents of `backend/schema.sql`
   - Paste and click **Run** (bottom right)
   - You should see "Success. No rows returned"

4. **Get API Credentials**
   - Go to **Project Settings** (gear icon) → **API**
   - Copy **Project URL** (looks like: `https://xyz.supabase.co`)
   - Copy **anon public** key (long string)

5. **Create backend/.env file**
   ```bash
   cd backend
   touch .env
   ```
   
   Add this content (replace with your values):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-public-key
   N8N_WEBHOOK_URL=
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

### Step 2: Set up n8n (5 minutes)

1. **Go to [n8n.io](https://n8n.io)** and create a free account
2. Click **"New Workflow"**
3. Click the **three dots** (top right) → **Import from File**
4. Upload `n8n/workflow.json`
5. **Configure Email Node** (click on "Send Email to Mentor"):
   
   **Option A: Gmail**
   - Click **"Create New Credential"**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - User: Your Gmail address
   - Password: Create an [App Password](https://myaccount.google.com/apppasswords)
   - Save
   
   **Option B: SendGrid (recommended)**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Create API key
   - Replace Email node with SendGrid node
   - Add API key

6. **Activate Workflow**
   - Toggle **"Active"** (top right)
   - Click on first node ("Webhook - Student Failed")
   - Copy the **Production URL** (looks like: `https://xyz.app.n8n.cloud/webhook/student-intervention`)

7. **Update backend/.env**
   - Add the webhook URL:
     ```
     N8N_WEBHOOK_URL=https://your-n8n-url/webhook/student-intervention
     ```

### Step 3: Start the App

```bash
# From the project root
cd backend
npm run dev
# Keep this terminal open - backend runs on port 3001

# Open a NEW terminal
cd frontend
npm run dev
# Frontend opens at http://localhost:5173
```

## 🎉 You're Done! Now Test It:

### Test Flow 1: Success (No Intervention)
1. Open http://localhost:5173
2. You'll see "Welcome, Ravish Kumar!"
3. Click "30 minutes" to start focus timer
4. **Important: Don't switch tabs!**
5. Wait for timer or click "End Early"
6. Enter quiz score: **8**
7. Submit → Should show "On Track" ✅

### Test Flow 2: Intervention (Full Loop)
1. Start timer, let it finish
2. Enter quiz score: **4**
3. Submit → App locks immediately 🔒
4. Check **ravishrk124@gmail.com** for email
5. Click any task button in email
6. **Watch the app unlock instantly!** ⚡ (WebSocket magic)
7. Click "Mark Complete" → Back to normal ✅

### Test Flow 3: Tab Switching Detection (Bonus)
1. Start timer
2. **Switch to another tab** (Chrome/Safari)
3. Return → Notice warning
4. Submit → App locks with "Tab switching detected" 🚨

## 🐛 Troubleshooting

**Backend won't start?**
- Check `backend/.env` has correct Supabase credentials
- Run `npm install` in backend folder

**Frontend won't start?**
- Check `frontend/.env` exists (create from `.env.example`)
- Run `npm install` in frontend folder

**Email not arriving?**
- Check n8n workflow is activated
- Check spam folder
- Verify n8n email credentials are correct

**App not unlocking?**
- Check browser console for WebSocket connection
- Verify backend is running and shows "WebSocket connected"

## 📁 Project Location

```
/Users/ravishkumar/.gemini/antigravity/scratch/alcovia-intervention-engine/
```

## 📚 Full Documentation

See `README.md` for complete documentation, API reference, and deployment guide.

---

Built with ❤️ for Alcovia | Includes both bonus challenges!
