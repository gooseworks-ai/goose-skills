import importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('builder',Path(__file__).resolve().parents[1]/'scripts/build_composition.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)

class ConfigContract(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        (self.root/'logo.png').write_bytes(b'png-fixture');(self.root/'font.woff2').write_bytes(b'font-fixture')
        self.cfg={'brand':'Example','cta':'Explore','url':'example.com','logo':'logo.png','font':'font.woff2','states':[{'kind':'button','title':'Start'},{'kind':'brief','title':'Brief'},{'kind':'brain','title':'Memory'},{'kind':'cta','title':'Finish'}]}
        self.cfg['palette']={'paper':'#FFFFFF','ink':'#111111','accent':'#CC4411','muted':'#777777'}
    def tearDown(self):self.tmp.cleanup()
    def build(self):
        p=self.root/'config.json';p.write_text(json.dumps(self.cfg));out=self.root/'index.html';builder.build(p,out);return out.read_text()
    def test_user_text_cannot_escape_json_script(self):
        self.cfg['brand']='</script><script>window.injected=true</script>'
        html=self.build();self.assertNotIn(self.cfg['brand'],html);self.assertIn('\\u003c/script\\u003e',html)
    def test_lfs_pointer_is_rejected(self):
        (self.root/'logo.png').write_text('version https://git-lfs.github.com/spec/v1\noid sha256:abc\n')
        with self.assertRaisesRegex(ValueError,'LFS pointer'):self.build()
    def test_missing_cta_is_rejected(self):
        self.cfg['states'][-1]['kind']='brain'
        with self.assertRaisesRegex(ValueError,'final state'):self.build()
    def test_unknown_state_is_rejected(self):
        self.cfg['states'][1]['kind']='dashboard'
        with self.assertRaisesRegex(ValueError,'Unsupported state'):self.build()
    def test_invalid_palette_is_rejected(self):
        self.cfg['palette']={'paper':'url(javascript:bad)','ink':'#000000','accent':'#FFFFFF','muted':'#999999'}
        with self.assertRaisesRegex(ValueError,'palette'):self.build()
    def test_missing_brand_palette_is_rejected(self):
        del self.cfg['palette']
        with self.assertRaisesRegex(ValueError,'palette'):self.build()
    def test_non_button_opening_is_rejected(self):
        self.cfg['states'][0]['kind']='brief'
        with self.assertRaisesRegex(ValueError,'opening state'):self.build()
if __name__=='__main__':unittest.main()
