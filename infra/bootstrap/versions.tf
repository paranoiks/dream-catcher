# Bootstrap stack — run ONCE locally with admin credentials. Uses local state
# (committed nowhere) because it creates the remote state backend itself.
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Stack     = "bootstrap"
    }
  }
}

variable "region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for all resources."
}

variable "project" {
  type        = string
  default     = "dream-catcher"
  description = "Project name, used as a prefix for resources."
}

variable "github_repo" {
  type        = string
  default     = "paranoiks/dream-catcher"
  description = "GitHub <owner>/<repo> allowed to assume the CI deploy role via OIDC."
}
