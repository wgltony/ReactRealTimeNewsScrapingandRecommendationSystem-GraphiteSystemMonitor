#!/bin/bash
service redis_6379 start
service mongod start

pip install -r requirements.txt

cd news_pipeline
python news_monitor.py &
python news_fetcher.py &
python news_deduper.py &

cd ../backend_server
python graphite_log_client.py &
python service.py &
python backend_log_monitor_service.py &
python node_log_monitor.py &
python topic_modeling_service_log_monitor.py &
cd ../elasticsearch_server
python news_index_client.py &
cd ../web_server/client
npm run build &
cd ../server
npm start &
cd ../../news_topic_modeling_service/server
python server.py &
cd ../../news_recommendation_service
python click_log_processor.py &
python recommendation_service.py &
cd ../news_training_data_genarator
python news_scraper.py &

docker run -d\
 --name graphite\
 --restart=always\
 -p 80:80\
 -p 2003-2004:2003-2004\
 -p 2023-2024:2023-2024\
 -p 8125:8125/udp\
 -p 8126:8126\
 hopsoft/graphite-statsd

 diamond &

echo "====================================================="
read -p "PRESS [ENTER] TO TERMINATE PROCESS." PRESSKEY

killall -r python
killall -r node
