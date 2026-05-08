import { BookingWidget } from "@/components/booking-widget";

export default async function BookingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  return <BookingWidget tenant={tenant} />;
}
