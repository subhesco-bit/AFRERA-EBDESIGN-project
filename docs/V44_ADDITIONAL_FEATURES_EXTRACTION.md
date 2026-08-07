# V44 Additional Features Extraction

This document extracts additional valuable features from the `afrera_platform_v44.html` that are not present in v42 and could enhance the platform.

## New Features in V44

### 1. DataStore with Google Drive Integration

**Purpose:** Pilot storage system with cloud sync via AI bridge and local fallback

**Original Implementation:**
```javascript
const DataStore = {
  driveEnabled: true,
  records: [],
  auditLog: [],
  driveCount: 0,
  localCount: 0,
  
  save(rec) {
    this.records.push(rec);
    this.audit('save', rec, 'local');
    this.localCount++;
    
    if (this.driveEnabled) {
      // Sync to Google Drive via AI bridge
      this.audit('save', rec, 'drive');
      this.driveCount++;
    }
  },
  
  log(m) {
    const c = $("console");
    if (c) {
      c.textContent += "\n[" + new Date().toLocaleTimeString() + "] " + m;
      c.scrollTop = c.scrollHeight;
    }
  },
  
  audit(ev, rec, storage) {
    this.auditLog.unshift({
      t: new Date().toLocaleTimeString(),
      ev,
      rec,
      storage
    });
    renderAudit();
  }
};
```

**Key Features:**
- Automatic Google Drive sync via AI bridge
- Local fallback storage
- Audit trail for all operations
- Real-time console logging
- Storage status tracking

**Implementation Requirements:**
- Google Drive adapter integration
- Local storage fallback (sessionStorage)
- Audit log persistence
- Real-time sync status display
- Export functionality (JSON/CSV)

**Use Cases:**
- Data Console for record management
- Audit Trail monitoring
- Backup and recovery
- Data export for analysis

---

### 2. Scheme Verification System

**Purpose:** Government scheme status verification with primary source checking

**Original Implementation:**
```javascript
const SCHEMES = [
  ["MIDH", "Agri & Farmers' Welfare", "Horticulture infra, pack-houses", "active", "Active — verify current-year SLSC allocation"],
  ["PMFBY", "Agriculture (crop insurance)", "Crop, prevented-sowing, post-harvest cover", "active", "Active — powers Suraksha crop & seed cover"],
  ["RWBCIS", "Agriculture", "Weather-index crop insurance", "active", "Active — powers Suraksha weather cover"],
  ["AHIDF", "Animal Husbandry", "Was: infra credit + interest subvention", "expired", "EXPIRED 31 Mar 2026 — excluded from live workflows"],
  ["SATAT", "MoPNG", "CBG offtake (energy workstream)", "active", "Active — captive + OMC streams kept separate"],
  ["NERAMAC / NEC", "DoNER", "NE marketing & GI facilitation", "active", "Active — GI facilitation confirmed"]
];

const SB = {
  active: '<span class="badge gi">Verified active</span>',
  caution: '<span class="badge flag">Conditional</span>',
  expired: '<span class="badge exp">Lapsed</span>'
};
```

**Key Features:**
- Real-time scheme status tracking
- Primary source verification
- Automatic exclusion of lapsed schemes
- Condition-based status badges
- Ministry categorization
- Relevance mapping to platform features

**Scheme Categories:**
- **Active:** Fully operational and verified
- **Conditional:** Active with conditions
- **Expired:** Lapsed and excluded from workflows

**Implementation Requirements:**
- Scheme database with expiry dates
- Primary source verification system
- Status update mechanism
- Integration with insurance and financing workflows
- Admin console for scheme management

**Use Cases:**
- Governance Portal scheme matrix
- Insurance product eligibility
- Financing scheme verification
- AI scheme checker for farmers

---

### 3. Enhanced Farmer Portal Features

**Purpose:** Expanded farmer portal with additional capabilities

**New Panels (fpPanel):**

#### Mill Circuit
```javascript
mill: [
  'Mobile Rice Mill — circuit model',
  '<p>Trailer-mounted, moves on a fixed village rotation — <b>not</b> a fixed hub. Book your slot:</p>' +
  '<div class="twrap"><table class="dt">' +
  '<thead><tr><th>Week</th><th>Cluster</th><th>Days</th><th>Status</th></tr></thead>' +
  '<tbody>' +
  '<tr><td>Wk 28</td><td>Ukhrul A</td><td>Mon–Wed</td><td><span class="badge gi">Open</span></td></tr>' +
  '<tr><td>Wk 28</td><td>Senapati B</td><td>Thu–Sat</td><td><span class="badge gi">Open</span></td></tr>' +
  '<tr><td>Wk 29</td><td>Mon A</td><td>Mon–Wed</td><td><span class="badge flag">Waitlist</span></td></tr>' +
  '</tbody></table></div>'
]
```

