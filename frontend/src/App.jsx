import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateWill from "./pages/CreateWill";
import Authority from "./pages/Authority";
import CreateAsset from "./pages/CreateAsset";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-will" element={<CreateWill />} />
        <Route path="/authority" element={<Authority />} />
        <Route path="/create-asset" element={<CreateAsset />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
