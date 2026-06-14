# These feed the mobile app config (frontend) at step 5.
output "user_pool_id" {
  value       = aws_cognito_user_pool.main.id
  description = "Cognito User Pool ID."
}

output "user_pool_client_id" {
  value       = aws_cognito_user_pool_client.app.id
  description = "Cognito app client ID (public, no secret)."
}

output "auth_api_url" {
  value       = aws_apigatewayv2_stage.default.invoke_url
  description = "Base URL for the auth API. Social endpoint: POST {url}/auth/social"
}

output "region" {
  value       = var.region
  description = "AWS region."
}
