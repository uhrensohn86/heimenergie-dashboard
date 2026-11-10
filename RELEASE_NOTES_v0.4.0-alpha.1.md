# HeimEnergie Dashboard v0.4.0-alpha.1 – Gerätekarten mit Leistungskurven

Erste Vorabversion der geplanten v0.4.0-Reihe. **Nur Frontend-Änderungen**; die HeimEnergie Integration v0.2.5 kann unverändert bleiben.

## Neu

- **Mini-Diagramm je Gerät:** 24-Stunden-Verlauf der tatsächlichen Leistung direkt in der bestehenden Gerätekarte, unterhalb der Werte für W, kWh und Kosten.
- **Geräteinformationen:** Separates Symbol führt zur nativen Home-Assistant-Geräteseite des Messgeräts, wenn die Geräte-ID dem Leistungssensor zugeordnet ist. Ohne Gerätezuordnung werden die Sensorinformationen geöffnet.
- **Theme-Unterstützung:** Diagrammfarbe folgt der Akzentfarbe von Home Assistant; alle Karten berücksichtigen die vorhandenen Theme-Variablen. Designwechsel einschließlich Hell/Dunkel ohne zusätzliche Konfiguration.
- **Effizienter Abruf:** Ein gemeinsamer Recorder-Abruf für alle Leistungssensoren; Zwischenspeicherung, Reduktion der Kurvenpunkte und verständliche Hinweise bei fehlenden Daten.

## Unverändert

- Automatischer HeimEnergie-Katalog; keine zweite Gerätekonfiguration oder YAML.
- Zeitraumwerte für Heute, Woche, Monat, Jahr; W, kWh, € und bestehende Geräte-Detailansicht.
- Sensoren, Tarife und Grundpreisberechnung im Python-Backend.

## Hinweise

- Kurven werden nur angezeigt, soweit Home Assistant die Leistungshistorie tatsächlich im Recorder gespeichert hat.
- Diese Vorabversion zeigt auf den Kacheln **immer die letzten 24 Stunden**. Freie Zeiträume, Vormonatsvergleiche und kombinierte historische Diagramme sind noch nicht Teil dieser Version.
- Am besten vor dem Update ein Home-Assistant-Backup anlegen. In HACS muss **Vorabversionen anzeigen** für das Dashboard aktiviert sein. Nach der Installation die HA-Frontend-Ansicht neu laden.
- Rückkehr zu `v0.3.1-alpha` ist über die Versionsauswahl in HACS möglich.

## Validierung

JavaScript-Syntax und beide Node-Tests mit simulierten Daten geprüft. Der Vergleich mit realen Recorder-Daten erfolgt nach Installation dieser Vorabversion.
