//frontend\src\dashboard\pages\TestCrud.jsx
import React, { useState, useEffect } from "react";

export default function TestCrud() {
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({ EmployeeName: "", EmployeeSurname: ""});
  const [contractForm, setContractForm] = useState({ ContractTitle: "",ContractDescription:"", EmployeeID: "" });

  useEffect(() => {
    fetch("http://localhost:5000/api/employees").then(r => r.json()).then(setEmployees);
    fetch("http://localhost:5000/api/contracts").then(r => r.json()).then(setContracts);
  }, []);

  const addEmployee = () => {
    fetch("http://localhost:5000/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeForm)
    }).then(() => window.location.reload());
  };

  const updateEmployee = () => {
    fetch(`http://localhost:5000/api/employees/${editingEmployee.EmployeeID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingEmployee)
    }).then(() => window.location.reload());
  };

  const deleteEmployee = (id) => {
    fetch(`http://localhost:5000/api/employees/${id}`, { method: "DELETE" })
      .then(() => window.location.reload());
  };

  const addContract = () => {
    fetch("http://localhost:5000/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contractForm)
    }).then(() => window.location.reload());
  };

  const updateContract = () => {
    fetch(`http://localhost:5000/api/contracts/${editingContract.ContractID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingContract)
    }).then(() => window.location.reload());
  };

  const deleteContract = (id) => {
    fetch(`http://localhost:5000/api/contracts/${id}`, { method: "DELETE" })
      .then(() => window.location.reload());
  };

  return (
    <div>
      <h2>Employee CRUD</h2>
      <input style={{color: 'black'}} placeholder="Name" onChange={e => setEmployeeForm({ ...employeeForm, EmployeeName: e.target.value })}/>
      <input style={{color: 'black'}} placeholder="Surname " onChange={e => setEmployeeForm({ ...employeeForm, EmployeeSurname: e.target.value })}/>
    
      <button onClick={addEmployee}>Add Employee</button>

      <h3>All Employees</h3>
      <ul>
        {employees.map(e => (
          <li key={e.LecturerID}>
            {e.EmployeeName} - {e.EmployeeSurname} 
            <button onClick={() => setEditingEmployee(e)}>Edit</button>
            <button onClick={() => deleteEmployee(e.EmployeeID)}>Delete</button>
          </li>
        ))}
      </ul>

      {editingEmployee && (
        <div>
          <input style={{color: 'black'}} value={editingEmployee.EmployeeName} onChange={e => setEditingEmployee({...editingEmployee, EmployeeName: e.target.value})} placeholder="Name"/>
          <input style={{color: 'black'}} value={editingEmployee.EmployeeSurname} onChange={e => setEditingEmployee({...editingEmployee, EmployeeSurname: e.target.value})} placeholder="Surname"/>
        
          <button onClick={updateEmployee}>Update</button>
          <button onClick={() => setEditingEmployee(null)}>Cancel</button>
        </div>
      )}

      <h2>Contract CRUD</h2>
      <input style={{color: 'black'}} placeholder="ContractTitle" onChange={e => setContractForm({ ...contractForm, ContractTitle: e.target.value })}/>
      <input style={{color: 'black'}} placeholder="ContractDescription" onChange={e => setContractForm({ ...contractForm, ContractDescription: e.target.value })}/>
      <select style={{color: 'black'}} onChange={e => setContractForm({ ...contractForm, EmployeeID: e.target.value })}>
        <option value="">Select Employee</option>
        {employees.map(e => <option key={e.EmployeeID} value={e.EmployeeID}>{e.EmployeeName}</option>)}
      </select>
      <button onClick={addContract}>Add Contract</button>

      <h3>All Contracts</h3>
      <ul>
        {contracts.map(c => (
          <li key={c.ContractID}>
            {c.ContractTitle} - {c.ContractDescription}-{c.EmployeeName}
            <button onClick={() => setEditingContract(c)}>Edit</button>
            <button onClick={() => deleteContract(c.ContractID)}>Delete</button>
          </li>
        ))}
      </ul>

      {editingContract && (
        <div>
          <input style={{color: 'black'}} value={editingContract.ContractTitle} onChange={e => setEditingContract({...editingContract, ContractTitle: e.target.value})} placeholder="ContractTitle"/>
          <input style={{color: 'black'}} value={editingContract.ContractDescription} onChange={e => setEditingContract({...editingContract, ContractDescription: e.target.value})} placeholder="ContractDescription "/>

          <select style={{color: 'black'}} value={editingContract.EmployeeID} onChange={e => setEditingContract({...editingContract, EmployeeID: e.target.value})}>
            <option value="">Select Contract</option>
            {employees.map(l => <option key={l.EmployeeID} value={l.EmployeeID}>{l.EmployeeName}</option>)}
          </select>
          <button onClick={updateContract}>Update</button>
          <button onClick={() => setEditingContract(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}