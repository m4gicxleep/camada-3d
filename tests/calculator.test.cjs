const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../calculator.js');
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const base=()=>({...C.defaults(),energyEnabled:false,machineEnabled:false,reserve:0});
test('rolo não é cobrado inteiro: 100 g de um rolo de R$ 100 / 1000 g = R$ 10',()=>near(C.calculate(base()).total,10));
test('exemplo completo: material, energia, desgaste, manutenção e reserva',()=>{
  const r=C.calculate(C.defaults());assert.equal(r.ok,true);near(r.material,10);near(r.energy,.48);near(r.depreciation,2);near(r.maintenance,.4);near(r.reserve,1.288);near(r.total,14.168);
});
test('frete e desconto são distribuídos pelo peso líquido, inclusive rolo de 750 g',()=>{
  const s=base();s.materials=[{name:'PETG',price:80,shipping:20,discount:10,spool:750,grams:125}];near(C.calculate(s).total,15);
});
test('dois filamentos com preços e pesos distintos',()=>{
  const s=base();s.materials.push({name:'PETG',price:150,shipping:0,discount:0,spool:750,grams:25});near(C.calculate(s).total,15);
});
test('quantidade divide o trabalho, sem multiplicar peso ou tempo novamente',()=>{
  const s=base();s.quantity=4;const r=C.calculate(s);near(r.total,10);near(r.unit,2.5);near(r.duration,4);
});
test('energia usa W / 1000, duração em horas e minutos',()=>{
  const s={...base(),energyEnabled:true,watts:200,tariff:1.2,hours:2,minutes:30};near(C.calculate(s).energy,.6);
});
test('mão de obra usa somente minutos ativos e extras não recebem reserva de falha',()=>{
  const s={...base(),laborEnabled:true,prepMinutes:30,finishMinutes:15,hourly:20,extra:5,packaging:2,delivery:8,reserve:10};
  const r=C.calculate(s);near(r.labor,15);near(r.reserve,1);near(r.total,41);
});
test('desgaste considera valor residual e fixos são rateados por hora',()=>{
  const s={...base(),machineEnabled:true,printer:3000,residual:500,lifetime:5000,maintenance:.25,overheadEnabled:true,monthly:200,monthlyHours:100};
  const r=C.calculate(s);near(r.depreciation,2);near(r.maintenance,1);near(r.overhead,8);near(r.total,21);
});
test('margem é percentual sobre venda, não acréscimo ao custo',()=>{
  const s={...base(),selling:true,margin:25};s.materials[0].grams=750;const r=C.calculate(s);near(r.price,100);near(r.profit,25);
});
test('taxas percentuais, imposto e taxa fixa preservam a margem no total do pedido',()=>{
  const s={...base(),selling:true,margin:20,fees:10,tax:5,fixedFee:3,quantity:3};
  const r=C.calculate(s);near(r.price,20);near(r.fees,5);near(r.taxes,1);near(r.profit,4);
});
test('arredondamento da venda para cima ao centavo preserva margem',()=>{
  const s={...base(),selling:true,margin:30,fees:4,tax:2};const r=C.calculate(s);assert.equal(r.price,15.63);assert.ok(r.profit/r.price>=.3);
});
test('uso pessoal não aplica valores de taxas e margem de venda',()=>{const s={...base(),margin:99,fees:99,tax:99};const r=C.calculate(s);assert.equal(r.ok,true);assert.equal(r.price,null);near(r.total,10);});
test('desativar um grupo remove seu custo',()=>{const s={...base(),watts:9000,printer:90000,hourly:100,prepMinutes:1000,monthly:10000};near(C.calculate(s).total,10);});
test('números brasileiros aceitam vírgula e rejeitam formatos ambíguos',()=>{
  near(C.number('10,50'),10.5);near(C.number('10.50'),10.5);assert.ok(Number.isNaN(C.number('1.000,50')));assert.ok(Number.isNaN(C.number('1e3')));assert.ok(Number.isNaN(C.number('')));assert.ok(Number.isNaN(C.number(null)));
});
for(const [field,value] of [['quantity',0],['quantity',1.5],['hours',-1],['minutes',60],['minutes',1.5],['hours',''],['reserve',101],['extra',Infinity]]) {
  test(`rejeita ${field}=${value} sem mostrar um custo válido`,()=>{const s=base();s[field]=value;assert.equal(C.calculate(s).ok,false);});
}
test('tempo zero é inválido',()=>assert.equal(C.calculate({...base(),hours:0,minutes:0}).ok,false));
test('divisões por zero são rejeitadas',()=>{
  const s=base();s.materials[0].spool=0;assert.equal(C.calculate(s).ok,false);
  assert.equal(C.calculate({...base(),machineEnabled:true,lifetime:0}).ok,false);
  assert.equal(C.calculate({...base(),overheadEnabled:true,monthlyHours:0}).ok,false);
});
test('desconto maior que compra e revenda maior que máquina são rejeitados',()=>{
  const s=base();s.materials[0].discount=101;assert.equal(C.calculate(s).ok,false);
  assert.equal(C.calculate({...base(),machineEnabled:true,residual:3000}).ok,false);
});
test('margem + taxas + impostos em 100% ou acima são bloqueados',()=>{
  for(const fees of [75,80])assert.equal(C.calculate({...base(),selling:true,margin:25,fees}).ok,false);
});
test('material gratuito e custo zero são permitidos sem NaN',()=>{
  const s=base();s.materials[0].price=0;s.selling=true;const r=C.calculate(s);assert.equal(r.ok,true);near(r.total,0);near(r.price,0);near(r.profit,0);
});
test('backup normalizado mantém cálculo e não compartilha referências',()=>{
  const s=C.defaults(),copy=C.restore(JSON.parse(JSON.stringify(s)));assert.deepEqual(copy,s);copy.materials[0].price=0;assert.equal(s.materials[0].price,100);
});
test('importação rejeita dados quebrados, campos ausentes e materiais inválidos',()=>{
  for(const v of [null,{},[],{...base(),materials:[]},{...base(),materials:[null]},{...base(),quantity:'texto'},{...base(),simulation:'false'}]) assert.throws(()=>C.restore(v));
});
test('Orca/Prusa textual: peso e tempo com arredondamento para cima ao minuto',()=>{
  assert.deepEqual(C.parseGcode('; filament used [g] = 42.5\n; estimated printing time (normal mode) = 1h 2m 3s'),{grams:42.5,hours:1,minutes:3});
});
test('tempo total reconhecido é preferido ao tempo só do modelo',()=>{
  assert.deepEqual(C.parseGcode('; total filament used [g] = 100\n; model printing time = 2h 0m\n; total estimated time = 2h 10m'),{grams:100,hours:2,minutes:10});
});
test('G-code incompleto, múltiplos filamentos, peso zero e outros formatos são rejeitados',()=>{
  for(const content of ['', '; filament used [mm] = 100\n;TIME:300', '; filament used [g] = 2, 5\n; estimated printing time (normal mode) = 1h','; filament used [g] = 0\n; estimated printing time (normal mode) = 1h'])assert.throws(()=>C.parseGcode(content));
});
test('1000 cenários: custo soma os componentes e preço cobre custos + margem',()=>{
  let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
  for(let i=0;i<1000;i++){
    const s=C.defaults();s.materials[0].price=rand()*300;s.materials[0].grams=1+rand()*1500;s.hours=1+Math.floor(rand()*50);s.quantity=1+Math.floor(rand()*20);s.selling=true;s.margin=rand()*40;s.fees=rand()*15;s.tax=rand()*15;s.fixedFee=rand()*10;
    const r=C.calculate(s);assert.equal(r.ok,true);near(r.unit*r.quantity,r.total);near(r.total,r.material+r.energy+r.depreciation+r.maintenance+r.overhead+r.reserve+r.labor+r.extra+r.packaging+r.delivery);assert.ok(r.profit/r.price+1e-10>=s.margin/100);assert.ok(Number.isFinite(r.price));
  }
});
test('campo incompleto em grupo desativado não impede salvar o orçamento',()=>{
  const s=base();s.watts='';s.hourly='';assert.equal(C.calculate(s).ok,true);assert.equal(C.calculate(C.restore(s)).ok,true);
});
test('Orca com tempo total na mesma linha e dois-pontos',()=>{
  assert.deepEqual(C.parseGcode('; filament used [g] = 29.81\n; model printing time: 1h 15m 10s; total estimated time: 1h 21m 15s'),{grams:29.81,hours:1,minutes:22});
});
test('peso total não esconde dados de vários filamentos',()=>{
  assert.throws(()=>C.parseGcode('; total filament used [g] = 10\n; filament used [g] = 3,7\n; estimated printing time (normal mode) = 1h'));
});
test('energia medida usa kWh reais em vez da potência estimada',()=>{
  const s={...base(),energyEnabled:true,energyMode:'measured',measuredKwh:.75,tariff:1.2,watts:9999};const r=C.calculate(s);near(r.kwh,.75);near(r.energy,.9);
});
test('energia medida inválida e modo desconhecido são bloqueados',()=>{
  assert.equal(C.calculate({...base(),energyEnabled:true,energyMode:'measured',measuredKwh:-1}).ok,false);
  assert.equal(C.calculate({...base(),energyEnabled:true,energyMode:'other'}).ok,false);
});
test('backup antigo ganha os novos campos de energia sem alterar o custo',()=>{
  const s=C.defaults();delete s.energyMode;delete s.measuredKwh;const restored=C.restore(s);assert.equal(restored.energyMode,'power');near(C.calculate(restored).total,14.168);
});
test('novo cálculo não apresenta um total enquanto faltarem valores essenciais',()=>assert.equal(C.calculate(C.empty()).ok,false));
