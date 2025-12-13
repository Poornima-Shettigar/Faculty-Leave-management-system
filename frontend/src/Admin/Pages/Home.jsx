import React from "react";
import { Link } from "react-router-dom";
//import bgImage1 from "../assets/pim.jpg";
// Use a placeholder for the background image
const bgImage = "https://poornaprajna.ac.in/img/pim.jpg";

function Home() {
  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url(${bgImage})`, 
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh' // Ensure it covers the viewport
      }}
    >
      <header className="text-center py-6 bg-white shadow">
        <div className="text-5xl">🎓</div>
        <h1 className="text-2xl md:text-3xl font-bold mt-2 text-gray-700" style={{color: '#374151'}}>
          Poornaprajna Institute of Management (PIM), Udupi
        </h1>
      </header>

      {/* NAVBAR */}
      <nav className="bg-blue-700 text-white py-4 shadow-md" style={{backgroundColor: '#1D4ED8'}}>
        <ul className="flex justify-center gap-6 text-lg font-medium" style={{display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '1.125rem', listStyle: 'none', padding: 0}}>
          <li><Link to="/admin-login" className="p-2 rounded hover:bg-blue-600" style={{padding: '0.5rem', borderRadius: '0.375rem', textDecoration: 'none', color: 'white'}}>Admin Login</Link></li>
          <li><Link to="/faculty-login" className="p-2 rounded hover:bg-blue-600" style={{padding: '0.5rem', borderRadius: '0.375rem', textDecoration: 'none', color: 'white'}}>Faculty Login</Link></li>
          <li><Link to="/non-teaching-login" className="p-2 rounded hover:bg-blue-600" style={{padding: '0.5rem', borderRadius: '0.375rem', textDecoration: 'none', color: 'white'}}>Non Teaching Login</Link></li>
          <li><Link to="/hod-login" className="p-2 rounded hover:bg-blue-600" style={{padding: '0.5rem', borderRadius: '0.375rem', textDecoration: 'none', color: 'white'}}>HOD Login</Link></li>
          <li><Link to="/director-login" className="p-2 rounded hover:bg-blue-600" style={{padding: '0.5rem', borderRadius: '0.375rem', textDecoration: 'none', color: 'white'}}>Director Login</Link></li>
        </ul>
      </nav>

      {/* HERO IMAGE */}
      <section className="relative w-full flex-1" style={{position: 'relative', flex: 1}}>
        <img src={bgImage} className="w-full h-[500px] object-cover" alt="Campus" style={{width: '100%', height: '500px', objectFit: 'cover'}} />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white p-4" style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '1rem'}}>
          <h2 className="text-3xl md:text-4xl font-bold text-center" style={{fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center'}}>Welcome to PIM</h2>
          <p className="mt-3 text-lg md:text-xl text-center" style={{marginTop: '0.75rem', fontSize: '1.25rem', textAlign: 'center'}}>
            Empowering Education, Leadership & Innovation
          </p>
        </div>
      </section>

      <footer className="bg-gray-800 text-white text-center py-4" style={{backgroundColor: '#1F2937', color: 'white', textAlign: 'center', padding: '1rem'}}>
        © 2025 Poornaprajna Institute of Management | All Rights Reserved
      </footer>
    </div>
  );
}

export default Home;