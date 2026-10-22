const IA={
  log(D,icon,txt){
    D.feed.unshift({icon,txt,time:new Date().toLocaleTimeString('pt-BR')});
    if(D.feed.length>30) D.feed.pop();
  },
  tarifa(uso){
    const h=new Date().getHours();
    let t=h>=18&&h<21?{valor:1.85,tier:'pico',label:'horário de pico'}
      :h>=21||h<6?{valor:0.95,tier:'offpeak',label:'horário off-peak'}
      :{valor:1.40,tier:'normal',label:'horário normal'};
    if(uso>80) t={...t,valor:t.valor*1.15,label:t.label+' + alta demanda'};
    return t;
  },
  analisar(D){
    const at=D.chargers.filter(c=>c.status);
    const tot=at.reduce((s,c)=>s+c.pot,0);
    const lim=D.chargers.reduce((s,c)=>s+c.potencia,0)*LIMITE_IA;
    const antes=D.alerta;
    D.alerta=null;
    D.chargers.forEach(c=>c.limitado=false);
    if(tot>lim&&tot>0){
      const f=lim*0.95/tot;
      at.forEach(c=>{c.pot*=f;c.limitado=true;});
      D.alerta=`Demanda de ${tot.toFixed(0)} kW acima do limite de ${lim.toFixed(0)} kW. A IA reduziu a potência dos carregadores ativos em ${((1-f)*100).toFixed(0)}%.`;
      if(!antes) this.log(D,'⚡',D.alerta);
    }
  },
  insights(D,uso,t){
    const av=D.avisos=D.avisos||{};
    const luc=x=>x.receita-x.gasto;
    if(D.tier&&D.tier!==t.tier) this.log(D,'💡',`Tarifa mudou para ${t.label}: ${brl(t.valor)}/kWh.`);
    D.tier=t.tier;
    D.chargers.forEach(c=>{
      const k='off'+c.id;
      if(c.status) delete av[k];
      else if(!av[k]){ av[k]=1; this.log(D,'💡',`${c.idLabel} está offline e não gera receita. Para reativar, digite: ligar ${c.idLabel}.`); }
    });
    if(uso<70) delete av.alto;
    else if(uso>=80&&!av.alto&&!D.alerta){ av.alto=1; this.log(D,'💡',`Uso em ${uso.toFixed(0)}% da capacidade, perto do limite de ${LIMITE_IA*100}%. Se passar, a IA reduz a potência.`); }
    const r=[...D.chargers].sort((a,b)=>luc(b)-luc(a));
    if(r.length>1&&App.n%48===0) this.log(D,'💡',`Mais lucrativo: ${r[0].idLabel} (${brl(luc(r[0]))}). Menos lucrativo: ${r[r.length-1].idLabel} (${brl(luc(r[r.length-1]))}).`);
  },
  comando(txt,D){
    const t=txt.toLowerCase().trim(), c=D.chargers;
    const alvo=c.find(x=>t.includes(x.idLabel.toLowerCase()));
    if(t.includes('resumo')){
      const rec=c.reduce((s,x)=>s+x.receita,0), gas=c.reduce((s,x)=>s+x.gasto,0);
      return `${c.filter(x=>x.status).length} de ${c.length} carregadores ativos. Receita ${brl(rec)}, gasto ${brl(gas)}, lucro ${brl(rec-gas)}.`;
    }
    if(t.includes('ranking')){
      if(!c.length) return 'Nenhum carregador cadastrado.';
      return [...c].sort((a,b)=>(b.receita-b.gasto)-(a.receita-a.gasto)).map((x,i)=>`${i+1}º ${x.idLabel} ${brl(x.receita-x.gasto)}`).join(' · ');
    }
    if(t.includes('tarifa')){ const tf=this.tarifa(App.usoGlobal()); return `Tarifa atual: ${brl(tf.valor)}/kWh (${tf.label}).`; }
    if(t.startsWith('status')){
      if(!alvo) return 'Informe o código do carregador, por exemplo: status AM-01.';
      return `${alvo.idLabel} ${alvo.nome}: ${alvo.status?`${alvo.pot.toFixed(0)} de ${alvo.potencia} kW (${(alvo.pot/alvo.potencia*100).toFixed(0)}%)`:'offline'}, ${alvo.kwh.toFixed(0)} kWh vendidos, lucro ${brl(alvo.receita-alvo.gasto)}.`;
    }
    if(t.startsWith('ligar')||t.startsWith('desligar')){
      const on=t.startsWith('ligar');
      const lista=t.includes('todos')?c:alvo?[alvo]:[];
      if(!lista.length) return 'Informe "todos" ou o código do carregador, por exemplo: ligar AM-01.';
      lista.forEach(x=>{x.status=on; if(!on) x.pot=0;});
      return `${lista.length} carregador(es) ${on?'ligado(s)':'desligado(s)'} pela IA.`;
    }
    return 'Comandos: resumo · ranking · tarifa · status AM-01 · ligar todos · desligar AM-01';
  }
};
