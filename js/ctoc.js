/* City of Trees Triathlon Club
   - #ctoc-workouts : full schedule with discipline filters
   - #ctoc-next     : "Next up" strip (the next 2 upcoming sessions)
   Data comes from data/workouts.json. A session is either dated ("date": "YYYY-MM-DD",
   shown until that day ends) or recurring ("day": "Tuesday"). Safe to load on every page. */
(function () {
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/js\/ctoc\.js.*$/, "") : "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || "") ? u : ""; }

  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }

  // Next calendar date (today or later) for a recurring weekday
  function nextOccurrence(dayName) {
    var idx = DAYS.indexOf(dayName);
    if (idx < 0) return null;
    var t = today();
    t.setDate(t.getDate() + ((idx - t.getDay() + 7) % 7));
    return t;
  }

  // Attach a concrete date to each session and drop dated sessions that have passed.
  function prepare(list) {
    var t = today();
    return (list || []).map(function (w) {
      var d = parseDate(w.date) || nextOccurrence(w.day);
      return Object.assign({}, w, { _d: d, _recurring: !w.date });
    }).filter(function (w) {
      return w._d && w._d >= t;
    }).sort(function (a, b) { return a._d - b._d; });
  }

  function dateLabel(w) {
    var s = DAYS[w._d.getDay()] + ", " + MONTHS[w._d.getMonth()] + " " + w._d.getDate();
    return w._recurring ? "Every " + DAYS[w._d.getDay()] : s;
  }

  function card(w) {
    var link = safeUrl(w.link);
    var when = esc(w.time) + (w.duration ? " &middot; " + esc(w.duration) : "");
    return '<article class="ctoc-card" data-discipline="' + esc(w.discipline) + '">' +
      '<span class="ctoc-card__tag">' + esc(w.discipline) + (w.level ? " · " + esc(w.level) : "") + "</span>" +
      '<h4 class="ctoc-card__title">' + esc(w.title) + "</h4>" +
      '<p class="ctoc-card__meta"><strong>' + esc(dateLabel(w)) + "</strong><br>" + when +
      "<br>" + esc(w.location) + (w.notes ? "<br>" + esc(w.notes) : "") + "</p>" +
      (link ? '<a class="ctoc-card__link" href="' + esc(link) + '" target="_blank" rel="noopener">Details &rarr;</a>' : "") +
      "</article>";
  }

  function renderSchedule(mount, data) {
    var items = prepare(data.workouts);
    var disciplines = ["All"].concat(Array.from(new Set(items.map(function (w) { return w.discipline; }))));
    var active = "All";

    function draw() {
      var html = "";
      if (data.sample) {
        html += '<p class="ctoc-sample-note"><strong>Sample schedule.</strong> Final days, times and locations are coming soon.</p>';
      }
      if (disciplines.length > 2) {
        html += '<div class="ctoc-filters" role="group" aria-label="Filter workouts">';
        disciplines.forEach(function (d) {
          html += '<button type="button" class="ctoc-filter" data-d="' + esc(d) + '" aria-pressed="' + (d === active) + '">' + esc(d) + "</button>";
        });
        html += "</div>";
      }
      var shown = items.filter(function (w) { return active === "All" || w.discipline === active; });
      if (!shown.length) {
        html += '<div class="ctoc-empty">No upcoming sessions posted yet. Follow our Strava club for the latest.</div>';
      } else {
        html += '<div class="ctoc-cards">' + shown.map(card).join("") + "</div>";
      }
      mount.innerHTML = html;
      Array.prototype.forEach.call(mount.querySelectorAll(".ctoc-filter"), function (b) {
        b.addEventListener("click", function () { active = b.getAttribute("data-d"); draw(); });
      });
    }
    draw();
  }

  function renderNext(mount, data) {
    var items = prepare(data.workouts).slice(0, 2);
    if (!items.length) { mount.style.display = "none"; return; }
    mount.innerHTML =
      '<div class="ctoc-next__head"><h3>Next up</h3><a href="/workouts">All sessions &rarr;</a></div>' +
      '<div class="ctoc-cards">' + items.map(card).join("") + "</div>";
  }

  function init() {
    var sched = document.getElementById("ctoc-workouts");
    var next = document.getElementById("ctoc-next");
    if (!sched && !next) return;
    var src = (sched || next).getAttribute("data-src") || base + "data/workouts.json";
    fetch(src)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        if (sched) renderSchedule(sched, data);
        if (next) renderNext(next, data);
      })
      .catch(function () {
        var m = sched || next;
        m.innerHTML = '<div class="ctoc-empty">The schedule is unavailable right now. Check our Strava club for the latest.</div>';
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
