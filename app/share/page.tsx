import type { Metadata } from "next";
import ShareClient from "./ShareClient";

export const metadata: Metadata = {
  title: "شارك",
  description: "شارك رابط التطبيق مع زملائك عبر QR أو واتساب.",
};

export default function SharePage() {
  return <ShareClient />;
}
