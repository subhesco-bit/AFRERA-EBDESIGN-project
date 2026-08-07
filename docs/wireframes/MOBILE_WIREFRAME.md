## Mobile App Wireframe (Simplified Navigation)

```mermaid
flowchart TD
  Home((Home)) --> BottomNav[Bottom Nav]
  BottomNav --> Marketplace
  BottomNav --> Modules
  BottomNav --> Dashboard
  BottomNav --> Profile

  Marketplace --> Product[/Product Detail]
  Product --> Cart[/Cart]
  Cart --> Checkout[/Checkout]

  Modules --> FarmerPortal
  FarmerPortal --> FarmerHome

  note right of BottomNav: Mobile prioritizes quick access and large touch targets
```

Notes:
- Compact layout suitable for small screens; mirror web routes where possible.
