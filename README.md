# HeimEnergie Dashboard

**Version 0.4.0-alpha.4** · Deutsch · MIT-Lizenz · Home Assistant Community Dashboard

HeimEnergie ist eine mobile Energieoberfläche mit **Übersicht**, **Geräten** und **Auswertung**. In Verbindung mit der **HeimEnergie Integration v0.2.5 oder neuer** übernimmt es automatisch Geräte, Leistungs-, Energie- und Kostensensoren aus dem lokalen Katalog. **Ein Netzbezugszähler ist nicht erforderlich.**

## Neu in v0.4.0-alpha.4

Die Detailkurve verwendet jetzt dieselbe Theme-Akzentfarbe wie die Gerätekurven und wird ohne Flächenfüllung gezeichnet.

## Detailansicht

Ein Tipp auf eine Gerätekarte öffnet die Detailansicht mit einem größeren 12-Stunden-Leistungsdiagramm. Die linke Skala zeigt Watt, die Zeitachse verwendet die in Home Assistant eingestellte Zeitzone. Fehlende Daten und Abruffehler werden angezeigt.

## Gerätekurven

- **Leistungskurven in jeder Gerätekarte:** Die W-, kWh- und Euro-Anzeigen bleiben erhalten. Darunter wird für jeden Leistungssensor ein eigener 12-Stunden-Sparkline gezeigt, sofern Recorder-Daten vorhanden sind.
- **Ein gemeinsamer Datenabruf:** Alle Leistungssensoren werden gemeinsam über `history/history_during_period` abgefragt. Aktualisierung höchstens alle fünf Minuten; die aktuelle Leistung wird zwischenzeitlich aus Home Assistant ergänzt. Die Graphen werden auf ungefähr 110 Punkte je Gerät begrenzt; Spitzenwerte bleiben durch Min/Max-Auswahl sichtbar.
- **Native Geräteinformationen:** Ein separates Symbol oben rechts öffnet die Home-Assistant-Geräteseite des physischen Messgeräts, falls dessen Leistungssensor in der HA-Entitätsregistrierung einem Gerät zugeordnet ist. Andernfalls öffnet es die Sensorinformationen. Die HeimEnergie-Detailansicht bleibt über die restliche Kachel erreichbar.
- **Automatische Designanpassung:** Diagramme verwenden `--accent-color`, Bedienelemente `--primary-color`, Karten- und Schriftfarben die Home-Assistant-Theme-Variablen. Auch ein Wechsel zu Hell/Dunkel oder einem anderen Theme wirkt ohne erneute Sensorkonfiguration.
- **Keine zusätzlichen Sensoren / Backend-Migration:** Nutzt nur lokal vorhandene Historie und Gerätezuordnungen. Keine neuen Helfer, keine manuelle YAML, keine weiteren Abhängigkeiten.

**Voraussetzung für Kurven:** Home Assistant Recorder muss die jeweiligen Leistungssensoren aufzeichnen. Wenn historische Werte fehlen oder der Abruf nicht möglich ist, zeigt die Kachel einen Hinweis; die aktuellen Mess- und Verbrauchswerte bleiben nutzbar. Die 12-Stunden-Kurven sind unabhängig von der Zeitraumwahl für kWh/Euro. Die freie historische Zeitraumauswahl, Vergleichsmonate und gruppierte Graphen aller Geräte folgen in einer späteren Version.

## Neu in v0.3.0-alpha

- **Keine doppelte Gerätekonfiguration:** Liest standardmäßig `sensor.heimenergie_katalog` aus der HeimEnergie Integration. Geänderte oder neue Verbraucher werden bei Home-Assistant-Zustandsaktualisierungen übernommen, ohne das Dashboard neu zu generieren.
- **Übersicht:** Summe der aktuellen Leistung (W) sowie kWh, Verbrauchskosten, Grundpreis, erfasste Kosten inkl. Grundpreis und Arbeitspreis.
- **Geräte:** Suche, Sortierung, Gerätekarten und Detailansicht. Der Verbrauchername wird verwendet; das physische Messgerät wird in der Detailansicht gezeigt.
- **Auswertung:** Gerätevergleich mit kWh und variablen Kosten sowie separater Grundpreis für Heute, Woche, Monat und Jahr.
- **Tarifquelle:** Preis- und Fixkostensensoren stammen aus dem Katalog, nicht aus einer zweiten Dashboard-Einstellung.
- **Bestands-Dashboards:** Die manuelle Konfiguration von v0.1.x bleibt als auswählbarer Legacy-Modus erhalten. Wenn der Katalog vorübergehend fehlt, kann ein bestehendes manuell eingerichtetes Dashboard seine bisherigen Daten anzeigen.
- Keine eigenen Backend-Schreibzugriffe: Das Dashboard ist eine reine Oberfläche. Sensoren und ihre Zuordnungen werden in der Home-Assistant-Integration verwaltet.

## Voraussetzungen

- Home Assistant 2026.5 oder neuer für die Community-Dashboard-Strategie
- HeimEnergie Integration v0.2.5 oder neuer (empfohlen), installiert und eingerichtet
- HeimEnergie-Katalog mit Attribut `heimenergie_catalog_version: 1` und `devices` (normalerweise `sensor.heimenergie_katalog`)
- Geeignete Leistungssensoren; die Integration stellt Zeitraumzähler und Kostensensoren bereit bzw. verweist auf vorhandene

Ohne Backend bleibt die manuelle Konfiguration von v0.1.x nutzbar; eine neue Installation zeigt einen entsprechenden Hinweis, solange kein gültiger Katalog verfügbar ist.

