# Kubernetes manifests for MLflow (staging prototype)

This folder contains minimal Kubernetes manifests to run a staging MLflow server for development and testing.

Apply locally with `kubectl` (for testing only):

```bash
kubectl create namespace mlflow || true
kubectl apply -f infra/k8s/mlflow-configmap.yaml
kubectl apply -f infra/k8s/mlflow-deployment.yaml
kubectl apply -f infra/k8s/mlflow-service.yaml
```

These manifests are intentionally simple:
- Uses `sqlite` backend and `emptyDir` artifact storage — not suitable for production.
- Replace with RDS / S3 / persistent volumes for a production-ready deployment.
