# read-labels

## 1.0.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.0.0.

## 1.0.0

- New (GOOSE-4034). Reads the large words on the product in two frames per scene against the real product photo
  with a vision model (fal `openrouter/router/vision`, `anthropic/claude-sonnet-5.5`), and stops the run when one
  is clearly misspelled (`on_misspelled: "fail"`, the default), so a garbled label is never called ready.
