#!/bin/bash

echo "🔍 FinBoost Gamification Feature Audit"
echo "======================================"
echo ""

# Check for core user pages
echo "📄 Core User Pages:"
echo "-------------------"
for page in Dashboard.tsx Overview.tsx Leaderboard.tsx Learning.tsx Home.tsx HomeV2Clean.tsx Predictions.tsx; do
    if [ -f "client/src/pages/$page" ]; then
        echo "✅ client/src/pages/$page"
    else
        echo "❌ client/src/pages/$page"
    fi
done
echo ""

# Check for key components
echo "🧩 Key Components:"
echo "------------------"
for comp in Header.tsx Quiz.tsx WinnerCelebration.tsx NotificationBanner.tsx; do
    if [ -f "client/src/components/$comp" ]; then
        echo "✅ client/src/components/$comp"
    else
        echo "❌ client/src/components/$comp"
    fi
done
echo ""

# Check for existing gamification components
echo "🎮 Existing Gamification Components:"
echo "-----------------------------------"
if [ -d "client/src/components/gamification" ]; then
    echo "✅ client/src/components/gamification/ directory exists"
    ls -la client/src/components/gamification/
else
    echo "❌ client/src/components/gamification/ directory"
fi
echo ""

# Scan for gamification-related terms in frontend
echo "🔍 Gamification Terms in Frontend:"
echo "----------------------------------"
terms=("ticket" "tickets" "streak" "quest" "quests" "referral" "referrals" "tier" "prediction" "debt" "reward")
for term in "${terms[@]}"; do
    count=$(find client/src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs grep -i "$term" 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "✅ '$term' found $count times"
        # Show a few examples
        find client/src -name "*.tsx" -o -name "*.ts" | xargs grep -i "$term" 2>/dev/null | head -3 | sed 's/^/   /'
        echo ""
    else
        echo "❌ '$term' not found"
    fi
done
echo ""

# Check for existing API routes
echo "🌐 Existing /api/me/* Routes:"
echo "-----------------------------"
if [ -f "server/routes.ts" ]; then
    echo "Found routes in server/routes.ts:"
    grep -n "/api/me" server/routes.ts | sed 's/^/   /'
else
    echo "❌ server/routes.ts not found"
fi
echo ""

# Check for points vs tickets terminology
echo "💰 Points vs Tickets Terminology:"
echo "---------------------------------"
points_count=$(find client/src -name "*.tsx" -o -name "*.ts" | xargs grep -i "points\?" 2>/dev/null | wc -l)
tickets_count=$(find client/src -name "*.tsx" -o -name "*.ts" | xargs grep -i "tickets\?" 2>/dev/null | wc -l)
echo "   'Points' references: $points_count"
echo "   'Tickets' references: $tickets_count"
echo ""

# Check for existing user data fetching
echo "📊 User Data Fetching Patterns:"
echo "------------------------------"
echo "Looking for useQuery/fetch patterns:"
find client/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "useQuery\|useMutation\|fetch.*api" 2>/dev/null | head -5 | sed 's/^/   /'
echo ""

# Check for authentication patterns
echo "🔐 Authentication Setup:"
echo "-----------------------"
if [ -f "client/src/lib/queryClient.ts" ]; then
    echo "✅ client/src/lib/queryClient.ts exists"
else
    echo "❌ client/src/lib/queryClient.ts"
fi

auth_files=$(find client/src -name "*auth*" -o -name "*Auth*" 2>/dev/null)
if [ -n "$auth_files" ]; then
    echo "Auth-related files found:"
    echo "$auth_files" | sed 's/^/   /'
else
    echo "❌ No obvious auth files found"
fi
echo ""

echo "🏁 Audit Complete!"
echo "=================="