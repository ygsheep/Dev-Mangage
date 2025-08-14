# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevAPI Manager is a modern API management platform built as a monorepo with TypeScript. It provides intelligent search, Swagger import capabilities, and Model Context Protocol (MCP) integration for enhanced developer productivity.

**Core Architecture:**
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma + SQLite  
- **MCP Server**: Vector search + fuzzy search with transformers.js
- **Desktop**: Electron wrapper (optional)
- **Database**: SQLite with Prisma ORM

## Essential Commands

### Development Environment
```bash
# Start full development environment (recommended)
npm run dev                    # Auto-detects ports, starts backend + frontend
node start-dev.js             # Same as above with better error handling

# Individual services
npm run dev:backend           # Backend only (port 3001)
npm run dev:frontend          # Frontend only (port 5173) 
npm run dev:mcp              # MCP server only (port 3004)
```

### Database Operations
```bash
# Backend database commands
cd packages/backend
npm run db:generate          # Generate Prisma client
npm run db:push             # Push schema to database
npm run db:migrate          # Create and run migrations
npm run db:seed             # Seed database with sample data
npm run db:studio           # Open Prisma Studio
```

### Building & Testing
```bash
# Build commands
npm run build               # Build all packages
npm run build:backend      # Backend only
npm run build:frontend     # Frontend only

# Testing and code quality
npm run test               # Run all tests
npm run lint               # Lint all packages
npm run type-check         # TypeScript type checking
npm run format             # Format code with Prettier
```

### MCP Server Management
```bash
# MCP development
cd packages/mcp-server
npm run dev                # STDIO MCP server
npm run dev:http           # HTTP MCP server
HTTP_MCP_PORT=3004 npm run start:http  # Custom port
```

## Architecture Overview

### Monorepo Structure
The project uses npm workspaces with four main packages:

- `packages/backend/` - Express.js API server with integrated MCP HTTP service
- `packages/frontend/` - React SPA with API management UI
- `packages/mcp-server/` - Standalone MCP server with vector search
- `packages/shared/` - Shared TypeScript types and utilities

### Database Schema Design
The application uses a relational model centered around Projects:

**Core Entities:**
- `Project` - Root entity containing APIs, tags, and data models
- `API` - Individual API endpoints with method, path, status tracking
- `Tag` - Flexible categorization system with color coding
- `DatabaseTable/DatabaseField` - Database schema modeling from imported documents

**Key Relationships:**
- Projects contain multiple APIs and tags
- APIs can have multiple tags (many-to-many via APITag)
- Database tables belong to projects and contain fields/indexes
- Data model documents link to projects for AI parsing results

### MCP Integration Architecture
The project implements Model Context Protocol in two ways:

1. **Integrated MCP** (port 3001): HTTP MCP service built into the main backend
2. **Standalone MCP** (port 3004): Separate server with vector search capabilities

**MCP Tools Available:**
- `search_projects` - Fuzzy search across projects
- `search_apis` - Search APIs with filters (method, status, project)
- `search_tags` - Tag-based search with project scoping
- `global_search` - Cross-entity search with type filtering
- `get_search_suggestions` - Query autocompletion
- `get_recent_items` - Recently accessed items
- `refresh_search_index` - Manual index refresh

### Frontend State Management
- **React Query** for server state and caching
- **Zustand** for client-side state management
- **React Hook Form** with Zod validation for forms
- **React Hot Toast** for user notifications

### AI & Search Features
- **Vector Search**: Transformers.js with all-MiniLM-L6-v2 model
- **Fuzzy Search**: Fuse.js for fallback when vector models unavailable  
- **TF-IDF**: Text analysis for content similarity
- **RAG Integration**: Document parsing with multiple AI providers

## Development Patterns

### API Development
- RESTful endpoints follow `/api/v1/{resource}` pattern
- Consistent error handling with AppError class
- Request validation using express-validator and Zod
- Comprehensive logging with Winston (Chinese descriptions)

### Frontend Patterns
- Page components in `src/pages/` 
- Reusable UI components in `src/components/`
- API integration via React Query in `src/utils/api.ts`
- Unified import modal handles both Swagger and database document parsing

### Database Patterns
- UUID primary keys for all entities
- Soft deletes where applicable (status fields)
- Proper indexing on foreign keys and search fields
- Prisma schema extensions for full-text search

### MCP Development
- Tools defined with JSON Schema for parameter validation
- Error responses follow JSON-RPC 2.0 format  
- SSE support for real-time client connections
- Multiple transport types (HTTP, STDIO, WebSocket planning)

## Configuration Files

### Environment Setup
- Backend: `packages/backend/.env.development`
- Frontend: `packages/frontend/.env` 
- MCP: Environment variables for AI providers and database connections

### MCP Client Configuration
Cursor IDE configuration in `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "dev-manage-mcp-http": {
      "url": "http://localhost:3001",
      "transport": "http"
    }
  }
}
```

## Key Debugging Notes

### Port Management
- Backend auto-detects available ports starting from 3001
- Frontend always runs on 5173 (Vite default)
- MCP servers use 3004+ to avoid conflicts
- Use `netstat -ano | findstr ":300"` to check port usage

### Common Issues
- **Toast errors**: Use `toast.error()` not `toast.warning()` (react-hot-toast limitation)
- **Database sync**: Run `npm run db:push` after schema changes
- **MCP connection**: Check SSE headers and CORS settings for client compatibility
- **Build failures**: Ensure shared package is built first with `npm run build`

### Logging & Monitoring
- Backend logs to `packages/backend/logs/` with daily rotation
- MCP services include structured logging with Chinese messages
- Browser console shows React Query devtools in development
- Database queries logged in development mode

## Testing Strategy

### Backend Testing
- Jest with Supertest for API endpoint testing
- Prisma test database for isolation
- Mock external services (AI providers, file uploads)

### Frontend Testing
- Component testing with React Testing Library
- Integration tests for user workflows
- E2E testing for critical paths (project creation, API import)

### MCP Testing  
- Tool invocation tests with various parameter combinations
- Search accuracy testing with sample datasets
- Performance testing for vector search operations

This codebase emphasizes modern TypeScript patterns, comprehensive error handling, and scalable architecture suitable for both individual developers and team collaboration.