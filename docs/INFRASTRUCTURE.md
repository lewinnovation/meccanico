# Infrastructure Setup Guide

This guide walks you through setting up the Meccanico infrastructure on Google Cloud Platform using Terraform.

## Architecture Overview

```
Cloudflare DNS → Google Cloud Load Balancer → Cloud Run Services
                                              ├── Frontend (Port 3000)
                                              └── Backend (Port 4000)
                                                      ↓
                                              Cloud SQL PostgreSQL (Private IP)
```

## Prerequisites

Before you begin, ensure you have:

1. **Google Cloud Platform Account**
   - Active GCP account with billing enabled
   - Access to project: `mc-dev-482002`
   - Owner or Editor role on the project

2. **Terraform**
   - Terraform >= 1.5.0 installed
   - Verify: `terraform version`

3. **Google Cloud SDK (gcloud CLI)**
   - Installed and configured
   - Verify: `gcloud version`
   - Authenticated: `gcloud auth login`

4. **Cloudflare Account**
   - Access to DNS management for your domain
   - Domain registered and managed in Cloudflare

5. **Container Images**
   - Backend and frontend container images built and pushed to Artifact Registry or Container Registry


## Required IAM Permissions

Before running Terraform, ensure your GCP account has the necessary IAM permissions. The Terraform configuration requires permissions to:

1. **Enable APIs** - Enable Google Cloud APIs for the project
2. **Create Service Accounts** - Create service accounts for Cloud Run and Cloud Build
3. **Manage IAM Policies** - Assign IAM roles to service accounts
4. **Create Resources** - Create Cloud Run services, Cloud SQL instances, VPC networks, etc.

### Required IAM Roles

Your account needs one of the following roles on the project:

**Option 1: Owner Role (Recommended for Development)**
- Role: `roles/owner`
- Grants all permissions needed for Terraform

**Option 2: Editor + Service Account Admin (More Restrictive)**
- Role: `roles/editor` - For creating and managing resources
- Role: `roles/iam.serviceAccountAdmin` - For creating service accounts
- Role: `roles/serviceusage.serviceUsageAdmin` - For enabling APIs

### Check Your Current Permissions

Verify your current IAM role on the project:

```bash
# Get your current account email
gcloud config get-value account

# Check your IAM bindings on the project
gcloud projects get-iam-policy mc-dev-482002 \
  --flatten="bindings[].members" \
  --filter="bindings.members:\$(gcloud config get-value account)" \
  --format="table(bindings.role)"
```

### Grant Required Permissions

If you don't have sufficient permissions, ask a project Owner or Organization Admin to grant them:

```bash
# Grant Owner role (replace YOUR_EMAIL with your GCP account email)
gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="user:YOUR_EMAIL" \
  --role="roles/owner"
```

Or grant the more restrictive set of roles:

```bash
# Grant Editor role
gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="user:YOUR_EMAIL" \
  --role="roles/editor"

# Grant Service Account Admin role
gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="user:YOUR_EMAIL" \
  --role="roles/iam.serviceAccountAdmin"

# Grant Service Usage Admin role
gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="user:YOUR_EMAIL" \
  --role="roles/serviceusage.serviceUsageAdmin"
```

**Note:** Only users with `roles/owner` or `roles/resourcemanager.projectIamAdmin` can grant these permissions.

### Alternative: Pre-Enable APIs and Create Service Accounts

If you cannot get the required permissions, you can:

1. **Ask an Owner to enable APIs** (see "Enable Required APIs" section below)
2. **Ask an Owner to create service accounts** (see "Service Account Creation" section below)
3. **Then run Terraform** - Terraform will skip creating resources that already exist


## Initial GCP Setup

### 1. Set Default Project

```bash
gcloud config set project mc-dev-482002
```

### 2. Verify Billing

Ensure billing is enabled for the project:

```bash
gcloud beta billing projects describe mc-dev-482002
```

This will show the billing account linked to your project. If no billing account is linked, you'll need to link one.

To list available billing accounts:

```bash
gcloud beta billing accounts list
```

