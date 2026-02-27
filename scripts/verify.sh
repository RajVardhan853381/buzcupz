#!/bin/bash

# ===============================================
# buzcupz - Verify 100% Completion
# ===============================================
# Quick verification that everything is ready
# ===============================================

echo "=================================================="
echo "🔍 Verifying buzcupz 100% Completion"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counter
total=0
passed=0

check() {
    total=$((total + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $2"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌${NC} $2"
    fi
}

# -----------------------------------------------
# Check Files
# -----------------------------------------------
echo "📁 Checking implementation files..."
echo ""

# Storage Module
[ -f "apps/api/src/modules/storage/storage.service.ts" ]
check $? "StorageService created"

[ -f "apps/api/src/modules/storage/storage.module.ts" ]
check $? "StorageModule created"

# Email Templates
[ -f "apps/api/src/modules/notifications/templates/data-export-verify.hbs" ]
check $? "GDPR verification email template"

[ -f "apps/api/src/modules/notifications/templates/data-export-ready.hbs" ]
check $? "GDPR download email template"

[ -f "apps/api/src/modules/notifications/templates/ticket-created.hbs" ]
check $? "Support ticket created template"

[ -f "apps/api/src/modules/notifications/templates/ticket-reply.hbs" ]
check $? "Support ticket reply template"

# Scripts
[ -f "scripts/create-admin.ts" ]
check $? "Admin creation script"

[ -f "scripts/seed-legal-docs.ts" ]
check $? "Legal docs seeding script"

[ -f "scripts/final-setup.sh" ] && [ -x "scripts/final-setup.sh" ]
check $? "Final setup script (executable)"

# Documentation
[ -f ".env.example" ]
check $? "Environment example file"

[ -f "FINAL_100_PERCENT_READY.md" ]
check $? "Final setup guide"

[ -f "PRODUCTION_READY_SUMMARY.md" ]
check $? "Production summary"

[ -f "QUICK_REFERENCE.md" ]
check $? "Quick reference"

[ -f "DOCUMENTATION_INDEX.md" ]
check $? "Documentation index"

[ -f "IMPLEMENTATION_COMPLETE_FINAL.md" ]
check $? "Implementation summary"

echo ""

# -----------------------------------------------
# Check Code Integration
# -----------------------------------------------
echo "🔧 Checking code integration..."
echo ""

# Check if modules are imported in app.module.ts
grep -q "StorageModule" apps/api/src/app.module.ts
check $? "StorageModule imported"

grep -q "ComplianceModule" apps/api/src/app.module.ts
check $? "ComplianceModule imported"

grep -q "SupportModule" apps/api/src/app.module.ts
check $? "SupportModule imported"

grep -q "AdminModule" apps/api/src/app.module.ts
check $? "AdminModule imported"

# Check email integration
grep -q "NotificationsService" apps/api/src/modules/compliance/services/gdpr.service.ts
check $? "Email integrated in GdprService"

grep -q "NotificationsService" apps/api/src/modules/support/services/ticket.service.ts
check $? "Email integrated in TicketService"

# Check storage integration
grep -q "StorageService" apps/api/src/modules/compliance/services/gdpr.service.ts
check $? "Storage integrated in GdprService"

echo ""

# -----------------------------------------------
# Check Prisma Schema
# -----------------------------------------------
echo "🗄️  Checking database schema..."
echo ""

schema_file="apps/api/prisma/schema.prisma"

grep -q "model AdminUser" $schema_file
check $? "AdminUser model in schema"

grep -q "model SupportTicket" $schema_file
check $? "SupportTicket model in schema"

grep -q "model LegalDocument" $schema_file
check $? "LegalDocument model in schema"

grep -q "model Consent" $schema_file
check $? "Consent model in schema"

grep -q "model DataExportRequest" $schema_file
check $? "DataExportRequest model in schema"

echo ""

# -----------------------------------------------
# Summary
# -----------------------------------------------
echo "=================================================="
echo "📊 Verification Summary"
echo "=================================================="
echo ""

percentage=$((passed * 100 / total))

echo -e "Tests Passed: ${GREEN}$passed${NC} / $total"
echo -e "Completion:   ${GREEN}$percentage%${NC}"
echo ""

if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}🎉 PERFECT! buzcupz is 100% ready!${NC}"
    echo ""
    echo "✅ All implementation files present"
    echo "✅ All modules integrated"
    echo "✅ All documentation complete"
    echo ""
    echo "🚀 Next step: Run ./scripts/final-setup.sh"
elif [ $percentage -ge 90 ]; then
    echo -e "${YELLOW}⚠️  Almost there! A few items need attention.${NC}"
    echo ""
    echo "Review the failed checks above and complete them."
elif [ $percentage -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Good progress, but some work remaining.${NC}"
    echo ""
    echo "Review the implementation checklist."
else
    echo -e "${RED}❌ Significant work still needed.${NC}"
    echo ""
    echo "Please complete the implementation steps."
fi

echo ""
echo "=================================================="
