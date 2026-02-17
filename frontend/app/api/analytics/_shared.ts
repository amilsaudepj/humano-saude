import { NextResponse } from 'next/server';
import { getGA4AvailabilityDiagnostics } from '@/lib/google-analytics';

export async function getGA4UnavailableResponse() {
  const diagnostics = await getGA4AvailabilityDiagnostics();
  if (diagnostics.available) return null;

  return NextResponse.json(
    {
      success: false,
      errorCode: 'GA4_NOT_CONFIGURED',
      error: 'GA4 não configurado',
      details: diagnostics,
      data: null,
    },
    { status: 200 }
  );
}
