output "cloudrun_service_account_email" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloudrun.email
}

output "cloudbuild_service_account_email" {
  description = "Cloud Build service account email"
  value       = google_service_account.cloudbuild.email
}
