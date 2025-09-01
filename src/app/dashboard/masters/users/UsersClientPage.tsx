"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GenericTable, { TableAction, TableColumn } from "@/components/common/GenericTable";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";

// Load users from the user_details_with_permissions view
async function fetchUsers(): Promise<Record<string, unknown>[]> {
  try {
    console.log("Fetching users from user_details_with_permissions view...");
    
    const { data, error } = await supabase
      .from('user_details_with_permissions')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    console.log("Users data from view:", data);

    if (!data || data.length === 0) {
      console.log("No users found");
      return [];
    }

    // Transform the data to match our expected format
    const result = data.map(user => ({
      id: user.user_id,
      full_name: user.full_name || 'N/A',
      email: user.email || 'N/A',
      phone: user.phone || 'N/A',
      role_name: user.role_name || 'N/A',
      company_id: user.company_id,
      menu_permissions: user.menu_permissions || []
    }));
    
    console.log("Final users result:", result);
    return result;
    
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

async function fetchAccessLevels(): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_enum_values", { enum_type_name: "access_level" });
  if (!error && Array.isArray(data)) return (data as unknown as string[]).filter((v) => typeof v === "string");
  return ["read", "write", "admin"]; // fallback
}

async function fetchRoles(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase.from("roles").select("id, name").order("name", { ascending: true });
  if (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
  console.log("Fetched roles:", data);
  return (data || []) as { id: number; name: string }[];
}

async function fetchMenusWithParents(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from("menus").select("id, name, parent_id").not("parent_id", "is", null).order("name");
  if (error) return [];
  return (data || []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));
}

export default function UsersClientPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "form">("table");
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);
  const [accessLevels, setAccessLevels] = useState<string[]>([]);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [menuPermMap, setMenuPermMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [users, r, m, a] = await Promise.all([
          fetchUsers().catch((e) => {
            console.error("Failed to fetch users:", e);
            setLoadError(e?.message || "Failed to load users");
            return [] as Record<string, unknown>[];
          }),
          fetchRoles(),
          fetchMenusWithParents(),
          fetchAccessLevels(),
        ]);
        setRows(users);
        setRoles(r);
        setMenus(m);
        setAccessLevels(a);
      } catch (e) {
        console.error("Failed to load data:", e);
        setLoadError((e as Error)?.message || "Failed to load data");
      }
    })();
  }, []);

  const columns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      { key: "full_name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role_name", label: "Role" }
    ],
    []
  );

  const actions: TableAction<Record<string, unknown>>[] = [
    {
      label: "Edit",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: (row) => handleEditUser(row),
      title: "Edit",
    },
  ];

  const handleCreate = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setRoleId(roles[0]?.id || "");
    setMenuPermMap({});
    setView("form");
  };

  const handleEditUser = (row: Record<string, unknown>) => {
    // Load existing user data for editing
    setFullName(row.full_name as string || "");
    setEmail(row.email as string || "");
    setPhone(row.phone as string || "");
    
    // Find role ID by name
    const role = roles.find(r => r.name === row.role_name);
    setRoleId(role?.id || "");
    
    // Load existing menu permissions
    const existingPermissions = row.menu_permissions as Array<{menu_name: string, access_level: string}> || [];
    const permMap: Record<string, string> = {};
    
    // We need to map menu names back to menu IDs for the form
    existingPermissions.forEach(perm => {
      const menu = menus.find(m => m.name === perm.menu_name);
      if (menu) {
        permMap[menu.id] = perm.access_level;
      }
    });
    
    setMenuPermMap(permMap);
    setView("form");
  };

  const handleBack = () => setView("table");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!fullName.trim() || !email.trim() || !phone.trim() || !roleId) {
      alert("Please fill in all required fields: Name, Email, Phone, and Role.");
      return;
    }

    const menu_permissions = Object.entries(menuPermMap)
      .filter(([, lvl]) => !!lvl)
      .map(([menu_id, access_level]) => ({ menu_id, access_level }));

    const p_company_id = typeof window !== "undefined" ? window.sessionStorage.getItem("company_id") : null;

    console.log("Submitting user data:", {
      p_full_name: fullName,
      p_email: email,
      p_phone: phone,
      p_role_id: roleId,
      p_company_id,
      menu_permissions,
    });

    try {
      // Use the correct parameter names as per the updated RPC function signature
      const { data, error } = await supabase.rpc("create_user_with_permissions", {
        p_full_name: fullName,
        p_email: email,
        p_phone: phone,
        p_role_id: roleId,
        p_company_id,
        menu_permissions,
      });

      if (error) {
        console.error("RPC error details:", error);
        console.error("Error code:", error.code);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);
        
        // Provide more specific error messages
        if (error.message.includes("ambiguous")) {
          alert("Error: The RPC function has a column naming conflict. The 'email' column exists in multiple tables. Please contact your administrator to fix the 'create_user_with_permissions' function.");
        } else if (error.message.includes("does not exist")) {
          alert("Error: The RPC function 'create_user_with_permissions' does not exist. Please contact your administrator to create this function.");
        } else {
          alert(`Error creating user: ${error.message}`);
        }
        return;
      }

      if (data) {
        console.log("User created successfully:", data);
        setView("table");
        try {
          const users = await fetchUsers();
          setRows(users);
        } catch (fetchError) {
          console.error("Error refreshing users list:", fetchError);
        }
      }
    } catch (rpcError) {
      console.error("RPC call failed:", rpcError);
      alert("The create_user_with_permissions function is not available. Please contact your administrator.");
    }
  };

  // Check if we're in edit mode
  const isEditMode = fullName && email && phone; // If these fields have data, we're editing

  return (
    <div className="space-y-6">
      {view === "table" ? (
        <>
          {loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
              {loadError}
            </div>
          )}
          <GenericTable
            data={rows}
            columns={columns}
            actions={actions}
            searchable={true}
            selectable={true}
            exportable={false}
            addButton={{ label: "New User", onClick: handleCreate }}
          />
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isEditMode ? "Edit User Permissions" : "User Details"}
            </h3>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-6">
                <Label>Name</Label>
                <Input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Full name"
                  disabled={!!isEditMode}
                />
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">User details cannot be edited</p>
                )}
              </div>
              <div className="col-span-12 md:col-span-6">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Email"
                  disabled={!!isEditMode}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <Label>Phone</Label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Phone"
                  disabled={!!isEditMode}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <Label>Role</Label>
                <Select
                  defaultValue={String(roleId)}
                  onChange={(val) => setRoleId(val ? Number(val) : "")}
                  options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
                  placeholder="Select role"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Menu Permissions</h3>
            <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-md border border-gray-100 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-900">
                  <tr className="text-left text-gray-600 dark:text-gray-300">
                    <th className="py-2 px-3">Menu</th>
                    <th className="py-2 px-3">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {menus.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 px-3 text-gray-900 dark:text-white">{m.name}</td>
                      <td className="py-2 px-3">
                        <Select
                          defaultValue={menuPermMap[m.id] || ""}
                          onChange={(val) => setMenuPermMap((prev) => ({ ...prev, [m.id]: val }))}
                          options={[{ value: "", label: "None" }, ...accessLevels.map((a) => ({ value: a, label: a }))]}
                          placeholder="Select access"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={handleBack} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600">
              {isEditMode ? "Update Permissions" : "Create User"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 