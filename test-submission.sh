#!/bin/bash

# Test RMA Submission with Excel File

echo "================================================================================"
echo "RMA SUBMISSION TEST - FIELD EXTRACTION VERIFICATION"
echo "================================================================================"
echo ""

TEST_FILE="/Users/brandonin/scal rma dashboard/uploads/1762983015503_test_submit1.xlsx"

if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Test file not found: $TEST_FILE"
    exit 1
fi

echo "✓ Test file found"
echo "  File: $TEST_FILE"
echo ""

# Submit RMA
echo "Submitting RMA..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:3000/api/submit-rma \
  -F "companyName=TEST EXTRACTION VERIFICATION" \
  -F "companyEmail=test-extraction@scal.com" \
  -F "orderNumber=TEST-$(date +%s)" \
  -F "customerType=us" \
  -F "files=@$TEST_FILE")

REF_NUM=$(echo "$RESPONSE" | grep -o '"referenceNumber":"[^"]*"' | cut -d'"' -f4)

if [ -z "$REF_NUM" ]; then
    echo "❌ Failed to submit RMA"
    echo "$RESPONSE"
    exit 1
fi

echo "✓ RMA submitted successfully"
echo "  Reference: $REF_NUM"
echo ""

# Wait for processing
sleep 3

# Fetch submission details
echo "Fetching submission details..."
DETAILS=$(curl -s "http://127.0.0.1:3000/api/admin/submission/$REF_NUM")

# Extract first device data
IMEI=$(echo "$DETAILS" | jq -r '.devices[0].imei')
MODEL=$(echo "$DETAILS" | jq -r '.devices[0].model')
STORAGE=$(echo "$DETAILS" | jq -r '.devices[0].storage')
CONDITION=$(echo "$DETAILS" | jq -r '.devices[0].condition')
ISSUE=$(echo "$DETAILS" | jq -r '.devices[0].issue_description')
ISSUE_CAT=$(echo "$DETAILS" | jq -r '.devices[0].issue_category')
ACTION=$(echo "$DETAILS" | jq -r '.devices[0].requested_action')
UNIT_PRICE=$(echo "$DETAILS" | jq -r '.devices[0].unit_price')
REPAIR_COST=$(echo "$DETAILS" | jq -r '.devices[0].repair_cost')

echo ""
echo "================================================================================"
echo "FIELD EXTRACTION VERIFICATION - DEVICE #1"
echo "================================================================================"
echo ""

# Check each field
check_field() {
    local name=$1
    local value=$2
    local expected=$3
    
    if [ "$value" != "null" ] && [ ! -z "$value" ] && [ "$value" != "PENDING" ] && [ "$value" != "0" ]; then
        echo "✓ $name: $value"
        return 0
    else
        echo "❌ $name: [EMPTY]"
        return 1
    fi
}

EXTRACTED=0
check_field "IMEI              " "$IMEI" && ((EXTRACTED++))
check_field "Model             " "$MODEL" && ((EXTRACTED++))
check_field "Storage           " "$STORAGE" && ((EXTRACTED++))
check_field "Condition/Grade   " "$CONDITION" && ((EXTRACTED++))
check_field "Issue Description " "$ISSUE" && ((EXTRACTED++))
check_field "Issue Category    " "$ISSUE_CAT" && ((EXTRACTED++))
check_field "Requested Action  " "$ACTION" && ((EXTRACTED++))
check_field "Unit Price        " "$UNIT_PRICE" && ((EXTRACTED++))
check_field "Repair Cost       " "$REPAIR_COST" && ((EXTRACTED++))

echo ""
echo "================================================================================"
echo "EXTRACTION SUMMARY"
echo "================================================================================"
echo "✓ Extracted: $EXTRACTED/9 fields"
echo "❌ Empty:     $((9 - EXTRACTED))/9 fields"
echo ""

if [ $EXTRACTED -eq 9 ]; then
    echo "🎉 SUCCESS: All fields extracted correctly!"
    exit 0
elif [ $EXTRACTED -ge 5 ]; then
    echo "⚠️  PARTIAL: Some fields missing (need to fix)"
    exit 1
else
    echo "❌ FAILURE: Most fields not extracted"
    exit 1
fi
