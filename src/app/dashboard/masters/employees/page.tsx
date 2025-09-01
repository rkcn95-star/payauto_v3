import { supabase } from "@/lib/supabaseClient";
import EmployeeClientPage from "./EmployeeClientPage";
import { FormSection } from "@/components/common/GenericForm";

interface PageProps {
  searchParams: Promise<{ action?: string; id?: string }>;
}

// Types matching the actual database structure
export type FormsRow = {
  id: string;
  slug: string;
  form_title: string;
  primary_table_name: string;
  form_type: string;
  datatable_config: null | {
    default_columns?: Array<{
      header: string;
      accessorKey: string;
      type?: string;
      width?: string;
    }>;
  };
};

export type SectionRow = {
  id: string;
  form_id: string;
  section_title: string;
  table_name: string;
  foreign_key_to_parent: string | null;
  visibility: string[];
  sort_order: number | null;
};

export type FieldRow = {
  id: string;
  section_id: string;
  field_label: string;
  column_name: string;
  input_type: string;
  options_config: Record<string, unknown> | null;
  validation_rules: Record<string, unknown> | null;
  sort_order: number | null;
  row_no: number;
  col_span: number;
};

export type MasterConfig = FormsRow & {
  sections: Array<SectionRow & { fields: FieldRow[] }>;
};

async function fetchFormBySlug(slug: string): Promise<FormsRow | null> {
  const { data, error } = await supabase
    .from("forms")
    .select("id, slug, form_title, primary_table_name, form_type, datatable_config")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch form by slug:", error);
    return null;
  }
  return (data as unknown) as FormsRow | null;
}

async function fetchSections(formId: string): Promise<SectionRow[]> {
  const { data, error } = await supabase
    .from("form_sections")
    .select("id, form_id, section_title, table_name, foreign_key_to_parent, visibility, sort_order")
    .eq("form_id", formId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Failed to fetch form sections:", error);
    return [];
  }
  return (data as unknown) as SectionRow[];
}

async function fetchFields(sectionIds: string[]): Promise<FieldRow[]> {
  if (sectionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("form_fields")
    .select("id, section_id, field_label, column_name, input_type, options_config, validation_rules, sort_order, row_no, col_span")
    .in("section_id", sectionIds)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Failed to fetch form fields:", error);
    return [];
  }
  return (data as unknown) as FieldRow[];
}

async function buildMasterConfig(slug: string): Promise<MasterConfig | null> {
  try {
    const form = await fetchFormBySlug(slug);
    if (!form) return null;

    const sections = await fetchSections(form.id);
    const sectionIds = sections.map(s => s.id);
    const fields = await fetchFields(sectionIds);

    // Group fields by section
    const sectionsWithFields = sections.map(section => ({
      ...section,
      fields: fields.filter(f => f.section_id === section.id)
    }));

    return {
      ...form,
      sections: sectionsWithFields
    };
  } catch (error) {
    console.error("Error building master config:", error);
    return null;
  }
}

export default async function EmployeesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const { action, id } = resolvedParams;

  try {
    // 1. Fetch the main UI configuration for employees
    const employeeConfig = await buildMasterConfig("employees");
    console.log('employeeConfig', employeeConfig);
    
    if (!employeeConfig) {
      throw new Error("Could not fetch employee configuration");
    }

    // 2. Fetch child configurations for related entities
    const childConfigs: Record<string, FormSection[]> = {};
    
    // Common child entities for employees
    const childEntities = ["qualifications", "experiences", "nominees"];
    
    for (const entity of childEntities) {
      try {
        const childConfig = await buildMasterConfig(entity);
        console.log(`childConfig for ${entity}:`, childConfig);
        
        if (childConfig) {
          // Transform the database structure to FormSection format
          const formSections: FormSection[] = childConfig.sections.map(section => ({
            id: section.id,
            name: section.section_title,
            sort_order: section.sort_order || 0,
            foreign_key_to_parent: section.foreign_key_to_parent,
            child_table_name: section.table_name,
            fields: section.fields.map(field => ({
              name: field.column_name,
              label: field.field_label,
              input_type: field.input_type,
              options_config: field.options_config || undefined,
              validation_rules: field.validation_rules || undefined,
              required: field.validation_rules?.required === true,
              row_no: field.row_no,
              col_span: field.col_span
            }))
          }));
          
          childConfigs[entity] = formSections;
        }
      } catch (error) {
        console.warn(`Could not fetch config for ${entity}:`, error);
      }
    }

    // 3. Fetch employee data
    let employeesData: Record<string, unknown>[] = [];
    let editData: Record<string, unknown> | null = null;

    if (action === "create") {
      // For new employee, we don't need to fetch existing data
      employeesData = [];
    } else {
      // Fetch all employees for the table view
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (employeesError) {
        console.error("Error fetching employees:", employeesError);
        throw employeesError;
      }

      employeesData = employees || [];

      // If editing, fetch the specific employee data
      if (id && action !== "create") {
        const { data: singleEmployee, error: singleError } = await supabase
          .from("employees")
          .select("*")
          .eq("id", id)
          .single();

        if (!singleError && singleEmployee) {
          editData = singleEmployee;
        }
      }
    }

    // Transform employeeConfig to FormSection format for GenericForm
    const formConfig: FormSection[] = employeeConfig.sections.map(section => ({
      id: section.id,
      name: section.section_title,
      sort_order: section.sort_order || 0,
      foreign_key_to_parent: section.foreign_key_to_parent,
      child_table_name: section.table_name,
      fields: section.fields.map(field => ({
        name: field.column_name,
        label: field.field_label,
        input_type: field.input_type,
        options_config: field.options_config || undefined,
        validation_rules: field.validation_rules || undefined,
        required: field.validation_rules?.required === true,
        row_no: field.row_no,
        col_span: field.col_span
      }))
    }));

    return (
      <EmployeeClientPage
        employeeConfig={{ ...employeeConfig, form_sections: formConfig }}
        childConfigs={childConfigs}
        employeesData={employeesData}
        editData={editData}
        action={action}
        employeeId={id}
      />
    );
  } catch (error) {
    console.error("Error in EmployeesPage:", error);
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <h2 className="text-lg font-semibold mb-2">Error Loading Employee Management</h2>
        <p>There was an error loading the employee management system. Please try again or contact support.</p>
        <details className="mt-2">
          <summary className="cursor-pointer">Error Details</summary>
          <pre className="mt-2 text-sm bg-red-100 p-2 rounded">{String(error)}</pre>
        </details>
      </div>
    );
  }
} 