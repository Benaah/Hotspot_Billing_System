import React, { useState, useEffect, useMemo } from 'react';
import LoadingRouter from '../components/LoadingRouter'; // Adjust import path as needed
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import * as pdfjs from 'pdfjs-dist';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).href;

// Import pdfjs worker for React-PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface InvoiceData {
  id: string;
  date: string;
  dueDate: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  from: {
    name: string;
    address: string;
    email: string;
    phone: string;
    taxId: string;
  };
  to: {
    name: string;
    address: string;
    phone: string;
    taxId: string;
  };
  items: {
    description: string;
    quantity: number;
    rate: number;
    taxRate: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
}

const Invoice: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [invoiceList, setInvoiceList] = useState<InvoiceData[]>([]);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // API configuration
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  const headers = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  }), []);

  // Fetch invoice data from PostgreSQL database
  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get list of all invoices for navigation
        const response = await axios.get(`${API_URL}/invoices`, { headers });
        setInvoiceList(response.data);

        // Get specific invoice details
        if (invoiceList.length > 0) {
          const firstInvoice = invoiceList[0];
          setCurrentInvoiceId(firstInvoice.id);
          setInvoiceData(firstInvoice);
        }
      } catch (err) {
        setError('Failed to load invoice data. Please try again later.');
        console.error('Error fetching invoice data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [API_URL, headers, invoiceList]);

  // Load specific invoice when ID changes
  useEffect(() => {
    if (!currentInvoiceId) return;

    const loadSpecificInvoice = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/invoices/${currentInvoiceId}`,
          { headers }
        );
        setInvoiceData(response.data);
      } catch (err) {
        setError('Error loading invoice details');
        console.error(err);
      }
    };

    loadSpecificInvoice();
  }, [currentInvoiceId, API_URL, headers]);

  const handleDownloadPdf = () => {
    setShowPdf(true);
    // PDF download logic using react-pdf
  };

  const handlePrintPreview = () => {
    window.print();
  };

  const renderPdf = () => {
    if (!invoiceData) return null;
    
    const styles = StyleSheet.create({
      page: {
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        fontFamily: 'Arial, sans-serif',
      },
      header: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
      },
      section: {
        marginVertical: 15,
      },
      table: {
        width: '100%',
        borderStyle: 'solid',
      },
      tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme === 'dark' ? '#333' : '#eee',
      },
      tableCell: {
        flex: 1,
        padding: 8,
      },
      total: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'right',
        marginTop: 20,
      },
    });

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Invoice #{invoiceData.id}</Text>
          
          <View style={styles.section}>
            <Text>From:</Text>
            <Text>{invoiceData.from.name}</Text>
            <Text>{invoiceData.from.address}</Text>
            <Text>{invoiceData.from.email}</Text>
            <Text>{invoiceData.from.phone}</Text>
            <Text>Tax ID: {invoiceData.from.taxId}</Text>
          </View>
          
          <View style={styles.section}>
            <Text>To:</Text>
            <Text>{invoiceData.to.name}</Text>
            <Text>{invoiceData.to.address}</Text>
            <Text>{invoiceData.to.phone}</Text>
            <Text>Tax ID: {invoiceData.to.taxId}</Text>
          </View>
          
          <View style={styles.section}>
            <Text>Date: {invoiceData.date}</Text>
            <Text>Due Date: {invoiceData.dueDate}</Text>
            <Text>Payment Status: {invoiceData.paymentStatus.toUpperCase()}</Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text>Description</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>Quantity</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>Rate</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>Tax Rate</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>Amount</Text>
              </View>
            </View>
            
            {invoiceData.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text>{item.description}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text>{item.quantity}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text>${item.rate.toFixed(2)}</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text>{item.taxRate}%</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text>${(item.quantity * item.rate * (1 + item.taxRate / 100)).toFixed(2)}</Text>
                </View>
              </View>
            ))}
            
            <View style={styles.tableRow}>
              <View style={styles.tableCell} />
              <View style={styles.tableCell} />
              <View style={styles.tableCell}>
                <Text>Subtotal:</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>${invoiceData.subtotal.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell} />
              <View style={styles.tableCell} />
              <View style={styles.tableCell}>
                <Text>Tax:</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>${invoiceData.tax.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell} />
              <View style={styles.tableCell} />
              <View style={styles.tableCell}>
                <Text>Total:</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>${invoiceData.total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </Page>
      </Document>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 rounded shadow">
      {loading ? (
        <LoadingRouter size="large" />
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 border-red-400 text-red-700 dark:text-red-300 p-4 rounded">
          <strong>Error:</strong> {error}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>
            
            {/* Invoice history navigation */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">Recent Invoices:</h3>
              <div className="flex overflow-x-auto space-x-2">
                {invoiceList.map((invoice) => (
                  <button
                    key={invoice.id}
                    onClick={() => setCurrentInvoiceId(invoice.id)}
                    className={`px-4 py-2 rounded ${
                      invoice.id === currentInvoiceId
                        ? 'bg-blue-600 dark:bg-blue-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {invoice.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold mb-2">From:</h3>
                  <p>{invoiceData?.from.name}</p>
                  <p>{invoiceData?.from.address}</p>
                  <p>{invoiceData?.from.email}</p>
                  <p>{invoiceData?.from.phone}</p>
                  <p>Tax ID: {invoiceData?.from.taxId}</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">To:</h3>
                  <p>{invoiceData?.to.name}</p>
                  <p>{invoiceData?.to.address}</p>
                  <p>{invoiceData?.to.phone}</p>
                  <p>Tax ID: {invoiceData?.to.taxId}</p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-bold mb-2">Invoice Information:</h3>
                <div className="flex items-center">
                  <p className="mr-4">Invoice ID:</p>
                  <p>{invoiceData?.id}</p>
                  <CopyToClipboard
                    text={invoiceData?.id || ''}
                    onCopy={() => setCopied(true)}
                  >
                    <button
                      className="bg-gray-200 dark:bg-gray-700 rounded p-1 ml-2"
                      onClick={() => setTimeout(() => setCopied(false), 2000)}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </CopyToClipboard>
                </div>
                <p>Issue Date: {invoiceData?.date}</p>
                <p>Due Date: {invoiceData?.dueDate}</p>
                <p>
                  Payment Status:{' '}
                  <span
                    className={`font-bold ${
                      invoiceData?.paymentStatus === 'paid'
                        ? 'text-green-600'
                        : invoiceData?.paymentStatus === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {invoiceData?.paymentStatus.toUpperCase()}
                  </span>
                </p>
              </div>
              <div className="mt-6">
                <h3 className="font-bold mb-2">Items:</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="p-2 border">Description</th>
                      <th className="p-2 border text-center">Quantity</th>
                      <th className="p-2 border text-right">Rate</th>
                      <th className="p-2 border text-right">Tax Rate</th>
                      <th className="p-2 border text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData?.items.map((item, index) => (
                      <tr key={index}>
                        <td className="p-2 border">{item.description}</td>
                        <td className="p-2 border text-center">{item.quantity}</td>
                        <td className="p-2 border text-right">${item.rate.toFixed(2)}</td>
                        <td className="p-2 border text-right">{item.taxRate}%</td>
                        <td className="p-2 border text-right">
                          ${(item.quantity * item.rate * (1 + item.taxRate / 100)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="p-2 border text-right font-bold">
                        Subtotal:
                      </td>
                      <td className="p-2 border text-right font-bold">
                        ${invoiceData?.subtotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-2 border text-right font-bold">
                        Tax:
                      </td>
                      <td className="p-2 border text-right font-bold">
                        ${invoiceData?.tax.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-2 border text-right font-bold">
                        Total:
                      </td>
                      <td className="p-2 border text-right font-bold">
                        ${invoiceData?.total.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleDownloadPdf}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Download PDF
              </button>
              <button
                onClick={handlePrintPreview}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Print Preview
              </button>
            </div>
          </div>
          
          {showPdf && renderPdf()}
        </>
      )}
    </div>
  );
};

export default Invoice;