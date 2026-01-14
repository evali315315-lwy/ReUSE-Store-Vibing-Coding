# ReUSE Store Deployment Guide

This guide will help you deploy the ReUSE Store website to production using Vercel (frontend) and Render (backend).

## Architecture

- **Frontend**: React + Vite app deployed to Vercel
- **Backend**: Express API server deployed to Render
- **Database**: SQLite database (included with backend deployment)

## Prerequisites

1. GitHub account with this repository pushed
2. Vercel account (free): https://vercel.com/signup
3. Render account (free): https://render.com/register
4. Firebase project configured (for authentication)

---

## Step 1: Deploy Backend API to Render

### 1.1 Create Render Account
1. Go to https://render.com/register
2. Sign up with your GitHub account

### 1.2 Deploy the API
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `reuse-store-api` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Instance Type**: `Free`

### 1.3 Add Environment Variables (Optional)
If you need any environment variables for the backend, add them in the "Environment" section.

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait for the deployment to complete (5-10 minutes)
3. Copy your API URL (e.g., `https://reuse-store-api.onrender.com`)

**Important Note**: Render's free tier spins down after 15 minutes of inactivity. The first request after inactivity may take 30-60 seconds to respond.

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com/signup
2. Sign up with your GitHub account

### 2.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.3 Add Environment Variables
Click **"Environment Variables"** and add the following:

```
VITE_API_URL=https://your-render-url.onrender.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_WORKER_EMAIL=worker@haverford.edu
VITE_ADMIN_EMAIL=admin@haverford.edu
```

**Replace** `https://your-render-url.onrender.com` with your actual Render API URL from Step 1.

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (2-3 minutes)
3. Your site will be live at a URL like: `https://reuse-store-vibing-coding.vercel.app`

---

## Step 3: Update CORS Settings (Backend)

After deploying to Vercel, you need to update the backend to allow requests from your Vercel domain.

### 3.1 Update server/index.js
The CORS configuration in [server/index.js](server/index.js:18) currently allows all origins. For production, you should restrict it:

```javascript
// Update this line:
app.use(cors());

// To this (add your Vercel URL):
app.use(cors({
  origin: [
    'http://localhost:5173',  // For local development
    'https://your-app-name.vercel.app'  // Your Vercel URL
  ]
}));
```

### 3.2 Commit and Push
```bash
git add server/index.js
git commit -m "Update CORS for production"
git push origin main
```

Render will automatically redeploy with the new changes.

---

## Step 4: Configure Firebase

### 4.1 Add Authorized Domains
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain: `your-app-name.vercel.app`

### 4.2 Enable Google Sign-In
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Add your support email

---

## Step 5: Verify Deployment

### 5.1 Test Backend API
Open your browser and visit: `https://your-render-url.onrender.com/api/health`

You should see:
```json
{"status":"ok","message":"ReUSE Store API is running"}
```

### 5.2 Test Frontend
1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Navigate through the pages:
   - About page should load
   - Statistics page should show data
   - Donation log page should be accessible

### 5.3 Test Integration
1. Try logging in (if authentication is enabled)
2. Submit a test donation in the Product Log form
3. Check if data appears in the verification dashboard

---

## Troubleshooting

### Backend Issues

**Problem**: API not responding
- **Solution**: Check Render logs in the dashboard. Free tier may take 30-60 seconds for first request after inactivity.

**Problem**: Database errors
- **Solution**: Ensure `database/reuse-store.db` is committed to the repository. Check Render logs for specific errors.

### Frontend Issues

**Problem**: Can't connect to API
- **Solution**: Verify `VITE_API_URL` environment variable is correctly set in Vercel. Redeploy if changed.

**Problem**: Firebase authentication not working
- **Solution**: Verify all Firebase environment variables are set. Check Firebase console for authorized domains.

**Problem**: White screen or build errors
- **Solution**: Check Vercel build logs. Common issues:
  - Missing environment variables
  - Build command errors
  - Import path issues

### CORS Issues

**Problem**: "CORS policy" errors in browser console
- **Solution**: Update CORS configuration in [server/index.js](server/index.js:18) to include your Vercel URL.

---

## Custom Domain (Optional)

### Vercel Custom Domain
1. In Vercel dashboard, go to **Project Settings** → **Domains**
2. Add your custom domain (e.g., `reuse.haverford.edu`)
3. Follow Vercel's DNS configuration instructions
4. Update Firebase authorized domains

### Render Custom Domain
1. In Render dashboard, go to your service → **Settings** → **Custom Domain**
2. Add your API subdomain (e.g., `api.reuse.haverford.edu`)
3. Configure DNS records as instructed
4. Update `VITE_API_URL` in Vercel environment variables

---

## Maintenance

### Updating the Site

**Frontend changes**:
1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically deploys

**Backend changes**:
1. Make changes locally
2. Commit and push to GitHub
3. Render automatically deploys

### Monitoring
- **Vercel**: View deployment logs and analytics in dashboard
- **Render**: View logs and metrics in dashboard
- Set up email notifications for failed deployments

### Database Backups
The SQLite database is stored on Render's disk. For important data:
1. Set up periodic backups
2. Consider migrating to PostgreSQL (Render offers free tier)
3. Export data regularly via API endpoints

---

## Costs

Both services offer free tiers suitable for small to medium projects:

**Vercel Free Tier**:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS
- Edge network (CDN)

**Render Free Tier**:
- 750 hours/month (one service running 24/7)
- Automatic HTTPS
- Sleeps after 15 minutes inactivity
- Limited to 512 MB RAM

---

## Security Checklist

- [ ] Firebase API keys configured
- [ ] CORS properly restricted in production
- [ ] Environment variables set (not in code)
- [ ] `.env` files not committed to repository
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] Admin emails restricted to `@haverford.edu`
- [ ] Database access restricted to backend only

---

## Next Steps

1. Configure Firebase authentication
2. Test all features in production
3. Set up custom domain (optional)
4. Configure email notifications for deployment failures
5. Add monitoring/analytics (Google Analytics, etc.)
6. Set up database backups
7. Train staff on using the system

---

## Support

**Deployment Issues**:
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs

**Code Issues**:
- GitHub Issues: https://github.com/evali315315-lwy/ReUSE-Store-Vibing-Coding/issues

**Firebase Issues**:
- Firebase Docs: https://firebase.google.com/docs
