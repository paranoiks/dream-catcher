variable "region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region (must match the bootstrap stack)."
}

variable "project" {
  type        = string
  default     = "dream-catcher"
  description = "Project name, used as a resource prefix."
}

# ── Social provider audiences (filled in once the Apple/Google apps exist) ─────
# Leave empty for now; the broker simply rejects social logins until set.
variable "google_client_ids" {
  type        = list(string)
  default     = []
  description = "Accepted Google OAuth client IDs (web, iOS, android) — the idToken 'aud' must match one."
}

variable "apple_audiences" {
  type        = list(string)
  default     = ["com.paranoiks.dreamcatcher"]
  description = "Accepted Apple 'aud' values — the iOS app bundle identifier (and Services ID for web)."
}
