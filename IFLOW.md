# IFLOW.md

This file provides guidance to iFlow Cli when working with code in this repository.

## Project Overview

DevAPI Manager is a modern API management platform built as a monorepo with TypeScript. It provides intelligent search, Swagger import capabilities, and Model Context Protocol (MCP) integration for enhanced developer productivity.

**Core Architecture:**

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma + SQLite
- **MCP Server**: Vector search + fuzzy search with transformers.js
- **Desktop**: Electron wrapper (optional)
- **Database**: SQLite with Prisma ORM

## Essential Commands

### NixOS Development Environment Rules

This project is developed in a NixOS environment and follows specific rules:

**Command Execution Standards:**

- All project-related npm scripts and tools should be executed with the `npx` prefix
- This ensures the use of locally installed dependency versions, avoiding global dependency conflicts
- Particularly important for Prisma-related commands, which must use `npx prisma` instead of `prisma`

**Examples:**

```bash
# Correct NixOS execution method
npx prisma generate          # Instead of prisma generate
npx prisma db push          # Instead of prisma db push
npx tsx src/index.ts        # Instead of tsx src/index.ts
npx vite build              # Instead of vite build
```

**Environment Requirements:**

- Node.js 18+ (managed through NixOS configuration)
- Project dependencies installed locally in node_modules via npm install
- Using npx ensures version consistency and environment isolation

### Development Environment

```bash
# Start full development environment (recommended)
npm run dev                    # Auto-detects ports, starts backend + frontend
node start-dev.js             # Same as above with better error handling

# Individual services
npm run dev:backend           # Backend only (port 3000)
npm run dev:frontend          # Frontend only (port 5173)
npm run dev:mcp              # MCP server only (port 3000)
```

### Database Operations

```bash
# Backend database commands
cd packages/backend
npx prisma generate          # Generate Prisma client
npx prisma db push          # Push schema to database
npx prisma migrate dev      # Create and run migrations
npx prisma db seed          # Seed database with sample data
npx prisma studio           # Open Prisma Studio
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
HTTP_MCP_PORT=3000 npm run start:http  # Custom port

# In NixOS environment, use npx to execute tools
npx tsx src/index.ts       # Run TypeScript files
npx vite build             # Build frontend project
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

1. **Integrated MCP** (port 3000): HTTP MCP service built into the main backend
2. **Standalone MCP** (port 3000): Separate server with vector search capabilities

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

### AI Integration Architecture (Phase 2-3 Complete)

The platform now includes comprehensive AI-driven capabilities:

**AI Service Framework:**

- Multi-provider adapter system (OpenAI, DeepSeek, Ollama, etc.)
- Unified API abstraction layer with consistent interfaces
- Dynamic provider switching and health monitoring
- Usage statistics and cost tracking

**Document Intelligence:**

- Smart document parsing for Markdown, SQL, Excel, Word, PDF, JSON
- Result validation and auto-correction mechanisms
- Batch import workflow with job queue management
- Event-driven processing with real-time progress tracking

**SQL Code Generation:**

- Multi-database dialect support (MySQL, PostgreSQL, SQLite, SQL Server, Oracle)
- AI-enhanced SQL generation with context awareness
- Migration script generation with rollback support
- Code template management system with built-in and custom templates
- Database optimization suggestions and index recommendations

**Frontend Integration:**

- React components for AI document parsing and batch import
- Enhanced SQL generator with AI capabilities
- Real-time job monitoring and progress tracking
- Template management interface

## Configuration Management

### Environment Setup

- Backend: `packages/backend/.env.development`
- Frontend: `packages/frontend/.env`
- MCP: Environment variables for AI providers and database connections

### MCP Client Configuration

Cursor IDE configuration in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "dev-manage-mcp-stdio": {
      "command": "node",
      "args": ["D:\\develop\\Web\\uniapp\\Dev-Mangage\\packages\\mcp-server\\dist\\index.js"],
      "transport": "stdio",
      "env": {
        "NODE_ENV": "production",
        "DATABASE_URL": "file:D:/develop/Web/uniapp/Dev-Mangage/packages/backend/prisma/dev.db"
      }
    },
    "dev-manage-mcp-http": {
      "url": "http://localhost:3000",
      "transport": "http"
    },
    "dev-manage-mcp-http-standalone": {
      "url": "http://localhost:3000",
      "transport": "http",
      "description": "Standalone MCP server for testing"
    }
  }
}
```

## Key Technologies

- **Backend**: Node.js, Express, Prisma ORM, SQLite
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **MCP Server**: Node.js, Transformers.js, FAISS
- **Desktop**: Electron
- **Database**: SQLite (development), PostgreSQL (production)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest (backend), React Testing Library (frontend)
- **Build Tools**: TypeScript, Vite, Electron Builder

## Project Structure

```
packages/
├── backend/           # REST API service
├── frontend/          # React web application
├── desktop/           # Electron desktop application
├── mcp-server/        # MCP-compatible search server
└── shared/            # Shared types and utilities
```

Each package has its own `package.json` with specific dependencies and scripts.
