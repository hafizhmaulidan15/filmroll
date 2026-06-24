"use client";

import { useEffect } from "react";
import { useVisitorStore } from "@/stores";

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const { setVisitor, setLoading } = useVisitorStore();

  useEffect(() => {
    const initVisitor = async () => {
      let token = localStorage.getItem("visitorToken");

      if (!token) {
        try {
          const res = await fetch("/api/v1/visitor", { method: "POST" });
          const data = await res.json();
          if (data.success) {
            token = data.data.visitorToken as string;
            localStorage.setItem("visitorToken", token);
            setVisitor(data.data);
          }
        } catch {
          setLoading(false);
        }
      } else {
        try {
          const res = await fetch("/api/v1/visitor", {
            headers: { "x-visitor-token": token },
          });
          const data = await res.json();
          if (data.success) {
            setVisitor({ id: data.data.id, visitorToken: token, createdAt: data.data.createdAt });
          }
        } catch {
          setLoading(false);
        }
      }
    };

    initVisitor();
  }, [setVisitor, setLoading]);

  return <>{children}</>;
}
