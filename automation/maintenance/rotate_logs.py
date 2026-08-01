import os
import tarfile
import datetime
import time

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audit_logs")

class LogRotator:
    """
    Compresses logs into archives and purges logs older than 30 days.
    """
    def rotate_logs(self) -> dict:
        os.makedirs(LOG_DIR, exist_ok=True)
        now = datetime.datetime.utcnow()
        archive_name = f"logs_archive_{now.strftime('%Y%m%d_%H%M%S')}.tar.gz"
        archive_path = os.path.join(LOG_DIR, archive_name)

        archived_files = 0
        with tarfile.open(archive_path, "w:gz") as tar:
            for root, _, files in os.walk(LOG_DIR):
                for f in files:
                    if f.endswith(".log") or f.endswith(".txt"):
                        full_path = os.path.join(root, f)
                        tar.add(full_path, arcname=f)
                        archived_files += 1

        # Delete archive files older than 30 days
        purged = 0
        cutoff = time.time() - (30 * 86400)
        for f in os.listdir(LOG_DIR):
            if f.startswith("logs_archive_") and f.endswith(".tar.gz"):
                fp = os.path.join(LOG_DIR, f)
                if os.path.getmtime(fp) < cutoff:
                    os.remove(fp)
                    purged += 1

        return {"status": "SUCCESS", "archived_files": archived_files, "purged_archives": purged}

if __name__ == "__main__":
    res = LogRotator().rotate_logs()
    print(f"Log Rotation: {res}")
