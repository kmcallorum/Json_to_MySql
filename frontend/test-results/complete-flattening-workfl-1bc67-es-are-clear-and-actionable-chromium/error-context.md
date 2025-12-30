# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "JSON to SQL Flattener" [level=1] [ref=e5]
  - generic [ref=e6]:
    - generic [ref=e7]: 1. Analyzing...
    - generic [ref=e9]: 2. Tables
    - generic [ref=e11]: 3. Map
    - generic [ref=e13]: 4. Relations
    - generic [ref=e15]: 5. Execute
  - generic [ref=e16]:
    - heading "JSON to SQL Flattener - Smart Analysis" [level=2] [ref=e17]
    - generic [ref=e18]:
      - 'heading "Step 1: Test Database Connection" [level=3] [ref=e19]'
      - button "Test Connection" [active] [ref=e20] [cursor=pointer]
      - text: ✗ Failed
    - generic [ref=e21]:
      - 'heading "Step 2: Discover Fields" [level=3] [ref=e22]'
      - generic [ref=e23]:
        - generic [ref=e24]: "Destination Table Name:"
        - textbox "e.g., platforms_cicd_data" [ref=e25]: platforms_cicd_data
        - generic [ref=e26]:
          - text: "Will read from:"
          - strong [ref=e27]: platforms_cicd_data_toprocess
      - button "Discover All Fields & Values" [ref=e28] [cursor=pointer]
    - generic [ref=e29]:
      - strong [ref=e30]: "Error:"
      - text: Database connection failed
```