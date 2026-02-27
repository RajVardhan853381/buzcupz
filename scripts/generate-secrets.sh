#!/bin/bash

# =============================================================================
# CAFEelevate - Generate Production Secrets
# =============================================================================
# This script generates secure random secrets for production deployment.
# Run this script once before deploying to production.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=============================================="
echo "  buzcupz - Production Secrets Generator"
echo "=============================================="
echo -e "${NC}"

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl is required but not installed.${NC}"
    echo "Please install openssl and try again."
    exit 1
fi

# Generate secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)

echo -e "${GREEN}Generated secure secrets:${NC}"
echo ""
echo -e "${YELLOW}# JWT Secrets (add to .env)${NC}"
echo "JWT_SECRET=\"${JWT_SECRET}\""
echo "JWT_REFRESH_SECRET=\"${JWT_REFRESH_SECRET}\""
echo ""
echo -e "${YELLOW}# Database Password${NC}"
echo "DB_PASSWORD=\"${DB_PASSWORD}\""
echo ""

# Ask if user wants to create a .env file
read -p "Would you like to create a .env file from .env.production.example? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f ".env" ]; then
        echo -e "${YELLOW}Warning: .env file already exists.${NC}"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Aborted. Secrets printed above - copy them manually.${NC}"
            exit 0
        fi
    fi

    if [ ! -f ".env.production.example" ]; then
        echo -e "${RED}Error: .env.production.example not found.${NC}"
        echo "Please ensure you're running this script from the project root."
        exit 1
    fi

    # Copy template and replace placeholders
    cp .env.production.example .env

    # Replace JWT secrets
    sed -i "s|<GENERATE_SECRET>|${JWT_SECRET}|" .env
    sed -i "0,/<GENERATE_SECRET>/s||${JWT_REFRESH_SECRET}|" .env
    
    # Replace DB password
    sed -i "s|<GENERATE_SECURE_PASSWORD>|${DB_PASSWORD}|" .env

    echo -e "${GREEN}Created .env file with generated secrets.${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: You still need to configure:${NC}"
    echo "  - DATABASE_URL (database host, user, name)"
    echo "  - REDIS_URL (redis host)"
    echo "  - CORS_ORIGINS (your domain)"
    echo "  - WEB_URL and BOOKING_URL"
    echo "  - DOMAIN and ACME_EMAIL (for TLS)"
    echo "  - Optional: SENDGRID, TWILIO, S3, SENTRY"
    echo ""
    echo -e "${RED}NEVER commit .env to version control!${NC}"
else
    echo ""
    echo -e "${BLUE}Copy the secrets above to your .env file manually.${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
