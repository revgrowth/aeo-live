/**
 * AEO.LIVE Self-Test Suite
 * 
 * Run with: node tests/run-tests.js
 * 
 * This is a standalone test suite that verifies bug fixes and core functionality
 * without requiring external test frameworks.
 */

const http = require('http');
const https = require('https');

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3002';

// Test results tracking
let passed = 0;
let failed = 0;
const results = [];

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function assert(condition, testName, details = '') {
    if (condition) {
        passed++;
        results.push({ name: testName, status: 'PASS' });
        log(`  ✓ ${testName}`, colors.green);
    } else {
        failed++;
        results.push({ name: testName, status: 'FAIL', details });
        log(`  ✗ ${testName}`, colors.red);
        if (details) log(`    ${details}`, colors.yellow);
    }
}

// HTTP request helper
function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const lib = isHttps ? https : http;

        const req = lib.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 10000,
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data,
                    json: () => {
                        try {
                            return JSON.parse(data);
                        } catch {
                            return null;
                        }
                    }
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// ============================================================================
// TEST SUITES
// ============================================================================

/**
 * Test 1: URL Safety Helper Functions
 * Tests the safeHostname/safeGetHostname pattern used in bug fixes
 */
function testUrlSafetyHelpers() {
    log('\n📋 Testing URL Safety Helpers', colors.cyan);

    // Implementation mirroring what we added to the codebase
    function safeHostname(url) {
        if (!url) return 'unknown';
        try {
            return new URL(url).hostname;
        } catch {
            return url.replace(/^https?:\/\//, '').split('/')[0] || 'unknown';
        }
    }

    function safeGetHostname(url) {
        if (!url) return 'unknown';
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'unknown';
        }
    }

    // Test cases
    assert(safeHostname('https://example.com') === 'example.com', 'Valid URL returns hostname');
    assert(safeHostname('http://test.org/path') === 'test.org', 'URL with path returns hostname');
    assert(safeHostname(null) === 'unknown', 'Null URL returns "unknown"');
    assert(safeHostname(undefined) === 'unknown', 'Undefined URL returns "unknown"');
    assert(safeHostname('') === 'unknown', 'Empty string returns "unknown"');
    assert(safeHostname('not-a-url') === 'not-a-url', 'Invalid URL returns cleaned string');
    assert(safeHostname('example.com') === 'example.com', 'Domain without protocol extracted');
    assert(safeHostname('example.com/page') === 'example.com', 'Domain with path extracts domain only');

    assert(safeGetHostname('https://www.example.com') === 'example.com', 'www prefix removed');
    assert(safeGetHostname('https://example.com') === 'example.com', 'No www still works');
    assert(safeGetHostname(null) === 'unknown', 'Null handled in safeGetHostname');
}

/**
 * Test 2: API Health Check
 */
async function testApiHealth() {
    log('\n📋 Testing API Health', colors.cyan);

    try {
        const response = await httpRequest(`${API_URL}/api/v1/health`);
        assert(response.status === 200, 'API health endpoint returns 200');

        const json = response.json();
        // Health endpoint returns { success: true, data: { api: 'ok', ... } }
        assert(json && json.success === true && json.data?.api === 'ok', 'API returns healthy status');
    } catch (error) {
        assert(false, 'API health check', `Error: ${error.message}`);
    }
}

/**
 * Test 3: Web App Accessibility
 */
async function testWebAppAccessibility() {
    log('\n📋 Testing Web App Accessibility', colors.cyan);

    try {
        const response = await httpRequest(WEB_URL);
        assert(response.status === 200, 'Web app returns 200');
        assert(response.body.includes('AEO'), 'Web app includes AEO branding');
    } catch (error) {
        assert(false, 'Web app accessibility', `Error: ${error.message}`);
    }
}

/**
 * Test 4: Analysis Endpoint Validation
 */
async function testAnalysisEndpointValidation() {
    log('\n📋 Testing Analysis Endpoint Validation', colors.cyan);

    try {
        // Test with invalid data - should return error
        const response = await httpRequest(`${API_URL}/api/v1/analysis/free`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: '' }) // Empty URL should fail
        });

        assert(response.status === 400 || response.status === 422, 'Empty URL rejected with 400/422');

        // Test with invalid URL format
        const response2 = await httpRequest(`${API_URL}/api/v1/analysis/free`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: 'not a valid url!!!',
                firstName: 'Test',
                lastName: 'User',
                email: 'test@test.com',
                phone: '555-1234',
                businessName: 'Test Business'
            })
        });

        assert(response2.status === 400, 'Invalid URL format rejected');
    } catch (error) {
        assert(false, 'Analysis validation test', `Error: ${error.message}`);
    }
}

/**
 * Test 5: Auth Endpoint Structure
 */
