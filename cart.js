/* ════════════════════════════════════════════════════════
   SeatSoother — Cart + Checkout
   ════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── CONFIG: paste your credentials here ── */
  var CONFIG = {
    /* 1. Create a product + payment link at dashboard.stripe.com → Payment Links */
    stripePaymentLink: 'https://buy.stripe.com/REPLACE_WITH_YOUR_STRIPE_LINK',
    /* 2. Find your Client ID at developer.paypal.com → Apps & Credentials */
    paypalClientId: 'REPLACE_WITH_YOUR_PAYPAL_CLIENT_ID',
    currency: 'AUD',
    price:    189.99
  };

  var CART_KEY = 'ss_cart_items';

  /* ── Storage helpers ── */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    localStorage.setItem('ss_cart', String(sumQty(items)));
    updateBadges();
    renderItems();
  }

  function sumQty(items) {
    return items.reduce(function (s, i) { return s + i.qty; }, 0);
  }

  function sumPrice(items) {
    return items.reduce(function (s, i) { return s + i.qty * CONFIG.price; }, 0);
  }

  function updateBadges() {
    var qty = sumQty(getCart());
    document.querySelectorAll('#cartCount, .nav-cart-badge').forEach(function (el) {
      el.textContent = String(qty);
    });
  }

  /* ── Public API (called from product pages) ── */
  window.SS = window.SS || {};

  window.SS.addToCart = function (name, color, btn) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.name === name && i.color === color; });
    if (item) {
      item.qty++;
    } else {
      cart.push({ name: name, color: color, qty: 1, price: CONFIG.price });
    }
    saveCart(cart);

    if (btn) {
      var orig = btn.innerHTML;
      btn.innerHTML = '&#10003; Added to Cart!';
      btn.style.background = '#27ae60';
      btn.style.borderColor = '#27ae60';
      setTimeout(function () {
        btn.innerHTML = orig;
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 2000);
    }
    openDrawer();
  };

  /* ── Inject drawer HTML ── */
  function injectDrawer() {
    if (document.getElementById('ssCartDrawer')) return;

    var overlay = document.createElement('div');
    overlay.id = 'ssCartOverlay';
    overlay.className = 'ss-overlay';
    overlay.addEventListener('click', closeDrawer);
    document.body.appendChild(overlay);

    var drawer = document.createElement('div');
    drawer.id = 'ssCartDrawer';
    drawer.className = 'ss-drawer';
    drawer.innerHTML =
      '<div class="ss-drawer-head">' +
        '<span class="ss-drawer-title">Your Cart</span>' +
        '<button class="ss-drawer-close" id="ssCartClose" aria-label="Close cart">&times;</button>' +
      '</div>' +
      '<div class="ss-drawer-body" id="ssCartBody"></div>' +
      '<div class="ss-drawer-foot" id="ssCartFoot">' +
        '<div class="ss-total-row">' +
          '<span>Total</span>' +
          '<strong id="ssCartTotal">$0.00</strong>' +
        '</div>' +
        '<button class="btn btn-blue ss-stripe-btn" id="ssStripeBtn">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>' +
          'Checkout — Pay Securely' +
        '</button>' +
        '<div class="ss-or-divider"><span>or pay with</span></div>' +
        '<div id="ssPaypalBtn"></div>' +
        '<div class="ss-pay-icons">' +
          '<span class="payment-icon pi-visa">VISA</span>' +
          '<span class="payment-icon pi-mastercard" aria-label="Mastercard">' +
            '<svg width="38" height="22" viewBox="0 0 38 22" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="11" r="10" fill="#EB001B"/><circle cx="24" cy="11" r="10" fill="#F79E1B"/><path d="M19 3.8a10 10 0 0 1 0 14.4A10 10 0 0 1 19 3.8z" fill="#FF5F00"/></svg>' +
          '</span>' +
          '<span class="payment-icon pi-apple-pay"><svg width="14" height="14" viewBox="0 0 14 17" fill="white" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;margin-right:3px"><path d="M11.5 5.5c-.8 1-2.1 1.8-3.3 1.7-.2-1.3.5-2.6 1.2-3.4.8-1 2.2-1.7 3.3-1.8.1 1.3-.4 2.6-1.2 3.5zm1.2 1.8c-1.8-.1-3.4 1-4.2 1-1 0-2.4-1-3.9-1-2 0-3.9 1.2-5 3C-2 14 .3 19 2.6 22c1.1 1.5 2.4 3 4.1 3 1.6-.1 2.2-1 4.2-1 2 0 2.5.9 4.2 1 1.7 0 2.9-1.5 4-3 1-1.3 1.4-2.6 1.4-2.7-.1 0-2.7-1-2.7-4 0-2.6 2-3.7 2.1-3.8-1.2-1.8-3-2.2-3.7-2.2z"/></svg>Pay</span>' +
          '<span class="payment-icon pi-afterpay">afterpay</span>' +
          '<span class="payment-icon pi-paypal"><svg width="13" height="16" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;margin-right:3px"><path d="M10.5 2C10.5 4.5 8.5 6 6 6H4L3 11H1L2.7 1H7c2 0 3.5 0 3.5 1z" fill="#009CDE"/><path d="M11.5 4.5C11.5 7 9.5 8.5 7 8.5H5L4 13H2l.7-3H5c2.5 0 4.5-1 5.5-3 .7-.5 1-1.5 1-2z" fill="#003087"/></svg>PayPal</span>' +
        '</div>' +
      '</div>';

    document.body.appendChild(drawer);
    document.getElementById('ssCartClose').addEventListener('click', closeDrawer);
    document.getElementById('ssStripeBtn').addEventListener('click', checkoutStripe);
  }

  /* ── Render cart items ── */
  function productImg(color) {
    return color === 'blue'
      ? 'Brand_assets/H90ec0ec1be46449ca5e40d7792b52ae0Y.avif'
      : 'Brand_assets/H51704bd836974f58a15858bb623bf6bb6.jpg';
  }

  function renderItems() {
    var body   = document.getElementById('ssCartBody');
    var foot   = document.getElementById('ssCartFoot');
    var totalEl = document.getElementById('ssCartTotal');
    if (!body) return;

    var cart = getCart();

    if (!cart.length) {
      body.innerHTML =
        '<div class="ss-cart-empty">' +
          '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
          '<p>Your cart is empty</p>' +
          '<a href="index.html#collection" class="btn btn-blue" style="margin-top:14px;font-size:1.1rem;padding:12px 28px;">Shop Now</a>' +
        '</div>';
      if (foot) foot.style.display = 'none';
      return;
    }

    if (foot) foot.style.display = '';
    if (totalEl) totalEl.textContent = '$' + sumPrice(cart).toFixed(2);

    body.innerHTML = cart.map(function (item) {
      var dn = encodeAttr(item.name);
      var dc = encodeAttr(item.color);
      return (
        '<div class="ss-cart-item">' +
          '<div class="ss-item-img"><img src="' + productImg(item.color) + '" alt="' + dn + '" /></div>' +
          '<div class="ss-item-info">' +
            '<div class="ss-item-name">' + item.name + '</div>' +
            '<div class="ss-item-price">$' + (item.qty * CONFIG.price).toFixed(2) + '</div>' +
            '<div class="ss-qty-row">' +
              '<button class="ss-qty-btn" data-action="dec" data-name="' + dn + '" data-color="' + dc + '">&#8722;</button>' +
              '<span class="ss-qty-num">' + item.qty + '</span>' +
              '<button class="ss-qty-btn" data-action="inc" data-name="' + dn + '" data-color="' + dc + '">&#43;</button>' +
            '</div>' +
          '</div>' +
          '<button class="ss-remove-btn" data-name="' + dn + '" data-color="' + dc + '" aria-label="Remove">&times;</button>' +
        '</div>'
      );
    }).join('');

    body.querySelectorAll('.ss-qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        changeQty(this.dataset.name, this.dataset.color, this.dataset.action === 'inc' ? 1 : -1);
      });
    });
    body.querySelectorAll('.ss-remove-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeItem(this.dataset.name, this.dataset.color);
      });
    });
  }

  function encodeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  function changeQty(name, color, delta) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.name === name && i.color === color; });
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    saveCart(cart);
  }

  function removeItem(name, color) {
    saveCart(getCart().filter(function (i) { return !(i.name === name && i.color === color); }));
  }

  /* ── Open / close ── */
  function openDrawer() {
    var drawer  = document.getElementById('ssCartDrawer');
    var overlay = document.getElementById('ssCartOverlay');
    if (!drawer) return;
    renderItems();
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    mountPayPal();
  }

  function closeDrawer() {
    var drawer  = document.getElementById('ssCartDrawer');
    var overlay = document.getElementById('ssCartOverlay');
    if (!drawer) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Stripe ── */
  function checkoutStripe() {
    var cart = getCart();
    var qty  = sumQty(cart);
    if (!qty) return;
    var url = CONFIG.stripePaymentLink;
    if (url.indexOf('REPLACE') !== -1) {
      alert('Stripe payment link not configured yet.\nOpen cart.js and replace REPLACE_WITH_YOUR_STRIPE_LINK with your Stripe Payment Link URL.');
      return;
    }
    if (qty > 1) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'prefilled_quantity=' + qty;
    window.location.href = url;
  }

  /* ── PayPal ── */
  var ppSdkLoading = false;
  var ppMounted    = false;

  function mountPayPal() {
    if (ppMounted) return;
    var container = document.getElementById('ssPaypalBtn');
    if (!container) return;
    if (CONFIG.paypalClientId.indexOf('REPLACE') !== -1) return; /* not configured */

    if (window.paypal) {
      renderPayPalButtons();
      return;
    }
    if (ppSdkLoading) return;
    ppSdkLoading = true;

    var s = document.createElement('script');
    s.src = 'https://www.paypal.com/sdk/js' +
            '?client-id=' + CONFIG.paypalClientId +
            '&currency=' + CONFIG.currency +
            '&intent=capture' +
            '&components=buttons' +
            '&enable-funding=venmo,paylater,card,afterpay_clearpay';
    s.onload = renderPayPalButtons;
    document.head.appendChild(s);
  }

  function renderPayPalButtons() {
    if (ppMounted) return;
    ppMounted = true;
    window.paypal.Buttons({
      style: { layout: 'vertical', shape: 'rect', label: 'pay', color: 'gold', height: 44 },
      createOrder: function (data, actions) {
        var cart = getCart();
        return actions.order.create({
          purchase_units: [{
            description: 'SeatSoother Donut Cushion',
            amount: { value: sumPrice(cart).toFixed(2), currency_code: CONFIG.currency }
          }]
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function () {
          localStorage.removeItem(CART_KEY);
          localStorage.setItem('ss_cart', '0');
          updateBadges();
          closeDrawer();
          window.location.href = 'thank-you.html';
        });
      },
      onError: function (err) {
        console.error('PayPal error', err);
      }
    }).render('#ssPaypalBtn');
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    injectDrawer();
    updateBadges();

    document.querySelectorAll('.nav-cart').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openDrawer();
      });
    });
  });
})();
