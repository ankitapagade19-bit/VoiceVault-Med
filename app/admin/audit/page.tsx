export default function AuditPage() {
  const auditTrail = [
    {
      recordId: "#R-3821",
      version: "v4",
      hash: "a4f8...3d1e",
      action: "Correction Approved",
      timestamp: "2026-08-04 09:23",
    },
    {
      recordId: "#R-3821",
      version: "v3",
      hash: "b9e2...7f4a",
      action: "Voice Pinning",
      timestamp: "2026-08-03 16:10",
    },
    {
      recordId: "#R-2740",
      version: "v2",
      hash: "c81d...9b2f",
      action: "Staff Update",
      timestamp: "2026-08-02 11:45",
    },
    {
      recordId: "#R-2740",
      version: "v1",
      hash: "e3f0...6a8c",
      action: "Initial Record",
      timestamp: "2026-07-30 08:12",
    },
  ];

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">
        Audit · Immutable Chain
      </h1>

      <p className="mt-2 text-gray-600">
        View all record versions and verify the integrity of every medical
        record stored in VoiceVault.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-gray-500">Total Versions</h2>
          <p className="text-3xl font-bold mt-2">1,247</p>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-gray-500">Unique Records</h2>
          <p className="text-3xl font-bold mt-2">384</p>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-gray-500">Chain Integrity</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">100%</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-left">Record</th>
              <th className="p-4 text-left">Version</th>
              <th className="p-4 text-left">Hash</th>
              <th className="p-4 text-left">Action</th>
              <th className="p-4 text-left">Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {auditTrail.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="p-4">{item.recordId}</td>
                <td className="p-4">{item.version}</td>
                <td className="p-4 font-mono text-sm">{item.hash}</td>
                <td className="p-4">{item.action}</td>
                <td className="p-4">{item.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold">Immutable History</h3>
          <p className="text-sm text-gray-600 mt-2">
            Records are never overwritten. Every change creates a new version.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold">SHA-256 Verification</h3>
          <p className="text-sm text-gray-600 mt-2">
            Every version is cryptographically linked with its predecessor.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold">IPFS Storage</h3>
          <p className="text-sm text-gray-600 mt-2">
            Voice consultations are securely pinned using immutable content IDs.
          </p>
        </div>
      </div>
    </main>
  );
}