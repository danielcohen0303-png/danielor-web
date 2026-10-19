"""Build the deployable danielor.ai site from the artifact source: full HTML head + share tags, and every file the page uses."""
import re, shutil, os, sys
SRC='/tmp/claude-0/-home-claude/052c7cab-d39c-5146-8f96-08517fb828ab/scratchpad/danielor'
OUT='/home/claude/danielor-web/site'
OG='/tmp/claude-0/-home-claude/052c7cab-d39c-5146-8f96-08517fb828ab/scratchpad/og.jpg'
html=open(f'{SRC}/index.html',encoding='utf-8').read()
head='''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f6f1fb">
<link rel="canonical" href="https://danielor.ai/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Danielor">
<meta property="og:locale" content="he_IL">
<meta property="og:url" content="https://danielor.ai/">
<meta property="og:title" content="Danielor · שולחים תמונה. מקבלים סרטון.">
<meta property="og:description" content="סרטוני AI בעברית לעסקים ולאנשים פרטיים: טרנדים, קליפים אישיים וסרטונים לעסק.">
<meta property="og:image" content="https://danielor.ai/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Danielor: שולחים תמונה. מקבלים סרטון.">
<meta name="twitter:card" content="summary_large_image">
'''
html=html.replace('<title>Danielor</title>','<title>Danielor · סרטוני AI בעברית</title>',1)
html=html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
page=head+html.rstrip()+'\n</body>\n</html>\n'
# every local file the page references
names=set(re.findall(r'''["'(]([\w.\-]+\.(?:mp4|jpg|jpeg|png|webp|svg))["')]''', html))
names={n for n in names if n[0].isalnum()}
names|={n.replace('.mp4','-poster.jpg') for n in re.findall(r'data-video="([\w.\-]+\.mp4)"', html)}
os.makedirs(OUT,exist_ok=True)
missing=[n for n in sorted(names) if not os.path.exists(f'{SRC}/{n}')]
if missing: print('MISSING', missing); sys.exit(1)
keep={'index.html','og.jpg','robots.txt','vercel.json'}|names
for f in os.listdir(OUT):
    if f not in keep: os.remove(f'{OUT}/{f}')
for n in sorted(names): shutil.copy2(f'{SRC}/{n}', f'{OUT}/{n}')
shutil.copy2(OG, f'{OUT}/og.jpg')
open(f'{OUT}/index.html','w',encoding='utf-8').write(page)
open(f'{OUT}/robots.txt','w').write('User-agent: *\nAllow: /\n')
open(f'{OUT}/vercel.json','w').write('{\n  "cleanUrls": true\n}\n')
tot=sum(os.path.getsize(f'{OUT}/{f}') for f in os.listdir(OUT))
print(len(os.listdir(OUT)),'files', round(tot/1e6,1),'MB')
