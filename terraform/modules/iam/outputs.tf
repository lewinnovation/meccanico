output "cloudrun_service_account_email" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloudrun.email
}

output "cloudbuild_service_account_email" {
  description = "Cloud Build service account email"
  value       = google_service_account.cloudbuild.email
}

output "github_actions_service_account_email" {
  description = "GitHub Actions service account email"
  value       = google_service_account.github_actions.email
}

output "github_actions_pool_id" {
  description = "Workload Identity Pool ID for GitHub Actions"
  value       = local.github_pool_id
}

output "github_actions_provider_id" {
  description = "Workload Identity Provider ID for GitHub Actions"
  value       = local.github_provider_id
}

output "github_actions_workload_identity_provider" {
  description = "Full Workload Identity Provider resource name"
  value       = "projects/${var.project_id}/locations/global/workloadIdentityPools/${local.github_pool_id}/providers/${local.github_provider_id}"
}
