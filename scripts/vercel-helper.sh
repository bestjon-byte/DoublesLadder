#!/bin/bash

# Vercel Helper Script - Easy deployment and log checking
# Usage: ./scripts/vercel-helper.sh [deploy|logs|status|setup]

set -e

case "$1" in
  "setup")
    echo "🔧 Setting up Vercel CLI..."
    npm i -g vercel
    vercel login
    vercel link
    echo "✅ Vercel setup complete!"
    ;;

  "deploy")
    echo "🚀 Building app for deployment..."
    npm run build
    echo ""
    echo "⚠️  Vercel CLI deployment disabled - using GitHub auto-deploy"
    echo "💡 To deploy: Push to GitHub and auto-deploy will handle it"
    echo "   ./deploy (recommended)"
    echo "   git push (manual)"
    ;;

  "logs")
    echo "📋 Fetching deployment logs..."
    vercel logs
    ;;

  "status")
    echo "📊 Checking project status..."
    vercel ls
    vercel inspect
    ;;

  *)
    echo "Vercel Helper - Tennis Ladder App"
    echo "================================="
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup   - Install and configure Vercel CLI"
    echo "  deploy  - Build and deploy to production"
    echo "  logs    - View deployment logs"
    echo "  status  - Check project status"
    echo ""
    echo "Examples:"
    echo "  $0 setup    # First time setup"
    echo "  $0 deploy   # Deploy current code"
    echo "  $0 logs     # Check what happened"
    ;;
esac