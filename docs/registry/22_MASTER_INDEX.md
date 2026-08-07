# 22 — MASTER INDEX: specified vs built

**Generated:** 2026-08-05 by `tools/master-index.js`  
**Specification:** `docs/registry/SOURCE_CATALOGUE.json` — No project chats (1).docx  md5 d217a852325fb6c0cbc4437ba26590c8

Every status below is derived from an artefact on disk, never from a
module name. `BUILT` means a service or route AND a UI component were
found. `NO_UI` means the backend exists and nothing renders it.
`PARTIAL` means only a table — a place to put data, not a feature.

| | Count |
|---|---|
| Enterprise domains catalogued (D01–D100) | 100 |
| Modules catalogued (M001–M150) | 150 |
| **BUILT** (backend + UI) | **26** |
| **NO_UI** (backend only) | **14** |
| **PARTIAL** (schema only) | **53** |
| **ABSENT** (no artefact) | **57** |
| Modules the source explicitly names as missing | 17 |

Evidence corpus: 582 tables, 82 services, 24 route files, 88 components, 0 agents.

## Enterprise domains (D01–D100)

| ID | Domain | Example modules |
|---|---|---|
| D01 | Platform Foundation | Platform Core, Configuration, Environment, Feature Management |
| D02 | Identity & Access Management | Authentication, Authorization, SSO, MFA, RBAC, Consent |
| D03 | User & Stakeholder Management | User Profiles, Organizations, Teams, Delegation |
| D04 | Farmer Ecosystem | Farmer Registry, Family, Skills, Experience |
| D05 | Land & Property | Land Records, Ownership, Lease, GIS Mapping |
| D06 | Village & Community | Village Registry, Panchayat, SHG, Cooperatives |
| D07 | FPO & Producer Organizations | FPO Lifecycle, Governance, Membership |
| D08 | Crop Management | Planning, Sowing, Crop Calendar, Harvest |
| D09 | Horticulture | Fruits, Vegetables, Floriculture, Protected Cultivation |
| D10 | Livestock | Dairy, Poultry, Goatery, Sheep, Piggery |
| D11 | Fisheries & Aquaculture | Biofloc, Pond Farming, Hatchery, Feed |
| D12 | Forestry & Agroforestry | Trees, Bamboo, Carbon Assets |
| D13 | Soil & Water | Soil Health, Irrigation, Water Budgeting |
| D14 | Climate & Weather | Forecasting, Alerts, Climate Risk |
| D15 | Farm Operations | Activities, Labour, Machinery, Scheduling |
| D16 | Farm Equipment & Machinery | Equipment Registry, Rentals, Maintenance |
| D17 | Input Supply Chain | Seeds, Fertilizers, Pesticides, Bio-inputs |
| D18 | Production Planning | Capacity, Yield Planning, Seasonal Plans |
| D19 | Procurement | Direct Procurement, Contracts, Aggregation |
| D20 | Inventory & Warehouse | Stock, Batch, Bin, Storage |
| D21 | Cold Chain | Cold Rooms, Blast Freezing, Monitoring |
| D22 | Processing & Manufacturing | Food Processing, Packaging, Value Addition |
| D23 | Quality & Laboratory | Testing, Certification, Traceability |
| D24 | Food Safety & Compliance | HACCP, FSSAI, GMP, Audit |
| D25 | Packaging | Packaging Design, Labelling, Barcoding |
| D26 | Marketplace | B2B, B2C, Institutional Sales |
| D27 | E-Commerce | Catalogues, Orders, Checkout |
| D28 | Supply Chain | End-to-End Supply Planning |
| D29 | Logistics & Transportation | Fleet, Routing, Delivery |
| D30 | Export & International Trade | Export Compliance, Documentation |
| D31 | Retail & Distribution | Dealers, Retail Chains, HoReCa |
| D32 | CRM / ERM | Customer, Ecosystem & Relationship Management |
| D33 | Sales Management | Quotations, Sales Orders, Pricing |
| D34 | Marketing | Campaigns, Promotions, Branding |
| D35 | Customer Support | Tickets, Complaints, Call Centre |
| D36 | Finance & Accounting | GL, AP, AR, Costing |
| D37 | Banking & Payments | Banking, UPI, Wallets, Escrow |
| D38 | Subsidy & Government Schemes | Eligibility, Claims, Benefits |
| D39 | Insurance | Crop, Livestock, Asset Insurance |
| D40 | Investment & Funding | Investors, Grants, CSR |
| D41 | Procurement Finance | Trade Finance, Working Capital |
| D42 | Human Resource Management | Employees, Payroll, Attendance |
| D43 | Workforce & Labour | Seasonal Labour, Contractors |
| D44 | Learning & Capacity Building | LMS, Certifications, Training |
| D45 | Research & Innovation | R&D, Trials, Demonstrations |
| D46 | Knowledge Management | SOPs, Best Practices, Repository |
| D47 | AI & Decision Intelligence | AI Copilots, AI Advisors, Prediction |
| D48 | Generative AI | Content, Reports, Conversational AI |
| D49 | Computer Vision | Disease Detection, Image Analysis |
| D50 | Recommendation Engine | Crop, Market, Input Recommendations |
| D51 | Forecasting & Analytics | Yield, Demand, Price Forecasts |
| D52 | Business Intelligence | Dashboards, KPIs, Executive Reports |
| D53 | Data Platform | Data Lake, Data Warehouse, MDM |
| D54 | GIS & Spatial Intelligence | Maps, Geofencing, Layers |
| D55 | Satellite Intelligence | Remote Sensing, NDVI |
| D56 | Drone Operations | Flight Planning, Survey, Spraying |
| D57 | IoT Platform | Sensors, Devices, Telemetry |
| D58 | Automation & Smart Farming | Rules Engine, Process Automation |
| D59 | Asset Management | Assets, Depreciation, Maintenance |
| D60 | Energy Management | Solar, DG, Utilities |
| D61 | Water Infrastructure | STP, RO, Pumps, Distribution |
| D62 | Waste & Circular Economy | Waste Processing, Compost, Recycling |
| D63 | Sustainability & ESG | Carbon, Water, ESG Reporting |
| D64 | Carbon Credits | Carbon Accounting, Trading |
| D65 | Biodiversity | Biodiversity Monitoring |
| D66 | Government Digital Public Infrastructure | Registries, Public Platforms, Interoperability |
| D67 | Regulatory Compliance | Legal, Licenses, Inspections |
| D68 | Audit & Risk | Internal Audit, Enterprise Risk |
| D69 | Legal & Contract Management | Contracts, Litigation, Notices |
| D70 | Document Management | Document Repository, OCR, Versioning |
| D71 | Workflow & BPM | Workflow Designer, Approvals |
| D72 | Notification & Communication | SMS, Email, WhatsApp, Voice, IVR |
| D73 | Multilingual & Accessibility | Regional Languages, Accessibility |
| D74 | Offline & Edge Computing | Offline Sync, Local Storage |
| D75 | Mobile Platform | Android, iOS, Progressive Web App |
| D76 | Portal Framework | Farmer, FPO, Government, Enterprise Portals |
| D77 | API & Integration Platform | REST APIs, Webhooks, Connectors |
| D78 | Enterprise Service Bus | Messaging, Event Streaming |
| D79 | Security Operations | SOC, Threat Detection, SIEM |
| D80 | Privacy & Consent | Data Governance, Consent Management |
| D81 | Infrastructure & Cloud | Compute, Storage, Networking |
| D82 | DevSecOps | CI/CD, Release Management |
| D83 | Monitoring & Observability | Logs, Metrics, Tracing |
| D84 | Backup & Disaster Recovery | Backup, Replication, Recovery |
| D85 | Administration & Configuration | System Admin, Master Configuration |
| D86 | Business Rules Engine | Rules, Policies, Validation |
| D87 | Reporting & Printing | Operational, MIS, Statutory Reports |
| D88 | Project & Program Management | Projects, Milestones, PMO |
| D89 | Innovation Marketplace | Startups, Technologies, Pilots |
| D90 | Partner Ecosystem | NGOs, CSR, Universities, OEMs |
| D91 | Digital Commerce Network | Buyers, Sellers, Aggregators |
| D92 | Food Security Operations | Institutional Food Supply, Defence Supply |
| D93 | Agro-Industrial Parks | Cluster Management, Shared Infrastructure |
| D94 | Smart Campus Management | Utilities, Facilities, Security |
| D95 | Enterprise ERP Core | Enterprise Planning, Cross-Functional ERP |
| D96 | Enterprise Performance Management | Budgeting, Planning, KPIs |
| D97 | Master Data Management | Reference Data, Code Lists |
| D98 | Metadata & Governance | Data Catalog, Lineage |
| D99 | Innovation & Future Technologies | Blockchain, Digital Twins, Robotics |
| D100 | Ecosystem Orchestration | Cross-domain Coordination, Digital Ecosystem Management |

