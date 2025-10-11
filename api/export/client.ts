import { supabase } from '../../supabase/client';

export default async function handler(): Promise<Response> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .limit(1000); // ajuste conforme necessário

  if (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    return new Response(JSON.stringify({ error: 'Erro ao buscar clientes' }), { status: 500 });
  }

  if (!data || data.length === 0) {
    return new Response('Nenhum cliente encontrado', { status: 204 });
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
      'Content-Disposition': 'attachment; filename="export_clientes.csv"',
    },
  });
}
