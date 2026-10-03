# EvaluaPro — Plataforma de Exámenes en Línea

Plataforma web integral, segura y escalable para la creación, gestión, asignación y realización de exámenes en línea con temporizador, calificación automatizada y revisión docente.

---

## 🏛 Arquitectura del Sistema

| Capa | Tecnología Seleccionada | Justificación Técnica |
| :--- | :--- | :--- |
| **Backend** | **.NET 8 Web API** + Entity Framework Core | Rendimiento de clase mundial, tipado estricto, inyección de dependencias nativa y arquitectura limpia. |
| **Base de Datos**| **PostgreSQL 16** (Azure Flexible Server) | Base de datos relacional robusta con soporte ACID, índices avanzados y tipos UUID nativos. |
| **Frontend** | **React + TypeScript + Vite** | Interfaz reactiva ultrarrápida, temporizador en tiempo real con `setInterval` y validación de formularios. |
| **Contenedores** | **Docker Alpine Multi-Stage** | Imagen ultra liviana (<110MB), sin privilegios root para cumplimiento de seguridad (Sonar/Semgrep). |
| **IaC** | **Terraform (`azurerm`)** | Infraestructura como código automatizada, reproducible y versionada. |
| **CI / CD** | **GitHub Actions** | Automatización continua para escaneo SAST, análisis de vulnerabilidades y despliegue a la nube. |

---

## 📁 Estructura del Repositorio

```text
/
├─ src/
│  ├─ Exams.Api/            # Controladores REST, autenticación JWT, Swagger OpenAPI, Dockerfile
│  ├─ Exams.Domain/         # Entidades de Dominio (User, Group, Exam, Question, Option, Submission, Answer)
│  └─ Exams.Infrastructure/ # DbContext de EF Core, inicializador con datos semilla y hash seguro
├─ tests/Exams.Tests/       # Pruebas unitarias y de integración xUnit con WebApplicationFactory
├─ frontend/                # Aplicación React + Vite + TypeScript (Dashboard Estudiante, Docente y Exámenes)
│  └─ preview.html          # Vista previa interactiva ejecutable en cualquier navegador sin instalar Node
├─ infra/                   # Aprovisionamiento de infraestructura en Azure con Terraform
├─ docs/                    # Diccionario de datos y diagramas de arquitectura en Mermaid
│  ├─ data-dictionary.md    # Diccionario de datos de la base de datos
│  ├─ er.mmd                # Diagrama Entidad-Relación (Mermaid)
│  ├─ class-diagram.mmd     # Diagrama de Clases del Dominio (Mermaid)
│  ├─ components.mmd        # Diagrama de Componentes (Mermaid)
│  └─ deployment.mmd        # Diagrama de Despliegue en la Nube (Mermaid)
├─ scripts/
│  └─ gen_docs.py           # Script automatizado para regenerar la documentación técnica
└─ .github/workflows/
   ├─ infra.yml             # Aprovisionamiento de infraestructura con Terraform
   ├─ sonar.yml             # Escaneo de código y cobertura en SonarCloud (Quality Gate)
   ├─ snyk-semgrep.yml      # Escaneo de vulnerabilidades de código e imagen de contenedor (SARIF)
   ├─ deploy.yml            # Compilación de contenedor ACR y despliegue en Container Apps y Static Web App
   └─ generate-documentation.yml # Generación automatizada de diagramas y diccionario de datos
```

---

## 🔒 Consideraciones de Seguridad Implementadas (SonarQube & Semgrep)

1. **Protección contra Fuga de Respuestas**: El backend nunca expone la propiedad `IsCorrect` ni las alternativas correctas en los endpoints `GET /exams/{id}` o `GET /questions/{examId}` cuando la petición proviene de un estudiante.
2. **Validación del Temporizador en Servidor**: El backend valida que la entrega cumpla estrictamente `SubmittedAt <= StartedAt + DurationMinutes + Tolerancia de Red`.
3. **Control de Acceso Basado en Roles (RBAC)**: Políticas de autorización con JWT Bearer (`Teacher` vs `Student`). Los estudiantes solo tienen acceso a ver sus propios resultados.
4. **Prevención de Inyección SQL**: Todas las consultas a la base de datos se ejecutan a través de Entity Framework Core con consultas parametrizadas.
5. **Contenedor Seguro sin Root**: El `Dockerfile` genera un usuario no privilegiado (`appuser`) sobre `alpine` para prevenir vulnerabilidades de elevación de privilegios.

