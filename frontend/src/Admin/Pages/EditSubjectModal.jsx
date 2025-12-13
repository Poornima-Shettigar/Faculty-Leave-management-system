import React, { useEffect, useState } from "react";
import axios from "axios";

function EditSubjectModal({ subject, close, reload }) {
  const [subjectName, setSubjectName] = useState(subject.subjectName);
  const [subjectCode, setSubjectCode] = useState(subject.subjectCode);
  const [semester, setSemester] = useState(subject.semester || "");
  
  // ✅ NEW: State for Faculty
  // We check subject.faculty?._id because we populated it in the View page
  const [facultyId, setFacultyId] = useState(subject.faculty?._id || ""); 
  const [faculties, setFaculties] = useState([]);

  // ✅ NEW: Load Faculty List for this Subject's Department
  useEffect(() => {
    // We need the Department ID to fetch the correct teachers.
    // Since 'subject.department' is populated in the View page, we use ._id
    const deptId = subject.department?._id || subject.department;

    if (deptId) {
      axios.get(`http://localhost:5000/api/faculty/getByDept/${deptId}`)
        .then((res) => setFaculties(res.data))
        .catch((err) => console.error("Error loading faculty list", err));
    }
  }, [subject]);

  const handleUpdate = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/subject/edit/${subject._id}`,
        { 
          subjectName, 
          subjectCode,
          semester: Number(semester),
          faculty: facultyId // ✅ Send the updated Faculty ID
        }
      );

      reload(); // Refresh the list
      close();  // Close modal
    } catch (err) {
      alert("Failed to update subject");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40">
      <div className="bg-white p-7 rounded-lg w-96 shadow-xl">
        <h3 className="text-xl font-bold mb-4">Edit Subject</h3>

        {/* Subject Name */}
        <label className="block text-sm font-medium mb-1">Subject Name</label>
        <input
          type="text"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          className="border w-full p-2 rounded mb-3"
        />

        {/* Subject Code */}
        <label className="block text-sm font-medium mb-1">Subject Code</label>
        <input
          type="text"
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value)}
          className="border w-full p-2 rounded mb-3"
        />

        {/* Semester */}
        <label className="block text-sm font-medium mb-1">Semester</label>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="border w-full p-2 rounded mb-3"
          required
        >
          <option value="">-- Select Semester --</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </select>

        {/* ✅ NEW: Faculty Dropdown */}
        <label className="block text-sm font-medium mb-1">Faculty</label>
        <select
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value)}
          className="border w-full p-2 rounded mb-5 bg-white"
        >
          <option value="">-- Select Faculty --</option>
          {faculties.map((fac) => (
            <option key={fac._id} value={fac._id}>
              {fac.name}
            </option>
          ))}
        </select>

        <div className="flex justify-between">
          <button
            onClick={close}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditSubjectModal;