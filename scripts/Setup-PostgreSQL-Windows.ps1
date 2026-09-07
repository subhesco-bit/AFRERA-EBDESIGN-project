# Setup PostgreSQL for EBDESIGN Platform
# Windows PowerShell Script
# Purpose: Initialize PostgreSQL database and execute all migrations

param(
    [string]$Method = "docker",  # "docker" or "local"
    [string]$DbName = "ebdesign",
    [string]$DbUser = "ebdesign_user",
    [string]$DbPassword = "change_me_in_production",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432"
)

# Error handling
$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "EBDESIGN PostgreSQL Setup" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Method: $Method" -ForegroundColor Green
Write-Host "Database: $DbName" -ForegroundColor Green
Write-Host "Host: $DbHost" -ForegroundColor Green
Write-Host "Port: $DbPort" -ForegroundColor Green
Write-Host ""

# Determine setup method
if ($Method -eq "docker") {
    Write-Host "Setting up PostgreSQL via Docker..." -ForegroundColor Cyan

    # Check if Docker is installed
    try {
        $dockerVersion = docker --version
        Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
        Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }

    # Check if Docker is running
    try {
        docker info | Out-Null
    } catch {
        Write-Host "ERROR: Docker is not running" -ForegroundColor Red
        Write-Host "Please start Docker Desktop" -ForegroundColor Yellow
        exit 1
    }

    # Check if postgres container already exists
    $existingContainer = docker ps -a --filter "name=ebdesign-postgres" --format "{{.Names}}"

    if ($existingContainer) {
        Write-Host "PostgreSQL container already exists. Starting it..." -ForegroundColor Yellow
        docker start ebdesign-postgres
    } else {
        Write-Host "Creating PostgreSQL container..." -ForegroundColor Cyan

        docker run -d `
            --name ebdesign-postgres `
            -e POSTGRES_DB=$DbName `
            -e POSTGRES_USER=$DbUser `
            -e POSTGRES_PASSWORD=$DbPassword `
            -p "${DbPort}:5432" `
            -v ebdesign-postgres-data:/var/lib/postgresql/data `
            postgres:15-alpine

        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to create PostgreSQL container" -ForegroundColor Red
            exit 1
        }

        Write-Host "PostgreSQL container created successfully" -ForegroundColor Green
        Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }

    $DbConnectionString = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}"

} elseif ($Method -eq "local") {
    Write-Host "Setting up PostgreSQL via local installation..." -ForegroundColor Cyan

    # Check if psql is available
    try {
        $psqlVersion = psql --version
        Write-Host "PostgreSQL found: $psqlVersion" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: PostgreSQL is not installed or 'psql' is not in PATH" -ForegroundColor Red
        Write-Host "Please install PostgreSQL from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Creating database: $DbName" -ForegroundColor Cyan
    # This assumes psql is configured for local connection
    # Adjust as needed for your PostgreSQL setup

    $DbConnectionString = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}"

} else {
    Write-Host "ERROR: Invalid method. Use 'docker' or 'local'" -ForegroundColor Red
    exit 1
}

# Create .env file with database connection string
Write-Host ""
Write-Host "Creating .env file with DATABASE_URL..." -ForegroundColor Cyan

$envPath = Join-Path -Path (Get-Location).Path -ChildPath "backend\.env"
$envContent = @"
NODE_ENV=development
PORT=3001
DATABASE_URL=$DbConnectionString
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
"@

# Backup existing .env if it exists
if (Test-Path $envPath) {
    Write-Host "Backing up existing .env file" -ForegroundColor Yellow
    Copy-Item $envPath "$envPath.backup"
}

Set-Content -Path $envPath -Value $envContent
Write-Host ".env file created at: $envPath" -ForegroundColor Green

# Test database connection
Write-Host ""
Write-Host "Testing database connection..." -ForegroundColor Cyan

if ($Method -eq "docker") {
    $connectionTest = docker exec ebdesign-postgres psql -U $DbUser -d $DbName -c "SELECT version();" 2>&1
} else {
    $connectionTest = psql -U $DbUser -d $DbName -c "SELECT version();" 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Database connection successful" -ForegroundColor Green
} else {
    Write-Host "ERROR - Database connection failed" -ForegroundColor Red
    Write-Host $connectionTest -ForegroundColor Red
    exit 1
}

# Execute migrations
Write-Host ""
Write-Host "Executing database migrations..." -ForegroundColor Cyan

Push-Location backend
try {
    npm run migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Migration failed" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "PostgreSQL Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Connection details:" -ForegroundColor Cyan
Write-Host "  Database: $DbName" -ForegroundColor White
Write-Host "  Host: $DbHost" -ForegroundColor White
Write-Host "  Port: $DbPort" -ForegroundColor White
Write-Host "  User: $DbUser" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start backend: Set-Location backend; npm run dev" -ForegroundColor White
Write-Host "  2. Start frontend: Set-Location frontend; npm run dev" -ForegroundColor White
Write-Host "  3. Test API: http://localhost:3001/health" -ForegroundColor White
Write-Host ""
