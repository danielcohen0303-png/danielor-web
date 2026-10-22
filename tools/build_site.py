"""Build the deployable danielor.ai site from the artifact source: full HTML head + share tags, and every file the page uses."""
import re, shutil, os, sys
SRC=os.environ.get('DANIELOR_SRC') or '/tmp/claude-0/-home-claude/052c7cab-d39c-5146-8f96-08517fb828ab/scratchpad/danielor'
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
<meta property="og:title" content="Danielor · כל ה-AI שהעסק צריך">
<meta property="og:description" content="פתרונות AI לעסקים בעברית: סרטוני פרסומת, סוכן וואטסאפ, דפי נחיתה, מצגות והצעות מחיר מעוצבות. וגם טרנדים וקליפים אישיים.">
<meta property="og:image" content="https://danielor.ai/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Danielor: פתרונות AI לעסקים, בעברית">
<meta name="twitter:card" content="summary_large_image">
'''
html=html.replace('<title>Danielor</title>','<title>Danielor · פתרונות AI לעסקים, בעברית</title>',1)
html=html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
LEGAL=['privacy.html','terms.html','accessibility.html']
WITH_LEGAL='--no-legal' not in sys.argv     # legal pages stay out until Daniel approves them
if not WITH_LEGAL:
    html=re.sub(r'\n\s*<nav class="legal".*?</nav>', '', html, flags=re.S)
page=head+html.rstrip()+'\n</body>\n</html>\n'
# every local file the page references
names=set(re.findall(r'''["'(]([\w.\-]+\.(?:mp4|jpg|jpeg|png|webp|svg))["')]''', html))
names={n for n in names if n[0].isalnum()}
names|={n.replace('.mp4','-poster.jpg') for n in re.findall(r'data-video="([\w.\-]+\.mp4)"', html)}
# full videos the library page (/videos) plays straight from the site root
names|={n for n in re.findall(r'"src": "/([\w.\-]+\.mp4)"', open('/home/claude/danielor-web/lib/data.js',encoding='utf-8').read()) if not n.startswith('how-')}  # how-*: kept below (HOW)
os.makedirs(OUT,exist_ok=True)
missing=[n for n in sorted(names) if not os.path.exists(f'{SRC}/{n}')]
if missing: print('MISSING', missing); sys.exit(1)
HOW={'how-trend.mp4','how-clip.mp4','how-business.mp4','how-launch.mp4','how-ai.mp4'}   # sent by the WhatsApp agent (media_base)
keep={'index.html','og.jpg','robots.txt','vercel.json','brief','inbox','trends','videos','lib','wa-avatar.jpg','logo-icon.png','sign.webp'}|HOW|names|(set(LEGAL) if WITH_LEGAL else set())
for f in os.listdir(OUT):
    if f not in keep: os.remove(f'{OUT}/{f}')
for n in sorted(names): shutil.copy2(f'{SRC}/{n}', f'{OUT}/{n}')
missing_how=[n for n in HOW if not os.path.exists(f'{OUT}/{n}')]
if missing_how: print('MISSING agent videos', missing_how); sys.exit(1)
shutil.copy2(OG, f'{OUT}/og.jpg')
if WITH_LEGAL:
    for n in LEGAL: shutil.copy2(f'{SRC}/{n}', f'{OUT}/{n}')
