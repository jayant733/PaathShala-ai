import os
import shutil
import datetime
from prometheus_client import Gauge
from automation.auto_heal.audit_logger import global_audit_logger

LAST_BACKUP_TIMESTAMP_GAUGE = Gauge('sre_backup_last_timestamp', 'Timestamp of last successful database backup')
BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backups")

class DatabaseBackupEngine:
    """
    Creates daily database dumps (SQLite registry.db and telemetry.db), timestamps, and retains for 7 days.
    """
    def __init__(self):
        os.makedirs(BACKUP_DIR, exist_ok=True)

    def run_backup(self) -> dict:
        now = datetime.datetime.utcnow()
        stamp = now.strftime("%Y%m%d_%H%M%S")
        target_subfolder = os.path.join(BACKUP_DIR, f"backup_{stamp}")
        os.makedirs(target_subfolder, exist_ok=True)

        db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "app", "database")
        
        backed_up = []
        for db_file in ["registry.db", "telemetry.db"]:
            src = os.path.join(db_dir, db_file)
            if os.path.exists(src):
                dst = os.path.join(target_subfolder, db_file)
                shutil.copy2(src, dst)
                backed_up.append(db_file)

        # Retain last 7 days backups
        subfolders = sorted([os.path.join(BACKUP_DIR, d) for d in os.listdir(BACKUP_DIR) if os.path.isdir(os.path.join(BACKUP_DIR, d))])
        purged = 0
        if len(subfolders) > 7:
            for old in subfolders[:-7]:
                shutil.rmtree(old)
                purged += 1

        ts = now.timestamp()
        LAST_BACKUP_TIMESTAMP_GAUGE.set(ts)

        global_audit_logger.log_action(
            action="Database Backup",
            reason="Daily Scheduled Backup / Pre-Flight Check",
            result="SUCCESS",
            duration_sec=0.5,
            metadata={"stamp": stamp, "files": backed_up}
        )

        return {"status": "SUCCESS", "stamp": stamp, "backed_up_files": backed_up, "purged": purged}

if __name__ == "__main__":
    res = DatabaseBackupEngine().run_backup()
    print(f"Database Backup: {res}")
