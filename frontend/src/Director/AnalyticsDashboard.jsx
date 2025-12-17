import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AnalyticsDashboard() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/department/list");
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedDept) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/leave-request/analytics/department/${selectedDept}`);
      setAnalyticsData(res.data);
    } catch (err) {
      console.error(err);
      setAnalyticsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedDept]);

  const chartData = {
    labels: analyticsData.map(item => item.name),
    datasets: [
      {
        label: 'Total Leave Days',
        data: analyticsData.map(item => item.totalDays),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Faculty Leave Analytics (Current Year)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Leave Days'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Faculty'
        }
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Leave Analytics Dashboard</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Department
        </label>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a department</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.departmentName}
            </option>
          ))}
        </select>
      </div>

      {selectedDept && (
        <div>
          {loading ? (
            <div className="text-gray-500">Loading analytics...</div>
          ) : analyticsData.length === 0 ? (
            <p className="text-gray-500">No leave data found for this department in the current year.</p>
          ) : (
            <div>
              <Bar data={chartData} options={chartOptions} />
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Faculty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Leave Days
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Number of Leaves
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.map((item) => (
                        <tr key={item.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.totalDays}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.leaveCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
