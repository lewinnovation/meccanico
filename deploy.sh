#!/bin/bash
set -e

cd "$(dirname "$0")/terraform"
echo "Working directory: $(pwd)"
echo "Running Terraform apply..."

/opt/homebrew/bin/terraform apply -auto-approve

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Fetching outputs..."
/opt/homebrew/bin/terraform output
