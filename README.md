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
- 💾 SQLite database with REST API backend
- 📦 Full checkout and item tracking system
- 🧊 Fridge inventory and rental management
- 📸 Photo verification for donations
- 📱 Fully responsive design
- ♿ Accessible UI components

## 🚀 Tech Stack

- **Frontend Framework**: React 19 with Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS with custom eco theme
- **Charts**: Recharts
- **Form Management**: React Hook Form + Zod
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Authentication**: Firebase
- **Data Storage**: SQLite database with REST API

## 📋 Prerequisites

- Node.js 18+ and npm

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

3. **Start the development servers**

   Run both backend and frontend:
   ```bash
   ./start-dev.sh
   ```

   Or manually in separate terminals:
   ```bash
   # Terminal 1 - Backend API (port 3001)
   npm run server

   # Terminal 2 - Frontend (port 5173)
   npm run dev
   ```

   The app will be available at `http://localhost:5173`
   The API will be available at `http://localhost:3001`

## ⚙️ Configuration

### Database

The application uses SQLite for data storage. The database file is located at:
```
database/reuse-store.db
```

The database is automatically created when you first run the server. No additional setup is required.

### Database Schema

The application uses 4 main tables:
- **checkouts** - Student checkout records
- **items** - Individual donated items (linked to checkouts)
- **fridges** - Fridge inventory and status tracking
- **fridge_companies** - Legacy fridge company reference data (2019-2023 data only, 169 items)

For detailed schema information, see [backend/README.md](backend/README.md)

### Environment Variables (Optional)

If deploying to production, you may need to configure environment variables for:
- API URLs
- CORS settings
- Firebase authentication (if implementing admin features)

For development, no environment variables are required.

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

server/
└── index.js            # Express API server

database/
├── reuse-store.db      # SQLite database
└── *.sql               # Migration scripts
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

## 👥 Admin Features

Current admin features include:
- Photo verification system for donations
- Database viewer for all checkouts and items
- Fridge inventory management
- Checkout and item editing capabilities
- Statistics dashboard

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
   - Add `VITE_API_URL` environment variable in Vercel pointing to your Render API
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

- `npm run dev` - Start frontend development server (port 5173)
- `npm run server` - Start backend API server (port 3001)
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## 🔧 Current Implementation Status

The application is fully functional with:
- ✅ Complete UI for all pages
- ✅ SQLite database with REST API
- ✅ Full checkout and item tracking system
- ✅ Fridge inventory and rental management
- ✅ Photo verification system
- ✅ Database viewer and admin tools
- ✅ Form validation for donations
- ✅ Interactive statistics charts
- ✅ Responsive design

Optional enhancements:
- Firebase Authentication for admin access control
- Additional reporting and analytics features
- Email notifications for checkouts/returns
- Deploy to production

## 🤝 Contributing

For student workers and developers:

### Updating About Page Content
Edit [src/components/about/AboutContent.jsx](src/components/about/AboutContent.jsx) with the actual store information.

### Managing Checkouts
Use the Database Viewer page to view and manage all checkouts and items.

### Verifying Donations
Use the Photo Verification page to review and approve donations with photos.

### Database Migrations
Migration scripts are stored in the `database/` folder. See [DATABASE_CONSOLIDATION_COMPLETE.md](DATABASE_CONSOLIDATION_COMPLETE.md) for recent migration history.

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
