import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    return window.scanner?.onDetectionResult((result) => {
      console.log("[renderer] Detection result", JSON.stringify(result));
    });
  }, []);

  return <main className="min-h-screen bg-white" />;
}
