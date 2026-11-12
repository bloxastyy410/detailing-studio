/**
 * APEX DETAILING STUDIO - MAIN INTERACTIVE SCRIPT
 * Nav, Before/After Slider, Portfolio Filters, Booking Modal, Toast Alerts & Admin Mode
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMobileMenu();
  initBeforeAfterSlider();
  initPortfolioFilters();
  initBookingModal();
  initSecretAdminShortcut();
});

/* ==========================================================================
   1. NAVBAR SCROLL EFFECT
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector(".header");
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
}

/* ==========================================================================
   2. MOBILE DRAWER MENU
   ========================================================================== */
function initMobileMenu() {
  const burger = document.querySelector(".burger-btn");
  const menu = document.querySelector(".nav-menu");
  const links = document.querySelectorAll(".nav-link");

  if (!burger || !menu) return;

  const toggle = () => {
    menu.classList.toggle("open");
    document.body.style.overflow = menu.classList.contains("open") ? "hidden" : "";
  };

  burger.addEventListener("click", toggle);

  links.forEach(link => {
    link.addEventListener("click", () => {
      if (menu.classList.contains("open")) {
        toggle();
      }
    });
  });
}

/* ==========================================================================
   3. BEFORE / AFTER COMPARISON SLIDER (MOUSE + TOUCH)
   ========================================================================== */
function initBeforeAfterSlider() {
  const wrapper = document.querySelector(".before-after-wrapper");
  const afterImg = document.querySelector(".ba-after");
  const handle = document.querySelector(".ba-slider-handle");
  const rangeInput = document.querySelector(".ba-range-input");

  if (!wrapper || !afterImg || !handle || !rangeInput) return;

  const updatePosition = (val) => {
    afterImg.style.width = `${val}%`;
    handle.style.left = `${val}%`;
  };

  rangeInput.addEventListener("input", (e) => {
    updatePosition(e.target.value);
  });

  // Touch & Drag support
  let isDragging = false;

  const getPercentageFromEvent = (e) => {
    const rect = wrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offset = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (offset / rect.width) * 100));
    return pct;
  };

  const startDrag = (e) => {
    isDragging = true;
    const pct = getPercentageFromEvent(e);
    updatePosition(pct);
    rangeInput.value = pct;
  };

  const onDrag = (e) => {
    if (!isDragging) return;
    const pct = getPercentageFromEvent(e);
    updatePosition(pct);
    rangeInput.value = pct;
  };

  const stopDrag = () => {
    isDragging = false;
  };

  wrapper.addEventListener("mousedown", startDrag);
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);

  wrapper.addEventListener("touchstart", startDrag, { passive: true });
  window.addEventListener("touchmove", onDrag, { passive: true });
  window.addEventListener("touchend", stopDrag);
}

/* ==========================================================================
   4. PORTFOLIO FILTERS
   ========================================================================== */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const galleryCards = document.querySelectorAll(".gallery-card");

  if (!filterBtns.length || !galleryCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.dataset.filter;

      galleryCards.forEach(card => {
        if (category === "all" || card.dataset.category === category) {
          card.style.display = "block";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "scale(1)";
          }, 10);
        } else {
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
          setTimeout(() => {
            card.style.display = "none";
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   5. BOOKING MODAL (SECTION 4 OF SPEC)
   ========================================================================== */
function initBookingModal() {
  const modalBackdrop = document.getElementById("bookingModal");
  const openBtns = document.querySelectorAll("[data-open-modal='bookingModal']");
  const closeBtn = document.getElementById("closeBookingModal");
  const form = document.getElementById("bookingDirectForm");
  const phoneInput = document.getElementById("bookingPhone");

  if (!modalBackdrop) return;

  const openModal = (defaultService = "") => {
    modalBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
    if (defaultService) {
      const serviceSelect = document.getElementById("bookingService");
      if (serviceSelect) serviceSelect.value = defaultService;
    }
  };

  const closeModal = () => {
    modalBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  };

  openBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const srv = btn.dataset.service || "";
      openModal(srv);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("active")) {
      closeModal();
    }
  });

  // Phone input mask for booking modal
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "");
      if (!val) {
        e.target.value = "";
        return;
      }
      if (val[0] === "7" || val[0] === "8") val = val.substring(1);

      let formatted = "+7 ";
      if (val.length > 0) formatted += "(" + val.substring(0, 3);
      if (val.length >= 3) formatted += ") " + val.substring(3, 6);
      if (val.length >= 6) formatted += "-" + val.substring(6, 8);
      if (val.length >= 8) formatted += "-" + val.substring(8, 10);
      e.target.value = formatted;
    });
  }

  // Handle direct booking submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>Отправка записи...</span>";

      const name = document.getElementById("bookingName").value.trim();
      const phone = document.getElementById("bookingPhone").value.trim();
      const car = document.getElementById("bookingCar").value.trim();
      const service = document.getElementById("bookingService").value;
      const date = document.getElementById("bookingDate").value;
      const comment = document.getElementById("bookingComment").value.trim();

      const messageText = 
