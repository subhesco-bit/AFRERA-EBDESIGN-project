# HTML Files Catalog and Extraction Plan

## File Inventory

Total HTML files found: 328

### Files to Ignore (EBDESIGN project files)
- 200+ coverage report files (backend/coverage/*)
- 50+ node_modules documentation files
- Frontend build artifacts

### Priority 1: Latest AFRERA Platform Versions (CRITICAL)
1. `afrera_platform_v44.html` - Latest version
2. `afrera_platform_v44 (1).html` - Variant
3. `afrera_platform_v44 (2).html` - Variant
4. `afrera_platform_v44 (3).html` - Variant
5. `afrera_platform_v43.html` - Previous latest (UX improvements)
6. `afrera_platform_v42.html` - Business logic extraction
7. `afrera_platform_v42 (1).html` - Variant

### Priority 2: NE Harvest OS (Operating System Interface)
8. `NE Harvest OS v9.html` - Main version
9. `NE Harvest OS v9 (1).html` - Variant
10. `NE Harvest OS v9 (2).html` - Variant
11. `NE Harvest OS v9 (3).html` - Variant
12. `NE Harvest OS v9 (4).html` - Variant
13. `NE Harvest OS v9 - Standalone.html` - Standalone
14. `NE Harvest OS v9.dc.html` - Documentation

### Priority 3: Audit and Strategy Documents
15. `Platform Ultra Audit v2.dc.html` - Platform audit
16. `Platform Ultra Audit v2.dc (1).html` - Variant
17. `Platform Evaluation Report copy.dc.html` - Evaluation
18. `International Upgrade Blueprint.dc.html` - Upgrade strategy
19. `Top 10 Platform Strategy.dc.html` - Strategy

### Priority 4: Historical AFRERA Versions (for comparison)
20. `afrera_platform_v41.html`
21. `afrera_platform_v40.html`
22. `afrera_platform_v39.html`
23. `afrera_platform_v39 (1).html`
24. `afrera_platform_v39 (2).html`
25. `afrera_platform_v38.html`
26. `afrera_platform_v35.html`
27. `afrera_platform_v35 (1).html`
28. `afrera_platform_v35 (2).html`
29. `afrera_platform_v32.html`
30. `afrera_platform_v32 (1).html`
31. `afrera_platform_v31.html`
32. `afrera_platform_v30.html`
33. `afrera_platform_v29.html`
34. `afrera_platform_v28.html`
35. `afrera_platform_v26.html`
36. `afrera_platform_v25.html`
37. `afrera_platform_v25_1.html`
38. `afrera_platform_v24.html`
39. `afrera_platform_v21.html`
40. `afrera_platform_v20.html`
41. `afrera_platform_v18_1.html`
42. `afrera_platform_v18.html`
43. `afrera_platform_v18 (1).html`
44. `afrera_platform_v17.html`
45. `afrera_platform_v15.html`
46. `afrera_platform_v15 (1).html`
47. `afrera_platform_v14.html`
48. `afrera_platform_v14 (1).html`
49. `afrera_platform_v13.html`
50. `afrera_platform_v12.html`
51. `afrera_platform_v12 (1).html`
52. `afrera_platform_v11.html`
53. `afrera_platform_v10.html`
54. `afrera_platform_v10 (1).html`
55. `afrera_platform_v9.html`
56. `afrera_platform_v7.html`
57. `afrera_platform_v6.html`
58. `afrera_platform_v5.html`
59. `afrera_platform_v4.html`
60. `afrera_platform_v4 (1).html`
61. `afrera_platform_v3.html`
62. `afrera_platform_v2.html`

### Priority 5: Complete Preview Versions
63. `NE_Harvest_Complete_Preview.html`
64. `NE_Harvest_Complete_Preview (1).html`
65. `NE_Harvest_Complete_Preview (2).html`
66. `NE_Harvest_Standalone.html`
67. `NE_Harvest_Standalone (1).html`

### Priority 6: Other Specialized Files
68. `advanced_biodigester_comprehensive.html`
69. `advanced_biodigester_vol5_advanced_analysis.html`
70. `biodigester_advanced.html`
71. `cold_chain_design.html`
72. `95BN_BSF_Pipeline_GPS_CAD_VERIFIED.html`
73. `QSM15_CPCB4_Backpressure_Calc_Gurgaon.html`
74. `book_infrastructure.html`
75. `subscriptions.html`
76. `01_homepage.html`
77. `base.html`
78. `index.html`

## Extraction Strategy

### Phase 1: Latest Versions (v44, v43, v42)
These are already partially extracted. Need to:
- Compare v44 variants to identify differences
- Extract any remaining features not captured
- Identify any conflicting implementations

### Phase 2: NE Harvest OS
Extract operating system interface features:
- Desktop app interface design
- Native functionality
- System integration patterns

### Phase 3: Audit and Strategy Documents
Extract:
- Audit findings and recommendations
- Upgrade blueprint requirements
- Strategy recommendations

### Phase 4: Historical Versions
Compare evolution:
- Feature progression across versions
- Deprecated features to avoid
- Successful patterns to retain

## Next Steps

1. Extract afrera_platform_v44.html (latest)
2. Compare v44 variants
3. Extract NE Harvest OS v9.html
4. Extract Platform Ultra Audit v2.dc.html
5. Create comprehensive extraction report