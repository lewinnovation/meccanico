# GCP Project Configuration
project_id = "mc-dev-482002"
region     = "australia-southeast1"
zone       = "australia-southeast1-a"

# Domain Configuration
domain        = "mc.lwylabs.dev"
api_subdomain = "api.mc.lwylabs.dev"

# Container Images
# These should point to your container images in Artifact Registry or Container Registry
# Format: gcr.io/PROJECT_ID/IMAGE_NAME:TAG or REGION-docker.pkg.dev/PROJECT_ID/REPO/IMAGE:TAG
backend_image  = "australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/backend:latest"
frontend_image = "australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/frontend:latest"

# Database Configuration
database_tier            = "db-f1-micro"  # Options: db-f1-micro, db-g1-small, db-n1-standard-1, etc.
database_disk_size       = 20              # Disk size in GB
enable_high_availability = false           # Set to true for production HA setup

# Cloud Run Configuration
cloudrun_min_instances = 0   # Minimum number of instances (0 for scale-to-zero)
cloudrun_max_instances = 10  # Maximum number of instances
cloudrun_cpu           = "1" # CPU allocation (e.g., "1", "2", "4")
cloudrun_memory        = "512Mi" # Memory allocation (e.g., "512Mi", "1Gi", "2Gi")

# Security Configuration
# IMPORTANT: In production, use Google Secret Manager instead of plain text values
jwt_secret  = "mc-dev-482002-jwt-secret"
db_password = "password123456"

# CORS Configuration
cors_origin = "*" # In production, set to your specific domain (e.g., "https://meccanico.com")

# Environment
environment = "dev" # Options: dev, staging, prod
