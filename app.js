// Реєстрація Service Worker + банер offline/online
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW зареєстровано!', reg))
      .catch(err => console.log('Помилка реєстрації SW:', err));
  });

  window.addEventListener('online', () => {
    const el = document.getElementById('offline');
    if (el) el.style.display = 'none';
  });

  window.addEventListener('offline', () => {
    const el = document.getElementById('offline');
    if (el) el.style.display = 'block';
  });

  
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  // слухач повідомлень від SW (для Background Sync)
  navigator.serviceWorker.addEventListener('message', event => {
    alert(event.data);
  });
}

window.updateSW = async function updateSW() {
  if (!('serviceWorker' in navigator)) {
    alert('Service Worker не підтримується в цьому браузері');
    return;
  }

  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    alert('Немає зареєстрованого Service Worker');
    return;
  }

  // ручне оновлення
  reg.update();

  reg.addEventListener('updatefound', () => {
    const newSW = reg.installing;
    if (!newSW) return;

    newSW.addEventListener('statechange', () => {
      if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
        if (confirm('Доступна нова версія сайту. Оновити?')) {
          newSW.postMessage({ action: 'skipWaiting' });
        }
      }
    });
  });
};

fetch('./api/menu.json')  
  .then(res => res.json())
  .then(menu => {
    const ul = document.createElement('ul');
    menu.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} — ${item.price} ₴`;
      ul.appendChild(li);
    });
    document.querySelector('main').appendChild(ul);
  });


window.placeOrder = async function placeOrder() {
  if (!('serviceWorker' in navigator)) {
    alert('Service Worker не підтримується');
    return;
  }

  const reg = await navigator.serviceWorker.ready;

  if ('sync' in reg) {
    await reg.sync.register('send-order');
    alert('Замовлення додано в чергу й буде відправлене, коли зʼявиться інтернет.');
  } else {
    alert('Background Sync не підтримується цим браузером');
  }
};
