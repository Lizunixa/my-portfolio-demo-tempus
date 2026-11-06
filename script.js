const PRODUCTS = [
  { id: 1, brand: 'Rolex', name: 'Submariner Date', price: 1250000, image: 'image/rolex.jpg' },
  { id: 2, brand: 'Omega', name: 'Speedmaster Moon', price: 680000, image: 'image/omega.jpg' },
  { id: 3, brand: 'Patek Philippe', name: 'Nautilus 5711', price: 4900000, image: 'image/patek.jpg' },
  { id: 4, brand: 'Audemars Piguet', name: 'Royal Oak', price: 3200000, image: 'image/audemars.jpg' }
];

const CART_STORAGE_KEY = 'tempus_cart';

function getCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(storedCart)) return [];

    return storedCart.reduce((cart, item) => {
      const product = PRODUCTS.find(({ id }) => id === Number(item?.id));
      const qty = Number(item?.qty);

      if (product && Number.isSafeInteger(qty) && qty > 0 && qty <= 99) {
        const existing = cart.find(({ id }) => id === product.id);
        if (existing) {
          existing.qty = Math.min(existing.qty + qty, 99);
        } else {
          cart.push({ ...product, qty });
        }
      }

      return cart;
    }, []);
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    return true;
  } catch {
    showToast('Не удалось сохранить корзину в этом браузере');
    return false;
  }
}

function addToCart(productId) {
  const product = PRODUCTS.find(({ id }) => id === Number(productId));
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(({ id }) => id === product.id);

  if (existing) {
    if (existing.qty >= 99) {
      showToast('Достигнуто максимальное количество');
      return;
    }
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart(cart);
  updateCartCounter();
  showToast('Товар добавлен в корзину');
}

function removeFromCart(productId) {
  saveCart(getCart().filter(({ id }) => id !== Number(productId)));
}

function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(({ id }) => id === Number(productId));
  if (!item) return;

  item.qty = Math.min(99, item.qty + Number(delta));
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart(cart);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

function updateCartCounter() {
  const counter = document.getElementById('cart-count');
  if (counter) counter.textContent = getCartCount();
}

function renderCartPage() {
  const container = document.getElementById('cart-container');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon" aria-hidden="true">◷</div>
        <h2>Корзина пуста</h2>
        <p>Самое время выбрать часы своей мечты.</p>
        <a href="index.html#catalog" class="btn-primary">Перейти в каталог</a>
      </div>
    `;
    initScrollReveal();
    return;
  }

  const rowsHtml = cart.map(item => `
    <article class="cart-item">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.brand} ${item.name}" class="cart-photo">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-brand">${item.brand}</div>
        <h3>${item.name}</h3>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-item-qty" aria-label="Количество товара ${item.name}">
        <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Уменьшить количество">−</button>
        <span>${item.qty}</span>
        <button type="button" data-action="increase" data-id="${item.id}" aria-label="Увеличить количество">+</button>
      </div>
      <div class="cart-item-sum">${formatPrice(item.price * item.qty)}</div>
      <button class="cart-item-remove" type="button" data-action="remove" data-id="${item.id}" aria-label="Удалить ${item.name}" title="Удалить">✕</button>
    </article>
  `).join('');

  container.innerHTML = `
    <div class="cart-list">${rowsHtml}</div>
    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Товаров:</span>
        <span>${getCartCount()} шт.</span>
      </div>
      <div class="cart-summary-row total">
        <span>Итого:</span>
        <span>${formatPrice(getCartTotal(cart))}</span>
      </div>
      <button class="btn-primary" type="button" data-action="checkout">Оформить заказ</button>
    </div>
  `;
  initScrollReveal();
}

function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 350);
  }, 2600);
}

function createCheckoutModal() {
  if (document.getElementById('checkout-modal')) return;

  const modal = document.createElement('div');
  modal.className = 'checkout-modal';
  modal.id = 'checkout-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <section class="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title" tabindex="-1">
      <button class="checkout-close" type="button" data-modal-close aria-label="Закрыть окно">✕</button>
      <span class="tag">Почти ваше</span>
      <h2 id="checkout-title">Оформление <span>заказа</span></h2>
      <p class="checkout-intro">Оставьте контактные данные — мы подготовим ваш заказ.</p>
      <div class="checkout-order" id="checkout-order"></div>
      <div class="checkout-total">
        <span>Итого</span>
        <strong id="checkout-total">0 ₽</strong>
      </div>
      <form class="checkout-form" id="checkout-form">
        <label>
          <span>Ваше имя</span>
          <input type="text" name="customer-name" autocomplete="name" placeholder="Как к вам обращаться" required minlength="2" maxlength="60">
        </label>
        <label>
          <span>Телефон</span>
          <input type="tel" name="customer-phone" autocomplete="tel" placeholder="+7 (___) ___-__-__" required minlength="7" maxlength="25">
        </label>
        <button class="btn-primary" type="submit">Подтвердить заказ</button>
        <p class="checkout-note">Демонстрационная форма. Данные никуда не отправляются.</p>
      </form>
    </section>
  `;
  document.body.appendChild(modal);
}

