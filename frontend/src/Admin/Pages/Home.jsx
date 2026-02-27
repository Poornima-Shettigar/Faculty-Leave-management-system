import React from "react";
import { Link } from "react-router-dom";

const bgImage = "https://poornaprajna.ac.in/img/pim.jpg";

function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-institutional-50">
      {/* Announcement Bar */}
      <div className="bg-primary-900 text-white py-3 overflow-hidden border-b border-primary-700">
        <style>
          {`
            @keyframes scroll {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
            .animate-scroll {
              display: inline-block;
              white-space: nowrap;
              animation: scroll 20s linear infinite;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
          `}
        </style>
        <div className="animate-scroll text-sm font-medium">
          📢 <strong>Notice:</strong> All faculty members are requested to submit their monthly leave plans by the 25th of every month. | ✨ New Feature: Real-time leave status tracking is now live! | 📧 For technical support, contact the Admin Department.
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-enterprise border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="w-16 h-16 bg-primary-600 rounded-enterprise-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">PIM</span>
              </div>
              <div className="text-5xl">🎓</div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight">
              Poornaprajna Institute of Management
            </h1>
            <p className="text-primary-600 font-semibold tracking-widest text-sm uppercase mt-2">
              Faculty Leave Management System
            </p>
            <p className="text-neutral-600 mt-2 text-sm">
              Udupi, Karnataka • Established 2006 • NAAC Accredited A+
            </p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200 shadow-enterprise-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 py-4">
            <Link 
              to="/admin-login" 
              className="enterprise-btn enterprise-btn-outline"
            >
              Admin Login
            </Link>
            <Link 
              to="/faculty-login" 
              className="enterprise-btn enterprise-btn-primary"
            >
              Faculty Login
            </Link>
            <Link 
              to="/hod-login" 
              className="enterprise-btn enterprise-btn-outline"
            >
              HOD Login
            </Link>
            <Link 
              to="/director-login" 
              className="enterprise-btn enterprise-btn-outline"
            >
              Director Login
            </Link>
            <Link 
              to="/non-teaching-login" 
              className="enterprise-btn enterprise-btn-outline"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight">
                Streamline Academic{' '}
                <span className="text-primary-600">Leave Management</span>
              </h2>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-lg">
                Apply for Casual Leave, Duty Leave, or Sick Leave with just one click. 
                Track approvals in real-time and manage your academic calendar effortlessly.
                Experience the Poornaprajna Super-Executive Development Model (PSEDM) in action.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link 
                  to="/faculty-login" 
                  className="enterprise-btn enterprise-btn-primary shadow-enterprise-lg hover:shadow-enterprise-xl transform hover:scale-[1.02]"
                >
                  Get Started
                </Link>
                <button className="enterprise-btn enterprise-btn-outline">
                  Learn More
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="enterprise-card text-center p-6 hover:shadow-enterprise-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl font-bold text-primary-600 mb-2">Apply</div>
                <div className="text-xs text-neutral-500 uppercase font-semibold tracking-wide">In Seconds</div>
              </div>
              <div className="enterprise-card text-center p-6 hover:shadow-enterprise-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl font-bold text-success-600 mb-2">Track</div>
                <div className="text-xs text-neutral-500 uppercase font-semibold tracking-wide">Real-time</div>
              </div>
              <div className="enterprise-card text-center p-6 hover:shadow-enterprise-md transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl font-bold text-warning-600 mb-2">Approve</div>
                <div className="text-xs text-neutral-500 uppercase font-semibold tracking-wide">On the Go</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About PIM Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              About Poornaprajna Institute of Management
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              A premier institution combining academic excellence with practical business knowledge and ethical values
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="enterprise-card p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏛️</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Heritage</h3>
              <p className="text-neutral-600 text-sm">
                Managed by Udupi Shree Adamaru Matha Education Council with 100+ years of value-based education
              </p>
            </div>
            
            <div className="enterprise-card p-6">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Academics</h3>
              <p className="text-neutral-600 text-sm">
                AICTE approved, affiliated with Mangalore University, NAAC A+ accredited MBA programs
              </p>
            </div>
            
            <div className="enterprise-card p-6">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">PSEDM Model</h3>
              <p className="text-neutral-600 text-sm">
                Poornaprajna Super-Executive Development Model focusing on experiential learning and leadership
              </p>
            </div>
            
            <div className="enterprise-card p-6">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏫</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Campus Life</h3>
              <p className="text-neutral-600 text-sm">
                Well-maintained campus with hostels, library, computer labs, auditorium, and sports facilities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4" style={{background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)'}}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold amazing-gradient-text mb-4">
              Amazing Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of leave management with cutting-edge features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="amazing-card-gradient text-center p-8 hover:shadow-2xl transition-all duration-300 amazing-hover-float" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-white/90">Submit and track leave requests in seconds, not hours</p>
            </div>
            
            <div className="amazing-card-gradient text-center p-8 hover:shadow-2xl transition-all duration-300 amazing-hover-float" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
              <p className="text-white/90">Get instant insights into leave patterns and approvals</p>
            </div>
            
            <div className="amazing-card-gradient text-center p-8 hover:shadow-2xl transition-all duration-300 amazing-hover-float" style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
              <p className="text-white/90">Enterprise-grade security for all your sensitive data</p>
            </div>
            
            <div className="amazing-card-gradient text-center p-8 hover:shadow-2xl transition-all duration-300 amazing-hover-float" style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Mobile Friendly</h3>
              <p className="text-white/90">Access system from any device, anywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Image Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-enterprise-xl overflow-hidden shadow-enterprise-xl">
            <img 
              src={bgImage} 
              className="w-full h-96 lg:h-[500px] object-cover" 
              alt="Poornaprajna Campus" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent flex flex-col items-center justify-end pb-12 text-white p-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
                Digitalizing Campus Workflow
              </h2>
              <p className="text-lg lg:text-xl text-center font-light max-w-2xl">
                Streamlining administrative tasks for excellence of Poornaprajna Institute of Management
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              We're here to help with all your leave management needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="enterprise-card p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 text-center">Campus Location</h3>
              <div className="space-y-2 text-sm text-neutral-600">
                <p><strong>Poornaprajna Institute of Management</strong></p>
                <p>Poornaprajna Campus, Volakkadu / Kadekoppala</p>
                <p>Chitpady, Udupi – 576101</p>
                <p>Karnataka, India</p>
              </div>
            </div>
            
            <div className="enterprise-card p-6">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 text-center">Contact Numbers</h3>
              <div className="space-y-2 text-sm text-neutral-600">
                <p>+91 820 2531401</p>
                <p>+91 93433 48392</p>
                <p>+91 91483 25164</p>
                <p className="text-xs text-neutral-500 mt-2">Office Hours: 8:30 AM – 6:00 PM</p>
              </div>
            </div>
            
            <div className="enterprise-card p-6">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 text-center">Email Addresses</h3>
              <div className="space-y-2 text-sm text-neutral-600">
                <p><strong>General:</strong> office@pim.ac.in</p>
                <p><strong>Admissions:</strong> pimudupi@yahoo.co.in</p>
                <p><strong>Contact Person:</strong> purushotham@pim.ac.in</p>
                <p><strong>Website:</strong> www.pim.ac.in</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Transform Leave Management?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join hundreds of faculty members already using our streamlined system at Poornaprajna Institute of Management
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/faculty-login" 
              className="enterprise-btn bg-white text-primary-600 hover:bg-neutral-50 font-semibold px-8 py-4 rounded-enterprise-lg shadow-enterprise-lg hover:shadow-enterprise-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              Login Now
            </Link>
            <button className="enterprise-btn border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold px-8 py-4 rounded-enterprise-lg transition-all duration-200">
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">About PIM</h3>
              <p className="text-sm">
                Established in 2006, Poornaprajna Institute of Management is committed to excellence in management education and administrative efficiency through the Poornaprajna Super-Executive Development Model.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/admin-login" className="hover:text-white transition-colors">Admin Portal</Link></li>
                <li><Link to="/faculty-login" className="hover:text-white transition-colors">Faculty Portal</Link></li>
                <li><Link to="/hod-login" className="hover:text-white transition-colors">HOD Portal</Link></li>
                <li><a href="https://www.pim.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Official Website</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Academics</h3>
              <ul className="space-y-2 text-sm">
                <li>MBA Programs</li>
                <li>NAAC A+ Accredited</li>
                <li>AICTE Approved</li>
                <li>Mangalore University Affiliated</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Contact Person:</strong> Mr. Purushotham Gowda</p>
                <p>📧 purushotham@pim.ac.in</p>
                <p>📱 +91 89715 08620</p>
                <p className="mt-2">Office Hours: 8:30 AM – 6:00 PM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-8 text-center text-sm">
            <p> 2026 Poornaprajna Institute of Management | Faculty Leave Management System | All Rights Reserved</p>
            <p className="mt-1">Poornaprajna Campus, Udupi, Karnataka - 576101 |  +91 820 2531401 |  www.pim.ac.in</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;