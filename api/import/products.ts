import { supabase } from '../../supabase/client';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
    });
  }

  try {
    const products = await req.json();
    console.log('📦 Recebendo produtos:', products.length);

    const { error } = await supabase.from('products').insert(products);

    if (error) {
      console.error('❌ Erro ao inserir produtos:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar produtos', details: error }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, count: products.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Erro geral import/products:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar produtos' }),
      { status: 500 }
    );
  }
}
