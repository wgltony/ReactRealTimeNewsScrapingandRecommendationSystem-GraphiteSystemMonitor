import pika
import json
import log_client

class CloudAMQPClient:
    def __init__(self, cloud_amqp_url, queue_name):
        try:
            self.could_amqp_url = cloud_amqp_url
            self.queue_name = queue_name
            self.params = pika.URLParameters(cloud_amqp_url)
            self.params.socket_timeout = 3
            self.connection = pika.BlockingConnection(self.params)
            self.channel = self.connection.channel()
            self.channel.queue_declare(queue = queue_name)
        except Exception as e:
            log_client.logger.error(str(e))

    def sendMessage(self, message):
        self.channel.basic_publish(exchange = '',
                                  routing_key = self.queue_name,
                                  body = json.dumps(message))
        log_client.logger.info("[X] Send message to %s" % (self.queue_name))
        return

    #get a message
    def getMessage(self):
        method_frame, header_frame, body = self.channel.basic_get(self.queue_name)
        if method_frame is not None:
            log_client.logger.info("[O] Received message from %s" % (self.queue_name))
            self.channel.basic_ack(method_frame.delivery_tag)
            return json.loads(body)
        else:
            #log_client.logger.info("No message returned")
            return None

    #sleep
    def sleep(self, seconds):
        self.connection.sleep(seconds)
