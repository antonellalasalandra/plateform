import { PageHeader } from "@/components/page-header";
import { PersonaleWorkspace } from "@/components/personale-workspace";

export default function PersonalePage() {
  return (
    <>
      <PageHeader title="Personale" description="Gestisci dipendenti e turni di lavoro." />
      <PersonaleWorkspace />
    </>
  );
}
