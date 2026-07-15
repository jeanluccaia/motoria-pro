(function () {
  function formatMoney(cents) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(cents || 0) / 100);
  }

  function initProduct(root) {
    var json = root.querySelector('[data-variant-json]');
    var form = root.querySelector('[data-product-form]');
    var submit = root.querySelector('[data-product-submit]');
    var idInput = root.querySelector('[data-variant-id-input]');
    var message = root.querySelector('[data-variant-message]');
    var price = root.querySelector('[data-product-price]');
    var variants = [];

    if (!json || !form || !submit || !idInput) return;

    try {
      variants = JSON.parse(json.textContent || '[]');
    } catch (error) {
      variants = [];
    }

    function selectedOptions() {
      var groups = root.querySelectorAll('[data-option-index]');
      return Array.prototype.map.call(groups, function (group) {
        var checked = group.querySelector('[data-option-value]:checked');
        return checked ? checked.value : null;
      });
    }

    function findExactVariant(options) {
      if (!options.length) return null;
      if (options.some(function (value) { return value === null; })) return null;

      return variants.find(function (variant) {
        return variant.options.every(function (value, index) {
          return value === options[index];
        });
      }) || null;
    }

    function optionCanLeadToAvailableVariant(optionIndex, value, currentOptions) {
      return variants.some(function (variant) {
        if (!variant.available || variant.options[optionIndex] !== value) return false;

        return variant.options.every(function (variantValue, index) {
          if (index === optionIndex) return true;
          return !currentOptions[index] || currentOptions[index] === variantValue;
        });
      });
    }

    function syncOptionAvailability(options) {
      var groups = root.querySelectorAll('[data-option-index]');

      Array.prototype.forEach.call(groups, function (group, groupIndex) {
        var inputs = group.querySelectorAll('[data-option-value]');

        Array.prototype.forEach.call(inputs, function (input) {
          var canSelect = optionCanLeadToAvailableVariant(groupIndex, input.value, options);
          input.disabled = !canSelect;
        });
      });
    }

    function syncVariantState() {
      var options = selectedOptions();
      var variant = findExactVariant(options);

      if (!options.length && idInput.value) return;

      syncOptionAvailability(options);

      if (variant && variant.available) {
        idInput.value = variant.id;
        submit.disabled = false;
        submit.textContent = 'Adicionar ao carrinho';
        if (price) price.textContent = Number(variant.price || 0) > 0 ? formatMoney(variant.price) : 'Em breve';
        if (message) message.textContent = 'Selecionado: ' + variant.options.join(' / ');
        return;
      }

      idInput.value = '';
      submit.disabled = true;

      if (variant && !variant.available) {
        submit.textContent = 'Indisponivel';
        if (message) message.textContent = 'Esta combinacao esta indisponivel no momento.';
      } else {
        submit.textContent = 'Adicionar ao carrinho';
        if (message) message.textContent = 'Selecione modelo, cor e tamanho para continuar.';
      }
    }

    root.addEventListener('change', function (event) {
      if (event.target.matches('[data-option-value]')) syncVariantState();
    });

    form.addEventListener('submit', function (event) {
      if (!idInput.value) {
        event.preventDefault();
        syncVariantState();
        if (message) message.focus && message.focus();
      }
    });

    syncVariantState();
  }

  function initCartDrawer() {
    var toggle = document.querySelector('[data-cart-toggle]');
    var drawer = document.querySelector('[data-cart-drawer]');
    if (!toggle || !drawer) return;

    var body = drawer.querySelector('[data-cart-drawer-body]');
    var subtotal = drawer.querySelector('[data-cart-subtotal]');
    var badges = document.querySelectorAll('[data-cart-count]');
    var closeTriggers = drawer.querySelectorAll('[data-cart-close]');

    function escapeHtml(value) {
      var div = document.createElement('div');
      div.textContent = value || '';
      return div.innerHTML;
    }

    function renderCart(cart) {
      badges.forEach(function (el) {
        el.textContent = cart.item_count;
        el.hidden = cart.item_count === 0;
      });

      if (subtotal) subtotal.textContent = formatMoney(cart.total_price);
      if (!body) return;

      if (!cart.items.length) {
        body.innerHTML = '<p class="cart-drawer__empty">Seu carrinho esta vazio.</p>';
        return;
      }

      body.innerHTML = cart.items.map(function (item) {
        var optionsHtml = item.variant_title
          ? '<p class="cart-line__options">' + escapeHtml(item.variant_title) + '</p>'
          : '';
        var imageMarkup = item.image
          ? '<img src="' + item.image.replace(/(\.[a-z0-9]+)(\?.*)?$/i, '_240x$1') + '" width="64" height="64" alt="' + escapeHtml(item.product_title) + '" loading="lazy">'
          : '<span></span>';

        return '<article class="cart-drawer__line">' + imageMarkup +
          '<div><p class="cart-line__title">' + escapeHtml(item.product_title) + '</p>' +
          optionsHtml +
          '<p class="cart-line__price">' + formatMoney(item.final_line_price) + '</p></div></article>';
      }).join('');
    }

    function fetchCart() {
      fetch('/cart.js', { headers: { Accept: 'application/json' } })
        .then(function (response) { return response.json(); })
        .then(renderCart);
    }

    function openDrawer() {
      drawer.hidden = false;
      window.requestAnimationFrame(function () {
        drawer.classList.add('is-open');
      });
      toggle.setAttribute('aria-expanded', 'true');
      fetchCart();
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () {
        drawer.hidden = true;
      }, 200);
    }

    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      openDrawer();
    });

    Array.prototype.forEach.call(closeTriggers, function (el) {
      el.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });

    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!form.matches || !form.matches('[data-product-form]')) return;

      var idInput = form.querySelector('[data-variant-id-input]');
      if (!idInput || !idInput.value) return;

      event.preventDefault();

      fetch('/cart/add.js', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('add-to-cart failed');
          return response.json();
        })
        .then(function () { openDrawer(); })
        .catch(function () { form.submit(); });
    });

    fetchCart();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-product-root]').forEach(initProduct);
    initCartDrawer();
  });
})();
