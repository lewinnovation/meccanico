output "load_balancer_ip" {
  description = "Load balancer IP address"
  value       = google_compute_global_address.lb_ip.address
}

output "load_balancer_url" {
  description = "Load balancer URL"
  value       = "https://${var.domain}"
}
