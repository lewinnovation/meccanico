output "apis_enabled" {
  description = "List of enabled APIs"
  value       = keys(google_project_service.required_apis)
}
