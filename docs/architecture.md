# Documentación de Arquitectura — Plataforma de Exámenes en Línea

Este compendio documental ha sido generado automáticamente para cumplir con los estándares de diseño de software y auditoría de infraestructura.

---

## 1. Diagrama Entidad-Relación (DER)
Representa el modelo de datos relacional implementado en PostgreSQL para soportar bancos de preguntas, asignaciones y entregas de exámenes.

```mermaid
erDiagram
    USERS ||--o{ EXAMS : "crea (Docente)"
    USERS ||--o{ SUBMISSIONS : "presenta (Estudiante)"
    USERS ||--o{ GROUP_MEMBERS : "pertenece"
    USERS ||--o{ EXAM_ASSIGNMENTS : "asignado individualmente"

    GROUPS ||--o{ GROUP_MEMBERS : "contiene"
    GROUPS ||--o{ EXAM_ASSIGNMENTS : "asignado a"

    EXAMS ||--|{ QUESTIONS : "contiene"
    EXAMS ||--o{ EXAM_ASSIGNMENTS : "es asignado mediante"
    EXAMS ||--o{ SUBMISSIONS : "recibe entregas"

    QUESTIONS ||--o{ OPTIONS : "tiene alternativas"
    QUESTIONS ||--o{ ANSWERS : "es respondida por"

    SUBMISSIONS ||--|{ ANSWERS : "contiene respuestas"
    OPTIONS ||--o{ ANSWERS : "seleccionada en"

    USERS {
        uuid Id PK
        varchar Name
        varchar Email UK
        varchar PasswordHash
        varchar Role
        timestamp CreatedAt
    }

    GROUPS {
        uuid Id PK
        varchar Name
        varchar Description
        timestamp CreatedAt
    }

    GROUP_MEMBERS {
        uuid GroupId PK,FK
        uuid UserId PK,FK
        timestamp JoinedAt
    }

    EXAMS {
        uuid Id PK
        varchar Title
        varchar Description
        int DurationMinutes
        timestamp StartsAt
        timestamp EndsAt
        uuid CreatedBy FK
        timestamp CreatedAt
    }

    QUESTIONS {
        uuid Id PK
        uuid ExamId FK
        varchar Type
        text Text
        int Points
        int OrderIndex
    }

    OPTIONS {
        uuid Id PK
        uuid QuestionId FK
        varchar Text
        boolean IsCorrect
    }

    EXAM_ASSIGNMENTS {
        uuid Id PK
        uuid ExamId FK
        uuid GroupId FK
        uuid UserId FK
        timestamp AssignedAt
    }

    SUBMISSIONS {
        uuid Id PK
        uuid ExamId FK
        uuid UserId FK
        timestamp StartedAt
        timestamp SubmittedAt
        decimal Score
        varchar Status
    }

    ANSWERS {
        uuid Id PK
        uuid SubmissionId FK
        uuid QuestionId FK
        uuid OptionId FK
        text OpenText
        decimal PointsAwarded
        varchar TeacherFeedback
    }
```

---

## 2. Diagrama de Clases del Dominio
Ilustra el modelo de dominio orientado a objetos en .NET 8, sus propiedades y relaciones de cardinalidad.

