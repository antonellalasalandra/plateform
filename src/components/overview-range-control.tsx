"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/segmented-control";

export function OverviewRangeControl() {
  const [range, setRange] = useState("30");

  return (
    <div className="space-y-2">
      <SegmentedControl
        value={range}
        onChange={setRange}
        options={[
          { label: "Oggi", value: "today" },
          { label: "7 giorni", value: "7" },
          { label: "30 giorni", value: "30" },
          { label: "90 giorni", value: "90" }
        ]}
      />
      <p className="text-right text-xs font-bold text-muted">Periodo attivo: {range === "today" ? "oggi" : `${range} giorni`}</p>
    </div>
  );
}
