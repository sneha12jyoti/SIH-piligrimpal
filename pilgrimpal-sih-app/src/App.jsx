import React, { useState, useEffect } from 'react';
// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, isSignInWithEmailLink } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Icon Imports
import { Menu, X, Home, Map, Ticket, Bell, Heart, User, Calendar, Phone, Navigation, Clock, Users, Zap, Camera, Gift, BookOpen, Info, Mountain, Star, Search, CheckCircle, Car, Train, PersonStanding, LogIn, LogOut, Loader, CreditCard, QrCode } from 'lucide-react';

// Static Data for TemplesPage
const ALL_TEMPLES = [
    { name: 'Somnath Temple', city: 'Veraval', deity: 'Lord Shiva', dist: '2.1 km', rating: 4.8, category: 'Shiva' },
    { name: 'Dwarkadhish Temple', city: 'Dwarka', deity: 'Lord Krishna', dist: '3.2 km', rating: 4.9, category: 'Krishna' },
    { name: 'Ambaji Temple', city: 'Banaskantha', deity: 'Maa Ambaji', dist: '5.8 km', rating: 4.7, category: 'Shakti' },
    { name: 'Akshardham', city: 'Gandhinagar', deity: 'Swaminarayan', dist: '8.1 km', rating: 4.9, category: 'Swaminarayan' },
    { name: 'Shamlaji Temple', city: 'Aravalli', deity: 'Lord Vishnu', dist: '12.4 km', rating: 4.6, category: 'Krishna' },
    { name: 'Palitana Temples', city: 'Bhavnagar', deity: 'Jain Tirthankaras', dist: '18.7 km', category: 'Jain' },
    { name: 'Becharaji Temple', city: 'Mehsana', deity: 'Bahucharaji', dist: '22.3 km', rating: 4.5, category: 'Shakti' }
];

