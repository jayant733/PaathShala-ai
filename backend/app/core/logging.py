import logging
import sys

def setup_logging():
    logger = logging.getLogger("paathshala")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        try:
            from pythonjsonlogger import jsonlogger
            formatter = jsonlogger.JsonFormatter(
                '%(asctime)s %(levelname)s %(name)s %(message)s %(filename)s %(lineno)d'
            )
        except ImportError:
            formatter = logging.Formatter(
                '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
            )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger

logger = setup_logging()

