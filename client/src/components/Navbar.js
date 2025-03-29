
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="shadow-md bg-emerald-50/10 backdrop-blur-md">
      <div className="container flex justify-between items-center py-4 px-6 mx-auto">
        <Link to="/home">
          <div className="flex items-center space-x-3">
            <LucideIcons.Leaf className="text-emerald-600" size={32} />
            <span className="text-2xl font-bold text-emerald-800">CarbonCredits</span>
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          {!user && (
            <>
              <Link
                to="/login"
                className="text-emerald-700 transition hover:text-emerald-900"
              >
                Login
              </Link>
              <Link
                to="/NGO-signup"
                className="text-emerald-700 transition hover:text-emerald-900"
              >
                NGO Signup
              </Link>
              <Link
                to="/buyer-signup"
                className="text-emerald-700 transition hover:text-emerald-900"
              >
                Buyer Signup
              </Link>
              <Link
                to="/auditor-signup"
                className="text-emerald-700 transition hover:text-emerald-900"
              >
                Auditor Signup
              </Link>
            </>
          )}
          {user &&
            <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Hi, {user.username}!
            </span>}
          {user && user.role === 'NGO' && (
            <Link
              to="/NGO-dashboard"
              className="text-emerald-700 transition hover:text-emerald-900"
            >
              NGO Dashboard
            </Link>
          )}
          {user && user.role === 'buyer' && (
            <Link
              to="/buyer-dashboard"
              className="text-emerald-700 transition hover:text-emerald-900"
            >
              Buyer Dashboard
            </Link>
          )}
          {user && (
            <button
              onClick={onLogout}
              className="py-2 px-4 text-white bg-emerald-600 rounded-full shadow-sm transition hover:bg-emerald-700"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
