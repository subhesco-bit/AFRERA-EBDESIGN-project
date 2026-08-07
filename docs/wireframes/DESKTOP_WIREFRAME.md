## Desktop App Wireframe (Large-screen Layout)

```mermaid
flowchart LR
  Sidebar[Sidebar Navigation] --> ContentArea[Main Content]
  Sidebar --> Home
  Sidebar --> Marketplace
  Sidebar --> Modules
  Sidebar --> Analytics
  Sidebar --> Admin

  ContentArea --> ProductDetail
  ContentArea --> DashboardWidgets

  classDef sidebar fill:#eef,stroke:#333
  class Sidebar sidebar
  
  note left of Sidebar: Desktop shows denser information and panels
```

Notes:
- Desktop adds multi-column dashboards and expanded data tables.
