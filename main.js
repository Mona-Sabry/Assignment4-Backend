const express = require("express");
const mysql2 = require("mysql2/promise");
const port = 3000;
const app = express();
app.use(express.json());
let pool;

async function connectToDatabase() {
  //create connection to mysql database
  const connection = await mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    port: 3306,
  });
  await connection.query("CREATE DATABASE IF NOT EXISTS trade");
  await connection.end();

  // Create the connection pool
  pool = mysql2.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "trade",
    waitForConnections: true,
    connectionLimit: 10,
  });
  await pool.query(`
   CREATE TABLE IF NOT EXISTS suppliers(
   supplierID INT PRIMARY KEY AUTO_INCREMENT,
supplierName VARCHAR(255) NOT NULL,
ContactNumber VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 deleted_at TIMESTAMP  NULL DEFAULT NULL
   )
    `);
  await pool.query(`
   CREATE TABLE IF NOT EXISTS products(
   ProductID INT PRIMARY KEY AUTO_INCREMENT,
ProductName VARCHAR(255) NOT NULL,
Price DECIMAL(10,2),
 StockQuantity INT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 deleted_at TIMESTAMP  NULL DEFAULT NULL,
 SupplierID INT,
FOREIGN KEY (SupplierID)REFERENCES suppliers(supplierID)
   )
    `);
  await pool.query(`
   CREATE TABLE IF NOT EXISTS sales(
   saleID INT PRIMARY KEY AUTO_INCREMENT,
quantitySold INT,
salesDate DATE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 deleted_at TIMESTAMP  NULL DEFAULT NULL,
  productID INT,
FOREIGN KEY (productID) REFERENCES products(ProductID)
   )
    `);
}
connectToDatabase();

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Hello from mysql driver" });
});

//Create REST API endpoints to perform CRUD operations for the Products table
//Create a product.
app.post("/create", async (req, res) => {
  console.log(req.body);
  for (const product of req.body) {
    const { ProductName, Price, StockQuantity } = product;
    await pool.query(
      "INSERT INTO products(ProductName,Price,StockQuantity) values(?,?,?)",
      [ProductName, Price, StockQuantity],
    );
    console.log("Product inserted successfully");
  }
  res.status(201).json({ message: "Product created successfully" });
});

//Retrieve all products
app.get("/retrieve", async (req, res) => {
  const [products] = await pool.query("SELECT * FROM products");
  console.log(products);
  res.status(200).json(products);
});

//Retrieve a product by ID
app.get("/retrieve/:id", async (req, res) => {
  const { id } = req.params;
  const [products] = await pool.query(
    "SELECT * FROM products WHERE ProductID =?",
    [id],
  );
  console.log(products);
  res.status(200).json(products);
});

//Update a product
app.patch("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { ProductName, Price, StockQuantity } = req.body;
  await pool.query(
    `UPDATE products SET  ProductName = ?, Price  = ?, StockQuantity  = ? WHERE ProductID = ?`,
    [ProductName, Price, StockQuantity, id],
  );
  res.status(200).json({ message: "Product updated successfully" });
});

//Delete a product
app.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query(`DELETE FROM products WHERE ProductID = ?`, [id]);
  res.status(200).json({ message: "Product deleted successfully" });
});

//Create REST API endpoints to perform CRUD operations for the Suppliers table
//Create a supplier
app.post("/supplier", async (req, res) => {
  console.log(req.body);
  for (const supplier of req.body) {
    const { supplierName, ContactNumber } = supplier;
    await pool.query(
      "INSERT INTO suppliers(supplierName,ContactNumber) values(?,?)",
      [supplierName, ContactNumber],
    );
    console.log("Supplier inserted successfully");
  }
  res.status(201).json({ message: "Supplier created successfully" });
});

//Retrieve all suppliers
app.get("/retrieveSupplier", async (req, res) => {
  const [Suppliers] = await pool.query("SELECT * FROM Suppliers");
  console.log(Suppliers);
  res.status(200).json(Suppliers);
});

//Update supplier information
app.patch("/updateSupplier/:id", async (req, res) => {
  const { id } = req.params;
  const { supplierName, ContactNumber } = req.body;
  await pool.query(
    `UPDATE Suppliers SET  supplierName = ?, ContactNumber = ? WHERE supplierID = ?`,
    [supplierName, ContactNumber, id],
  );
  res.status(200).json({ message: "Supplier updated successfully" });
});

//Delete a supplier
app.delete("/deletesupplier/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query(`DELETE FROM suppliers WHERE supplierID = ?`, [id]);
  res.status(200).json({ message: "supplier deleted successfully" });
});


//Create REST API endpoints to manage Sales
//Record a sale

//Retrieve all sales

//Retrieve sales for a specific product

async function startApp() {
  try {
    await connectToDatabase();
    const result = await pool.query("SELECT 1 as result");
    console.log("DB connected successfully");
    app.listen(port, () => {
      console.log(`server is running on port ${port}`);
    });
  } catch (err) {
    console.log("DB connection failed");
    console.log(err);
  }
}
startApp();
