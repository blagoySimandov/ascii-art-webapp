#!/bin/bash
set -e

# -----------------------------
# Student variables
# -----------------------------
DOCKER_HUB_USER_IMAGE="bsimandoff/img-ascii"
IMAGE_TAG="latest"
NUMBER_OF_REPLICAS=3
CHART_DIR="helm/img-ascii"
RELEASE_NAME="img-ascii"
SERVICE_NAME="img-ascii"

# -----------------------------
# 1. Create KIND cluster via Terraform
# -----------------------------
echo "Creating KIND cluster using Terraform..."
cd terraform
terraform init
terraform apply -auto-approve
cd ..
echo "KIND cluster created."

# -----------------------------
# 2. Package the Helm chart
# -----------------------------
echo "Packaging Helm chart..."
helm package "$CHART_DIR"

# -----------------------------
# 3. Deploy application
# -----------------------------
echo "Deploying application..."
helm install "$RELEASE_NAME" "$CHART_DIR" \
    --set image.repository="$DOCKER_HUB_USER_IMAGE" \
    --set image.tag="$IMAGE_TAG" \
    --set replicaCount=$NUMBER_OF_REPLICAS

# -----------------------------
# 4. Wait for pod readiness
# -----------------------------
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name="$RELEASE_NAME" --timeout=120s
echo "Pods are ready!"

# -----------------------------
# 5. Start port forwarding
# -----------------------------
echo "Starting port forwarding on http://127.0.0.1:8080..."
kubectl port-forward svc/"$SERVICE_NAME" 8080:8080
