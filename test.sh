#!/bin/bash
# TB Detection API - Quick Test Script
# Usage: Run from Eafia/api directory
# Tests all modules and ML model synchronization

echo "=========================================="
echo "TB Detection API - Test Suite"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000"
ML_SERVICE_URL="http://localhost:5000"
TIMEOUT=10

# Track test results
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local url=$3
  local data=$4
  local expected_code=$5

  echo -n "Testing: $name ... "
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" 2>&1)
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data" 2>&1)
  fi
  
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)
  
  if [ "$http_code" == "$expected_code" ] || [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
    ((FAILED++))
  fi
}

# Section 1: Health & Connectivity
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. HEALTH & CONNECTIVITY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "API Health" "GET" "$API_URL/" "" "200"
test_endpoint "API Swagger" "GET" "$API_URL/api" "" "200"

echo ""
echo -n "Testing: ML Service Health ... "
ml_response=$(curl -s -o /dev/null -w "%{http_code}" "$ML_SERVICE_URL/health" -H "Content-Type: application/json")
if [ "$ml_response" == "200" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (Is Python ML service running?)"
  ((FAILED++))
fi

# Section 2: Authentication
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. AUTHENTICATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Register admin user
REGISTER_DATA='{
  "email": "admin.test@tbdetection.com",
  "password": "TestPassword123!",
  "firstName": "Admin",
  "lastName": "Test",
  "role": "admin"
}'

test_endpoint "Register User" "POST" "$API_URL/api/auth/register" "$REGISTER_DATA" "201"

# Login
LOGIN_DATA='{
  "email": "admin.test@tbdetection.com",
  "password": "TestPassword123!"
}'

echo -n "Testing: User Login ... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (Could not extract token)"
  ((FAILED++))
fi

# Section 3: Users Module
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. USERS MODULE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -n "Testing: Get All Users ... "
USERS_RESPONSE=$(curl -s -X GET "$API_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$USERS_RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Section 4: Database
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. DATABASE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "Database Info" "GET" "$API_URL/api/health" "" "200"

# Section 5: ML Model Endpoints
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. ML MODEL INTEGRATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Sample base64 image (very small valid image)
TEST_IMAGE="/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAAIABAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z"

# Test X-Ray Validation (Direct ML Service)
echo -n "Testing: Direct ML X-Ray Validation ... "
VALIDATION_REQUEST="{\"image_base64\": \"$TEST_IMAGE\"}"
VALIDATION_RESPONSE=$(curl -s -X POST "$ML_SERVICE_URL/validate/xray" \
  -H "Content-Type: application/json" \
  -d "$VALIDATION_REQUEST" 2>&1)

if echo "$VALIDATION_RESPONSE" | grep -q "is_xray"; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (ML Service might not be running)"
  ((FAILED++))
fi

# Test TB Prediction (Direct ML Service)
echo -n "Testing: Direct ML TB Prediction ... "
PREDICTION_REQUEST="{\"image_base64\": \"$TEST_IMAGE\"}"
PREDICTION_RESPONSE=$(curl -s -X POST "$ML_SERVICE_URL/predict/tb" \
  -H "Content-Type: application/json" \
  -d "$PREDICTION_REQUEST" 2>&1)

if echo "$PREDICTION_RESPONSE" | grep -q "tb_detected"; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((FAILED++))
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TOTAL=$((PASSED + FAILED))
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
else
  echo -e "Failed: $FAILED"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}NEXT STEPS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "System is ready for:"
  echo "1. Create patients via /api/patients"
  echo "2. Upload X-rays via /api/xrays"
  echo "3. Run TB predictions via /api/predict/tb/base64"
  echo "4. View diagnosis results via /api/diagnosis-results"
  echo ""
  echo "For detailed testing, see: api.http and ML_SYNC_TESTING.md"
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Is Backend running?      pnpm start:dev"
  echo "2. Is ML Service running?    python cnn_models/api.py"
  echo "3. Is Database connected?    pnpm db:info"
  echo "4. Check logs for errors"
  echo ""
  echo "For detailed info: ML_SYNC_TESTING.md"
fi

echo ""
