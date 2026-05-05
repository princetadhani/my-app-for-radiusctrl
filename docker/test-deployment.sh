#!/bin/bash

##############################################################################
# FreeRADIUS Control Panel - Deployment Test Script
# This script verifies that the Docker container is working correctly
##############################################################################

set -e

echo "============================================"
echo "FreeRADIUS Control Panel - Deployment Tests"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONTAINER_NAME="freeradius-control"
FAILED_TESTS=0
PASSED_TESTS=0

# Helper functions
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED_TESTS++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED_TESTS++))
}

warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

test_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST: $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

##############################################################################
# Test 1: Container Status
##############################################################################
test_header "Container Status"

if sudo docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    pass "Container is running"
    
    # Check uptime
    UPTIME=$(sudo docker ps --filter name=${CONTAINER_NAME} --format '{{.Status}}')
    echo "   Status: $UPTIME"
else
    fail "Container is not running"
    echo ""
    echo "Please start the container first:"
    echo "  sudo ./docker/run.sh"
    exit 1
fi

##############################################################################
# Test 2: Volume Mounts
##############################################################################
test_header "Volume Mounts"

# Check FreeRADIUS config mount
if sudo docker exec ${CONTAINER_NAME} test -d /etc/freeradius/3.0; then
    pass "FreeRADIUS config directory mounted"
    
    # Verify it's the host directory (write test)
    TEST_FILE="/etc/freeradius/3.0/.docker_test_$$"
    if sudo docker exec ${CONTAINER_NAME} sh -c "echo 'test' > ${TEST_FILE} 2>/dev/null" && \
       test -f "${TEST_FILE}" && \
       sudo rm -f "${TEST_FILE}"; then
        pass "Volume mount is writable and synced with host"
    else
        fail "Volume mount not synced with host"
    fi
else
    fail "FreeRADIUS config directory not mounted"
fi

# Check COA directory
if sudo docker exec ${CONTAINER_NAME} test -d /etc/freeradius/3.0/coa; then
    pass "COA directory accessible"
else
    fail "COA directory not accessible"
fi

##############################################################################
# Test 3: Network Connectivity
##############################################################################
test_header "Network Connectivity"

# Test port 80 (nginx)
if curl -sf http://localhost/ > /dev/null 2>&1; then
    pass "Port 80 (nginx) is accessible"
else
    fail "Port 80 (nginx) is not accessible"
fi

# Test backend health endpoint
if HEALTH=$(curl -sf http://localhost/api/health 2>&1); then
    pass "Backend health endpoint responding"
    echo "   Response: $HEALTH"
else
    fail "Backend health endpoint not responding"
fi

##############################################################################
# Test 4: Backend API Endpoints
##############################################################################
test_header "Backend API Endpoints"

# Test service status endpoint
if curl -sf http://localhost/api/service/status > /dev/null 2>&1; then
    pass "Service status endpoint working"
else
    fail "Service status endpoint not working"
fi

# Test COA tree endpoint
if curl -sf http://localhost/api/coa/tree > /dev/null 2>&1; then
    pass "COA tree endpoint working"
else
    fail "COA tree endpoint not working"
fi

##############################################################################
# Test 5: Host Command Execution (nsenter)
##############################################################################
test_header "Host Command Execution"

# Check if nsenter is available
if sudo docker exec ${CONTAINER_NAME} which nsenter > /dev/null 2>&1; then
    pass "nsenter command available"
    
    # Test systemctl via nsenter
    if sudo docker exec ${CONTAINER_NAME} sh -c 'nsenter --target 1 --mount --uts --ipc --net --pid -- systemctl --version' > /dev/null 2>&1; then
        pass "Can execute systemctl on host via nsenter"
    else
        warn "Cannot execute systemctl on host (may need --pid=host flag)"
    fi
else
    fail "nsenter command not available"
fi

##############################################################################
# Test 6: File Permissions
##############################################################################
test_header "File Permissions"

# Check if backend can write to COA directory
COA_TEST_FILE="docker_permission_test_$$.txt"
if sudo docker exec ${CONTAINER_NAME} sh -c "echo 'test' > /etc/freeradius/3.0/coa/${COA_TEST_FILE}" 2>/dev/null; then
    pass "Backend can write to COA directory"
    sudo docker exec ${CONTAINER_NAME} rm -f /etc/freeradius/3.0/coa/${COA_TEST_FILE}
else
    fail "Backend cannot write to COA directory"
fi

##############################################################################
# Test 7: Services Running
##############################################################################
test_header "Container Services"

# Check if nginx is running
if sudo docker exec ${CONTAINER_NAME} pgrep nginx > /dev/null 2>&1; then
    pass "Nginx is running"
else
    fail "Nginx is not running"
fi

# Check if node (backend) is running
if sudo docker exec ${CONTAINER_NAME} pgrep -f "node.*backend" > /dev/null 2>&1; then
    pass "Backend is running"
else
    fail "Backend is not running"
fi

# Check if Next.js is running
if sudo docker exec ${CONTAINER_NAME} pgrep -f "node.*next" > /dev/null 2>&1; then
    pass "Next.js frontend is running"
else
    fail "Next.js frontend is not running"
fi

##############################################################################
# Summary
##############################################################################
echo ""
echo "============================================"
echo "Test Summary"
echo "============================================"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo ""

if [ ${FAILED_TESTS} -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Container is ready for distribution.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please fix issues before distribution.${NC}"
    exit 1
fi
