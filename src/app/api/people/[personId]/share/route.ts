import { NextRequest, NextResponse } from 'next/server';
import { toggleSharing, regenerateShareToken, getPersonById } from '@/lib/db';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await context.params;
    const body = await req.json();

    const person = await getPersonById(personId);
    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    if (body.action === 'regenerate') {
      const newToken = await regenerateShareToken(personId);
      return NextResponse.json({ shareToken: newToken, isSharingEnabled: true });
    }

    if (body.action === 'toggle') {
      const enabled = Boolean(body.enabled);
      const policy = body.policy === 'SELECTED' ? 'SELECTED' : 'ALL';
      const updated = await toggleSharing(personId, enabled, policy);
      return NextResponse.json({
        isSharingEnabled: updated.isSharingEnabled,
        shareToken: updated.shareToken,
        sharePolicy: updated.sharePolicy,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Supported: "toggle", "regenerate"' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update sharing settings' }, { status: 500 });
  }
}
