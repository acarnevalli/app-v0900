import { supabase } from '../../supabase/client';

export default async function handler(): Promise<Response> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1000);

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    return new Response(JSON.stringify({ error: 'Erro ao buscar produtos' }), { status: 500 });
  }

  if (!data || data.length === 0) {
    return new Response('Nenhum produto encontrado', { status: 204 });
  }

  const headers = Object.keys(data[0]);
  const csv =
    headers.join(',') +
    '\n' +
    data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="export_produtos.csv"',
    },
  });
}
