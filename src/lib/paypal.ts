import { MEMBERSHIP_PRICE_USD, PAYPAL_ITEM_DESCRIPTION } from './constants';

type PayPalEnv = 'sandbox' | 'live';

function getPayPalBaseUrl(env: PayPalEnv): string {
  return env === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function getPreferredEnv(): PayPalEnv {
  return process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
}

export interface PayPalTokenResult {
  accessToken: string;
  baseUrl: string;
  env: PayPalEnv;
}

export async function getPayPalAccessToken(): Promise<PayPalTokenResult> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en las variables de entorno.'
    );
  }

  const primaryEnv = getPreferredEnv();
  const fallbackEnv: PayPalEnv = primaryEnv === 'sandbox' ? 'live' : 'sandbox';
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  for (const env of [primaryEnv, fallbackEnv]) {
    const baseUrl = getPayPalBaseUrl(env);
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
    });

    if (res.ok) {
      const data = (await res.json()) as { access_token: string };
      return {
        accessToken: data.access_token,
        baseUrl,
        env,
      };
    }
  }

  throw new Error(
    'No fue posible autenticar con PayPal REST API. Verifica PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET.'
  );
}

export interface CreatePayPalOrderResponse {
  id: string;
  status: string;
  env: PayPalEnv;
}

export async function createPayPalOrder(buyerEmail: string): Promise<CreatePayPalOrderResponse> {
  const { accessToken, baseUrl, env } = await getPayPalAccessToken();

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: PAYPAL_ITEM_DESCRIPTION,
        custom_id: buyerEmail.slice(0, 127),
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

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `PayPal create-order error (${res.status}): ${JSON.stringify(data)}`
    );
  }

  return {
    id: data.id,
    status: data.status,
    env,
  };
}

export interface CapturePayPalOrderResult {
  orderId: string;
  status: string;
  payerId: string | null;
  payerEmail: string | null;
  captureId: string | null;
  raw: Record<string, unknown>;
}

export async function capturePayPalOrder(
  orderId: string
): Promise<CapturePayPalOrderResult> {
  const { accessToken, baseUrl } = await getPayPalAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `PayPal capture-order error (${res.status}): ${JSON.stringify(data)}`
    );
  }

  const captureId =
    data?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

  return {
    orderId: data.id || orderId,
    status: data.status,
    payerId: data?.payer?.payer_id ?? null,
    payerEmail: data?.payer?.email_address ?? null,
    captureId,
    raw: data,
  };
}
