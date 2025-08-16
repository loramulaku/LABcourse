import React, { useEffect, useState } from 'react';

const Dashboard = () => {
  const [pacientet, setPacientet] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPacientet = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Duhet të kyçeni për të parë pacientët');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || 'Ka ndodhur një gabim');
        } else {
          setPacientet(data);
        }
      } catch (err) {
        console.error(err);
        setMessage('Gabim në lidhje me serverin');
      }
    };

    fetchPacientet();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard – Pacientët</h1>
      {message && <p className="text-red-500">{message}</p>}
      <ul>
        {pacientet.map(p => (
          <li key={p.id}>
            {p.name} – {p.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
