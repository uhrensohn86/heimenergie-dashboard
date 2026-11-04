// Browser contract smoke tests, no npm dependencies and no private entity IDs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
class HTMLElementStub {
  attachShadow() {
    const shadow = {innerHTML:'',addEventListener(){},querySelector(){return null},querySelectorAll(){return []},activeElement:null};
    this.shadowRoot=shadow; return shadow;
  }
  dispatchEvent(){return true;}
}
const sandbox = {
  HTMLElement:HTMLElementStub,
  customElements:{get:id=>registry.get(id),define:(id,ctor)=>registry.set(id,ctor)},
  window:{},console,Intl,Number,String,Object,Array,Math,Set,CustomEvent:class {},
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('dist/heimenergie-dashboard.js','utf8'),sandbox);
const Strategy=registry.get('ll-strategy-dashboard-heimenergie');
const Overview=registry.get('heimenergie-overview');
const Devices=registry.get('heimenergie-devices');
const Analysis=registry.get('heimenergie-analysis');
(async()=>{
  const oldConfig={devices:[{name:'Altes Testgerät',power:'sensor.demo_power_a',energy_month:'sensor.demo_energy_a'}],tariff_fixed:0.25};
  const generated=await Strategy.generate(oldConfig,{});
  assert.equal(generated.views.length,3);
  assert.equal(generated.views[0].cards[0].catalog_entity,'sensor.heimenergie_katalog');
  assert.equal(generated.views[1].cards[0].type,'custom:heimenergie-devices');
  // Backend first, even if v0.1.x left manual entries in dashboard strategy config.
  const hass={states:{
    'sensor.heimenergie_katalog':{state:'2',attributes:{heimenergie_catalog_version:1,
      devices:[
        {name:'Messpunkt Alpha',meter_name:'Plug A',consumer_type:'server',power:'sensor.demo_power_a',energy_month:'sensor.demo_energy_a',cost_month:'sensor.demo_cost_a'},
        {name:'Messpunkt Beta',meter_name:'Plug B',consumer_type:'fridge',power:'sensor.demo_power_b',energy_month:'sensor.demo_energy_b',cost_month:'sensor.demo_cost_b'},
      ],
      fixed:{total_energy_month:'sensor.demo_sum_energy',total_cost_month:'sensor.demo_sum_cost',base_month:'sensor.demo_base',cost_incl_base_month:'sensor.demo_including'},
      price_entity:'input_number.demo_tariff',price_fixed:0.27,base_monthly:10,
    }},
    'sensor.demo_power_a':{state:'25',attributes:{unit_of_measurement:'W'}},
    'sensor.demo_power_b':{state:'0.05',attributes:{unit_of_measurement:'kW'}},
    'sensor.demo_energy_a':{state:'20',attributes:{unit_of_measurement:'kWh'}},
    'sensor.demo_energy_b':{state:'10000',attributes:{unit_of_measurement:'Wh'}},
    'sensor.demo_cost_a':{state:'6',attributes:{unit_of_measurement:'€'}},
    'sensor.demo_cost_b':{state:'3',attributes:{unit_of_measurement:'€'}},
    'sensor.demo_sum_energy':{state:'30',attributes:{unit_of_measurement:'kWh'}},
    'sensor.demo_sum_cost':{state:'9',attributes:{unit_of_measurement:'€'}},
    'sensor.demo_base':{state:'10',attributes:{unit_of_measurement:'€'}},
    'sensor.demo_including':{state:'19',attributes:{unit_of_measurement:'€'}},
    'input_number.demo_tariff':{state:'0.3',attributes:{}},
  }};
  const overview=new Overview(); overview.setConfig(generated.views[0].cards[0]); overview.hass=hass;
  assert.match(overview.shadowRoot.innerHTML,/75,0 W/);
  assert.match(overview.shadowRoot.innerHTML,/30,00 kWh/);
  assert.match(overview.shadowRoot.innerHTML,/9,00 €/);
  assert.match(overview.shadowRoot.innerHTML,/10,00 €/);
  assert.match(overview.shadowRoot.innerHTML,/19,00 €/);
  assert.match(overview.shadowRoot.innerHTML,/0,3000/);
  assert.match(overview.shadowRoot.innerHTML,/2 Geräte/);
  assert.doesNotMatch(overview.shadowRoot.innerHTML,/Altes Testgerät/);
  const devices=new Devices(); devices.setConfig(generated.views[1].cards[0]); devices.hass=hass;
  assert.match(devices.shadowRoot.innerHTML,/Messpunkt Beta/);
  devices._detail="sensor.demo_power_b";devices.render();
  assert.match(devices.shadowRoot.innerHTML,/Plug B/);
  const analysis=new Analysis(); analysis.setConfig(generated.views[2].cards[0]); analysis.hass=hass;
  assert.match(analysis.shadowRoot.innerHTML,/Grundpreis/);
  assert.match(analysis.shadowRoot.innerHTML,/19,00 €/);
  assert.match(analysis.shadowRoot.innerHTML,/Messpunkt Alpha/);
  // Malicious local display names never become raw HTML.
  hass.states['sensor.heimenergie_katalog'].attributes.devices[0].name='<img src=x onerror=alert(1)>';
  overview.hass=hass;
  assert.doesNotMatch(overview.shadowRoot.innerHTML,/<img src=x/);
  assert.match(overview.shadowRoot.innerHTML,/&lt;img/);
  // All clients react to changes in the catalog without regenerating dashboard YAML.
  hass.states['sensor.heimenergie_katalog'].attributes.devices.push({name:'Messpunkt Gamma',power:'sensor.demo_power_c'});
  hass.states['sensor.demo_power_c']={state:'5',attributes:{unit_of_measurement:'W'}};
  overview.hass=hass;
  assert.match(overview.shadowRoot.innerHTML,/3 Geräte/);
  assert.match(overview.shadowRoot.innerHTML,/80,0 W/);
  // Missing fixed cost remains unavailable, not a fabricated zero.
  delete hass.states['sensor.demo_including']; delete hass.states['sensor.demo_base'];
  overview.hass=hass;
  assert.match(overview.shadowRoot.innerHTML,/— €/);
  // Legacy manual dashboards still work when catalog absent or source=manual.
  const oldHass={states:{'sensor.demo_power_a':{state:'25',attributes:{unit_of_measurement:'W'}},'sensor.demo_energy_a':{state:'4',attributes:{unit_of_measurement:'kWh'}}}};
  const old=new Overview(); old.setConfig(generated.views[0].cards[0]); old.hass=oldHass;
  assert.match(old.shadowRoot.innerHTML,/Altes Testgerät/);
  assert.match(old.shadowRoot.innerHTML,/1,00 €/);
  const editor=new (registry.get('heimenergie-strategy-editor'))();
  editor.setConfig(oldConfig); editor.hass=hass;
  assert.match(editor.shadowRoot.innerHTML,/HeimEnergie-Katalog/);
  assert.doesNotMatch(editor.shadowRoot.innerHTML,/Leistungssensoren erkennen/);
  const legacyEditor=new (registry.get('heimenergie-strategy-editor'))();
  legacyEditor.setConfig({...oldConfig,source:'manual'});legacyEditor.hass=oldHass;
  assert.match(legacyEditor.shadowRoot.innerHTML,/Leistungssensoren erkennen/);
  console.log('Smoke tests passed: strategy, dynamic catalog, totals, base price, conversion, XSS, legacy fallback and editor.');
})().catch(e=>{console.error(e);process.exitCode=1;});
