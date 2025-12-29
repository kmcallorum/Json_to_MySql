# Quick Fix Instructions

## Issue 1: Filter Preset Save - "Base table name is required"

**Fix:** Update `src/components/analysis/JsonAnalyzerComponent.tsx`

Find this line (around line 100):
```tsx
<FilterBuilder 
  fields={discoveredFields}
  onFiltersChange={setWhereConditions}
/>
```

Change it to:
```tsx
<FilterBuilder 
  fields={discoveredFields}
  baseTableName={baseTableName}
  onFiltersChange={setWhereConditions}
/>
```

## Issue 2: Missing "Load Saved Mapping" Button

**Verify the file:** Check `src/components/mapping/DragDropMapper.tsx` 

It should have a button section at the top that looks like:
```tsx
<button
  onClick={() => {
    loadSavedMappings();
    setShowLoadMapping(true);
  }}
  style={{
    padding: '10px 20px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  }}
>
  📂 Load Saved Mapping
</button>
```

If it doesn't, the file didn't update. Try:

1. Stop the frontend dev server (Ctrl+C)
2. Delete `node_modules/.vite` cache: `rm -rf node_modules/.vite`
3. Restart: `npm run dev`
4. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

## Quick Test:

1. **Filter Save Test:**
   - Add 2 filter conditions
   - Click "💾 Save Filter Preset"
   - Enter name: "test"
   - Should save successfully (no error)

2. **Load Mapping Test:**
   - Go to mapping screen (Step 3)
   - Look for "📂 Load Saved Mapping" button in top right
   - Should be visible above the drag-and-drop area

If still not working, please share screenshot of the files or run:
```bash
head -n 50 src/components/analysis/JsonAnalyzerComponent.tsx
head -n 100 src/components/mapping/DragDropMapper.tsx
```
