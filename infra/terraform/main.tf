terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "random_id" "bucket_id" {
  byte_length = 4
}

resource "aws_s3_bucket" "artifacts" {
  bucket = "afrera-artifacts-${random_id.bucket_id.hex}"
  acl    = "private"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_ecr_repository" "app_repo" {
  name = "afrera-app"
}

output "ecr_repo" {
  value = aws_ecr_repository.app_repo.repository_url
}
