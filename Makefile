.DEFAULT_GOAL := help
COMPOSE_DEV  := docker compose -f docker-compose.dev.yml
COMPOSE_PROD := docker compose -f docker-compose.yml

.PHONY: help install dev test build preview \
        docker-dev docker-dev-down docker-dev-logs docker-dev-test docker-dev-shell \
        docker-build docker-update audit docker-up docker-down docker-logs docker-restart \
        prod clean

help: ## Affiche l'aide
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n",$$1,$$2}'

## ---- Local (Node requis) ----
install: ## Installe les dépendances (npm ci)
	npm ci

dev: ## Serveur de dev local (http://localhost:3000)
	npm run dev

test: ## Lance les tests vitest
	npm test

build: ## Génère le site statique (.output/public)
	npm run generate

preview: ## Prévisualise le build statique
	npm run preview

## ---- Docker DEV ----
docker-dev: ## Dev via Docker (HMR, http://localhost:3000)
	$(COMPOSE_DEV) up --build

docker-dev-down: ## Stoppe le dev Docker
	$(COMPOSE_DEV) down

docker-dev-logs: ## Logs du dev Docker
	$(COMPOSE_DEV) logs -f

docker-dev-test: ## Tests dans le conteneur dev
	$(COMPOSE_DEV) run --rm web npm test

docker-dev-shell: ## Shell dans le conteneur dev
	$(COMPOSE_DEV) run --rm web sh

## ---- Docker PROD ----
docker-build: ## Build l'image prod (nginx + site statique)
	$(COMPOSE_PROD) build --pull

docker-up: ## Démarre la prod en arrière-plan (http://localhost:8080)
	$(COMPOSE_PROD) build --pull
	$(COMPOSE_PROD) up -d

docker-update: ## Met à jour nginx (rebuild sans cache + --pull) et redéploie
	$(COMPOSE_PROD) build --pull --no-cache
	$(COMPOSE_PROD) up -d
	@docker compose -f docker-compose.yml exec web nginx -v

audit: ## Audit npm (prod, niveau high+)
	npm audit --omit=dev --audit-level=high

docker-down: ## Stoppe la prod
	$(COMPOSE_PROD) down

docker-logs: ## Logs prod
	$(COMPOSE_PROD) logs -f

docker-restart: ## Redémarre la prod
	$(COMPOSE_PROD) restart

prod: docker-up ## Alias de docker-up

clean: ## Supprime .nuxt, .output, node_modules
	rm -rf .nuxt .output node_modules
