import React, { useState, useContext, useMemo } from 'react';
import { CC_Context } from "../../context/SmartContractConnector.js";
import { Loader2, File, AlertTriangle, CheckCircle, AlertCircle, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { expireCreditApi, verifyBeforeExpire, sellCreditApi, getNGOCredits } from '../../api/api';

const MyCreditsList = ({ credits, setCredits, isLoading }) => {
  const { expireCredit, sellCredit } = useContext(CC_Context);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [pendingTx, setPendingTx] = useState(null);
  const [expirationData, setExpirationData] = useState({ creditName: "", amountReduced: "", password: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    accepted: true,
    rejected: true,
    forSale: true,
    expired: true 
  });

  // Toggle section visibility
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Categorize credits
  const categorizedCredits = useMemo(() => {
    if (!credits || credits.length === 0) return {};
    
    return {
      pending: credits.filter(credit => credit.req_status === 1),
      accepted: credits.filter(credit => credit.req_status === 2 && credit.score > 0 && !credit.is_expired),
      rejected: credits.filter(credit => credit.req_status === 2 && credit.score <= 0),
      forSale: credits.filter(credit => credit.req_status === 3 && !credit.is_expired),
      expired: credits.filter(credit => credit.is_expired) 
    };
  }, [credits]);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Invalid File",
        text: "Please upload a valid PDF file.",
      });
    }
  };

  const openModal = (credit) => {
    
    setSelectedCredit(credit);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setExpirationData({ creditName: "", amountReduced: "", password: "" });
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setExpirationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async () => {
    try {
      const { creditName, amountReduced, password } = expirationData;
      if (!creditName || !amountReduced || !password) {
        Swal.fire({
          icon: "warning",
          title: "Missing Fields",
          text: "Please fill in all fields.",
        });
        return;
      }

      if (creditName !== selectedCredit.name) {
        Swal.fire({
          icon: "warning",
          title: "Name Error",
          text: "Name you entered doesn't match the credit name",
        });
        return;
      }

      const response = await verifyBeforeExpire(expirationData);
      console.log("verifyBeforeExpire says:", response.data["message"]);
      closeModal();
      await handleExpireCredit(selectedCredit.id);
    } catch (error) {
      console.error("Error expiring credit:", error.response?.data?.["message"] || error.message);
    }
  };

  const handleExpireCredit = async (creditId) => {
    console.log(`Expire credit called for credit ID: ${creditId}`);
    try {
      setPendingTx(creditId);
      const response = await expireCreditApi(creditId);
      console.log(response.data);
      await expireCredit(creditId);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Credit expired successfully!',
      });

      setCredits((prevCredits) =>
        prevCredits.map((credit) =>
          credit.id === creditId ? { ...credit, is_expired: true } : credit
        )
      );
    } catch (error) {
      if (error.response && error.response.status === 400) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error.response.data.message,
        });
      } else {
        console.error('Failed to expire credit:', error);
      }
    } finally {
      setPendingTx(null);
    }
  };

  const handlePutForSale = async (creditId) => {
    try {
      console.log(`Put for sale called for credit ID: ${creditId}`);
      
      // Find the credit with the matching ID
      const creditToSell = credits.find(credit => credit.id === creditId);
      
      if (!creditToSell) {
        throw new Error(`Credit with ID ${creditId} not found`);
      }
      
      console.log("Credit to sell:", creditToSell);
      await sellCredit(creditId, creditToSell.price);
      const response = await sellCreditApi({ credit_id: creditId, salePrice: creditToSell.price });
      console.log(response);

      // Refetch the updated credit list after successful creation
      const updatedCredits = await getNGOCredits();
      setCredits(updatedCredits.data);
    } catch (error) {
      console.error("Can't sell credit: ", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to sell credit: ${error.message}`
      });
    }
  };

  // Function to get status border style - using inline style
  const getStatusBorderStyle = (reqStatus, score, isExpired) => {
    // If expired, use a special style
    if (isExpired) return { borderLeft: '4px solid #415e02' }; // Green for expired
    
    // Use inline styles for borders to avoid potential CSS conflicts
    if (reqStatus === 1) return { borderLeft: '4px solid #FBBF24' }; // Yellow
    if (reqStatus === 2) {
      return score > 0 ? { borderLeft: '4px solid #10B981' } : { borderLeft: '4px solid #EF4444' }; // Green or Red
    }
    if (reqStatus === 3) return { borderLeft: '4px solid #3B82F6' }; // Blue
    return {}; // Default case
  };

  // Render a single credit item
  const renderCreditItem = (credit) => {
    // Merge background color style with border style
    const listItemStyle = {
      ...getStatusBorderStyle(credit.req_status, credit.score, credit.is_expired),
      backgroundColor: credit.is_expired ? '#D4EDDA' : 'transparent'
    };
    
    return (
      <li
        key={credit.id}
        className="flex justify-between items-center py-3 pr-4 pl-3 text-sm"
        style={listItemStyle}
      >
        <div className="flex flex-1 items-center w-0">
          <span className="flex-1 ml-2 w-0 truncate">
            {credit.id}: {credit.name} - Amount: {credit.amount || 'N/A'}, Price: {credit.price || 'N/A'} ETH
          </span>
        </div>
        
        {/* Document view button always visible */}
        {credit.secure_url && <button
          type='button'
          onClick={() => window.open(credit.secure_url, '_blank')}
          className="py-2 px-2 mr-2 font-sans text-white bg-green-500 rounded hover:bg-green-400"
        >
          <File size={20}/>
        </button>}

        {/* Conditional rendering based on req_status and other conditions */}
        {!credit.is_expired && (
          <>
            {credit.req_status === 1 ? (
              <div className="flex items-center">
                <AlertTriangle className="mr-2 text-yellow-500" size={20} />
                <span className="text-sm">
                  Pending: {credit.auditor_left}/{credit.auditors_count} Auditors, Score: {credit.score}
                </span>
              </div>
            ) : credit.req_status === 2 ? (
              credit.score > 0 ? (
                <button
                  onClick={() => handlePutForSale(credit.id)}
                  className="py-1 px-3 ml-2 text-white bg-green-500 rounded hover:bg-green-400"
                >
                  <Tag className="mr-1 inline" size={16} /> Put For Sale
                </button>
              ) : (
                <div className="flex items-center">
                  <AlertCircle className="mr-2 text-red-500" size={20} />
                  <span className="text-sm text-red-500">Rejected (Score: {credit.score})</span>
                </div>
              )
            ) : credit.req_status === 3 ? (
              <button
                onClick={() => openModal(credit)}
                className="py-1 px-3 ml-2 text-white rounded hover:opacity-90"
                style={{ backgroundColor: "#415e02" }}
              >
                {pendingTx === credit.id ? (
                  <span className='flex items-center'>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : 'Expire Credit'}
              </button>
            ) : (
              // Default case
              <button
                onClick={() => openModal(credit)}
                className="py-1 px-3 ml-2 text-white rounded hover:opacity-90"
                style={{ backgroundColor: "#415e02" }}
              >
                {pendingTx === credit.id ? (
                  <span className='flex items-center'>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : 'Expire Credit'}
              </button>
            )}
          </>
        )}
        
        {credit.is_expired && (
          <span className='text-emerald-900 flex items-center'>
            <CheckCircle className="mr-1" size={16} />
            Expired!
          </span>
        )}
      </li>
    );
  };

  // Section header with counter and toggle capability
  const SectionHeader = ({ title, count, isExpanded, sectionKey, color }) => (
    <div 
      className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer border-t border-gray-200 first:border-t-0"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex items-center">
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span className="font-medium ml-1" style={{ color }}>{title}</span>
      </div>
      <span className="bg-gray-200 px-2 py-1 rounded-full text-xs">{count}</span>
    </div>
  );

  // Render section
  const renderSection = (title, credits, sectionKey, color) => {
    if (!credits || credits.length === 0) return null;
    
    return (
      <div className="mb-2 border border-gray-200 rounded-md overflow-hidden">
        <SectionHeader 
          title={title} 
          count={credits.length} 
          isExpanded={expandedSections[sectionKey]}
          sectionKey={sectionKey}
          color={color}
        />
        {expandedSections[sectionKey] && (
          <ul className="divide-y divide-gray-200">
            {credits.map(credit => renderCreditItem(credit))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="py-5 px-4 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-gray-500">My Credits</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        {isLoading ? (
          <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
            <LoadingCredit key="loading-1" />
            <LoadingCredit key="loading-2" />
            <LoadingCredit key="loading-3" />
          </ul>
        ) : credits && credits.length > 0 ? (
          <div>
            {renderSection("Pending Requests", categorizedCredits.pending, "pending", "#FBBF24")}
            {renderSection("Accepted Requests", categorizedCredits.accepted, "accepted", "#10B981")}
            {renderSection("Rejected Requests", categorizedCredits.rejected, "rejected", "#EF4444")}
            {renderSection("For Sale", categorizedCredits.forSale, "forSale", "#3B82F6")}
            {renderSection("Expired Credits", categorizedCredits.expired, "expired", "#415e02")}
          </div>
        ) : (
          <div className="rounded-md border border-gray-200 p-4 text-center text-gray-500">
            No credits available
          </div>
        )}
      </dd>
      
      {modalVisible && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-gray-800 bg-opacity-75">
          <div className="p-6 w-full max-w-md bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Expire Credit</h3>
            <div className="space-y-4">
              <input
                type="text"
                name="creditName"
                placeholder="Credit Name"
                className="p-2 w-full rounded border"
                value={expirationData.creditName}
                onChange={handleModalInputChange}
              />
              <input
                type="number"
                name="amountReduced"
                placeholder="Amount Reduced"
                className="p-2 w-full rounded border"
                value={expirationData.amountReduced}
                onChange={handleModalInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Your Password"
                className="p-2 w-full rounded border"
                value={expirationData.password}
                onChange={handleModalInputChange}
              />
              <br /><br /><br />
              <p className="mt-1 text-sm text-black-500">Add a document proof of expiration for Audit:</p>
              <input
                type="file"
                name="pdfFile"
                accept="application/pdf"
                className="p-2 w-full rounded border"
                onChange={handleFileChange}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="py-2 px-4 text-white bg-gray-500 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="py-2 px-4 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCreditsList;