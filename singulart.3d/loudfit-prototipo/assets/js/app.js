(function () {
  var root = document.documentElement;
  var nav = document.querySelector("[data-nav]");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 18);
  }

  function sitePrefix() {
    var depth = document.body.dataset.depth || "root";
    if (depth === "root") return "./";
    if (depth === "unit") return "../../";
    return "../";
  }

  function isExternalPath(path) {
    return /^(https?:|mailto:|tel:|#)/i.test(path);
  }

  function rootPath(path) {
    if (!path) return "#";
    if (isExternalPath(path) || path.indexOf("./") === 0 || path.indexOf("../") === 0) return path;
    return sitePrefix() + String(path).replace(/^\/+/, "");
  }

  function assetPath(path) {
    if (!path) return "";
    if (/^(https?:|data:)/i.test(path)) return path;
    return sitePrefix() + String(path).replace(/^(\.\/|\.\.\/)+/, "");
  }

  function cleanValue(value) {
    if (!value || value.charAt(0) === "[") return "";
    return value;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function unitLocation(unit) {
    return [cleanValue(unit.district), cleanValue(unit.city)].filter(Boolean).join(" · ") || unit.statusLabel;
  }

  function unitPrimaryAction(unit) {
    if (unit.status === "em_inauguracao") {
      return {
        label: "Acompanhar abertura",
        href: rootPath(unit.opening_url || unit.instagram || "#"),
        quiet: true
      };
    }

    if (unit.type === "franqueada") {
      return {
        label: "Falar com a unidade",
        href: rootPath(unit.whatsapp_url || unit.whatsapp || "#")
      };
    }

    if (unit.checkout_enabled) {
      return {
        label: "Matricule-se agora",
        href: rootPath(unit.checkout_url || "#matricula-em-breve")
      };
    }

    return {
      label: "Falar com a unidade",
      href: rootPath(unit.whatsapp_url || unit.whatsapp || "#")
    };
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

  function planCard(plan, ctaOverride) {
    var isFeatured = !!plan.featured;
    var ctaLabel = ctaOverride && ctaOverride.label ? ctaOverride.label : plan.ctaLabel;
    var ctaUrl = ctaOverride && ctaOverride.href ? ctaOverride.href : plan.ctaUrl;
    var benefits = (plan.benefits || []).map(function (benefit) {
      return "<li>" + escapeHtml(benefit) + "</li>";
    }).join("");

    return [
      '<article class="plan-card ' + (isFeatured ? 'plan-card--featured ' : '') + 'reveal">',
      '  <div class="plan-card__top">',
      '    <span class="plan-card__name">' + escapeHtml(plan.name) + '</span>',
      isFeatured ? '    <span class="plan-card__badge">' + escapeHtml(plan.highlight || "Destaque") + '</span>' : '',
      '  </div>',
      '  <p class="plan-card__description">' + escapeHtml(plan.description) + '</p>',
      '  <div class="plan-card__price"><strong>' + escapeHtml(plan.price) + '</strong><span>' + escapeHtml(plan.period) + '</span></div>',
      '  <ul class="plan-card__benefits">' + benefits + '</ul>',
      '  <p class="plan-card__note">' + escapeHtml(plan.note || "") + '</p>',
      '  <a class="button ' + (isFeatured ? 'button--volt' : 'button--outline') + '" href="' + rootPath(ctaUrl) + '">' + escapeHtml(ctaLabel) + '</a>',
      '</article>'
    ].join("");
  }

  function renderPlans() {
    var plans = (window.LOUDFIT_PLANS || []).filter(function (plan) {
      return plan.status !== "inativo";
    });

    document.querySelectorAll("[data-plans-grid]").forEach(function (grid) {
      var limit = Number(grid.dataset.limit || plans.length);
      grid.innerHTML = plans.slice(0, limit).map(function (plan) {
        return planCard(plan);
      }).join("");
    });
  }

  function renderUnits() {
    var units = sortUnits(window.LOUDFIT_UNITS || []);
    document.querySelectorAll("[data-units-grid]").forEach(function (grid) {
      var limit = Number(grid.dataset.limit || units.length);
      grid.innerHTML = units.slice(0, limit).map(function (unit) {
        var isOpening = unit.status === "em_inauguracao";
        var detailUrl = unit.detail_url ? rootPath(unit.detail_url) : rootPath("unidades/#rede");
        var primary = unitPrimaryAction(unit);
        var plansLabel = unit.plans_available ? "Planos disponíveis" : "Planos em breve";
        var actions = [
          '<a class="icon-link icon-link--primary ' + (primary.quiet ? 'icon-link--quiet' : '') + '" href="' + primary.href + '">' + escapeHtml(primary.label) + '</a>',
          (!isOpening && unit.detail_url ? '<a class="icon-link" href="' + detailUrl + '">Ver unidade</a>' : '')
        ].join("");

        return [
          '<article class="unit-card ' + (isOpening ? 'unit-card--opening ' : '') + 'reveal">',
          '  <a class="unit-card__media" href="' + detailUrl + '">',
          '    <img src="' + assetPath(unit.image) + '" alt="Unidade LoudFit ' + escapeHtml(unit.name) + '" loading="lazy">',
          (isOpening ? '    <span class="status-badge"><span class="pulse-dot"></span>' + escapeHtml(unit.badge || unit.statusLabel) + '</span>' : ''),
          '  </a>',
          '  <div class="unit-card__body">',
          '    <span class="unit-status ' + (isOpening ? 'unit-status--opening' : '') + '">' + escapeHtml(unit.statusLabel) + '</span>',
          '    <h3>' + escapeHtml(unit.name) + '</h3>',
          '    <p>' + escapeHtml(unitLocation(unit)) + '</p>',
          '    <div class="unit-card__meta">',
          '      <span>' + escapeHtml(unit.typeLabel || "Unidade LoudFit") + '</span>',
          '      <span>' + escapeHtml(plansLabel) + '</span>',
          '    </div>',
          '    <div class="unit-card__actions">',
          actions,
          '    </div>',
          '  </div>',
          '</article>'
        ].join("");
      }).join("");
    });
  }

  function renderList(selector, items) {
    document.querySelectorAll(selector).forEach(function (list) {
      list.innerHTML = (items || []).map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("");
    });
  }

  function renderUnitDetail() {
    var detail = document.querySelector("[data-unit-detail]");
    if (!detail) return;

    var slug = detail.dataset.unitDetail;
    var unit = (window.LOUDFIT_UNITS || []).filter(function (item) {
      return item.slug === slug;
    })[0];
    if (!unit) return;

    var primary = unitPrimaryAction(unit);
    var plans = (window.LOUDFIT_PLANS || []).filter(function (plan) {
      return plan.status !== "inativo";
    });

    document.querySelectorAll("[data-unit-name]").forEach(function (item) {
      item.textContent = unit.name;
    });
    document.querySelectorAll("[data-unit-location]").forEach(function (item) {
      item.textContent = unitLocation(unit);
    });
    document.querySelectorAll("[data-unit-address]").forEach(function (item) {
      item.textContent = unit.address || "Endereço em atualização";
    });
    document.querySelectorAll("[data-unit-hours]").forEach(function (item) {
      item.textContent = unit.hours || "Horários em atualização";
    });
    document.querySelectorAll("[data-unit-type]").forEach(function (item) {
      item.textContent = unit.typeLabel || "Unidade LoudFit";
    });
    document.querySelectorAll("[data-unit-status]").forEach(function (item) {
      item.textContent = unit.statusLabel;
    });
    document.querySelectorAll("[data-unit-image]").forEach(function (item) {
      item.setAttribute("src", assetPath(unit.image));
      item.setAttribute("alt", "Unidade LoudFit " + unit.name);
    });
    document.querySelectorAll("[data-unit-cta]").forEach(function (item) {
      item.textContent = primary.label;
      item.setAttribute("href", primary.href);
    });
    document.querySelectorAll("[data-unit-plans]").forEach(function (grid) {
      grid.innerHTML = plans.map(function (plan) {
        return planCard(plan, { label: primary.label, href: "#matricula" });
      }).join("");
    });

    renderList("[data-unit-structure]", unit.structure);
    renderList("[data-unit-modalities]", unit.modalities);
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

  renderPlans();
  renderUnits();
  renderUnitDetail();
  renderNetworkStats();
  setupCounters();
  setupReveal();
  setupFaq();
  setupForm();
  root.classList.add("is-ready");
})();
