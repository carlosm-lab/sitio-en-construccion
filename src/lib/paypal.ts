import { MEMBERSHIP_PRICE_USD, PAYPAL_ITEM_DESCRIPTION } from './constants';

type PayPalEnv = 'sandbox' | 'live';

function getPayPalBaseUrl(env: PayPalEnv): string {
  return env === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function getConfiguredEnv(): PayPalEnv {
  return process.env.PAYPAL_MODE === 'sandbox' ? 'sandbox' : 'live';
}

export interface PayPalTokenResult {
  accessToken: string;
  baseUrl: string;
  env: PayPalEnv;
}

export async function getPayPalAccessToken(): Promise<PayPalTokenResult> {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Pasarela de pago no configurada en el servidor.');
  }

  const env = getConfiguredEnv();
  const baseUrl = getPayPalBaseUrl(env);
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`Error OAuth PayPal (${env} - ${res.status}):`, errText);
    throw new Error('No fue posible conectar con PayPal en este momento.');
  }

  const data = (await res.json()) as { access_token: string };
  return {
    accessToken: data.access_token,
    baseUrl,
    env,
  };
}

export interface CreatePayPalOrderResponse {
  id: string;
  status: string;
  env: PayPalEnv;
}

export async function createPayPalOrder(buyerEmail: string): Promise<CreatePayPalOrderResponse> {
  const { accessToken, baseUrl, env } = await getPayPalAccessToken();
  const normalizedEmail = buyerEmail.trim().toLowerCase().slice(0, 127);

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: PAYPAL_ITEM_DESCRIPTION,
        custom_id: normalizedEmail,
        amount: {
          currency_code: 'USD',
          value: MEMBERSHIP_PRICE_USD,
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: MEMBERSHIP_PRICE_USD,
            },
          },
        },
        items: [
          {
            name: 'Licencia Vitalicia ArteDigital.click',
            description: PAYPAL_ITEM_DESCRIPTION,
            quantity: '1',
            unit_amount: {
              currency_code: 'USD',
              value: MEMBERSHIP_PRICE_USD,
            },
            category: 'DIGITAL_GOODS',
          },
        ],
      },
    ],
    application_context: {
      brand_name: 'ArteDigital.click',
      locale: 'es-ES',
      landing_page: 'BILLING',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
    },
  };

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.id) {
    console.error(`PayPal create-order error (${res.status}):`, data);
    throw new Error('No se pudo inicializar la orden de pago en PayPal.');
  }

  return {
    id: String(data.id),
    status: String(data.status || 'CREATED'),
    env,
  };
}

export interface CapturePayPalOrderResult {
  orderId: string;
  status: string;
  captureStatus: string | null;
  captureAmount: string | null;
  captureCurrency: string | null;
  customId: string | null;
  payerId: string | null;
  payerEmail: string | null;
  captureId: string | null;
}

export async function capturePayPalOrder(
  orderId: string
): Promise<CapturePayPalOrderResult> {
  const { accessToken, baseUrl } = await getPayPalAccessToken();

  const res = await fetch(
    `${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      cache: 'no-store',
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`PayPal capture-order error (${res.status}):`, data);
    throw new Error('No se pudo confirmar la captura del pago con PayPal.');
  }

  const unit = data?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];

  return {
    orderId: String(data.id || orderId),
    status: String(data.status || ''),
    captureStatus: capture?.status ? String(capture.status) : null,
    captureAmount: capture?.amount?.value ? String(capture.amount.value) : null,
    captureCurrency: capture?.amount?.currency_code
      ? String(capture.amount.currency_code)
      : null,
    customId:
      (unit?.custom_id && String(unit.custom_id)) ||
      (capture?.custom_id && String(capture.custom_id)) ||
      null,
    payerId: data?.payer?.payer_id ? String(data.payer.payer_id) : null,
    payerEmail: data?.payer?.email_address ? String(data.payer.email_address) : null,
    captureId: capture?.id ? String(capture.id) : null,
  };
}
