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

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-product-root]').forEach(initProduct);
  });
})();
