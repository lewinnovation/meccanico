# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "postgres" {
  name             = "meccanico-postgres-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier                        = var.database_tier
    availability_type           = var.enable_high_availability ? "REGIONAL" : "ZONAL"
    disk_type                   = "PD_SSD"
    disk_size                   = var.database_disk_size
    disk_autoresize             = true
    disk_autoresize_limit       = 100
    deletion_protection_enabled  = false

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = "projects/${var.project_id}/global/networks/${var.vpc_network_name}"
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address  = true
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  depends_on = [
    var.private_ip_range,
    var.vpc_connector_name
  ]
}

# Database
resource "google_sql_database" "database" {
  name     = "meccanico"
  instance = google_sql_database_instance.postgres.name
  project  = var.project_id
}

# Database user
resource "google_sql_user" "user" {
  name     = "meccanico"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
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

variable "zone" {
  description = "GCP zone"
  type        = string
}

variable "database_tier" {
  description = "Cloud SQL instance tier"
  type        = string
}

variable "database_disk_size" {
  description = "Database disk size in GB"
  type        = number
}

variable "enable_high_availability" {
  description = "Enable high availability for database"
  type        = bool
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "vpc_connector_name" {
  description = "VPC connector name"
  type        = string
}

variable "private_ip_range" {
  description = "Private IP range name"
  type        = string
}

variable "vpc_network_name" {
  description = "VPC network name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
