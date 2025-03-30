import React, { useState, useEffect, useContext } from 'react';
import { getBuyerCredits, purchaseCredit, sellCreditApi, removeSaleCreditApi, getPurchasedCredits, getAssignedCredits} from '../api/api';
import { CC_Context } from "../context/SmartContractConnector.js";
import { ethers } from "ethers";
import { Eye, EyeClosed, Loader2 } from 'lucide-react';

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



const AuditorDashboard = () => {
  const [AssignedCredits, setAssignedCredits] = useState([]);
  const [purchasedCredits, setPurchasedCredits] = useState([]);
  const [certificateData, setCertificateData] = useState(null);
  const [error, setError] = useState(null);
  const [showCertificate, setShowCertificate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTx, setPendingTx] = useState(null);

  const {
    connectWallet,
    generateCredit,
    getCreditDetails,
    getNextCreditId,
    getPrice,
    sellCredit,
    removeFromSale,
    buyCredit,
    currentAccount,
    auditCredit
    // error 
  } = useContext(CC_Context);

  const fetchAllCredits = async () => {
    try {
      setIsLoading(true);
      const [assignedResposne, purchasedResponse] = await Promise.all([
        getAssignedCredits(),
        getPurchasedCredits()
      ]);

      const creditsWithSalePrice = purchasedResponse.data.map(credit => ({
        ...credit,
        salePrice: '', // Initialize salePrice if not present
      }));

      setPurchasedCredits(creditsWithSalePrice);
      setAssignedCredits(assignedResposne.data);

      // setPurchasedCredits(purchasedResponse.data);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      setError('Failed to fetch credits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCredits();
  }, []);

  const handleAudit = async (creditId) => {
    try {
      setError(null);
      setPendingTx(creditId);

      const credit = await getCreditDetails(creditId);

      // Convert the price from wei to ether for the transaction
      const priceInEther = ethers.formatEther(credit.price);
      console.log("id, price: ", creditId, priceInEther);
      await buyCredit(creditId, priceInEther);
      await purchaseCredit({ credit_id: creditId, amount: 1 });
      await fetchAllCredits(); // Refresh both available and purchased credits
    } catch (error) {
      console.error('Failed to purchase credit:', error);
      setError('Failed to purchase credit. Please try again.');
    } finally {
      setPendingTx(null);
    }
  };

  


  return (
    <div className="overflow-hidden bg-white bg-gradient-to-br from-blue-100 to-indigo-300 shadow sm:rounded-lg">
      <div className="py-5 px-4 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Auditor Dashboard</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Audit the credits assigned to you</p>
      </div>

      {error && (
        <div className="py-3 px-4 text-red-700 bg-red-50">
          {error}
        </div>
      )}

      <div className="border-t border-gray-200">
        <dl>
          <div className="py-5 px-4 bg-gray-50 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Assigned Credits</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
                {isLoading ? (
                  <>
                    <LoadingCredit />
                    <LoadingCredit />
                    <LoadingCredit />
                  </>
                ) : AssignedCredits.map((credit) => (
                  <li key={credit.id} className="flex justify-between items-center py-3 pr-4 pl-3 text-sm">
                    <div className="flex flex-1 items-center w-0">
                      <span className="flex-1 ml-2 w-0 truncate">
                        {credit.name} - Amount: {credit.amount}, Price: ${credit.price}
                      </span>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <>
                      {
                       credit.secure_url?
                        <button
                          type='button'
                          onClick={() => window.open(credit.secure_url, '_blank')}
                          className="py-2 px-4 mr-4 font-sans text-white bg-blue-500 rounded hover:bg-blue-400">
                          View Project Documents
                        </button>:<></>
                      }
                        <button
                          onClick={() => handleAudit(credit.id)}
                          className="btn btn-secondary"
                          disabled={credit.amount <= 0 || pendingTx === credit.id}
                        >
                          Audit
                        </button></>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>


        </dl>
      </div>

    </div>
  );
};

export default AuditorDashboard;