---

## 🚀 Ejecución Local

### 1. Backend (.NET 8 Web API)
```bash
# Compilar la solución
dotnet build

# Ejecutar las pruebas unitarias e integración (xUnit)
dotnet test

# Iniciar la API REST
dotnet run --project src/Exams.Api
# Swagger UI disponible en: http://localhost:5000/ o https://localhost:5001/
```

### 2. Frontend
- **Opción Rápida (Sin dependencias)**: Abre el archivo `frontend/preview.html` directamente en tu navegador (doble clic) para interactuar inmediatamente con el temporizador, el banco de preguntas y los paneles de estudiante y docente.
- **Opción Vite**:
```bash
cd frontend
npm install
npm run dev
# Accede a http://localhost:3000
```

---

## 🌐 Pasos para Obtener las 3 URLs Finales

### 1. URL del Repositorio de GitHub
1. Inicializa el repositorio Git en la carpeta del proyecto y sube tus cambios:
   ```bash
   git init
   git add .
   git commit -m "feat: implementacion completa plataforma de examenes evaluaPro"
   git branch -M main
   git remote add origin https://github.com/<tu-usuario>/<tu-repositorio>.git
   git push -u origin main
   ```
2. **URL Resultante**: `https://github.com/<tu-usuario>/<tu-repositorio>`

---

### 2. URL de SonarCloud
1. Regístrate o inicia sesión en [SonarCloud.io](https://sonarcloud.io/).
2. Vincula tu cuenta de GitHub e importa el repositorio creado (`Analyze new project`).
3. Define las variables y secretos en GitHub (`Settings > Secrets and variables > Actions`):
   - **Secret**: `SONAR_TOKEN` (generado en SonarCloud: *My Account > Security > Generate Token*).
   - **Variables**:
     - `SONAR_PROJECT`: La clave de proyecto que asigna SonarCloud (ej. `mi-org_exams-platform`).
     - `SONAR_ORG`: El nombre de tu organización en SonarCloud.
4. Ejecuta el workflow `sonar.yml` en la pestaña *Actions* de GitHub.
5. Una vez finalizado el Quality Gate en verde (0 bugs, 0 vulnerabilidades, 0 hotspots sin revisar), copia la URL del proyecto:
   - **URL Resultante**: `https://sonarcloud.io/project/overview?id=<tu-proyecto>`

---

### 3. URL de la Aplicación Publicada en Azure
1. Configura los secretos en GitHub para Azure (mediante OIDC o Service Principal):
   - `AZURE_CLIENT_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_SUBSCRIPTION_ID`
   - `SNYK_TOKEN` (de snyk.io)
   - `SEMGREP_APP_TOKEN` (de semgrep.dev)
2. En GitHub Actions, ejecuta manualmente el workflow `infra.yml` (*Workflow dispatch*):
   - Esto ejecutará Terraform y aprovisionará automáticamente el Resource Group, Azure Container Registry, PostgreSQL Flexible Server, Azure Container Apps y Azure Static Web Apps.
   - En la salida del workflow o en los outputs de Terraform verás el token `web_api_token`. Guárdalo como secreto `SWA_TOKEN` en GitHub.
3. Ejecuta el workflow `deploy.yml`:
   - Construye y publica el contenedor del backend en ACR y lo asigna a Azure Container Apps.
   - Construye y despliega el frontend React en Azure Static Web Apps.
4. **URL Resultante**:
   - Frontend: `https://<nombre-generado>.azurestaticapps.net`
   - Backend API: `https://ca-exams-api.<region>.azurecontainerapps.io`