// The main application component
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingTemple, setBookingTemple] = useState(null);
  const [directionsTemple, setDirectionsTemple] = useState(null);

  // --- New State for QR Code Feature ---
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [currentQrTicket, setCurrentQrTicket] = useState(null);

  // --- Firebase State ---
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // State to manage user's booked tickets (now dynamic)
  const [myTickets, setMyTickets] = useState([
    { temple: 'Somnath Temple', date: '2025-10-01, 7:00 AM', status: 'Confirmed', queueNo: 'S-142', location: 'Veraval', pilgrims: 3, bookedBy: 'Ramesh Patel' },
    { temple: 'Dwarkadhish Temple', date: '2025-12-18, 6:30 AM', status: 'Pending', queueNo: 'D-089', location: 'Dwarka', pilgrims: 1, bookedBy: 'Ramesh Patel' }
  ]);

  // --- Firebase Initialization and Auth Logic ---
  useEffect(() => {
    const initializeFirebase = async () => {
        try {
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
            if (!firebaseConfig) {
                console.error("Firebase configuration not found. Running in mock mode.");
                setIsAuthReady(true);
                setUserId(crypto.randomUUID()); // Mock userId for unauthenticated testing
                return;
            }

            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);

            setAuth(authInstance);
            setDb(dbInstance);

            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

            // 1. Set up Auth State Listener
            const unsubAuth = onAuthStateChanged(authInstance, (user) => {
                if (user) {
                    setUserId(user.uid);
                    console.log("Authenticated User ID:", user.uid);
                } else {
                    setUserId(null); 
                    console.log("User signed out or failed sign-in.");
                }
                setIsAuthReady(true); // Auth state is known and ready
            });

            // 2. Perform Initial Sign-in
            if (initialAuthToken) {
                console.log("Attempting sign-in with custom token...");
                await signInWithCustomToken(authInstance, initialAuthToken);
            } else {
                console.log("Attempting anonymous sign-in...");
                await signInAnonymously(authInstance);
            }

            // Clean up listener on unmount
            return () => unsubAuth();

        } catch (error) {
            console.error("Firebase initialization or sign-in failed:", error);
            setIsAuthReady(true); // Mark as ready even on failure to avoid endless loading
            setUserId(null);
        }
    };
    initializeFirebase();
  }, []);
  
  // --- Components for Navigation and UI ---

  const Header = () => (
    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 shadow-lg sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-full p-2">
            <Heart className="w-6 h-6 text-orange-600" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold">PilgrimPal</h1>
            <p className="text-xs text-orange-100">Gujarat Temples</p>
          </div>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {menuOpen && (
        // Dropdown Menu for all pages
        <div className="mt-4 bg-white rounded-lg text-gray-800 shadow-xl absolute w-[90%] left-1/2 -translate-x-1/2 z-20">
          <div className="p-2">
            {[
              { id: 'home', label: 'Home', icon: Home, visible: !!userId },
              { id: 'temples', label: 'Gujarat Temples', icon: Map, visible: !!userId },
              { id: 'tickets', label: 'My Tickets', icon: Ticket, visible: !!userId },
              { id: 'live', label: 'Live Darshan', icon: Camera, visible: !!userId },
              { id: 'donate', label: 'Donate', icon: Gift, visible: !!userId },
              { id: 'profile', label: userId ? 'Profile' : 'Sign In', icon: User, visible: true }
            ].filter(item => item.visible).map(item => (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id === 'profile' && !userId ? 'auth' : item.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg transition"
              >
                <item.icon className="w-5 h-5 text-orange-600" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 shadow-lg z-20">
      <div className="flex justify-around py-2">
        {[
          { id: 'home', icon: Home, label: 'Home', visible: !!userId },
          { id: 'temples', icon: Map, label: 'Temples', visible: !!userId },
          { id: 'tickets', icon: Ticket, label: 'Tickets', visible: !!userId },
          { id: 'live', icon: Camera, label: 'Live', visible: !!userId },
          { id: 'profile', icon: User, label: 'Profile', visible: !!userId },
          { id: 'auth', icon: LogIn, label: 'Sign In', visible: !userId }
        ].filter(item => item.visible).map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id === 'auth' ? 'auth' : item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              currentPage === item.id || (item.id === 'auth' && currentPage === 'auth') 
                ? 'text-orange-600 font-bold' 
                : 'text-gray-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
  
  // --- QR Code Modal Component ---
  const QRCodeModal = () => {
    if (!qrCodeModalOpen || !currentQrTicket) return null;

    // Use currentQrTicket data for display
    const ticket = currentQrTicket;
    
    return (
      // Modal Overlay
      <div className="fixed inset-0 bg-black bg-opacity-70 z-30 flex items-center justify-center p-4" onClick={() => setQrCodeModalOpen(false)}>
        {/* Modal Content Card */}
        <div 
          className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <QrCode className='w-6 h-6 text-orange-600'/> E-Darshan Pass
            </h3>
            <button onClick={() => setQrCodeModalOpen(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Simulated QR Code Area */}
          <div className="bg-gray-gray-100 p-6 rounded-xl flex flex-col items-center justify-center border-4 border-dashed border-gray-300 mb-6">
            <div className="w-48 h-48 bg-gray-900 rounded-lg flex items-center justify-center p-3">
              {/* Visual Placeholder to look like a QR code structure */}
              <div className="grid grid-cols-8 gap-0.5 p-1 w-full h-full">
                {[...Array(64)].map((_, i) => (
                  <div 
                    key={i} 
                    // Randomly color some squares for QR code effect
                    className={`rounded-sm ${Math.random() > 0.5 ? 'bg-orange-400' : 'bg-orange-600'} ${i % 7 === 0 ? 'h-3 w-3' : 'h-full w-full'}`}
                  ></div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 font-medium">SCAN CODE AT GATE</p>
          </div>

          {/* Ticket Details */}
          <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700">Temple:</p>
              <p className="font-bold text-lg text-orange-700 mb-2">{ticket.temple}</p>

              <div className="flex justify-between items-center mb-1">
                <div className="w-1/2">
                    <p className="text-sm font-medium text-gray-700">Queue No:</p>
                    <p className="font-bold text-xl text-gray-800">{ticket.queueNo}</p>
                </div>
                <div className="w-1/2 text-right">
                    <p className="text-sm font-medium text-gray-700">Date & Time:</p>
                    <p className="font-bold text-md text-gray-800">{ticket.date}</p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">Ticket valid for **{ticket.pilgrims} pilgrims** | Booked by {ticket.bookedBy}</p>
          </div>
          
        </div>
      </div>
    );
  };

  // --- Login Page Component (AuthGate) ---
  const AuthGate = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleSimulatedSignIn = async () => {
        setIsSigningIn(true);
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        
        if (!auth) {
          console.error("Auth not initialized. Running mock sign-in.");
          // Fallback logic for mock environment
          setUserId(crypto.randomUUID());
          setIsSigningIn(false);
          setCurrentPage('home');
          return;
        }

        try {
          // In a real environment, you'd use signInWithEmailAndPassword or Google login.
          // Here we use anonymous sign-in if Firebase is initialized in the runtime.
          await signInAnonymously(auth);
          setCurrentPage('home');
        } catch (error) {
          console.error("Manual anonymous sign-in failed:", error);
        }
        setIsSigningIn(false);
    };

    return (
      <div className="p-6 pb-20 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl p-8 shadow-2xl w-full">
          <div className="text-center mb-6">
            <LogIn className="w-10 h-10 text-orange-600 mx-auto mb-2" />
            <h2 className="text-3xl font-bold text-gray-800">Welcome to PilgrimPal</h2>
            <p className="text-gray-500 mt-2">Sign in to book tickets, save preferences, and access personalized features.</p>
          </div>

          <div className='mb-4'>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Simulated)</label>
            <input 
              type="email" 
              placeholder="pilgrim@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={isSigningIn}
            />
          </div>
          <div className='mb-6'>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (Simulated)</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={isSigningIn}
            />
          </div>

          <button 
            onClick={handleSimulatedSignIn}
            disabled={isSigningIn}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-4 rounded-xl shadow-lg transition hover:from-orange-700 hover:to-red-700 disabled:opacity-70"
          >
            <div className='flex items-center justify-center gap-2'>
              {isSigningIn ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In / Sign Up</span>
                </>
              )}
            </div>
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            By proceeding, you agree to the simulated Terms of Service.
          </p>
        </div>

        <div className="mt-6 text-center">
            <p className='text-sm text-gray-500 font-bold mb-2'>Current User ID (for debugging)</p>
            <p className='text-xs text-gray-600 break-all p-3 bg-white rounded-lg shadow-inner'>
                {userId || 'N/A (Signed Out)'}
            </p>
        </div>
        {/* technoova Credit */}
        <p className="text-center text-xs text-gray-400 mt-6">
            <span className='font-bold text-gray-500'>PilgrimPal</span> made by technoova
        </p>
      </div>
    );
  };
  
  // --- Page Components ---

  const HomePage = () => (
    <div className="p-4 pb-20">
      {/* Featured Temple */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm mb-1">Featured Today</p>
            <h2 className="text-2xl font-bold">Somnath Temple</h2>
            <p className="text-orange-100 text-sm mt-1">Prabhas Patan, Veraval</p>
          </div>
          <div className="bg-white/20 rounded-full p-2">
            <Zap className="w-6 h-6" />
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/20 rounded-lg p-3 flex-1">
            <Clock className="w-4 h-4 mb-1" />
            <p className="text-xs">Wait Time</p>
            <p className="font-bold text-lg">1.5 hrs</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3 flex-1">
            <Users className="w-4 h-4 mb-1" />
            <p className="text-xs">Crowd</p>
            <p className="font-bold text-lg">Medium</p>
          </div>
        </div>
        <button onClick={() => { setBookingTemple(ALL_TEMPLES[0]); setCurrentPage('book-darshan'); }} className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl mt-4 shadow-lg hover:bg-gray-100 transition">
          Book Darshan Pass
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Ticket, label: 'Book', color: 'bg-blue-100 text-blue-600', page: 'temples' },
            { icon: Camera, label: 'Live', color: 'bg-purple-100 text-purple-600', page: 'live' },
            { icon: Navigation, label: 'Navigate', color: 'bg-green-100 text-green-600', page: 'temples' },
            { icon: Gift, label: 'Prasadam', color: 'bg-pink-100 text-pink-600', page: 'donate' }
          ].map((action, idx) => (
            <button key={idx} onClick={() => setCurrentPage(action.page)} className={`${action.color} rounded-xl p-4 flex flex-col items-center gap-2 shadow hover:opacity-80 transition`}>
              <action.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Gujarat Temples */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">Popular Temples</h3>
          <button onClick={() => setCurrentPage('temples')} className="text-orange-600 text-sm font-medium hover:text-orange-800">See All</button>
        </div>
        <div className="space-y-3">
          {ALL_TEMPLES.slice(0, 3).map((temple, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{temple.name}</h4>
                  <p className="text-xs text-gray-400 mb-1">{temple.deity}</p>
                  <p className="text-sm text-gray-600">{temple.city}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
                      <Clock className="inline w-3 h-3 mr-1" /> 1.5 hrs
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      <Users className="inline w-3 h-3 mr-1" /> Medium
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      <Navigation className="inline w-3 h-3 mr-1" /> {temple.dist}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => { setDirectionsTemple(temple); setCurrentPage('directions'); }}
                  className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const TemplesPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'Shiva', 'Krishna', 'Shakti', 'Swaminarayan', 'Jain'];

    const filteredTemples = ALL_TEMPLES.filter(temple => {
      const matchesCategory = selectedCategory === 'All' || temple.category === selectedCategory;
      const matchesSearch = temple.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            temple.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return (
      <div className="p-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gujarat Temples</h2>
        
        {/* Search Input */}
        <div className="mb-4 relative">
          <input 
            type="text" 
            placeholder="Search temples by name or city..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Temple Categories Filter */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat, idx) => (
            <button 
              key={idx}
              onClick={() => {
                setSelectedCategory(cat);
                setSearchQuery(''); 
              }}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
                selectedCategory === cat ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Temple List */}
        <div className="space-y-3">
          {filteredTemples.length > 0 ? (
            filteredTemples.map((temple, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 shadow border border-gray-100 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{temple.name}</h4>
                    <p className="text-xs text-gray-400">{temple.deity} ({temple.category})</p>
                    <p className="text-sm text-gray-600 mt-1">{temple.city}, Gujarat</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-600 font-bold">
                      <Star fill="currentColor" className="w-4 h-4" />
                      <span>{temple.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{temple.dist}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => { 
                      setBookingTemple(temple);
                      setCurrentPage('book-darshan');
                    }}
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition"
                  >
                    Book Darshan
                  </button>
                  <button 
                    onClick={() => { setDirectionsTemple(temple); setCurrentPage('directions'); }}
                    className="flex-1 border-2 border-orange-600 text-orange-600 py-2 rounded-lg text-sm font-medium hover:bg-orange-50 transition"
                  >
                    Directions
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow mt-4">
              <Map className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No temples found matching your search and filter criteria.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-3 text-sm text-orange-600 font-medium hover:text-orange-800"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BookingPage = ({ temple, setMyTickets, setCurrentPage }) => {
    const today = new Date().toISOString().split('T')[0];
    const defaultTimeSlot = '07:00 - 08:00 AM';
    const timeSlots = ['07:00 - 08:00 AM', '09:00 - 10:00 AM', '11:00 - 12:00 PM', '04:00 - 05:00 PM', '06:00 - 07:00 PM'];
    
    const [bookingDate, setBookingDate] = useState(today);
    const [bookingTime, setBookingTime] = useState(defaultTimeSlot);
    const [pilgrims, setPilgrims] = useState(1);
    const [pilgrimName, setPilgrimName] = useState('');
    const [pilgrimPhone, setPilgrimPhone] = useState('');

    if (!temple) {
      return (
        <div className="p-4 pt-20 text-center text-gray-600">
          No temple selected for booking. <br/>
          <button onClick={() => setCurrentPage('temples')} className='text-orange-600 font-medium mt-2'>Go to Temples</button>
        </div>
      );
    }

    const handleConfirmBooking = () => {
      if (!pilgrimName || pilgrimPhone.length !== 10 || pilgrims === 0) {
          console.log('Please fill in required fields correctly.');
          return;
      }

      const newTicket = {
        temple: temple.name,
        date: `${bookingDate}, ${bookingTime}`,
        status: 'Confirmed',
        queueNo: `${temple.name.substring(0, 1).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
        location: temple.city,
        pilgrims: pilgrims,
        bookedBy: pilgrimName,
      };

      setMyTickets(prevTickets => [newTicket, ...prevTickets]);
      setBookingTemple(null); // Clear booking context
      setCurrentPage('tickets'); // Navigate to tickets page
    };

    return (
      <div className="p-4 pb-20">
        <button onClick={() => setCurrentPage('temples')} className="text-orange-600 text-sm font-medium mb-4 flex items-center gap-1">
            <Navigation className='w-4 h-4 rotate-180'/> Back to Temples
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Book Darshan Pass</h2>
        <h3 className="text-xl font-bold text-orange-600 mb-6">{temple.name}</h3>

        {/* Step 1: Date Selection */}
        <div className="bg-white rounded-xl p-4 shadow mb-6">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Calendar className='w-5 h-5 text-orange-600'/> Select Date</h4>
          <input 
            type="date" 
            value={bookingDate}
            min={today}
            onChange={(e) => setBookingDate(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Step 2: Time Slot */}
        <div className="bg-white rounded-xl p-4 shadow mb-6">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Clock className='w-5 h-5 text-orange-600'/> Select Time Slot</h4>
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setBookingTime(slot)}
                className={`py-2 rounded-lg font-medium transition ${
                  bookingTime === slot 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-orange-50'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Pilgrim Details */}
        <div className="bg-white rounded-xl p-4 shadow mb-6">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Users className='w-5 h-5 text-orange-600'/> Pilgrim Details</h4>
          
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Pilgrims (Max 5)</label>
          <input 
            type="number" 
            value={pilgrims}
            min="1"
            max="5"
            onChange={(e) => setPilgrims(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full p-3 mb-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Required)</label>
          <input 
            type="text" 
            placeholder="Enter lead pilgrim's name" 
            value={pilgrimName}
            onChange={(e) => setPilgrimName(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Required)</label>
          <input 
            type="tel" 
            placeholder="Enter contact number (10 digits)" 
            value={pilgrimPhone}
            onChange={(e) => setPilgrimPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Final Action */}
        <div className="bg-orange-50 rounded-xl p-4 shadow mb-4">
          <p className="text-sm font-medium text-gray-700 flex justify-between">
            Ticket Cost:
            <span className="font-bold text-orange-600">₹0 (Free)</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Note: Donation is optional and separate.</p>
        </div>

        <button 
          onClick={handleConfirmBooking}
          disabled={!pilgrimName || pilgrimPhone.length !== 10 || pilgrims === 0}
          className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-green-800"
        >
          <div className='flex items-center justify-center gap-2'>
            <CheckCircle fill="currentColor" className="w-5 h-5" />
            <span>Confirm Booking for {temple.name}</span>
          </div>
        </button>
      </div>
    );
  };

  const DirectionsPage = ({ temple, setCurrentPage }) => {
    const [mode, setMode] = useState('Car'); // 'Car', 'Train', 'Walk'

    if (!temple) {
      return (
        <div className="p-4 pt-20 text-center text-gray-600">
          No destination selected. <br/>
          <button onClick={() => setCurrentPage('temples')} className='text-orange-600 font-medium mt-2'>Go to Temples</button>
        </div>
      );
    }
    
    // Parse distance from static data (e.g., "2.1 km") or use a default large value for simulation
    const distanceKm = parseFloat(temple.dist.replace(' km', '')) || 15.0; 
    let travelTime = 0;

    // Simulated travel time calculation based on mode and distance
    switch (mode) {
      case 'Car':
        // Average speed 40 km/h
        travelTime = (distanceKm / 40) * 60; // in minutes
        break;
      case 'Train':
        // Simulating fixed time for longer inter-city travel (e.g., waiting + travel)
        travelTime = distanceKm < 10 ? distanceKm * 4 : 120 + distanceKm * 2; // Fixed base + variable component
        break;
      case 'Walk':
      default:
        // Average walking speed 5 km/h
        travelTime = (distanceKm / 5) * 60; // in minutes
        break;
    }
    
    // Format time: convert minutes to hours/minutes
    const totalMinutes = Math.ceil(travelTime);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const formattedTime = hours > 0 
      ? `${hours} hr ${minutes} min` 
      : `${minutes} min`;

    const transportModes = [
      { id: 'Car', icon: Car, label: 'Car' },
      { id: 'Train', icon: Train, label: 'Train' },
      { id: 'Walk', icon: PersonStanding, label: 'Walk' }, 
    ];

    return (
      <div className="p-4 pb-20">
        <button onClick={() => setCurrentPage('temples')} className="text-orange-600 text-sm font-medium mb-4 flex items-center gap-1">
            <Navigation className='w-4 h-4 rotate-180'/> Back to Temples
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Directions to Temple</h2>
        
        {/* Route Card */}
        <div className="bg-white rounded-xl p-5 shadow-xl mb-6 border-2 border-orange-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex flex-col items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <div className="w-px h-10 bg-gray-300 my-1"></div>
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-xs text-gray-500">Your Current Location</p>
                <p className="font-medium text-gray-700 truncate">Gujarat State Tourism Office, Gandhinagar (Simulated)</p>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg">
                <p className="text-xs text-gray-500">Destination</p>
                <p className="font-medium text-orange-700">{temple.name}, {temple.city}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl p-4 flex justify-around items-center text-center shadow-lg">
            <div>
              <p className="text-sm font-light opacity-80">Distance</p>
              <p className="text-2xl font-bold mt-1">{distanceKm.toFixed(1)} km</p>
            </div>
            <div className="w-px h-10 bg-orange-400"></div>
            <div>
              <p className="text-sm font-light opacity-80">Estimated Time</p>
              <p className="text-2xl font-bold mt-1">{formattedTime}</p>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <h3 className="text-lg font-bold text-gray-800 mb-3">Choose Mode of Transport</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {transportModes.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex flex-col items-center p-4 rounded-xl shadow-md transition ${
                mode === m.id 
                ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <m.icon className="w-6 h-6 mb-1" />
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Live Navigation Button */}
        <button 
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:from-green-600 hover:to-blue-600 transition"
        >
          <div className='flex items-center justify-center gap-2'>
            <Navigation fill="currentColor" className="w-5 h-5" />
            <span>Start Live Navigation</span>
          </div>
        </button>

      </div>
    );
  };
  
  const TicketsPage = () => (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">My Tickets ({myTickets.length})</h2>
      {myTickets.length > 0 ? (
        <div className="space-y-4">
          {myTickets.map((ticket, idx) => {
            const templeData = ALL_TEMPLES.find(t => t.name === ticket.temple);
            return (
            <div key={idx} className="bg-white rounded-xl p-5 shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{ticket.temple}</h3>
                  <p className="text-xs text-gray-500">{ticket.location}, Gujarat</p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1"><Calendar className='w-4 h-4'/> {ticket.date}</p>
                  {ticket.pilgrims && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1"><Users className='w-4 h-4'/> {ticket.pilgrims} Pilgrims</p>
                  )}
                  {ticket.bookedBy && (
                    <p className="text-xs text-gray-400 mt-1">Booked by: {ticket.bookedBy}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  ticket.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {ticket.status}
                </span>
              </div>
              {/* Dashed line to simulate ticket stub separation */}
              <div className="border-t border-dashed border-gray-300 my-4"></div>
              <div className="bg-orange-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1"><Ticket className='w-4 h-4'/> Queue Number</p>
                <p className="text-2xl font-bold text-orange-600">{ticket.queueNo}</p>
              </div>
              <div className="flex gap-2">
                <button 
                    onClick={() => {
                        setCurrentQrTicket(ticket);
                        setQrCodeModalOpen(true);
                    }}
                    className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 transition"
                >
                  View QR Code
                </button>
                <button 
                  onClick={() => { 
                    if (templeData) { setDirectionsTemple(templeData); setCurrentPage('directions'); }
                  }}
                  className="flex-1 border-2 border-orange-600 text-orange-600 py-2 rounded-lg font-medium hover:bg-orange-50 transition"
                >
                  Navigate
                </button>
              </div>
            </div>
          )})}
        </div>
      ) : (
        <div className="text-center p-8 bg-white rounded-xl shadow mt-4">
          <Ticket className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">You currently have no active Darshan tickets.</p>
        </div>
      )}
      <button onClick={() => setCurrentPage('temples')} className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-4 rounded-xl mt-6 shadow-lg hover:from-orange-700 hover:to-red-700 transition">
        + Book New Darshan
      </button>
    </div>
  );

  const LiveDarshanPage = () => (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Darshan</h2>
      <div className="bg-black rounded-2xl overflow-hidden mb-4 shadow-xl">
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <Camera className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-bold">Somnath Temple</p>
            <p className="text-sm text-gray-400">Live Now • 8,234 watching</p>
            <button className="bg-red-600 text-white px-6 py-2 rounded-full mt-4 font-bold hover:bg-red-700 transition">
              ▶ Join Live Stream
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800">Available Gujarat Temple Streams</h3>
        {[
          { temple: 'Dwarkadhish Temple', location: 'Dwarka', viewers: '6,891', status: 'Live' },
          { temple: 'Ambaji Temple', location: 'Banaskantha', viewers: '4,523', status: 'Live' },
          { temple: 'Akshardham', location: 'Gandhinagar', viewers: 'Starts in 20 min', status: 'Upcoming' },
          { temple: 'Shamlaji Temple', location: 'Aravalli', viewers: '2,345', status: 'Live' }
        ].map((stream, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow flex items-center justify-between hover:shadow-lg transition">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                {stream.temple.substring(0, 2)}
              </div>
              <div>
                <p className="font-bold text-gray-800">{stream.temple}</p>
                <p className="text-xs text-gray-500">{stream.location}, Gujarat</p>
                <p className="text-xs text-gray-600 mt-1">{stream.viewers} {stream.status === 'Live' ? 'watching' : ''}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              stream.status === 'Live' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {stream.status === 'Live' ? '🔴 Live' : '⏰ Soon'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const DonatePage = () => {
    const defaultAmount = '₹1,100';
    const donationOptions = ['₹101', '₹501', '₹1,100', '₹2,100', '₹5,100'];
    const [selectedAmount, setSelectedAmount] = useState(defaultAmount);
    const [customAmount, setCustomAmount] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [contactInput, setContactInput] = useState('');
    
    // --- Payment Simulation State ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [lastDonationAmount, setLastDonationAmount] = useState(0);

    const getPaymentAmount = () => {
        const amountStr = customAmount || selectedAmount;
        return parseInt(amountStr.replace(/[^0-9]/g, '') || '0', 10);
    };

    const displayAmount = `₹${getPaymentAmount().toLocaleString('en-IN')}`;
    
    const handlePayment = () => {
        const amount = getPaymentAmount();

        if (amount <= 0 || !contactInput) {
            console.log('Payment Error: Please select an amount and provide contact info.');
            // In a real app, show a toast or modal error here.
            return;
        }

        setIsProcessing(true);
        setPaymentComplete(false); // Hide previous success message
        console.log(`Starting simulated payment of ₹${amount} for ${nameInput}`);

        // --- Simulate Payment Gateway Transaction ---
        setTimeout(() => {
            // Simulate a successful transaction 90% of the time
            const success = Math.random() < 0.9;
            
            setIsProcessing(false);
            
            if (success) {
                setLastDonationAmount(amount);
                setPaymentComplete(true);
                
                console.log(`Donation Successful! Amount: ₹${amount}, Name: ${nameInput}`);
                
                // Clear success message after 5 seconds
                setTimeout(() => setPaymentComplete(false), 5000);

            } else {
                // Simulate failure
                console.error("Donation Failed: Transaction could not be completed.");
                // In a real app, show a failure message modal/toast
            }
        }, 3000); // 3-second simulation delay
    };

    return (
      <div className="p-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Make an Offering (Donation)</h2>
        
        {/* Payment Success Banner */}
        {paymentComplete && (
            <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-3 shadow-lg transition-opacity duration-300">
                <CheckCircle className='w-6 h-6 fill-green-500 text-white'/>
                <div>
                    <p className="font-bold">Donation Successful!</p>
                    <p className="text-sm">Thank you for your generous offering of ₹{lastDonationAmount.toLocaleString('en-IN')}.</p>
                </div>
            </div>
        )}

        {/* Donation Target Card */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white mb-6 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <Mountain className="w-6 h-6" />
            <h3 className="text-xl font-bold">Temple Renovation Fund</h3>
          </div>
          <p className="text-yellow-100 text-sm mb-4">Help us preserve the historic beauty of Somnath Temple.</p>
          <div className="w-full bg-white/30 rounded-full h-2.5 mb-2">
            {/* Progress bar simulation */}
            <div className="bg-white h-2.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <div className="flex justify-between text-xs font-medium text-white">
            <span>₹4.2 Cr Raised</span>
            <span>Goal: ₹6.5 Cr</span>
          </div>
        </div>

        {/* Donation Options */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Select Amount</h3>
          <div className="grid grid-cols-3 gap-3">
            {donationOptions.map((amount, idx) => (
              <button 
                key={idx} 
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount(''); // Clear custom when selecting preset
                }}
                className={`bg-white border-2 text-orange-600 font-bold py-3 rounded-xl shadow-sm transition 
                  ${selectedAmount === amount && !customAmount
                    ? 'border-orange-600 ring-2 ring-orange-400 bg-orange-50' 
                    : 'border-orange-200 hover:bg-orange-50'
                  }`}
              >
                {amount}
              </button>
            ))}
            <input 
              type="number"
              placeholder="Other ₹"
              value={customAmount.replace(/[^0-9]/g, '')}
              onChange={(e) => {
                setCustomAmount(e.target.value.replace(/[^0-9]/g, ''));
                setSelectedAmount(''); // Clear preset when entering custom
              }}
              className={`bg-white border-2 text-gray-600 font-bold py-3 text-center rounded-xl shadow-sm transition focus:outline-none focus:ring-2 focus:ring-orange-500
              ${customAmount ? 'border-orange-600 ring-2 ring-orange-400' : 'border-gray-300 hover:bg-gray-100'}`}
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Custom Donation & Details */}
        <div className="bg-white rounded-xl p-4 shadow mb-6">
          <h4 className="font-bold text-gray-800 mb-3">Your Details</h4>
          <input 
            type="text" 
            placeholder="Name (Optional)" 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full p-3 mb-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isProcessing}
          />
          <input 
            type="text" 
            placeholder="Email/Phone (Required for receipt)" 
            value={contactInput}
            onChange={(e) => setContactInput(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isProcessing}
          />
          <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2">
            <Info className='w-4 h-4 text-red-600'/>
            <span className="text-sm text-red-700">All information is kept confidential.</span>
          </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={isProcessing || getPaymentAmount() <= 0 || !contactInput}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-4 rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-700 hover:to-red-700"
        >
          <div className='flex items-center justify-center gap-2'>
            {isProcessing ? (
                <>
                    <Loader className="animate-spin w-5 h-5"/>
                    <span>Processing Payment...</span>
                </>
            ) : (
                <>
                    <CreditCard className="w-5 h-5" />
                    <span>Proceed to Pay ({displayAmount})</span>
                </>
            )}
          </div>
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">All donations are tax-exempted under section 80G.</p>
      </div>
    );
  };
  
  const ProfilePage = () => {
    const handleSignOut = async () => {
        if (auth) {
            try {
                await signOut(auth);
                setCurrentPage('auth'); // Redirect to login page after sign out
            } catch (error) {
                console.error("Sign out failed:", error);
            }
        }
    };
    
    // Fallback display if user is logged out (should be caught by renderPage, but good to check)
    if (!userId) {
        return (
            <div className="p-4 pt-20 text-center text-gray-600">
                You are currently signed out.
                <button onClick={() => setCurrentPage('auth')} className='text-orange-600 font-medium mt-2'>Go to Sign In</button>
            </div>
        );
    }

    // Display for authenticated user
    return (
        <div className="p-4 pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Profile</h2>
            <div className="bg-white rounded-2xl p-6 shadow text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold">
                    {userId.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-xl text-gray-800">Devotee Pilgrim</h3>
                <p className="text-gray-500 text-sm break-all">User ID: {userId}</p>
                <p className="text-xs text-gray-400 mt-1">Status: Authenticated</p>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div>
                        <p className="text-2xl font-bold text-orange-600">18</p>
                        <p className="text-xs text-gray-500">Visits</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-orange-600">₹8,200</p>
                        <p className="text-xs text-gray-500">Donated</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-orange-600">{myTickets.length}</p>
                        <p className="text-xs text-gray-500">Tickets</p>
                    </div>
                </div>
                
                <button className="w-full mt-6 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl shadow-sm hover:bg-gray-200 transition">
                    Edit Details
                </button>
                {/* technoova Credit */}
                <p className="text-center text-xs text-gray-400 mt-4 mb-2">
                    <span className='font-bold text-gray-500'>PilgrimPal</span> made by technoova
                </p>
                <button 
                    onClick={handleSignOut}
                    className="w-full mt-3 flex items-center justify-center gap-2 border border-red-500 text-red-500 font-bold py-3 rounded-xl shadow-sm hover:bg-red-50 transition"
                >
                    <LogOut className='w-5 h-5'/>
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
  };

  // --- Main Render Logic with Auth Gate ---
  const renderPage = () => {
    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] flex-col text-gray-600">
                <svg className="animate-spin h-8 w-8 text-orange-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="font-medium">Connecting to Pilgrim Services...</p>
            </div>
        );
    }
    
    // Auth Gate: If not logged in, show the AuthGate page (login/signup)
    if (!userId && currentPage !== 'auth') {
        // Automatically switch to the login page if not authenticated
        setCurrentPage('auth');
        return <AuthGate />;
    }
    
    // Specific pages for non-authenticated user (should only be 'auth')
    if (!userId && currentPage === 'auth') {
        return <AuthGate />;
    }

    // Authenticated user pages
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'tickets':
        return <TicketsPage />;
      case 'live':
        return <LiveDarshanPage />;
      case 'temples':
        return <TemplesPage />;
      case 'donate':
        return <DonatePage />;
      case 'profile':
        return <ProfilePage />;
      case 'book-darshan':
        return <BookingPage temple={bookingTemple} setMyTickets={setMyTickets} setCurrentPage={setCurrentPage} />;
      case 'directions':
        return <DirectionsPage temple={directionsTemple} setCurrentPage={setCurrentPage} />;
      case 'auth': // If user is authenticated but somehow landed on 'auth', redirect to profile/home
      default:
        setCurrentPage('home');
        return <HomePage />;
    }
  };

  return (
    // Max width set for mobile viewing, centered on desktop
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen font-[Inter]">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>

      <Header />
      <main className="relative z-0">
        {renderPage()}
      </main>
      
      {/* QR Code Modal is rendered outside main content for fixed positioning */}
      <QRCodeModal />
      
      {/* Hide bottom nav if we are on the AuthGate page for a cleaner, dedicated screen */}
      {userId && <BottomNav />}
    </div>
  );
};

export default App;
