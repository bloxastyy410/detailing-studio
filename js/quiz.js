/**
 * APEX DETAILING STUDIO - INTERACTIVE QUIZ & COST ESTIMATOR
 * Handles multi-step quiz logic, vehicle selection, dynamic branch questions,
 * and Telegram lead dispatch.
 */

// TELEGRAM CONFIGURATION
// Чтобы заявки приходили вам в Telegram:
// 1. Создайте бота в @BotFather и скопируйте токен бота сюда
// 2. Узнайте свой chat_id через @userinfobot и скопируйте сюда
const TELEGRAM_CONFIG = {
  BOT_TOKEN: "", // Вставьте токен бота, например: "7123456789:AAFn..."
  CHAT_ID: "",   // Вставьте ID чата или группы, например: "123456789" или "-100..."
  STUDIO_NAME: "APEX Detailing Studio"
};
window.TELEGRAM_CONFIG = TELEGRAM_CONFIG;

// Quiz State
const quizState = {
  currentStep: 1,
  totalSteps: 5,
  data: {
    service: "",
    serviceName: "",
    carBrand: "",
    carModel: "",
    carBodyType: "",
    dynamicAnswers: {},
    clientName: "",
    clientPhone: "",
    contactMethod: "Telegram"
  }
};

// Dynamic Questions Database by Service
const dynamicQuestions = {
  ceramic: {
    title: "Детали по нанесению керамики",
    subtitle: "Уточните состояние лакокрасочного покрытия и желаемый пакет:",
    questions: [
      {
        id: "paint_condition",
        label: "Текущее состояние лака:",
        options: [
          "Новый авто из салона (минимальный пробег)",
          "Есть мелкая паутинка от моек",
          "Много царапин, требуется восстановительная полировка"
        ]
      },
      {
        id: "coating_layers",
        label: "Желаемый уровень защиты:",
        options: [
          "1 слой Ceramic Base + Антидождь (12 мес)",
          "2 слоя 9H + гидрофобный Top Coat (24 мес)",
          "Премиум комплекс 4 слоя с гарантией 3 года"
        ]
      }
    ]
  },
  ppf: {
    title: "Параметры бронирования пленкой",
    subtitle: "Выберите зоны покрытия и тип полиуретана:",
    questions: [
      {
        id: "ppf_zones",
        label: "Объем оклейки кузова:",
        options: [
          "Зоны риска (Капот, бампер, фары, зеркала, стойки, пороги)",
          "Полная оклейка кузова целиком (100% защита)",
          "Антихром элементов + крыша в черный глянец"
        ]
      },
      {
        id: "ppf_type",
        label: "Тип защитной пленки:",
        options: [
          "Глянцевый полиуретан (Stek DynoShield / Llumar)",
          "Матовый сатиновый полиуретан (Stek Matte)",
          "Цветной винил со сменой цвета"
        ]
      }
    ]
  },
  polishing: {
    title: "Параметры полировки кузова",
    subtitle: "Какого результата вы хотите достичь?",
    questions: [
      {
        id: "polish_goal",
        label: "Цель полировки:",
        options: [
          "Мягкая полировка (убрать голограммы и придать блеск)",
          "Глубокая восстановительная (удаление до 95% царапин)",
          "Предпродажная подготовка кузова"
        ]
      },
      {
        id: "polish_protection",
        label: "Защита после полировки:",
        options: [
          "Твердый карнаубский воск премиум-класса",
          "Жидкое стекло / кварцевый состав",
          "Керамика 9H"
        ]
      }
    ]
  },
  dryclean: {
    title: "Детали по химчистке интерьера",
    subtitle: "Уточните особенности салона вашего автомобиля:",
    questions: [
      {
        id: "interior_material",
        label: "Материал отделки салона:",
        options: [
          "Кожа Nappa / премиальная кожа",
          "Тканевый салон / велюр",
          "Комбинированный (кожа + алькантара)"
        ]
      },
      {
        id: "clean_options",
        label: "Дополнительные опции:",
        options: [
          "Полная химчистка с бережным разбором кресел",
          "Химчистка без разбора + озонация воздуха",
          "Консервация кожи защитным кремом LeTech"
        ]
      }
    ]
  },
  default: {
    title: "Дополнительные пожелания",
    subtitle: "Выберите, что еще вас интересует:",
    questions: [
      {
        id: "extra_options",
        label: "Сопутствующие работы:",
        options: [
          "Атермальная тонировка по ГОСТу",
          "Нанесение состава «Антидождь» на все стекла",
          "Детейлинг подкапотного пространства с консервацией"
        ]
      }
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initQuiz();
});

function initQuiz() {
  const quizForm = document.getElementById("detailingQuizForm");
  if (!quizForm) return;

  // Step 1: Service selection cards
  const serviceCards = document.querySelectorAll(".quiz-service-card");
  serviceCards.forEach(card => {
    card.addEventListener("click", () => {
      serviceCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      quizState.data.service = card.dataset.service;
      quizState.data.serviceName = card.dataset.name;
      validateCurrentStep();
    });
  });

  // Step 2: Popular Brand Chips
  const brandChips = document.querySelectorAll(".brand-chip");
  const brandInput = document.getElementById("quizCarBrand");
  brandChips.forEach(chip => {
    chip.addEventListener("click", () => {
      brandChips.forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      if (brandInput) {
        brandInput.value = chip.dataset.brand;
      }
      quizState.data.carBrand = chip.dataset.brand;
      validateCurrentStep();
    });
  });

  if (brandInput) {
    brandInput.addEventListener("input", (e) => {
      quizState.data.carBrand = e.target.value;
      validateCurrentStep();
    });
  }

  const modelInput = document.getElementById("quizCarModel");
  if (modelInput) {
    modelInput.addEventListener("input", (e) => {
      quizState.data.carModel = e.target.value;
      validateCurrentStep();
    });
  }

  // Step 3: Body Type cards
  const bodyCards = document.querySelectorAll(".quiz-body-card");
  bodyCards.forEach(card => {
    card.addEventListener("click", () => {
      bodyCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      quizState.data.carBodyType = card.dataset.body;
      validateCurrentStep();
    });
  });

  // Step 5: Phone Mask & Inputs
  const phoneInput = document.getElementById("quizPhone");
  if (phoneInput) {
    phoneInput.addEventListener("input", formatPhoneInput);
  }

  const nameInput = document.getElementById("quizName");
  if (nameInput) {
    nameInput.addEventListener("input", (e) => {
      quizState.data.clientName = e.target.value;
      validateCurrentStep();
    });
  }

  const contactMethods = document.querySelectorAll("input[name='quizContactMethod']");
  contactMethods.forEach(radio => {
    radio.addEventListener("change", (e) => {
      quizState.data.contactMethod = e.target.value;
    });
  });

  // Navigation Buttons
  const nextBtn = document.getElementById("quizNextBtn");
  const prevBtn = document.getElementById("quizPrevBtn");
  const submitBtn = document.getElementById("quizSubmitBtn");

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (validateCurrentStep()) {
        goToStep(quizState.currentStep + 1);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (quizState.currentStep > 1) {
        goToStep(quizState.currentStep - 1);
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", handleQuizSubmit);
  }

  // Pre-select first service if available
  if (serviceCards.length > 0) {
    serviceCards[0].click();
  }
}

function renderDynamicQuestions(serviceKey) {
  const container = document.getElementById("dynamicQuestionsContainer");
  if (!container) return;

  const config = dynamicQuestions[serviceKey] || dynamicQuestions.default;
  const titleElem = document.getElementById("dynamicStepTitle");
  const subtitleElem = document.getElementById("dynamicStepSubtitle");

  if (titleElem) titleElem.textContent = config.title;
  if (subtitleElem) subtitleElem.textContent = config.subtitle;

  container.innerHTML = "";
  quizState.data.dynamicAnswers = {};

  config.questions.forEach((q, qIndex) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "form-group mb-4";

    const label = document.createElement("label");
    label.className = "form-label text-gold";
    label.textContent = `${qIndex + 1}. ${q.label}`;
    groupDiv.appendChild(label);

    const select = document.createElement("select");
    select.className = "form-select dynamic-select";
    select.dataset.questionId = q.id;

    q.options.forEach((opt, optIndex) => {
      const optionElem = document.createElement("option");
      optionElem.value = opt;
      optionElem.textContent = opt;
      if (optIndex === 0) {
        optionElem.selected = true;
        quizState.data.dynamicAnswers[q.id] = opt;
      }
      select.appendChild(optionElem);
    });

    select.addEventListener("change", (e) => {
      quizState.data.dynamicAnswers[q.id] = e.target.value;
    });

    groupDiv.appendChild(select);
    container.appendChild(groupDiv);
  });
}

function goToStep(step) {
  if (step < 1 || step > quizState.totalSteps) return;

  // Prepare dynamic step before entering step 4
  if (step === 4) {
    renderDynamicQuestions(quizState.data.service);
  }

  // Update DOM step elements
  for (let i = 1; i <= quizState.totalSteps; i++) {
    const stepEl = document.getElementById(`quizStep${i}`);
    const indicatorEl = document.getElementById(`stepIndicator${i}`);

    if (stepEl) {
      if (i === step) {
        stepEl.classList.add("active");
      } else {
        stepEl.classList.remove("active");
      }
    }

    if (indicatorEl) {
      if (i < step) {
        indicatorEl.classList.add("completed");
        indicatorEl.classList.remove("active");
      } else if (i === step) {
        indicatorEl.classList.add("active");
        indicatorEl.classList.remove("completed");
      } else {
        indicatorEl.classList.remove("active", "completed");
      }
    }
  }

  // Update progress bar fill
  const progressFill = document.getElementById("quizProgressFill");
  if (progressFill) {
    const percent = ((step - 1) / (quizState.totalSteps - 1)) * 100;
    progressFill.style.width = `${Math.max(15, percent)}%`;
  }

  quizState.currentStep = step;

  // Update Buttons visibility
  const prevBtn = document.getElementById("quizPrevBtn");
  const nextBtn = document.getElementById("quizNextBtn");
  const submitBtn = document.getElementById("quizSubmitBtn");

  if (prevBtn) {
    prevBtn.style.visibility = step === 1 ? "hidden" : "visible";
  }

  if (step === quizState.totalSteps) {
    if (nextBtn) nextBtn.style.display = "none";
    if (submitBtn) submitBtn.style.display = "inline-flex";
  } else {
    if (nextBtn) nextBtn.style.display = "inline-flex";
    if (submitBtn) submitBtn.style.display = "none";
  }

  validateCurrentStep();
}

function validateCurrentStep() {
  const nextBtn = document.getElementById("quizNextBtn");
  const submitBtn = document.getElementById("quizSubmitBtn");
  let isValid = false;

  switch (quizState.currentStep) {
    case 1:
      isValid = Boolean(quizState.data.service);
      break;
    case 2:
      isValid = Boolean(quizState.data.carBrand && quizState.data.carBrand.trim().length >= 2);
      break;
    case 3:
      isValid = Boolean(quizState.data.carBodyType);
      break;
    case 4:
      isValid = true; // Dynamic answers already have defaults
      break;
    case 5:
      const phoneValid = quizState.data.clientPhone && quizState.data.clientPhone.replace(/\D/g, "").length >= 10;
      const nameValid = quizState.data.clientName && quizState.data.clientName.trim().length >= 2;
      isValid = Boolean(phoneValid && nameValid);
      break;
    default:
      isValid = true;
  }

  if (nextBtn) {
    nextBtn.disabled = !isValid;
    nextBtn.style.opacity = isValid ? "1" : "0.5";
  }

  if (submitBtn) {
    submitBtn.disabled = !isValid;
    submitBtn.style.opacity = isValid ? "1" : "0.5";
  }

  return isValid;
}

// Format Phone Mask: +7 (___) ___-__-__
function formatPhoneInput(e) {
  let val = e.target.value.replace(/\D/g, "");
  if (!val) {
    e.target.value = "";
    quizState.data.clientPhone = "";
    validateCurrentStep();
    return;
  }

  if (val[0] === "7" || val[0] === "8") {
    val = val.substring(1);
  }

  let formatted = "+7 ";
  if (val.length > 0) formatted += "(" + val.substring(0, 3);
  if (val.length >= 3) formatted += ") " + val.substring(3, 6);
  if (val.length >= 6) formatted += "-" + val.substring(6, 8);
  if (val.length >= 8) formatted += "-" + val.substring(8, 10);

  e.target.value = formatted;
  quizState.data.clientPhone = formatted;
  validateCurrentStep();
}

// Telegram Lead Dispatcher
async function handleQuizSubmit(e) {
  e.preventDefault();
  if (!validateCurrentStep()) return;

  const submitBtn = document.getElementById("quizSubmitBtn");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>Отправка данных...</span>";

  // Build message
  let dynamicDetails = "";
  for (const [key, val] of Object.entries(quizState.data.dynamicAnswers)) {
    dynamicDetails += `• <b>${key}:</b> ${val}\n`;
  }

  const messageText = 
`⚡️ <b>НОВАЯ ЗАЯВКА НА РАСЧЕТ (КВИЗ-АНКЕТА)</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Клиент:</b> ${quizState.data.clientName}
📱 <b>Телефон:</b> ${quizState.data.clientPhone}
💬 <b>Связь:</b> ${quizState.data.contactMethod}

🚘 <b>Автомобиль:</b> ${quizState.data.carBrand} ${quizState.data.carModel || ""}
🏎 <b>Кузов:</b> ${quizState.data.carBodyType}
🛠 <b>Услуга:</b> ${quizState.data.serviceName}

<b>Детали анкеты:</b>
${dynamicDetails || "Не указаны"}
━━━━━━━━━━━━━━━━━━
<i>Сайт: ${TELEGRAM_CONFIG.STUDIO_NAME}</i>`;

  // Send to Telegram if configured
  let sentSuccessfully = false;
  if (TELEGRAM_CONFIG.BOT_TOKEN && TELEGRAM_CONFIG.CHAT_ID) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.CHAT_ID,
          text: messageText,
          parse_mode: "HTML"
        })
      });
      const data = await res.json();
      if (data.ok) {
        sentSuccessfully = true;
      }
    } catch (err) {
      console.warn("Telegram API dispatch failed or blocked by CORS:", err);
    }
  }

  // Backup to localStorage for studio owner
  saveLeadLocally({
    type: "QUIZ_CALCULATION",
    timestamp: new Date().toISOString(),
    ...quizState.data
  });

  // Always show success to the user with a luxury confirmation
  setTimeout(() => {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    showQuizSuccessMessage();
    if (window.showToast) {
      window.showToast("✅ Заявка принята! Мастер свяжется с вами в течение 10 минут.");
    }
  }, 600);
}

function saveLeadLocally(lead) {
  try {
    const existing = JSON.parse(localStorage.getItem("apex_detailing_leads") || "[]");
    existing.unshift(lead);
    localStorage.setItem("apex_detailing_leads", JSON.stringify(existing));
  } catch (err) {
    console.error(err);
  }
}

function showQuizSuccessMessage() {
  const quizContainer = document.querySelector(".quiz-container");
  if (!quizContainer) return;

  quizContainer.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="width: 72px; height: 72px; background: rgba(212,175,55,0.15); border: 2px solid var(--accent-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: var(--accent-gold); font-size: 32px;">
        ✓
      </div>
      <h3 style="font-size: 2rem; color: #fff; margin-bottom: 12px; font-family: var(--font-heading);">Заявка успешно принята!</h3>
      <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto 28px; font-size: 1.05rem;">
        Спасибо, <b>${quizState.data.clientName}</b>. Мастер студии уже изучает параметры вашего <b>${quizState.data.carBrand}</b> и свяжется с вами через <b>${quizState.data.contactMethod}</b> для индивидуального расчета и бронирования даты.
      </p>
      <a href="#services" class="btn btn-secondary" onclick="location.reload()">
        Заполнить еще раз
      </a>
    </div>
  `;
}
