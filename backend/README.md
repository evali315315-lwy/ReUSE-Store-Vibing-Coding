# ReUSE Store Backend - SQLite + Node.js

This is the new backend for the ReUSE Store application, using SQLite database with a Node.js/Express REST API.

## Features

- **SQLite Database**: File-based database for storing donors, categories, and products
- **REST API**: Express server with CORS support
- **CSV Import**: Import donor data from CSV files
- **Google Drive Integration**: Photo upload to Google Drive (same as Google Sheets backend)
- **Feature Flag**: Can run alongside old Google Sheets backend

---

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

The [`.env`](backend/.env) file is already set up with default values. You need to:

**For Google Drive photo upload:**
1. Create a Google Cloud service account (see [Google Drive Setup](#google-drive-setup))
2. Download the JSON credentials file
3. Save it as `backend/service-account-credentials.json`
4. Share your Google Drive folder with the service account email

### 3. Import CSV Data (First Time Only)

If you have a CSV file with donor names and emails:

```bash
npm run seed -- --csv=/path/to/your/donors.csv
```

**CSV Format:**
```csv
Name,Email
John Smith,jsmith@haverford.edu
Jane Doe,jdoe@haverford.edu
```

Extended format (optional columns):
```csv
Name,Email,Housing,GradYear
John Smith,jsmith@haverford.edu,Barclay Hall,2025
```

### 4. Start the Server

```bash
npm start
```

Server will start at: http://localhost:3000

**Development mode (auto-restart on file changes):**
```bash
npm run dev
```

### 5. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Search donors
curl "http://localhost:3000/api/donors/search?q=john"

# Get categories
curl http://localhost:3000/api/categories
```

---

## Enable New Backend in Frontend

To switch the frontend from Google Sheets to SQLite backend:

1. Edit [`.env.local`](../.env.local) in the project root:
   ```bash
   VITE_USE_NEW_BACKEND=true
   ```

2. Restart the frontend dev server:
   ```bash
   npm run dev
   ```

The website will now use the SQLite backend!

---

## API Endpoints

### Donors

- **GET** `/api/donors/search?q={query}` - Search donors by name or email
- **POST** `/api/donors` - Create new donor
- **GET** `/api/donors/:id` - Get donor by ID

### Categories

- **GET** `/api/categories` - List all categories (sorted by usage)
- **POST** `/api/categories` - Create new category
- **GET** `/api/categories/:id` - Get category by ID

### Products

- **POST** `/api/products` - Submit new product
- **GET** `/api/products` - List products (paginated)
- **GET** `/api/products/:id` - Get product by ID

### Photo Upload

- **POST** `/api/upload` - Upload photo to Google Drive

---

## Database Structure

### Tables

**donors**
- id (PRIMARY KEY)
- name
- email (UNIQUE)
- housing
- grad_year
- created_at
- updated_at

**categories**
- id (PRIMARY KEY)
- name (UNIQUE, case-insensitive)
- times_used
- created_at
- created_by

**products**
- id (PRIMARY KEY)
- donor_id (FOREIGN KEY → donors)
- category_id (FOREIGN KEY → categories)
- description
- photo_url
- date_logged
- created_at

### View Database

```bash
# Install sqlite3 CLI (if not already installed)
brew install sqlite3  # macOS

# Open database
sqlite3 backend/reuse-store.db

# Run queries
SELECT * FROM donors LIMIT 10;
SELECT * FROM categories ORDER BY times_used DESC;
SELECT COUNT(*) FROM products;

# Exit
.exit
```

---

## Google Drive Setup

To enable photo uploads, you need a Google Cloud service account:

### 1. Create Service Account

1. Go to https://console.cloud.google.com
2. Create or select a project
3. Enable **Google Drive API**:
   - APIs & Services → Enable APIs and Services
   - Search for "Google Drive API"
   - Click Enable

### 2. Create Service Account

1. APIs & Services → Credentials
2. Create Credentials → Service Account
3. Fill in details (name: "ReUSE Store Backend")
4. Grant role: **Editor** (or create custom role with Drive permissions)
5. Done

### 3. Download Credentials

1. Click on the created service account
2. Keys tab → Add Key → Create New Key
3. Choose **JSON**
4. Save the downloaded file as `backend/service-account-credentials.json`

### 4. Share Google Drive Folder

1. Open your Google Drive folder: https://drive.google.com/drive/folders/1rKofS8had8dJ8Nn-E2FBcXA4NLK4g_1d
2. Click **Share**
3. Add the service account email (looks like: `reuse-store-backend@...iam.gserviceaccount.com`)
4. Give **Editor** permission
5. Done!

---

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── database.js       # SQLite connection
│   │   ├── schema.sql         # Table definitions
│   │   └── seed.js            # CSV import script
│   ├── routes/
│   │   ├── donors.js          # Donor endpoints
│   │   ├── categories.js      # Category endpoints
│   │   ├── products.js        # Product endpoints
│   │   └── upload.js          # Photo upload
│   ├── services/
│   │   ├── donorService.js    # Business logic
│   │   ├── categoryService.js
│   │   ├── productService.js
│   │   └── driveService.js    # Google Drive integration
│   ├── middleware/
│   │   ├── validation.js      # Request validation
│   │   └── errorHandler.js    # Error handling
│   └── server.js              # Express app
├── .env                        # Configuration
├── package.json
└── reuse-store.db             # SQLite database (auto-created)
```

---

## Testing the Complete Flow

### 1. Start Backend
```bash
cd backend
npm start
```

### 2. Test API Endpoints

```bash
# Create a donor
curl -X POST http://localhost:3000/api/donors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@haverford.edu",
    "housing": "Barclay Hall",
    "gradYear": "2025"
  }'

# Create a category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Furniture"}'

# Submit a product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "donorName": "Test User",
    "email": "test@haverford.edu",
    "housing": "Barclay Hall",
    "gradYear": "2025",
    "categoryName": "Furniture",
    "description": "Blue office chair in excellent condition"
  }'
```

### 3. Test with Frontend

1. Set `VITE_USE_NEW_BACKEND=true` in `.env.local`
2. Start frontend: `npm run dev`
3. Open http://localhost:5175/
4. Try the product log form

---

## Switching Between Backends

You can switch between Google Sheets and SQLite backends at any time:

**Use SQLite backend:**
```bash
# In .env.local
VITE_USE_NEW_BACKEND=true
```

**Use Google Sheets backend:**
```bash
# In .env.local
VITE_USE_NEW_BACKEND=false
```

No code changes needed! The frontend automatically routes requests to the correct backend.

---

## Deployment

### Option 1: Render.com (Recommended - Free Tier)

1. Create account at https://render.com
2. Create new **Web Service**
3. Connect your GitHub repository
4. Settings:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Add Environment Variables (from `.env`)
5. Add persistent disk for SQLite database:
   - Mount path: `/app/backend`
   - Size: 1GB
6. Deploy!

### Option 2: Railway.app

1. Create account at https://railway.app
2. New Project → Deploy from GitHub
3. Select repository
4. Add variables from `.env`
5. Railway will auto-detect Node.js and deploy

### Option 3: VPS (DigitalOcean, Linode, etc.)

```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone https://github.com/your-username/reuse-store.git
cd reuse-store/backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
nano .env  # Edit configuration

# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start src/server.js --name reuse-store-backend

# Save PM2 config
pm2 save
pm2 startup
```

---

## Troubleshooting

### Database locked error
- SQLite database can only have one writer at a time
- If you see "database is locked", make sure no other processes are using it
- Check for hanging processes: `lsof backend/reuse-store.db`

### Port 3000 already in use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Photo upload not working
- Check that service account credentials file exists
- Verify Google Drive folder is shared with service account email
- Check backend logs for specific error messages

### CSV import fails
- Verify CSV format (Name,Email as headers)
- Check that emails are valid
- Ensure no duplicate emails in CSV

---

## Need Help?

- Check the main [README.md](../README.md) for full project documentation
- Review the [migration plan](/Users/evali/.claude/plans/joyful-conjuring-wall.md)
- Test endpoints with `curl` or Postman to isolate issues
- Check backend logs for error messages
