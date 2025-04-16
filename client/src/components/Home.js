import React from 'react';
import { Globe, Lock, ShieldCheck, Github } from 'lucide-react';
import { Link } from 'react-router-dom';


const Home = () => {

  const logged = Boolean(localStorage.getItem('token'));
  // if(!token){

  // }
  // const decodedToken = jwtDecode(token);
  // const logged = decodedToken.exp * 1000 < Date.now();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col">
      

      <main className="px-6 mt-16 flex-grow grid md:grid-cols-2 gap-12 items-center">

        <div>
          <h2 className="text-5xl font-bold text-emerald-900 mb-6">
            Democratizing Carbon Trading on the Blockchain
          </h2>
          <p className="text-xl text-emerald-800 mb-8">
            Transparent, secure, and accessible carbon credit trading powered by Ethereum (Sepolia Testnet). 
            Empower your sustainability efforts with verifiable, tradable carbon credits.
            <br/>
            View contract on <a href='https://sepolia.etherscan.io/address/0x15Ef15a50a2F72126EBcDC6989044Ce6ae322802'
              class=" text-green-600 hover:text-blue-800" target="_blank" >
                Etherscan
                </a> 
          </p>
          <div className="flex space-x-4">
            <Link to='/login'>
                <button className="bg-emerald-600 text-white px-6 py-3 rounded-full hover:bg-emerald-700 transition">
                {logged? 'Dashboard': 'Login'}
                </button>
            </Link>
            <a href='https://www.rogueone.us/projects/carbon-credits/' target='_blank'>
            <button className="border-2 border-emerald-600 text-emerald-700 px-6 py-3 rounded-full hover:bg-emerald-50 transition">
              Learn More
            </button>
            </a>
            <a href='https://github.com/devansh-srv/Carbon-Credit/' target='_blank'>
            <button className="border-2 border-emerald-600 text-emerald-700 px-6 py-3 rounded-full hover:bg-emerald-50 transition">
              <Github/>
            </button>
            </a>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
          <h3 className="text-2xl font-semibold text-emerald-900 mb-6">Platform Features</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Globe className="text-emerald-600" size={40} />
              <div>
                <h4 className="font-bold text-emerald-800">Global Carbon Market</h4>
                <p className="text-emerald-700">Trade credits across international boundaries</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Lock className="text-emerald-600" size={40} />
              <div>
                <h4 className="font-bold text-emerald-800">Blockchain Security</h4>
                <p className="text-emerald-700">Immutable and transparent transaction records</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ShieldCheck className="text-emerald-600" size={40} />
              <div>
                <h4 className="font-bold text-emerald-800">Verified Credits</h4>
                <p className="text-emerald-700">Every credit authenticated and traceable</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-8 mt-16 text-center">
        <p className="text-emerald-800">
          © 2024 Carbon Credits. Powering Sustainable Future through Blockchain Technology.
        </p>
      </footer>
    </div>
  );
};

export default Home;