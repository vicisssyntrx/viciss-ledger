import { NextResponse } from 'next/server';
import { getPeople, getTransactions } from '@/lib/db';
import { summarizeDashboard, summarizePerson } from '@/lib/accounting/engine';

export async function GET() {
  try {
    const [people, transactions] = await Promise.all([
      getPeople(false),
      getTransactions(),
    ]);

    const summary = summarizeDashboard(people, transactions);
    const peopleSummaries = people.map((p) => summarizePerson(p, transactions));
    const recentTransactions = transactions.slice(0, 10);

    return NextResponse.json({
      summary,
      peopleSummaries,
      recentTransactions,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
