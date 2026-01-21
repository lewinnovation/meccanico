# Service account for Cloud Run services
resource "google_service_account" "cloudrun" {
  account_id   = "meccanico-cloudrun"
  display_name = "Meccanico Cloud Run Service Account"
  project      = var.project_id
}

# Service account for Cloud Build
resource "google_service_account" "cloudbuild" {
  account_id   = "meccanico-cloudbuild"
  display_name = "Meccanico Cloud Build Service Account"
  project      = var.project_id
}

# Service account for GitHub Actions deployments
resource "google_service_account" "github_actions" {
  account_id   = "github-actions"
  display_name = "GitHub Actions Service Account"
  project      = var.project_id
}

# IAM roles for Cloud Run service account
resource "google_project_iam_member" "cloudrun_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloudrun.email}"
}

resource "google_project_iam_member" "cloudrun_vpc_access" {
  project = var.project_id
  role    = "roles/vpcaccess.user"
  member  = "serviceAccount:${google_service_account.cloudrun.email}"
}

resource "google_project_iam_member" "cloudrun_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloudrun.email}"
}

# IAM roles for Cloud Build service account
resource "google_project_iam_member" "cloudbuild_service_agent" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.builder"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_service_account_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "github_actions_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_service_account_iam_member" "github_actions_cloudrun_sa_user" {
  service_account_id = google_service_account.cloudrun.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}

locals {
  github_pool_id     = "meccanico-${var.environment}-github"
  github_provider_id = "github"
}

module "github_oidc" {
  source = "github.com/terraform-google-modules/terraform-google-github-actions-runners//modules/gh-oidc"

  project_id          = var.project_id
  pool_id             = local.github_pool_id
  provider_id         = local.github_provider_id
  attribute_condition = "assertion.repository=='${var.github_repository}'"
  sa_mapping = {
    "github-actions" = {
      sa_name   = google_service_account.github_actions.name
      attribute = "attribute.repository/${var.github_repository}"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in the form owner/name"
  type        = string
}
