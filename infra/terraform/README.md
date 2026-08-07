# Terraform infra (scaffold)

This folder contains a minimal Terraform scaffold used by CI to run `terraform plan`.

Before running in your environment:

- Configure AWS credentials in your environment or CI secrets.
- Configure a remote state backend (S3 + DynamoDB) for team use. Add backend configuration in `backend.tf`.
- This example is intentionally minimal: it creates an S3 bucket and an ECR repository as a starting point.

Commands (local):

```bash
cd infra/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```
