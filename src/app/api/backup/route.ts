import { NextRequest, NextResponse } from 'next/server';
import { exportAllData, importData } from '@/lib/db';

export async function GET() {
  try {
    const backup = await exportAllData();
    return NextResponse.json(backup);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to export backup data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await importData(body);
    return NextResponse.json({
      success: true,
      message: `Restored ${result.peopleCount} people and ${result.transactionCount} transactions successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to restore backup' },
      { status: 400 }
    );
  }
}
