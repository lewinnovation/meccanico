output "backend_url" {
  description = "Backend Cloud Run service URL"
  value       = module.cloudrun.backend_service_url
}

output "load_balancer_ip" {
  description = "Load balancer IP address for DNS configuration"
  value       = module.loadbalancer.load_balancer_ip
}

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = module.database.connection_name
  sensitive   = false
}

output "database_private_ip" {
  description = "Cloud SQL private IP address"
  value       = module.database.private_ip_address
  sensitive   = false
}

output "database_name" {
  description = "Database name"
  value       = module.database.database_name
}

output "database_user" {
  description = "Database user"
  value       = module.database.database_user
}

output "vpc_connector_name" {
  description = "VPC connector name"
  value       = module.network.vpc_connector_name
}

output "cloudflare_dns_instructions" {
  description = "Instructions for Cloudflare DNS configuration"
  value       = <<-EOT
    Configure the following DNS records in Cloudflare:
    
    1. Create a CNAME record for ${var.domain}:
       Name: @ (or root domain)
       Target: ${module.loadbalancer.load_balancer_ip}
       Proxy: Enabled (orange cloud)
    
    2. Create a CNAME record for ${var.api_subdomain}:
       Name: api
       Target: ${module.loadbalancer.load_balancer_ip}
       Proxy: Enabled (orange cloud)
    
    3. Set SSL/TLS mode to "Full" or "Full (strict)" in Cloudflare dashboard
    
    Note: The load balancer IP is: ${module.loadbalancer.load_balancer_ip}
  EOT
}
