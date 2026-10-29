/* Discreet entry in the workshop index; cost data stays in its separate page. */
document.addEventListener('keydown', event => {
  if (event.altKey && event.shiftKey && (event.code === 'KeyP' || event.key.toLowerCase() === 'p')) {
    event.preventDefault();
    document.querySelector('.team-access-dot')?.click();
  }
});
