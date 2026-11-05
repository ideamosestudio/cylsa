const endpoint = ['cylneumaticos.com.ar','www.cylneumaticos.com.ar'].includes(location.hostname)
  ? '/wp-admin/admin-ajax.php' : 'https://www.cylneumaticos.com.ar/wp-admin/admin-ajax.php';

async function submitContact(data: FormData) {
  const post = async (body: FormData) => {
    const response = await fetch(endpoint, {method:'POST', body, credentials:'omit', signal:AbortSignal.timeout(25000)});
    const reply = await response.json();
    if (!response.ok || reply.success !== true) throw new Error(reply.data?.message || 'No se pudo enviar la consulta.');
    return reply.data;
  };
  const challenge = new FormData();
  challenge.set('action','cyl_contact_token');
  const {token} = await post(challenge);
  data.set('action','cyl_contact_send');
  data.set('token',token);
  await post(data);
}

document.querySelectorAll<HTMLFormElement>('[data-contact-form]').forEach(form => {
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const status = form.querySelector<HTMLElement>('[data-contact-status]')!;
  form.addEventListener('submit',async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'sending';
    status.textContent = 'Enviando consulta…';
    try {
      await submitContact(new FormData(form));
      form.reset();
      status.dataset.state = 'success';
      status.innerHTML = '<svg class="contact-confirmation__icon" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5"/><path d="m12 20 5 5 11-11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="contact-confirmation__copy"><strong>¡Tu consulta fue enviada!</strong><span>Gracias por escribirnos. El equipo de CYL se pondrá en contacto con vos a través de los datos que nos dejaste.</span></span>';
      status.tabIndex = -1;
      status.focus({preventScroll:true});
      status.scrollIntoView({block:'nearest',behavior:'auto'});
      button.querySelector('span')!.textContent = 'Enviar otra consulta';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = (error instanceof Error && !['TimeoutError','TypeError','SyntaxError'].includes(error.name) ? error.message : 'No pudimos confirmar el envío.') + ' Tus datos siguen en el formulario.';
    } finally { button.disabled = false; form.removeAttribute('aria-busy'); }
  });
});
