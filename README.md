# HeimEnergie Dashboard

**Version 0.1.2 – experimenteller Prototyp** · Sprache: Deutsch · MIT-Lizenz

Ein modulares, mobiles Home-Assistant-Energiedashboard **ohne Pflicht zum Netzbezugszähler**, ohne zusätzlichen Server und ohne eigene Datenbank. HeimEnergie liest ausschließlich bereits vorhandene Home-Assistant-Entitäten und ändert keine Sensoren, Zähler oder Konfiguration.

## Erste Funktionen

- Drei automatisch angelegte Ansichten: **Übersicht**, **Geräte** und **Auswertung**.
- Momentane **Gesamtleistung** als Summe konfigurierter Smart-Plug-Leistungssensoren (W).
- Energieverbrauch und Stromkosten in derselben Ansicht (kWh und €).
- Zeitraumauswahl **Heute / Woche / Monat / Jahr**. Ein Zeitraum wird nur angezeigt, wenn die entsprechenden Energie- oder Kostensensoren existieren.
- Sortieren, Suchen und Gerätedetails; mobiloptimiert.
- Visueller Einrichtungsdialog mit Geräteverwaltung und Sensorzuordnung.
- Strompreis aus einem `input_number`/Sensor oder fester Ersatzpreis; Kosten können aus kWh × Preis berechnet werden.
- Keine vorgegebenen Geräte oder privaten Entitäts-IDs: Sensoren werden nur lokal in Home Assistant ausgewählt.
- Keine npm-Pakete, keine externe API, keine Backend-Integration.

### Grenzen dieser ersten Version

- **Woche** funktioniert, sobald dafür passende kWh-/€-Sensoren zugeordnet sind. Die Version liest noch keine Wochenwerte direkt aus der Home-Assistant-Langzeitstatistik und legt auch keine Utility Meter an.
- Tag/Monat/Jahr benötigen ebenfalls entsprechende Sensoren. Nicht verfügbare Daten erscheinen als `—`, nicht als fiktive `0`.
- Der aktuelle Preis wird zur Berechnung fehlender Kosten verwendet; **dynamische historische Tarife werden noch nicht berücksichtigt**.
- Die Summe ist nur die Summe **überwachter Geräte**, kein vollständiger Hausverbrauch. Fehlende Sensoren werden als *Teilsumme* kenntlich gemacht.
- Keine historischen Kurven oder frei wählbaren Datumsintervalle in v0.1.2.
- In Home Assistant auf Android getestet; für v0.1.2 steht die Bestätigung des behobenen Editor-Fokusproblems noch aus.

## Voraussetzungen

- Home Assistant **2026.5 oder neuer** (Custom Dashboard Strategies im Dashboard-Auswahldialog)
- Zugriff auf `Einstellungen → Dashboards` als Admin
- Vorhandene Leistungs- und idealerweise kWh-/Kostensensoren

## Installation über GitHub + HACS (empfohlen nach Veröffentlichung des Repos)

1. Dieses Projekt als eigenes GitHub-Repository mit dem Namen `heimenergie-dashboard` veröffentlichen. `dist/heimenergie-dashboard.js` und `hacs.json` **müssen im Repository** enthalten sein.
2. Home Assistant → **HACS → ⋮ → Benutzerdefinierte Repositories** → URL des eigenen GitHub-Repositories → Kategorie **Dashboard**.
3. HeimEnergie aus HACS herunterladen. Die JavaScript-Ressource wird bei normaler Ressourcenverwaltung automatisch angelegt.
4. Home-Assistant-App/Browser vollständig neu laden.
5. **Einstellungen → Dashboards → Dashboard hinzufügen** → unter *Community-Dashboards* **HeimEnergie** auswählen.
6. Im Einrichtungsdialog **„Leistungssensoren erkennen“** verwenden oder die Geräte manuell hinzufügen und die Sensoren auswählen.
7. Dashboard erstellen. Das bisherige Strom-Dashboard und `configuration.yaml` bleiben unverändert.

