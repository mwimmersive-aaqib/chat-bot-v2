import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brazil eVisa – Premium Application",
};

const BrazilEVisaApp = dynamic(() => import("./BrazilEVisaApp"), { ssr: false });

export default function Page() {
  return <BrazilEVisaApp />;
}
