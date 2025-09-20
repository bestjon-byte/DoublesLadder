# Credentials Setup Guide

⚠️ **IMPORTANT**: This project requires environment variables for secure operation.

## Required Environment Variables

Create a `.env.local` file in the project root with:

```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## MCP Configuration (Optional)

If you're using Claude Code with MCP, create a `.mcp.json` file:

```bash
cp .mcp.json.example .mcp.json
```

Then edit `.mcp.json` and replace the placeholder values:
- `YOUR_PROJECT_REF_HERE` → Your Supabase project reference
- `YOUR_ACCESS_TOKEN_HERE` → Your Supabase access token

## Security Notes

- **Never commit** `.env.local` or `.mcp.json` to git
- These files are already in `.gitignore`
- Access tokens have admin privileges - keep them secure
- For production deployment, use platform-specific environment variable management

## Getting Your Credentials

1. **Supabase URL & Anon Key**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key

2. **Access Token** (for MCP only):
   - Go to Supabase Account Settings
   - Generate a new access token
   - Use for local development only