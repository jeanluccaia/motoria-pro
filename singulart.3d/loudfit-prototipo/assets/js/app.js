(function () {
  var root = document.documentElement;
  var nav = document.querySelector("[data-nav]");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 18);
  }

  function unitImagePath(path) {
    var depth = document.body.dataset.depth || "root";
    if (depth === "root") return path.replace("../", "./");
    return path;
  }

  function getUnitStats(units) {
    var operating = units.filter(function (unit) { return unit.status === "em_operacao"; }).length;
    var opening = units.filter(function (unit) { return unit.status === "em_inauguracao"; }).length;
    return {
      total: operating + opening,
      operating: operating,
      opening: opening
    };
  }

  function sortUnits(units) {
    return units.slice().sort(function (a, b) {
      if (a.status === b.status) return 0;
      return a.status === "em_inauguracao" ? 1 : -1;
    });
  }

  function renderNetworkStats() {
    var stats = getUnitStats(window.LOUDFIT_UNITS || []);
    document.querySelectorAll("[data-network-total]").forEach(function (item) {
      item.textContent = stats.total;
    });
    document.querySelectorAll("[data-network-operating]").forEach(function (item) {
      item.textContent = stats.operating;
    });
    document.querySelectorAll("[data-network-opening]").forEach(function (item) {
      item.textContent = stats.opening;
    });
  }

  function renderUnits() {
    var units = sortUnits(window.LOUDFIT_UNITS || []);
    document.querySelectorAll("[data-units-grid]").forEach(function (grid) {
      var limit = Number(grid.dataset.limit || units.length);
      grid.innerHTML = units.slice(0, limit).map(function (unit) {
        var isOpening = unit.status === "em_inauguracao";
        var target = document.body.dataset.depth === "root" ? "./unidades/" : "../unidades/";
        var actions = isOpening
          ? '<span class="icon-link icon-link--quiet">Em breve</span>'
          : [
              '<a class="icon-link" href="' + unit.whatsapp + '" aria-label="WhatsApp da unidade ' + unit.name + '">WhatsApp</a>',
              '<a class="icon-link" href="' + unit.instagram + '" aria-label="Instagram da unidade ' + unit.name + '">Instagram</a>',
              '<a class="icon-link" href="' + target + '">Ver unidade</a>'
            ].join("");

        return [
          '<article class="unit-card ' + (isOpening ? 'unit-card--opening ' : '') + 'reveal">',
          '  <a class="unit-card__media" href="' + target + '">',
          '    <img src="' + unitImagePath(unit.image) + '" alt="Unidade LoudFit ' + unit.name + '" loading="lazy">',
          (isOpening ? '    <span class="status-badge"><span class="pulse-dot"></span>' + (unit.badge || unit.statusLabel) + '</span>' : ''),
          '  </a>',
          '  <div class="unit-card__body">',
          '    <span class="unit-status ' + (isOpening ? 'unit-status--opening' : '') + '">' + unit.statusLabel + '</span>',
          '    <h3>' + unit.name + '</h3>',
          '    <p>' + unit.district + ' · ' + unit.city + '</p>',
          '    <div class="unit-card__actions">',
          actions,
          '    </div>',
          '  </div>',
          '</article>'
        ].join("");
      }).join("");
    });
  }

  function setupCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function animate(counter) {
      var target = Number(counter.dataset.count || counter.textContent || 0);
      if (target < 10 || reduced) {
        counter.textContent = target;
        return;
      }
      var start = null;
      function frame(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / 1100, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.target.dataset.done) return;
        entry.target.dataset.done = "true";
        animate(entry.target);
      });
    }, { threshold: 0.45 });

    counters.forEach(function (counter) { observer.observe(counter); });
  }

  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.12 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function setupFaq() {
    document.querySelectorAll("[data-faq]").forEach(function (button) {
      button.addEventListener("click", function () {
        var item = button.closest(".faq-item");
        item.classList.toggle("is-open");
      });
    });
  }

  function setupForm() {
    var form = document.querySelector("[data-franchise-form]");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var success = document.querySelector("[data-form-success]");
      form.classList.add("is-submitted");
      if (success) success.hidden = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
  }

  renderUnits();
  renderNetworkStats();
  setupCounters();
  setupReveal();
  setupFaq();
  setupForm();
  root.classList.add("is-ready");
})();
