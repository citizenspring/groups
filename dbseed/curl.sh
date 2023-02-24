#!/bin/bash

# Check if a filename was provided as the first argument
if [ -z "$1" ]; then
  echo "Error: Please provide the name of the file to be sent as the first argument."
  exit 1
fi

# Set the URL of the endpoint to which the request will be sent
url="http://localhost:3000/webhooks/email"

# Send the contents of the JSON file as a POST request using curl
curl -X POST -H "Content-Type: application/json" -d @$1 $url

