import news_classes
import numpy as np
import os
import pandas as pd
import pickle
import pyjsonrpc
import sys
import tensorflow as tf
from tensorflow.contrib.learn.python import SKCompat
import time
import yaml

from tensorflow.contrib.learn.python.learn.estimators import model_fn
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

stream = open("../../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['news_topic_modeling_service']

#print config['default']['news_topic_modeling_service']['server']['url']

# import packages in trainer
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'trainer'))
import news_cnn_model


import logging

logger = logging.getLogger('root')
FORMAT = "[%(asctime)s - %(filename)s:%(lineno)s - %(levelname)s - %(funcName)10s() ]: %(message)s"
logging.basicConfig(filename='../system_log.log', format=FORMAT)
logger.setLevel(logging.DEBUG)


learn = tf.contrib.learn

SERVER_HOST = config['server']['url']
SERVER_PORT = config['server']['port']

MODEL_DIR = config['key_config']['MODEL_DIR']
MODEL_UPDATE_LAG_IN_SECONDS = config['key_config']['MODEL_UPDATE_LAG']

N_CLASSES = config['key_config']['CLASSES_NUMS']

VARS_FILE = config['key_config']['VARS_FILE_ADDRESS']
VOCAB_PROCESSOR_SAVE_FILE = config['key_config']['VOCAB_PROCESSOR_SAVE_FILE_ADDRESS']

n_words = 0

MAX_DOCUMENT_LENGTH = config['key_config']['MAX_DOCUMENT_LENGTH']
vocab_processor = None

classifier = None

def restoreVars():
    with open(VARS_FILE, 'r') as f:
        global n_words
        n_words = pickle.load(f)
    global vocab_processor
    vocab_processor = learn.preprocessing.VocabularyProcessor.restore(VOCAB_PROCESSOR_SAVE_FILE)
    #print vocab_processor
    logger.info(vocab_processor)
    logger.info('Vars updated.')

def loadModel():
    global classifier
    classifier = learn.Estimator(
        model_fn=news_cnn_model.generate_cnn_model(N_CLASSES, n_words),
        model_dir=MODEL_DIR)
    # Prepare training and testing
    df = pd.read_csv(config['key_config']['Labeled_news_cvs_address'], header=None)

    train_df = df[0:1]
    #use news text
    x_train = train_df[1]
    x_train = np.array(list(vocab_processor.transform(x_train)))
    y_train = train_df[0]
    classifier.evaluate(x_train, y_train)
    logger.info("Model updated.")

try:
    restoreVars()
    loadModel()
except Exception as e:
    logger.error(str(e))
    pass

logger.info("Model loaded")


class ReloadModelHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        # Reload model
        logger.info("Model update detected. Loading new model.")
        #print "Model update detected. Loading new model."
        time.sleep(MODEL_UPDATE_LAG_IN_SECONDS)
        restoreVars()
        loadModel()


class RequestHandler(pyjsonrpc.HttpRequestHandler):
    @pyjsonrpc.rpcmethod
    def classify(self, text):
        text_series = pd.Series([text])
        predict_x = np.array(list(vocab_processor.transform(text_series)))
        #print predict_x
        logger.info(predict_x)
        y_predicted = [
            p['class'] for p in classifier.predict(
                predict_x, as_iterable=True)
        ]
        logger.info(y_predicted[0])
        #print y_predicted[0]
        topic = news_classes.class_map[str(y_predicted[0])]
        return topic

# Setup watchdog
observer = Observer()
observer.schedule(ReloadModelHandler(), path=MODEL_DIR, recursive=False)
observer.start()

# Threading HTTP-Server
http_server = pyjsonrpc.ThreadingHttpServer(
    server_address = (SERVER_HOST, SERVER_PORT),
    RequestHandlerClass = RequestHandler
)

logger.info("Starting predicting server ...")
logger.info("URL: http://" + str(SERVER_HOST) + ":" + str(SERVER_PORT))
#print "Starting predicting server ..."
#print "URL: http://" + str(SERVER_HOST) + ":" + str(SERVER_PORT)

http_server.serve_forever()
