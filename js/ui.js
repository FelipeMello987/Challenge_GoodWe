const UI={
  tela:'dashboard',
  filtro:'todos',
  editId:null,

  lista(){
    const c=App.D.chargers;
    return this.filtro==='todos'?c:c.filter(x=>x.id==this.filtro);
  },
  navegar(t){
    this.tela=t;
    ['dashboard','mapa'].forEach(n=>document.getElementById('nav-'+n).classList.toggle('active',n===t));
    this.render();
  },
  filtrar(v){ this.filtro=v; this.navegar('dashboard'); },
  selecionar(id){ this.filtrar(String(id)); },
  alternarSel(id){ this.filtrar(this.filtro==id?'todos':String(id)); },

  render(){
    const D=App.D, el=document.getElementById('content'), top=el.scrollTop;
    const ia=document.getElementById('ia-input'), foco=ia&&document.activeElement===ia, txt=ia?ia.value:'', rolagens=[...el.querySelectorAll('.lista')].map(l=>l.scrollTop);
    if(this.filtro!=='todos'&&!D.chargers.some(x=>x.id==this.filtro)) this.filtro='todos';
    const opts='<option value="todos">Todos os postos</option>'+
      D.chargers.map(x=>`<option value="${x.id}" ${x.id==this.filtro?'selected':''}>${x.idLabel} ${esc(x.nome)}</option>`).join('');
    if(opts!==this.opts){ document.getElementById('filtro').innerHTML=opts; this.opts=opts; }
    const al=document.getElementById('alerta');
    al.style.display=D.alerta?'block':'none';
    al.innerText=D.alerta?'⚡ '+D.alerta:'';
    el.innerHTML=this.tela==='mapa'?Mapa.render(D.chargers):this.dashboard();
    el.scrollTop=top;
    el.querySelectorAll('.lista').forEach((l,i)=>l.scrollTop=rolagens[i]||0);
    el.querySelectorAll('.card .value').forEach(d=>{const n=d.textContent.length; d.className+=n>13?' xs':n>11?' sm':n>9?' md':'';});
    const nia=document.getElementById('ia-input');
    if(nia&&ia){ nia.value=txt; if(foco) nia.focus({preventScroll:true}); }
    el.scrollTop=top;
  },

  dashboard(){
    const D=App.D, L=this.lista(), ids=L.map(x=>x.id);
    const soma=k=>L.reduce((s,c)=>s+c[k],0);
    const pot=soma('pot'), cap=soma('potencia'), rec=soma('receita'), gas=soma('gasto');
    const ativos=L.filter(c=>c.status).length;
    const uso=cap?Math.min(100,pot/cap*100):0;
    const t=IA.tarifa(App.usoGlobal());
    const hist=D.hist.map(h=>ids.reduce((s,i)=>s+(h[i]||0),0));
    const trans=D.transacoes.filter(x=>ids.includes(x.id));
    const lucro=rec-gas;
    const titulo=this.filtro==='todos'?'Todos os postos':L[0].idLabel+' '+esc(L[0].nome);

    return `
    <div class="section-label">${titulo}</div>
    <div class="cards">
      <div class="card" style="--accent-rgb:59,130,246"><h3>Potência ativa</h3><div class="value">${pot.toFixed(0)} kW</div><div class="sub">de ${cap} kW instalados</div></div>
      <div class="card" style="--accent-rgb:52,211,153"><h3>Carregadores ativos</h3><div class="value">${ativos} / ${L.length}</div><div class="sub">${L.length-ativos} offline</div></div>
      <div class="card" style="--accent-rgb:251,191,36"><h3>Receita</h3><div class="value">${brlc(rec)}</div><div class="sub">${soma('kwh').toFixed(0)} kWh vendidos</div></div>
      <div class="card" style="--accent-rgb:248,113,113"><h3>Gasto com energia</h3><div class="value">${brlc(gas)}</div><div class="sub">custo de R$ ${CUSTO_KWH.toFixed(2)}/kWh</div></div>
      <div class="card" style="--accent-rgb:52,211,153"><h3>Lucro</h3><div class="value ${lucro>=0?'up':''}" style="${lucro<0?'color:#f87171':''}">${brlc(lucro)}</div><div class="sub">receita − gasto</div></div>
      <div class="card" style="--accent-rgb:34,211,238"><h3>Tarifa atual (IA)</h3><div class="value">${brl(t.valor)}</div><div class="sub">por kWh · ${t.label}</div></div>
    </div>

    <div class="row2">
      <div class="panel">
        <div class="panel-title"><span>📈 Consumo em tempo real</span></div>
        ${Grafico.svg(hist.length?hist:[0],cap*LIMITE_IA)}
        <div class="bars">
          <div class="bar-block">
            <div class="bar-label"><span>Uso da capacidade</span><span>${uso.toFixed(0)}%</span></div>
            <div class="bar-bg"><div class="bar-fill" style="width:${uso}%;background:#3b82f6"></div></div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title"><span>🔌 Carregadores</span><button class="add-btn" onclick="UI.abrirModal()">+ Cadastrar</button></div>
        <div class="lista">
        ${D.chargers.length===0?'<div class="vazio">Nenhum carregador ainda. Clique em "+ Cadastrar" para adicionar o primeiro.</div>':
          D.chargers.map(c=>`
          <div class="status-row ${c.id==this.filtro?'sel':''}">
            <span class="lnk" onclick="UI.alternarSel(${c.id})"><span class="status-dot ${c.status?'on':'off'}"></span>${c.idLabel} ${esc(c.nome)}${c.limitado?' ⚡':''}</span>
            <span>${c.status?c.pot.toFixed(0)+' kW':'offline'} · ${brl(c.receita-c.gasto)}
              <button class="ic" onclick="UI.alternar(${c.id})">${c.status?'Desligar':'Ligar'}</button><button class="ic" onclick="UI.abrirModal(${c.id})">Editar</button><button class="ic" onclick="UI.remover(${c.id})">Remover</button>
            </span>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="row3">
      <div class="panel ia">
        <div class="panel-title"><span>🤖 Assistente IA</span></div>
        <input id="ia-input" placeholder="resumo · ranking · status AM-01 · ligar todos" onkeydown="if(event.key==='Enter')UI.perguntar(this)">
        <div class="lista">
        ${D.feed.length===0?'<div class="vazio">Aguardando dados dos carregadores.</div>':
          D.feed.map(f=>`<div class="feed-item"><div class="feed-time">${f.icon} ${f.time}</div>${esc(f.txt)}</div>`).join('')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-title"><span>💳 Tarifação e transações</span></div>
        <div class="tarifa-row ${t.tier==='pico'?'active':''}"><div class="bar-label"><span>Pico (18h–21h)</span><span>R$ 1,85/kWh</span></div><div class="bar-bg"><div class="bar-fill" style="width:100%;background:#f59e0b"></div></div></div>
        <div class="tarifa-row ${t.tier==='normal'?'active':''}"><div class="bar-label"><span>Normal (6h–18h)</span><span>R$ 1,40/kWh</span></div><div class="bar-bg"><div class="bar-fill" style="width:76%;background:#3b82f6"></div></div></div>
        <div class="tarifa-row ${t.tier==='offpeak'?'active':''}"><div class="bar-label"><span>Off-peak (21h–6h)</span><span>R$ 0,95/kWh</span></div><div class="bar-bg"><div class="bar-fill" style="width:51%;background:#22c55e"></div></div></div>
        <div class="section-label" style="margin-top:14px">Últimas transações</div>
        <div class="lista">
        ${trans.length===0?'<div class="vazio">Sem transações ainda.</div>':trans.map(x=>`
          <div class="trans-row">
            <div>${x.idLabel}<br><span class="metodo">${x.kwh.toFixed(1)} kWh · ${x.time}</span></div>
            <div style="text-align:right"><span class="trans-valor">${brl(x.valor)}</span><br><span class="metodo">${x.metodo}</span></div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  alternar(id){
    const D=App.D, c=D.chargers.find(x=>x.id===id);
    c.status=!c.status;
    c.pot=c.status?c.potencia*0.5:0;
    IA.log(D,c.status?'🔗':'⚠️',`${c.idLabel} ${c.status?'ligado':'desligado'} remotamente.`);
    App.salvar(); this.render();
  },
  remover(id){
    const c=App.D.chargers.find(x=>x.id===id);
    if(!confirm(`Remover ${c.idLabel} ${c.nome}?`)) return;
    App.D.chargers=App.D.chargers.filter(x=>x.id!==id);
    App.salvar(); this.render();
  },
  perguntar(el){
    if(!el.value.trim()) return;
    IA.log(App.D,'🤖',IA.comando(el.value,App.D));
    el.value='';
    App.salvar(); this.render();
  },

  abrirModal(id=null){
    this.editId=id;
    const c=id?App.D.chargers.find(x=>x.id===id):null;
    document.getElementById('m-titulo').innerText=c?'Editar carregador':'Cadastrar carregador';
    document.getElementById('f-nome').value=c?c.nome:'';
    document.getElementById('f-potencia').value=c?c.potencia:'';
    document.getElementById('f-status').value=c&&!c.status?'0':'1';
    document.getElementById('f-erro').innerText='';
    document.getElementById('modal-bg').style.display='flex';
  },
  fecharModal(){ document.getElementById('modal-bg').style.display='none'; },
  salvar(){
    const D=App.D;
    const nome=document.getElementById('f-nome').value.trim();
    const potencia=parseFloat(document.getElementById('f-potencia').value);
    const status=document.getElementById('f-status').value==='1';
    if(!nome) return document.getElementById('f-erro').innerText='Informe o nome do carregador.';
    if(!(potencia>0)) return document.getElementById('f-erro').innerText='A potência deve ser maior que 0 kW.';
    if(this.editId){
      const c=D.chargers.find(x=>x.id===this.editId);
      Object.assign(c,{nome,potencia,status,pot:status?potencia*0.5:0});
    } else {
      const id=D.nextId++;
      D.chargers.push({id,idLabel:'AM-'+String(id).padStart(2,'0'),nome,potencia,status,pot:status?potencia*0.5:0,receita:0,gasto:0,kwh:0,limitado:false,x:8+Math.random()*84,y:8+Math.random()*84});
      IA.log(D,'🔗',`${nome} cadastrado e conectado.`);
    }
    this.fecharModal(); App.salvar(); this.render();
  }
};
