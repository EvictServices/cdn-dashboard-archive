# CDN Dashboard

A modern, full-featured CDN management dashboard with authentication, API key management, real-time analytics, and file serving capabilities.

## Features

- 🔐 Secure authentication with JWT and bcrypt
- 🔑 API key management with CRUD operations
- 📊 Real-time analytics and statistics
- 🗄️ PostgreSQL database backend
- 🎨 Modern UI with Shadcn/UI components
- 📈 Request tracking and monitoring
- 📁 CDN file serving (avatars, profile pictures, banners)
- 🎲 Random file selection from categories
- 🔒 Protected and public endpoints

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite build tool
- TailwindCSS for styling
- Shadcn/UI components
- React Router for navigation
- TanStack Query for data fetching

### Backend
- Express.js with TypeScript
- PostgreSQL database
- JWT authentication
- Bcrypt password hashing
- File serving with authentication

## Quick Start

See [SETUP.md](SETUP.md) for complete setup instructions.

### Prerequisites

- Bun runtime or Node.js 18+
- PostgreSQL 12+

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd cdn-new

# Install all dependencies
cd src/api && bun install && cd ../..
bun install

# Set up database (see SETUP.md)
# Configure .env files (see SETUP.md)

# Option 1: Start with PM2 (recommended)
npm install -g pm2
pm2 start ecosystem.config.js

# Option 2: Start manually
# Terminal 1: cd src/api && bun run dev
# Terminal 2: bun dev
```

## Project Structure

```
cdn-new/
├── src/
│   ├── api/              # Backend Express API
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Authentication
│   │   ├── sql/          # Database scripts
│   │   └── index.ts      # Server entry
│   ├── cdn-files/        # CDN file storage
│   │   ├── avatars/      # User avatars (public)
│   │   └── autopfp/      # Auto PFP files (protected)
│   ├── public/           # Static frontend assets
│   ├── components/       # React components
│   ├── pages/            # React pages
│   └── ...              # Other frontend code
├── ecosystem.config.js   # PM2 configuration
├── logs/                # Application logs
└── SETUP.md             # Detailed setup guide
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### API Keys (Protected)
- `GET /api/keys` - List API keys
- `POST /api/keys` - Create new API key
- `DELETE /api/keys/:id` - Delete API key

### Analytics (Protected)
- `GET /api/analytics/stats` - Get statistics
- `GET /api/analytics/recent` - Get recent requests
- `GET /api/analytics/top-endpoints` - Get top endpoints

### CDN Files
- `GET /cdn/avatars/:userId` - Get user avatar (public)
- `GET /cdn/autopfp/pfp/:category` - Get random profile picture (protected)
- `GET /cdn/autopfp/banner/:category` - Get random banner (protected)

## Development

```bash
# Using PM2
pm2 start ecosystem.config.js
pm2 logs
pm2 stop all

# Manual start
# Frontend: bun dev
# Backend: cd src/api && bun run dev

# Build frontend for production
bun run build

# Preview production build
bun run preview
```

## License

MIT
