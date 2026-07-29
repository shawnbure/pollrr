"use client";

import { useState } from "react";

export default function PrivacyClient() {
  const [cleared, setCleared] = useState(false);

  const clearDeviceData = () => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("pollrr:")) localStorage.removeItem(key);
    }
    setCleared(true);
  };

  return (
    <button className="legal-action" onClick={clearDeviceData}>
      {cleared ? "Device data cleared" : "Clear Pollrr data from this device"}
    </button>
  );
}