Der neue offizielle Home-Assistant-Marketplace ist für die gleiche Frontend-Modulstruktur vorgesehen; siehe [Entwicklerdokumentation](https://contributors.home-assistant.io/marketplace/guides/dashboard/).

## Manuelle Installation ohne GitHub

1. Die Datei `dist/heimenergie-dashboard.js` nach `/config/www/heimenergie-dashboard.js` kopieren (bei neu angelegtem `/config/www` einmal HA neu starten).
2. Home Assistant → **Einstellungen → Dashboards → ⋮ → Ressourcen** → Ressource hinzufügen:
   - URL: `/local/heimenergie-dashboard.js?v=0.1.2`
   - Ressourcentyp: `JavaScript-Modul`
3. Browser/App neu laden; **Dashboard hinzufügen → Community-Dashboards → HeimEnergie**.

Die JavaScript-Datei unter `/local/` wird ohne HA-Authentifizierung ausgeliefert. Sie enthält **keine vorgegebenen privaten Gerätezuordnungen oder Zugangsdaten**. Die Zuordnung wird ausschließlich im jeweiligen Home-Assistant-Dashboard gespeichert; wer Zugang zum Dashboard hat, kann sie dort lesen.

## Strompreis und Daten

Ein Strompreis-Helfer ist optional. Im Einrichtungsdialog kann ein bereits vorhandener Preis-Sensor oder `input_number` ausgewählt werden. Alternativ lässt sich ein fester Preis in €/kWh eintragen. **Es ist weder ein Tarif noch ein Gerät vorbelegt.** Energie in kWh/Wh/MWh und Leistung in W/kW werden entsprechend umgerechnet.

**Datenschutz:** Persönliche Gerätezuordnungen werden nicht in den Quellcode geschrieben. Öffentliche Projektdateien, Dokumentation und Tests enthalten nur neutrale, fiktive Beispiele. Die lokale Konfiguration bleibt in Home Assistant. Nicht zum Teilen bestimmt sind Exportdateien mit echten Dashboard- oder Sensorzuordnungen.

## Änderungen in v0.1.2

- **Android-Editor:** Der Eingabefokus und geöffnete Auswahlfelder bleiben bei laufenden Home-Assistant-Zustandsaktualisierungen erhalten.
- **Sensorzuordnung:** Nach Auswahl eines Sensors wird nicht mehr der gesamte Editor neu aufgebaut.
- **Bestehende Einstellungen:** Unverändert; kein neues Dashboard und keine neue Konfiguration erforderlich.
- Die automatisch erkannte Gerätezahl oder fehlende Wochenwerte sind mit diesem Wartungsupdate noch nicht behoben.

## Entwicklung

Die gesamte Logik liegt bewusst zunächst in **einer** kleinen JavaScript-Datei unter `dist/`. Es gibt keine Build-Abhängigkeiten. Spätere Versionen können auf mehrere Module aufgeteilt werden. Die Widgets verwenden Shadow DOM und Home-Assistant-Themevariablen.

Tests (Node.js, kein npm erforderlich):

```sh
node --check dist/heimenergie-dashboard.js
node tests/smoke.cjs
python tests/browser_smoke.py  # optional: benötigt Playwright + Chromium
```

Offene nächste Punkte: reale HA-Installation prüfen, verbesserte dynamische Sensorzuordnung, wöchentliche Werte aus HA-Statistiken statt zusätzlichen Sensoren, Langzeitdiagramme, UI-Politur, Mehrsprachigkeit (DE/EN), Gerätegruppen und Import historischer Termumeter-Zählerstände.

## Datenschutz

Siehe [PRIVACY.md](PRIVACY.md). Das Projekt enthält keine vorgegebenen Geräteprofile. Verwende keine echten Entitäts-IDs, Screenshots oder Konfigurations-Exporte in öffentlichen Commits.

## Quellen / Lizenz

Dieses Projekt enthält **keinen kopierten Drittanbieter-Code**. Es nutzt die öffentlich dokumentierte Home-Assistant-Dashboard-Strategie-API:
- https://contributors.home-assistant.io/frontend/custom-ui/strategy/
- https://contributors.home-assistant.io/frontend/custom-ui/resources/
- https://contributors.home-assistant.io/marketplace/guides/dashboard/

Copyright © 2026 HeimEnergie contributors. MIT-Lizenz siehe `LICENSE`.
