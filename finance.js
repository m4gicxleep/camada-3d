(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./calculator.js'));else root.CamadaFinance=factory(root.Camada);})(globalThis,function(C){
  'use strict';
  const LIMIT=5000;
  const empty=()=>({version:1,printer:null,sales:[],expenses:[],payments:[]});
  function fail(message){throw new Error(message);}
  function text(value,label,max=160){if(typeof value!=='string'||!value.trim()||value.length>max)fail(label+' inválido.');return value.trim();}
  function cents(value,label='Valor'){
    const n=C.number(value);if(!Number.isFinite(n)||n<0||n>1e8||Math.abs(n*100-Math.round(n*100))>1e-5)fail(label+': use um valor positivo ou zero, com até 2 casas decimais e sem separador de milhar.');return Math.round(n*100);
  }
  function integer(value,label,min=0,max=1e10){if(!Number.isSafeInteger(value)||value<min||value>max)fail(label+' inválido.');return value;}
  function date(value,label='Data'){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail(label+' inválida.');
    const [y,m,d]=value.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,d));
    if(y<2000||y>2100||dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)fail(label+' inválida.');return value;
  }
  function month(value){if(typeof value!=='string'||!/^\d{4}-\d{2}$/.test(value))fail('Mês inválido.');date(value+'-01');return value;}
  function shiftMonth(value,n){const [y,m]=month(value).split('-').map(Number);const total=y*12+m-1+n;return `${Math.floor(total/12)}-${String(total%12+1).padStart(2,'0')}`;}
  function localDate(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
  function printer(raw){
    const p={name:text(raw.name,'Nome da impressora'),total:integer(raw.total,'Total da impressora',1),down:integer(raw.down,'Entrada'),count:integer(raw.count,'Quantidade de parcelas',1,120),firstMonth:month(raw.firstMonth),downDate:raw.down?date(raw.downDate,'Data da entrada'):null};
    if(p.down>p.total)fail('A entrada não pode ser maior que o valor total.');
    if(p.total>p.down&&p.total-p.down<p.count)fail('O valor financiado precisa permitir pelo menos um centavo por parcela.');
    month(shiftMonth(p.firstMonth,p.count-1));return p;
  }
  function schedule(p){if(!p||p.total===p.down)return [];const financed=p.total-p.down,regular=Math.floor(financed/p.count);return Array.from({length:p.count},(_,i)=>({index:i,month:shiftMonth(p.firstMonth,i),amount:i===p.count-1?financed-regular*(p.count-1):regular}));}
  function sale(raw){
    const q=C.restore(raw.quote),r=C.calculate(q);
    const s={id:text(raw.id,'Identificador'),sourceId:raw.sourceId===null?null:text(raw.sourceId,'Orçamento de origem'),quote:q,name:text(raw.name,'Nome da venda'),date:date(raw.date,'Data da venda'),gross:integer(raw.gross,'Valor da venda',1),fees:integer(raw.fees,'Taxas'),receivedDate:raw.receivedDate===null?null:date(raw.receivedDate,'Data de recebimento'),cancelled:raw.cancelled===true};
    if(typeof raw.cancelled!=='boolean')fail('Situação da venda inválida.');
    if(s.fees>s.gross)fail('As taxas não podem superar o valor recebido pela venda.');
    // Freeze the normalized quote in the record; later edits to a quote never alter old sales.
    s.cost=raw.cost===undefined?Math.round(r.total*100):integer(raw.cost,'Custo guardado da venda');return s;
  }
  const categories={filament:'Filamento',energy:'Energia',maintenance:'Manutenção',accessories:'Acessórios / ferramentas',packaging:'Embalagem',delivery:'Entrega',other:'Outros'};
  function expense(raw){if(!Object.hasOwn(categories,raw.category))fail('Categoria inválida.');if(typeof raw.cancelled!=='boolean')fail('Situação da despesa inválida.');return {id:text(raw.id,'Identificador'),name:text(raw.name,'Descrição'),category:raw.category,date:date(raw.date,'Data do pagamento'),amount:integer(raw.amount,'Valor da despesa',1),cancelled:raw.cancelled};}
  function validate(raw){
    if(!raw||raw.version!==1)fail('Controle financeiro incompatível.');
    for(const k of ['sales','expenses','payments'])if(!Array.isArray(raw[k])||raw[k].length>LIMIT)fail('Lista inválida: '+k);
    const out={version:1,printer:raw.printer===null?null:printer(raw.printer),sales:raw.sales.map(sale),expenses:raw.expenses.map(expense),payments:[]};
    const plan=schedule(out.printer);
    out.payments=raw.payments.map(p=>{
      const index=integer(p.index,'Parcela',0,119);if(!plan[index])fail('Pagamento sem parcela correspondente.');
      return {index,date:date(p.date,'Data do pagamento da parcela')};
    });
    for(const list of [out.sales,out.expenses])if(new Set(list.map(x=>x.id)).size!==list.length)fail('Existem identificadores repetidos.');
    if(new Set(out.payments.map(x=>x.index)).size!==out.payments.length)fail('A mesma parcela foi paga duas vezes.');
    const sources=out.sales.filter(s=>!s.cancelled&&s.sourceId).map(s=>s.sourceId);if(new Set(sources).size!==sources.length)fail('Este orçamento já foi registrado como venda. Abra-o para criar um novo trabalho, se necessário.');
    return out;
  }
  function report(data,selected){
    month(selected);const sales=data.sales.filter(s=>!s.cancelled&&s.date.slice(0,7)===selected);
    const received=data.sales.filter(s=>!s.cancelled&&s.receivedDate?.slice(0,7)===selected);
    const expenses=data.expenses.filter(e=>!e.cancelled&&e.date.slice(0,7)===selected);
    const sum=(items,fn)=>items.reduce((total,item)=>total+fn(item),0);
    const plan=schedule(data.printer),due=plan.filter(p=>p.month===selected);
    const netReceived=sum(received,s=>s.gross-s.fees),spent=sum(expenses,e=>e.amount);
    const down=data.printer?.downDate?.slice(0,7)===selected?data.printer.down:0;
    const paid=sum(data.payments.filter(p=>p.date.slice(0,7)===selected),p=>plan[p.index].amount);
    const available=netReceived-spent-down,target=sum(due,p=>p.amount);
    return {salesCount:sales.length,sold:sum(sales,s=>s.gross),profit:sum(sales,s=>s.gross-s.fees-s.cost),saleCosts:sum(sales,s=>s.cost),saleFees:sum(sales,s=>s.fees),pending:sum(sales.filter(s=>!s.receivedDate||s.receivedDate.slice(0,7)>selected),s=>s.gross-s.fees),netReceived,spent,down,paid,available,target,balance:available-paid,shortfall:Math.max(0,target-available),coverage:target?Math.max(0,Math.min(100,available/target*100)):null,filamentSpent:sum(expenses.filter(e=>e.category==='filament'),e=>e.amount)};
  }
  function backup(raw){
    if(!raw||raw.app!=='camada-backup'||raw.version!==1)fail('Este não é um backup completo compatível. Para um orçamento individual, use “Importar orçamento”.');
    if(!Array.isArray(raw.quotes)||raw.quotes.length>500||!Array.isArray(raw.filaments)||raw.filaments.length>30)fail('Listas do backup inválidas.');
    const quotes=raw.quotes.map(q=>{if(typeof q.id!=='string'||!q.id||q.id.length>160||typeof q.date!=='string'||!Number.isFinite(Date.parse(q.date)))fail('Orçamento com identificador ou data inválida.');return {id:q.id,date:q.date,data:C.restore(q.data)};});
    if(new Set(quotes.map(q=>q.id)).size!==quotes.length)fail('Orçamentos duplicados no backup.');
    const filaments=raw.filaments.map(m=>{const q=C.defaults();q.materials=[{...m,grams:1}];return C.restore(q).materials[0];});
    return {finance:validate(raw.finance),quotes,filaments,draft:raw.draft===null?null:C.restore(raw.draft)};
  }
  return {LIMIT,empty,cents,date,month,localDate,printer,schedule,sale,expense,validate,report,categories,backup};
});
