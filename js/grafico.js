const Grafico={
  svg(vals,limite){
    const w=600,h=160,m=Math.max(...vals,limite,1)*1.15,st=w/Math.max(vals.length-1,1);
    const y=v=>h-(v/m)*h;
    const pts=vals.map((v,i)=>(i*st).toFixed(1)+','+y(v).toFixed(1)).join(' ');
    let ticks='';
    for(let i=0;i<=4;i++) ticks+=`<text x="2" y="${h-i*h/4-2}" fill="#64748b" font-size="9">${(m*i/4).toFixed(0)} kW</text>`;
    const lim=limite>0?`<line x1="0" y1="${y(limite)}" x2="${w}" y2="${y(limite)}" stroke="#ef4444" stroke-dasharray="6,4"/><text x="${w}" y="${y(limite)-4}" fill="#ef4444" font-size="9" text-anchor="end">limite IA ${limite.toFixed(0)} kW</text>`:'';
    return `<svg viewBox="0 0 ${w} ${h+14}" width="100%">${ticks}${lim}<polyline points="${pts}" fill="none" stroke="#3b82f6" stroke-width="2"/><text x="0" y="${h+11}" fill="#64748b" font-size="9">-${Math.round(vals.length*CICLO_MS/1000)}s</text><text x="${w}" y="${h+11}" fill="#64748b" font-size="9" text-anchor="end">agora</text></svg>`;
  }
};
