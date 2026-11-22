# Supabase – Beitragsdatenbank

Diese Datenbank speichert ausschließlich bestätigte Beiträge für das Fahrradprojekt.

## Was gespeichert wird
- Eine eindeutige PayPal-Capture-ID (zum Schutz vor doppelter Verbuchung)
- Der bestätigte Betrag in Cent
- Die Währung (EUR)
- Der Zeitpunkt der Bestätigung

Es werden keine Bankdaten, Kartendaten oder Namen von Unterstützern in dieser Tabelle gespeichert.

## Einrichtung
1. Ein Elternteil erstellt und verwaltet das Supabase-Projekt.
2. Im Supabase-Dashboard den SQL Editor öffnen.
3. Den Inhalt von `migrations/001_verified_contributions.sql` ausführen.
4. Die Projekt-URL und den öffentlichen Anon-Key für die spätere Website-Konfiguration bereithalten.

## Sicherheitsregeln
- Der öffentliche Anon-Key ist kein Geheimnis, aber die Datenbank wird durch RLS und die eingeschränkte RPC-Funktion geschützt.
- Den Service-Role-Key niemals in HTML, CSS, JavaScript oder ein öffentliches GitHub-Repository eintragen.
- Beiträge dürfen später ausschließlich durch eine serverseitige Funktion nach erfolgreicher PayPal-Prüfung eingetragen werden.
- Die Website darf niemals einen vom Browser übermittelten Betrag einfach als bezahlt verbuchen.

## Status
Das SQL-Grundgerüst liegt unter `migrations/001_verified_contributions.sql`.
Es ist noch kein Supabase-Projekt verbunden und es werden noch keine echten Zahlungen angenommen.
