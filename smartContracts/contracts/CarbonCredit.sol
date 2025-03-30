// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonCredit {

    struct Credit {
        uint256 amount; // Amount of carbon offset (e.g., in tons)
        address creator;    //NGO that created the credit
        address owner;  // Current owner of the credit
        bool expired;   // Expiry timestamp
        uint256 price;  // Price in wei (for selling)
        bool forSale;   // Is the credit available for sale?
        uint8 requestStatus;
        uint numOfAuditors;
        uint auditFees;
        int auditScore;
        address[] auditorsList;
        mapping(address => bool) AuditInfo;
    }

    error CreditNotForSale();
    error PriceNotMet();
    error OnlyOwnerCanSell();
    error OnlyOwnerCanRemove();
    error CreditDoesntExist();
    error OnlyCreatorCanExpire();
    error MinAuditFees();
    error CreditNotAudited();
    error AlreadyAudited();
    error AuditRequestedAlready();
    error CreatorCantAudit();
    error FeeTransactionFailed();
    error CreditFailedAudit();

    mapping(uint256 => Credit) public credits;
    uint256 nextCreditId;

    // Generate a new carbon credit
    function generateCredit(uint256 amount, uint256 price) external {
        Credit storage newCredit = credits[nextCreditId]; 
        newCredit.amount = amount;
        newCredit.creator = msg.sender;
        newCredit.owner = msg.sender;
        newCredit.price = price;
        // newCredit.forSale = false; //by default false
        newCredit.numOfAuditors = (amount/500)*2 + 3;
        
        
        nextCreditId++;
    }

    // Buy a carbon credit listed for sale
    function buyCredit(uint256 creditId) external payable {
        Credit storage credit = credits[creditId];
        if( credit.forSale == false){
            revert CreditNotForSale();
        }

        
        if( msg.value != credit.price){
            revert PriceNotMet();
        }

        uint256 creator_share = (msg.value * 10)/100;
        uint256 owner_share = msg.value - creator_share;

        
        payable (credit.creator).transfer(creator_share);
        
        payable(credit.owner).transfer(owner_share);

        // Transfer ownership to the buyer
        credit.owner = msg.sender;
        credit.forSale = false;  
    }

    // List a carbon credit for sale
    function sellCredit(uint256 creditId, uint256 price) external {
        Credit storage credit = credits[creditId];

        if (credit.owner == address(0)) {
            revert CreditDoesntExist();
        }

        if(msg.sender != credit.owner){
            revert OnlyOwnerCanSell();
        }
        if(credits[creditId].requestStatus != 2){
            revert CreditNotAudited();
        }
        if(credits[creditId].auditScore<=0){
            revert CreditFailedAudit();
        }

        credit.price = price;
        credit.forSale = true;
    }

    // Remove a credit from sale
    function removeFromSale(uint256 creditId) external {
        Credit storage credit = credits[creditId];
        
        if(msg.sender != credit.owner){
            revert OnlyOwnerCanRemove();
        }

        credit.forSale = false;
    }

    // Check if the credit has expired
    function isExpired(uint256 creditId) external view returns (bool) {
        return credits[creditId].expired;
    }

    // Exprire the credits (can only be done by creator)
    function Expire(uint256 creditId) external{
        if(msg.sender != credits[creditId].creator){
            revert OnlyCreatorCanExpire();
        }
        credits[creditId].expired = true;
    }

    // Get the owner of a credit
    function getOwner(uint256 creditId) external view returns (address) {
        return credits[creditId].owner;
    }

    function getCreator(uint256 creditId) external view returns (address) {
        return credits[creditId].creator;
    }

    
    function getNextCreditId() external view returns (uint256) {
        return nextCreditId;
    }

    function getPrice(uint256 creditId) external view returns (uint256) {
        return credits[creditId].price;
    }

    function requestAudit(uint256 creditId) external payable {
        if(credits[creditId].requestStatus != 0){revert AuditRequestedAlready();}
        if(msg.value<(1e14*credits[creditId].amount)){revert MinAuditFees();}

        credits[creditId].requestStatus = 1;
        credits[creditId].auditFees = msg.value;
    }

    function auditCredit(uint256 creditId, bool vote) external {
        Credit storage credit = credits[creditId];

        if(msg.sender == credit.creator){
            revert CreatorCantAudit(); 
        }
        if(credit.requestStatus != 1){
            revert AlreadyAudited();
        }
        for (uint i = 0; i < credit.auditorsList.length; i++) {
            if (credit.auditorsList[i] == msg.sender) {
                revert AlreadyAudited();
            }
        }
        credit.AuditInfo[msg.sender] = vote;
        credit.auditorsList.push(msg.sender);

        if(vote){
            credit.auditScore++;
        }
        else{
            credit.auditScore--;
        }

        if(credit.auditorsList.length == credit.numOfAuditors){
            credit.requestStatus = 2;
        }

        (bool txnStatus, ) = payable(msg.sender).call{value: (credit.auditFees/3)}("");

        if(!txnStatus){revert FeeTransactionFailed();}
    }

    function getAuditorVote(uint creditId, address auditor) external view returns(bool ){
        return credits[creditId].AuditInfo[auditor];
    }

    function getAuditorList(uint creditId) external view returns( address[] memory){
        return credits[creditId].auditorsList;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}