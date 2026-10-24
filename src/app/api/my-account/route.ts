import { NextRequest, NextResponse } from 'next/server';
import { getPeople, getTransactions } from '@/lib/db';
import {
  getPersonalAccountSettings,
  savePersonalAccountSettings,
  PersonalAccountSettings,
} from '@/lib/db/storage';
import { rupeesToPaise } from '@/lib/accounting/currency';

export async function GET() {
  try {
    const [people, transactions] = await Promise.all([
      getPeople(true),
      getTransactions(),
    ]);

    const settings = getPersonalAccountSettings();

    // 1. Total money others gave me (Cash in my bank/hand held on their behalf)
    // GIVE_MONEY means I gave them money -> Outflow from my account
    // RECEIVE_MONEY means they gave me money -> Inflow into my account
    // REPAYMENT:
    //   - THEY_REPAY_ME -> They gave me repayment -> Inflow into my account
    //   - I_REPAY_THEM -> I paid them back -> Outflow from my account
    // EXPENSE:
    //   - FOR_THEM -> Spent on their behalf -> Outflow from my account
    //   - PERSONAL_USE -> Used their money for myself -> (already in account or outflow)
    //   - SHARED -> My share + their share paid -> Total expense amount was an outflow from my account
    // ADJUSTMENT:
    //   - CREDITED_TO_ACCOUNT -> Inflow (+ve)
    //   - DEBITED_FROM_ACCOUNT -> Outflow (-ve)
    //   - INCREASE_OWED_TO_ME / DECREASE_OWED_TO_ME -> Accounting ledger adjustments

    let totalInflowsPaise = 0;
    let totalOutflowsPaise = 0;

    const peopleContributions: Record<string, {
      personId: string;
      name: string;
      color?: string;
      ledgerType: 'LENDING' | 'BORROWING' | 'CUSTODIAL';
      inflowPaise: number;
      outflowPaise: number;
      netContributionPaise: number;
      txCount: number;
    }> = {};

    for (const p of people) {
      peopleContributions[p.id] = {
        personId: p.id,
        name: p.name,
        color: p.color,
        ledgerType: p.ledgerType || 'LENDING',
        inflowPaise: 0,
        outflowPaise: 0,
        netContributionPaise: 0,
        txCount: 0,
      };
    }

    for (const tx of transactions) {
      const pid = tx.personId;
      if (!peopleContributions[pid]) {
        peopleContributions[pid] = {
          personId: pid,
          name: 'Unassigned / Contact',
          ledgerType: 'LENDING',
          inflowPaise: 0,
          outflowPaise: 0,
          netContributionPaise: 0,
          txCount: 0,
        };
      }
      const item = peopleContributions[pid];
      item.txCount++;

      switch (tx.type) {
        case 'RECEIVE_MONEY':
          // They gave me money -> Cash entered my account
          totalInflowsPaise += tx.amountPaise;
          item.inflowPaise += tx.amountPaise;
          break;

        case 'GIVE_MONEY':
          // I gave them money -> Cash left my account
          totalOutflowsPaise += tx.amountPaise;
          item.outflowPaise += tx.amountPaise;
          break;

        case 'REPAYMENT':
          if (tx.repaymentDirection === 'THEY_REPAY_ME') {
            // Cash entered my account
            totalInflowsPaise += tx.amountPaise;
            item.inflowPaise += tx.amountPaise;
          } else if (tx.repaymentDirection === 'I_REPAY_THEM') {
            // Cash left my account
            totalOutflowsPaise += tx.amountPaise;
            item.outflowPaise += tx.amountPaise;
          }
          break;

        case 'EXPENSE':
          // Any expense paid by me (whether for them, shared, or personal) is an outflow of real funds
          if (tx.expenseTreatment !== 'REFERENCE_ONLY') {
            totalOutflowsPaise += tx.amountPaise;
            item.outflowPaise += tx.amountPaise;
          }
          break;

        case 'ADJUSTMENT':
          if (tx.adjustmentDirection === 'CREDITED_TO_ACCOUNT') {
            totalInflowsPaise += tx.amountPaise;
            item.inflowPaise += tx.amountPaise;
          } else if (tx.adjustmentDirection === 'DEBITED_FROM_ACCOUNT') {
            totalOutflowsPaise += tx.amountPaise;
            item.outflowPaise += tx.amountPaise;
          }
          break;
      }
    }

    // Calculate net contribution for each person
    const breakdown = Object.values(peopleContributions).map((c) => ({
      ...c,
      netContributionPaise: c.inflowPaise - c.outflowPaise,
    })).filter((c) => c.inflowPaise > 0 || c.outflowPaise > 0);

    // Sum of funds from other people currently resting in my bank account
    // CUSTODIAL ledgers: unspent funds held on their behalf (+ve net) are in my account
    // BORROWING & LENDING ledgers: pure owe/debt tracking, does NOT count as money stored for them
    const totalOthersHeldPaise = breakdown.reduce((sum, b) => {
      if (b.ledgerType === 'CUSTODIAL' && b.netContributionPaise > 0) {
        return sum + b.netContributionPaise;
      }
      return sum;
    }, 0);

    // My own personal balance (initial baseline + manual adjustments)
    const myPersonalFundsPaise = settings.initialBalancePaise + settings.manualAdjustmentsPaise;

    // Total Present Bank / Account Balance
    // = My own personal funds + other people's money currently held in my account
    const totalPresentAccountBalancePaise = myPersonalFundsPaise + totalOthersHeldPaise;

    return NextResponse.json({
      settings,
      myPersonalFundsPaise,
      totalInflowsPaise,
      totalOutflowsPaise,
      netLedgerMovementPaise: totalInflowsPaise - totalOutflowsPaise,
      totalOthersHeldPaise,
      totalPresentAccountBalancePaise,
      breakdown,
    });
  } catch (error: any) {
    console.error('Error fetching my-account:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch account balance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = getPersonalAccountSettings();

    if (body.action === 'SET_INITIAL') {
      const amountPaise = rupeesToPaise(body.amountRupees);
      settings.initialBalancePaise = amountPaise;
      settings.history.unshift({
        id: `adj-${Date.now()}`,
        type: 'SET',
        amountPaise,
        description: body.description?.trim() || 'Updated base personal funds',
        createdAt: new Date().toISOString(),
      });
      savePersonalAccountSettings(settings);
      return NextResponse.json({ success: true, settings });
    }

    if (body.action === 'CREDIT' || body.action === 'DEBIT') {
      const amountPaise = rupeesToPaise(body.amountRupees);
      if (amountPaise <= 0) {
        return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
      }

      const diff = body.action === 'CREDIT' ? amountPaise : -amountPaise;
      settings.manualAdjustmentsPaise += diff;
      settings.history.unshift({
        id: `adj-${Date.now()}`,
        type: body.action,
        amountPaise,
        description: body.description?.trim() || (body.action === 'CREDIT' ? 'Manual Credit to My Funds' : 'Manual Debit from My Funds'),
        createdAt: new Date().toISOString(),
      });
      savePersonalAccountSettings(settings);
      return NextResponse.json({ success: true, settings });
    }

    if (body.action === 'RESET') {
      const resetBasePaise = body.amountRupees !== undefined ? rupeesToPaise(body.amountRupees) : 0;
      settings.initialBalancePaise = resetBasePaise;
      settings.manualAdjustmentsPaise = 0;
      settings.history = resetBasePaise > 0 ? [
        {
          id: `reset-${Date.now()}`,
          type: 'SET',
          amountPaise: resetBasePaise,
          description: body.description?.trim() || 'Reset bank balance calculations',
          createdAt: new Date().toISOString(),
        },
      ] : [];
      savePersonalAccountSettings(settings);
      return NextResponse.json({ success: true, settings });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating my-account:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update account balance' }, { status: 500 });
  }
}
