# Sample input — remix-graphic-ad-from-reference

```yaml
reference_image: ./reference-product-sky-arrows.jpg # a Pinterest pin from the ads library
product: ./brand-assets/product-hero.png # real brand product render (clean bg or transparent)
brand:
 name: Example Gut Co
 palette: { primary: "#1d3d39", accent: "#632240", paper: "#eee3d6" }
 font: Lexend
 url: examplegut.co
copy_changes:
 pre: "Start feeling good,"
 big: "from the gut."
 callouts: ["Beats bloating", "Smoother digestion", "All-day energy"]
 social_proof: "10,000+ happy customers"
 discount: { top: "up to", pct: "45", sub: "your first order" }
aspect: 4:5 # -> poster canvas (1080x1350)
route_hint: auto
```

Reference anatomy (expected): sky background, product held up / floating center, 3 white curved
benefit arrows, 5 stars + social proof bottom-left, scalloped discount seal bottom-right.
Expected route: **html** (floating product on a sky gradient — default). Use **gpt_image_2** only if a real hand-holding-product photo is required.
