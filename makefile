SHELL := /bin/bash
NVM_DIR := $(HOME)/.nvm

code:
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npx @google/gemini-cli   

dev: 
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npm run dev

build:
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npm run build

deploy:
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npm run predeploy && npm run deploy

Refractor:
	@echo "Running knip..."
	@npx knip
	@echo "Running jscpd..."
	@npx jscpd app --ignore "**/node_modules/**"
	@echo "Running ast-grep..."
	@npx sg run --pattern 'window.confirm($$MSG)' app
	@echo "Running build and lint..."
	@npm run build && npm run lint
