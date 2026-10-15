const branchNumbers: Record<string, string> = {
        perticone: '5492995470052',
        pin: '5492995470059',
        anelo: '5492995483985',
      };

      document.querySelectorAll<HTMLFormElement>('[data-whatsapp-form]').forEach((form) => {
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const data = new FormData(form);
          const branch = String(data.get('sucursal') || 'perticone');
          const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-message-label]'));
          const lines = fields.flatMap((field) => {
            const value = field instanceof HTMLSelectElement ? field.selectedOptions[0]?.text.trim() : field.value.trim();
            return value ? [`${field.dataset.messageLabel}: ${value}`] : [];
          });
          const heading = form.dataset.messageHeading || 'Consulta desde la web de CYL';
          const message = [heading, '', ...lines].join('\n');
          window.open(`https://wa.me/${branchNumbers[branch] || branchNumbers.perticone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
        });
      });

      document.querySelectorAll<HTMLFormElement>('[data-mail-form]').forEach((form) => {
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-message-label]'));
          const lines = fields.flatMap((field) => {
            const value = field instanceof HTMLSelectElement ? field.selectedOptions[0]?.text.trim() : field.value.trim();
            return value ? [`${field.dataset.messageLabel}: ${value}`] : [];
          });
          const subject = form.dataset.mailSubject || 'Contacto desde la web de CYL';
          window.location.href = `mailto:${form.dataset.mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
        });
      });
