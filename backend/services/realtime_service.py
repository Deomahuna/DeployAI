import json
import redis
import os

redis_client = redis.Redis.from_url(os.getenv("CELERY_BROKER_URL"), decode_responses=True)


def publish_deployment_event(deployment_id: int, status: str, message: str = ""):
    channel = f"deployment:{deployment_id}"
    payload = json.dumps({"status": status, "message": message})
    redis_client.publish(channel, payload)