/**
 * Vercel Serverless Function — Paystack transaction verification.
 *
 * This is the ONLY place your Paystack SECRET key should ever be used.
 * It never runs in the browser — Vercel executes this on their servers.
 *
 * Setup:
 *   1. In your Vercel project dashboard, go to Settings > Environment Variables.
 *   2. Add a variable named PAYSTACK_SECRET_KEY with your live secret key as the value.
 *   3. Redeploy (Vercel needs a redeploy to pick up new env vars).
 *
 * This file must live at /api/verify-payment.js at the root of your project
 * (alongside pricing.html, home.html, etc.) — Vercel auto-detects anything
 * in /api as a serverless function, no extra config needed.
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  const { reference } = req.query;

  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ status: false, message: 'Missing transaction reference' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error('PAYSTACK_SECRET_KEY is not set in environment variables.');
    return res.status(500).json({ status: false, message: 'Server is not configured for payments yet.' });
  }

  try {
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = await paystackResponse.json();

    // Pass Paystack's own status/data straight through — the front end
    // checks data.data.status === 'success' before treating this as paid.
    return res.status(paystackResponse.status).json(data);
  } catch (error) {
    console.error('Paystack verification request failed:', error);
    return res.status(502).json({ status: false, message: 'Could not reach Paystack to verify this payment.' });
  }
}