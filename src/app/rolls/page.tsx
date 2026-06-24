"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { RollType } from "@/types";

export default function RollsPage() {
  const [rolls, setRolls] = useState<RollType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("visitorToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch("/api/v1/rolls", {
      headers: { "x-visitor-token": token },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setRolls(res.data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading rolls...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-6 text-xl font-light">My Rolls</h1>

      {rolls.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="mb-3 text-4xl text-muted-foreground">▤</div>
          <p className="text-sm text-muted-foreground">
            No rolls yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Start capturing to create your first roll.
          </p>
          <Link
            href="/camera"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-xs font-medium text-primary-foreground"
          >
            Start Capturing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rolls.map((roll) => (
            <Link
              key={roll.id}
              href={`/rolls/${roll.id}`}
              className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">
                    {roll.title || "Untitled Roll"}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {roll.filmStock?.name ?? "Unknown Film"} · {roll.capturedCount ?? 0} photos
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    roll.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : roll.status === "FINISHED"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {roll.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
