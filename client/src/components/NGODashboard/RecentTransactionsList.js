import React from 'react';

const RecentTransactionsList = ({ transactions, isLoading }) => {
  const LoadingCredit = () => (
    <li className="flex justify-between items-center py-3 pr-4 pl-3 text-sm animate-pulse">
      <div className="flex-1">
        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
      </div>
      <div className="w-16">
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </li>
  );

  return (
    <div className="py-5 px-4 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-gray-500">Recent Transactions</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
          {isLoading ? (
            <>
              <LoadingCredit />
              <LoadingCredit />
              <LoadingCredit />
            </>
          ) : transactions.slice(-10).map((transaction) => (
            <li key={transaction.id} className="flex justify-between items-center py-3 pr-4 pl-3 text-sm">
              <div className="flex flex-1 items-center w-0">
                <span className="flex-1 ml-2 w-0 truncate">
                  Buyer: {transaction.buyer}, Credit: {transaction.credit}, Amount: {transaction.amount}, Total Price: ${transaction.total_price}, Date: {new Date(transaction.timestamp).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
};

export default RecentTransactionsList;