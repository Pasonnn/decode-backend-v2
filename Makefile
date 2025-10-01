# Makefile for Decode Backend v2 Docker Management
# This file provides convenient commands for Docker operations

.PHONY: help build up down restart logs clean dev prod status health

# Default target
help: ## Show this help message
	@echo "Decode Backend v2 - Docker Management Commands"
	@echo "=============================================="
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ==================== BUILD COMMANDS ====================

build: ## Build all Docker images
	docker-compose -f docker-compose.prod.yml build

build-no-cache: ## Build all Docker images without cache
	docker-compose -f docker-compose.prod.yml build --no-cache

build-service: ## Build specific service (usage: make build-service SERVICE=api-gateway)
	docker-compose -f docker-compose.prod.yml build $(SERVICE)

# ==================== DEVELOPMENT COMMANDS ====================

dev: ## Start development environment (databases only)
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development databases started. Run services locally with npm run start:dev:*"

dev-logs: ## View development environment logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-clean: ## Stop and remove development volumes
	docker-compose -f docker-compose.dev.yml down -v

# ==================== PRODUCTION COMMANDS ====================

prod: ## Start production environment (microservices only, external databases)
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production environment started (using external cloud databases)"

prod-build: ## Build and start production environment
	docker-compose -f docker-compose.prod.yml up -d --build

prod-stop: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

prod-restart: ## Restart production environment
	docker-compose -f docker-compose.prod.yml restart

prod-clean: ## Stop and remove all containers and volumes
	docker-compose -f docker-compose.prod.yml down -v --remove-orphans

prod-full: ## Start full production environment (with local databases)
	docker-compose up -d
	@echo "Full production environment started (with local databases)"

prod-full-build: ## Build and start full production environment
	docker-compose up -d --build

# ==================== SERVICE MANAGEMENT ====================

up: ## Start all services
	docker-compose -f docker-compose.prod.yml up -d

down: ## Stop all services
	docker-compose -f docker-compose.prod.yml down

restart: ## Restart all services
	docker-compose -f docker-compose.prod.yml restart

restart-service: ## Restart specific service (usage: make restart-service SERVICE=api-gateway)
	docker-compose -f docker-compose.prod.yml restart $(SERVICE)

# ==================== LOGGING COMMANDS ====================

logs: ## View logs for all services
	docker-compose -f docker-compose.prod.yml logs -f

logs-service: ## View logs for specific service (usage: make logs-service SERVICE=api-gateway)
	docker-compose -f docker-compose.prod.yml logs -f $(SERVICE)

logs-tail: ## View last 100 lines of logs
	docker-compose -f docker-compose.prod.yml logs --tail=100

# ==================== STATUS AND HEALTH ====================

status: ## Show status of all services
	docker-compose -f docker-compose.prod.yml ps

health: ## Check health of all services
	@echo "Checking service health..."
	@echo "=========================="
	@curl -s http://localhost:4000/health && echo " ✅ API Gateway" || echo " ❌ API Gateway"
	@curl -s http://localhost:4001/health && echo " ✅ Auth Service" || echo " ❌ Auth Service"
	@curl -s http://localhost:4002/health && echo " ✅ User Service" || echo " ❌ User Service"
	@curl -s http://localhost:4003/health && echo " ✅ Email Worker" || echo " ❌ Email Worker"
	@curl -s http://localhost:4004/health && echo " ✅ Relationship Service" || echo " ❌ Relationship Service"
	@curl -s http://localhost:4005/health && echo " ✅ Wallet Service" || echo " ❌ Wallet Service"
	@curl -s http://localhost:4006/health && echo " ✅ Notification Service" || echo " ❌ Notification Service"
	@curl -s http://localhost:4007/health && echo " ✅ Neo4j DB Sync" || echo " ❌ Neo4j DB Sync"

# ==================== CLEANUP COMMANDS ====================

clean: ## Clean up Docker resources
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up all Docker resources (including images)
	docker system prune -a -f
	docker volume prune -f

clean-containers: ## Remove all stopped containers
	docker container prune -f

clean-images: ## Remove unused images
	docker image prune -f

clean-volumes: ## Remove unused volumes
	docker volume prune -f

# ==================== DATABASE COMMANDS ====================

db-backup: ## Backup MongoDB data
	docker run --rm -v decode_mongodb_data:/data -v $(PWD):/backup alpine tar czf /backup/mongodb-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .

db-restore: ## Restore MongoDB data (usage: make db-restore FILE=backup.tar.gz)
	docker run --rm -v decode_mongodb_data:/data -v $(PWD):/backup alpine tar xzf /backup/$(FILE) -C /data

db-shell: ## Access MongoDB shell
	docker exec -it decode-mongodb mongosh

redis-shell: ## Access Redis shell
	docker exec -it decode-redis redis-cli

neo4j-shell: ## Access Neo4j shell
	docker exec -it decode-neo4j cypher-shell -u neo4j -p password

# ==================== MONITORING COMMANDS ====================

stats: ## Show resource usage statistics
	docker stats

top: ## Show running processes in containers
	docker-compose -f docker-compose.prod.yml top

inspect: ## Inspect specific service (usage: make inspect SERVICE=api-gateway)
	docker-compose -f docker-compose.prod.yml config $(SERVICE)

# ==================== NETWORK COMMANDS ====================

network-ls: ## List Docker networks
	docker network ls

network-inspect: ## Inspect decode network
	docker network inspect decode-backend-v2_decode-network

# ==================== UTILITY COMMANDS ====================

env-check: ## Check environment configuration
	@echo "Checking environment variables..."
	@echo "=================================="
	@test -f .env && echo "✅ .env file exists" || echo "❌ .env file missing - copy docker.env.example to .env"
	@echo ""
	@echo "Required environment variables:"
	@echo "- MONGO_URI"
	@echo "- REDIS_URI"
	@echo "- NEO4J_URI"
	@echo "- RABBITMQ_URI"
	@echo "- JWT_ACCESS_TOKEN_SECRET"
	@echo "- JWT_SESSION_TOKEN_SECRET"
	@echo "- JWT_SERVICE_TOKEN_SECRET"

setup: ## Initial setup for Docker environment
	@echo "Setting up Docker environment..."
	@test -f .env || (cp docker.env.example .env && echo "✅ Created .env file from template")
	@echo "✅ Setup complete. Edit .env file with your configuration."

# ==================== DEVELOPMENT HELPERS ====================

dev-install: ## Install dependencies for local development
	npm install

dev-lint: ## Run linting
	npm run lint

dev-test: ## Run tests
	npm run test

dev-build: ## Build all services locally
	npm run build:all

# ==================== QUICK COMMANDS ====================

quick-start: setup build up health ## Quick start: setup, build, start, and check health

quick-stop: down clean ## Quick stop: stop services and clean up

quick-restart: down up health ## Quick restart: stop, start, and check health

# ==================== DOCUMENTATION ====================

docs: ## Open API documentation
	@echo "Opening API documentation..."
	@echo "API Gateway: http://localhost:4000/docs"
	@echo "Neo4j Browser: http://localhost:7474"
	@echo "RabbitMQ Management: http://localhost:15672"

# ==================== TROUBLESHOOTING ====================

debug: ## Debug information
	@echo "Docker Debug Information"
	@echo "========================"
	@echo "Docker version:"
	@docker --version
	@echo ""
	@echo "Docker Compose version:"
	@docker-compose --version
	@echo ""
	@echo "Available images:"
	@docker images | grep decode
	@echo ""
	@echo "Running containers:"
	@docker-compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "Network information:"
	@docker network ls | grep decode
