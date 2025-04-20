import express from 'express';
import db from '../../db.js';
import auth from '../../middleware/auth.js';
import admin from '../../middleware/admin.js';
import netSnmp from 'net-snmp';
import cron from 'node-cron';

const router = express.Router();

// Protect all routes
router.use(auth, admin);

// SNMP Configuration
const snmpConfig = {
  version: netSnmp.Session.SNMP_VERSION_3,
  host: 'localhost', // Replace with your target device IP or SNMP server
  port: 161,
  authProtocol: netSnmp.AUTH_MD5,
  privProtocol: netSnmp.PRIV_DES,
  username: 'admin', // SNMPv3 username
  authPassphrase: 'admin123', // Authentication password
  privPassphrase: 'admin123', // Encryption password
};

// Create SNMP session
const session = netSnmp.createSession(snmpConfig);

// Function to scan network devices using SNMPv3
const scanNetwork = async () => {
  try {
    const ipRangeStart = 2; // Start of the IP range to scan
    const ipRangeEnd = 254; // End of the IP range to scan

    const onlineDevices = [];

    for (let i = ipRangeStart; i <= ipRangeEnd; i++) {
      const ip = `192.168.1.${i}`;
      try {
        // Query the system name OID (1.3.6.1.2.1.1.5.0) to check if the device is reachable
        session.host = ip; // Set the target IP for this session
        session.get('1.3.6.1.2.1.1.5.0', (error, varbinds) => {
          if (error) {
            console.error(`Error scanning ${ip}:`, error);
            return;
          }
          for (const varbind of varbinds) {
            if (netSnmp.isVarbindError(varbind)) {
              console.error(`Error in varbind: ${netSnmp.varbindError(varbind)}`);
            } else {
              onlineDevices.push({ ip, name: varbind.value });
              // Check if the device exists in the database
              db.query('SELECT * FROM hotspot_devices WHERE ip_address = $1', [ip], (err, result) => {
                if (err) {
                  console.error('Database query error:', err);
                  return;
                }
                if (result.rows.length === 0) {
                  // Insert new device
                  db.query(
                    `INSERT INTO hotspot_devices (name, ip_address, type, status, created_at)
                     VALUES ($1, $2, $3, $4, NOW())`,
                    [varbind.value, ip, 'Discovered', 'online'],
                    (err) => {
                      if (err) console.error('Insert error:', err);
                    }
                  );
                } else {
                  // Update existing device status
                  db.query(
                    `UPDATE hotspot_devices SET status = 'online', updated_at = NOW()
                     WHERE ip_address = $1`,
                    [ip],
                    (err) => {
                      if (err) console.error('Update error:', err);
                    }
                  );
                }
              });
            }
          }
        });
      } catch (error) {
        console.error(`Error scanning ${ip}:`, error);
      }
    }

    // After scanning, mark devices not found as offline
    setTimeout(() => {
      db.query(
        `UPDATE hotspot_devices
         SET status = 'offline', updated_at = NOW()
         WHERE status = 'online' AND ip_address LIKE '192.168.1.%'`,
        (err) => {
          if (err) console.error('Offline update error:', err);
        }
      );
    }, 5000); // Adjust timeout based on your network size

  } catch (error) {
    console.error('Network scan error:', error);
  }
};

// Schedule network scan every 15 minutes
cron.schedule('*/15 * * * *', () => {
  scanNetwork();
  console.log('Network scan scheduled');
});

// Get all hotspot devices (access points and routerboards)
router.get('/', async (req, res) => {
  try {
    db.query('SELECT * FROM hotspot_devices ORDER BY name', (err, result) => {
      if (err) {
        console.error('Get hotspot devices error:', err);
        return res.status(500).json({ message: 'Server error fetching hotspot devices' });
      }
      res.json(result.rows);
    });
  } catch (error) {
    console.error('Get hotspot devices error:', error);
    res.status(500).json({ message: 'Server error fetching hotspot devices' });
  }
});

// Create new hotspot device
router.post('/', async (req, res) => {
  try {
    const { name, ip_address, type, status } = req.body;
    db.query(
      `INSERT INTO hotspot_devices (name, ip_address, type, status, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [name, ip_address, type, status || 'offline'],
      (err, result) => {
        if (err) {
          console.error('Create hotspot device error:', err);
          return res.status(500).json({ message: 'Server error creating hotspot device' });
        }
        res.status(201).json(result.rows[0]);
      }
    );
  } catch (error) {
    console.error('Create hotspot device error:', error);
    res.status(500).json({ message: 'Server error creating hotspot device' });
  }
});

// Update hotspot device
router.put('/:id', async (req, res) => {
  try {
    const { name, ip_address, type, status } = req.body;
    db.query(
      `UPDATE hotspot_devices
       SET name = COALESCE($1, name),
           ip_address = COALESCE($2, ip_address),
           type = COALESCE($3, type),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, ip_address, type, status, req.params.id],
      (err, result) => {
        if (err) {
          console.error('Update hotspot device error:', err);
          return res.status(500).json({ message: 'Server error updating hotspot device' });
        }
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Hotspot device not found' });
        }
        res.json(result.rows[0]);
      }
    );
  } catch (error) {
    console.error('Update hotspot device error:', error);
    res.status(500).json({ message: 'Server error updating hotspot device' });
  }
});

// Delete hotspot device
router.delete('/:id', async (req, res) => {
  try {
    db.query(
      'DELETE FROM hotspot_devices WHERE id = $1 RETURNING id',
      [req.params.id],
      (err, result) => {
        if (err) {
          console.error('Delete hotspot device error:', err);
          return res.status(500).json({ message: 'Server error deleting hotspot device' });
        }
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Hotspot device not found' });
        }
        res.json({ message: 'Hotspot device deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Delete hotspot device error:', error);
    res.status(500).json({ message: 'Server error deleting hotspot device' });
  }
});

// Discover devices automatically
router.post('/discover', async (req, res) => {
  try {
    await scanNetwork();
    db.query('SELECT * FROM hotspot_devices ORDER BY name', (err, result) => {
      if (err) {
        console.error('Device discovery error:', err);
        return res.status(500).json({ message: 'Server error during device discovery' });
      }
      res.json(result.rows);
    });
  } catch (error) {
    console.error('Device discovery error:', error);
    res.status(500).json({ message: 'Server error during device discovery' });
  }
});

export default router;