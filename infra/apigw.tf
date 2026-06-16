# ── HTTP API — fronts the social broker Lambda ────────────────────────────────
resource "aws_apigatewayv2_api" "auth" {
  name          = "${var.project}-auth"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
  }
}

resource "aws_apigatewayv2_integration" "social" {
  api_id                 = aws_apigatewayv2_api.auth.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.social.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "social" {
  api_id    = aws_apigatewayv2_api.auth.id
  route_key = "POST /auth/social"
  target    = "integrations/${aws_apigatewayv2_integration.social.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.auth.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }
}

resource "aws_lambda_permission" "apigw_invoke_social" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.social.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.auth.execution_arn}/*/*"
}

# ── email/password broker routes → email-auth Lambda ──────────────────────────
resource "aws_apigatewayv2_integration" "email_auth" {
  api_id                 = aws_apigatewayv2_api.auth.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.email_auth.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "email_auth" {
  for_each = toset([
    "POST /auth/signup",
    "POST /auth/confirm",
    "POST /auth/resend",
    "POST /auth/login",
    "POST /auth/forgot",
    "POST /auth/forgot-confirm",
    "POST /auth/refresh",
  ])
  api_id    = aws_apigatewayv2_api.auth.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.email_auth.id}"
}

resource "aws_lambda_permission" "apigw_invoke_email_auth" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.auth.execution_arn}/*/*"
}
