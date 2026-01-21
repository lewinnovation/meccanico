variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "mc-dev"
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "australia-southeast1"
}

variable "zone" {
  description = "GCP zone for resources"
  type        = string
  default     = "australia-southeast1-a"
}

variable "domain" {
  description = "Primary domain name (e.g., meccanico.com)"
  type        = string
}

variable "api_subdomain" {
  description = "API subdomain (e.g., api.meccanico.com)"
  type        = string
}

variable "database_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "database_disk_size" {
  description = "Database disk size in GB"
  type        = number
  default     = 20
}

variable "enable_high_availability" {
  description = "Enable high availability for database"
  type        = bool
  default     = false
}

variable "cloudrun_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "cloudrun_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "cloudrun_cpu" {
  description = "CPU allocation for Cloud Run services"
  type        = string
  default     = "1"
}

variable "cloudrun_memory" {
  description = "Memory allocation for Cloud Run services"
  type        = string
  default     = "512Mi"
}

variable "backend_image" {
  description = "Container image for backend service"
  type        = string
}

variable "jwt_secret" {
  description = "JWT secret for authentication (should be stored in Secret Manager in production)"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password (should be stored in Secret Manager in production)"
  type        = string
  sensitive   = true
}

variable "cors_origin" {
  description = "Allowed CORS origin"
  type        = string
  default     = "*"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "github_repository" {
  description = "GitHub repository in the form owner/name"
  type        = string
}

# SMTP Configuration
variable "smtp_host" {
  description = "SMTP host"
  type        = string
}

variable "smtp_port" {
  description = "SMTP port"
  type        = string
  default     = "587"
}

variable "smtp_user" {
  description = "SMTP user"
  type        = string
  sensitive   = true
}

variable "smtp_password" {
  description = "SMTP password"
  type        = string
  sensitive   = true
}

variable "smtp_from" {
  description = "SMTP from address"
  type        = string
}

variable "smtp_secure" {
  description = "SMTP secure connection"
  type        = string
  default     = "false" # Usually false for 587 (STARTTLS), true for 465
}

variable "smtp_require_tls" {
  description = "SMTP require TLS"
  type        = string
  default     = "true"
}