```mermaid
classDiagram
    direction TB

    class User {
        +Guid Id
        +string Name
        +string Email
        +string PasswordHash
        +string Role
        +DateTime CreatedAt
        +ICollection~Exam~ CreatedExams
        +ICollection~Submission~ Submissions
        +ICollection~GroupMember~ GroupMemberships
    }

    class Group {
        +Guid Id
        +string Name
        +string Description
        +DateTime CreatedAt
        +ICollection~GroupMember~ Members
        +ICollection~ExamAssignment~ Assignments
    }

    class GroupMember {
        +Guid GroupId
        +Group Group
        +Guid UserId
        +User User
        +DateTime JoinedAt
    }

    class Exam {
        +Guid Id
        +string Title
        +string Description
        +int DurationMinutes
        +DateTime StartsAt
        +DateTime EndsAt
        +Guid CreatedBy
        +User Teacher
        +ICollection~Question~ Questions
        +ICollection~ExamAssignment~ Assignments
        +ICollection~Submission~ Submissions
        +bool IsActive()
        +int GetTotalPoints()
    }

    class Question {
        +Guid Id
        +Guid ExamId
        +Exam Exam
        +string Type
        +string Text
        +int Points
        +int OrderIndex
        +ICollection~Option~ Options
    }

    class Option {
        +Guid Id
        +Guid QuestionId
        +Question Question
        +string Text
        +bool IsCorrect
    }

    class ExamAssignment {
        +Guid Id
        +Guid ExamId
        +Exam Exam
        +Guid? GroupId
        +Group? Group
        +Guid? UserId
        +User? User
        +DateTime AssignedAt
    }

    class Submission {
        +Guid Id
        +Guid ExamId
        +Exam Exam
        +Guid UserId
        +User Student
        +DateTime StartedAt
        +DateTime? SubmittedAt
        +decimal? Score
        +string Status
        +ICollection~Answer~ Answers
        +void CalculateAutoScore()
    }

    class Answer {
        +Guid Id
        +Guid SubmissionId
        +Submission Submission
        +Guid QuestionId
        +Question Question
        +Guid? OptionId
        +Option? SelectedOption
        +string? OpenText
        +decimal? PointsAwarded
        +string? TeacherFeedback
    }

    User "1" <-- "0..*" Exam : CreatedBy
    User "1" <-- "0..*" Submission : SubmittedBy
    User "1" <-- "0..*" GroupMember : Member
    Group "1" <-- "0..*" GroupMember : Group
    Group "0..1" <-- "0..*" ExamAssignment : AssignedToGroup
    User "0..1" <-- "0..*" ExamAssignment : AssignedToStudent
    Exam "1" *-- "1..*" Question : Contains
    Question "1" *-- "0..*" Option : HasOptions
    Exam "1" <-- "0..*" Submission : Evaluates
    Submission "1" *-- "1..*" Answer : Answers
    Question "1" <-- "0..*" Answer : TargetQuestion
    Option "0..1" <-- "0..*" Answer : SelectedOption
```

---

## 3. Diagrama de Componentes del Sistema
Muestra la interacción desacoplada entre la capa de presentación SPA (React), la capa de servicios RESTful (.NET 8 Web API) y la base de datos relacional.

```mermaid
flowchart TD
    subgraph ClientLayer["Capa de Presentación (Frontend React + Vite)"]
        UI_SPA["React Single Page Application<br/>(TypeScript + Modern CSS)"]
        Navbar["Navbar & Role Switcher<br/>(Docente / Estudiante)"]
        StudentDash["Student Dashboard<br/>(Exámenes asignados, notas)"]
        TeacherDash["Teacher Dashboard<br/>(Creación, banco de reactivos, calificador)"]
        ExamRunner["Exam Runner Engine<br/>(Temporizador estricto, paginador)"]
        ResultsView["Results & Analytics View<br/>(Retroalimentación instantánea)"]
    end

    subgraph ApiLayer["Capa de Servicios RESTful (.NET 8 Web API)"]
        Gateway["ASP.NET Core Kestrel Host<br/>Port 8080 (HTTPS/CORS)"]
        AuthCtrl["AuthController<br/>(POST /api/auth/login, JWT Issuance)"]
        ExamsCtrl["ExamsController<br/>(CRUD /exams, /exams/{id})"]
        QuestionsCtrl["QuestionsController<br/>(CRUD /questions, /questions/{examId})"]
        SubmissionsCtrl["SubmissionsController<br/>(POST /submissions, autoscoring)"]
        ResultsCtrl["ResultsController<br/>(GET /results/{userId})"]
        AuthFilter["JWT Bearer Authorization Middleware<br/>(Roles: Teacher, Student, Admin)"]
        EfContext["Entity Framework Core 8<br/>AppDbContext (ORM & Unit of Work)"]
    end

    subgraph DataLayer["Capa de Persistencia y Seguridad"]
        Postgres[(PostgreSQL Database Server<br/>Relational Data Store)]
        Seeder["DbInitializer<br/>(Auto-seed de usuarios y exámenes)"]
    end

    subgraph QualityPipelines["DevOps, Seguridad y Calidad (GitHub Actions)"]
        TerraformCI["infra.yml<br/>(Terraform IaC Azure)"]
        SonarScan["sonar.yml<br/>(SonarCloud Quality Gate)"]
        SecurityScan["snyk-semgrep.yml<br/>(Semgrep SAST + Snyk Container)"]
        DeployCI["deploy.yml<br/>(CI/CD Container Registry & SWA)"]
        DocGen["generate-documentation.yml<br/>(Mermaid Architecture Generator)"]
    end

    UI_SPA --> Navbar
    Navbar --> StudentDash
    Navbar --> TeacherDash
    StudentDash --> ExamRunner
    ExamRunner --> ResultsView

    StudentDash -->|HTTP REST / JSON + Bearer Token| Gateway
    TeacherDash -->|HTTP REST / JSON + Bearer Token| Gateway
    ExamRunner -->|HTTP REST / JSON + Bearer Token| Gateway

    Gateway --> AuthFilter
    AuthFilter --> AuthCtrl
    AuthFilter --> ExamsCtrl
    AuthFilter --> QuestionsCtrl
    AuthFilter --> SubmissionsCtrl
    AuthFilter --> ResultsCtrl

    AuthCtrl --> EfContext
    ExamsCtrl --> EfContext
    QuestionsCtrl --> EfContext
    SubmissionsCtrl --> EfContext
    ResultsCtrl --> EfContext

    EfContext --> Postgres
    Seeder --> Postgres

    QualityPipelines -.->|Garantiza calidad y despliega| ApiLayer
    QualityPipelines -.->|Aprovisiona infraestructura| DataLayer
```

