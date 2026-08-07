#!/usr/bin/env python3
"""Prove the built file ships no client data.

Pulls every code, name, phone and email from the live clients table and greps
index.html for each. Exits non-zero on any hit. Run before every ship — the
whole point of the security strip is that this stays at zero forever.

Whitelist: 'Yusuf'/'Yourjimbff' (the brand, all over legitimate UI copy) and
COACH_SMS (Yusuf's own published contact number, deliberately shown to clients).
"""
import json, re, sys, urllib.request, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / 'index.html').read_text()

sb_url = re.search(r"var SB_URL *= *'([^']+)'", html).group(1)
sb_key = re.search(r"var SB_KEY *= *'([^']+)'", html).group(1)

req = urllib.request.Request(
    sb_url + '/rest/v1/clients?select=code,name,phone,email&limit=2000',
    headers={'apikey': sb_key, 'Authorization': 'Bearer ' + sb_key})
rows = json.load(urllib.request.urlopen(req, timeout=30))
if not rows:
    print('no-roster-check: could not read the clients table — refusing to pass on no data')
    sys.exit(2)

WHITELIST_NAMES = {'Yusuf', 'Yourjimbff'}
coach_sms = re.search(r"var COACH_SMS='(\+\d+)'", html)
WHITELIST_PHONES = {coach_sms.group(1)} if coach_sms else set()

codes  = {r['code'] for r in rows if r.get('code')}
names  = {(r.get('name') or '').strip() for r in rows} - {''} - WHITELIST_NAMES
phones = {(r.get('phone') or '').strip() for r in rows} - {''} - WHITELIST_PHONES
emails = {(r.get('email') or '').strip() for r in rows} - {''}

dirty = False
for label, vals in (('code', codes), ('name', names), ('phone', phones), ('email', emails)):
    found = []
    for v in sorted(vals):
        if label == 'code':
            # a code counts when it appears as a token, not inside a longer word
            if re.search(r"(['\"{,\s(.])" + re.escape(v) + r"(['\"}:,\s)])", html):
                found.append(v)
        elif v in html:
            found.append(v)
    if found:
        dirty = True
    print('%s: %d checked -> %s' % (label, len(vals), found or 'ZERO'))

# phone-shaped strings anywhere, beyond what the table knows
stray = [p for p in re.findall(r"\+\d{9,15}", html) if p not in WHITELIST_PHONES]
if stray:
    dirty = True
    print('stray phone-shaped strings:', stray)

print('RESULT:', 'DIRTY' if dirty else 'CLEAN')
sys.exit(1 if dirty else 0)
