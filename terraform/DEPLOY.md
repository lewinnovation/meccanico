# Terraform Deployment Guide

## Quick Start

1. **Ensure you have the required IAM permissions** (see `docs/INFRASTRUCTURE.md`)

2. **Initialize Terraform:**
   ```bash
   cd terraform
   terraform init
   ```

3. **Review the plan:**
   ```bash
   terraform plan
   ```

4. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Pre-Deployment Checklist

- [ ] GCP project `mc-dev-482002` is accessible
- [ ] Billing is enabled for the project
- [ ] Required APIs are enabled (or will be enabled by Terraform)
- [ ] Container images are built and pushed to Artifact Registry
- [ ] `terraform.tfvars` is configured with correct values
- [ ] You have Owner or Editor + Service Account Admin roles

## Configuration Files

- `terraform.tfvars` - Your actual configuration (not in git)
- `terraform.tfvars.example` - Example configuration template
- `terraform.tfvars.production.example` - Production template (copy locally)
- `variables.tf` - Variable definitions
- `main.tf` - Main Terraform configuration
- `outputs.tf` - Output values

## Common Issues

### Permission Errors

If you get permission errors:
1. Check your IAM role: `gcloud projects get-iam-policy mc-dev-482002 --flatten="bindings[].members" --filter="bindings.members:\$(gcloud config get-value account)"`
2. Request Owner role or Editor + Service Account Admin roles
3. Or ask Owner to pre-enable APIs and create service accounts

### Container Image Not Found

Ensure your container images exist:
```bash
gcloud artifacts docker images list australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico
```

If images don't exist, build and push them:
```bash
cd backend
gcloud builds submit --tag australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/backend:latest

cd ../frontend
gcloud builds submit --tag australia-southeast1-docker.pkg.dev/mc-dev-482002/meccanico/frontend:latest
```

## Post-Deployment

After successful deployment:

1. **Get the load balancer IP:**
   ```bash
   terraform output load_balancer_ip
   ```

2. **Configure Cloudflare DNS** (see `docs/INFRASTRUCTURE.md`)

3. **Verify services are running:**
   ```bash
   gcloud run services list --region=australia-southeast1 --project=mc-dev-482002
   ```

4. **Seed the database** (if needed):
   ```bash
   # Get backend service name
   BACKEND_SERVICE=$(terraform output -raw backend_url | sed 's|https://||' | cut -d'.' -f1)
   
   # Enable seeding temporarily
   gcloud run services update $BACKEND_SERVICE \
     --set-env-vars AUTO_SEED=true \
     --region=australia-southeast1 \
     --project=mc-dev-482002
   
   # Wait a few minutes, then disable
   gcloud run services update $BACKEND_SERVICE \
     --set-env-vars AUTO_SEED=false \
     --region=australia-southeast1 \
     --project=mc-dev-482002
   ```

5. **Admin bootstrap job** (runs after backend deploy):
   - The GitHub Actions backend deploy workflows automatically execute the Cloud Run job
     `meccanico-admin-bootstrap-<environment>` after a successful deploy.
   - To run it manually:
     ```bash
     gcloud run jobs execute meccanico-admin-bootstrap-dev \
       --region=australia-southeast1 \
       --project=mc-dev-482002 \
       --wait
     ```
   - Ensure `admin_user_email` and `admin_user_password` are set in your Terraform
     variables so the job has the required env vars.

## Production Notes

- Copy `terraform.tfvars.production.example` to a local `terraform.prod.tfvars`
- Run `terraform plan -var-file=terraform.prod.tfvars` and `terraform apply -var-file=terraform.prod.tfvars`

## Troubleshooting

See `docs/INFRASTRUCTURE.md` for detailed troubleshooting steps.
