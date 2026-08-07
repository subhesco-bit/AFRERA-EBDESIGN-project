# Terraform CI Integration

This document describes how the CI workflow runs `terraform plan` against `infra/terraform` and what secrets are required.

Required secrets in GitHub repository settings:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (optional, defaults to us-east-1)

The CI job uses `hashicorp/setup-terraform` to initialise and run `terraform plan`.

Notes:
- The `infra/terraform/backend.tf` file points to an S3 bucket `afrera-terraform-state` as a suggested remote state. Create the bucket or update the backend configuration before enabling stateful runs in CI.
- For production use, configure DynamoDB locking and a proper IAM role with least privilege.

```bash
# Local test
cd infra/terraform
terraform init
terraform plan
```
