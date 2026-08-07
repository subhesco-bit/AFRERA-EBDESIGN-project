terraform {
  backend "s3" {
    bucket = "afrera-terraform-state"
    key    = "infra/terraform/terraform.tfstate"
    region = "us-east-1"
  }
}
