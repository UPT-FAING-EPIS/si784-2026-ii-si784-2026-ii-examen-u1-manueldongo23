terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# 1. Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "${var.resource_group_name}-${var.environment}"
  location = var.location
  tags = {
    Environment = var.environment
    Project     = "ExamsPlatform"
    ManagedBy   = "Terraform"
  }
}

# 2. Azure Container Registry (ACR)
resource "azurerm_container_registry" "acr" {
  name                = "acrexams${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = azurerm_resource_group.rg.tags
}

# 3. PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "postgres" {
  name                   = "psql-exams-${random_string.suffix.result}"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  version                = "16"
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password

  storage_mb = 32768
  sku_name   = "B_Standard_B1ms"
  zone       = "1"

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false
  auto_grow_enabled            = true

  tags = azurerm_resource_group.rg.tags
}

resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = "examsdb"
  server_id = azurerm_postgresql_flexible_server.postgres.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

# Firewall rule to allow Azure internal services (e.g. Container Apps)
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "allow-azure-internal"
  server_id        = azurerm_postgresql_flexible_server.postgres.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# 4. Log Analytics Workspace for Container Apps
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "log-exams-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = azurerm_resource_group.rg.tags
}

# 5. Azure Container Apps Environment
resource "azurerm_container_app_environment" "env" {
  name                       = "cae-exams-${random_string.suffix.result}"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = azurerm_resource_group.rg.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
  tags                       = azurerm_resource_group.rg.tags
}

# 6. Azure Container App (Backend .NET 8 Web API)
resource "azurerm_container_app" "api" {
  name                         = "ca-exams-api"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  secret {
    name  = "db-connection"
    value = "Host=${azurerm_postgresql_flexible_server.postgres.fqdn};Database=examsdb;Username=${var.db_admin_username};Password=${var.db_admin_password};Ssl Mode=Require;Trust Server Certificate=true"
  }

  secret {
    name  = "jwt-key"
    value = var.jwt_secret_key
  }

  template {
    min_replicas = 1
    max_replicas = 3

    container {
      name   = "exams-api"
      image  = "mcr.microsoft.com/dotnet/samples:aspnetapp" # initial placeholder until deploy.yml pushes real image
      cpu    = 0.5
      memory = "1.0Gi"

      env {
        name        = "ConnectionStrings__Default"
        secret_name = "db-connection"
      }

      env {
        name        = "Jwt__Key"
        secret_name = "jwt-key"
      }

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Production"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = azurerm_resource_group.rg.tags
}

# 7. Azure Static Web App (Frontend React + Vite)
resource "azurerm_static_web_app" "web" {
  name                = "swa-exams-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = "eastus2"
  sku_tier            = "Free"
  sku_size            = "Free"
  tags                = azurerm_resource_group.rg.tags
}
