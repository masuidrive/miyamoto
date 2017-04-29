upload:
	echo "/* Nodir https://github.com/nodirashidov/slack-timesheets/ */" > main.gs
	echo "/* (c) masuidrive 2014- License: MIT */" >> main.gs
	echo "/* ------------------- */" >> main.gs
	cat scripts/*.js | sed -e "s/::VERSION::/`head VERSION`/g" >> main.gs
	./node_modules/gas-manager/bin/gas upload -c ./gas-config.json

test:
	node testrunner.js
