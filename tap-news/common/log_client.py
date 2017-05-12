#import logging

#logger = logging.getLogger('root')
#FORMAT = "[%(asctime)s - %(filename)s:%(lineno)s - %(levelname)s - %(funcName)s ]: %(message)s"
#logging.basicConfig(filename='../common/system_log.log', format=FORMAT)
#logger.setLevel(logging.DEBUG)

import logging
from logging.handlers import RotatingFileHandler


log_formatter = logging.Formatter("[%(asctime)s - %(filename)s:%(lineno)s - %(levelname)s - %(funcName)10s() ]: %(message)s")

logFile = '../common/system_log.log'

my_handler = RotatingFileHandler(logFile, mode='a', maxBytes=5*1024*1024,
                                 backupCount=2, encoding='utf-8', delay=0)
my_handler.setFormatter(log_formatter)
my_handler.setLevel(logging.DEBUG)

logger = logging.getLogger('root')
logger.setLevel(logging.DEBUG)

logger.addHandler(my_handler)
