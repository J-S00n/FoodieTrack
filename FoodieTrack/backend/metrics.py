try:
    from prometheus_client import Counter, make_asgi_app

    # Counters for preference extraction and saving
    PREFERENCES_EXTRACTED = Counter(
        "preferences_extracted_total", "Number of preferences extracted from voice"
    )
    PREFERENCE_SAVED = Counter(
        "preference_saved_total", "Number of preferences successfully saved"
    )
    PREFERENCE_SAVE_FAILURES = Counter(
        "preference_save_failures_total", "Number of preference save failures"
    )

    # Counters for recommendation service
    RECOMMENDATION_REQUESTS = Counter(
        "recommendation_requests_total", "Recommendation requests received"
    )
    RECOMMENDATION_ERRORS = Counter(
        "recommendation_errors_total", "Recommendation errors"
    )


    def metrics_app():
        """Return an ASGI app that serves Prometheus metrics at /metrics when mounted."""
        return make_asgi_app()
except Exception:
    # Fallback no-op counters and simple metrics endpoint when prometheus_client isn't installed
    class _NoopCounter:
        def inc(self, amount: int = 1):
            return None

    PREFERENCES_EXTRACTED = _NoopCounter()
    PREFERENCE_SAVED = _NoopCounter()
    PREFERENCE_SAVE_FAILURES = _NoopCounter()
    RECOMMENDATION_REQUESTS = _NoopCounter()
    RECOMMENDATION_ERRORS = _NoopCounter()

    async def _simple_metrics_app(scope, receive, send):
        if scope.get("type") != "http":
            return
        body = b"# Prometheus metrics not available - install prometheus-client\n"
        await send({"type": "http.response.start", "status": 200, "headers": [(b"content-type", b"text/plain; charset=utf-8")]})
        await send({"type": "http.response.body", "body": body})


    def metrics_app():
        return _simple_metrics_app
