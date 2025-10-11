#!/bin/bash

# Smoke test script for PRD API endpoints
# Usage: ./test-prd-endpoints.sh [base_url] [auth_token]

BASE_URL="${1:-http://localhost:5173}"
AUTH_TOKEN="${2:-}"

echo "🧪 PRD API Endpoint Smoke Tests"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

if [ -z "$AUTH_TOKEN" ]; then
    echo "⚠️  No auth token provided. Tests will fail if auth is required."
    echo "Usage: ./test-prd-endpoints.sh [base_url] [auth_token]"
    echo ""
fi

# Test 1: Get PRD Templates
echo "📋 Test 1: GET /api/prd-templates"
echo "-----------------------------------"
if [ -z "$AUTH_TOKEN" ]; then
    curl -X GET "$BASE_URL/api/prd-templates" \
         -H "Content-Type: application/json" \
         -w "\nStatus: %{http_code}\n" \
         -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"
else
    curl -X GET "$BASE_URL/api/prd-templates" \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer $AUTH_TOKEN" \
         -w "\nStatus: %{http_code}\n" \
         -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"
fi
echo ""
echo ""

# Test 2: Generate PRD
echo "📝 Test 2: POST /api/generate-prd"
echo "-----------------------------------"
TEST_PAYLOAD='{
  "templateId": "test-template-id",
  "projectName": "Test Project",
  "projectType": "web-app",
  "userInput": {
    "description": "A test application for smoke testing",
    "goals": ["Goal 1", "Goal 2"],
    "targetAudience": "Developers"
  }
}'

if [ -z "$AUTH_TOKEN" ]; then
    curl -X POST "$BASE_URL/api/generate-prd" \
         -H "Content-Type: application/json" \
         -d "$TEST_PAYLOAD" \
         -w "\nStatus: %{http_code}\n" \
         -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"
else
    curl -X POST "$BASE_URL/api/generate-prd" \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer $AUTH_TOKEN" \
         -d "$TEST_PAYLOAD" \
         -w "\nStatus: %{http_code}\n" \
         -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"
fi
echo ""
echo ""

# Test 3: Export PRD (Markdown)
echo "📄 Test 3: POST /api/export-prd (markdown)"
echo "-----------------------------------"
EXPORT_PAYLOAD='{
  "documentId": "test-doc-id",
  "format": "markdown"
}'

if [ -z "$AUTH_TOKEN" ]; then
    curl -X POST "$BASE_URL/api/export-prd" \
         -H "Content-Type: application/json" \
         -d "$EXPORT_PAYLOAD" \
         -w "\nStatus: %{http_code}\n" \
         -s
else
    curl -X POST "$BASE_URL/api/export-prd" \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer $AUTH_TOKEN" \
         -d "$EXPORT_PAYLOAD" \
         -w "\nStatus: %{http_code}\n" \
         -s
fi
echo ""
echo ""

echo "✅ Smoke tests completed!"
echo ""
echo "Expected results:"
echo "- Status 200: Success"
echo "- Status 401: Unauthorized (need auth token)"
echo "- Status 404: Endpoint not found"
echo "- Status 500: Server error"
echo ""
echo "To get an auth token:"
echo "1. Start dev server: npm run dev"
echo "2. Log in to the app"
echo "3. Open browser console and run:"
echo "   localStorage.getItem('supabase.auth.token')"
echo "4. Re-run with token:"
echo "   ./test-prd-endpoints.sh http://localhost:5173 YOUR_TOKEN"
