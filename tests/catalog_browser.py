"""Headless Chromium smoke test for the backend catalog and the mobile editor."""
from pathlib import Path
from playwright.sync_api import sync_playwright
js=Path(__file__).resolve().parents[1] / 'dist' / 'heimenergie-dashboard.js'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':410,'height':820},is_mobile=True,has_touch=True)
    page.set_content('''<html><style>body{font-family:Arial;background:#111;color:#eee;--primary-text-color:#eee;--secondary-text-color:#aaa;--card-background-color:#222;--secondary-background-color:#303030;--divider-color:#444;--primary-color:#547cd8;--text-primary-color:#fff}</style><div id="demo"></div></html>''')
    page.add_script_tag(path=str(js))
    page.evaluate('''() => {
      const states={
        'sensor.heimenergie_katalog':{state:'2',attributes:{heimenergie_catalog_version:1,
          devices:[
            {name:'Prüfgerät Alpha',power:'sensor.example_power_a',consumer_type:'server',meter_name:'Messdose A',energy_month:'sensor.example_energy_a',cost_month:'sensor.example_cost_a'},
            {name:'Prüfgerät Beta',power:'sensor.example_power_b',consumer_type:'fridge',meter_name:'Messdose B',energy_month:'sensor.example_energy_b',cost_month:'sensor.example_cost_b'}],
          fixed:{total_energy_month:'sensor.sum_energy',total_cost_month:'sensor.sum_cost',base_month:'sensor.base_month',cost_incl_base_month:'sensor.cost_base'},
          price_entity:'input_number.price',price_fixed:0.3,base_monthly:10}},
        'sensor.example_power_a':{state:'25',attributes:{unit_of_measurement:'W'}},
        'sensor.example_power_b':{state:'50',attributes:{unit_of_measurement:'W'}},
        'sensor.example_energy_a':{state:'20',attributes:{unit_of_measurement:'kWh'}},
        'sensor.example_energy_b':{state:'10',attributes:{unit_of_measurement:'kWh'}},
        'sensor.example_cost_a':{state:'6',attributes:{unit_of_measurement:'€'}},
        'sensor.example_cost_b':{state:'3',attributes:{unit_of_measurement:'€'}},
        'sensor.sum_energy':{state:'30',attributes:{unit_of_measurement:'kWh'}},
        'sensor.sum_cost':{state:'9',attributes:{unit_of_measurement:'€'}},
        'sensor.base_month':{state:'10',attributes:{unit_of_measurement:'€'}},
        'sensor.cost_base':{state:'19',attributes:{unit_of_measurement:'€'}},
        'input_number.price':{state:'0.30',attributes:{}}
      };
      window.fakeHass={states};
      const el=document.createElement('heimenergie-strategy-editor');
      el.setConfig({type:'custom:heimenergie',devices:[{name:'Altes Testgerät',power:'sensor.old_power'}]});
      el.hass=window.fakeHass;
      document.querySelector('#demo').appendChild(el);
      const overview=document.createElement('heimenergie-overview');
      overview.setConfig({devices:[{name:'Altes Testgerät',power:'sensor.old_power'}],catalog_entity:'sensor.heimenergie_katalog'});
      overview.hass=window.fakeHass;
      document.querySelector('#demo').appendChild(overview);
      const devices=document.createElement('heimenergie-devices');
      devices.setConfig({catalog_entity:'sensor.heimenergie_katalog'});
      devices.hass=window.fakeHass;
      document.querySelector('#demo').appendChild(devices);
      window.editor=el;window.overview=overview;window.devices=devices;
    }''')
    ed=page.locator('heimenergie-strategy-editor')
    assert 'Katalog erkannt: 2 Geräte' in ed.locator('ha-card').inner_text()
    assert ed.locator('details').count()==0, 'Automatic mode must not ask for manual entity mapping'
    overview=page.locator('heimenergie-overview')
    txt=overview.locator('ha-card').inner_text()
    for expected in ('75,0 W','30,00 kWh','9,00 €','10,00 €','19,00 €'):
        assert expected in txt, (expected,txt)
    assert 'Altes Testgerät' not in txt
    ds=page.locator('heimenergie-devices')
    assert ds.locator('.device').count()==2
    ds.locator('input[data-action="search"]').fill('Beta')
    assert ds.locator('button.device').count()==1
    # Continuous HA updates must not destroy the focused search field.
    ds.locator('input[data-action="search"]').focus()
    result=page.evaluate('''() => {
      const d=window.devices;const input=d.shadowRoot.querySelector('input[data-action="search"]');
      for(let i=0;i<20;i++) d.hass={states:{...window.fakeHass.states}};
      return {same:d.shadowRoot.querySelector('input[data-action="search"]')===input,focused:d.shadowRoot.activeElement===input};
    }''')
    assert result=={'same':True,'focused':True},result
    # Dynamic new device shows up when HA pushes a changed catalog; no YAML regeneration.
    page.evaluate('''() => {
      const state=window.fakeHass.states['sensor.heimenergie_katalog'];
      state.attributes.devices.push({name:'Prüfgerät Gamma',power:'sensor.example_power_c'});
      window.fakeHass.states['sensor.example_power_c']={state:'3',attributes:{unit_of_measurement:'W'}};
      window.overview.hass=window.fakeHass;
    }''')
    assert '3 Geräte' in overview.locator('ha-card').inner_text()
    assert '78,0 W' in overview.locator('ha-card').inner_text()
    print('Chromium catalog test passed: auto data, costs/base, editor, mobile focus, dynamic devices.')
    browser.close()
