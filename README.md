# Node.js App Deployment on AKS (DevOps Practice)
## 🧠 Interview Summary 

- Deployed a Node.js application on Azure Kubernetes Service (AKS)
- Used ConfigMaps & Secrets for configuration management
- Implemented health checks and rolling updates
- Exposed application using NGINX Ingress
- Enabled auto-scaling with HPA
- Packaged Kubernetes manifests using Helm
- Implemented Helm upgrade, rollback, and cleanup
- Automated deployment using GitHub Actions CI/CD

## 📌 Learning Journey Summary

This project was completed as a **5-day hands-on DevOps practice** on AKS.

The progression was intentional:

- **Day 1** – Kubernetes configuration management (ConfigMaps & Secrets)
- **Day 2** – Application reliability (Health checks & rolling updates)
- **Day 3** – Traffic exposure (Ingress controller)
- **Day 4** – Scalability (Horizontal Pod Autoscaler)
- **Day 5** – Package management (Helm install, upgrade, rollback, cleanup)

Each day builds on the previous one, simulating real production workflows.

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
├── app/                          # Node.js application
│   ├── app.js
│   └── package.json
│
├── Dockerfile                    # Docker image definition
│
├── k8s/                          # Raw Kubernetes manifests (Day 1–Day 4)
│   ├── configmap-dev.yaml
│   ├── configmap-prod.yaml
│   ├── secret-dev.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml              # Day 3 – Ingress (NGINX)
│   └── hpa.yaml                  # Day 4 – Horizontal Pod Autoscaler
│
├── nodejs-app-chart/             # Helm chart (Day 5)
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       └── hpa.yaml
│
├── .github/
│   └── workflows/
│       └── deploy-aks-helm.yml   # CI/CD pipeline (GitHub Actions)
│
└── README.md


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
## 📄 app/package.json
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
## 📄 k8s/deployment.yaml
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
## 📄 k8s/service.yaml
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

## 📄Docker File:

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

## ✅ DAY 1 — ConfigMaps & Secrets

### Why ConfigMaps & Secrets?
In real applications, configuration and secrets must not be hardcoded.
Kubernetes provides ConfigMaps and Secrets to externalize this data.

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
## ✅ Day 3 – Ingress Controller (NGINX)
⚠️ Note: In Day 3 and Day 4, Ingress and HPA were later migrated into Helm templates as part of Day 5.

---

- Installed NGINX Ingress Controller on AKS
- Exposed Node.js application using Ingress resource

## ingress.yaml
```
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "nodejs-app-chart.fullname" . }}
  labels:
    {{- include "nodejs-app-chart.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- with .Values.ingress.className }}
  ingressClassName: {{ . }}
  {{- end }}
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            {{- with .pathType }}
            pathType: {{ . }}
            {{- end }}
            backend:
              service:
                name: {{ include "nodejs-app-chart.fullname" $ }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
```

### How it was deployed
Ingress was deployed as part of the Helm chart using:

```bash
helm upgrade --install nodejs-app ./nodejs-app-chart -n dev

```
---


## ✅ Day 4 – Horizontal Pod Autoscaler (HPA)

⚠️ Note: In Day 3 and Day 4, Ingress and HPA were later migrated into Helm templates as part of Day 5.


- Configured HPA to auto-scale pods based on CPU usage

### Commands used
```bash
kubectl apply -f hpa.yaml
kubectl get hpa -n dev
```
## hpa.yaml
```
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "nodejs-app-chart.fullname" . }}
  labels:
    {{- include "nodejs-app-chart.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "nodejs-app-chart.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
{{- end }}
```
---
## ✅ Day 5 – Helm Charts (Install, Upgrade, Rollback)

Helm was used to package Kubernetes manifests into reusable charts.
This allows versioned deployments, upgrades, and rollbacks.

  
```bash
helm upgrade nodejs-app . -n dev
helm history nodejs-app -n dev
helm rollback nodejs-app 1 -n dev
```
Rollback
🔹Helm History

Used to view all releases and revisions of a Helm deployment.
```
helm history nodejs-app -n dev
```
Example output:
```
REVISION  UPDATED                  STATUS       DESCRIPTION
1         Initial install          superseded   Install complete
2         Image upgrade            superseded   Upgrade complete
3         Rollback to revision 1   deployed     Rollback complete
```
🔹 Helm Upgrade

Used to deploy a new version (for example, changing the image tag).

```
helm upgrade nodejs-app ./nodejs-app-chart -n dev
```
Used to revert the application to a previous stable version.

```
helm rollback nodejs-app 1 -n dev
```
🔹 Verify Rollback
```
kubectl get pods -n dev
kubectl describe pod <pod-name> -n dev
```
🔹 Helm Uninstall (Cleanup)
```
helm uninstall nodejs-app -n dev
```
## 🔄 CI/CD with GitHub Actions

- GitHub Actions pipeline triggers on push to `main`
- Uses Helm to deploy application to AKS
- Kubeconfig is stored securely as GitHub secret
- Ensures consistent and automated deployments without manual kubectl commands

## 🎯 Outcome

- Learned Kubernetes fundamentals on AKS
- Implemented zero-downtime deployments
- Enabled auto-scaling and traffic routing
- Managed application lifecycle using Helm
- Practiced rollback and cleanup scenarios
---
## 📌 Key Learnings

- Used ConfigMaps and Secrets to separate configuration from code
- Implemented health checks for self-healing
- Performed rolling updates with zero downtime
- Exposed services using Ingress
- Enabled auto-scaling using HPA
- Migrated from raw Kubernetes YAML to Helm charts
- Automated deployment using GitHub Actions

👩‍💻 Author

Vijaya Reddy
DevOps Engineer | Azure | Kubernetes | CI/CD


