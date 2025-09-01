"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";

interface RecordLookupProps {
  tableName: string;
  columns: string; // comma-separated string like "id,name,code"
  label?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function RecordLookup({
  tableName,
  columns,
  label,
  required = false,
  placeholder = "Select an option",
  defaultValue,
  onChange,
  className = "",

}: RecordLookupProps) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse columns string to get value and label columns
  const columnArray = columns.split(',').map(col => col.trim());
  const valueColumn = columnArray[0]; // First column is the value
  const labelColumn = columnArray[1] || columnArray[0]; // Second column is the label, fallback to first

  useEffect(() => {
    fetchOptions();
  }, [tableName, columns, valueColumn, labelColumn]);

  const fetchOptions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Remove 'public.' prefix if present
      const cleanTableName = tableName.replace(/^public\./, '');

      const { data, error } = await supabase
        .from(cleanTableName)
        .select(`${valueColumn}, ${labelColumn}`)
        .order(labelColumn);

      if (error) {
        throw error;
      }

      if (data) {
        const formattedOptions = (data as unknown as Array<Record<string, unknown>>).map(item => ({
          value: String(item[valueColumn]),
          label: String(item[labelColumn] || item[valueColumn])
        }));
        setOptions(formattedOptions);
      }
    } catch (error) {
      console.error(`Error fetching options from ${tableName}:`, error);
      setError(`Failed to load options from ${tableName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (value: string) => {
    onChange(value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label} {required && <span className="text-error-500">*</span>}
        </Label>
      )}
      
              <Select
          options={options}
          placeholder={isLoading ? "Loading..." : placeholder}
          defaultValue={defaultValue}
          onChange={handleChange}
          className="w-full"
        />
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
} 