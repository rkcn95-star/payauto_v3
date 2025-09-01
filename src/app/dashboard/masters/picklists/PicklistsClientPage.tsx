"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GenericTable, { TableAction, TableColumn } from "@/components/common/GenericTable";
import GenericForm, { FormField, FormSection } from "@/components/common/GenericForm";

// Helper to get enum values for picklist_type
async function fetchPicklistTypes(): Promise<string[]> {
  // Use provided RPC to fetch enum values
  const { data, error } = await supabase.rpc("get_enum_values", { enum_type_name: "picklist_type" });
  if (!error && Array.isArray(data)) {
    return (data as unknown as string[]).filter((v) => typeof v === "string");
  }
  console.warn("get_enum_values RPC failed; falling back to distinct types from picklists");
  const { data: rows } = await supabase.from("picklists").select("type").neq("is_active", false);
  const set = new Set<string>((rows || []).map((r: { type: string }) => r.type));
  return Array.from(set.values());
}

async function fetchPicklistsByType(type: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("picklists")
    .select("id, type, label, value, sort_order, head")
    .eq("type", type)
    .neq("is_active", false)
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("fetchPicklistsByType error:", error.message);
    return [];
  }
  return (data || []) as Record<string, unknown>[];
}

export default function PicklistsClientPage() {
  const [types, setTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"table" | "form">("table");
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const t = await fetchPicklistTypes();
      setTypes(t);
      if (t.length > 0) setSelectedType(t[0]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedType) return;
      setLoading(true);
      const data = await fetchPicklistsByType(selectedType);
      setRows(data);
      setLoading(false);
    })();
  }, [selectedType]);

  const columns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      { key: "label", label: "Label" },
      { key: "value", label: "Value" },
      { key: "sort_order", label: "Sort Order" },
      { key: "head", label: "Head" },
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
      onClick: (row) => handleEdit(row),
      title: "Edit",
    },
    {
      label: "Delete",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: async (row) => {
        const ok = window.confirm("Are you sure you want to deactivate this picklist value?");
        if (!ok) return;
        const { error } = await supabase.from("picklists").update({ is_active: false }).eq("id", row.id);
        if (!error) {
          const data = await fetchPicklistsByType(selectedType);
          setRows(data);
        }
      },
      className: "p-1 text-gray-400 hover:text-red-500 rounded",
      title: "Deactivate",
    },
  ];

  const formFields: FormSection[] = useMemo(() => {
    const fields: FormField[] = [
      { name: "label", label: "Label", input_type: "text", required: true, row_no: 1, col_span: 6 },
      { name: "value", label: "Value", input_type: "text", required: true, row_no: 1, col_span: 6 },
      { name: "sort_order", label: "Sort Order", input_type: "number", required: false, row_no: 2, col_span: 6 },
      { name: "head", label: "Head", input_type: "text", required: false, row_no: 2, col_span: 6 },
    ];

    return [{
      id: "picklist-form-section",
      name: "Picklist Details",
      sort_order: 1,
      fields: fields,
      foreign_key_to_parent: null,
      child_table_name: undefined,
    }];
  }, []);

  const handleAdd = () => {
    setEditRow(null);
    setView("form");
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditRow(row);
    setView("form");
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const companyId = typeof window !== 'undefined' ? window.sessionStorage.getItem('company_id') : null;
    
    const payload = {
      ...data,
      type: selectedType,
      ...(companyId && { company_id: companyId })
    };

    try {
      if (editRow) {
        // Update existing
        const { error } = await supabase
          .from("picklists")
          .update(payload)
          .eq("id", editRow.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("picklists")
          .insert([payload]);
        if (error) throw error;
      }

      setView("table");
      setEditRow(null);
      
      // Refresh data
      if (selectedType) {
        await fetchPicklistsByType(selectedType);
      }
    } catch (error) {
      console.error("Error saving picklist:", error);
      alert("Error saving picklist item");
    }
  };

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 md:col-span-3 font-medium text-gray-700 dark:text-gray-300">Select Type</div>
          <div className="col-span-12 md:col-span-4">
            <select
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={loading}
            >
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {view === "table" && (
            <div className="col-span-12 md:col-span-5 flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Value
              </button>
            </div>
          )}
        </div>
      </div>

      {view === "table" ? (
        <GenericTable
          data={rows}
          columns={columns}
          actions={actions}
          searchable={true}
          selectable={true}
          exportable={false}
        />
      ) : (
        <GenericForm
          config={formFields}
          onSubmit={handleFormSubmit}
          initialData={editRow || {}}
          isEdit={!!editRow}
        />
      )}
    </div>
  );
} 