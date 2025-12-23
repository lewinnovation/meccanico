# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "meccanico-vpc"
  auto_create_subnetworks = false
  project                 = var.project_id
}

# Subnet for Cloud Run
resource "google_compute_subnetwork" "subnet" {
  name          = "meccanico-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
  project       = var.project_id

  private_ip_google_access = true
}

# Private IP range for Cloud SQL
resource "google_compute_global_address" "private_ip_range" {
  name          = "meccanico-private-ip-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
  project       = var.project_id
}

# Private VPC connection for Cloud SQL
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]

  depends_on = [
    google_compute_global_address.private_ip_range
  ]
}

# VPC Access Connector for Cloud Run
resource "google_vpc_access_connector" "connector" {
  name          = "meccanico-vpc-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
  project       = var.project_id

  depends_on = [
    google_compute_network.vpc
  ]
}

# Enable required APIs for networking
# resource "google_project_service" "networking_api" {
#   project = var.project_id
#   service = "compute.googleapis.com"
#
#   disable_dependent_services = false
#   disable_on_destroy         = false
# }
#
# resource "google_project_service" "servicenetworking_api" {
#   project = var.project_id
#   service = "servicenetworking.googleapis.com"
#
#   disable_dependent_services = false
#   disable_on_destroy         = false
# }
#
# resource "google_project_service" "vpcaccess_api" {
#   project = var.project_id
#   service = "vpcaccess.googleapis.com"
#
#   disable_dependent_services = false
#   disable_on_destroy         = false
# }

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}
