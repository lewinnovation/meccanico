# Backend Cloud Run service
resource "google_cloud_run_v2_service" "backend" {
  name     = "meccanico-backend-${var.environment}"
  location = var.region
  project  = var.project_id

  template {
    service_account = var.service_account_email

    scaling {
      min_instance_count = var.cloudrun_min_instances
      max_instance_count = var.cloudrun_max_instances
    }

    containers {
      image = var.backend_image

      ports {
        container_port = 4000
      }

      resources {
        limits = {
          cpu    = var.cloudrun_cpu
          memory = var.cloudrun_memory
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "DB_HOST"
        value = var.db_host
      }

      env {
        name  = "DB_PORT"
        value = "5432"
      }

      env {
        name  = "DB_NAME"
        value = var.db_name
      }

      env {
        name  = "DB_USER"
        value = var.db_user
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = var.db_password_secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "DB_SSL"
        value = "false"
      }

      env {
        name  = "DB_SSL_REJECT_UNAUTHORIZED"
        value = "false"
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.jwt_secret_secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "CORS_ORIGIN"
        value = var.cors_origin
      }

      env {
        name  = "AUTO_SEED"
        value = "false"
      }

      # SMTP Configuration
      env {
        name  = "SMTP_HOST"
        value = var.smtp_host
      }

      env {
        name  = "SMTP_PORT"
        value = var.smtp_port
      }

      env {
        name = "SMTP_USER"
        value_source {
          secret_key_ref {
            secret  = var.smtp_user_secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SMTP_PASS"
        value_source {
          secret_key_ref {
            secret  = var.smtp_password_secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "SMTP_FROM"
        value = var.smtp_from
      }

      env {
        name  = "SMTP_SECURE"
        value = var.smtp_secure
      }

      env {
        name  = "SMTP_REQUIRE_TLS"
        value = var.smtp_require_tls
      }
    }

    vpc_access {
      connector = var.vpc_connector_id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    var.cloud_sql_connection
  ]
}

# Frontend Cloud Run service
resource "google_cloud_run_v2_service" "frontend" {
  name     = "meccanico-frontend-${var.environment}"
  location = var.region
  project  = var.project_id

  template {
    service_account = var.service_account_email

    scaling {
      min_instance_count = var.cloudrun_min_instances
      max_instance_count = var.cloudrun_max_instances
    }

    containers {
      image = var.frontend_image

      ports {
        container_port = 80
      }

      resources {
        limits = {
          cpu    = var.cloudrun_cpu
          memory = var.cloudrun_memory
        }
      }

      env {
        name  = "VITE_API_URL"
        value = var.api_url
      }

      env {
        name  = "ALLOWED_HOSTS"
        value = var.web_subdomain
      }


      # Runtime environment injection happens via entrypoint
      # but we can set defaults here if needed
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

# IAM policy for backend service (allow unauthenticated access for load balancer)
resource "google_cloud_run_service_iam_member" "backend_public" {
  service  = google_cloud_run_v2_service.backend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
  project  = var.project_id
}

# IAM policy for frontend service (allow unauthenticated access for load balancer)
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_v2_service.frontend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
  project  = var.project_id
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "backend_image" {
  description = "Container image for backend service"
  type        = string
}

variable "frontend_image" {
  description = "Container image for frontend service"
  type        = string
}

variable "vpc_connector_id" {
  description = "VPC connector ID"
  type        = string
}

variable "cloud_sql_connection" {
  description = "Cloud SQL connection name"
  type        = string
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database user"
  type        = string
}

variable "db_password_secret_id" {
  description = "Database password secret ID"
  type        = string
}

variable "jwt_secret_secret_id" {
  description = "JWT secret secret ID"
  type        = string
}

variable "smtp_user_secret_id" {
  description = "SMTP user secret ID"
  type        = string
}

variable "smtp_password_secret_id" {
  description = "SMTP password secret ID"
  type        = string
}

variable "cors_origin" {
  description = "CORS origin"
  type        = string
}

variable "cloudrun_min_instances" {
  description = "Minimum Cloud Run instances"
  type        = number
}

variable "cloudrun_max_instances" {
  description = "Maximum Cloud Run instances"
  type        = number
}

variable "cloudrun_cpu" {
  description = "CPU allocation"
  type        = string
}

variable "cloudrun_memory" {
  description = "Memory allocation"
  type        = string
}

variable "api_url" {
  description = "API URL for frontend"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "smtp_host" {
  description = "SMTP host"
  type        = string
}

variable "smtp_port" {
  description = "SMTP port"
  type        = string
}

variable "smtp_from" {
  description = "SMTP from address"
  type        = string
}

variable "smtp_secure" {
  description = "SMTP secure"
  type        = string
  default     = "true"
}

variable "smtp_require_tls" {
  description = "SMTP require TLS"
  type        = string
  default     = "true"
}

variable "web_subdomain" {
  description = "Web subdomain"
  type        = string
  default     = "mc.lwylabs.dev"
}
