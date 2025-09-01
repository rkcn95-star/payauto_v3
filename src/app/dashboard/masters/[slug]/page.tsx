import { supabase } from "@/lib/supabaseClient";
import ClientPage from "./ClientPage";

export type DatatableColumnConfig = {
  header: string;
  accessorKey: string;
  type?: string;
  width?: string;
};

export type FormsRow = {
  id: string;
  slug: string;
  form_title: string;
  primary_table_name: string;
  form_type: string;
  datatable_config: null | {
    default_columns?: DatatableColumnConfig[];
  };
};

export type SectionRow = {
  id: string;
  form_id: string;
  section_title: string;
  table_name: string;
  foreign_key_to_parent: string | null;
  visibility: string[]; // e.g., ["form", "list"]
  sort_order: number | null;
};

export type FieldRow = {
  id: string;
  section_id: string;
  field_label: string;
  column_name: string;
  input_type: string; // text|number|email|password|select|textarea
  options_config: Record<string, unknown> | null; // jsonb
  validation_rules: Record<string, unknown> | null; // jsonb, e.g. { required: true }
  sort_order: number | null;
  row_no: number;
  col_span: number; // 1..12
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

async function fetchPrimaryTableData(tableName: string) {
  const cleanTable = tableName.replace(/^public\./, "");
  const { data, error } = await supabase.from(cleanTable).select("*");
  if (error) {
    console.error("Failed to fetch primary table data", { tableName: cleanTable, error });
    return [];
  }
  return data as Record<string, unknown>[];
}

async function fetchSingleRecord(tableName: string, id: string) {
  const cleanTable = tableName.replace(/^public\./, "");
  const { data, error } = await supabase.from(cleanTable).select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Failed to fetch single record", { tableName: cleanTable, id, error });
    return null;
  }
  return (data || null) as Record<string, unknown> | null;
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ id?: string; action?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const slug = resolvedParams.slug;
  const form = await fetchFormBySlug(slug);
  if (!form) {
    return (
      <div className="p-6 rounded border border-red-200 bg-red-50 text-red-700">
        Failed to load configuration for slug: {slug}
      </div>
    );
  }

  const sections = await fetchSections(form.id);
  const fields = await fetchFields(sections.map(s => s.id));
  const sectionsWithFields = sections.map(s => ({
    ...s,
    fields: fields.filter(f => f.section_id === s.id)
  }));

  const masterConfig: MasterConfig = { ...form, sections: sectionsWithFields };
  const data = await fetchPrimaryTableData(form.primary_table_name);

  let editData: Record<string, unknown> | null = null;
  const idParam = (resolvedSearch as { id?: string }).id;
  if (idParam) {
    editData = await fetchSingleRecord(form.primary_table_name, idParam);
  }

  return (
    <ClientPage
      slug={slug}
      config={masterConfig}
      tableData={data}
      editData={editData}
      searchParams={(resolvedSearch as { id?: string; action?: string }) || {}}
    />
  );
} 