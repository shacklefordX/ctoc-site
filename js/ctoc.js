/* City of Trees Triathlon Club
   Squarespace only needs these mount points (added once, never edited again):
   - <div id="ctoc-home"></div>      : whole home page (hero, next up, steps, photos, FAQ)
   - <div id="ctoc-workouts"></div>  : full schedule with discipline filters
   - <div id="ctoc-next"></div>      : optional stand-alone "next up" strip
   A footer band is added automatically to every page (data/content.json -> footer.enabled).
   All copy lives in data/content.json; sessions live in data/workouts.json. A session is either dated ("date": "YYYY-MM-DD",
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

  function asset(p) { return /^https?:\/\//i.test(p || "") ? p : base + String(p || "").replace(/^\//, ""); }
  function btn(b, cls) {
    if (!b || !b.label) return "";
    var ext = /^https?:\/\//i.test(b.href || "");
    return '<a class="ctoc-btn' + (cls ? " " + cls : "") + '" href="' + esc(b.href) + '"' +
      (ext ? ' target="_blank" rel="noopener"' : "") + ">" + esc(b.label) + "</a>";
  }

  function renderHome(mount, c) {
    var h = c.hero || {}, html = "";
    html += '<div class="ctoc-hero"><div>' +
      (h.logo ? '<img class="ctoc-hero__mark" alt="" src="' + esc(asset(h.logo)) + '">' : "") +
      "<h1>" + (h.headline || []).map(esc).join("<br>") + "</h1>" +
      "<p>" + esc(h.text) + "</p>" +
      '<div class="ctoc-hero__actions">' + btn(h.primary) + btn(h.secondary, "ctoc-btn--outline") + "</div></div>" +
      (h.photo ? '<div class="ctoc-hero__photo"><img alt="' + esc(h.photo.alt) + '" src="' + esc(asset(h.photo.src)) + '"></div>' : "") +
      "</div>";
    html += '<div id="ctoc-next"></div>';
    if ((c.steps || []).length) {
      html += '<div class="ctoc-steps">' + c.steps.map(function (s) {
        return '<div class="ctoc-step"><h3>' + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></div>";
      }).join("") + "</div>";
    }
    if ((c.photos || []).length) {
      html += '<div class="ctoc-photos">' + c.photos.map(function (p) {
        return '<figure><img loading="lazy" alt="' + esc(p.alt) + '" src="' + esc(asset(p.src)) + '">' +
          (p.caption ? "<figcaption>" + esc(p.caption) + "</figcaption>" : "") + "</figure>";
      }).join("") + "</div>";
    }
    if ((c.faq || []).length) {
      html += '<div class="ctoc-faq"><h2>Questions</h2>' + c.faq.map(function (f) {
        return "<details><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
      }).join("") + "</div>";
    }
    mount.innerHTML = html;
  }

  function renderFooter(c) {
    var f = c.footer;
    if (!f || f.enabled === false || document.getElementById("ctoc-site-footer")) return;
    var el = document.createElement("div");
    el.id = "ctoc-site-footer";
    el.className = "ctoc-footer";
    el.innerHTML = (f.logo ? '<img alt="City of Trees Triathlon Club" src="' + esc(asset(f.logo)) + '">' : "") +
      (f.tagline ? "<p>" + esc(f.tagline) + "</p>" : "") + btn(f.button) +
      (f.copyright ? "<small>" + esc(f.copyright) + "</small>" : "");
    var slot = document.getElementById("ctoc-footer");
    if (slot) { slot.appendChild(el); return; }
    var host = document.querySelector("footer");
    if (host && host.parentNode) host.parentNode.insertBefore(el, host);
    else document.body.appendChild(el);
  }

  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  function init() {
    var home = document.getElementById("ctoc-home");
    var sched = document.getElementById("ctoc-workouts");
    var wantsFooter = true;

    var content = getJSON(base + "data/content.json").catch(function () { return null; });
    var work = (home || sched || document.getElementById("ctoc-next"))
      ? getJSON((sched && sched.getAttribute("data-src")) || base + "data/workouts.json").catch(function () { return null; })
      : Promise.resolve(null);

    Promise.all([content, work]).then(function (res) {
      var c = res[0], data = res[1];
      if (home) {
        if (c) renderHome(home, c);
        else home.innerHTML = '<div class="ctoc-empty">This page is unavailable right now.</div>';
      }
      var next = document.getElementById("ctoc-next");
      if (next && data) renderNext(next, data);
      if (sched) {
        if (data) renderSchedule(sched, data);
        else sched.innerHTML = '<div class="ctoc-empty">The schedule is unavailable right now. Check our Strava club for the latest.</div>';
      }
      if (c && wantsFooter) renderFooter(c);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
