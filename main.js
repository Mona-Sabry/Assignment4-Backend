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

//2-Create REST API endpoints to perform CRUD operations for the Products table
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
    `UPDATE products SET ProductName = ?, Price  = ?, StockQuantity  = ? WHERE ProductID = ?`,
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

//3-Create REST API endpoints to perform CRUD operations for the Suppliers table
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


// 4- Create REST API endpoints to manage Sales
//Record a sale
app.post("/recordSales", async (req, res) => {
  console.log(req.body);
  for (const sale of req.body) {
    const { quantitySold, salesDate } = sale;
    await pool.query(
      "INSERT INTO sales(quantitySold,salesDate) values(?,?)",
      [quantitySold, salesDate],
    );
    console.log("Sale inserted successfully");
  }
  res.status(201).json({ message: "Sale created successfully" });
});


//Retrieve all sales
app.get("/retrieveSales", async (req, res) => {
  const [sales] = await pool.query("SELECT * FROM Sales");
  console.log(sales);
  res.status(200).json(sales);
});


//Retrieve sales for a specific product
app.get("/retrieveSales/:id", async (req, res) => {
  const { id } = req.params;
  const [sales] = await pool.query(
    "SELECT * FROM sales WHERE saleID =?",
    [id],
  );
  console.log(sales);
  res.status(200).json(sales);
});

//5- Create API endpoints to perform the following database modifications
// Add a Category column to the Products table.
app.post("/addCategory",async(req,res)=>{
  try{
    await pool.query(`ALTER TABLE products ADD category  VARCHAR(100)
`);
res.json({message:`Category column added successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


// Remove the Category column. 
app.delete("/removeCategory",async(req,res)=>{
  try{
    await pool.query(`ALTER TABLE products DROP COLUMN category
`);
res.json({message:`Category column deleted successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


// Change ContactNumber to VARCHAR(15). 
app.post("/suppliers/contactNumber",async(req,res)=>{
  try{
    await pool.query(`ALTER TABLE suppliers MODIFY COLUMN  ContactNumber  VARCHAR(15)
`);
res.json({message:`ContactNumber changed successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


// Add a NOT NULL constraint to ProductName.
app.patch("/products/productName",async(req,res)=>{
  try{
    await pool.query(`ALTER TABLE products MODIFY COLUMN  productName  VARCHAR(100)  NOT NULL
`);
res.json({message:`ProductName changed successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


// 6- Create an API endpoint or initialization script to insert the following data 
//Add a supplier with the name 'FreshFoods' and contact number '01001234567'
app.post("/suppliers/add",async(req,res)=>{
  try{
    await pool.query(`INSERT INTO suppliers (supplierName,ContactNumber) VALUES ('FreshFoods','01001234567') 
`);
res.json({message:`FreshFoods added successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


// Insert the following three products, all provided by 'FreshFoods': 
//1-'Milk' with a price of 15.00 and stock quantity of 50.
//2-'Bread' with a price of 10.00 and stock quantity of 30.
//3-'Eggs' with a price of 20.00 and stock quantity of 40.
 app.post("/products/add",async(req,res)=>{
  try{
    await pool.query(`INSERT INTO products (ProductName,Price,StockQuantity, SupplierID) 
      VALUES ('Milk',15.00,50,2),
      ('Bread',10.00,30,2),
      ('Eggs',20.00,40,2)
`);
res.json({message:`Products added successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});

//Add a record for the sale of 2 units of 'Milk' made on '2025-05-20'. 
app.post("/sales/add", async (req, res) => {
try{
    await pool.query(`INSERT INTO sales (quantitySold,salesDate) 
      VALUES (2,'2025-05-20')
`);
res.json({message:`sale added successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


//7-Create an API endpoint to update the price of 'Bread' to 25.00
app.patch("/products/productName/bread",async(req,res)=>{
  try{
    await pool.query(`UPDATE products SET Price=25.00 WHERE productName='Bread'
`);
res.json({message:`Bread updated successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});

//8-Create an API endpoint to delete the product 'Eggs'
app.delete("/products/productName/eggs",async(req,res)=>{
  try{
    await pool.query(`DELETE FROM products WHERE productName='Eggs'
`);
res.json({message:`Eggs deleted successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


//9-Create a reporting endpoint to retrieve the total quantity sold for each product using SQL aggregate functions
app.get("/retrieveSales", async (req, res) => {
  try{
 const [sales] = await pool.query(`
   SELECT ProductID, SUM(quantitySold) AS totalQuantitySold
      FROM sales
      GROUP BY ProductID
 ` );

  res.status(200).json(sales);
  }
  catch(err){
      res.status(500).json(err);
  }
 
});


//10-Create a reporting endpoint to retrieve the product with the highest stock quantity
app.get("/retrieveHighestStock", async (req, res) => {
  try{
 const [products] = await pool.query(`
   SELECT * FROM products ORDER BY StockQuantity DESC LIMIT 1
    
 ` );

  res.status(200).json(products);
  }
  catch(err){
      res.status(500).json(err);
  }
 
});


//11-Create a reporting endpoint to retrieve suppliers whose names start with 'F'
app.get("/retrievesuppliers", async (req, res) => {
  try{
 const [suppliers] = await pool.query(`
   SELECT * FROM suppliers WHERE supplierName LIKE 'F%'
    
 ` );

  res.status(200).json(suppliers);
  }
  catch(err){
      res.status(500).json(err);
  }
 
});


//12-Create a reporting endpoint to retrieve all products that have never been sold
app.get("/retrieveFullStock", async (req, res) => {
  try{
 const [products] = await pool.query(`
   SELECT * FROM products p WHERE NOT EXISTS(
   SELECT 1
   FROM sales s
    WHERE s.ProductID = p.ProductID
  
   ) 
    
 ` );

  res.status(200).json(products);
  }
  catch(err){
      res.status(500).json(err);
  }
 
});


//13- Create a reporting endpoint to retrieve all sales including:   
// Product name 
// Quantity sold 
// Sale date using SQL JOIN operations. 
app.get("/retrieveAllSales", async (req, res) => {
  try{
 const [sales] = await pool.query(`
   SELECT p.ProductName, s.quantitySold , s.salesDate AS salesOfProduct
      FROM sales s
      LEFT JOIN products p
      ON s.ProductID = p.ProductID
 ` );

  res.status(200).json(sales);
  }
  catch(err){
      res.status(500).json(err);
  }
 
});

//14- Create a SQL script or secure administrative endpoint to create a MySQL user named store_manager and grant the 
//following permissions on all tables:/ 
// SELECT 
//INSERT 
// UPDATE  
app.post("/createStoreManager", async (req, res) => {
try{
    await pool.query(`CREATE USER 'store_manager'@'localhost'
      IDENTIFIED BY 'Store@123'
      
`);
await pool.query(`
  GRANT SELECT,INSERT,UPDATE ON trade.*  TO 'store_manager'@'localhost'
  `);
res.status(201).json({message:`store_manager created successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


//15- Revoke the UPDATE permission from “store_manager” 
app.delete("/revokeUpdate", async (req, res) => {
try{
await pool.query(`
  REVOKE UPDATE ON trade.* FROM 'store_manager'@'localhost'
  `);
res.status(200).json({message:`UPDATE permission revoked successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});



//16- Grant DELETE permission to “store_manager” only on the Sales table
app.delete("/deletePermission", async (req, res) => {
try{
await pool.query(`
GRANT DELETE ON trade.Sales To 'store_manager'@'localhost'
  `);
res.status(200).json({message:`DELETE permission granted successfully`});
  }
  catch(err){
res.status(500).json(err);
  }
});


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
