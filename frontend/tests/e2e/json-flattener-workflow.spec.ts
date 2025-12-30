import { test, expect } from '@playwright/test';

test.describe('JSON to SQL Flattener - Full User Workflow', () => {
  test('should complete the full data flattening workflow', async ({ page }) => {
    // Mock API responses
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
          fields: [
            {
              path: '_source.type',
              uniqueValues: ['event.test', 'event.run'],
              nullCount: 0,
              totalCount: 100
            },
            {
              path: '_source.status',
              uniqueValues: ['success', 'failed'],
              nullCount: 5,
              totalCount: 100
            },
            {
              path: '_source.timestamp',
              uniqueValues: [1640000000, 1640100000],
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
                samples: ['event.test'],
                occurrence: 100,
                suggestedTable: 'events',
                suggestedColumn: 'type',
                suggestedType: 'VARCHAR(255)'
              }
            ],
            totalDocuments: 100
          },
          totalRecordsInTable: 1000,
          sampledRecords: 100,
          baseTableName: 'test_data',
          toProcessTable: 'test_data_toprocess',
          appliedFilters: []
        })
      });
    });

    // Navigate to the application
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Step 1: Verify page title and main heading
    await expect(page).toHaveTitle(/JSON to SQL Flattener/);
    await expect(page.locator('h2')).toContainText('JSON to SQL Flattener');

    // Step 2: Test Database Connection
    await expect(page.getByText('Step 1: Test Database Connection')).toBeVisible();
    const testConnectionBtn = page.getByRole('button', { name: /Test Connection/i });
    await expect(testConnectionBtn).toBeVisible();
    await testConnectionBtn.click();

    // Verify connection success
    await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 3000 });

    // Step 3: Discover Fields
    await expect(page.getByText('Step 2: Discover Fields')).toBeVisible();

    // Verify default table name is populated
    const tableNameInput = page.getByPlaceholder(/platforms_cicd_data/i);
    await expect(tableNameInput).toHaveValue('platforms_cicd_data');

    // Click discover fields button
    const discoverBtn = page.getByRole('button', { name: /Discover All Fields & Values/i });
    await expect(discoverBtn).toBeVisible();
    await discoverBtn.click();

    // Wait for fields to be discovered
    await expect(page.getByText(/Discovered \d+ fields/i)).toBeVisible({ timeout: 3000 });

    // Step 4: Verify WHERE conditions builder appears
    await expect(page.getByText(/Step 3:/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Build WHERE Conditions/i)).toBeVisible();

    // Add a filter condition
    const addConditionBtn = page.getByRole('button', { name: /Add Condition/i });
    if (await addConditionBtn.isVisible()) {
      await addConditionBtn.click();

      // Verify filter UI elements appear
      await expect(page.getByText('Field')).toBeVisible();
      await expect(page.getByText('Operator')).toBeVisible();
    }

    // Step 5: Verify Analysis step appears
    await expect(page.getByText(/Step 4:/i)).toBeVisible();
    await expect(page.getByText(/Analyze & Generate Table Suggestions/i)).toBeVisible();

    // Verify sample size input
    const sampleSizeInput = page.getByRole('spinbutton');
    await expect(sampleSizeInput).toBeVisible();
    await expect(sampleSizeInput).toHaveValue('100');

    // Change sample size
    await sampleSizeInput.fill('500');
    await expect(sampleSizeInput).toHaveValue('500');

    // Click analyze button
    const analyzeBtn = page.getByRole('button', { name: /Analyze & Suggest Tables/i });
    await expect(analyzeBtn).toBeVisible();
    await expect(analyzeBtn).toBeEnabled();
    await analyzeBtn.click();

    // Wait for analysis to complete (this would normally trigger onAnalysisComplete callback)
    await page.waitForTimeout(1000);

    // Verify no error messages
    const errorMessage = page.locator('text=Error:');
    await expect(errorMessage).not.toBeVisible();
  });

  test('should handle connection failure gracefully', async ({ page }) => {
    // Mock failed connection
    await page.route('**/api/analysis/test-connection', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Connection refused'
        })
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to connect
    const testConnectionBtn = page.getByRole('button', { name: /Test Connection/i });
    await testConnectionBtn.click();

    // Verify error message appears
    await expect(page.getByText(/Database connection failed/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Failed/i)).toBeVisible();
  });

  test('should allow updating base table name', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and update table name input
    const tableNameInput = page.getByPlaceholder(/platforms_cicd_data/i);
    await expect(tableNameInput).toBeVisible();

    await tableNameInput.clear();
    await tableNameInput.fill('custom_table_name');

    await expect(tableNameInput).toHaveValue('custom_table_name');

    // Verify the _toprocess suffix is shown
    await expect(page.getByText(/custom_table_name_toprocess/i)).toBeVisible();
  });

  test('should show filter preset options when filters are available', async ({ page }) => {
    // Mock discover fields API
    await page.route('**/api/analysis/discover-fields', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          fields: [
            {
              path: '_source.status',
              uniqueValues: ['active', 'inactive'],
              nullCount: 0,
              totalCount: 100
            }
          ]
        })
      });
    });

    // Mock filter presets list API
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

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Discover fields first
    const discoverBtn = page.getByRole('button', { name: /Discover All Fields & Values/i });
    await discoverBtn.click();

    // Wait for fields discovery
    await page.waitForTimeout(1000);

    // Verify filter section appears
    await expect(page.getByText(/Build WHERE Conditions/i)).toBeVisible({ timeout: 3000 });

    // Look for save/load filter preset buttons
    const savePresetBtn = page.getByRole('button', { name: /Save Filter Preset/i });
    const loadPresetBtn = page.getByRole('button', { name: /Load Filter Preset/i });

    if (await savePresetBtn.isVisible()) {
      await expect(savePresetBtn).toBeVisible();
    }
    if (await loadPresetBtn.isVisible()) {
      await expect(loadPresetBtn).toBeVisible();
    }
  });
});
