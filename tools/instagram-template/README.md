# Danielor Instagram template (קו המותג "לילך זוהר")

The fixed brand line for Daniel's Instagram posts and carousels (personal account, Danielor).
First used for post 01, the launch carousel (Oct 2026). Finished posts live in Google Drive:
דניאלור ייעוץ ויזמות בע"מ / אינסטגרם / פוסט NN - שם, files named "שקף N - שם".

- `danielor-slide-base.html`: empty slide with every fixed part (background glows, pill kicker, headline, footer). Replace FONT with the @fontsource path.
- `render.mjs`: frame renderer (Playwright, seek(t), DPR 1.5, 60fps) plus the ffmpeg line in its header.
- `patterns/tools-chips.html`: logo chips on a white board (slide 2 of post 01).
- `patterns/floating-cards.html`: wall of cards flying in with video frames, a code-drawn CRM and automation flow (slide 6).
- `patterns/video-card-cover.html`: cover with a 9:16 video card and a live clock chip (slide 1).
- `patterns/static-slides.html`: static slides with a video/phone frame composited in ffmpeg, and the end card.
- `logos/`: tool logos from Daniel's Drive folder (use only these).
- `end-card.png`: the fixed closing slide (DANIELOR, danielor.ai, הקישור בביו).

Patterns load fonts from ../ogfonts/node_modules and frames from ../more/fr etc. Adjust paths when reusing.
