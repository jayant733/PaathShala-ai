#!/bin/bash
echo "Triggering High Memory Alert on Backend Container..."
echo "This will consume memory rapidly for a few minutes."
docker exec paathshala-backend python -c "a=[]; 
import time
for i in range(100):
    a.append(' ' * 10**7)
    time.sleep(0.5)
time.sleep(300)"
echo "Done."
