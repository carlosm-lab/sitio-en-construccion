import { NextRequest, NextResponse } from 'next/server';
import { createSupportMessage, isValidCleanEmail } from '@/lib/data-store';
import { checkRateLimit, extractClientForensicInfo } from '@/lib/request-info';

export async function POST(req: NextRequest) {
  try {
    const forensic = extractClientForensicInfo(req);
    const rate = checkRateLimit(`contact:${forensic.ipAddress}`, 5, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Has enviado demasiados mensajes recientemente. Intenta de nuevo en ${rate.retryAfterSeconds} segundos.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Solicitud inválida.' },
        { status: 400 }
      );
    }

    const { name, email, licenseCode, subject, message } = body as {
      name?: string;
      email?: string;
      licenseCode?: string;
      subject?: string;
      message?: string;
    };

    if (!email || !isValidCleanEmail(email)) {
      return NextResponse.json(
        { error: 'Introduce una dirección de correo electrónico válida.' },
        { status: 400 }
      );
    }

    const cleanMsg = typeof message === 'string' ? message.trim() : '';
    if (cleanMsg.length < 10 || cleanMsg.length > 4000) {
      return NextResponse.json(
        { error: 'El mensaje debe contener entre 10 y 4000 caracteres.' },
        { status: 400 }
      );
    }

    const created = await createSupportMessage({
      name: typeof name === 'string' ? name : null,
      email,
      subject: typeof subject === 'string' ? subject : 'Soporte de Licencia VIP',
      orderOrLicense: typeof licenseCode === 'string' ? licenseCode : null,
      message: cleanMsg,
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
    });

    return NextResponse.json({
      sent: true,
      ticketId: created.id,
      message:
        'Tu solicitud ha quedado registrada en nuestro sistema de soporte (soporte@artedigital.click). Tiempo de respuesta habitual: menos de 24 horas hábiles.',
    });
  } catch (error) {
    console.error('Error en POST /api/contact:', error);
    return NextResponse.json(
      { error: 'No se pudo registrar tu mensaje en este momento. Intenta nuevamente.' },
      { status: 500 }
    );
  }
}
