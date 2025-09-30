//frontend\src\dashboard\pages\TestCrud.jsx
import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/header/ui/button/Button";

export default function TestCrud() {
  const [lecturers, setLecturers] = useState([]);
  const [trains, setTrains] = useState([]);
  const [editingLecturer, setEditingLecturer] = useState(null);
  const [editingTrain, setEditingTrain] = useState(null);
  const [lecturerForm, setLecturerForm] = useState({ LecturerName: "", LecturerSurname: "", LecturerSpeciality:""});
  const [trainForm, setTrainForm] = useState({ TrainTitle: "", TrainDescription:"", LecturerID: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [lecturersRes, trainsRes] = await Promise.all([
          fetch("http://localhost:5000/api/lecturers"),
          fetch("http://localhost:5000/api/trains")
        ]);
        const lecturersData = await lecturersRes.json();
        const trainsData = await trainsRes.json();
        setLecturers(lecturersData);
        setTrains(trainsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const addLecturer = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/lecturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lecturerForm)
      });
      if (response.ok) {
        const newLecturer = await response.json();
        setLecturers([...lecturers, newLecturer]);
        setLecturerForm({ LecturerName: "", LecturerSurname: "", LecturerSpeciality: "" });
      }
    } catch (error) {
      console.error("Error adding lecturer:", error);
    }
  };

  const updateLecturer = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/lecturers/${editingLecturer.LecturerID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingLecturer)
      });
      if (response.ok) {
        const updatedLecturer = await response.json();
        setLecturers(lecturers.map(l => l.LecturerID === updatedLecturer.LecturerID ? updatedLecturer : l));
        setEditingLecturer(null);
      }
    } catch (error) {
      console.error("Error updating lecturer:", error);
    }
  };

  const deleteLecturer = async (id) => {
    if (!confirm("Are you sure you want to delete this lecturer?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/lecturers/${id}`, { method: "DELETE" });
      if (response.ok) {
        setLecturers(lecturers.filter(l => l.LecturerID !== id));
      }
    } catch (error) {
      console.error("Error deleting lecturer:", error);
    }
  };

  const addTrain = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/trains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trainForm)
      });
      if (response.ok) {
        const newTrain = await response.json();
        setTrains([...trains, newTrain]);
        setTrainForm({ TrainTitle: "", TrainDescription: "", LecturerID: "" });
      }
    } catch (error) {
      console.error("Error adding train:", error);
    }
  };

  const updateTrain = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/trains/${editingTrain.TrainID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTrain)
      });
      if (response.ok) {
        const updatedTrain = await response.json();
        setTrains(trains.map(t => t.TrainID === updatedTrain.TrainID ? updatedTrain : t));
        setEditingTrain(null);
      }
    } catch (error) {
      console.error("Error updating train:", error);
    }
  };

  const deleteTrain = async (id) => {
    if (!confirm("Are you sure you want to delete this train?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/trains/${id}`, { method: "DELETE" });
      if (response.ok) {
        setTrains(trains.filter(t => t.TrainID !== id));
      }
    } catch (error) {
      console.error("Error deleting train:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <PageMeta title="Test CRUD" description="Manage lecturers and trains" />
        <PageBreadcrumb pageTitle="Test CRUD" />
        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <PageMeta title="Test CRUD" description="Manage lecturers and trains" />
      <PageBreadcrumb pageTitle="Test CRUD" />

      {/* Lecturers Section */}
      <ComponentCard title="Lecturers Management" desc="Add, edit, and manage lecturers">
        <div className="space-y-6">
          {/* Add Lecturer Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Lecturer Name"
              value={lecturerForm.LecturerName}
              onChange={e => setLecturerForm({ ...lecturerForm, LecturerName: e.target.value })}
            />
            <input
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Lecturer Surname"
              value={lecturerForm.LecturerSurname}
              onChange={e => setLecturerForm({ ...lecturerForm, LecturerSurname: e.target.value })}
            />
            <input
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Lecturer Speciality"
              value={lecturerForm.LecturerSpeciality}
              onChange={e => setLecturerForm({ ...lecturerForm, LecturerSpeciality: e.target.value })}
            />
          </div>
          <Button variant="primary" onClick={addLecturer}>
            Add Lecturer
          </Button>

          {/* Lecturers List */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-gray-600">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Surname</th>
                  <th className="py-2 pr-4">Speciality</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map(lecturer => (
                  <tr key={lecturer.LecturerID} className="border-t border-gray-200">
                    <td className="py-2 pr-4 font-medium">{lecturer.LecturerName}</td>
                    <td className="py-2 pr-4">{lecturer.LecturerSurname}</td>
                    <td className="py-2 pr-4">{lecturer.LecturerSpeciality}</td>
                    <td className="py-2 pr-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingLecturer(lecturer)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteLecturer(lecturer.LecturerID)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lecturers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No lecturers found.</p>
              </div>
            )}
          </div>

          {/* Edit Lecturer Form */}
          {editingLecturer && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-4">Edit Lecturer</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Lecturer Name"
                  value={editingLecturer.LecturerName}
                  onChange={e => setEditingLecturer({...editingLecturer, LecturerName: e.target.value})}
                />
                <input
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Lecturer Surname"
                  value={editingLecturer.LecturerSurname}
                  onChange={e => setEditingLecturer({...editingLecturer, LecturerSurname: e.target.value})}
                />
                <input
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Lecturer Speciality"
                  value={editingLecturer.LecturerSpeciality}
                  onChange={e => setEditingLecturer({...editingLecturer, LecturerSpeciality: e.target.value})}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="primary" onClick={updateLecturer}>
                  Update
                </Button>
                <Button variant="outline" onClick={() => setEditingLecturer(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Trains Section */}
      <ComponentCard title="Trains Management" desc="Add, edit, and manage training courses">
        <div className="space-y-6">
          {/* Add Train Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Train Title"
              value={trainForm.TrainTitle}
              onChange={e => setTrainForm({ ...trainForm, TrainTitle: e.target.value })}
            />
            <input
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Train Description"
              value={trainForm.TrainDescription}
              onChange={e => setTrainForm({ ...trainForm, TrainDescription: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={trainForm.LecturerID}
              onChange={e => setTrainForm({ ...trainForm, LecturerID: e.target.value })}
            >
              <option value="">Select Lecturer</option>
              {lecturers.map(lecturer => (
                <option key={lecturer.LecturerID} value={lecturer.LecturerID}>
                  {lecturer.LecturerName} - {lecturer.LecturerSurname}
                </option>
              ))}
            </select>
            <Button variant="primary" onClick={addTrain}>
              Add Train
            </Button>
          </div>

          {/* Trains List */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-gray-600">
                <tr>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Lecturer</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trains.map(train => (
                  <tr key={train.TrainID} className="border-t border-gray-200">
                    <td className="py-2 pr-4 font-medium">{train.TrainTitle}</td>
                    <td className="py-2 pr-4">{train.TrainDescription}</td>
                    <td className="py-2 pr-4">{train.LecturerName}</td>
                    <td className="py-2 pr-4 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingTrain(train)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteTrain(train.TrainID)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trains.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No trains found.</p>
              </div>
            )}
          </div>

          {/* Edit Train Form */}
          {editingTrain && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-4">Edit Train</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Train Title"
                  value={editingTrain.TrainTitle}
                  onChange={e => setEditingTrain({...editingTrain, TrainTitle: e.target.value})}
                />
                <input
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Train Description"
                  value={editingTrain.TrainDescription}
                  onChange={e => setEditingTrain({...editingTrain, TrainDescription: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <select
                  className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={editingTrain.LecturerID}
                  onChange={e => setEditingTrain({...editingTrain, LecturerID: e.target.value})}
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.LecturerID} value={lecturer.LecturerID}>
                      {lecturer.LecturerName} - {lecturer.LecturerSurname}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={updateTrain}>
                    Update
                  </Button>
                  <Button variant="outline" onClick={() => setEditingTrain(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}