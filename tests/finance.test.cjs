const {test}=require('node:test'),assert=require('node:assert/strict'),F=require('../finance.js'),C=require('../calculator.js');
const p=(over={})=>F.printer({name:'Minha impressora',total:240000,down:0,count:12,firstMonth:'2026-10',downDate:null,...over});
const q=()=>({...C.defaults(),energyEnabled:false,machineEnabled:false,reserve:0});
const s=(over={})=>F.sale({id:'s1',sourceId:null,quote:q(),name:'Peça',date:'2026-10-20',gross:10000,fees:500,receivedDate:'2026-10-21',cancelled:false,...over});
const e=(over={})=>F.expense({id:'e1',name:'Rolo',date:'2026-10-19',category:'filament',amount:3000,cancelled:false,...over});
test('12 parcelas atravessam dezembro e somam o total exato',()=>{const plan=F.schedule(p());assert.equal(plan.length,12);assert.equal(plan[0].amount,20000);assert.equal(plan[3].month,'2027-01');assert.equal(plan.at(-1).month,'2027-09');assert.equal(plan.reduce((sum,x)=>sum+x.amount,0),240000);});
test('entrada e arredondamento não perdem centavos',()=>{const printer=p({total:10000,down:1000,downDate:'2026-09-01',count:7});const plan=F.schedule(printer);assert.equal(plan[0].amount,1285);assert.equal(plan.at(-1).amount,1290);assert.equal(plan.reduce((s,x)=>s+x.amount,1000),10000);});
test('pagamento integral na entrada não gera parcelas',()=>assert.deepEqual(F.schedule(p({down:240000,downDate:'2026-10-01'})),[]));
test('novo controle não tem vendas, despesas ou dívida fictícia',()=>{const r=F.report(F.empty(),'2026-10');assert.equal(r.sold,0);assert.equal(r.balance,0);assert.equal(r.target,0);});
test('orçamento sozinho não entra no resultado: só vendas registradas',()=>{const data=F.empty();data.quotes=[q()];assert.equal(F.report(data,'2026-10').profit,0);});
test('lucro estimado e caixa não descontam o rolo duas vezes',()=>{const data=F.empty();data.sales=[s()];data.expenses=[e()];const r=F.report(data,'2026-10');assert.equal(r.sold,10000);assert.equal(r.profit,8500);assert.equal(r.netReceived,9500);assert.equal(r.spent,3000);assert.equal(r.balance,6500);assert.equal(r.filamentSpent,3000);});
test('venda a receber gera estimativa mas nenhum dinheiro disponível',()=>{const data=F.empty();data.sales=[s({receivedDate:null})];const r=F.report(data,'2026-10');assert.equal(r.profit,8500);assert.equal(r.netReceived,0);assert.equal(r.pending,9500);});
test('recebimento em novembro de venda de outubro entra no caixa de novembro',()=>{const data=F.empty();data.sales=[s({receivedDate:'2026-11-02'})];const oct=F.report(data,'2026-10'),nov=F.report(data,'2026-11');assert.equal(oct.pending,9500);assert.equal(oct.netReceived,0);assert.equal(nov.profit,0);assert.equal(nov.netReceived,9500);});
test('cobrir uma parcela não a marca como paga',()=>{const data=F.empty();data.printer=p({total:120000});data.sales=[s({gross:15000,fees:0})];let r=F.report(data,'2026-10');assert.equal(r.shortfall,0);assert.equal(r.paid,0);assert.equal(r.balance,15000);data.payments=[{index:0,date:'2026-10-22'}];r=F.report(data,'2026-10');assert.equal(r.paid,10000);assert.equal(r.balance,5000);assert.equal(r.available,15000);});
test('pagamento atrasado sai no mês efetivo e não no mês previsto',()=>{const data=F.empty();data.printer=p();data.payments=[{index:0,date:'2026-11-02'}];assert.equal(F.report(data,'2026-10').paid,0);assert.equal(F.report(data,'2026-11').paid,20000);});
test('entrada sai uma única vez, no mês de pagamento',()=>{const data=F.empty();data.printer=p({down:40000,downDate:'2026-09-01'});assert.equal(F.report(data,'2026-09').balance,-40000);assert.equal(F.report(data,'2026-10').down,0);});
test('cancelados não entram e restaurados voltam aos totais',()=>{const data=F.empty();data.sales=[s({cancelled:true})];data.expenses=[e({cancelled:true})];assert.equal(F.report(data,'2026-10').balance,0);data.sales[0].cancelled=false;data.expenses[0].cancelled=false;assert.equal(F.report(data,'2026-10').balance,6500);});
test('meses históricos mantêm dados ao adicionar novo mês',()=>{const data=F.empty();data.sales=[s()];const before=F.report(data,'2026-10');data.sales.push(s({id:'s2',date:'2026-11-01',receivedDate:'2026-11-01'}));assert.deepEqual(F.report(data,'2026-10'),before);});
test('custos guardados não dependem de mudanças posteriores no orçamento',()=>{const quote=q();const saved=s({quote});quote.materials[0].price=900;assert.equal(saved.quote.materials[0].price,100);assert.equal(saved.cost,1000);const old=s({...saved,cost:1234});assert.equal(F.validate({...F.empty(),sales:[old]}).sales[0].cost,1234);});
test('centavos aceitam vírgula, rejeitam negativos, infinito e mais de duas casas',()=>{assert.equal(F.cents('12,50'),1250);assert.equal(F.cents(0),0);for(const v of [-1,Infinity,'','10,123','1.000,00'])assert.throws(()=>F.cents(v));});
test('datas reais, meses e anos bissextos validados sem fuso',()=>{assert.equal(F.date('2028-02-29'),'2028-02-29');for(const dt of ['2026-02-29','2026-13-01','2026-04-31','2026-1-01','abc'])assert.throws(()=>F.date(dt));assert.throws(()=>F.month('2026-00'));assert.throws(()=>F.month(''));});
test('parcelamento inválido é rejeitado',()=>{for(const over of [{down:250000},{count:0},{count:1.5},{count:121},{total:10,count:12}])assert.throws(()=>p(over));});
test('venda grátis, taxas excessivas e valores não inteiros são rejeitados',()=>{for(const over of [{gross:0},{fees:10001},{gross:10.2},{receivedDate:'x'},{cost:-1}])assert.throws(()=>s(over));});
test('mesmo orçamento não vira duas vendas ativas',()=>{const data=F.empty();data.sales=[s({sourceId:'q1'}),s({id:'s2',sourceId:'q1'})];assert.throws(()=>F.validate(data));data.sales[0].cancelled=true;assert.equal(F.validate(data).sales.length,2);});
test('backup financeiro mantém valores e pagamentos',()=>{const data={...F.empty(),printer:p(),sales:[s()],expenses:[e()],payments:[{index:0,date:'2026-10-22'}]};assert.deepEqual(F.validate(JSON.parse(JSON.stringify(data))),data);});
test('backup rejeita corrupção, IDs repetidos e parcelas inexistentes/duplicadas',()=>{
  for(const data of [null,{}, {...F.empty(),sales:[s(),s()]},{...F.empty(),expenses:[e(),e()]},{...F.empty(),payments:[{index:0,date:'2026-10-01'}]},{...F.empty(),printer:p(),payments:[{index:0,date:'2026-10-01'},{index:0,date:'2026-10-02'}]}])assert.throws(()=>F.validate(data));
});
test('saldo negativo não é apresentado como meta coberta',()=>{const data={...F.empty(),printer:p(),expenses:[e()]};const r=F.report(data,'2026-10');assert.equal(r.available,-3000);assert.equal(r.coverage,0);assert.equal(r.shortfall,23000);});
test('backup completo inclui orçamento antigo e o restaura sem classificá-lo como venda',()=>{
  const quote=q();delete quote.energyMode;delete quote.measuredKwh;
  const restored=F.backup({app:'camada-backup',version:1,finance:F.empty(),quotes:[{id:'antigo',date:'2026-10-22T13:00:00Z',data:quote}],filaments:[quote.materials[0]],draft:quote});
  assert.equal(restored.quotes[0].data.energyMode,'power');assert.equal(restored.finance.sales.length,0);assert.equal(restored.filaments.length,1);assert.equal(C.calculate(restored.draft).total,10);
});
test('backup completo rejeita formatos estranhos e orçamentos duplicados',()=>{
  const base={app:'camada-backup',version:1,finance:F.empty(),quotes:[],filaments:[],draft:null};
  for(const v of [null,{...base,version:99},{...base,quotes:null},{...base,finance:{version:1}},{...base,quotes:[{id:'q',date:'x',data:q()}]}])assert.throws(()=>F.backup(v));
  const quote={id:'q',date:'2026-10-22T13:00:00Z',data:q()};assert.throws(()=>F.backup({...base,quotes:[quote,quote]}));
});
