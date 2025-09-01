"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import GenericTable, { TableColumn, TableAction } from "@/components/common/GenericTable";
import GenericForm, { FormField, FormSection } from "@/components/common/GenericForm";
import { supabase } from "@/lib/supabaseClient";
import type { MasterConfig } from "./page";

type Props = {
  slug: string;
  config: MasterConfig;
  tableData: Record<string, unknown>[];
  editData: Record<string, unknown> | null;
  searchParams: { id?: string; action?: string };
};

type LayoutField = FormField & { row_no?: number; col_span?: number };

// Build payload for INSERT: only include non-empty values
function buildCreatePayload(data: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      payload[key] = value;
    }
  });
  return payload;
}

// Build payload for UPDATE: only include changed values (skip empties)
function buildUpdatePayload(
  data: Record<string, unknown>,
  original: Record<string, unknown> | null
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const base = original || {};

  Object.entries(data).forEach(([key, value]) => {
    const prev = base[key];
    const equal = typeof value === "string" && typeof prev === "string"
      ? value === prev
      : JSON.stringify(value) === JSON.stringify(prev);

    if (!equal && value !== undefined && value !== "") {
      payload[key] = value;
    }
  });

  return payload;
}

export default function ClientPage({ slug, config, tableData, editData, searchParams }: Props) {
  const router = useRouter();
  const isFormView = searchParams.action === "create" || !!searchParams.id;
  const isEdit = !!searchParams.id;

  // Helpers: transform table columns
  const tableColumns: TableColumn<Record<string, unknown>>[] = useMemo(() => {
    const cols = config.datatable_config?.default_columns || [];
    return cols.map(c => ({
      key: c.accessorKey as keyof Record<string, unknown>,
      label: c.header,
      width: c.width,
    }));
  }, [config]);

  // Transform db sections into GenericForm sections structure
  const formSections: FormSection[] = useMemo(() => {
    return config.sections.map((section, index) => {
      const fields: LayoutField[] = section.fields.map(f => {
        const rules = (f.validation_rules || {}) as Record<string, unknown>;
        
        // Handle dynamic options
        let dynamicOptions: LayoutField["dynamicOptions"] = undefined;
        if (f.options_config && typeof f.options_config === "object" && "type" in f.options_config) {
          const optConfig = f.options_config as Record<string, unknown>;
          if (optConfig.type === "dynamic") {
            dynamicOptions = {
              type: String(optConfig.type),
              label_column: String(optConfig.label_column),
              source_table: String(optConfig.source_table),
              value_column: String(optConfig.value_column),
            };
          }
        }

        return {
          name: f.column_name,
          label: f.field_label,
          input_type: f.input_type,
          required: Boolean(rules.required),
          row_no: f.row_no,
          col_span: f.col_span,
          options_config: f.options_config,
          dynamicOptions,
        } as LayoutField;
      });

      return {
        id: section.id || `section-${index}`,
        name: section.section_title,
        sort_order: section.sort_order || index,
        fields: fields,
        foreign_key_to_parent: null, // These are main sections, not child sections
        child_table_name: undefined,
      };
    });
  }, [config.sections]);

  // Table actions
  const actions: TableAction<Record<string, unknown>>[] = [
    {
      label: "Edit",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: (row) => {
        const id = String(row.id);
        router.push(`/dashboard/masters/${slug}?id=${id}`);
      },
      title: "Edit",
    },
  ];

  const handleAdd = () => router.push(`/dashboard/masters/${slug}?action=create`);
  const handleBack = () => router.push(`/dashboard/masters/${slug}`);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const cleanTable = config.primary_table_name.replace(/^public\./, "");
    console.log('cleanTable',cleanTable);
    console.log('formData',formData);
    console.log('editData',editData); 
    const payload = isEdit
      ? buildUpdatePayload(formData, editData)
      : buildCreatePayload(formData);
    console.log('payload',payload);

    // Attach company_id if available
    try {
      const companyId = typeof window !== 'undefined' ? window.sessionStorage.getItem('company_id') : null;
      console.log('companyId',companyId);
      if (companyId && !('company_id' in payload)) {
        payload.company_id = companyId;
      }
    } catch {}

    // If no changes for update, just go back
    if (Object.keys(payload).length === 0) {
      handleBack();
      return;
    }

    if (isEdit && searchParams.id) {
      const { error } = await supabase.from(cleanTable).update(payload).eq("id", searchParams.id);
      if (!error) handleBack();
      return;
    }

    const { error } = await supabase.from(cleanTable).insert([payload]);
    console.log('error',error);
    if (!error) handleBack();
  };

  return (
    <div className="space-y-6">
      {isFormView ? (
        <GenericForm
          config={formSections}
          onSubmit={handleSubmit}
          initialData={editData || {}}
          isEdit={!!editData}
        />
      ) : (
        <GenericTable
          data={tableData}
          columns={tableColumns}
          actions={actions}
          searchable={true}
          selectable={true}
          exportable={true}
          addButton={{ label: `Add ${config.form_title}`, onClick: handleAdd }}
        />
      )}
    </div>
  );
} 