## Module index (M001–M150)

| ID | Module | Domain | Status | Match | Evidence |
|---|---|---|---|---|---|
| M001 | Platform Core | Platform Foundation | **ABSENT** | — | — |
| M002 | Platform Configuration | Platform Foundation | **PARTIAL** | strong | `migrations/037_omnichannel_ai_schema.sql` |
| M003 | Tenant Management | Platform Foundation | **ABSENT** | — | — |
| M004 | Organization Management | Platform Foundation | **ABSENT** | — | — |
| M005 | Environment Management | Platform Foundation | **ABSENT** | — | — |
| M006 | System Administration | Platform Foundation | **PARTIAL** | strong | `frontend/src/pages/AdminDashboardPage.jsx` |
| M007 | Feature Flag Management | Platform Foundation | **NO_UI** | subject | `backend/src/services/advancedFeaturesService.js`<br>`backend/src/routes/advancedFeatures.js` |
| M008 | Localization Management | Platform Foundation | **ABSENT** | — | — |
| M009 | Time Zone Management | Platform Foundation | **PARTIAL** | subject | `frontend/src/components/Logistics/RealTimeTracking.jsx` |
| M010 | Master Configuration | Platform Foundation | **PARTIAL** | strong | `migrations/037_omnichannel_ai_schema.sql` |
| M011 | User Management | Identity | **PARTIAL** | strong | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql` |
| M012 | Authentication | Identity | **BUILT** | strong | `migrations/027_gi_intelligence_schema.sql`<br>`migrations/050_sms_auth_tables.sql`<br>`backend/src/services/authService.js` |
| M013 | Authorization | Identity | **BUILT** | strong | `migrations/050_sms_auth_tables.sql`<br>`backend/src/services/authService.js`<br>`backend/src/services/smsAuthService.js` |
| M014 | Role Management | Identity | **PARTIAL** | strong | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/994_recovered_capabilities.sql` |
| M015 | Permission Management | Identity | **ABSENT** | — | — |
| M016 | Single Sign-On | Identity | **ABSENT** | — | — |
| M017 | Multi-Factor Authentication | Identity | **BUILT** | subject | `backend/src/services/multilingualService.js`<br>`frontend/src/components/Multilingual/MultilingualProvider.jsx` |
| M018 | Digital Identity | Identity | **NO_UI** | subject | `migrations/023_engineering_schema.sql`<br>`migrations/023_engineering_schema.sql`<br>`backend/src/services/digitalProductPassportService.js` |
| M019 | Consent Management | Identity | **ABSENT** | — | — |
| M020 | Session Management | Identity | **PARTIAL** | strong | `migrations/016_ai_copilot_schema.sql`<br>`migrations/017_ar_vr_schema.sql`<br>`migrations/021_conversational_ai_schema.sql` |
| M021 | Farmer Registry | Farmer | **BUILT** | strong | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M022 | Farmer Profile | Farmer | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M023 | Farmer Family | Farmer | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M024 | Farmer KYC | Farmer | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M025 | Farmer Verification | Farmer | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M026 | Farmer Skill Management | Farmer | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M027 | Farmer Certification | Farmer | **BUILT** | strong | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M028 | Farmer Advisory | Farmer | **BUILT** | strong | `frontend/src/pages/FarmAdvisorPage.jsx`<br>`migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql` |
| M029 | Farmer Health & Welfare | Farmer | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M030 | Farmer Performance | Farmer | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M031 | Land Registry | Land | **BUILT** | strong | `migrations/011_farmer_portal_enhancements.sql`<br>`migrations/055_business_report_recovery.sql`<br>`migrations/991_aeos_folu_ne_policy.sql` |
| M032 | Land Ownership | Land | **BUILT** | subject | `migrations/011_farmer_portal_enhancements.sql`<br>`migrations/055_business_report_recovery.sql`<br>`migrations/991_aeos_folu_ne_policy.sql` |
| M033 | Land Lease Management | Land | **BUILT** | subject | `migrations/011_farmer_portal_enhancements.sql`<br>`migrations/055_business_report_recovery.sql`<br>`migrations/991_aeos_folu_ne_policy.sql` |
| M034 | Parcel Mapping | Land | **PARTIAL** | subject | `migrations/991_aeos_folu_ne_policy.sql` |
| M035 | GIS Land Mapping | Land | **ABSENT** | — | — |
| M036 | Soil Mapping | Land | **NO_UI** | subject | `backend/src/services/soilTestingService.js` |
| M037 | Water Resource Mapping | Land | **ABSENT** | — | — |
| M038 | Geo Boundary Management | Land | **PARTIAL** | subject | `migrations/013_logistics_enhancements.sql`<br>`frontend/src/hooks/useGeolocation.js` |
| M039 | Survey Management | Land | **PARTIAL** | strong | `migrations/023_engineering_schema.sql` |
| M040 | Digital Land Records | Land | **NO_UI** | subject | `migrations/023_engineering_schema.sql`<br>`migrations/023_engineering_schema.sql`<br>`backend/src/services/digitalProductPassportService.js` |
| M041 | Village Registry | Community | **PARTIAL** | strong | `migrations/012_governance_module.sql`<br>`migrations/052_economic_layer.sql` |
| M042 | Panchayat Management | Community | **PARTIAL** | strong | `migrations/012_governance_module.sql`<br>`migrations/012_governance_module.sql` |
| M043 | Block Management | Community | **NO_UI** | strong | `migrations/019_blockchain_traceability_schema.sql`<br>`migrations/019_blockchain_traceability_schema.sql`<br>`migrations/019_blockchain_traceability_schema.sql` |
| M044 | District Management | Community | **PARTIAL** | strong | `migrations/051_arp_forward_pricing.sql` |
| M045 | State Management | Community | **PARTIAL** | strong | `migrations/000_base_schema.sql` |
| M046 | SHG Management | Community | **ABSENT** | — | — |
| M047 | Cooperative Management | Community | **PARTIAL** | strong | `migrations/012_governance_module.sql`<br>`migrations/012_governance_module.sql` |
| M048 | Producer Group Management | Community | **PARTIAL** | subject | `migrations/027_gi_intelligence_schema.sql` |
| M049 | Community Asset Management | Community | **ABSENT** | — | — |
| M050 | Rural Development Management | Community | **PARTIAL** | subject | `migrations/041_rural_life_os_schema.sql`<br>`migrations/041_rural_life_os_schema.sql`<br>`migrations/041_rural_life_os_schema.sql` |
| M051 | FPO Registration | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M052 | FPO Governance | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M053 | FPO Membership | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M054 | FPO Finance | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M055 | FPO Procurement | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M056 | FPO Inventory | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M057 | FPO Marketing | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M058 | FPO Sales | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M059 | FPO Compliance | FPO | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M060 | FPO Analytics | FPO | **PARTIAL** | strong | `migrations/000_base_schema.sql`<br>`migrations/056_named_missing_modules.sql`<br>`migrations/056_named_missing_modules.sql` |
| M061 | Crop Planning | Crop | **NO_UI** | strong | `backend/src/services/cropPlanningService.js`<br>`migrations/011_farmer_portal_enhancements.sql`<br>`migrations/018_biodiversity_schema.sql` |
| M062 | Crop Calendar | Crop | **NO_UI** | subject | `migrations/011_farmer_portal_enhancements.sql`<br>`migrations/018_biodiversity_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M063 | Crop Registration | Crop | **NO_UI** | subject | `migrations/011_farmer_portal_enhancements.sql`<br>`migrations/018_biodiversity_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M064 | Crop Variety Management | Crop | **NO_UI** | subject | `migrations/011_farmer_portal_enhancements.sql`<br>`migrations/018_biodiversity_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M065 | Seed Planning | Crop | **PARTIAL** | subject | `frontend/src/pages/SeedVaultPage.jsx` |
| M066 | Nursery Management | Crop | **ABSENT** | — | — |
| M067 | Sowing Management | Crop | **ABSENT** | — | — |
| M068 | Crop Monitoring | Crop | **NO_UI** | subject | `migrations/011_farmer_portal_enhancements.sql`<br>`migrations/018_biodiversity_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M069 | Harvest Planning | Crop | **PARTIAL** | strong | `frontend/src/pages/HarvestPlanPage.jsx`<br>`migrations/038_organic_traceability_schema.sql`<br>`frontend/src/pages/HarvestScorePage.jsx` |
| M070 | Yield Recording | Crop | **PARTIAL** | subject | `migrations/991_aeos_folu_ne_policy.sql` |
| M071 | Soil Health Management | Soil | **NO_UI** | subject | `backend/src/services/soilTestingService.js` |
| M072 | Soil Test Management | Soil | **NO_UI** | strong | `backend/src/services/soilTestingService.js` |
| M073 | Nutrient Management | Soil | **PARTIAL** | strong | `migrations/036_nutrition_intelligence_schema.sql`<br>`migrations/036_nutrition_intelligence_schema.sql` |
| M074 | Fertility Management | Soil | **ABSENT** | — | — |
| M075 | Irrigation Management | Water | **ABSENT** | — | — |
| M076 | Water Budgeting | Water | **ABSENT** | — | — |
| M077 | Water Quality Monitoring | Water | **ABSENT** | — | — |
| M078 | Rainwater Harvesting | Water | **ABSENT** | — | — |
| M079 | Watershed Management | Water | **ABSENT** | — | — |
| M080 | Water Analytics | Water | **ABSENT** | — | — |
| M081 | Weather Monitoring | Climate | **BUILT** | subject | `migrations/057_climate_weather_d14.sql`<br>`migrations/057_climate_weather_d14.sql`<br>`migrations/057_climate_weather_d14.sql` |
| M082 | Weather Forecasting | Climate | **BUILT** | subject | `migrations/057_climate_weather_d14.sql`<br>`migrations/057_climate_weather_d14.sql`<br>`migrations/057_climate_weather_d14.sql` |
| M083 | Climate Advisory | Climate | **PARTIAL** | subject | `migrations/057_climate_weather_d14.sql`<br>`migrations/057_climate_weather_d14.sql`<br>`migrations/057_climate_weather_d14.sql` |
| M084 | Disaster Alerts | Climate | **ABSENT** | — | — |
| M085 | Drought Monitoring | Climate | **ABSENT** | — | — |
| M086 | Flood Monitoring | Climate | **ABSENT** | — | — |
| M087 | Pest Forecasting | Climate | **PARTIAL** | subject | `migrations/057_climate_weather_d14.sql` |
| M088 | Disease Forecasting | Climate | **PARTIAL** | subject | `migrations/057_climate_weather_d14.sql` |
| M089 | Climate Risk Assessment | Climate | **PARTIAL** | strong | `migrations/057_climate_weather_d14.sql`<br>`migrations/057_climate_weather_d14.sql`<br>`migrations/057_climate_weather_d14.sql` |
| M090 | Agro-Meteorology | Climate | **PARTIAL** | subject | `migrations/057_climate_weather_d14.sql` |
| M091 | Farm Activity Management | Operations | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M092 | Farm Task Scheduling | Operations | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M093 | Labour Management | Operations | **ABSENT** | — | — |
| M094 | Contractor Management | Operations | **PARTIAL** | strong | `migrations/000_base_schema.sql`<br>`migrations/054_v8_v9_commerce_recovery.sql` |
| M095 | Machinery Operations | Operations | **PARTIAL** | subject | `migrations/041_rural_life_os_schema.sql` |
| M096 | Equipment Scheduling | Operations | **PARTIAL** | subject | `migrations/023_engineering_schema.sql`<br>`migrations/033_laboratory_erp_schema.sql`<br>`migrations/053_v42_recovered_finance.sql` |
| M097 | Input Consumption | Operations | **PARTIAL** | subject | `migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M098 | Farm Costing | Operations | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M099 | Farm Productivity | Operations | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M100 | Farm Operations Dashboard | Operations | **BUILT** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/011_farmer_portal_enhancements.sql` |
| M101 | Tractor Management | Machinery | **ABSENT** | — | — |
| M102 | Implement Management | Machinery | **ABSENT** | — | — |
| M103 | Equipment Inventory | Machinery | **PARTIAL** | subject | `migrations/023_engineering_schema.sql`<br>`migrations/033_laboratory_erp_schema.sql`<br>`migrations/053_v42_recovered_finance.sql` |
| M104 | Equipment Rental | Machinery | **PARTIAL** | subject | `migrations/023_engineering_schema.sql`<br>`migrations/033_laboratory_erp_schema.sql`<br>`migrations/053_v42_recovered_finance.sql` |
| M105 | Fleet Management | Machinery | **PARTIAL** | strong | `migrations/013_logistics_enhancements.sql` |
| M106 | Preventive Maintenance | Machinery | **BUILT** | subject | `backend/src/services/preSeasonOrderService.js`<br>`frontend/src/pages/PreOrderPage.jsx` |
| M107 | Breakdown Maintenance | Machinery | **ABSENT** | — | — |
| M108 | Fuel Management | Machinery | **ABSENT** | — | — |
| M109 | Spare Parts Management | Machinery | **ABSENT** | — | — |
| M110 | Asset Lifecycle Management | Machinery | **PARTIAL** | subject | `migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql`<br>`migrations/000_base_schema.sql` |
| M111 | Seed Inventory | Input Supply | **PARTIAL** | subject | `frontend/src/pages/SeedVaultPage.jsx` |
| M112 | Fertilizer Inventory | Input Supply | **ABSENT** | — | — |
| M113 | Biofertilizer Management | Input Supply | **ABSENT** | — | — |
| M114 | Pesticide Inventory | Input Supply | **PARTIAL** | subject | `migrations/057_climate_weather_d14.sql` |
| M115 | Bio-Pesticide Management | Input Supply | **NO_UI** | subject | `migrations/018_biodiversity_schema.sql`<br>`backend/src/services/biodiversityService.js` |
| M116 | Micronutrient Management | Input Supply | **ABSENT** | — | — |
| M117 | Organic Input Management | Input Supply | **BUILT** | strong | `migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M118 | Input Procurement | Input Supply | **PARTIAL** | subject | `migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M119 | Input Distribution | Input Supply | **PARTIAL** | subject | `migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M120 | Input Traceability | Input Supply | **PARTIAL** | subject | `migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql`<br>`migrations/038_organic_traceability_schema.sql` |
| M121 | Dairy Management | Livestock | **ABSENT** | — | — |
| M122 | Cattle Registry | Livestock | **ABSENT** | — | — |
| M123 | Poultry Management | Livestock | **ABSENT** | — | — |
| M124 | Goat Farming Management | Livestock | **ABSENT** | — | — |
| M125 | Sheep Farming Management | Livestock | **ABSENT** | — | — |
| M126 | Pig Farming Management | Livestock | **ABSENT** | — | — |
| M127 | Animal Health Management | Livestock | **ABSENT** | — | — |
| M128 | Feed Management | Livestock | **PARTIAL** | strong | `migrations/046_advanced_voice_ai_tables.sql` |
| M129 | Breeding Management | Livestock | **ABSENT** | — | — |
| M130 | Livestock Analytics | Livestock | **ABSENT** | — | — |
| M131 | Biofloc Farm Management | Fisheries | **ABSENT** | — | — |
| M132 | Pond Management | Fisheries | **ABSENT** | — | — |
| M133 | Hatchery Management | Fisheries | **ABSENT** | — | — |
| M134 | Fish Feed Management | Fisheries | **ABSENT** | — | — |
| M135 | Water Quality Control | Fisheries | **ABSENT** | — | — |
| M136 | Fish Health Management | Fisheries | **ABSENT** | — | — |
| M137 | Harvest Management (Fisheries) | Fisheries | **PARTIAL** | strong | `migrations/038_organic_traceability_schema.sql`<br>`frontend/src/pages/HarvestPlanPage.jsx`<br>`frontend/src/pages/HarvestScorePage.jsx` |
| M138 | Fish Processing Management | Fisheries | **ABSENT** | — | — |
| M139 | Cold Fish Chain | Fisheries | **PARTIAL** | subject | `migrations/994_recovered_capabilities.sql`<br>`migrations/994_recovered_capabilities.sql` |
| M140 | Aquaculture Analytics | Fisheries | **ABSENT** | — | — |
| M141 | Orchard Management | Horticulture | **ABSENT** | — | — |
| M142 | Vegetable Production | Horticulture | **ABSENT** | — | — |
| M143 | Floriculture Management | Horticulture | **ABSENT** | — | — |
| M144 | Greenhouse Management | Horticulture | **NO_UI** | strong | `backend/src/services/greenhouseService.js` |
| M145 | Polyhouse Management | Horticulture | **ABSENT** | — | — |
| M146 | Hydroponics Management | Horticulture | **ABSENT** | — | — |
| M147 | Aeroponics Management | Horticulture | **ABSENT** | — | — |
| M148 | Precision Horticulture | Horticulture | **BUILT** | subject | `backend/src/services/preSeasonOrderService.js`<br>`frontend/src/pages/PreOrderPage.jsx` |
| M149 | Protected Cultivation | Horticulture | **PARTIAL** | subject | `frontend/src/components/ProtectedRoute.jsx` |
| M150 | Horticulture Analytics | Horticulture | **ABSENT** | — | — |

## Modules the source names as missing

These are not inferred. Each is stated as a gap in the source document,
with the business reason quoted from it.

### 1. RFQ (Request for Quote) & Dynamic Negotiation Engine

Allow corporate buyers to post bulk requirements (e.g., "500 kg Turmeric, Grade A"). Farmers/FPOs bid anonymously. The platform takes a small success fee. Sales Hook: "Name your price; let the farm compete for your business."

### 2. Subscription / "SIP" (Systematic Investment Plan) for Staples

Allow RWAs and HoReCa to set monthly auto-orders (e.g., "50kg rice every 30 days"). This generates predictable Monthly Recurring Revenue (MRR) for the platform.

### 3. "Quote-to-Order" Conversion Dashboard

Track why quotes are lost (price vs. delivery). This gives the sales team data to adjust pricing dynamically based on real buyer behavior, not just competitor scrapes.

### 4. Sponsored GI Listings (Auction-based)

Allow high-margin brands (e.g., Lakadong Turmeric) to bid for the "Top Slot" in category searches. This creates a new revenue stream (Ad Inventory) without charging farmers directly.

### 5. Affiliate & Influencer Tracking

Generate unique referral links for food bloggers and influencers. Pay them a commission (e.g., 10%) on every sale they drive. Marketing Hook: "Earn by sharing Northeast India's story."

### 6. Pixel & Retargeting Integration

Plug in Meta (Facebook) and Google Ads pixels. When a user abandons a cart, the platform triggers a retargeting ad automatically. Without this, advertising spend is wasted.

### 7. TDS (Tax Deducted at Source) Engine

The platform generates commission revenue. Under the Income Tax Act, TDS must be deducted on payments to transporters and FPOs. This module auto-calculates TDS (e.g., 1% on transport, 2% on commission) and issues Form 16/26Q reports. Accounting Hook: "We make your tax compliance audit-proof."

### 8. Automated Bank Reconciliation (via UPI/Razorpay)

Match the platform's ledger (sales revenue, farmer payouts) with the actual bank statements via a bank API. Flag mismatches in real-time, reducing the CA's month-end workload by 80%.

### 9. Asset Capitalization & Depreciation Schedule

Link the "AF-AA" asset register to specific projects (e.g., TC-01 Cold Store). When a corporate buys a share of the cold store, the platform automatically generates their depreciation certificate for their own books.

### 10. E-Invoice IRN (Invoice Reference Number) Generation

Directly integrate with the NIC (National Informatics Centre) IRP sandbox. The moment an order is placed, the platform generates the legally valid IRN and QR code. Taxation Hook: "One click to a legally valid invoice; no manual portal entry."

### 11. GSTR-1 & GSTR-3B Auto-Population

Aggregate all B2B and B2C sales for the month and auto-generate the JSON file required to file GST returns. No re-keying of data.

### 12. Reverse Charge Mechanism (RCM) Handler

When buying from unregistered farmers (raw agricultural produce), the corporate buyer must pay GST under RCM. This module auto-calculates the RCM liability and flags it on the invoice for the CA.

### 13. Farm Plot & Land Bank Management

Move beyond "Farmer Name" to "Plot ID." Map each farmer's parcels (geo-tagged). Link each batch (lot code) to a specific plot. ERP Hook: "True 'Farm-to-Fork' traceability starts at the soil, not the warehouse gate."

### 14. Agri-Input Inventory (Seed/Fertilizer/PPE) Tracking

Track the inputs issued to farmers (via the Pre-Season Advance). Link these inputs to the final harvest yield. If a farmer uses banned pesticides, the lot is automatically flagged for export rejection.

### 15. Mandi / APMC Price Integration (Live)

Pull live prices from e-NAM and local APMCs directly into the "Sell-Timing Advisor" and "Dynamic Pricing" modules. Marketing sells this as: "Don't guess the market; read it in real-time."

### 16. Quality Control (QC) Hold & Release Workflow

If a lab report fails (e.g., Aflatoxin > limit), the system automatically blocks that lot from "Ready for Dispatch" status. Only the QC manager can "Override/Hold-Release" with a digital signature.

### 17. Multi-Location FPO Cost Centers

Allow a single large FPO to manage multiple collection centers. Each center has its own P&L (Profit & Loss) statement. CAs can audit center-wise performance, preventing internal fraud.

## SAP equivalence

| SAP module | AFRERA module | Functionality |
|---|---|---|
| General Ledger (FI‑GL) | Financial OS (Derived GL) | Double‑entry bookkeeping derived from platform events; trial balance. |
| Cost & Profit Centers (CO) | AF‑CO Controlling, Price Build‑Up | Tracks product margins, lane costs, freight variance, and transparent cost waterfall. |
| Asset Accounting (FI‑AA) | AF‑AA Asset Register | SLM depreciation, gross block, written‑down value, and asset lifecycle tracking. |
| Banking & Credit (FI‑Treasury) | Bank Lender Matcher, Escrow/TRA, EMI Calculator | Surfaces loan eligibility, escrow waterfall (statutory→debt→farmer), and loan EMIs. |
| Tax (FI‑Tax) | GST Invoice Engine v2 | HSN classification, CGST/SGST vs IGST, e‑Way bill generation (fresh produce NIL‑rated). |
| Transportation Management (TM) | AF‑TM Booking Engine, TrackDart | Lane selection, freight classes, dispatch pass, GPS‑style tracking, POD capture. |
| Warehouse Management (EWM) | Warehouse OS (Racks, FEFO, Expiry), AF‑LE (Pick/Pack/Gate) | Rack utilisation, first‑expiry‑first‑out, temperature zones, and dispatch barrier control. |
| Materials Management (MM) | Shared Infrastructure, Fixed Facilities, Mechanization Hub | Rental/co‑op/corporate access to cold stores, packhouses, and farm machinery. |
| Inventory Management (IM) | Inventory (Derived from Listings + Committed) | Real‑time available stock = listed quantity minus committed orders. |
| Order Management | Order Orchestration, Procurement Ops (PO/RFQ) | Handles B2B purchase orders, RFQs, order‑to‑cash (O2C) workflow. |
| Pricing & Billing | Nutrient‑based Billing, Corporate MOQ Tiers | Price based on certified nutrient content and volume‑based tiered pricing. |
| Customer Relationship (CRM) | CRM Database | Master record of all registered users, buyers, FPOs, and their activity. |
| Production Orders (PP) | AF‑PP Processing, Mobile Mill Circuit | Input lot → output batch, yield %, loss tracking, batch genealogy. |
| Quality Management (QM) | Lab Reports, Organic Trust Chain, CAPA | NABL parameter results, NPOP/PGS certs, non‑conformance root‑cause analysis. |
| Maintenance (EAM/PM) | AF‑PM Maintenance | Calibration, preventive, and breakdown tickets with expiry‑based dispatch blocking. |
| Personnel Management | AF‑HCM Field Operations | Staff certification (DL, FoSTaC), expiry alerts, and duty assignment. |
| Master Data Governance (MDM) | AF‑MDM Master Data | Single source of truth for products, lots, lanes, assets, and schemes. |
| Governance, Risk & Compliance (GRC) | AF‑SEC Security, User Management, Audit Trail | Role‑based gating, segregation of duties, and tamper‑evident event ledger. |

## Screen specifications

| Screen / feature | Operation | Wiring |
|---|---|---|
| Login (OTP-based) | Driver enters phone number. Server sends OTP. | Links to /fieldops (certification check). If DL expired, login is blocked. |
| Availability Toggle | Swipe "Go Online" / "Go Offline". Sends GPS location to server every 5 seconds. | Updates driver_availability table. Feeds real-time data to the /orderrouting AI. |
| Job List / Offer | Receives a push notification for a new order. Shows Pickup Location, Weight, Distance, Estimated Earning. | Triggered by the server's RouteAssignment() action (Part 1.2). |
| Accept / Reject | Driver taps "Accept". Server locks the order and assigns it. | Updates shipments.assigned_driver_id and orders.status. |
| Navigation | Opens integrated Maps (Google/OSM) to the pickup point. | N/A (Utility). |
| Scan & Pickup | Driver scans a QR code on the farmer's consignment label. Marks "Picked Up". | Updates shipments.status = IN_TRANSIT. Sends SMS to buyer. |
| Delivery & OTP | Driver reaches buyer location. Buyer provides a 4-digit OTP (from SMS). Driver enters OTP to complete. | Calls the Escrow Release API (Part 1.2). Triggers the platform settlement. |
| Earnings Wallet | Shows daily trip count, total earnings, payout history. | Reads from the transactions table. |
| Ticket Queue | Lists all open complaints (/care) with an SLA timer. | Fetches from complaints table. Sorts by sla_deadline (SLA breach alerts). |
| Agent Assignment | Agent taps "Assign to Me". Complaint status changes from "Open" to "Assigned". | Updates complaints.assigned_agent_id. Logs the action in the audit trail. |
| Warehouse / FEFO Picking | Warehouse agent receives a "Pick List" for a new order. Scans barcode of the rack to confirm. | Connects to /warehouse module. Updates inventory_lots.qty_available in real-time. |
| Facility Approvals | Approves cold-storage bookings (/facilities) or Media Uploads (/medialibrary). | Updates facility_bookings.status or media_assets.status. |
| New Order Alert | Farmer receives a push notification when a buyer places an order for their MAP-A floor. | Fetches from inventory_lots and orders table. |
| Dynamic Pricing Suggestion | Farmer receives an AI-generated price adjustment suggestion (from /dynamicpricing) on their dashboard. | Pushes recommendations from dpRecommend() calculation. |
| Payout Notification | Farmer gets a "Money Credited" alert when the escrow is released. | Triggered by Transaction.Settled event. |
