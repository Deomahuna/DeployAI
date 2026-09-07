import json
import logging
import redis
import os

logger = logging.getLogger(__name__)

redis_client = redis.Redis.from_url(
    os.getenv("CELERY_BROKER_URL"),
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)


def publish_deployment_event(deployment_id: int, status: str, message: str = ""):
    try:
        channel = f"deployment:{deployment_id}"
        payload = json.dumps({"status": status, "message": message})
        redis_client.publish(channel, payload)
    except Exception as e:
        # Le suivi temps réel est secondaire — un souci Redis passager
        # ne doit jamais faire échouer un déploiement.
        logger.warning(f"Impossible de publier l'événement temps réel ({status}) : {e}")