#### FPO Ledger
```javascript
ledger: [
  'FPO Ledger — farmer-owned',
  '<p>This ledger belongs to your FPO. It is <b>not</b> a bank NPA file — banks see only what your FPO shares for a specific application.</p>' +
  '<div class="twrap"><table class="dt">' +
  '<thead><tr><th>Date</th><th>Entry</th><th>Qty</th><th>Amount</th></tr></thead>' +
  '<tbody>' +
  '<tr><td>02 Jul</td><td>Chak-Hao lot #114</td><td>240 kg</td><td>credited on sale</td></tr>' +
  '<tr><td>28 Jun</td><td>Mill service Wk 26</td><td>—</td><td>₹1,150 share</td></tr>' +
  '</tbody></table></div>'
]
```

**Key Features:**
- Mobile mill circuit booking system
- FPO ledger management
- MAP protection display
- AI scheme checker integration
- Simple mode for low-bandwidth use

**Implementation Requirements:**
- Equipment booking system
- FPO accounting integration
- MAP protection enforcement
- AI integration for scheme checking
- Mobile-optimized UI for village use

---

### 4. Data Console

**Purpose:** Administrative interface for record management and data export

**Original Implementation:**
```javascript
route("/console", () => {
  app().innerHTML = `
    <div class="wrap">
      <div class="crumb"><a onclick="nav('/')">Home</a> › Data Console</div>
      <h1 class="ptitle">Data Console</h1>
      <p class="psub">Pilot storage writes every record (registration, order, insurance lead) as JSON to a <b>Google Drive</b> folder via the AI bridge, with automatic local fallback.</p>
      
      <div class="stat4">
        <div class="card"><b id="stTotal">0</b><span>Records this session</span></div>
        <div class="card"><b id="stDrive">0</b><span>Synced to Drive</span></div>
        <div class="card"><b id="stLocal">0</b><span>Local fallback</span></div>
        <div class="card"><b id="stAudit">0</b><span>Audit events</span></div>
      </div>
      
      <div class="controls">
        <button class="btn gold sm" onclick="adminExtractDrive()">⬇ Extract from Drive</button>
        <button class="btn ghost sm" onclick="adminExport('json')">Export JSON</button>
        <button class="btn ghost sm" onclick="adminExport('csv')">Export CSV</button>
        <label class="store">
          <input type="checkbox" id="driveToggle" ${DataStore.driveEnabled ? 'checked' : ''} 
                 onchange="DataStore.driveEnabled = this.checked; updateStoreStatus()">
          Drive sync
        </label>
      </div>
      
      <div class="twrap">
        <table class="dt">
          <thead><tr><th>ID</th><th>Type</th><th>Name / Org</th><th>Detail</th><th>Storage</th><th>Time</th></tr></thead>
          <tbody id="recRows"></tbody>
        </table>
      </div>
      
      <div class="console" id="console"></div>
    </div>
  `;
  adminRefresh();
});
```

**Key Features:**
- Real-time record statistics
- Drive sync toggle
- Data export (JSON/CSV)
- Record table with all fields
- Storage bridge log console
- Audit trail display

**Statistics Tracked:**
- Total records this session
- Records synced to Drive
- Local fallback records
- Audit events logged

**Implementation Requirements:**
- Admin authentication
- Real-time data refresh
- Export functionality
- Console logging system
- Drive API integration

---

### 5. AI Integration Enhancements

**Purpose:** Enhanced AI features for farmer assistance

**New AI Features:**

#### Scheme Checker
```javascript
<button class="itile" onclick="askAI('Scheme check for a small farmer: which verified-active schemes fit? Simple words, remind me to confirm with the authority.')">
  <span class="em">🏷️</span>
  <b>Scheme Checker</b>
  <small>AI eligibility</small>
</button>
```

#### General AI Assistant
```javascript
<button class="itile" onclick="askAI('What can the Farmer Portal do for me? Answer very simply.')">
  <span class="em">🤖</span>
  <b>Ask AFRERA AI</b>
  <small>Simple answers</small>
</button>
```

**Key Features:**
- Context-aware AI responses
- Scheme eligibility checking
- Simple language for farmers
- Authority confirmation reminders
- Portal capability explanation

**Implementation Requirements:**
- AI service integration
- Context-aware prompt building
- Simplified response processing
- Scheme database integration
- Natural language processing

---

### 6. Enhanced Registration System

**Purpose:** Multi-track registration for different stakeholder types

**Original Implementation:**
```javascript
const REG_TRACKS = [
  { id: "farmer", name: "Farmer", icon: "🧑‍🌾", desc: "Sell produce, book equipment, access schemes" },
  { id: "fpo", name: "FPO", icon: "🏢", desc: "Manage member accounts, shared equipment" },
  { id: "corporate", name: "Corporate Buyer", icon: "🏭", desc: "Bulk procurement, NET terms" },
  { id: "logistics", name: "Logistics Provider", icon: "🚚", desc: "Cold-chain corridor, return trucks" },
  { id: "processor", name: "Food Processor", icon: "🏭", desc: "Value addition, packaging" },
  { id: "retailer", name: "Retailer", icon: "🏪", desc: "NE flagship products in stores" },
  { id: "research", name: "Research Institution", icon: "🔬", desc: "Trials, data partnerships" }
];
```