---

## 4. Diagrama de Despliegue en la Nube
Detalla la infraestructura como código aprovisionada mediante Terraform en Microsoft Azure, los contenedores seguros y los pipelines de integración y despliegue continuo.

```mermaid
flowchart TB
    subgraph DeveloperWorkstation["Entorno de Desarrollo & Repositorio GitHub"]
        Dev["Desarrollador / Alumno"]
        GitRepo["GitHub Repository<br/>(Código .NET 8, React, Terraform, Workflows)"]
        GHActions["GitHub Actions CI/CD Runners"]
    end

    subgraph AzureCloud["Microsoft Azure Cloud Infrastructure (eastus2)"]
        subgraph ResourceGroup["Resource Group: rg-exams-platform-prod"]
            ACR["Azure Container Registry (ACR)<br/>acrexams*.azurecr.io"]
            
            subgraph ContainerAppEnv["Azure Container Apps Environment"]
                AppBackend["Azure Container App: ca-exams-api<br/>.NET 8 Web API (Alpine Linux, Non-Root)<br/>Port 8080 (CPU: 0.5, RAM: 1.0Gi)"]
            end

            PostgresFlexible["Azure Database for PostgreSQL Flexible Server<br/>v16 (B_Standard_B1ms, 32GB Storage)"]
            
            StaticWebApp["Azure Static Web Apps (SWA)<br/>React 18 + Vite (Dist CDN Global)"]
            
            LogAnalytics["Azure Log Analytics Workspace<br/>Monitoreo y Métricas de Diagnóstico"]
        end
    end

    subgraph SecurityGateways["SaaS de Seguridad y Calidad"]
        SonarCloud["SonarCloud.io<br/>(0 Bugs, 0 Vulnerabilities, 0 Hotspots)"]
        SemgrepSaaS["Semgrep Engine (SAST OWASP)"]
        SnykSaaS["Snyk Container & Dependency Security"]
    end

    Dev -->|git push origin main| GitRepo
    GitRepo -->|Trigger Workflows| GHActions

    GHActions -->|sonar.yml| SonarCloud
    GHActions -->|snyk-semgrep.yml| SemgrepSaaS
    GHActions -->|snyk-semgrep.yml| SnykSaaS
    GHActions -->|infra.yml (Terraform)| ResourceGroup
    GHActions -->|deploy.yml (Docker Push)| ACR
    GHActions -->|deploy.yml (SWA Deploy)| StaticWebApp
    ACR -->|Pull Container Image| AppBackend
    AppBackend -->|SSL Connection Pool| PostgresFlexible
    AppBackend -->|Logs & Métricas| LogAnalytics

    Clients["Estudiantes & Docentes (Navegador Web)"] -->|HTTPS| StaticWebApp
    StaticWebApp -->|API Calls (HTTPS / Bearer)| AppBackend
```

---

## 5. Diccionario de Datos Completo
Consulte el archivo detallado con todas las especificaciones de tipos, índices y restricciones en [`data-dictionary.md`](./data-dictionary.md).