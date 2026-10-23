import { NextRequest, NextResponse } from 'next/server';
import { getPublicSharedLedger } from '@/lib/db';
import { getBalanceStatus } from '@/lib/accounting/engine';
import { formatINR } from '@/lib/accounting/currency';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await context.params;
    const ledger = await getPublicSharedLedger(shareToken);

    if (!ledger) {
      return NextResponse.json(
        { error: 'Shared ledger not found or access has been disabled by owner.' },
        { status: 404 }
      );
    }

    const { status, label } = getBalanceStatus(ledger.currentBalancePaise);

    return NextResponse.json({
      ledger: {
        ...ledger,
        status,
        statusLabel: label,
        formattedCurrentBalance: formatINR(ledger.currentBalancePaise, { absolute: true }),
        isSettled: ledger.currentBalancePaise === 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch public ledger' },
      { status: 500 }
    );
  }
}
