import React, { useState, useEffect, useContext } from 'react';
import { getBuyerCredits, purchaseCredit, sellCreditApi, removeSaleCreditApi, getPurchasedCredits, generateCertificate, downloadCertificate } from '../api/api';
import { CC_Context } from "../context/SmartContractConnector.js";
import { ethers } from "ethers";
import { Eye, EyeClosed, Loader2, File, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Modular Details Button Component
const DetailsButton = ({ creditId }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate(`/credits/${creditId}`);
  };
  
  return (
    <button
      onClick={handleViewDetails}
      className="p-2 text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 flex items-center justify-center"
    >
      <Info size={16} />
    </button>
  );
};

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

const BuyerDashboard = () => {
  const [availableCredits, setAvailableCredits] = useState([]);
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
    currentAccount
    // error 
  } = useContext(CC_Context);

  const fetchAllCredits = async () => {
    try {
      setIsLoading(true);
      const [availableResponse, purchasedResponse] = await Promise.all([
        getBuyerCredits(),
        getPurchasedCredits()
      ]);

      const creditsWithSalePrice = purchasedResponse.data.map(credit => ({
        ...credit,
        salePrice: '', // Initialize salePrice if not present
      }));

      setPurchasedCredits(creditsWithSalePrice);
      setAvailableCredits(availableResponse.data);

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

  const handleBuyCredit = async (creditId) => {
    try {
      setError(null);
      setPendingTx(creditId);
  
      const credit = await getCreditDetails(creditId);
      const priceInEther = ethers.formatEther(credit.price);
  
      console.log("id, price: ", creditId, priceInEther);
  
      const receipt = await buyCredit(creditId, priceInEther);
      // console.log(receipt);
      await purchaseCredit({ credit_id: creditId, txn_hash: receipt.hash });
  
      await fetchAllCredits();
    } catch (error) {
      console.error('Failed to purchase credit:', error);
      setError('Failed to purchase credit. Please try again.');
    } finally {
      setPendingTx(null);
    }
  };
  
  const handleGenerateCertificate = async (creditId) => {
    try {
      setError(null);
      const response = await generateCertificate(creditId);
      setShowCertificate(false);
      setCertificateData(response.data);
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      setError('Failed to generate certificate. Please try again.');
    }
  };

  const handleHideCertificate = async () => {
    setCertificateData(null);
    setShowCertificate(true);
  }

  const handleDownloadCertificate = async (creditId) => {
    try {
      setError(null);
      const response = await downloadCertificate(creditId);
      const linksource = `data:application/pdf;base64,${response.data.pdf_base64}`;
      const downloadLink = document.createElement("a");
      const fileName = response.data.filename;
      downloadLink.href = linksource;
      downloadLink.download = fileName;
      downloadLink.click();

    } catch (error) {
      console.error("Failed to download Certificate: ", error);
      setError('Failed to download certificate. Please try again.');
    }
  }
  
  const handleSellInput = (creditId) => {
    setPurchasedCredits((prevCredits) =>
      prevCredits.map((credit) =>
        credit.id === creditId ? { ...credit, showSellInput: !credit.showSellInput } : credit
      )
    );
  };

  const handlePriceChange = (creditId, price) => {
    setPurchasedCredits((prevCredits) =>
      prevCredits.map((credit) =>
        credit.id === creditId ? { ...credit, salePrice: price } : credit
      )
    );
  };

  const confirmSale = async (creditId) => {
    try {
      const updatedCredits = purchasedCredits.map((credit) =>
        credit.id === creditId
          ? { ...credit, is_active: true, showSellInput: false, salePrice: credit.salePrice || '' }
          : credit
      );
      setPurchasedCredits(updatedCredits);

      // Log the updated credit
      const updatedCredit = updatedCredits.find((credit) => credit.id === creditId);
      console.log(`Credit put on sale with price: ${updatedCredit.salePrice}`);

      // Call API to mark credit as on sale in the backend and contract
      await sellCredit(creditId, updatedCredit.salePrice);
      const respose = await sellCreditApi({ credit_id: creditId, salePrice: updatedCredit.salePrice });
      console.log(respose);
      await fetchAllCredits();
    } catch (error) {
      console.error("Can't sale credit: ", error);
      setError('Failed to sell credit');
      handleSellError();
      await fetchAllCredits();
    }
  };

  const handleRemoveFromSale = async (creditId) => {
    try {
      setPurchasedCredits((prevCredits) =>
        prevCredits.map((credit) =>
          credit.id === creditId ? { ...credit, is_active: false, salePrice: null } : credit
        )
      );

      // Call API to remove the credit from sale in the backend
      await removeFromSale(creditId);
      await removeSaleCreditApi({ credit_id: creditId })
      console.log(`Removed credit ID ${creditId} from sale`);
      await fetchAllCredits();
    } catch (error) {
      console.error("We shouldnt be getting error here T:T : ", error);
      setError('Failed to remove credit');
      handleSellError();
      await fetchAllCredits();
    }
  };

  const handleSellError = () => {
      Swal.fire({
              icon: 'error',
              title: 'Error !',
              html: 'Possible Reasons:<br><br>1. Check MetaMask account is the one you bought with'
            });
    }

  return (
    <div className="overflow-hidden bg-white bg-gradient-to-br from-blue-100 to-indigo-300 shadow sm:rounded-lg">
      <div className="py-5 px-4 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Buyer Dashboard</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">View and purchase carbon credits</p>
      </div>

      {error && (
        <div className="py-3 px-4 text-red-700 bg-red-50">
          {error}
        </div>
      )}

      <div className="border-t border-gray-200">
        <dl>
          <div className="py-5 px-4 bg-gray-50 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Available Credits</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
                {isLoading ? (
                  <>
                    <LoadingCredit />
                    <LoadingCredit />
                    <LoadingCredit />
                  </>
                ) : availableCredits.map((credit) => (
                  <li key={credit.id} className="flex justify-between items-center py-3 pr-4 pl-3 text-sm">
                    <div className="flex flex-1 items-center w-0">
                      <span className="flex-1 ml-2 w-0 truncate">
                        {credit.name} - Amount: {credit.amount}, Price: {credit.price} ETH
                      </span>
                    </div>
                    <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
                      {/* Details button - added here */}
                      <DetailsButton creditId={credit.id} />
                      
                      {credit.secure_url && (
                        <button
                          type="button"
                          onClick={() => window.open(credit.secure_url, '_blank')}
                          className="py-2 px-2 text-white bg-blue-500 rounded hover:bg-blue-800"
                        >
                          <File size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => handleBuyCredit(credit.id)}
                        className="btn btn-secondary"
                        disabled={credit.amount <= 0 || pendingTx === credit.id}
                      >
                        {pendingTx === credit.id ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          credit.amount > 0 ? 'Buy' : 'Out of Stock'
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>

          <div className="py-5 px-4 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Purchased Credits</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {purchasedCredits.length > 0 ? (
                <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
                  {purchasedCredits.map((credit) => (
                    <li
                      key={credit.id}
                      className={`pl-3 pr-4 py-3 flex items-center justify-between text-sm ${credit.is_expired ? 'bg-[#D4EDDA]' : ''}`}
                    >
                      <div className="flex flex-1 items-center w-0">
                        <span className="flex-1 ml-2 w-0 truncate">
                          {credit.name} - Amount: {credit.amount}, Price: {credit.price} ETH
                        </span>
                      </div>

                      <div className="flex flex-shrink-0 gap-2 items-center ml-4">
                        {/* Details button - added here */}
                        <DetailsButton creditId={credit.id} />
                        
                        {/* View Project Documents button - aligned left */}
                        {credit.secure_url && (
                          <button
                            type="button"
                            onClick={() => window.open(credit.secure_url, "_blank")}
                            className="py-1 px-3 text-white bg-gray-500 rounded hover:bg-gray-600"
                          >
                            View Project Documents
                          </button>
                        )}

                        {credit.is_expired ? (
                          <div className="flex gap-4">
                            <button
                              onClick={() => { showCertificate ? handleGenerateCertificate(credit.id) : handleHideCertificate() }}
                              className="btn bg-sky-500"
                            >
                              {showCertificate ? <Eye /> : <EyeClosed />}
                            </button>

                            <button
                              onClick={() => handleDownloadCertificate(credit.id)}
                              className="btn btn-secondary"
                            >
                              Download
                            </button>
                          </div>
                        ) : credit.is_active ? (
                          <button
                            onClick={() => handleRemoveFromSale(credit.id)}
                            className="py-1 px-3 text-white bg-red-500 rounded hover:bg-red-600"
                          >
                            Remove from Sale
                          </button>
                        ) : (
                          <div className="flex flex-col">
                            <button
                              onClick={() => handleSellInput(credit.id)}
                              className="py-1 px-3 text-white bg-blue-500 rounded hover:bg-blue-600"
                            >
                              Sell
                            </button>
                            {credit.showSellInput && (
                              <div className="mt-2">
                                <input
                                  type="number"
                                  placeholder="Enter price"
                                  className="p-1 rounded border"
                                  value={credit.salePrice || ''}
                                  onChange={(e) => handlePriceChange(credit.id, e.target.value)}
                                />
                                <button
                                  onClick={() => confirmSale(credit.id)}
                                  className="py-1 px-3 ml-2 text-white bg-green-500 rounded hover:bg-green-600"
                                >
                                  Confirm
                                </button>
                                <p className="mt-1 text-sm text-gray-500">
                                  You will get 90% of value, the other 10% will go to creator
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No credits purchased yet.</p>
              )}
            </dd>
          </div>

          {certificateData && (
            <div className="py-5 px-4 mt-6 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Certificate</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <div
                  className="p-4 rounded-md border"
                  dangerouslySetInnerHTML={{ __html: certificateData.certificate_html }}
                />
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default BuyerDashboard;