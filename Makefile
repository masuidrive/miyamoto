upload:
	cat scripts/*.js | sed -e "s/::VERSION::/`head VERSION`/g" > main.gs
	./node_modules/gas-manager/bin/gas upload -c ./gas-config.json

test:
	node testrunner.js
