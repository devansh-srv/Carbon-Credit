import React, { useState, useEffect, useContext } from 'react';
import { getBuyerCredits, purchaseCredit, sellCreditApi, removeSaleCreditApi, getPurchasedCredits, generateCertificate, downloadCertificate } from '../api/api';
import { CC_Context } from "../context/SmartContractConnector.js";
import { ethers } from "ethers";
import { Eye, EyeOff, Loader2, File, Info, Download, ShoppingCart, XCircle, Tag, DollarSign, AlertCircle } from 'lucide-react';
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
      className="flex justify-center items-center p-2 text-green-400 bg-white rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
    >
      <Info size={16} />
    </button>
  );
};

const LoadingCredit = () => (
  <li className="flex justify-between items-center py-2 px-4 text-sm animate-pulse">
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
    } catch (error) {
      console.error('Failed to fetch credits:', error?.message);
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
  };

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
  };

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

      const updatedCredit = updatedCredits.find((credit) => credit.id === creditId);
      console.log(`Credit put on sale with price: ${updatedCredit.salePrice}`);

      await sellCredit(creditId, updatedCredit.salePrice);
      const response = await sellCreditApi({ credit_id: creditId, salePrice: updatedCredit.salePrice });
      console.log(response);
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

      await removeFromSale(creditId);
      await removeSaleCreditApi({ credit_id: creditId });
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800">Buyer Dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">View and manage your carbon credits</p>
          </div>

          {error && (
            <div className="p-4 text-red-700 bg-red-50">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              {error}
            </div>
          )}

          <div className="p-6">
            {/* Available Credits Section */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-700 mb-4">Available Credits</h4>
              <ul className="space-y-2">
                {isLoading ? (
                  <>
                    <LoadingCredit />
                    <LoadingCredit />
                    <LoadingCredit />
                  </>
                ) : availableCredits.map((credit) => (
                  <li key={credit.id} className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-700">{credit.name}</span>
                      <span className="text-sm text-gray-500">Amount: {credit.amount}</span>
                      <span className="text-sm text-gray-500">Price: {credit.price} ETH</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DetailsButton creditId={credit.id} />
                      {credit.secure_url && (
                        <button
                          onClick={() => window.open(credit.secure_url, '_blank')}
                          className="p-2 text-green-400 bg-white rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                        >
                          <File size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleBuyCredit(credit.id)}
                        disabled={credit.amount <= 0 || pendingTx === credit.id}
                        className={`px-3 py-1 text-sm font-medium rounded-md flex items-center ${
                          credit.amount > 0
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors`}
                      >
                        {pendingTx === credit.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            Buying...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            {credit.amount > 0 ? 'Buy' : 'Out of Stock'}
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchased Credits Section */}
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-4">Purchased Credits</h4>
              {purchasedCredits.length > 0 ? (
                <ul className="space-y-2">
                  {purchasedCredits.map((credit) => (
                    <li
                      key={credit.id}
                      className={`py-2 px-4 rounded-md ${
                        credit.is_expired ? 'bg-green-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-gray-700">{credit.name}</span>
                          <span className="text-sm text-gray-500">Amount: {credit.amount}</span>
                          <span className="text-sm text-gray-500">Price: {credit.price} ETH</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DetailsButton creditId={credit.id} />
                          {credit.secure_url && (
                            <button
                              onClick={() => window.open(credit.secure_url, '_blank')}
                              className="p-2 text-green-400 bg-white rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                            >
                              <File size={16} />
                            </button>
                          )}
                          {credit.is_expired ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => showCertificate ? handleGenerateCertificate(credit.id) : handleHideCertificate()}
                                className="p-2 text-emerald-500 bg-white rounded-md hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors"
                              >
                                {showCertificate ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                              <button
                                onClick={() => handleDownloadCertificate(credit.id)}
                                className="p-2 text-green-400 bg-white rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          ) : credit.is_active ? (
                            <button
                              onClick={() => handleRemoveFromSale(credit.id)}
                              className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-1 inline" />
                              Remove from Sale
                            </button>
                          ) : (
                            <div className="flex flex-col space-y-2">
                            {credit.showSellInput ? (
                              <button
                                onClick={() => handleSellInput(credit.id)}
                                className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors"
                              >
                                
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSellInput(credit.id)}
                                className="px-3 py-1 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors"
                              >
                                <DollarSign className="w-4 h-4 mr-1 inline" />
                                Sell
                              </button>
                            )}
                            {credit.showSellInput && (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  placeholder="Price"
                                  className="w-24 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-300"
                                  value={credit.salePrice || ''}
                                  onChange={(e) => handlePriceChange(credit.id, e.target.value)}
                                />
                                <button
                                  onClick={() => confirmSale(credit.id)}
                                  className="px-3 py-1 text-sm font-medium text-white bg-green-400 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                                >
                                  Confirm
                                </button>
                                <p className="text-xs text-gray-500">
                                  (90% to you, 10% to creator)
                                </p>
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No credits purchased yet.</p>
              )}
            </div>

            {/* Certificate Display */}
            {certificateData && (
              <div className="mt-8 p-4 bg-white rounded-md shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-700">Certificate</h4>
                  <button
                    onClick={handleHideCertificate}
                    className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
                <div
                  className="p-4 border border-gray-200 rounded-md"
                  dangerouslySetInnerHTML={{ __html: certificateData.certificate_html }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;