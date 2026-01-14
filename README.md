# Haverford College ReUSE Store Website

A sustainable web application for managing donations and showcasing the environmental impact of Haverford College's ReUSE Store.

## 🌱 Overview

The ReUSE Store website is a React-based application with a green/environmental theme that helps track donations and visualize the positive environmental impact of the ReUSE Store program. The site features three main sections:

1. **About** - Information about the ReUSE Store, how it works, hours, and location
2. **Statistics** - Visual dashboard showing recycling metrics and trends over 4 years
3. **Donations** - Form for student workers to log new donations

## ✨ Features

- 🎨 Custom green eco-friendly theme with Tailwind CSS
- 📊 Interactive charts using Recharts
- 📝 Form validation with React Hook Form and Zod
- 🔐 Firebase Authentication for admin access (ready to implement)
- 📊 Google Sheets integration for data storage (ready to implement)
- 📱 Fully responsive design
- ♿ Accessible UI components

## 🚀 Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom eco theme
- **Charts**: Recharts
- **Form Management**: React Hook Form + Zod
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Authentication**: Firebase (to be configured)
- **Data Storage**: Google Sheets API (to be configured)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Google account (for Google Sheets API)
- A Firebase account (for authentication)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/evali315315-lwy/ReUSE-Store-Vibing-Coding.git
   cd ReUSE-Store-Vibing-Coding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your actual credentials (see Configuration section below).

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Google Sheets
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_GOOGLE_SHEET_ID=YOUR_SHEET_ID

# Firebase Authentication
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Admin Configuration
VITE_ADMIN_EMAILS=admin1@haverford.edu,admin2@haverford.edu
```

### Google Sheets Setup

1. **Create a Google Sheet** with two tabs:
   - **Donations Log** - Columns: Timestamp, Donor Name, Donor Email, Object Name, Description, Submission ID
   - **Yearly Statistics** - Columns: Year, Total Items, Total Weight (lbs), CO2 Saved (lbs), Last Updated, Updated By

2. **Create Google Apps Script**:
   - Open your Google Sheet
   - Go to Extensions > Apps Script
   - Copy the script from the implementation plan (see [/Users/evali/.claude/plans/joyful-conjuring-wall.md](/Users/evali/.claude/plans/joyful-conjuring-wall.md))
   - Deploy as Web App
   - Copy the deployment URL to `VITE_APPS_SCRIPT_URL`

3. **Populate sample data** in the Yearly Statistics sheet (2021-2024)

### Firebase Setup

1. **Create a Firebase project** at https://console.firebase.google.com
2. **Enable Google Sign-In** provider in Authentication
3. **Add your domain** to authorized domains (include localhost for development)
4. **Copy Firebase config** to your `.env.local` file

## 📂 Project Structure

```
src/
├── components/
│   ├── layout/         # Header, Footer, Layout
│   ├── about/          # About page components
│   ├── donations/      # Donation form components
│   ├── statistics/     # Statistics dashboard components
│   └── common/         # Reusable components
├── pages/              # Route pages
├── services/           # API and service modules
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── utils/              # Utility functions
└── assets/             # Images and styles
```

## 🎨 Customization

### Color Theme

The green eco theme is defined in [tailwind.config.js](tailwind.config.js). You can customize the color palette:

```javascript
colors: {
  'eco-primary': {
    300: '#86efac',  // Light green
    500: '#22c55e',  // Primary green
    600: '#16a34a',  // Dark green
    800: '#166534',  // Forest green
  }
}
```

### About Page Content

To update the About page content, edit [src/components/about/AboutContent.jsx](src/components/about/AboutContent.jsx). Update the placeholder text with actual ReUSE Store information.

## 👥 Admin Features (To Be Implemented)

Admins can:
- Sign in with Google (@haverford.edu email)
- Edit yearly statistics data
- View audit trail of changes

To add new admins, update the `VITE_ADMIN_EMAILS` environment variable.

## 🚢 Deployment

### Quick Deployment Guide

This is a full-stack application with:
- **Frontend**: React + Vite (deploy to Vercel)
- **Backend**: Express API + SQLite (deploy to Render)

**See [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) for quick overview or [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete step-by-step instructions.**

### Quick Steps

1. **Deploy Backend to Render** (5 minutes)
   - Sign up at https://render.com/register
   - Create new Web Service from GitHub
   - Use `npm run server` as start command
   - Copy your API URL

2. **Deploy Frontend to Vercel** (3 minutes)
   - Sign up at https://vercel.com/signup
   - Import GitHub repository
   - Add environment variables (including your Render API URL)
   - Deploy

3. **Configure**
   - Update CORS in [server/index.js](server/index.js) with your Vercel URL
   - Add Vercel domain to Firebase authorized domains
   - Test all features

### Local Development

Run both frontend and backend:
```bash
./start-dev.sh
```

Or manually:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## 🔧 Next Steps

The current implementation includes:
- ✅ Complete UI for all three pages
- ✅ Form validation for donations
- ✅ Interactive statistics charts
- ✅ Responsive design
- ✅ Mock data for testing

To complete the full functionality:
1. Set up Google Sheets API integration (see plan file)
2. Implement Firebase Authentication
3. Connect DonationForm to Google Sheets
4. Add admin editing capability for statistics
5. Deploy to production

## 🤝 Contributing

For student workers and developers:

### Adding New Admins
Update the `VITE_ADMIN_EMAILS` environment variable in your deployment platform settings.

### Updating About Page Content
Edit [src/components/about/AboutContent.jsx](src/components/about/AboutContent.jsx) with the actual store information from the Google Doc.

### Modifying Statistics
Once Google Sheets integration is complete, admins can update statistics directly through the website.

## 📄 License

This project is created for Haverford College ReUSE Store.

## 📧 Contact

For questions or issues:
- Email: reuse@haverford.edu
- GitHub Issues: https://github.com/evali315315-lwy/ReUSE-Store-Vibing-Coding/issues

## 🌟 Acknowledgments

- Haverford College Sustainability Office
- ReUSE Store student workers
- The Haverford community for their continued support

---

**Live Site**: [Coming Soon]

**Development Server**: http://localhost:5173 (when running locally)
