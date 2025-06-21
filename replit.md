# ToolBooker Pro - Tool Booking Management System

## Overview

ToolBooker Pro is a full-stack web application for managing tool bookings in an organizational setting. The system features a React frontend with shadcn/ui components, an Express.js backend API, and PostgreSQL database with Drizzle ORM. It includes administrative approval workflows, calendar-based booking management, and role-based access control.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark/light theme support
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Style**: RESTful API endpoints
- **Development Server**: Hot reload with Vite middleware integration
- **Authentication**: Mock authentication system (designed for Replit Auth integration)

### Database Architecture
- **Database**: PostgreSQL (configured for Neon)
- **ORM**: Drizzle with schema-first approach
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon serverless with WebSocket support

## Key Components

### Database Schema
- **Users Table**: Stores user profiles with role-based access (admin/user)
- **Tools Table**: Tool inventory with status tracking and metadata
- **Bookings Table**: Booking requests with approval workflow states
- **Sessions Table**: Session management for authentication

### Authentication System
- Mock authentication endpoint for development (`/api/auth/user`)
- Role-based access control (admin vs user permissions)
- Session-based authentication architecture ready for Replit Auth

### Tool Management
- CRUD operations for tool inventory
- Status tracking (available, in-use, maintenance, out-of-order)
- Category-based organization and filtering
- Image support for tool visualization

### Booking System
- Request-based booking workflow
- Administrative approval process
- Calendar-based availability checking
- Conflict detection for overlapping bookings
- Cost calculation and tracking

### User Interface
- Responsive dashboard with statistics overview
- Calendar view for booking visualization
- Tool catalog with search and filtering
- Request management interface for administrators
- Booking history and usage reports

## Data Flow

1. **User Authentication**: Users authenticate through mock endpoint (ready for Replit Auth)
2. **Tool Discovery**: Browse tools through catalog with filtering and search
3. **Booking Request**: Users submit booking requests for available tools
4. **Admin Approval**: Administrators review and approve/reject requests
5. **Calendar Management**: Approved bookings appear in calendar view
6. **Usage Tracking**: System tracks booking history and generates reports

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe database ORM with schema validation
- **@tanstack/react-query**: Server state management and caching
- **express**: Web framework for API endpoints
- **wouter**: Lightweight client-side routing

### UI Dependencies
- **@radix-ui/***: Headless UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- **Local Development**: `npm run dev` starts both frontend and backend
- **Hot Reload**: Vite middleware provides instant feedback
- **Database**: Drizzle migrations with `npm run db:push`

### Production Deployment
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Static Assets**: Frontend built to `dist/public` directory
- **Server**: Express serves both API and static files
- **Database**: PostgreSQL connection via environment variables

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment setting (development/production)
- **Port Configuration**: Configurable via Replit deployment settings

### Replit Integration
- **Autoscale Deployment**: Configured for Replit's autoscale platform
- **Port Mapping**: Local port 5000 mapped to external port 80
- **Build Commands**: Automated build and start scripts for deployment

## Changelog
- June 21, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.