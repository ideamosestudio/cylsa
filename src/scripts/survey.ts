// Frontend preview only. No network requests or browser storage.
// The future WordPress plugin will own submission, validation and persistence.
const form = document.querySelector<HTMLFormElement>('[data-survey-form]');
if (form) {
  const steps = [...form.querySelectorAll<HTMLElement>('[data-survey-step]')];
  const indicators = [...document.querySelectorAll<HTMLElement>('[data-survey-indicator]')];
  const back = form.querySelector<HTMLButtonElement>('[data-survey-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-survey-next]')!;
  const actions = form.querySelector<HTMLElement>('[data-survey-actions]')!;
  const progress = form.querySelector<HTMLElement>('[data-survey-progress]')!;
  const error = form.querySelector<HTMLElement>('[data-survey-error]')!;
  const complete = form.querySelector<HTMLElement>('[data-survey-complete]')!;
  let current = 0;
  const show = (index: number) => {
    current = index;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    indicators.forEach((item, i) => {
      if (i === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.classList.toggle('is-done', i < index);
    });
    complete.hidden = true;
    actions.hidden = false;
    error.hidden = true;
    back.hidden = index === 0;
    next.textContent = index === steps.length - 1 ? 'Finalizar vista previa' : 'Siguiente →';
    progress.textContent = `Paso ${index + 1} de ${steps.length}`;
    steps[index].querySelector<HTMLElement>('h2')?.focus();
  };
  const validate = (index: number) => {
    const controls = [...steps[index].querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')];
    for (const control of controls) {
      control.setCustomValidity(control.required && control.type !== 'radio' && !control.value.trim() ? 'Completá este campo.' : '');
      if (!control.checkValidity()) {
        show(index);
        error.textContent = 'Revisá los campos obligatorios y el formato del email antes de continuar.';
        error.hidden = false;
        control.reportValidity();
        return false;
      }
    }
    return true;
  };
  form.addEventListener('input', event => {
    if (event.target instanceof HTMLInputElement) event.target.setCustomValidity('');
    error.hidden = true;
  });
  back.addEventListener('click', () => show(Math.max(0, current - 1)));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validate(current)) return;
    if (current < steps.length - 1) { show(current + 1); return; }
    for (let i = 0; i < steps.length; i++) if (!validate(i)) return;
    steps.forEach(step => { step.hidden = true; });
    actions.hidden = true;
    complete.hidden = false;
    progress.textContent = 'Vista previa completada';
    complete.querySelector<HTMLElement>('h2')?.focus();
  });
  form.querySelector('[data-survey-review]')?.addEventListener('click', () => show(0));
  form.querySelectorAll<HTMLButtonElement>('[data-clear-rating]').forEach(button => {
    button.addEventListener('click', () => {
      form.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(input => {
        if (input.name === button.dataset.clearRating) input.checked = false;
      });
    });
  });
}
