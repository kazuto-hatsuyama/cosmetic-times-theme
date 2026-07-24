(function () {
  const config = window.CosmeticTimesCustomerSync;
  if (!config || !config.customerId || !config.email) return;

  const STORAGE_KEY = 'ctCustomerSyncSent';
  if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
  sessionStorage.setItem(STORAGE_KEY, '1');

  const TOKEN = 'bee15c758842afe80a460a8d1d899e88323163105c99946f';
  const ENDPOINT = 'https://arnulfo-fordable-pipingly.ngrok-free.dev/Manage/shopify/link_customer.cfm';

  const params = new URLSearchParams({
    token: TOKEN,
    customer_id: config.customerId,
    email: config.email,
  });

  fetch(`${ENDPOINT}?${params.toString()}`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  }).catch(() => {});
})();
