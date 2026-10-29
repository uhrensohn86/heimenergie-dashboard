/* HeimEnergie Dashboard - v0.1.1 (MIT). No external dependencies. */
(() => {
  "use strict";
  const VERSION = "0.1.1";
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
    ha-card { padding:18px; border-radius:18px; overflow:hidden; }
    .head { display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin:0 0 16px; }
    .head h2 { font-size:21px; margin:0; line-height:1.2; }
    .muted { color:var(--secondary-text-color); }
    .small { font-size:12px; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .stats { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-bottom:16px; }
    .tile { padding:14px; background:var(--secondary-background-color,rgba(127,127,127,.1)); border-radius:13px; min-width:0; }
    .tile .key { color:var(--secondary-text-color); font-size:12px; line-height:1.3; }
    .tile .value { font-size:23px; font-weight:650; line-height:1.4; overflow-wrap:anywhere; }
    .tile .sub { font-size:12px; color:var(--secondary-text-color); }
    .device { text-align:left; border:1px solid var(--divider-color); background:var(--card-background-color); border-radius:13px; padding:14px; color:inherit; cursor:pointer; min-width:0; }
    .device:focus-visible, button:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
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

  class HeimCard extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:"open"}); this._config = {}; this._hass = null;
      this._period = "month"; this._search = ""; this._sort = "name"; this._detail = "";
      this.shadowRoot.addEventListener("click", (e) => this.onClick(e));
      this.shadowRoot.addEventListener("input", (e) => this.onInput(e));
      this.shadowRoot.addEventListener("change", (e) => this.onChange(e));
    }
    setConfig(cfg) { this._config = cfg || {}; this.render(); }
    set hass(hass) { this._hass = hass; this.render(); }
    getCardSize() { return 8; }
    getLayoutOptions() { return { grid_columns:4, grid_rows:8 }; }
    onClick(e) {
      const b = e.target.closest("[data-action]"); if (!b) return;
      if (b.dataset.action === "period") this._period = b.dataset.value;
      if (b.dataset.action === "detail") this._detail = b.dataset.value;
      if (b.dataset.action === "back") this._detail = "";
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
      const cfg = this._config; const hass = this._hass; const price = tariff(hass,cfg);
      const devices = safeDevices(cfg); const values = devices.map((d) => ({ device:d, ...measure(hass,d,this._period,price) }));
      const body = this.view(values,devices,price);
      this.shadowRoot.innerHTML = style()+`<ha-card>${body}<div class="hr"></div><div class="small muted">HeimEnergie v${VERSION} · ${devices.length} ${devices.length===1?"Gerät":"Geräte"} · Nur überwachte Geräte</div></ha-card>`;
    }
    periodTabs() { return `<div class="tabs" aria-label="Zeitraum">${PERIODS.map(([key,label])=>
      `<button data-action="period" data-value="${key}" aria-pressed="${this._period===key}">${label}</button>`).join("")}</div>`; }
    summary(values,price) {
      const p=sumKnown(values,"power"), e=sumKnown(values,"energy"), c=sumKnown(values,"cost");
      return `<div class="stats">
        <div class="tile"><div class="key">Momentanleistung</div><div class="value">${watts(p.value)}</div><div class="sub">${p.known}/${p.total} Geräte</div></div>
        <div class="tile"><div class="key">Verbrauch · ${esc(PERIODS.find(x=>x[0]===this._period)?.[1])}</div><div class="value">${kwh(e.value)}</div><div class="sub">${e.known}/${e.total} Geräte</div></div>
        <div class="tile"><div class="key">Kosten · ${esc(PERIODS.find(x=>x[0]===this._period)?.[1])}</div><div class="value">${euro(c.value)}</div><div class="sub">${c.known}/${c.total} Geräte</div></div>
        <div class="tile"><div class="key">Strompreis</div><div class="value">${price === null ? "—" : fmt(price,4)}</div><div class="sub">€/kWh</div></div>
      </div>${p.known<p.total||e.known<e.total||c.known<c.total?`<div class="note">Einige Werte fehlen. Summen berücksichtigen nur vorhandene Sensorwerte und sind möglicherweise unvollständig.</div>`:""}`;
    }
    view(values,devices,price) { return ""; }
  }

  class HeimOverview extends HeimCard {
    view(values,devices,price) {
      const live = devices.map((d)=>({d,v:inWatts(this._hass,d.power)})).filter(x=>x.v!==null).sort((a,b)=>b.v-a.v).slice(0,5);
      return `<div class="head"><h2>⚡ Energieübersicht</h2><span class="small muted">Live + Verlaufssensoren</span></div>
        ${this.periodTabs()}${this.summary(values,price)}
        <div class="head"><h2 style="font-size:17px">Aktuell größte Verbraucher</h2></div>
        ${live.length ? `<div class="stack">${live.map(({d,v})=>`<div class="row tile"><span>${esc(displayName(d))}</span><strong>${watts(v)}</strong></div>`).join("")}</div>`:
        `<div class="empty">Noch keine verfügbaren Leistungssensoren konfiguriert.</div>`}`;
    }
  }

  class HeimDevices extends HeimCard {
    view(values,devices,price) {
      let sorted = values.filter((x)=>displayName(x.device).toLowerCase().includes(this._search.toLowerCase()));
      if (this._sort==="power") sorted.sort((a,b)=>(b.power??-Infinity)-(a.power??-Infinity));
      else if (this._sort==="cost") sorted.sort((a,b)=>(b.cost??-Infinity)-(a.cost??-Infinity));
      else sorted.sort((a,b)=>displayName(a.device).localeCompare(displayName(b.device),"de"));
      const chosen = values.find((x)=>x.device.power===this._detail);
      if (chosen && this._detail) return `<div class="head"><h2>${esc(displayName(chosen.device))}</h2><button data-action="back" class="device">← Alle Geräte</button></div>
        ${this.periodTabs()}<div class="stats">
        <div class="tile"><div class="key">Momentanleistung</div><div class="value">${watts(chosen.power)}</div></div>
        <div class="tile"><div class="key">Energie</div><div class="value">${kwh(chosen.energy)}</div></div>
        <div class="tile"><div class="key">Kosten</div><div class="value">${euro(chosen.cost)}</div></div>
        </div><div class="note">Bei fehlenden Zeitraumwerten bitte in den Dashboard-Einstellungen passende Energie- oder Kostensensoren zuordnen. Die Detailhistorie folgt in einer späteren Version.</div>`;
      return `<div class="head"><h2>🔌 Geräte</h2><span class="small muted">${devices.length} eingerichtet</span></div>
        ${this.periodTabs()}
        <div class="actions"><input aria-label="Geräte suchen" data-action="search" placeholder="Geräte suchen…" value="${esc(this._search)}" style="flex:2;min-width:150px">
        <select aria-label="Sortierung" data-action="sort" style="flex:1;min-width:130px">
          ${[["name","Name"],["power","Leistung"],["cost","Kosten"]].map(([id,label])=>`<option value="${id}" ${this._sort===id?"selected":""}>${label}</option>`).join("")}
        </select></div>
        ${sorted.length ? `<div class="grid">${sorted.map((x)=>`<button class="device" data-action="detail" data-value="${esc(x.device.power||"")}">
          <div class="name">${esc(displayName(x.device))}</div><div class="value">${watts(x.power)}</div>
          <div class="small muted">${kwh(x.energy)}</div><div class="small muted">${euro(x.cost)}</div>
        </button>`).join("")}</div>` : `<div class="empty">Keine passenden Geräte gefunden.</div>`}`;
    }
  }

  class HeimAnalysis extends HeimCard {
    view(values,devices,price) {
      const costs=sumKnown(values,"cost"), energy=sumKnown(values,"energy");
      const rows=values.filter((x)=>x.cost!==null||x.energy!==null).sort((a,b)=>(b.cost??-1)-(a.cost??-1));
      const max=Math.max(0,...rows.map((x)=>x.cost??0));
      return `<div class="head"><h2>📊 Auswertung</h2><span class="small muted">Erfasste Geräte</span></div>
        ${this.periodTabs()}
        <div class="stats">
          <div class="tile"><div class="key">Gesamtverbrauch</div><div class="value">${kwh(energy.value)}</div><div class="sub">${energy.known}/${energy.total} Geräte</div></div>
          <div class="tile"><div class="key">Gesamtkosten</div><div class="value">${euro(costs.value)}</div><div class="sub">${costs.known}/${costs.total} Geräte</div></div>
        </div>
        <div class="head"><h2 style="font-size:17px">Kosten je Gerät</h2></div>
        ${rows.length?`<div class="stack">${rows.map((x)=>`<div class="tile">
          <div class="row"><strong>${esc(displayName(x.device))}</strong><span>${euro(x.cost)}</span></div>
          <div class="bar"><span style="width:${x.cost===null||max===0?0:Math.max(0,Math.min(100,(x.cost/max)*100))}%"></span></div>
          <div class="small muted">${kwh(x.energy)}</div>
        </div>`).join("")}</div>`:`<div class="empty">Für diesen Zeitraum sind noch keine geeigneten Daten zugeordnet.</div>`}
        ${noteCoverage(costs,"Kosten")}${noteCoverage(energy,"Energie")}
        <div class="note">Tages-, Wochen-, Monats- und Jahreswerte werden nicht geschätzt. Die Woche bleibt leer, solange keine passenden Wochensensoren zugeordnet sind. Kosten können aus kWh × Strompreis berechnet werden.</div>`;
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
      super(); this.attachShadow({mode:"open"}); this._config={type:`custom:${STRATEGY}`,devices:[],tariff_fixed:""};
      this._hass=null;
      this.shadowRoot.addEventListener("click",(e)=>this.onClick(e));
      this.shadowRoot.addEventListener("change",(e)=>this.onChange(e));
    }
    set hass(hass) { this._hass=hass; this.render(); }
    setConfig(cfg) { this._config = {...cfg, devices: Array.isArray(cfg.devices)?cfg.devices.map(x=>({...x})):[]}; this.render(); }
    updated() { this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{...this._config,devices:this._config.devices.map(x=>({...x}))}},bubbles:true,composed:true})); this.render(); }
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
      this.updated();
    }
    onChange(e) {
      const el=e.target; const field=el.dataset.field;
      if (!field) return;
      if (el.dataset.index!==undefined) {
        const dev=this._config.devices[Number(el.dataset.index)];
        if (!dev) return;
        dev[field]=el.value;
      } else this._config[field]=el.value;
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
      this.shadowRoot.innerHTML=style()+`<ha-card>
        <div class="head"><h2>⚡ HeimEnergie einrichten</h2></div>
        <div class="note">Keine YAML-Datei erforderlich. Bitte Gerätenamen und Leistungssensoren wählen. Energiesensoren für die gewünschten Zeiträume zuordnen; Kostensensoren sind optional.</div>
        <label>Strompreis-Entität (optional)
          <select data-field="tariff_entity">${pickOptions(prices,cfg.tariff_entity)}</select>
        </label>
        <label>Fester Ersatz-Strompreis (€/kWh)
          <input data-field="tariff_fixed" type="number" min="0" step="0.0001" value="${esc(cfg.tariff_fixed??"")}">
        </label>
        <div class="head"><h2 style="font-size:17px">Geräte (${devices.length})</h2></div>
        <div class="actions"><button data-action="scan">Leistungssensoren erkennen</button><button data-action="add">+ Gerät hinzufügen</button></div>
        <div class="small muted">Automatische Erkennung ergänzt Kandidaten – vor dem Speichern bitte kontrollieren und nicht benötigte entfernen.</div>
        ${devices.map((d,i)=>`<details class="editor-device" data-index="${i}" ${expanded.includes(i)?"open":""}>
          <summary>${esc(displayName(d))}</summary>
          <label>Anzeigename<input data-field="name" data-index="${i}" value="${esc(d.name||"")}"></label>
          ${ENTITY_FIELDS.map(([field,label])=>`<label>${label}<select data-field="${field}" data-index="${i}">
            ${pickOptions(eligibleEntities(hass,field),d[field]||"")}</select></label>`).join("")}
          <div class="actions"><button data-action="remove" data-index="${i}">Gerät entfernen</button></div>
        </details>`).join("")}
        ${devices.length?"":`<div class="empty">Bitte mindestens ein Gerät hinzufügen.</div>`}
        <div class="note">Speichern erfolgt über den Home-Assistant-Dialog. Ein fehlender Zeitraum bleibt leer, statt einen ungenauen Wert zu erfinden.</div>
      </ha-card>`;
    }
  }

  class HeimDashboardStrategy extends HTMLElement {
    static configRequired = true;
    static registryDependencies = [];
    static getCreateSuggestions() { return {title:"HeimEnergie",icon:"mdi:lightning-bolt"}; }
    static getConfigElement() { return document.createElement("heimenergie-strategy-editor"); }
    static async generate(config) {
      const devices=safeDevices(config);
      const shared={devices,tariff_entity:config.tariff_entity||"",tariff_fixed:config.tariff_fixed??""};
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
      description:"Modulares Energiedashboard ohne Netzbezugszähler – Leistung, kWh und Kosten",
    });
  }
  console.info(`[HeimEnergie] v${VERSION} ready`);
})();
