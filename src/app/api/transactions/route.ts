import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, createTransaction, getPeople } from '@/lib/db';
import { validateTransaction } from '@/lib/accounting/engine';
import { rupeesToPaise } from '@/lib/accounting/currency';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const personId = searchParams.get('personId') || undefined;
    const type = searchParams.get('type') || undefined;
    const category = searchParams.get('category') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = (searchParams.get('search') || '').toLowerCase().trim();

    let list = await getTransactions({
      personId,
      type,
      category,
      startDate,
      endDate,
    });

    if (search) {
      const people = await getPeople(true);
      const personMap = new Map(people.map((p) => [p.id, p.name.toLowerCase()]));

      list = list.filter((tx) => {
        const descMatch = tx.description.toLowerCase().includes(search);
        const catMatch = tx.category.toLowerCase().includes(search);
        const notesMatch = tx.notes?.toLowerCase().includes(search);
        const personName = personMap.get(tx.personId) || '';
        const personMatch = personName.includes(search);
        return descMatch || catMatch || notesMatch || personMatch;
      });
    }

    return NextResponse.json({ transactions: list });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Parse amount to integer paise
    let amountPaise = body.amountPaise;
    if (amountPaise === undefined && body.amountRupees !== undefined) {
      amountPaise = rupeesToPaise(body.amountRupees);
    }

    const txPayload = {
      ownerId: 'default-owner',
      personId: body.personId,
      type: body.type,
      amountPaise: Math.round(Number(amountPaise || 0)),
      transactionDate: body.transactionDate || new Date().toISOString().split('T')[0],
      description: body.description?.trim(),
      category: body.category || 'General',
      notes: body.notes?.trim(),
      expenseTreatment: body.expenseTreatment,
      sharedSplit: body.sharedSplit,
      repaymentDirection: body.repaymentDirection,
      adjustmentDirection: body.adjustmentDirection,
      isShared: body.isShared !== undefined ? Boolean(body.isShared) : true,
    };

    const validation = validateTransaction(txPayload);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const created = await createTransaction(txPayload);
    return NextResponse.json({ transaction: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
