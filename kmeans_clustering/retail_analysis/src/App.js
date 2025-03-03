import { useState, useEffect } from "react";

export default function Dashboard() {
  const [graphType, setGraphType] = useState("scatter");
  const [graphUrl, setGraphUrl] = useState("http://127.0.0.1:5000/graph/scatter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ age: "", income: "", spending: "", gender: "" });
  const [prediction, setPrediction] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const handleGraphChange = (type) => {
    setGraphType(type);
    setGraphUrl(`http://127.0.0.1:5000/graph/${type}`);
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    const img = new Image();
    img.src = graphUrl;
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setLoading(false);
      setError("Failed to load graph. Please try again.");
    };
  }, [graphUrl]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setPrediction(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to get prediction.");
      const data = await response.json();
      setPrediction(data.cluster);
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Customer Segmentation Dashboard</h1>

      {/* Graph Selection */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {["scatter", "bar", "box", "count"].map((type) => (
          <button
            key={type}
            onClick={() => handleGraphChange(type)}
            className={`px-4 py-2 rounded-lg text-white shadow-md transition duration-300 ${
              graphType === type ? "bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Plot
          </button>
        ))}
      </div>

      {/* Graph Display */}
      <div className="w-full flex justify-center">
        {loading ? (
          <p className="text-blue-600 font-semibold">Loading graph...</p>
        ) : error ? (
          <p className="text-red-600 font-semibold">{error}</p>
        ) : (
          <img src={graphUrl} alt={`${graphType} graph`} className="w-3/4 border rounded-lg shadow-md" />
        )}
      </div>

      {/* Prediction Form */}
      <div className="w-full max-w-lg mt-8 p-4 border rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Predict Customer Cluster</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleInputChange} className="p-2 border rounded" required />
          <input type="number" name="income" placeholder="Annual Income" value={formData.income} onChange={handleInputChange} className="p-2 border rounded" required />
          <input type="number" name="spending" placeholder="Spending Score" value={formData.spending} onChange={handleInputChange} className="p-2 border rounded" required />
          <select name="gender" value={formData.gender} onChange={handleInputChange} className="p-2 border rounded" required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Predict</button>
        </form>

        {submitError && <p className="text-red-600 mt-2">{submitError}</p>}
        {prediction !== null && <p className="text-blue-600 mt-2 font-semibold">Predicted Cluster: {prediction}</p>}
      </div>
    </div>
  );
}
