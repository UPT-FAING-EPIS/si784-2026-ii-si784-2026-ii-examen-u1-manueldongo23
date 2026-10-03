# Diccionario de Datos — Plataforma de Exámenes en Línea

Este documento detalla la estructura lógica y física de las tablas del sistema de exámenes en línea, los tipos de datos, restricciones y propósitos en el motor relacional (PostgreSQL).

---

## 1. Tabla: `Users`
Almacena la información de los usuarios del sistema (Docentes, Estudiantes y Administradores).

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `Id` | `UUID` | NO | PK | `gen_random_uuid()` | Identificador único universal del usuario |
| `Name` | `VARCHAR(150)` | NO | | | Nombre completo del usuario |
| `Email` | `VARCHAR(200)` | NO | UK | | Correo electrónico institucional único |
| `PasswordHash` | `VARCHAR(255)` | NO | | | Hash seguro de la contraseña |
| `Role` | `VARCHAR(50)` | NO | | `'Student'` | Rol de acceso (`Student`, `Teacher`, `Admin`) |
| `CreatedAt` | `TIMESTAMPTZ` | NO | | `CURRENT_TIMESTAMP` | Fecha y hora de creación de la cuenta |

---

## 2. Tabla: `Groups`
Agrupaciones académicas de estudiantes (cursos, aulas o secciones).

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `Id` | `UUID` | NO | PK | `gen_random_uuid()` | Identificador único del grupo |
| `Name` | `VARCHAR(100)` | NO | | | Nombre de la sección o clase |
| `Description` | `VARCHAR(255)` | SÍ | | | Descripción académica del curso |
| `CreatedAt` | `TIMESTAMPTZ` | NO | | `CURRENT_TIMESTAMP` | Fecha de creación del grupo |

---

## 3. Tabla: `GroupMembers`
Relación muchos a muchos entre Estudiantes y Grupos.

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `GroupId` | `UUID` | NO | PK, FK | | Referencia a `Groups(Id)` |
| `UserId` | `UUID` | NO | PK, FK | | Referencia a `Users(Id)` |
| `JoinedAt` | `TIMESTAMPTZ` | NO | | `CURRENT_TIMESTAMP` | Fecha de inscripción al grupo |

---

## 4. Tabla: `Exams`
Cabecera de las evaluaciones creadas y configuradas por docentes.

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `Id` | `UUID` | NO | PK | `gen_random_uuid()` | Identificador único del examen |
| `Title` | `VARCHAR(150)` | NO | | | Título oficial de la evaluación |
| `Description` | `VARCHAR(500)` | SÍ | | | Instrucciones y temario del examen |
| `DurationMinutes`| `INTEGER` | NO | | `60` | Tiempo límite en minutos |
| `StartsAt` | `TIMESTAMPTZ` | NO | | | Fecha/hora a partir de la cual se habilita |
| `EndsAt` | `TIMESTAMPTZ` | NO | | | Fecha/hora de caducidad del examen |
| `CreatedBy` | `UUID` | NO | FK | | Docente autor (`Users.Id`) |
| `CreatedAt` | `TIMESTAMPTZ` | NO | | `CURRENT_TIMESTAMP` | Fecha de registro del examen |

---

## 5. Tabla: `Questions`
Reactivos o preguntas pertenecientes a un examen determinado.

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `Id` | `UUID` | NO | PK | `gen_random_uuid()` | Identificador de la pregunta |
| `ExamId` | `UUID` | NO | FK | | Examen al que pertenece (`Exams.Id`) |
| `Type` | `VARCHAR(30)` | NO | | | `MultipleChoice`, `TrueFalse`, `Open` |
| `Text` | `TEXT` | NO | | | Enunciado completo de la pregunta |
| `Points` | `INTEGER` | NO | | `1` | Puntaje asignado a la pregunta |
| `OrderIndex` | `INTEGER` | NO | | `0` | Posición ordinal en el cuestionario |

---

## 6. Tabla: `Options`
Alternativas de respuesta para preguntas de opción múltiple o V/F.

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `Id` | `UUID` | NO | PK | `gen_random_uuid()` | Identificador de la alternativa |
| `QuestionId` | `UUID` | NO | FK | | Pregunta asociada (`Questions.Id`) |
| `Text` | `VARCHAR(500)` | NO | | | Texto visible de la opción |
| `IsCorrect` | `BOOLEAN` | NO | | `false` | Indica si es la alternativa correcta |

---

## 7. Tabla: `ExamAssignments`
Reglas de asignación de exámenes a grupos o estudiantes específicos.

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `Id` | `UUID` | NO | PK | `gen_random_uuid()` | Identificador de asignación |
| `ExamId` | `UUID` | NO | FK | | Examen asignado (`Exams.Id`) |
| `GroupId` | `UUID` | SÍ | FK | | Asignación a todo un grupo (`Groups.Id`) |
| `UserId` | `UUID` | SÍ | FK | | Asignación directa a estudiante (`Users.Id`)|
| `AssignedAt` | `TIMESTAMPTZ` | NO | | `CURRENT_TIMESTAMP` | Fecha de asignación |

---

## 8. Tabla: `Submissions`
Intentos o entregas de exámenes realizadas por los estudiantes.

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `Id` | `UUID` | NO | PK | `gen_random_uuid()` | Identificador del intento |
| `ExamId` | `UUID` | NO | FK | | Examen presentado (`Exams.Id`) |
| `UserId` | `UUID` | NO | FK | | Estudiante (`Users.Id`) |
| `StartedAt` | `TIMESTAMPTZ` | NO | | `CURRENT_TIMESTAMP` | Momento de inicio del examen |
| `SubmittedAt` | `TIMESTAMPTZ` | SÍ | | | Momento del envío final |
| `Score` | `DECIMAL(5,2)` | SÍ | | | Calificación total obtenida |
| `Status` | `VARCHAR(30)` | NO | | `'InProgress'` | `InProgress`, `Submitted`, `Graded` |

---

## 9. Tabla: `Answers`
Respuestas individuales remitidas por el estudiante en una entrega.

| Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `Id` | `UUID` | NO | PK | `gen_random_uuid()` | Identificador de la respuesta |
| `SubmissionId`| `UUID` | NO | FK | | Entrega a la que pertenece |
| `QuestionId` | `UUID` | NO | FK | | Pregunta respondida |
| `OptionId` | `UUID` | SÍ | FK | | Opción elegida (MultipleChoice / V/F) |
| `OpenText` | `TEXT` | SÍ | | | Texto redactado (preguntas abiertas) |
| `PointsAwarded`|`DECIMAL(5,2)` | SÍ | | | Puntos asignados (auto o por docente) |
| `TeacherFeedback`|`VARCHAR(500)`| SÍ | | | Retroalimentación del docente |