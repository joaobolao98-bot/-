let meuGrafico = null;

// Gerenciador de Abas do Sistema (melhorado)
function mudarAba(idAba) {
    // Encontra o botão que controla a aba
    const btn = document.querySelector('[aria-controls="' + idAba + '"]');
    if (!btn) return;

    // Esconde todas as abas e atualiza botões
    document.querySelectorAll('.tab-content').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('[role="tab"]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
    });

    // Ativa o botão e o painel
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');

    const panel = document.getElementById(idAba);
    if (panel) {
        panel.classList.add('active');
        // scroll suave e foco no primeiro campo
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const firstInput = panel.querySelector('input, select, button, textarea');
        if (firstInput) firstInput.focus();
    }
}

// Função para fazer a página rolar de forma suave até o simulador ao clicar no botão "Simule Aqui"
function rolarParaCalculadora() {
    const elemento = document.getElementById('painel-calculos');
    if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- MOTORES DE CÁLCULO TRABALHISTA (CLT) ---

// 1. Motor de Dedução Imposto de Renda (IRRF)
function calcularIRRF(base) {
    if (base <= 2259.20) return { depr: 0, desc: 0 };
    if (base <= 2826.65) return { depr: 7.5, desc: (base * 0.075) - 169.44 };
    if (base <= 3751.05) return { depr: 15, desc: (base * 0.15) - 381.44 };
    if (base <= 4664.68) return { depr: 22.5, desc: (base * 0.225) - 662.77 };
    return { depr: 27.5, desc: (base * 0.275) - 896.00 };
}

// 2. Motor de Dedução Previdenciária (INSS Progressivo)
function calcularINSS(salario) {
    let desconto = 0;
    if (salario <= 1412.00) {
        desconto = salario * 0.075;
    } else if (salario <= 2666.68) {
        desconto = (1412 * 0.075) + ((salario - 1412) * 0.09);
    } else if (salario <= 4000.03) {
        desconto = (1412 * 0.075) + ((2666.68 - 1412) * 0.09) + ((salario - 2666.68) * 0.12);
    } else {
        desconto = (1412 * 0.075) + ((2666.68 - 1412) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((Math.min(salario, 7786.02) - 4000.03) * 0.14);
    }
    return desconto;
}

// FUNÇÃO AUXILIAR: Formatar tabela e renderizar tela
function renderizarResultados(itens, totalProventos, totalDescontos) {
    document.getElementById('placeholder-result').classList.add('hidden');
    document.getElementById('display-resultados').classList.remove('hidden');
    
    const tabela = document.getElementById('tabela-linhas');
    tabela.innerHTML = `<tr><th>Descrição</th><th>Proventos</th><th>Descontos</th></tr>`;
    
    itens.forEach(item => {
        tabela.innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td class="provento">${item.prov > 0 ? formatarMoeda(item.prov) : '-'}</td>
                <td class="desconto">${item.desc > 0 ? formatarMoeda(item.desc) : '-'}</td>
            </tr>`;
    });
    
    const liquido = totalProventos - totalDescontos;
    document.getElementById('valor-liquido').innerText = formatarMoeda(liquido);
    
    // Atualiza Gráfico dinamicamente limpando a instância anterior para evitar erros
    if(meuGrafico) meuGrafico.destroy();
    const canvas = document.getElementById('graficoResultados');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        meuGrafico = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Valor Líquido', 'Total Descontos'],
                datasets: [{
                    data: [liquido, totalDescontos],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function formatarMoeda(v) { 
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
}

// --- ACTIONS DOS BOTÕES ---

function calcularFeriasPro() {
    const salario = parseFloat(document.getElementById('f-salario').value) || 0;
    const dias = parseInt(document.getElementById('f-dias').value) || 0;
    const querAbono = document.getElementById('f-abono').checked;
    const quer13 = document.getElementById('f-adianta13').checked;

    let proventos = 0, descontos = 0;
    let lines = [];

    let valorFerias = (salario / 30) * dias;
    let terco = valorFerias / 3;
    lines.push({nome: `Férias (${dias} dias)`, prov: valorFerias, desc: 0});
    lines.push({nome: '1/3 Constitucional sobre Férias', prov: terco, desc: 0});
    proventos += (valorFerias + terco);

    let inss = calcularINSS(valorFerias + terco);
    let irrf = calcularIRRF((valorFerias + terco) - inss).desc;
    lines.push({nome: 'Desconto INSS Férias', prov: 0, desc: inss});
    lines.push({nome: 'Desconto IRRF Férias', prov: 0, desc: irrf});
    descontos += (inss + irrf);

    if(querAbono) {
        let abono = (salario / 30) * 10;
        let tercoAbono = abono / 3;
        lines.push({nome: 'Abono Pecuniário (Venda de 10 dias)', prov: abono, desc: 0});
        lines.push({nome: '1/3 sobre Abono Pecuniário', prov: tercoAbono, desc: 0});
        proventos += (abono + tercoAbono);
    }

    if(quer13) {
        let ad13 = salario / 2;
        lines.push({nome: 'Adiantamento de 1ª Parcela do 13°', prov: ad13, desc: 0});
        proventos += ad13;
    }

    renderizarResultados(lines, proventos, descontos);
}

function calcularDecimoPro() {
    const salario = parseFloat(document.getElementById('d-salario').value) || 0;
    const meses = parseInt(document.getElementById('d-meses').value) || 0;
    const parcela = document.getElementById('d-parcela').value;

    let brutoTotal = (salario / 12) * meses;
    let proventos = 0, descontos = 0;
    let lines = [];

    if(parcela === "1") {
        proventos = brutoTotal / 2;
        lines.push({nome: '1ª Parcela 13° Salário', prov: proventos, desc: 0});
    } else if(parcela === "2") {
        proventos = brutoTotal;
        let jaPago = brutoTotal / 2;
        let inss = calcularINSS(brutoTotal);
        let irrf = calcularIRRF(brutoTotal - inss).desc;
        
        lines.push({nome: 'Bruto 13° Salário', prov: brutoTotal, desc: 0});
        lines.push({nome: 'Adiantamento de 1ª Parcela (Dedução)', prov: 0, desc: jaPago});
        lines.push({nome: 'Desconto INSS', prov: 0, desc: inss});
        lines.push({nome: 'Desconto IRRF', prov: 0, desc: irrf});
        descontos = jaPago + inss + irrf;
    } else {
        proventos = brutoTotal;
        let inss = calcularINSS(brutoTotal);
        let irrf = calcularIRRF(brutoTotal - inss).desc;
        lines.push({nome: 'Bruto Integral 13° Salário', prov: brutoTotal, desc: 0});
        lines.push({nome: 'Desconto INSS', prov: 0, desc: inss});
        lines.push({nome: 'Desconto IRRF', prov: 0, desc: irrf});
        descontos = inss + irrf;
    }

    renderizarResultados(lines, proventos, descontos);
}

function calcularRescisaoPro() {
    const salario = parseFloat(document.getElementById('r-salario').value) || 0;
    const meses = parseInt(document.getElementById('r-meses').value) || 0;
    const motivo = document.getElementById('r-motivo').value;
    const aviso = document.getElementById('r-aviso').value;

    let proventos = 0, descontos = 0;
    let lines = [];

    let saldoSalario = salario / 2;
    lines.push({nome: 'Saldo de Salário (15 dias)', prov: saldoSalario, desc: 0});
    proventos += saldoSalario;

    let mesesAnuais = meses % 12 === 0 ? 12 : meses % 12;
    let decimoRescisao = (salario / 12) * mesesAnuais;
    lines.push({nome: `13° Salário Proporcional (${mesesAnuais}/12)`, prov: decimoRescisao, desc: 0});
    proventos += decimoRescisao;

    let feriasProp = (salario / 12) * mesesAnuais;
    let tercoRescisao = feriasProp / 3;
    lines.push({nome: 'Férias Proporcionais Rescisórias', prov: feriasProp, desc: 0});
    lines.push({nome: '1/3 Constitucional sobre Férias', prov: tercoRescisao, desc: 0});
    proventos += (feriasProp + tercoRescisao);

    if(motivo === "sem-justa") {
        if(aviso === "indenizado") {
            lines.push({nome: 'Aviso Prévio Indenizado', prov: salario, desc: 0});
            proventos += salario;
        }
        let fgtsAcumulado = (salario * 0.08) * meses;
        let multaFGTS = fgtsAcumulado * 0.40;
        lines.push({nome: 'Multa Rescisória de 40% do FGTS (A sacar na Caixa)', prov: multaFGTS, desc: 0});
        proventos += multaFGTS;
    } else {
        if(aviso === "indenizado") {
            lines.push({nome: 'Aviso Prévio Não Cumprido (Desconto)', prov: 0, desc: salario});
            descontos += salario;
        }
    }

    let inssRescisao = calcularINSS(saldoSalario);
    lines.push({nome: 'Desconto INSS sobre Saldo de Salário', prov: 0, desc: inssRescisao});
    descontos += inssRescisao;

    renderizarResultados(lines, proventos, descontos);
}


// accessibility + tab state script (enhancements)
(function(){
  // ensure tabs are keyboard accessible and update aria-selected
  const tabButtons = Array.from(document.querySelectorAll('[role="tab"]'));
  function activateTab(button){
    tabButtons.forEach(b => { b.setAttribute('aria-selected','false'); b.classList.remove('active'); b.setAttribute('tabindex','-1'); });
    const panels = document.querySelectorAll('[role="tabpanel"]');
    panels.forEach(p => p.classList.remove('active'));

    button.setAttribute('aria-selected','true');
    button.classList.add('active');
    button.setAttribute('tabindex','0');
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

// initialize tab tabindex & aria-selected for existing DOM (in case script executed after load)
(function initTabState(){
  function setup(){
    const tabs = document.querySelectorAll('[role="tab"]');
    if(!tabs) return;
    tabs.forEach(t => {
      if(t.classList.contains('active')){
        t.setAttribute('tabindex','0');
        t.setAttribute('aria-selected','true');
      } else {
        t.setAttribute('tabindex','-1');
        t.setAttribute('aria-selected','false');
      }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
