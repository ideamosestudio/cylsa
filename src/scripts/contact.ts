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
    status.textContent = 'Enviando consulta…';
    try {
      await submitContact(new FormData(form));
      form.reset();
      status.textContent = 'Consulta enviada al equipo de CYL.';
    } catch (error) {
      status.textContent = (error instanceof Error && !['TimeoutError','TypeError','SyntaxError'].includes(error.name) ? error.message : 'No pudimos confirmar el envío.') + ' Tus datos siguen en el formulario.';
    } finally { button.disabled = false; }
  });
});
