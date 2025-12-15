import { NextResponse } from 'next/server';
import { getObligationsForUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const obligations = await getObligationsForUser();
    return NextResponse.json(obligations);
  } catch (error) {
    console.error('Failed to fetch obligations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch obligations' },
      { status: 500 }
    );
  }
}
