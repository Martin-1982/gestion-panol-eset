// tiny global notifier: dispatches a CustomEvent the GlobalToast listens to
export function notify(message, type = 'success') {
  try {
    window.dispatchEvent(new CustomEvent('app-notify', { detail: { message, type } }));
  } catch (e) {
    // fallback
    // eslint-disable-next-line no-alert
    alert(message);
  }
}
