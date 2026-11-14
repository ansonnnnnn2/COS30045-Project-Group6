// VisiRoad remoteness-area choropleth.
// Boundaries: ABS ASGS 2021 Remoteness Areas (official public FeatureServer).
// Counts: filtered nationwide totals from FinalG6.csv; NOT regional per-polygon counts.
document.addEventListener('DOMContentLoaded', () => {
  const colors = { 'Major Cities':'#087D83', 'Regional':'#F29B56', 'Remote':'#56B4AE', 'Missing':'#92A6AE' };
  const categories = ['Major Cities', 'Regional', 'Remote', 'Missing'];
  const map = L.map('map', { center:[-25.5,133.8], zoom:4, zoomControl:true, scrollWheelZoom:false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom:3, maxZoom:9
  }).addTo(map);
  const format = n => Number(n || 0).toLocaleString('en-AU', { maximumFractionDigits:0 });
  let totals = Object.fromEntries(categories.map(c => [c, 0]));
  let selectedRemote = 'all';
  let regionLayer = null;
  let fallback = null;
  const status = document.getElementById('mapGeometryStatus');

  // ABS uses 5 geographical classifications, while the source CSV groups them
  // into 3 categories: Major Cities; Inner+Outer Regional; Remote+Very Remote.
  function groupOf(properties) {
    const name = String(properties.ra_name21 || properties.RA_NAME21 || properties.RA_NAME_2021 || '').toLowerCase();
    if (name.includes('major cit')) return 'Major Cities';
    if (name.includes('regional')) return 'Regional';
    if (name.includes('remote')) return 'Remote';
    return null;
  }
  const selected = c => selectedRemote === 'all' || selectedRemote === c;
  function polygonStyle(feature) {
    const c = groupOf(feature.properties || {});
    const max = Math.max(totals['Major Cities'], totals.Regional, totals.Remote, 1);
    // Changing year / filters updates the shading intensity, not the ABS boundary.
    const intensity = Math.sqrt((totals[c] || 0) / max);
    return {
      color: c && selected(c) ? colors[c] : '#8D9DA6',
      weight: c && selected(c) ? 1.2 : 0.55,
      opacity: 0.95,
      fillColor: colors[c] || '#A4B4BD',
      fillOpacity: c && selected(c) ? (totals[c] ? 0.24 + intensity * 0.64 : 0.08) : 0.035
    };
  }
  function tooltipText(c, properties) {
    const absName = String(properties.ra_name21 || properties.RA_NAME21 || c || 'Area');
    const total = totals[c] || 0;
    return `<strong>${absName}</strong><br>${c || 'Other territory'}<br>${format(total)} recorded cases in selected data <br><small>Australia-wide ${c || ''} total, not a count for this polygon</small>`;
  }
  function redraw() {
    if (!regionLayer) return;
    regionLayer.eachLayer(layer => {
      const cat = groupOf(layer.feature.properties || {});
      layer.setStyle(polygonStyle(layer.feature));
      layer.bindTooltip(tooltipText(cat, layer.feature.properties || {}), { sticky:true });
    });
  }
  function applyRegionFilter(c) {
    const select = document.getElementById('f-remote');
    if (!select || !c) return;
    select.value = (select.value === c ? 'all' : c);
    select.dispatchEvent(new Event('change', { bubbles:true }));
  }

  // Hosted ABS remoteness geometry, simplified by the server for browser rendering.
  const source = 'https://spatial.infrastructure.gov.au/server/rest/services/Hosted/ABS_Remoteness_Areas_2021/FeatureServer/0/query';
  const qs = new URLSearchParams({
    where:'1=1', outFields:'ra_name21', returnGeometry:'true', outSR:'4326',
    geometryPrecision:'3', maxAllowableOffset:'0.025', f:'geojson'
  });
  fetch(`${source}?${qs.toString()}`)
    .then(r => { if (!r.ok) throw new Error(`ABS boundaries HTTP ${r.status}`); return r.json(); })
    .then(geo => {
      if (!Array.isArray(geo.features) || !geo.features.length) throw new Error('No remoteness polygons received');
      const recognized = geo.features.filter(f => groupOf(f.properties || {}));
      if (!recognized.length) throw new Error('Unknown boundary attributes');
      regionLayer = L.geoJSON({type:'FeatureCollection',features:recognized}, {
        style:polygonStyle,
        onEachFeature(feature,layer) {
          const cat = groupOf(feature.properties || {});
          layer.on('click', () => applyRegionFilter(cat));
          layer.bindTooltip(tooltipText(cat, feature.properties || {}), {sticky:true});
          layer.on('mouseover', () => {layer.setStyle({weight:2.6,opacity:1}); layer.bringToFront();});
          layer.on('mouseout', () => regionLayer && regionLayer.resetStyle(layer));
        }
      }).addTo(map);
      if (fallback) {map.removeLayer(fallback);fallback=null;}
      const b=regionLayer.getBounds();
      if (b.isValid()) map.fitBounds(b.pad(.05),{animate:false,maxZoom:5});
      status.textContent = 'Official ABS 2021 remoteness areas · click a region to filter';
      redraw();
    })
    .catch(err => {
      console.warn('ABS remoteness layer unavailable:',err);
      status.textContent = 'Official remoteness boundaries unavailable. Showing the Australia outline instead (internet access required for region colours).';
      fetch('data/australia-outline.geojson').then(r=>r.json()).then(geo => {
        fallback=L.geoJSON(geo,{interactive:false,style:{color:'#087D83',weight:2,fillColor:'#56B4AE',fillOpacity:.13}}).addTo(map);
        const b=fallback.getBounds(); if(b.isValid()) map.fitBounds(b.pad(.08),{animate:false,maxZoom:5});
      }).catch(() => {});
    });

  window.addEventListener('resize', () => {
    if (!document.getElementById('where-section').hidden) map.invalidateSize();
  });
  document.addEventListener('visiroad-data-update', e => {
    totals = Object.fromEntries(categories.map(c => [c, 0]));
    for(const r of e.detail.rows) if (r.remote in totals) totals[r.remote] += r.n;
    selectedRemote = e.detail.remote;
    const total = Object.values(totals).reduce((a,b) => a+b,0);
    const percent = n => total ? `${Math.round(n/total*100)}%` : '0%';
    document.getElementById('mapYearLabel').textContent = `${e.detail.year === 'all' ? 'All years (2011–2021)' : e.detail.year} · ${format(total)} recorded cases`;
    document.getElementById('mapLegend').innerHTML = categories.map(c => `<div class="legend-row"><span class="legend-swatch" style="background:${colors[c]}"></span><span>${c==='Missing'?'Not stated':c}: <strong>${format(totals[c])}</strong> · ${percent(totals[c])}</span></div>`).join('');
    document.getElementById('remotenessStats').innerHTML = categories.map(c => `<div class="remote-stat-card"><div class="remote-stat-title">${c==='Missing'?'Not stated':c}</div><div class="remote-stat-val">${format(totals[c])}</div><div class="remote-stat-caption">${percent(totals[c])} of selected recorded cases</div></div>`).join('');
    redraw();
  });
});
