"use client";
import React, { useState, useMemo } from "react";

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

const sampleProducts: Product[] = [
  {
    id: "1",
    name: "ASUS ROG Gaming Laptop",
    category: "Laptop",
    brand: "ASUS",
    price: 2199,
    stock: 0,
    status: "Out of Stock",
    image: "/images/product/product-01.jpg",
    sku: "ASUS-ROG-001"
  },
  {
    id: "2",
    name: "Airpods Pro 2nd Gen",
    category: "Accessories",
    brand: "Apple",
    price: 839,
    stock: 25,
    status: "Active",
    image: "/images/product/product-02.jpg",
    sku: "APPL-AIRP-002"
  },
  {
    id: "3",
    name: "Apple Watch Ultra",
    category: "Watch",
    brand: "Apple",
    price: 1579,
    stock: 0,
    status: "Out of Stock",
    image: "/images/product/product-03.jpg",
    sku: "APPL-WTCH-003"
  },
  {
    id: "4",
    name: "Bose QuietComfort Earbuds",
    category: "Audio",
    brand: "Bose",
    price: 429,
    stock: 12,
    status: "Active",
    image: "/images/product/product-04.jpg",
    sku: "BOSE-QC-004"
  },
  {
    id: "5",
    name: "Canon EOS R5 Camera",
    category: "Camera",
    brand: "Canon",
    price: 3899,
    stock: 8,
    status: "Active",
    image: "/images/product/product-05.jpg",
    sku: "CANN-R5-005"
  },
  {
    id: "6",
    name: "Dell XPS 13 Laptop",
    category: "Laptop",
    brand: "Dell",
    price: 1299,
    stock: 15,
    status: "Active",
    image: "/images/product/product-01.jpg",
    sku: "DELL-XPS-006"
  },
  {
    id: "7",
    name: "Google Pixel Buds Pro",
    category: "Accessories",
    brand: "Google",
    price: 199,
    stock: 30,
    status: "Active",
    image: "/images/product/product-02.jpg",
    sku: "GOOG-PXL-007"
  },
  {
    id: "8",
    name: "Samsung Galaxy Watch 5",
    category: "Watch",
    brand: "Samsung",
    price: 329,
    stock: 20,
    status: "Active",
    image: "/images/product/product-03.jpg",
    sku: "SAMS-GW5-008"
  },
  {
    id: "9",
    name: "Sony WH-1000XM4 Headphones",
    category: "Audio",
    brand: "Sony",
    price: 349,
    stock: 18,
    status: "Active",
    image: "/images/product/product-04.jpg",
    sku: "SONY-WH4-009"
  },
  {
    id: "10",
    name: "Nikon Z7 II Camera",
    category: "Camera",
    brand: "Nikon",
    price: 2999,
    stock: 5,
    status: "Active",
    image: "/images/product/product-05.jpg",
    sku: "NIKN-Z7-010"
  }
];

type ProductsTableProps = {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
};

export default function ProductsTable({ onAddProduct, onEditProduct }: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const itemsPerPage = 7;

  const filteredProducts = useMemo(() => {
    return sampleProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ["Product", "Category", "Brand", "Price", "Stock", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredProducts.map(product => [
        `"${product.name}"`,
        product.category,
        product.brand,
        `$${product.price}`,
        product.stock,
        product.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-900">
      {/* Header with Add Product and Export buttons */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={onAddProduct}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Product</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export</span>
          </button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedProducts.length > 0 && `${selectedProducts.length} selected`}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white">
            <option>All Categories</option>
            <option>Laptop</option>
            <option>Phone</option>
            <option>Accessories</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img className="h-10 w-10 rounded-lg object-cover" src={product.image} alt={product.name} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{product.category}</td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{product.brand}</td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">${product.price}</td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{product.stock}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.status === 'Active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-1 text-gray-400 hover:text-brand-500 rounded"
                      title="Edit product"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Delete product"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 