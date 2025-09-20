import React, { useEffect, useState } from "react";

const UserSimple = () => {
  const [name, setName] = useState(""); // për inputin e emrit
  const [users, setUsers] = useState([]); // për listën e përdoruesve

  // Merr përdoruesit nga backend kur ngarkohet komponenti
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error(err));
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // parandalon rifreskimin e faqes

    if (!name) return alert("Shkruaj emrin!");

    fetch("http://localhost:5000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setName(""); // pastro inputin
        fetchUsers(); // rifresko listën me përdoruesit
      })
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <h2>Shto përdorues të ri</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Shkruaj emrin"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Shto</button>
      </form>

      <h3>Lista e përdoruesve:</h3>
      <ul>
        {users.length === 0 && <li>Nuk ka përdorues</li>}
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default UserSimple;
