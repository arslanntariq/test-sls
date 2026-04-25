(function () {
  'use strict';

  var LSE = 'Omtech';
  var BASE_URL = 'https://expresslf.com/';
  var MONTHLY_DIVISOR = 36; // 36-mo term for the estimate

  // -- inject stylesheet (only once) --
  function injectStyles() {
    if (document.getElementById('expresslf-embed-styles')) return;
    const style = document.createElement('style');
    style.id = 'expresslf-embed-styles';
    style.textContent = `
      /* button */
      .expresslf-btn-wrapper {
        margin: 10px 0;
        text-align: left;
      }
      .expresslf-btn {
        display: inline-block;
        background: linear-gradient(135deg, #e8891c 0%, #f0a040 100%);
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 15px;
        font-weight: 700;
        text-align: center;
        padding: 12px 28px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        line-height: 1.4;
        text-decoration: none;
        box-shadow: 0 2px 8px rgba(232,137,28,0.25);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        max-width: 100%;
      }
      .expresslf-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(232,137,28,0.35);
      }
      .expresslf-btn:active {
        transform: translateY(0);
      }
      .expresslf-btn-monthly {
        display: block;
        font-size: 15px;
        font-weight: 700;
      }
      .expresslf-branding {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 6px;
        font-size: 12px;
        color: #555;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .expresslf-branding svg {
        flex-shrink: 0;
      }

      /* list view - tighter sizing */
      .ClickleaseList .expresslf-btn-wrapper,
      .expresslf-list-btn-wrapper {
        margin: 6px 0 2px;
      }
      .ClickleaseList .expresslf-btn,
      .expresslf-list-btn-wrapper .expresslf-btn {
        padding: 10px 20px;
        font-size: 14px;
        width: 100%;
        box-sizing: border-box;
      }
      .ClickleaseList .expresslf-btn-monthly,
      .expresslf-list-btn-wrapper .expresslf-btn-monthly {
        font-size: 14px;
      }

      /* cart view */
      .expresslf-cart-btn-wrapper {
        text-align: right;
        margin: 12px 0 8px;
      }

      /* modal overlay */
      #expresslf-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      #expresslf-modal-overlay.expresslf-visible {
        opacity: 1;
      }
      #expresslf-modal-container {
        position: relative;
        width: 90%;
        max-width: 900px;
        height: 85vh;
        background: #fff;
        border-radius: 10px;
        overflow: hidden;
        transform: scale(0.95);
        transition: transform 0.25s ease;
      }
      #expresslf-modal-overlay.expresslf-visible #expresslf-modal-container {
        transform: scale(1);
      }
      #expresslf-close-btn {
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 28px;
        line-height: 1;
        cursor: pointer;
        z-index: 100000;
        background: rgba(255,255,255,0.9);
        border: none;
        color: #333;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        transition: background 0.15s ease;
      }
      #expresslf-close-btn:hover {
        background: #f0f0f0;
      }
      #expresslf-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }

      /* mobile */
      @media (max-width: 768px) {
        #expresslf-modal-container {
          width: 100%;
          height: 100vh;
          border-radius: 0;
          max-width: 100%;
        }
        .expresslf-btn {
          font-size: 13px;
          padding: 10px 16px;
        }
        .expresslf-btn-monthly {
          font-size: 13px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // -- modal --
  function openModal(url) {
    // kill existing modal first
    closeModal();

    console.log('[ExpressLF] Opening modal with URL:', url);

    const overlay = document.createElement('div');
    overlay.id = 'expresslf-modal-overlay';

    const container = document.createElement('div');
    container.id = 'expresslf-modal-container';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'expresslf-close-btn';
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('aria-label', 'Close financing modal');

    const iframe = document.createElement('iframe');
    iframe.id = 'expresslf-iframe';
    iframe.src = url;
    iframe.setAttribute('title', 'ExpressLF Financing Application');
    iframe.setAttribute('allow', 'payment');

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // fade in on next frame
    requestAnimationFrame(function () {
      overlay.classList.add('expresslf-visible');
    });

    // close on click / esc
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', escHandler);
  }

  function escHandler(e) {
    if (e.key === 'Escape') closeModal();
  }

  function closeModal() {
    const overlay = document.getElementById('expresslf-modal-overlay');
    if (overlay) {
      overlay.classList.remove('expresslf-visible');
      setTimeout(function () {
        overlay.remove();
      }, 250);
    }
    document.removeEventListener('keydown', escHandler);
  }

  // -- build the expresslf app url with query params --
  function buildUrl(price, desc, cartItems) {
    var costParam = price.toFixed(2);
    var descParam = encodeURIComponent(desc);
    // words joined by +, items joined by +
    var itemsParam = cartItems
      .map(function (item) {
        return item.trim().replace(/\s+/g, '+');
      })
      .join('+');

    return (
      BASE_URL +
      '?lse=' + LSE +
      '&cost=' + costParam +
      '&desc=' + descParam +
      '&cartitems=' + encodeURIComponent(itemsParam)
    );
  }

  // -- pull price from a DOM element (tries data attrs, then text) --
  function extractPrice(el) {
    if (!el) return NaN;

    // shopify often stores cents in data-value
    var dataValue = el.getAttribute('data-value');
    if (dataValue && !isNaN(dataValue)) return parseInt(dataValue, 10) / 100;

    // some themes use data-product-price instead
    var dataPP = el.getAttribute('data-product-price');
    if (dataPP && !isNaN(dataPP) && parseInt(dataPP, 10) > 1000) {
      return parseInt(dataPP, 10) / 100;
    }

    // last resort: parse the visible text ("$4,099.99")
    var text = el.innerText || el.textContent || '';
    text = text.replace(/[^0-9.]/g, '');
    var parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed > 0) return parsed;

    return NaN;
  }

  // strip variant suffixes like "- Machine with FREE LightBurn"
  function cleanTitle(title) {
    if (!title) return '';
    return title
      .replace(/\s*-\s*Machine\s*with\s*(FREE\s+)?LightBurn$/i, '')
      .replace(/\s*-\s*Machine$/i, '')
      .replace(/&amp;/g, '&')
      .trim();
  }

  // inline svg for the express logo next to branding text
  function expressLogoSVG() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="14" viewBox="0 0 84 17" fill="none">' +
      '<path d="M11.19 10.6C10.69 11.23 10 11.68 9.23 11.9C8.46 12.12 7.64 12.09 6.89 11.83C6.13 11.56 5.48 11.07 5.01 10.41C4.55 9.76 4.3 8.98 4.3 8.17C4.3 7.37 4.55 6.59 5.01 5.94C5.48 5.28 6.13 4.79 6.89 4.52C7.64 4.26 8.46 4.23 9.23 4.45C10 4.67 10.69 5.12 11.19 5.75L15.18 3.97C14.26 2.43 12.87 1.25 11.21 0.58C9.55-0.08 7.71-0.18 5.99 0.3C4.27 0.77 2.75 1.8 1.67 3.23C0.59 4.65 0 6.39 0 8.18C0 9.96 0.59 11.7 1.67 13.12C2.75 14.55 4.27 15.58 5.99 16.05C7.71 16.53 9.55 16.43 11.21 15.77C12.87 15.1 14.26 13.92 15.18 12.38L11.19 10.6Z" fill="#20B6F1"/>' +
      '<path d="M17.86 4.57L13.82 6.37L9.78 8.17L13.82 9.98L17.86 11.78L16.79 8.18L17.86 4.57Z" fill="#2F2725"/>' +
      '<text x="22" y="13" font-size="11" font-weight="700" fill="#2F2725" font-family="Arial,sans-serif">express</text>' +
      '</svg>';
  }

  // -- build a financing button element --
  function createButton(price, title, cartItems, isCart) {
    var monthly = Math.ceil(price / MONTHLY_DIVISOR);
    var url = buildUrl(price, title, cartItems || [title]);

    var wrapper = document.createElement('div');
    wrapper.className = isCart
      ? 'expresslf-btn-wrapper expresslf-cart-btn-wrapper'
      : 'expresslf-btn-wrapper';

    var btn = document.createElement('button');
    btn.className = 'expresslf-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Apply for financing - Estimated payment $' + monthly + ' per month');
    btn.innerHTML =
      '<span class="expresslf-btn-monthly">Estimated Payment: <strong>$' +
      monthly +
      '/mo</strong></span>';

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal(url);
    });

    var branding = document.createElement('div');
    branding.className = 'expresslf-branding';
    branding.innerHTML = 'Simple business & vocational financing by ' + expressLogoSVG();

    wrapper.appendChild(btn);
    wrapper.appendChild(branding);
    return wrapper;
  }

  // -- collection / list page --
  function handleListView() {
    console.log('[ExpressLF] Detected LIST VIEW (template-collection)');

    // swap out each old Clicklease widget
    var clickleaseEls = document.querySelectorAll('.ClickleaseList');
    if (clickleaseEls.length > 0) {
      clickleaseEls.forEach(function (clEl) {
        // walk up to the product card
        var card = clEl.closest('.product-item') || clEl.closest('.product-price')?.parentElement;

        var price = NaN;
        var title = '';

        if (card) {

          var titleEl = card.querySelector('.product-title') || card.querySelector('a.product-title');
          title = titleEl ? cleanTitle(titleEl.innerText || titleEl.textContent) : '';


          var priceEl = card.querySelector('.highlight-price');
          if (priceEl) {
            price = extractPrice(priceEl);
          }
        }

        // fallback: reverse-calc from the old monthly price widget
        if (isNaN(price) || price <= 0) {
          var ppmEl = clEl.querySelector('.price-per-month');
          if (ppmEl) {
            var ppmText = ppmEl.innerText.replace(/[^0-9]/g, '');
            var ppm = parseInt(ppmText, 10);
            if (!isNaN(ppm) && ppm > 0) {
              price = ppm * MONTHLY_DIVISOR;
            }
          }
        }

        if (!isNaN(price) && price > 0 && title) {
          clEl.innerHTML = '';
          clEl.appendChild(createButton(price, title, [title], false));
          console.log('[ExpressLF] List button injected:', title, '$' + price);
        }
      });
    }

    // second pass: catch any cards that didn't have a .ClickleaseList container
    if (typeof window.productInfoList !== 'undefined' && window.productInfoList.length > 0) {
      var allCards = document.querySelectorAll('.product-item');
      allCards.forEach(function (card) {
        // already done
        if (card.querySelector('.expresslf-btn')) return;

        var titleEl = card.querySelector('.product-title') || card.querySelector('a.product-title');
        if (!titleEl) return;
        var title = cleanTitle(titleEl.innerText || titleEl.textContent);

        var priceEl = card.querySelector('.highlight-price');
        if (!priceEl) return;
        var price = extractPrice(priceEl);

        if (!isNaN(price) && price > 0) {
          var priceContainer = card.querySelector('.product-price');
          if (priceContainer) {
            priceContainer.appendChild(createButton(price, title, [title], false));
            console.log('[ExpressLF] List button fallback injected:', title, '$' + price);
          }
        }
      });
    }
  }

  // -- product detail page --
  function handleDetailView() {
    console.log('[ExpressLF] Detected DETAIL VIEW (template-product)');

    var title = '';
    var price = NaN;

    // grab product title - try global obj first, then DOM, then JSON
    if (typeof window.product !== 'undefined' && window.product && window.product.title) {
      title = cleanTitle(window.product.title);
    }
    if (!title) {
      var h1 = document.querySelector('h1.product__title') ||
                document.querySelector('.product-single__title') ||
                document.querySelector('.product-title span');
      if (h1) title = cleanTitle(h1.innerText || h1.textContent);
    }
    // last try: dig through json blobs on the page
    if (!title) {
      var jsonEls = document.querySelectorAll('script[type="application/json"]');
      for (var i = 0; i < jsonEls.length; i++) {
        try {
          var data = JSON.parse(jsonEls[i].textContent);
          if (data && data.title) {
            title = cleanTitle(data.title);
            break;
          }
        } catch (e) { /* ignore */ }
      }
    }

    // grab price
    var priceEl = document.querySelector('.product-block--price [data-product-price][data-value]');
    if (priceEl) {
      price = extractPrice(priceEl);
    }
    if (isNaN(price) || price <= 0) {
      priceEl = document.querySelector('[data-product-price]');
      if (priceEl) price = extractPrice(priceEl);
    }
    // json fallback (price in cents)
    if (isNaN(price) || price <= 0) {
      var jsonEls2 = document.querySelectorAll('script[type="application/json"]');
      for (var j = 0; j < jsonEls2.length; j++) {
        try {
          var data2 = JSON.parse(jsonEls2[j].textContent);
          if (data2 && data2.price && data2.price > 100) {
            price = data2.price / 100;
            break;
          }
        } catch (e2) { /* ignore */ }
      }
    }

    console.log('[ExpressLF] Detail view — title:', title, 'price:', price);

    if (!isNaN(price) && price > 0 && title) {
      var btn = createButton(price, title, [title], false);

      // try to drop it into the old Clicklease container
      var clickleaseBtn = document.querySelector('.ClickleaseButton');
      if (clickleaseBtn) {
        clickleaseBtn.innerHTML = '';
        clickleaseBtn.appendChild(btn);
        console.log('[ExpressLF] Detail button injected into .ClickleaseButton');
        return;
      }

      // otherwise stick it after the price block
      var priceBlock = document.querySelector('.product-block--price');
      if (priceBlock && priceBlock.parentNode) {
        priceBlock.parentNode.insertBefore(btn, priceBlock.nextSibling);
        console.log('[ExpressLF] Detail button injected after .product-block--price');
        return;
      }

      // or after the buy button
      var buyBlock = document.querySelector('.product-block.buy-button');
      if (buyBlock && buyBlock.parentNode) {
        buyBlock.parentNode.insertBefore(btn, buyBlock.nextSibling);
        console.log('[ExpressLF] Detail button injected after .buy-button');
      }
    }
  }

  // -- standalone /cart page --
  function handleCartView() {
    console.log('[ExpressLF] Detected CART VIEW');
    injectCartButton();
  }

  // shared logic for injecting button into cart (works for both /cart and drawer)
  function injectCartButton() {
    // don't double up
    if (document.querySelector('.cart__footer .expresslf-btn-wrapper')) {
      console.log('[ExpressLF] Cart button already present, skipping.');
      return;
    }

    var price = NaN;
    var itemNames = [];

    // cart subtotal is stored in cents on the data attr
    var subtotalEl = document.querySelector('[data-cart-subtotal]');
    if (subtotalEl) {
      var raw = subtotalEl.getAttribute('data-cart-subtotal');
      if (raw && !isNaN(raw)) {
        price = parseInt(raw, 10) / 100;
      }
    }

    // fallback: grab it from the total row text
    if (isNaN(price) || price <= 0) {
      var totalEl = document.querySelector('.total_total .price');
      if (totalEl) {
        var totalText = (totalEl.innerText || totalEl.textContent).replace(/[^0-9.]/g, '');
        price = parseFloat(totalText);
      }
    }

    // collect item names for the url
    var nameEls = document.querySelectorAll('.cart__item-name');
    nameEls.forEach(function (el) {
      var name = cleanTitle(el.innerText || el.textContent);
      if (name) itemNames.push(name);
    });

    // try json blobs if we couldn't get names from the dom
    if (itemNames.length === 0) {
      var cartJsonEls = document.querySelectorAll('.cart__item script[type="application/json"]');
      cartJsonEls.forEach(function (jsonEl) {
        try {
          var data = JSON.parse(jsonEl.textContent);
          if (data && data.product_title) {
            itemNames.push(cleanTitle(data.product_title));
          }
        } catch (e) { /* ignore */ }
      });
    }


    var desc = '';
    if (itemNames.length === 0) {
      desc = 'Cart Item';
      itemNames = ['Cart Item'];
    } else if (itemNames.length === 1) {
      desc = itemNames[0];
    } else {
      desc = 'Multiple Cart Items';
    }

    console.log('[ExpressLF] Cart — price:', price, 'items:', itemNames, 'desc:', desc);

    if (!isNaN(price) && price > 0) {
      var btn = createButton(price, desc, itemNames, true);

      // best spot: right after the total row
      var totalRow = document.querySelector('.total_total');
      if (totalRow && totalRow.parentNode) {
        totalRow.parentNode.insertBefore(btn, totalRow.nextSibling);
        console.log('[ExpressLF] Cart button injected after total row');
        return;
      }

      // or just above the checkout buttons
      var checkoutWrapper = document.querySelector('.cart__checkout-wrapper');
      if (checkoutWrapper && checkoutWrapper.parentNode) {
        checkoutWrapper.parentNode.insertBefore(btn, checkoutWrapper);
        console.log('[ExpressLF] Cart button injected before checkout wrapper');
        return;
      }

      // or anywhere in the footer
      var footer = document.querySelector('.cart__footer');
      if (footer) {
        var discountsDiv = footer.querySelector('[data-discounts]');
        if (discountsDiv) {
          discountsDiv.appendChild(btn);
        } else {
          footer.insertBefore(btn, footer.firstChild);
        }
        console.log('[ExpressLF] Cart button injected into cart footer');
        return;
      }

      // last resort
      var cartItems = document.querySelector('.cart__items');
      if (cartItems && cartItems.parentNode) {
        cartItems.parentNode.insertBefore(btn, cartItems.nextSibling);
        console.log('[ExpressLF] Cart button injected after .cart__items');
      }
    }
  }

  // -- watch for the ajax cart drawer opening/updating --
  function handleCartDrawer() {
    // if drawer is already open, inject now
    if (document.querySelector('.cart__footer')) {
      injectCartButton();
    }

    // set up a mutation observer to catch drawer open/refresh
    var cartContainer = document.querySelector('.site-header__cart') ||
                        document.querySelector('#CartDrawer') ||
                        document.body;

    if (!cartContainer) return;

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];

        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          var footer = document.querySelector('.cart__footer');
          if (footer && !footer.querySelector('.expresslf-btn-wrapper')) {
            console.log('[ExpressLF] Cart drawer change detected, injecting button');
            injectCartButton();
          }
        }
        // class toggle (drawer becoming visible, loading finished, etc)
        if (mutation.type === 'attributes') {
          var target = mutation.target;
          if (target.classList && (
            target.classList.contains('cart--is-loading') === false ||
            target.classList.contains('is-open') ||
            target.classList.contains('active')
          )) {
            var footer2 = document.querySelector('.cart__footer');
            if (footer2 && !footer2.querySelector('.expresslf-btn-wrapper')) {
              console.log('[ExpressLF] Cart drawer opened, injecting button');
              injectCartButton();
            }
          }
        }
      }
    });

    observer.observe(cartContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    console.log('[ExpressLF] Cart drawer observer started on:', cartContainer.className || cartContainer.tagName);
  }

  // -- kick it off --
  function init() {
    injectStyles();

    var body = document.body;
    if (!body) {
      console.warn('[ExpressLF] No <body> found. Aborting.');
      return;
    }

    // cart drawer can slide in from any page, always listen
    handleCartDrawer();

    if (body.classList.contains('template-collection')) {
      handleListView();
    } else if (body.classList.contains('template-product')) {
      handleDetailView();
    } else if (
      body.classList.contains('template-cart') ||
      (window.location.href && window.location.href.indexOf('/cart') !== -1)
    ) {
      handleCartView();
    } else {
      console.log('[ExpressLF] Page type not detected. Body classes:', body.className);
      // couldn't tell from body class, try the dom
      if (document.querySelector('.ClickleaseList')) handleListView();
      if (document.querySelector('.ClickleaseButton')) handleDetailView();
    }
  }

  // go
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
