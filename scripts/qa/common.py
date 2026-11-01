# Shared bits of the QA scripts: the base URL (and a Vercel share token for a
# protected preview), an iPhone context with the guide teaser answered.
import argparse
def args(extra=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("base", help="https://site or the preview alias, no trailing slash")
    ap.add_argument("--token", default="", help="_vercel_share token for a protected preview")
    if extra: extra(ap)
    a = ap.parse_args(); a.base = a.base.rstrip("/"); return a
def url(a, path):
    q = f"_vercel_share={a.token}" if a.token else ""
    return f"{a.base}{path}" + (("&" if "?" in path else "?") + q if q else "")
