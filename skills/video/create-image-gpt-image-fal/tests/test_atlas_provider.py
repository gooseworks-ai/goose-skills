import importlib.util
import os
import unittest
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).parents[1] / "scripts" / "atlas_provider.py"
SPEC = importlib.util.spec_from_file_location("atlas_provider", SCRIPT)
assert SPEC and SPEC.loader
atlas = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(atlas)

MODEL = "openai/gpt-image-2/text-to-image"
EDIT_MODEL = "openai/gpt-image-2/edit"
SCHEMA_URL = "https://static.example.test/schema.json"


def catalog(*models):
    return {
        "code": "200",
        "data": {
            "groups": [
                {
                    "models": [
                        {
                            "model": model,
                            "display_console": True,
                            "schema": SCHEMA_URL,
                            "price": {"actual": {"base_price": "0.009"}},
                        }
                        for model in models
                    ]
                }
            ]
        },
    }


def schema(*, edit=False):
    properties = {
        "prompt": {"type": "string"},
        "size": {"enum": ["1024x1024"]},
        "quality": {"enum": ["medium", "high"]},
        "output_format": {"enum": ["png", "jpeg"]},
        "moderation": {"type": "string"},
    }
    required = ["model", "prompt"]
    if edit:
        properties["images"] = {"type": "array"}
        required.append("images")
    return {
        "paths": {"/api/v1/model/result/{request_id}": {"get": {}}},
        "components": {
            "schemas": {"Input": {"properties": properties, "required": required}}
        },
    }


class AtlasProviderTests(unittest.TestCase):
    def test_finds_one_exact_console_visible_model(self):
        entry = atlas._find_model(catalog(MODEL), MODEL)
        self.assertEqual(entry["model"], MODEL)
        self.assertEqual(atlas._unit_price(entry), "0.009")

    def test_schema_rejects_an_unsupported_size(self):
        payload = {
            "model": MODEL,
            "prompt": "test",
            "size": "2048x2048",
            "quality": "medium",
            "output_format": "png",
            "moderation": "low",
        }
        with self.assertRaisesRegex(ValueError, "Atlas size must be one of"):
            atlas._validate_payload(schema(), payload)

    @mock.patch.dict(os.environ, {"ATLASCLOUD_API_KEY": "test-key"}, clear=True)
    def test_unconfirmed_preflight_never_posts(self):
        post_calls = []

        def read_json(url, **_kwargs):
            return schema() if url == SCHEMA_URL else catalog(MODEL)

        def post_json(*args, **kwargs):
            post_calls.append((args, kwargs))
            raise AssertionError("unconfirmed generation must not POST")

        with self.assertRaises(atlas.ConfirmationRequired):
            atlas.generate(
                prompt="test",
                model_family="gpt-image-2",
                size="1024x1024",
                quality="medium",
                ref_urls=[],
                confirmed=False,
                read_json=read_json,
                post_json=post_json,
            )
        self.assertEqual(post_calls, [])

    @mock.patch.dict(os.environ, {"ATLASCLOUD_API_KEY": "test-key"}, clear=True)
    def test_confirmed_generation_posts_once_then_polls_result_path(self):
        posts = []
        predictions = iter(
            [
                {"code": 200, "data": {"status": "processing"}},
                {
                    "code": 200,
                    "data": {
                        "status": "completed",
                        "outputs": ["https://cdn.example.test/result.png"],
                    },
                },
            ]
        )

        def read_json(url, **_kwargs):
            if url == atlas.CATALOG_URL:
                return catalog(MODEL)
            if url == SCHEMA_URL:
                return schema()
            self.assertEqual(url, f"{atlas.API_ROOT}/api/v1/model/result/prediction-1")
            return next(predictions)

        def post_json(url, **kwargs):
            posts.append((url, kwargs["payload"]))
            return {"code": 200, "data": {"id": "prediction-1"}}

        url, metadata = atlas.generate(
            prompt="test",
            model_family="gpt-image-2",
            size="1024x1024",
            quality="medium",
            ref_urls=[],
            confirmed=True,
            read_json=read_json,
            post_json=post_json,
            sleep_fn=lambda _: None,
        )

        self.assertEqual(url, "https://cdn.example.test/result.png")
        self.assertEqual(metadata["gateway"], "atlas-cloud")
        self.assertEqual(len(posts), 1)
        self.assertEqual(posts[0][1]["model"], MODEL)

    @mock.patch.dict(os.environ, {"ATLASCLOUD_API_KEY": "test-key"}, clear=True)
    def test_reference_images_select_the_edit_model_and_payload(self):
        submitted = []

        def read_json(url, **_kwargs):
            if url == atlas.CATALOG_URL:
                return catalog(EDIT_MODEL)
            if url == SCHEMA_URL:
                return schema(edit=True)
            return {
                "code": 200,
                "data": {
                    "status": "completed",
                    "outputs": ["https://cdn.example.test/edit.png"],
                },
            }

        def post_json(_url, **kwargs):
            submitted.append(kwargs["payload"])
            return {"code": 200, "data": {"id": "prediction-edit"}}

        atlas.generate(
            prompt="edit",
            model_family="gpt-image-2",
            size="1024x1024",
            quality="high",
            ref_urls=["https://example.test/ref.png"],
            confirmed=True,
            read_json=read_json,
            post_json=post_json,
            sleep_fn=lambda _: None,
        )

        self.assertEqual(len(submitted), 1)
        self.assertEqual(submitted[0]["model"], EDIT_MODEL)
        self.assertEqual(submitted[0]["images"], ["https://example.test/ref.png"])


if __name__ == "__main__":
    unittest.main()
