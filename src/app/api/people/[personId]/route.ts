import { NextRequest, NextResponse } from 'next/server';
import {
  getPersonById,
  updatePerson,
  deletePerson,
  archivePerson,
  getTransactions,
} from '@/lib/db';
import {
  summarizePerson,
  calculateRunningBalances,
} from '@/lib/accounting/engine';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;
    const person = await getPersonById(personId);

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const allTransactions = await getTransactions({ personId });
    const summary = summarizePerson(person, allTransactions);
    const runningBalances = calculateRunningBalances(allTransactions);

    return NextResponse.json({
      person,
      summary,
      transactions: runningBalances,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch person' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;
    const body = await req.json();

    if (body.action === 'archive') {
      const updated = await archivePerson(personId, body.archived ?? true);
      return NextResponse.json({ person: updated });
    }

    const updated = await updatePerson(personId, body);
    return NextResponse.json({ person: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update person' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    await deletePerson(personId, force);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete person' }, { status: 400 });
  }
}
