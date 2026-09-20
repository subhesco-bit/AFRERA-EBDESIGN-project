#!/bin/bash

echo "🔍 FINDING THE MISSING 1% (≈67 components)"
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "Current totals:"
echo "  Frontend: 2938"
echo "  Backend: 3212"
echo "  Platform: 503"
echo "  ─────────────"
echo "  Subtotal: 6653"
echo ""

echo "Calculating percentages:"
echo "  Frontend: 2938 / 6653 = 44.14%"
echo "  Backend: 3212 / 6653 = 48.27%"
echo "  Platform: 503 / 6653 = 7.56%"
echo "  ─────────────────────────"
echo "  Total: 99.97% ≈ 100%"
echo ""

echo "MISSING 1% = ~67 components"
echo ""

# Components not yet counted:
echo "COMPONENTS NOT YET COUNTED:"
INDEX=$(find backend/src -name "index.js" 2>/dev/null | wc -l)
echo "  • Index files (backend): $INDEX"

TYPE_DEFS=$(find backend/src -name "*.d.ts" -o -name "*types.js" 2>/dev/null | wc -l)
echo "  • Type definitions: $TYPE_DEFS"

MIGRATIONS=$(find backend/src/database/migrations -name "*.sql" 2>/dev/null | wc -l)
echo "  • Database migrations: $MIGRATIONS"

SEEDS=$(find backend/src/database -name "*seed*" 2>/dev/null | wc -l)
echo "  • Seed files: $SEEDS"

ENV_CONFIGS=$(find backend -name ".env*" 2>/dev/null | wc -l)
echo "  • Environment configs: $ENV_CONFIGS"

CONSTANTS=$(find backend/src -name "*constants*" -o -name "*enums*" 2>/dev/null | wc -l)
echo "  • Constants/Enums: $CONSTANTS"

UTILS=$(find backend/src -name "*utils*" -o -name "*helpers*" 2>/dev/null | wc -l)
echo "  • Utils/Helpers: $UTILS"

API_CONTRACTS=$(find backend/src -name "*contract*" -o -name "*schema*" -o -name "*interface*" 2>/dev/null | wc -l)
echo "  • API Contracts: $API_CONTRACTS"

