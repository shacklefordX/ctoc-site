/* City of Trees Triathlon Club
   Squarespace only needs these mount points (added once, never edited again):
   - <div id="ctoc-home"></div>      : the whole home page
   - <div id="ctoc-workouts"></div>  : the schedule page
   A footer is added automatically to every page.
   All copy lives in data/content.json; sessions live in data/workouts.json. */
(function () {
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/js\/ctoc\.js.*$/, "") : "";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) { return /^(https?:\/\/|\/|mailto:)/i.test(u || "") ? u : ""; }
  function asset(p) { return /^https?:\/\//i.test(p || "") ? p : base + String(p || "").replace(/^\//, ""); }
  function ext(u) { return /^https?:\/\//i.test(u || ""); }
  function btn(b, cls) {
    if (!b || !b.label) return "";
    return '<a class="ctoc-btn' + (cls ? " " + cls : "") + '" href="' + esc(safeUrl(b.href)) + '"' +
      (ext(b.href) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(b.label) + "</a>";
  }
  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  var ICONS = {
    swim: '<svg viewBox="0 0 24 24"><path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>',
    bike: '<svg viewBox="0 0 24 24"><circle cx="6" cy="17" r="3.6"/><circle cx="18" cy="17" r="3.6"/><path d="M6 17l4-8h5l3 8M10 9l2 8 3-8M9 6h3"/></svg>',
    run: '<svg viewBox="0 0 24 24"><circle cx="15" cy="4.5" r="2"/><path d="M13 8.5l-3 4.5 3 3-2 5M13 8.5l4 2.5 3-1M10 13l-4-1"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3.2 3.2 0 010 5.6M18 14.8c1.8.7 3 2.4 3 5.2"/></svg>',
    pulse: '<svg viewBox="0 0 24 24"><path d="M3 12h4l2.5-6 4 12 2.5-6H21"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  /* Keep our blocks inside Squarespace's main content area, whatever the person pasted them into. */
  function place(el) {
    var main = document.querySelector("main#page, main");
    if (el && main && !main.contains(el)) main.insertBefore(el, main.firstChild);
  }

  function reveal(root) {
    var els = root.querySelectorAll(".ctoc-reveal");
    if (!("IntersectionObserver" in window)) { Array.prototype.forEach.call(els, function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  /* ---------- sessions ---------- */
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function nextOccurrence(dayName) {
    var idx = DAYS.indexOf(dayName);
    if (idx < 0) return null;
    var t = today();
    t.setDate(t.getDate() + ((idx - t.getDay() + 7) % 7));
    return t;
  }
  function prepare(list) {
    var t = today();
    return (list || []).map(function (w) {
      var d = parseDate(w.date) || nextOccurrence(w.day);
      return Object.assign({}, w, { _d: d, _recurring: !w.date });
    }).filter(function (w) { return w._d && w._d >= t; })
      .sort(function (a, b) { return a._d - b._d; });
  }
  function minutesOf(str) {
    var m = /(\d+(?:\.\d+)?)\s*(hour|hr|h|minute|min|m)/i.exec(str || "");
    if (!m) return 60;
    return /^h/i.test(m[2]) ? Math.round(parseFloat(m[1]) * 60) : Math.round(parseFloat(m[1]));
  }
  function startOf(w) {
    var m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i.exec(w.time || "");
    var h = m ? +m[1] % 12 + (/pm/i.test(m[3]) ? 12 : 0) : 9, mi = m && m[2] ? +m[2] : 0;
    return new Date(w._d.getFullYear(), w._d.getMonth(), w._d.getDate(), h, mi);
  }
  function endOf(w) { return new Date(startOf(w).getTime() + minutesOf(w.duration) * 60000); }
  function nextSession(items) {
    var now = new Date();
    for (var i = 0; i < items.length; i++) if (endOf(items[i]) > now) return items[i];
    return null;
  }
  function countdownText(w) {
    var now = new Date(), st = startOf(w), ms = st - now;
    if (ms <= 0) return endOf(w) > now ? "Happening now" : "Finished";
    var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), sec = Math.floor(ms % 6e4 / 1000);
    return (d ? d + "d " : "") + h + "h " + m + "m " + (d ? "" : sec + "s");
  }
  function dayFlag(w) {
    var diff = Math.round((w._d - today()) / 864e5);
    return diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : "";
  }
  function icsStamp(d) {
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "T" + p(d.getHours()) + p(d.getMinutes()) + "00";
  }
  function icsLink(w) {
    var s = startOf(w), e = new Date(s.getTime() + minutesOf(w.duration) * 60000);
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//City of Trees Triathlon Club//EN", "BEGIN:VEVENT",
      "UID:" + icsStamp(s) + "-" + String(w.title).replace(/\W+/g, "") + "@cityoftreestriathlon.org",
      "DTSTAMP:" + icsStamp(new Date()), "DTSTART:" + icsStamp(s), "DTEND:" + icsStamp(e),
      "SUMMARY:" + w.title + " (City of Trees Tri Club)", "LOCATION:" + (w.location || ""),
      "DESCRIPTION:" + (w.notes || "") , "END:VEVENT", "END:VCALENDAR"];
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
  }
  function mapLink(w) {
    if (w.map === false || !w.location || /tbd/i.test(w.location)) return "";
    if (w.map) return w.map;
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(w.location + ", Idaho");
  }

  function card(w) {
    var link = safeUrl(w.link), map = mapLink(w);
    var when = esc(w.time) + (w.duration ? " &middot; " + esc(w.duration) : "");
    var dateBox = w._recurring
      ? '<div class="ctoc-card__date"><span class="ctoc-card__wk">Every</span><span class="ctoc-card__mon">' + DAYS[w._d.getDay()].slice(0, 3) + "</span></div>"
      : '<div class="ctoc-card__date"><span class="ctoc-card__mon">' + MONTHS[w._d.getMonth()] + '</span><span class="ctoc-card__day">' + w._d.getDate() + "</span></div>";
    var dayLine = DAYS[w._d.getDay()] + (w._recurring ? "s" : "");
    var flag = dayFlag(w);
    return '<article class="ctoc-card" data-discipline="' + esc(w.discipline) + '">' + dateBox +
      '<div class="ctoc-card__body">' + (flag ? '<span class="ctoc-card__flag">' + flag + "</span>" : "") + '<span class="ctoc-card__tag">' + esc(w.discipline) + (w.level ? " · " + esc(w.level) : "") + "</span>" +
      '<h4 class="ctoc-card__title">' + esc(w.title) + "</h4>" +
      '<p class="ctoc-card__meta"><strong>' + esc(dayLine) + "</strong> &middot; " + when + "<br>" + esc(w.location) +
      (w.notes ? "<br>" + esc(w.notes) : "") + "</p>" +
      '<div class="ctoc-card__links">' +
      (map ? '<a href="' + esc(map) + '" target="_blank" rel="noopener">Directions</a>' : "") +
      '<a href="' + esc(icsLink(w)) + '" download="session.ics">Add to calendar</a>' +
      (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener">Details</a>' : "") +
      "</div></div></article>";
  }

  function renderSchedule(mount, data, c) {
    var page = (c && c.workoutsPage) || {};
    var items = prepare(data.workouts);
    var disciplines = ["All"].concat(Array.from(new Set(items.map(function (w) { return w.discipline; }))));
    var active = "All";
    function draw() {
      var html = '<div class="ctoc-page"><div class="ctoc-wrap">';
      html += '<div class="ctoc-sechead"><span class="ctoc-eyebrow">' + esc(page.eyebrow || "Schedule") + '</span><h1 class="ctoc-title">' +
        esc(page.title || "Group workouts") + "</h1>" + (page.intro ? '<p class="ctoc-lede">' + esc(page.intro) + "</p>" : "") + "</div>";
      if (data.sample) html += '<p class="ctoc-sample-note"><strong>Sample schedule.</strong> Final days, times and locations are coming soon.</p>';
      if (disciplines.length > 2) {
        html += '<div class="ctoc-filters" role="group" aria-label="Filter workouts">' + disciplines.map(function (d) {
          return '<button type="button" class="ctoc-filter" data-d="' + esc(d) + '" aria-pressed="' + (d === active) + '">' + esc(d) + "</button>";
        }).join("") + "</div>";
      }
      var shown = items.filter(function (w) { return active === "All" || w.discipline === active; });
      html += shown.length ? '<div class="ctoc-cards">' + shown.map(card).join("") + "</div>"
        : '<div class="ctoc-empty">No upcoming sessions posted yet. Follow our Strava club for the latest.</div>';
      if ((page.notes || []).length) {
        html += '<div class="ctoc-notes"><h3>' + esc(page.notesTitle || "Good to know") + "</h3><ul>" +
          page.notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></div>";
      }
      html += "</div></div>";
      mount.innerHTML = html;
      Array.prototype.forEach.call(mount.querySelectorAll(".ctoc-filter"), function (b) {
        b.addEventListener("click", function () { active = b.getAttribute("data-d"); draw(); });
      });
    }
    draw();
  }

  function renderNext(mount, data) {
    var items = prepare(data.workouts), nx = nextSession(items);
    var shown = items.slice(0, 2);
    if (!shown.length) { mount.style.display = "none"; return; }
    mount.innerHTML = '<div class="ctoc-next__head"><div><span class="ctoc-eyebrow">Coming up</span><h2 class="ctoc-title">Next up</h2></div>' +
      (nx ? '<div class="ctoc-countdown" data-i="' + items.indexOf(nx) + '"><span class="ctoc-countdown__label">' + esc(nx.title) + ' in</span><span class="ctoc-countdown__time">' + countdownText(nx) + "</span></div>" : "") +
      '<a href="/workouts">All sessions &rarr;</a></div><div class="ctoc-cards">' + shown.map(card).join("") + "</div>";
    if (nx) {
      var el = mount.querySelector(".ctoc-countdown__time");
      if (window.__ctocTimer) clearInterval(window.__ctocTimer);
      window.__ctocTimer = setInterval(function () { if (el) el.textContent = countdownText(nx); }, 1000);
    }
  }

  /* ---------- home ---------- */
  function dateNice(str) {
    var d = parseDate(str);
    return d ? MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() : "";
  }

  function heroInit(root) {
    var slides = root.querySelectorAll(".ctoc-slide"), bgs = root.querySelectorAll(".ctoc-hero__bgimg"), dots = root.querySelectorAll(".ctoc-dot");
    if (slides.length < 2) return;
    var i = 0, timer = null;
    function go(n) {
      i = (n + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (el, k) { el.classList.toggle("is-active", k === i); });
      Array.prototype.forEach.call(bgs, function (el, k) { el.classList.toggle("is-active", k === i); });
      Array.prototype.forEach.call(dots, function (el, k) { el.setAttribute("aria-current", k === i ? "true" : "false"); });
    }
    function start() {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      stop(); timer = setInterval(function () { go(i + 1); }, 5200);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    Array.prototype.forEach.call(dots, function (d, k) { d.addEventListener("click", function () { go(k); start(); }); });
    var stack = root.querySelector(".ctoc-hero__stack");
    stack.addEventListener("mouseenter", stop); stack.addEventListener("mouseleave", start);
    go(0); start();
  }

  function renderHome(mount, c) {
    var h = c.hero || {}, html = "";
    var slides = (h.slides && h.slides.length ? h.slides : (h.photo ? [h.photo] : []));

    var chips = (h.chips || []).map(function (k) {
      return '<span class="ctoc-chip">' + (ICONS[k.toLowerCase()] || "") + esc(k) + "</span>";
    }).join("");
    var headline = (h.headline || []).map(function (l, i, a) { return i === a.length - 1 ? "<span>" + esc(l) + "</span>" : esc(l); }).join("<br>");

    html += '<section class="ctoc-hero"><div class="ctoc-hero__bg" aria-hidden="true">' + slides.map(function (p, i) {
      return '<div class="ctoc-hero__bgimg' + (i === 0 ? " is-active" : "") + '" style="background-image:url(\'' + esc(asset(p.src)) + '\')"></div>';
    }).join("") + '</div><div class="ctoc-wrap"><div class="ctoc-hero__grid"><div class="ctoc-hero__copy">' +
      (h.eyebrow ? '<span class="ctoc-eyebrow">' + esc(h.eyebrow) + "</span>" : "") +
      "<h1>" + headline + "</h1><p class=\"ctoc-hero__text\">" + esc(h.text) + "</p>" +
      '<div class="ctoc-hero__actions">' + btn(h.primary) + btn(h.secondary, "ctoc-btn--outline") + "</div>" +
      (chips ? '<div class="ctoc-hero__chips">' + chips + "</div>" : "") + "</div>" +
      (slides.length ? '<div class="ctoc-hero__stack"><div class="ctoc-hero__frame">' + slides.map(function (p, i) {
        return '<figure class="ctoc-slide' + (i === 0 ? " is-active" : "") + '"><img alt="' + esc(p.alt) + '" src="' + esc(asset(p.src)) + '">' +
          (p.caption ? "<figcaption>" + esc(p.caption) + "</figcaption>" : "") + "</figure>";
      }).join("") + "</div>" + (slides.length > 1 ? '<div class="ctoc-dots">' + slides.map(function (p, i) {
        return '<button type="button" class="ctoc-dot" aria-label="Show photo ' + (i + 1) + '" aria-current="' + (i === 0) + '"></button>';
      }).join("") + "</div>" : "") + "</div>" : "") +
      "</div></div></section>";

    var words = (c.marquee && c.marquee.length ? c.marquee : ["Swim", "Bike", "Run"]);
    var strip = words.map(function (w) { return "<span>" + esc(w) + '</span><i aria-hidden="true"></i>'; }).join("");
    html += '<div class="ctoc-marquee" aria-hidden="true"><div class="ctoc-marquee__track">' + strip + strip + strip + strip + "</div></div>";

    if ((c.tiles || []).length) {
      html += '<section class="ctoc-sec ctoc-sec--tiles"><div class="ctoc-wrap"><div class="ctoc-tiles">' + c.tiles.map(function (t) {
        return '<a class="ctoc-tile ctoc-reveal" href="' + esc(safeUrl(t.href)) + '"' + (ext(t.href) ? ' target="_blank" rel="noopener"' : "") + ">" +
          '<span class="ctoc-ico">' + (ICONS[t.icon] || "") + "</span><h3>" + esc(t.title) + "</h3><p>" + esc(t.text) + "</p>" +
          '<span class="ctoc-tile__go">' + esc(t.cta || "Details") + " " + ICONS.arrow + "</span></a>";
      }).join("") + "</div></div></section>";
    }

    html += '<section class="ctoc-sec"><div class="ctoc-wrap ctoc-reveal"><div id="ctoc-next"></div></div></section>';

    var cta = c.cta;
    if (cta) {
      html += '<section class="ctoc-sec ctoc-cta">' + (cta.image ? '<div class="ctoc-cta__bg" style="background-image:url(\'' + esc(asset(cta.image)) + '\')"></div>' : "") +
        '<div class="ctoc-wrap ctoc-reveal"><h2>' + esc(cta.headline) + "</h2><p>" + esc(cta.text) + "</p>" + btn(cta.button) + "</div></section>";
    }

    var d = c.disciplines;
    if (d && (d.items || []).length) {
      html += '<section class="ctoc-sec"><div class="ctoc-wrap ctoc-reveal"><div class="ctoc-sechead"><span class="ctoc-eyebrow">' + esc(d.eyebrow || "What we do") +
        '</span><h2 class="ctoc-title">' + esc(d.title) + '</h2>' + (d.text ? '<p class="ctoc-lede">' + esc(d.text) + "</p>" : "") + '</div><div class="ctoc-trio">' +
        d.items.map(function (i) {
          var k = (i.icon || i.title || "").toLowerCase();
          return '<div class="ctoc-trio__item" data-k="' + esc(k) + '"><div class="ctoc-ico">' + (ICONS[k] || "") + "</div><h3>" + esc(i.title) + "</h3><p>" + esc(i.text) + "</p></div>";
        }).join("") + "</div></div></section>";
    }

    var a = c.about;
    if (a && (a.paragraphs || []).length) {
      var vid = a.video ? '<div class="ctoc-video"><iframe loading="lazy" title="Club video" src="https://www.youtube-nocookie.com/embed/' + esc(a.video) + '" allowfullscreen></iframe></div>' : "";
      html += '<section class="ctoc-sec ctoc-sec--tint"><div class="ctoc-wrap ctoc-reveal"><div class="ctoc-about">' +
        (a.photo ? '<div class="ctoc-about__photo"><img loading="lazy" alt="' + esc(a.photo.alt) + '" src="' + esc(asset(a.photo.src)) + '"></div>' : "") +
        '<div class="ctoc-about__body"><span class="ctoc-eyebrow">' + esc(a.eyebrow || "About") + '</span><h2 class="ctoc-title">' + esc(a.title) + "</h2>" +
        a.paragraphs.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
        (a.byline ? '<p class="ctoc-about__by">' + esc(a.byline) + "</p>" : "") + "</div></div>" + vid + "</div></section>";
    }

    if ((c.news || []).length) {
      html += '<section class="ctoc-sec"><div class="ctoc-wrap ctoc-reveal"><div class="ctoc-sechead"><span class="ctoc-eyebrow">Club news</span><h2 class="ctoc-title">Latest updates</h2></div><div class="ctoc-news">' +
        c.news.map(function (n) {
          return '<article class="ctoc-newscard"><span class="ctoc-newscard__date">' + esc(dateNice(n.date) || n.date) + "</span><h3>" + esc(n.title) + "</h3><p>" + esc(n.text) + "</p>" +
            (safeUrl(n.link) ? '<a href="' + esc(n.link) + '"' + (ext(n.link) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(n.linkLabel || "More") + " &rarr;</a>" : "") + "</article>";
        }).join("") + "</div></div></section>";
    }

    if ((c.members || []).length) {
      html += '<section class="ctoc-sec ctoc-sec--tint"><div class="ctoc-wrap ctoc-reveal"><div class="ctoc-sechead"><span class="ctoc-eyebrow">Meet the crew</span><h2 class="ctoc-title">Member spotlight</h2></div><div class="ctoc-members">' +
        c.members.map(function (m) {
          return '<div class="ctoc-member">' + (m.photo ? '<img loading="lazy" alt="' + esc(m.name) + '" src="' + esc(asset(m.photo)) + '">' : '<div class="ctoc-member__ph">' + esc((m.name || "?").charAt(0)) + "</div>") +
            "<h3>" + esc(m.name) + "</h3><p>" + esc(m.blurb) + "</p></div>";
        }).join("") + "</div></div></section>";
    }

    if ((c.steps || []).length) {
      html += '<section class="ctoc-sec ctoc-sec--tint"><div class="ctoc-wrap ctoc-reveal"><div class="ctoc-sechead"><span class="ctoc-eyebrow">Getting started</span><h2 class="ctoc-title">' +
        esc(c.stepsTitle || "How it works") + '</h2></div><div class="ctoc-steps">' + c.steps.map(function (s) {
          return '<div class="ctoc-step"><h3>' + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></div>";
        }).join("") + "</div></div></section>";
    }

    if ((c.races || []).length) {
      html += '<section class="ctoc-sec"><div class="ctoc-wrap ctoc-reveal"><div class="ctoc-sechead"><span class="ctoc-eyebrow">On the calendar</span><h2 class="ctoc-title">Races we\'re eyeing</h2></div><div class="ctoc-races">' +
        c.races.map(function (r) {
          return '<div class="ctoc-race"><span class="ctoc-race__when">' + esc(r.when) + '</span><div><div class="ctoc-race__name">' + esc(r.name) + '</div><div class="ctoc-race__meta">' + esc(r.meta) + "</div></div>" +
            (safeUrl(r.link) ? '<a href="' + esc(r.link) + '" target="_blank" rel="noopener">Race info &rarr;</a>' : "") + "</div>";
        }).join("") + "</div></div></section>";
    }

    if ((c.sponsors || []).length) {
      html += '<section class="ctoc-sec ctoc-sec--tint"><div class="ctoc-wrap ctoc-reveal"><div class="ctoc-sechead"><span class="ctoc-eyebrow">Thank you</span><h2 class="ctoc-title">Our partners</h2></div><div class="ctoc-sponsors">' +
        c.sponsors.map(function (sp) {
          var im = '<img loading="lazy" alt="' + esc(sp.name) + '" src="' + esc(asset(sp.logo)) + '">';
          return safeUrl(sp.href) ? '<a href="' + esc(sp.href) + '" target="_blank" rel="noopener">' + im + "</a>" : "<div>" + im + "</div>";
        }).join("") + "</div></div></section>";
    }

    if ((c.faq || []).length) {
      html += '<section class="ctoc-sec" id="ctoc-faq"><div class="ctoc-wrap ctoc-reveal"><div class="ctoc-sechead"><span class="ctoc-eyebrow">New to triathlon?</span><h2 class="ctoc-title">Questions</h2></div><div class="ctoc-faq">' +
        c.faq.map(function (f) { return "<details><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>"; }).join("") + "</div></div></section>";
    }
    mount.innerHTML = html;
    heroInit(mount);
  }

  /* ---------- footer ---------- */
  function renderFooter(c) {
    var f = c.footer;
    if (!f || f.enabled === false || document.getElementById("ctoc-site-footer")) return;
    var el = document.createElement("div");
    el.id = "ctoc-site-footer";
    el.className = "ctoc-footer";
    function links(list) {
      return (list || []).map(function (l) {
        return '<li><a href="' + esc(safeUrl(l.href)) + '"' + (ext(l.href) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(l.label) + "</a></li>";
      }).join("");
    }
    el.innerHTML = '<div class="ctoc-wrap"><div class="ctoc-footer__grid"><div class="ctoc-footer__brand">' +
      (f.logo ? '<img alt="City of Trees Triathlon Club" src="' + esc(asset(f.logo)) + '">' : "") +
      (f.tagline ? "<p>" + esc(f.tagline) + "</p>" : "") + btn(f.button) + "</div>" +
      '<div><h3>Explore</h3><ul>' + links(f.nav) + "</ul></div>" +
      '<div><h3>Follow</h3><ul>' + links(f.social) + "</ul></div></div>" +
      (f.copyright ? "<small>" + esc(f.copyright) + "</small>" : "") + "</div>";
    var slot = document.getElementById("ctoc-footer");
    if (slot) { slot.appendChild(el); return; }
    var host = document.querySelector("footer");
    if (host && host.parentNode) host.parentNode.insertBefore(el, host);
    else document.body.appendChild(el);
  }

  /* ---------- boot ---------- */
  function init() {
    var home = document.getElementById("ctoc-home");
    var sched = document.getElementById("ctoc-workouts");
    place(home); place(sched);

    var content = getJSON(base + "data/content.json").catch(function () { return null; });
    var work = (home || sched)
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
        if (data) renderSchedule(sched, data, c);
        else sched.innerHTML = '<div class="ctoc-empty">The schedule is unavailable right now. Check our Strava club for the latest.</div>';
      }
      if (c) renderFooter(c);
      reveal(document);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
