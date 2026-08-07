# Infra & CI/CD Checklist (Concrete)

This checklist contains practical infra and CI/CD items to make AFRERA production-ready. Use as a gating checklist for each milestone.

## Infra checklist
- [ ] Define cloud provider(s) and account strategy (prod/stage/dev) and single source of truth for credentials.
- [ ] Infra-as-code for all infra (Terraform) with remote state and locking (S3 + DynamoDB or equivalent).
- [ ] Network & security foundations: VPC, subnets, NAT, bastion, security groups, NSGs, WAF rules.
- [ ] Centralized IAM & IdP integration (OIDC/AWS IAM, or Keycloak) and cross-account role mapping.
- [ ] Logging & observability foundation (OpenTelemetry + Prometheus + Grafana + Loki/ELK).
- [ ] Artifact registry (ECR/GCR) and secure image scanning on push.
- [ ] Secrets management (HashiCorp Vault, AWS Secrets Manager, or equivalent).
- [ ] CI runner isolation and ephemeral build environments.
- [ ] Reliable storage for forms/artifacts (S3 + lifecycle rules + encryption at rest).
- [ ] Database strategy: primary DB, read replicas, backups, PITR, encryption.

## CI/CD checklist
- [ ] Standardized pipelines per repo: build → lint → unit tests → integration tests → container build → image scan → deploy (canary) → promote.
- [ ] API contract and schema checks as a CI gate (OpenAPI validation + contract tests).
- [ ] Terraform plan step in CI and manual approval for `apply` to prod; automated apply for dev/stage if desired.
- [ ] Canary deploy + automated smoke tests + rollout metrics gating.
- [ ] Infrastructure drift detection and periodic `terraform plan` checks.
- [ ] Automated security scans (SAST, dependency scanning, container scanning) in CI.
- [ ] Automated backups & DR restore tests scheduled via pipeline.

## Sample terraform + CI snippets

Minimal `infra/terraform/main.tf` (example, adapt to your provider and naming):

```hcl
terraform {
  required_version = ">= 1.2.0"
}

variable "region" { default = "us-east-1" }

provider "aws" { region = var.region }

resource "aws_s3_bucket" "artifacts" {
  bucket = "afrera-artifacts-${random_id.bucket_id.hex}"
  acl    = "private"
}

resource "aws_ecr_repository" "app_repo" {
  name = "afrera-app"
}

output "ecr_repo" { value = aws_ecr_repository.app_repo.repository_url }
```

Minimal GitHub Actions CI (place as `.github/workflows/ci.yml`):

```yaml
name: CI

on: [push, pull_request]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci --prefix frontend
      - run: npm --prefix frontend run lint
      - run: npm --prefix frontend run test --silent -- --run

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci --prefix backend
      - run: npm --prefix backend run lint || true
      - run: npm --prefix backend run test || true

  terraform_plan:
    runs-on: ubuntu-latest
    needs: [frontend, backend]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      - name: Terraform Init
        run: |
          cd infra/terraform || true
          terraform init
      - name: Terraform Plan
        run: |
          cd infra/terraform || true
          terraform plan
```

Adapt the CI to add secret handling, TF Cloud, or remote state access as needed.
