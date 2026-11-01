#!/usr/bin/env bash
# Build every media set a scroll film needs, from one master clip.
#
#   scripts/media/build-film.sh <master.mp4> <name> [version]
#
# Writes public/film/<name>/<version>/ (version default v1). A new render
# goes to a new version folder, never over an old one: the files are cached
# for a year as immutable.
#   frames/phone  720x1280 WebP   (image-sequence engine on phones)
#   frames/desk   1080x1920 WebP  (image-sequence engine on computers)
#   video/g6-24     1080x1920, source rate, keyframe every 6 frames
#   video/intra-24  1080x1920, source rate, every frame a keyframe
#   video/g6-60     1080x1920, interpolated to 60/s, keyframe every 6 (AC's winner);
#                   lanczos and crf 19, so soft AI footage keeps what detail it has
#   video/lite-60   540x960, 60/s, for weak reception
#   video/p720-60   720x1280, 60/s, keyframe every 6: phones, for busy footage
#                   (aerials, cities): the AC site's phone size, about a third
#                   of g6-60's bytes (Samana flight: 22.5MB at 1080p)
#   poster.webp, meta.json
#
# A 16:9 master (a site shown "wide" on computers, site.desktop = "wide"):
# also writes frames/wide (1920x1080 WebP) for computers, and every phone
# output above is a 9:16 crop of it. CROP_X (0..1, default 0.5) is where the
# crop sits across the frame; a crop that follows the subject frame by frame
# is the AC site's film-frames.sh (portraitCrop in meta.json).
#   CROP_X=0.4 scripts/media/build-film.sh master-16x9.mp4 <name> v1
set -euo pipefail
SRC="$1"; NAME="$2"; VER="${3:-v1}"
OUT="public/film/$NAME/$VER"
mkdir -p "$OUT/frames/phone" "$OUT/frames/desk" "$OUT/video"
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$SRC")
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$SRC")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$SRC")
# a wide master: the 9:16 outputs are cut from it (C prefixes each of their filters)
C=""
if [ "$W" -gt "$H" ]; then
  C="crop=trunc(ih*9/16/2)*2:ih:(iw-trunc(ih*9/16/2)*2)*${CROP_X:-0.5}:0,"
fi
X264=(-c:v libx264 -preset slow -pix_fmt yuv420p -an -movflags +faststart)
MI="minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"

# this ffmpeg has no WebP encoder: PNG frames, then cwebp (as on the AC site)
TMP=$(mktemp -d)
mkdir -p "$TMP/phone" "$TMP/desk"
ffmpeg -v error -y -i "$SRC" -vf "${C}scale=720:1280:flags=lanczos" "$TMP/phone/f%04d.png" &
ffmpeg -v error -y -i "$SRC" -vf "${C}scale=1080:1920:flags=lanczos" "$TMP/desk/f%04d.png" &
ffmpeg -v error -y -i "$SRC" -vf "${C}scale=1080:1920:flags=lanczos" "${X264[@]}" -crf 22 -g 6 -keyint_min 6 -sc_threshold 0 "$OUT/video/g6-24.mp4" &
ffmpeg -v error -y -i "$SRC" -vf "${C}scale=1080:1920:flags=lanczos" "${X264[@]}" -crf 22 -g 1 "$OUT/video/intra-24.mp4" &
wait
ffmpeg -v error -y -i "$SRC" -vf "${C}scale=1080:1920:flags=lanczos,$MI" "${X264[@]}" -crf 19 -g 6 -keyint_min 6 -sc_threshold 0 "$OUT/video/g6-60.mp4" &
ffmpeg -v error -y -i "$SRC" -vf "${C}scale=540:960,$MI" "${X264[@]}" -crf 30 -g 6 -keyint_min 6 -sc_threshold 0 "$OUT/video/lite-60.mp4" &
ffmpeg -v error -y -i "$SRC" -vf "${C}scale=720:1280:flags=lanczos,$MI" "${X264[@]}" -crf 21 -g 6 -keyint_min 6 -sc_threshold 0 "$OUT/video/p720-60.mp4" &
wait
if [ -n "$C" ]; then
  mkdir -p "$TMP/wide" "$OUT/frames/wide"
  ffmpeg -v error -y -i "$SRC" -vf scale=1920:1080:flags=lanczos "$TMP/wide/f%04d.png"
  ls "$TMP/wide" | xargs -P 8 -I{} sh -c 'cwebp -quiet -q 80 -m 6 -sharp_yuv "$1/{}" -o "$2/$(basename {} .png).webp"' _ "$TMP/wide" "$OUT/frames/wide"
fi
for set in phone desk; do
  q=$([ "$set" = phone ] && echo 78 || echo 80)
  ls "$TMP/$set" | xargs -P 8 -I{} sh -c 'cwebp -quiet -q '"$q"' -m 6 -sharp_yuv "$1/{}" -o "$2/$(basename {} .png).webp"' _ "$TMP/$set" "$OUT/frames/$set"
done
cp "$OUT/frames/phone/f0001.webp" "$OUT/poster.webp"
rm -rf "$TMP"

N=$(ls "$OUT/frames/phone" | wc -l | tr -d ' ')
kb() { du -sk "$1" | cut -f1; }
cat > "$OUT/meta.json" <<JSON
{
  "frames": $N,
  "fps": $(python3 -c "print(round($FPS, 3))"),
  "ratio": [9, 16],
  "kb": {
    "phone": $(kb "$OUT/frames/phone"), "desk": $(kb "$OUT/frames/desk"),
    "g6-24": $(kb "$OUT/video/g6-24.mp4"), "intra-24": $(kb "$OUT/video/intra-24.mp4"),
    "g6-60": $(kb "$OUT/video/g6-60.mp4"), "lite-60": $(kb "$OUT/video/lite-60.mp4"),
    "p720-60": $(kb "$OUT/video/p720-60.mp4")
  }
}
JSON
cat "$OUT/meta.json"
