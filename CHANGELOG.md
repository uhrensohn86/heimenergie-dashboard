# Änderungsprotokoll

## 0.4.0-alpha.3 – Leistung im Gerätedetail

- Größerer 12-Stunden-Verlauf mit Watt-Skala und Uhrzeiten in der HA-Zeitzone.
- Bestehender gemeinsamer Recorder-Abruf wird für die Detailansicht verwendet.

## 0.4.0-alpha.2 – Zwölf Stunden je Gerätekurve

- Der Recorder-Abruf und die Zeitachse der Gerätekarten umfassen jetzt die letzten zwölf Stunden. Die Zeitraumwahl für Energie und Kosten bleibt unabhängig davon.

## 0.4.0-alpha.1 – Geräteübersicht mit Verlauf und nativer Navigation

- Individuelle 24-h-Leistungsverläufe direkt in jeder Gerätekarte (SVG, Recorder/WS, gemeinsam abgefragt, mobil optimiert)
- Bestehende Leistung, kWh und Verbrauchskosten unverändert
- Separates Symbol für die native HA-Geräteseite über die Entitätsregistrierung; Sensordetails als Rückfall
- Automatische Theme-Farben einschließlich `--accent-color` und Hell-/Dunkelmodus
- Caching, fehlende Daten, Fehlerfälle und Android-Tests
- Keine Backend-Änderung, kein manuelles YAML, keine privaten IDs im Repository

## 0.3.1-alpha – Release- und HACS-Pflege

- Nachvollziehbare GitHub-Releases, CI-Tests und HACS-Versionskennung; keine Änderung der Dashboard-Funktionen

## 0.3.0-alpha – automatischer Integrationskatalog

- Erstmals dynamische Geräteübernahme über den HeimEnergie-Katalog
- Tarif-/Grundpreisübersicht, Grundpreis nur einmal pro Zeitraum
- Überwachungsgrad und fehlende Zeitraumwerte kenntlich gemacht
- Automatischer und manueller Legacy-Modus; v0.1.x-Konfiguration bleibt nutzbar
- Android-Fokusregression für Eingabefelder weiter getestet
- Tests ohne persönliche Gerätezuordnungen

Keine Änderung am Python-Backend oder an vorhandenen HA-Zählern.
