"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodeGenerator() {
    const [sessionLink, setSessionLink] = useState(
        "https://example.com/session/1234"
    );

    return (
        <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Session QR Code</h2>
            <QRCodeSVG value={sessionLink} size={128} />
        </div>
    );
}
