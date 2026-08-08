#!/bin/bash
echo "Triggering High CPU Alert on Backend Container..."
echo "This will max out 1 CPU core for 6 minutes."
docker exec paathshala-backend sh -c "timeout 360 md5sum /dev/zero"
echo "Done."
