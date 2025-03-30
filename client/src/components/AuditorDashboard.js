import React, { useState, useEffect, useContext } from 'react';
import { getAssignedCredits } from '../api/api';
import { CC_Context } from "../context/SmartContractConnector.js";

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

  const handleAudit = (creditId) => {
    setAuditCreditId(creditId === auditCreditId ? null : creditId);
  };

  const handleAcceptCredit = async (creditId) => {
    try {
      console.log("Accepting credit id:", creditId);
      await auditCredit(creditId, true);
      setAuditCreditId(null);
    } catch (error) {
      console.error("Error in audit:", error);
      throw error;
    }
  };

  const handleRejectCredit = async (creditId) => {
    try {
      console.log("Rejecting credit id:", creditId);
      await auditCredit(creditId, false);
      setAuditCreditId(null);
    } catch (error) {
      console.error("Error in audit:", error);
      throw error;
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
                      {credit.secure_url && (
                        <button
                          type='button'
                          onClick={() => window.open(credit.secure_url, '_blank')}
                          className="py-2 px-4 mr-4 font-sans text-white bg-blue-500 rounded hover:bg-blue-800">
                          View Project Documents
                        </button>
                      )}
                      {auditCreditId !== credit.id && (
                        <button
                          onClick={() => handleAudit(credit.id)}
                          className="btn btn-secondary"
                        >
                          Audit
                        </button>
                      )}
                    </div>

                    {auditCreditId === credit.id && (
                      <div className="mt-3 p-4 border rounded bg-white shadow">
                        <h4 className="text-sm font-medium text-gray-900">Audit Credit</h4>
                        <textarea
                          className="w-full p-2 mt-2 border rounded"
                          placeholder="Enter reason for audit"
                          value={auditReason}
                          onChange={(e) => setAuditReason(e.target.value)}
                        ></textarea>
                        <div className="mt-3 flex gap-2">
                          <button 
                            className="py-2 px-4 bg-green-500 text-white rounded hover:bg-green-400"
                            onClick={() => handleAcceptCredit(credit.id)}
                          >
                            Accept Credit
                          </button>
                          <button 
                            className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-400"
                            onClick={() => handleRejectCredit(credit.id)}
                          >
                            Reject Credit
                          </button>
                          <button
                            className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-400"
                            onClick={() => setAuditCreditId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
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
