# Node.js App Deployment on AKS (DevOps Practice)

This repository contains **real-world DevOps practice tasks** performed on
**Azure Kubernetes Service (AKS)** using a Node.js application.

The project covers Kubernetes fundamentals such as:
- Namespaces
- ConfigMaps
- Secrets
- Health Checks
- Rolling Updates

---

## 🧱 Architecture Overview

- **Azure Kubernetes Service (AKS)** – container orchestration
- **Azure Container Registry (ACR)** – Docker image storage
- **Node.js** – sample application
- **Docker** – containerization
- **Kubernetes** – deployment, service, probes

---

## 📁 Project Structure

nodejs-aks-production-lab/
│
├── app/
│   ├── app.js
│   ├── package.json
│
├── Dockerfile
│
├── k8s/
│   ├── namespaces.yaml
│   ├── configmap-dev.yaml
│   ├── configmap-prod.yaml
│   ├── secret-dev.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│
├── README.md

---
## 🔧 Add Application Code
📄 app/app.js
```
const express = require('express');
const app = express();

const APP_NAME = process.env.APP_NAME || 'NodeApp';
const APP_ENV = process.env.APP_ENV || 'dev';
const DB_PASSWORD = process.env.DB_PASSWORD ? 'YES' : 'NO';

app.get('/', (req, res) => {
  res.send(`
    <h2>${APP_NAME}</h2>
    <p>Environment: ${APP_ENV}</p>
    <p>DB Password Loaded: ${DB_PASSWORD}</p>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
```
📄 app/package.json
```
{
  "name": "nodejs-aks-app",
  "version": "1.0.0",
  "description": "Node.js app for AKS DevOps practice",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```
## ☸️ Kubernetes Manifests
📄 k8s/deployment.yaml
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
  namespace: dev
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: nodejs-app
  template:
    metadata:
      labels:
        app: nodejs-app
    spec:
      containers:
      - name: nodejs-container
        image: devopsacr2040.azurecr.io/nodejs-app:v2
        ports:
        - containerPort: 3000

        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10

        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

        env:
        - name: APP_NAME
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: APP_NAME

        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: APP_ENV

        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: DB_PASSWORD
```
📄 k8s/service.yaml
```
apiVersion: v1
kind: Service
metadata:
  name: nodejs-service
  namespace: dev
spec:
  type: LoadBalancer
  selector:
    app: nodejs-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

📄Docker File:
```
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```


---

# ✅ DAY 1 — ConfigMaps & Secrets

## 🎯 Objective
- Separate configuration from application code
- Use different values for **dev** and **prod** environments

---

## 1️⃣ Namespaces Created

```bash

kubectl create namespace dev
kubectl create namespace prod

```
## 2️⃣ ConfigMaps (Dev & Prod)

## Dev ConfigMap
```
kubectl create configmap app-config \
  --from-literal=APP_NAME=NodeApp \
  --from-literal=APP_ENV=dev \
  -n dev
```
## Prod ConfigMap
```
kubectl create configmap app-config \
  --from-literal=APP_NAME=NodeApp \
  --from-literal=APP_ENV=production \
  -n prod
```

## 3️⃣ Secrets (Dev & Prod)

## Dev Secret
```
kubectl create secret generic db-secret \
  --from-literal=DB_PASSWORD=devpassword123 \
  -n dev
```
## Prod Secret
```
kubectl create secret generic db-secret \
  --from-literal=DB_PASSWORD=prodpassword456 \
  -n prod
```

---

## 4️⃣ Application Environment Variables
The application reads values using:
```
process.env.APP_NAME
process.env.APP_ENV
process.env.DB_PASSWORD
```
---

## ✅ DAY 2 — Health Checks & Rolling Updates
## 🎯 Objective

Improve application reliability

Enable Kubernetes self-healing

Perform zero-downtime deployments

---

## 1️⃣ Health Endpoint (/health)

Added in app.js:
```
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
```
---

## 2️⃣ Liveness & Readiness Probes

Configured in deployment.yaml:
```
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

Why probes?

Liveness → restarts unhealthy containers

Readiness → controls traffic flow

---

## 3️⃣ Docker Image Build & Push
```
docker build -t devopsacr2040.azurecr.io/nodejs-app:v2 .
docker push devopsacr2040.azurecr.io/nodejs-app:v2
```
---

## 4️⃣ Rolling Update
```
kubectl set image deployment/nodejs-app \
  nodejs-container=devopsacr2040.azurecr.io/nodejs-app:v2 \
  -n dev
```
Check rollout:
```
kubectl rollout status deployment nodejs-app -n dev
```
---

## 5️⃣ Service (LoadBalancer)
```
kubectl apply -f service.yaml
kubectl get svc -n dev
```
Access app via:
```
http://<EXTERNAL-IP>
```
---

## ✅ Result

Config values loaded from ConfigMap

Secret values securely injected

Health checks working

---

## 🚀 Next Steps

Day 3: Horizontal Pod Autoscaler (HPA)

Day 4: Ingress Controller

Day 5: Helm Charts

Rolling update completed without downtime

---

👩‍💻 Author

Vijaya Reddy
DevOps Engineer | Azure | Kubernetes | CI/CD


