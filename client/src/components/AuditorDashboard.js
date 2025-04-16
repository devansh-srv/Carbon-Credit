import React, { useState, useEffect, useContext } from 'react';
import { getAssignedCredits, auditCreditApi } from '../api/api';
import { CC_Context } from "../context/SmartContractConnector.js";
import Swal from 'sweetalert2';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  FileText, 
  AlertTriangle,
  CheckSquare,
  ExternalLink,
  X
} from 'lucide-react';

const LoadingCredit = () => (
  <li className="flex justify-between items-center py-4 pr-4 pl-3 text-sm animate-pulse">
    <div className="flex-1">
      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
    </div>
    <div className="w-40">
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  </li>
);

const AuditorDashboard = () => {
  const [AssignedCredits, setAssignedCredits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditCreditId, setAuditCreditId] = useState(null);
  const [auditReason, setAuditReason] = useState("");

  const { auditCredit } = useContext(CC_Context);

  useEffect(() => {
    const fetchAllCredits = async () => {
      try {
        setIsLoading(true);
        const assignedResponse = await getAssignedCredits();
        setAssignedCredits(assignedResponse.data);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
        setError('Failed to fetch credits. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllCredits();
  }, []);

  const handleAuditError = () => {
    Swal.fire({
            icon: 'error',
            title: 'Audit Rejected',
            html: 'Possible Reasons:<br><br>1. Check MetaMask account<br>2. You are the owner<br>3. Credit already audited'
          });
  }

  const handleAudit = (creditId) => {
    setAuditReason("");
    setAuditCreditId(creditId === auditCreditId ? null : creditId);
  };

  const handleAcceptCredit = async (creditId) => {
    try {
      console.log("Accepting credit id:", creditId);
      await auditCredit(creditId, true);
      
      console.log("sending to backend");
      const auditData = {creditId: creditId, vote: true };
      const response = await auditCreditApi(auditData);
      console.log("backend audit response: ",response);

      setAuditCreditId(null);
      setAssignedCredits((prevCredits) => prevCredits.filter((credit) => credit.id !== creditId));
      
    } catch (error) {
      console.error("Error in audit:", error);
      handleAuditError();
      // throw error;
    }
  };

  const handleRejectCredit = async (creditId) => {
    try {
      console.log("Rejecting credit id:", creditId);
      await auditCredit(creditId, false);

      console.log("sending to backend");
      const auditData = {creditId: creditId, vote: false };
      const response = await auditCreditApi(auditData);
      console.log("backend audit response: ",response);

      setAuditCreditId(null);
      setAssignedCredits((prevCredits) => prevCredits.filter((credit) => credit.id !== creditId));
    } catch (error) {
      console.error("Error in audit:", error);
      handleAuditError();
      // throw error;
      
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg rounded-lg overflow-hidden">
      <div className="py-6 px-6 bg-white border-b border-green-100">
        <div className="flex items-center">
          <Shield className="text-emerald-500 h-6 w-6 mr-3" />
          <div>
            <h3 className="text-xl font-medium text-gray-800">Auditor Dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">Review and audit credits assigned to you</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="py-4 px-6 flex items-center text-red-700 bg-red-50 border-b border-red-100">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="px-6 py-6">
        <div className="mb-3 flex items-center">
          <FileText className="text-emerald-500 h-5 w-5 mr-2" />
          <h4 className="text-md font-medium text-emerald-700">Assigned Credits</h4>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {isLoading ? (
              <>
                <LoadingCredit />
                <LoadingCredit />
                <LoadingCredit />
              </>
            ) : AssignedCredits.length === 0 ? (
              <li className="py-6 px-4 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <CheckSquare className="h-12 w-12 text-green-300 mb-2" />
                  <p>No credits assigned for auditing</p>
                </div>
              </li>
            ) : (
              AssignedCredits.map((credit) => (
                <li key={credit.id} className="px-4 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-2">
                        <FileText className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="ml-3">
                        <h5 className="text-sm font-medium text-gray-900">{credit.name}</h5>
                        <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                          <span className="flex items-center">
                            <span className="font-medium">Amount:</span>&nbsp;{credit.amount}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="flex items-center">
                            <span className="font-medium">Price:</span>&nbsp;{credit.price} ETH
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {credit.secure_url && (
                        <button
                          type='button'
                          onClick={() => window.open(credit.secure_url, '_blank')}
                          className="py-2 px-3 text-sm text-emerald-700 bg-green-100 rounded-md hover:bg-cyan-200 inline-flex items-center transition-colors duration-200">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Documents
                        </button>
                      )}
                      
                      {auditCreditId !== credit.id && (
                        <button
                          onClick={() => handleAudit(credit.id)}
                          className="py-2 px-4 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors duration-200"
                        >
                          Audit
                        </button>
                      )}
                    </div>
                  </div>

                  {auditCreditId === credit.id && (
                    <div className="mt-4 p-5 border border-cyan-200 rounded-lg bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center">
                          <Shield className="h-4 w-4 text-emerald-500 mr-2" />
                          Audit Decision
                        </h4>
                        <button 
                          onClick={() => setAuditCreditId(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        placeholder="Enter reason for your audit decision"
                        rows="3"
                        value={auditReason}
                        onChange={(e) => setAuditReason(e.target.value)}
                      ></textarea>
                      
                      <div className="mt-4 flex gap-3 pl-[50%]">
                        <button 
                          className="flex-1 py-2 inline-flex justify-center items-center bg-green-400 text-white rounded-md hover:bg-green-500 transition-colors duration-200"
                          onClick={() => handleAcceptCredit(credit.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </button>
                        <button 
                          className="flex-1 py-2 inline-flex justify-center items-center bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors duration-200"
                          onClick={() => handleRejectCredit(credit.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuditorDashboard;