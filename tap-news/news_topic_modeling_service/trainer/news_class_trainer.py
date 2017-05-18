import news_cnn_model
import numpy as np
import os
import pandas as pd
import pickle
import shutil
import tensorflow as tf
import yaml
from tensorflow.contrib.learn.python import SKCompat

from sklearn import metrics

learn = tf.contrib.learn

stream = open("../../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['news_topic_modeling_service']

REMOVE_PREVIOUS_MODEL = config['trainer']['REMOVE_PREVIOUS_MODEL']

MODEL_OUTPUT_DIR = config['key_config']['MODEL_DIR']
DATA_SET_FILE = config['key_config']['Labeled_news_cvs_address']
#RANDOM_DATA_SET_FILE = config['key_config']['Labeled_news_random_address']
VARS_FILE = config['key_config']['VARS_FILE_ADDRESS']
VOCAB_PROCESSOR_SAVE_FILE = config['key_config']['VOCAB_PROCESSOR_SAVE_FILE_ADDRESS']
MAX_DOCUMENT_LENGTH = config['key_config']['MAX_DOCUMENT_LENGTH']
N_CLASSES = config['key_config']['CLASSES_NUMS']
NUM_OF_TEST_DATA = config['key_config']['NUM_OF_TEST_DATA']
# Training parms
STEPS = config['trainer']['STEPS']


import logging

logger = logging.getLogger('root')
FORMAT = "[%(asctime)s - %(filename)s:%(lineno)s - %(levelname)s - %(funcName)10s() ]: %(message)s"
logging.basicConfig(filename='../system_log.log', format=FORMAT)
logger.setLevel(logging.DEBUG)

#fid = open(DATA_SET_FILE, "r")
#li = fid.readlines()
#fid.close()

#random.shuffle(li)

#fid = open(RANDOM_DATA_SET_FILE, "w")
#fid.writelines(li)
#fid.close()
from bs4 import BeautifulSoup
import re
import nltk
from nltk.corpus import stopwords
try:
    nltk.download("wordnet")  # Download text data sets, including stop words
except Exception as e:
    logger.critical(str(e))
    pass

from nltk.stem import PorterStemmer
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import sent_tokenize, word_tokenize
ps = PorterStemmer()
wnl = WordNetLemmatizer()

def data_clean( raw_review ):
    # Function to convert a raw review to a string of words
    # The input is a single string (a raw movie review), and
    # the output is a single string (a preprocessed movie review)
    #
    # 1. Remove HTML
    review_text = BeautifulSoup(raw_review).get_text()
    #
    # 2. Remove non-letters number
    letters_only = re.sub("[^a-zA-Z0-9]", " ", review_text)
    #
    # 3. Convert to lower case, split into individual words
    words = letters_only.lower().split()
    # 4. In Python, searching a set is much faster than searching
    #   a list, so convert the stop words to a set
    stops = set(stopwords.words("english"))
    #
    # 5. Remove stop words
    meaningful_words = [w for w in words if not w in stops]
    #
    # 6. Stem words(bad result)
    stemming_words = [ps.stem(w) for w in meaningful_words]
    #
    # 7.lemmatize_words
    lemmatize_words = [wnl.lemmatize(w) for w in stemming_words]
    # 7. Join the words back into one string separated by space,
    # and return the result.
    return  ( " ".join( lemmatize_words )).encode('utf-8')

def data_col_process(data):
    # Create an empty list and append the clean reviews one by one
    clean_data = []
    for i in data:
        #print "len of i %s" % type(i)
        clean_review = data_clean( str(i) )
        clean_data.append( clean_review )
        #print "########### %s" % type(clean_review)
    #newDF = pd.DataFrame() #creates a new dataframe that's empty
    #newDF = newDF.append(clean_data, ignore_index = True) # ignoring index is optional
    return clean_data


def main(unused_argv):
    if REMOVE_PREVIOUS_MODEL:
        # Remove old model
        shutil.rmtree(MODEL_OUTPUT_DIR)
        os.mkdir(MODEL_OUTPUT_DIR)

    # Prepare training and testing data, encode UTF-8, uoting=3 tells Python to ignore doubled quotes
    df = pd.read_csv(DATA_SET_FILE, header=None, encoding='utf8')

    # Random shuffle
    df.sample(frac=1)

    #drop NaN value row
    df = df.dropna(axis=0, how='any')
    df.apply(lambda x: pd.api.types.infer_dtype(x.values))

    #df = nltk.word_tokenize(str(df))

    test_df = df[0:NUM_OF_TEST_DATA]
    train_df = df.drop(test_df.index)

    # x - 1 for news title 2 for news text, y - class
    x_train = data_col_process(train_df[1]+train_df[2])
    y_train = map(int, data_col_process(train_df[0]))
    x_test = data_col_process(test_df[1]+test_df[2])
    y_test = map(int, data_col_process(test_df[0]))

    # x_train = train_df[1]+train_df[2]
    # y_train =train_df[0]
    # x_test =test_df[1]+test_df[2]
    # y_test =test_df[0]

    #print type(x_train)
    #print type(y_train)
    #print type(x_test)
    #print type(y_test)
    #print 'news x_test data: %s' % x_test
    #print 'news y_test data: %s' % x_test

    # Process vocabulary
    vocab_processor = learn.preprocessing.VocabularyProcessor(MAX_DOCUMENT_LENGTH)
    x_train = np.array(list(vocab_processor.fit_transform(x_train)))
    x_test = np.array(list(vocab_processor.transform(x_test)))

    #print x_train
    #print x_test

    n_words = len(vocab_processor.vocabulary_)
    logger.info('Total words: %d' % n_words)
    print('Total words: %d' % n_words)

    # Saving n_words and vocab_processor:
    with open(VARS_FILE, 'w') as f:
        pickle.dump(n_words, f)

    vocab_processor.save(VOCAB_PROCESSOR_SAVE_FILE)

    # Build model
    classifier = learn.Estimator(
        model_fn=news_cnn_model.generate_cnn_model(N_CLASSES, n_words),
        model_dir=MODEL_OUTPUT_DIR)

    # Train and predict
    classifier.fit(x_train, y_train, steps=STEPS)

    # Evaluate model
    y_predicted = [
        p['class'] for p in classifier.predict(x_test, as_iterable=True)
    ]

    score = metrics.accuracy_score(y_test, y_predicted)
    logger.info('Accuracy: {0:f}'.format(score))
    print('Accuracy: {0:f}'.format(score))

if __name__ == '__main__':
    try:
        tf.app.run(main=main)
    except Exception as e:
        logger.error(str(e))
        pass
