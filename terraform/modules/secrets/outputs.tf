output "db_password_secret_id" {
  value = google_secret_manager_secret.db_password.secret_id
}

output "admin_user_password_secret_id" {
  value = google_secret_manager_secret.admin_user_password.secret_id
}

output "jwt_secret_secret_id" {
  value = google_secret_manager_secret.jwt_secret.secret_id
}

output "smtp_user_secret_id" {
  value = google_secret_manager_secret.smtp_user.secret_id
}

output "smtp_password_secret_id" {
  value = google_secret_manager_secret.smtp_password.secret_id
}

