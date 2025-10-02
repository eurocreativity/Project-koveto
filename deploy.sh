#!/bin/bash

################################################################################
# Project Tracker - Deployment Script
# Description: Automated deployment script for ISPConfig production environment
# Usage: ./deploy.sh [backend|frontend|full]
################################################################################

set -e  # Exit on any error

# Configuration (CHANGE THESE VALUES)
SERVER_USER="project-tracker"
SERVER_HOST="server.example.com"
REMOTE_BACKEND_PATH="~/private/backend"
REMOTE_FRONTEND_PATH="~/web"
LOCAL_BACKEND_PATH="./backend"
LOCAL_FRONTEND_PATH="./frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} ${1}${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Deploy Backend
deploy_backend() {
    print_header "Backend Deployment"

    print_info "Packaging backend files..."
    cd "$LOCAL_BACKEND_PATH"

    # Create tarball (exclude node_modules, test files, logs)
    tar -czf backend-deploy.tar.gz \
        --exclude=node_modules \
        --exclude=test-results \
        --exclude=logs \
        --exclude=.env \
        --exclude=.env.example \
        --exclude=playwright-report \
        --exclude=*.spec.js \
        --exclude=test-server.js \
        src/ package.json package-lock.json ecosystem.config.js

    print_success "Backend package created: backend-deploy.tar.gz"

    print_info "Uploading to server..."
    scp backend-deploy.tar.gz "${SERVER_USER}@${SERVER_HOST}:${REMOTE_BACKEND_PATH}/"
    print_success "Upload complete"

    print_info "Deploying on server..."
    ssh "${SERVER_USER}@${SERVER_HOST}" << 'ENDSSH'
        cd ~/private/backend

        # Stop PM2
        echo "Stopping PM2 process..."
        pm2 stop project-tracker-api || true

        # Extract files
        echo "Extracting files..."
        tar -xzf backend-deploy.tar.gz
        rm backend-deploy.tar.gz

        # Install dependencies
        echo "Installing dependencies..."
        npm install --production

        # Restart PM2
        echo "Restarting PM2 process..."
        pm2 restart project-tracker-api --env production

        # Show status
        pm2 status
        pm2 logs project-tracker-api --lines 20 --nostream
ENDSSH

    print_success "Backend deployment complete!"

    # Cleanup local tarball
    rm backend-deploy.tar.gz
    cd ..
}

# Deploy Frontend
deploy_frontend() {
    print_header "Frontend Deployment"

    print_info "Uploading frontend files..."
    scp "${LOCAL_FRONTEND_PATH}/index.html" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_FRONTEND_PATH}/"

    print_success "Frontend deployment complete!"
}

# Full Deployment
deploy_full() {
    print_header "Full Deployment (Backend + Frontend)"
    deploy_backend
    echo ""
    deploy_frontend
    echo ""
    print_success "Full deployment complete!"
}

# Health Check
health_check() {
    print_header "Health Check"

    print_info "Checking backend health..."
    ssh "${SERVER_USER}@${SERVER_HOST}" << 'ENDSSH'
        echo "PM2 Status:"
        pm2 status

        echo ""
        echo "Backend Health Check:"
        curl -s http://localhost:3001/api/health | python3 -m json.tool || echo "Health check failed"

        echo ""
        echo "Recent logs:"
        pm2 logs project-tracker-api --lines 10 --nostream
ENDSSH
}

# Show Usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  backend       Deploy backend only"
    echo "  frontend      Deploy frontend only"
    echo "  full          Deploy both backend and frontend"
    echo "  health        Check server health"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backend"
    echo "  $0 full"
    echo ""
}

# Main script
main() {
    case "$1" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        full)
            deploy_full
            ;;
        health)
            health_check
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            print_error "Invalid command: $1"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Check if command provided
if [ $# -eq 0 ]; then
    print_error "No command provided"
    usage
    exit 1
fi

# Run main function
main "$@"
