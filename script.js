document.addEventListener('DOMContentLoaded', () => {
  // 1. Dinámica de cuenta regresiva
  initCountdown();

  // 2. Manejo de formulario de suscripción
  initSubscriptionForm();

  // 3. Año dinámico en el footer
  initFooterYear();
});

function initCountdown() {
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  // Guarda una fecha objetivo de lanzamiento de 14 días a partir de la primera visita
  // (o puedes cambiar esta fecha fija por la que desees: ej. new Date('2026-12-31T00:00:00'))
  let targetDateMs = localStorage.getItem('launch_target_date');
  if (!targetDateMs || isNaN(targetDateMs)) {
    const defaultTarget = new Date();
    defaultTarget.setDate(defaultTarget.getDate() + 14);
    defaultTarget.setHours(12, 0, 0, 0);
    targetDateMs = defaultTarget.getTime();
    localStorage.setItem('launch_target_date', targetDateMs);
  } else {
    targetDateMs = parseInt(targetDateMs, 10);
  }

  function update() {
    const now = new Date().getTime();
    let diff = targetDateMs - now;

    // Si la fecha ya pasó, reiniciar a 7 días más adelante para demostración
    if (diff <= 0) {
      const renew = new Date();
      renew.setDate(renew.getDate() + 7);
      targetDateMs = renew.getTime();
      localStorage.setItem('launch_target_date', targetDateMs);
      diff = targetDateMs - now;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

function initSubscriptionForm() {
  const form = document.getElementById('subscribe-form');
  const emailInput = document.getElementById('email-input');
  const feedbackEl = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('submit-btn');

  if (!form || !emailInput || !feedbackEl) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFeedback('Por favor introduce un correo electrónico válido.', 'error');
      emailInput.focus();
      return;
    }

    // Deshabilitar botón durante el proceso
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      // Guardar localmente
      const subscribers = JSON.parse(localStorage.getItem('subscribed_emails') || '[]');
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('subscribed_emails', JSON.stringify(subscribers));
      }

      showFeedback('🎉 ¡Excelente! Te hemos añadido a la lista prioritaria.', 'success');
      emailInput.value = '';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';

      // Limpiar mensaje tras 5 segundos
      setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.className = 'form-feedback';
      }, 5000);
    }, 450);
  });

  function showFeedback(msg, type) {
    feedbackEl.textContent = msg;
    feedbackEl.className = `form-feedback ${type}`;
  }
}

function initFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
