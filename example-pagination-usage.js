// Test file to demonstrate pagination functionality
// This is for demonstration purposes only

const testPaginationParams = {
  // Basic pagination
  basic: {
    page: 1,
    pageSize: 10
  },
  
  // Pagination with search
  withSearch: {
    page: 2,
    pageSize: 20,
    search: "test product"
  },
  
  // Pagination with sorting
  withSort: {
    page: 1,
    pageSize: 15,
    sortBy: "name",
    sortOrder: "DESC"
  },
  
  // Full parameters
  complete: {
    page: 3,
    pageSize: 25,
    search: "laptop",
    sortBy: "createdAt",
    sortOrder: "ASC"
  }
};

// Expected response structure for all services
const expectedResponseStructure = {
  success: true,
  message: "Success message",
  data: {
    data: [
      // Array of items with service-specific structure
    ],
    pagination: {
      total: 150,        // Total number of items
      page: 1,           // Current page
      pageSize: 10,      // Items per page
      totalPages: 15     // Total number of pages
    }
  }
};

// Service-specific sort options
const sortOptions = {
  product: ['name', 'createdAt', 'updatedAt'],
  car: ['name', 'plate_number', 'is_active', 'createdAt', 'updatedAt'],
  company: ['name', 'createdAt', 'updatedAt'],
  employee: ['nama', 'role', 'salary', 'is_active', 'createdAt', 'updatedAt'],
  customer: ['name', 'email', 'createdAt', 'updatedAt'],
  productPrice: ['unitName', 'basePrice', 'masterModal'],
  warehouseRack: ['name', 'createdAt', 'updatedAt']
};

// Example API calls (conceptual)
const exampleAPICalls = {
  // Product with filters and pagination
  product: "GET /api/master-data/product?page=1&pageSize=20&search=laptop&sortBy=name&sortOrder=ASC&categoryId=1&typeId=2",
  
  // Car with active filter
  car: "GET /api/master-data/car?page=2&pageSize=15&search=truck&sortBy=is_active&sortOrder=DESC&active=true",
  
  // Company with basic pagination
  company: "GET /api/master-data/company?page=1&pageSize=10&search=tech&sortBy=name&sortOrder=ASC",
  
  // Employee with role search
  employee: "GET /api/master-data/employee?page=1&pageSize=25&search=manager&sortBy=salary&sortOrder=DESC&active=true",
  
  // Customer with email search
  customer: "GET /api/master-data/customer?page=1&pageSize=50&search=john@example.com&sortBy=name&sortOrder=ASC&isPosCustomer=false",
  
  // Product price for specific product
  productPrice: "GET /api/master-data/product-price/123?page=1&pageSize=10&search=kg&sortBy=basePrice&sortOrder=DESC",
  
  // Warehouse rack for specific warehouse
  warehouseRack: "GET /api/master-data/warehouse/1/rack?page=1&pageSize=20&search=A1&sortBy=name&sortOrder=ASC"
};

module.exports = {
  testPaginationParams,
  expectedResponseStructure,
  sortOptions,
  exampleAPICalls
};