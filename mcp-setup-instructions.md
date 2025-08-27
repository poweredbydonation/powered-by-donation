# Supabase MCP Server Setup Instructions

## Overview
This MCP (Model Context Protocol) server allows AI tools like Cursor, Claude, and VS Code Copilot to connect directly with your Supabase database for "Powered by Donation".

## Project Details
- **Project Reference**: `ktwlhjgomcbbjynfefys`
- **Supabase URL**: `https://ktwlhjgomcbbjynfefys.supabase.co`
- **Configuration**: Read-only, project-scoped for security

## Setup Steps

### 1. Create Personal Access Token
1. Go to [Supabase Settings](https://supabase.com/dashboard/account/tokens)
2. Click "Generate new token"
3. Name it: "MCP Server - Powered by Donation"
4. Copy the generated token

### 2. Update Configuration
Edit `mcp-server-config.json` and replace `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your actual token.

### 3. Integration with AI Tools

#### For Cursor IDE:
Add this to your Cursor settings (`~/.cursor/settings.json`):
```json
{
  "mcpServers": {
    "powered-by-donation-supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=ktwlhjgomcbbjynfefys"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_personal_access_token_here"
      }
    }
  }
}
```

#### For Claude Code:
Use the `mcp-server-config.json` file as reference for your Claude Code configuration.

#### For VS Code Copilot:
Add to your VS Code settings.json:
```json
{
  "mcp.servers": {
    "powered-by-donation-supabase": {
      "command": "npx",
      "args": [
        "-y", 
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=ktwlhjgomcbbjynfefys"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_personal_access_token_here"
      }
    }
  }
}
```

## Available Capabilities

### Database Operations (Read-Only)
- Query tables and views
- Inspect database schema
- Check table relationships
- View row counts and statistics
- Access RLS policies information

### Tables You Can Query
- `users` - Unified user system (fundraisers + donors)
- `services` - Service listings with platform awareness
- `service_requests` - Donation tracking with platform-specific references
- `justgiving_charity_cache` - JustGiving charity data (1737+ charities)
- `every_org_nonprofit_cache` - Every.org nonprofit data
- `acnc_organization_cache` - ACNC organization data

### Advanced Features
- Multi-platform filtering (JustGiving, Every.org, ACNC)
- Geographic and category-based queries
- Service workflow tracking
- Performance monitoring queries

## Security Features

### Read-Only Protection
- Server runs with `--read-only` flag
- Prevents any write operations
- Uses read-only PostgreSQL user

### Project Scoping
- Limited to project `ktwlhjgomcbbjynfefys` only
- Cannot access other Supabase projects
- Restricted to your organization's data

### Best Practices
- ✅ Use only with development environment
- ✅ Keep token secure and private
- ✅ Don't share configuration files
- ❌ Don't connect to production without approval
- ❌ Don't share access tokens

## Testing the Connection

### Command Line Test
```bash
npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=ktwlhjgomcbbjynfefys
```

### Example Queries to Try
1. "Show me the schema for the users table"
2. "How many active services are there?"
3. "What are the different service categories?"
4. "Show me recent service requests"
5. "What JustGiving charities are cached?"

## Troubleshooting

### Common Issues
1. **Token Invalid**: Regenerate token in Supabase settings
2. **Permission Denied**: Ensure read-only access is granted
3. **Connection Failed**: Check project reference is correct
4. **No Response**: Verify environment variables are set

### Support
- Check [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- Review [MCP Server GitHub](https://github.com/supabase-community/supabase-mcp)
- Contact: contact@poweredbydonation.com

## Database Schema Overview

### Core Architecture
Your database follows a **platform-first architecture** supporting:
- **JustGiving**: Live platform with 1737+ charities
- **Every.org**: Secondary platform integration
- **ACNC**: Australian charity compliance

### Key Relationships
```
users (fundraisers/donors)
  ├── services (skill offerings)
  │   └── service_requests (donation tracking)
  └── workflow tracking (happiness metrics)

organization_cache (unified view)
  ├── justgiving_charity_cache
  ├── every_org_nonprofit_cache
  └── acnc_organization_cache
```

This MCP server gives your AI tools direct access to understand and query your donation marketplace database structure and data.