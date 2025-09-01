"use client";
import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";

type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  status: string;
  image: string;
  sku: string;
  color?: string;
  weight?: string;
  length?: string;
  width?: string;
  description?: string;
};

type AddProductFormProps = {
  onBack: () => void;
  onSubmit: (productData: ProductFormData) => void;
  editProduct?: Product | null; // Add edit product prop
  isEdit?: boolean; // Add edit mode flag
};

type ProductFormData = {
  name: string;
  category: string;
  brand: string;
  color: string;
  weight: string;
  length: string;
  width: string;
  description: string;
};

const categories = [
  { value: "laptop", label: "Laptop" },
  { value: "phone", label: "Phone" },
  { value: "accessories", label: "Accessories" },
  { value: "audio", label: "Audio" },
  { value: "camera", label: "Camera" },
  { value: "watch", label: "Watch" }
];

const brands = [
  { value: "apple", label: "Apple" },
  { value: "asus", label: "ASUS" },
  { value: "dell", label: "Dell" },
  { value: "google", label: "Google" },
  { value: "canon", label: "Canon" },
  { value: "bose", label: "Bose" }
];

const colors = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "blue", label: "Blue" },
  { value: "red", label: "Red" }
];

export default function AddProductForm({ onBack, onSubmit, editProduct, isEdit = false }: AddProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category: "",
    brand: "",
    color: "",
    weight: "",
    length: "",
    width: "",
    description: ""
  });

  const [errors, setErrors] = useState<Partial<ProductFormData>>({});

  // Pre-fill form data when editing
  useEffect(() => {
    if (isEdit && editProduct) {
      setFormData({
        name: editProduct.name || "",
        category: editProduct.category?.toLowerCase() || "",
        brand: editProduct.brand?.toLowerCase() || "",
        color: editProduct.color || "",
        weight: editProduct.weight || "",
        length: editProduct.length || "",
        width: editProduct.width || "",
        description: editProduct.description || ""
      });
    }
  }, [isEdit, editProduct]);

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.brand) newErrors.brand = "Brand is required";
    if (!formData.weight.trim()) newErrors.weight = "Weight is required";
    if (!formData.length.trim()) newErrors.length = "Length is required";
    if (!formData.width.trim()) newErrors.width = "Width is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header with Back Button */}
      <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isEdit ? "Edit Product" : "Add Product"}
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Products Description</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <Label>Product Name</Label>
              <Input
                type="text"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                error={!!errors.name}
                hint={errors.name}
              />
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <Select
                defaultValue={formData.category}
                onChange={(value) => handleInputChange("category", value)}
                options={categories}
                placeholder="Select Category"
              />
              {errors.category && <p className="mt-1 text-sm text-error-500">{errors.category}</p>}
            </div>

            {/* Brand */}
            <div>
              <Label>Brand</Label>
              <Select
                defaultValue={formData.brand}
                onChange={(value) => handleInputChange("brand", value)}
                options={brands}
                placeholder="Select Brand"
              />
              {errors.brand && <p className="mt-1 text-sm text-error-500">{errors.brand}</p>}
            </div>

            {/* Color */}
            <div>
              <Label>Color</Label>
              <Select
                defaultValue={formData.color}
                onChange={(value) => handleInputChange("color", value)}
                options={colors}
                placeholder="Select color"
              />
              {errors.color && <p className="mt-1 text-sm text-error-500">{errors.color}</p>}
            </div>

            {/* Weight */}
            <div>
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                placeholder="15"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                error={!!errors.weight}
                hint={errors.weight}
              />
            </div>

            {/* Length */}
            <div>
              <Label>Length (cm)</Label>
              <Input
                type="number"
                placeholder="120"
                value={formData.length}
                onChange={(e) => handleInputChange("length", e.target.value)}
                error={!!errors.length}
                hint={errors.length}
              />
            </div>

            {/* Width */}
            <div>
              <Label>Width (cm)</Label>
              <Input
                type="number"
                placeholder="23"
                value={formData.width}
                onChange={(e) => handleInputChange("width", e.target.value)}
                error={!!errors.width}
                hint={errors.width}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <Label>Description</Label>
            <textarea
              placeholder="Receipt Info (optional)"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            {isEdit ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
} 