# Déploiement Kubernetes – Notification Service

## Ordre de déploiement

```bash
# 1. Namespace (une seule fois pour tout Al-Mizan)
kubectl apply -f namespace.yaml

# 2. Secrets & ConfigMap
kubectl apply -f secret.yaml
kubectl apply -f configmap.yaml

# 3. Base de données PostgreSQL dédiée
kubectl apply -f postgres.yaml

# 4. Migration Prisma
kubectl apply -f migration-job.yaml
kubectl wait --for=condition=complete job/notification-service-migrate -n al-mizan --timeout=120s

# 5. Application
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml

# Vérification
kubectl get pods -n al-mizan -l app=notification-service
kubectl logs -n al-mizan -l app=notification-service --tail=50
```