## Installation und Aktualisierung mit HACS

**Neue Installation**
1. **HACS → Benutzerdefinierte Repositories:** Das öffentliche GitHub-Repository `heimenergie-dashboard` als Kategorie **Dashboard** hinzufügen.
2. **HeimEnergie Dashboard** in HACS herunterladen.
3. HA-App neu laden.
4. **Einstellungen → Dashboards → Dashboard hinzufügen → Community-Dashboards → HeimEnergie**.
5. Datenquelle **„Automatisch: HeimEnergie Integration“** auswählen. Bei Bedarf den richtigen Katalog auswählen und speichern.

**Update auf v0.4.0-alpha.4**

Öffne HeimEnergie Dashboard in HACS bzw. im Marketplace. Aktiviere Vorabversionen, aktualisiere bei Bedarf die Repository-Informationen und lade `v0.4.0-alpha.4` herunter. Lade das Frontend neu und öffne die Geräteansicht. Vergleiche eine 12-Stunden-Kurve mit dem Verlauf desselben Leistungssensors in Home Assistant. Über die Versionsauswahl kannst du bei Bedarf wieder `v0.3.1-alpha` herunterladen.

**Update von v0.1.2**
1. Dashboard-Konfiguration optional vorab über Home Assistant sichern.
2. In HACS **HeimEnergie Dashboard → ⋮ → Informationen aktualisieren / Erneut herunterladen**.
3. App/Browser neu laden; falls nötig den Frontend-Cache aktualisieren.
4. Dein vorhandenes HeimEnergie-Dashboard weiterhin öffnen. **Es ist keine erneute manuelle Gerätezuordnung nötig**, wenn der Katalog gefunden wird. Im Dashboard-Konfigurationsdialog ist „Automatisch“ die Standardeinstellung, auch für ältere Konfigurationen ohne `source`-Eintrag.

Die bestehende Integration und ihre Zähler **nicht entfernen**: Dieses Update betrifft ausschließlich die Dashboard-Dateien.

## Anzeige- und Berechnungsregeln

- Die Hauptdatenquelle sind `attributes.devices` und `attributes.fixed` des lokalen Katalogs. Sensorwerte werden zur Laufzeit direkt aus den Home-Assistant-Zuständen gelesen.
- Der Grundpreis wird **einmal pro Zeitraum** aus `fixed.base_<period>` angezeigt. Er wird **nicht** zu jeder Gerätekarte addiert. Das Feld `fixed.cost_incl_base_<period>` liefert die vom Backend berechnete Summe der erfassten variablen Kosten plus Grundpreis.
- Kosten je Gerät sind **Verbrauchskosten**, ohne anteiligen Grundpreis. Falls der Kostensensor fehlt, wird – nur sofern ein Energiewert und ein aktueller Arbeitspreis vorliegen – ein aktueller Näherungswert aus kWh × Preis angezeigt. Dies ersetzt keine historische Tarifabrechnung.
- Nicht vorhandene bzw. nicht verfügbare Werte erscheinen als **—**, nicht als angenommene 0. Eine unvollständige Geräteabdeckung wird kenntlich gemacht.
- Die Gesamtsumme berücksichtigt **nur die überwachten Geräte**. Ohne Netzbezugszähler ist sie keine komplette Stromrechnung für den Haushalt.
- Mini-Leistungskurven über die letzten 12 Stunden werden aus dem HA-Recorder geladen. Freie historische Zeitfenster und die Zuordnung historischer Werte bei umgesteckten Messgeräten folgen später.

## Datenschutz

Im Quellcode sind **keine privaten Gerätenamen, individuellen Entitäts-IDs, lokalen IP-Adressen, Strompreise oder Zugangsdaten** hinterlegt. Die acht oder mehr Geräte werden ausschließlich aus der *lokalen* Home-Assistant-Konfiguration gelesen. Die Daten werden nicht an GitHub oder externe Dienste gesendet. Bitte niemals persönliche Dashboard-Exporte, `.storage`-Dateien oder Screenshots mit vertraulichen Angaben committen. Siehe [PRIVACY.md](PRIVACY.md).

## Entwicklung und Tests

Ein kleines eigenständiges JavaScript-Modul liegt unter `dist/heimenergie-dashboard.js`. Keine npm-Abhängigkeiten, kein zusätzlicher Build-Prozess.

```bash
node --check dist/heimenergie-dashboard.js
node tests/smoke.cjs
node tests/device_sparklines.cjs
```

Ergänzende lokale Chromium-Tests für Entwicklungssysteme mit Playwright:

```bash
python tests/browser_smoke.py
python tests/catalog_browser.py
python tests/device_sparklines_browser.py
```

Das Backend-Repository ist separat: https://github.com/uhrensohn86/heimenergie-integration

## Lizenz und Grundlagen

MIT-Lizenz, siehe [LICENSE](LICENSE). Kein kopierter Drittanbieter-Code. API-Grundlage: https://contributors.home-assistant.io/frontend/custom-ui/strategy/

## Release-Workflow

Nach Tests und Commit über GitHub Actions den neuen Commit prüfen und ein **GitHub-Pre-Release** mit Tag `v0.4.0-alpha.4` veröffentlichen. In HACS für das Dashboard Vorabversionen aktivieren; HACS bietet dann die neue Version als Update an. Für den ersten Live-Test in Home Assistant die bestehende Dashboard-Konfiguration vorab sichern. Bei Problemen den vorherigen GitHub-Release `v0.3.1-alpha` über HACS erneut herunterladen.
