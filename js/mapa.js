let cityMapSVG=null;
function subdivideBlocks(x,y,w,h,depth){
  if(depth <= 0 || w < 26 || h < 26) return [{x,y,w,h}];
  const vertical = w >= h;
  const ratio = 0.32 + Math.random()*0.36;
  if(vertical){
    const w1 = w*ratio;
    return [...subdivideBlocks(x,y,w1,h,depth-1), ...subdivideBlocks(x+w1,y,w-w1,h,depth-1)];
  } else {
    const h1 = h*ratio;
    return [...subdivideBlocks(x,y,w,h1,depth-1), ...subdivideBlocks(x,y+h1,w,h-h1,depth-1)];
  }
}

function buildCityMapSVG(){
  const W = 1000, H = 480;
  const bg = '#0c131f';
  const streetMinor = '#1c2738';
  const streetMajor = '#2c3f59';

  const majorBlocks = subdivideBlocks(0,0,W,H,3);
  let minorRects = '';
  let majorRects = '';

  majorBlocks.forEach(mb => {
    const minorBlocks = subdivideBlocks(mb.x, mb.y, mb.w, mb.h, 3);
    minorBlocks.forEach(b => {
      minorRects += `<rect x="${b.x.toFixed(1)}" y="${b.y.toFixed(1)}" width="${b.w.toFixed(1)}" height="${b.h.toFixed(1)}" fill="none" stroke="${streetMinor}" stroke-width="1.4"/>`;
    });
    majorRects += `<rect x="${mb.x.toFixed(1)}" y="${mb.y.toFixed(1)}" width="${mb.w.toFixed(1)}" height="${mb.h.toFixed(1)}" fill="none" stroke="${streetMajor}" stroke-width="4"/>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    ${minorRects}
    ${majorRects}
  </svg>`;
}

const Mapa={
  render(lista){
    if(!cityMapSVG){ cityMapSVG=Store.ler('ampera_mapa',null)||buildCityMapSVG(); Store.gravar('ampera_mapa',cityMapSVG); }
    const pins=lista.map(c=>`<div class="marker ${c.status?'on':'off'}" style="left:${c.x}%;top:${c.y}%" title="${esc(c.nome)} · ${c.pot.toFixed(0)} kW" onclick="UI.selecionar(${c.id})"></div><div class="marker-label" style="left:${c.x}%;top:${c.y}%">${esc(c.nome)}</div>`).join('');
    return `<div class="section-label">Localização dos carregadores</div><div id="map-box">${cityMapSVG}${pins}</div>${lista.length?'':'<div class="vazio" style="margin-top:12px">Cadastre um carregador no dashboard para vê-lo no mapa.</div>'}`;
  }
};
