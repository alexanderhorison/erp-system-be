### Install All Dependencies

```
- npm install
```

```
Copy env.example to your local as .env
- Make sure FE and BE have same APP_SECRET_KEY
```


### UPDATE on Warehouse Rack (31 Juli 2024)
```
Ada update terhadap warehouse Rack dimana punya rak default, jika ada warehouse existing sebelumnya maka akan pasti mengalami error.
Update warehouseId sesuai yang di existing db

insert into "Master_Warehouse_Racks" 
(name, description, "warehouseId", "createdAt", "updatedAt") 
values 
('default', 'default rak', 6, now(), now()),
('default', 'default rak', 4, now(), now()),
('default', 'default rak', 5, now(), now())

```