# App stack — Cognito + Lambdas + HTTP API. State lives in the S3 backend created
# by infra/bootstrap. Backend is configured partially; supply values via
# `terraform init -backend-config=backend.hcl` (copy from backend.hcl.example).
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
  backend "s3" {
    key     = "app/terraform.tfstate"
    encrypt = true
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Stack     = "app"
    }
  }
}