`📅 <b>НОВАЯ ЗАПИСЬ НА ДЕТЕЙЛИНГ</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Клиент:</b> ${name}
📱 <b>Телефон:</b> ${phone}
🚘 <b>Автомобиль:</b> ${car}
🛠 <b>Услуга:</b> ${service}
🗓 <b>Желаемая дата:</b> ${date || "Как можно скорее"}
📝 <b>Комментарий:</b> ${comment || "Нет"}
━━━━━━━━━━━━━━━━━━
<i>Сайт: APEX Detailing Studio</i>`;

      // Send to Telegram if configured
      if (window.TELEGRAM_CONFIG && window.TELEGRAM_CONFIG.BOT_TOKEN && window.TELEGRAM_CONFIG.CHAT_ID) {
        try {
          await fetch(`https://api.telegram.org/bot${window.TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: window.TELEGRAM_CONFIG.CHAT_ID,
              text: messageText,
              parse_mode: "HTML"
            })
          });
        } catch (err) {
          console.warn("Telegram submit error:", err);
        }
      }

      // Save locally
      try {
        const existing = JSON.parse(localStorage.getItem("apex_detailing_leads") || "[]");
        existing.unshift({
          type: "DIRECT_BOOKING",
          name, phone, car, service, date, comment,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem("apex_detailing_leads", JSON.stringify(existing));
      } catch (err) {}

      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        closeModal();
        form.reset();
        showToast("⭐️ Запись успешно отправлена! Мы свяжемся с вами для подтверждения времени.");
      }, 500);
    });
  }
}

/* ==========================================================================
   6. TOAST NOTIFICATION SYSTEM
   ========================================================================== */
window.showToast = function(message) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.4s ease";
    setTimeout(() => toast.remove(), 400);
  }, 4500);
};

/* ==========================================================================
   7. SECRET ADMIN SHORTCUT (Ctrl + Shift + A or Double Click on Logo)
   Allows the owner to inspect leads saved locally without leaving the page!
   ========================================================================== */
function initSecretAdminShortcut() {
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.addEventListener("dblclick", () => {
      openAdminLeadsModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a" || e.key === "Ф" || e.key === "ф")) {
      e.preventDefault();
      openAdminLeadsModal();
    }
  });
}

function openAdminLeadsModal() {
  const existing = JSON.parse(localStorage.getItem("apex_detailing_leads") || "[]");
  
  let modal = document.getElementById("adminLeadsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "adminLeadsModal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal-window" style="max-width: 780px;">
        <button class="modal-close" onclick="document.getElementById('adminLeadsModal').classList.remove('active')">&times;</button>
        <div class="section-tag" style="margin-bottom: 8px;">Панель владельца</div>
        <h3 class="section-title" style="font-size: 1.6rem; margin-bottom: 20px;">Заявки с сайта (Local Storage)</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
          Здесь дублируются все отправленные заявки из квиза и формы записи.
        </p>
        <div id="adminLeadsList" style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-secondary btn-sm" onclick="localStorage.removeItem('apex_detailing_leads'); openAdminLeadsModal();">
            Очистить историю
          </button>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('adminLeadsModal').classList.remove('active')">
            Закрыть
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const listContainer = modal.querySelector("#adminLeadsList");
  if (!existing.length) {
    listContainer.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 30px;">Заявок пока нет. Отправьте тестовую заявку через форму на сайте!</div>`;
  } else {
    listContainer.innerHTML = existing.map((lead, idx) => {
      const date = new Date(lead.timestamp).toLocaleString("ru-RU");
      return `
        <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 700; color: var(--accent-gold); font-size: 0.9rem;">#${idx + 1} ${lead.type === "DIRECT_BOOKING" ? "Запись на услугу" : "Квиз-расчет"}</span>
            <span style="font-size: 0.75rem; color: var(--text-dim);">${date}</span>
          </div>
          <div style="color: #fff; font-size: 0.95rem; margin-bottom: 4px;"><b>Клиент:</b> ${lead.clientName || lead.name} (${lead.clientPhone || lead.phone})</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;"><b>Авто:</b> ${lead.carBrand || lead.car} ${lead.carModel || ""}</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;"><b>Услуга:</b> ${lead.serviceName || lead.service}</div>
        </div>
      `;
    }).join("");
  }

  modal.classList.add("active");
}
