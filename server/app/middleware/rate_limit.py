from fastapi import HTTPException, status

from app.config import settings

_redis = None


def _get_redis():
    global _redis
    if _redis is None:
        from upstash_redis import Redis

        _redis = Redis(url=settings.upstash_redis_rest_url, token=settings.upstash_redis_rest_token)
    return _redis


async def check_rate_limit(user_id: str, bucket: str, limit: int, window_seconds: int = 3600) -> None:
    """Sliding-window counter via Upstash Redis. No-op when Redis is not configured."""
    if not settings.rate_limit_enabled:
        return

    key = f"rl:{bucket}:{user_id}"
    redis = _get_redis()
    count = redis.incr(key)
    if count == 1:
        redis.expire(key, window_seconds)

    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for {bucket}. Try again later.",
        )
