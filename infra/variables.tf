variable "resource_group_name" {
  type        = string
  description = "Nombre del Resource Group en Azure"
  default     = "rg-exams-platform"
}

variable "location" {
  type        = string
  description = "Región de Azure para despliegue de recursos"
  default     = "eastus2"
}

variable "environment" {
  type        = string
  description = "Entorno (dev, staging, prod)"
  default     = "prod"
}

variable "db_admin_username" {
  type        = string
  description = "Usuario administrador de PostgreSQL Flexible Server"
  default     = "examsadmin"
}

variable "db_admin_password" {
  type        = string
  description = "Contraseña de administrador de PostgreSQL Flexible Server"
  sensitive   = true
  default     = "P@ssw0rdSecure2026!"
}

variable "jwt_secret_key" {
  type        = string
  description = "Clave simétrica para firma y validación de tokens JWT"
  sensitive   = true
  default     = "ExamsPlatformSecureSuperSecretKey2026!#ForAuthentication"
}
