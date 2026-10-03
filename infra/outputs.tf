output "resource_group_name" {
  description = "Nombre del Resource Group aprovisionado"
  value       = azurerm_resource_group.rg.name
}

output "acr_login_server" {
  description = "Servidor de login para Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_name" {
  description = "Nombre del Azure Container Registry"
  value       = azurerm_container_registry.acr.name
}

output "postgres_fqdn" {
  description = "FQDN de la instancia PostgreSQL Flexible Server"
  value       = azurerm_postgresql_flexible_server.postgres.fqdn
}

output "backend_api_url" {
  description = "URL pública del Backend en Azure Container Apps"
  value       = "https://${azurerm_container_app.api.latest_revision_fqdn}"
}

output "frontend_web_url" {
  description = "URL pública del Frontend en Azure Static Web Apps"
  value       = "https://${azurerm_static_web_app.web.default_host_name}"
}

output "static_web_app_api_key" {
  description = "API Token para despliegue en Azure Static Web Apps (SWA_TOKEN)"
  value       = azurerm_static_web_app.web.api_key
  sensitive   = true
}
