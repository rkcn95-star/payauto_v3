"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import GenericTable, { TableAction } from "@/components/common/GenericTable";
import GenericForm, { FormSection } from "@/components/common/GenericForm";
import { supabase } from "@/lib/supabaseClient";

interface EmployeeClientPageProps {
  employeeConfig: Record<string, unknown>;
  childConfigs: Record<string, FormSection[]>;
  employeesData: Record<string, unknown>[];
  editData: Record<string, unknown> | null;
  action?: string;
  employeeId?: string;
}

export default function EmployeeClientPage({
  employeeConfig,
  childConfigs,
  employeesData,
  editData,
  action,
  employeeId,
}: EmployeeClientPageProps) {
  const router = useRouter();

  // Determine current view
  const isFormView = action === "create" || action === "edit";
  const isEditMode = action === "edit" && editData;

  // Transform employee config for GenericForm
  const formConfig = useMemo(() => {
    if (!employeeConfig?.form_sections) return [];
    
    return (employeeConfig.form_sections as FormSection[]).map(section => ({
      ...section,
      // Add child table name for sections that manage child entities
      child_table_name: section.foreign_key_to_parent ? 
        (section.foreign_key_to_parent === "employee_id" ? "qualifications" : 
         section.foreign_key_to_parent === "employee_id" ? "experiences" : 
         section.foreign_key_to_parent === "employee_id" ? "nominees" : undefined) : undefined
    }));
  }, [employeeConfig]);

  // Transform employee config for GenericTable
  const tableConfig = useMemo(() => {
    const datatableConfig = employeeConfig?.datatable_config as Record<string, unknown>;
    if (!datatableConfig?.columns) return [];
    
    return (datatableConfig.columns as Array<{column_name: string, column_label: string}>).map(col => ({
      key: col.column_name,
      label: col.column_label,
      render: (value: unknown) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value instanceof Date) return value.toLocaleDateString();
        return String(value);
      }
    }));
  }, [employeeConfig]);

  // Table actions
  const tableActions: TableAction<Record<string, unknown>>[] = [
    {
      label: "Edit",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: (row) => {
        router.push(`/dashboard/masters/employees?action=edit&id=${row.id}`);
      },
      title: "Edit Employee"
    }
  ];

  // Handle form submission
  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const companyId = typeof window !== "undefined" ? window.sessionStorage.getItem("company_id") : null;
      
      if (companyId) {
        data.company_id = companyId;
      }

      if (isEditMode && employeeId) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update(data)
          .eq("id", employeeId);

        if (error) throw error;
      } else {
        // Create new employee
        const { error } = await supabase
          .from("employees")
          .insert([data]);

        if (error) throw error;
      }

      // Redirect back to table view
      router.push("/dashboard/masters/employees");
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Error saving employee. Please try again.");
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push("/dashboard/masters/employees");
  };

  if (isFormView) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Employees
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? "Edit Employee" : "Add New Employee"}
          </h1>
        </div>

        {/* Form */}
        <GenericForm
          config={formConfig}
          onSubmit={handleFormSubmit}
          initialData={editData || {}}
          isEdit={Boolean(isEditMode)}
          childConfigs={childConfigs as unknown as Record<string, FormSection[]>}
          parentId={employeeId}
        />
      </div>
    );
  }

  // Table view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Employee Management</h1>
        <button
          onClick={() => router.push("/dashboard/masters/employees?action=create")}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600"
        >
          Add New Employee
        </button>
      </div>

      <GenericTable
        data={employeesData}
        columns={tableConfig}
        actions={tableActions}
        searchable={true}
        selectable={true}
        exportable={true}
        addButton={{ label: "Add New Employee", onClick: () => router.push("/dashboard/masters/employees?action=create") }}
      />
    </div>
  );
} 