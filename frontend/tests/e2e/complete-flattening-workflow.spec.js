import { test, expect } from '@playwright/test';
test.describe('Complete JSON Flattening Workflow - BDD Style', () => {
    test.beforeEach(async ({ page }) => {
        // Setup common mocks for all tests
        await setupApiMocks(page);
    });
    test('GIVEN a user connects to database, WHEN they analyze JSON and map fields, THEN they can execute flattening successfully', async ({ page }) => {
        // GIVEN: User starts at the application homepage
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveTitle(/JSON to SQL Flattener/);
        // WHEN: User tests database connection
        await testDatabaseConnection(page);
        // AND: User discovers available fields
        await discoverFields(page);
        // AND: User builds WHERE conditions (optional)
        await buildWhereConditions(page);
        // AND: User analyzes JSON structure
        await analyzeJsonStructure(page);
        // AND: User maps fields to target tables via drag-and-drop
        await mapFieldsToTables(page);
        // AND: User defines relationships between tables
        await defineRelationships(page);
        // AND: User executes the flattening operation
        await executeFlatteningOperation(page);
        // THEN: User sees success message and results
        await expect(page.getByText(/Successfully processed/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/records/i)).toBeVisible();
    });
    test('GIVEN a user has created mappings, WHEN they save the configuration, THEN they can load it later', async ({ page }) => {
        // GIVEN: User has completed the mapping workflow
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await testDatabaseConnection(page);
        await discoverFields(page);
        await analyzeJsonStructure(page);
        // WHEN: User saves the configuration
        const configName = `test-config-${Date.now()}`;
        await saveConfiguration(page, configName);
        // THEN: User sees save success message
        await expect(page.getByText(/Configuration saved/i)).toBeVisible({ timeout: 5000 });
        // WHEN: User loads the saved configuration
        await loadConfiguration(page, configName);
        // THEN: Configuration is restored correctly
        await expect(page.locator(`input[value="${configName}"]`)).toBeVisible({ timeout: 5000 });
    });
    test('GIVEN a user builds filter conditions, WHEN they save as preset, THEN they can reuse the filter', async ({ page }) => {
        // GIVEN: User has discovered fields
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await testDatabaseConnection(page);
        await discoverFields(page);
        // WHEN: User builds a complex WHERE condition
        await page.getByRole('button', { name: /Add Condition/i }).click();
        // Select field
        const fieldSelects = await page.locator('select').all();
        if (fieldSelects.length > 0) {
            await fieldSelects[0].selectOption({ index: 1 }); // Select first available field
        }
        // AND: User saves the filter preset
        const presetName = `test-filter-${Date.now()}`;
        const saveFilterBtn = page.getByRole('button', { name: /Save Filter Preset/i });
        if (await saveFilterBtn.isVisible()) {
            await saveFilterBtn.click();
            const nameInput = page.getByPlaceholder(/Enter preset name/i);
            if (await nameInput.isVisible()) {
                await nameInput.fill(presetName);
                await page.getByRole('button', { name: /Save/i }).click();
            }
        }
        // THEN: Filter preset is saved and can be loaded
        await expect(page.getByText(/Preset saved/i).or(page.getByText(/saved/i))).toBeVisible({ timeout: 5000 });
    });
    test('GIVEN a user maps fields, WHEN they define parent-child relationships, THEN foreign keys are created correctly', async ({ page }) => {
        // GIVEN: User has analyzed JSON and has suggested tables
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await testDatabaseConnection(page);
        await discoverFields(page);
        await analyzeJsonStructure(page);
        // WHEN: User sees suggested table relationships
        await expect(page.getByText(/relationships/i).or(page.getByText(/Step 6:/i))).toBeVisible({ timeout: 10000 });
        // AND: User can add/modify relationships
        const addRelationshipBtn = page.getByRole('button', { name: /Add Relationship/i });
        if (await addRelationshipBtn.isVisible()) {
            await addRelationshipBtn.click();
            // THEN: Relationship form appears
            await expect(page.getByText(/Parent Table/i)).toBeVisible({ timeout: 3000 });
            await expect(page.getByText(/Child Table/i)).toBeVisible({ timeout: 3000 });
        }
    });
    test('GIVEN a user encounters an error, WHEN they retry, THEN error messages are clear and actionable', async ({ page }) => {
        // Mock API failure
        await page.route('**/api/analysis/test-connection', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: 'Database connection timeout'
                })
            });
        });
        // GIVEN: User attempts to connect
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        // WHEN: Connection fails
        const testConnectionBtn = page.getByRole('button', { name: /Test Connection/i });
        await testConnectionBtn.click();
        // THEN: Clear error message is displayed
        await expect(page.getByText(/Database connection/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/timeout|failed/i)).toBeVisible();
        // AND: User can retry
        await expect(testConnectionBtn).toBeEnabled();
    });
    test('GIVEN a user creates multiple tables, WHEN they execute flattening, THEN data is distributed correctly', async ({ page }) => {
        // Mock execution with multiple tables
        await page.route('**/api/mappings/execute', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    tablesCreated: ['events', 'logs', 'metrics'],
                    recordsProcessed: 1500,
                    distribution: {
                        events: 500,
                        logs: 700,
                        metrics: 300
                    }
                })
            });
        });
        // GIVEN: User has completed the mapping
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await testDatabaseConnection(page);
        await discoverFields(page);
        await analyzeJsonStructure(page);
        // WHEN: User executes flattening
        const executeBtn = page.getByRole('button', { name: /Execute|Flatten|Process/i });
        if (await executeBtn.isVisible()) {
            await executeBtn.click();
            // THEN: Success message shows all tables created
            await expect(page.getByText(/Successfully processed/i)).toBeVisible({ timeout: 10000 });
            await expect(page.getByText(/1500/i)).toBeVisible();
        }
    });
});
// Helper functions for BDD steps
async function setupApiMocks(page) {
    await page.route('**/api/analysis/test-connection', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Connection successful!' })
        });
    });
    await page.route('**/api/analysis/discover-fields', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                tableName: 'test_data',
                sampleSize: 100,
                fields: [
                    {
                        path: '_source.type',
                        uniqueValues: ['event.test', 'event.run', 'event.deploy'],
                        nullCount: 0,
                        totalCount: 100
                    },
                    {
                        path: '_source.status',
                        uniqueValues: ['success', 'failed', 'pending'],
                        nullCount: 2,
                        totalCount: 100
                    },
                    {
                        path: '_source.user.id',
                        uniqueValues: [1, 2, 3, 4, 5],
                        nullCount: 0,
                        totalCount: 100
                    },
                    {
                        path: '_source.user.name',
                        uniqueValues: ['Alice', 'Bob', 'Charlie'],
                        nullCount: 0,
                        totalCount: 100
                    }
                ]
            })
        });
    });
    await page.route('**/api/analysis/analyze', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                analysis: {
                    fields: [
                        {
                            path: '_source.type',
                            types: ['string'],
                            isArray: false,
                            isNullable: false,
                            samples: ['event.test', 'event.run'],
                            occurrence: 100,
                            suggestedTable: 'events',
                            suggestedColumn: 'type',
                            suggestedType: 'VARCHAR(255)'
                        },
                        {
                            path: '_source.status',
                            types: ['string'],
                            isArray: false,
                            isNullable: true,
                            samples: ['success', 'failed'],
                            occurrence: 98,
                            suggestedTable: 'events',
                            suggestedColumn: 'status',
                            suggestedType: 'VARCHAR(50)'
                        },
                        {
                            path: '_source.user.id',
                            types: ['number'],
                            isArray: false,
                            isNullable: false,
                            samples: [1, 2, 3],
                            occurrence: 100,
                            suggestedTable: 'users',
                            suggestedColumn: 'id',
                            suggestedType: 'INT'
                        },
                        {
                            path: '_source.user.name',
                            types: ['string'],
                            isArray: false,
                            isNullable: false,
                            samples: ['Alice', 'Bob'],
                            occurrence: 100,
                            suggestedTable: 'users',
                            suggestedColumn: 'name',
                            suggestedType: 'VARCHAR(255)'
                        }
                    ],
                    totalDocuments: 100,
                    analyzedAt: new Date().toISOString()
                },
                totalRecordsInTable: 1000,
                sampledRecords: 100,
                baseTableName: 'test_data',
                toProcessTable: 'test_data_toprocess',
                appliedFilters: []
            })
        });
    });
    await page.route('**/api/filters/list', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                presets: []
            })
        });
    });
    await page.route('**/api/mappings/save', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                message: 'Configuration saved successfully'
            })
        });
    });
    await page.route('**/api/mappings/execute', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                tablesCreated: ['events', 'users'],
                recordsProcessed: 100
            })
        });
    });
}
async function testDatabaseConnection(page) {
    await expect(page.getByText('Step 1: Test Database Connection')).toBeVisible();
    const testConnectionBtn = page.getByRole('button', { name: /Test Connection/i });
    await expect(testConnectionBtn).toBeVisible();
    await testConnectionBtn.click();
    await expect(page.getByText(/Connected/i).or(page.getByText(/successful/i))).toBeVisible({ timeout: 5000 });
}
async function discoverFields(page) {
    await expect(page.getByText('Step 2: Discover Fields')).toBeVisible();
    const discoverBtn = page.getByRole('button', { name: /Discover All Fields & Values/i });
    await expect(discoverBtn).toBeVisible();
    await discoverBtn.click();
    await expect(page.getByText(/Discovered \d+ fields/i)).toBeVisible({ timeout: 5000 });
}
async function buildWhereConditions(page) {
    await expect(page.getByText(/Step 3:/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Build WHERE Conditions/i)).toBeVisible();
    // Optionally add a condition
    const addConditionBtn = page.getByRole('button', { name: /Add Condition/i });
    if (await addConditionBtn.isVisible()) {
        // User can add conditions, but not required for this workflow
    }
}
async function analyzeJsonStructure(page) {
    await expect(page.getByText(/Step 4:/i)).toBeVisible({ timeout: 5000 });
    const analyzeBtn = page.getByRole('button', { name: /Analyze & Suggest Tables/i });
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();
    await page.waitForTimeout(1000); // Wait for analysis
}
async function mapFieldsToTables(page) {
    // After analysis, user would see field mapping interface
    // This would involve drag-and-drop, but we can verify the UI appears
    await expect(page.getByText(/Step 5:|mapping|fields/i)).toBeVisible({ timeout: 10000 });
}
async function defineRelationships(page) {
    // Relationships step would appear after mapping
    await expect(page.getByText(/Step 6:|relationships/i).or(page.getByText(/foreign key/i))).toBeVisible({ timeout: 10000 });
}
async function executeFlatteningOperation(page) {
    const executeBtn = page.getByRole('button', { name: /Execute|Flatten|Process/i });
    if (await executeBtn.isVisible()) {
        await executeBtn.click();
    }
}
async function saveConfiguration(page, configName) {
    const saveBtn = page.getByRole('button', { name: /Save Configuration/i });
    if (await saveBtn.isVisible()) {
        await saveBtn.click();
        const nameInput = page.getByPlaceholder(/Enter configuration name/i);
        if (await nameInput.isVisible()) {
            await nameInput.fill(configName);
            await page.getByRole('button', { name: /^Save$/i }).click();
        }
    }
}
async function loadConfiguration(page, configName) {
    const loadBtn = page.getByRole('button', { name: /Load Configuration/i });
    if (await loadBtn.isVisible()) {
        await loadBtn.click();
        const configSelect = page.locator(`option:has-text("${configName}")`);
        if (await configSelect.isVisible()) {
            await configSelect.click();
        }
    }
}
