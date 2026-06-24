// accessibility + tab state script
(function(){
  // ensure tabs are keyboard accessible and update aria-selected
  const tabButtons = document.querySelectorAll('[role="tab"]');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabButtons.forEach(b => { b.setAttribute('aria-selected','false'); b.classList.remove('active'); });
      const panels = document.querySelectorAll('[role="tabpanel"]');
      panels.forEach(p => p.classList.remove('active'));

      btn.setAttribute('aria-selected','true');
      btn.classList.add('active');
      const panelId = btn.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      if(panel) panel.classList.add('active');
    });

    btn.addEventListener('keydown', (e) => {
      let idx = Array.prototype.indexOf.call(tabButtons, btn);
      if(e.key === 'ArrowRight') {
        idx = (idx + 1) % tabButtons.length; tabButtons[idx].focus();
      } else if(e.key === 'ArrowLeft') {
        idx = (idx - 1 + tabButtons.length) % tabButtons.length; tabButtons[idx].focus();
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
