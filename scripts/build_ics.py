#!/usr/bin/env python3
"""Build calendar.ics from data/workouts.json (run by the GitHub Action on every schedule change)."""
import json, re, hashlib, datetime as dt, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
TZ = "America/Boise"
SITE = "https://cityoftreestriathlon.org/workouts"

def minutes(s):
    m = re.search(r"(\d+(?:\.\d+)?)\s*(hour|hr|h|minute|min|m)", s or "", re.I)
    if not m: return 60
    v = float(m.group(1)); return round(v * 60) if m.group(2).lower().startswith("h") else round(v)

def start_time(s):
    m = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(AM|PM)", s or "", re.I)
    if not m: return 9, 0
    h = int(m.group(1)) % 12 + (12 if m.group(3).upper() == "PM" else 0)
    return h, int(m.group(2) or 0)

def esc(t): return str(t).replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")
def stamp(d): return d.strftime("%Y%m%dT%H%M%S")

def fold(line):
    out = []
    while len(line.encode()) > 74:
        cut = 74
        while len(line[:cut].encode()) > 74: cut -= 1
        out.append(line[:cut]); line = " " + line[cut:]
    out.append(line); return out

VTZ = """BEGIN:VTIMEZONE
TZID:America/Boise
BEGIN:DAYLIGHT
TZOFFSETFROM:-0700
TZOFFSETTO:-0600
TZNAME:MDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0600
TZOFFSETTO:-0700
TZNAME:MST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE""".split("\n")

def main():
    data = json.loads((ROOT / "data" / "workouts.json").read_text())
    items = data.get("workouts", [])
    dated = [(dt.date.fromisoformat(w["date"]), w["discipline"]) for w in items if w.get("date")]
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//City of Trees Triathlon Club//Schedule//EN", "CALSCALE:GREGORIAN",
             "METHOD:PUBLISH", "X-WR-CALNAME:City of Trees Triathlon Club", "X-WR-TIMEZONE:" + TZ,
             "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H"] + VTZ
    for w in items:
        h, mi = start_time(w.get("time"))
        if w.get("date"):
            first = dt.date.fromisoformat(w["date"]); rrule = None; ex = []
        else:
            if w.get("day") not in NAMES: continue
            idx = NAMES.index(w["day"])
            first = dt.date.fromisoformat(w["from"]) if w.get("from") else dt.date(2026, 1, 1)
            first += dt.timedelta(days=(idx - first.weekday()) % 7)
            rrule = "FREQ=WEEKLY;BYDAY=" + DAYS[idx]
            ex = sorted({d for d, disc in dated if disc == w["discipline"] and d >= first and d.weekday() == idx})
        s = dt.datetime.combine(first, dt.time(h, mi)); e = s + dt.timedelta(minutes=minutes(w.get("duration")))
        key = (w.get("date") or "wk-" + w.get("day", "")) + w.get("title", "")
        uid = hashlib.md5(key.encode()).hexdigest()[:16] + "@cityoftreestriathlon.org"
        desc = (w.get("notes") or "").strip()
        desc = (desc + "\n" if desc else "") + "Details and updates: " + SITE
        ev = ["BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:20260101T000000Z",
              f"DTSTART;TZID={TZ}:{stamp(s)}", f"DTEND;TZID={TZ}:{stamp(e)}"]
        if rrule: ev.append("RRULE:" + rrule)
        for d in ex: ev.append(f"EXDATE;TZID={TZ}:{stamp(dt.datetime.combine(d, dt.time(h, mi)))}")
        ev.append("SUMMARY:" + esc(w.get("title", "Group session")))
        if w.get("location"): ev.append("LOCATION:" + esc(w["location"] + (", Idaho" if w.get("map") is not False else "")))
        ev += ["DESCRIPTION:" + esc(desc), "CATEGORIES:" + esc(w.get("discipline", "")), "END:VEVENT"]
        lines += ev
    lines.append("END:VCALENDAR")
    out = []
    for l in lines: out += fold(l)
    (ROOT / "calendar.ics").write_bytes(("\r\n".join(out) + "\r\n").encode())

if __name__ == "__main__":
    main()
