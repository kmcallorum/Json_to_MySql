import { test, expect } from '@playwright/test';

test.describe('Complete Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
  });

  test('Complete analysis to execution workflow', async ({ page }) => {
    // Step 1: Test connection
    await page.click('text=Test Connection');
    await expect(page.locator('text=✓ Connected').or(page.locator('text=Connection successful'))).toBeVisible({ timeout: 10000 });

    // Step 2: Discover fields
    await page.click('text=Discover Fields');
    await expect(page.locator('text=Discovered').or(page.locator('text=fields'))).toBeVisible({ timeout: 10000 });

    // Step 3: Optional - Add filter condition
    await page.click('text=+ Add Condition');
    await page.selectOption('label=Operator', '=');

    // Step 4: Analyze & Suggest Tables
    await page.click('text=Analyze & Suggest Tables');
    await expect(page.locator('text=2. Tables')).toBeVisible({ timeout: 10000 });

    // Step 5: Use suggested tables
    await page.click('text=Use Suggested Tables');
    await expect(page.locator('text=3. Map')).toBeVisible();

    // Step 6: Continue to relationships
    await page.click('text=Continue to Relationships');
    await expect(page.locator('text=4. Relations')).toBeVisible();

    // Step 7: Continue to execute
    await page.click('text=Continue to Execute');
    await expect(page.locator('text=5. Execute')).toBeVisible();
  });

  test('Save and load filter preset workflow', async ({ page }) => {
    // Discover fields first
    await page.click('text=Discover Fields');
    await page.waitForTimeout(2000);

    // Add a filter condition
    await page.click('text=+ Add Condition');
    await page.waitForTimeout(500);

    // Save filter preset
    await page.click('text=💾 Save Filter Preset');
    await page.fill('input[placeholder*="pipeline_test_filters"]', `test_filter_${Date.now()}`);
    await page.fill('textarea[placeholder*="Describe this filter"]', 'E2E test filter');
    await page.click('button:has-text("Save"):not(:has-text("Save Filter"))');

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Load filter preset
    await page.click('text=📂 Load Filter Preset');
    await page.waitForTimeout(1000);

    // Should see the saved preset
    await expect(page.locator('text=test_filter_')).toBeVisible({ timeout: 5000 });
  });

  test('Save and load mapping configuration workflow', async ({ page }) => {
    // Complete analysis flow first
    await page.click('text=Discover Fields');
    await page.waitForTimeout(2000);

    await page.click('text=Analyze & Suggest Tables');
    await page.waitForTimeout(3000);

    await page.click('text=Use Suggested Tables');
    await page.waitForTimeout(1000);

    // Save configuration
    const configName = `test_config_${Date.now()}`;
    await page.click('text=💾 Save Configuration');
    await page.fill('input[placeholder*="daily_pipeline_test_mapping"]', configName);
    await page.fill('textarea[placeholder*="Describe this mapping"]', 'E2E test config');
    await page.click('button:has-text("Save"):not(:has-text("Save Configuration"))');

    // Wait for save
    await page.waitForTimeout(1000);

    // Start over to test loading
    await page.click('text=🔄 Start New Analysis');

    // Load configuration (button appears in mapping step)
    await page.click('text=Discover Fields');
    await page.waitForTimeout(2000);

    await page.click('text=Analyze & Suggest Tables');
    await page.waitForTimeout(3000);

    // Load saved config
    await page.click('text=📂 Load Configuration');
    await page.waitForTimeout(1000);

    await expect(page.locator(`text=${configName}`)).toBeVisible();
  });

  test('Error handling - invalid table name', async ({ page }) => {
    // Enter invalid table name
    await page.fill('input[value="platforms_cicd_data"]', 'invalid_table_xyz_123');

    // Try to discover fields
    await page.click('text=Discover Fields');

    // Should show error
    await expect(page.locator('text=Error').or(page.locator('text=failed'))).toBeVisible({ timeout: 5000 });
  });

  test('Navigation through all steps', async ({ page }) => {
    // Check initial step indicator
    await expect(page.locator('text=1. Analyzing')).toBeVisible();

    // Proceed through workflow
    await page.click('text=Discover Fields');
    await page.waitForTimeout(2000);

    await page.click('text=Analyze & Suggest Tables');
    await page.waitForTimeout(2000);

    // Should be on step 2
    await expect(page.locator('text=2. Selecting').or(page.locator('text=✓ 2. Tables'))).toBeVisible();

    await page.click('text=Use Suggested Tables');
    await page.waitForTimeout(500);

    // Should be on step 3
    await expect(page.locator('text=3. Mapping').or(page.locator('text=3. Map'))).toBeVisible();

    await page.click('text=Continue to Relationships');

    // Should be on step 4
    await expect(page.locator('text=4. Relationships').or(page.locator('text=4. Relations'))).toBeVisible();

    await page.click('text=Continue to Execute');

    // Should be on step 5
    await expect(page.locator('text=5. Execute')).toBeVisible();
  });

  test('Load existing tables workflow', async ({ page }) => {
    // Complete analysis
    await page.click('text=Discover Fields');
    await page.waitForTimeout(2000);

    await page.click('text=Analyze & Suggest Tables');
    await page.waitForTimeout(2000);

    // Try load existing tables
    await page.click('text=Load Existing Tables');

    // Should show table list (if database has tables)
    await page.waitForTimeout(1000);

    // Check if load button is enabled
    const loadButton = page.locator('text=Load Selected Tables');
    await expect(loadButton).toBeVisible();
  });

  test('Start over functionality', async ({ page }) => {
    // Go through a few steps
    await page.click('text=Discover Fields');
    await page.waitForTimeout(2000);

    await page.click('text=Analyze & Suggest Tables');
    await page.waitForTimeout(2000);

    await page.click('text=Use Suggested Tables');
    await page.waitForTimeout(500);

    // Now start over
    await page.click('text=🔄 Start New Analysis');

    // Should be back to step 1
    await expect(page.locator('text=1. Analyzing')).toBeVisible();
    await expect(page.locator('text=Step 1: Test Connection')).toBeVisible();
  });

  test('Filter builder functionality', async ({ page }) => {
    // Discover fields
    await page.click('text=Discover Fields');
    await page.waitForTimeout(2000);

    // Add first condition
    await page.click('text=+ Add Condition');
    await page.waitForTimeout(500);

    // Should show filter inputs
    await expect(page.locator('label:has-text("Field")')).toBeVisible();
    await expect(page.locator('label:has-text("Operator")')).toBeVisible();

    // Add second condition
    await page.click('text=+ Add Condition');

    // Remove first condition
    const removeButtons = page.locator('button:has-text("Remove")');
    await removeButtons.first().click();

    // SQL Preview should update
    await expect(page.locator('text=SQL Preview:')).toBeVisible();
  });

  test('Responsive UI elements', async ({ page }) => {
    // Check main heading
    await expect(page.locator('h1:has-text("JSON to SQL Flattener")')).toBeVisible();

    // Check progress indicators are visible
    await expect(page.locator('text=1. Analyzing')).toBeVisible();
    await expect(page.locator('text=2. Tables')).toBeVisible();
    await expect(page.locator('text=3. Map')).toBeVisible();
    await expect(page.locator('text=4. Relations')).toBeVisible();
    await expect(page.locator('text=5. Execute')).toBeVisible();

    // Check buttons are properly styled
    const testButton = page.locator('button:has-text("Test Connection")');
    await expect(testButton).toBeVisible();
    await expect(testButton).toBeEnabled();
  });
});
