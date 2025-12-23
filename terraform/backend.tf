terraform {
  backend "gcs" {
    bucket = "meccanico-tfstate-dev"
    prefix = "terraform/state"
  }
}
