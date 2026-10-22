(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Camada = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const defaults = () => ({
    name: 'Suporte de mesa', simulation: true, selling: false, quantity: 1,
    hours: 4, minutes: 0,
    materials: [{name: 'PLA · exemplo', price: 100, shipping: 0, discount: 0, spool: 1000, grams: 100}],
    energyEnabled: true, energyMode: 'power', measuredKwh: 0, watts: 120, tariff: 1,
    machineEnabled: true, printer: 2500, residual: 0, lifetime: 5000, maintenance: 0.10,
    overheadEnabled: false, monthly: 0, monthlyHours: 100,
    laborEnabled: false, prepMinutes: 0, finishMinutes: 0, hourly: 0,
    extra: 0, packaging: 0, delivery: 0, reserve: 10,
    margin: 25, fees: 0, tax: 0, fixedFee: 0
  });
  function number(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string') return NaN;
    const str = value.trim();
    // No grouping separators: a single dot or comma always means decimals.
    if (!/^-?\d+(?:[.,]\d+)?$/.test(str)) return NaN;
    return Number(str.replace(',', '.'));
  }
  function calculate(input) {
    const errors = {};
    const n = (key, label, min=0, max=1e9, integer=false, obj=input, path=key) => {
      const v = number(obj[key]);
      if (!Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) {
        errors[path] = `${label}: informe ${integer ? 'um número inteiro' : 'um número'} entre ${min} e ${max}, sem separador de milhar.`;
        return 0;
      }
      return v;
    };
    if (!input || typeof input !== 'object') return {ok:false, errors:{form:'Dados inválidos.'}};
    const quantity=n('quantity','Quantidade',1,100000,true);
    const hours=n('hours','Horas',0,100000,true), minutes=n('minutes','Minutos',0,59,true);
    const duration=hours+minutes/60;
    if (!duration) errors.hours='Informe uma duração maior que zero.';
    const materials=[];
    if (!Array.isArray(input.materials) || !input.materials.length || input.materials.length>20) errors.materials='Use de 1 a 20 filamentos.';
    else input.materials.forEach((m,i)=> {
      if (!m || typeof m!=='object') {errors.materials='Filamento inválido.'; return;}
      const read=(key,label,min=0)=>n(key,label,min,1e9,false,m,`materials.${i}.${key}`);
      const price=read('price','Preço do rolo'), shipping=read('shipping','Frete do rolo'), discount=read('discount','Desconto');
      const spool=read('spool','Peso líquido do rolo',0.001), grams=read('grams','Consumo',0.001);
      if(discount>price+shipping) errors[`materials.${i}.discount`]='O desconto não pode superar o preço mais o frete.';
      materials.push({name:String(m.name||`Filamento ${i+1}`).slice(0,100),grams,spool,unit:(price+shipping-discount)/(spool||1),cost:(price+shipping-discount)/(spool||1)*grams});
    });
    const material=materials.reduce((s,m)=>s+m.cost,0);
    const energyMode=input.energyMode||'power';
    if(input.energyEnabled&&!['power','measured'].includes(energyMode)) errors.energyMode='Escolha a forma de calcular a energia.';
    const kwh=input.energyEnabled?(energyMode==='measured'?n('measuredKwh','Energia medida',0,1e7):n('watts','Potência média',0,100000)/1000*duration):0;
    const energy=input.energyEnabled?kwh*n('tariff','Tarifa de energia',0,100):0;
    let depreciation=0, maintenance=0, overhead=0, labor=0;
    if(input.machineEnabled) {
      const printer=n('printer','Preço da impressora'), residual=n('residual','Valor residual'), lifetime=n('lifetime','Vida útil em horas',1,1e7);
      if(residual>printer) errors.residual='O valor residual não pode superar o preço da impressora.';
      depreciation=(printer-residual)/(lifetime||1)*duration;
      maintenance=n('maintenance','Manutenção por hora')*duration;
    }
    if(input.overheadEnabled) overhead=n('monthly','Custos fixos mensais')/(n('monthlyHours','Horas produtivas mensais',0.01,744)||1)*duration;
    if(input.laborEnabled) labor=(n('prepMinutes','Minutos de preparação')+n('finishMinutes','Minutos de acabamento'))/60*n('hourly','Valor da sua hora');
    const printing=material+energy+depreciation+maintenance+overhead;
    const reserve=printing*n('reserve','Reserva para falhas',0,100)/100;
    const extra=n('extra','Insumos extras'), packaging=n('packaging','Embalagem'), delivery=n('delivery','Frete de entrega');
    const total=printing+reserve+labor+extra+packaging+delivery;
    let price=null, profit=null, fees=0, taxes=0, margin=0;
    if(input.selling) {
      margin=n('margin','Margem',0,99.99)/100;
      const feeRate=n('fees','Taxas percentuais',0,99.99)/100, taxRate=n('tax','Impostos percentuais',0,99.99)/100;
      const fixed=n('fixedFee','Taxa fixa');
      if(margin+feeRate+taxRate>=1) errors.margin='Margem + taxas + impostos devem somar menos de 100%.';
      else {
        const raw=(total+fixed)/(1-margin-feeRate-taxRate);
        // Round the order price UP to cents to preserve the requested margin.
        price=Math.ceil((raw-1e-9)*100)/100;
        fees=price*feeRate+fixed; taxes=price*taxRate; profit=price-total-fees-taxes;
      }
    }
    if(Object.keys(errors).length) return {ok:false,errors};
    return {ok:true,quantity,duration,materials,material,kwh,energy,depreciation,maintenance,overhead,labor,printing,reserve,extra,packaging,delivery,total,unit:total/quantity,price,profit,fees,taxes,margin};
  }
  function restore(raw) {
    if(!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('Formato de orçamento inválido.');
    const base=defaults();
    const groups={energyEnabled:['watts','tariff','measuredKwh'],machineEnabled:['printer','residual','lifetime','maintenance'],laborEnabled:['prepMinutes','finishMinutes','hourly'],overheadEnabled:['monthly','monthlyHours'],selling:['margin','fees','tax','fixedFee']};
    const inactive=new Set(Object.entries(groups).filter(([flag])=>raw[flag]===false).flatMap(([,keys])=>keys));
    for(const key of Object.keys(base)) {
      if(key==='materials') continue;
      if(typeof base[key]==='boolean') {if(typeof raw[key]!=='boolean') throw new Error('Opção ausente ou inválida: '+key); base[key]=raw[key];}
      else if(typeof base[key]==='string') base[key]=String(raw[key]||(key==='energyMode'?'power':'Minha impressão')).slice(0,100);
      else if(key==='measuredKwh'&&raw[key]===undefined) base[key]=0;
      else { const v=number(raw[key]); if(!Number.isFinite(v)||v<0||v>1e9) {if(inactive.has(key))continue;throw new Error('Campo inválido: '+key);} base[key]=v; }
    }
    if(!Array.isArray(raw.materials) || raw.materials.length<1 || raw.materials.length>20) throw new Error('Lista de filamentos inválida.');
    base.materials=raw.materials.map(m=>{
      if(!m || typeof m!=='object') throw new Error('Filamento inválido.');
      const out={name:String(m.name||'Filamento').slice(0,100)};
      for(const key of ['price','shipping','discount','spool','grams']) out[key]=number(m[key]);
      return out;
    });
    if(!calculate(base).ok) throw new Error('O arquivo contém valores inválidos. Confira o orçamento original.');
    return base;
  }
  function parseGcode(text) {
    const weightLines=[...text.matchAll(/^;\s*(?:total filament used \[g\]|filament used \[g\])\s*[:=]\s*([^\r\n]+)/gim)];
    if(weightLines.some(m=>/[,;]/.test(m[1].trim()))) throw new Error('Arquivo com vários filamentos: preencha o consumo de cada material manualmente para manter os custos corretos.');
    const weight=text.match(/^;\s*(?:total filament used \[g\]|filament used \[g\])\s*[:=]\s*([^\r\n]+)/im);
    let grams=null, seconds=null;
    if(weight) {
      const values=weight[1].trim().split(/[,;]/).map(s=>Number(s.trim()));
      if(values.length!==1) throw new Error('Arquivo com vários filamentos: preencha o consumo de cada material manualmente para manter os custos corretos.');
      if(Number.isFinite(values[0])&&values[0]>0) grams=values[0];
    }
    const estimate=text.match(/^;\s*(?:estimated printing time \(normal mode\)|model printing time)\s*[:=]\s*([^\r\n;]+)/im);
    if(estimate) {
      const matches=[...estimate[1].matchAll(/(\d+(?:\.\d+)?)\s*(d|h|m|s)/g)];
      if(matches.length) seconds=matches.reduce((s,m)=>s+Number(m[1])*({d:86400,h:3600,m:60,s:1}[m[2]]),0);
    }
    const totalTime=text.match(/;\s*total estimated time\s*[:=]\s*([^\r\n;]+)/i);
    if(totalTime) {
      const matches=[...totalTime[1].matchAll(/(\d+(?:\.\d+)?)\s*(d|h|m|s)/g)];
      if(matches.length) seconds=matches.reduce((s,m)=>s+Number(m[1])*({d:86400,h:3600,m:60,s:1}[m[2]]),0);
    }
    if(!(grams>0&&seconds>0)) throw new Error('Não encontrei peso em gramas e tempo reconhecíveis. Copie esses valores do fatiador; nada foi alterado.');
    const mins=Math.ceil(seconds/60);
    return {grams,hours:Math.floor(mins/60),minutes:mins%60};
  }
  const empty=()=>({...defaults(),name:'Minha impressão',simulation:false,hours:'',materials:[{name:'Meu filamento',price:'',shipping:0,discount:0,spool:1000,grams:''}],energyEnabled:false,machineEnabled:false,reserve:0});
  return {defaults,empty,number,calculate,restore,parseGcode};
});
