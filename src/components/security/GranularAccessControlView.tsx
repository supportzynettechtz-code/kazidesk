/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Users,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  Download,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import {
  CustomRole,
  PermissionMatrix,
  PermissionAction,
  SystemModuleKey,
  ALL_SYSTEM_MODULES,
  createDefaultRoles,
  createFullPermissions,
  createReadOnlyPermissions,
  PermissionAuditLog,
  UserLoginHistory
} from '../../types/rbac';
import { Employee } from '../../types/office';
import { db } from '../../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, getDocs } from 'firebase/firestore';

interface GranularAccessControlViewProps {
  companyId: string;
  lang: 'sw' | 'en';
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  employees: Employee[];
  onUpdateEmployeeRole?: (empId: string, newRoleId: string, newRoleTitle: string) => void;
  onToggleAccountStatus?: (empId: string, status: 'active' | 'suspended') => void;
}

export const GranularAccessControlView: React.FC<GranularAccessControlViewProps> = ({
  companyId,
  lang,
  currentUser,
  employees,
  onUpdateEmployeeRole,
  onToggleAccountStatus
}) => {
  const isSw = lang === 'sw';

  // Navigation Subtabs
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix' | 'users' | 'audit' | 'logins'>('roles');

  // State Collections
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<PermissionAuditLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<UserLoginHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<CustomRole | null>(null);

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // REAL-TIME FIRESTORE LISTENER FOR ROLES
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);

    const rolesRef = collection(db, 'companies', companyId, 'roles');
    const unsubscribe = onSnapshot(
      rolesRef,
      snapshot => {
        if (snapshot.empty) {
          // Initialize default system roles for this company
          const defaults = createDefaultRoles(companyId);
          defaults.forEach(r => {
            setDoc(doc(db, 'companies', companyId, 'roles', r.id), r);
          });
          setRoles(defaults);
          setSelectedRoleForMatrix(defaults[0]);
        } else {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CustomRole));
          setRoles(list);
          if (!selectedRoleForMatrix || !list.some(r => r.id === selectedRoleForMatrix.id)) {
            setSelectedRoleForMatrix(list[0]);
          }
        }
        setIsLoading(false);
      },
      err => {
        console.warn('Roles listener notice:', err);
        const defaults = createDefaultRoles(companyId);
        setRoles(defaults);
        setSelectedRoleForMatrix(defaults[0]);
        setIsLoading(false);
      }
    );

    // Fetch Audit Logs
    const auditRef = collection(db, 'companies', companyId, 'permissionAuditLogs');
    const qAudit = query(auditRef, orderBy('timestamp', 'desc'));
    const unsubAudit = onSnapshot(qAudit, snap => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as PermissionAuditLog)));
    }, () => {});

    return () => {
      unsubscribe();
      unsubAudit();
    };
  }, [companyId]);

  // Log audit helper
  const logPermissionChange = async (
    action: PermissionAuditLog['action'],
    details: string,
    roleId?: string,
    roleName?: string,
    targetUserId?: string,
    targetUserName?: string,
    before?: any,
    after?: any
  ) => {
    const logId = `AUD-${Date.now()}`;
    const entry: PermissionAuditLog = {
      id: logId,
      companyId,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      action,
      roleId,
      roleName,
      targetUserId,
      targetUserName,
      details,
      beforeSnapshot: before,
      afterSnapshot: after,
      timestamp: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'companies', companyId, 'permissionAuditLogs', logId), entry);
    } catch (e) {
      console.warn('Audit log write notice:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // ROLE ACTIONS: CREATE / EDIT / DUPLICATE / DELETE
  // ---------------------------------------------------------------------------
  const handleSaveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const description = fd.get('description') as string;

    const roleId = editingRole?.id || `role-${Date.now()}`;
    const now = new Date().toISOString();

    const roleData: CustomRole = {
      id: roleId,
      companyId,
      name,
      nameSw: name,
      description,
      isSystem: editingRole?.isSystem || false,
      permissions: editingRole?.permissions || createReadOnlyPermissions(),
      createdAt: editingRole?.createdAt || now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'companies', companyId, 'roles', roleId), roleData, { merge: true });
      await logPermissionChange(
        editingRole ? 'UPDATE_ROLE' : 'CREATE_ROLE',
        `Role "${name}" was ${editingRole ? 'updated' : 'created'}.`,
        roleId,
        name
      );
      showNotification(isSw ? `Wadhifa wa "${name}" umehifadhiwa kikamilifu!` : `Role "${name}" saved!`);
      setIsRoleModalOpen(false);
      setEditingRole(null);
    } catch (err) {
      console.error('Error saving role:', err);
      alert('Error saving role');
    }
  };

  const handleDuplicateRole = async (role: CustomRole) => {
    const newId = `role-${Date.now()}`;
    const newName = `${role.name} (Nakala/Copy)`;
    const newRole: CustomRole = {
      ...role,
      id: newId,
      name: newName,
      nameSw: newName,
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'companies', companyId, 'roles', newId), newRole);
      await logPermissionChange('CREATE_ROLE', `Duplicated role "${role.name}" into "${newName}".`, newId, newName);
      showNotification(isSw ? `Wadhifa umerudufishwa: ${newName}` : `Role duplicated: ${newName}`);
    } catch (err) {
      console.error('Error duplicating role:', err);
    }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (role.isSystem) {
      alert(isSw ? 'Huwezi kufuta wadhifa wa msingi wa mfumo.' : 'Cannot delete a core system role.');
      return;
    }

    // Check if any employee is assigned to this role
    const assignedCount = employees.filter(e => e.systemRole === role.id || e.roleTitle === role.name).length;
    if (assignedCount > 0) {
      alert(isSw
        ? `Huwezi kufuta wadhifa huu kwa sababu kuna wafanyakazi ${assignedCount} waliopangiwa wadhifa huu. Wabadilishie kwanza wadhifa mwingine.`
        : `Cannot delete role: ${assignedCount} employees are assigned to it. Reassign them first.`);
      return;
    }

    if (confirm(isSw ? `Je, una uhakika unataka kufuta wadhifa wa "${role.name}"?` : `Are you sure you want to delete role "${role.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'companies', companyId, 'roles', role.id));
        await logPermissionChange('DELETE_ROLE', `Deleted custom role "${role.name}".`, role.id, role.name);
        showNotification(isSw ? `Wadhifa wa "${role.name}" umefutwa.` : `Role "${role.name}" deleted.`);
      } catch (err) {
        console.error('Error deleting role:', err);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // PERMISSION MATRIX TOGGLE
  // ---------------------------------------------------------------------------
  const handleTogglePermission = async (moduleKey: SystemModuleKey, action: PermissionAction) => {
    if (!selectedRoleForMatrix) return;
    if (selectedRoleForMatrix.id === 'role-admin' && action === 'view') {
      alert(isSw ? 'Msimamizi Mkuu (Admin) lazima awe na ruhusa zote.' : 'Super Admin must retain all permissions.');
      return;
    }

    const currentVal = selectedRoleForMatrix.permissions[moduleKey]?.[action] || false;
    const updatedPermissions: PermissionMatrix = {
      ...selectedRoleForMatrix.permissions,
      [moduleKey]: {
        ...selectedRoleForMatrix.permissions[moduleKey],
        [action]: !currentVal,
      },
    };

    const updatedRole: CustomRole = {
      ...selectedRoleForMatrix,
      permissions: updatedPermissions,
      updatedAt: new Date().toISOString(),
    };

    try {
      setSelectedRoleForMatrix(updatedRole);
      await setDoc(doc(db, 'companies', companyId, 'roles', selectedRoleForMatrix.id), {
        permissions: updatedPermissions,
        updatedAt: updatedRole.updatedAt,
      }, { merge: true });

      await logPermissionChange(
        'UPDATE_ROLE',
        `Changed ${moduleKey}.${action} to ${!currentVal} for role "${selectedRoleForMatrix.name}".`,
        selectedRoleForMatrix.id,
        selectedRoleForMatrix.name
      );
    } catch (err) {
      console.error('Error updating permission:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // ASSIGN USER ROLE
  // ---------------------------------------------------------------------------
  const handleAssignRoleToEmployee = async (empId: string, roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // Safety guard: ensure at least one Admin remains
    if (roleId !== 'role-admin') {
      const currentAdminCount = employees.filter(e => e.systemRole === 'admin' || e.systemRole === 'role-admin').length;
      const targetEmp = employees.find(e => e.id === empId);
      if ((targetEmp?.systemRole === 'admin' || targetEmp?.systemRole === 'role-admin') && currentAdminCount <= 1) {
        alert(isSw ? 'Lazima kuwe na angalau Msimamizi Mkuu mmoja (Admin) kwenye mfumo.' : 'At least one Admin must always remain.');
        return;
      }
    }

    try {
      await setDoc(doc(db, 'companies', companyId, 'staff', empId), {
        systemRole: roleId,
        roleTitle: role.name,
        allowedModules: Object.keys(role.permissions).filter(k => role.permissions[k as SystemModuleKey]?.view),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const emp = employees.find(e => e.id === empId);
      await logPermissionChange(
        'ASSIGN_ROLE',
        `Assigned role "${role.name}" to employee ${emp?.fullName || empId}.`,
        role.id,
        role.name,
        empId,
        emp?.fullName
      );

      if (onUpdateEmployeeRole) {
        onUpdateEmployeeRole(empId, roleId, role.name);
      }
      showNotification(isSw ? `Wadhifa wa ${emp?.fullName} umesasishwa kuwa ${role.name}.` : `Assigned role to employee.`);
    } catch (err) {
      console.error('Error assigning role:', err);
    }
  };

  // CSV Export for Audit Log
  const handleExportAuditCSV = () => {
    const headers = ['Tarehe / Timestamp', 'Mtekelezaji (Actor)', 'Kitendo (Action)', 'Wadhifa / Role', 'Mhusika (Target)', 'Maelezo'];
    const rows = auditLogs.map(l => [
      l.timestamp,
      `${l.actorName} (${l.actorEmail})`,
      l.action,
      l.roleName || '-',
      l.targetUserName || '-',
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KaziDesk_Permission_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-900/40">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[11px] font-black uppercase tracking-wider border border-indigo-500/30">
              Role-Based Access Control (RBAC)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isSw ? 'Ruhusa, Mipaka & Usalama wa Watumiaji' : 'Access Control & Security Matrix'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isSw
              ? 'Weka wadhifa kwa kila mtumiaji (Admin, HR, Mhasibu, Mauzo, Staff au Maalum), dhibiti vitendo vya kila moduli (View, Create, Edit, Delete, Export, Approve), na fuatilia mabadiliko yote kwenye Audit Log.'
              : 'Enforce granular permissions per role and action across every module. Changes are enforced in both the interface and Firestore Security Rules.'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRole(null);
            setIsRoleModalOpen(true);
          }}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isSw ? '+ Tengeneza Wadhifa Mpya' : '+ Create Custom Role'}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{isSw ? 'Orodha ya Wadhifa (Roles)' : 'Roles'}</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{isSw ? 'Jedwali la Ruhusa (Matrix)' : 'Permissions Matrix'}</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isSw ? 'Wafanyakazi & Akaunti' : 'Staff Accounts'}</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{isSw ? 'Kumbukumbu za Ukaguzi (Audit Log)' : 'Audit Trail'}</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 1. ROLES LIST TAB */}
      {/* =================================================================== */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map(role => {
            const userCount = employees.filter(e => e.systemRole === role.id || e.roleTitle === role.name).length;
            const enabledModuleCount = Object.keys(role.permissions).filter(k => role.permissions[k as SystemModuleKey]?.view).length;

            return (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      role.isSystem ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    }`}>
                      {role.isSystem ? (isSw ? 'Wadhifa wa Mfumo' : 'System Role') : (isSw ? 'Wadhifa Maalum' : 'Custom Role')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {userCount} {isSw ? 'Watumiaji' : 'Users'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {role.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isSw ? 'Moduli Zinazoruhusiwa:' : 'Allowed Modules:'}</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{enabledModuleCount} / 16</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedRoleForMatrix(role);
                      setActiveTab('matrix');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors text-center"
                  >
                    {isSw ? 'Kagua Ruhusa' : 'View Matrix'}
                  </button>

                  <button
                    onClick={() => handleDuplicateRole(role)}
                    title={isSw ? 'Rudufisha Wadhifa' : 'Duplicate Role'}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {!role.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(role)}
                      title={isSw ? 'Futa Wadhifa' : 'Delete Role'}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. PERMISSIONS MATRIX TAB */}
      {/* =================================================================== */}
      {activeTab === 'matrix' && selectedRoleForMatrix && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                {isSw ? 'Unahariri Ruhusa za Wadhifa:' : 'Editing Permissions for Role:'}
              </span>
              <div className="flex items-center gap-3">
                <select
                  value={selectedRoleForMatrix.id}
                  onChange={e => {
                    const r = roles.find(item => item.id === e.target.value);
                    if (r) setSelectedRoleForMatrix(r);
                  }}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-sm text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-emerald-500"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">{selectedRoleForMatrix.description}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                ✓ {isSw ? 'Mabadiliko yanahifadhiwa mara moja kwenye Firestore' : 'Changes sync instantly'}
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">{isSw ? 'Moduli ya Mfumo' : 'System Module'}</th>
                  <th className="py-3.5 px-3 text-center">{isSw ? 'Angalia (View)' : 'View'}</th>
                  <th className="py-3.5 px-3 text-center">{isSw ? 'Unda (Create)' : 'Create'}</th>
                  <th className="py-3.5 px-3 text-center">{isSw ? 'Hariri (Edit)' : 'Edit'}</th>
                  <th className="py-3.5 px-3 text-center">{isSw ? 'Futa (Delete)' : 'Delete'}</th>
                  <th className="py-3.5 px-3 text-center">{isSw ? 'Pakua (Export)' : 'Export'}</th>
                  <th className="py-3.5 px-3 text-center">{isSw ? 'Idhinisha (Approve)' : 'Approve'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ALL_SYSTEM_MODULES.map(mod => {
                  const perms = selectedRoleForMatrix.permissions[mod.key] || {
                    view: false, create: false, edit: false, delete: false, export: false, approve: false
                  };

                  return (
                    <tr key={mod.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 dark:text-white font-bold block">
                          {isSw ? mod.labelSw : mod.labelEn}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">{mod.key}</span>
                      </td>

                      {(['view', 'create', 'edit', 'delete', 'export', 'approve'] as PermissionAction[]).map(action => (
                        <td key={action} className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={perms[action] || false}
                            onChange={() => handleTogglePermission(mod.key, action)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* 3. STAFF ACCOUNTS & ROLE ASSIGNMENT TAB */}
      {/* =================================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {isSw ? 'Upangaji wa Wadhifa na Udhibiti wa Akaunti za Wafanyakazi' : 'Staff Accounts & Role Assignment'}
            </h4>
            <span className="text-xs text-slate-400 font-mono">{employees.length} Staff Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Mfanyakazi</th>
                  <th className="py-3 px-3">Idara & Barua Pepe</th>
                  <th className="py-3 px-3">Wadhifa (System Role)</th>
                  <th className="py-3 px-3">Hali ya Akaunti</th>
                  <th className="py-3 px-3 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map(emp => {
                  const currentRoleId = emp.systemRole || 'role-staff';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 dark:text-white font-bold block">{emp.fullName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{emp.employeeNo || emp.id}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-700 dark:text-slate-300 block font-medium">{emp.department}</span>
                        <span className="text-[11px] text-slate-400">{emp.email}</span>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={currentRoleId}
                          onChange={e => handleAssignRoleToEmployee(emp.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.accountStatus === 'suspended' ? 'bg-rose-500/20 text-rose-600' : 'bg-emerald-500/20 text-emerald-600'
                        }`}>
                          {emp.accountStatus === 'suspended' ? 'Imezuiwa (Suspended)' : 'Amilifu (Active)'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={async () => {
                            const newStatus = emp.accountStatus === 'suspended' ? 'active' : 'suspended';
                            await setDoc(doc(db, 'companies', companyId, 'staff', emp.id), {
                              accountStatus: newStatus,
                              updatedAt: new Date().toISOString(),
                            }, { merge: true });
                            await logPermissionChange('TOGGLE_ACCOUNT_STATUS', `Toggled account status of ${emp.fullName} to ${newStatus}.`, undefined, undefined, emp.id, emp.fullName);
                            if (onToggleAccountStatus) onToggleAccountStatus(emp.id, newStatus);
                            showNotification(isSw ? `Akaunti ya ${emp.fullName} imebadilishwa kuwa ${newStatus}.` : `Status updated.`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            emp.accountStatus === 'suspended' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {emp.accountStatus === 'suspended' ? (isSw ? 'Wezesha' : 'Enable') : (isSw ? 'Sitisha' : 'Suspend')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* 4. AUDIT LOG TAB */}
      {/* =================================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {isSw ? 'Kumbukumbu Rasmi za Mabadiliko ya Ruhusa (Audit Trail)' : 'Permission Audit Trail'}
              </h4>
              <p className="text-xs text-slate-400">
                {isSw ? 'Kila mabadiliko ya wadhifa, ruhusa, au hali ya mtumiaji yanarekodiwa hapa na hayafutiki.' : 'Every role or permission mutation is recorded immutably.'}
              </p>
            </div>
            <button
              onClick={handleExportAuditCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isSw ? 'Pakua CSV' : 'Export CSV'}</span>
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {isSw ? 'Hakuna mabadiliko ya ruhusa yaliyorekodiwa bado.' : 'No permission audits recorded yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Tarehe & Saa</th>
                    <th className="py-3 px-3">Msimamizi (Actor)</th>
                    <th className="py-3 px-3">Kitendo</th>
                    <th className="py-3 px-3">Maelezo Kamili</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {log.timestamp.replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 dark:text-white font-bold block">{log.actorName}</strong>
                        <span className="text-[10px] text-slate-400">{log.actorEmail}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT ROLE */}
      {/* =================================================================== */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {editingRole ? (isSw ? 'Hariri Wadhifa' : 'Edit Role') : (isSw ? 'Tengeneza Wadhifa Mpya' : 'Create Custom Role')}
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Jina la Wadhifa (Role Name) *' : 'Role Name *'}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingRole?.name || ''}
                  placeholder={isSw ? 'Mf. Afisa Ununuzi & Stoo' : 'e.g. Procurement Officer'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Maelezo ya Kazi na Majukumu' : 'Description'}
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingRole?.description || ''}
                  placeholder={isSw ? 'Maelezo mafupi ya mamlaka ya wadhifa huu...' : 'Role authority summary...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  {isSw ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  {isSw ? 'Hifadhi Wadhifa' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
