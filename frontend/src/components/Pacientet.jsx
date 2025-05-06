import { useEffect, useState } from 'react';

const Pacientet = () => {
  const [pacientet, setPacientet] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/pacientet')
      .then(res => res.json())
      .then(data => {
        console.log('Përgjigja nga API:', data); // për të parë çfarë merr
        setPacientet(data);
      })
      .catch(err => {
        console.error('Gabim gjatë marrjes së pacientëve:', err);
        setPacientet([]); // parandalon crash
      });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Lista e Pacientëve</h2>
      {Array.isArray(pacientet) ? (
        <ul>
          {pacientet.map(p => (
            <li key={p.ID}>
              {p.Emri} {p.Mbiemri} – {p.DataLindjes}
            </li>
          ))}
        </ul>
      ) : (
        <p>Gabim: të dhënat nuk janë listë.</p>
      )}
    </div>
  );
};

export default Pacientet;
