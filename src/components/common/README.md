# Generic Components Usage Guide

## Overview
The generic components (`GenericTable` and `GenericForm`) allow you to create data tables and forms for any entity without writing repetitive code. They provide consistent styling and behavior while being highly customizable.

## GenericTable Component

### Basic Usage

```typescript
import GenericTable, { TableColumn, TableAction } from "@/components/common/GenericTable";

// Define your data type
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  createdAt: string;
};

// Define columns
const userColumns: TableColumn<User>[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { 
    key: "status", 
    label: "Status",
    render: (value, row) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    )
  },
  { key: "createdAt", label: "Created At" }
];

// Define actions
const userActions: TableAction<User>[] = [
  {
    label: "Edit",
    icon: <EditIcon />,
    onClick: (user) => handleEdit(user),
    title: "Edit user"
  },
  {
    label: "Delete",
    icon: <DeleteIcon />,
    onClick: (user) => handleDelete(user),
    className: "p-1 text-gray-400 hover:text-red-500 rounded",
    title: "Delete user"
  }
];

// Use the component
<GenericTable
  data={users}
  columns={userColumns}
  actions={userActions}
  searchable={true}
  searchPlaceholder="Search users..."
  searchableColumns={["name", "email"]}
  selectable={true}
  onSelectionChange={(selectedIds) => setSelectedUsers(selectedIds)}
  exportable={true}
  exportFilename="users"
  addButton={{
    label: "Add User",
    onClick: () => setShowForm(true)
  }}
  itemsPerPage={10}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Array of data items |
| `columns` | `TableColumn<T>[]` | Required | Column definitions |
| `actions` | `TableAction<T>[]` | `[]` | Action buttons for each row |
| `searchable` | `boolean` | `true` | Enable/disable search functionality |
| `searchPlaceholder` | `string` | `"Search..."` | Search input placeholder |
| `searchableColumns` | `(keyof T)[]` | All columns | Which columns to search in |
| `selectable` | `boolean` | `false` | Enable row selection |
| `onSelectionChange` | `(ids: string[]) => void` | - | Callback when selection changes |
| `exportable` | `boolean` | `false` | Show export button |
| `exportFilename` | `string` | `"export"` | Export file name |
| `addButton` | `{label: string, onClick: () => void}` | - | Add button configuration |
| `itemsPerPage` | `number` | `7` | Items per page |
| `idField` | `keyof T` | `"id"` | Field to use as unique identifier |

## GenericForm Component

### Basic Usage

```typescript
import GenericForm, { FormField } from "@/components/common/GenericForm";

// Define form fields
const userFormFields: FormField[] = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    required: true,
    placeholder: "Enter full name"
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    required: true,
    placeholder: "Enter email address",
    validation: (value) => {
      const email = String(value);
      if (!email.includes("@")) return "Invalid email format";
      return undefined;
    }
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: [
      { value: "admin", label: "Administrator" },
      { value: "user", label: "User" },
      { value: "moderator", label: "Moderator" }
    ]
  },
  {
    name: "bio",
    label: "Biography",
    type: "textarea",
    placeholder: "Tell us about yourself...",
    rows: 4
  }
];

// Use the component
<GenericForm
  title="User"
  fields={userFormFields}
  onSubmit={(data) => handleSubmit(data)}
  onBack={() => setCurrentView("table")}
  editData={editUser}
  isEdit={isEditMode}
  submitButtonText="Save User"
  cancelButtonText="Cancel"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Entity name (e.g., "User", "Product") |
| `fields` | `FormField[]` | Required | Form field definitions |
| `onSubmit` | `(data: Record<string, unknown>) => void` | Required | Submit callback |
| `onBack` | `() => void` | Required | Back button callback |
| `editData` | `T \| null` | - | Data to pre-fill when editing |
| `isEdit` | `boolean` | `false` | Whether in edit mode |
| `submitButtonText` | `string` | Auto-generated | Custom submit button text |
| `cancelButtonText` | `string` | `"Cancel"` | Cancel button text |

### Form Field Types

| Type | Description | Props |
|------|-------------|-------|
| `text` | Text input | `placeholder` |
| `number` | Number input | `placeholder` |
| `email` | Email input | `placeholder` |
| `password` | Password input | `placeholder` |
| `select` | Dropdown select | `options`, `placeholder` |
| `textarea` | Multi-line text | `placeholder`, `rows` |

## Complete Example

```typescript
// UserManagement.tsx
"use client";
import React, { useState } from "react";
import GenericTable, { TableColumn, TableAction } from "@/components/common/GenericTable";
import GenericForm, { FormField } from "@/components/common/GenericForm";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
};

const userColumns: TableColumn<User>[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { 
    key: "status", 
    label: "Status",
    render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    )
  }
];

const userFormFields: FormField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { 
    name: "role", 
    label: "Role", 
    type: "select", 
    required: true,
    options: [
      { value: "admin", label: "Admin" },
      { value: "user", label: "User" }
    ]
  }
];

export default function UserManagement() {
  const [currentView, setCurrentView] = useState<"table" | "form">("table");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [users] = useState<User[]>([/* your data */]);

  const userActions: TableAction<User>[] = [
    {
      label: "Edit",
      icon: <EditIcon />,
      onClick: (user) => {
        setEditUser(user);
        setCurrentView("form");
      }
    }
  ];

  return (
    <div>
      {currentView === "table" ? (
        <GenericTable
          data={users}
          columns={userColumns}
          actions={userActions}
          addButton={{
            label: "Add User",
            onClick: () => {
              setEditUser(null);
              setCurrentView("form");
            }
          }}
          exportable={true}
          selectable={true}
        />
      ) : (
        <GenericForm
          title="User"
          fields={userFormFields}
          onSubmit={(data) => {
            console.log("Form data:", data);
            setCurrentView("table");
          }}
          onBack={() => setCurrentView("table")}
          editData={editUser}
          isEdit={!!editUser}
        />
      )}
    </div>
  );
}
```

## Benefits

1. **Consistency**: All tables and forms follow the same design patterns
2. **Reusability**: Write once, use for any entity
3. **Type Safety**: Full TypeScript support with generics
4. **Feature Rich**: Built-in search, pagination, export, validation
5. **Customizable**: Flexible rendering and validation options
6. **Maintainable**: Changes to one component affect all instances 