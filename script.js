// accessibility + tab state script
(function(){
  // ensure tabs are keyboard accessible and update aria-selected
  const tabButtons = Array.from(document.querySelectorAll('[role="tab"]'));
  function activateTab(button){
    tabButtons.forEach(b => { b.setAttribute('aria-selected','false'); b.classList.remove('active'); });
    const panels = document.querySelectorAll('[role="tabpanel"]');
    panels.forEach(p => p.classList.remove('active'));

    button.setAttribute('aria-selected','true');
    button.classList.add('active');
    const panelId = button.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if(panel) {
      panel.classList.add('active');
      // smooth scroll panel into view and focus first field
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = panel.querySelector('input, select, button, textarea');
      if(firstInput) firstInput.focus();
    }
  }

  tabButtons.forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      activateTab(btn);
    });

    btn.addEventListener('keydown', (e) => {
      let idx = tabButtons.indexOf(btn);
      if(e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        idx = (idx + 1) % tabButtons.length; tabButtons[idx].focus();
      } else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        idx = (idx - 1 + tabButtons.length) % tabButtons.length; tabButtons[idx].focus();
      } else if(e.key === 'Home') {
        tabButtons[0].focus();
      } else if(e.key === 'End') {
        tabButtons[tabButtons.length - 1].focus();
      } else if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); activateTab(btn);
      }
    });
  });

  // aria-live region for result updates
  let live = document.getElementById('aria-live');
  if(!live) {
    live = document.createElement('div');
    live.id = 'aria-live';
    live.setAttribute('aria-live','polite');
    live.setAttribute('aria-atomic','true');
    live.style.position = 'absolute';
    live.style.width = '1px';
    live.style.height = '1px';
    live.style.overflow = 'hidden';
    live.style.clip = 'rect(1px, 1px, 1px, 1px)';
    document.body.appendChild(live);
  }

  // patch renderizarResultados to announce value
  const origRender = window.renderizarResultados;
  if(origRender) {
    window.renderizarResultados = function(itens, totalProventos, totalDescontos){
      origRender(itens, totalProventos, totalDescontos);
      const liquido = totalProventos - totalDescontos;
      live.textContent = 'Cálculo finalizado. Valor líquido estimado: ' + liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
  }
})();
