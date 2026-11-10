const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const reg=new Map();
let navigateTo='';let events=[];
class ElementStub {
 attachShadow(){this.shadowRoot={innerHTML:'',addEventListener(){},activeElement:null,querySelector(){return null}};return this.shadowRoot;}
 dispatchEvent(e){events.push(e);return true;}
}
class EventStub {constructor(type,options){this.type=type;this.detail=options?.detail;}}
const sandbox={HTMLElement:ElementStub, customElements:{get:k=>reg.get(k),define:(k,v)=>reg.set(k,v)},
 window:{location:{assign:url=>{navigateTo=url;}}},console,Intl,CustomEvent:EventStub,Date,Set,Math};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('dist/heimenergie-dashboard.js','utf8'),sandbox);
const Devices=reg.get('heimenergie-devices');
const now=Date.now();const row=(v,ms)=>({s:String(v),lu:(now-ms)/1000});
const messages=[];
const hass={states:{
 'sensor.heimenergie_katalog':{state:'2',attributes:{heimenergie_catalog_version:1,devices:[
  {name:'Demo Alpha',meter_name:'Plug A',consumer_type:'server',power:'sensor.demo_power_a',energy_month:'sensor.demo_energy_a',cost_month:'sensor.demo_cost_a'},
  {name:'Demo Beta',meter_name:'Plug B',consumer_type:'fridge',power:'sensor.demo_power_b'},
 ]}},
 'sensor.demo_power_a':{state:'55',attributes:{unit_of_measurement:'W'}},
 'sensor.demo_power_b':{state:'0',attributes:{unit_of_measurement:'W'}},
 'sensor.demo_energy_a':{state:'10',attributes:{unit_of_measurement:'kWh'}},
 'sensor.demo_cost_a':{state:'3.08',attributes:{unit_of_measurement:'€'}},
},callWS(msg){
 messages.push(msg);
 if(msg.type==='config/entity_registry/list_for_display') return Promise.resolve({entities:[{ei:'sensor.demo_power_a',di:'demo_registry_id'}]});
 if(msg.type==='history/history_during_period') return Promise.resolve({
  'sensor.demo_power_a':[row(22,3600000),row(45,1800000),row(12,300000)],
  'sensor.demo_power_b':[],
 });
 throw Error('unexpected WS call');
}};
const flush=()=>new Promise(r=>setTimeout(r,0));
(async()=>{
 const card=new Devices();card.setConfig({catalog_entity:'sensor.heimenergie_katalog'});card.hass=hass;
 await flush();await flush();
 const request=messages.find(msg=>msg.type==="history/history_during_period");
 assert.equal(Date.parse(request.end_time)-Date.parse(request.start_time),12*3600000);
 assert.match(card.shadowRoot.innerHTML,/Leistung · letzte 12 h/);
 const html=card.shadowRoot.innerHTML;
 assert.match(html,/Demo Alpha/);assert.match(html,/55,0 W/);
 assert.match(html,/10,00 kWh/);assert.match(html,/3,08 €/);
 assert.match(html,/class="spark-path"/);
 assert.match(html,/Keine Verlaufsdaten/);
 assert.match(html,/var\(--accent-color,var\(--primary-color\)\)/); // Theme without hardcoded color
 assert.match(html,/data-action="native-device" data-value="demo_registry_id"/);
 assert.match(html,/data-action="entity-info" data-value="sensor.demo_power_b"/);
 assert.equal(messages.filter(x=>x.type==='history/history_during_period').length,1);
 assert.equal(messages.filter(x=>x.type==='config/entity_registry/list_for_display').length,1);
 assert.equal(messages.find(x=>x.type==='history/history_during_period').entity_ids.length,2);
 for(let i=0;i<30;i++)card.hass={...hass};
 assert.equal(messages.filter(x=>x.type==='history/history_during_period').length,1);
 assert.equal(messages.filter(x=>x.type==='config/entity_registry/list_for_display').length,1);
 card._detail='sensor.demo_power_a';card.render();
 assert.match(card.shadowRoot.innerHTML,/Messgerät: Plug A/);
 assert.match(card.shadowRoot.innerHTML,/Home-Assistant-Gerät öffnen/);
 card.onClick({target:{closest:()=>({dataset:{action:'native-device',value:'demo_registry_id'}})}});
 assert.equal(navigateTo,'/config/devices/device/demo_registry_id');
 card.onClick({target:{closest:()=>({dataset:{action:'entity-info',value:'sensor.demo_power_b'}})}});
 assert.equal(events.at(-1).type,'hass-more-info');
 assert.equal(events.at(-1).detail.entityId,'sensor.demo_power_b');
 // Unauthorized device IDs must never be navigated to.
 navigateTo=''; card.onClick({target:{closest:()=>({dataset:{action:'native-device',value:'forged'}})}});
 assert.equal(navigateTo,'');
 console.log('Device test passed: history batching, theme variables, link resolution, fallback, caching, and safety.');
})().catch(err=>{console.error(err);process.exitCode=1});
