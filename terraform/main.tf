provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Enable required APIs
module "project" {
  source = "./modules/project"

  project_id = var.project_id
}

# Create networking resources
module "network" {
  source = "./modules/network"

  project_id = var.project_id
  region     = var.region

  depends_on = [
    module.project
  ]
}

# Create service accounts and IAM bindings
module "iam" {
  source = "./modules/iam"

  project_id        = var.project_id
  github_repository = var.github_repository
  environment       = var.environment

  depends_on = [
    module.project
  ]
}

# Create Secrets
module "secrets" {
  source = "./modules/secrets"

  project_id    = var.project_id
  environment   = var.environment
  db_password   = var.db_password
  jwt_secret    = var.jwt_secret
  smtp_user     = var.smtp_user
  smtp_password = var.smtp_password

  depends_on = [
    module.project
  ]
}

# Create Cloud SQL database
module "database" {
  source = "./modules/database"

  project_id               = var.project_id
  region                   = var.region
  zone                     = var.zone
  database_tier            = var.database_tier
  database_disk_size       = var.database_disk_size
  enable_high_availability = var.enable_high_availability
  db_password              = var.db_password
  vpc_connector_name       = module.network.vpc_connector_name
  private_ip_range         = module.network.private_ip_range
  vpc_network_name         = module.network.vpc_network_name
  environment              = var.environment

  depends_on = [
    module.network
  ]
}

# Create frontend resources
module "frontend" {
  source = "./modules/frontend"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment

  depends_on = [
    module.network
  ]
}

# Create Cloud Run services
module "cloudrun" {
  source = "./modules/cloudrun"

  project_id           = var.project_id
  region               = var.region
  backend_image        = var.backend_image
  vpc_connector_id     = module.network.vpc_connector_id
  cloud_sql_connection = module.database.connection_name
  db_host              = module.database.private_ip_address
  db_name              = module.database.database_name
  db_user              = module.database.database_user

  # Pass Secret IDs instead of values
  db_password_secret_id   = module.secrets.db_password_secret_id
  jwt_secret_secret_id    = module.secrets.jwt_secret_secret_id
  smtp_user_secret_id     = module.secrets.smtp_user_secret_id
  smtp_password_secret_id = module.secrets.smtp_password_secret_id

  cors_origin            = var.cors_origin
  cloudrun_min_instances = var.cloudrun_min_instances
  cloudrun_max_instances = var.cloudrun_max_instances
  cloudrun_cpu           = var.cloudrun_cpu
  cloudrun_memory        = var.cloudrun_memory
  api_url                = "https://${var.api_subdomain}"
  web_subdomain          = var.domain
  service_account_email  = module.iam.cloudrun_service_account_email
  environment            = var.environment

  # SMTP Configuration
  smtp_host        = var.smtp_host
  smtp_port        = var.smtp_port
  smtp_from        = var.smtp_from
  smtp_secure      = var.smtp_secure
  smtp_require_tls = var.smtp_require_tls

  depends_on = [
    module.network,
    module.database,
    module.iam,
    module.secrets
  ]
}

# Create load balancer
module "loadbalancer" {
  source = "./modules/loadbalancer"

  project_id           = var.project_id
  domain               = var.domain
  api_subdomain        = var.api_subdomain
  frontend_bucket_name = module.frontend.bucket_name
  backend_service      = "projects/${var.project_id}/locations/${var.region}/services/${module.cloudrun.backend_service_name}"
  environment          = var.environment

  depends_on = [
    module.cloudrun,
    module.frontend
  ]
}
