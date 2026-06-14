data "aws_caller_identity" "current" {}

# Shared secret: the social broker (having verified a provider token) answers the
# Cognito CUSTOM_AUTH challenge with this value; the trigger gates on it. This is
# what lets the broker mint Cognito tokens for social users without a password,
# while never touching email/password users' credentials.
resource "random_password" "challenge_secret" {
  length  = 48
  special = false
}

# ── Build artifacts (run `npm --prefix backend run build` first) ──────────────
data "archive_file" "custom_auth" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/dist/custom-auth"
  output_path = "${path.module}/.build/custom-auth.zip"
}

data "archive_file" "social" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/dist/social"
  output_path = "${path.module}/.build/social.zip"
}

# ── Shared Lambda assume-role policy ──────────────────────────────────────────
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# ── custom-auth trigger Lambda ────────────────────────────────────────────────
resource "aws_iam_role" "custom_auth" {
  name               = "${var.project}-custom-auth"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "custom_auth_logs" {
  role       = aws_iam_role.custom_auth.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "custom_auth" {
  name              = "/aws/lambda/${var.project}-custom-auth"
  retention_in_days = 14
}

resource "aws_lambda_function" "custom_auth" {
  function_name    = "${var.project}-custom-auth"
  role             = aws_iam_role.custom_auth.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.custom_auth.output_path
  source_code_hash = data.archive_file.custom_auth.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      CHALLENGE_SECRET = random_password.challenge_secret.result
    }
  }

  depends_on = [aws_cloudwatch_log_group.custom_auth]
}

resource "aws_lambda_permission" "cognito_invoke_custom_auth" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_auth.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

# ── social broker Lambda (POST /auth/social) ──────────────────────────────────
resource "aws_iam_role" "social" {
  name               = "${var.project}-social"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "social_logs" {
  role       = aws_iam_role.social.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "social_cognito" {
  statement {
    effect = "Allow"
    actions = [
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminInitiateAuth",
      "cognito-idp:AdminRespondToAuthChallenge",
    ]
    resources = [aws_cognito_user_pool.main.arn]
  }
}

resource "aws_iam_role_policy" "social_cognito" {
  name   = "${var.project}-social-cognito"
  role   = aws_iam_role.social.id
  policy = data.aws_iam_policy_document.social_cognito.json
}

resource "aws_cloudwatch_log_group" "social" {
  name              = "/aws/lambda/${var.project}-social"
  retention_in_days = 14
}

resource "aws_lambda_function" "social" {
  function_name    = "${var.project}-social"
  role             = aws_iam_role.social.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.social.output_path
  source_code_hash = data.archive_file.social.output_base64sha256
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      USER_POOL_ID      = aws_cognito_user_pool.main.id
      CLIENT_ID         = aws_cognito_user_pool_client.app.id
      CHALLENGE_SECRET  = random_password.challenge_secret.result
      GOOGLE_CLIENT_IDS = join(",", var.google_client_ids)
      APPLE_AUDIENCES   = join(",", var.apple_audiences)
    }
  }

  depends_on = [aws_cloudwatch_log_group.social]
}
