import { NextResponse } from 'next/server';

import { listVisibleCarouselMedia } from '@/lib/media-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const items = await listVisibleCarouselMedia();
    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar midia.' },
      { status: 500 },
    );
  }
}
