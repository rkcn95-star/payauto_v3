"use client";
import React, { useState } from "react";
import ProductsTable from "@/components/products/ProductsTable";
import AddProductForm from "@/components/products/AddProductForm";

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

type ViewType = "table" | "form";

export default function ProductsPage() {
  const [currentView, setCurrentView] = useState<ViewType>("table");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const handleAddProduct = () => {
    setEditProduct(null);
    setIsEdit(false);
    setCurrentView("form");
  };

  const handleEditProduct = (product: Product) => {
    setEditProduct(product);
    setIsEdit(true);
    setCurrentView("form");
  };

  const handleBackToTable = () => {
    setCurrentView("table");
    setEditProduct(null);
    setIsEdit(false);
  };

  const handleSubmitProduct = (productData: ProductFormData) => {
    if (isEdit && editProduct) {
      console.log("Updating product:", { ...editProduct, ...productData });
      // Here you would typically update the product in database
    } else {
      console.log("Creating new product:", productData);
      // Here you would typically save new product to database
    }
    // Go back to table after submission
    setCurrentView("table");
    setEditProduct(null);
    setIsEdit(false);
  };

  return (
    <div>
      {/* Conditional View */}
      {currentView === "table" ? (
        <ProductsTable 
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
        />
      ) : (
        <AddProductForm 
          onBack={handleBackToTable}
          onSubmit={handleSubmitProduct}
          editProduct={editProduct}
          isEdit={isEdit}
        />
      )}
    </div>
  );
} 