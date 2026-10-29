// Lightweight browser-contract smoke test, no npm dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
class HTMLElementStub {
  attachShadow() {
    const shadow = {innerHTML:'',addEventListener(){},querySelector(){return null},querySelectorAll(){return []}};
    this.shadowRoot = shadow; return shadow;
  }
  dispatchEvent() { return true; }
}
const sandbox = {
  HTMLElement:HTMLElementStub,
  customElements:{get:(id)=>registry.get(id),define:(id,ctor)=>registry.set(id,ctor)},
  window:{},console,Intl,Number,String,Object,Array,Math,Set,CustomEvent:class {},
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('dist/heimenergie-dashboard.js','utf8'),sandbox);
assert.equal(sandbox.window.customStrategies.length,1);
const Strategy=registry.get('ll-strategy-dashboard-heimenergie');
assert.equal(Strategy.configRequired,true);
(async()=>{
 const config={devices:[
  {name:'Messpunkt Alpha',power:'sensor.example_power_a',energy_month:'sensor.example_energy_a'},
  {name:'Messpunkt Beta',power:'sensor.example_power_b',energy_month:'sensor.example_energy_b'},
 ],tariff_entity:'input_number.example_tariff',tariff_fixed:0.30};
 const generated=await Strategy.generate(config,{});
 assert.equal(generated.views.length,3);
 assert.equal(generated.views[0].cards[0].type,'custom:heimenergie-overview');
 const hass={states:{
  'sensor.example_power_a':{state:'25',attributes:{}},
  'sensor.example_power_b':{state:'50.2',attributes:{}},
  'sensor.example_energy_a':{state:'20',attributes:{}},
  'sensor.example_energy_b':{state:'10',attributes:{}},
  'input_number.example_tariff':{state:'0.30',attributes:{}}
 }};
 const View=registry.get('heimenergie-overview');
 const card=new View(); card.setConfig(generated.views[0].cards[0]); card.hass=hass;
 assert.match(card.shadowRoot.innerHTML,/75,2 W/);
 assert.match(card.shadowRoot.innerHTML,/30,00 kWh/);
 assert.match(card.shadowRoot.innerHTML,/9,00 €/);
 const malicious={...config,devices:[{name:'<img src=x onerror=alert(1)>',power:'sensor.example_power_a'}]};
 const c2=new View(); c2.setConfig(malicious); c2.hass=hass;
 assert.doesNotMatch(c2.shadowRoot.innerHTML,/<img src=x/);
 assert.match(c2.shadowRoot.innerHTML,/&lt;img/);
 const Analysis=registry.get('heimenergie-analysis');
 const a=new Analysis(); a.setConfig(generated.views[2].cards[0]); a.hass=hass;
 a._period='week'; a.render();
 assert.match(a.shadowRoot.innerHTML,/noch keine geeigneten Daten/);
 const editor=new (registry.get('heimenergie-strategy-editor'))();
 editor.setConfig({type:'custom:heimenergie',devices:[]}); editor.hass=hass;
 assert.match(editor.shadowRoot.innerHTML,/Leistungssensoren erkennen/);
 console.log('Smoke tests passed: strategy, three views, live data, costs, missing week, escaping, editor.');
})().catch(err=>{console.error(err);process.exitCode=1});
