/* HeimEnergie Dashboard - v0.4.0-alpha.3 (MIT). No external dependencies. */
(() => {
  "use strict";
  const HISTORY_HOURS = 12;
  const HISTORY_WINDOW_MS = HISTORY_HOURS * 60 * 60 * 1000;
  const VERSION = "0.4.0-alpha.3";
  const STRATEGY = "heimenergie";
  const PERIODS = [
    ["today", "Heute"], ["week", "Woche"],
    ["month", "Monat"], ["year", "Jahr"],
  ];
  const PERIOD_FIELDS = {
    today: ["energy_today", "cost_today"],
    week: ["energy_week", "cost_week"],
    month: ["energy_month", "cost_month"],
    year: ["energy_year", "cost_year"],
  };
  const ENTITY_FIELDS = [
    ["power", "Momentanleistung (W)"],
    ["energy_today", "Energie heute (kWh)"],
    ["energy_week", "Energie Woche (kWh)"],
    ["energy_month", "Energie Monat (kWh)"],
    ["energy_year", "Energie Jahr (kWh)"],
    ["cost_today", "Kosten heute (€) – optional"],
    ["cost_week", "Kosten Woche (€) – optional"],
    ["cost_month", "Kosten Monat (€) – optional"],
    ["cost_year", "Kosten Jahr (€) – optional"],
  ];
  const CSS = `
    :host { display:block; color:var(--primary-text-color); }
    ha-card { padding:18px; border-radius:var(--ha-card-border-radius,18px); overflow:hidden; }
    .head { display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin:0 0 16px; }
    .head h2 { font-size:21px; margin:0; line-height:1.2; }
    .muted { color:var(--secondary-text-color); }
    .small { font-size:12px; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .stats { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-bottom:16px; }
    .tile { padding:14px; background:var(--secondary-background-color,rgba(127,127,127,.1)); border-radius:var(--ha-card-border-radius,13px); min-width:0; }
    .tile .key { color:var(--secondary-text-color); font-size:12px; line-height:1.3; }
    .tile .value { font-size:23px; font-weight:650; line-height:1.4; overflow-wrap:anywhere; }
    .tile .sub { font-size:12px; color:var(--secondary-text-color); }
    .device { position:relative; text-align:left; border:1px solid var(--ha-card-border-color,var(--divider-color)); background:var(--ha-card-background,var(--card-background-color)); border-radius:var(--ha-card-border-radius,13px); color:inherit; min-width:0; overflow:hidden; }
    .device-main { display:block; width:100%; padding:14px 12px 10px; background:transparent; border:0; color:inherit; text-align:left; cursor:pointer; font:inherit; }
    .device-link { position:absolute; top:6px; right:6px; z-index:1; width:34px; height:34px; display:grid; place-items:center; border:1px solid transparent; background:var(--ha-card-background,var(--card-background-color)); border-radius:10px; color:var(--secondary-text-color); cursor:pointer; }
    .device-link:hover,.device-link:focus-visible { color:var(--primary-color); border-color:var(--divider-color); }
    .device-main:hover { background:var(--secondary-background-color,rgba(127,127,127,.05)); }
    .device .detail-history{margin:20px 0}.detail-history h3{font-size:16px;font-weight:500}.detail-chart{display:block;width:100%;max-height:360px}.detail-chart text{fill:var(--secondary-text-color);font-size:11px}.detail-chart .spark-path{vector-effect:non-scaling-stroke}
    .spark-wrap { margin-top:8px; height:50px; }
    .device .spark { display:block; width:100%; height:43px; overflow:visible; }
    .device .spark-path { fill:none; stroke:var(--accent-color,var(--primary-color)); stroke-width:2.4; stroke-linejoin:round; stroke-linecap:round; vector-effect:non-scaling-stroke; }
    .device .spark-empty { height:43px; display:flex; align-items:center; color:var(--secondary-text-color); font-size:11px; }
    .device .spark-label { color:var(--secondary-text-color); font-size:10px; }
    .device .name { padding-right:30px; }
    .native-detail { width:100%; margin:6px 0 12px; display:flex; align-items:center; justify-content:flex-end; }
    .native-detail button { display:flex; gap:4px; align-items:center; border-radius:9px; border:1px solid var(--divider-color); background:var(--ha-card-background,var(--card-background-color)); color:inherit; font:inherit; font-size:13px; padding:9px; cursor:pointer; }
    .device:focus-within, button:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
    .device .name { font-weight:600; font-size:14px; overflow-wrap:anywhere; }
    .device .value { font-size:21px; font-weight:650; margin:5px 0 1px; }
    .tabs { display:flex; gap:5px; flex-wrap:wrap; margin:0 0 14px; }
    .tabs button, .actions button { border:1px solid var(--divider-color); border-radius:9px; padding:9px 12px; background:var(--card-background-color); color:inherit; cursor:pointer; font:inherit; font-size:13px; }
    .tabs button[aria-pressed=true] { background:var(--primary-color); color:var(--text-primary-color,#fff); border-color:var(--primary-color); }
    .actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:12px 0; }
    input, select { min-width:0; box-sizing:border-box; width:100%; border:1px solid var(--divider-color); background:var(--card-background-color); color:var(--primary-text-color); padding:10px; border-radius:9px; font:inherit; }
    .row { display:flex; justify-content:space-between; gap:10px; align-items:center; }
    .stack { display:grid; gap:10px; }
    .hr { border-top:1px solid var(--divider-color); margin:14px 0; }
    .bar { height:9px; border-radius:9px; overflow:hidden; background:var(--secondary-background-color); margin:7px 0 4px; }
    .bar span { display:block; height:100%; border-radius:9px; background:var(--primary-color); }
    .note { padding:12px; border-radius:10px; background:var(--secondary-background-color); color:var(--secondary-text-color); margin:10px 0; line-height:1.45; font-size:13px; }
    .editor-device { border:1px solid var(--divider-color); border-radius:12px; margin:10px 0; padding:12px; }
    .editor-device summary { cursor:pointer; font-weight:600; }
    label { display:grid; gap:5px; font-size:13px; margin:10px 0; }
    .empty { padding:26px 12px; text-align:center; color:var(--secondary-text-color); }
    .source { font-size:12px; color:var(--secondary-text-color); margin-bottom:10px; }
    .device .meta { margin-top:7px; }
    .minor { font-size:12px; opacity:.86; }
    .summary-heading { font-size:15px; font-weight:650; margin:14px 0 10px; }
    .warn { border-left:3px solid var(--warning-color,#e6a23c); }
    .device-icon { vertical-align:middle; margin-right:6px; color:var(--primary-color); }
    @media(min-width:720px) { .stats { grid-template-columns:repeat(4,minmax(0,1fr)); } .grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
    @media(max-width:360px) { .tile .value { font-size:19px; } .grid { gap:7px; } ha-card { padding:12px; } }
  `;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
  const numeric = (hass, entity) => {
    if (!entity) return null;
    const state = hass?.states?.[entity]?.state;
    if (!state || ["unknown", "unavailable", "none"].includes(String(state).toLowerCase())) return null;
    const num = Number(state);
    return Number.isFinite(num) ? num : null;
  };
  const inWatts = (hass, entity) => {
    const value = numeric(hass, entity);
    if (value === null) return null;
    const unit = String(hass?.states?.[entity]?.attributes?.unit_of_measurement || "W").toLowerCase();
    if (unit === "kw") return value * 1000;
    if (unit === "mw") return value / 1000; // milliwatts
    return value;
  };
  const inKwh = (hass, entity) => {
    const value = numeric(hass, entity);
    if (value === null) return null;
    const unit = String(hass?.states?.[entity]?.attributes?.unit_of_measurement || "kWh").toLowerCase();
    if (unit === "wh") return value / 1000;
    if (unit === "mwh") return value * 1000; // megawatt hours
    return value;
  };
  const fmt = (n, digits=2) => n === null || !Number.isFinite(n)
    ? "—" : new Intl.NumberFormat("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  const euro = (n) => n === null ? "— €" : `${fmt(n)} €`;
  const kwh = (n) => n === null ? "— kWh" : `${fmt(n)} kWh`;
  const watts = (n) => n === null ? "— W" : `${fmt(n,1)} W`;
  const tariff = (hass, cfg) => {
    const live = numeric(hass, cfg.tariff_entity);
    if (live !== null) return live;
    const fallback = cfg.tariff_fixed;
    if (fallback === undefined || fallback === null || String(fallback).trim() === "") return null;
    const value = Number(fallback);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const measure = (hass, device, period, price) => {
    const [energyField, costField] = PERIOD_FIELDS[period];
    const energy = inKwh(hass, device[energyField]);
    const explicitCost = numeric(hass, device[costField]);
    const cost = explicitCost !== null ? explicitCost : (energy !== null && price !== null ? energy * price : null);
    return { energy, cost, power:inWatts(hass, device.power) };
  };
  const sumKnown = (list, field) => {
    const vals = list.map((x) => x[field]).filter((v) => v !== null);
    return { value: vals.length ? vals.reduce((a,b) => a+b, 0) : null, known: vals.length, total:list.length };
  };
  const noteCoverage = (aggregate, unit) => aggregate.known < aggregate.total
    ? `<div class="small muted">${aggregate.known} von ${aggregate.total} Geräten mit ${unit}-Werten · Teilsumme</div>` : "";
  const style = () => `<style>${CSS}</style>`;
  const icon = (name) => `<ha-icon icon="${esc(name)}" style="--mdc-icon-size:20px"></ha-icon>`;
  const displayName = (d) => d.name || d.power || "Unbenannt";
  const safeDevices = (cfg) => Array.isArray(cfg.devices) ? cfg.devices.filter((d) => d && typeof d === "object") : [];

  // The catalog contains only entity references and display metadata. Values are
  // always read from the currently authenticated Home Assistant state object;
  // the public JavaScript contains no installation-specific device IDs.
  const DEFAULT_CATALOG = "sensor.heimenergie_katalog";
  const CONSUMER_ICONS = {
    fridge:"mdi:fridge-outline", dishwasher:"mdi:dishwasher", washing_machine:"mdi:washing-machine",
    vacuum:"mdi:robot-vacuum", printer:"mdi:printer", server:"mdi:server", television:"mdi:television",
    other:"mdi:power-plug",
  };
  const consumerIcon = (d) => CONSUMER_ICONS[d.consumer_type] || CONSUMER_ICONS.other;
  function loadSource(hass, cfg) {
    if (cfg.source !== "manual") {
      const entity = cfg.catalog_entity || DEFAULT_CATALOG;
      const state = hass?.states?.[entity];
      const attrs = state?.attributes || {};
      if (Number(attrs.heimenergie_catalog_version) >= 1 && Array.isArray(attrs.devices)) {
        return {
          mode:"backend", entity, devices:attrs.devices.filter(d=>d && typeof d === "object"),
          fixed:attrs.fixed && typeof attrs.fixed === "object" ? attrs.fixed : {},
          priceEntity:attrs.price_entity || "", priceFixed:attrs.price_fixed,
          baseMonthly:attrs.base_monthly, archived:Number(attrs.archived_consumers)||0,
        };
      }
    }
    // Preserve manually configured v0.1.x dashboards as an explicit legacy mode
    // or a safe fallback when the backend catalog is temporarily unavailable.
    const devices=safeDevices(cfg);
    return { mode:devices.length ? "manual" : "missing", devices, fixed:{}, archived:0 };
  }
  function effectivePrice(hass, cfg, source) {
    if (source.mode === "backend") return tariff(hass,{
      tariff_entity:source.priceEntity,tariff_fixed:source.priceFixed,
    });
    return tariff(hass,cfg);
  }
  function fixedTotals(hass, source, period, values) {
    const energy=sumKnown(values,"energy"), variable=sumKnown(values,"cost");
    if(source.mode!=="backend") return { energy:energy.value,variable:variable.value,base:null,combined:null,energyCoverage:energy,costCoverage:variable };
    const f=source.fixed;
    const en=numeric(hass,f[`total_energy_${period}`]);
    const co=numeric(hass,f[`total_cost_${period}`]);
    const base=numeric(hass,f[`base_${period}`]);
    const included=numeric(hass,f[`cost_incl_base_${period}`]);
    return {
      energy:en!==null?en:energy.value,
      variable:co!==null?co:variable.value,
      base,
      combined:included!==null?included:(base!==null && (co!==null || variable.value!==null)?base+(co!==null?co:variable.value):null),
      energyCoverage:energy,costCoverage:variable,
    };
  }

  // HA returns compact Recorder states: {s:state, lu:unix_seconds, a:attributes}.
  // The live state is read separately. Never fabricate a zero when Recorder has no history.
  function normalizeHistory(rows, hass, entity) {
    if (!Array.isArray(rows)) return [];
    const unit=String(hass?.states?.[entity]?.attributes?.unit_of_measurement||"W").toLowerCase();
    const factor=unit==="kw"?1000:unit==="mw"?0.001:1;
    const points=[];
    for (const r of rows) {
      const rawTime=r?.lu ?? r?.lc ?? r?.last_updated ?? r?.last_changed;
      const t=typeof rawTime==="number" ? (rawTime<1e11?rawTime*1000:rawTime) : Date.parse(rawTime);
      if (!Number.isFinite(t)) continue;
      const raw=String(r?.s ?? r?.state ?? "");
      const numericValue=Number(raw);
      const v=raw.trim()!=="" && !["unknown","unavailable","none"].includes(raw.toLowerCase()) && Number.isFinite(numericValue) ? numericValue*factor : null;
      points.push({t,v});
    }
    return points.sort((a,b)=>a.t-b.t);
  }
  // Min/max decimation preserves spikes, even on phones with many Zigbee samples.
  function thinHistory(points, max=110) {
    if (points.length<=max) return points;
    const result=[points[0]], stride=Math.ceil((points.length-2)/Math.floor((max-2)/2));
    for(let k=1;k<points.length-1;k+=stride) {
      const section=points.slice(k,Math.min(k+stride,points.length-1));
      const valid=section.filter(p=>p.v!==null);
      if (!valid.length) { result.push(section[0]); continue; }
      const min=valid.reduce((a,b)=>a.v<b.v?a:b),maxP=valid.reduce((a,b)=>a.v>b.v?a:b);
      if(min.t===maxP.t) result.push(min);
      else result.push(...(min.t<maxP.t?[min,maxP]:[maxP,min]));
      const missing=section.find(p=>p.v===null);
      if(missing) result.push(missing);
    }
    result.push(points.at(-1));
    return result;
  }
  function sparkline(points, now=Date.now(), detail=false, timeZone) {
    const start=now-HISTORY_WINDOW_MS;
    const recent=(points||[]).filter(p=>p.t>=start && p.t<=now+60000);
    const valid=recent.filter(p=>p.v!==null);
    if(valid.length<2) return "";
    let maximum=1,minimum=0;
    for(const p of valid) {maximum=Math.max(maximum,p.v);minimum=Math.min(minimum,p.v);}
    const range=Math.max(0.001,maximum-minimum);
    const width=detail?280:160, height=detail?150:36;
    const samples=thinHistory(recent);
    const segments=[]; let chunk=[];
    for(const p of samples) {
      if(p.v===null) { if(chunk.length>=2)segments.push(chunk); chunk=[]; continue; }
      const x=Math.max(0,Math.min(width,width*(p.t-start)/(now-start)));
      const y=height+4-height*(p.v-minimum)/range;
      chunk.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    if(chunk.length>=2) segments.push(chunk);
    const paths=segments.map(coords=>`<path class="spark-path" d="M ${coords.join(" L ")}"></path>`).join("");
    if(!detail) return paths;
    const formatter=new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit",...(timeZone?{timeZone}:{})});
    const grid=[0,0.5,1].map(fraction=>{
      const y=4+height*(1-fraction);
      const value=new Intl.NumberFormat("de-DE",{maximumFractionDigits:1}).format(minimum+range*fraction);
      return `<line x1="0" x2="${width}" y1="${y}" y2="${y}" stroke="var(--divider-color)" /><text x="-8" y="${y+4}" text-anchor="end">${value} W</text>`;
    }).join("");
    const times=[0,0.5,1].map(fraction=>`<text x="${width*fraction}" y="${height+26}" text-anchor="${fraction===0?"start":fraction===1?"end":"middle"}">${esc(formatter.format(new Date(start+HISTORY_WINDOW_MS*fraction)))}</text>`).join("");
    return `<svg class="detail-chart" viewBox="0 0 352 200" role="img" aria-label="Leistungsverlauf der letzten ${HISTORY_HOURS} Stunden, Watt und Uhrzeit"><g transform="translate(64 12)">${grid}${paths}${times}</g></svg>`;

  }

  class HeimCard extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:"open"}); this._config = {}; this._hass = null;
      this._period = "month"; this._search = ""; this._sort = "name"; this._detail = "";
      this.shadowRoot.addEventListener("click", (e) => this.onClick(e));
      this.shadowRoot.addEventListener("input", (e) => this.onInput(e));
      this.shadowRoot.addEventListener("change", (e) => this.onChange(e));
      this.shadowRoot.addEventListener("focusout", () => {
        if (this._pendingHassRender) { this._pendingHassRender=false; this.render(); }
      });
    }
    setConfig(cfg) { this._config = cfg || {}; this.render(); }
    set hass(hass) {
      this._hass = hass;
      // Do not destroy the focused search input on Android while HA pushes updates.
      if (this.shadowRoot?.activeElement?.matches?.("input,select")) {
        this._pendingHassRender=true; return;
      }
      this.render();
    }
    getCardSize() { return 8; }
    getLayoutOptions() { return { grid_columns:4, grid_rows:8 }; }
    onClick(e) {
      const b = e.target.closest("[data-action]"); if (!b) return;
      if (b.dataset.action === "period") this._period = b.dataset.value;
      if (b.dataset.action === "detail") this._detail = b.dataset.value;
      if (b.dataset.action === "back") this._detail = "";
      if (b.dataset.action === "native-device") {
        // Navigate only to a device ID returned by HA's own entity registry.
        const id=b.dataset.value;
        if (!id || !Object.values(this._deviceMap||{}).includes(id)) return;
        window.location.assign(`/config/devices/device/${encodeURIComponent(id)}`);
        return;
      }
      if (b.dataset.action === "entity-info") {
        const entity=b.dataset.value;
        if (entity && this._source?.devices?.some(d=>d.power===entity)) {
          this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:true,composed:true,detail:{entityId:entity}}));
        }
        return;
      }
      this.render();
    }
    onInput(e) {
      if (e.target.dataset.action !== "search") return;
      this._search = e.target.value;
      this.render();
      const field = this.shadowRoot.querySelector("[data-action=search]");
      if (field) { field.focus(); field.setSelectionRange(this._search.length,this._search.length); }
    }
    onChange(e) { if (e.target.dataset.action === "sort") { this._sort = e.target.value; this.render(); } }
    render() {
      if (!this.shadowRoot || !this._hass) return;
      const cfg=this._config, hass=this._hass;
      const source=loadSource(hass,cfg);
      this._source=source;
      const price=effectivePrice(hass,cfg,source);
      const devices=source.devices;
      const values=devices.map(d=>({device:d,...measure(hass,d,this._period,price)}));
      const body=source.mode==="missing"
        ? `<div class="head"><h2>⚡ HeimEnergie</h2></div><div class="note warn">Kein HeimEnergie-Katalog gefunden. Bitte zuerst die HeimEnergie-Integration unter Einstellungen → Geräte & Dienste einrichten. Der Standard-Katalog ist ${esc(cfg.catalog_entity||DEFAULT_CATALOG)}.</div>`
        : this.view(values,devices,price);
      const sourceLabel=source.mode==="backend" ? "Automatisch aus HeimEnergie-Integration" : source.mode==="manual" ? "Manuelle Alt-Konfiguration" : "Keine Datenquelle";
      this.shadowRoot.innerHTML=style()+`<ha-card>${body}<div class="hr"></div><div class="small muted">HeimEnergie v${VERSION} · ${devices.length} ${devices.length===1?"Gerät":"Geräte"} · ${sourceLabel} · Nur überwachte Geräte</div></ha-card>`;
    }
    periodTabs() { return `<div class="tabs" aria-label="Zeitraum">${PERIODS.map(([key,label])=>
      `<button data-action="period" data-value="${key}" aria-pressed="${this._period===key}">${label}</button>`).join("")}</div>`; }
    summary(values,price) {
      const p=sumKnown(values,"power"), totals=fixedTotals(this._hass,this._source,this._period,values);
      const e=totals.energyCoverage,c=totals.costCoverage;
      const periodLabel=PERIODS.find(x=>x[0]===this._period)?.[1]||"Zeitraum";
      const baseBlock=this._source.mode==="backend" ? `<div class="tile"><div class="key">Grundpreis · ${esc(periodLabel)}</div><div class="value">${euro(totals.base)}</div><div class="sub">Einmal je Tarif, nicht pro Gerät</div></div>
        <div class="tile"><div class="key">Erfasste Kosten inkl. Grundpreis</div><div class="value">${euro(totals.combined)}</div><div class="sub">Keine vollständige Haushaltsrechnung</div></div>` : "";
      return `<div class="stats">
        <div class="tile"><div class="key">Momentanleistung</div><div class="value">${watts(p.value)}</div><div class="sub">${p.known}/${p.total} Geräte</div></div>
        <div class="tile"><div class="key">Verbrauch · ${esc(periodLabel)}</div><div class="value">${kwh(totals.energy)}</div><div class="sub">${e.known}/${e.total} Geräte</div></div>
        <div class="tile"><div class="key">Verbrauchskosten · ${esc(periodLabel)}</div><div class="value">${euro(totals.variable)}</div><div class="sub">Ohne Grundpreis</div></div>
        ${baseBlock}
        <div class="tile"><div class="key">Arbeitspreis</div><div class="value">${price === null ? "—" : fmt(price,4)}</div><div class="sub">€/kWh</div></div>
      </div>${p.known<p.total||e.known<e.total||c.known<c.total?`<div class="note warn">Einige Geräte liefern nicht alle Werte für diesen Zeitraum. Summen können unvollständig sein (${e.known}/${e.total} kWh, ${c.known}/${c.total} €).</div>`:""}`;
    }
    view(values,devices,price) { return ""; }
  }

  class HeimOverview extends HeimCard {
    view(values,devices,price) {
      const live = devices.map((d)=>({d,v:inWatts(this._hass,d.power)})).filter(x=>x.v!==null).sort((a,b)=>b.v-a.v).slice(0,5);
      return `<div class="head"><h2>⚡ Energieübersicht</h2><span class="small muted">Live + Zeitraumwerte</span></div>
        ${this.periodTabs()}${this.summary(values,price)}
        <div class="head"><h2 style="font-size:17px">Aktuell größte Verbraucher</h2></div>
        ${live.length ? `<div class="stack">${live.map(({d,v})=>`<div class="row tile"><span>${icon(consumerIcon(d))} ${esc(displayName(d))}</span><strong>${watts(v)}</strong></div>`).join("")}</div>`:
        `<div class="empty">Noch keine verfügbaren Leistungssensoren konfiguriert.</div>`}`;
    }
  }

  class HeimDevices extends HeimCard {
    constructor() {
      super();
      this._historyData={};this._historyStatus="idle";this._historyKey="";
      this._historyRequestedAt=0;this._historySeq=0;this._historyPending=false;
      this._deviceMap={};this._registryStatus="idle";this._registryKey="";
      this._registryRequestedAt=0;this._registryPending=false;this._registrySeq=0;
    }
    prepare(devices) {
      this.loadHistory(devices);
      this.loadRegistry(devices);
    }
    loadRegistry(devices) {
      if(typeof this._hass?.callWS!=="function") return;
      const key=[...new Set(devices.map(d=>d.power).filter(Boolean))].sort().join("|");
      if(this._registryPending && key===this._registryKey) return;
      if(key===this._registryKey && Date.now()-this._registryRequestedAt<1800000) return;
      this._registryKey=key;this._registryRequestedAt=Date.now();
      this._registryPending=true;this._registryStatus="loading";
      const seq=++this._registrySeq;
      this._hass.callWS({type:"config/entity_registry/list_for_display"}).then(data=>{
        if(seq!==this._registrySeq) return;
        const map={};
        for(const row of data?.entities||[]) if(typeof row?.ei==="string" && typeof row?.di==="string" && row.di) map[row.ei]=row.di;
        this._deviceMap=map;this._registryStatus="ready";this._registryPending=false;this.render();
      }).catch(()=>{if(seq!==this._registrySeq)return;this._registryStatus="error";this._registryPending=false;this.render();});
    }
    loadHistory(devices) {
      if(typeof this._hass?.callWS!=="function") {this._historyStatus="unavailable";return;}
      const ids=[...new Set(devices.map(d=>d.power).filter(id=>typeof id==="string" && id.startsWith("sensor.")))].sort();
      const key=ids.join("|");
      const now=Date.now();
      if(!ids.length) {this._historyData={};this._historyStatus="empty";return;}
      if(this._historyPending && this._historyKey===key) return;
      if(this._historyKey===key && this._historyStatus==="ready" && now-this._historyRequestedAt<300000) return;
      if(this._historyKey===key && this._historyStatus==="error" && now-this._historyRequestedAt<300000) return;
      this._historyKey=key;this._historyRequestedAt=now;
      this._historyStatus="loading";this._historyPending=true;
      const seq=++this._historySeq;
      const end=new Date(now),start=new Date(now-HISTORY_WINDOW_MS);
      this._hass.callWS({
        type:"history/history_during_period",entity_ids:ids,
        start_time:start.toISOString(),end_time:end.toISOString(),
        include_start_time_state:true,significant_changes_only:false,
        minimal_response:true,no_attributes:true,
      }).then(result=>{
        if(seq!==this._historySeq) return;
        const history={};
        for(const id of ids) history[id]=normalizeHistory(result?.[id],this._hass,id);
        this._historyData=history;this._historyStatus="ready";this._historyPending=false;this.render();
      }).catch(()=>{
        if(seq!==this._historySeq) return;
        this._historyStatus="error";this._historyPending=false;this.render();
      });
    }
    nativeButton(d,detail=false) {
      const sensor=d.power;
      const deviceId=this._deviceMap[sensor];
      const action=deviceId?"native-device":"entity-info";
      const value=deviceId||sensor||"";
      const text=deviceId?"Home-Assistant-Gerät öffnen":"Sensorinformationen öffnen";
      if(!value) return "";
      return detail
        ? `<div class="native-detail"><button type="button" data-action="${action}" data-value="${esc(value)}" aria-label="${text}">${icon(deviceId?"mdi:open-in-new":"mdi:information-outline")} ${text}</button></div>`
        : `<button type="button" class="device-link" data-action="${action}" data-value="${esc(value)}" title="${text}" aria-label="${text}">${icon(deviceId?"mdi:open-in-new":"mdi:information-outline")}</button>`;
    }
    chartFor(d,detail=false) {
      const history=this._historyData[d.power]||[];
      const current=inWatts(this._hass,d.power);
      const end=Date.now();
      const points=history.slice();
      // Recorder can supply the last known value from before the window.
      // Carry that known state to the visible left edge, without assuming zero.
      const start=end-HISTORY_WINDOW_MS;
      if(points.length && points[0].t<start && points[0].v!==null) points.unshift({t:start,v:points[0].v});
      // Add the current reading to the end of a real history series; never use it alone
      // to create an invented trend line.
      if(points.length && current!==null && end-points.at(-1).t>15000) points.push({t:end,v:current});
      const path=sparkline(points,end,detail,this._hass.config?.time_zone);
      if(detail && path) return `<div class="detail-history"><h3>Leistung · letzte ${HISTORY_HOURS} h</h3>${path}</div>`;
      if(path) return `<div class="spark-wrap"><svg class="spark" viewBox="0 0 160 44" preserveAspectRatio="none" role="img" aria-label="Leistungsverlauf der letzten ${HISTORY_HOURS} Stunden">${path}</svg><div class="spark-label">Leistung · letzte ${HISTORY_HOURS} h</div></div>`;
      const label=this._historyStatus==="loading"?"Verlauf wird geladen …":
        this._historyStatus==="error"?"Verlauf nicht verfügbar":"Keine Verlaufsdaten";
      return `<div class="spark-wrap"><div class="spark-empty">${label}</div><div class="spark-label">Leistung · letzte ${HISTORY_HOURS} h</div></div>`;
    }
    view(values,devices,price) {
      this.prepare(devices);
      let sorted = values.filter((x)=>displayName(x.device).toLowerCase().includes(this._search.toLowerCase()));
      if (this._sort==="power") sorted.sort((a,b)=>(b.power??-Infinity)-(a.power??-Infinity));
      else if (this._sort==="cost") sorted.sort((a,b)=>(b.cost??-Infinity)-(a.cost??-Infinity));
      else sorted.sort((a,b)=>displayName(a.device).localeCompare(displayName(b.device),"de"));
      const chosen = values.find((x)=>x.device.power===this._detail);
      if (chosen && this._detail) return `<div class="head"><h2>${icon(consumerIcon(chosen.device))} ${esc(displayName(chosen.device))}</h2><button data-action="back" class="device-main" style="width:auto;border:1px solid var(--divider-color);border-radius:10px">← Alle Geräte</button></div>
        ${this.periodTabs()}<div class="stats">
        <div class="tile"><div class="key">Momentanleistung</div><div class="value">${watts(chosen.power)}</div></div>
        <div class="tile"><div class="key">Energie</div><div class="value">${kwh(chosen.energy)}</div></div>
        <div class="tile"><div class="key">Kosten</div><div class="value">${euro(chosen.cost)}</div></div>
        </div>${this.chartFor(chosen.device,true)}${this.nativeButton(chosen.device,true)}<div class="note">${this._source.mode==="backend" ? `Messgerät: ${esc(chosen.device.meter_name||chosen.device.power||"—")}. Sensoren und Verbraucher verwaltest du unter Einstellungen → Geräte & Dienste → HeimEnergie.` : "Zeitraumsensoren können in der manuellen Dashboard-Konfiguration zugeordnet werden."}</div>`;
      return `<div class="head"><h2>🔌 Geräte</h2><span class="small muted">${devices.length} eingerichtet</span></div>
        ${this.periodTabs()}
        <div class="actions"><input aria-label="Geräte suchen" data-action="search" placeholder="Geräte suchen…" value="${esc(this._search)}" style="flex:2;min-width:150px">
        <select aria-label="Sortierung" data-action="sort" style="flex:1;min-width:130px">
          ${[["name","Name"],["power","Leistung"],["cost","Kosten"]].map(([id,label])=>`<option value="${id}" ${this._sort===id?"selected":""}>${label}</option>`).join("")}
        </select></div>
        ${sorted.length ? `<div class="grid">${sorted.map((x)=>`<div class="device">
          <button type="button" class="device-main" data-action="detail" data-value="${esc(x.device.power||"")}" aria-label="HeimEnergie-Details ${esc(displayName(x.device))}">
            <div class="name">${icon(consumerIcon(x.device))} ${esc(displayName(x.device))}</div><div class="value">${watts(x.power)}</div>
            <div class="small muted">${kwh(x.energy)}</div><div class="small muted">${euro(x.cost)}</div>${this.chartFor(x.device)}
          </button>${this.nativeButton(x.device)}</div>`).join("")}</div>` : `<div class="empty">Keine passenden Geräte gefunden.</div>`}`;
    }
  }

  class HeimAnalysis extends HeimCard {
    view(values,devices,price) {
      const totals=fixedTotals(this._hass,this._source,this._period,values);
      const rows=values.filter(x=>x.cost!==null||x.energy!==null).sort((a,b)=>(b.cost??-1)-(a.cost??-1));
      const max=Math.max(0,...rows.map(x=>x.cost??0));
      return `<div class="head"><h2>📊 Auswertung</h2><span class="small muted">Erfasste Geräte</span></div>
        ${this.periodTabs()}
        <div class="stats">
          <div class="tile"><div class="key">Energie der überwachten Geräte</div><div class="value">${kwh(totals.energy)}</div><div class="sub">${totals.energyCoverage.known}/${devices.length} Geräte</div></div>
          <div class="tile"><div class="key">Verbrauchskosten</div><div class="value">${euro(totals.variable)}</div><div class="sub">Ohne Grundpreis</div></div>
          ${this._source.mode==="backend"?`<div class="tile"><div class="key">Grundpreis (einmalig)</div><div class="value">${euro(totals.base)}</div></div>
            <div class="tile"><div class="key">Erfasste Kosten inkl. Grundpreis</div><div class="value">${euro(totals.combined)}</div></div>`:""}
        </div>
        <div class="head"><h2 style="font-size:17px">Verbrauchskosten je Gerät</h2></div>
        ${rows.length?`<div class="stack">${rows.map(x=>`<div class="tile">
          <div class="row"><strong>${icon(consumerIcon(x.device))} ${esc(displayName(x.device))}</strong><span>${euro(x.cost)}</span></div>
          <div class="bar"><span style="width:${x.cost===null||max===0?0:Math.max(0,Math.min(100,(x.cost/max)*100))}%"></span></div>
          <div class="small muted">${kwh(x.energy)}</div>
        </div>`).join("")}</div>`:`<div class="empty">Für diesen Zeitraum sind noch keine geeigneten Daten vorhanden.</div>`}
        ${noteCoverage(totals.costCoverage,"Kosten")}${noteCoverage(totals.energyCoverage,"Energie")}
        <div class="note">Der Grundpreis wird nur einmal zum Tarif addiert, nicht auf einzelne Verbraucher verteilt. Ohne Netzbezugszähler sind die Werte keine vollständige Haushaltsstromrechnung.</div>`;
    }
  }

  function suggestSensors(hass) {
    const states = Object.entries(hass?.states||{});
    return states.filter(([id,s])=>id.startsWith("sensor.") &&
      (s.attributes?.device_class==="power" || (/(?:_power|_current_power|derzeitiger_verbrauch)$/.test(id) &&
      (s.attributes?.unit_of_measurement||"").toLowerCase()==="w")))
      .sort((a,b)=>a[0].localeCompare(b[0]));
  }
  function eligibleEntities(hass, field) {
    return Object.entries(hass?.states||{})
      .filter(([id,s])=> {
        if (!id.startsWith("sensor.") && !id.startsWith("input_number.")) return false;
        const unit = (s.attributes?.unit_of_measurement||"").toLowerCase();
        if (field==="power") return s.attributes?.device_class==="power" || unit==="w";
        if (field.startsWith("energy")) return ["wh","kwh","mwh"].includes(unit);
        if (field.startsWith("cost")) return unit==="€" || unit==="eur" || s.attributes?.device_class==="monetary";
        return true;
      }).sort((a,b)=>a[0].localeCompare(b[0]));
  }
  function pickOptions(items, current) {
    const opts = `<option value="">— Nicht zugeordnet —</option>`+items.map(([id,s])=>`<option value="${esc(id)}" ${current===id?"selected":""}>${esc(s.attributes?.friendly_name||id)} (${esc(id)})</option>`).join("");
    return current && !items.some(([id])=>id===current)
      ? opts+`<option selected value="${esc(current)}">${esc(current)} (derzeit nicht gefunden)</option>` : opts;
  }

  class HeimEditor extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:"open"}); this._config={type:`custom:${STRATEGY}`,devices:[],tariff_fixed:"",source:"auto",catalog_entity:DEFAULT_CATALOG};
      this._hass=null;
      this._rendered=false;
      this.shadowRoot.addEventListener("click",(e)=>this.onClick(e));
      this.shadowRoot.addEventListener("change",(e)=>this.onChange(e));
    }
    // HA publishes frequent hass updates (sometimes several per second). Replacing
    // input/select elements on each update dismisses the Android IME and picker.
    // An open editor needs stable DOM nodes; the sensor list refreshes when the
    // editor is first opened or its actual configuration is changed externally.
    set hass(hass) {
      const firstHass = !this._hass;
      this._hass = hass;
      if (firstHass || !this._rendered) this.render();
    }
    setConfig(cfg) {
      const incoming = {...cfg, devices: Array.isArray(cfg.devices)?cfg.devices.map(x=>({...x})):[]};
      // The dashboard echoes config-changed back through setConfig. Never destroy
      // the focused input/select when the data are unchanged.
      if (this._rendered && JSON.stringify(incoming) === JSON.stringify(this._config)) return;
      this._config = incoming;
      this.render();
    }
    updated(rebuild=false) {
      if (rebuild) this.render();
      // Notify HA without rebuilding the fields being edited. Using 'change'
      // (not per-keystroke 'input') keeps the Android keyboard stable.
      this.dispatchEvent(new CustomEvent("config-changed",{
        detail:{config:{...this._config,devices:this._config.devices.map(x=>({...x}))}},
        bubbles:true,composed:true,
      }));
    }
    onClick(e) {
      const btn = e.target.closest("[data-action]"); if (!btn) return;
      if (btn.dataset.action==="add") {
        const items=suggestSensors(this._hass).filter(([id])=>!this._config.devices.some(d=>d.power===id));
        if (items.length) this._config.devices.push({power:items[0][0],name:items[0][1].attributes?.friendly_name||items[0][0]});
        else this._config.devices.push({power:"",name:"Neues Gerät"});
      }
      if (btn.dataset.action==="scan") {
        const current=new Set(this._config.devices.map(d=>d.power));
        for(const [id,s] of suggestSensors(this._hass)) if(!current.has(id)) {
          this._config.devices.push({power:id,name:s.attributes?.friendly_name||id}); current.add(id);
        }
      }
      if (btn.dataset.action==="remove") this._config.devices.splice(Number(btn.dataset.index),1);
      // Adding/removing devices changes the editor structure, so rebuild here.
      this.updated(true);
    }
    onChange(e) {
      const el=e.target; const field=el.dataset.field;
      if (!field) return;
      if (el.dataset.index!==undefined) {
        const dev=this._config.devices[Number(el.dataset.index)];
        if (!dev) return;
        dev[field]=el.value;
      } else this._config[field]=el.value;
      if (field==="source") { this.updated(true); return; }
      if (field==="name") {
        const summary = el.closest("details.editor-device")?.querySelector("summary");
        if (summary) summary.textContent=el.value||"Unbenannt";
      }
      this.updated();
    }
    render() {
      if(!this.shadowRoot) return;
      const cfg=this._config, hass=this._hass, devices=safeDevices(cfg);
      const prices=Object.entries(hass?.states||{}).filter(([id,s])=>
        (id.startsWith("input_number.")||id.startsWith("sensor.")) &&
        (id===cfg.tariff_entity || /strompreis|electricity_price|energy_price|tariff/.test(id)))
        .sort((a,b)=>a[0].localeCompare(b[0]));
      const expanded = [...this.shadowRoot.querySelectorAll("details.editor-device[open]")]
        .map((el) => Number(el.dataset.index));
      const catalogs=Object.entries(hass?.states||{}).filter(([id,s])=>
        Number(s.attributes?.heimenergie_catalog_version)>=1 && Array.isArray(s.attributes?.devices));
      const manual=cfg.source==="manual";
      const catalogId=cfg.catalog_entity||DEFAULT_CATALOG;
      const catalogFound=!!hass?.states?.[catalogId]?.attributes?.heimenergie_catalog_version;
      this.shadowRoot.innerHTML=style()+`<ha-card>
        <div class="head"><h2>⚡ HeimEnergie einrichten</h2></div>
        <label>Datenquelle
          <select data-field="source">
            <option value="auto" ${!manual?"selected":""}>Automatisch: HeimEnergie Integration</option>
            <option value="manual" ${manual?"selected":""}>Manuell: bisherige Sensorzuordnung (Legacy)</option>
          </select>
        </label>
        ${manual ? `<div class="note">Manueller Modus für ältere Installationen ohne HeimEnergie Backend. Für die automatische Geräteverwaltung bitte „Automatisch“ wählen.</div>
          <label>Strompreis-Entität (optional)<select data-field="tariff_entity">${pickOptions(prices,cfg.tariff_entity)}</select></label>
          <label>Fester Ersatz-Strompreis (€/kWh)<input data-field="tariff_fixed" type="number" min="0" step="0.0001" value="${esc(cfg.tariff_fixed??"")}"></label>
          <div class="head"><h2 style="font-size:17px">Geräte (${devices.length})</h2></div>
          <div class="actions"><button data-action="scan">Leistungssensoren erkennen</button><button data-action="add">+ Gerät hinzufügen</button></div>
          ${devices.map((d,i)=>`<details class="editor-device" data-index="${i}" ${expanded.includes(i)?"open":""}>
            <summary>${esc(displayName(d))}</summary>
            <label>Anzeigename<input data-field="name" data-index="${i}" value="${esc(d.name||"")}"></label>
            ${ENTITY_FIELDS.map(([field,label])=>`<label>${label}<select data-field="${field}" data-index="${i}">${pickOptions(eligibleEntities(hass,field),d[field]||"")}</select></label>`).join("")}
            <div class="actions"><button data-action="remove" data-index="${i}">Gerät entfernen</button></div>
          </details>`).join("")}
          ${devices.length?"":`<div class="empty">Bitte mindestens ein Gerät hinzufügen.</div>`}` : `
          <div class="note">Verbraucher, Sensoren und Stromtarif werden ausschließlich in der HeimEnergie-Integration unter Einstellungen → Geräte & Dienste verwaltet. Hier ist keine zweite Gerätezuordnung erforderlich.</div>
          <label>HeimEnergie-Katalog
            <select data-field="catalog_entity">${pickOptions(catalogs,catalogId)}</select>
          </label>
          <div class="note ${catalogFound?"":"warn"}">${catalogFound
            ? `Katalog erkannt: ${esc(hass.states[catalogId].attributes.devices.length)} Geräte. Alle Dashboard-Ansichten aktualisieren sich automatisch bei Änderungen.`
            : `Noch kein Katalog unter ${esc(catalogId)} gefunden. Bitte HeimEnergie-Integration einrichten oder eine andere Katalog-Entität wählen.`}</div>`}
        <div class="small muted">Die Auswahl wird im Home-Assistant-Dashboard gespeichert. Keine persönlichen Gerätezuordnungen werden nach GitHub übertragen.</div>
      </ha-card>`;
      this._rendered = true;
    }
  }

  class HeimDashboardStrategy extends HTMLElement {
    static configRequired = true;
    static registryDependencies = [];
    static getCreateSuggestions() { return {title:"HeimEnergie",icon:"mdi:lightning-bolt"}; }
    static getConfigElement() { return document.createElement("heimenergie-strategy-editor"); }
    static async generate(config) {
      const devices=safeDevices(config);
      const shared={
        source:config.source||"auto",catalog_entity:config.catalog_entity||DEFAULT_CATALOG,
        devices,tariff_entity:config.tariff_entity||"",tariff_fixed:config.tariff_fixed??"",
      };
      return { title:"HeimEnergie", views:[
        { title:"Übersicht",path:"uebersicht",icon:"mdi:view-dashboard",type:"panel",cards:[{type:"custom:heimenergie-overview",...shared}] },
        { title:"Geräte",path:"geraete",icon:"mdi:power-plug",type:"panel",cards:[{type:"custom:heimenergie-devices",...shared}] },
        { title:"Auswertung",path:"auswertung",icon:"mdi:chart-bar",type:"panel",cards:[{type:"custom:heimenergie-analysis",...shared}] },
      ]};
    }
  }

  for(const [tag,ctor] of [
    ["heimenergie-strategy-editor",HeimEditor],
    ["heimenergie-overview",HeimOverview],
    ["heimenergie-devices",HeimDevices],
    ["heimenergie-analysis",HeimAnalysis],
    ["ll-strategy-dashboard-heimenergie",HeimDashboardStrategy],
  ]) if(!customElements.get(tag)) customElements.define(tag,ctor);

  window.customStrategies = window.customStrategies || [];
  if(!window.customStrategies.some(x=>x.type===STRATEGY && x.strategyType==="dashboard")) {
    window.customStrategies.push({
      type:STRATEGY,strategyType:"dashboard",name:"HeimEnergie",
      description:"Automatisches HeimEnergie-Dashboard – 8 oder mehr Geräte, kWh, Kosten und Grundpreis",
    });
  }
  console.info(`[HeimEnergie] v${VERSION} ready`);
})();
