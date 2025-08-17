# CLAUDE Enhanced Development Guide

This comprehensive guide provides detailed instructions for Claude Code (claude.ai/code) when working with the DevAPI Manager codebase, including best practices, troubleshooting, and advanced development patterns.

## Project Overview

DevAPI Manager is a modern API management platform built as a monorepo with TypeScript. It provides intelligent search, Swagger import capabilities, and Model Context Protocol (MCP) integration for enhanced developer productivity.

**Core Architecture:**
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma + SQLite  
- **MCP Server**: Vector search + fuzzy search with transformers.js
- **Desktop**: Electron wrapper (optional)
- **Database**: SQLite with Prisma ORM

## Essential Commands

### NixOS 开发环境规则

本项目在 NixOS 环境下开发，需要遵循以下规则：

**命令执行规范：**
- 所有项目相关的 npm 脚本和工具命令都应使用 `npx` 前缀执行
- 这确保了使用项目本地安装的依赖版本，避免全局依赖冲突
- 特别重要的是 Prisma 相关命令，必须使用 `npx prisma` 而不是 `prisma`

**示例：**
```bash
# 正确的 NixOS 执行方式
npx prisma generate          # 而不是 prisma generate
npx prisma db push          # 而不是 prisma db push
npx tsx src/index.ts        # 而不是 tsx src/index.ts
npx vite build              # 而不是 vite build
```

**环境要求：**
- Node.js 18+ (通过 NixOS 配置管理)
- 项目依赖通过 npm install 安装在本地 node_modules
- 使用 npx 确保工具版本一致性和环境隔离

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
HTTP_MCP_PORT=3004 npm run start:http  # Custom port

# NixOS 环境下使用 npx 执行工具
npx tsx src/index.ts       # 运行 TypeScript 文件
npx vite build             # 构建前端项目
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

## Claude Code Workflow Guidelines

### Code Review and Recommendation Patterns
- **Architecture Analysis First**: Always analyze existing architecture and design patterns before suggesting modifications
- **Multiple Solution Approaches**: Provide multiple implementation options with clear pros/cons analysis
- **Maintainability Focus**: Prioritize code maintainability, performance, and security in all recommendations
- **Consistency Adherence**: Follow existing coding standards and architectural decisions in the project

### Incremental Implementation Strategy
- **Feature Decomposition**: Break large features into small, testable incremental updates
- **Core-First Approach**: Implement core functionality first, then add auxiliary features
- **Testing Integration**: Provide testing suggestions and verification steps after each modification
- **Progressive Enhancement**: Build features incrementally with clear rollback points

### Code Quality Standards

#### TypeScript Best Practices
- **Strict Typing**: Use strict type definitions, avoid `any` type usage
- **Generic Utilization**: Leverage generics for improved code reusability
- **Interface Design**: Follow open-closed principle in interface design
- **Error Type Management**: Define and handle error types explicitly

#### Security Considerations
- **API Key Security**: Secure storage and rotation of AI API keys
- **Input Validation**: Comprehensive user input validation and sanitization
- **SQL Injection Prevention**: Implement robust SQL injection protection measures
- **Sensitive Data Encryption**: Encrypt sensitive data at rest and in transit

## Development Patterns

### API Development
- RESTful endpoints follow `/api/v1/{resource}` pattern
- Consistent error handling with AppError class
- Request validation using express-validator and Zod
- Comprehensive logging with Winston (Chinese descriptions)

**AI Service API Endpoints:**
- `/api/v1/ai/health` - AI service health status
- `/api/v1/ai/providers` - Available AI providers
- `/api/v1/ai/parse/document` - Single document parsing
- `/api/v1/ai/parse/batch` - Batch document parsing
- `/api/v1/ai/batch/import` - Create batch import job
- `/api/v1/ai/batch/status/:jobId` - Job status monitoring
- `/api/v1/ai/generate/sql` - AI-enhanced SQL generation
- `/api/v1/ai/generate/migration` - Migration script generation
- `/api/v1/ai/templates/*` - Code template management
- `/api/v1/ai/optimize/schema/:projectId` - Database optimization
- `/api/v1/ai/validate/model` - Data model validation

### Frontend Patterns
- Page components in `src/pages/` 
- Reusable UI components in `src/components/`
- API integration via React Query in `src/utils/api.ts`
- Unified import modal handles both Swagger and database document parsing

**AI Component Architecture:**
- `AIDocumentParser` - Smart document analysis with provider selection
- `BatchImportManager` - Multi-document processing with job monitoring
- `SQLGenerator` - Enhanced with AI generation and template support
- `CodeTemplateManager` - Template creation, editing, and rendering

### AI Development Patterns
- Adapter pattern for multiple AI provider integration
- Event-driven architecture for long-running batch operations
- Template engine with variable substitution and conditional logic
- Comprehensive error handling with fallback mechanisms
- Real-time progress tracking with WebSocket/SSE support

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

## AI Service Integration Standards

### New AI Provider Integration Workflow
1. **Interface Implementation**: Implement the `AIProvider` interface with all required methods
2. **Configuration Validation**: Add configuration validation and health check endpoints
3. **Error Handling**: Implement comprehensive error handling and retry mechanisms
4. **Usage Tracking**: Add usage statistics and cost tracking capabilities
5. **Testing Suite**: Write unit tests and integration tests for the new provider

### Prompt Engineering Best Practices
- **Structured Template Design**: Create reusable, structured prompt templates
- **Context Length Management**: Implement strategies for managing context window limits
- **Response Format Standardization**: Ensure consistent response formats across providers
- **Multi-turn Conversation**: Manage state for multi-turn conversations effectively

## Troubleshooting and Problem Resolution