let lastFocusedElement = null;
let scrollRevealObserver = null;

function openCheckoutModal() {
  const cart = getCart();
  if (!cart.length) return;

  createCheckoutModal();
  const modal = document.getElementById('checkout-modal');
  const order = document.getElementById('checkout-order');
  const total = document.getElementById('checkout-total');

  order.innerHTML = cart.map(item => `
    <div class="checkout-order-item">
      <span>${item.brand} ${item.name} <small>× ${item.qty}</small></span>
      <strong>${formatPrice(item.price * item.qty)}</strong>
    </div>
  `).join('');
  total.textContent = formatPrice(getCartTotal(cart));

  lastFocusedElement = document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  modal.querySelector('input').focus();
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (!modal || !modal.classList.contains('is-open')) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function initScrollReveal() {
  const revealTargets = document.querySelectorAll(
    '.section-title, .card, .contact-info, .contact-item, #contact-form, .footer-brand, .footer-col, .footer-bottom, .cart-empty, .cart-item, .cart-summary'
  );

  revealTargets.forEach(element => element.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('is-visible'));
    return;
  }

  if (!scrollRevealObserver) scrollRevealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        entry.target.classList.remove('is-visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealTargets.forEach(element => scrollRevealObserver.observe(element));
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('primary-navigation');
  if (!toggle || !navigation) return;

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
    navigation.classList.remove('is-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', event => {
    if (!navigation.contains(event.target) && !toggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    showToast('Это демонстрационная форма — сообщение не отправлено');
    form.reset();
  });
}

document.addEventListener('click', event => {
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) {
    const { action, id } = actionButton.dataset;

    if (action === 'add') addToCart(id);
    if (action === 'increase') changeQty(id, 1);
    if (action === 'decrease') changeQty(id, -1);
    if (action === 'remove') removeFromCart(id);
    if (action === 'checkout') openCheckoutModal();

    if (['increase', 'decrease', 'remove'].includes(action)) {
      renderCartPage();
      updateCartCounter();
    }
  }

  if (event.target.matches('[data-modal-close]')) closeCheckoutModal();
  if (event.target.id === 'checkout-modal') closeCheckoutModal();
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'checkout-form') return;
  event.preventDefault();
  closeCheckoutModal();
  showToast('Спасибо! Это демонстрационное оформление заказа');
});

document.addEventListener('keydown', event => {
  const modal = document.getElementById('checkout-modal');
  if (!modal?.classList.contains('is-open')) return;

  if (event.key === 'Escape') {
    closeCheckoutModal();
    return;
  }

  if (event.key === 'Tab') {
    const focusable = [...modal.querySelectorAll('button, input')]
      .filter(element => !element.disabled);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateCartCounter();
  renderCartPage();
  initScrollReveal();
  initMobileMenu();
  initContactForm();
});
