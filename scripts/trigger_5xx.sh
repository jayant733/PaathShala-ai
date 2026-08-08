#!/bin/bash
echo "Triggering High 5xx Error Rate Alert on Backend Container..."
echo "Sending rapid invalid requests to an endpoint to force 500 errors..."
for i in {1..300}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/v1/some_invalid_path_that_throws_500 || true
  sleep 1
done
echo "Done."
