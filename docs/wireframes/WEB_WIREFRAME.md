## Web App Wireframe (Routes Overview)

```mermaid
flowchart TD
  A[Home] --> Marketplace[Marketplace]
  A --> Modules[Modules Hub]
  A --> Analytics[Analytics]
  A --> Forms[Forms]
  A --> Login[Login/Register]

  Marketplace --> Product[Product Detail (/products/:id)]
  Product --> Cart[/Cart]
  Cart --> Checkout[/Checkout]

  Modules --> FarmerPortal[/Farmer Portal]
  FarmerPortal --> FarmerHome[/Farmer Home]
  FarmerPortal --> Sell[/Farmer Sell]
  FarmerPortal --> Field[/Farmer Field]

  Admin[/Admin Dashboard] --> Economic[/Economic Dashboard]
  LogisticsProvider[/Logistics Provider] --> Logistics[/Logistics]

  style A fill:#f9f,stroke:#333,stroke-width:1px
```

Notes:
- Matches routes declared in `frontend/src/App.jsx`.
- Use this as the baseline for consistent navigation across web, mobile, and desktop.