If billing is not enabled, link a billing account:

```bash
gcloud beta billing projects link mc-dev-482002 --billing-account=YOUR_BILLING_ACCOUNT_ID
```

Replace `YOUR_BILLING_ACCOUNT_ID` with the billing account ID from the list command above.

**Note:** You can also enable billing through the [GCP Console](https://console.cloud.google.com/billing).

### 3. Enable Required APIs

The Terraform configuration will automatically enable required APIs when you run `terraform apply`. However, you may want to enable them manually first to avoid any delays during deployment.

#### Option 1: Enable APIs via gcloud CLI (Recommended)

Enable all required APIs at once:

```bash
# Set your project
gcloud config set project mc-dev-482002

# Enable all required APIs
gcloud services enable run.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  --project=mc-dev-482002
```

#### Option 2: Enable APIs Individually

If you prefer to enable them one by one:

```bash
# Cloud Run API (required for Cloud Run services)
gcloud services enable run.googleapis.com --project=mc-dev-482002

# Cloud SQL Admin API (required for Cloud SQL database)
gcloud services enable sqladmin.googleapis.com --project=mc-dev-482002

# Compute Engine API (required for VPC, load balancer, networking)
gcloud services enable compute.googleapis.com --project=mc-dev-482002

# VPC Access API (required for VPC connector)
gcloud services enable vpcaccess.googleapis.com --project=mc-dev-482002

# Service Networking API (required for private service connection)
gcloud services enable servicenetworking.googleapis.com --project=mc-dev-482002

# Cloud Build API (required for building container images)
gcloud services enable cloudbuild.googleapis.com --project=mc-dev-482002

# Artifact Registry API (required for storing container images)
gcloud services enable artifactregistry.googleapis.com --project=mc-dev-482002

# Secret Manager API (optional, for managing secrets)
gcloud services enable secretmanager.googleapis.com --project=mc-dev-482002

# Cloud Resource Manager API (required for project operations)
gcloud services enable cloudresourcemanager.googleapis.com --project=mc-dev-482002

# Identity and Access Management API (required for service accounts)
gcloud services enable iam.googleapis.com --project=mc-dev-482002
```

#### Option 3: Enable APIs via GCP Console

1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Search for each API by name
3. Click on the API and click "Enable"

#### Verify Enabled APIs

Check which APIs are currently enabled:

```bash
gcloud services list --enabled --project=mc-dev-482002
```

You should see all the required APIs in the list:

- ✅ Cloud Run API (`run.googleapis.com`)
- ✅ Cloud SQL Admin API (`sqladmin.googleapis.com`)
- ✅ Compute Engine API (`compute.googleapis.com`)
- ✅ VPC Access API (`vpcaccess.googleapis.com`)
- ✅ Service Networking API (`servicenetworking.googleapis.com`)
- ✅ Cloud Build API (`cloudbuild.googleapis.com`)
- ✅ Artifact Registry API (`artifactregistry.googleapis.com`)
- ✅ Secret Manager API (`secretmanager.googleapis.com`)
- ✅ Cloud Resource Manager API (`cloudresourcemanager.googleapis.com`)
- ✅ Identity and Access Management API (`iam.googleapis.com`)

**Note:** API enablement can take a few minutes. Wait for all APIs to be enabled before proceeding with Terraform deployment.

## Service Account Creation

Terraform will create the necessary service accounts automatically. However, for manual operations or CI/CD, you may need to create service accounts with specific roles.

### Option 1: Let Terraform Create Service Accounts (Recommended)

The Terraform configuration includes an IAM module that creates:
- `meccanico-cloudrun@mc-dev-482002.iam.gserviceaccount.com` - For Cloud Run services
- `meccanico-cloudbuild@mc-dev-482002.iam.gserviceaccount.com` - For Cloud Build

These will be created automatically when you run `terraform apply`.

### Option 2: Manual Service Account Creation

If you need to create service accounts manually:

#### Cloud Run Service Account

```bash
gcloud iam service-accounts create meccanico-cloudrun \
  --display-name="Meccanico Cloud Run Service Account" \
  --project=mc-dev-482002

gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="serviceAccount:meccanico-cloudrun@mc-dev-482002.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="serviceAccount:meccanico-cloudrun@mc-dev-482002.iam.gserviceaccount.com" \
  --role="roles/vpcaccess.user"

gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="serviceAccount:meccanico-cloudrun@mc-dev-482002.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### Cloud Build Service Account

```bash
gcloud iam service-accounts create meccanico-cloudbuild \
  --display-name="Meccanico Cloud Build Service Account" \
  --project=mc-dev-482002

gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="serviceAccount:meccanico-cloudbuild@mc-dev-482002.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="serviceAccount:meccanico-cloudbuild@mc-dev-482002.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="serviceAccount:meccanico-cloudbuild@mc-dev-482002.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding mc-dev-482002 \
  --member="serviceAccount:meccanico-cloudbuild@mc-dev-482002.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

## Terraform Configuration

### 1. Prepare Container Images

Before deploying, ensure your container images are built and pushed to Artifact Registry or Container Registry.

#### Create Artifact Registry Repository (if needed)

```bash
gcloud artifacts repositories create meccanico \
  --repository-format=docker \
  --location=australia-southeast1 \
  --description="Meccanico container images" \
  --project=mc-dev-482002
```

#### Build and Push Images

```bash
# Build and push backend
cd backend
gcloud builds submit --tag australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/backend:latest

# Build and push frontend
cd ../frontend
gcloud builds submit --tag australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/frontend:latest
```

### 2. Configure Terraform Variables

Copy the example variables file:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and update the following required variables:

```hcl
# Domain Configuration
domain        = "yourdomain.com"
api_subdomain = "api.yourdomain.com"

# Container Images
backend_image  = "australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/backend:latest"
frontend_image = "australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/frontend:latest"

# Security (use strong, unique values)
jwt_secret  = "your-super-secure-jwt-secret-key"
db_password = "your-secure-database-password"

# CORS (in production, set to your domain)
cors_origin = "https://yourdomain.com"
```

**Important Security Notes:**
- Never commit `terraform.tfvars` to version control (it's in `.gitignore`)
- For production, use Google Secret Manager for sensitive values
- Use strong, randomly generated passwords and secrets

### 3. Initialize Terraform

```bash
cd terraform
terraform init
```

This will download the required providers and initialize the backend.

### 4. Review Terraform Plan

```bash
terraform plan
```

Review the plan carefully. It should show:
- VPC network and subnets
- Cloud SQL PostgreSQL instance
- Service accounts and IAM bindings
- Two Cloud Run services (frontend and backend)
- Load balancer with SSL certificates
- Network endpoint groups and health checks

### 5. Apply Terraform Configuration

```bash
terraform apply
```

Type `yes` when prompted. This will create all resources. The process may take 10-15 minutes, especially for the Cloud SQL instance and SSL certificates.

**Note:** SSL certificate provisioning can take up to 60 minutes. The load balancer will be created, but SSL certificates may still be provisioning.

### 6. Get Output Values

After successful deployment, get the load balancer IP:

```bash
terraform output load_balancer_ip
```

Save this IP address for Cloudflare DNS configuration.

## Cloudflare DNS Setup

### 1. Get Load Balancer IP

```bash
cd terraform
terraform output load_balancer_ip
```

### 2. Configure DNS Records in Cloudflare

1. Log in to your Cloudflare dashboard
2. Select your domain
3. Go to DNS → Records

#### Create Root Domain Record

- **Type:** A
- **Name:** @ (or your root domain)
- **IPv4 address:** [Load balancer IP from terraform output]
- **Proxy status:** Proxied (orange cloud) ✅
- **TTL:** Auto

#### Create API Subdomain Record

- **Type:** A
- **Name:** api
- **IPv4 address:** [Load balancer IP from terraform output]
- **Proxy status:** Proxied (orange cloud) ✅
- **TTL:** Auto

### 3. Configure SSL/TLS Settings

1. In Cloudflare dashboard, go to SSL/TLS
2. Set SSL/TLS encryption mode to **Full** or **Full (strict)**
   - **Full:** Allows self-signed certificates (good for initial setup)
   - **Full (strict):** Requires valid certificates (recommended for production)

**Note:** If using "Full (strict)", ensure GCP SSL certificates are fully provisioned (can take up to 60 minutes).

### 4. Verify DNS Propagation

Wait a few minutes for DNS propagation, then verify:

```bash
# Check root domain
dig yourdomain.com

# Check API subdomain
dig api.yourdomain.com
```

Both should resolve to the load balancer IP.

## Post-Deployment Tasks

### 1. Verify Services

Check that Cloud Run services are running:

```bash
gcloud run services list --region=australia-southeast1 --project=mc-dev
```

### 2. Test Endpoints

```bash
# Test frontend
curl https://yourdomain.com

# Test backend
curl https://api.yourdomain.com/health
```

### 3. Database Seeding

Connect to the database and seed initial data:

```bash
# Get database connection name
terraform output database_connection_name

# Connect using Cloud SQL Proxy or gcloud
gcloud sql connect meccanico-postgres-dev \
  --user=meccanico \
  --database=meccanico \
  --project=mc-dev-482002
```

Or use Cloud Run to execute seeding:

```bash
# Get backend service name
BACKEND_SERVICE=$(terraform output -raw backend_url | sed 's|https://||' | cut -d'.' -f1)

# Execute seeding via Cloud Run
gcloud run services update $BACKEND_SERVICE \
  --set-env-vars AUTO_SEED=true \
  --region=australia-southeast1 \
  --project=mc-dev

# Wait for seeding to complete, then disable
gcloud run services update $BACKEND_SERVICE \
  --set-env-vars AUTO_SEED=false \
  --region=australia-southeast1 \
  --project=mc-dev
```

### 4. Configure Monitoring (Optional)

Set up monitoring and alerting:

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com --project=mc-dev-482002

# Create uptime checks in Cloud Console
# Go to: Monitoring → Uptime Checks → Create Uptime Check
```

### 5. Configure Backups

Cloud SQL backups are automatically configured:
- Daily backups at 03:00
- 7-day retention
- Point-in-time recovery enabled

Verify backup settings:

```bash
gcloud sql instances describe meccanico-postgres-dev \
  --project=mc-dev-482002 \
  --format="value(settings.backupConfiguration)"
```

## Environment Variables

### Backend Environment Variables

The backend service uses the following environment variables (configured via Terraform):

- `NODE_ENV=production`
- `PORT=4000`
- `DB_HOST` - Cloud SQL private IP
- `DB_PORT=5432`
- `DB_NAME=meccanico`
- `DB_USER=meccanico`
- `DB_PASSWORD` - From terraform.tfvars
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=false`
- `JWT_SECRET` - From terraform.tfvars
- `CORS_ORIGIN` - From terraform.tfvars
- `AUTO_SEED=false`

### Frontend Environment Variables

- `VITE_API_URL` - Points to backend API URL

## Updating Infrastructure

### Update Container Images

1. Build and push new images:

```bash
gcloud builds submit --tag australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/backend:new-tag
gcloud builds submit --tag australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/frontend:new-tag
```

2. Update `terraform.tfvars`:

```hcl
backend_image  = "australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/backend:new-tag"
frontend_image = "australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/frontend:new-tag"
```

3. Apply changes:

```bash
terraform apply
```

### Scale Resources

Update `terraform.tfvars`:

```hcl
cloudrun_min_instances = 1  # Keep at least 1 instance warm
cloudrun_max_instances = 20 # Increase max instances
cloudrun_cpu           = "2"
cloudrun_memory        = "1Gi"
```

Then run `terraform apply`.

## Troubleshooting


### IAM Permission Errors

**Symptom:** Errors like:
- `Permission 'iam.serviceAccounts.create' denied`
- `Permission denied to list services for consumer container`
- `AUTH_PERMISSION_DENIED` or `IAM_PERMISSION_DENIED`

**Solution:**

1. **Verify your IAM role:**
   ```bash
   gcloud projects get-iam-policy mc-dev-482002 \
     --flatten="bindings[].members" \
     --filter="bindings.members:\$(gcloud config get-value account)" \
     --format="table(bindings.role)"
   ```

2. **If you don't have Owner or Editor role:**
   - Contact a project Owner to grant you the required permissions
   - Or ask them to enable APIs and create service accounts manually (see sections above)

3. **If you have Editor role but still get permission errors:**
   - You may need additional roles:
     ```bash
     # Ask Owner to grant these roles
     gcloud projects add-iam-policy-binding mc-dev-482002 \
       --member="user:YOUR_EMAIL" \
       --role="roles/iam.serviceAccountAdmin"
     
     gcloud projects add-iam-policy-binding mc-dev-482002 \
       --member="user:YOUR_EMAIL" \
       --role="roles/serviceusage.serviceUsageAdmin"
     ```

4. **Pre-enable APIs manually (if you can't get permissions):**
   - Have an Owner run the API enablement commands (see "Enable Required APIs" section)
   - Then Terraform will skip API enablement and proceed with resource creation

5. **Pre-create service accounts manually (if you can't get permissions):**
   - Have an Owner create the service accounts (see "Service Account Creation" section)
   - Then Terraform will use the existing service accounts


### SSL Certificate Not Provisioned

**Symptom:** Load balancer returns SSL errors or certificates show as "PROVISIONING"

**Solution:**
- Wait up to 60 minutes for SSL certificate provisioning
- Verify domain ownership in Google Search Console
- Check DNS records are correctly configured
- Use "Full" SSL mode in Cloudflare (not "Full (strict)") until certificates are ready

### Cloud Run Services Not Accessible

**Symptom:** 403 Forbidden or service not found

**Solution:**
- Verify IAM policies allow public access:
  ```bash
  gcloud run services get-iam-policy SERVICE_NAME --region=australia-southeast1
  ```
- Check service is deployed:
  ```bash
  gcloud run services list --region=australia-southeast1
  ```

### Database Connection Issues

**Symptom:** Backend cannot connect to Cloud SQL

**Solution:**
- Verify VPC connector is created and working:
  ```bash
  gcloud compute networks vpc-access connectors list --region=australia-southeast1
  ```
- Check Cloud Run service has VPC access configured
- Verify private IP range is allocated:
  ```bash
  gcloud compute addresses list --global --filter="purpose=VPC_PEERING"
  ```
- Ensure service account has `roles/cloudsql.client` role

### Load Balancer Health Checks Failing

**Symptom:** Services show as unhealthy in load balancer

**Solution:**
- Verify health check paths exist:
  - Backend: `/health` on port 4000
  - Frontend: `/` on port 3000
- Check Cloud Run service logs:
  ```bash
  gcloud run services logs read SERVICE_NAME --region=australia-southeast1
  ```
- Verify services are responding:
  ```bash
  curl https://SERVICE_URL/health
  ```

### DNS Not Resolving

**Symptom:** Domain doesn't resolve to load balancer IP

**Solution:**
- Verify DNS records in Cloudflare
- Check DNS propagation: `dig yourdomain.com`
- Ensure Cloudflare proxy is enabled (orange cloud)
- Wait for DNS propagation (can take up to 48 hours, usually much faster)

### High Costs

**Symptom:** Unexpected GCP costs

**Solution:**
- Set `cloudrun_min_instances = 0` to enable scale-to-zero
- Use smaller database tier for development: `database_tier = "db-f1-micro"`
- Review Cloud SQL instance size and disk usage
- Enable Cloud CDN for frontend (already configured)
- Monitor costs in GCP Console → Billing

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

**Warning:** This will delete all resources including the database and all data. Ensure you have backups before running this command.

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL Documentation](https://cloud.google.com/sql/docs/postgres)
- [Google Cloud Load Balancing](https://cloud.google.com/load-balancing/docs)
- [Terraform Google Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Cloud Run and Cloud SQL logs in GCP Console
3. Verify Terraform state: `terraform show`
4. Check service status: `gcloud run services list`