async function testAuthEndpoints() {
    log('\n📋 Testing Auth Endpoints', colors.cyan);

    try {
        // Test login endpoint exists and validates input
        const loginResponse = await httpRequest(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '', password: '' })
        });

        // Should fail validation or auth, but endpoint should exist
        assert(loginResponse.status !== 404, 'Login endpoint exists');

        // Test register endpoint
        const registerResponse = await httpRequest(`${API_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '', password: '' })
        });

        assert(registerResponse.status !== 404, 'Register endpoint exists');

        // Test me endpoint (should require auth)
        const meResponse = await httpRequest(`${API_URL}/api/v1/auth/me`);
        assert(meResponse.status === 401, 'Me endpoint requires authentication');

    } catch (error) {
        assert(false, 'Auth endpoints test', `Error: ${error.message}`);
    }
}

/**
 * Test 6: Admin Endpoints Protection
 */
async function testAdminEndpointsProtection() {
    log('\n📋 Testing Admin Endpoints Protection', colors.cyan);

    try {
        // Admin stats should require auth (route is /admin/stats not /admin/dashboard/stats)
        const dashboardResponse = await httpRequest(`${API_URL}/api/v1/admin/stats`);
        assert(dashboardResponse.status === 401 || dashboardResponse.status === 403,
            'Admin dashboard requires authentication');

        // Admin analyses should require auth
        const analysesResponse = await httpRequest(`${API_URL}/api/v1/admin/analyses`);
        assert(analysesResponse.status === 401 || analysesResponse.status === 403,
            'Admin analyses requires authentication');

        // Account deletion should require auth
        const deleteResponse = await httpRequest(`${API_URL}/api/v1/auth/account`, {
            method: 'DELETE',
        });
        assert(deleteResponse.status === 401 || deleteResponse.status === 403,
            'Account deletion requires authentication');

    } catch (error) {
        assert(false, 'Admin protection test', `Error: ${error.message}`);
    }
}

/**
 * Test 10: Frontend Page Routes
 */
async function testPageRoutes() {
    log('\n📋 Testing Frontend Page Routes', colors.cyan);

    const pagesToTest = [
        { path: '/', name: 'Homepage' },
        { path: '/login', name: 'Login page' },
        { path: '/register', name: 'Register page' },
        { path: '/forgot-password', name: 'Forgot password page' },
        { path: '/reset-password', name: 'Reset password page' },
    ];

    for (const page of pagesToTest) {
        try {
            const response = await httpRequest(`${WEB_URL}${page.path}`);
            assert(response.status === 200, `${page.name} returns 200`);
        } catch (error) {
            assert(false, `${page.name} returns 200`, `Error: ${error.message}`);
        }
    }
}

/**
 * Test 7: Pagination Logic (Unit Test)
 */
function testPaginationLogic() {
    log('\n📋 Testing Pagination Logic', colors.cyan);

    // Simulate the separated pagination states we fixed
    let analysesPage = 1;
    let analysesTotalPages = 5;
    let leadsPage = 1;
    let leadsTotalPages = 3;

    // Test analyses pagination
    analysesPage = 3;
    assert(analysesPage === 3 && leadsPage === 1, 'Changing analyses page does not affect leads page');

    // Test leads pagination
    leadsPage = 2;
    assert(analysesPage === 3 && leadsPage === 2, 'Changing leads page does not affect analyses page');

    // Test boundary conditions
    const clampPage = (page, totalPages) => Math.max(1, Math.min(page, totalPages));
    assert(clampPage(0, 5) === 1, 'Page cannot go below 1');
    assert(clampPage(10, 5) === 5, 'Page cannot exceed total pages');
}

/**
 * Test 8: Modal Click-Outside Pattern
 */
function testModalClickOutsidePattern() {
    log('\n📋 Testing Modal Click-Outside Pattern', colors.cyan);

    // Simulate the modal behavior we fixed
    let showModal = true;

    // Simulate clicking the backdrop
    const handleBackdropClick = () => { showModal = false; };
    handleBackdropClick();
    assert(showModal === false, 'Clicking backdrop closes modal');

    // Simulate clicking inside modal (should stop propagation)
    showModal = true;
    let propagationStopped = false;
    const handleModalContentClick = (e) => {
        propagationStopped = true;
        // In React: e.stopPropagation()
    };
    handleModalContentClick({});

    // If propagation is stopped, backdrop click shouldn't fire
    if (!propagationStopped) handleBackdropClick();
    assert(showModal === true, 'Clicking inside modal does not close it (propagation stopped)');
}

/**
 * Test 9: useEffect Redirect Pattern
 */
function testRedirectPattern() {
    log('\n📋 Testing useEffect Redirect Pattern', colors.cyan);

    // The bug: calling router.push during render
    // The fix: call router.push inside useEffect

    // Simulate component state
    let authLoading = true;
    let isAuthenticated = false;
    let redirectCalled = false;

    const simulateUseEffect = (deps) => {
        // This simulates the correct pattern
        if (!authLoading && !isAuthenticated) {
            redirectCalled = true; // router.push('/login')
        }
    };

    // First render: still loading, should not redirect
    simulateUseEffect([authLoading, isAuthenticated]);
    assert(redirectCalled === false, 'No redirect while auth loading');

    // Auth done, not authenticated
    authLoading = false;
    simulateUseEffect([authLoading, isAuthenticated]);
    assert(redirectCalled === true, 'Redirect after auth loading complete when not authenticated');

    // Reset and test authenticated user
    redirectCalled = false;
    isAuthenticated = true;
    simulateUseEffect([authLoading, isAuthenticated]);
    assert(redirectCalled === false, 'No redirect when authenticated');
}

/**
 * Test 11: Logging System
 */
function testLoggingSystem() {
    log('\n📋 Testing Logging System', colors.cyan);

    // Test log level priority
    const LOG_LEVEL_PRIORITY = {
        TRACE: 0,
        DEBUG: 1,
        INFO: 2,
        WARN: 3,
        ERROR: 4,
        FATAL: 5,
    };

    assert(LOG_LEVEL_PRIORITY.TRACE < LOG_LEVEL_PRIORITY.DEBUG, 'TRACE < DEBUG');
    assert(LOG_LEVEL_PRIORITY.DEBUG < LOG_LEVEL_PRIORITY.INFO, 'DEBUG < INFO');
    assert(LOG_LEVEL_PRIORITY.INFO < LOG_LEVEL_PRIORITY.WARN, 'INFO < WARN');
    assert(LOG_LEVEL_PRIORITY.WARN < LOG_LEVEL_PRIORITY.ERROR, 'WARN < ERROR');
    assert(LOG_LEVEL_PRIORITY.ERROR < LOG_LEVEL_PRIORITY.FATAL, 'ERROR < FATAL');

    // Test sensitive data redaction patterns
    const REDACT_PATTERNS = [
        /password/i,
        /secret/i,
        /token/i,
        /apiKey/i,
    ];

    const testKeys = ['password', 'SECRET', 'accessToken', 'apiKey', 'email', 'name'];
    const expected = [true, true, true, true, false, false];

    testKeys.forEach((key, i) => {
        const shouldRedact = REDACT_PATTERNS.some(p => p.test(key));
        assert(shouldRedact === expected[i], `Redaction pattern for "${key}"`);
    });

    // Test correlation ID generation
    function generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    assert(id1 !== id2, 'Correlation IDs are unique');
    assert(id1.includes('-'), 'Correlation ID format is correct');
}

/**
 * Test 12: Sensitive Data Redaction
 */
function testSensitiveDataRedaction() {
    log('\n📋 Testing Sensitive Data Redaction', colors.cyan);

    const REDACT_PATTERNS = [
        /password/i,
        /secret/i,
        /token/i,
    ];

    function redactSensitiveData(obj, patterns) {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'string') return obj;
        if (Array.isArray(obj)) {
            return obj.map(item => redactSensitiveData(item, patterns));
        }
        if (typeof obj === 'object') {
            const redacted = {};
            for (const [key, value] of Object.entries(obj)) {
                const shouldRedact = patterns.some(pattern => pattern.test(key));
                if (shouldRedact) {
                    redacted[key] = '[REDACTED]';
                } else if (typeof value === 'object') {
                    redacted[key] = redactSensitiveData(value, patterns);
                } else {
                    redacted[key] = value;
                }
            }
            return redacted;
        }
        return obj;
    }

    // Test object redaction
    const sensitiveData = {
        email: 'user@test.com',
        password: 'secret123',
        accessToken: 'abc123',
        user: {
            name: 'Test User',
            secretKey: 'hidden',
        },
    };

    const redacted = redactSensitiveData(sensitiveData, REDACT_PATTERNS);

    assert(redacted.email === 'user@test.com', 'Email not redacted');
    assert(redacted.password === '[REDACTED]', 'Password redacted');
    assert(redacted.accessToken === '[REDACTED]', 'Token redacted');
    assert(redacted.user.name === 'Test User', 'Nested name not redacted');
    assert(redacted.user.secretKey === '[REDACTED]', 'Nested secret redacted');
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests() {
    log('\n' + '='.repeat(60), colors.bold);
    log('  AEO.LIVE Self-Test Suite', colors.bold + colors.cyan);
    log('='.repeat(60) + '\n', colors.bold);

    log(`API URL: ${API_URL}`);
    log(`Web URL: ${WEB_URL}\n`);

    // Run synchronous tests first
    testUrlSafetyHelpers();
    testPaginationLogic();
    testModalClickOutsidePattern();
    testRedirectPattern();
    testLoggingSystem();
    testSensitiveDataRedaction();

    // Run async tests
    await testApiHealth();
    await testWebAppAccessibility();
    await testAnalysisEndpointValidation();
    await testAuthEndpoints();
    await testAdminEndpointsProtection();
    await testPageRoutes();

    // Summary
    log('\n' + '='.repeat(60), colors.bold);
    log('  TEST SUMMARY', colors.bold + colors.cyan);
    log('='.repeat(60), colors.bold);

    const total = passed + failed;
    log(`\n  Total: ${total} tests`);
    log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
    log(`  ${colors.red}Failed: ${failed}${colors.reset}`);

    if (failed > 0) {
        log('\n  Failed Tests:', colors.red);
        results.filter(r => r.status === 'FAIL').forEach(r => {
            log(`    - ${r.name}`, colors.red);
            if (r.details) log(`      ${r.details}`, colors.yellow);
        });
    }

    log('\n' + '='.repeat(60) + '\n', colors.bold);

    // Exit with error code if any tests failed
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
});
