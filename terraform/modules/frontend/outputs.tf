output "bucket_name" {
  description = "Name of the GCS bucket hosting the frontend"
  value       = google_storage_bucket.frontend.name
}

output "bucket_url" {
  description = "URL of the GCS bucket"
  value       = google_storage_bucket.frontend.url
}

