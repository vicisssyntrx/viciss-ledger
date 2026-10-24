import { NextRequest, NextResponse } from 'next/server';
import { getPeople, createPerson, getTransactions } from '@/lib/db';
import { summarizePerson } from '@/lib/accounting/engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const [people, transactions] = await Promise.all([
      getPeople(includeArchived),
      getTransactions(),
    ]);

    const peopleWithSummaries = people.map((p) => summarizePerson(p, transactions));

    return NextResponse.json({
      people: peopleWithSummaries,
      rawPeople: people,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Person full name is required' }, { status: 400 });
    }

    const created = await createPerson({
      name: body.name,
      nickname: body.nickname,
      color: body.color,
      ledgerType: body.ledgerType,
      phone: body.phone,
      email: body.email,
      notes: body.notes,
    });

    const summary = summarizePerson(created, []);
    return NextResponse.json({ person: summary, rawPerson: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create person' }, { status: 500 });
  }
}
