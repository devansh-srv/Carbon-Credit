import React, { useState, useEffect } from 'react';
import { getNGOCredits, getTransactions } from '../../api/api';
import CreateCreditForm from './CreateCreditForm';
import MyCreditsList from './MyCreditsList';
import RecentTransactionsList from './RecentTransactionsList';

const NGODashboard = () => {
  const [myCredits, setMyCredits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsResponse, transactionsResponse] = await Promise.all([
          getNGOCredits(),
          getTransactions(),
        ]);
        setMyCredits(creditsResponse.data);
        setTransactions(transactionsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800">NGO Dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">Manage your carbon credits with ease</p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-100">
            <nav className="flex space-x-1 px-6" aria-label="Tabs">
              {['create', 'credits', 'transactions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                  } capitalize py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200`}
                >
                  {tab === 'create' ? 'Create Credit' : tab === 'credits' ? 'My Credits' : 'Transactions'}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 bg-green-50/50 min-h-[400px] transition-all duration-300">
            {activeTab === 'create' && (
              <div className="animate-fade-in">
                <CreateCreditForm setMyCredits={setMyCredits} />
              </div>
            )}
            {activeTab === 'credits' && (
              <div className="animate-fade-in">
                <MyCreditsList credits={myCredits} setCredits={setMyCredits} isLoading={isLoading} />
              </div>
            )}
            {activeTab === 'transactions' && (
              <div className="animate-fade-in">
                <RecentTransactionsList transactions={transactions} isLoading={isLoading} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NGODashboard;