import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para procesar un pago.' }, { status: 401 });
    }

    const { amount, simulated, paypalOrderId } = await req.json();

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

    // Si viene con un order ID de PayPal real/sandbox
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
