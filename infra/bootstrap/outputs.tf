# Copy these into infra/backend.hcl and your GitHub repo settings after applying.
output "state_bucket" {
  value       = aws_s3_bucket.state.id
  description = "S3 bucket for Terraform remote state (-> infra/backend.hcl)."
}

output "lock_table" {
  value       = aws_dynamodb_table.lock.name
  description = "DynamoDB table for state locking (-> infra/backend.hcl)."
}

output "region" {
  value       = var.region
  description = "AWS region (-> infra/backend.hcl)."
}

output "ci_deploy_role_arn" {
  value       = aws_iam_role.ci_deploy.arn
  description = "Role ARN for GitHub Actions (-> repo variable AWS_DEPLOY_ROLE_ARN)."
}
