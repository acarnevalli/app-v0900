export function Dashboard() {
  const [stats, setStats] = useState({})
  
  useEffect(() => {
    carregarEstatisticas()
    
    // Atualização em tempo real
    const subscription = supabase
      .channel('dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public' }, 
        () => carregarEstatisticas()
      )
      .subscribe()
      
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <div className="dashboard">
      <h1>Visão Geral da Marcenaria</h1>
      
      {/* Todos veem os mesmos dados */}
      <div className="cards">
        <Card titulo="Projetos Ativos" valor={stats.projetosAtivos} />
        <Card titulo="Faturamento Mês" valor={stats.faturamentoMes} />
        <Card titulo="Itens Estoque Baixo" valor={stats.estoqueBaixo} />
      </div>
      
      {/* Log de atividades recentes */}
      <div className="atividades-recentes">
        <h3>Últimas Atividades</h3>
        <ul>
          <li>João criou orçamento #123</li>
          <li>Maria atualizou status do projeto Mesa</li>
          <li>Sistema alertou estoque baixo de MDF</li>
        </ul>
      </div>
    </div>
  )
}
