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

  function renderUnits() {
    var units = window.LOUDFIT_UNITS || [];
    document.querySelectorAll("[data-units-grid]").forEach(function (grid) {
      var limit = Number(grid.dataset.limit || units.length);
      grid.innerHTML = units.slice(0, limit).map(function (unit) {
        return [
          '<article class="unit-card reveal">',
          '  <a class="unit-card__media" href="' + (document.body.dataset.depth === "root" ? "./unidades/" : "../unidades/") + '">',
          '    <img src="' + unitImagePath(unit.image) + '" alt="Unidade LoudFit ' + unit.name + '" loading="lazy">',
          '  </a>',
          '  <div class="unit-card__body">',
          '    <span class="eyebrow">Unidade</span>',
          '    <h3>' + unit.name + '</h3>',
          '    <p>' + unit.district + ' · ' + unit.city + '</p>',
          '    <div class="unit-card__actions">',
          '      <a class="icon-link" href="' + unit.whatsapp + '" aria-label="WhatsApp da unidade ' + unit.name + '">WhatsApp</a>',
          '      <a class="icon-link" href="' + unit.instagram + '" aria-label="Instagram da unidade ' + unit.name + '">Instagram</a>',
          '      <a class="icon-link" href="' + (document.body.dataset.depth === "root" ? "./unidades/" : "../unidades/") + '">Ver unidade</a>',
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
      var target = Number(counter.dataset.count || 0);
      if (target < 10) {
        counter.textContent = target;
        return;
      }
      if (reduced) {
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
  setupCounters();
  setupReveal();
  setupFaq();
  setupForm();
  root.classList.add("is-ready");
})();
