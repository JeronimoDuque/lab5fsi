import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para procesar un pago.' }, { status: 401 });
    }

    const { amount, simulated, paypalOrderId, captureId, amountUsd } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'El monto a pagar debe ser mayor a 0.' }, { status: 400 });
    }

    if (simulated) {
      // Modo de prueba / simulación de PayPal
      const simulatedTransactionId = `PAYPAL-SIM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return NextResponse.json({
        success: true,
        message: 'Pago de prueba procesado exitosamente',
        transactionId: simulatedTransactionId,
        paymentMethod: 'paypal_simulated',
        status: 'COMPLETED',
        amount,
      });
    }

    if (!paypalOrderId || !captureId) {
      return NextResponse.json(
        { error: 'No se recibió la confirmación completa de PayPal.' },
        { status: 400 },
      );
    }

    const expectedUsd = (Number(amount) / 4000).toFixed(2);
    if (amountUsd && Number(amountUsd).toFixed(2) !== expectedUsd) {
      return NextResponse.json(
        { error: 'El monto capturado no coincide con el total del pedido.' },
        { status: 400 },
      );
    }

    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (clientSecret && !clientSecret.includes('placeholder')) {
      const baseUrl = 'https://api-m.sandbox.paypal.com';
      const credentials = Buffer.from(
        `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${clientSecret}`,
      ).toString('base64');

      const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenResponse.ok) {
        throw new Error('No fue posible autenticarse con PayPal.');
      }

      const tokenData = await tokenResponse.json();
      const orderResponse = await fetch(
        `${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        },
      );

      if (!orderResponse.ok) {
        throw new Error('No fue posible verificar la orden en PayPal.');
      }

      const verifiedOrder = await orderResponse.json();
      const capture = verifiedOrder.purchase_units?.[0]?.payments?.captures?.find(
        (item: { id: string }) => item.id === captureId,
      );
      const verifiedUsd = capture?.amount?.value;

      if (
        verifiedOrder.status !== 'COMPLETED' ||
        capture?.status !== 'COMPLETED' ||
        verifiedUsd !== expectedUsd
      ) {
        return NextResponse.json(
          { error: 'PayPal no confirmó una captura válida para este pedido.' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pago con PayPal procesado exitosamente',
      transactionId: paypalOrderId || `PAYPAL-SBX-${Date.now()}`,
      paymentMethod: 'paypal',
      status: 'COMPLETED',
      amount,
    });
  } catch (error: any) {
    console.error('[PayPal Payment API Error]:', error);
    return NextResponse.json(
      { error: 'Error procesando el pago con PayPal.' },
      { status: 500 }
    );
  }
}
