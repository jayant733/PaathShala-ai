import os

DUMMY_FILE = os.path.join(os.path.dirname(__file__), "dummy_chaos_fill.bin")

def fill_disk(mb: int = 100):
    print(f"Chaos Engine: Creating dummy {mb}MB file to simulate disk fill...")
    with open(DUMMY_FILE, "wb") as f:
        f.write(b"\0" * (mb * 1024 * 1024))
    print("Chaos Engine: File created. Run Docker cleanup to test auto-healing.")

def cleanup():
    if os.path.exists(DUMMY_FILE):
        os.remove(DUMMY_FILE)
        print("Chaos Engine: Cleanup completed.")

if __name__ == "__main__":
    fill_disk(100)
