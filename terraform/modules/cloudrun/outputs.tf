output "backend_service_url" {
  description = "Backend Cloud Run service URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "backend_service_name" {
  description = "Backend Cloud Run service name"
  value       = google_cloud_run_v2_service.backend.name
}
