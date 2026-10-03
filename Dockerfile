# ====================================================================
# Dockerfile Multietapa (Frontend React + Backend .NET 8 Web API)
# ====================================================================

# Etapa 1: Compilación de Frontend (React + TypeScript + Vite)
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Etapa 2: Compilación de Backend (.NET 8 Web API)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src
COPY ["src/Exams.Domain/Exams.Domain.csproj", "src/Exams.Domain/"]
COPY ["src/Exams.Infrastructure/Exams.Infrastructure.csproj", "src/Exams.Infrastructure/"]
COPY ["src/Exams.Api/Exams.Api.csproj", "src/Exams.Api/"]
COPY ["tests/Exams.Tests/Exams.Tests.csproj", "tests/Exams.Tests/"]
COPY ["ExamsPlatform.sln", "./"]
RUN dotnet restore src/Exams.Api/Exams.Api.csproj

COPY . .
WORKDIR /src/src/Exams.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Etapa 3: Imagen de Ejecución (Runtime Ligero Alpine)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app

# Creación de usuario sin privilegios root (Cumplimiento Sonar y Semgrep)
RUN adduser -u 1001 -D -s /bin/sh appuser
USER appuser

# Copiar artefactos de compilación del backend
COPY --from=backend-build /app/publish .

# Copiar artefactos de compilación del frontend a wwwroot para ser servidos
COPY --from=frontend-build /app/frontend/dist ./wwwroot

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_EnableDiagnostics=0

EXPOSE 8080

ENTRYPOINT ["dotnet", "Exams.Api.dll"]
