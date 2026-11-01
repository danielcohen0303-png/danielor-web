# A screen recording from the phone, frame by frame: how many frames each
# second actually showed and the longest gap (a stuck film shows as a drop
# from 60), plus a sheet of stills to see where it was.
#   python3 scripts/qa/recording.py ScreenRecording.mp4 [--every 2]
import argparse, subprocess, numpy as np, pathlib
ap = argparse.ArgumentParser(); ap.add_argument("file"); ap.add_argument("--every", type=float, default=2.0); a = ap.parse_args()
pts = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "frame=pts_time", "-of", "csv=p=0", a.file], capture_output=True, text=True).stdout.split()
t = np.array([float(x.strip(",")) for x in pts if x.strip(",")]); dt = np.diff(t)
for s in range(int(t[-1]) + 1):
    m = (t[1:] >= s) & (t[1:] < s + 1)
    if m.any(): print(f"{s:3d}s  frames {m.sum():3d}  longest gap {dt[m].max() * 1000:5.0f} ms" + ("   <-- stuck" if m.sum() < 45 else ""))
out = pathlib.Path(a.file).with_suffix(".sheet.png")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.file, "-vf", f"fps=1/{a.every},scale=200:-2,tile=12x3", "-frames:v", "1", str(out)])
print("sheet:", out)
