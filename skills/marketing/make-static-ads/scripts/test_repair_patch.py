"""Runtime checks for manually bounded official-label pixel repair. No network or image models."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

import cv2
import numpy as np
import repair_patch as repair


def band(left=2, right=17, top=2, bottom=17):
    return {"left": [left, left], "right": [right, right],
            "top": [top, top, top], "bottom": [bottom, bottom, bottom]}


class LabelRepairTests(unittest.TestCase):
    def setUp(self):
        y, x = np.indices((24, 24))
        self.source = np.stack([x*8, y*8, x+y], axis=2).astype(np.uint8)
        self.base = np.full((32, 32, 3), (19, 41, 83), np.uint8)

    def test_translation_preserves_real_pixels_and_all_exterior_pixels(self):
        out, mask, evidence = repair.composite_label(self.source, self.base, band(), band(5, 20, 5, 20))
        np.testing.assert_array_equal(out[mask == 0], self.base[mask == 0])
        for y, x in ((10, 10), (10, 16), (16, 10), (16, 16)):
            np.testing.assert_array_equal(out[y, x], self.source[y-3, x-3])
        self.assertEqual(evidence["outside_mask_changed_channels"], 0)
        self.assertEqual(out.shape, self.base.shape)

    def test_curved_slanted_band_converges_without_touching_rest_of_scene(self):
        target = {"left": [7, 5], "right": [25, 23], "top": [5, 7, 6], "bottom": [25, 27, 26]}
        out, mask, evidence = repair.composite_label(self.source, self.base, band(), target)
        self.assertLessEqual(evidence["inverse_error_px"], .1)
        self.assertGreater(np.count_nonzero(mask), 100)
        np.testing.assert_array_equal(out[mask == 0], self.base[mask == 0])
        self.assertFalse(mask[:5].any())
        self.assertFalse(mask[:, :5].any())

    def test_downscale_antialias_does_not_create_hard_checker_noise(self):
        source = np.zeros((128, 128, 3), np.uint8)
        source[::2, ::2] = 255; source[1::2, 1::2] = 255
        out, mask, _ = repair.composite_label(source, self.base, band(4, 123, 4, 123), band(6, 25, 6, 25))
        center = out[10:21, 10:21]
        self.assertGreater(center.min(), 90)
        self.assertLess(center.max(), 165)
        np.testing.assert_array_equal(out[mask == 0], self.base[mask == 0])

    def test_invalid_and_crossed_geometry_fails_before_compositing(self):
        bads = [band(-1, 17), band(2, 40), band(17, 2), band(2, 3),
                dict(band(), top=[1, -9, 1]), dict(band(), top=[2, float('nan'), 2]),
                dict(band(), left=[True, 2]), dict(band(), left=[2, 15])]
        for bad in bads:
            with self.subTest(bad=bad), self.assertRaises(repair.RepairError):
                repair.composite_label(self.source, self.base, bad, band(5, 20, 5, 20))

    def test_inverted_source_or_target_mapping_is_rejected(self):
        folded = {"left": [2, 10], "right": [24, 32],
                  "top": [2, 62, 122], "bottom": [10, 70, 127]}
        image = np.full((128, 128, 3), 200, np.uint8)
        for source_band, target_band in ((folded, band()), (band(), folded)):
            with self.subTest(source_band=source_band), self.assertRaisesRegex(repair.RepairError, "folds or inverts"):
                repair.composite_label(image, image, source_band, target_band)

    def manifest(self, directory):
        source = directory/'source.png';base = directory/'base.png'
        cv2.imwrite(str(source), self.source);cv2.imwrite(str(base), self.base)
        return {"source_image": "source.png", "base_image": "base.png", "output_image": "repaired.png",
                "mask_image": "mask.png", "evidence_json": "evidence.json", "source_rights_confirmed": True,
                "compatible_pose_reviewed": True, "source_band": band(), "target_band": band(5, 20, 5, 20)}

    def test_cli_manifest_records_provenance_and_reloads_exact_mask_invariant(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp);data = self.manifest(directory);path = directory/'manifest.json'
            path.write_text(json.dumps(data));evidence = repair.run(path)
            result = cv2.imread(str(directory/'repaired.png'));mask = cv2.imread(str(directory/'mask.png'), 0)
            np.testing.assert_array_equal(result[mask == 0], self.base[mask == 0])
            self.assertEqual(evidence["source_sha256"], hashlib.sha256((directory/'source.png').read_bytes()).hexdigest())
            self.assertEqual(evidence["output_sha256"], hashlib.sha256((directory/'repaired.png').read_bytes()).hexdigest())
            self.assertEqual(evidence["model_calls"], 0)
            self.assertEqual(evidence["credits"], 0)

    def test_permissions_and_original_paths_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp);data = self.manifest(directory);path = directory/'manifest.json'
            for key in ("source_rights_confirmed", "compatible_pose_reviewed"):
                bad = copy.deepcopy(data);bad[key] = False;path.write_text(json.dumps(bad))
                with self.assertRaises(repair.RepairError):repair.run(path)
            for destination in ("base.png", "source.png", "manifest.json"):
                bad = copy.deepcopy(data);bad["output_image"] = destination;path.write_text(json.dumps(bad))
                with self.assertRaises(repair.RepairError):repair.run(path)
            np.testing.assert_array_equal(cv2.imread(str(directory/'base.png')), self.base)
            np.testing.assert_array_equal(cv2.imread(str(directory/'source.png')), self.source)

    def test_alpha_and_excessive_feather_are_explicitly_out_of_scope(self):
        with self.assertRaises(repair.RepairError):
            repair.composite_label(np.zeros((24, 24, 4), np.uint8), self.base, band(), band(5, 20, 5, 20))
        with self.assertRaises(repair.RepairError):
            repair.composite_label(self.source, self.base, band(), band(5, 20, 5, 20), feather_px=30)


if __name__ == "__main__":unittest.main()
