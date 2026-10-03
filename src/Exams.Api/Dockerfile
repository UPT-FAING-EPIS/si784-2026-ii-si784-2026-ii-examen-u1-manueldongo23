FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first for optimal docker layer caching
COPY ["src/Exams.Domain/Exams.Domain.csproj", "src/Exams.Domain/"]
COPY ["src/Exams.Infrastructure/Exams.Infrastructure.csproj", "src/Exams.Infrastructure/"]
COPY ["src/Exams.Api/Exams.Api.csproj", "src/Exams.Api/"]
COPY ["tests/Exams.Tests/Exams.Tests.csproj", "tests/Exams.Tests/"]
COPY ["ExamsPlatform.sln", "./"]

RUN dotnet restore src/Exams.Api/Exams.Api.csproj

# Copy the rest of the source code and build
COPY . .
WORKDIR /src/src/Exams.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage using lightweight and secure alpine image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app

# Non-root user for security (Sonar / Semgrep best practice)
RUN adduser -u 1001 -D -s /bin/sh appuser
USER appuser

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_EnableDiagnostics=0

EXPOSE 8080

ENTRYPOINT ["dotnet", "Exams.Api.dll"]
