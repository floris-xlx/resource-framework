import { Routes, Route, NavLink } from "react-router-dom";
import { Home } from "./pages/Home";
import { Config } from "./pages/Config";

export function App() {
  return (
    <div className="container">
      <nav className="nav">
        <div className="brand">Resource Framework</div>
        <div className="links">
          <NavLink to="/" end>Demo</NavLink>
          <NavLink to="/config">Config</NavLink>
          <a href="../docs/index.md">Docs</a>
          <a href="https://xylex.group" target="_blank" rel="noreferrer">XYLEX Group</a>
        </div>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/config" element={<Config />} />
        </Routes>
      </main>
      <footer className="footer">
        MIT © XYLEX Group — <a href="https://xylex.group" target="_blank" rel="noreferrer">https://xylex.group</a>
      </footer>
    </div>
  );
}


