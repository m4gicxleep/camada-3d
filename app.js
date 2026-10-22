'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
  const fmt=(v,d=2)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d}).format(v);
  const KEY='camada-v1-draft', HISTORY='camada-v1-history';
  let state=Camada.defaults(), result, history=[], pendingGcode=null, toastTimer, storageWarning=false;
  const fields=Object.keys(state).filter(k=>k!=='materials');
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
  function persist(key,data){try{localStorage.setItem(key,JSON.stringify(data));return true;}catch{if(!storageWarning){toast('Não foi possível salvar neste navegador. Use “Baixar dados” para guardar uma cópia.');storageWarning=true;}return false;}}
  try {
    const draft=localStorage.getItem(KEY);
    if(draft) state=Camada.restore(JSON.parse(draft));
    const saved=JSON.parse(localStorage.getItem(HISTORY)||'[]');
    if(Array.isArray(saved)) history=saved.slice(0,20).flatMap(x=>{try{return [{id:String(x.id),date:String(x.date),data:Camada.restore(x.data)}];}catch{return [];}});
  } catch {setTimeout(()=>toast('Um dado salvo não pôde ser lido. O exemplo foi carregado; seus arquivos exportados continuam disponíveis.'),200);}
  function materialField(i,key,label,unit,help=''){
    const id=`material-${i}-${key}`;
    return `<div class="field${key==='name'?' wide':''}"><label for="${id}">${label}</label><div class="input-wrap"><input id="${id}" data-material="${i}" data-key="${key}" value="${escape(state.materials[i][key])}" ${key==='name'?'maxlength="100"':'inputmode="decimal"'}>${unit?`<span>${unit}</span>`:''}</div>${help?`<small>${help}</small>`:''}</div>`;
  }
  function renderMaterials(){
    $('materials').innerHTML=state.materials.map((m,i)=>`<div class="material"><div class="material-head"><span>FILAMENTO ${String(i+1).padStart(2,'0')}</span>${state.materials.length>1?`<button class="button subtle small" type="button" data-remove="${i}" aria-label="Remover filamento ${i+1}">Remover</button>`:''}</div><div class="fields">${materialField(i,'name','Nome ou identificação','')}${materialField(i,'price','Preço pago pelo rolo','R$','Preço antes do desconto informado abaixo.')}${materialField(i,'spool','Peso líquido do rolo','g','Ex.: 1 kg = 1.000 g. Digite 1000, sem ponto de milhar.')}${materialField(i,'shipping','Frete atribuído a este rolo','R$','Se comprou vários rolos, divida o frete entre eles.')}${materialField(i,'discount','Desconto deste rolo','R$','Se o preço já está com desconto, deixe zero.')}${materialField(i,'grams','Consumo total neste trabalho','g','Inclua suportes e purga uma única vez.')}</div><p class="material-unit" id="material-unit-${i}"></p></div>`).join('');
    $('add-material').disabled=state.materials.length>=20;
  }
  function fill(){
    pendingGcode=null;$('gcode-preview').hidden=true;
    fields.forEach(key=>{const el=$(key); if(el.type==='checkbox')el.checked=state[key];else el.value=String(state[key]).replace('.',',');});
    renderMaterials(); update();
  }
  const colors=['#d9edaa','#a5c17f','#82a68b','#dbc994','#b7bbcd','#a8c6cb','#b2b79d','#e7b196','#9fbb88','#c2caca'];
  const breakdown=r=>[
    ['Filamento',r.material],['Energia elétrica',r.energy],['Desgaste da impressora',r.depreciation],['Manutenção',r.maintenance],['Custos fixos',r.overhead],['Reserva para falhas',r.reserve],['Seu trabalho',r.labor],['Outros insumos',r.extra],['Embalagem',r.packaging],['Frete de entrega',r.delivery]
  ];
  function row(label,value,color){return `<div class="cost-row"><dt>${color?`<i class="cost-dot" style="background:${color}"></i>`:''}${escape(label)}</dt><dd>${money(value)}</dd></div>`;}
  function update(){
    for(const key of ['energy','machine','labor','overhead']) $(key+'-fields').hidden=!state[key+'Enabled'];
    $('sale-fields').hidden=!state.selling;
    $('simulation-note').querySelector('strong').textContent=state.simulation?'Você está explorando uma simulação.':'Você está usando seus próprios dados.';
    $('simulation-description').textContent=state.simulation?'Os valores iniciais são fictícios. Troque pelos seus dados; potência, tarifa e vida útil precisam ser conferidas.':'Revise seus valores periodicamente. O resultado continua sendo uma estimativa, mesmo com dados medidos.';
    $('result-badge').textContent=state.simulation?'Simulação':'Seus dados';
    result=Camada.calculate(state);
    $('mobile-total').textContent=result.ok?money(result.total):'Confira os campos';
    document.querySelectorAll('[aria-invalid]').forEach(el=>{el.removeAttribute('aria-invalid');el.removeAttribute('aria-describedby');});
    document.querySelectorAll('.field-error').forEach(el=>el.remove());
    $('error-summary').hidden=result.ok;
    $('result-body').hidden=!result.ok;
    for(const id of ['save','print','export','copy']) $(id).disabled=!result.ok;
    if(!result.ok){
      $('total').textContent='—';$('per-unit').textContent='Confira os campos destacados para calcular.';
      const messages=Object.entries(result.errors);
      $('error-summary').innerHTML='<strong>Precisamos corrigir alguns valores:</strong>'+messages.map(([,msg])=>`<p>${escape(msg)}</p>`).join('');
      messages.forEach(([key,msg])=>{
        const id=key.startsWith('materials.')?key.replace('materials.','material-').replace('.','-'):key;
        const el=$(id);if(!el)return;el.setAttribute('aria-invalid','true');
        const error=document.createElement('small');error.className='field-error';error.id=id+'-error';error.textContent=msg;
        (el.closest('.field')||el.parentElement).append(error);el.setAttribute('aria-describedby',error.id);
      });
      state.materials.forEach((_,i)=>{$('material-unit-'+i).textContent='Confira os valores do filamento para atualizar o cálculo.';});
      return;
    }
    $('total').textContent=money(result.total);
    $('per-unit').textContent=`${money(result.unit)} por peça · ${result.quantity} ${result.quantity===1?'peça':'peças'} · ${fmt(result.duration)} h de máquina`;
    const rows=breakdown(result);
    $('breakdown').innerHTML=rows.filter(([,v])=>v>0).map(([label,value])=>row(label,value,colors[rows.findIndex(x=>x[0]===label)])).join('')||row('Nenhum custo informado',0);
    $('stack-bar').innerHTML=rows.map(([,v],i)=>`<span style="width:${result.total?v/result.total*100:0}%;background:${colors[i]}"></span>`).join('');
    result.materials.forEach((m,i)=>{$('material-unit-'+i).textContent=`${money(m.unit*1000)} / kg · ${money(m.cost)} neste trabalho${m.grams>m.spool?' · Atenção: consumo maior que um rolo; verifique o estoque.':''}`;});
    $('sale-result').hidden=!state.selling;
    if(state.selling){
      $('sale-price').textContent=money(result.price);
      $('sale-detail').textContent=`Média de ${money(result.price/result.quantity)} por peça. Cobrança pelo total do pedido.`;
      $('sale-breakdown').innerHTML=row('Taxas da venda',result.fees)+row('Impostos informados',result.taxes)+row('Sobra após custos e taxas',result.profit)+`<div class="cost-row"><dt>Margem resultante</dt><dd>${fmt(result.price?result.profit/result.price*100:0)}%</dd></div>`;
    }
    persist(KEY,state);
  }
  $('quote-form').addEventListener('submit',e=>e.preventDefault());
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.dataset.material!==undefined){state.materials[Number(el.dataset.material)][el.dataset.key]=el.value;update();}
    else if(fields.includes(el.id)){state[el.id]=el.type==='checkbox'?el.checked:el.value;update();}
  });
  $('materials').addEventListener('click',e=>{const button=e.target.closest('[data-remove]');if(button){state.materials.splice(Number(button.dataset.remove),1);renderMaterials();update();}});
  $('add-material').addEventListener('click',()=>{if(state.materials.length>=20)return;state.materials.push({name:'Novo filamento',price:0,shipping:0,discount:0,spool:1000,grams:1});renderMaterials();update();$(`material-${state.materials.length-1}-name`).focus();toast('Novo filamento adicionado. Informe o preço e o consumo reais.');});
  $('reset').addEventListener('click',()=>{if(!confirm('Carregar os dados de exemplo? O rascunho atual será substituído. Orçamentos salvos não serão alterados.'))return;state=Camada.defaults();pendingGcode=null;$('gcode-preview').hidden=true;fill();toast('Exemplo carregado. Todos os valores são apenas uma simulação.');});
  function renderHistory(){
    $('history-list').innerHTML=history.length?history.map((item,i)=>{const r=Camada.calculate(item.data);const date=new Date(item.date);return `<article class="history-item"><div><h3>${escape(item.data.name||'Minha impressão')}</h3><p>${Number.isNaN(date.getTime())?'Data desconhecida':date.toLocaleDateString('pt-BR')} · ${item.data.simulation?'Simulação':'Seus dados'} · ${r.quantity} peça(s) · Custo ${money(r.total)}</p></div><div class="history-buttons"><button class="button small" data-open="${i}" type="button">Abrir</button><button class="button subtle small" data-delete="${i}" type="button" aria-label="Excluir ${escape(item.data.name)}">Excluir</button></div></article>`;}).join(''):'<div class="empty-state">Seu próximo projeto merece um lugar aqui.<br>Preencha a calculadora e clique em “Salvar orçamento”.</div>';
  }
  $('save').addEventListener('click',()=>{
    if(!result.ok)return;
    if(history.length>=20){toast('Você já tem 20 orçamentos. Baixe uma cópia e exclua um salvo para liberar espaço.');return;}
    const item={id:Date.now().toString(36),date:new Date().toISOString(),data:Camada.restore(state)};
    const next=[item,...history];if(persist(HISTORY,next)){history=next;renderHistory();toast('Orçamento salvo neste navegador.');}
  });
  $('history-list').addEventListener('click',e=>{
    const open=e.target.closest('[data-open]'),remove=e.target.closest('[data-delete]');
    if(open){if(!confirm('Abrir este orçamento e substituir o rascunho atual?'))return;state=Camada.restore(history[Number(open.dataset.open)].data);fill();$('calculator').scrollIntoView({behavior:'smooth'});toast('Orçamento carregado.');}
    if(remove){const index=Number(remove.dataset.delete);if(!confirm('Excluir este orçamento salvo do navegador? Faça uma cópia em “Baixar dados” se quiser guardá-lo.'))return;const next=history.filter((_,i)=>i!==index);if(persist(HISTORY,next)){history=next;renderHistory();toast('Orçamento excluído.');}}
  });
  function summary(){
    return [`CAMADA · ${state.name||'Minha impressão'}`,state.simulation?'SIMULAÇÃO — valores de exemplo ou hipóteses':'ESTIMATIVA — baseada nos dados informados',`Quantidade: ${result.quantity} peça(s) | Tempo total: ${fmt(result.duration)} h`,...result.materials.map(m=>`${m.name}: ${fmt(m.grams,3)} g × ${money(m.unit*1000)}/kg`),'',...breakdown(result).map(([label,v])=>`${label}: ${money(v)}`),`CUSTO TOTAL: ${money(result.total)}`,`Custo médio por peça: ${money(result.unit)}`,...(state.selling?['',`VENDA DO PEDIDO: ${money(result.price)}`,`Taxas: ${money(result.fees)} | Impostos informados: ${money(result.taxes)}`,`Sobra após custos e taxas: ${money(result.profit)}`]:[]),'','Reserva para falhas é um acréscimo, não uma probabilidade. Desgaste e reservas são provisões. Valores estimados; não representam uma garantia de custo real.'].join('\n');
  }
  $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary());toast('Resumo copiado. Revise antes de compartilhar.');}catch{toast('O navegador bloqueou a cópia. Use “Imprimir / PDF” ou “Baixar dados”.');}});
  $('print').addEventListener('click',()=>{if(result.ok)window.print();});
  $('export').addEventListener('click',()=>{
    if(!result.ok)return;
    const payload={app:'camada',version:1,exportedAt:new Date().toISOString(),data:Camada.restore(state)};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='camada-orcamento-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Arquivo de dados preparado para download. Guarde-o como cópia do orçamento.');
  });
  $('import-button').addEventListener('click',()=>$('import-file').click());
  $('import-file').addEventListener('change',async e=>{
    const file=e.target.files[0];e.target.value='';if(!file)return;
    try{
      if(file.size>1024*1024)throw new Error('Arquivo muito grande. Use um JSON exportado pelo Camada, de até 1 MB.');
      const payload=JSON.parse(await file.text());
      if(payload.app!=='camada'||payload.version!==1)throw new Error('Este arquivo não é um orçamento Camada compatível.');
      const next=Camada.restore(payload.data);
      if(!confirm('Importar o orçamento “'+next.name+'” e substituir o rascunho atual?'))return;
      state=next;fill();toast('Dados importados. Confira os valores antes de usar.');$('calculator').scrollIntoView({behavior:'smooth'});
    }catch(error){toast(error instanceof SyntaxError?'O arquivo não contém JSON válido. Nada foi alterado.':error.message);}
  });
  $('gcode-button').addEventListener('click',()=>$('gcode-file').click());
  $('gcode-file').addEventListener('change',async e=>{
    const file=e.target.files[0];e.target.value='';if(!file)return;
    try{
      pendingGcode=null;$('gcode-preview').hidden=true;
      if(state.materials.length!==1)throw new Error('Use a entrada manual quando houver vários filamentos no orçamento.');
      if(!/\.gcode$/i.test(file.name))throw new Error('Selecione um arquivo .gcode de texto.');
      if(file.size>50*1024*1024)throw new Error('Limite de leitura: 50 MB. Para arquivos maiores, informe peso e tempo manualmente.');
      pendingGcode=Camada.parseGcode(await file.text());
      $('gcode-description').textContent=`Encontrado: ${fmt(pendingGcode.grams,3)} g e ${pendingGcode.hours} h ${pendingGcode.minutes} min (arredondado para cima ao minuto). Confira no fatiador, inclusive suportes, purga e aquecimento. Aplicar substitui somente o consumo do filamento e o tempo, sem alterar a quantidade de peças.`;
      $('gcode-preview').hidden=false;
    }catch(error){toast(error.message);}
  });
  $('gcode-apply').addEventListener('click',()=>{if(!pendingGcode)return;if(state.materials.length!==1){toast('A lista de filamentos mudou. Importe novamente ou preencha manualmente.');return;}state.materials[0].grams=pendingGcode.grams;state.hours=pendingGcode.hours;state.minutes=pendingGcode.minutes;pendingGcode=null;$('gcode-preview').hidden=true;fill();toast('Peso e tempo aplicados. Confira a quantidade de peças do trabalho.');});
  $('gcode-cancel').addEventListener('click',()=>{pendingGcode=null;$('gcode-preview').hidden=true;});
  fill();renderHistory();
})();
