import { NextRequest, NextResponse } from 'next/server';
import { extractClientForensicInfo } from '@/lib/request-info';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.email || !body.message) {
    return NextResponse.json(
      { error: 'Por favor completa tu correo y mensaje.' },
      { status: 400 }
    );
  }

  const forensic = extractClientForensicInfo(req);
  console.info('[ArteDigital Contacto]', {
    email: body.email,
    subject: body.subject || 'Soporte General',
    licenseCode: body.licenseCode || null,
    ip: forensic.ipAddress,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    sent: true,
    message:
      'Tu consulta fue recibida por soporte@artedigital.click. Tiempo de respuesta habitual: menos de 24 horas hábiles.',
  });
}
