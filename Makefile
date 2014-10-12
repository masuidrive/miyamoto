upload:
	cat scripts/*.js > main.gs
	./node_modules/gas-manager/bin/gas upload -c ./gas-config.json

test:
	node testrunner.js
