import asyncio
import json
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis

router = APIRouter()


@router.websocket("/ws/deployments/{deployment_id}")
async def deployment_status_stream(websocket: WebSocket, deployment_id: int):
    await websocket.accept()

    redis_client = aioredis.from_url(os.getenv("CELERY_BROKER_URL"), decode_responses=True)
    pubsub = redis_client.pubsub()
    channel = f"deployment:{deployment_id}"
    await pubsub.subscribe(channel)

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message["type"] == "message":
                await websocket.send_text(message["data"])
                data = json.loads(message["data"])
                if data["status"] in ("success", "diagnosed"):
                    break
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await redis_client.close()