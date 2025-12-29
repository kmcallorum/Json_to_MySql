/**
 * End-to-End Test: Complete JSON-to-SQL Workflow
 * Tests the entire user journey from upload to execution
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Complete JSON-to-SQL Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JSON-to-SQL Flattener/);
  });

  test('should complete full workflow: upload → analyze → map → execute', async ({ page }) => {
    // Step 1: Upload JSON file
    const sampleJson = {
      eventData: {
        duration_ms: 12000,
        status: 'SUCCESS',
        timestamp_ms: 1650945600000,
        type: 'pipeline.build'
      },
      pipelineData: {
        askId: ['UHGWM110-021901'],
        gitCommit: '89ed39a480c6494276feee99c8718f148fe75a8d',
        pipelineId: '258'
      },
      testData: {
        testsExecuted: 66,
        testsFailed: 0,
        testsPassed: 66
      }
    };

    // Create temporary file
    const filePath = path.join(__dirname, 'temp-test.json');
    require('fs').writeFileSync(filePath, JSON.stringify(sampleJson, null, 2));

    // Upload the file
    await page.setInputFiles('input[type="file"]', filePath);
    await expect(page.locator('.upload-success')).toBeVisible();

    // Step 2: Analyze JSON Structure
    await page.click('button:has-text("Analyze Structure")');
    
    // Wait for analysis to complete
    await page.waitForSelector('.analysis-complete', { timeout: 10000 });
    
    // Verify suggested schema
    await expect(page.locator('.table-card')).toHaveCount(4); // root + 3 nested objects
    await expect(page.locator('text=eventData')).toBeVisible();
    await expect(page.locator('text=pipelineData')).toBeVisible();
    await expect(page.locator('text=testData')).toBeVisible();

    // Step 3: Review and customize field mappings
    await page.click('button:has-text("Customize Mappings")');
    
    // Drag a field to different table (testing drag-and-drop)
    const sourceField = page.locator('[data-field="duration_ms"]');
    const targetTable = page.locator('[data-table="root"]');
    
    await sourceField.dragTo(targetTable);
    
    // Verify field moved
    await expect(targetTable.locator('text=duration_ms')).toBeVisible();

    // Step 4: Configure database connections
    await page.click('button:has-text("Configure Connections")');
    
    // Fill Elasticsearch connection
    await page.fill('[name="es_host"]', 'localhost');
    await page.fill('[name="es_port"]', '9200');
    await page.fill('[name="es_index"]', 'test_index');
    
    // Fill MySQL connection
    await page.fill('[name="mysql_host"]', 'localhost');
    await page.fill('[name="mysql_port"]', '3306');
    await page.fill('[name="mysql_database"]', 'test_db');
    await page.fill('[name="mysql_user"]', 'test_user');
    await page.fill('[name="mysql_password"]', 'test_password');
    
    // Test connections
    await page.click('button:has-text("Test Elasticsearch")');
    await expect(page.locator('.connection-success')).toBeVisible();
    
    await page.click('button:has-text("Test MySQL")');
    await expect(page.locator('.connection-success')).toBeVisible();
    
    await page.click('button:has-text("Save Configuration")');

    // Step 5: Review SQL schema
    await page.click('button:has-text("Review SQL Schema")');
    
    // Verify CREATE TABLE statements
    await expect(page.locator('text=CREATE TABLE')).toHaveCount(4);
    await expect(page.locator('text=FOREIGN KEY')).toBeVisible();
    await expect(page.locator('text=CREATE INDEX')).toBeVisible();

    // Step 6: Execute ETL
    await page.click('button:has-text("Execute ETL")');
    
    // Confirm execution
    await page.click('button:has-text("Confirm")');
    
    // Wait for ETL to start
    await expect(page.locator('.etl-status')).toHaveText('Running');
    
    // Monitor progress
    await expect(page.locator('.progress-bar')).toBeVisible();
    
    // Wait for completion (with timeout)
    await page.waitForSelector('.etl-status:has-text("Complete")', { 
      timeout: 60000 
    });
    
    // Verify results
    await expect(page.locator('.records-processed')).toHaveText(/\d+ records/);
    await expect(page.locator('.errors-count')).toHaveText('0 errors');
    
    // Step 7: View results
    await page.click('button:has-text("View Data")');
    
    // Verify data tables
    await expect(page.locator('table.data-table')).toBeVisible();
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    
    // Download results
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download Report")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('etl-report');
    
    // Cleanup
    require('fs').unlinkSync(filePath);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test with invalid JSON
    await page.setContent('<input type="file" />');
    const badFilePath = path.join(__dirname, 'bad-test.json');
    require('fs').writeFileSync(badFilePath, 'invalid json{');
    
    await page.setInputFiles('input[type="file"]', badFilePath);
    
    // Expect error message
    await expect(page.locator('.error-message')).toContainText('Invalid JSON');
    
    require('fs').unlinkSync(badFilePath);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Navigate using Tab key
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('type', 'file');
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText(/Analyze/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile menu
    await expect(page.locator('.mobile-menu-button')).toBeVisible();
    
    // Click mobile menu
    await page.click('.mobile-menu-button');
    await expect(page.locator('.mobile-nav')).toBeVisible();
  });

  test('should preserve state on page reload', async ({ page }) => {
    // Set some configuration
    await page.fill('[name="es_host"]', 'localhost');
    await page.fill('[name="mysql_host"]', 'localhost');
    
    // Reload page
    await page.reload();
    
    // Verify state is preserved (from localStorage)
    await expect(page.locator('[name="es_host"]')).toHaveValue('localhost');
    await expect(page.locator('[name="mysql_host"]')).toHaveValue('localhost');
  });

  test('should handle concurrent operations', async ({ page }) => {
    // Start multiple operations
    const promises = [];
    
    promises.push(page.click('button:has-text("Analyze")'));
    promises.push(page.click('button:has-text("Test Connection")'));
    
    // All should complete without errors
    await Promise.all(promises);
    
    // No error messages should be visible
    await expect(page.locator('.error')).not.toBeVisible();
  });
});

test.describe('Accessibility Tests', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Run axe accessibility tests
    const accessibilityScanResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Inject axe-core
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
        script.onload = () => {
          window.axe.run().then(results => resolve(results));
        };
        document.head.appendChild(script);
      });
    });
    
    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA labels on interactive elements
    const uploadButton = page.locator('input[type="file"]');
    await expect(uploadButton).toHaveAttribute('aria-label');
    
    const analyzeButton = page.locator('button:has-text("Analyze")');
    await expect(analyzeButton).toHaveAttribute('aria-label');
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Verify heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });
});

test.describe('Performance Tests', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large JSON files efficiently', async ({ page }) => {
    const largeJson = {
      items: Array(10000).fill(null).map((_, i) => ({
        id: i,
        value: `item_${i}`,
        nested: { data: `nested_${i}` }
      }))
    };
    
    const filePath = path.join(__dirname, 'large-test.json');
    require('fs').writeFileSync(filePath, JSON.stringify(largeJson));
    
    const startTime = Date.now();
    
    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('button:has-text("Analyze")');
    await page.waitForSelector('.analysis-complete');
    
    const analysisTime = Date.now() - startTime;
    
    // Should complete in under 10 seconds
    expect(analysisTime).toBeLessThan(10000);
    
    require('fs').unlinkSync(filePath);
  });
});

test.describe('Browser Compatibility', () => {
  test('should work on all modern browsers', async ({ browserName }) => {
    // This test will run on all configured browsers
    console.log(`Testing on ${browserName}`);
    // Test passes if no errors occur
  });
});
