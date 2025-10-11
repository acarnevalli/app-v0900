import { supabase } from '../../supabase/client';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
    });
  }

  try {
    const clients = await req.json();
    console.log('📥 Recebendo clientes:', clients.length);

    // Insere os dados no banco Supabase (tabela: clients)
    const { error } = await supabase.from('clients').insert(clients);

    if (error) {
      console.error('❌ Erro ao inserir:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar clientes', details: error }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, count: clients.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Erro geral import/clients:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar clientes' }),
      { status: 500 }
    );
  }
}
