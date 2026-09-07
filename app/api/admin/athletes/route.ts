import { createClient } from '@supabase/supabase-js';

const usernamePattern = /^[a-z0-9_]{3,30}$/;
const pinPattern = /^\d{6}$/;

function config() {
  const url = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!url || !publishableKey || !serviceRoleKey || !adminEmail) return null;
  return { url, publishableKey, serviceRoleKey, adminEmail };
}

export async function POST(request: Request) {
  const settings = config();
  if (!settings)
    return Response.json(
      { error: 'Configuration administrateur incomplète.' },
      { status: 503 },
    );
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer '))
    return Response.json({ error: 'Session requise.' }, { status: 401 });

  const userClient = createClient(settings.url, settings.publishableKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (userData.user?.email?.toLowerCase() !== settings.adminEmail)
    return Response.json({ error: 'Accès administrateur refusé.' }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const username = String(body.username ?? '').trim().toLowerCase();
  const displayName = String(body.displayName ?? '').trim();
  const pin = String(body.pin ?? '').trim();
  if (!usernamePattern.test(username))
    return Response.json({ error: 'Identifiant : 3 à 30 caractères minuscules, chiffres ou _.' }, { status: 400 });
  if (!pinPattern.test(pin))
    return Response.json({ error: 'Le code PIN doit contenir exactement 6 chiffres.' }, { status: 400 });

  const admin = createClient(settings.url, settings.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const loginEmail = `${username}@rollbook.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email: loginEmail,
    password: pin,
    email_confirm: true,
    user_metadata: { display_name: displayName || username, username },
  });
  if (error) return Response.json({ error: error.message }, { status: 400 });

  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    display_name: displayName || username,
    username,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return Response.json({ error: profileError.message }, { status: 400 });
  }
  return Response.json({ id: data.user.id, username, pin }, { status: 201 });
}

export async function GET(request: Request) {
  const settings = config();
  const authorization = request.headers.get('authorization');
  if (!settings || !authorization?.startsWith('Bearer '))
    return Response.json({ error: 'Session requise.' }, { status: 401 });
  const userClient = createClient(settings.url, settings.publishableKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData } = await userClient.auth.getUser();
  if (userData.user?.email?.toLowerCase() !== settings.adminEmail)
    return Response.json({ error: 'Accès administrateur refusé.' }, { status: 403 });
  const admin = createClient(settings.url, settings.serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data.users.filter((user) => user.email?.endsWith('@rollbook.local') && user.email !== settings.adminEmail).map((user) => ({ id: user.id, username: user.user_metadata.username, displayName: user.user_metadata.display_name, createdAt: user.created_at })));
}

export async function PUT(request: Request) {
  const settings = config();
  const authorization = request.headers.get('authorization');
  if (!settings || !authorization?.startsWith('Bearer '))
    return Response.json({ error: 'Session requise.' }, { status: 401 });

  const userClient = createClient(settings.url, settings.publishableKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (userData.user?.email?.toLowerCase() !== settings.adminEmail)
    return Response.json({ error: 'Accès administrateur refusé.' }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const athleteId = typeof body.id === 'string' ? body.id : '';
  const pin = typeof body.pin === 'string' ? body.pin.trim() : '';
  if (!athleteId || athleteId === userData.user.id || !pinPattern.test(pin))
    return Response.json({ error: 'Choisis un code PIN valide à 6 chiffres.' }, { status: 400 });

  const admin = createClient(settings.url, settings.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: athlete, error: athleteError } = await admin.auth.admin.getUserById(athleteId);
  if (athleteError || !athlete.user?.email?.endsWith('@rollbook.local'))
    return Response.json({ error: 'Athlète introuvable.' }, { status: 404 });

  const { error } = await admin.auth.admin.updateUserById(athleteId, { password: pin });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const settings = config();
  const authorization = request.headers.get('authorization');
  if (!settings || !authorization?.startsWith('Bearer '))
    return Response.json({ error: 'Session requise.' }, { status: 401 });

  const userClient = createClient(settings.url, settings.publishableKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (userData.user?.email?.toLowerCase() !== settings.adminEmail)
    return Response.json({ error: 'Accès administrateur refusé.' }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const athleteId = String(body.id ?? '');
  if (!athleteId || athleteId === userData.user.id)
    return Response.json({ error: 'Athlète invalide.' }, { status: 400 });

  const admin = createClient(settings.url, settings.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(athleteId);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
