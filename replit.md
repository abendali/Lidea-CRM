# Store Management System

## Overview

A full-stack e-commerce store management system built with React, TypeScript, Express, and PostgreSQL. The application provides comprehensive inventory tracking, cashflow management, and business analytics through a modern, data-focused dashboard interface.

**Core Features:**
- **Inventory Management**: Track products, stock levels, and stock movements with detailed history
- **Cashflow Tracking**: Monitor income and expenses with category-based organization
- **Dashboard Analytics**: Real-time metrics including total products, stock value, cash balance, and low-stock alerts
- **User Authentication**: Secure session-based authentication with passport.js

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool and dev server
- TanStack Query (React Query) for server state management
- Wouter for lightweight client-side routing
- Tailwind CSS for styling with shadcn/ui component library

**Design System:**
- shadcn/ui components (New York style variant)
- Custom color scheme with HSL color variables for theme flexibility
- Responsive grid layouts: 3-column desktop, 2-column tablet, 1-column mobile
- Typography: Inter font for UI, system fonts for data/numbers
- Spacing system based on Tailwind's standard units (2, 4, 6, 8, 12, 16)

**State Management Pattern:**
- Server state managed through TanStack Query with infinite stale time
- Authentication state provided via React Context (`AuthContext`)
- Form state handled locally with controlled components
- Optimistic updates with query invalidation on mutations

**Key Architectural Decisions:**
- **Single-page application (SPA)** with client-side routing for smooth navigation
- **Protected routes** wrapper component to handle authentication checks
- **Centralized API client** (`apiRequest` function) with consistent error handling
- **Component-based modals** for data entry (products, transactions, stock movements)

### Backend Architecture

**Technology Stack:**
- Node.js with Express framework
- Drizzle ORM for type-safe database operations
- PostgreSQL via Neon serverless driver with WebSocket support
- Passport.js with Local Strategy for authentication
- Express sessions with PostgreSQL session store

**API Design:**
- RESTful API endpoints under `/api` prefix
- All routes protected with `ensureAuthenticated` middleware (except auth routes)
- Consistent error handling with appropriate HTTP status codes
- Request/response logging for API calls

**Database Schema (Drizzle ORM):**

```
products
  - id (serial primary key)
  - name, category, estimatedPrice, stock
  - imageUrl (optional)

stockMovements
  - id (serial primary key)
  - productId (foreign key -> products.id, cascade delete)
  - type (enum: 'add' | 'subtract')
  - quantity, reason, note, date

cashflows
  - id (serial primary key)
  - type (enum: 'income' | 'expense')
  - amount, category, description, date

settings
  - id (serial primary key)
  - key (unique), value

users
  - id (serial primary key)
  - username (unique), password (hashed)
```

**Authentication Flow:**
- Passport Local Strategy with scrypt password hashing
- Session-based authentication with secure cookies
- Password hashing uses random salt per user for security
- Session secret configurable via environment variable

**Key Architectural Decisions:**
- **Database abstraction layer** (`storage.ts`) allows swapping between implementations (memory vs. database)
- **Zod validation** on both client and server using drizzle-zod for schema consistency
- **Cascade deletes** on stock movements when products are deleted
- **Session persistence** in PostgreSQL for production scalability

### Build and Deployment

**Development:**
- Vite dev server with HMR for frontend
- tsx for running TypeScript server code directly
- Concurrent development of client and server

**Production Build:**
- `vite build` compiles React app to static assets in `dist/public`
- `esbuild` bundles server code to `dist/index.js`
- Single Node.js process serves both API and static files

**Environment Configuration:**
- `DATABASE_URL` required for PostgreSQL connection
- `SESSION_SECRET` for secure session encryption (defaults to dev key)
- `NODE_ENV` for environment-specific behavior

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
  - Connection via `@neondatabase/serverless` with WebSocket support
  - Managed through Drizzle ORM with automatic migrations

### UI Component Library
- **shadcn/ui**: Radix UI primitives with Tailwind CSS styling
  - 30+ pre-built components (Dialog, Button, Card, Select, etc.)
  - Accessible, customizable, and themeable
  - No runtime dependency - components copied into project

### State Management
- **TanStack Query**: Server state synchronization
  - Automatic caching and refetching
  - Optimistic updates with query invalidation
  - Custom query functions with 401 handling

### Authentication
- **Passport.js**: Authentication middleware
  - Local strategy for username/password
  - Session serialization/deserialization
  - Integration with Express sessions

### Styling
- **Tailwind CSS**: Utility-first CSS framework
  - Custom color system with CSS variables
  - Responsive design utilities
  - PostCSS with autoprefixer

### Development Tools
- **Replit plugins**: Runtime error overlay, dev banner, cartographer (in development mode)
- **TypeScript**: Type safety across frontend and backend
- **ESM modules**: Modern JavaScript module system throughout