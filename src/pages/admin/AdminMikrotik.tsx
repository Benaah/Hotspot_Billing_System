import React, { useEffect, useState } from 'react';

interface MikrotikDevice {
  id: string;
  name: string;
  ip_address: string;
  status: string;
}

const AdminMikrotik: React.FC = () => {
  const [devices, setDevices] = useState<MikrotikDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/mikrotik_devices');
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();

      setDevices(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mikrotik Devices</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>Name</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.name}</td>
                <td>{device.ip_address}</td>
                <td>{device.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminMikrotik;
