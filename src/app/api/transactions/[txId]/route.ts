import { NextRequest, NextResponse } from 'next/server';
import { getTransactionById, updateTransaction, deleteTransaction } from '@/lib/db';
import { validateTransaction } from '@/lib/accounting/engine';
import { rupeesToPaise } from '@/lib/accounting/currency';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ txId: string }> }
) {
  try {
    const { txId } = await context.params;
    const tx = await getTransactionById(txId);

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction: tx });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ txId: string }> }
) {
  try {
    const { txId } = await context.params;
    const existing = await getTransactionById(txId);
    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const body = await req.json();

    let amountPaise = body.amountPaise;
    if (amountPaise === undefined && body.amountRupees !== undefined) {
      amountPaise = rupeesToPaise(body.amountRupees);
    }

    const merged = {
      ...existing,
      ...body,
      ...(amountPaise !== undefined ? { amountPaise: Math.round(Number(amountPaise)) } : {}),
    };

    const validation = validateTransaction(merged);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updated = await updateTransaction(txId, merged);
    return NextResponse.json({ transaction: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ txId: string }> }
) {
  try {
    const { txId } = await context.params;
    await deleteTransaction(txId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
