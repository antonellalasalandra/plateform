# Plateform

Plateform e un gestionale SaaS multi-tenant per ristoranti e pizzerie. L'MVP mette al centro prenotazioni, tavoli, walk-in, disponibilita live e dashboard operativa.

## Stack

- Next.js + React + TypeScript per CRM, widget pubblico e API nello stesso progetto.
- Tailwind CSS con componenti locali ispirati a shadcn/ui per mantenere una UI sobria e veloce da evolvere.
- Prisma ORM + PostgreSQL per dati relazionali, transazioni e lock anti-overbooking.
- Server-Sent Events predisposto per realtime dashboard/widget.
- Vitest per testare il motore disponibilita in modo isolato.

## Moduli inclusi

- CRM con sidebar Plateform e stile coerente agli screenshot forniti.
- Panoramica con metriche, sala live, grafici e prossime prenotazioni.
- Prenotazioni con ricerca, filtri, creazione rapida e walk-in.
- API per availability, prenotazioni, walk-in, tavoli, dashboard e auth.
- Schema Prisma multi-tenant con `tenant_id` sulle tabelle operative.
- Availability engine con tavoli singoli, combinazioni, buffer, durata turno e blocchi manuali.
- Scheletri UI per Fatturato, Personale, Magazzino, Menu e Impostazioni.
- Widget pubblico demo in `/booking/plateform`.

## Avvio locale

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Apri `http://localhost:3000`.

Credenziali seed:

```text
admin@plateform.it
plateform-demo
```

## Endpoint principali

```text
POST /api/auth/login
GET  /api/auth/me
GET  /api/restaurants
GET  /api/restaurants/:restaurantId/tables
GET  /api/restaurants/:restaurantId/availability?date=2026-05-07&party_size=4
POST /api/restaurants/:restaurantId/reservations
POST /api/restaurants/:restaurantId/walkins
GET  /api/restaurants/:restaurantId/dashboard/overview
GET  /api/realtime
```

Per il seed demo, l'id ristorante e:

```text
restaurant_plateform_demo
```

## Scelte tecniche

Il frontend non decide la disponibilita: mostra gli slot e invia richieste. La logica finale vive nel backend, che ricalcola lo slot dentro una transazione e usa `pg_advisory_xact_lock` per ridurre il rischio di overbooking sullo stesso ristorante/data/orario.

I moduli non centrali indicati dagli screenshot sono presenti come superfici UI, ma il valore dell'MVP resta il ciclo:

```text
prenotazione -> assegnazione tavolo -> occupazione -> disponibilita aggiornata -> completamento
```