### Common Development Issues

#### Environment Setup Problems
- **Port Conflicts**: 
  ```bash
  # Check port usage
  netstat -ano | findstr ":3001"
  # Kill process using port
  taskkill /PID <PID> /F
  ```
- **Dependency Installation Failures**:
  ```bash
  # Clear npm cache
  npm cache clean --force
  # Delete node_modules and reinstall
  rm -rf node_modules package-lock.json
  npm install
  ```
- **Database Connection Issues**:
  ```bash
  # Reset database (NixOS 环境)
  npx prisma db push --force-reset
  # Regenerate Prisma client (NixOS 环境)
  npx prisma generate
  ```
- **MCP Service Unresponsive**:
  ```bash
  # Check MCP service status
  curl http://localhost:3001/health
  # Restart MCP service
  npm run dev:mcp
  ```

#### Performance Optimization Guidelines
- **Database Query Optimization**: Use Prisma query optimization and proper indexing
- **React Component Performance**: Implement React.memo, useMemo, and useCallback appropriately
- **MCP Search Index Optimization**: Regular index refresh and efficient search algorithms
- **AI Service Response Time**: Implement caching and request batching for AI services

### Error Handling Strategies
- **Graceful Degradation**: Implement fallback mechanisms for all critical services
- **Circuit Breaker Pattern**: Prevent cascading failures with circuit breakers
- **Comprehensive Logging**: Use structured logging with correlation IDs
- **User-Friendly Error Messages**: Provide clear, actionable error messages to users

## Scalability and Extension Guidelines

### Plugin Architecture Design
- **Standardized MCP Tool Development**: Follow consistent patterns for new MCP tools
- **Third-party Integration Interface**: Design clean APIs for external integrations
- **Configuration-driven Feature Flags**: Enable/disable features through configuration
- **Hot-swappable Component Support**: Design components for runtime replacement

### Database Evolution Strategy
- **Version Control and Migration**: Implement robust database version control
- **Sharding and Index Optimization**: Plan for horizontal scaling with proper indexing
- **Caching Layer Design**: Implement multi-level caching strategies
- **Read-Write Separation**: Configure read replicas for improved performance

## Production Deployment Guide

### Docker Containerization
```dockerfile
# Multi-stage build optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variable Management
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=file:./prod.db
AI_SERVICE_ENDPOINT=https://api.openai.com
LOG_LEVEL=info
```

### Health Check Configuration
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      ai: 'available',
      mcp: 'running'
    }
  });
});
```

### Monitoring and Alerting
- **Key Performance Indicators (KPIs)**: Define and monitor critical metrics
- **Error Rate and Response Time Monitoring**: Set up comprehensive monitoring
- **Resource Usage Tracking**: Monitor CPU, memory, and disk usage
- **Automated Alert Configuration**: Configure alerts for critical thresholds

## Team Collaboration Standards

### Git Workflow
- **Branch Naming Convention**: 
  - `feature/feature-name` for new features
  - `bugfix/issue-description` for bug fixes
  - `hotfix/critical-issue` for production fixes
- **Commit Message Format**:
  ```
  type(scope): description
  
  - feat: new feature
  - fix: bug fix
  - docs: documentation changes
  - style: formatting changes
  - refactor: code refactoring
  - test: adding tests
  - chore: maintenance tasks
  ```

### Code Review Checklist
- [ ] Code follows project style guidelines
- [ ] All tests pass and coverage is maintained
- [ ] Documentation is updated appropriately
- [ ] Security considerations are addressed
- [ ] Performance implications are considered
- [ ] Breaking changes are properly documented

### Documentation Maintenance
- **API Documentation**: Auto-generate API docs from code annotations
- **Architecture Decision Records (ADR)**: Document significant architectural decisions
- **Changelog Maintenance**: Keep detailed changelog for all releases
- **User Manual Updates**: Maintain user-facing documentation

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
    "dev-manage-mcp-http": {
      "url": "http://localhost:3001",
      "transport": "http"
    }
  }
}
```

## Advanced Debugging and Monitoring

### Port Management
- Backend auto-detects available ports starting from 3001
- Frontend always runs on 5173 (Vite default)
- MCP servers use 3004+ to avoid conflicts
- Use `netstat -ano | findstr ":300"` to check port usage

### Common Issues Resolution
- **Toast errors**: Use `toast.error()` not `toast.warning()` (react-hot-toast limitation)
- **Database sync**: Run `npx prisma db push` after schema changes (NixOS 环境)
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

### AI Service Testing
- Mock AI provider responses for consistent testing
- Test prompt template rendering and validation
- Verify error handling and fallback mechanisms
- Performance testing for batch operations

This enhanced codebase emphasizes modern TypeScript patterns, comprehensive error handling, scalable architecture, robust security practices, and efficient team collaboration workflows suitable for both individual developers and large-scale team environments.

## Security Best Practices

### API Security
- Implement rate limiting for all public endpoints
- Use HTTPS for all communications
- Validate and sanitize all user inputs
- Implement proper authentication and authorization

### Data Protection
- Encrypt sensitive data at rest and in transit
- Implement proper access controls
- Regular security audits and dependency updates
- Secure API key management and rotation

### AI Service Security
- Validate AI responses before processing
- Implement content filtering for AI-generated content
- Monitor AI service usage and costs
- Secure storage of conversation history and context

This comprehensive guide provides the foundation for robust, scalable, and secure development practices when working with the DevAPI Manager platform.


# replay in chinese

No matter what language the input content involves (such as English, Japanese, etc.), do not translate proper nouns. Please reply in Simplified Chinese throughout, ensure that the output is purely in Chinese, and avoid mixing in vocabulary or code from other languages.