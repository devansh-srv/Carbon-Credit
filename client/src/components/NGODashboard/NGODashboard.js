import React, { useState, useEffect } from 'react';
import { getNGOCredits, getTransactions } from '../../api/api';
import CreateCreditForm from './CreateCreditForm';
import MyCreditsList from './MyCreditsList';
import RecentTransactionsList from './RecentTransactionsList';

const NGODashboard = () => {
  const [myCredits, setMyCredits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsResponse, transactionsResponse] = await Promise.all([
          getNGOCredits(),
          getTransactions()
        ]);

        // console.log(creditsResponse.data)
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
    <div className="overflow-hidden bg-white bg-gradient-to-br from-emerald-200 to-blue-100 shadow sm:rounded-lg">
      <div className="py-5 px-4 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">NGO Dashboard</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your carbon credits</p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <CreateCreditForm setMyCredits={setMyCredits} />
          <MyCreditsList credits={myCredits} setCredits={setMyCredits} isLoading={isLoading} />
          <RecentTransactionsList transactions={transactions} isLoading={isLoading} />
        </dl>
      </div>
    </div>
  );
};

export default NGODashboard;