**Key Features:**
- 7 stakeholder registration tracks
- Role-specific onboarding flows
- Custom fields per registration type
- Google Drive sync for registrations
- Audit trail for all registrations

**Registration Tracks:**
1. **Farmer** - Sell produce, book equipment, access schemes
2. **FPO** - Manage member accounts, shared equipment
3. **Corporate Buyer** - Bulk procurement, NET terms
4. **Logistics Provider** - Cold-chain corridor, return trucks
5. **Food Processor** - Value addition, packaging
6. **Retailer** - NE flagship products in stores
7. **Research Institution** - Trials, data partnerships

**Implementation Requirements:**
- Multi-form registration system
- Role-based data collection
- Custom validation per track
- Role-specific dashboard generation
- Audit trail integration

---

### 7. MAP Protection Enhancement

**Purpose:** Visual MAP protection for farmers

**Original Implementation:**
```javascript
<div class="maplock">
  <span style="font-size:20px">🛡️</span>
  <div>
    <b>Your floor price (MAP) is protected.</b>
    Buyers never see your Minimum Acceptable Price — offers below it are auto-rejected before they reach you.
  </div>
</div>
```

**Key Features:**
- Visual MAP protection indicator
- Auto-rejection of below-MAP offers
- Clear communication to farmers
- Trust-building transparency

**Implementation Requirements:**
- MAP storage and retrieval
- Offer filtering logic
- Auto-rejection mechanism
- User notification system

---

## Implementation Priority

Based on business value and complexity:

### HIGH PRIORITY
1. **DataStore with Drive Integration** - Critical for data backup and audit
2. **Scheme Verification System** - Essential for governance and compliance
3. **Enhanced Registration System** - Core onboarding functionality

### MEDIUM PRIORITY
4. **Data Console** - Administrative tool for record management
5. **MAP Protection Enhancement** - Trust and transparency feature
6. **AI Integration Enhancements** - User experience improvement

### LOWER PRIORITY
7. **Enhanced Farmer Portal Panels** - Nice-to-have features

## Data Structures

### Scheme Record Structure
```javascript
{
  id: "MIDH",
  name: "Mission for Integrated Development of Horticulture",
  ministry: "Agri & Farmers' Welfare",
  relevance: "Horticulture infra, pack-houses",
  status: "active",
  note: "Active — verify current-year SLSC allocation",
  expiryDate: null,
  lastVerified: "2026-08-04"
}
```

### DataStore Record Structure
```javascript
{
  id: "AFR-REG-ABC123",
  type: "registration",
  track: "farmer",
  data: { /* registration data */ },
  storage: "drive", // or "local"
  timestamp: "2026-08-04T12:00:00Z",
  synced: true
}
```

### Audit Log Structure
```javascript
{
  timestamp: "12:00:00",
  event: "save",
  recordId: "AFR-REG-ABC123",
  storage: "drive",
  details: "Synced to Google Drive successfully"
}
```

## API Endpoints to Create

### DataStore Endpoints
- `GET /api/v1/datastore/records` - List all records
- `POST /api/v1/datastore/records` - Create new record
- `GET /api/v1/datastore/audit` - Get audit trail
- `GET /api/v1/datastore/stats` - Get storage statistics
- `POST /api/v1/datastore/export/:format` - Export data
- `POST /api/v1/datastore/sync` - Manual sync trigger

### Scheme Endpoints
- `GET /api/v1/schemes` - List all schemes
- `GET /api/v1/schemes/:id` - Get scheme details
- `POST /api/v1/schemes/verify` - Verify scheme status
- `PUT /api/v1/schemes/:id` - Update scheme
- `GET /api/v1/schemes/expiring` - Get expiring schemes

### Registration Endpoints
- `POST /api/v1/register/:track` - Register by track
- `GET /api/v1/register/tracks` - Get available tracks
- `POST /api/v1/register/validate` - Validate registration data

## Security Considerations

### DataStore Security
- Google Drive OAuth 2.0 authentication
- Encryption at rest for sensitive data
- Access control for different user roles
- Audit trail for all data operations

### Scheme Verification Security
- Primary source verification only
- No scheme modification without admin rights
- Automatic expiration handling
- Audit trail for status changes

## Testing Strategy

### DataStore Testing
- Sync/fallback scenarios
- Export functionality
- Audit trail accuracy
- Concurrent access handling

### Scheme Verification Testing
- Primary source verification
- Expiry detection accuracy
- Status badge rendering
- Integration with insurance flows

### Registration Testing
- Multi-track form validation
- Role-specific data collection
- Duplicate detection
- Email verification

## Migration Notes

### From V42 to V44
- V42 had basic DataStore (local only)
- V44 adds Google Drive sync
- V42 had simple scheme list
- V44 adds verification discipline
- V42 had single registration
- V44 adds multi-track registration

### Compatibility
- V42 records should be migratable
- V44 DataStore is backward compatible
- Scheme database needs verification updates
- Registration system needs track migration