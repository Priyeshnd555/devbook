SHELL := /bin/bash
NVM_DIR := $(HOME)/.nvm

code:
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npx @google/gemini-cli   

run dev: 
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npm run dev

run build:
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npm run build

run deploy:
	@source $(NVM_DIR)/nvm.sh && nvm use 20 && npm run predeploy && npm run deploy
