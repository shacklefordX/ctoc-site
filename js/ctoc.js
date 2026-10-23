/* City of Trees Triathlon Club — renders the workout schedule from data/workouts.json
   into any element with id="ctoc-workouts". Safe to load on every page. */
(function () {
  var mount = null;
  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Base URL of this repo on the CDN, derived from where this script was loaded.
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/js\/ctoc\.js.*$/, "") : "";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function safeUrl(u) {
    return /^https?:\/\//i.test(u || "") ? u : "";
  }

  function render(data) {
    var workouts = (data.workouts || []).slice();
    var disciplines = ["All"].concat(
      Array.from(new Set(workouts.map(function (w) { return w.discipline; })))
    );
    var active = "All";

    function draw() {
      var html = "";
      if (data.sample) {
        html += '<p class="ctoc-sample-note"><strong>Sample schedule.</strong> Final days, times and locations are coming soon.</p>';
      }
      html += '<div class="ctoc-filters" role="group" aria-label="Filter workouts">';
      disciplines.forEach(function (d) {
        html += '<button type="button" class="ctoc-filter" data-d="' + esc(d) +
                '" aria-pressed="' + (d === active) + '">' + esc(d) + "</button>";
      });
      html += "</div>";

      var shown = workouts.filter(function (w) { return active === "All" || w.discipline === active; });
      if (!shown.length) {
        html += '<div class="ctoc-empty">No workouts posted yet. Check back soon.</div>';
      }
      DAYS.forEach(function (day) {
        var list = shown.filter(function (w) { return w.day === day; });
        if (!list.length) return;
        html += '<section class="ctoc-day"><h3 class="ctoc-day__name">' + day + '</h3><div class="ctoc-cards">';
        list.forEach(function (w) {
          var link = safeUrl(w.link);
          html += '<article class="ctoc-card" data-discipline="' + esc(w.discipline) + '">' +
            '<span class="ctoc-card__tag">' + esc(w.discipline) + (w.level ? " · " + esc(w.level) : "") + "</span>" +
            '<h4 class="ctoc-card__title">' + esc(w.title) + "</h4>" +
            '<p class="ctoc-card__meta"><strong>' + esc(w.time) + "</strong><br>" + esc(w.location) +
            (w.notes ? "<br>" + esc(w.notes) : "") + "</p>" +
            (link ? '<a class="ctoc-card__link" href="' + esc(link) + '" target="_blank" rel="noopener">Details &rarr;</a>' : "") +
            "</article>";
        });
        html += "</div></section>";
      });
      mount.innerHTML = html;

      Array.prototype.forEach.call(mount.querySelectorAll(".ctoc-filter"), function (b) {
        b.addEventListener("click", function () { active = b.getAttribute("data-d"); draw(); });
      });
    }
    draw();
  }

  function init() {
    mount = document.getElementById("ctoc-workouts");
    if (!mount) return;
    var src = mount.getAttribute("data-src") || base + "data/workouts.json";
    fetch(src)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(render)
      .catch(function () {
        mount.innerHTML = '<div class="ctoc-empty">Workout schedule is unavailable right now. Check our Strava club for the latest.</div>';
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
