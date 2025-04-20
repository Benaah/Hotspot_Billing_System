import React, { useEffect, useState } from 'react';

interface HotspotDevice {
  id: string;
  name: string;
  ip_address: string;
  type: string;
  status: string;
}

const AdminHotspotDevices: React.FC = () => {
  const [devices, setDevices] = useState<HotspotDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newDevice, setNewDevice] = useState({
    name: '',
    ip_address: '',
    type: '',
    status: 'offline',
  });

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/hotspot-devices');
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      setDevices(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewDevice({ ...newDevice, [e.target.name]: e.target.value });
  };

  const addDevice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/hotspot-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice),
      });
      if (!response.ok) throw new Error('Failed to add device');
      await fetchDevices();
      setNewDevice({ name: '', ip_address: '', type: '', status: 'offline' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDevice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/hotspot-devices/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete device');
      await fetchDevices();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const discoverDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/hotspot-devices/discover', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to discover devices');
      await fetchDevices();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Hotspot Devices</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="mb-4">
        <button
          onClick={discoverDevices}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={isLoading}
        >
          Discover Devices
        </button>
      </div>
      <div className="mb-6 border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Add New Device</h2>
        <input
          type="text"
          name="name"
          placeholder="Device Name"
          value={newDevice.name}
          onChange={handleInputChange}
          className="border p-2 rounded mr-2"
        />
        <input
          type="text"
          name="ip_address"
          placeholder="IP Address"
          value={newDevice.ip_address}
          onChange={handleInputChange}
          className="border p-2 rounded mr-2"
        />
        <input
          type="text"
          name="type"
          placeholder="Device Type (e.g., TP-Link)"
          value={newDevice.type}
          onChange={handleInputChange}
          className="border p-2 rounded mr-2"
        />
        <select
          name="status"
          value={newDevice.status}
          onChange={handleInputChange}
          className="border p-2 rounded mr-2"
        >
          <option value="offline">Offline</option>
          <option value="online">Online</option>
        </select>
        <button
          onClick={addDevice}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={isLoading}
        >
          Add Device
        </button>
      </div>
      {isLoading ? (
        <div>Loading devices...</div>
      ) : (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">IP Address</th>
              <th className="border border-gray-300 p-2">Type</th>
              <th className="border border-gray-300 p-2">Status</th>
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td className="border border-gray-300 p-2">{device.name}</td>
                <td className="border border-gray-300 p-2">{device.ip_address}</td>
                <td className="border border-gray-300 p-2">{device.type}</td>
                <td className="border border-gray-300 p-2">{device.status}</td>
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => deleteDevice(device.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-4">
                  No devices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminHotspotDevices;
