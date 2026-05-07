# Specifiche Implementate

Fonte: `Specifiche Tecniche Gestionale Pizzeria Multitenant.pdf`.

## MVP

- SaaS multi-tenant con database condiviso e `tenant_id` sui record operativi.
- CRM gestionale con dashboard, prenotazioni, tavoli, walk-in, impostazioni e statistiche base.
- Backend centrale come single source of truth.
- Motore disponibilita lato backend.
- Protezione anti-overbooking con transazione e lock Postgres.
- Widget pubblico collegato alle API.
- Predisposizione realtime con SSE.

## Priorita

1. Database multi-tenant corretto.
2. Availability engine.
3. Anti-overbooking.
4. Prenotazioni manuali e da sito.
5. Walk-in.
6. Disponibilita live.
7. Dashboard e statistiche operative.

## Rimandati

Fatturato, personale, magazzino e menu sono impostati come schermate coerenti con la UI, ma non sono ancora il cuore logico del prodotto. Le specifiche stesse indicano di non partire da quei moduli come priorita commerciale.
