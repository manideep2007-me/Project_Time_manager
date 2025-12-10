import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { getPermissionsMatrix, updatePermissions, PermissionMatrixRow } from '../../api/endpoints';

// Light-weight checkbox using Pressable to avoid native dependency issues
function Checkbox({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onValueChange(!value)} style={[styles.checkbox, value && styles.checkboxChecked]}> 
      {value && <View style={styles.checkboxInner} />} 
    </Pressable>
  );
}

type Role = 'admin' | 'manager' | 'employee';

export default function AdminPermissionsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>(['admin', 'manager', 'employee']);
  const [rows, setRows] = useState<PermissionMatrixRow[]>([]);
  const [initialRows, setInitialRows] = useState<PermissionMatrixRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getPermissionsMatrix();
        if (!mounted) return;
        setRoles(data.roles as Role[]);
        setRows(data.permissions);
        setInitialRows(JSON.parse(JSON.stringify(data.permissions)));
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error || 'Failed to load permissions');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleToggle = (permissionId: string, role: Role) => {
    setRows(prev => prev.map(r => r.id === permissionId ? { ...r, access: { ...r.access, [role]: !r.access[role] } } : r));
  };

  const changedUpdates = useMemo(() => {
    const updates: Array<{ role: Role; permissionId: string; hasAccess: boolean }> = [];
    for (let i = 0; i < rows.length; i++) {
      const curr = rows[i];
      const init = initialRows.find(x => x.id === curr.id);
      if (!init) continue;
      (['admin','manager','employee'] as Role[]).forEach((role) => {
        if (curr.access[role] !== init.access[role]) {
          updates.push({ role, permissionId: curr.id, hasAccess: curr.access[role] });
        }
      });
    }
    return updates;
  }, [rows, initialRows]);

  const saveChanges = async () => {
    if (changedUpdates.length === 0) {
      Alert.alert('Nothing to save', 'No changes detected');
      return;
    }
    setSaving(true);
    try {
      await updatePermissions(changedUpdates);
      setInitialRows(JSON.parse(JSON.stringify(rows)));
      Alert.alert('Success', 'Permissions updated');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Permissions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator persistentScrollbar>
        <View>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerCell, styles.firstCol]}>Permission</Text>
            {roles.map(r => (
              <Text key={r} style={[styles.cell, styles.headerCell]}>{r.toUpperCase()}</Text>
            ))}
          </View>
          {rows.map((p) => (
            <View key={p.id} style={styles.row}>
              <Text style={[styles.cell, styles.firstCol]}>{p.description || p.name}</Text>
              {roles.map((r) => (
                <View key={r} style={styles.cell}> 
                  <Checkbox value={(p.access as any)[r]} onValueChange={() => handleToggle(p.id, r)} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable disabled={saving} onPress={saveChanges} style={[styles.saveBtn, saving && { opacity: 0.6 }]}> 
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : `Save Changes (${changedUpdates.length})`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  headerRow: { backgroundColor: '#fafafa', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  cell: { width: 140, paddingVertical: 12, paddingHorizontal: 8 },
  headerCell: { fontWeight: '600' },
  firstCol: { width: 220 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 1.5, borderColor: '#888', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { borderColor: '#2563eb' },
  checkboxInner: { width: 16, height: 16, backgroundColor: '#2563eb', borderRadius: 2 },
  saveBtn: { marginTop: 16, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});


