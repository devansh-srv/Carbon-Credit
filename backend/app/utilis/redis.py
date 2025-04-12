from redis import Redis
from config import Config
redis_client = None
def init_redis(app):
    global redis_client
    redis_url = Config.REDIS_URL
    try:
        redis_client = Redis.from_url(
            redis_url,
            decode_responses=True,
        )
        redis_client.ping()
        print("Connected to redis")
    except ConnectionError as e:
        print("No redis server connected")
        redis_client = None

def get_redis():
    return redis_client
