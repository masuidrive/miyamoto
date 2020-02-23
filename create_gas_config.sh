#!/bin/bash
echo "{\"client_id\": \"${CLIENT_ID}\"," > gas-config.json
echo "\"client_secret\": \"${CLIENT_SECRET}\"," >> gas-config.json
echo "\"refresh_token\": \"${REFRESH_TOKEN}\"}" >> gas-config.json
