SHELL := /bin/bash
NVM_DIR := $(HOME)/.nvm

dev:
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npm run dev

build:
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npm run build
