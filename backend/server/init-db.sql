-- sqlcmd -S localhost\SQLEXPRESS2 -U sa -P 12345678 -i init-db.sql
-- 1) Krijo databazën nëse mungon
IF DB_ID('labDB') IS NULL
  CREATE DATABASE labDB;
GO

-- 2) Kalohu në databazën e re
USE labDB;
GO

-- 3) Krijo tabelën Pacientet nëse mungon
IF OBJECT_ID('Pacientet','U') IS NULL
  CREATE TABLE Pacientet (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Emri NVARCHAR(50),
    Mbiemri NVARCHAR(50),
    Mosha INT,
    Gjinia NVARCHAR(10)
  );
GO

-- 4) Fshi çdo pacient ekzistues
DELETE FROM Pacientet;
GO

-- 5) Futo të dhënat e reja
INSERT INTO Pacientet (Emri, Mbiemri, Mosha, Gjinia)
VALUES 
  ('Erion',   'Hoxha',    30, 'Mashkull'),
  ('Drita',   'Marku',    25, 'Femer'),
  ('Behar',   'Marku',    25, 'Femer'),
  ('Fatmira', 'Sejdiu',   40, 'Femer');
GO
