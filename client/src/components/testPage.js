import React, { useContext, useState } from "react";
import { CC_Context } from "../context/SmartContractConnector.js";
import { ethers } from "ethers";

const TestPage = () => {
  const { 
    connectWallet, 
    generateCredit, 
    getCreditDetails,
    sellCredit,
    buyCredit,
    expireCredit,
    currentAccount, 
    error 
  } = useContext(CC_Context);
  
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [creditId, setCreditId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleCreditId, setSaleCreditId] = useState("");
  const [buyCreditId, setBuyCreditId] = useState("");
  const [expireCreditId, setExpireCreditId] = useState("");
  const [creditDetails, setCreditDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");

  const handleGenerateCredit = async () => {
    if (!amount || !price) {
      alert("Please fill in both fields!");
      return;
    }
    try {
      setLoading(true);
      setTransactionStatus("Initiating credit generation...");
      await generateCredit(amount, price);
      setTransactionStatus("Credit generated successfully!");
      setAmount("");
      setPrice("");
    } catch (error) {
      console.error("Error generating credit:", error);
      setTransactionStatus(`Failed to generate credit: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setTransactionStatus(""), 5000);
    }
  };

  const handleGetCreditDetails = async () => {
    if (!creditId) {
      alert("Please enter a credit ID!");
      return;
    }
    try {
      setLoading(true);
      const details = await getCreditDetails(creditId);
      console.log(details);
      setCreditDetails(details);
      setTransactionStatus("Credit details retrieved successfully!");
    } catch (error) {
      console.error("Error fetching credit details:", error);
      setTransactionStatus(`Failed to fetch credit details: ${error.message}`);
      setCreditDetails(null);
    } finally {
      setLoading(false);
      setTimeout(() => setTransactionStatus(""), 5000);
    }
  };

  const handleSellCredit = async () => {
    if(!saleCreditId){
        alert("please enter Credit ID!");
        return;
    }

    // const details = await getCreditDetails(saleCreditId);
    // if(details.owner.toLowerCase() !== currentAccount){
    //     alert("Only owners can sell... You stupid bastard!")
    //     return;
    // }

    try{
        console.log("here my nigga! ")
        setLoading(true);
        setTransactionStatus("Initializing sale listing...");
        
        // First get the credit details
        const details = await getCreditDetails(saleCreditId);
        
        // Compare normalized addresses
        if(details.owner.toLowerCase() !== currentAccount.toLowerCase()) {
            alert("Only owners can sell credits... You Bastard!");
            return;
        }

        // Convert the price from wei to ether for display and use
        const priceInEther = ethers.formatEther(details.price);
        
        // Use the original price from the credit details
        setSalePrice(details.price)
        await sellCredit(saleCreditId, details.price);
        
        setTransactionStatus("Credit listed for sale successfully!");
        setSaleCreditId("");
        setSalePrice("");

        if (saleCreditId === creditId) {
            await handleGetCreditDetails();
        }
    }catch(error){
        console.error("Error listing credit for sale:", error);
        setTransactionStatus(`Failed to list credit for sale: ${error.message}`);
    }finally{
        setLoading(false);
        setTimeout(() => setTransactionStatus(""), 5000);
    }

  }

  const handleBuyCredit = async () => {
    if (!buyCreditId) {
      alert("Please enter a Credit ID!");
      return;
    }

    try {
      setLoading(true);
      setTransactionStatus("Initiating credit purchase...");

      // Get credit details first to check if it's for sale and get the price
      const details = await getCreditDetails(buyCreditId);

      if (!details.forSale) {
        alert("This credit is not for sale!");
        return;
      }

      if (details.owner.toLowerCase() === currentAccount.toLowerCase()) {
        alert("You cannot buy your own credit!");
        return;
      }

      // Convert the price from wei to ether for the transaction
      const priceInEther = ethers.formatEther(details.price);
      
      await buyCredit(buyCreditId, priceInEther);
      
      setTransactionStatus("Credit purchased successfully!");
      setBuyCreditId("");

      // Refresh credit details if the purchased credit is currently being viewed
      if (buyCreditId === creditId) {
        await handleGetCreditDetails();
      }
    } catch (error) {
      console.error("Error buying credit:", error);
      setTransactionStatus(`Failed to buy credit: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setTransactionStatus(""), 5000);
    }
  };


  const handleExpireCredit = async () => {
    if (!expireCreditId) {
      alert("Please enter a Credit ID to expire!");
      return;
    }

    try {
      setLoading(true);
      setTransactionStatus("Initiating credit expiration...");

      // Get credit details first to verify ownership
      const details = await getCreditDetails(expireCreditId);

      if (details.owner.toLowerCase() !== currentAccount.toLowerCase()) {
        alert("Only the credit creator can expire this credit!");
        return;
      }

      await expireCredit(expireCreditId);
      
      setTransactionStatus("Credit expired successfully!");
      setExpireCreditId("");

      // Refresh credit details if the expired credit is currently being viewed
      if (expireCreditId === creditId) {
        await handleGetCreditDetails();
      }
    } catch (error) {
      console.error("Error expiring credit:", error);
      setTransactionStatus(`Failed to expire credit: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setTransactionStatus(""), 5000);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>Carbon Credit DApp</h1>

      {/* Status Message */}
      {transactionStatus && (
        <div style={{ 
          padding: "10px", 
          margin: "10px 0", 
          borderRadius: "5px",
          backgroundColor: transactionStatus.includes("Failed") ? "#ffebee" : "#e8f5e9",
          color: transactionStatus.includes("Failed") ? "#c62828" : "#2e7d32",
          textAlign: "center"
        }}>
          {transactionStatus}
        </div>
      )}

      {/* Wallet Connection */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {!currentAccount ? (
          <>
            <p>Connect your wallet to get started:</p>
            <button
              onClick={connectWallet}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginBottom: "10px"
              }}
            >
              Connect Wallet
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </>
        ) : (
          <p style={{ 
            padding: "10px", 
            backgroundColor: "#f0f0f0", 
            borderRadius: "5px",
            wordBreak: "break-all" 
          }}>
            Wallet Connected: {currentAccount}
          </p>
        )}
      </div>

      {currentAccount && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "10px"
        }}>
          {/* Generate Credit Section */}
          <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px" }}>
            <h2 style={{ textAlign: "center" }}>Generate Credit</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="number"
                placeholder="Amount (in tons)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <input
                type="number"
                placeholder="Price (in ETH)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <button
                onClick={handleGenerateCredit}
                disabled={loading}
                style={{
                  padding: "10px",
                  backgroundColor: "#0c874e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Processing..." : "Generate Credit"}
              </button>
            </div>
          </div>

          {/* Sell Credit Section */}
          <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px" }}>
            <h2 style={{ textAlign: "center" }}>Sell Credit</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="number"
                placeholder="Credit ID"
                value={saleCreditId}
                onChange={(e) => setSaleCreditId(e.target.value)}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <button
                onClick={handleSellCredit}
                disabled={loading}
                style={{
                  padding: "10px",
                  backgroundColor: "#008CBA",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Processing..." : "List for Sale"}
              </button>
            </div>
          </div>

          {/* Buy Credit Section */}
          <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px" }}>
            <h2 style={{ textAlign: "center" }}>Buy Credit</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="number"
                placeholder="Credit ID to Buy"
                value={buyCreditId}
                onChange={(e) => setBuyCreditId(e.target.value)}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <button
                onClick={handleBuyCredit}
                disabled={loading}
                style={{
                  padding: "10px",
                  backgroundColor: "#eb345e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Processing..." : "Buy Credit"}
              </button>
            </div>
          </div>

          {/* Get Credit Details Section */}
          <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px" }}>
            <h2 style={{ textAlign: "center" }}>Credit Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="number"
                placeholder="Enter Credit ID"
                value={creditId}
                onChange={(e) => setCreditId(e.target.value)}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <button
                onClick={handleGetCreditDetails}
                disabled={loading}
                style={{
                  padding: "10px",
                  backgroundColor: "#008CBA",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Loading..." : "Get Details"}
              </button>

              {/* Display Credit Details */}
              {creditDetails && (
                <div style={{ 
                  marginTop: "20px", 
                  padding: "15px", 
                  backgroundColor: "#f5f5f5", 
                  borderRadius: "5px" 
                }}>
                  <h3 style={{ marginTop: "0" }}>Credit Information:</h3>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <p style={{ margin: "0" }}>
                      <strong>Amount:</strong> {creditDetails.amount.toString()} tons
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>Owner:</strong> 
                      <span style={{ 
                        fontSize: "0.9em", 
                        wordBreak: "break-all" 
                      }}>
                        {creditDetails.owner}
                      </span>
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>Creator:</strong> 
                      <span style={{ 
                        fontSize: "0.9em", 
                        wordBreak: "break-all" 
                      }}>
                        {creditDetails.creator}
                      </span>
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>Price:</strong> {ethers.formatEther(creditDetails.price)} ETH
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>Status:</strong> {creditDetails.expired ? "Expired" : "Active"}
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>For Sale:</strong> {creditDetails.forSale ? "Yes" : "No"}
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>Request status:</strong> {creditDetails.requestStatus.toString()}
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>num of auditors:</strong> {creditDetails.numOfAuditors.toString()}
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>audit fees:</strong> {creditDetails.auditFees.toString()}
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>audit Score:</strong> {creditDetails.auditScore.toString()}
                    </p>
                    <p style={{ margin: "0" }}>
                      <strong>auditors List:</strong> {creditDetails.auditorsList}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px" }}>
            <h2 style={{ textAlign: "center" }}>Expire Credit</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="number"
                placeholder="Credit ID to Expire"
                value={expireCreditId}
                onChange={(e) => setExpireCreditId(e.target.value)}
                style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
              <button
                onClick={handleExpireCredit}
                disabled={loading}
                style={{
                  padding: "10px",
                  backgroundColor: "#FF6347", // Tomato red to indicate expiration
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Processing..." : "Expire Credit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;