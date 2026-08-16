# M085 - Comparative Analytics

Domain: Business Intelligence & Analytics
Status: FULLY IMPLEMENTED

## Overview
Comprehensive comparative analytics system for comparing entities across multiple metrics and dimensions. Includes group management, benchmarking, ranking, and gap analysis capabilities.

## Features
- Comparison group management
- Comparison configuration
- Multi-metric comparison
- Benchmark integration
- Ranking and scoring
- Gap analysis
- Alert configuration
- Snapshot creation
- AI-powered insights

## API Endpoints
- POST /groups - Create comparison group
- POST /configs - Create comparison configuration
- POST /comparisons/run - Run comparison
- POST /benchmarks - Add benchmark
- GET /groups/:id/benchmarks - Get benchmarks
- POST /alerts - Create comparison alert
- GET /configs/:id/alerts - Get comparison alerts
- POST /snapshots - Create snapshot
