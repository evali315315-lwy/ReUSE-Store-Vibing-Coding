# Deployment Summary

Your ReUSE Store website is ready to deploy! Here's what has been prepared:

## Files Created

1. **[vercel.json](vercel.json)** - Vercel deployment configuration
2. **[render.yaml](render.yaml)** - Render backend deployment configuration
3. **[.env.local](.env.local)** - Local development environment variables
4. **[.env.production](.env.production)** - Production environment template
5. **[start-dev.sh](start-dev.sh)** - Script to run both frontend and backend locally
6. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment guide

## Quick Start (Local Development)

### Option 1: Use the start script (Recommended)
```bash
./start-dev.sh
```

### Option 2: Run manually
```bash
# Terminal 1 - Backend API
npm run server

# Terminal 2 - Frontend
npm run dev
```

Then visit: http://localhost:5173

## Deployment Steps

### 1. Backend (Render)
- Sign up at https://render.com/register
- Create new Web Service from GitHub repo
- Use settings from [render.yaml](render.yaml)
- Copy your API URL (e.g., `https://your-app.onrender.com`)

### 2. Frontend (Vercel)
- Sign up at https://vercel.com/signup
- Import GitHub repository
- Add environment variables (see below)
- Deploy!

### 3. Environment Variables for Vercel

You need to set these in Vercel dashboard:

```bash
VITE_USE_NEW_BACKEND=true
VITE_API_URL=https://your-render-url.onrender.com/api  # From step 1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_WORKER_EMAIL=worker@haverford.edu
VITE_ADMIN_EMAIL=admin@haverford.edu
```

## Important Notes

### CORS Configuration
After deploying to Vercel, update [server/index.js](server/index.js:18) to include your Vercel URL:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-vercel-app.vercel.app'  // Add your Vercel URL
  ]
}));
```

### Firebase Setup
1. Add your Vercel domain to Firebase authorized domains
2. Enable Google Sign-In provider
3. Create admin and worker accounts

### Database
- The SQLite database ([database/reuse-store.db](database/reuse-store.db)) is included in the repo
- Render will use this database
- Consider setting up backups for production use

## Architecture

```
┌─────────────────┐
│   Users         │
└────────┬────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│  Vercel         │      │  Render          │
│  (Frontend)     │─────▶│  (Backend API)   │
│  React + Vite   │      │  Express + SQLite│
└─────────────────┘      └──────────────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│  Firebase       │      │  Database        │
│  (Auth)         │      │  (SQLite)        │
└─────────────────┘      └──────────────────┘
```

## Testing Checklist

After deployment, test:

- [ ] Visit frontend URL
- [ ] Test API health endpoint: `https://your-api.onrender.com/api/health`
- [ ] Login with Firebase (if configured)
- [ ] Submit a test donation
- [ ] View statistics page
- [ ] Check verification dashboard
- [ ] Test search functionality

## Cost

Both services are **FREE** for small to medium usage:

- **Vercel**: Unlimited deployments, 100 GB bandwidth/month
- **Render**: 750 hours/month (enough for one 24/7 service)

## Support

- **Full Guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **GitHub Issues**: https://github.com/evali315315-lwy/ReUSE-Store-Vibing-Coding/issues

## Next Steps

1. Deploy backend to Render
2. Deploy frontend to Vercel
3. Configure environment variables
4. Update CORS settings
5. Set up Firebase authentication
6. Test all features
7. Configure custom domain (optional)

Good luck with your deployment! 🚀
