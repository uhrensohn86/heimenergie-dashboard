"""Mobile browser contract: sparklines, navigation, live theme and original values."""
from pathlib import Path
from playwright.sync_api import sync_playwright
js=Path(__file__).resolve().parents[1]/'dist'/'heimenergie-dashboard.js'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':410,'height':930},is_mobile=True,has_touch=True)
    page.set_content('''<html><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:Arial,sans-serif;background:#181818;color:#eee;--primary-text-color:#eee;--secondary-text-color:#aaa;--card-background-color:#202020;--ha-card-background:#222;--secondary-background-color:#303030;--divider-color:#444;--primary-color:#00a7c3;--accent-color:#ff9700;--text-primary-color:#fff}ha-card{display:block}</style><div id="demo"></div></html>''')
    page.add_script_tag(path=str(js))
    page.evaluate('''() => {
      const now=Date.now();
      const row=(v,delta)=>({s:String(v),lu:(now-delta)/1000});
      const catalog={state:'2',attributes:{heimenergie_catalog_version:1,devices:[
         {name:'Testgerät Alpha',meter_name:'Demo-Messdose A',power:'sensor.demo_power_a',consumer_type:'server',energy_month:'sensor.demo_energy_a',cost_month:'sensor.demo_cost_a'},
         {name:'Testgerät Beta',meter_name:'Demo-Messdose B',power:'sensor.demo_power_b',consumer_type:'fridge',energy_month:'sensor.demo_energy_b',cost_month:'sensor.demo_cost_b'},
      ]}};
      const states={'sensor.heimenergie_katalog':catalog,
        'sensor.demo_power_a':{state:'31',attributes:{unit_of_measurement:'W'}},
        'sensor.demo_power_b':{state:'0',attributes:{unit_of_measurement:'W'}},
        'sensor.demo_energy_a':{state:'3.4'},'sensor.demo_energy_b':{state:'1.4'},
        'sensor.demo_cost_a':{state:'1.05'},'sensor.demo_cost_b':{state:'0.43'},
      };
      const history={'sensor.demo_power_a':[row(25,1000*60*60*23),row(28,1000*60*60*16),row(22,1000*60*60*8),row(30,1000*60*60)],
      'sensor.demo_power_b':[row(0,1000*60*60*23),row(55,1000*60*60*20),row(0,1000*60*60*16),row(54,1000*60*60*13),row(0,1000*60*60*10),row(55,1000*60*60*5),row(0,1000*60*60)]};
      const card=document.createElement('heimenergie-devices');card.setConfig({});card.hass={states,callWS:msg=>{
         if(msg.type==='history/history_during_period')return Promise.resolve(history);
         if(msg.type==='config/entity_registry/list_for_display')return Promise.resolve({entities:[{ei:'sensor.demo_power_a',di:'device-1'},{ei:'sensor.demo_power_b',di:'device-2'}]});
         throw Error('Unexpected call '+msg.type);
      }};
      document.getElementById('demo').appendChild(card);
      window.card=card;
    }''')
    page.wait_for_function("document.querySelector('heimenergie-devices').shadowRoot.querySelectorAll('.spark-path').length===2")
    card=page.locator('heimenergie-devices')
    assert card.locator('.device').count()==2
    assert card.locator('button.device-main').count()==2
    assert card.locator('button.device-link').count()==2
    for text in ('Testgerät Alpha','3,40 kWh','1,05 €','31,0 W'):
        assert text in card.locator("ha-card").inner_text(),text
    # The path inherits HA accent color and can change without a JavaScript render.
    before=card.locator('.spark-path').first.evaluate('(e)=>getComputedStyle(e).stroke')
    assert before=='rgb(255, 151, 0)',before
    page.evaluate("document.body.style.setProperty('--accent-color', '#20cc55')")
    after=card.locator('.spark-path').first.evaluate('(e)=>getComputedStyle(e).stroke')
    assert after=='rgb(32, 204, 85)',after
    card.locator('button.device-main').first.click()
    assert 'Messgerät: Demo-Messdose A' in card.locator('ha-card').inner_text()
    assert card.locator('button[data-action="native-device"]').count()==1
    card.locator('button[data-action="back"]').click()
    assert card.locator('.spark-path').count()==2
    # UI snapshot for local QA only.
    card.screenshot(path=str(Path(__file__).resolve().parents[1]/'tests'/'device_sparklines_preview.png'))
    print('Chromium device test passed: responsive cards, native link, actual history, theme switching and details.')
    browser.close()
