import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { userService } from '../../services';
import { User, UserRole } from '../../types';
import { Search, Shield, School, GraduationCap, Check, X } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const updated = await userService.toggleUserStatus(userId);
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const columns: Column<User>[] = [
    {
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.avatar_url ? (
            <img
              src={u.avatar_url}
              alt={u.full_name}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-600)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {u.full_name.charAt(0)}
            </div>
          )}
          <div>
            <span style={{ fontWeight: 600 }}>{u.full_name}</span>
            <p className="text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (u) => {
        if (u.role === 'ADMIN') return <Badge variant="primary" icon={<Shield size={12} />}>ADMIN</Badge>;
        if (u.role === 'FACULTY') return <Badge variant="info" icon={<School size={12} />}>FACULTY</Badge>;
        return <Badge variant="success" icon={<GraduationCap size={12} />}>STUDENT</Badge>;
      },
    },
    {
      header: 'Contact',
      accessor: (u) => u.phone || 'N/A',
    },
    {
      header: 'Status',
      render: (u) => (
        <Badge variant={u.is_active ? 'success' : 'danger'}>
          {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
        </Badge>
      ),
    },
    {
      header: 'Joined Date',
      accessor: (u) => new Date(u.created_at).toLocaleDateString(),
    },
    {
      header: 'Actions',
      render: (u) => (
        <Button
          variant={u.is_active ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => handleToggleStatus(u.id)}
        >
          {u.is_active ? <X size={14} /> : <Check size={14} />}
          {u.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management & Directory"
        subtitle="Manage identities, role assignments, account status, and permissions"
        breadcrumbs={[{ label: 'Admin' }, { label: 'User Directory' }]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', width: '100%' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <Input
                placeholder="Search user by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>

            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${selectedRole === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedRole('ALL')}
              >
                All ({users.length})
              </button>
              <button
                className={`btn btn-sm ${selectedRole === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedRole('ADMIN')}
              >
                Admins ({users.filter((u) => u.role === 'ADMIN').length})
              </button>
              <button
                className={`btn btn-sm ${selectedRole === 'FACULTY' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedRole('FACULTY')}
              >
                Faculty ({users.filter((u) => u.role === 'FACULTY').length})
              </button>
              <button
                className={`btn btn-sm ${selectedRole === 'STUDENT' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedRole('STUDENT')}
              >
                Students ({users.filter((u) => u.role === 'STUDENT').length})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <p className="text-muted text-sm" style={{ padding: '2rem', textAlign: 'center' }}>
              Loading users...
            </p>
          ) : (
            <Table
              data={filteredUsers}
              columns={columns}
              keyExtractor={(u) => u.id}
              emptyMessage="No users matching the criteria."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
