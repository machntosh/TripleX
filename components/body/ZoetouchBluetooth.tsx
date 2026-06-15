"use client";

import { useState, useCallback } from "react";
import { Bluetooth, BluetoothOff, Loader2 } from "lucide-react";

interface BluetoothReading {
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  waterPercent?: number;
  boneMass?: number;
  visceralFat?: number;
  bmi?: number;
  impedance?: number;
}

interface Props {
  onReading: (data: BluetoothReading) => void;
}

// Standard BLE Body Composition Service (0x181B)
// Also covers common Chinese OEM scale protocols (Zoetouch, Yunmai variants)
const BODY_COMP_SERVICE = 0x181b;
const BODY_COMP_CHAR = 0x2a9c;

// Zoetouch / common OEM fallback service
const OEM_SERVICE = "0000fff0-0000-1000-8000-00805f9b34fb";
const OEM_NOTIFY_CHAR = "0000fff4-0000-1000-8000-00805f9b34fb";
const OEM_WRITE_CHAR = "0000fff3-0000-1000-8000-00805f9b34fb";

function parseStandardBodyComp(value: DataView): BluetoothReading | null {
  try {
    const flags = value.getUint16(0, true);
    const units = flags & 0x01 ? "lbs" : "kg";
    let offset = 2;

    const rawWeight = value.getUint16(offset, true);
    const weight = units === "kg" ? rawWeight * 0.005 : rawWeight * 0.01 * 0.453592;
    offset += 2;

    const result: BluetoothReading = { weight: Math.round(weight * 10) / 10 };

    if (flags & 0x02) offset += 2; // timestamp present
    if (flags & 0x04) offset += 1; // user ID present

    if (flags & 0x08 && offset + 2 <= value.byteLength) {
      result.bmi = value.getUint16(offset, true) * 0.01;
      offset += 2;
    }
    if (flags & 0x10 && offset + 2 <= value.byteLength) {
      result.bodyFat = value.getUint16(offset, true) * 0.1;
      offset += 2;
    }
    if (flags & 0x20 && offset + 2 <= value.byteLength) {
      result.muscleMass = (value.getUint16(offset, true) * 0.005);
      offset += 2;
    }
    if (flags & 0x40 && offset + 2 <= value.byteLength) {
      offset += 2; // fat free body mass
    }
    if (flags & 0x80 && offset + 2 <= value.byteLength) {
      result.boneMass = value.getUint16(offset, true) * 0.005;
      offset += 2;
    }
    if (flags & 0x100 && offset + 2 <= value.byteLength) {
      result.waterPercent = value.getUint16(offset, true) * 0.1;
      offset += 2;
    }

    return result;
  } catch {
    return null;
  }
}

function parseOEMPacket(data: Uint8Array): BluetoothReading | null {
  // Common Zoetouch/RENPHO/Yunmai packet format
  // Bytes: [header][control][weight_h][weight_l][impedance_h][impedance_l][...]
  try {
    if (data.length < 10) return null;

    // Weight at bytes 3-4 (unit: 0.1 kg or 0.01 lbs depending on byte 1)
    const isKg = data[1] === 0x01 || data[1] === 0x00;
    const rawWeight = (data[3] << 8) | data[4];
    const weight = isKg ? rawWeight * 0.1 : rawWeight * 0.1 * 0.453592;

    const result: BluetoothReading = { weight: Math.round(weight * 10) / 10 };

    if (data.length >= 12) {
      const rawImpedance = (data[9] << 8) | data[10];
      if (rawImpedance > 0) result.impedance = rawImpedance;
    }

    return result;
  } catch {
    return null;
  }
}

type Status = "idle" | "scanning" | "connected" | "error";

export default function ZoetouchBluetooth({ onReading }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const isSupported =
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  const connect = useCallback(async () => {
    if (!isSupported) {
      setStatus("error");
      setMessage("Bluetooth non supporté sur ce navigateur (Chrome requis).");
      return;
    }

    setStatus("scanning");
    setMessage("Recherche de la balance…");

    try {
      // Try standard body composition service first, then OEM fallback
      let device: BluetoothDevice | null = null;
      try {
        device = await (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth.requestDevice({
          filters: [
            { services: [BODY_COMP_SERVICE] },
            { namePrefix: "Zoe" },
            { namePrefix: "Scale" },
            { namePrefix: "BCS" },
          ],
          optionalServices: [BODY_COMP_SERVICE, OEM_SERVICE],
        });
      } catch {
        // Retry with accept all + known services
        device = await (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [BODY_COMP_SERVICE, OEM_SERVICE],
        });
      }

      if (!device) throw new Error("Aucun appareil sélectionné");

      setMessage(`Connexion à ${device.name || "la balance"}…`);
      const server = await device.gatt!.connect();
      setStatus("connected");

      let handled = false;

      // Try standard BLE body composition
      try {
        const service = await server.getPrimaryService(BODY_COMP_SERVICE);
        const char = await service.getCharacteristic(BODY_COMP_CHAR);

        char.addEventListener("characteristicvaluechanged", (event) => {
          const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
          const reading = parseStandardBodyComp(value);
          if (reading && reading.weight > 10) {
            onReading(reading);
            setMessage(`Mesure reçue : ${reading.weight} kg`);
            handled = true;
          }
        });

        await char.startNotifications();
        setMessage("Balance connectée — montez dessus pour mesurer…");
      } catch {
        // Standard service not found
      }

      // Try OEM protocol if standard didn't work
      if (!handled) {
        try {
          const service = await server.getPrimaryService(OEM_SERVICE);
          const notifyChar = await service.getCharacteristic(OEM_NOTIFY_CHAR);

          notifyChar.addEventListener("characteristicvaluechanged", (event) => {
            const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
            const bytes = new Uint8Array(value.buffer);
            const reading = parseOEMPacket(bytes);
            if (reading && reading.weight > 10) {
              onReading(reading);
              setMessage(`Mesure reçue : ${reading.weight} kg`);
            }
          });

          await notifyChar.startNotifications();

          // Send activation command (common for Chinese OEM scales)
          try {
            const writeChar = await service.getCharacteristic(OEM_WRITE_CHAR);
            await writeChar.writeValue(new Uint8Array([0xfd, 0xa2, 0x01]));
          } catch {
            // Write not required on all models
          }

          setMessage("Balance connectée — montez dessus pour mesurer…");
        } catch {
          if (!handled) {
            setStatus("error");
            setMessage("Protocole non reconnu. Contactez le support pour votre modèle Zoetouch.");
          }
        }
      }

      device.addEventListener("gattserverdisconnected", () => {
        setStatus("idle");
        setMessage("Balance déconnectée.");
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotFoundError") {
        setStatus("idle");
        setMessage("");
      } else {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Erreur Bluetooth");
      }
    }
  }, [isSupported, onReading]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={connect}
        disabled={status === "scanning" || status === "connected"}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          status === "connected"
            ? "bg-green-500 text-white"
            : status === "error"
            ? "bg-red-50 text-red-600 border border-red-200"
            : "bg-blue-600 text-white active:bg-blue-700"
        } disabled:opacity-60`}
      >
        {status === "scanning" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Bluetooth size={16} />
        )}
        {status === "idle" && "Connecter la balance Zoetouch"}
        {status === "scanning" && "Recherche…"}
        {status === "connected" && "Balance connectée"}
        {status === "error" && "Réessayer"}
      </button>

      {message && (
        <p
          className={`text-xs text-center px-2 ${
            status === "error" ? "text-red-500" : "text-slate-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