open(f'{OUT}/index.html','w',encoding='utf-8').write(page)
open(f'{OUT}/robots.txt','w').write('User-agent: *\nAllow: /\n')
# brief.danielor.ai is served by the same Vercel project: its host is routed into /brief (routes run before static files)
os.makedirs(f'{OUT}/brief',exist_ok=True)
shutil.copy2('/home/claude/danielor-web/brief/index.html', f'{OUT}/brief/index.html')
# the inbox: Daniel's page for reading and answering WhatsApp chats (noindex, key-protected API)
shutil.copytree('/home/claude/danielor-web/inbox', f'{OUT}/inbox', dirs_exist_ok=True)
# the trends chart: danielor.ai/trends (reads the live list from the danielor-trends function; its loops live in trends/m)
TR='/home/claude/danielor-web/trends'
os.makedirs(f'{OUT}/trends/m',exist_ok=True)
for n in os.listdir(f'{TR}/m'): shutil.copy2(f'{TR}/m/{n}', f'{OUT}/trends/m/{n}')
tpage=open(f'{TR}/index.html',encoding='utf-8').read().replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
thead=head.replace('<link rel="canonical" href="https://danielor.ai/">','<link rel="canonical" href="https://danielor.ai/trends">').replace('content="https://danielor.ai/"','content="https://danielor.ai/trends"').replace('Danielor · כל ה-AI שהעסק צריך','הטרנדים החמים עכשיו · Danielor').replace('<meta property="og:description" content="פתרונות AI לעסקים בעברית: סרטוני פרסומת, סוכן וואטסאפ, דפי נחיתה, מצגות והצעות מחיר מעוצבות. וגם טרנדים וקליפים אישיים.">','<meta property="og:description" content="טרנדי ה-AI החמים עכשיו. בוחרים טרנד, שולחים תמונה בוואטסאפ ומקבלים אותו עם הפנים שלכם.">')
thead+='<link rel="icon" href="/logo-icon.png">\n<link rel="apple-touch-icon" href="/logo-icon.png">\n'
open(f'{OUT}/trends/index.html','w',encoding='utf-8').write(thead+tpage.rstrip()+'\n</body>\n</html>\n')
# the video library: danielor.ai/videos (reads /lib/data.js; loops, posters and new videos live in lib/)
LIB='/home/claude/danielor-web/lib'
os.makedirs(f'{OUT}/lib',exist_ok=True)
for n in os.listdir(f'{OUT}/lib'):
    if not os.path.exists(f'{LIB}/{n}'): os.remove(f'{OUT}/lib/{n}')
for n in os.listdir(LIB): shutil.copy2(f'{LIB}/{n}', f'{OUT}/lib/{n}')
os.makedirs(f'{OUT}/videos',exist_ok=True)
vpage=open('/home/claude/danielor-web/videos/index.html',encoding='utf-8').read().replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
vhead=head.replace('<link rel="canonical" href="https://danielor.ai/">','<link rel="canonical" href="https://danielor.ai/videos">').replace('content="https://danielor.ai/"','content="https://danielor.ai/videos"').replace('Danielor · כל ה-AI שהעסק צריך','סרטונים שהכנו · Danielor')
vhead+='<link rel="icon" href="/logo-icon.png">\n<link rel="apple-touch-icon" href="/logo-icon.png">\n'
open(f'{OUT}/videos/index.html','w',encoding='utf-8').write(vhead+vpage.rstrip()+'\n</body>\n</html>\n')
import json
B={"type":"host","value":"brief.danielor.ai"}
cfg={"routes":[
  {"src":"/(.*)","has":[B],"continue":True,"headers":{"X-Robots-Tag":"noindex, nofollow","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","Cache-Control":"no-cache"}},
  {"src":"/inbox/?","dest":"/inbox/index.html","headers":{"X-Robots-Tag":"noindex, nofollow","Cache-Control":"no-cache"}},
  {"src":"/trends/?","dest":"/trends/index.html"},
  {"src":"/videos/?","dest":"/videos/index.html"},
  {"src":"/","has":[B],"dest":"/brief/index.html"},
  {"src":"/([A-Za-z0-9]{8,32})/?","has":[B],"dest":"/brief/index.html"}
]}
open(f'{OUT}/vercel.json','w').write(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n')
tot=sum(os.path.getsize(f'{OUT}/{f}') for f in os.listdir(OUT))
print(len(os.listdir(OUT)),'files', round(tot/1e6,1),'MB')
