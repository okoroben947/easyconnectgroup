export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ status: false, message: 'Server secret key not configured.' });
  }

  try {
    // Fetch customers and transactions concurrently from Paystack API
    const [customerRes, transactionRes] = await Promise.all([
      fetch('https://api.paystack.co/customer', {
        headers: { Authorization: `Bearer ${secretKey}` }
      }),
      fetch('https://api.paystack.co/transaction?perPage=50', {
        headers: { Authorization: `Bearer ${secretKey}` }
      })
    ]);

    const customersData = await customerRes.json();
    const transactionsData = await transactionRes.json();

    return res.status(200).json({
      status: true,
      customers: customersData.data || [],
      transactions: transactionsData.data || []
    });
  } catch (error) {
    console.error('Failed to fetch CRM data from Paystack:', error);
    return res.status(502).json({ status: false, message: 'Could not connect to Paystack API.' });
  }
}