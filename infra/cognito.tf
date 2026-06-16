# ── Cognito user pool — the single identity directory ─────────────────────────
resource "aws_cognito_user_pool" "main" {
  name                     = var.project
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT" # move to SES before real volume (50 emails/day cap)
  }

  # CUSTOM_AUTH challenge triggers (all three handled by one Lambda via triggerSource)
  lambda_config {
    define_auth_challenge          = aws_lambda_function.custom_auth.arn
    create_auth_challenge          = aws_lambda_function.custom_auth.arn
    verify_auth_challenge_response = aws_lambda_function.custom_auth.arn
  }
}

# Public mobile app client — no secret (SRP from the device); CUSTOM_AUTH used by
# the social broker. Email/password sign-in uses USER_PASSWORD_AUTH (see explicit_auth_flows).
resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.project}-app"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  # USER_PASSWORD_AUTH (not SRP): RN/Expo can't do SRP, which needs a native secure-random
  # module Expo doesn't provide. Plaintext password is sent to Cognito over TLS. CUSTOM_AUTH
  # is the social broker; REFRESH_TOKEN_AUTH for session refresh.
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  supported_identity_providers = ["COGNITO"]

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}
