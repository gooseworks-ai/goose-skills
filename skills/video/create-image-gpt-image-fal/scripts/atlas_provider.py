"""Atlas Cloud adapter for the gpt-image capability.

Generation POSTs are deliberately single-attempt. Only prediction GETs use
bounded retry/backoff so a transient poll failure cannot duplicate a paid job.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Callable
from urllib import error as url_error
from urllib import request as url_request
from urllib.parse import urlparse


API_ROOT = "https://api.atlascloud.ai"
CATALOG_URL = f"{API_ROOT}/api/v1/models"
SUCCESS_STATUSES = {"completed", "succeeded", "success"}
FAILURE_STATUSES = {"failed", "canceled", "cancelled", "error"}

MODELS = {
    "gpt-image-1": {
        "t2i": "openai/gpt-image-1/text-to-image",
        "edit": "openai/gpt-image-1/edit",
    },
    "gpt-image-2": {
        "t2i": "openai/gpt-image-2/text-to-image",
        "edit": "openai/gpt-image-2/edit",
    },
}


class ConfirmationRequired(RuntimeError):
    """Raised after preflight when a billable submit was not confirmed."""


def _read_json(url: str, *, api_key: str | None = None) -> dict[str, Any]:
    headers = {"Accept": "application/json", "User-Agent": "goose-skills/atlas-provider"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = url_request.Request(url, headers=headers, method="GET")
    with url_request.urlopen(req, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Atlas GET returned a non-object response")
    return payload


def _post_json_once(url: str, *, api_key: str, payload: dict[str, Any]) -> dict[str, Any]:
    req = url_request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "goose-skills/atlas-provider",
        },
        method="POST",
    )
    try:
        with url_request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except url_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Atlas submit failed ({exc.code}): {detail}") from exc
    if not isinstance(result, dict):
        raise ValueError("Atlas submit returned a non-object response")
    return result


def _walk(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from _walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk(child)


def _find_model(catalog: dict[str, Any], model: str) -> dict[str, Any]:
    matches = [
        item
        for item in _walk(catalog)
        if item.get("model") == model and item.get("display_console") is True
    ]
    if len(matches) != 1:
        raise ValueError(f"Atlas model is unavailable or ambiguous: {model}")
    return matches[0]


def _validate_payload(schema: dict[str, Any], payload: dict[str, Any]) -> None:
    input_schema = schema.get("components", {}).get("schemas", {}).get("Input", {})
    properties = input_schema.get("properties")
    if not isinstance(properties, dict):
        raise ValueError("Atlas model schema is missing Input.properties")
    missing = sorted(set(input_schema.get("required", [])).difference(payload))
    if missing:
        raise ValueError(f"Atlas request is missing required fields: {', '.join(missing)}")
    unknown = sorted(set(payload).difference(set(properties).union({"model"})))
    if unknown:
        raise ValueError(f"Atlas request contains unsupported fields: {', '.join(unknown)}")
    for name, value in payload.items():
        choices = properties.get(name, {}).get("enum")
        if choices and value not in choices:
            raise ValueError(f"Atlas {name} must be one of: {', '.join(map(str, choices))}")


def _unwrap(payload: dict[str, Any]) -> dict[str, Any]:
    if "code" in payload and str(payload.get("code")) != "200":
        raise RuntimeError(
            f"Atlas API returned code {payload.get('code')}: {payload.get('message')}"
        )
    data = payload.get("data", payload)
    if not isinstance(data, dict):
        raise ValueError("Atlas response is missing an object payload")
    return data


def _prediction_path(schema: dict[str, Any]) -> str:
    for path, operation in schema.get("paths", {}).items():
        if "{request_id}" in path and isinstance(operation, dict) and "get" in operation:
            return path
    return "/api/v1/model/prediction/{request_id}"


def _unit_price(entry: dict[str, Any]) -> str:
    actual = entry.get("price", {}).get("actual", {})
    return str(actual.get("base_price", "unknown"))


def generate(
    *,
    prompt: str,
    model_family: str,
    size: str,
    quality: str,
    ref_urls: list[str],
    confirmed: bool,
    poll_attempts: int = 30,
    read_json: Callable[..., dict[str, Any]] = _read_json,
    post_json: Callable[..., dict[str, Any]] = _post_json_once,
    sleep_fn: Callable[[float], None] = time.sleep,
) -> tuple[str, dict[str, Any]]:
    """Submit once to Atlas, poll with bounded GET retries, and return one URL."""
    api_key = os.environ.get("ATLASCLOUD_API_KEY") or os.environ.get("ATLAS_CLOUD_API_KEY")
    if not api_key:
        raise RuntimeError("ATLASCLOUD_API_KEY is required for the Atlas provider")
    if model_family not in MODELS:
        raise ValueError(f"Unsupported Atlas model family: {model_family}")

    model = MODELS[model_family]["edit" if ref_urls else "t2i"]
    catalog = read_json(CATALOG_URL, api_key=api_key)
    entry = _find_model(catalog, model)
    schema_url = entry.get("schema")
    if not isinstance(schema_url, str) or urlparse(schema_url).scheme != "https":
        raise ValueError("Atlas model catalog is missing an HTTPS schema URL")
    schema = read_json(schema_url)

    payload: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "output_format": "png",
        "moderation": "low",
    }
    if ref_urls:
        payload["images"] = ref_urls
    _validate_payload(schema, payload)

    print(
        f"[gpt-image-atlas] plan model={model} size={size} "
        f"quality={quality} unit_price={_unit_price(entry)}",
        flush=True,
    )
    if not confirmed:
        raise ConfirmationRequired(
            "Atlas generation is billable. Review the plan and rerun with --yes."
        )

    submitted = _unwrap(
        post_json(
            f"{API_ROOT}/api/v1/model/generateImage",
            api_key=api_key,
            payload=payload,
        )
    )
    prediction_id = submitted.get("id") or submitted.get("prediction_id")
    if not isinstance(prediction_id, str) or not prediction_id:
        raise ValueError("Atlas submit response is missing a prediction id")

    result_path = _prediction_path(schema).replace("{request_id}", prediction_id)
    result_url = f"{API_ROOT}{result_path}"
    completed: dict[str, Any] | None = None
    for poll_index in range(poll_attempts):
        last_error: Exception | None = None
        for retry_index in range(4):
            try:
                prediction = _unwrap(read_json(result_url, api_key=api_key))
                last_error = None
                break
            except (OSError, ValueError, url_error.URLError) as exc:
                last_error = exc
                if retry_index < 3:
                    sleep_fn(float(2**retry_index))
        if last_error is not None:
            raise RuntimeError(f"Atlas prediction GET failed after 4 attempts: {last_error}")
        status = str(prediction.get("status", "")).lower()
        if status in SUCCESS_STATUSES:
            completed = prediction
            break
        if status in FAILURE_STATUSES:
            raise RuntimeError(f"Atlas prediction {status}: {prediction.get('error', 'no detail')}")
        if poll_index + 1 < poll_attempts:
            sleep_fn(float(min(2**poll_index, 8)))
    if completed is None:
        raise TimeoutError(f"Atlas prediction did not finish after {poll_attempts} polls")

    outputs = completed.get("outputs") or completed.get("output")
    if isinstance(outputs, str):
        outputs = [outputs]
    if not isinstance(outputs, list) or not outputs or not isinstance(outputs[0], str):
        raise ValueError("Atlas prediction completed without an output URL")
    if urlparse(outputs[0]).scheme != "https":
        raise ValueError("Atlas output URL must use HTTPS")
    unit_price = _unit_price(entry)
    return outputs[0], {
        "gateway": "atlas-cloud",
        "model": model,
        "model_family": model_family,
        "prediction_id": prediction_id,
        "unit_price": unit_price,
        "cost_estimate_usd": unit_price,
    }
