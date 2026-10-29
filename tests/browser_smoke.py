from playwright.sync_api import sync_playwright
from pathlib import Path
js=Path(__file__).resolve().parents[1] / 'dist' / 'heimenergie-dashboard.js'
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':410,'height':820})
    page.set_content('''<html><style>body{font-family:Arial;background:#111;color:#eee;--primary-text-color:#eee;--secondary-text-color:#aaa;--card-background-color:#222;--secondary-background-color:#303030;--divider-color:#444;--primary-color:#547cd8;--text-primary-color:#fff}</style><div id="demo"></div></html>''')
    page.add_script_tag(path=str(js))
    page.evaluate('''() => {
      const states={
        'sensor.example_power_a':{state:'25.026',attributes:{device_class:'power',unit_of_measurement:'W',friendly_name:'Messpunkt Alpha'}},
        'sensor.example_power_b':{state:'55',attributes:{device_class:'power',unit_of_measurement:'W',friendly_name:'Messpunkt Beta'}},
        'sensor.example_energy_a':{state:'20',attributes:{device_class:'energy',unit_of_measurement:'kWh'}},
        'input_number.example_tariff':{state:'0.30',attributes:{friendly_name:'Tarif'}}
      };
      window.fakeHass={states};
      const el=document.createElement('heimenergie-strategy-editor');
      el.setConfig({type:'custom:heimenergie',devices:[]}); el.hass=window.fakeHass;
      document.querySelector('#demo').appendChild(el);
    }''')
    page.locator('heimenergie-strategy-editor').locator('button[data-action="scan"]').click()
    assert page.locator('heimenergie-strategy-editor').locator('details').count()==2
    page.locator('heimenergie-strategy-editor').locator('details').first.locator('summary').click()
    page.locator('heimenergie-strategy-editor').locator('details').first.locator('[data-field="name"]').fill('Messpunkt geändert')
    page.locator('heimenergie-strategy-editor').locator('details').first.locator('[data-field="name"]').press('Tab')
    assert page.locator('heimenergie-strategy-editor').locator('details').first.get_attribute('open') is not None
    # Regression: Android IME and native select menus must not lose their DOM
    # element when HA pushes frequent hass updates or echoes config-changed.
    ed=page.locator('heimenergie-strategy-editor')
    name_input=ed.locator('details').first.locator('[data-field="name"]')
    name_input.focus()
    assert page.evaluate('''() => {
      const ed=document.querySelector('heimenergie-strategy-editor');
      const field=ed.shadowRoot.querySelector('details [data-field="name"]');
      window.focusField=field;
      return ed.shadowRoot.activeElement===field;
    }''')
    result=page.evaluate('''() => {
      const ed=document.querySelector('heimenergie-strategy-editor');
      for(let i=0;i<15;i++) ed.hass={states:{...window.fakeHass.states}};
      return {
        same:ed.shadowRoot.querySelector('details [data-field="name"]')===window.focusField,
        focus:ed.shadowRoot.activeElement===window.focusField
      };
    }''')
    assert result=={'same':True,'focus':True}, f'HA update dismissed keyboard: {result}'
    # Test the HA config echo during selection. This must not replace the select.
    check=page.evaluate('''() => {
      const ed=document.querySelector('heimenergie-strategy-editor');
      ed.addEventListener('config-changed', (e)=>ed.setConfig(e.detail.config));
      const sel=ed.shadowRoot.querySelector('details [data-field="energy_month"]');
      sel.value='sensor.example_energy_a';
      sel.dispatchEvent(new Event('change',{bubbles:true,composed:true}));
      return {
        retained:sel===ed.shadowRoot.querySelector('details [data-field="energy_month"]'),
        value:sel.value,
        stored:ed._config.devices[0].energy_month,
        expanded:ed.shadowRoot.querySelector('details').open
      };
    }''')
    assert check['retained'] and check['expanded'], f'select was replaced: {check}'
    assert check['value']=='sensor.example_energy_a' and check['stored']=='sensor.example_energy_a'
    # dashboard view shows Watt and sensors only when supplied
    page.evaluate('''() => {
      const e=document.createElement('heimenergie-overview');
      e.setConfig({devices:[{name:'Messpunkt Alpha',power:'sensor.example_power_a',energy_month:'sensor.example_energy_a'}],tariff_entity:'input_number.example_tariff'});
      e.hass=window.fakeHass; document.querySelector('#demo').appendChild(e);
    }''')
    overview=page.locator('heimenergie-overview')
    card_text=overview.locator('ha-card').inner_text()
    assert '25,0 W' in card_text
    assert '6,00 €' in card_text
    print('Chromium smoke test passed (editor, focus stability on HA updates, select change and echoed config, dashboard preview).')
    browser.close()
