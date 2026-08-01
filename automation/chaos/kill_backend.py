import subprocess
import time

def kill_backend():
    print("Chaos Engine: Deliberately stopping 'paathshala-backend' container...")
    subprocess.run(["docker", "stop", "paathshala-backend"], capture_output=True)
    print("Chaos Engine: Container stopped. Triggering AutoHealer verification...")

if __name__ == "__main__":
    kill_backend()
