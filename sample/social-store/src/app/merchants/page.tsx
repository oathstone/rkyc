"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MerchantRow } from "@/components/MerchantRow";

export default function MerchantsPage() {
  const merchants = useQuery(api.merchants.list);

  return (
    <div>
      <h1 className="font-black mb-6" style={{ fontSize: 24 }}>Merchants</h1>
      {merchants === undefined ? (
        <p className="text-muted text-sm">Loading...</p>
      ) : merchants.length === 0 ? (
        <p className="text-muted text-sm">
          No merchants yet.{" "}
          <a href="/seed" className="text-gold">Run the seed</a> to add demo data.
        </p>
      ) : (
        <div className="merchant-list">
          {merchants.map((m) => (
            <MerchantRow key={m._id} merchant={m} />
          ))}
        </div>
      )}
    </div>
  );
}
