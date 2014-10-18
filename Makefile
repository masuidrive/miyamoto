upload:
	echo "Miyamoto-san https://github.com/masuidrive/miyamoto/"
	echo "(c) masuidrive 2014- License: MIT"
	cat scripts/*.js | sed -e "s/::VERSION::/`head VERSION`/g" >> main.gs
	./node_modules/gas-manager/bin/gas upload -c ./gas-config.json

test:
	node testrunner.js
