output "vpc_connector_id" {
  description = "VPC connector ID"
  value       = google_vpc_access_connector.connector.id
}

output "vpc_connector_name" {
  description = "VPC connector name"
  value       = google_vpc_access_connector.connector.name
}

output "vpc_network_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "private_ip_range" {
  description = "Private IP range name for Cloud SQL"
  value       = google_compute_global_address.private_ip_range.name
}
