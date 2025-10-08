import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, UserCog, User as UserIcon, Mail, Calendar, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'manager' | 'user'>('user');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: editName,
          role: editRole,
        })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
      setEditingUser(null);
      alert('Usuário atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      alert(`Erro ao atualizar usuário: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      await loadUsers();
      alert('Usuário removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      alert(`Erro ao remover usuário: ${error.message}`);
    }
  };

  const startEdit = (user: UserProfile) => {
    setEditingUser(user.id);
    setEditName(user.name);
    setEditRole(user.role);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditName('');
    setEditRole('user');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'manager':
        return <UserCog className="h-4 w-4 text-blue-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      default:
        return 'Usuário';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <UsersIcon className="h-8 w-8 mr-3 text-amber-600" />
          Gerenciamento de Usuários
        </h1>
        <p className="text-gray-600">Gerencie os usuários e suas permissões no sistema</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários por email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Papel
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {editingUser === user.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="Nome do usuário"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as 'admin' | 'manager' | 'user')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          >
                            <option value="user">Usuário</option>
                            <option value="manager">Gerente</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateUser(user.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-800">{user.name || 'Sem nome'}</p>
                              {user.id === currentUser?.id && (
                                <span className="text-xs text-amber-600 font-medium">Você</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadge(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-2">{getRoleLabel(user.role)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                            >
                              Editar
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Remover usuário"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Sobre os Papéis</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <Shield className="h-4 w-4 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
            <span><strong>Administrador:</strong> Acesso total ao sistema, pode gerenciar usuários e todas as configurações</span>
          </li>
          <li className="flex items-start">
            <UserCog className="h-4 w-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
            <span><strong>Gerente:</strong> Acesso a relatórios e gestão, mas sem gerenciar usuários</span>
          </li>
          <li className="flex items-start">
            <UserIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
            <span><strong>Usuário:</strong> Acesso básico ao sistema</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Users;
