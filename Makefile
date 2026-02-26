TF_DIR = terraform
HELM_DIR = helm/img-ascii
DOCKER_DIR = docker
HELM_RELEASE = img-ascii
DOCKER_IMAGE = bsimandoff/img-ascii
DOCKER_TAG = latest

##@ Docker commands
docker-build: ## Build Docker image latest
	cd $(DOCKER_DIR) && docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) -f Dockerfile .

docker-push: ## Push Docker image latest to Docker Hub
	docker push $(DOCKER_IMAGE):$(DOCKER_TAG)

##@ Terraform commands
tf-plan: ## Show Terraform plan
	cd $(TF_DIR) && terraform plan

tf-apply: ## Apply Terraform configuration
	cd $(TF_DIR) && terraform apply -auto-approve

tf-destroy: ## Destroy Terraform infrastructure
	cd $(TF_DIR) && terraform destroy -auto-approve

##@ Helm commands
helm-install: ## Install Helm chart
	cd $(HELM_DIR) && helm install $(HELM_RELEASE) .

helm-upgrade: ## Upgrade Helm release
	cd $(HELM_DIR) && helm upgrade $(HELM_RELEASE) .

helm-uninstall: ## Uninstall Helm release
	cd $(HELM_DIR) && helm uninstall $(HELM_RELEASE)

helm-forward: ## Port-forward img-ascii to localhost:8080
	kubectl port-forward svc/$(HELM_RELEASE) 8080:8080

##@ Combined commands
deploy: ## Apply Terraform and upgrade Helm release
	$(MAKE) tf-apply $(MAKE) helm-upgrade

destroy-all: ## Uninstall Helm and destroy Terraform
	$(MAKE) helm-uninstall && $(MAKE) tf-destroy

##@ Help
help: ## Display this help message
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@grep -E '(##@|##)' $(MAKEFILE_LIST) | grep -v grep | while read -r line; do \
		if [[ $$line =~ ^##@ ]]; then \
			echo ""; \
			echo "$${line####@ }"; \
		elif [[ $$line =~ ^[a-zA-Z_-]+: ]]; then \
			target=$$(echo "$$line" | cut -d':' -f1); \
			comment=$$(echo "$$line" | sed -n 's/.*## *//p'); \
			if [ -n "$$comment" ]; then \
				printf "    \033[32m%-20s\033[0m %s\n" "$$target" "$$comment"; \
			fi \
		fi \
	done

.PHONY: docker-build docker-push tf-plan tf-apply tf-destroy helm-install helm-upgrade helm-uninstall helm-forward deploy destroy-all help
