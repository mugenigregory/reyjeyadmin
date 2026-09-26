/*
  JEYREY STOREFRONT LOGIC
  ------------------------
  No framework, no dummy products.

  Data flow:
    GET /api/products
        ↓
    in-memory catalog
        ↓
    search/category/sort
        ↓
    cart state
        ↓
    POST /api/orders

  The UI deliberately tolerates an empty API response instead of inventing
  catalog content. That keeps the storefront tied to the admin database.
*/

(() => {
  "use strict";

  const state = {
    products: [],
    filtered: [],
    category: "All",
    search: "",
    sort: "latest",
    cart: loadCart(),
    selectedProduct: null,
  };

  const $ = (selector) => document.querySelector(selector);

  const els = {
    searchToggle: $("#searchToggle"),
    searchPanel: $("#searchPanel"),
    searchInput: $("#searchInput"),
    searchClear: $("#searchClear"),
    shopNow: $("#shopNow"),
    featuredScroll: $("#featuredScroll"),
    catalog: $("#catalog"),
    categoryRow: $("#categoryRow"),
    featuredStrip: $("#featuredStrip"),
    productGrid: $("#productGrid"),
    resultCount: $("#resultCount"),
    catalogTitle: $("#catalogTitle"),
    sortSelect: $("#sortSelect"),

    cartOpen: $("#cartOpen"),
    cartClose: $("#cartClose"),
    cartOverlay: $("#cartOverlay"),
    cartDrawer: $("#cartDrawer"),
    cartItems: $("#cartItems"),
    cartCount: $("#cartCount"),
    cartTotal: $("#cartTotal"),
    checkoutOpen: $("#checkoutOpen"),

    productModal: $("#productModal"),
    modalMedia: $("#modalMedia"),
    modalBadge: $("#modalBadge"),
    modalTitle: $("#modalTitle"),
    modalPrice: $("#modalPrice"),
    modalDescription: $("#modalDescription"),
    modalStock: $("#modalStock"),
    modalAdd: $("#modalAdd"),

    checkoutModal: $("#checkoutModal"),
    checkoutClose: $("#checkoutClose"),
    checkoutForm: $("#checkoutForm"),
    checkoutTotal: $("#checkoutTotal"),
    checkoutMessage: $("#checkoutMessage"),
    placeOrder: $("#placeOrder"),

    toast: $("#toast"),
    year: $("#year"),
  };

  // -----------------------------------------
  // Helpers
  // -----------------------------------------

  function formatUGX(value) {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }

  function productId(product) {
    return String(product.id || product._id || "");
  }

  function productImage(product) {
    return product.image || "/icon.png";
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2300);
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("jeyrey_cart_v1")) || [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem("jeyrey_cart_v1", JSON.stringify(state.cart));
  }

  function getCartCount() {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function getCartTotal() {
    return state.cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0
    );
  }

  function setBodyLock(locked) {
    document.body.classList.toggle("no-scroll", locked);
  }

  // -----------------------------------------
  // API
  // -----------------------------------------

  async function fetchProducts() {
    const response = await fetch("/api/products", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Products could not be loaded.");
    }

    const products = await response.json();
    return Array.isArray(products) ? products : [];
  }

  async function createOrder(payload) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || "We could not create the order.");
    }

    return data;
  }

  // -----------------------------------------
  // Catalog
  // -----------------------------------------

  function buildCategories() {
    const categories = [
      "All",
      ...new Set(
        state.products
          .map((product) => String(product.category || "").trim())
          .filter(Boolean)
          .map((category) => category.charAt(0).toUpperCase() + category.slice(1))
      ),
    ];

    els.categoryRow.innerHTML = categories
      .map((category) => `
        <button
          class="category-chip ${category.toLowerCase() === state.category.toLowerCase() ? "active" : ""}"
          data-category="${escapeHTML(category)}"
          type="button"
        >
          ${escapeHTML(category)}
        </button>
      `)
      .join("");

    els.categoryRow.querySelectorAll(".category-chip").forEach((button) => {
      button.addEventListener("click", () => {
        state.category = button.dataset.category;
        buildCategories();
        applyFilters();
      });
    });
  }

  function applyFilters() {
    let products = [...state.products];

    const search = state.search.trim().toLowerCase();

    if (state.category !== "All") {
      products = products.filter(
        (product) =>
          String(product.category || "").toLowerCase() ===
          state.category.toLowerCase()
      );
    }

    if (search) {
      products = products.filter((product) => {
        const haystack = [
          product.title,
          product.description,
          product.category,
          ...(Array.isArray(product.tags) ? product.tags : []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    products.sort((a, b) => {
      if (state.sort === "price-low") {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (state.sort === "price-high") {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      if (state.sort === "name") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    state.filtered = products;
    renderProducts();
  }

  function renderProducts() {
    const total = state.filtered.length;

    els.resultCount.textContent = `${total} ${total === 1 ? "item" : "items"}`;

    els.catalogTitle.textContent =
      state.search
        ? `Results for “${state.search}”`
        : state.category === "All"
          ? "Latest drops"
          : state.category;

    if (!total) {
      els.productGrid.innerHTML = `
        <div class="empty-state">
          <strong>No products found</strong>
          <p>Try another search or category.</p>
        </div>
      `;
      return;
    }

    els.productGrid.innerHTML = state.filtered
      .map((product, index) => {
        const stock = Number(product.stock ?? 0);
        const low = stock > 0 && stock <= 5;

        return `
          <article class="product-card" style="animation-delay:${Math.min(index * 35, 250)}ms">
            <div class="product-image" data-product="${productId(product)}">
              ${
                product.featured
                  ? `<span class="product-badge">Featured</span>`
                  : ""
              }

              <img
                src="${escapeHTML(productImage(product))}"
                alt="${escapeHTML(product.title || "Product")}"
                loading="lazy"
                onerror="this.src='/icon.png'"
              />

              <button
                class="quick-add"
                type="button"
                data-add="${productId(product)}"
                aria-label="Add ${escapeHTML(product.title || "product")} to bag"
                ${stock <= 0 ? "disabled" : ""}
              >+</button>
            </div>

            <div class="product-copy">
              <div class="product-category">${escapeHTML(product.category || "General")}</div>
              <div class="product-title">${escapeHTML(product.title || "Untitled product")}</div>

              <div class="product-bottom">
                <strong class="product-price">${formatUGX(product.price)}</strong>
                <span class="stock ${low ? "low" : ""}">
                  ${stock <= 0 ? "Out of stock" : low ? `${stock} left` : `${stock} available`}
                </span>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    // Quick add buttons should not open the product modal.
    els.productGrid.querySelectorAll("[data-add]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        addToCart(button.dataset.add);
      });
    });

    els.productGrid.querySelectorAll(".product-image").forEach((image) => {
      image.addEventListener("click", () => openProduct(image.dataset.product));
    });
  }

  function renderFeatured() {
    const featured = state.products.filter((product) => product.featured);
    const source = featured.length ? featured : state.products.slice(0, 6);

    if (!source.length) {
      els.featuredStrip.innerHTML = "";
      return;
    }

    els.featuredStrip.innerHTML = source
      .slice(0, 8)
      .map((product) => `
        <article class="featured-card" data-featured="${productId(product)}">
          <img
            src="${escapeHTML(productImage(product))}"
            alt="${escapeHTML(product.title || "Product")}"
            loading="lazy"
            onerror="this.src='/icon.png'"
          />
          <div class="featured-copy">
            <small>${escapeHTML(product.category || "Featured")}</small>
            <strong>${escapeHTML(product.title || "New favourite")}</strong>
            <span>${formatUGX(product.price)}</span>
          </div>
        </article>
      `)
      .join("");

    els.featuredStrip.querySelectorAll("[data-featured]").forEach((card) => {
      card.addEventListener("click", () => openProduct(card.dataset.featured));
    });
  }

  // -----------------------------------------
  // Product modal
  // -----------------------------------------

  function findProduct(id) {
    return state.products.find((product) => productId(product) === String(id));
  }

  function openProduct(id) {
    const product = findProduct(id);
    if (!product) return;

    state.selectedProduct = product;

    els.modalMedia.innerHTML = `
      <img
        src="${escapeHTML(productImage(product))}"
        alt="${escapeHTML(product.title || "Product")}"
        onerror="this.src='/icon.png'"
      />
    `;

    els.modalBadge.textContent = product.featured ? "Featured" : (product.category || "Product");
    els.modalTitle.textContent = product.title || "Product";
    els.modalPrice.textContent = formatUGX(product.price);
    els.modalDescription.textContent =
      product.description || "A Jeyrey product ready to discover.";
    els.modalStock.textContent =
      Number(product.stock || 0) > 0
        ? `${product.stock} available`
        : "Currently out of stock";

    els.modalAdd.disabled = Number(product.stock || 0) <= 0;
    els.modalAdd.textContent =
      Number(product.stock || 0) <= 0 ? "Out of stock" : "Add to bag +";

    els.productModal.hidden = false;
    setBodyLock(true);
  }

  function closeProduct() {
    els.productModal.hidden = true;
    state.selectedProduct = null;

    if (els.cartDrawer.classList.contains("open") === false) {
      setBodyLock(false);
    }
  }

  // -----------------------------------------
  // Cart
  // -----------------------------------------

  function addToCart(id) {
    const product = findProduct(id);
    if (!product || Number(product.stock || 0) <= 0) {
      showToast("This product is currently out of stock.");
      return;
    }

    const existing = state.cart.find((item) => item.id === id);

    if (existing) {
      if (existing.quantity >= Number(product.stock)) {
        showToast("You've reached the available stock.");
        return;
      }
      existing.quantity += 1;
    } else {
      state.cart.push({
        id,
        title: product.title,
        price: Number(product.price || 0),
        image: productImage(product),
        quantity: 1,
      });
    }

    saveCart();
    renderCart();
    showToast("Added to your bag ✦");
  }

  function changeQuantity(id, delta) {
    const item = state.cart.find((entry) => entry.id === id);
    const product = findProduct(id);

    if (!item) return;

    const maxStock = Number(product?.stock ?? Infinity);
    item.quantity += delta;

    if (item.quantity > maxStock) {
      item.quantity = maxStock;
      showToast("That's all the available stock.");
    }

    if (item.quantity <= 0) {
      state.cart = state.cart.filter((entry) => entry.id !== id);
    }

    saveCart();
    renderCart();
  }

  function renderCart() {
    const count = getCartCount();
    const total = getCartTotal();

    els.cartCount.textContent = count;
    els.cartTotal.textContent = formatUGX(total);
    els.checkoutTotal.textContent = formatUGX(total);
    els.checkoutOpen.disabled = state.cart.length === 0;

    if (!state.cart.length) {
      els.cartItems.innerHTML = `
        <div class="empty-state">
          <strong>Your bag is waiting.</strong>
          <p>Add something you love and it’ll appear here.</p>
        </div>
      `;
      return;
    }

    els.cartItems.innerHTML = state.cart
      .map((item) => `
        <div class="cart-row">
          <img src="${escapeHTML(item.image)}" alt="" onerror="this.src='/icon.png'" />

          <div>
            <strong>${escapeHTML(item.title)}</strong>
            <small>${formatUGX(item.price)} each</small>

            <div class="qty-controls">
              <button type="button" data-minus="${item.id}" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-plus="${item.id}" aria-label="Increase quantity">+</button>
            </div>
          </div>

          <strong>${formatUGX(item.price * item.quantity)}</strong>
        </div>
      `)
      .join("");

    els.cartItems.querySelectorAll("[data-minus]").forEach((button) => {
      button.addEventListener("click", () => changeQuantity(button.dataset.minus, -1));
    });

    els.cartItems.querySelectorAll("[data-plus]").forEach((button) => {
      button.addEventListener("click", () => changeQuantity(button.dataset.plus, 1));
    });
  }

  function openCart() {
    renderCart();
    els.cartOverlay.hidden = false;
    els.cartDrawer.classList.add("open");
    els.cartDrawer.setAttribute("aria-hidden", "false");
    setBodyLock(true);
  }

  function closeCart() {
    els.cartDrawer.classList.remove("open");
    els.cartDrawer.setAttribute("aria-hidden", "true");
    els.cartOverlay.hidden = true;

    if (els.productModal.hidden && els.checkoutModal.hidden) {
      setBodyLock(false);
    }
  }

  // -----------------------------------------
  // Checkout
  // -----------------------------------------

  function openCheckout() {
    if (!state.cart.length) {
      showToast("Your bag is empty.");
      return;
    }

    els.checkoutTotal.textContent = formatUGX(getCartTotal());
    els.checkoutMessage.textContent = "";
    els.checkoutMessage.className = "form-message";
    els.checkoutModal.hidden = false;
    setBodyLock(true);
  }

  function closeCheckout() {
    els.checkoutModal.hidden = true;

    if (!els.cartDrawer.classList.contains("open")) {
      setBodyLock(false);
    }
  }

  async function submitOrder(event) {
    event.preventDefault();

    if (!state.cart.length) return;

    const customerName = new FormData(els.checkoutForm).get("customerName").trim();

    if (!customerName) return;

    els.placeOrder.disabled = true;
    els.placeOrder.textContent = "Creating order…";
    els.checkoutMessage.textContent = "";
    els.checkoutMessage.className = "form-message";

    try {
      const data = await createOrder({
        customerName,
        items: state.cart.map((item) => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        total: getCartTotal(),
        status: "pending",
      });

      state.cart = [];
      saveCart();
      renderCart();

      els.checkoutMessage.textContent =
        `Order ${data.order?.id ? "#" + String(data.order.id).slice(-6).toUpperCase() : ""} created successfully.`;
      els.checkoutMessage.className = "form-message success";
      els.checkoutForm.reset();

      setTimeout(() => {
        closeCheckout();
        closeCart();
        showToast("Order received. Thank you ✦");
      }, 1200);
    } catch (error) {
      console.error("Checkout error:", error);
      els.checkoutMessage.textContent = error.message;
      els.checkoutMessage.className = "form-message error";
    } finally {
      els.placeOrder.disabled = false;
      els.placeOrder.innerHTML = `Place order <span>→</span>`;
    }
  }

  // -----------------------------------------
  // Events
  // -----------------------------------------

  els.searchToggle.addEventListener("click", () => {
    const open = els.searchPanel.classList.toggle("open");
    if (open) {
      els.searchInput.focus();
    }
  });

  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value;
    applyFilters();
  });

  els.searchClear.addEventListener("click", () => {
    els.searchInput.value = "";
    state.search = "";
    applyFilters();
    els.searchInput.focus();
  });

  els.shopNow.addEventListener("click", () => {
    els.catalog.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.featuredScroll.addEventListener("click", () => {
    els.featuredStrip.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  els.sortSelect.addEventListener("change", () => {
    state.sort = els.sortSelect.value;
    applyFilters();
  });

  els.cartOpen.addEventListener("click", openCart);
  els.cartClose.addEventListener("click", closeCart);
  els.cartOverlay.addEventListener("click", closeCart);

  els.modalAdd.addEventListener("click", () => {
    if (state.selectedProduct) {
      addToCart(productId(state.selectedProduct));
      closeProduct();
      openCart();
    }
  });

  els.productModal.addEventListener("click", (event) => {
    if (event.target === els.productModal) closeProduct();
  });

  document.querySelectorAll(".modal-close").forEach((button) => {
    if (button !== els.checkoutClose) {
      button.addEventListener("click", closeProduct);
    }
  });

  els.checkoutOpen.addEventListener("click", openCheckout);
  els.checkoutClose.addEventListener("click", closeCheckout);
  els.checkoutModal.addEventListener("click", (event) => {
    if (event.target === els.checkoutModal) closeCheckout();
  });

  els.checkoutForm.addEventListener("submit", submitOrder);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeProduct();
    closeCheckout();
    closeCart();
    els.searchPanel.classList.remove("open");
  });

  // -----------------------------------------
  // Boot
  // -----------------------------------------

  async function init() {
    els.year.textContent = new Date().getFullYear();
    renderCart();

    try {
      state.products = await fetchProducts();
      buildCategories();
      renderFeatured();
      applyFilters();
    } catch (error) {
      console.error("Storefront bootstrap failed:", error);

      els.resultCount.textContent = "Unavailable";
      els.productGrid.innerHTML = `
        <div class="empty-state">
          <strong>We couldn't load the store.</strong>
          <p>Make sure the server is running and MongoDB is connected, then refresh.</p>
        </div>
      `;
    }
  }

  init();
})();
