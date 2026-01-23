resource "google_secret_manager_secret" "db_password" {
  secret_id = "meccanico-db-password-${var.environment}"
  
  replication {
    auto {}
  }

  project = var.project_id
}

resource "google_secret_manager_secret_version" "db_password" {
  secret = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

resource "google_secret_manager_secret" "admin_user_password" {
  secret_id = "meccanico-admin-user-password-${var.environment}"

  replication {
    auto {}
  }

  project = var.project_id
}

resource "google_secret_manager_secret_version" "admin_user_password" {
  secret      = google_secret_manager_secret.admin_user_password.id
  secret_data = var.admin_user_password
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "meccanico-jwt-secret-${var.environment}"
  
  replication {
    auto {}
  }

  project = var.project_id
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

resource "google_secret_manager_secret" "smtp_user" {
  secret_id = "meccanico-smtp-user-${var.environment}"
  
  replication {
    auto {}
  }

  project = var.project_id
}

resource "google_secret_manager_secret_version" "smtp_user" {
  secret = google_secret_manager_secret.smtp_user.id
  secret_data = var.smtp_user
}

resource "google_secret_manager_secret" "smtp_password" {
  secret_id = "meccanico-smtp-password-${var.environment}"
  
  replication {
    auto {}
  }

  project = var.project_id
}

resource "google_secret_manager_secret_version" "smtp_password" {
  secret = google_secret_manager_secret.smtp_password.id
  secret_data = var.smtp_password
}

