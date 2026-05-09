import { NextResponse } from 'next/server';

import { listVisibleCarouselMedia } from '@/lib/media-service';

export async function GET() {
  try {
    const items = await listVisibleCarouselMedia();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar midia.' },
      { status: 500 },
    );
  }
}
