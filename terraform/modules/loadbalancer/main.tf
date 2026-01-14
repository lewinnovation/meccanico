# Reserve a global static IP address
resource "google_compute_global_address" "lb_ip" {
  name    = "meccanico-lb-ip-${var.environment}"
  project = var.project_id
}

# SSL certificate for primary domain
resource "google_compute_managed_ssl_certificate" "domain_cert" {
  name    = "meccanico-domain-cert-${var.environment}"
  project = var.project_id

  managed {
    domains = [var.domain]
  }
}

resource "google_compute_managed_ssl_certificate" "cert" {
  name    = "meccanico-cert-${var.environment}"
  project = var.project_id

  managed {
    domains = [var.domain, var.api_subdomain]
  }
}

# Backend service for backend Cloud Run
resource "google_compute_backend_service" "backend" {
  name                  = "meccanico-backend-${var.environment}"
  project               = var.project_id
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  enable_cdn            = false
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.backend_neg.id
  }

}

# Backend bucket for frontend GCS
resource "google_compute_backend_bucket" "frontend" {
  name        = "meccanico-frontend-bucket-${var.environment}"
  project     = var.project_id
  bucket_name = var.frontend_bucket_name
  enable_cdn  = true
}

# Network endpoint group for backend
resource "google_compute_region_network_endpoint_group" "backend_neg" {
  name                  = "meccanico-backend-neg-${var.environment}"
  network_endpoint_type = "SERVERLESS"
  region                = split("/", var.backend_service)[3]
  project               = var.project_id
  cloud_run {
    service = split("/", var.backend_service)[5]
  }
}

# URL map for routing
resource "google_compute_url_map" "url_map" {
  name            = "meccanico-url-map-${var.environment}"
  project         = var.project_id
  default_service = google_compute_backend_bucket.frontend.id

  host_rule {
    hosts        = [var.domain]
    path_matcher = "allpaths"
  }

  host_rule {
    hosts        = [var.api_subdomain]
    path_matcher = "api"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_bucket.frontend.id
  }

  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.backend.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.backend.id
    }
  }
}

# HTTPS proxy for primary domain
resource "google_compute_target_https_proxy" "domain_proxy" {
  name             = "meccanico-domain-proxy-${var.environment}"
  project          = var.project_id
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
}

# Forwarding rule for primary domain
resource "google_compute_global_forwarding_rule" "domain_forwarding" {
  name       = "meccanico-domain-forwarding-${var.environment}"
  project    = var.project_id
  target     = google_compute_target_https_proxy.domain_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.lb_ip.address
}

# Forwarding rule for HTTP to HTTPS redirect
resource "google_compute_global_forwarding_rule" "http_forwarding" {
  name       = "meccanico-http-forwarding-${var.environment}"
  project    = var.project_id
  target     = google_compute_target_http_proxy.http_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.lb_ip.address
}

# HTTP proxy for redirect
resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "meccanico-http-proxy-${var.environment}"
  project = var.project_id
  url_map = google_compute_url_map.http_redirect.id
}

# URL map for HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name    = "meccanico-http-redirect-${var.environment}"
  project = var.project_id

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "domain" {
  description = "Primary domain"
  type        = string
}

variable "api_subdomain" {
  description = "API subdomain"
  type        = string
}

variable "frontend_bucket_name" {
  description = "GCS bucket name for frontend static site"
  type        = string
}

variable "backend_service" {
  description = "Backend Cloud Run service URL"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
