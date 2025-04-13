import { Link } from 'react-router-dom';
import { 
  Leaf, 
  LogOut, 
  User, 
  UserCheck, 
  Home, 
  ShieldCheck, 
  ShoppingBag, 
  LogIn 
} from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="sticky top-0 z-10 shadow-sm bg-white/60 backdrop-blur-md border-b border-green-100">
      <div className="container flex justify-between items-center py-3 px-6 mx-auto">
        <Link to="/home" className="group">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg group-hover:from-emerald-500 group-hover:to-green-400 transition-all duration-300">
              <Leaf className="text-white" size={22} />
            </div>
            <span className="text-xl font-bold text-emerald-700 group-hover:text-emerald-600 transition-colors duration-200">
              CarbonCredits
            </span>
          </div>
        </Link>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {!user && (
            <div className="flex items-center space-x-1 md:space-x-3">
              <Link
                to="/login"
                className="flex items-center py-1.5 px-3 text-sm text-emerald-700 hover:text-emerald-900 hover:bg-green-50 rounded-md transition-colors duration-200"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                <span>Login</span>
              </Link>
              
              <div className="h-5 border-r border-gray-200"></div>
              
              <div className="relative group">
                <button className="flex items-center py-1.5 px-3 text-sm text-emerald-700 hover:text-emerald-900 hover:bg-green-50 rounded-md transition-colors duration-200">
                  <User className="w-4 h-4 mr-1.5" />
                  <span>Sign Up</span>
                </button>
                
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-green-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
                  <Link
                    to="/NGO-signup"
                    className="flex items-center text-sm text-gray-700 hover:bg-green-50 hover:text-emerald-700 py-2 px-3"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
                    <span>NGO</span>
                  </Link>
                  <Link
                    to="/buyer-signup"
                    className="flex items-center text-sm text-gray-700 hover:bg-green-50 hover:text-emerald-700 py-2 px-3"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2 text-emerald-500" />
                    <span>Buyer</span>
                  </Link>
                  <Link
                    to="/auditor-signup"
                    className="flex items-center text-sm text-gray-700 hover:bg-green-50 hover:text-emerald-700 py-2 px-3"
                  >
                    <UserCheck className="w-4 h-4 mr-2 text-emerald-500" />
                    <span>Auditor</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {user && (
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center bg-green-50 py-1 px-3 rounded-full">
                <User className="w-4 h-4 text-green-500 mr-1.5" />
                <span className="text-sm font-medium text-emerald-700">
                  {user.username}
                </span>
              </div>
              
              {user.role === 'NGO' && (
                <Link
                  to="/NGO-dashboard"
                  className="flex items-center py-1.5 px-3 text-sm text-emerald-700 hover:text-emerald-900 hover:bg-green-50 rounded-md transition-colors duration-200"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}
              
              {user.role === 'buyer' && (
                <Link
                  to="/buyer-dashboard"
                  className="flex items-center py-1.5 px-3 text-sm text-emerald-700 hover:text-emerald-900 hover:bg-green-50 rounded-md transition-colors duration-200"
                >
                  <ShoppingBag className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}
              
              {user.role === 'auditor' && (
                <Link
                  to="/auditor-dashboard"
                  className="flex items-center py-1.5 px-3 text-sm text-emerald-700 hover:text-emerald-900 hover:bg-green-50 rounded-md transition-colors duration-200"
                >
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}
              
              <button
                onClick={onLogout}
                className="flex items-center py-1.5 px-3 text-white bg-gradient-to-r from-green-400 to-emerald-500 hover:from-emerald-500 hover:to-green-500 rounded-md shadow-sm transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;