import { PageHeader } from "@/components/page-header";
import { ReservationWorkspace } from "@/components/reservation-workspace";
import { reservations } from "@/lib/demo-data";

export default function PrenotazioniPage() {
  return (
    <>
      <PageHeader title="Prenotazioni" description="Gestisci tutte le prenotazioni del locale." />
      <ReservationWorkspace initialReservations={reservations} />
    </>
  );
}
