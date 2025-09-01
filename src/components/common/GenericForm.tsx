"use client";
import React, { useState, useEffect, useCallback } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import RecordLookup from "@/components/form/RecordLookup";
import GenericTable, { TableColumn, TableAction } from "@/components/common/GenericTable";
import { supabase } from "../../lib/supabaseClient";

export interface FormField {
  name: string;
  label: string;
  input_type: string;
  options_config?: Record<string, unknown>;
  validation_rules?: Record<string, unknown>;
  required?: boolean;
  row_no?: number;
  col_span?: number;
  dynamicOptions?: {
    type: string;
    label_column: string;
    source_table: string;
    value_column: string;
  };
}

export interface FormSection {
  id: string;
  name: string;
  sort_order: number;
  fields: FormField[];
  foreign_key_to_parent?: string | null; // New field for child sections
  child_table_name?: string; // New field for child table name
}

export interface GenericFormProps {
  config: FormSection[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  initialData?: Record<string, unknown>;
  isEdit?: boolean;
  childConfigs?: Record<string, FormSection[]>; // New prop for child configurations
  parentId?: string | number; // New prop for parent record ID
}

export default function GenericForm({
  config,
  onSubmit,
  initialData = {},
  isEdit = false,
  childConfigs = {},
  parentId,
}: GenericFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [childData, setChildData] = useState<Record<string, Record<string, unknown>[]>>({});

  // Fetch child data when component mounts or parentId changes
  const fetchChildData = useCallback(async () => {
    if (!parentId || !childConfigs) return;

    const newChildData: Record<string, Record<string, unknown>[]> = {};

    for (const [tableName, sections] of Object.entries(childConfigs)) {
      try {
        // Get the foreign key column name from the first section
        const firstSection = sections[0];
        if (!firstSection) continue;

        // Find the foreign key field that references the parent
        const foreignKeyField = firstSection.fields.find(field => 
          field.name.includes('employee_id') || field.name.includes('parent_id') || field.name.includes('id')
        );
        
        if (!foreignKeyField) {
          console.warn(`No foreign key field found for table ${tableName}`);
          continue;
        }

        // Fetch child records
        const { data, error } = await supabase
          .from(tableName.replace(/^public\./, ''))
          .select('*')
          .eq(foreignKeyField.name, parentId);

        if (error) {
          console.error(`Error fetching ${tableName} data:`, error);
          newChildData[tableName] = [];
        } else {
          newChildData[tableName] = data || [];
        }
      } catch (error) {
        console.error(`Error fetching ${tableName} data:`, error);
        newChildData[tableName] = [];
      }
    }

    setChildData(newChildData);
  }, [parentId, childConfigs]);

  useEffect(() => {
    if (parentId && childConfigs) {
      fetchChildData();
    }
  }, [fetchChildData, parentId, childConfigs]);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleInputChange = (name: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    config.forEach((section) => {
      // Only validate main sections (not child sections with foreign keys)
      if (!section.foreign_key_to_parent) {
        section.fields.forEach((field) => {
          if (field.required && !formData[field.name]) {
            newErrors[field.name] = `${field.label} is required`;
          }
        });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (submitError) {
      console.error("Form submission error:", submitError);
      
      // Show user-friendly error message
      let errorMessage = "An error occurred while saving. Please try again.";
      if (submitError instanceof Error) {
        errorMessage = submitError.message;
      }
      
      // You can replace this with a toast notification or modal
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || "";

    switch (field.input_type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            type={field.input_type}
            value={String(value)}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value ? String(value) : ""}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={`Select ${field.label.toLowerCase()}`}
          />
        );

      case "textarea":
        return (
          <textarea
            value={String(value)}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        );

      case "select":
        if (field.dynamicOptions) {
                  return (
          <RecordLookup
            tableName={field.dynamicOptions.source_table}
            columns={`${field.dynamicOptions.value_column},${field.dynamicOptions.label_column}`}
            defaultValue={String(value)}
            onChange={(val) => handleInputChange(field.name, val)}
            placeholder={`Select ${field.label.toLowerCase()}`}
            label={field.label}
            required={Boolean(field.validation_rules?.required) || false}
          />
        );
        }
        return (
          <Select
            defaultValue={String(value)}
            onChange={(val) => handleInputChange(field.name, val)}
            options={(field.options_config?.options as Array<{value: string, label: string}>) || []}
            placeholder={`Select ${field.label.toLowerCase()}`}
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleInputChange(field.name, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
        );

      default:
        return (
          <Input
            value={String(value)}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  const renderChildTable = (section: FormSection) => {
    if (!section.child_table_name || !childConfigs[section.child_table_name] || !parentId) {
      return <div>No configuration available for child table</div>;
    }

    const childConfig = childConfigs[section.child_table_name];
    const tableData = childData[section.child_table_name] || [];
    
    // Transform child config to GenericTable props
    const columns: TableColumn<Record<string, unknown>>[] = childConfig
      .flatMap(s => s.fields)
      .map(field => ({
        key: field.name,
        label: field.label,
        render: (value) => String(value || 'N/A')
      }));

    const actions: TableAction<Record<string, unknown>>[] = [
      {
        label: "Edit",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        onClick: (row) => {
          // Handle edit for child record
          console.log("Edit child record:", row);
        },
        title: "Edit"
      },
      {
        label: "Delete",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
        onClick: (row) => {
          // Handle delete for child record
          console.log("Delete child record:", row);
        },
        title: "Delete"
      }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">{section.name}</h4>
          <button
            type="button"
            onClick={() => {
              // Handle add new child record
              console.log("Add new child record for section:", section.name);
              // TODO: Implement add new child record functionality
            }}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600"
          >
            Add New
          </button>
        </div>
        <GenericTable
          data={tableData}
          columns={columns}
          actions={actions}
          searchable={true}
          selectable={false}
          exportable={false}
        />
      </div>
    );
  };

  const renderSection = (section: FormSection) => {
    // Check if this is a child section
    if (section.foreign_key_to_parent) {
      return (
        <div key={section.id} className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          {renderChildTable(section)}
        </div>
      );
    }

    // Main section with form fields
    return (
      <div key={section.id} className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{section.name}</h3>
        
        {/* Group fields by row_no */}
        {(() => {
          const fieldsByRow = new Map<number, FormField[]>();
          section.fields.forEach(field => {
            const rowNo = field.row_no || 1;
            if (!fieldsByRow.has(rowNo)) {
              fieldsByRow.set(rowNo, []);
            }
            fieldsByRow.get(rowNo)!.push(field);
          });

          const sortedRows = Array.from(fieldsByRow.entries()).sort(([a], [b]) => a - b);

          return sortedRows.map(([rowNo, fields]) => (
            <div key={rowNo} className="grid grid-cols-12 gap-6 mb-6">
              {fields.map((field) => {
                const colSpan = field.col_span || 6;
                const spanClassMap: Record<number, string> = {
                  1: "col-span-1",
                  2: "col-span-2", 
                  3: "col-span-3",
                  4: "col-span-4",
                  6: "col-span-6",
                  8: "col-span-8",
                  12: "col-span-12"
                };
                const spanClass = spanClassMap[colSpan] || "col-span-6";

                return (
                  <div key={field.name} className={spanClass}>
                    <Label>
                      {field.label} {field.required && <span className="text-error-500">*</span>}
                    </Label>
                    {renderField(field)}
                    {errors[field.name] && (
                      <p className="mt-1 text-sm text-error-500">{errors[field.name]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {config.map(renderSection)}
      
      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 disabled:bg-brand-300"
        >
          {loading ? "Saving..." : isEdit ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
