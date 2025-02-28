import db from '$lib/database';

export async function GET() {
  try {
    const [lists] = await db.execute('SELECT * FROM vicidial_lists');
    return new Response(JSON.stringify(lists), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des listes' }), { status: 500 });
  }
}

