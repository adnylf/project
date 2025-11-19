import { NextRequest, NextResponse } from 'next/server';
import transactionService from '@/services/transaction.service';
import crypto from 'crypto';

interface WebhookPayload {
  signature_key?: string;
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gateway = searchParams.get('gateway');

    if (!gateway || !['midtrans', 'xendit'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid gateway' }, { status: 400 });
    }

    const payload = (await request.json()) as WebhookPayload;

    const isValid = verifyWebhookSignature(gateway, request, payload);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const result = await transactionService.processWebhook(gateway, payload);

    if (result.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: result.message }, { status: 500 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function verifyWebhookSignature(
  gateway: string,
  request: NextRequest,
  payload: WebhookPayload
): boolean {
  try {
    if (gateway === 'midtrans') {
      const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
      const signatureKey = payload.signature_key;
      const orderId = payload.order_id;
      const statusCode = payload.status_code;
      const grossAmount = payload.gross_amount;

      if (!signatureKey || !orderId || !statusCode || !grossAmount) {
        return false;
      }

      const calculatedSignature = crypto
        .createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest('hex');

      return signatureKey === calculatedSignature;
    }

    if (gateway === 'xendit') {
      const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN || '';
      const receivedToken = request.headers.get('x-callback-token');

      return webhookToken === receivedToken;
    }

    return false;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
