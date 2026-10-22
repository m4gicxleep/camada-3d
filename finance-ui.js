'use strict';
(() => {
  const F=CamadaFinance,$=id=>document.getElementById(id),KEY='camada-v2-control';
  const money=c=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c/100);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const brDate=s=>s?s.split('-').reverse().join('/'):'A receber';
  const brMonth=s=>s.split('-').reverse().join('/');
  const uid=()=>crypto.randomUUID();
  let data=F.empty(),blocked=false,month=F.localDate().slice(0,7),salesMonth=month,saleEditing=null,expenseEditing=null,paymentIndex=null,manualFee=false;
  function message(msg){$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(message.timer);message.timer=setTimeout(()=>$('toast').hidden=true,7000);}
  function error(id,msg){$(id).textContent=msg;$(id).hidden=!msg;}
  function copy(){return JSON.parse(JSON.stringify(data));}
  try{const raw=localStorage.getItem(KEY);if(raw)data=F.validate(JSON.parse(raw));}catch{blocked=true;$('finance-storage-error').textContent='Não foi possível ler os registros financeiros. A versão armazenada foi preservada; restaure um backup completo para continuar. Não serão gravadas novas vendas ou despesas sobre esses dados.';$('finance-storage-error').hidden=false;}
  function save(next){
    if(blocked)throw new Error('Restaure um backup válido antes de alterar registros financeiros.');
    const clean=F.validate(next);try{localStorage.setItem(KEY,JSON.stringify(clean));}catch{throw new Error('Não foi possível guardar os dados. Nada foi alterado. Faça um backup e confira o espaço/permissão do navegador.');}
    data=clean;render();window.dispatchEvent(new Event('camada-finance-change'));
  }
  function panel(name){
    for(const n of ['calculator','records','finance'])$('panel-'+n).hidden=n!==name;
    document.querySelectorAll('[data-panel]').forEach(b=>{b.classList.toggle('active',b.dataset.panel===name);if(b.dataset.panel===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.querySelector('.mobile-jump').hidden=name!=='calculator';
  }
  document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>panel(b.dataset.panel)));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
  window.addEventListener('camada-show-calculator',()=>panel('calculator'));
  const metric=(title,value,help)=>`<article class="metric"><span>${title}</span><strong class="${value<0?'negative':''}">${money(value)}</strong><small>${help}</small></article>`;
  function render(){
    const r=F.report(data,month);
    $('use-printer').disabled=!data.printer;
    $('month-summary').innerHTML=metric('Vendido no mês',r.sold,`${r.salesCount} venda(s) · a receber no fim do mês: ${money(r.pending)}`)+metric('Lucro estimado das vendas',r.profit,'Vendas − taxas − custos dos orçamentos; inclui a receber')+metric('Recebido líquido no mês',r.netReceived,'Pela data do recebimento, já descontadas as taxas')+metric('Compras e despesas pagas',r.spent,`Filamento: ${money(r.filamentSpent)} · não inclui a impressora`)+metric('Entrada e parcelas pagas',r.down+r.paid,`Entrada: ${money(r.down)} · parcelas: ${money(r.paid)}`)+metric('Saldo do mês',r.balance,'Recebimentos − despesas − entrada − parcelas pagas');
    const plan=F.schedule(data.printer),due=plan.find(p=>p.month===month),paidDue=due&&data.payments.find(p=>p.index===due.index);
    $('coverage').innerHTML=!data.printer?'<p class="muted">Cadastre sua impressora abaixo para acompanhar as parcelas. A quantidade inicial é 12x.</p>':!due?'<p>Não há parcela prevista para este mês.</p>':`<p><strong>${r.shortfall?`Faltam ${money(r.shortfall)} para cobrir a parcela.`:'A renda registrada cobre a parcela deste mês.'}</strong></p><progress max="100" value="${r.coverage}" aria-label="Cobertura da parcela"></progress><p class="help-line">Disponível antes das parcelas: ${money(r.available)} · Parcela ${due.index+1}/${plan.length}: ${money(due.amount)}</p><p class="help-line">${paidDue?'Pagamento registrado em '+brDate(paidDue.date)+'.':'Pagamento ainda não registrado.'}</p>`;
    $('printer-progress').textContent=data.printer?`${data.payments.length}/${plan.length} parcelas pagas · ${data.printer.name}`:'';
    $('installment-list').innerHTML=!data.printer?'<p class="muted">Nenhuma impressora cadastrada.</p>':!plan.length?'<p>Impressora paga integralmente na entrada. Sem parcelas.</p>':`<div class="table-scroll"><table><thead><tr><th>Parcela</th><th>Mês previsto</th><th>Valor</th><th>Situação</th><th>Ação</th></tr></thead><tbody>${plan.map(p=>{const paid=data.payments.find(x=>x.index===p.index);return `<tr><td>${p.index+1}/${plan.length}</td><td>${brMonth(p.month)}</td><td>${money(p.amount)}</td><td>${paid?'Paga em '+brDate(paid.date):(p.month<F.localDate().slice(0,7)?'Mês passado · não registrada':'A pagar')}</td><td><button type="button" class="button small" ${paid?'data-undo-pay':'data-pay'}="${p.index}">${paid?'Desfazer pagamento':'Registrar pagamento'}</button></td></tr>`;}).join('')}</tbody></table></div>`;
    const sales=data.sales.filter(s=>s.date.slice(0,7)===salesMonth&&($('show-cancelled-sales').checked||!s.cancelled));
    $('sales-list').innerHTML=sales.length?sales.map(s=>`<article class="ledger-item ${s.cancelled?'cancelled':''}"><div><h3>${esc(s.name)} <span class="record-tag">${s.cancelled?'Cancelada':'Venda'}</span></h3><p>${brDate(s.date)} · Total ${money(s.gross)} · Taxas ${money(s.fees)} · Custo estimado ${money(s.cost)}</p><p>${s.receivedDate?'Recebida em '+brDate(s.receivedDate):'A receber'} · Sobra estimada ${money(s.gross-s.fees-s.cost)}</p></div><div class="history-buttons"><button class="button small" data-sale-open="${esc(s.id)}">Ver cálculo</button>${!s.cancelled?`<button class="button small" data-sale-edit="${esc(s.id)}">Editar / receber</button>`:''}<button class="button small" data-sale-cancel="${esc(s.id)}">${s.cancelled?'Restaurar':'Cancelar venda'}</button></div></article>`).join(''):'<p class="muted">Nenhuma venda neste mês. Registre pela calculadora ou por um orçamento salvo.</p>';
    const expenses=data.expenses.filter(e=>e.date.slice(0,7)===month&&($('show-cancelled-expenses').checked||!e.cancelled));
    $('expenses-list').innerHTML=expenses.length?expenses.map(e=>`<article class="ledger-item ${e.cancelled?'cancelled':''}"><div><h3>${esc(e.name)}</h3><p>${brDate(e.date)} · ${F.categories[e.category]} · ${money(e.amount)}${e.cancelled?' · Cancelada':''}</p></div><div class="history-buttons">${!e.cancelled?`<button class="button small" data-expense-edit="${esc(e.id)}">Editar</button>`:''}<button class="button small" data-expense-cancel="${esc(e.id)}">${e.cancelled?'Restaurar':'Cancelar gasto'}</button></div></article>`).join(''):'<p class="muted">Nenhuma despesa paga registrada neste mês.</p>';
  }
  function fillPrinter(){const p=data.printer;$('printer-name').value=p?.name||'';$('printer-total').value=p?(p.total/100).toFixed(2).replace('.',','):'';$('printer-down').value=p?(p.down/100).toFixed(2).replace('.',','):'0';$('printer-count').value=p?.count||12;$('printer-first').value=p?.firstMonth||month;$('printer-down-date').value=p?.downDate||F.localDate();previewPrinter();}
  function readPrinter(){return F.printer({name:$('printer-name').value,total:F.cents($('printer-total').value,'Total da compra'),down:F.cents($('printer-down').value,'Entrada'),downDate:$('printer-down-date').value,count:Number($('printer-count').value),firstMonth:$('printer-first').value});}
  function previewPrinter(){try{const p=readPrinter(),plan=F.schedule(p);$('printer-preview').textContent=plan.length?`${plan.length} parcelas: ${money(plan[0].amount)}${plan.at(-1).amount!==plan[0].amount?', última de '+money(plan.at(-1).amount):' cada'}. Total com entrada: ${money(p.total)}.`:'Pagamento integral na entrada.';}catch{$('printer-preview').textContent='Preencha os valores para ver as parcelas.';}}
  $('use-printer').addEventListener('click',()=>{if(data.printer){CamadaApp.usePrinter(data.printer.total/100);panel('calculator');}});
  $('printer-form').addEventListener('input',previewPrinter);
  $('printer-form').addEventListener('submit',e=>{e.preventDefault();try{const p=readPrinter();if(p.down&&p.downDate>F.localDate())throw new Error('Uma entrada já paga não pode ter data futura.');if(data.payments.length&&JSON.stringify({...p,name:''})!==JSON.stringify({...data.printer,name:''}))throw new Error('Há pagamentos registrados. Desfaça essas marcações antes de alterar valores ou meses do parcelamento. O nome pode ser editado.');const next=copy();next.printer=p;save(next);error('printer-error','');message('Impressora salva. As parcelas só entram no saldo quando o pagamento for registrado.');}catch(err){error('printer-error',err.message);}});
  function saleEstimate(){
    try{const gross=F.cents($('sale-amount').value),q=saleEditing.quote,r=Camada.calculate(q);if(!manualFee)$('sale-fee').value=(q.selling?(gross/100*(Number(q.fees)+Number(q.tax))/100+Number(q.fixedFee)):0).toFixed(2).replace('.',',');const fees=F.cents($('sale-fee').value);$('sale-estimate').textContent='Sobra estimada desta venda: '+money(gross-fees-Math.round(r.total*100));}catch{$('sale-estimate').textContent='Informe o valor real da venda e as taxas.';}
    $('sale-received-wrap').hidden=!$('sale-received').checked;$('sale-received-date').required=$('sale-received').checked;
  }
  function openSale({quote,sourceId=null},existing=null){
    if(blocked){message('Restaure o backup para recuperar seus registros antes de salvar vendas.');return;}
    if(!existing&&sourceId&&data.sales.some(s=>!s.cancelled&&s.sourceId===sourceId)){message('Este orçamento já virou uma venda. Use “Editar / receber” para atualizar.');return;}
    const q=Camada.restore(quote),r=Camada.calculate(q);saleEditing=existing?{...existing,quote:q}:{id:uid(),sourceId,quote:q};manualFee=!!existing;
    $('sale-dialog-title').textContent=existing?'Editar venda / recebimento':'Registrar venda';$('sale-name').value=existing?.name||q.name;$('sale-date').value=existing?.date||F.localDate();$('sale-amount').value=existing?(existing.gross/100).toFixed(2).replace('.',','):(r.price!==null?String(r.price).replace('.',','):'');$('sale-fee').value=existing?(existing.fees/100).toFixed(2).replace('.',','):'0';$('sale-received').checked=existing?!!existing.receivedDate:false;$('sale-received-date').value=existing?.receivedDate||F.localDate();$('sale-reviewed').checked=false;
    $('sale-quote-info').textContent=`Custo do orçamento: ${money(Math.round(r.total*100))}. ${q.simulation?'Atenção: este orçamento está marcado como simulação. Revise os custos antes de registrar uma venda real.':'Os custos deste cálculo serão guardados junto da venda.'}`;
    error('sale-error','');saleEstimate();$('sale-dialog').showModal();
  }
  window.addEventListener('camada-sale',e=>openSale(e.detail));
  $('sale-fee').addEventListener('input',()=>manualFee=true);
  $('sale-form').addEventListener('input',saleEstimate);
  $('sale-form').addEventListener('submit',e=>{e.preventDefault();try{
    if(!$('sale-reviewed').checked)throw new Error('Confirme a revisão dos valores.');
    const s=F.sale({...saleEditing,name:$('sale-name').value,date:$('sale-date').value,gross:F.cents($('sale-amount').value,'Venda'),fees:F.cents($('sale-fee').value,'Taxas'),receivedDate:$('sale-received').checked?$('sale-received-date').value:null,cancelled:false});
    if(s.date>F.localDate()||(s.receivedDate&&s.receivedDate>F.localDate()))throw new Error('Use datas de venda e recebimento que já ocorreram.');
    const next=copy(),index=next.sales.findIndex(x=>x.id===s.id);if(index<0)next.sales.unshift(s);else next.sales[index]=s;save(next);$('sale-dialog').close();salesMonth=s.date.slice(0,7);$('sales-month').value=salesMonth;render();panel('records');message('Venda salva. Recebimentos e custos seguem as datas informadas.');
  }catch(err){error('sale-error',err.message);}});
  $('sales-list').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.saleOpen||b.dataset.saleEdit||b.dataset.saleCancel,s=data.sales.find(x=>x.id===id);if(!s)return;
    if(b.dataset.saleOpen){if(!confirm('Abrir o cálculo desta venda? O rascunho atual será substituído. A venda salva não muda.'))return;CamadaApp.loadQuote(s.quote);panel('calculator');}
    if(b.dataset.saleEdit)openSale({quote:s.quote},s);
    if(b.dataset.saleCancel){if(!confirm(s.cancelled?'Restaurar esta venda aos totais?':'Cancelar esta venda e retirar seus valores dos totais? Você poderá restaurá-la.'))return;try{const next=copy();next.sales.find(x=>x.id===id).cancelled=!s.cancelled;save(next);}catch(err){message(err.message);}}
  });
  function openExpense(existing=null){expenseEditing=existing;error('expense-error','');$('expense-name').value=existing?.name||'';$('expense-category').value=existing?.category||'filament';$('expense-amount').value=existing?(existing.amount/100).toFixed(2).replace('.',','):'';$('expense-date').value=existing?.date||F.localDate();$('expense-dialog').showModal();}
  $('new-expense').addEventListener('click',()=>openExpense());
  $('expense-form').addEventListener('submit',e=>{e.preventDefault();try{const ex=F.expense({id:expenseEditing?.id||uid(),name:$('expense-name').value,category:$('expense-category').value,amount:F.cents($('expense-amount').value,'Gasto'),date:$('expense-date').value,cancelled:false});if(ex.date>F.localDate())throw new Error('Use a data em que o gasto foi efetivamente pago.');const next=copy(),index=next.expenses.findIndex(x=>x.id===ex.id);if(index<0)next.expenses.unshift(ex);else next.expenses[index]=ex;save(next);month=ex.date.slice(0,7);$('finance-month').value=month;render();$('expense-dialog').close();message('Gasto pago registrado.');}catch(err){error('expense-error',err.message);}});
  $('expenses-list').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.expenseEdit||b.dataset.expenseCancel,ex=data.expenses.find(x=>x.id===id);if(!ex)return;if(b.dataset.expenseEdit)openExpense(ex);else {if(!confirm(ex.cancelled?'Restaurar este gasto?':'Cancelar este gasto e removê-lo do saldo? Você poderá restaurá-lo.'))return;try{const next=copy();next.expenses.find(x=>x.id===id).cancelled=!ex.cancelled;save(next);}catch(err){message(err.message);}}});
  $('installment-list').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.pay!==undefined){paymentIndex=Number(b.dataset.pay);const p=F.schedule(data.printer)[paymentIndex];$('payment-description').textContent=`Parcela ${p.index+1}, prevista para ${brMonth(p.month)}: ${money(p.amount)}.`;$('payment-date').value=F.localDate();error('payment-error','');$('payment-dialog').showModal();}else if(b.dataset.undoPay!==undefined){if(!confirm('Desfazer a marcação de pagamento? A parcela voltará a ficar em aberto.'))return;try{const next=copy();next.payments=next.payments.filter(p=>p.index!==Number(b.dataset.undoPay));save(next);}catch(err){message(err.message);}}});
  $('payment-form').addEventListener('submit',e=>{e.preventDefault();try{const dt=F.date($('payment-date').value);if(dt>F.localDate())throw new Error('Um pagamento realizado não pode ter data futura.');const next=copy();next.payments.push({index:paymentIndex,date:dt});save(next);$('payment-dialog').close();message('Pagamento registrado. O saldo considera o mês em que você pagou.');}catch(err){error('payment-error',err.message);}});
  $('finance-month').value=month;$('sales-month').value=salesMonth;
  $('finance-month').addEventListener('change',e=>{try{month=F.month(e.target.value);render();}catch{message('Selecione um mês válido.');}});
  $('sales-month').addEventListener('change',e=>{try{salesMonth=F.month(e.target.value);render();}catch{message('Selecione um mês válido.');}});
  for(const id of ['show-cancelled-sales','show-cancelled-expenses'])$(id).addEventListener('change',render);
  let backupUrl=null;
  function download(payload){if(backupUrl)URL.revokeObjectURL(backupUrl);const content=JSON.stringify(payload,null,2);backupUrl=URL.createObjectURL(new Blob([content],{type:'application/json'}));$('backup-content').value=content;$('backup-download').href=backupUrl;$('backup-download').download='camada-backup-'+F.localDate()+'.json';$('backup-dialog').showModal();}
  $('backup-all').addEventListener('click',()=>{if(blocked){message('O controle está ilegível. Restaure uma cópia válida antes de exportar um novo backup.');return;}download({app:'camada-backup',version:1,date:new Date().toISOString(),finance:data,...CamadaApp.exportData()});});
  $('backup-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('backup-content').value);message('Backup copiado. Guarde o conteúdo em um arquivo .json em local privado.');}catch{$('backup-text').open=true;$('backup-content').focus();$('backup-content').select();message('Selecione e copie o conteúdo do backup manualmente.');}});
  $('restore-all').addEventListener('click',()=>$('restore-all-file').click());
  $('restore-all-file').addEventListener('change',async e=>{
    const file=e.target.files[0];e.target.value='';if(!file)return;
    try{
      if(file.size>10*1024*1024)throw new Error('Use um backup de até 10 MB.');
      const clean=F.backup(JSON.parse(await file.text()));
      if(!confirm(`Restaurar ${clean.finance.sales.length} venda(s), ${clean.finance.expenses.length} gasto(s) e ${clean.quotes.length} orçamento(s)? Isto substitui todos os dados atuais deste navegador. Faça um backup antes, se precisar.`))return;
      const entries={[KEY]:JSON.stringify(clean.finance),'camada-v1-history':JSON.stringify(clean.quotes),'camada-v1-filaments':JSON.stringify(clean.filaments),'camada-v1-draft':clean.draft?JSON.stringify(clean.draft):null};
      const prior=Object.fromEntries(Object.keys(entries).map(k=>[k,localStorage.getItem(k)]));
      try{for(const [k,v] of Object.entries(entries))v===null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(err){for(const [k,v] of Object.entries(prior))try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch{}throw new Error('Não foi possível restaurar o backup. Confira espaço e permissões do navegador.');}
      data=clean.finance;blocked=false;$('finance-storage-error').hidden=true;CamadaApp.restoreData(clean);fillPrinter();render();window.dispatchEvent(new Event('camada-finance-change'));message('Backup completo restaurado.');
    }catch(err){message(err instanceof SyntaxError?'Arquivo JSON inválido. Seus dados não foram alterados.':err.message);}
  });
  window.CamadaLedger={isSold:id=>data.sales.some(s=>!s.cancelled&&s.sourceId===id)};
  fillPrinter();render();window.dispatchEvent(new Event('camada-finance-change'));
})();
