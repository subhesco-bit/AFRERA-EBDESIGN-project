# ML Lifecycle, Model Governance & Monitoring Skeleton

This document is a pragmatic checklist and skeleton for implementing ML lifecycle, tracking, and monitoring for AFRERA.

## ML Lifecycle Checklist
- [ ] Data versioning and catalog (who owns datasets, schema, freshness)
- [ ] Experiment tracking (MLflow) with reproducible runs (code + params + data snapshot)
- [ ] Model evaluation: offline metrics, fairness checks, adversarial tests
- [ ] Model registry: promote models from staging → production with approvals
- [ ] Deployment: autoscaled inference endpoints (or serverless) + async batch jobs
- [ ] Monitoring: latency, throughput, accuracy (on sampled labeled data), input/data drift
- [ ] Alerting & rollback: automated rollback on drift or performance degradation
- [ ] Model cards & audit metadata for every registered model

## MLflow Skeleton

1) Install MLflow and configure remote tracking server (or use local for prototype):

```bash
pip install mlflow
mlflow server --backend-store-uri sqlite:///mlflow.db --default-artifact-root ./mlruns --host 0.0.0.0 --port 5000
```

2) Example experiment run (Python):

```python
import mlflow
mlflow.set_tracking_uri('http://mlflow-server:5000')
mlflow.set_experiment('price-forecasting')

with mlflow.start_run():
    mlflow.log_param('model', 'xgboost')
    mlflow.log_metric('rmse', 2.34)
    mlflow.sklearn.log_model(model, 'model')
```

3) Model registry: use `mlflow.register_model()` to register and promote models.

## Monitoring & Drift Detection
- Use a lightweight pipeline to sample production requests and label a small percentage for accuracy checks.
- Compute and export metrics to Prometheus: prediction latency, error rate, input feature distributions.
- Integrate with Grafana for dashboards and setup alerts for threshold breaches.

## Quick Inference Pattern
- Synchronous low-latency endpoint via autoscaled HTTP cluster (k8s), backed by Redis cache for identical requests.
- Heavy batch inference via scheduled jobs to process large datasets and update indexes.

## Next steps (implementation)
- Provide Terraform + k8s manifests for MLflow and inference service (optional).
- Add a simple Python monitoring agent that scrapes logs and pushes metrics to Prometheus.
